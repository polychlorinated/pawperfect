import { useEffect, useState } from 'react';
import { MCPStatus } from '@/components/mcp/mcp-status';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Bell, Info, Send } from 'lucide-react';
import { useMCP } from '@/hooks/use-mcp';
import { ClientRole } from '@/lib/mcpClient';
import { mcpAPI } from '@/lib/mcpAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function MCPDashboard() {
  const [bookingUpdates, setBookingUpdates] = useState<any[]>([]);
  const [availabilityUpdates, setAvailabilityUpdates] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { toast } = useToast();
  
  // Function to send a notification via API when admin is authenticated
  const sendNotification = async () => {
    if (!notificationMessage) {
      toast({
        title: 'Error',
        description: 'Please enter a notification message',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await fetch('/api/mcp/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: notificationMessage 
        }),
      });
      
      setNotificationMessage('');
      toast({
        title: 'Notification Sent',
        description: 'Your notification has been broadcast to all connected clients',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
    }
  };
  
  const { role } = useMCP({
    showToasts: true,
    onNotification: (message) => {
      setSystemNotifications(prev => [{
        message,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    },
    onBookingUpdate: (bookingId, data) => {
      setBookingUpdates(prev => [{
        id: bookingId,
        status: data.status,
        action: data.action,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    },
    onAvailabilityUpdate: (serviceId, date) => {
      setAvailabilityUpdates(prev => [{
        serviceId,
        date,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    }
  });
  
  return (
    <div className="container max-w-6xl py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">MCP Dashboard</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          This dashboard demonstrates the Message Control Protocol (MCP) system for real-time updates in the pet boarding and grooming application.
        </p>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>MCP System</AlertTitle>
        <AlertDescription>
          The MCP system enables real-time updates for bookings, availability changes, and system notifications. This is useful for users to see immediate updates without refreshing the page.
        </AlertDescription>
      </Alert>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Connection Controls <Badge variant="outline">Client-side</Badge>
          </h2>
          
          <MCPStatus />
          
          {role === ClientRole.ADMIN && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> 
                  Send System Notification
                </CardTitle>
                <CardDescription>
                  As an admin, you can broadcast messages to all connected clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter notification message..." 
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendNotification()}
                  />
                  <Button 
                    onClick={sendNotification}
                    disabled={!notificationMessage}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <h3 className="font-medium mb-1">Guest Users:</h3>
                <p>Can connect and receive general system notifications.</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Admin Users:</h3>
                <p>
                  To test admin functionality, connect and log in with the admin key:
                  <kbd className="mx-1 py-0.5 px-1 rounded bg-muted text-xs">admin123</kbd>
                  which allows you to send notifications to all users.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Customer Users:</h3>
                <p>In a real app, customers would authenticate with their accounts and see their specific booking updates.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Activity Feed <Badge variant="outline">Live Updates</Badge>
          </h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> 
                System Notifications
              </CardTitle>
              <CardDescription>
                Broadcast messages and important announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemNotifications.length > 0 ? (
                <ul className="space-y-2">
                  {systemNotifications.map((notification, i) => (
                    <li key={i} className="text-sm rounded border p-2 bg-muted/20">
                      <div className="flex justify-between">
                        <span className="font-medium">System Notification</span>
                        <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm">{notification.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No system notifications yet</p>
                  <p className="text-sm mt-1">Connect as an admin to send notifications</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> 
                Booking Updates
              </CardTitle>
              <CardDescription>
                Real-time booking status changes and creations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookingUpdates.length > 0 ? (
                <ul className="space-y-2">
                  {bookingUpdates.map((update, i) => (
                    <li key={i} className="text-sm rounded border p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Booking #{update.id}</span>
                        <span className="text-xs text-muted-foreground">{update.timestamp}</span>
                      </div>
                      <div className="mt-1">
                        <Badge variant={update.status === "cancelled" ? "destructive" : "outline"}>
                          {update.status}
                        </Badge>
                        {" "}
                        <span className="text-muted-foreground">
                          {update.action === "created" ? "was created" : "was updated"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No booking updates yet</p>
                  <p className="text-sm mt-1">Updates will appear here in real-time</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> 
                Availability Updates
              </CardTitle>
              <CardDescription>
                Changes to service availability schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availabilityUpdates.length > 0 ? (
                <ul className="space-y-2">
                  {availabilityUpdates.map((update, i) => (
                    <li key={i} className="text-sm rounded border p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{update.serviceId}</span>
                        <span className="text-xs text-muted-foreground">{update.timestamp}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-muted-foreground">
                          Availability updated for {update.date}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No availability updates yet</p>
                  <p className="text-sm mt-1">Updates will appear here in real-time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator />
      
      <div className="bg-muted/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Overview</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-2">Server Implementation</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Socket.IO for real-time bidirectional communication</li>
              <li>Role-based message routing (Admin, Customer, Guest)</li>
              <li>Event-based architecture for different message types</li>
              <li>Request-response pattern for API-like operations</li>
              <li>Integration with the booking workflow</li>
              <li>Automatic availability updates when bookings change</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-base font-medium mb-2">Client Implementation</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>React hooks for easy integration into components</li>
              <li>Automatic connection and reconnection handling</li>
              <li>Toast notifications for important updates</li>
              <li>Support for authentication and authorization</li>
              <li>Typed events and message payloads</li>
              <li>Promise-based API for Socket.IO requests</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-base font-medium mb-2">MCP vs. Traditional REST API</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-1">Traditional REST API</h4>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>Request-response model over HTTP</li>
                <li>Stateless protocol</li>
                <li>Client must poll for updates</li>
                <li>Multiple HTTP connections for different operations</li>
                <li>Higher latency for real-time updates</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">MCP (WebSocket-based)</h4>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>Persistent WebSocket connection</li>
                <li>Stateful protocol with session management</li>
                <li>Server pushes updates to clients</li>
                <li>Single connection for all operations</li>
                <li>Lower latency for real-time updates</li>
                <li>Support for both push notifications and request-response patterns</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-base font-medium mb-2">How It Works</h3>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>
              <strong>Connection:</strong> Client establishes a WebSocket connection to the server
            </li>
            <li>
              <strong>Authentication:</strong> Client authenticates with the server to establish role-based permissions
            </li>
            <li>
              <strong>Subscription:</strong> Client subscribes to specific updates (e.g., a specific booking)
            </li>
            <li>
              <strong>Data Operations:</strong> Client can fetch data or make updates using the request-response pattern
            </li>
            <li>
              <strong>Real-time Updates:</strong> Server pushes updates to clients based on their subscriptions and roles
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}