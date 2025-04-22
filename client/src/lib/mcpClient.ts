import { io, Socket } from 'socket.io-client';

// Message types for the MCP protocol - mirror of server types
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

// Client roles for access control - mirror of server types
export enum ClientRole {
  GUEST = 'guest',
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

// Interface for MCP messages - mirror of server interface
export interface MCPMessage {
  type: MessageType;
  payload: any;
  timestamp: string;
  requestId?: string; // For request-response pattern
}

// Operation types for API-like functionality (mirror server-side enum)
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

// MCP event handlers
type NotificationHandler = (message: string) => void;
type BookingUpdateHandler = (bookingId: string, updateData: any) => void;
type AvailabilityUpdateHandler = (serviceId: string, date: string) => void;
type StatusUpdateHandler = (statusData: any) => void;
type ErrorHandler = (error: string) => void;
type ConnectionHandler = (status: 'connected' | 'disconnected' | 'error') => void;
type AuthenticationHandler = (success: boolean, role?: ClientRole, error?: string) => void;

export class MCPClient {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private role: ClientRole = ClientRole.GUEST;
  private ownerId?: number;
  
  // Event handlers
  private notificationHandlers: NotificationHandler[] = [];
  private bookingUpdateHandlers: BookingUpdateHandler[] = [];
  private availabilityUpdateHandlers: AvailabilityUpdateHandler[] = [];
  private statusUpdateHandlers: StatusUpdateHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private authHandlers: AuthenticationHandler[] = [];
  
  constructor() {
    // MCPClient is a singleton
    if ((window as any).__mcpClient) {
      return (window as any).__mcpClient;
    }
    
    (window as any).__mcpClient = this;
  }
  
  // Connect to MCP server
  public connect(): void {
    if (this.socket) {
      return; // Already connected
    }
    
    try {
      // Create socket connection with better reconnection settings
      this.socket = io({
        transports: ['websocket', 'polling'],
        path: '/socket.io', // Match server-side Socket.IO path
        autoConnect: true, // Ensure connection is automatic
        reconnection: true, // Enable reconnection
        reconnectionAttempts: 5, // Limit reconnection attempts
        reconnectionDelay: 1000, // Start with 1s delay
        reconnectionDelayMax: 5000, // Max out at 5s delay
        timeout: 10000, // 10s connection timeout
        forceNew: false, // Allow reconnecting to the same session
      });
      
      this.setupEventHandlers();
    } catch (error) {
      console.warn('Error connecting to WebSocket, will use HTTP fallback:', error);
      // If WebSockets are disabled or there's an error, we'll still mark as connected
      // so that the HTTP fallback will be used
      this.connected = true;
      this.notifyConnectionHandlers('connected');
    }
  }
  
  // Disconnect from MCP server
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.notifyConnectionHandlers('disconnected');
    }
  }
  
  // Setup socket event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      this.connected = true;
      this.notifyConnectionHandlers('connected');
    });
    
    this.socket.on('disconnect', () => {
      this.connected = false;
      this.notifyConnectionHandlers('disconnected');
    });
    
    this.socket.on('connect_error', () => {
      this.connected = false;
      this.notifyConnectionHandlers('error');
    });
    
    // Authentication events
    this.socket.on('auth_success', (data: { role: ClientRole }) => {
      this.role = data.role;
      this.notifyAuthHandlers(true, data.role);
    });
    
    this.socket.on('auth_error', (data: { message: string }) => {
      this.notifyAuthHandlers(false, undefined, data.message);
    });
    
    // MCP message event
    this.socket.on('mcp_message', (message: MCPMessage) => {
      this.handleMCPMessage(message);
    });
    
    // MCP response event for request-response pattern
    this.socket.on('mcp_response', (response: MCPMessage) => {
      this.handleMCPResponse(response);
    });
  }
  
  // Map to store pending requests with callbacks
  private pendingRequests = new Map<string, { 
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  
  // Generate a unique request ID
  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  // Send a request and receive a promise for the response
  public request<T>(operation: OperationType, data: any = {}): Promise<T> {
    // First attempt to use WebSockets if available
    if (this.socket && this.connected) {
      const requestId = this.generateRequestId();
      
      return new Promise<T>((resolve, reject) => {
        // Set timeout for the request
        const timeout = setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject('Request timed out');
          }
        }, 30000); // 30 second timeout
        
        // Store the request promise resolvers
        this.pendingRequests.set(requestId, { resolve, reject, timeout });
        
        // Send the request to the server
        this.socket!.emit('mcp_request', {
          operation,
          data,
          requestId
        });
        
        console.log(`MCP request sent via WebSocket: ${operation}`, data);
      });
    }
    
    // If WebSockets are not available, fall back to HTTP
    console.log(`WebSockets not available, falling back to HTTP for operation: ${operation}`);
    return this.httpFallbackRequest<T>(operation, data);
  }
  
  // HTTP fallback implementation for when WebSockets are disabled or unavailable
  private async httpFallbackRequest<T>(operation: OperationType, data: any = {}): Promise<T> {
    try {
      // Map operations to appropriate endpoints
      let endpoint = '';
      let method = 'GET';
      let requestData = null;
      
      // Determine the appropriate endpoint based on the operation
      switch (operation) {
        // Services operations
        case OperationType.GET_SERVICES:
          // Using the normal endpoint which should be working
          endpoint = '/api/services';
          break;
        case OperationType.GET_SERVICE:
          endpoint = `/api/services/${data.serviceId}`;
          break;
        
        // Availability operations
        case OperationType.GET_AVAILABILITY:
          endpoint = `/api/availability?serviceId=${data.serviceId}&startDate=${data.startDate}${data.endDate ? `&endDate=${data.endDate}` : ''}`;
          break;
        
        // Booking operations
        case OperationType.CREATE_BOOKING:
          endpoint = '/api/bookings';
          method = 'POST';
          requestData = data;
          break;
        case OperationType.GET_BOOKING:
          endpoint = `/api/bookings/${data.bookingId}`;
          break;
        case OperationType.GET_ALL_BOOKINGS:
          // Use the admin bookings endpoint
          endpoint = '/api/admin/bookings';
          break;
        case OperationType.UPDATE_BOOKING_STATUS:
          endpoint = `/api/bookings/${data.bookingId}/status`;
          method = 'PATCH';
          requestData = { status: data.status };
          break;
        
        // Pet operations
        case OperationType.CREATE_PET:
          endpoint = '/api/pets';
          method = 'POST';
          requestData = data;
          break;
        case OperationType.GET_PET:
          endpoint = `/api/pets/${data.petId}`;
          break;
        case OperationType.UPDATE_PET:
          endpoint = `/api/pets/${data.petId}`;
          method = 'PATCH';
          const { petId, ...petData } = data;
          requestData = petData;
          break;
        case OperationType.GET_PETS_BY_OWNER:
          endpoint = `/api/owners/${data.ownerId}/pets`;
          break;
        case OperationType.GET_ALL_PETS:
          endpoint = '/api/admin/pets';
          break;
        
        // Owner operations
        case OperationType.CREATE_OWNER:
          endpoint = '/api/owners';
          method = 'POST';
          requestData = data;
          break;
        case OperationType.GET_OWNER:
          endpoint = `/api/owners/${data.ownerId}`;
          break;
        case OperationType.GET_ALL_OWNERS:
          endpoint = '/api/admin/owners';
          break;
        case OperationType.UPDATE_OWNER:
          endpoint = `/api/owners/${data.ownerId}`;
          method = 'PATCH';
          const { ownerId, ...ownerData } = data;
          requestData = ownerData;
          break;
        
        // Relational operations
        case OperationType.GET_BOOKINGS_BY_OWNER:
          endpoint = `/api/owners/${data.ownerId}/bookings`;
          break;
        case OperationType.GET_BOOKINGS_BY_PET:
          endpoint = `/api/pets/${data.petId}/bookings`;
          break;
          
        default:
          throw new Error(`Unsupported operation for HTTP fallback: ${operation}`);
      }
      
      // Prepare fetch options
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      };
      
      // Add request body for non-GET requests
      if (method !== 'GET' && requestData) {
        options.body = JSON.stringify(requestData);
      }
      
      console.log(`HTTP fallback request: ${method} ${endpoint}`);
      
      // Make the HTTP request
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        const errorText = `HTTP error: ${response.status} ${response.statusText}`;
        console.error(`HTTP fallback request failed for ${operation}: ${errorText}`);
        
        // For 401/403 errors, try to trigger reauthentication
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication issue detected, trying to authenticate');
          // Try to authenticate with current ownerId if available
          if (this.ownerId) {
            this.authenticate({ ownerId: this.ownerId });
          }
        }
        
        throw new Error(errorText);
      }
      
      // Parse the response
      const responseData = await response.json();
      
      console.log(`HTTP fallback response for ${operation}:`, responseData);
      
      // Format the response to match the expected structure from WebSockets
      return this.formatHttpResponse<T>(operation, responseData);
    } catch (error) {
      console.error(`HTTP fallback request failed for ${operation}:`, error);
      
      // Create a better structured error with debugging info
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error in HTTP fallback request';
        
      // Return an empty result that matches the expected type structure
      // This prevents the UI from breaking completely when data can't be fetched
      switch (operation) {
        case OperationType.GET_SERVICES:
          return { services: [] } as unknown as T;
        case OperationType.GET_PETS_BY_OWNER:
          return { pets: [] } as unknown as T;
        case OperationType.GET_BOOKINGS_BY_OWNER:
          return { bookings: [] } as unknown as T;
        case OperationType.GET_OWNER:
          // Return a minimal owner object that won't break the UI
          return { owner: { 
            id: this.ownerId || 0,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            timezone: "America/Chicago"
          }} as unknown as T;
        default:
          throw new Error(errorMessage);
      }
    }
  }
  
  // Format HTTP responses to match the expected structure from WebSockets
  private formatHttpResponse<T>(operation: OperationType, data: any): T {
    // For operations that return collections, ensure we're returning the right property
    switch (operation) {
      case OperationType.GET_SERVICES:
        return { services: data.services } as unknown as T;
      
      case OperationType.GET_SERVICE:
        return { service: data } as unknown as T;
        
      case OperationType.GET_AVAILABILITY:
        return { availability: data.availability || data } as unknown as T;
        
      case OperationType.GET_ALL_BOOKINGS:
        return { bookings: data.bookings || [] } as unknown as T;
        
      case OperationType.GET_BOOKING:
        return { booking: data } as unknown as T;
        
      case OperationType.CREATE_BOOKING:
      case OperationType.UPDATE_BOOKING_STATUS:
        return { booking: data } as unknown as T;
        
      case OperationType.GET_PET:
      case OperationType.CREATE_PET:
      case OperationType.UPDATE_PET:
        return { pet: data } as unknown as T;
        
      case OperationType.GET_PETS_BY_OWNER:
      case OperationType.GET_ALL_PETS:
        return { pets: Array.isArray(data) ? data : (data.pets || []) } as unknown as T;
        
      case OperationType.GET_OWNER:
      case OperationType.CREATE_OWNER:
      case OperationType.UPDATE_OWNER:
        return { owner: data } as unknown as T;
        
      case OperationType.GET_ALL_OWNERS:
        return { owners: Array.isArray(data) ? data : (data.owners || []) } as unknown as T;
        
      case OperationType.GET_BOOKINGS_BY_OWNER:
      case OperationType.GET_BOOKINGS_BY_PET:
        return { bookings: Array.isArray(data) ? data : (data.bookings || []) } as unknown as T;
        
      default:
        return data as T;
    }
  }
  
  // Handle MCP response events
  private handleMCPResponse(response: MCPMessage): void {
    const requestId = response.requestId;
    if (!requestId || !this.pendingRequests.has(requestId)) {
      console.warn('Received response for unknown request', response);
      return;
    }
    
    const { resolve, reject, timeout } = this.pendingRequests.get(requestId)!;
    this.pendingRequests.delete(requestId);
    clearTimeout(timeout);
    
    const payload = response.payload;
    
    if (payload.success) {
      resolve(payload.data);
    } else {
      reject(payload.error || 'Unknown error');
    }
  }
  
  // Authenticate with the MCP server
  public authenticate(data: { adminKey?: string; ownerId?: number }): void {
    // Set owner ID regardless of connection status
    this.ownerId = data.ownerId;
    
    // If using WebSockets, send authentication request
    if (this.socket && this.connected) {
      this.socket.emit('authenticate', data);
      return;
    }
    
    // If WebSockets are not available but we're using HTTP fallback
    if (this.connected) {
      // Set the role based on the provided credentials for HTTP fallback mode
      if (data.adminKey) {
        this.role = ClientRole.ADMIN;
        console.log('Setting role to ADMIN for HTTP fallback mode');
        // Notify auth handlers of successful authentication
        this.notifyAuthHandlers(true, ClientRole.ADMIN);
      } else if (data.ownerId) {
        this.role = ClientRole.CUSTOMER;
        console.log('Setting role to CUSTOMER for HTTP fallback mode');
        // Notify auth handlers of successful authentication
        this.notifyAuthHandlers(true, ClientRole.CUSTOMER);
      }
      return;
    }
    
    // If neither WebSockets nor HTTP fallback is available
    this.notifyErrorHandlers('Not connected to MCP server');
  }
  
  // Subscribe to booking updates
  public subscribeToBookingUpdates(data: { bookingId?: string; ownerId?: number }): void {
    // If using WebSockets, send subscribe event
    if (this.socket && this.connected) {
      this.socket.emit('subscribe_booking_updates', data);
      return;
    }
    
    // If WebSockets are not available but we're using HTTP fallback
    if (this.connected) {
      console.log('WebSockets disabled, booking updates will be fetched on demand via HTTP');
      // Store the subscription information for reference
      // In HTTP fallback mode, we'll fetch booking data on-demand instead of receiving updates
      return;
    }
    
    // If neither WebSockets nor HTTP fallback is available
    this.notifyErrorHandlers('Not connected to MCP server');
  }
  
  // Handle incoming MCP messages based on type
  private handleMCPMessage(message: MCPMessage): void {
    switch (message.type) {
      case MessageType.NOTIFICATION:
        this.notifyNotificationHandlers(message.payload.message);
        break;
      case MessageType.BOOKING_UPDATE:
        this.notifyBookingUpdateHandlers(message.payload.bookingId, message.payload);
        break;
      case MessageType.AVAILABILITY_UPDATE:
        this.notifyAvailabilityUpdateHandlers(message.payload.serviceId, message.payload.date);
        break;
      case MessageType.STATUS_UPDATE:
        this.notifyStatusUpdateHandlers(message.payload);
        break;
      case MessageType.ERROR:
        this.notifyErrorHandlers(message.payload.message);
        break;
    }
  }
  
  // Event registration methods
  public onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }
  
  public onBookingUpdate(handler: BookingUpdateHandler): () => void {
    this.bookingUpdateHandlers.push(handler);
    return () => {
      this.bookingUpdateHandlers = this.bookingUpdateHandlers.filter(h => h !== handler);
    };
  }
  
  public onAvailabilityUpdate(handler: AvailabilityUpdateHandler): () => void {
    this.availabilityUpdateHandlers.push(handler);
    return () => {
      this.availabilityUpdateHandlers = this.availabilityUpdateHandlers.filter(h => h !== handler);
    };
  }
  
  public onStatusUpdate(handler: StatusUpdateHandler): () => void {
    this.statusUpdateHandlers.push(handler);
    return () => {
      this.statusUpdateHandlers = this.statusUpdateHandlers.filter(h => h !== handler);
    };
  }
  
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }
  
  public onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }
  
  public onAuthentication(handler: AuthenticationHandler): () => void {
    this.authHandlers.push(handler);
    return () => {
      this.authHandlers = this.authHandlers.filter(h => h !== handler);
    };
  }
  
  // Notify handlers
  private notifyNotificationHandlers(message: string): void {
    this.notificationHandlers.forEach(handler => handler(message));
  }
  
  private notifyBookingUpdateHandlers(bookingId: string, updateData: any): void {
    this.bookingUpdateHandlers.forEach(handler => handler(bookingId, updateData));
  }
  
  private notifyAvailabilityUpdateHandlers(serviceId: string, date: string): void {
    this.availabilityUpdateHandlers.forEach(handler => handler(serviceId, date));
  }
  
  private notifyStatusUpdateHandlers(statusData: any): void {
    this.statusUpdateHandlers.forEach(handler => handler(statusData));
  }
  
  private notifyErrorHandlers(error: string): void {
    this.errorHandlers.forEach(handler => handler(error));
  }
  
  private notifyConnectionHandlers(status: 'connected' | 'disconnected' | 'error'): void {
    this.connectionHandlers.forEach(handler => handler(status));
  }
  
  private notifyAuthHandlers(success: boolean, role?: ClientRole, error?: string): void {
    this.authHandlers.forEach(handler => handler(success, role, error));
  }
  
  // Status check methods
  public isConnected(): boolean {
    return this.connected;
  }
  
  public getRole(): ClientRole {
    return this.role;
  }
  
  public getOwnerId(): number | undefined {
    return this.ownerId;
  }
}

// Create and export singleton instance
export const mcpClient = new MCPClient();