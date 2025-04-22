import { useState, useEffect } from 'react';
import { useMCP } from '@/hooks/use-mcp';
import { ClientRole } from '@/lib/mcpClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { MessageCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function MCPStatus() {
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [adminKey, setAdminKey] = useState('');
  
  const { 
    isConnected, 
    role, 
    connect, 
    disconnect,
    authenticate 
  } = useMCP({
    showToasts: true,
    onNotification: (msg) => {
      setNotifications(prev => [msg, ...prev].slice(0, 10));
    }
  });
  
  const [selectedRole, setSelectedRole] = useState<ClientRole>(ClientRole.GUEST);
  
  const sendNotification = async () => {
    if (!message.trim()) return;
    
    try {
      const response = await fetch('/api/mcp/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          targetRole: selectedRole
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  const loginAsAdmin = () => {
    authenticate({ adminKey });
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>MCP Status</span>
          {isConnected ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Disconnected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Message Control Protocol for real-time notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Role: {role}</h3>
          
          <div className="flex gap-2">
            {isConnected ? (
              <Button size="sm" variant="outline" onClick={disconnect}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={connect}>
                Connect
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              disabled={!isConnected}
              onClick={() => setNotifications([])}
            >
              <RefreshCw className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>
        
        {role !== ClientRole.ADMIN && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Admin Authentication</h3>
              <div className="flex gap-2">
                <Input
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  type="password"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={loginAsAdmin}
                  disabled={!isConnected || !adminKey.trim()}
                >
                  Login
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use "admin123" as the demo admin key
              </p>
            </div>
          </>
        )}
        
        {role === ClientRole.ADMIN && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Send Notification</h3>
              
              <div className="space-y-2">
                <Select 
                  value={selectedRole} 
                  onValueChange={(value) => setSelectedRole(value as ClientRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClientRole.GUEST}>Everyone (All Users)</SelectItem>
                    <SelectItem value={ClientRole.CUSTOMER}>Customers & Admins</SelectItem>
                    <SelectItem value={ClientRole.ADMIN}>Admins Only</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type notification message"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={sendNotification}
                    disabled={!isConnected || !message.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-1">
            <MessageCircle className="h-4 w-4" /> Recent Notifications
          </h3>
          
          <div className="bg-muted/50 rounded-md p-2 h-36 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul className="space-y-2">
                {notifications.map((note, i) => (
                  <li key={i} className="text-sm p-2 bg-background rounded border">
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-xs">Connect and wait for real-time updates</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        You'll receive real-time updates about booking changes
      </CardFooter>
    </Card>
  );
}