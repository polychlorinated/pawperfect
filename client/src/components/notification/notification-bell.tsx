import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function NotificationBell() {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAll,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // When opening the notification panel, mark them as read
    if (open && unreadCount > 0) {
      // Optional: Auto-mark as read when opened
      // markAllAsRead();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => markAllAsRead()}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      archiveAll();
                      setIsOpen(false);
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              {isLoading 
                ? "Loading..." 
                : notifications.length === 0 
                  ? "No new notifications" 
                  : `You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length > 0 && (
              <ScrollArea className="h-[300px]">
                <div className="flex flex-col gap-1 p-1">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onArchive={() => archiveNotification(notification.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          {notifications.length === 0 && (
            <CardFooter className="border-t pt-4 pb-4 px-4 flex justify-center">
              <p className="text-sm text-muted-foreground">
                You're all caught up!
              </p>
            </CardFooter>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onArchive: () => void;
}

function NotificationItem({ notification, onRead, onArchive }: NotificationItemProps) {
  const isUnread = !notification.isRead;
  const createdDate = new Date(notification.createdAt);
  const formattedDate = format(createdDate, "MMM d, h:mm a");

  return (
    <div
      className={cn(
        "p-3 border rounded-md transition-colors",
        isUnread
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border hover:bg-accent/50"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <div className="font-medium text-sm">
            {notification.message}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground/60 hover:text-destructive"
            onClick={onArchive}
            aria-label="Dismiss notification"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </Button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formattedDate}
          </span>
          {isUnread && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs" 
              onClick={onRead}
            >
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}