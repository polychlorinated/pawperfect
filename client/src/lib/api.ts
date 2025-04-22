import { ServiceAvailability } from "@shared/schema";

// API utility functions for accessing the dog boarding and grooming API

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Fetch all services
 */
export async function getServices(): Promise<ApiResponse<{ services: any[] }>> {
  try {
    const response = await fetch("/api/services");
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: { 
        code: "fetch_error", 
        message: error instanceof Error ? error.message : "Failed to fetch services" 
      } 
    };
  }
}

/**
 * Fetch service availability
 */
export async function getServiceAvailability(
  serviceId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<{ availability: ServiceAvailability[] }>> {
  try {
    const response = await fetch(
      `/api/availability/${serviceId}?start_date=${startDate}&end_date=${endDate}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: { 
        code: "fetch_error", 
        message: error instanceof Error ? error.message : "Failed to fetch service availability" 
      } 
    };
  }
}

/**
 * Create booking
 */
export async function createBooking(bookingData: any): Promise<ApiResponse<any>> {
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: { 
        code: "fetch_error", 
        message: error instanceof Error ? error.message : "Failed to create booking" 
      } 
    };
  }
}

/**
 * Get booking details
 */
export async function getBooking(bookingId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: { 
        code: "fetch_error", 
        message: error instanceof Error ? error.message : "Failed to fetch booking details" 
      } 
    };
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string, 
  status: string
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: { 
        code: "fetch_error", 
        message: error instanceof Error ? error.message : "Failed to update booking status" 
      } 
    };
  }
}

/**
 * Get all bookings (admin only)
 */
export async function getAllBookings(): Promise<ApiResponse<{ bookings: any[] }>> {
  try {
    const response = await fetch("/api/admin/bookings");
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: { 
        code: "fetch_error", 
        message: error instanceof Error ? error.message : "Failed to fetch bookings" 
      } 
    };
  }
}
