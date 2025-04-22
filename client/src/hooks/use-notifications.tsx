import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "./use-auth";

export type Notification = {
  id: number;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  userId: number | null;
  notificationType: string | null;
  relatedId: string | null;
};

export function useNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch notifications from the server
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) {
          throw new Error(`Error fetching notifications: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Notification fetch error:", error);
        throw error;
      }
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  // Filter out archived notifications by default
  const activeNotifications = notifications.filter(n => !n.isArchived);
  
  // Count unread notifications
  const unreadCount = activeNotifications.filter(n => !n.isRead).length;

  // Mark a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/notifications/${notificationId}/read`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notifications/read-all");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark all notifications as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive a single notification
  const archiveNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/notifications/${notificationId}/archive`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive all notifications
  const archiveAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notifications/archive-all");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive all notifications",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle marking a notification as read
  const markAsRead = useCallback((notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  // Handle marking all notifications as read
  const markAllAsRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  }, [unreadCount, markAllAsReadMutation]);

  // Handle archiving a notification
  const archiveNotification = useCallback((notificationId: number) => {
    archiveNotificationMutation.mutate(notificationId);
  }, [archiveNotificationMutation]);

  // Handle archiving all notifications
  const archiveAll = useCallback(() => {
    if (activeNotifications.length > 0) {
      archiveAllMutation.mutate();
    }
  }, [activeNotifications.length, archiveAllMutation]);

  return {
    notifications: activeNotifications,
    allNotifications: notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAll,
    refetch
  };
}