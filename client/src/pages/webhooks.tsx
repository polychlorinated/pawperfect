import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icons";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertCircle, 
  ArrowDownToLine, 
  Bell, 
  Check, 
  Clock, 
  Copy, 
  ExternalLink, 
  Lock, 
  Plus, 
  RefreshCcw, 
  Trash, 
  X 
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { WebhookEventType } from "@/lib/types";

// Define Webhook interface
interface Webhook {
  id: number;
  url: string;
  secret: string;
  eventTypes: string[];
  isActive: boolean;
  description: string;
  createdAt: string;
}

// Define webhook categories
const webhookCategories = {
  booking: [
    WebhookEventType.BOOKING_CREATED,
    WebhookEventType.BOOKING_UPDATED,
    WebhookEventType.BOOKING_CANCELLED,
    WebhookEventType.BOOKING_COMPLETED,
  ],
  pet: [
    WebhookEventType.PET_CREATED,
    WebhookEventType.PET_UPDATED,
  ],
  owner: [
    WebhookEventType.OWNER_CREATED,
    WebhookEventType.OWNER_UPDATED,
  ],
  system: [
    WebhookEventType.AVAILABILITY_UPDATED,
    WebhookEventType.SERVICE_UPDATED,
  ]
};

export default function WebhooksPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: [] as string[],
    secret: "",
  });
  
  // Fetch all webhooks
  const { data: webhooksData, isLoading: isLoadingWebhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ['/api/webhooks'],
    retry: false,
  });

  // Fetch all webhook event types
  const { data: eventTypesData, isLoading: isLoadingEventTypes } = useQuery({
    queryKey: ['/api/webhooks/events/types'],
    retry: false,
  });

  // Create a new webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (webhookData: any) => {
      return apiRequest('POST', '/api/webhooks', webhookData);
    },
    onSuccess: () => {
      toast({
        title: "Webhook created",
        description: "The webhook has been created successfully.",
      });
      setIsAddDialogOpen(false);
      setNewWebhook({
        url: "",
        events: [],
        secret: "",
      });
      refetchWebhooks();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create webhook",
      });
    },
  });

  // Delete a webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return apiRequest('DELETE', `/api/webhooks/${webhookId}`);
    },
    onSuccess: () => {
      toast({
        title: "Webhook deleted",
        description: "The webhook has been deleted successfully.",
      });
      refetchWebhooks();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete webhook",
      });
    },
  });

  // Test a webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return apiRequest('POST', `/api/webhooks/${webhookId}/test`);
    },
    onSuccess: () => {
      toast({
        title: "Webhook tested",
        description: "A test event has been sent to the webhook URL.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test webhook",
      });
    },
  });

  // Update a webhook (active status)
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ webhookId, isActive }: { webhookId: string, isActive: boolean }) => {
      return apiRequest('PATCH', `/api/webhooks/${webhookId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Webhook updated",
        description: "The webhook status has been updated successfully.",
      });
      refetchWebhooks();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update webhook",
      });
    },
  });

  // Handler for event selection
  const handleEventToggle = (eventType: string) => {
    setNewWebhook((prev) => {
      const events = [...prev.events];
      if (events.includes(eventType)) {
        return { ...prev, events: events.filter(e => e !== eventType) };
      } else {
        return { ...prev, events: [...events, eventType] };
      }
    });
  };

  // Handler for category selection (select all events in category)
  const handleCategoryToggle = (categoryEvents: string[]) => {
    setNewWebhook((prev) => {
      const currentEvents = new Set(prev.events);
      const allIncluded = categoryEvents.every(event => currentEvents.has(event));
      
      if (allIncluded) {
        // Remove all events in this category
        const newEvents = prev.events.filter(e => !categoryEvents.includes(e));
        return { ...prev, events: newEvents };
      } else {
        // Add all events from this category that aren't already included
        const newEvents = [...prev.events];
        categoryEvents.forEach(event => {
          if (!currentEvents.has(event)) {
            newEvents.push(event);
          }
        });
        return { ...prev, events: newEvents };
      }
    });
  };

  // Create a new webhook
  const handleCreateWebhook = () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "URL and at least one event are required",
      });
      return;
    }

    createWebhookMutation.mutate({
      url: newWebhook.url,
      events: newWebhook.events,
      secret: newWebhook.secret || undefined,
    });
  };

  // Delete a webhook
  const handleDeleteWebhook = (webhookId: string) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      deleteWebhookMutation.mutate(webhookId);
    }
  };

  // Test a webhook
  const handleTestWebhook = (webhookId: string) => {
    testWebhookMutation.mutate(webhookId);
  };

  // Toggle webhook active status
  const handleToggleActive = (webhookId: string, currentActive: boolean) => {
    updateWebhookMutation.mutate({ webhookId, isActive: !currentActive });
  };

  // Generate a random secret
  const generateSecret = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const secret = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    setNewWebhook(prev => ({ ...prev, secret }));
  };

  // Copy webhook URL or secret to clipboard
  const copyToClipboard = (text: string, what: 'URL' | 'Secret') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${what} copied`,
      description: `The ${what.toLowerCase()} has been copied to clipboard.`,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get appropriate icon for event type
  const getEventIcon = (eventType: string) => {
    if (eventType.startsWith('booking')) return <Icons.calendar className="h-4 w-4 mr-1" />;
    if (eventType.startsWith('pet')) return <Icons.paw className="h-4 w-4 mr-1" />;
    if (eventType.startsWith('owner')) return <Icons.user className="h-4 w-4 mr-1" />;
    if (eventType.startsWith('availability')) return <Icons.clock className="h-4 w-4 mr-1" />;
    if (eventType.startsWith('service')) return <Icons.package className="h-4 w-4 mr-1" />;
    return <Icons.bell className="h-4 w-4 mr-1" />;
  };

  // Group event types by category for the UI
  const eventCategories = eventTypesData?.categories || {
    booking: [],
    pet: [],
    owner: [],
    system: []
  };

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Management</h1>
          <p className="text-muted-foreground">
            Set up webhooks to receive real-time notifications of events
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchWebhooks()}
            disabled={isLoadingWebhooks}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create a new webhook</DialogTitle>
                <DialogDescription>
                  Webhooks allow external applications to receive real-time notifications when events occur in the PawPerfect system.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://your-app.com/webhooks"
                    className="col-span-3"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="secret" className="text-right">
                    Secret
                    <span className="block text-xs text-muted-foreground">Optional</span>
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="secret"
                      placeholder="Webhook signing secret"
                      value={newWebhook.secret}
                      onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                      type="password"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={generateSecret}
                      title="Generate random secret"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="my-2" />
                
                <div className="grid grid-cols-4 gap-4">
                  <Label className="text-right pt-2">
                    Events
                    <span className="block text-xs text-muted-foreground">Select at least one</span>
                  </Label>
                  
                  <div className="col-span-3 space-y-5">
                    {isLoadingEventTypes ? (
                      <div className="flex items-center justify-center h-20">
                        <Icons.spinner className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Booking events */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="booking-category"
                              checked={eventCategories.booking?.every(e => newWebhook.events.includes(e))}
                              onCheckedChange={() => handleCategoryToggle(eventCategories.booking || [])}
                            />
                            <Label htmlFor="booking-category" className="font-semibold">Booking Events</Label>
                          </div>
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {eventCategories.booking?.map((eventType) => (
                              <div key={eventType} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={eventType}
                                  checked={newWebhook.events.includes(eventType)}
                                  onCheckedChange={() => handleEventToggle(eventType)}
                                />
                                <Label htmlFor={eventType} className="text-sm">{eventType}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pet events */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="pet-category"
                              checked={eventCategories.pet?.every(e => newWebhook.events.includes(e))}
                              onCheckedChange={() => handleCategoryToggle(eventCategories.pet || [])}
                            />
                            <Label htmlFor="pet-category" className="font-semibold">Pet Events</Label>
                          </div>
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {eventCategories.pet?.map((eventType) => (
                              <div key={eventType} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={eventType}
                                  checked={newWebhook.events.includes(eventType)}
                                  onCheckedChange={() => handleEventToggle(eventType)}
                                />
                                <Label htmlFor={eventType} className="text-sm">{eventType}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Owner events */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="owner-category"
                              checked={eventCategories.owner?.every(e => newWebhook.events.includes(e))}
                              onCheckedChange={() => handleCategoryToggle(eventCategories.owner || [])}
                            />
                            <Label htmlFor="owner-category" className="font-semibold">Owner Events</Label>
                          </div>
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {eventCategories.owner?.map((eventType) => (
                              <div key={eventType} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={eventType}
                                  checked={newWebhook.events.includes(eventType)}
                                  onCheckedChange={() => handleEventToggle(eventType)}
                                />
                                <Label htmlFor={eventType} className="text-sm">{eventType}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* System events */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="system-category"
                              checked={eventCategories.system?.every(e => newWebhook.events.includes(e))}
                              onCheckedChange={() => handleCategoryToggle(eventCategories.system || [])}
                            />
                            <Label htmlFor="system-category" className="font-semibold">System Events</Label>
                          </div>
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {eventCategories.system?.map((eventType) => (
                              <div key={eventType} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={eventType}
                                  checked={newWebhook.events.includes(eventType)}
                                  onCheckedChange={() => handleEventToggle(eventType)}
                                />
                                <Label htmlFor={eventType} className="text-sm">{eventType}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.url || newWebhook.events.length === 0 || createWebhookMutation.isPending}
                >
                  {createWebhookMutation.isPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Webhooks</CardTitle>
          <CardDescription>
            Manage your webhook integrations for real-time event notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWebhooks ? (
            <div className="flex justify-center py-10">
              <Icons.spinner className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : !webhooksData?.webhooks || webhooksData.webhooks.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">No webhooks configured</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Webhooks allow external applications to receive real-time notifications when events occur in your PawPerfect system.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first webhook
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>A list of your webhook endpoints</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooksData.webhooks.map((webhook: any) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={webhook.isActive} 
                          onCheckedChange={() => handleToggleActive(webhook.id, webhook.isActive)}
                        />
                        <Badge variant={webhook.isActive ? "success" : "destructive"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs truncate max-w-[200px]">{webhook.url}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(webhook.url, 'URL')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {webhook.secret && (
                          <Badge variant="outline" className="ml-1">
                            <Lock className="h-3 w-3 mr-1" />
                            Secured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {webhook.events.slice(0, 3).map((event: string) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {getEventIcon(event)}
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-xs">{formatDate(webhook.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.lastTriggered ? (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-xs">{formatDate(webhook.lastTriggered)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Never triggered</span>
                      )}
                      {webhook.lastFailure && (
                        <div className="flex items-center text-red-500 mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span className="text-xs">Last failure: {formatDate(webhook.lastFailure)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={!webhook.isActive || testWebhookMutation.isPending}
                        >
                          {testWebhookMutation.isPending ? (
                            <Icons.spinner className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ArrowDownToLine className="h-4 w-4 mr-1" />
                          )}
                          Test
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          disabled={deleteWebhookMutation.isPending}
                        >
                          {deleteWebhookMutation.isPending ? (
                            <Icons.spinner className="h-4 w-4" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Webhook Documentation</CardTitle>
          <CardDescription>
            Learn how to use webhooks with your PawPerfect system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">What are webhooks?</h3>
            <p className="text-muted-foreground">
              Webhooks are a way for your PawPerfect system to notify other applications when events occur. 
              When an event happens, we'll make an HTTP POST request to the URL you provided with details about the event.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Webhook payload</h3>
            <p className="text-muted-foreground mb-2">
              Each webhook request contains the following JSON payload:
            </p>
            <div className="bg-muted p-4 rounded-md font-mono text-xs">
              {`{
  "event": "booking.created",
  "timestamp": "2023-07-15T12:34:56.789Z",
  "data": {
    // Event-specific data
  }
}`}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Securing webhooks</h3>
            <p className="text-muted-foreground mb-2">
              When you provide a secret for your webhook, we'll include a signature in the <code>X-PawPerfect-Signature</code> header. 
              You can use this to verify that the webhook request came from your PawPerfect system.
            </p>
            <div className="bg-muted p-4 rounded-md font-mono text-xs">
              {`// Node.js example for validating webhook signatures
const crypto = require('crypto');

function isValidSignature(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature), 
    Buffer.from(signature)
  );
}`}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Handling webhook events</h3>
            <p className="text-muted-foreground mb-2">
              Your webhook endpoint should:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Respond with a 200 status code as quickly as possible</li>
              <li>Process events asynchronously if they require time-consuming operations</li>
              <li>Implement proper error handling and retries for reliability</li>
              <li>Validate the signature if you've set a webhook secret</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="ml-auto" asChild>
            <a href="/api-docs" target="_blank" rel="noopener noreferrer">
              View API Documentation
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}