# Model Context Protocol (MCP) Messages Endpoint Documentation

## Messages Endpoint: `/api/mcp/messages`

The Messages endpoint is the primary way to execute actions (tools) in the PawPerfect application through the Model Context Protocol. It's designed with AI agents in mind, allowing them to take actions based on user requests.

### Authentication

The endpoint supports multiple authentication methods:

1. **API Key in Request Body**:
   ```json
   {
     "authentication": {
       "apiKey": "your-api-key"
     }
   }
   ```

2. **API Key in Headers**:
   - `apiKey` or `x-api-key` header: `your-api-key`

3. **API Key in Query Parameters**:
   - `?apiKey=your-api-key`

4. **Bearer Token**:
   - `Authorization: Bearer your-token`

### Request Format

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant for PawPerfect."
    },
    {
      "role": "user",
      "content": "I want to book an appointment for my dog Max."
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
        "endDate": "2025-05-15",
        "notes": "Please be gentle with Max, he gets nervous during grooming."
      }
    }
  ],
  "authentication": {
    "apiKey": "your-api-key"
  }
}
```

### Request Fields

| Field | Type | Description |
|-------|------|-------------|
| `messages` | array | Required. Array of message objects representing the conversation. Each message has `role` ("user", "system", or "assistant") and `content` (string). |
| `tools` | array | Optional. Array of tool objects to execute. Each tool has a `name` and `parameters` object. |
| `authentication` | object | Optional. Contains authentication details like `apiKey`. Can be omitted if using header or query parameter authentication. |

### Available Tools

The endpoint supports four primary tools:

#### 1. `book_appointment`

Creates a new booking for a pet service.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceId` | string | Yes | ID of the service to book (e.g., 'boarding-standard', 'grooming-deluxe') |
| `petId` | number | Yes | ID of the pet for which the service is being booked |
| `startDate` | string | Yes | Starting date for the service in ISO format (YYYY-MM-DD) |
| `startTime` | string | Yes | Starting time in 24-hour format (HH:MM) |
| `endDate` | string | No | Ending date for multi-day services like boarding (YYYY-MM-DD) |
| `endTime` | string | No | Ending time in 24-hour format (HH:MM) |
| `notes` | string | No | Special instructions or notes for this booking |

**Example Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Book a deluxe grooming for my dog Max on May 15th at 9am"
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
  }
}
```

#### 2. `create_customer`

Creates a new customer record in the system.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `firstName` | string | Yes | Customer's first name |
| `lastName` | string | Yes | Customer's last name |
| `email` | string | Yes | Customer's email address for communication and login |
| `phone` | string | Yes | Customer's phone number for urgent communications |
| `address` | string | No | Customer's physical address |

**Example Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I'd like to register as a new customer"
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
  }
}
```

#### 3. `add_pet`

Registers a new pet associated with an existing owner.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | Yes | ID of the pet's owner |
| `name` | string | Yes | Pet's name |
| `breed` | string | Yes | Pet's breed, or 'Mixed' if not purebred |
| `age` | number | Yes | Pet's age in years |
| `weight` | number | Yes | Pet's weight in pounds |
| `gender` | string | Yes | Pet's gender: male, female, or unknown |
| `isVaccinated` | boolean | Yes | Whether the pet is up-to-date on vaccinations |
| `specialNeeds` | string | No | Any special care instructions or medical requirements |

**Example Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I want to add my dog Max to my profile"
    }
  ],
  "tools": [
    {
      "name": "add_pet",
      "parameters": {
        "ownerId": 1,
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
  }
}
```

#### 4. `check_availability`

Queries available time slots for a specific service and date range.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceId` | string | Yes | ID of the service to check availability for |
| `startDate` | string | Yes | Start date for availability search (YYYY-MM-DD) |
| `endDate` | string | No | End date for availability search (YYYY-MM-DD) |

**Example Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Check availability for standard boarding from May 15-20, 2025"
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
  }
}
```

### Response Format

#### Successful Tool Execution

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
          "totalPrice": 89.99
        }
      }
    }
  ]
}
```

#### When Tools Are Not Provided

```json
{
  "message": "Message received. Use available tools to perform actions.",
  "available_tools": [
    {
      "name": "book_appointment",
      "description": "Create a new booking for a pet service",
      "parameters": [...]
    },
    {
      "name": "create_customer",
      "description": "Create a new customer record in the system",
      "parameters": [...]
    },
    {
      "name": "add_pet",
      "description": "Register a new pet associated with an existing owner",
      "parameters": [...]
    },
    {
      "name": "check_availability",
      "description": "Query available time slots for a specific service and date range",
      "parameters": [...]
    }
  ]
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "invalid_parameters",
    "message": "Missing required parameters: petId"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Authentication failed or is missing |
| `invalid_request` | 400 | Request format is invalid |
| `missing_parameters` | 400 | Required parameters are missing |
| `unknown_action` | 400 | The specified tool name is not recognized |
| `service_not_found` | 404 | The requested service ID doesn't exist |
| `pet_not_found` | 404 | The requested pet ID doesn't exist |
| `owner_not_found` | 404 | The requested owner ID doesn't exist |
| `booking_not_found` | 404 | The requested booking ID doesn't exist |
| `invalid_status` | 400 | Invalid status value provided |
| `server_error` | 500 | Internal server error |

## Example HTTP Request Using cURL

```bash
curl -X POST https://yourdomain.com/api/mcp/messages \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I want to book a grooming appointment for my dog Max"
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
    ]
  }'
```

## n8n Integration Notes

When configuring n8n HTTP Request nodes:

1. Set the **Method** to `POST`
2. Set the **URL** to `https://yourdomain.com/api/mcp/messages`
3. Add the **Header** `Content-Type: application/json`
4. Add the **Header** `apiKey: your-api-key` or include in the request body
5. Set the **Request Body** to JSON and structure according to the examples above

_This documentation provides complete details for interacting with the `/api/mcp/messages` endpoint, supporting the PawPerfect application's integration with AI agents and automation tools._