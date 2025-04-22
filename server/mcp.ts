import { Server as IOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { log } from './vite';
import { storage } from './storage';

// Configuration for resource optimization
// Default to enabled if not explicitly set to 'false'
const WEBSOCKETS_ENABLED = process.env.MCP_ENABLE_WEBSOCKETS !== 'false';

// Message types for the MCP protocol
export enum MessageType {
  // System message types
  NOTIFICATION = 'notification',
  BOOKING_UPDATE = 'booking_update',
  AVAILABILITY_UPDATE = 'availability_update',
  STATUS_UPDATE = 'status_update',
  ERROR = 'error',
  
  // Operation types (for API-like operations)
  REQUEST = 'request',
  RESPONSE = 'response'
}

// Client roles for access control
export enum ClientRole {
  GUEST = 'guest',
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

// Map roles to numeric values for permission hierarchy
const RoleHierarchy = {
  [ClientRole.GUEST]: 0,
  [ClientRole.CUSTOMER]: 1,
  [ClientRole.ADMIN]: 2
};

// Interface for MCP messages
export interface MCPMessage {
  type: MessageType;
  payload: any;
  timestamp: string;
  requestId?: string; // For request-response pattern
}

// Operation types for API-like functionality
export enum OperationType {
  // Services
  GET_SERVICES = 'get_services',
  GET_SERVICE = 'get_service',
  
  // Availability
  GET_AVAILABILITY = 'get_availability',
  
  // Bookings
  CREATE_BOOKING = 'create_booking',
  GET_BOOKING = 'get_booking',
  GET_ALL_BOOKINGS = 'get_all_bookings',
  UPDATE_BOOKING_STATUS = 'update_booking_status',
  
  // Pets
  CREATE_PET = 'create_pet',
  GET_PET = 'get_pet',
  UPDATE_PET = 'update_pet',
  GET_PETS_BY_OWNER = 'get_pets_by_owner',
  GET_ALL_PETS = 'get_all_pets',
  
  // Owners
  CREATE_OWNER = 'create_owner',
  GET_OWNER = 'get_owner',
  GET_ALL_OWNERS = 'get_all_owners',
  UPDATE_OWNER = 'update_owner',
  
  // Bookings by relationship
  GET_BOOKINGS_BY_OWNER = 'get_bookings_by_owner',
  GET_BOOKINGS_BY_PET = 'get_bookings_by_pet'
}

// Interface for connected clients with role-based permissions
interface ConnectedClient {
  id: string;
  role: ClientRole;
  ownerId?: number; // For customers to only see their own data
}

export class MCPServer {
  private io: IOServer;
  private connectedClients: Map<string, ConnectedClient> = new Map();

  constructor(server: HTTPServer) {
    if (WEBSOCKETS_ENABLED) {
      // Initialize Socket.IO server
      this.io = new IOServer(server, {
        cors: {
          origin: "*", // In production, restrict to your domain
          methods: ["GET", "POST"]
        },
        path: '/socket.io' // Match the client's path
      });

      this.setupEventHandlers();
      log('MCP server initialized with WebSockets enabled', 'mcp');
    } else {
      // Create a limited no-op implementation when WebSockets are disabled
      this.io = {
        on: () => {},
        emit: () => {},
      } as any;
      log('MCP server initialized with WebSockets DISABLED to reduce resource usage', 'mcp');
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      log(`New client connected: ${socket.id}`, 'mcp');
      
      // Register client with default guest role
      this.connectedClients.set(socket.id, {
        id: socket.id,
        role: ClientRole.GUEST
      });

      // Handle authentication and role assignment
      socket.on('authenticate', async (data) => {
        try {
          if (data.adminKey === 'admin123') { // In production, use proper auth
            this.connectedClients.set(socket.id, {
              id: socket.id,
              role: ClientRole.ADMIN
            });
            socket.emit('auth_success', { role: ClientRole.ADMIN });
            log(`Client ${socket.id} authenticated as ADMIN`, 'mcp');
          } else if (data.ownerId) {
            // Verify if this owner exists
            const owner = await storage.getOwner(data.ownerId);
            if (owner) {
              this.connectedClients.set(socket.id, {
                id: socket.id,
                role: ClientRole.CUSTOMER,
                ownerId: owner.id
              });
              socket.emit('auth_success', { role: ClientRole.CUSTOMER });
              log(`Client ${socket.id} authenticated as CUSTOMER for owner ${owner.id}`, 'mcp');
            } else {
              socket.emit('auth_error', { message: 'Invalid owner ID' });
            }
          } else {
            socket.emit('auth_error', { message: 'Invalid authentication data' });
          }
        } catch (error: any) {
          socket.emit('auth_error', { message: 'Authentication failed' });
          log(`Authentication error for client ${socket.id}: ${error}`, 'mcp');
        }
      });

      // Handle subscription to booking updates
      socket.on('subscribe_booking_updates', (data) => {
        const client = this.connectedClients.get(socket.id);
        
        if (!client) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        if (client.role === ClientRole.ADMIN || 
           (client.role === ClientRole.CUSTOMER && client.ownerId === data.ownerId)) {
          // Join the room for this booking or owner
          if (data.bookingId) {
            socket.join(`booking:${data.bookingId}`);
            log(`Client ${socket.id} subscribed to booking ${data.bookingId}`, 'mcp');
          } else if (data.ownerId) {
            socket.join(`owner:${data.ownerId}`);
            log(`Client ${socket.id} subscribed to owner ${data.ownerId} updates`, 'mcp');
          }
        } else {
          socket.emit('error', { message: 'Permission denied' });
        }
      });

      // Handle MCP operation requests
      socket.on('mcp_request', async (request) => {
        const client = this.connectedClients.get(socket.id);
        if (!client) {
          this.sendErrorResponse(socket, request.requestId, 'Not authenticated');
          return;
        }

        try {
          log(`MCP request received from ${socket.id}: ${request.operation}`, 'mcp');
          
          // Handle the request based on operation type
          switch (request.operation) {
            // Service operations
            case OperationType.GET_SERVICES:
              await this.handleGetServices(socket, client, request);
              break;
            case OperationType.GET_SERVICE:
              await this.handleGetService(socket, client, request);
              break;
              
            // Availability operations  
            case OperationType.GET_AVAILABILITY:
              await this.handleGetAvailability(socket, client, request);
              break;
              
            // Booking operations  
            case OperationType.CREATE_BOOKING:
              await this.handleCreateBooking(socket, client, request);
              break;
            case OperationType.GET_BOOKING:
              await this.handleGetBooking(socket, client, request);
              break;
            case OperationType.GET_ALL_BOOKINGS:
              await this.handleGetAllBookings(socket, client, request);
              break;
            case OperationType.UPDATE_BOOKING_STATUS:
              await this.handleUpdateBookingStatus(socket, client, request);
              break;
              
            // Pet operations  
            case OperationType.CREATE_PET:
              await this.handleCreatePet(socket, client, request);
              break;
            case OperationType.GET_PET:
              await this.handleGetPet(socket, client, request);
              break;
            case OperationType.UPDATE_PET:
              await this.handleUpdatePet(socket, client, request);
              break;
            case OperationType.GET_PETS_BY_OWNER:
              await this.handleGetPetsByOwner(socket, client, request);
              break;
            case OperationType.GET_ALL_PETS:
              await this.handleGetAllPets(socket, client, request);
              break;
              
            // Owner operations  
            case OperationType.CREATE_OWNER:
              await this.handleCreateOwner(socket, client, request);
              break;
            case OperationType.GET_OWNER:
              await this.handleGetOwner(socket, client, request);
              break;
            case OperationType.GET_ALL_OWNERS:
              await this.handleGetAllOwners(socket, client, request);
              break;
            case OperationType.UPDATE_OWNER:
              await this.handleUpdateOwner(socket, client, request);
              break;
              
            // Bookings by relationship
            case OperationType.GET_BOOKINGS_BY_OWNER:
              await this.handleGetBookingsByOwner(socket, client, request);
              break;
            case OperationType.GET_BOOKINGS_BY_PET:
              await this.handleGetBookingsByPet(socket, client, request);
              break;
              
            default:
              this.sendErrorResponse(socket, request.requestId, `Unsupported operation: ${request.operation}`);
          }
        } catch (error) {
          log(`Error handling MCP request: ${error}`, 'mcp');
          this.sendErrorResponse(socket, request.requestId, `Operation failed: ${error.message}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        log(`Client disconnected: ${socket.id}`, 'mcp');
      });
    });
  }
  
  // Helper to send success response
  private sendSuccessResponse(socket: Socket, requestId: string, data: any) {
    const response: MCPMessage = {
      type: MessageType.RESPONSE,
      payload: {
        success: true,
        data
      },
      timestamp: new Date().toISOString(),
      requestId
    };
    
    socket.emit('mcp_response', response);
    log(`Sent success response for request ${requestId}`, 'mcp');
  }
  
  // Helper to send error response
  private sendErrorResponse(socket: Socket, requestId: string, error: string) {
    const response: MCPMessage = {
      type: MessageType.RESPONSE,
      payload: {
        success: false,
        error
      },
      timestamp: new Date().toISOString(),
      requestId
    };
    
    socket.emit('mcp_response', response);
    log(`Sent error response for request ${requestId}: ${error}`, 'mcp');
  }
  
  // Operation handlers
  private async handleGetServices(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const services = await storage.getServices();
      this.sendSuccessResponse(socket, request.requestId, { services });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get services: ${error.message}`);
    }
  }
  
  private async handleGetService(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { serviceId } = request.data;
      if (!serviceId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing serviceId parameter');
        return;
      }
      
      const service = await storage.getServiceByServiceId(serviceId);
      if (!service) {
        this.sendErrorResponse(socket, request.requestId, `Service not found: ${serviceId}`);
        return;
      }
      
      this.sendSuccessResponse(socket, request.requestId, { service });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get service: ${error.message}`);
    }
  }
  
  private async handleGetAvailability(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { serviceId, startDate, endDate } = request.data;
      if (!serviceId || !startDate || !endDate) {
        this.sendErrorResponse(socket, request.requestId, 'Missing required parameters');
        return;
      }
      
      const availability = await storage.getServiceAvailability(serviceId, startDate, endDate);
      this.sendSuccessResponse(socket, request.requestId, { availability });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get availability: ${error.message}`);
    }
  }
  
  private async handleCreateBooking(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const bookingData = request.data;
      
      // Validate owner permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          bookingData.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot create booking for another owner');
        return;
      }
      
      const booking = await storage.createBooking(bookingData);
      
      // Send notification about the new booking
      this.sendBookingUpdate(booking.bookingId, { 
        status: booking.status, 
        action: 'created', 
        id: booking.bookingId 
      });
      
      this.sendSuccessResponse(socket, request.requestId, { booking });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to create booking: ${error.message}`);
    }
  }
  
  private async handleGetBooking(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { bookingId } = request.data;
      if (!bookingId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing bookingId parameter');
        return;
      }
      
      const booking = await storage.getBookingByBookingId(bookingId);
      if (!booking) {
        this.sendErrorResponse(socket, request.requestId, `Booking not found: ${bookingId}`);
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          booking.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot access booking of another owner');
        return;
      }
      
      this.sendSuccessResponse(socket, request.requestId, { booking });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get booking: ${error.message}`);
    }
  }
  
  private async handleGetAllBookings(socket: Socket, client: ConnectedClient, request: any) {
    try {
      // Only admins can get all bookings
      if (client.role !== ClientRole.ADMIN) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Admin access required');
        return;
      }
      
      const bookings = await storage.getBookings();
      this.sendSuccessResponse(socket, request.requestId, { bookings });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get all bookings: ${error.message}`);
    }
  }
  
  private async handleUpdateBookingStatus(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { bookingId, status } = request.data;
      if (!bookingId || !status) {
        this.sendErrorResponse(socket, request.requestId, 'Missing required parameters');
        return;
      }
      
      // Get current booking to check permissions
      const currentBooking = await storage.getBookingByBookingId(bookingId);
      if (!currentBooking) {
        this.sendErrorResponse(socket, request.requestId, `Booking not found: ${bookingId}`);
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          currentBooking.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot update booking of another owner');
        return;
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      if (!updatedBooking) {
        this.sendErrorResponse(socket, request.requestId, `Failed to update booking status`);
        return;
      }
      
      // Send notification about the status update
      this.sendBookingUpdate(bookingId, { 
        status, 
        action: 'updated',
        id: bookingId
      });
      
      this.sendSuccessResponse(socket, request.requestId, { booking: updatedBooking });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to update booking status: ${error.message}`);
    }
  }
  
  private async handleCreatePet(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const petData = request.data;
      
      // Validate owner permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          petData.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot create pet for another owner');
        return;
      }
      
      const pet = await storage.createPet(petData);
      this.sendSuccessResponse(socket, request.requestId, { pet });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to create pet: ${error.message}`);
    }
  }
  
  private async handleGetPet(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { petId } = request.data;
      if (!petId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing petId parameter');
        return;
      }
      
      const pet = await storage.getPet(petId);
      if (!pet) {
        this.sendErrorResponse(socket, request.requestId, `Pet not found: ${petId}`);
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          pet.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot access pet of another owner');
        return;
      }
      
      this.sendSuccessResponse(socket, request.requestId, { pet });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get pet: ${error.message}`);
    }
  }
  
  private async handleCreateOwner(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const ownerData = request.data;
      
      // Validate permissions for customers
      if (client.role === ClientRole.CUSTOMER && client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Customers cannot create new owners');
        return;
      }
      
      // Extract only the fields that exist in the database
      const dbOwnerData = {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        phone: ownerData.phone,
        address: ownerData.address,
      };
      
      const owner = await storage.createOwner(dbOwnerData);
      this.sendSuccessResponse(socket, request.requestId, { owner });
    } catch (error: any) {
      this.sendErrorResponse(socket, request.requestId, `Failed to create owner: ${error.message}`);
    }
  }
  
  private async handleGetOwner(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { ownerId } = request.data;
      if (!ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing ownerId parameter');
        return;
      }
      
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        this.sendErrorResponse(socket, request.requestId, `Owner not found: ${ownerId}`);
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          owner.id !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot access another owner');
        return;
      }
      
      this.sendSuccessResponse(socket, request.requestId, { owner });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get owner: ${error.message}`);
    }
  }
  
  private async handleGetAllOwners(socket: Socket, client: ConnectedClient, request: any) {
    try {
      // Only admins can get all owners
      if (client.role !== ClientRole.ADMIN) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Admin access required');
        return;
      }
      
      const owners = await storage.getAllOwners();
      this.sendSuccessResponse(socket, request.requestId, { owners });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get all owners: ${error.message}`);
    }
  }
  
  private async handleUpdatePet(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { petId, petData } = request.data;
      if (!petId || !petData) {
        this.sendErrorResponse(socket, request.requestId, 'Missing required parameters');
        return;
      }
      
      // Get current pet to check permissions
      const currentPet = await storage.getPet(petId);
      if (!currentPet) {
        this.sendErrorResponse(socket, request.requestId, `Pet not found: ${petId}`);
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          currentPet.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot update pet of another owner');
        return;
      }
      
      const updatedPet = await storage.updatePet(petId, petData);
      if (!updatedPet) {
        this.sendErrorResponse(socket, request.requestId, `Failed to update pet`);
        return;
      }
      
      this.sendSuccessResponse(socket, request.requestId, { pet: updatedPet });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to update pet: ${error.message}`);
    }
  }
  
  private async handleGetPetsByOwner(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { ownerId } = request.data;
      if (!ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing ownerId parameter');
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot access pets of another owner');
        return;
      }
      
      const pets = await storage.getPetsByOwnerId(ownerId);
      this.sendSuccessResponse(socket, request.requestId, { pets });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get pets by owner: ${error.message}`);
    }
  }
  
  private async handleGetAllPets(socket: Socket, client: ConnectedClient, request: any) {
    try {
      // Only admins can get all pets
      if (client.role !== ClientRole.ADMIN) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Admin access required');
        return;
      }
      
      const pets = await storage.getAllPets();
      this.sendSuccessResponse(socket, request.requestId, { pets });
    } catch (error: any) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get all pets: ${error.message}`);
    }
  }
  
  private async handleUpdateOwner(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { ownerId, ownerData } = request.data;
      if (!ownerId || !ownerData) {
        this.sendErrorResponse(socket, request.requestId, 'Missing required parameters');
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot update another owner');
        return;
      }
      
      // Extract only the fields that exist in the database
      const dbOwnerData = {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        phone: ownerData.phone,
        address: ownerData.address,
      };
      
      const updatedOwner = await storage.updateOwner(ownerId, dbOwnerData);
      if (!updatedOwner) {
        this.sendErrorResponse(socket, request.requestId, `Failed to update owner`);
        return;
      }
      
      this.sendSuccessResponse(socket, request.requestId, { owner: updatedOwner });
    } catch (error: any) {
      this.sendErrorResponse(socket, request.requestId, `Failed to update owner: ${error.message}`);
    }
  }
  
  private async handleGetBookingsByOwner(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { ownerId } = request.data;
      if (!ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing ownerId parameter');
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot access bookings of another owner');
        return;
      }
      
      const bookings = await storage.getBookingsByOwnerId(ownerId);
      this.sendSuccessResponse(socket, request.requestId, { bookings });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get bookings by owner: ${error.message}`);
    }
  }
  
  private async handleGetBookingsByPet(socket: Socket, client: ConnectedClient, request: any) {
    try {
      const { petId } = request.data;
      if (!petId) {
        this.sendErrorResponse(socket, request.requestId, 'Missing petId parameter');
        return;
      }
      
      // Get pet first to check ownership permissions
      const pet = await storage.getPet(petId);
      if (!pet) {
        this.sendErrorResponse(socket, request.requestId, `Pet not found: ${petId}`);
        return;
      }
      
      // Check permissions for customers
      if (client.role === ClientRole.CUSTOMER && 
          client.ownerId && 
          pet.ownerId !== client.ownerId) {
        this.sendErrorResponse(socket, request.requestId, 'Permission denied: Cannot access bookings of a pet owned by another owner');
        return;
      }
      
      const bookings = await storage.getBookingsByPetId(petId);
      this.sendSuccessResponse(socket, request.requestId, { bookings });
    } catch (error) {
      this.sendErrorResponse(socket, request.requestId, `Failed to get bookings by pet: ${error.message}`);
    }
  }

  // Send notification to all connected clients - simplified to ensure delivery
  public sendNotification(message: string, role: ClientRole = ClientRole.GUEST) {
    // Skip if WebSockets are disabled
    if (!WEBSOCKETS_ENABLED) {
      log(`MCP Notification: "${message}" (WebSockets disabled - notification not sent)`, 'mcp');
      return;
    }
    
    const mcpMessage: MCPMessage = {
      type: MessageType.NOTIFICATION,
      payload: { message },
      timestamp: new Date().toISOString()
    };

    log(`MCP Notification: "${message}" - broadcasting to all connected clients`, 'mcp');
    
    // Broadcast to all connected clients without filtering
    this.io.emit('mcp_message', mcpMessage);
    
    // Also log detailed delivery information for debugging
    let count = 0;
    let roles = new Set<string>();
    
    this.io.sockets.sockets.forEach((socket) => {
      const client = this.connectedClients.get(socket.id);
      if (client) {
        count++;
        roles.add(client.role);
      }
    });
    
    log(`MCP Notification broadcast to ${count} connected clients with roles: ${Array.from(roles).join(', ')}`, 'mcp');
  }

  // Send booking update to relevant clients
  public sendBookingUpdate(bookingId: string, updateData: any) {
    // Skip if WebSockets are disabled
    if (!WEBSOCKETS_ENABLED) {
      log(`MCP Booking Update: for booking ${bookingId} (WebSockets disabled - update not sent)`, 'mcp');
      return;
    }
    
    const mcpMessage: MCPMessage = {
      type: MessageType.BOOKING_UPDATE,
      payload: { bookingId, ...updateData },
      timestamp: new Date().toISOString()
    };

    log(`MCP Booking Update for booking ${bookingId}: ${JSON.stringify(updateData)}`, 'mcp');

    // Send to booking-specific room
    this.io.to(`booking:${bookingId}`).emit('mcp_message', mcpMessage);
    
    let count = 0;
    let roles = new Set<string>();
    
    // Additionally send to all customers and admins to ensure proper delivery
    this.io.sockets.sockets.forEach((socket) => {
      const client = this.connectedClients.get(socket.id);
      if (!client) return; // Skip if no client data
      
      // Minimum role for booking updates is CUSTOMER
      const clientRoleLevel = RoleHierarchy[client.role];
      const minimumRoleLevel = RoleHierarchy[ClientRole.CUSTOMER];
      
      if (clientRoleLevel >= minimumRoleLevel) {
        socket.emit('mcp_message', mcpMessage);
        log(`MCP Booking Update sent to ${client.role} client: ${socket.id}`, 'mcp');
        count++;
        roles.add(client.role);
      }
    });
    
    log(`MCP Booking Update delivered to ${count} clients with roles: ${Array.from(roles).join(', ')}`, 'mcp');
  }

  // Send availability update to all clients
  public sendAvailabilityUpdate(serviceId: string, date: string) {
    // Skip if WebSockets are disabled
    if (!WEBSOCKETS_ENABLED) {
      log(`MCP Availability Update: for service ${serviceId} on date ${date} (WebSockets disabled - update not sent)`, 'mcp');
      return;
    }
    
    const mcpMessage: MCPMessage = {
      type: MessageType.AVAILABILITY_UPDATE,
      payload: { serviceId, date },
      timestamp: new Date().toISOString()
    };

    log(`MCP Availability Update for service ${serviceId} on date ${date}`, 'mcp');

    let count = 0;
    let roles = new Set<string>();
    
    // Send to all clients regardless of role (everyone can see availability updates)
    this.io.sockets.sockets.forEach((socket) => {
      const client = this.connectedClients.get(socket.id);
      if (!client) return; // Skip if no client data
      
      socket.emit('mcp_message', mcpMessage);
      count++;
      roles.add(client.role);
    });
    
    log(`MCP Availability Update delivered to ${count} clients with roles: ${Array.from(roles).join(', ')}`, 'mcp');
  }

  // Send owner-specific update
  public sendOwnerUpdate(ownerId: number, updateData: any) {
    // Skip if WebSockets are disabled
    if (!WEBSOCKETS_ENABLED) {
      log(`MCP Owner Update: for owner ${ownerId} (WebSockets disabled - update not sent)`, 'mcp');
      return;
    }
    
    const mcpMessage: MCPMessage = {
      type: MessageType.STATUS_UPDATE,
      payload: { ownerId, ...updateData },
      timestamp: new Date().toISOString()
    };

    log(`MCP Owner Update for owner ${ownerId}: ${JSON.stringify(updateData)}`, 'mcp');

    // Send to owner-specific room
    this.io.to(`owner:${ownerId}`).emit('mcp_message', mcpMessage);
    
    let count = 0;
    let roles = new Set<string>();
    
    // Additionally send to all relevant clients based on role and owner ID
    this.io.sockets.sockets.forEach((socket) => {
      const client = this.connectedClients.get(socket.id);
      if (!client) return; // Skip if no client data
      
      // Owner should receive their own updates, and admins can see all owner updates
      const isRelevantCustomer = client.role === ClientRole.CUSTOMER && client.ownerId === ownerId;
      const isAdmin = client.role === ClientRole.ADMIN;
      
      if (isRelevantCustomer || isAdmin) {
        socket.emit('mcp_message', mcpMessage);
        log(`MCP Owner Update sent to ${client.role} client: ${socket.id}`, 'mcp');
        count++;
        roles.add(client.role);
      }
    });
    
    log(`MCP Owner Update delivered to ${count} clients with roles: ${Array.from(roles).join(', ')}`, 'mcp');
  }

  // Send error message to a specific client
  public sendErrorToClient(socketId: string, error: string) {
    // Skip if WebSockets are disabled
    if (!WEBSOCKETS_ENABLED) {
      log(`MCP Error: for client ${socketId} (WebSockets disabled - error not sent)`, 'mcp');
      return;
    }
    
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      const mcpMessage: MCPMessage = {
        type: MessageType.ERROR,
        payload: { message: error },
        timestamp: new Date().toISOString()
      };
      socket.emit('mcp_message', mcpMessage);
      log(`Sent error to client ${socketId}: ${error}`, 'mcp');
    }
  }
}