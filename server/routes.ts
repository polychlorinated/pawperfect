import type { Express, Request, Response as ExpressResponse, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPetSchema, 
  insertOwnerSchema, 
  insertBookingSchema,
  petFormSchema,
  ownerFormSchema
} from "../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { MCPServer, MessageType, ClientRole } from "./mcp";
import { setupAuth } from "./auth";
import { createMCPRouter } from "./model-context-protocol";
import { createWebhookRouter, webhookManager, WebhookEventType } from "./webhook";

// Extended Response interface for custom properties
interface Response extends ExpressResponse {
  _body?: any; // Add the _body property used in our middleware
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize MCP server
  const mcpServer = new MCPServer(httpServer);
  
  // API route to fetch pets for the currently logged-in user
  app.get("/api/user/pets", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has an ownerId
      if (!req.isAuthenticated() || !req.user?.ownerId) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated or not a pet owner" 
          } 
        });
      }
      
      const pets = await storage.getPetsByOwnerId(req.user.ownerId);
      res.json(pets);
    } catch (error) {
      console.error("Error fetching user's pets:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch pets data" 
        } 
      });
    }
  });
  
  // API route to find an owner by email address
  app.get("/api/owners/by-email/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ 
          error: { 
            code: "missing_parameter", 
            message: "Email parameter is required" 
          } 
        });
      }
      
      const owner = await storage.getOwnerByEmail(email);
      if (!owner) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner found with this email address" 
          } 
        });
      }
      
      // If the owner exists and the user is authenticated, we can optionally update
      // the user record to link them automatically
      if (req.isAuthenticated()) {
        const user = req.user as any;
        // Only link if user doesn't already have an ownerId
        if (user && !user.ownerId) {
          try {
            const updatedUser = await storage.updateUser(user.id, { ownerId: owner.id });
            if (updatedUser) {
              // Update the session user object with the new ownerId
              Object.assign(req.user, { ownerId: owner.id });
            }
          } catch (error) {
            console.error("Error updating user with owner ID:", error);
            // Continue anyway, as we found the owner - the user linking is a bonus
          }
        }
      }
      
      res.status(200).json(owner);
    } catch (error) {
      console.error("Error finding owner by email:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Error finding owner by email" 
        } 
      });
    }
  });
  
  // API route to update owner details (for the logged-in user)
  app.patch("/api/user/owner", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const user = req.user as any;
      
      // Check if we're trying to link a user to an owner profile by setting ownerId
      if (req.body.ownerId) {
        // Validate that the owner exists
        const ownerToLink = await storage.getOwner(req.body.ownerId);
        if (!ownerToLink) {
          return res.status(404).json({ 
            error: { 
              code: "owner_not_found", 
              message: "The owner profile you're trying to link to doesn't exist" 
            } 
          });
        }
        
        // Update the user's ownerId
        const updatedUser = await storage.updateUser(user.id, { ownerId: req.body.ownerId });
        if (!updatedUser) {
          return res.status(500).json({ 
            error: { 
              code: "update_failed", 
              message: "Failed to link user to owner profile" 
            } 
          });
        }
        
        // Update the session user object with the new ownerId
        Object.assign(req.user, { ownerId: req.body.ownerId });
        
        // Return the owner data that we've linked to
        return res.status(200).json(ownerToLink);
      }
      
      // If we're not linking a user to an owner, we must be updating an existing owner profile
      if (!user.ownerId) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner profile found for this user" 
          } 
        });
      }
      
      // Validate the update data
      const updateData = req.body;
      try {
        ownerFormSchema.partial().parse(updateData);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            error: {
              code: "invalid_owner_data",
              message: validationError.message
            }
          });
        }
      }
      
      // Update the owner record
      const updatedOwner = await storage.updateOwner(user.ownerId, updateData);
      if (!updatedOwner) {
        return res.status(404).json({ 
          error: { 
            code: "update_failed", 
            message: "Failed to update owner details" 
          } 
        });
      }
      
      res.status(200).json(updatedOwner);
    } catch (error) {
      console.error("Error updating owner details:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to update owner details" 
        } 
      });
    }
  });
  
  // API route to get all bookings for the logged-in user
  app.get("/api/user/bookings", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has an ownerId
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const user = req.user as any;
      if (!user.ownerId) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner profile found for this user" 
          } 
        });
      }
      
      // Get the owner's bookings
      const bookings = await storage.getBookingsByOwnerId(user.ownerId);
      
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch user bookings" 
        } 
      });
    }
  });
  
  // API route to get all pets for the logged-in user
  app.get("/api/user/pets", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has an ownerId
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const user = req.user as any;
      if (!user.ownerId) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner profile found for this user" 
          } 
        });
      }
      
      // Get the owner's pets
      const pets = await storage.getPetsByOwnerId(user.ownerId);
      
      res.status(200).json(pets);
    } catch (error) {
      console.error("Error fetching user pets:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch user pets" 
        } 
      });
    }
  });
  
  // API route to get owner details for the logged-in user
  app.get("/api/user/owner", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has an ownerId
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const user = req.user as any;
      if (!user.ownerId) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner profile found for this user" 
          } 
        });
      }
      
      // Get the owner record
      const owner = await storage.getOwner(user.ownerId);
      if (!owner) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "Owner details not found" 
          } 
        });
      }
      
      res.status(200).json(owner);
    } catch (error) {
      console.error("Error fetching owner details:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch owner details" 
        } 
      });
    }
  });
  
  // API route to update a pet
  app.patch("/api/pets/:petId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const user = req.user as any;
      if (!user.ownerId) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner profile found for this user" 
          } 
        });
      }
      
      const petId = parseInt(req.params.petId);
      if (isNaN(petId)) {
        return res.status(400).json({ 
          error: { 
            code: "invalid_pet_id", 
            message: "Invalid pet ID" 
          } 
        });
      }
      
      // Verify the pet exists and belongs to this owner
      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ 
          error: { 
            code: "pet_not_found", 
            message: "Pet not found" 
          } 
        });
      }
      
      if (pet.ownerId !== user.ownerId) {
        return res.status(403).json({ 
          error: { 
            code: "forbidden", 
            message: "You don't have permission to update this pet" 
          } 
        });
      }
      
      // Validate the update data
      const updateData = req.body;
      try {
        petFormSchema.partial().parse(updateData);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            error: {
              code: "invalid_pet_data",
              message: validationError.message
            }
          });
        }
      }
      
      // Update the pet
      const updatedPet = await storage.updatePet(petId, updateData);
      if (!updatedPet) {
        return res.status(500).json({ 
          error: { 
            code: "update_failed", 
            message: "Failed to update pet" 
          } 
        });
      }
      
      res.status(200).json(updatedPet);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to update pet" 
        } 
      });
    }
  });
  
  // API route to add a new pet
  // API route to get an owner by ID
  app.get("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ 
          error: { 
            code: "invalid_parameter", 
            message: "Valid owner ID is required" 
          } 
        });
      }
      
      const ownerId = Number(id);
      
      // Check permission - users can only access their own data unless they're admin
      if (req.isAuthenticated()) {
        const user = req.user;
        if (!user.isAdmin && user.ownerId !== ownerId) {
          return res.status(403).json({ 
            error: { 
              code: "forbidden", 
              message: "You do not have permission to access this owner's data" 
            } 
          });
        }
      } else {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Authentication required" 
          } 
        });
      }
      
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "Owner not found" 
          } 
        });
      }
      
      res.json(owner);
    } catch (error) {
      console.error("Error fetching owner:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch owner data" 
        } 
      });
    }
  });
  
  // API route to get all pets for an owner
  app.get("/api/owners/:id/pets", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ 
          error: { 
            code: "invalid_parameter", 
            message: "Valid owner ID is required" 
          } 
        });
      }
      
      const ownerId = Number(id);
      
      // Check permission - users can only access their own data unless they're admin
      if (req.isAuthenticated()) {
        const user = req.user;
        if (!user.isAdmin && user.ownerId !== ownerId) {
          return res.status(403).json({ 
            error: { 
              code: "forbidden", 
              message: "You do not have permission to access this owner's pet data" 
            } 
          });
        }
      } else {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Authentication required" 
          } 
        });
      }
      
      const pets = await storage.getPetsByOwnerId(ownerId);
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets for owner:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch pet data" 
        } 
      });
    }
  });
  
  // API route to get all bookings for an owner
  app.get("/api/owners/:id/bookings", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ 
          error: { 
            code: "invalid_parameter", 
            message: "Valid owner ID is required" 
          } 
        });
      }
      
      const ownerId = Number(id);
      
      // Check permission - users can only access their own data unless they're admin
      if (req.isAuthenticated()) {
        const user = req.user;
        if (!user.isAdmin && user.ownerId !== ownerId) {
          return res.status(403).json({ 
            error: { 
              code: "forbidden", 
              message: "You do not have permission to access this owner's booking data" 
            } 
          });
        }
      } else {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Authentication required" 
          } 
        });
      }
      
      const bookings = await storage.getBookingsByOwnerId(ownerId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings for owner:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch booking data" 
        } 
      });
    }
  });
  
  app.post("/api/user/pets", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const user = req.user as any;
      if (!user.ownerId) {
        return res.status(404).json({ 
          error: { 
            code: "owner_not_found", 
            message: "No owner profile found for this user" 
          } 
        });
      }
      
      // Validate the pet data
      const petData = req.body;
      try {
        petFormSchema.parse(petData);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            error: {
              code: "invalid_pet_data",
              message: validationError.message
            }
          });
        }
      }
      
      // Add owner ID to the pet data
      const petWithOwner = { ...petData, ownerId: user.ownerId };
      
      // Create the pet
      const newPet = await storage.createPet(petWithOwner);
      
      res.status(201).json(newPet);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to create pet" 
        } 
      });
    }
  });
  
  // Track responses for MCP messaging 
  app.use((req: Request, res: Response, next) => {
    // Store the original send method
    const originalSend = res.send;
    
    // Override the send method to capture response bodies
    res.send = function(body) {
      // Parse JSON response if it's a string
      let parsedBody = body;
      if (typeof body === 'string') {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          // Not JSON, keep original
        }
      }
      
      // Store body for later use (to avoid parsing twice)
      (res as any)._body = parsedBody;
      
      // Call original method
      return originalSend.apply(res, [body]);
    };
    
    // Continue to the next middleware
    next();
  });
  
  // API route for getting all services
  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json({ services });
    } catch (error) {
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to fetch services." 
        }
      });
    }
  });

  // API route for getting a specific service
  app.get("/api/services/:serviceId", async (req: Request, res: Response) => {
    try {
      const serviceId = req.params.serviceId;
      const service = await storage.getServiceByServiceId(serviceId);
      
      if (!service) {
        return res.status(404).json({ 
          error: {
            code: "service_not_found", 
            message: "The requested service was not found." 
          }
        });
      }
      
      res.json({ service });
    } catch (error) {
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to fetch service details." 
        }
      });
    }
  });

  // API route for getting service availability
  app.get("/api/availability/:serviceId", async (req: Request, res: Response) => {
    try {
      const serviceId = req.params.serviceId;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;
      
      // Validate query parameters
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            code: "missing_parameters",
            message: "Both start_date and end_date query parameters are required."
          }
        });
      }
      
      // Parse dates to ensure validity
      try {
        new Date(startDate);
        new Date(endDate);
      } catch (err) {
        return res.status(400).json({
          error: {
            code: "invalid_date_format",
            message: "Dates should be in YYYY-MM-DD format."
          }
        });
      }
      
      // Check if service exists
      const service = await storage.getServiceByServiceId(serviceId);
      if (!service) {
        return res.status(404).json({
          error: {
            code: "service_not_found",
            message: "The requested service was not found."
          }
        });
      }
      
      const availability = await storage.getServiceAvailability(serviceId, startDate, endDate);
      res.json({ availability });
    } catch (error) {
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to fetch service availability." 
        }
      });
    }
  });

  // API route for creating a booking
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const { serviceId, startDate, startTime, endDate, endTime, pet, owner, selectedPetId } = req.body;
      
      console.log("Booking request received:", { serviceId, startDate, startTime, endDate, endTime, selectedPetId });
      
      // Validate pet data using petFormSchema (which has ownerId as optional)
      try {
        petFormSchema.parse(pet);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            error: {
              code: "invalid_pet_data",
              message: validationError.message
            }
          });
        }
      }

      // Validate owner data
      try {
        ownerFormSchema.parse(owner);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            error: {
              code: "invalid_owner_data",
              message: validationError.message
            }
          });
        }
      }
      
      // Verify the service exists
      const service = await storage.getServiceByServiceId(serviceId);
      if (!service) {
        return res.status(404).json({
          error: {
            code: "service_not_found",
            message: "The requested service was not found."
          }
        });
      }
      
      // Check if the owner already exists (by email)
      let ownerId: number;
      const existingOwner = await storage.getOwnerByEmail(owner.email);
      
      if (existingOwner) {
        ownerId = existingOwner.id;
      } else {
        // Create a new owner
        const newOwner = await storage.createOwner(owner);
        ownerId = newOwner.id;
      }
      
      // Determine the pet ID for the booking
      let petId: number;
      
      // If a specific existing pet ID was provided, use it
      if (selectedPetId) {
        console.log(`Using existing pet with ID: ${selectedPetId}`);
        
        // Verify the pet exists and belongs to the owner
        const existingPet = await storage.getPet(selectedPetId);
        if (!existingPet) {
          console.log(`Pet with ID ${selectedPetId} not found`);
          return res.status(404).json({
            error: {
              code: "pet_not_found",
              message: "The selected pet was not found."
            }
          });
        }
        
        // Verify the pet belongs to this owner
        if (existingPet.ownerId !== ownerId) {
          console.log(`Pet owner mismatch: pet belongs to owner ${existingPet.ownerId}, not ${ownerId}`);
          return res.status(403).json({
            error: {
              code: "pet_owner_mismatch",
              message: "The selected pet does not belong to this owner."
            }
          });
        }
        
        petId = selectedPetId;
        console.log(`Confirmed pet ID ${petId} for booking`);
      } else {
        // No existing pet selected, create a new one
        const petWithOwner = { ...pet, ownerId };
        const newPet = await storage.createPet(petWithOwner);
        petId = newPet.id;
      }
      
      // Calculate total price
      // Check if req.body already has totalPrice calculated from client
      let totalPrice: number = req.body.totalPrice;
      
      // If the client didn't provide a totalPrice, calculate it
      if (!totalPrice || isNaN(totalPrice)) {
        console.log("No valid totalPrice provided by client, calculating server-side");
        
        if (service.category === "boarding" && endDate) {
          try {
            // Calculate number of nights for boarding
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Check if the dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              throw new Error(`Invalid date objects: start=${start}, end=${end}`);
            }
            
            const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            // Ensure nights is at least 1
            const validNights = Math.max(1, nights);
            totalPrice = service.price * validNights;
            
            console.log(`Calculated totalPrice: ${totalPrice} (${service.price} × ${validNights} nights)`);
          } catch (err) {
            console.error("Error calculating totalPrice:", err);
            totalPrice = service.price; // Fallback to base price
          }
        } else {
          // For grooming, just use the base price
          totalPrice = service.price;
          console.log(`Using base price for grooming: ${totalPrice}`);
        }
      } else {
        console.log(`Using client-provided totalPrice: ${totalPrice}`);
      }
      
      // Generate a booking ID
      const bookingId = `BOK-${Math.floor(Math.random() * 90000000 + 10000000)}`;
      
      // Helper function to create date without timezone issues
      const createDateFromString = (dateString: string) => {
        // Log the input date string for debugging
        console.log(`Processing date string: ${dateString}`);
        
        // Check if we have a date in any recognized format
        if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log(`Warning: Date string format not as expected: ${dateString}`);
          
          // Attempt to extract just the date part if it's an ISO string
          const parts = dateString.split('T');
          if (parts.length > 1) {
            dateString = parts[0];
            console.log(`Extracted date part: ${dateString}`);
          }
        }
        
        // Parse the parts
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        
        // Validate parsed values
        if (isNaN(year) || isNaN(month) || isNaN(day) || 
            year < 2000 || year > 2100 || 
            month < 1 || month > 12 || 
            day < 1 || day > 31) {
          console.error(`Invalid date components: ${year}-${month}-${day} from ${dateString}`);
          throw new Error(`Invalid date format: ${dateString}`);
        }
        
        // IMPORTANT: Create a Date in the local timezone to prevent the date from shifting
        // This approach ensures the date is stored exactly as the user selected it
        // This is different from UTC which can result in off-by-one issues
        const date = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid DST issues
        
        console.log(`Created date: ${date.toISOString()} from ${dateString}`);
        return date;
      };

      // Create the booking
      const bookingData = {
        bookingId,
        serviceId,
        startDate: createDateFromString(startDate),
        startTime,
        endDate: endDate ? createDateFromString(endDate) : undefined,
        endTime,
        totalPrice,
        status: "confirmed",
        petId,
        ownerId
      };
      
      // Validate booking data
      try {
        insertBookingSchema.parse(bookingData);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            error: {
              code: "invalid_booking_data",
              message: validationError.message
            }
          });
        }
      }
      
      const booking = await storage.createBooking(bookingData);
      
      const response = {
        booking_id: booking.bookingId,
        status: booking.status,
        service_id: booking.serviceId,
        start_date: booking.startDate,
        start_time: booking.startTime,
        end_date: booking.endDate,
        end_time: booking.endTime,
        total_price: booking.totalPrice,
        pet_id: booking.petId,
        owner_id: booking.ownerId
      };
      
      // Send notification directly from here - will also be sent in the middleware
      mcpServer.sendNotification(
        `New booking #${booking.bookingId} has been created for service ${booking.serviceId}`,
        ClientRole.ADMIN
      );
      
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to create booking." 
        }
      });
    }
  });

  // API route for getting a specific booking
  app.get("/api/bookings/:bookingId", async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.bookingId;
      const booking = await storage.getBookingByBookingId(bookingId);
      
      if (!booking) {
        return res.status(404).json({ 
          error: {
            code: "booking_not_found", 
            message: "The requested booking was not found." 
          }
        });
      }
      
      // Get related pet and owner information
      const pet = await storage.getPet(booking.petId);
      const owner = await storage.getOwner(booking.ownerId);
      const service = await storage.getServiceByServiceId(booking.serviceId);
      
      res.json({ 
        booking,
        pet,
        owner,
        service
      });
    } catch (error) {
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to fetch booking details." 
        }
      });
    }
  });

  // API route for getting all bookings (admin only)
  app.get("/api/admin/bookings", async (req: Request, res: Response) => {
    try {
      console.log("Fetching all bookings for admin...");
      
      // In a real app, would check authentication/authorization here
      const bookings = await storage.getBookings();
      console.log(`Retrieved ${bookings.length} bookings from database`);
      
      // Get details for each booking
      try {
        const detailedBookings = await Promise.all(bookings.map(async (booking) => {
          console.log(`Processing booking ${booking.bookingId} for pet ${booking.petId}`);
          
          try {
            const pet = await storage.getPet(booking.petId);
            const owner = await storage.getOwner(booking.ownerId);
            const service = await storage.getServiceByServiceId(booking.serviceId);
            
            return {
              booking,
              pet,
              owner,
              service
            };
          } catch (innerError) {
            console.error(`Error fetching details for booking ${booking.bookingId}:`, innerError);
            // Return the booking with null values for missing details
            return {
              booking,
              pet: null,
              owner: null,
              service: null
            };
          }
        }));
        
        console.log(`Successfully prepared ${detailedBookings.length} detailed bookings for response`);
        res.json({ bookings: detailedBookings });
      } catch (promiseError) {
        console.error("Error in Promise.all for bookings:", promiseError);
        throw promiseError;
      }
    } catch (error) {
      console.error("Error in /api/admin/bookings endpoint:", error);
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to fetch bookings." 
        }
      });
    }
  });

  // API route for updating a booking status
  app.patch("/api/bookings/:bookingId/status", async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.bookingId;
      const { status } = req.body;
      
      // Validate status
      const statusSchema = z.enum(["confirmed", "cancelled", "completed"]);
      try {
        statusSchema.parse(status);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            error: {
              code: "invalid_status",
              message: "Status must be one of: confirmed, cancelled, completed"
            }
          });
        }
      }
      
      const booking = await storage.updateBookingStatus(bookingId, status);
      
      if (!booking) {
        return res.status(404).json({ 
          error: {
            code: "booking_not_found", 
            message: "The requested booking was not found." 
          }
        });
      }
      
      const response = { 
        booking_id: booking.bookingId,
        status: booking.status
      };
      
      // Send booking update notification via MCP
      mcpServer.sendBookingUpdate(booking.bookingId, { status: booking.status });
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        error: {
          code: "internal_server_error", 
          message: "Failed to update booking status." 
        }
      });
    }
  });

  // Admin API routes
  
  // Create a new service (admin only)
  app.post("/api/admin/services", async (req: Request, res: Response) => {
    try {
      const serviceData = req.body;
      
      // In a real app, would check admin authentication/authorization here
      
      // Validate service data
      if (!serviceData || Object.keys(serviceData).length === 0) {
        return res.status(400).json({
          error: {
            code: "invalid_service_data",
            message: "No data provided for service creation"
          }
        });
      }
      
      // Check if a service with the same serviceId already exists
      const existingService = await storage.getServiceByServiceId(serviceData.serviceId);
      
      if (existingService) {
        return res.status(409).json({
          error: {
            code: "service_already_exists",
            message: `A service with ID '${serviceData.serviceId}' already exists`
          }
        });
      }
      
      // Create the service
      const createdService = await storage.createService(serviceData);
      
      // Send notification via MCP
      mcpServer.sendNotification(
        `New service "${serviceData.name}" has been created`,
        ClientRole.ADMIN
      );
      
      // Return the created service
      res.status(201).json({ service: createdService });
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({
        error: {
          code: "internal_server_error",
          message: "Failed to create service"
        }
      });
    }
  });
  
  // Update service details (admin only)
  app.patch("/api/admin/services/:serviceId", async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const serviceData = req.body;
      
      // In a real app, would check admin authentication/authorization here
      
      // Validate service data
      if (!serviceData || Object.keys(serviceData).length === 0) {
        return res.status(400).json({
          error: {
            code: "invalid_service_data",
            message: "No data provided for service update"
          }
        });
      }
      
      // Update the service
      const updatedService = await storage.updateService(serviceId, serviceData);
      
      if (!updatedService) {
        return res.status(404).json({
          error: {
            code: "service_not_found",
            message: "The service was not found"
          }
        });
      }
      
      // Return the updated service
      res.json({ service: updatedService });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({
        error: {
          code: "internal_server_error",
          message: "Failed to update service"
        }
      });
    }
  });
  
  // Update service availability (admin only)
  app.patch("/api/admin/services/:serviceId/availability/:date", async (req: Request, res: Response) => {
    try {
      const { serviceId, date } = req.params;
      const availabilityData = req.body;
      
      // In a real app, would check admin authentication/authorization here
      
      // Validate the date format
      try {
        new Date(date);
      } catch (err) {
        return res.status(400).json({
          error: {
            code: "invalid_date_format",
            message: "Date should be in YYYY-MM-DD format"
          }
        });
      }
      
      // Validate availability data
      if (!availabilityData || Object.keys(availabilityData).length === 0) {
        return res.status(400).json({
          error: {
            code: "invalid_availability_data",
            message: "No data provided for availability update"
          }
        });
      }
      
      // Update the availability
      const updatedAvailability = await storage.updateServiceAvailability(
        serviceId, 
        date, 
        availabilityData
      );
      
      if (!updatedAvailability) {
        return res.status(404).json({
          error: {
            code: "availability_not_found",
            message: "The service or date was not found"
          }
        });
      }
      
      // Send notification via MCP
      mcpServer.sendAvailabilityUpdate(serviceId, date);
      
      // Return the updated availability
      res.json({ availability: updatedAvailability });
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({
        error: {
          code: "internal_server_error",
          message: "Failed to update availability"
        }
      });
    }
  });
  
  // MCP-specific API routes
  
  // Model Context Protocol (MCP) API routes
  const mcpRouter = createMCPRouter();
  app.use("/api/mcp", mcpRouter);
  
  // Webhook API routes
  const webhookRouter = createWebhookRouter();
  app.use("/api/webhooks", webhookRouter);
  
  // Send notification via MCP (open to all users for testing)
  // API route to get MCP configuration
  app.get("/api/mcp/config", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ 
          error: { 
            code: "forbidden", 
            message: "Admin access required" 
          } 
        });
      }
      
      const sseEnabled = process.env.MCP_ENABLE_SSE === 'true';
      const websocketsEnabled = process.env.MCP_ENABLE_WEBSOCKETS === 'true';
      
      res.json({
        sseEnabled,
        websocketsEnabled,
        httpFallback: true // HTTP fallback is always available
      });
    } catch (error) {
      console.error(`[mcp] Error getting MCP config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ success: false, error: "Failed to get MCP configuration" });
    }
  });
  
  // API route to update MCP configuration
  app.post("/api/mcp/config", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and an admin
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ 
          error: { 
            code: "forbidden", 
            message: "Admin access required" 
          } 
        });
      }
      
      const { sseEnabled, websocketsEnabled } = req.body;
      
      // Update environment variables
      if (typeof sseEnabled === 'boolean') {
        process.env.MCP_ENABLE_SSE = sseEnabled ? 'true' : 'false';
      }
      
      if (typeof websocketsEnabled === 'boolean') {
        process.env.MCP_ENABLE_WEBSOCKETS = websocketsEnabled ? 'true' : 'false';
      }
      
      // Log the changes
      console.log(`[mcp] Configuration updated: SSE=${process.env.MCP_ENABLE_SSE}, WebSockets=${process.env.MCP_ENABLE_WEBSOCKETS}`);
      
      // Return the updated configuration
      res.json({
        sseEnabled: process.env.MCP_ENABLE_SSE === 'true',
        websocketsEnabled: process.env.MCP_ENABLE_WEBSOCKETS === 'true',
        httpFallback: true, // HTTP fallback is always available
        message: "MCP configuration updated. Please restart the server for changes to take effect."
      });
    } catch (error) {
      console.error(`[mcp] Error updating MCP config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ success: false, error: "Failed to update MCP configuration" });
    }
  });
  
  app.post("/api/mcp/notifications", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      // Validate message
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: {
            code: "invalid_message",
            message: "A valid message string is required"
          }
        });
      }
      
      // Send notification through MCP server
      // Using the simplified broadcasting approach to reach all connected clients
      mcpServer.sendNotification(message);
      
      // Return success with detailed message
      res.status(200).json({ 
        success: true,
        message: "Notification sent successfully to all connected users",
        timestamp: new Date().toISOString(),
        notification: message
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ 
        error: {
          code: "internal_server_error",
          message: "Failed to send notification"
        }
      });
    }
  });
  
  // MCP notification middleware (after all other middleware)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Make sure the response has finished processing
    res.on('finish', () => {
      // Only proceed if there's a response body
      if ((res as any)._body) {
        const body = (res as any)._body;
        
        // Handle booking creation notifications
        if (req.method === 'POST' && req.path === '/api/bookings' && res.statusCode === 201) {
          if (body.booking_id) {
            // Send notification to all connected clients
            mcpServer.sendNotification(
              `New booking #${body.booking_id} has been created`
            );
            
            // Send booking update to relevant clients
            mcpServer.sendBookingUpdate(body.booking_id, {
              status: body.status,
              action: "created"
            });
            
            // Update availability for the service
            mcpServer.sendAvailabilityUpdate(
              body.service_id,
              new Date(body.start_date).toISOString().split('T')[0]
            );
            
            // Trigger webhook for booking creation event
            webhookManager.trigger(WebhookEventType.BOOKING_CREATED, {
              booking_id: body.booking_id,
              service_id: body.service_id,
              start_date: body.start_date,
              end_date: body.end_date,
              status: body.status,
              pet_id: body.pet_id,
              owner_id: body.owner_id,
              total_price: body.total_price
            });
          }
        }
        
        // Handle booking status update notifications
        const statusUpdatePattern = /^\/api\/bookings\/(.+)\/status$/;
        const statusMatch = req.path.match(statusUpdatePattern);
        
        if (req.method === 'PATCH' && statusMatch && res.statusCode === 200) {
          if (body.booking_id) {
            // Get the booking asynchronously
            storage.getBookingByBookingId(body.booking_id)
              .then(booking => {
                if (booking) {
                  // Send notification based on status
                  let message = "";
                  if (body.status === "confirmed") {
                    message = `Booking #${body.booking_id} has been confirmed`;
                  } else if (body.status === "cancelled") {
                    message = `Booking #${body.booking_id} has been cancelled`;
                  } else if (body.status === "completed") {
                    message = `Booking #${body.booking_id} has been marked as completed`;
                  }
                  
                  // Send notification to all connected clients
                  mcpServer.sendNotification(message);
                  
                  // Send booking update to relevant clients
                  mcpServer.sendBookingUpdate(body.booking_id, {
                    status: body.status,
                    action: "status_updated"
                  });
                  
                  // If cancelled, update availability
                  if (body.status === "cancelled") {
                    mcpServer.sendAvailabilityUpdate(
                      booking.serviceId,
                      new Date(booking.startDate).toISOString().split('T')[0]
                    );
                  }
                  
                  // Send owner-specific update
                  mcpServer.sendOwnerUpdate(booking.ownerId, {
                    bookingId: body.booking_id,
                    status: body.status,
                    message: `Your booking #${body.booking_id} status has been updated to ${body.status}`
                  });
                  
                  // Trigger appropriate webhook event based on status
                  if (body.status === "cancelled") {
                    webhookManager.trigger(WebhookEventType.BOOKING_CANCELLED, {
                      booking_id: body.booking_id,
                      service_id: booking.serviceId,
                      previous_status: booking.status,
                      current_status: body.status,
                      pet_id: booking.petId,
                      owner_id: booking.ownerId
                    });
                  } else if (body.status === "completed") {
                    webhookManager.trigger(WebhookEventType.BOOKING_COMPLETED, {
                      booking_id: body.booking_id,
                      service_id: booking.serviceId,
                      previous_status: booking.status,
                      current_status: body.status,
                      pet_id: booking.petId,
                      owner_id: booking.ownerId
                    });
                  } else {
                    webhookManager.trigger(WebhookEventType.BOOKING_UPDATED, {
                      booking_id: body.booking_id,
                      service_id: booking.serviceId,
                      previous_status: booking.status,
                      current_status: body.status,
                      pet_id: booking.petId,
                      owner_id: booking.ownerId
                    });
                  }
                }
              })
              .catch(error => {
                console.error("Error in MCP notification:", error);
              });
          }
        }
      }
    });
    
    next();
  });
  
  // Test route for sending broadcast notifications (only in development)
  app.get("/api/test/notification", async (req: Request, res: Response) => {
    try {
      const message = req.query.message as string || 'Test notification from server';
      
      // Send notification through the MCP server to all connected clients
      mcpServer.sendNotification(message);
      
      // Log notification details
      const timestamp = new Date().toISOString();
      console.log(`[mcp] Test notification sent at ${timestamp}: "${message}"`);
      
      // Return success
      return res.json({ 
        success: true, 
        message: `Notification "${message}" sent to all connected users`,
        timestamp
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });
  
  // SSE Testing endpoint - simulate a new booking notification
  app.get("/api/test/sse-booking", async (req: Request, res: Response) => {
    try {
      const mockBookingData = {
        bookingId: "BOK-" + Math.floor(Math.random() * 1000000).toString().padStart(8, '0'),
        status: "confirmed",
        service: "Deluxe Boarding",
        startDate: "2025-04-15",
        endDate: "2025-04-20",
        petName: "Buddy",
        ownerName: "John Smith"
      };
      
      // Send a booking update to all connected clients
      mcpServer.sendBookingUpdate(mockBookingData.bookingId, mockBookingData);
      
      // Also send a notification
      mcpServer.sendNotification(`New booking created: ${mockBookingData.service} for ${mockBookingData.petName}`, ClientRole.GUEST);
      
      console.log(`[mcp] Test booking notification sent: ${JSON.stringify(mockBookingData)}`);
      
      res.json({ 
        success: true, 
        message: "Test SSE booking update sent", 
        booking: mockBookingData 
      });
    } catch (error) {
      console.error(`[mcp] Error sending test SSE booking update: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ success: false, error: "Failed to send test SSE booking update" });
    }
  });
  
  // Notification API routes
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      
      // If not authenticated, return 401
      if (!userId) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      // If admin, they can see all notifications
      const isAdmin = req.user.isAdmin;
      const notifications = await storage.getNotifications(isAdmin ? undefined : userId);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to fetch notifications" 
        } 
      });
    }
  });
  
  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      // Only admins can create notifications
      if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ 
          error: { 
            code: "forbidden", 
            message: "Only admins can create notifications" 
          } 
        });
      }
      
      const { message, userId, notificationType, relatedId } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          error: { 
            code: "missing_parameter", 
            message: "Message is required" 
          } 
        });
      }
      
      const notification = await storage.createNotification({
        message,
        userId: userId || null, // If userId is not provided, it's a system-wide notification
        isRead: false,
        notificationType: notificationType || "general",
        relatedId: relatedId || null
      });
      
      // Also send via WebSocket for real-time delivery
      if (userId) {
        // User-specific notification
        // This would be a targeted notification in the future
        mcpServer.sendNotification(message);
      } else {
        // System-wide notification, broadcast to all users
        mcpServer.sendNotification(message);
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to create notification" 
        } 
      });
    }
  });
  
  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      // Mark notification as read with the user's ID for shadow copy creation
      const updatedNotification = await storage.markNotificationRead(notificationId, userId);
      
      if (!updatedNotification) {
        return res.status(404).json({ 
          error: { 
            code: "notification_not_found", 
            message: "Notification not found" 
          } 
        });
      }
      
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to update notification" 
        } 
      });
    }
  });
  
  app.post("/api/notifications/read-all", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      // Mark all of the user's notifications as read
      await storage.markAllNotificationsRead(userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to update notifications" 
        } 
      });
    }
  });
  
  app.patch("/api/notifications/:id/archive", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      // Archive the notification with the user ID to handle system notifications correctly
      const updatedNotification = await storage.archiveNotification(notificationId, userId);
      
      if (!updatedNotification) {
        return res.status(404).json({ 
          error: { 
            code: "notification_not_found", 
            message: "Notification not found" 
          } 
        });
      }
      
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error archiving notification:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to archive notification" 
        } 
      });
    }
  });
  
  app.post("/api/notifications/archive-all", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          error: { 
            code: "unauthorized", 
            message: "Not authenticated" 
          } 
        });
      }
      
      // Archive all of the user's notifications
      await storage.archiveAllNotifications(userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error archiving all notifications:", error);
      res.status(500).json({ 
        error: { 
          code: "internal_server_error", 
          message: "Failed to archive notifications" 
        } 
      });
    }
  });
  
  // =====================================================
  // NEW API ENDPOINTS FOR PROGRAMMATIC ACCESS
  // =====================================================

  // 1. OWNER OPERATIONS
  // Create a new owner
  app.post("/api/owners", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated (either admin or regular user)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { code: "unauthorized", message: "Authentication required" }
        });
      }

      // Validate the request body
      const ownerData = insertOwnerSchema.parse(req.body);
      
      // Check if owner with this email already exists
      const existingOwner = await storage.getOwnerByEmail(ownerData.email);
      if (existingOwner) {
        return res.status(409).json({ 
          error: { code: "conflict", message: "Owner with this email already exists" }
        });
      }
      
      // Create the owner
      const owner = await storage.createOwner(ownerData);
      
      // Trigger webhook event for owner creation
      webhookManager.trigger(WebhookEventType.OWNER_CREATED, {
        owner,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json({
        success: true,
        message: "Owner created successfully",
        data: owner
      });
    } catch (error) {
      console.error("Error creating owner:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: { code: "validation_error", message: validationError.message }
        });
      }
      
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to create owner" }
      });
    }
  });

  // Update owner information
  app.put("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { code: "unauthorized", message: "Authentication required" }
        });
      }
      
      const ownerId = parseInt(req.params.id);
      
      // Check if user is admin or the owner belongs to this user
      if (!req.user.isAdmin && (!req.user.ownerId || req.user.ownerId !== ownerId)) {
        return res.status(403).json({ 
          error: { code: "forbidden", message: "You don't have permission to update this owner" }
        });
      }
      
      // Validate the request body
      const ownerData = insertOwnerSchema.parse(req.body);
      
      // Check if owner exists
      const existingOwner = await storage.getOwner(ownerId);
      if (!existingOwner) {
        return res.status(404).json({ 
          error: { code: "not_found", message: "Owner not found" }
        });
      }
      
      // If email is being changed, ensure it's not already taken
      if (ownerData.email !== existingOwner.email) {
        const emailExists = await storage.getOwnerByEmail(ownerData.email);
        if (emailExists && emailExists.ownerId !== ownerId) {
          return res.status(409).json({ 
            error: { code: "conflict", message: "Email already in use by another owner" }
          });
        }
      }
      
      // Update the owner
      const updatedOwner = await storage.updateOwner(ownerId, ownerData);
      
      // Trigger webhook event for owner update
      webhookManager.trigger(WebhookEventType.OWNER_UPDATED, {
        owner: updatedOwner,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: "Owner updated successfully",
        data: updatedOwner
      });
    } catch (error) {
      console.error("Error updating owner:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: { code: "validation_error", message: validationError.message }
        });
      }
      
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to update owner" }
      });
    }
  });

  // 2. PET OPERATIONS
  // Create a new pet
  app.post("/api/pets", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { code: "unauthorized", message: "Authentication required" }
        });
      }
      
      // Validate the request body
      const petData = insertPetSchema.parse(req.body);
      
      // If user is not admin, check if they own the owner account
      if (!req.user.isAdmin && (!req.user.ownerId || req.user.ownerId !== petData.ownerId)) {
        return res.status(403).json({ 
          error: { code: "forbidden", message: "You don't have permission to add pets to this owner" }
        });
      }
      
      // Check if owner exists
      const owner = await storage.getOwner(petData.ownerId);
      if (!owner) {
        return res.status(404).json({ 
          error: { code: "not_found", message: "Owner not found" }
        });
      }
      
      // Create the pet
      const pet = await storage.createPet(petData);
      
      // Trigger webhook event for pet creation
      webhookManager.trigger(WebhookEventType.PET_CREATED, {
        pet,
        owner,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json({
        success: true,
        message: "Pet created successfully",
        data: pet
      });
    } catch (error) {
      console.error("Error creating pet:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: { code: "validation_error", message: validationError.message }
        });
      }
      
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to create pet" }
      });
    }
  });

  // Update pet information
  app.put("/api/pets/:id", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { code: "unauthorized", message: "Authentication required" }
        });
      }
      
      const petId = parseInt(req.params.id);
      
      // Validate the request body (partial update allowed)
      const petData = insertPetSchema.partial().parse(req.body);
      
      // Check if pet exists
      const existingPet = await storage.getPet(petId);
      if (!existingPet) {
        return res.status(404).json({ 
          error: { code: "not_found", message: "Pet not found" }
        });
      }
      
      // If user is not admin, check if they own the pet
      if (!req.user.isAdmin && (!req.user.ownerId || req.user.ownerId !== existingPet.ownerId)) {
        return res.status(403).json({ 
          error: { code: "forbidden", message: "You don't have permission to update this pet" }
        });
      }
      
      // Update the pet
      const updatedPet = await storage.updatePet(petId, petData);
      
      // Trigger webhook event for pet update
      webhookManager.trigger(WebhookEventType.PET_UPDATED, {
        pet: updatedPet,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: "Pet updated successfully",
        data: updatedPet
      });
    } catch (error) {
      console.error("Error updating pet:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: { code: "validation_error", message: validationError.message }
        });
      }
      
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to update pet" }
      });
    }
  });

  // 3. BOOKING OPERATIONS
  // Note: We already have a POST /api/bookings endpoint, but now we'll also add PUT and DELETE
  
  // Update booking details
  app.put("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { code: "unauthorized", message: "Authentication required" }
        });
      }
      
      const bookingId = req.params.id;
      
      // Validate the request body (partial update allowed)
      const bookingData = insertBookingSchema.partial().parse(req.body);
      
      // Check if booking exists
      const existingBooking = await storage.getBookingByBookingId(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ 
          error: { code: "not_found", message: "Booking not found" }
        });
      }
      
      // If user is not admin, check if they own the booking
      if (!req.user.isAdmin && (!req.user.ownerId || req.user.ownerId !== existingBooking.ownerId)) {
        return res.status(403).json({ 
          error: { code: "forbidden", message: "You don't have permission to update this booking" }
        });
      }
      
      // Currently only status updates are supported
      if (bookingData.status) {
        const updatedBooking = await storage.updateBookingStatus(bookingId, bookingData.status);
        
        // Trigger webhook event for booking update
        webhookManager.trigger(WebhookEventType.BOOKING_UPDATED, {
          booking: updatedBooking,
          timestamp: new Date().toISOString()
        });
        
        // Create notification for status updates
        const pet = await storage.getPet(existingBooking.petId);
        await storage.createNotification({
          message: `Booking for ${pet?.name || 'your pet'} status updated to: ${bookingData.status}`,
          userId: existingBooking.ownerId === req.user.ownerId ? req.user.id : undefined,
          notificationType: "booking",
          relatedId: bookingId
        });
        
        res.json({
          success: true,
          message: "Booking status updated successfully",
          data: updatedBooking
        });
      } else {
        res.status(400).json({ 
          error: { code: "invalid_input", message: "Only status updates are currently supported" }
        });
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: { code: "validation_error", message: validationError.message }
        });
      }
      
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to update booking" }
      });
    }
  });

  // Cancel a booking
  app.delete("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          error: { code: "unauthorized", message: "Authentication required" }
        });
      }
      
      const bookingId = req.params.id;
      
      // Check if booking exists
      const existingBooking = await storage.getBookingByBookingId(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ 
          error: { code: "not_found", message: "Booking not found" }
        });
      }
      
      // If user is not admin, check if they own the booking
      if (!req.user.isAdmin && (!req.user.ownerId || req.user.ownerId !== existingBooking.ownerId)) {
        return res.status(403).json({ 
          error: { code: "forbidden", message: "You don't have permission to cancel this booking" }
        });
      }
      
      // Cancel the booking by updating its status
      const updatedBooking = await storage.updateBookingStatus(bookingId, "cancelled");
      
      // Trigger webhook event for booking cancellation
      webhookManager.trigger(WebhookEventType.BOOKING_CANCELLED, {
        booking: updatedBooking,
        timestamp: new Date().toISOString()
      });
      
      // Create notification for booking cancellation
      const pet = await storage.getPet(existingBooking.petId);
      
      // Notify admin if cancelled by customer
      if (!req.user.isAdmin) {
        await storage.createNotification({
          message: `Booking for ${pet?.name || 'a pet'} was cancelled by customer`,
          notificationType: "booking",
          relatedId: bookingId
        });
      }
      
      // Notify customer if cancelled by admin
      if (req.user.isAdmin && existingBooking.ownerId) {
        const owner = await storage.getOwner(existingBooking.ownerId);
        if (owner && owner.userId) {
          await storage.createNotification({
            message: `Your booking for ${pet?.name || 'your pet'} was cancelled`,
            userId: owner.userId,
            notificationType: "booking",
            relatedId: bookingId
          });
        }
      }
      
      res.json({
        success: true,
        message: "Booking cancelled successfully",
        data: updatedBooking
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to cancel booking" }
      });
    }
  });

  // 4. AVAILABILITY OPERATIONS
  // Block time slots for services
  app.post("/api/availability/block", async (req: Request, res: Response) => {
    try {
      // Only admin can block availability
      if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ 
          error: { code: "forbidden", message: "Only administrators can manage availability" }
        });
      }
      
      // Validate request body
      const blockData = z.object({
        serviceId: z.string(),
        date: z.string(),
        available: z.boolean().default(false),
        timeSlots: z.array(z.object({
          time: z.string(),
          available: z.boolean().default(false)
        })).optional()
      }).parse(req.body);
      
      // Check if service exists
      const service = await storage.getServiceByServiceId(blockData.serviceId);
      if (!service) {
        return res.status(404).json({ 
          error: { code: "not_found", message: "Service not found" }
        });
      }
      
      // Update availability
      const availability = await storage.updateServiceAvailability(
        blockData.serviceId,
        blockData.date,
        {
          date: blockData.date,
          available: blockData.available,
          timeSlots: blockData.timeSlots
        }
      );
      
      // Trigger webhook event for availability update
      webhookManager.trigger(WebhookEventType.AVAILABILITY_UPDATED, {
        serviceId: blockData.serviceId,
        date: blockData.date,
        availability,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: "Availability updated successfully",
        data: availability
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: { code: "validation_error", message: validationError.message }
        });
      }
      
      res.status(500).json({ 
        error: { code: "server_error", message: "Failed to update availability" }
      });
    }
  });
  
  return httpServer;
}