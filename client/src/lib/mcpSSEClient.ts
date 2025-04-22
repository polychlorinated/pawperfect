// Define MCPContextValue here since importing from types.ts is causing issues
export interface MCPContextValue {
  type: string;
  value: any;
}

export interface MCPSSEConfig {
  baseUrl?: string;
  apiKey?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  customHeaders?: Record<string, string>;
  messagePostEndpoint?: string; // For custom message posting endpoint
}

export type MCPSSEEventHandlers = {
  onInfo?: (message: string) => void;
  onContext?: (contextName: string, data: MCPContextValue) => void;
  onComplete?: (message: string) => void;
  onError?: (error: string, contextName?: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export class MCPSSEClient {
  private baseUrl: string = '';
  private apiKey: string | null = null;
  private eventSource: EventSource | null = null;
  private reconnectDelay: number = 3000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private connected: boolean = false;
  private handlers: MCPSSEEventHandlers = {};
  private lastContextsRequested: string[] = [];
  private lastParameters: Record<string, any> = {};
  private customHeaders: Record<string, string> = {};
  private messagePostEndpoint: string | null = null;
  
  constructor(config: MCPSSEConfig = {}) {
    // MCPSSEClient is a singleton
    if ((window as any).__mcpSSEClient) {
      return (window as any).__mcpSSEClient;
    }
    
    this.baseUrl = config.baseUrl || '';
    this.apiKey = config.apiKey || null;
    this.reconnectDelay = config.reconnectDelay || 3000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.customHeaders = config.customHeaders || {};
    this.messagePostEndpoint = config.messagePostEndpoint || null;
    
    (window as any).__mcpSSEClient = this;
  }
  
  /**
   * Set custom headers for SSE connection
   */
  public setCustomHeaders(headers: Record<string, string>): void {
    this.customHeaders = headers;
  }
  
  /**
   * Set custom message post endpoint
   */
  public setMessagePostEndpoint(endpoint: string): void {
    this.messagePostEndpoint = endpoint;
  }
  
  /**
   * Set event handlers for SSE events
   */
  public setEventHandlers(handlers: MCPSSEEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }
  
  /**
   * Connect to the SSE stream and start receiving context data
   */
  public connect(contexts: string[], parameters: Record<string, any> = {}): void {
    // Store the request for potential reconnection
    this.lastContextsRequested = contexts;
    this.lastParameters = parameters;
    
    // If already connected, close the current connection
    if (this.eventSource) {
      this.disconnect();
    }
    
    // Prepare the URL with query parameters
    const url = this.buildStreamUrl(contexts, parameters);
    
    // If using custom headers, we need to use fetch API with event stream processing
    // because EventSource doesn't support custom headers natively
    if (Object.keys(this.customHeaders).length > 0) {
      this.connectWithFetch(url);
      return;
    }
    
    // Create a new EventSource connection (standard approach without custom headers)
    try {
      this.eventSource = new EventSource(url);
    
      // Set up event listeners
      this.eventSource.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('Connected to MCP SSE stream');
        if (this.handlers.onConnected) {
          this.handlers.onConnected();
        }
      };
      
      // Combined error handler for both HTTP errors and connection errors
      this.eventSource.onerror = (error) => {
        // Check if this is an HTTP error response (like 410 Gone)
        const target = error.target as EventSource;
        if (target.readyState === EventSource.CLOSED) {
          console.warn('SSE connection failed or endpoint is disabled. Falling back to standard HTTP requests.');
          this.disconnect();
          
          // Notify handlers of the error
          if (this.handlers.onError) {
            this.handlers.onError('SSE endpoint is disabled. Please use standard HTTP endpoints instead.');
          }
          
          if (this.handlers.onDisconnected) {
            this.handlers.onDisconnected();
          }
          return;
        }
        
        // Handle regular connection errors
        this.connected = false;
        console.error('MCP SSE stream error:', error);
        
        // Close the connection on error
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting to MCP SSE stream (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect(this.lastContextsRequested, this.lastParameters);
          }, this.reconnectDelay);
        } else {
          console.error('Max reconnection attempts reached');
          if (this.handlers.onDisconnected) {
            this.handlers.onDisconnected();
          }
        }
      };
      
      // Add event listeners for the custom events
      this.eventSource.addEventListener('info', (event: Event) => {
        try {
          // Cast to MessageEvent to access data property
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          console.log('MCP SSE info event:', data);
          if (this.handlers.onInfo && data.message) {
            this.handlers.onInfo(data.message);
          }
        } catch (error) {
          console.error('Error parsing info event data:', error);
        }
      });
      
      this.eventSource.addEventListener('context', (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          console.log('MCP SSE context event:', data);
          if (this.handlers.onContext && data.contextName && data.data) {
            this.handlers.onContext(data.contextName, data.data);
          }
        } catch (error) {
          console.error('Error parsing context event data:', error);
        }
      });
      
      this.eventSource.addEventListener('error', (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          if (!messageEvent.data) {
            // This is a connection error, not an event-specific error
            if (this.handlers.onError) {
              this.handlers.onError('Connection error or server disconnected');
            }
            return;
          }
          
          const data = JSON.parse(messageEvent.data);
          console.log('MCP SSE error event:', data);
          if (this.handlers.onError) {
            this.handlers.onError(data.error || 'Unknown error', data.contextName);
          }
        } catch (error) {
          console.error('Error parsing error event data:', error);
          if (this.handlers.onError) {
            this.handlers.onError('Failed to parse error event data');
          }
        }
      });
      
      this.eventSource.addEventListener('complete', (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          console.log('MCP SSE complete event:', data);
          if (this.handlers.onComplete && data.message) {
            this.handlers.onComplete(data.message);
          }
        } catch (error) {
          console.error('Error parsing complete event data:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up SSE connection:', error);
      this.handleStreamError(error);
    }
  }
    
  /**
   * Connect to the SSE stream using fetch API (for custom headers support)
   * This is used when custom headers are needed (e.g., for n8n integration)
   */
  private async connectWithFetch(url: string): Promise<void> {
    try {
      // Prepare headers for the fetch request
      const headers: HeadersInit = {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...this.customHeaders
      };
      
      // Add API key as a header if available
      if (this.apiKey) {
        headers['apiKey'] = this.apiKey;
      }
      
      // Make the fetch request
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      // Set connected state
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('Connected to MCP SSE stream using fetch API');
      
      if (this.handlers.onConnected) {
        this.handlers.onConnected();
      }
      
      // Process the stream
      const reader = response.body.getReader();
      let buffer = '';
      
      // Create a function to read and process chunks
      const processStream = async () => {
        try {
          while (this.connected) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('SSE stream closed by server');
              this.disconnect();
              break;
            }
            
            // Convert the chunk to a string and add to buffer
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;
            
            // Process complete events in the buffer
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep the last incomplete chunk
            
            for (const eventData of lines) {
              if (!eventData.trim()) continue;
              
              const eventLines = eventData.split('\n');
              let eventType = 'message';
              let data = '';
              
              for (const line of eventLines) {
                if (line.startsWith('event:')) {
                  eventType = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                  data = line.substring(5).trim();
                }
              }
              
              // Process the event based on its type
              this.processEvent(eventType, data);
            }
          }
        } catch (error) {
          console.error('Error processing SSE stream:', error);
          this.handleStreamError(error);
        }
      };
      
      // Start processing the stream
      processStream();
      
    } catch (error) {
      console.error('Error connecting to SSE stream:', error);
      this.handleStreamError(error);
    }
  }
  
  /**
   * Process an SSE event
   */
  private processEvent(eventType: string, data: string): void {
    try {
      if (!data) return;
      
      const eventData = JSON.parse(data);
      
      switch (eventType) {
        case 'info':
          console.log('MCP SSE info event:', eventData);
          if (this.handlers.onInfo && eventData.message) {
            this.handlers.onInfo(eventData.message);
          }
          break;
          
        case 'context':
          console.log('MCP SSE context event:', eventData);
          if (this.handlers.onContext && eventData.contextName && eventData.data) {
            this.handlers.onContext(eventData.contextName, eventData.data);
          }
          break;
          
        case 'error':
          console.log('MCP SSE error event:', eventData);
          if (this.handlers.onError) {
            this.handlers.onError(
              eventData.error || 'Unknown error',
              eventData.contextName
            );
          }
          break;
          
        case 'complete':
          console.log('MCP SSE complete event:', eventData);
          if (this.handlers.onComplete && eventData.message) {
            this.handlers.onComplete(eventData.message);
          }
          break;
          
        default:
          console.log(`MCP SSE ${eventType} event:`, eventData);
      }
    } catch (error) {
      console.error(`Error processing ${eventType} event:`, error);
    }
  }
  
  /**
   * Handle stream errors
   */
  private handleStreamError(error: any): void {
    this.connected = false;
    
    if (this.handlers.onError) {
      this.handlers.onError(error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting to MCP SSE stream (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect(this.lastContextsRequested, this.lastParameters);
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      if (this.handlers.onDisconnected) {
        this.handlers.onDisconnected();
      }
    }
  }
  
  /**
   * Disconnect from the SSE stream
   */
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.connected = false;
    console.log('Disconnected from MCP SSE stream');
    
    if (this.handlers.onDisconnected) {
      this.handlers.onDisconnected();
    }
  }
  
  /**
   * Check if currently connected to the SSE stream
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Set the API key for authentication
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
  
  /**
   * Build the SSE stream URL with query parameters
   */
  private buildStreamUrl(contexts: string[], parameters: Record<string, any> = {}): string {
    // Start with the base URL and the context-stream endpoint
    let endpoint = '/api/mcp/context-stream';
    
    // Use custom message post endpoint if available
    if (this.messagePostEndpoint) {
      endpoint = this.messagePostEndpoint;
    }
    
    try {
      // This may throw an error if the URL is invalid
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Add the contexts as a comma-separated list
      url.searchParams.append('contexts', contexts.join(','));
      
      // Add parameters as a JSON string
      if (Object.keys(parameters).length > 0) {
        url.searchParams.append('parameters', JSON.stringify(parameters));
      }
      
      // Add the API key if available and not using custom headers
      // (for custom headers, the API key is added as a header instead)
      if (this.apiKey && Object.keys(this.customHeaders).length === 0) {
        url.searchParams.append('apiKey', this.apiKey);
      }
      
      console.log('SSE Stream URL:', url.toString());
      return url.toString();
    } catch (error) {
      console.error('Error building stream URL:', error);
      // Fallback to a simple string concatenation
      let urlStr = `${this.baseUrl}${endpoint}?contexts=${contexts.join(',')}`;
      
      // Add parameters as a JSON string
      if (Object.keys(parameters).length > 0) {
        urlStr += `&parameters=${encodeURIComponent(JSON.stringify(parameters))}`;
      }
      
      // Add the API key if available and not using custom headers
      if (this.apiKey && Object.keys(this.customHeaders).length === 0) {
        urlStr += `&apiKey=${encodeURIComponent(this.apiKey)}`;
      }
      
      console.log('SSE Stream URL (fallback):', urlStr);
      return urlStr;
    }
  }
  
  /**
   * Fetch a specific context once (Promise-based API)
   */
  public async fetchContext(
    contextName: string, 
    parameters: Record<string, any> = {}
  ): Promise<MCPContextValue> {
    // First attempt to fetch using standard HTTP endpoint
    try {
      // Build the URL for the standard HTTP context endpoint
      let endpoint = '/api/mcp/context';
      
      // If a custom endpoint is set, use it
      if (this.messagePostEndpoint) {
        endpoint = this.messagePostEndpoint.replace('context-stream', 'context');
      }
      
      // Prepare the URL
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Prepare headers for the fetch request
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...this.customHeaders
      };
      
      // Add API key as a header if available
      if (this.apiKey) {
        headers['apiKey'] = this.apiKey;
      }
      
      // Prepare the request body
      const body = {
        contexts: [contextName],
        parameters,
        authentication: this.apiKey ? { apiKey: this.apiKey } : undefined
      };
      
      console.log('Fetching context via HTTP:', { contextName, parameters });
      
      // Make the fetch request
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If the response contains the context we're looking for, return it
      if (data && data[contextName]) {
        console.log('Context fetched successfully via HTTP:', data[contextName]);
        return data[contextName];
      }
      
      throw new Error(`Context ${contextName} not found in response`);
    } catch (error) {
      console.warn('Error fetching context via HTTP, falling back to SSE:', error);
      
      // Fall back to SSE if HTTP fails (this is less likely if SSE is disabled)
      return new Promise((resolve, reject) => {
        // Create one-time handlers
        const handlers: MCPSSEEventHandlers = {
          onContext: (name, data) => {
            if (name === contextName) {
              // We found our data, disconnect and resolve
              this.disconnect();
              resolve(data);
            }
          },
          onComplete: () => {
            // If we get to complete without finding our context, it's an error
            this.disconnect();
            reject(new Error(`Context ${contextName} not found`));
          },
          onError: (error, errContextName) => {
            // If the error is for our context, or a general error
            if (!errContextName || errContextName === contextName) {
              this.disconnect();
              reject(new Error(error));
            }
          }
        };
        
        // Override the handlers temporarily
        const oldHandlers = { ...this.handlers };
        this.setEventHandlers(handlers);
        
        // Connect and fetch the data
        this.connect([contextName], parameters);
        
        // Set a timeout to avoid hanging forever
        setTimeout(() => {
          if (this.connected) {
            this.disconnect();
            reject(new Error('Timeout waiting for context data'));
          }
          // Restore the original handlers
          this.setEventHandlers(oldHandlers);
        }, 10000);
      });
    }
  }
}

// Create and export singleton instance
export const mcpSSEClient = new MCPSSEClient();