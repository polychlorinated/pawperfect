import { mcpClient, OperationType } from './mcpClient';
import type { 
  Service, 
  Booking, 
  Pet, 
  Owner, 
  ServiceAvailability,
  InsertBooking,
  InsertPet,
  InsertOwner
} from '@shared/schema';

/**
 * MCP-based API service
 * 
 * This service provides access to all API operations using the MCP (Model Context Protocol)
 * instead of traditional REST API calls. It provides the same operations as the REST API
 * but communicates through WebSockets for real-time communication.
 */
export class MCPAPI {
  // Services
  async getServices(): Promise<Service[]> {
    const response = await mcpClient.request<{ services: Service[] }>(OperationType.GET_SERVICES);
    return response.services;
  }

  async getService(serviceId: string): Promise<Service> {
    const response = await mcpClient.request<{ service: Service }>(
      OperationType.GET_SERVICE, 
      { serviceId }
    );
    return response.service;
  }

  // Availability
  async getServiceAvailability(
    serviceId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceAvailability[]> {
    const response = await mcpClient.request<{ availability: ServiceAvailability[] }>(
      OperationType.GET_AVAILABILITY,
      { serviceId, startDate, endDate }
    );
    return response.availability;
  }

  // Bookings
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const response = await mcpClient.request<{ booking: Booking }>(
      OperationType.CREATE_BOOKING,
      bookingData
    );
    return response.booking;
  }

  async getBooking(bookingId: string): Promise<Booking> {
    const response = await mcpClient.request<{ booking: Booking }>(
      OperationType.GET_BOOKING,
      { bookingId }
    );
    return response.booking;
  }

  async getAllBookings(): Promise<Booking[]> {
    const response = await mcpClient.request<{ bookings: Booking[] }>(
      OperationType.GET_ALL_BOOKINGS
    );
    return response.bookings;
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    const response = await mcpClient.request<{ booking: Booking }>(
      OperationType.UPDATE_BOOKING_STATUS,
      { bookingId, status }
    );
    return response.booking;
  }

  // Pets
  async createPet(petData: InsertPet): Promise<Pet> {
    const response = await mcpClient.request<{ pet: Pet }>(
      OperationType.CREATE_PET,
      petData
    );
    return response.pet;
  }

  async getPet(petId: number): Promise<Pet> {
    const response = await mcpClient.request<{ pet: Pet }>(
      OperationType.GET_PET,
      { petId }
    );
    return response.pet;
  }
  
  async updatePet(petId: number, petData: Partial<InsertPet>): Promise<Pet> {
    const response = await mcpClient.request<{ pet: Pet }>(
      OperationType.UPDATE_PET,
      { petId, ...petData }
    );
    return response.pet;
  }
  
  async getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    const response = await mcpClient.request<{ pets: Pet[] }>(
      OperationType.GET_PETS_BY_OWNER,
      { ownerId }
    );
    return response.pets;
  }
  
  async getAllPets(): Promise<Pet[]> {
    const response = await mcpClient.request<{ pets: Pet[] }>(
      OperationType.GET_ALL_PETS
    );
    return response.pets;
  }

  // Owners
  async createOwner(ownerData: InsertOwner): Promise<Owner> {
    const response = await mcpClient.request<{ owner: Owner }>(
      OperationType.CREATE_OWNER,
      ownerData
    );
    return response.owner;
  }

  async getOwner(ownerId: number): Promise<Owner> {
    const response = await mcpClient.request<{ owner: Owner }>(
      OperationType.GET_OWNER,
      { ownerId }
    );
    
    // Add missing fields that would be expected by the profile component
    return {
      ...response.owner,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelationship: null,
      profileNotes: null,
      preferredCommunication: 'email',
    };
  }
  
  async getAllOwners(): Promise<Owner[]> {
    const response = await mcpClient.request<{ owners: Owner[] }>(
      OperationType.GET_ALL_OWNERS
    );
    
    // Add missing fields that would be expected by the profiles component
    return response.owners.map(owner => ({
      ...owner,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelationship: null,
      profileNotes: null,
      preferredCommunication: 'email',
    }));
  }
  
  async updateOwner(ownerId: number, ownerData: Partial<InsertOwner>): Promise<Owner> {
    const response = await mcpClient.request<{ owner: Owner }>(
      OperationType.UPDATE_OWNER,
      { ownerId, ...ownerData }
    );
    return response.owner;
  }
  
  async getBookingsByOwnerId(ownerId: number): Promise<Booking[]> {
    const response = await mcpClient.request<{ bookings: Booking[] }>(
      OperationType.GET_BOOKINGS_BY_OWNER,
      { ownerId }
    );
    return response.bookings;
  }
  
  async getBookingsByPetId(petId: number): Promise<Booking[]> {
    const response = await mcpClient.request<{ bookings: Booking[] }>(
      OperationType.GET_BOOKINGS_BY_PET,
      { petId }
    );
    return response.bookings;
  }
}

// Create and export singleton instance
export const mcpAPI = new MCPAPI();