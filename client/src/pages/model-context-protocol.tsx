import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { mcpSSEClient } from "@/lib/mcpSSEClient";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TerminalIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon } from "lucide-react";

export default function ModelContextProtocolPage() {
  const { isAdmin } = useAuth();
  const [sseConnected, setSseConnected] = useState(false);
  const [sseMessages, setSseMessages] = useState<{ type: string; message: string; timestamp: string }[]>([]);
  const [receivedContexts, setReceivedContexts] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    sseEnabled: boolean;
    websocketsEnabled: boolean;
    httpFallback: boolean;
  }>({
    sseEnabled: false,
    websocketsEnabled: false,
    httpFallback: true
  });

  // Fetch MCP configuration status
  useEffect(() => {
    // Fetch configuration from the API if the user is an admin
    if (isAdmin) {
      fetch('/api/mcp/config')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch MCP configuration');
          }
          return response.json();
        })
        .then(data => {
          setConfigStatus({
            sseEnabled: data.sseEnabled,
            websocketsEnabled: data.websocketsEnabled,
            httpFallback: data.httpFallback
          });
        })
        .catch(error => {
          console.error('Error fetching MCP configuration:', error);
          // If there's an error, fallback to checking SSE availability
          fetch('/api/mcp/context-stream')
            .then(response => {
              setConfigStatus(prevStatus => ({
                ...prevStatus,
                sseEnabled: response.status !== 410
              }));
            })
            .catch(() => {
              setConfigStatus(prevStatus => ({
                ...prevStatus,
                sseEnabled: false
              }));
            });
        });
    } else {
      // For non-admin users, just check SSE availability
      fetch('/api/mcp/context-stream')
        .then(response => {
          setConfigStatus(prevStatus => ({
            ...prevStatus,
            sseEnabled: response.status !== 410
          }));
        })
        .catch(() => {
          setConfigStatus(prevStatus => ({
            ...prevStatus,
            sseEnabled: false
          }));
        });
    }
      
    // Add a test message to indicate HTTP fallback is configured
    addMessage('system', 'MCP client configured with HTTP fallback for SSE-disabled environments');
  }, [isAdmin]);

  // Connect to SSE demo when the component mounts
  useEffect(() => {
    // Setup SSE event handlers
    mcpSSEClient.setEventHandlers({
      onConnected: () => {
        setSseConnected(true);
        addMessage('system', 'Connected to SSE stream');
      },
      onDisconnected: () => {
        setSseConnected(false);
        addMessage('system', 'Disconnected from SSE stream');
      },
      onInfo: (message) => {
        addMessage('info', message);
      },
      onContext: (contextName, data) => {
        addMessage('context', `Received context data for: ${contextName}`);
        setReceivedContexts(prev => [...prev, contextName]);
      },
      onComplete: (message) => {
        addMessage('complete', message);
        setIsComplete(true);
      },
      onError: (error, contextName) => {
        setIsError(true);
        if (contextName) {
          addMessage('error', `Error loading context ${contextName}: ${error}`);
        } else {
          addMessage('error', `Error: ${error}`);
        }
      }
    });

    return () => {
      // Clean up the connection when the component unmounts
      if (mcpSSEClient.isConnected()) {
        mcpSSEClient.disconnect();
      }
    };
  }, []);

  // Helper to add messages to the log
  const addMessage = (type: string, message: string) => {
    setSseMessages(prev => [
      ...prev, 
      { 
        type, 
        message, 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };
  
  // Function to update MCP configuration
  const updateMCPConfig = async (config: { sseEnabled?: boolean, websocketsEnabled?: boolean }) => {
    try {
      const response = await fetch('/api/mcp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update MCP configuration: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the configuration status
      setConfigStatus({
        sseEnabled: data.sseEnabled,
        websocketsEnabled: data.websocketsEnabled,
        httpFallback: data.httpFallback
      });
      
      // Add a message to the log
      addMessage('system', `Configuration updated: ${data.message}`);
    } catch (error) {
      console.error('Error updating MCP configuration:', error);
      addMessage('error', `Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Connect to the SSE stream with demo contexts
  const connectToSSE = () => {
    // Reset state
    setSseMessages([]);
    setReceivedContexts([]);
    setIsError(false);
    setIsComplete(false);
    
    // Connect with demo contexts
    console.log('Setting API key and connecting to SSE...');
    mcpSSEClient.setApiKey('mcp-api-key-123');
    
    // Add extra debugging
    try {
      mcpSSEClient.connect(['services', 'pets'], { limit: 5 });
      console.log('Connect method called successfully');
    } catch (error) {
      console.error('Error connecting to SSE:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('error', `Connection error: ${errorMessage}`);
    }
    
    addMessage('system', 'Connecting to MCP SSE stream...');
  };

  // Disconnect from the SSE stream
  const disconnectFromSSE = () => {
    mcpSSEClient.disconnect();
  };

  // Sample code snippets
  const contextCode = `// Example request to fetch service information
fetch('/api/mcp/context', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contexts: ['services'],
    authentication: {
      apiKey: 'mcp-api-key-123'
    },
    sessionId: 'session-123456' // Optional: Maintains context across multiple requests
  })
})
.then(response => response.json())
.then(data => console.log(data));
`;

  const sseCode = `// Example using Server-Sent Events to stream context information
// Create SSE connection
const eventSource = new EventSource('/api/mcp/context-stream?contexts=services,pets&apiKey=your-api-key&sessionId=session-123456');

// Listen for different event types
eventSource.addEventListener('info', (event) => {
  console.log('Connection established:', JSON.parse(event.data));
});

eventSource.addEventListener('context', (event) => {
  const data = JSON.parse(event.data);
  console.log(\`Received \${data.contextName} context:\`, data.data);
  
  // Process the specific context data
  if (data.contextName === 'services') {
    // Update UI with services data
    updateServicesUI(data.data.services);
  } else if (data.contextName === 'pets') {
    // Update UI with pets data
    updatePetsUI(data.data.pets);
  }
});

eventSource.addEventListener('complete', (event) => {
  console.log('Stream complete:', JSON.parse(event.data));
  eventSource.close(); // Close connection when done
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  // Implement retry logic or user notification
});

// Handle cleanup
function cleanup() {
  if (eventSource) {
    eventSource.close();
  }
}`;

  const n8nIntegrationCode = `// Example for n8n integration with custom headers
// Using the MCPSSEClient library (client-side)
import { mcpSSEClient } from '@/lib/mcpSSEClient';

// Configure the client with n8n integration options
mcpSSEClient.setApiKey('your-api-key');

// For n8n integration with custom headers
mcpSSEClient.setCustomHeaders({
  'apiKey': 'your-api-key',
  'X-Custom-Header': 'custom-value'
});

// If using a custom SSE URL (different from default /api/mcp/context-stream)
mcpSSEClient.setMessagePostEndpoint('/custom/sse/endpoint');

// Set up event handlers
mcpSSEClient.setEventHandlers({
  onConnected: () => {
    console.log('Connected to MCP SSE stream');
  },
  onInfo: (message) => {
    console.log('Info:', message);
  },
  onContext: (contextName, data) => {
    console.log(\`Received \${contextName} context:\`, data);
  },
  onComplete: (message) => {
    console.log('Stream complete:', message);
    mcpSSEClient.disconnect();
  },
  onError: (error, contextName) => {
    console.error(\`Error \${contextName ? 'for ' + contextName : ''}:\`, error);
  },
  onDisconnected: () => {
    console.log('Disconnected from MCP SSE stream');
  }
});

// Connect and start receiving context data
mcpSSEClient.connect(['services', 'pets'], {
  category: 'boarding'
});

// To fetch a specific context once and get the result as a Promise
const fetchServicesExample = async () => {
  try {
    const servicesData = await mcpSSEClient.fetchContext('services', { 
      category: 'grooming' 
    });
    console.log('Services:', servicesData);
  } catch (error) {
    console.error('Error fetching services:', error);
  }
};

// Cleanup when component unmounts
const cleanup = () => {
  mcpSSEClient.disconnect();
};

// Call cleanup when component unmounts
// window.addEventListener('beforeunload', cleanup);
  'X-Custom-Header': 'custom-value'
});

// If using a custom SSE URL (different from default /api/mcp/context-stream)
mcpSSEClient.setMessagePostEndpoint('/custom/sse/endpoint');

// Set up event handlers
mcpSSEClient.setEventHandlers({
  onConnected: () => {
    console.log('Connected to MCP SSE stream');
  },
  onInfo: (message) => {
    console.log('Info:', message);
  },
  onContext: (contextName, data) => {
    console.log(\`Received \${contextName} context:\`, data);
  },
  onComplete: (message) => {
    console.log('Stream complete:', message);
    mcpSSEClient.disconnect();
  },
  onError: (error, contextName) => {
    console.error(\`Error \${contextName ? 'for ' + contextName : ''}:\`, error);
  },
  onDisconnected: () => {
    console.log('Disconnected from MCP SSE stream');
  }
});

// Connect and start receiving context data
mcpSSEClient.connect(['services', 'pets'], {
  category: 'boarding'
});

// To fetch a specific context once and get the result as a Promise
const fetchServicesExample = async () => {
  try {
    const servicesData = await mcpSSEClient.fetchContext('services', { category: 'grooming' });
    console.log('Services:', servicesData);
  } catch (error) {
    console.error('Error fetching services:', error);
  }
};

// Cleanup when component unmounts
const cleanup = () => {
  mcpSSEClient.disconnect();
};

// Call cleanup when component unmounts
// window.addEventListener('beforeunload', cleanup);
`;

  const n8nCode = `// Example n8n workflow to fetch pet information using MCP
{
  "nodes": [
    {
      "parameters": {
        "url": "https://dog-care-manager-polychlorinated.replit.app/api/mcp/context",
        "method": "POST",
        "bodyParameters": {
          "parameters": {},
          "contexts": ["pets"],
          "authentication": {
            "apiKey": "mcp-api-key-123"
          }
        },
        "options": {}
      },
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1
    }
  ]
}
`;

  const schemaCode = `// Example MCP Schema
{
  "services": {
    "type": "object",
    "description": "Information about available pet boarding and grooming services",
    "properties": {
      "services": {
        "type": "array",
        "description": "List of available services",
        "items": {
          "type": "object",
          "properties": {
            "serviceId": { "type": "string", "description": "Unique identifier for the service" },
            "name": { "type": "string", "description": "Name of the service" },
            "description": { "type": "string", "description": "Description of the service" },
            "price": { "type": "number", "description": "Price of the service" },
            "priceUnit": { "type": "string", "description": "Price unit (per_night, per_session, etc.)" }
          }
        }
      }
    }
  }
}`;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Model Context Protocol (MCP) API</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Connect your pet boarding app to AI and automation tools
          </p>
        </div>
        <div>
          <Button variant="secondary" onClick={() => window.open("/mcp-testing.html", "_blank")}>
            Open MCP Testing Tools
          </Button>
        </div>
      </div>

      {/* Configuration Status Card */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Model Context Protocol Configuration</span>
            <Badge variant={configStatus.sseEnabled ? "success" : "outline"} className={configStatus.sseEnabled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
              {configStatus.sseEnabled ? "SSE Enabled" : "SSE Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>Server-Sent Events (SSE)</span>
              <span className={`flex items-center ${configStatus.sseEnabled ? 'text-green-600' : 'text-amber-600'}`}>
                {configStatus.sseEnabled ? 
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                  <AlertCircleIcon className="h-4 w-4 mr-1" />
                }
                {configStatus.sseEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>WebSockets</span>
              <span className={`flex items-center ${configStatus.websocketsEnabled ? 'text-green-600' : 'text-amber-600'}`}>
                {configStatus.websocketsEnabled ? 
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                  <AlertCircleIcon className="h-4 w-4 mr-1" />
                }
                {configStatus.websocketsEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>HTTP Fallback</span>
              <span className={`flex items-center ${configStatus.httpFallback ? 'text-green-600' : 'text-amber-600'}`}>
                {configStatus.httpFallback ? 
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                  <AlertCircleIcon className="h-4 w-4 mr-1" />
                }
                {configStatus.httpFallback ? "Enabled" : "Disabled"}
              </span>
            </div>
            
            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-4">
                <p className="text-sm font-medium">Admin Controls</p>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable Server-Sent Events (SSE)</span>
                    <Button
                      variant={configStatus.sseEnabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => updateMCPConfig({ sseEnabled: !configStatus.sseEnabled })}
                    >
                      {configStatus.sseEnabled ? "Disable SSE" : "Enable SSE"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable WebSockets</span>
                    <Button
                      variant={configStatus.websocketsEnabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => updateMCPConfig({ websocketsEnabled: !configStatus.websocketsEnabled })}
                    >
                      {configStatus.websocketsEnabled ? "Disable WebSockets" : "Enable WebSockets"}
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Alert className="bg-slate-100">
                      <AlertDescription className="text-xs">
                        Changes will require a server restart to take full effect. HTTP fallback is always enabled for reliability.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-slate-700">
                <strong>Resource Optimization Mode:</strong> This application is configured to reduce server resource usage by prioritizing HTTP endpoints over streaming connections. All functionality remains available regardless of configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>What is Model Context Protocol?</CardTitle>
            <CardDescription>
              A standardized way to connect AI models to different data sources and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Model Context Protocol (MCP) is an open protocol that standardizes how applications
              provide context to LLMs (Large Language Models).
            </p>
            <p className="mb-4">
              Think of MCP like a USB-C port for AI applications. Just as USB-C provides a
              standardized way to connect your devices to various peripherals and accessories,
              MCP provides a standardized way to connect AI models to different data sources and tools.
            </p>
            <div className="mt-6">
              <Button variant="outline" onClick={() => window.open("https://modelcontextprotocol.io", "_blank")}>
                Learn More About MCP
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits of MCP Integration</CardTitle>
            <CardDescription>
              Unlock powerful AI and automation capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5">
              <li>Connect your pet boarding data to n8n automation workflows</li>
              <li>Enable AI assistants to understand your business context</li>
              <li>Build custom integrations with other tools and services</li>
              <li>Create AI-powered insights about your business operations</li>
              <li>Enable voice assistants to answer questions about your services</li>
              <li>Automate repetitive tasks using contextual information</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="schema">Data Schema</TabsTrigger>
          <TabsTrigger value="examples">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tools" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">MCP Tools Overview</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  NEW
                </Badge>
              </CardTitle>
              <CardDescription>
                Execute actions in the PawPerfect system using MCP tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                In addition to retrieving context data, the MCP implementation in PawPerfect also provides tools that allow
                AI agents and automation systems to perform actions within the application. These tools enable a bi-directional
                communication pattern: AI systems can both retrieve data and execute operations.
              </p>
              <p className="mb-4">
                Tools are accessed through the <code className="text-xs bg-gray-100 p-1 rounded">/api/mcp/messages</code> endpoint,
                which accepts messages and tool invocation requests, and can be used with n8n's MCP Client node.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
              <CardDescription>
                Tools that can be used to perform actions in the PawPerfect system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">book_appointment</h3>
                  <p className="mb-2">Create a new booking for a pet service</p>
                  <h4 className="text-base font-medium mt-3 mb-1">Parameters:</h4>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">serviceId</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">ID of the service to book (e.g., 'boarding-standard')</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">petId</td>
                        <td className="px-3 py-2 whitespace-nowrap">number</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">ID of the pet for the booking</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">startDate</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Start date in YYYY-MM-DD format</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">startTime</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Start time in HH:MM format</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">endDate</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">End date for multi-day services (YYYY-MM-DD)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">notes</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Special instructions for the booking</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">check_availability</h3>
                  <p className="mb-2">Query available time slots for a specific service and date range</p>
                  <h4 className="text-base font-medium mt-3 mb-1">Parameters:</h4>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">serviceId</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">ID of the service to check</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">startDate</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Start date for availability search</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">endDate</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">End date for availability search</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">includeTimeSlots</td>
                        <td className="px-3 py-2 whitespace-nowrap">boolean</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Whether to include detailed time slots</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">create_customer</h3>
                  <p className="mb-2">Create a new customer record in the system</p>
                  <h4 className="text-base font-medium mt-3 mb-1">Parameters:</h4>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">firstName</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Customer's first name</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">lastName</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Customer's last name</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">email</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Customer's email address</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">phone</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Customer's phone number</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">address</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Customer's physical address</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">add_pet</h3>
                  <p className="mb-2">Register a new pet associated with an existing owner</p>
                  <h4 className="text-base font-medium mt-3 mb-1">Parameters:</h4>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">ownerId</td>
                        <td className="px-3 py-2 whitespace-nowrap">number</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">ID of the pet's owner</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">name</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Pet's name</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">breed</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                        <td className="px-3 py-2">Pet's breed</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">age</td>
                        <td className="px-3 py-2 whitespace-nowrap">number</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Pet's age in years</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">weight</td>
                        <td className="px-3 py-2 whitespace-nowrap">number</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Pet's weight in pounds</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">gender</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Pet's gender</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">isVaccinated</td>
                        <td className="px-3 py-2 whitespace-nowrap">boolean</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Vaccination status</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap font-mono">specialNeeds</td>
                        <td className="px-3 py-2 whitespace-nowrap">string</td>
                        <td className="px-3 py-2 whitespace-nowrap">No</td>
                        <td className="px-3 py-2">Special care requirements</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tool Execution Endpoint</CardTitle>
              <CardDescription>
                POST /api/mcp/messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The <code className="text-xs bg-gray-100 p-1 rounded">/api/mcp/messages</code> endpoint is used to execute tools. 
                It accepts messages and tool invocation requests.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Request Body</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "messages": [
    {
      "role": "user",
      "content": "Book an appointment for my dog"
    }
  ],
  "tools": [
    {
      "name": "book_appointment",
      "parameters": {
        "serviceId": "boarding-standard",
        "petId": 1,
        "startDate": "2025-05-15",
        "startTime": "09:00",
        "endDate": "2025-05-18"
      }
    }
  ],
  "sessionId": "session-123456",
  "authentication": {
    "apiKey": "your-api-key"
  }
}`}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "success": true,
  "tool_results": [
    {
      "tool": "book_appointment",
      "result": {
        "success": true,
        "data": {
          "booking_id": "BOK-87654321",
          "status": "confirmed",
          "service_id": "boarding-standard",
          "start_date": "2025-05-15T09:00:00.000Z",
          "total_price": 137.97,
          "pet_id": 1,
          "owner_id": 5
        }
      }
    }
  ]
}`}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">List Available Tools</h4>
                <p className="mb-2">
                  If you send a message without specifying any tools, the response will include the list of available tools:
                </p>
                <CodeBlock
                  language="json"
                  code={`// Request
{
  "messages": [
    {
      "role": "user",
      "content": "What tools are available?"
    }
  ],
  "sessionId": "session-123456",
  "authentication": {
    "apiKey": "your-api-key"
  }
}

// Response
{
  "message": "Message received. Use available tools to perform actions.",
  "available_tools": [
    {
      "name": "book_appointment",
      "description": "Create a new booking for a pet service",
      "parameters": [...]
    },
    {
      "name": "check_availability",
      "description": "Query available time slots for a specific service and date range",
      "parameters": [...]
    },
    // Other available tools...
  ]
}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>GET /api/mcp/info</CardTitle>
              <CardDescription>
                Get information about the MCP provider and available contexts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Returns metadata about the MCP provider, including available context types
                and their schemas.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Example Response</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "name": "PawPerfect Pet Boarding",
  "description": "Model Context Protocol provider for the PawPerfect pet boarding and grooming application",
  "version": "1.0.0",
  "contextSchema": {
    "services": { ... },
    "bookings": { ... },
    "pets": { ... },
    "owners": { ... },
    "availability": { ... }
  }
}`}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Authentication</h4>
                  <p>No authentication required for this endpoint.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>POST /api/mcp/context</CardTitle>
              <CardDescription>
                Request context information from the MCP provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Returns the requested context information based on the requested context types
                and parameters.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Request Body</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "contexts": ["services", "pets"],
  "parameters": {
    "category": "boarding",
    "isVaccinated": true
  },
  "sessionId": "session-123456",
  "authentication": {
    "apiKey": "your-api-key"
  }
}`}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "services": {
    "type": "services",
    "value": {
      "services": [...]
    }
  },
  "pets": {
    "type": "pets",
    "value": {
      "pets": [...]
    }
  }
}`}
                  />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Authentication</h4>
                <p>API key authentication required. Contact admin for API key access.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">GET /api/mcp/context-stream</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  NEW
                </Badge>
              </CardTitle>
              <CardDescription>
                Stream context information using Server-Sent Events (SSE)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Provides a real-time stream of context data using Server-Sent Events (SSE). 
                This approach is more efficient for streaming large datasets and real-time updates.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Query Parameters</h4>
                  <CodeBlock
                    language="text"
                    code={`contexts: Comma-separated list of contexts
  Example: contexts=services,pets

parameters: JSON-encoded parameters object
  Example: parameters={"category":"boarding"}
  
apiKey: Your API key for authentication
  Example: apiKey=your-api-key
  
sessionId: Optional session identifier to maintain state
  Example: sessionId=session-123456`}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">SSE Event Types</h4>
                  <CodeBlock
                    language="text"
                    code={`info: Connection established
  {"message": "Connection established"}

context: Context data
  {"contextName": "services", "data": {...}}

error: Error information
  {"error": "Error message", "contextName": "pets"}

complete: All contexts have been streamed
  {"message": "All contexts loaded"}`}
                  />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Authentication</h4>
                <p>API key authentication required via query parameter. Contact admin for API key access.</p>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Benefits over REST API</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Real-time streaming of large datasets</li>
                  <li>Reduced overhead compared to multiple REST API calls</li>
                  <li>Automatic reconnection on network issues</li>
                  <li>Progressive loading of context data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">POST /api/mcp/messages</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  NEW
                </Badge>
              </CardTitle>
              <CardDescription>
                Execute actions using AI-friendly message format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Provides an AI agent-friendly interface for executing tools in the PawPerfect application.
                Uses a conversational format similar to OpenAI's Chat API to simplify integration with LLMs.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Request Body</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "messages": [
    {
      "role": "system",
      "content": "You are a PawPerfect booking assistant."
    },
    {
      "role": "user",
      "content": "Book a grooming appointment for my dog Max"
    }
  ],
  "tools": [
    {
      "name": "book_appointment",
      "parameters": {
        "serviceId": "grooming-deluxe",
        "petId": 1,
        "startDate": "2025-05-15",
        "startTime": "09:00"
      }
    }
  ],
  "sessionId": "session-123456",
  "authentication": {
    "apiKey": "your-api-key"
  }
}`}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "success": true,
  "tool_results": [
    {
      "tool": "book_appointment",
      "result": {
        "success": true,
        "data": {
          "bookingId": "BOK-12345678",
          "status": "confirmed",
          "serviceId": "grooming-deluxe",
          "serviceName": "Deluxe Dog Grooming",
          "petId": 1,
          "petName": "Max",
          "startDate": "2025-05-15",
          "startTime": "09:00",
          "endDate": "2025-05-15",
          "endTime": "11:00",
          "totalPrice": 89.99
        }
      }
    }
  ]
}`}
                  />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Available Tools</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-sm">book_appointment</h5>
                    <p className="text-sm text-muted-foreground">Create a new booking for a pet service</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">check_availability</h5>
                    <p className="text-sm text-muted-foreground">Query available time slots for a specific service and date range</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">create_customer</h5>
                    <p className="text-sm text-muted-foreground">Create a new customer record in the system</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">add_pet</h5>
                    <p className="text-sm text-muted-foreground">Register a new pet associated with an existing owner</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Authentication</h4>
                <p>API key authentication required. Can be provided in request body, headers, or query parameters.</p>
              </div>
              <div className="mt-6 space-x-2">
                <Button variant="outline" onClick={() => window.open("/MCP_MESSAGES_DOCUMENTATION.md", "_blank")}>
                  View Messages Documentation
                </Button>
                <Button variant="outline" onClick={() => window.open("/N8N_PAWPERFECT_AGENT_INSTRUCTIONS.md", "_blank")}>
                  View n8n Agent Instructions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schema" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Context Types</CardTitle>
              <CardDescription>
                Data schemas for the different context types available in the MCP API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">services</h3>
                  <p className="mb-2">Information about available pet boarding and grooming services</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "services": {
    "type": "array",
    "items": {
      "serviceId": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "priceUnit": "string",
      "category": "string",
      "durationInMinutes": "number",
      "capacity": "number",
      "isArchived": "boolean"
    }
  }
}`}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">pets</h3>
                  <p className="mb-2">Information about registered pets</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "pets": {
    "type": "array",
    "items": {
      "id": "number",
      "name": "string",
      "breed": "string",
      "age": "number",
      "weight": "number",
      "gender": "string",
      "specialNeeds": "string | null",
      "isVaccinated": "boolean",
      "ownerId": "number",
      "vetName": "string | null",
      "vetPhone": "string | null",
      "medicalHistory": "string | null"
    }
  }
}`}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">bookings</h3>
                  <p className="mb-2">Information about pet boarding and grooming bookings</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "bookings": {
    "type": "array",
    "items": {
      "bookingId": "string",
      "serviceId": "string",
      "startDate": "string (ISO date)",
      "startTime": "string",
      "endDate": "string (ISO date) | null",
      "endTime": "string | null",
      "totalPrice": "number",
      "status": "string",
      "petId": "number",
      "ownerId": "number"
    }
  }
}`}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">owners</h3>
                  <p className="mb-2">Information about pet owners</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "owners": {
    "type": "array",
    "items": {
      "id": "number",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "address": "string"
    }
  }
}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>JavaScript REST Integration</CardTitle>
              <CardDescription>
                Fetch data from the MCP API using JavaScript and REST
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript" code={contextCode} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">Server-Sent Events Integration</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  NEW
                </Badge>
              </CardTitle>
              <CardDescription>
                Stream context data in real-time using SSE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This example shows how to use Server-Sent Events to stream context data in real-time:
              </p>
              <CodeBlock language="javascript" code={sseCode} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">n8n Integration - REST API</span>
              </CardTitle>
              <CardDescription>
                Connect your pet boarding data to n8n automation workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You can use the HTTP Request node in n8n to connect to the MCP API and fetch data:
              </p>
              <CodeBlock language="json" code={n8nCode} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">n8n Integration - Server-Sent Events</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  NEW
                </Badge>
              </CardTitle>
              <CardDescription>
                Stream real-time data to n8n using the MCP Client node with SSE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                With the n8n-nodes-mcp package, you can create workflows that use Server-Sent Events 
                for more efficient and real-time data streaming:
              </p>
              <h4 className="font-medium mt-4 mb-2">Step 1: Install the MCP nodes package</h4>
              <CodeBlock language="bash" code="npm install n8n-nodes-mcp" />
              
              <h4 className="font-medium mt-4 mb-2">Step 2: Create a workflow using the MCP Client node</h4>
              <p className="mb-3">In the MCP Client node configuration:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Set Transport Type to "Server-Sent Events (SSE)"</li>
                <li>Configure the SSE URL: <code className="text-xs bg-gray-100 p-1 rounded">https://dog-care-manager-polychlorinated.replit.app/api/mcp/context-stream</code></li>
                <li>Add the apiKey in Additional Headers: <code className="text-xs bg-gray-100 p-1 rounded">apiKey:your-api-key</code></li>
                <li>Select the operation (e.g., "Get Context")</li>
                <li>Set the contexts to fetch (e.g., "services,pets")</li>
                <li>Add any filter parameters as needed</li>
              </ul>
              
              <h4 className="font-medium mb-2">Advanced Configuration Options</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium mb-1">SSE URL</h5>
                  <p className="text-sm text-gray-700">The URL of the SSE endpoint (default: /api/mcp/context-stream)</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-1">Messages Post Endpoint</h5>
                  <p className="text-sm text-gray-700">Optional custom endpoint for posting messages if different from the SSE URL</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-1">Additional Headers</h5>
                  <p className="text-sm text-gray-700">Optional headers to send with requests (format: name:value, one per line)</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-1">Advanced Parameters</h5>
                  <p className="text-sm text-gray-700">Filter parameters to narrow down the context data (JSON format)</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p>For more examples and detailed documentation, see the example below:</p>
                <CodeBlock language="javascript" code={n8nIntegrationCode} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Schema Definition Example</CardTitle>
              <CardDescription>
                Example of an MCP schema definition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript" code={schemaCode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SSE Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">Server-Sent Events Demo</span>
            {sseConnected && (
              <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                Connected
              </Badge>
            )}
            {!sseConnected && (
              <Badge variant="outline" className="bg-gray-100">
                Disconnected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Try the new Server-Sent Events implementation of the Model Context Protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="mb-2">
              This demonstration shows how to use Server-Sent Events (SSE) to stream context data from the
              MCP API. SSE provides a more efficient connection for real-time updates compared to traditional
              REST API calls.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {receivedContexts.includes('services') && (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  services
                </Badge>
              )}
              {receivedContexts.includes('pets') && (
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                  pets
                </Badge>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              {!sseConnected ? (
                <Button onClick={connectToSSE}>
                  Connect to SSE Stream
                </Button>
              ) : (
                <Button variant="outline" onClick={disconnectFromSSE}>
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {/* SSE Code Example */}
          <div className="mb-6 mt-6">
            <h4 className="font-medium mb-2">SSE Client Code Example</h4>
            <CodeBlock
              language="javascript"
              code={`// Connect to MCP using Server-Sent Events
const eventSource = new EventSource('/api/mcp/context-stream?contexts=services,pets&apiKey=your-api-key&sessionId=session-123456');

// Setup event listeners
eventSource.addEventListener('info', (event) => {
  console.log('Connection info:', JSON.parse(event.data));
});

eventSource.addEventListener('context', (event) => {
  const data = JSON.parse(event.data);
  console.log(\`Received \${data.contextName} context:\`, data.data);
});

eventSource.addEventListener('complete', (event) => {
  console.log('Stream complete:', JSON.parse(event.data));
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', JSON.parse(event.data));
});

// Disconnect when done
eventSource.close();`}
            />
          </div>

          {/* Event Log */}
          <div className="mt-6">
            <h4 className="font-medium mb-2">Event Log</h4>
            <div className="bg-gray-50 border rounded-md p-4 h-64 overflow-y-auto font-mono text-sm">
              {sseMessages.length === 0 ? (
                <div className="text-gray-400 flex items-center justify-center h-full">
                  <div className="text-center">
                    <TerminalIcon className="h-16 w-16 mx-auto mb-2 opacity-20" />
                    <p>No events yet. Click "Connect to SSE Stream" to begin.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sseMessages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start ${
                      msg.type === 'error' ? 'text-red-600' : 
                      msg.type === 'info' ? 'text-blue-600' : 
                      msg.type === 'context' ? 'text-green-600' : 
                      msg.type === 'complete' ? 'text-purple-600' : 
                      'text-gray-600'
                    }`}>
                      <span className="text-gray-400 mr-2 font-mono text-xs">[{msg.timestamp}]</span>
                      {msg.type === 'error' && <AlertCircleIcon className="h-4 w-4 mr-1 mt-0.5" />}
                      {msg.type === 'info' && <InfoIcon className="h-4 w-4 mr-1 mt-0.5" />}
                      {msg.type === 'context' && <CheckCircleIcon className="h-4 w-4 mr-1 mt-0.5" />}
                      {msg.type === 'complete' && <CheckCircleIcon className="h-4 w-4 mr-1 mt-0.5" />}
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
          <AlertCircleIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            There was an error connecting to the SSE stream. Check the Event Log for details.
          </AlertDescription>
        </Alert>
      )}

      {isComplete && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            Successfully received all requested context data from the SSE stream.
          </AlertDescription>
        </Alert>
      )}

      {isAdmin && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle>Administrator Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              As an administrator, you can manage API keys and access to the MCP API.
              The default API key for testing is <code>mcp-api-key-123</code>.
            </p>
            <p className="mt-2">
              For production use, you should generate and manage secure API keys through an admin interface.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}