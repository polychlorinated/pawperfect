import { useEffect, useState, useCallback } from 'react';
import { mcpClient, ClientRole, MessageType } from '@/lib/mcpClient';
import { useToast } from '@/hooks/use-toast';

interface MCPHookOptions {
  autoConnect?: boolean;
  showToasts?: boolean;
  adminKey?: string;
  ownerId?: number;
  bookingId?: string;
  onNotification?: (message: string) => void;
  onBookingUpdate?: (bookingId: string, data: any) => void;
  onAvailabilityUpdate?: (serviceId: string, date: string) => void;
  onStatusUpdate?: (data: any) => void;
  onError?: (error: string) => void;
  onConnection?: (status: 'connected' | 'disconnected' | 'error') => void;
  onAuthentication?: (success: boolean, role?: ClientRole, error?: string) => void;
}

export function useMCP({
  autoConnect = true,
  showToasts = true,
  adminKey,
  ownerId,
  bookingId,
  onNotification,
  onBookingUpdate,
  onAvailabilityUpdate,
  onStatusUpdate,
  onError,
  onConnection,
  onAuthentication
}: MCPHookOptions = {}) {
  const [isConnected, setIsConnected] = useState(mcpClient.isConnected());
  const [role, setRole] = useState<ClientRole>(mcpClient.getRole());
  const { toast } = useToast();
  
  // Connect to MCP server
  const connect = useCallback(() => {
    mcpClient.connect();
  }, []);
  
  // Disconnect from MCP server
  const disconnect = useCallback(() => {
    mcpClient.disconnect();
  }, []);
  
  // Authenticate with MCP server
  const authenticate = useCallback((authData: { adminKey?: string; ownerId?: number }) => {
    mcpClient.authenticate(authData);
  }, []);
  
  // Subscribe to booking updates
  const subscribeToBookingUpdates = useCallback((data: { bookingId?: string; ownerId?: number }) => {
    mcpClient.subscribeToBookingUpdates(data);
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    if (autoConnect && !mcpClient.isConnected()) {
      connect();
    }
    
    // Track connection status
    const connectionCleanup = mcpClient.onConnection((status) => {
      setIsConnected(status === 'connected');
      
      if (onConnection) {
        onConnection(status);
      }
      
      if (showToasts) {
        switch (status) {
          case 'connected':
            toast({
              title: 'Connected',
              description: 'Successfully connected to real-time updates',
              variant: 'default',
            });
            break;
          case 'disconnected':
            toast({
              title: 'Disconnected',
              description: 'Lost connection to real-time updates',
              variant: 'destructive',
            });
            break;
          case 'error':
            toast({
              title: 'Connection Error',
              description: 'Failed to connect to real-time updates',
              variant: 'destructive',
            });
            break;
        }
      }
    });
    
    // Handle authentication
    const authCleanup = mcpClient.onAuthentication((success, newRole, error) => {
      if (success && newRole) {
        setRole(newRole);
      }
      
      if (onAuthentication) {
        onAuthentication(success, newRole, error);
      }
      
      if (showToasts) {
        if (success) {
          toast({
            title: 'Authentication Successful',
            description: `Authenticated as ${newRole}`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Authentication Failed',
            description: error || 'Unknown error',
            variant: 'destructive',
          });
        }
      }
    });
    
    // Handle notifications
    const notificationCleanup = mcpClient.onNotification((message) => {
      if (onNotification) {
        onNotification(message);
      }
      
      if (showToasts) {
        toast({
          title: 'Notification',
          description: message,
          variant: 'default',
        });
      }
    });
    
    // Handle booking updates
    const bookingUpdateCleanup = mcpClient.onBookingUpdate((bookingId, data) => {
      if (onBookingUpdate) {
        onBookingUpdate(bookingId, data);
      }
      
      if (showToasts) {
        const action = data.action === 'created' 
          ? 'created'
          : data.action === 'status_updated'
          ? `updated to ${data.status}`
          : 'updated';
          
        toast({
          title: 'Booking Update',
          description: `Booking #${bookingId} has been ${action}`,
          variant: 'default',
        });
      }
    });
    
    // Handle availability updates
    const availabilityUpdateCleanup = mcpClient.onAvailabilityUpdate((serviceId, date) => {
      if (onAvailabilityUpdate) {
        onAvailabilityUpdate(serviceId, date);
      }
      
      if (showToasts) {
        toast({
          title: 'Availability Update',
          description: `Service availability for ${serviceId} on ${date} has changed`,
          variant: 'default',
        });
      }
    });
    
    // Handle status updates
    const statusUpdateCleanup = mcpClient.onStatusUpdate((data) => {
      if (onStatusUpdate) {
        onStatusUpdate(data);
      }
      
      if (showToasts && data.message) {
        toast({
          title: 'Status Update',
          description: data.message,
          variant: 'default',
        });
      }
    });
    
    // Handle errors
    const errorCleanup = mcpClient.onError((error) => {
      if (onError) {
        onError(error);
      }
      
      if (showToasts) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
      }
    });
    
    // Authenticate if credentials provided
    if (isConnected && (adminKey || ownerId)) {
      authenticate({ adminKey, ownerId });
    }
    
    // Subscribe to booking updates if needed
    if (isConnected && (bookingId || ownerId)) {
      subscribeToBookingUpdates({ bookingId, ownerId });
    }
    
    // Clean up event listeners
    return () => {
      connectionCleanup();
      authCleanup();
      notificationCleanup();
      bookingUpdateCleanup();
      availabilityUpdateCleanup();
      statusUpdateCleanup();
      errorCleanup();
    };
  }, [
    autoConnect, 
    showToasts, 
    adminKey, 
    ownerId, 
    bookingId, 
    connect, 
    authenticate, 
    subscribeToBookingUpdates,
    onNotification,
    onBookingUpdate,
    onAvailabilityUpdate,
    onStatusUpdate,
    onError,
    onConnection,
    onAuthentication,
    isConnected,
    toast
  ]);
  
  return {
    isConnected,
    role,
    connect,
    disconnect,
    authenticate,
    subscribeToBookingUpdates,
  };
}