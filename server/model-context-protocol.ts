import { Request, Response, Router } from "express";
import { storage } from "./storage";
import { log } from "./utils";

// Feature flags for resource optimization
// Default to enabled if not explicitly set to 'false'
const SSE_ENABLED = process.env.MCP_ENABLE_SSE !== 'false';

// MCP Context Types based on the Model Context Protocol specification
interface MCPContextValue {
  type: string;
  value: any;
}

interface MCPContext {
  [key: string]: MCPContextValue;
}

interface MCPContextRequest {
  contexts?: string[];
  parameters?: Record<string, any>;
  authentication?: {
    token?: string;
    apiKey?: string;
  };
}

interface MCPContextSchema {
  type: string;
  description: string;
  examples?: any[];
  properties: Record<string, {
    type: string;
    description: string;
    examples?: any[];
    [key: string]: any;
  }>;
}

interface MCPToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  examples?: any[];
}

interface MCPTool {
  name: string;
  description: string;
  parameters: MCPToolParameter[];
}

interface MCPProviderInfo {
  name: string;
  description: string;
  version: string;
  contextSchema: Record<string, MCPContextSchema>;
  tools?: MCPTool[];
}

// Context provider implementation
class ModelContextProvider {
  // Provider metadata
  private info: MCPProviderInfo = {
    name: "PawPerfect Pet Boarding",
    description: "Model Context Protocol provider for the PawPerfect pet boarding and grooming application. This MCP provider enables AI agents to access booking data, service information, availability, pet details, and customer records.",
    version: "1.0.0",
    tools: [
      {
        name: "book_appointment",
        description: "Create a new booking for a pet service. This tool allows scheduling appointments for boarding, grooming, or other services.",
        parameters: [
          {
            name: "serviceId",
            type: "string",
            description: "The ID of the service to book (e.g., 'boarding-standard', 'grooming-deluxe')",
            required: true,
            examples: ["boarding-standard", "grooming-deluxe"]
          },
          {
            name: "petId",
            type: "number",
            description: "The ID of the pet for which the service is being booked",
            required: true,
            examples: [1, 5]
          },
          {
            name: "startDate",
            type: "string",
            description: "The starting date for the service in ISO format (YYYY-MM-DD)",
            required: true,
            examples: ["2025-05-15"]
          },
          {
            name: "startTime",
            type: "string",
            description: "The starting time in 24-hour format (HH:MM)",
            required: true,
            examples: ["09:00", "14:30"]
          },
          {
            name: "endDate",
            type: "string",
            description: "The ending date for multi-day services like boarding (YYYY-MM-DD). Optional for single-day services.",
            required: false,
            examples: ["2025-05-18", null]
          },
          {
            name: "endTime",
            type: "string",
            description: "The ending time in 24-hour format (HH:MM)",
            required: false,
            examples: ["17:00", null]
          },
          {
            name: "notes",
            type: "string",
            description: "Any special instructions or notes for this booking",
            required: false,
            examples: ["Please ensure water bowl is always full", null]
          }
        ]
      },
      {
        name: "create_customer",
        description: "Create a new customer record in the system. This is required before adding pets or making bookings.",
        parameters: [
          {
            name: "firstName",
            type: "string",
            description: "Customer's first name",
            required: true,
            examples: ["John", "Jane"]
          },
          {
            name: "lastName",
            type: "string",
            description: "Customer's last name",
            required: true,
            examples: ["Smith", "Doe"]
          },
          {
            name: "email",
            type: "string",
            description: "Customer's email address for communication and login",
            required: true,
            examples: ["john.smith@example.com"]
          },
          {
            name: "phone",
            type: "string",
            description: "Customer's phone number for urgent communications",
            required: true,
            examples: ["555-123-4567"]
          },
          {
            name: "address",
            type: "string",
            description: "Customer's physical address",
            required: false,
            examples: ["123 Main St, Anytown, USA"]
          }
        ]
      },
      {
        name: "add_pet",
        description: "Register a new pet associated with an existing owner",
        parameters: [
          {
            name: "ownerId",
            type: "number",
            description: "ID of the pet's owner",
            required: true,
            examples: [1, 5]
          },
          {
            name: "name",
            type: "string",
            description: "Pet's name",
            required: true,
            examples: ["Max", "Bella"]
          },
          {
            name: "breed",
            type: "string",
            description: "Pet's breed, or 'Mixed' if not purebred",
            required: true,
            examples: ["Golden Retriever", "Siamese", "Mixed"]
          },
          {
            name: "age",
            type: "number",
            description: "Pet's age in years",
            required: true,
            examples: [3, 5]
          },
          {
            name: "weight",
            type: "number",
            description: "Pet's weight in pounds",
            required: true,
            examples: [65.5, 12.0]
          },
          {
            name: "gender",
            type: "string",
            description: "Pet's gender: male, female, or unknown",
            required: true,
            examples: ["male", "female", "unknown"]
          },
          {
            name: "isVaccinated",
            type: "boolean",
            description: "Whether the pet is up-to-date on vaccinations",
            required: true,
            examples: [true, false]
          },
          {
            name: "specialNeeds",
            type: "string",
            description: "Any special care instructions or medical requirements",
            required: false,
            examples: ["Needs medication twice daily", "Food allergies"]
          }
        ]
      },
      {
        name: "check_availability",
        description: "Query available time slots for a specific service and date range",
        parameters: [
          {
            name: "serviceId",
            type: "string",
            description: "The ID of the service to check availability for",
            required: true,
            examples: ["boarding-standard", "grooming-deluxe"]
          },
          {
            name: "startDate",
            type: "string",
            description: "Start date for availability search (YYYY-MM-DD)",
            required: true,
            examples: ["2025-05-15"]
          },
          {
            name: "endDate",
            type: "string",
            description: "End date for availability search (YYYY-MM-DD), optional for single-day lookups",
            required: false,
            examples: ["2025-05-20"]
          }
        ]
      }
    ],
    contextSchema: {
      services: {
        type: "object",
        description: "Information about available pet boarding and grooming services offered by PawPerfect. Services include dog boarding, cat boarding, dog grooming, and special care packages.",
        examples: [
          {
            "services": [
              {
                "serviceId": "boarding-standard",
                "name": "Standard Dog Boarding",
                "description": "Comfortable overnight stay for your dog with basic care and feeding.",
                "price": 45.99,
                "priceUnit": "per_night",
                "category": "boarding",
                "durationInMinutes": 1440,
                "capacity": 20
              }
            ]
          }
        ],
        properties: {
          services: {
            type: "array",
            description: "List of available services with details including pricing, capacity, and service descriptions",
            items: {
              type: "object",
              properties: {
                serviceId: { 
                  type: "string", 
                  description: "Unique identifier for the service, typically in format 'category-name'",
                  examples: ["boarding-standard", "grooming-full"]
                },
                name: { 
                  type: "string", 
                  description: "Display name of the service as shown to customers",
                  examples: ["Deluxe Dog Grooming", "Cat Boarding Premium"] 
                },
                description: { 
                  type: "string", 
                  description: "Detailed description of what the service includes, benefits, and special features",
                  examples: ["Includes bath, nail trim, ear cleaning, and coat styling."] 
                },
                price: { 
                  type: "number", 
                  description: "Base price of the service in USD",
                  examples: [45.99, 75.00] 
                },
                priceUnit: { 
                  type: "string", 
                  description: "How the price is charged - per_night for boarding or per_session for grooming",
                  examples: ["per_night", "per_session"] 
                },
                category: { 
                  type: "string", 
                  description: "Primary category of the service - either 'boarding' for overnight stays or 'grooming' for beauty services",
                  examples: ["boarding", "grooming"] 
                },
                durationInMinutes: { 
                  type: "number", 
                  description: "For grooming services, the expected duration in minutes. For boarding, typically 1440 (24 hours)",
                  examples: [60, 90, 1440]
                },
                capacity: { 
                  type: "number", 
                  description: "Maximum number of pets that can be accommodated for this service per day",
                  examples: [10, 20, 5]
                },
                isArchived: { 
                  type: "boolean", 
                  description: "Whether this service is currently active (false) or has been archived (true)",
                  examples: [false, true]
                }
              }
            }
          }
        }
      },
      bookings: {
        type: "object",
        description: "Information about confirmed, pending, or completed pet boarding and grooming bookings. Use this context to retrieve details about specific bookings, check a customer's booking history, or generate booking reports.",
        examples: [
          {
            "bookings": [
              {
                "bookingId": "BOK-12345678",
                "serviceId": "grooming-deluxe",
                "startDate": "2025-05-01T10:00:00.000Z",
                "startTime": "10:00",
                "endDate": null,
                "endTime": "11:30",
                "totalPrice": 85.99,
                "status": "confirmed",
                "petId": 1,
                "ownerId": 1,
                "createdAt": "2025-04-07T15:30:45.000Z"
              }
            ]
          }
        ],
        properties: {
          bookings: {
            type: "array",
            description: "List of bookings with their complete details, statuses and scheduling information",
            items: {
              type: "object",
              properties: {
                bookingId: { 
                  type: "string", 
                  description: "Unique identifier for the booking with format BOK-XXXXXXXX",
                  examples: ["BOK-12345678"]
                },
                serviceId: { 
                  type: "string", 
                  description: "ID of the booked service, references the serviceId field in the services context",
                  examples: ["boarding-standard", "grooming-deluxe"] 
                },
                startDate: { 
                  type: "string", 
                  description: "ISO 8601 formatted date when the booking begins",
                  examples: ["2025-05-01T10:00:00.000Z"] 
                },
                startTime: { 
                  type: "string", 
                  description: "Starting time for the booking in 24-hour format (HH:MM)",
                  examples: ["10:00", "14:30"] 
                },
                endDate: { 
                  type: "string", 
                  description: "ISO 8601 formatted date when booking ends (only set for multi-day bookings like boarding)",
                  examples: ["2025-05-05T10:00:00.000Z", null] 
                },
                endTime: { 
                  type: "string", 
                  description: "Ending time for the booking in 24-hour format (HH:MM)",
                  examples: ["11:30", "17:00"] 
                },
                totalPrice: { 
                  type: "number", 
                  description: "Total calculated price for the booking in USD",
                  examples: [45.99, 230.00] 
                },
                status: { 
                  type: "string", 
                  description: "Current status of the booking: confirmed, cancelled, or completed",
                  examples: ["confirmed", "cancelled", "completed"] 
                },
                petId: { 
                  type: "number", 
                  description: "ID of the pet for this booking, references the id field in the pets context",
                  examples: [1, 5] 
                },
                ownerId: { 
                  type: "number", 
                  description: "ID of the pet owner, references the id field in the owners context",
                  examples: [1, 10] 
                },
                createdAt: { 
                  type: "string", 
                  description: "ISO 8601 formatted date when the booking was created in the system",
                  examples: ["2025-04-07T15:30:45.000Z"] 
                }
              }
            }
          }
        }
      },
      pets: {
        type: "object",
        description: "Information about pets registered in the PawPerfect system. Includes details about pets' physical characteristics, health information, vaccination status, and care requirements.",
        examples: [
          {
            "pets": [
              {
                "id": 1,
                "name": "Max",
                "breed": "Golden Retriever",
                "age": 3,
                "weight": 65.5,
                "gender": "male",
                "isVaccinated": true,
                "specialNeeds": "Needs medication twice daily",
                "ownerId": 1
              }
            ]
          }
        ],
        properties: {
          pets: {
            type: "array",
            description: "List of pets with their complete profiles and care requirements",
            items: {
              type: "object",
              properties: {
                id: { 
                  type: "number", 
                  description: "Unique numerical identifier for the pet",
                  examples: [1, 42] 
                },
                name: { 
                  type: "string", 
                  description: "Pet's name as given by the owner",
                  examples: ["Max", "Bella", "Charlie"] 
                },
                breed: { 
                  type: "string", 
                  description: "Breed of the pet, or 'Mixed' if not a purebred",
                  examples: ["Golden Retriever", "Siamese", "Mixed"] 
                },
                age: { 
                  type: "number", 
                  description: "Age of the pet in years",
                  examples: [3, 5, 10] 
                },
                weight: { 
                  type: "number", 
                  description: "Weight of the pet in pounds",
                  examples: [65.5, 12.0, 8.3] 
                },
                gender: { 
                  type: "string", 
                  description: "Gender of the pet: male, female, or unknown",
                  examples: ["male", "female", "unknown"] 
                },
                isVaccinated: { 
                  type: "boolean", 
                  description: "Whether the pet is up-to-date on required vaccinations",
                  examples: [true, false] 
                },
                specialNeeds: { 
                  type: "string", 
                  description: "Special care instructions, dietary needs, or medical requirements",
                  examples: ["Needs medication twice daily", "Food allergies", null] 
                },
                ownerId: { 
                  type: "number", 
                  description: "ID of the pet's owner, references the id field in the owners context",
                  examples: [1, 5] 
                },
                vetName: { 
                  type: "string", 
                  description: "Name of the pet's regular veterinarian",
                  examples: ["Dr. Smith", null] 
                },
                vetPhone: { 
                  type: "string", 
                  description: "Contact phone number for the pet's veterinarian",
                  examples: ["555-123-4567", null] 
                },
                vetAddress: { 
                  type: "string", 
                  description: "Address of the pet's veterinary clinic",
                  examples: ["123 Vet St, Anytown, USA", null] 
                },
                vetLastVisit: { 
                  type: "string", 
                  description: "ISO 8601 formatted date of the pet's last veterinary visit",
                  examples: ["2025-01-15T09:30:00.000Z", null] 
                },
                medicalHistory: { 
                  type: "string", 
                  description: "Summary of significant medical history for the pet",
                  examples: ["Previous leg surgery in 2023", "Seasonal allergies", null] 
                },
                medicationInstructions: { 
                  type: "string", 
                  description: "Instructions for administering any required medications",
                  examples: ["1 pill with breakfast, 1 pill with dinner", null] 
                },
                dietaryRestrictions: { 
                  type: "string", 
                  description: "Special dietary needs or food restrictions",
                  examples: ["No chicken products", "Grain-free diet only", null] 
                },
                behavioralNotes: { 
                  type: "string", 
                  description: "Notes about the pet's behavior, temperament, or special handling needs",
                  examples: ["Shy with strangers", "Does not like other male dogs", null] 
                }
              }
            }
          }
        }
      },
      owners: {
        type: "object",
        description: "Information about pet owners registered with PawPerfect. Includes contact details and essential information for customer communication and booking management.",
        examples: [
          {
            "owners": [
              {
                "id": 1,
                "firstName": "John",
                "lastName": "Smith",
                "email": "john.smith@example.com",
                "phone": "555-123-4567",
                "address": "123 Main St, Anytown, USA"
              }
            ]
          }
        ],
        properties: {
          owners: {
            type: "array",
            description: "List of pet owners with their contact information",
            items: {
              type: "object",
              properties: {
                id: { 
                  type: "number", 
                  description: "Unique numerical identifier for the owner",
                  examples: [1, 42] 
                },
                firstName: { 
                  type: "string", 
                  description: "Owner's first name",
                  examples: ["John", "Jane"] 
                },
                lastName: { 
                  type: "string", 
                  description: "Owner's last name",
                  examples: ["Smith", "Doe"] 
                },
                email: { 
                  type: "string", 
                  description: "Owner's email address for communications and login",
                  examples: ["john.smith@example.com"] 
                },
                phone: { 
                  type: "string", 
                  description: "Owner's phone number for urgent communications",
                  examples: ["555-123-4567"] 
                },
                address: { 
                  type: "string", 
                  description: "Owner's physical address",
                  examples: ["123 Main St, Anytown, USA"] 
                }
              }
            }
          }
        }
      },
      availability: {
        type: "object",
        description: "Information about service availability for specific dates and time slots. Used to check when services are available for booking and what capacity remains on each date.",
        examples: [
          {
            "serviceId": "grooming-deluxe",
            "startDate": "2025-05-01",
            "endDate": "2025-05-07",
            "availabilityInfo": [
              {
                "date": "2025-05-01",
                "available": true,
                "totalCapacity": 10,
                "bookedCount": 3,
                "remainingCapacity": 7,
                "timeSlots": [
                  { "time": "09:00", "available": true },
                  { "time": "10:00", "available": false },
                  { "time": "11:00", "available": true }
                ]
              }
            ]
          }
        ],
        properties: {
          serviceId: { 
            type: "string", 
            description: "ID of the service to check availability for",
            examples: ["grooming-deluxe", "boarding-standard"]
          },
          startDate: { 
            type: "string", 
            description: "Start date for the availability check in YYYY-MM-DD format",
            examples: ["2025-05-01"]
          },
          endDate: { 
            type: "string", 
            description: "End date for the availability check in YYYY-MM-DD format",
            examples: ["2025-05-07"]
          },
          availabilityInfo: {
            type: "array",
            description: "Daily availability information for the requested date range",
            items: {
              type: "object",
              properties: {
                date: { 
                  type: "string", 
                  description: "Date in YYYY-MM-DD format",
                  examples: ["2025-05-01"]
                },
                available: { 
                  type: "boolean", 
                  description: "Whether the service has any availability on this date",
                  examples: [true, false]
                },
                totalCapacity: { 
                  type: "number", 
                  description: "Total capacity for this service on this date",
                  examples: [10, 20]
                },
                bookedCount: { 
                  type: "number", 
                  description: "Number of bookings already confirmed for this date",
                  examples: [3, 15]
                },
                remainingCapacity: { 
                  type: "number", 
                  description: "Number of spots still available for booking",
                  examples: [7, 5, 0]
                },
                timeSlots: {
                  type: "array",
                  description: "For grooming services, the specific time slots available. Boarding services don't use time slots.",
                  items: {
                    type: "object",
                    properties: {
                      time: { 
                        type: "string", 
                        description: "Time slot in 24-hour format (HH:MM)",
                        examples: ["09:00", "14:30"]
                      },
                      available: { 
                        type: "boolean", 
                        description: "Whether this specific time slot is available for booking",
                        examples: [true, false]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // Constructor
  constructor() {
    log("MCP (Model Context Protocol) Provider initialized", "mcp");
  }

  // Get info about the provider
  public getInfo(): MCPProviderInfo {
    return this.info;
  }

  // Authenticate the request
  private async authenticate(auth?: { token?: string; apiKey?: string }): Promise<boolean> {
    // For development/testing, allow all requests
    // In production, you would implement proper authentication
    return true;
    
    // Original authentication logic:
    // if (!auth) return false;
    // if (auth.apiKey === "mcp-api-key-123") {
    //   return true;
    // }
    // return false;
  }

  // Process a context request
  public async getContext(req: MCPContextRequest): Promise<MCPContext> {
    const context: MCPContext = {};
    
    // Authenticate the request
    const isAuthenticated = await this.authenticate(req.authentication);
    if (!isAuthenticated) {
      context["error"] = {
        type: "error",
        value: {
          message: "Authentication failed",
          code: 401
        }
      };
      return context;
    }
    
    // Get requested contexts or all contexts if none specified
    const requestedContexts = req.contexts || Object.keys(this.info.contextSchema);
    
    // Process each requested context
    for (const contextKey of requestedContexts) {
      try {
        if (contextKey === "services") {
          context["services"] = await this.getServicesContext(req.parameters);
        } else if (contextKey === "bookings") {
          context["bookings"] = await this.getBookingsContext(req.parameters);
        } else if (contextKey === "pets") {
          context["pets"] = await this.getPetsContext(req.parameters);
        } else if (contextKey === "owners") {
          context["owners"] = await this.getOwnersContext(req.parameters);
        } else if (contextKey === "availability") {
          context["availability"] = await this.getAvailabilityContext(req.parameters);
        } else {
          // Unknown context type
          context[contextKey] = {
            type: "error",
            value: {
              message: `Unknown context type: ${contextKey}`,
              code: 400
            }
          };
        }
      } catch (error) {
        // Handle errors in context retrieval
        context[contextKey] = {
          type: "error",
          value: {
            message: `Error retrieving ${contextKey} context: ${error instanceof Error ? error.message : 'Unknown error'}`,
            code: 500
          }
        };
      }
    }
    
    return context;
  }

  // Get services context
  private async getServicesContext(params?: Record<string, any>): Promise<MCPContextValue> {
    const services = await storage.getServices();
    
    // Filter by category if specified
    let filteredServices = services;
    if (params?.category) {
      filteredServices = services.filter(s => s.category === params.category);
    }
    
    return {
      type: "services",
      value: {
        services: filteredServices.map(s => ({
          serviceId: s.serviceId,
          name: s.name,
          description: s.description,
          price: s.price,
          priceUnit: s.priceUnit,
          category: s.category,
          durationInMinutes: s.durationInMinutes,
          capacity: s.capacity,
          isArchived: s.isArchived
        }))
      }
    };
  }

  // Get bookings context
  private async getBookingsContext(params?: Record<string, any>): Promise<MCPContextValue> {
    let bookings = await storage.getBookings();
    
    // Filter by status if specified
    if (params?.status) {
      bookings = bookings.filter(b => b.status === params.status);
    }
    
    // Filter by owner ID if specified
    if (params?.ownerId) {
      bookings = bookings.filter(b => b.ownerId === Number(params.ownerId));
    }
    
    // Filter by pet ID if specified
    if (params?.petId) {
      bookings = bookings.filter(b => b.petId === Number(params.petId));
    }
    
    // Filter by date range if specified
    if (params?.startDate) {
      const startDate = new Date(params.startDate);
      bookings = bookings.filter(b => new Date(b.startDate) >= startDate);
    }
    
    if (params?.endDate) {
      const endDate = new Date(params.endDate);
      bookings = bookings.filter(b => new Date(b.endDate || b.startDate) <= endDate);
    }
    
    return {
      type: "bookings",
      value: {
        bookings: bookings.map(b => ({
          bookingId: b.bookingId,
          serviceId: b.serviceId,
          startDate: b.startDate?.toISOString(),
          startTime: b.startTime,
          endDate: b.endDate?.toISOString(),
          endTime: b.endTime,
          totalPrice: b.totalPrice,
          status: b.status,
          petId: b.petId,
          ownerId: b.ownerId,
          createdAt: b.createdAt?.toISOString()
        }))
      }
    };
  }

  // Get pets context
  private async getPetsContext(params?: Record<string, any>): Promise<MCPContextValue> {
    let pets;
    
    // Get all pets or filter by owner
    if (params?.ownerId) {
      pets = await storage.getPetsByOwnerId(Number(params.ownerId));
    } else {
      pets = await storage.getAllPets();
    }
    
    // Filter by vaccination status if specified
    if (params?.isVaccinated !== undefined) {
      const isVaccinated = params.isVaccinated === true || params.isVaccinated === "true";
      pets = pets.filter(p => p.isVaccinated === isVaccinated);
    }
    
    return {
      type: "pets",
      value: {
        pets: pets.map(p => ({
          id: p.id,
          name: p.name,
          breed: p.breed,
          age: p.age,
          weight: p.weight,
          gender: p.gender,
          specialNeeds: p.specialNeeds,
          isVaccinated: p.isVaccinated,
          ownerId: p.ownerId,
          vetName: p.vetName,
          vetPhone: p.vetPhone,
          vetAddress: p.vetAddress,
          vetLastVisit: p.vetLastVisit?.toISOString(),
          medicalHistory: p.medicalHistory,
          medicationInstructions: p.medicationInstructions,
          dietaryRestrictions: p.dietaryRestrictions,
          behavioralNotes: p.behavioralNotes
        }))
      }
    };
  }

  // Get owners context
  private async getOwnersContext(params?: Record<string, any>): Promise<MCPContextValue> {
    let owners;
    
    // Get specific owner or all owners
    if (params?.ownerId) {
      const owner = await storage.getOwner(Number(params.ownerId));
      owners = owner ? [owner] : [];
    } else if (params?.email) {
      const owner = await storage.getOwnerByEmail(params.email);
      owners = owner ? [owner] : [];
    } else {
      owners = await storage.getAllOwners();
    }
    
    return {
      type: "owners",
      value: {
        owners: owners.map(o => ({
          id: o.id,
          firstName: o.firstName,
          lastName: o.lastName,
          email: o.email,
          phone: o.phone,
          address: o.address
        }))
      }
    };
  }

  // Get availability context
  private async getAvailabilityContext(params?: Record<string, any>): Promise<MCPContextValue> {
    if (!params?.serviceId || !params?.startDate || !params?.endDate) {
      return {
        type: "error",
        value: {
          message: "Missing required parameters: serviceId, startDate, endDate",
          code: 400
        }
      };
    }
    
    const { serviceId, startDate, endDate } = params;
    const availability = await storage.getServiceAvailability(serviceId, startDate, endDate);
    
    return {
      type: "availability",
      value: {
        serviceId,
        startDate,
        endDate,
        availabilityInfo: availability.map(a => ({
          date: a.date,
          available: a.available,
          totalCapacity: a.totalCapacity,
          bookedCount: a.bookedCount,
          remainingCapacity: a.remainingCapacity,
          timeSlots: a.timeSlots
        }))
      }
    };
  }
}

// Action request types and interfaces
interface MCPActionRequest {
  action: string;
  parameters: Record<string, any>;
  authentication?: {
    token?: string;
    apiKey?: string;
  };
}

interface MCPToolRequest {
  tool: string;
  parameters: Record<string, any>;
  authentication?: {
    token?: string;
    apiKey?: string;
  };
}

interface MCPMessageRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    name?: string;
  }>;
  tools?: Array<{
    name: string;
    parameters: Record<string, any>;
  }>;
  authentication?: {
    token?: string;
    apiKey?: string;
  };
  /**
   * Optional session identifier to maintain continuity across multiple calls.
   * This value will be passed through to the response to connect queries with responses.
   */
  sessionId?: string;
}

interface MCPActionResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

// Available action types
enum ActionType {
  // Booking actions
  CREATE_BOOKING = 'create_booking',
  BOOK_APPOINTMENT = 'book_appointment',
  UPDATE_BOOKING_STATUS = 'update_booking_status',
  
  // Availability actions
  CHECK_AVAILABILITY = 'check_availability',
  
  // Owner actions
  CREATE_OWNER = 'create_owner',
  CREATE_CUSTOMER = 'create_customer',
  UPDATE_OWNER = 'update_owner',
  
  // Pet actions
  CREATE_PET = 'create_pet',
  ADD_PET = 'add_pet',
  UPDATE_PET = 'update_pet'
}

// Action handler class
class ModelContextActions {
  // Process an action request
  public async performAction(req: MCPActionRequest): Promise<MCPActionResponse> {
    try {
      switch(req.action) {
        case ActionType.CREATE_BOOKING:
        case ActionType.BOOK_APPOINTMENT:
          return await this.createBooking(req.parameters);
        
        case ActionType.UPDATE_BOOKING_STATUS:
          return await this.updateBookingStatus(req.parameters);
          
        case ActionType.CHECK_AVAILABILITY:
          return await this.checkAvailability(req.parameters);
          
        case ActionType.CREATE_OWNER:
        case ActionType.CREATE_CUSTOMER:
          return await this.createOwner(req.parameters);
          
        case ActionType.UPDATE_OWNER:
          return await this.updateOwner(req.parameters);
          
        case ActionType.CREATE_PET:
        case ActionType.ADD_PET:
          return await this.createPet(req.parameters);
          
        case ActionType.UPDATE_PET:
          return await this.updatePet(req.parameters);
          
        default:
          return {
            success: false,
            error: {
              code: "unknown_action",
              message: `Unknown action: ${req.action}`
            }
          };
      }
    } catch (error) {
      log(`Error in MCP action: ${error instanceof Error ? error.message : 'Unknown error'}`, "mcp");
      return {
        success: false,
        error: {
          code: "action_error",
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }
  
  // Individual action implementations
  private async createBooking(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { serviceId, startDate, startTime, endDate, endTime, pet, owner, selectedPetId } = params;
      
      if (!serviceId || !startDate || !pet || !owner) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameters missing. Need serviceId, startDate, pet, and owner details."
          }
        };
      }
      
      // Verify the service exists
      const service = await storage.getServiceByServiceId(serviceId);
      if (!service) {
        return {
          success: false,
          error: {
            code: "service_not_found",
            message: "The requested service was not found."
          }
        };
      }
      
      // Check if the owner already exists or create them
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
        // Verify the pet exists and belongs to the owner
        const existingPet = await storage.getPet(selectedPetId);
        if (!existingPet) {
          return {
            success: false,
            error: {
              code: "pet_not_found",
              message: "The selected pet was not found."
            }
          };
        }
        
        // Verify the pet belongs to this owner
        if (existingPet.ownerId !== ownerId) {
          return {
            success: false,
            error: {
              code: "pet_owner_mismatch",
              message: "The selected pet does not belong to this owner."
            }
          };
        }
        
        petId = selectedPetId;
      } else {
        // No existing pet selected, create a new one
        const petWithOwner = { ...pet, ownerId };
        const newPet = await storage.createPet(petWithOwner);
        petId = newPet.id;
      }
      
      // Calculate total price
      let totalPrice: number;
      if (service.category === "boarding" && endDate) {
        // Calculate number of nights for boarding
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalPrice = service.price * nights;
      } else {
        // For grooming, just use the base price
        totalPrice = service.price;
      }
      
      // Generate a booking ID
      const bookingId = `BOK-${Math.floor(Math.random() * 90000000 + 10000000)}`;
      
      // Create the booking
      const bookingData = {
        bookingId,
        serviceId,
        startDate: new Date(startDate),
        startTime,
        endDate: endDate ? new Date(endDate) : undefined,
        endTime,
        totalPrice,
        status: "confirmed",
        petId,
        ownerId
      };
      
      const booking = await storage.createBooking(bookingData);
      
      return {
        success: true,
        data: {
          booking_id: booking.bookingId,
          status: booking.status,
          service_id: booking.serviceId,
          start_date: booking.startDate,
          total_price: booking.totalPrice,
          pet_id: booking.petId,
          owner_id: booking.ownerId
        }
      };
    } catch (error) {
      log(`Error creating booking via MCP: ${error instanceof Error ? error.message : 'Unknown error'}`, "mcp");
      return {
        success: false,
        error: {
          code: "booking_creation_failed",
          message: "Failed to create booking"
        }
      };
    }
  }
  
  private async updateBookingStatus(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { bookingId, status } = params;
      
      if (!bookingId || !status) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameters missing. Need bookingId and status."
          }
        };
      }
      
      // Validate status
      if (!["confirmed", "cancelled", "completed"].includes(status)) {
        return {
          success: false,
          error: {
            code: "invalid_status",
            message: "Status must be one of: confirmed, cancelled, completed"
          }
        };
      }
      
      const booking = await storage.updateBookingStatus(bookingId, status);
      
      if (!booking) {
        return {
          success: false,
          error: {
            code: "booking_not_found",
            message: "The requested booking was not found."
          }
        };
      }
      
      return {
        success: true,
        data: { 
          booking_id: booking.bookingId,
          status: booking.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "status_update_failed",
          message: "Failed to update booking status"
        }
      };
    }
  }
  
  private async checkAvailability(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { serviceId, startDate, endDate } = params;
      
      if (!serviceId || !startDate) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameters missing. Need serviceId and startDate. endDate is optional for single-day services."
          }
        };
      }
      
      // Check if service exists
      const service = await storage.getServiceByServiceId(serviceId);
      if (!service) {
        return {
          success: false,
          error: {
            code: "service_not_found",
            message: "The requested service was not found."
          }
        };
      }
      
      const availability = await storage.getServiceAvailability(
        serviceId, 
        startDate, 
        endDate || startDate  // If no endDate, check only startDate
      );
      
      return {
        success: true,
        data: {
          serviceId,
          startDate,
          endDate: endDate || startDate,
          availability
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "availability_check_failed",
          message: "Failed to check availability"
        }
      };
    }
  }
  
  private async createOwner(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { firstName, lastName, email, phone, address } = params;
      
      if (!firstName || !lastName || !email) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameters missing. Need at least firstName, lastName, and email."
          }
        };
      }
      
      // Check if owner already exists
      const existingOwner = await storage.getOwnerByEmail(email);
      if (existingOwner) {
        return {
          success: false,
          error: {
            code: "owner_already_exists",
            message: "An owner with this email already exists."
          }
        };
      }
      
      const ownerData = { firstName, lastName, email, phone, address };
      const owner = await storage.createOwner(ownerData);
      
      return {
        success: true,
        data: { 
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "owner_creation_failed",
          message: "Failed to create owner"
        }
      };
    }
  }
  
  private async updateOwner(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { id, ...updateData } = params;
      
      if (!id) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameter missing: id"
          }
        };
      }
      
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: {
            code: "missing_update_data",
            message: "No fields provided to update"
          }
        };
      }
      
      // Check if owner exists
      const existingOwner = await storage.getOwner(id);
      if (!existingOwner) {
        return {
          success: false,
          error: {
            code: "owner_not_found",
            message: "The owner was not found."
          }
        };
      }
      
      // If updating email, check for duplicates
      if (updateData.email && updateData.email !== existingOwner.email) {
        const ownerWithSameEmail = await storage.getOwnerByEmail(updateData.email);
        if (ownerWithSameEmail) {
          return {
            success: false,
            error: {
              code: "email_already_exists",
              message: "Another owner is already using this email address."
            }
          };
        }
      }
      
      const updatedOwner = await storage.updateOwner(id, updateData);
      
      return {
        success: true,
        data: updatedOwner
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "owner_update_failed",
          message: "Failed to update owner"
        }
      };
    }
  }
  
  private async createPet(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { name, breed, ownerId, age, weight, gender, ...otherData } = params;
      
      if (!name || !ownerId) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameters missing. Need at least name and ownerId."
          }
        };
      }
      
      // Check if owner exists
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return {
          success: false,
          error: {
            code: "owner_not_found",
            message: "The owner was not found."
          }
        };
      }
      
      // Prepare pet data with required fields and defaults
      const petData = { 
        name, 
        ownerId: Number(ownerId),
        breed: breed || "Unknown", 
        age: age || 0,
        weight: weight || 0,
        gender: gender || "unknown",
        ...otherData 
      };
      
      const pet = await storage.createPet(petData);
      
      return {
        success: true,
        data: pet
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "pet_creation_failed",
          message: "Failed to create pet"
        }
      };
    }
  }
  
  private async updatePet(params: Record<string, any>): Promise<MCPActionResponse> {
    try {
      const { id, ...updateData } = params;
      
      if (!id) {
        return {
          success: false,
          error: {
            code: "missing_parameters",
            message: "Required parameter missing: id"
          }
        };
      }
      
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: {
            code: "missing_update_data",
            message: "No fields provided to update"
          }
        };
      }
      
      // Check if pet exists
      const existingPet = await storage.getPet(id);
      if (!existingPet) {
        return {
          success: false,
          error: {
            code: "pet_not_found",
            message: "The pet was not found."
          }
        };
      }
      
      const updatedPet = await storage.updatePet(id, updateData);
      
      return {
        success: true,
        data: updatedPet
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "pet_update_failed",
          message: "Failed to update pet"
        }
      };
    }
  }
}

// Create router for MCP endpoints
export function createMCPRouter(): Router {
  const router = Router();
  const mcpProvider = new ModelContextProvider();
  const mcpActions = new ModelContextActions();

  // Info endpoint
  router.get("/info", (req: Request, res: Response) => {
    const info = mcpProvider.getInfo();
    
    // Add API status information
    const apiStatus = {
      apis: {
        services: { status: "VERIFIED", endpoints: ["/api/services", "/api/services/:serviceId"] },
        availability: { status: "VERIFIED", endpoints: ["/api/availability/:serviceId"] },
        bookings: { status: "VERIFIED", endpoints: ["/api/bookings", "/api/bookings/:bookingId", "/api/bookings/:bookingId/status"] },
        owners: { status: "VERIFIED", endpoints: ["/api/owners", "/api/owners/:id"] },
        pets: { status: "VERIFIED", endpoints: ["/api/pets", "/api/pets/:id"] }
      }
    };
    
    res.json({ ...info, ...apiStatus });
  });

  // Environment variable to control whether SSE is enabled
  // Set to 'false' by default to reduce resource consumption
  const SSE_ENABLED = process.env.MCP_ENABLE_SSE === 'true';

  // Handle preflight OPTIONS request for SSE endpoint
  router.options("/context-stream", (req: Request, res: Response) => {
    // If SSE is disabled, return a clear message
    if (!SSE_ENABLED) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(410).json({
        error: "SSE endpoints have been disabled to reduce resource consumption.",
        message: "Please use the standard HTTP endpoints instead.",
        alternative: "/api/mcp/context",
        enable_instructions: "Set MCP_ENABLE_SSE=true to enable this feature"
      });
    }
    // Accept all origins for easier cross-domain integration with n8n and other tools
    const origin = req.headers.origin || '*';
    
    // Set CORS headers with broader compatibility
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, apiKey, x-api-key, X-Custom-Header, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // No content needed for OPTIONS response
    res.sendStatus(204);
  });

  // SSE Context Stream endpoint - enhanced for better n8n integration
  router.get("/context-stream", async (req: Request, res: Response) => {
    // If SSE is disabled, return a clear message
    if (!SSE_ENABLED) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(410).json({
        error: "SSE endpoints have been disabled to reduce resource consumption.",
        message: "Please use the standard HTTP endpoints instead.",
        alternative: "/api/mcp/context",
        enable_instructions: "Set MCP_ENABLE_SSE=true to enable this feature"
      });
    }
    try {
      // Get the origin for CORS
      const origin = req.headers.origin || '*';
      
      // Set headers for SSE with enhanced compatibility
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Prevents proxy buffering
      
      // Enhanced CORS headers for SSE connections
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, apiKey, x-api-key, X-Custom-Header, X-Requested-With, Accept');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // Parse query parameters with better error handling
      let contexts: string[] = [];
      let parameters: Record<string, any> = {};
      
      try {
        contexts = req.query.contexts ? (req.query.contexts as string).split(',') : [];
        
        if (req.query.parameters) {
          try {
            parameters = JSON.parse(req.query.parameters as string);
          } catch (parseError) {
            log(`Warning: Failed to parse parameters JSON: ${req.query.parameters}`, "mcp");
            // Continue with empty parameters rather than failing
          }
        }
      } catch (paramError) {
        log(`Error parsing query parameters: ${paramError instanceof Error ? paramError.message : 'Unknown error'}`, "mcp");
        // Continue with default values rather than failing the whole request
      }
      
      // Enhanced API key detection for multiple integration scenarios
      let apiKey: string | null = null;
      
      // 1. From query parameters (standard approach)
      if (req.query.apiKey) {
        apiKey = req.query.apiKey as string;
      }
      
      // 2. From headers (lowercase and standard case for maximum compatibility)
      if (!apiKey) {
        // Check multiple header variations for maximum compatibility
        const apiKeyHeaderVariations = ['apikey', 'api-key', 'x-api-key'];
        for (const headerName of apiKeyHeaderVariations) {
          const headerValue = req.headers[headerName];
          if (headerValue) {
            apiKey = headerValue as string;
            break;
          }
        }
      }
      
      // 3. From Authorization header with Bearer token
      if (!apiKey && req.headers.authorization) {
        const authHeader = req.headers.authorization as string;
        if (authHeader.startsWith('Bearer ')) {
          apiKey = authHeader.substring(7);
        }
      }
      
      // Enhanced logging for connection events with metadata
      const connectionId = Math.random().toString(36).substring(2, 10);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      log(`SSE [${connectionId}]: Client connected. Contexts: ${contexts.join(', ')}`, "mcp");
      log(`SSE [${connectionId}]: Client info - IP: ${clientIp}, Auth: ${apiKey ? 'API Key' : 'None'}, UA: ${userAgent}`, "mcp");
      
      // Additional logging for n8n and workflow tool detection
      if (userAgent.includes('n8n') || userAgent.includes('workflow')) {
        log(`SSE [${connectionId}]: Workflow tool detected! Optimizing connection for automation use.`, "mcp");
      }
      
      // Create authentication object
      const authentication = apiKey ? { apiKey } : undefined;
      
      // Setup connection monitoring and heartbeats
      let isClientConnected = true;
      
      // Dual-frequency heartbeat mechanism for more reliable connections:
      // 1. Comment heartbeat: More frequent, invisible to EventSource API
      // 2. Ping event: Less frequent, visible to event handlers
      const commentHeartbeat = setInterval(() => {
        if (!isClientConnected) return;
        try {
          res.write(': heartbeat\n\n');
        } catch (err) {
          isClientConnected = false;
          log(`SSE [${connectionId}]: Error sending comment heartbeat`, "mcp");
        }
      }, 5000); // Every 5 seconds - increased frequency for better reliability
      
      const pingHeartbeat = setInterval(() => {
        if (!isClientConnected) return;
        try {
          res.write(`event: ping\n`);
          res.write(`data: ${JSON.stringify({ 
            timestamp: new Date().toISOString(),
            connectionId
          })}\n\n`);
        } catch (err) {
          isClientConnected = false;
          log(`SSE [${connectionId}]: Error sending ping heartbeat`, "mcp");
        }
      }, 30000); // Every 30 seconds
      
      // Handle client disconnect with enhanced logging
      req.on('close', () => {
        isClientConnected = false;
        clearInterval(commentHeartbeat);
        clearInterval(pingHeartbeat);
        log(`SSE [${connectionId}]: Client disconnected`, "mcp");
      });
      
      // Enhanced helper function to safely send SSE events with detailed logging
      const sendEvent = (eventType: string, data: any): boolean => {
        if (!isClientConnected) {
          log(`SSE [${connectionId}]: Cannot send ${eventType} event - client disconnected`, "mcp");
          return false;
        }
        
        // Log the event being sent
        log(`SSE [${connectionId}]: Sending ${eventType} event with data: ${JSON.stringify(data)}`, "mcp");
        
        try {
          // Construct the event manually to ensure proper format
          const eventString = `event: ${eventType}\n`;
          const dataString = `data: ${JSON.stringify(data)}\n\n`;
          
          // Log the raw event string being sent (for debugging)
          log(`SSE [${connectionId}]: Raw event string: "${eventString.trim()}"`, "mcp");
          log(`SSE [${connectionId}]: Raw data string: "${dataString.replace(/\n\n$/, '')}"`, "mcp");
          
          // Send the event
          res.write(eventString);
          res.write(dataString);
          
          // Try to flush if possible (need to use type casting for Express Response)
          const response = res as any;
          if (response.flush && typeof response.flush === 'function') {
            response.flush();
            log(`SSE [${connectionId}]: Flushed response after sending ${eventType} event`, "mcp");
          }
          
          log(`SSE [${connectionId}]: Successfully sent ${eventType} event`, "mcp");
          return true;
        } catch (err) {
          isClientConnected = false;
          log(`SSE [${connectionId}]: ERROR SENDING ${eventType.toUpperCase()} EVENT: ${err instanceof Error ? err.message : 'Unknown error'}`, "mcp");
          if (err instanceof Error && err.stack) {
            log(`SSE [${connectionId}]: Error stack: ${err.stack}`, "mcp");
          }
          return false;
        }
      };
      
      // Send initial connection info with metadata
      sendEvent('info', { 
        message: 'MCP SSE Connection Established',
        connectionId,
        timestamp: new Date().toISOString(),
        contextsRequested: contexts
      });
      
      // Process requested contexts sequentially
      for (const contextName of contexts) {
        if (!isClientConnected) break;
        
        try {
          log(`SSE [${connectionId}]: Fetching context '${contextName}'`, "mcp");
          
          const contextRequest: MCPContextRequest = {
            contexts: [contextName],
            parameters,
            authentication
          };
          
          const context = await mcpProvider.getContext(contextRequest);
          
          if (context[contextName]) {
            // Send data event for this context
            sendEvent('context', { 
              contextName,
              data: context[contextName],
              timestamp: new Date().toISOString()
            });
            
            log(`SSE [${connectionId}]: Successfully sent context '${contextName}'`, "mcp");
          } else if (context.error) {
            // Handle error from context provider
            sendEvent('error', {
              contextName,
              error: context.error.value.message || "Unknown error",
              code: context.error.value.code || 500,
              timestamp: new Date().toISOString()
            });
            
            log(`SSE [${connectionId}]: Error fetching context '${contextName}': ${context.error.value.message}`, "mcp");
          }
        } catch (contextError) {
          // Send detailed error information for this specific context
          sendEvent('error', { 
            contextName,
            error: contextError instanceof Error ? contextError.message : "Unknown error",
            errorType: contextError instanceof Error ? contextError.constructor.name : 'Unknown',
            timestamp: new Date().toISOString(),
            recoverable: true
          });
          
          log(`SSE [${connectionId}]: Exception while fetching context '${contextName}': ${contextError instanceof Error ? contextError.message : 'Unknown error'}`, "mcp");
        }
      }
      
      // Only send completion event if client is still connected
      if (isClientConnected) {
        // Enhanced logging for completion event
        log(`SSE [${connectionId}]: Preparing to send completion event for contexts: ${contexts.join(', ')}`, "mcp");
        
        // Create complete event data with detailed metadata
        const completeEventData = { 
          message: 'All requested contexts have been streamed',
          contextsProcessed: contexts,
          timestamp: new Date().toISOString(),
          connectionId,
          totalContextsProcessed: contexts.length
        };
        
        // Log the exact data being sent for debugging
        log(`SSE [${connectionId}]: Complete event data: ${JSON.stringify(completeEventData)}`, "mcp");
        
        // Attempt to send the complete event with enhanced error handling
        try {
          // Send event with direct write for maximum control
          res.write(`event: complete\n`);
          res.write(`data: ${JSON.stringify(completeEventData)}\n\n`);
          
          // Force flush the response to ensure data is sent immediately
          const completeResponse = res as any;
          if (completeResponse.flush && typeof completeResponse.flush === 'function') {
            completeResponse.flush();
          }
          
          log(`SSE [${connectionId}]: Successfully sent complete event`, "mcp");
          
          // Follow-up with a confirmation ping to ensure connection is still alive
          setTimeout(() => {
            if (isClientConnected) {
              try {
                res.write(`event: ping\n`);
                res.write(`data: ${JSON.stringify({ 
                  message: 'Post-completion confirmation ping',
                  timestamp: new Date().toISOString(),
                  connectionId
                })}\n\n`);
                
                const pingResponse = res as any;
                if (pingResponse.flush && typeof pingResponse.flush === 'function') {
                  pingResponse.flush();
                }
                
                log(`SSE [${connectionId}]: Post-completion ping sent successfully`, "mcp");
              } catch (err) {
                log(`SSE [${connectionId}]: Error sending post-completion ping: ${err instanceof Error ? err.message : 'Unknown error'}`, "mcp");
              }
            }
          }, 1000); // 1 second after completion
        } catch (completeError) {
          log(`SSE [${connectionId}]: ERROR SENDING COMPLETE EVENT: ${completeError instanceof Error ? completeError.message : 'Unknown error'}`, "mcp");
          if (completeError instanceof Error && completeError.stack) {
            log(`SSE [${connectionId}]: Complete event error stack: ${completeError.stack}`, "mcp");
          }
        }
      } else {
        log(`SSE [${connectionId}]: Client disconnected before complete event could be sent`, "mcp");
      }
      
    } catch (error) {
      // Log detailed error information about the overall request
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : '';
      
      log(`SSE Error: ${errorMessage}`, "mcp");
      if (errorStack) {
        log(`SSE Error stack: ${errorStack}`, "mcp");
      }
      
      try {
        // Send detailed error event to the client
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ 
          error: errorMessage,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          timestamp: new Date().toISOString(),
          recoverable: false
        })}\n\n`);
        
        // Try to keep the connection alive despite the error
        res.write(`event: recovery\n`);
        res.write(`data: ${JSON.stringify({ 
          message: 'The server encountered an error but is attempting to maintain the connection',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (writeError) {
        log(`SSE Error: Could not send error information to client: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`, "mcp");
      }
    }
  });

  // Legacy Context endpoint (maintain backwards compatibility)
  router.post("/context", async (req: Request, res: Response) => {
    try {
      const contextRequest: MCPContextRequest = req.body;
      const context = await mcpProvider.getContext(contextRequest);
      res.json(context);
    } catch (error) {
      log(`Error in MCP context endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`, "mcp");
      res.status(500).json({
        error: {
          type: "error",
          value: {
            message: "Internal server error processing MCP context request",
            code: 500
          }
        }
      });
    }
  });
  
  // Action endpoint
  router.post("/actions", async (req: Request, res: Response) => {
    try {
      const actionRequest: MCPActionRequest = req.body;
      
      if (!actionRequest.action) {
        return res.status(400).json({
          success: false,
          error: {
            code: "missing_action",
            message: "Action parameter is required"
          }
        });
      }
      
      const result = await mcpActions.performAction(actionRequest);
      
      if (!result.success) {
        // If there's an error that maps to an HTTP status code, use it
        let statusCode = 500;
        if (result.error?.code === "missing_parameters") statusCode = 400;
        if (result.error?.code === "service_not_found") statusCode = 404;
        if (result.error?.code === "booking_not_found") statusCode = 404;
        if (result.error?.code === "pet_not_found") statusCode = 404;
        if (result.error?.code === "owner_not_found") statusCode = 404;
        if (result.error?.code === "unknown_action") statusCode = 400;
        if (result.error?.code === "invalid_status") statusCode = 400;
        
        return res.status(statusCode).json(result);
      }
      
      res.json(result);
    } catch (error) {
      log(`Error in MCP action endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`, "mcp");
      res.status(500).json({
        success: false,
        error: {
          code: "internal_server_error",
          message: "Internal server error processing MCP action"
        }
      });
    }
  });
  
  // Documentation endpoint for actions
  router.get("/actions", (req: Request, res: Response) => {
    res.json({
      available_actions: Object.values(ActionType),
      documentation: {
        [ActionType.CREATE_BOOKING]: {
          description: "Create a new booking for a service",
          status: "VERIFIED",
          parameters: {
            serviceId: "ID of the service to book",
            startDate: "Start date for the booking (YYYY-MM-DD)",
            startTime: "Start time for the booking (HH:MM) - for grooming services",
            endDate: "End date for the booking (YYYY-MM-DD) - required for boarding services",
            endTime: "End time for the booking (HH:MM) - for grooming services",
            pet: "Pet details object for creating a new pet or selectedPetId for existing pets",
            owner: "Owner details object (will use existing owner if email matches)",
            selectedPetId: "Optional ID of an existing pet to use for booking"
          },
          example: {
            "action": "create_booking",
            "parameters": {
              "serviceId": "grooming-deluxe",
              "startDate": "2025-05-01",
              "startTime": "10:00",
              "pet": {
                "name": "Max",
                "breed": "Golden Retriever",
                "age": 3,
                "weight": 65.5,
                "gender": "male",
                "isVaccinated": true
              },
              "owner": {
                "firstName": "John",
                "lastName": "Smith",
                "email": "john.smith@example.com",
                "phone": "555-123-4567"
              }
            }
          }
        },
        [ActionType.UPDATE_BOOKING_STATUS]: {
          description: "Update the status of an existing booking",
          status: "VERIFIED",
          parameters: {
            bookingId: "ID of the booking to update",
            status: "New status (confirmed, cancelled, or completed)"
          },
          example: {
            "action": "update_booking_status",
            "parameters": {
              "bookingId": "BOK-12345678",
              "status": "completed"
            }
          }
        },
        [ActionType.CHECK_AVAILABILITY]: {
          description: "Check availability for a service on specific dates",
          status: "VERIFIED",
          parameters: {
            serviceId: "ID of the service to check",
            startDate: "Start date to check (YYYY-MM-DD)",
            endDate: "Optional end date for a range check (YYYY-MM-DD)"
          },
          example: {
            "action": "check_availability",
            "parameters": {
              "serviceId": "boarding-standard",
              "startDate": "2025-05-01",
              "endDate": "2025-05-07"
            }
          }
        },
        [ActionType.CREATE_OWNER]: {
          description: "Create a new pet owner",
          status: "VERIFIED",
          parameters: {
            firstName: "Owner's first name",
            lastName: "Owner's last name",
            email: "Owner's email address",
            phone: "Owner's phone number",
            address: "Owner's address"
          },
          example: {
            "action": "create_owner",
            "parameters": {
              "firstName": "Jane",
              "lastName": "Doe",
              "email": "jane.doe@example.com",
              "phone": "555-987-6543",
              "address": "456 Oak St, Anytown, USA"
            }
          }
        },
        [ActionType.UPDATE_OWNER]: {
          description: "Update an existing pet owner's information",
          status: "VERIFIED",
          parameters: {
            id: "ID of the owner to update",
            firstName: "Optional new first name",
            lastName: "Optional new last name",
            email: "Optional new email address",
            phone: "Optional new phone number",
            address: "Optional new address"
          },
          example: {
            "action": "update_owner",
            "parameters": {
              "id": 1,
              "phone": "555-111-2222",
              "address": "789 Pine St, Newtown, USA"
            }
          }
        },
        [ActionType.CREATE_PET]: {
          description: "Create a new pet for an existing owner",
          status: "VERIFIED",
          parameters: {
            name: "Pet's name",
            breed: "Pet's breed",
            ownerId: "ID of the pet's owner",
            age: "Optional pet's age in years",
            weight: "Optional pet's weight in pounds",
            gender: "Optional pet's gender",
            isVaccinated: "Optional vaccination status",
            specialNeeds: "Optional special care requirements"
          },
          example: {
            "action": "create_pet",
            "parameters": {
              "name": "Buddy",
              "breed": "Labrador Retriever",
              "ownerId": 1,
              "age": 2,
              "weight": 70.5,
              "gender": "male",
              "isVaccinated": true
            }
          }
        },
        [ActionType.UPDATE_PET]: {
          description: "Update an existing pet's information",
          status: "VERIFIED",
          parameters: {
            id: "ID of the pet to update",
            name: "Optional new name",
            age: "Optional new age",
            weight: "Optional new weight",
            isVaccinated: "Optional new vaccination status",
            specialNeeds: "Optional new special needs description"
          },
          example: {
            "action": "update_pet",
            "parameters": {
              "id": 1,
              "weight": 68.5,
              "isVaccinated": true,
              "specialNeeds": "Needs medication twice daily"
            }
          }
        }
      }
    });
  });
  
  // Handle preflight OPTIONS request for messages endpoint
  router.options("/messages", (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apiKey, x-api-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
  });
  
  // Options endpoint for messages (CORS pre-flight)
  router.options("/messages", (req: Request, res: Response) => {
    // Accept all origins for easier cross-domain integration with n8n and other tools
    const origin = req.headers.origin || '*';
    
    // Set CORS headers with broader compatibility
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, apiKey, api-key, x-api-key, X-Custom-Header, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // No content needed for OPTIONS response
    res.sendStatus(204);
  });

  // Messages endpoint for n8n agent communication - enhanced for better integration
  router.post("/messages", async (req: Request, res: Response) => {
    try {
      // Set CORS headers for all responses
      const origin = req.headers.origin || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Enhanced API key detection for multiple integration scenarios
      let apiKey: string | null = null;
      
      // 1. From query parameters (standard approach)
      if (req.query.apiKey) {
        apiKey = req.query.apiKey as string;
      }
      
      // 2. From headers (lowercase and standard case for maximum compatibility)
      if (!apiKey) {
        // Check multiple header variations for maximum compatibility
        const apiKeyHeaderVariations = ['apikey', 'api-key', 'x-api-key'];
        for (const headerName of apiKeyHeaderVariations) {
          const headerValue = req.headers[headerName];
          if (headerValue) {
            apiKey = headerValue as string;
            break;
          }
        }
      }
      
      // 3. From Authorization header with Bearer token
      let token: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        if (!apiKey) {
          apiKey = token; // Use token as apiKey if no other key is provided
        }
      }
      
      // 4. From request body authentication object
      if (!apiKey && req.body.authentication && req.body.authentication.apiKey) {
        apiKey = req.body.authentication.apiKey;
      }
      
      // Enhanced logging
      const requestId = Math.random().toString(36).substring(2, 10);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      log(`Messages [${requestId}]: Request received from ${clientIp}`, "mcp");
      
      // Log workflow tool detection
      if (userAgent.includes('n8n') || userAgent.includes('workflow')) {
        log(`Messages [${requestId}]: Workflow tool detected (${userAgent})`, "mcp");
      }
      
      if (!apiKey && !token) {
        log(`Messages [${requestId}]: Authentication failed - no API key or token provided`, "mcp");
        return res.status(401).json({
          success: false,
          error: {
            code: "unauthorized",
            message: "Authentication required"
          }
        });
      }
      
      const messageRequest: MCPMessageRequest = req.body;
      
      if (!messageRequest.messages || !Array.isArray(messageRequest.messages) || messageRequest.messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "invalid_request",
            message: "Messages array is required and must contain at least one message"
          }
        });
      }
      
      // Log the received message for debugging
      log(`MCP received message request: ${JSON.stringify(messageRequest.messages[messageRequest.messages.length - 1])}`, "mcp");
      
      // Handle tool use in messages
      if (messageRequest.tools && Array.isArray(messageRequest.tools) && messageRequest.tools.length > 0) {
        const toolResults = [];
        
        for (const tool of messageRequest.tools) {
          // Convert tool request to action request format
          const actionRequest: MCPActionRequest = {
            action: tool.name,
            parameters: tool.parameters,
            authentication: messageRequest.authentication
          };
          
          // Execute the action
          const result = await mcpActions.performAction(actionRequest);
          toolResults.push({
            tool: tool.name,
            result
          });
        }
        
        return res.json({
          success: true,
          tool_results: toolResults,
          ...(messageRequest.sessionId ? { sessionId: messageRequest.sessionId } : {})
        });
      }
      
      // If no tools were specified, respond with available tools
      const tools = mcpProvider.getInfo().tools;
      
      // For standard messages without tools, provide a basic response with available tools
      return res.json({
        message: "Message received. Use available tools to perform actions.",
        available_tools: tools,
        ...(messageRequest && messageRequest.sessionId ? { sessionId: messageRequest.sessionId } : {})
      });
    } catch (error) {
      log(`Error in MCP messages endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`, "mcp");
      // In the error case, we might not have access to messageRequest if parsing failed
      const errorResponse: any = {
        success: false,
        error: {
          code: "server_error",
          message: "Failed to process message request"
        }
      };
      
      // Only add sessionId if we were able to parse it from the request
      try {
        if (req.body?.sessionId) {
          errorResponse.sessionId = req.body.sessionId;
        }
      } catch (e) {
        // Silently ignore if we can't access sessionId
      }
      
      return res.status(500).json(errorResponse);
    }
  });

  return router;
}