// Example for n8n integration with custom headers
// Using the MCPSSEClient library (client-side)
import { mcpSSEClient } from '@/lib/mcpSSEClient';

/**
 * Example implementation of the MCPSSEClient for n8n integration
 * This file provides a complete example of using the MCPSSEClient 
 * with custom headers and event handlers
 */

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
    console.log(`Received ${contextName} context:`, data);
  },
  onComplete: (message) => {
    console.log('Stream complete:', message);
    mcpSSEClient.disconnect();
  },
  onError: (error, contextName) => {
    console.error(`Error ${contextName ? 'for ' + contextName : ''}:`, error);
  },
  onDisconnected: () => {
    console.log('Disconnected from MCP SSE stream');
  }
});

// Connect and start receiving context data
export const connectToSSE = () => {
  mcpSSEClient.connect(['services', 'pets'], {
    category: 'boarding'
  });
};

// To fetch a specific context once and get the result as a Promise
export const fetchServicesExample = async () => {
  try {
    const servicesData = await mcpSSEClient.fetchContext('services', { 
      category: 'grooming' 
    });
    console.log('Services:', servicesData);
    return servicesData;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

// Cleanup when component unmounts
export const cleanup = () => {
  mcpSSEClient.disconnect();
};

// React hooks implementation example
export const useMCPSSE = () => {
  // This is just an example of how you might use the mcpSSEClient in a React hook
  // In a real application, you would use useEffect for setup and cleanup
  
  const connect = (contexts: string[], parameters = {}) => {
    mcpSSEClient.connect(contexts, parameters);
  };
  
  const disconnect = () => {
    mcpSSEClient.disconnect();
  };
  
  const fetchContext = async (context: string, parameters = {}) => {
    return await mcpSSEClient.fetchContext(context, parameters);
  };
  
  const isConnected = () => {
    return mcpSSEClient.isConnected();
  };
  
  return {
    connect,
    disconnect,
    fetchContext,
    isConnected,
    setEventHandlers: mcpSSEClient.setEventHandlers.bind(mcpSSEClient),
    setApiKey: mcpSSEClient.setApiKey.bind(mcpSSEClient),
    setCustomHeaders: mcpSSEClient.setCustomHeaders.bind(mcpSSEClient)
  };
};

// Example usage in a React component:
/*
import React, { useEffect, useState } from 'react';
import { useMCPSSE } from '@/lib/mcpSSEExample';

const MCPIntegrationComponent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState({});
  const mcp = useMCPSSE();
  
  useEffect(() => {
    // Set up event handlers
    mcp.setEventHandlers({
      onConnected: () => {
        setIsConnected(true);
      },
      onContext: (contextName, contextData) => {
        setData(prev => ({
          ...prev,
          [contextName]: contextData
        }));
      },
      onDisconnected: () => {
        setIsConnected(false);
      }
    });
    
    // Set API key and custom headers if needed
    mcp.setApiKey('your-api-key');
    
    // Connect to the SSE stream
    mcp.connect(['services', 'pets'], { category: 'boarding' });
    
    // Cleanup on component unmount
    return () => {
      mcp.disconnect();
    };
  }, []);
  
  return (
    <div>
      <div>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={() => mcp.disconnect()}>Disconnect</button>
      <button 
        onClick={() => mcp.connect(['services', 'pets'], { category: 'boarding' })}
        disabled={isConnected}
      >
        Connect
      </button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
*/