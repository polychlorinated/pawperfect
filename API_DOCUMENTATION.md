# PawPerfect API Documentation

This document provides information about the available API endpoints for programmatic integration with the PawPerfect Pet Boarding and Grooming application.

## Authentication

All API endpoints require authentication using session-based authentication. You must first log in using the `/api/login` endpoint with valid credentials.

## Server-Sent Events (SSE) Status

> **Note:** The SSE endpoints have been disabled by default to reduce resource consumption. If you need to use SSE, set the environment variable `MCP_ENABLE_SSE=true`. Otherwise, please use the standard HTTP endpoints for Model Context Protocol.

## CORS Support

All API endpoints, including the SSE endpoints (when enabled), support Cross-Origin Resource Sharing (CORS) with the following configuration:

- **Allowed Origins**: All origins (`*`)
- **Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, apiKey, x-api-key
- **Credentials**: Supported
- **Preflight Cache Max Age**: 86400 seconds (24 hours)

This configuration ensures that the API can be accessed from any domain, including n8n integration environments.

## Response Format

All API endpoints return responses in JSON format with the following structure:

For successful responses:
```json
{
  "success": true,
  "message": "Operation successful message",
  "data": { /* response data */ }
}
```

For error responses:
```json
{
  "error": {
    "code": "error_code",
    "message": "Error message"
  }
}
```

This configuration ensures that the API can be accessed from any domain, including n8n integration environments.

## Response Format

All API endpoints return responses in JSON format with the following structure:

For successful responses:
```json
{
  "success": true,
  "message": "Operation successful message",
  "data": { /* response data */ }
}
```

For error responses:
```json
{
  "error": {
    "code": "error_code",
    "message": "Error message"
  }
}
```

Common error codes:
- `unauthorized`: Authentication required
- `forbidden`: Insufficient permissions
- `not_found`: Resource not found
- `validation_error`: Invalid input data
- `conflict`: Resource already exists
- `server_error`: Internal server error

## API Endpoints

### Owner Management

#### Create Owner
- **URL**: `/api/owners`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: Any authenticated user
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "address": "123 Main St"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Owner created successfully",
    "data": {
      "ownerId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "address": "123 Main St"
    }
  }
  ```

#### Update Owner
- **URL**: `/api/owners/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions**: Admin or owner of the record
- **Request Body**: Same as create owner
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Owner updated successfully",
    "data": { /* updated owner data */ }
  }
  ```

### Pet Management

#### Create Pet
- **URL**: `/api/pets`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: Admin or owner of the account
- **Request Body**:
  ```json
  {
    "name": "Buddy",
    "ownerId": 1,
    "breed": "Golden Retriever",
    "age": 3,
    "weight": 30,
    "gender": "male",
    "specialNeeds": null,
    "isVaccinated": true,
    "vetName": "Dr. Smith",
    "vetPhone": "123-456-7890",
    "medications": null,
    "feedingSchedule": "Twice daily",
    "allergies": null,
    "microchipId": null,
    "behavioralNotes": null
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Pet created successfully",
    "data": { /* created pet data */ }
  }
  ```

#### Update Pet
- **URL**: `/api/pets/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions**: Admin or owner of the pet
- **Request Body**: Same schema as create pet (partial updates supported)
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Pet updated successfully",
    "data": { /* updated pet data */ }
  }
  ```

### Booking Management

#### Create Booking
- **URL**: `/api/bookings`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: Admin or owner creating their own booking
- **Request Body**:
  ```json
  {
    "ownerId": 1,
    "petId": 1,
    "serviceId": "svc_boarding_standard",
    "startDate": "2023-07-15",
    "endDate": "2023-07-20",
    "startTime": "09:00",
    "status": "pending",
    "notes": "Please give Buddy his medication in the morning."
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": { /* created booking data */ }
  }
  ```

#### Update Booking Status
- **URL**: `/api/bookings/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions**: Admin or owner of the booking
- **Request Body**: 
  ```json
  {
    "status": "confirmed"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Booking status updated successfully",
    "data": { /* updated booking data */ }
  }
  ```

#### Cancel Booking
- **URL**: `/api/bookings/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions**: Admin or owner of the booking
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully",
    "data": { /* cancelled booking data with status="cancelled" */ }
  }
  ```

### Availability Management

#### Block Availability
- **URL**: `/api/availability/block`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: Admin only
- **Request Body**:
  ```json
  {
    "serviceId": "svc_boarding_standard",
    "date": "2023-07-15",
    "available": false,
    "timeSlots": [
      {
        "time": "09:00",
        "available": false
      },
      {
        "time": "10:00",
        "available": false
      }
    ]
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Availability updated successfully",
    "data": { /* updated availability data */ }
  }
  ```

## Model Context Protocol (MCP) API

The PawPerfect application implements the Model Context Protocol (MCP), which provides a standardized way to access application data and functionality for AI and automation tools. The MCP implementation supports both context streaming for retrieving data and tool execution for performing actions.

### MCP Overview

Model Context Protocol (MCP) standardizes how applications provide context to Large Language Models (LLMs) and enables them to perform actions in your application. Think of MCP as a "USB-C port for AI" that allows AI agents to:

1. **Access Data** - Retrieve information about services, bookings, pets, and customers
2. **Perform Actions** - Execute operations like booking appointments or creating customer profiles
3. **Exchange Messages** - Process natural language requests and respond with relevant data or actions

This bidirectional communication pattern allows AI assistants to both understand your business context and take action on behalf of users.

### MCP Authentication

The MCP API supports multiple authentication methods:

1. **API Key in Headers**:
   - `apiKey` or `x-api-key` header: `your-api-key`

2. **API Key in Query Parameters**:
   - `?apiKey=your-api-key`

3. **Bearer Token**:
   - `Authorization: Bearer your-token`

4. **Session ID**:
   - `sessionId` header: `your-session-id`
   - `sessionId` query parameter: `?sessionId=your-session-id`
   - `sessionId` in request body (for POST/PUT methods)

All methods are supported across all MCP endpoints. For sessionId specifically, the value is passed back in responses to maintain conversation context.

### MCP Endpoints

#### Get MCP Provider Info
- **URL**: `/api/mcp/info`
- **Method**: `GET`
- **Auth Required**: No
- **Success Response**: `200 OK`
  ```json
  {
    "name": "PawPerfect Pet Boarding",
    "description": "Model Context Protocol provider for the PawPerfect pet boarding and grooming application",
    "version": "1.0.0",
    "tools": [
      {
        "name": "book_appointment",
        "description": "Create a new booking for a pet service",
        "parameters": [
          {
            "name": "serviceId",
            "type": "string",
            "description": "The ID of the service to book (e.g., 'boarding-standard', 'grooming-deluxe')",
            "required": true,
            "examples": ["boarding-standard", "grooming-deluxe"]
          },
          {
            "name": "petId",
            "type": "number",
            "description": "The ID of the pet for which the service is being booked",
            "required": true,
            "examples": [1, 5]
          },
          {
            "name": "startDate",
            "type": "string",
            "description": "The starting date for the service in ISO format (YYYY-MM-DD)",
            "required": true,
            "examples": ["2025-05-15"]
          },
          {
            "name": "startTime",
            "type": "string",
            "description": "The starting time in 24-hour format (HH:MM)",
            "required": true,
            "examples": ["09:00", "14:30"]
          },
          {
            "name": "endDate",
            "type": "string",
            "description": "The ending date for multi-day services like boarding (YYYY-MM-DD)",
            "required": false,
            "examples": ["2025-05-18", null]
          }
        ]
      },
      {
        "name": "check_availability",
        "description": "Query available time slots for a specific service and date range",
        "parameters": [
          {
            "name": "serviceId",
            "type": "string",
            "description": "The ID of the service to check availability for",
            "required": true,
            "examples": ["boarding-standard", "grooming-deluxe"]
          },
          {
            "name": "startDate",
            "type": "string",
            "description": "Start date for availability search (YYYY-MM-DD)",
            "required": true,
            "examples": ["2025-05-15"]
          }
        ]
      },
      {
        "name": "create_customer",
        "description": "Create a new customer record in the system",
        "parameters": [
          {
            "name": "firstName",
            "type": "string",
            "description": "Customer's first name",
            "required": true,
            "examples": ["John", "Jane"]
          },
          {
            "name": "lastName",
            "type": "string",
            "description": "Customer's last name",
            "required": true,
            "examples": ["Smith", "Doe"]
          },
          {
            "name": "email",
            "type": "string",
            "description": "Customer's email address",
            "required": true,
            "examples": ["john.smith@example.com"]
          }
        ]
      },
      {
        "name": "add_pet",
        "description": "Register a new pet associated with an existing owner",
        "parameters": [
          {
            "name": "ownerId",
            "type": "number",
            "description": "ID of the pet's owner",
            "required": true,
            "examples": [1, 5]
          },
          {
            "name": "name",
            "type": "string",
            "description": "Pet's name",
            "required": true,
            "examples": ["Max", "Bella"]
          },
          {
            "name": "breed",
            "type": "string",
            "description": "Pet's breed",
            "required": true,
            "examples": ["Golden Retriever", "Siamese", "Mixed"]
          }
        ]
      }
    ],
    "contextSchema": {
      "services": { /* schema for services context */ },
      "bookings": { /* schema for bookings context */ },
      "pets": { /* schema for pets context */ },
      "owners": { /* schema for owners context */ },
      "availability": { /* schema for availability context */ }
    },
    "apis": {
      "services": { "status": "VERIFIED", "endpoints": ["/api/services", "/api/services/:serviceId"] },
      "availability": { "status": "VERIFIED", "endpoints": ["/api/availability/:serviceId"] },
      "bookings": { "status": "VERIFIED", "endpoints": ["/api/bookings", "/api/bookings/:bookingId", "/api/bookings/:bookingId/status"] },
      "owners": { "status": "VERIFIED", "endpoints": ["/api/owners", "/api/owners/:id"] },
      "pets": { "status": "VERIFIED", "endpoints": ["/api/pets", "/api/pets/:id"] }
    }
  }
  ```

### Data Access Endpoints (Context Retrieval)

#### Request MCP Context (REST API)
- **URL**: `/api/mcp/context`
- **Method**: `POST`
- **Auth Required**: Yes (API Key)
- **Request Body**:
  ```json
  {
    "contexts": ["services", "pets"],
    "parameters": {
      "category": "boarding",
      "isVaccinated": true
    },
    "authentication": {
      "apiKey": "your-api-key"
    }
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "services": {
      "type": "services",
      "value": {
        "services": [/* array of services */]
      }
    },
    "pets": {
      "type": "pets",
      "value": {
        "pets": [/* array of pets */]
      }
    }
  }
  ```

#### Request MCP Context (Server-Sent Events)
- **URL**: `/api/mcp/context-stream`
- **Method**: `GET`
- **Auth Required**: Yes (API Key via query parameter)
- **Status**: **DISABLED BY DEFAULT** (Set environment variable `MCP_ENABLE_SSE=true` to enable)
- **Query Parameters**:
  - `contexts`: Comma-separated list of contexts to fetch (e.g., `services,pets`)
  - `parameters`: JSON string of filter parameters (e.g., `{"category":"boarding"}`)
  - `apiKey`: Your API key for authentication
- **Response**: Server-Sent Events (SSE) stream
  - Event: `info` - Connection established
  - Event: `context` - Each requested context data
  - Event: `error` - Error information
  - Event: `complete` - All contexts have been streamed
  
> **Important Note**: The SSE endpoint has been disabled by default to reduce resource consumption. When disabled, the endpoint will return a 410 Gone status code with instructions to use the standard HTTP endpoint instead. Use the standard HTTP endpoint `/api/mcp/context` for all MCP context requests unless SSE is specifically needed.

**Example SSE Client Code**:
```javascript
// Connect to MCP using Server-Sent Events
const eventSource = new EventSource('/api/mcp/context-stream?contexts=services,pets&apiKey=your-api-key&sessionId=session-123456');

// Setup event listeners
eventSource.addEventListener('info', (event) => {
  console.log('Connection info:', JSON.parse(event.data));
});

eventSource.addEventListener('context', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Received ${data.contextName} context:`, data.data);
});

eventSource.addEventListener('complete', (event) => {
  console.log('Stream complete:', JSON.parse(event.data));
  eventSource.close(); // Close connection when done
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', JSON.parse(event.data));
});
```

### MCP Tools 

The PawPerfect MCP implementation provides several tools that enable AI agents to perform actions within the application. These tools are accessible through the `/api/mcp/messages` endpoint and work with n8n's MCP nodes.

#### Available Tools

1. **book_appointment**
   - **Description**: Create a new booking for a pet service
   - **Parameters**:
     - `serviceId` (string, required): ID of the service to book (e.g., 'boarding-standard')
     - `petId` (number, required): ID of the pet for the booking
     - `startDate` (string, required): Start date in YYYY-MM-DD format
     - `startTime` (string, required): Start time in HH:MM format
     - `endDate` (string, optional): End date for multi-day services
     - `notes` (string, optional): Special instructions for the booking

2. **check_availability**
   - **Description**: Query available time slots for a specific service and date range
   - **Parameters**:
     - `serviceId` (string, required): ID of the service to check
     - `startDate` (string, required): Start date for availability search
     - `endDate` (string, optional): End date for availability search
     - `includeTimeSlots` (boolean, optional): Whether to include detailed time slots

3. **create_customer**
   - **Description**: Create a new customer record in the system
   - **Parameters**:
     - `firstName` (string, required): Customer's first name
     - `lastName` (string, required): Customer's last name
     - `email` (string, required): Customer's email address
     - `phone` (string, required): Customer's phone number
     - `address` (string, optional): Customer's physical address

4. **add_pet**
   - **Description**: Register a new pet associated with an existing owner
   - **Parameters**:
     - `ownerId` (number, required): ID of the pet's owner
     - `name` (string, required): Pet's name
     - `breed` (string, required): Pet's breed
     - `age` (number, optional): Pet's age in years
     - `weight` (number, optional): Pet's weight in pounds
     - `gender` (string, optional): Pet's gender
     - `isVaccinated` (boolean, optional): Vaccination status
     - `specialNeeds` (string, optional): Special care requirements

#### Tool Execution Endpoint

- **URL**: `/api/mcp/messages`
- **Method**: `POST`
- **Auth Required**: Yes (API Key)
- **Request Body**:
  ```json
  {
    "messages": [
      {
        "role": "user",
        "content": "I want to book an appointment for my dog"
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
    "authentication": {
      "apiKey": "your-api-key"
    },
    "sessionId": "abc123"
  }
  ```
- **Success Response with Tool Usage**: `200 OK`
  ```json
  {
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
    ],
    "sessionId": "abc123"
  }
  ```

- **Response Without Tool Usage** (Lists Available Tools): `200 OK`
  ```json
  {
    "message": "Message received. Use available tools to perform actions.",
    "available_tools": [
      {
        "name": "book_appointment",
        "description": "Create a new booking for a pet service",
        "parameters": [/* parameter details */]
      },
      {
        "name": "check_availability",
        "description": "Query available time slots for a specific service and date range",
        "parameters": [/* parameter details */]
      },
      {
        "name": "create_customer",
        "description": "Create a new customer record in the system",
        "parameters": [/* parameter details */]
      },
      {
        "name": "add_pet",
        "description": "Register a new pet associated with an existing owner",
        "parameters": [/* parameter details */]
      }
    ],
    "sessionId": "abc123"
  }
  ```

### Integration Examples

#### Example 1: Using MCP Client to List Available Tools

**JavaScript Client (Browser or Node.js)**
```javascript
fetch('https://your-app.domain/api/mcp/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apiKey': 'your-api-key'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What tools are available?' }
    ],
    sessionId: 'session-12345'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Available tools:', data.available_tools);
})
.catch(error => console.error('Error:', error));
```

#### Example 2: Creating a Customer and Adding a Pet

**JavaScript Client (Browser or Node.js)**
```javascript
// First create a customer
const createCustomer = async () => {
  const response = await fetch('https://your-app.domain/api/mcp/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': 'your-api-key'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Create a new customer' }
      ],
      tools: [
        {
          name: 'create_customer',
          parameters: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '555-123-4567',
            address: '123 Main St, Anytown, USA'
          }
        }
      ],
      sessionId: 'session-12345'
    })
  });
  
  const data = await response.json();
  return data.tool_results[0].result.data.id; // Get the new customer ID
};

// Then add a pet for that customer
const addPet = async (ownerId) => {
  const response = await fetch('https://your-app.domain/api/mcp/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': 'your-api-key'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Add a pet for the customer' }
      ],
      tools: [
        {
          name: 'add_pet',
          parameters: {
            ownerId: ownerId,
            name: 'Buddy',
            breed: 'Golden Retriever',
            age: 3,
            weight: 65,
            gender: 'male',
            isVaccinated: true
          }
        }
      ],
      sessionId: 'session-12345'
    })
  });
  
  return await response.json();
};

// Execute the workflow
(async () => {
  try {
    const ownerId = await createCustomer();
    const petResult = await addPet(ownerId);
    console.log('Pet created:', petResult);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

#### Example 3: Checking Availability and Booking an Appointment

```javascript
// Check availability first
const checkAvailability = async () => {
  const response = await fetch('https://your-app.domain/api/mcp/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': 'your-api-key'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Check availability for boarding' }
      ],
      tools: [
        {
          name: 'check_availability',
          parameters: {
            serviceId: 'boarding-standard',
            startDate: '2025-05-15',
            endDate: '2025-05-20',
            includeTimeSlots: true
          }
        }
      ],
      sessionId: 'session-12345'
    })
  });
  
  return await response.json();
};

// Then book if available
const bookAppointment = async () => {
  const response = await fetch('https://your-app.domain/api/mcp/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': 'your-api-key'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Book boarding for my dog' }
      ],
      tools: [
        {
          name: 'book_appointment',
          parameters: {
            serviceId: 'boarding-standard',
            petId: 1,
            startDate: '2025-05-15',
            startTime: '09:00',
            endDate: '2025-05-20',
            notes: 'Please give medication in the morning'
          }
        }
      ],
      sessionId: 'session-12345'
    })
  });
  
  return await response.json();
};
```

### n8n Integration with MCP Tools

The PawPerfect application includes special support for n8n integration. Using the n8n MCP Client node, you can interact with all available tools and context data.

#### n8n MCP Client Node Usage

1. **List Available Tools Operation**:
   - Node: MCP Client (SSE)
   - Operation: List Tools
   - URL: https://your-app.domain/api/mcp
   - Authentication: API Key (in header)
   
   This returns a list of all available tools and their parameters.

2. **Execute Tool Operation**:
   - Node: MCP Client (SSE)
   - Operation: Execute Tool
   - URL: https://your-app.domain/api/mcp
   - Tool: select from dropdown (book_appointment, check_availability, etc.)
   - Parameters: configure based on the selected tool
   
   This executes the selected tool with the provided parameters.

3. **Get Context Operation**:
   - Node: MCP Client (SSE)
   - Operation: Get Context
   - URL: https://your-app.domain/api/mcp
   - Contexts: select from dropdown (services, bookings, pets, owners, availability)
   - Parameters: configure any filter parameters
   
   This retrieves the requested context data.

#### Example n8n Workflow

```json
{
  "nodes": [
    {
      "parameters": {
        "url": "https://dog-care-manager-polychlorinated.replit.app/api/mcp",
        "authentication": "apiKey",
        "apiKey": {
          "name": "apiKey",
          "value": "mcp-api-key-123"
        },
        "operation": "executeTool",
        "tool": "book_appointment",
        "parameters": {
          "serviceId": "boarding-standard",
          "petId": 1,
          "startDate": "2025-05-15",
          "startTime": "09:00",
          "endDate": "2025-05-18"
        }
      },
      "name": "MCP Client (SSE)",
      "type": "n8n-nodes-base.mcpClient",
      "typeVersion": 1
    }
  ]
}
```

### Two-Way Communication Pattern

The MCP API enables a powerful two-way communication pattern between AI agents and the PawPerfect system:

1. **Context Retrieval (Data Access)**
   - AI agents can request context data through `/api/mcp/context` (REST) or `/api/mcp/context-stream` (SSE)
   - This provides the AI with understanding of the business domain: services, bookings, customers, pets, etc.
   - Contexts can be filtered using parameters to get precisely the needed information

2. **Tool Execution (Action Execution)**
   - AI agents can perform actions through the `/api/mcp/messages` endpoint
   - Actions are executed by specifying tools and their parameters
   - This allows the AI to make changes to the system: create bookings, add customers, etc.

This bidirectional flow enables AI agents to first understand the current state of the system by retrieving context data, and then take appropriate actions based on that understanding.

## Example Integration with n8n

### n8n Tool Integration

The PawPerfect application supports n8n integration through the Model Context Protocol (MCP) with predefined tools for common operations. This enables n8n AI agents to interact with the application using natural language commands.

Available tools include:
- **book_appointment**: Create new bookings for pet services
- **check_availability**: Query service availability by date
- **create_customer**: Create new customer records
- **add_pet**: Register new pets for existing customers

To integrate with n8n:

1. Import the provided n8n workflow template (`n8n-booking-example.json`)
2. URL is already set to point to your deployed application: https://dog-care-manager-polychlorinated.replit.app
3. Set the authentication credentials (API key or username/password)
4. Configure the AI agent to use the available tools based on user requests
5. Activate the workflow

### REST API Integration

To integrate with n8n for automatic booking creation using the REST API:

1. Import the provided n8n workflow template (`n8n-booking-example.json`)
2. URL is already set to point to your deployed application: https://dog-care-manager-polychlorinated.replit.app
3. Set the authentication credentials (username/password)
4. Update the parameters (ownerId, petId, serviceId) to match your data
5. Activate the workflow

### Server-Sent Events (SSE) Integration

The SSE endpoint is specifically designed to work with cross-origin requests, including n8n. The endpoint includes all necessary CORS headers to ensure compatibility with external services.

For real-time data streaming with n8n using the SSE endpoint:

1. Install the `n8n-nodes-mcp` package in your n8n instance
2. Create a new workflow and add the "MCP Client" node with transport type set to "Server-Sent Events (SSE)"
3. Configure the node with the following settings:
   - **SSE URL**: The URL of the SSE endpoint: `https://dog-care-manager-polychlorinated.replit.app/api/mcp/context-stream`
   - **Messages Post Endpoint**: (Optional) For n8n compatibility, leave this field blank. The application handles all SSE communication through the SSE URL. This field is only needed in scenarios where the endpoint for sending messages back to the SSE server differs from the main SSE URL.
   - **Additional Headers**: Add the `apiKey` header in the format: `apiKey:your-api-key`
4. Select the operation from the dropdown (e.g., "Get Context")
5. Configure the context parameters:
   - **Additional Headers**: (Optional) You can add custom headers, including:
     - `apiKey`: Alternative way to provide your API key
     - `Authorization`: Alternative way to authenticate with `Bearer YOUR_API_KEY`
   - **Contexts**: Comma-separated list of contexts to fetch (e.g., `services,pets`)
   - **Parameters**: JSON object of filter parameters if needed
6. Connect the output to other nodes in your workflow
7. Activate the workflow

The SSE transport provides the following advantages:
- Real-time streaming of data updates
- More efficient for large datasets
- Automatic reconnection handling
- Progressive loading of context data

## Webhook Integration

The PawPerfect application also provides webhook functionality for real-time event notifications. Refer to the Webhook documentation for more information about subscribing to events such as:

- `booking.created`: When a new booking is created
- `booking.updated`: When a booking is updated
- `booking.cancelled`: When a booking is cancelled
- `pet.created`: When a new pet is added
- `pet.updated`: When pet information is updated
- `owner.created`: When a new owner is created
- `owner.updated`: When owner information is updated
- `availability.updated`: When service availability is updated
#### CORS Troubleshooting for SSE

If you experience CORS issues when connecting to the SSE endpoint:

1. Ensure you're using the correct endpoint URL: `/api/mcp/context-stream`
2. Check that your authentication method matches one of the supported options:
   - Query parameter: `?apiKey=your-api-key`
   - Header: `apiKey: your-api-key`
   - Authorization header: `Authorization: Bearer your-api-key`
3. For custom integrations, ensure your client respects CORS preflight requests
4. If testing with browser-based tools, disable any browser extensions that might interfere with CORS

### Using n8n with AI Agents for PawPerfect

The PawPerfect application includes special support for n8n AI agents, allowing them to interact with the system using natural language processing and predefined tools. This integration enables more intuitive booking, availability checking, and customer management.

#### Setting Up n8n AI Agent Integration

1. **Create a new n8n workflow** with the "AI Agent" node
2. **Configure authentication** using the API key method:
   ```
   headers: {
     "apiKey": "your-api-key"
   }
   ```
3. **Define the messages endpoint URL** in the AI Agent settings:
   ```
   https://dog-care-manager-polychlorinated.replit.app/api/mcp/messages
   ```
4. **Configure the available tools** in the AI Agent node, including:
   - `book_appointment`
   - `check_availability`
   - `create_customer`
   - `add_pet`

5. **Example workflow configuration for booking**:
   ```json
   {
     "nodes": [
       {
         "name": "AI Agent",
         "type": "n8n-nodes-base.ai-agent",
         "parameters": {
           "endpoint": "https://dog-care-manager-polychlorinated.replit.app/api/mcp/messages",
           "authentication": "headerAuth",
           "headerAuth": {
             "apiKey": "your-api-key"
           },
           "tools": [
             {
               "name": "book_appointment",
               "parameters": {
                 "serviceId": "=data.serviceId",
                 "petId": "=data.petId",
                 "startDate": "=data.startDate",
                 "startTime": "=data.startTime",
                 "endDate": "=data.endDate"
               }
             },
             {
               "name": "check_availability",
               "parameters": {
                 "serviceId": "=data.serviceId",
                 "startDate": "=data.startDate"
               }
             }
           ]
         }
       }
     ]
   }
   ```

### Testing MCP Tools

To validate that your MCP tools integration is working correctly, you can use these test requests:

#### 1. Test `check_availability` Tool:
```bash
curl -X POST https://dog-care-manager-polychlorinated.replit.app/api/mcp/messages \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Check availability for boarding services"
      }
    ],
    "tools": [
      {
        "name": "check_availability",
        "parameters": {
          "serviceId": "boarding-standard",
          "startDate": "2025-05-15"
        }
      }
    ],
    "sessionId": "abc-session-123"
  }'
```

#### 2. Test `book_appointment` Tool:
```bash
curl -X POST https://dog-care-manager-polychlorinated.replit.app/api/mcp/messages \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Book boarding for my dog"
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
    "sessionId": "abc-session-123"
  }'
```

### Session Continuity with sessionId

The PawPerfect MCP API supports maintaining conversation context across multiple requests using the optional `sessionId` parameter. This is particularly valuable for multi-turn conversations with AI agents, such as n8n workflows or custom chatbots that interact with your application.

**Benefits of using sessionId:**
- Maintains context between multiple requests
- Allows for multi-turn conversations with continuity
- Supports AI agents that need to refer to previous interactions
- Enables applications to group related operations together

**How to use sessionId:**
1. Include a `sessionId` parameter in your `/api/mcp/messages` requests
2. Use the same sessionId value for related requests that should share context
3. The sessionId will be returned in all responses to help track conversation flow

**Example use cases:**
- A booking conversation that spans multiple messages (availability check, then booking)
- A pet registration flow that collects information across multiple turns
- A customer service chatbot that maintains context about the user's issue

### Important Notes About n8n Integration

When configuring the SSE trigger in n8n, you can leave the "Messages Post Endpoint" field blank. This field is only needed when the endpoint for posting messages back to the SSE server differs from the main SSE URL. In our implementation:

1. All SSE communication happens through the main `/api/mcp/context-stream` endpoint
2. No separate posting endpoint is required for standard operation
3. For sending notifications or other server-initiated messages, use the appropriate API endpoints documented above
4. For AI agent interactions, use the `/api/mcp/messages` endpoint

If you're experiencing connection issues with n8n, double-check your:
- CORS configuration
- Authentication method (API key in query parameter, header, or Authorization header)
- Network/firewall settings allowing SSE connections
- Tool parameter formats and required fields
