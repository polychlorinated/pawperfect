# PawPerfect Booking Agent Instructions for n8n

## Agent Overview

You are a PawPerfect booking agent responsible for working with the PawPerfect application. This includes creating, modifying, and cancelling appointments, looking up information about current clients and potential services. You may also be asked to provide available times for another agent to choose from.

## Agent Goals

Your primary goals are:

1. Understand customer requirements and instructions
2. Retrieve information about services, availability, pets, and owners
3. Create new bookings and manage existing ones
4. Register new customers and pets as needed
5. Provide clear, accurate information back to customers

## Technical Setup and API Endpoints

Use the following HTTP request nodes in n8n to interact with the PawPerfect application API:

### 1. PawPerfect Info Request

**Endpoint:** `GET /api/mcp/info`

This is your first stop to understand what information and actions are available. It returns:
- List of available services with details
- Details about data formats (context schema)
- List of available tools and their parameters

**HTTP Request Node Configuration:**
- **Method:** GET
- **URL:** `https://pawperfect.yourdomain.com/api/mcp/info`
- **Authentication:** None (This endpoint is publicly accessible)

**When to use:**
- At the beginning of your workflow
- When you need to know what services are available
- When you need to understand data structures

### 2. PawPerfect Context Request

**Endpoint:** `POST /api/mcp/context`

Use this endpoint to retrieve specific data about:
- Services
- Bookings
- Pets
- Owners
- Availability

**HTTP Request Node Configuration:**
- **Method:** POST
- **URL:** `https://pawperfect.yourdomain.com/api/mcp/context`
- **Headers:**
  - `Content-Type: application/json`
  - `apiKey: your-api-key`
- **Body:**
```json
{
  "contexts": ["services", "pets"],
  "parameters": {
    "ownerId": 1
  },
  "authentication": {
    "apiKey": "your-api-key"
  }
}
```

**When to use:**
- To look up available services and their details
- To retrieve information about a specific pet or owner
- To check booking history
- To get availability for specific dates

### 3. PawPerfect Context Stream (SSE)

**Endpoint:** `GET /api/mcp/context-stream`

An alternative to the context endpoint that uses Server-Sent Events (SSE) to stream data in real-time. This is particularly useful for retrieving large amounts of data or maintaining a persistent connection for updates.

**HTTP Request Node Configuration:**
- Use an SSE node in n8n
- **URL:** `https://pawperfect.yourdomain.com/api/mcp/context-stream?contexts=services,bookings&apiKey=your-api-key`
- **Headers:**
  - `Accept: text/event-stream`

**When to use:**
- For real-time updates
- When retrieving large datasets that might take time to process

### 4. PawPerfect Action Request (Messages)

**Endpoint:** `POST /api/mcp/messages`

This is your main endpoint for performing actions in the system. It allows you to execute tools that create bookings, add customers, register pets, and check availability.

**HTTP Request Node Configuration:**
- **Method:** POST
- **URL:** `https://pawperfect.yourdomain.com/api/mcp/messages`
- **Headers:**
  - `Content-Type: application/json`
  - `apiKey: your-api-key`
- **Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a PawPerfect booking assistant."
    },
    {
      "role": "user",
      "content": "I'd like to book a grooming appointment for my dog Max."
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
  "authentication": {
    "apiKey": "your-api-key"
  },
  "sessionId": "conversation-123456"
}
```

**Available Tools:**
1. `book_appointment` - Create new bookings
2. `check_availability` - Find available time slots
3. `create_customer` - Register new customers
4. `add_pet` - Add pets to customer profiles

**When to use:**
- To execute actions that modify the system
- When creating new bookings, customers, or pets
- When checking specific availability

## Decision Flow

Use this decision flow to determine which endpoint to use:

1. **Need to know about available services?**
   - Use `/api/mcp/info` or `/api/mcp/context` with `contexts: ["services"]`

2. **Need details about a specific pet, owner, or booking?**
   - Use `/api/mcp/context` with appropriate contexts and parameters

3. **Need to create a new booking or customer?**
   - Use `/api/mcp/messages` with the appropriate tool

4. **Need to check availability for a service on specific dates?**
   - Use `/api/mcp/messages` with the `check_availability` tool

## Detailed Examples

### Example 1: Retrieve Available Services

**HTTP Request:**
```http
POST /api/mcp/context
Content-Type: application/json
apiKey: your-api-key

{
  "contexts": ["services"],
  "authentication": {
    "apiKey": "your-api-key"
  }
}
```

**Response:**
```json
{
  "services": {
    "type": "object",
    "value": {
      "services": [
        {
          "serviceId": "boarding-standard",
          "name": "Standard Dog Boarding",
          "description": "Comfortable overnight stay for your dog with basic care and feeding.",
          "price": 45.99,
          "priceUnit": "per_night",
          "category": "boarding",
          "durationInMinutes": 1440,
          "capacity": 20
        },
        {
          "serviceId": "grooming-deluxe",
          "name": "Deluxe Dog Grooming",
          "description": "Complete grooming service including bath, haircut, nail trim, and ear cleaning.",
          "price": 89.99,
          "priceUnit": "per_session",
          "category": "grooming",
          "durationInMinutes": 120,
          "capacity": 5
        }
      ]
    }
  }
}
```

### Example 2: Creating a New Booking

**HTTP Request:**
```http
POST /api/mcp/messages
Content-Type: application/json
apiKey: your-api-key

{
  "messages": [
    {
      "role": "user",
      "content": "I want to book a grooming appointment for my dog"
    }
  ],
  "tools": [
    {
      "name": "book_appointment",
      "parameters": {
        "serviceId": "grooming-deluxe",
        "petId": 1,
        "startDate": "2025-05-15",
        "startTime": "09:00",
        "notes": "Please use hypoallergenic shampoo"
      }
    }
  ],
  "authentication": {
    "apiKey": "your-api-key"
  },
  "sessionId": "conversation-123456"
}
```

**Response:**
```json
{
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
          "notes": "Please use hypoallergenic shampoo",
          "totalPrice": 89.99
        }
      }
    }
  ]
}
```

### Example 3: Checking Availability

**HTTP Request:**
```http
POST /api/mcp/messages
Content-Type: application/json
apiKey: your-api-key

{
  "messages": [
    {
      "role": "user",
      "content": "I need to check availability for boarding services next week"
    }
  ],
  "tools": [
    {
      "name": "check_availability",
      "parameters": {
        "serviceId": "boarding-standard",
        "startDate": "2025-05-15",
        "endDate": "2025-05-20"
      }
    }
  ],
  "authentication": {
    "apiKey": "your-api-key"
  },
  "sessionId": "conversation-123456"
}
```

**Response:**
```json
{
  "success": true,
  "tool_results": [
    {
      "tool": "check_availability",
      "result": {
        "success": true,
        "data": {
          "serviceId": "boarding-standard",
          "serviceName": "Standard Dog Boarding",
          "availability": [
            {
              "date": "2025-05-15",
              "availableSpots": 12,
              "totalCapacity": 20,
              "isAvailable": true
            },
            {
              "date": "2025-05-16",
              "availableSpots": 10,
              "totalCapacity": 20,
              "isAvailable": true
            },
            {
              "date": "2025-05-17",
              "availableSpots": 8,
              "totalCapacity": 20,
              "isAvailable": true
            },
            {
              "date": "2025-05-18",
              "availableSpots": 15,
              "totalCapacity": 20,
              "isAvailable": true
            },
            {
              "date": "2025-05-19",
              "availableSpots": 18,
              "totalCapacity": 20,
              "isAvailable": true
            },
            {
              "date": "2025-05-20",
              "availableSpots": 16,
              "totalCapacity": 20,
              "isAvailable": true
            }
          ]
        }
      }
    }
  ]
}
```

### Example 4: Creating a New Customer

**HTTP Request:**
```http
POST /api/mcp/messages
Content-Type: application/json
apiKey: your-api-key

{
  "messages": [
    {
      "role": "user",
      "content": "I need to register as a new customer"
    }
  ],
  "tools": [
    {
      "name": "create_customer",
      "parameters": {
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@example.com",
        "phone": "555-123-4567",
        "address": "123 Main St, Anytown, USA"
      }
    }
  ],
  "authentication": {
    "apiKey": "your-api-key"
  },
  "sessionId": "conversation-123456"
}
```

**Response:**
```json
{
  "success": true,
  "tool_results": [
    {
      "tool": "create_customer",
      "result": {
        "success": true,
        "data": {
          "ownerId": 42,
          "firstName": "John",
          "lastName": "Smith",
          "email": "john.smith@example.com",
          "phone": "555-123-4567",
          "address": "123 Main St, Anytown, USA"
        }
      }
    }
  ]
}
```

### Example 5: Adding a New Pet

**HTTP Request:**
```http
POST /api/mcp/messages
Content-Type: application/json
apiKey: your-api-key

{
  "messages": [
    {
      "role": "user",
      "content": "I want to add my dog to my profile"
    }
  ],
  "tools": [
    {
      "name": "add_pet",
      "parameters": {
        "ownerId": 42,
        "name": "Max",
        "breed": "Golden Retriever",
        "age": 3,
        "weight": 65.5,
        "gender": "male",
        "isVaccinated": true,
        "specialNeeds": "Allergic to certain shampoos"
      }
    }
  ],
  "authentication": {
    "apiKey": "your-api-key"
  },
  "sessionId": "conversation-123456"
}
```

**Response:**
```json
{
  "success": true,
  "tool_results": [
    {
      "tool": "add_pet",
      "result": {
        "success": true,
        "data": {
          "petId": 27,
          "ownerId": 42,
          "name": "Max",
          "breed": "Golden Retriever",
          "age": 3,
          "weight": 65.5,
          "gender": "male",
          "isVaccinated": true,
          "specialNeeds": "Allergic to certain shampoos"
        }
      }
    }
  ]
}
```

## n8n Workflow Construction Guidelines

When building workflows in n8n for the PawPerfect agent:

1. **Input Processing:**
   - Use a "Start" node to trigger your workflow
   - Parse incoming messages with a "Function" node to extract intent
   - Use "Switch" nodes to route to the appropriate endpoint based on intent

2. **Dynamic Data Population:**
   - Use the results from context requests to populate dropdown fields or options
   - Store retrieved data in workflow variables for later use

3. **Error Handling:**
   - Add error handlers to catch and process API errors
   - Implement retry logic for transient failures
   - Provide meaningful error messages to users

4. **Response Formatting:**
   - Format API responses into user-friendly messages
   - Highlight important information like booking confirmation numbers and dates
   - Include follow-up options or next steps

## Complete n8n Agent Prompt

Here's a complete prompt to use in a ChatGPT/Workflow node in n8n:

```
You are a PawPerfect booking agent responsible for working with the PawPerfect application. This includes creating, modifying, and cancelling appointments, looking up information about current clients and potential services. You may also be asked to provide available times for another agent to choose from.

Your goals are:
1. Understand the requirements of instructions. Begin by analyzing the input: {{ $json.chatInput }}
 
2. Use the appropriate PawPerfect HTTP request node to interact with the PawPerfect application to complete your tasks:

   - Use "PawPerfect Info Request" (GET /api/mcp/info) to retrieve general information about available services, contexts, and tools.
   
   - Use "PawPerfect Context Request" (POST /api/mcp/context) to retrieve specific data about services, pets, bookings, or owners when you need to look up information.
   
   - Use "PawPerfect Action Request" (POST /api/mcp/messages) to perform actions like booking appointments, checking availability, creating customers, or adding pets. Specify the appropriate tool name and parameters in your request.

For the "PawPerfect Action Request" node, use these tool names based on the task:
- "book_appointment" - For creating new bookings
- "check_availability" - For checking available time slots
- "create_customer" - For creating new customer records
- "add_pet" - For registering new pets

3. After receiving a response from the PawPerfect API, format your reply to the user in a friendly, conversational manner. Include:
   - Confirmation of the action taken (booking created, availability checked, etc.)
   - Any relevant details (booking ID, dates/times, pricing, etc.)
   - Suggestions for next steps or follow-up actions
   - Ask if there's anything else the user needs help with

4. If you encounter any errors or missing information:
   - Clearly explain what went wrong in non-technical terms
   - Ask for the specific information needed to proceed
   - Offer alternatives if the requested service or time is unavailable

Remember that you're representing PawPerfect, so maintain a professional, helpful, and friendly tone throughout the conversation.
```

## Session Management with sessionId

When building conversational agents with n8n, it's important to maintain context across multiple interactions. The PawPerfect API supports this through the optional `sessionId` parameter:

**What is sessionId?**
- A unique identifier that links related requests together in a conversation
- Allows the API to maintain context between messages
- Enables multi-turn interactions where later messages can reference earlier ones

**When to use sessionId:**
- For multi-step workflows where context needs to be maintained
- For conversational agents that have back-and-forth interactions with users
- When a single task (like booking) spans multiple API calls

**How to implement sessionId in n8n:**
1. Generate a unique session ID at the start of a conversation
   ```javascript
   // In a Function node
   const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
   items[0].json.sessionId = sessionId;
   return items;
   ```

2. Store this sessionId in workflow variables or node data
   ```javascript
   // Store in a variable
   $workflow.variables.sessionId = sessionId;
   ```

3. Include the sessionId in all API requests using one of these three methods:

   a. In the request body (for POST/PUT requests):
   ```javascript
   // In an HTTP Request node (body)
   {
     "messages": [ ... ],
     "tools": [ ... ],
     "authentication": { ... },
     "sessionId": $workflow.variables.sessionId
   }
   ```

   b. In the request headers (works for all request types, including GET/POST/PUT):
   ```javascript
   // In an HTTP Request node (headers)
   {
     "Content-Type": "application/json",
     "apiKey": "your-api-key",
     "sessionId": $workflow.variables.sessionId
   }
   ```

   c. In the URL query parameters (works for all request types):
   ```javascript
   // In an HTTP Request node (URL)
   https://yourdomain.com/api/mcp/info?sessionId=${$workflow.variables.sessionId}
   ```

4. Pass the sessionId across multiple nodes in your workflow to maintain context
   - The same sessionId value will be returned in responses
   - Use this value to track conversation state across multiple interactions

## Authentication and Security Notes

- Always store the API key in a credentials vault in n8n, never hardcode it
- Use environment variables for base URLs to easily switch between environments
- Implement proper error handling for authentication failures
- Consider implementing rate limiting to prevent abuse
- Log all actions for audit purposes, but never log sensitive information

## Troubleshooting Common Issues

1. **Authentication Errors:**
   - Verify the API key is correct and being sent in the proper format
   - Check if the API key has the necessary permissions

2. **Invalid Parameters:**
   - Double-check parameter names and formats against the documentation
   - Ensure required parameters are included

3. **Resource Not Found:**
   - Verify IDs for services, pets, and owners exist in the system
   - Use context requests to retrieve valid IDs before creating bookings

4. **Connection Issues:**
   - Check network connectivity to the PawPerfect API
   - Verify the base URL is correct
   - Implement retry logic for transient network failures