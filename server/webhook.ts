import { Request, Response, Router } from "express";
import { log } from "./utils";
import crypto from "crypto";

// Webhook subscription interface
interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  createdAt: Date;
  lastTriggered?: Date;
  lastFailure?: Date;
  errorCount: number;
  isActive: boolean;
}

// Event types supported by the webhook system
export enum WebhookEventType {
  // Booking events
  BOOKING_CREATED = "booking.created",
  BOOKING_UPDATED = "booking.updated",
  BOOKING_CANCELLED = "booking.cancelled",
  BOOKING_COMPLETED = "booking.completed",
  
  // Pet events
  PET_CREATED = "pet.created",
  PET_UPDATED = "pet.updated",
  
  // Owner events
  OWNER_CREATED = "owner.created",
  OWNER_UPDATED = "owner.updated",
  
  // System events
  AVAILABILITY_UPDATED = "availability.updated",
  SERVICE_UPDATED = "service.updated"
}

// Webhook manager class
export class WebhookManager {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  
  constructor() {
    log("Webhook Manager initialized", "webhook");
  }
  
  // Create a new webhook subscription
  public createSubscription(url: string, events: string[], secret?: string): WebhookSubscription {
    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new Error("Invalid webhook URL");
    }
    
    // Validate events
    events.forEach(event => {
      if (!Object.values(WebhookEventType).includes(event as WebhookEventType)) {
        throw new Error(`Invalid event type: ${event}`);
      }
    });
    
    // Create subscription
    const id = crypto.randomUUID();
    const subscription: WebhookSubscription = {
      id,
      url,
      events,
      secret,
      createdAt: new Date(),
      errorCount: 0,
      isActive: true
    };
    
    this.subscriptions.set(id, subscription);
    log(`Created webhook subscription ${id} for ${url}`, "webhook");
    
    return subscription;
  }
  
  // Delete a webhook subscription
  public deleteSubscription(id: string): boolean {
    if (!this.subscriptions.has(id)) {
      return false;
    }
    
    this.subscriptions.delete(id);
    log(`Deleted webhook subscription ${id}`, "webhook");
    return true;
  }
  
  // Update a webhook subscription
  public updateSubscription(id: string, updates: Partial<Omit<WebhookSubscription, 'id' | 'createdAt'>>): WebhookSubscription | null {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return null;
    }
    
    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(id, updatedSubscription);
    log(`Updated webhook subscription ${id}`, "webhook");
    
    return updatedSubscription;
  }
  
  // Get all webhook subscriptions
  public getSubscriptions(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }
  
  // Get a specific webhook subscription
  public getSubscription(id: string): WebhookSubscription | undefined {
    return this.subscriptions.get(id);
  }
  
  // Trigger webhook for an event
  public async trigger(eventType: WebhookEventType, payload: any): Promise<void> {
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && sub.events.includes(eventType));
    
    if (matchingSubscriptions.length === 0) {
      log(`No active webhooks for event ${eventType}`, "webhook");
      return;
    }
    
    log(`Triggering ${matchingSubscriptions.length} webhooks for event ${eventType}`, "webhook");
    
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload
    };
    
    // Fire and forget all webhook requests
    matchingSubscriptions.forEach(async (subscription) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Add signature if secret is set
        if (subscription.secret) {
          const payloadString = JSON.stringify(webhookPayload);
          const signature = crypto
            .createHmac('sha256', subscription.secret)
            .update(payloadString)
            .digest('hex');
          
          headers['X-PawPerfect-Signature'] = signature;
        }
        
        // Send webhook request
        const response = await fetch(subscription.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload)
        });
        
        // Update subscription status
        const updatedSubscription = { 
          ...subscription,
          lastTriggered: new Date()
        };
        
        if (!response.ok) {
          updatedSubscription.errorCount += 1;
          updatedSubscription.lastFailure = new Date();
          log(`Webhook ${subscription.id} request failed: ${response.status} ${response.statusText}`, "webhook");
        } else {
          log(`Webhook ${subscription.id} triggered successfully`, "webhook");
        }
        
        this.subscriptions.set(subscription.id, updatedSubscription);
      } catch (error) {
        // Update subscription with error
        const updatedSubscription = { 
          ...subscription,
          lastTriggered: new Date(),
          lastFailure: new Date(),
          errorCount: subscription.errorCount + 1
        };
        
        this.subscriptions.set(subscription.id, updatedSubscription);
        log(`Webhook ${subscription.id} request error: ${error instanceof Error ? error.message : 'Unknown error'}`, "webhook");
      }
    });
  }
}

// Singleton instance
export const webhookManager = new WebhookManager();

// Create webhook router
export function createWebhookRouter(): Router {
  const router = Router();
  
  // Get all webhooks
  router.get("/", (req: Request, res: Response) => {
    const subscriptions = webhookManager.getSubscriptions();
    
    // Strip secrets from response
    const sanitizedSubscriptions = subscriptions.map(sub => {
      const { secret, ...rest } = sub;
      return rest;
    });
    
    res.json({ webhooks: sanitizedSubscriptions });
  });
  
  // Get a specific webhook
  router.get("/:id", (req: Request, res: Response) => {
    const subscription = webhookManager.getSubscription(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        error: {
          code: "webhook_not_found",
          message: "Webhook subscription not found"
        }
      });
    }
    
    // Strip secret from response
    const { secret, ...sanitizedSubscription } = subscription;
    
    res.json({ webhook: sanitizedSubscription });
  });
  
  // Create a new webhook
  router.post("/", (req: Request, res: Response) => {
    try {
      const { url, events, secret } = req.body;
      
      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          error: {
            code: "invalid_parameters",
            message: "url and events array are required"
          }
        });
      }
      
      const subscription = webhookManager.createSubscription(url, events, secret);
      
      // Strip secret from response
      const { secret: _, ...sanitizedSubscription } = subscription;
      
      res.status(201).json({ webhook: sanitizedSubscription });
    } catch (error) {
      res.status(400).json({
        error: {
          code: "webhook_creation_failed",
          message: error instanceof Error ? error.message : "Failed to create webhook"
        }
      });
    }
  });
  
  // Update a webhook
  router.patch("/:id", (req: Request, res: Response) => {
    try {
      const { url, events, secret, isActive } = req.body;
      const updates: Partial<Omit<WebhookSubscription, 'id' | 'createdAt'>> = {};
      
      if (url !== undefined) updates.url = url;
      if (events !== undefined) updates.events = events;
      if (secret !== undefined) updates.secret = secret;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const subscription = webhookManager.updateSubscription(req.params.id, updates);
      
      if (!subscription) {
        return res.status(404).json({
          error: {
            code: "webhook_not_found",
            message: "Webhook subscription not found"
          }
        });
      }
      
      // Strip secret from response
      const { secret: _, ...sanitizedSubscription } = subscription;
      
      res.json({ webhook: sanitizedSubscription });
    } catch (error) {
      res.status(400).json({
        error: {
          code: "webhook_update_failed",
          message: error instanceof Error ? error.message : "Failed to update webhook"
        }
      });
    }
  });
  
  // Delete a webhook
  router.delete("/:id", (req: Request, res: Response) => {
    const success = webhookManager.deleteSubscription(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        error: {
          code: "webhook_not_found",
          message: "Webhook subscription not found"
        }
      });
    }
    
    res.status(204).end();
  });
  
  // Test a webhook
  router.post("/:id/test", (req: Request, res: Response) => {
    const subscription = webhookManager.getSubscription(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        error: {
          code: "webhook_not_found",
          message: "Webhook subscription not found"
        }
      });
    }
    
    // Send a test event
    webhookManager.trigger(WebhookEventType.BOOKING_CREATED, {
      test: true,
      message: "This is a test webhook event",
      webhookId: subscription.id
    });
    
    res.json({ 
      success: true,
      message: "Test webhook triggered"
    });
  });
  
  // Get all supported event types
  router.get("/events/types", (req: Request, res: Response) => {
    res.json({
      events: Object.values(WebhookEventType),
      categories: {
        booking: [
          WebhookEventType.BOOKING_CREATED,
          WebhookEventType.BOOKING_UPDATED,
          WebhookEventType.BOOKING_CANCELLED,
          WebhookEventType.BOOKING_COMPLETED
        ],
        pet: [
          WebhookEventType.PET_CREATED,
          WebhookEventType.PET_UPDATED
        ],
        owner: [
          WebhookEventType.OWNER_CREATED,
          WebhookEventType.OWNER_UPDATED
        ],
        system: [
          WebhookEventType.AVAILABILITY_UPDATED,
          WebhookEventType.SERVICE_UPDATED
        ]
      }
    });
  });
  
  return router;
}