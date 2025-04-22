// Common interfaces for MCP client libraries

export interface MCPContextValue {
  type: string;
  value: any;
}

export interface MCPContext {
  [key: string]: MCPContextValue;
}

export enum MCPContextType {
  SERVICES = 'services',
  BOOKINGS = 'bookings',
  PETS = 'pets',
  OWNERS = 'owners',
  AVAILABILITY = 'availability'
}

// Webhook related types
export enum WebhookEventType {
  BOOKING_CREATED = 'booking.created',
  BOOKING_UPDATED = 'booking.updated',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_COMPLETED = 'booking.completed',
  PET_CREATED = 'pet.created',
  PET_UPDATED = 'pet.updated',
  OWNER_CREATED = 'owner.created',
  OWNER_UPDATED = 'owner.updated',
  SERVICE_CREATED = 'service.created',
  SERVICE_UPDATED = 'service.updated',
  AVAILABILITY_UPDATED = 'availability.updated'
}

// WebSocket related types
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

export enum ClientRole {
  GUEST = 'guest',
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

export interface MCPMessage {
  type: MessageType;
  payload: any;
  timestamp: string;
  requestId?: string; // For request-response pattern
}

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