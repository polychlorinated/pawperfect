// Simple test script for SSE connections
const EventSource = require('eventsource');

// Constants
const API_KEY = 'mcp-api-key-123';
const BASE_URL = 'http://localhost:5000';
const SSE_ENDPOINT = `${BASE_URL}/api/mcp/context-stream?contexts=services&apiKey=${API_KEY}`;

console.log(`Connecting to SSE endpoint: ${SSE_ENDPOINT}`);

// Create event source
const eventSource = new EventSource(SSE_ENDPOINT, { 
  withCredentials: false,
  headers: { 'User-Agent': 'n8n-sse-test-client/1.0' }
});

// Connection open handler
eventSource.onopen = (event) => {
  console.log('SSE Connection established');
};

// Info event handler
eventSource.addEventListener('info', event => {
  try {
    const data = JSON.parse(event.data);
    console.log('👉 Info Event:', data);
  } catch (error) {
    console.error('Error parsing info event data:', error);
  }
});

// Context event handler
eventSource.addEventListener('context', event => {
  try {
    const data = JSON.parse(event.data);
    console.log('🌟 Context Event:', data.contextName);
    console.log(`Received data for ${data.contextName} with ${Object.keys(data.data.value).length} entries`);
  } catch (error) {
    console.error('Error parsing context event data:', error);
  }
});

// Complete event handler
eventSource.addEventListener('complete', event => {
  try {
    const data = JSON.parse(event.data);
    console.log('✅ Complete Event:', data);
  } catch (error) {
    console.error('Error parsing complete event data:', error);
  }
});

// Ping event handler
eventSource.addEventListener('ping', event => {
  try {
    const data = JSON.parse(event.data);
    console.log('🔄 Heartbeat Ping:', data.timestamp);
  } catch (error) {
    console.error('Error parsing ping event data:', error);
  }
});

// Error event handler
eventSource.addEventListener('error', event => {
  console.error('⚠️ SSE Error:', event);
  if (event.status) {
    console.error(`Status code: ${event.status}`);
  }
  try {
    if (event.data) {
      const data = JSON.parse(event.data);
      console.error('Error details:', data);
    }
  } catch (error) {
    // Silently handle parse errors
  }
});

// Recovery event handler
eventSource.addEventListener('recovery', event => {
  try {
    const data = JSON.parse(event.data);
    console.log('🔧 Recovery Event:', data);
  } catch (error) {
    console.error('Error parsing recovery event data:', error);
  }
});

// Generic message handler (catch all)
eventSource.onmessage = (event) => {
  console.log('Generic message received:', event.data);
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing SSE connection...');
  eventSource.close();
  process.exit(0);
});

console.log('SSE test client running. Press Ctrl+C to exit.');

// Keep process alive
setTimeout(() => {
  console.log('Test complete.');
  eventSource.close();
  process.exit(0);
}, 30000); // Run for 30 seconds