import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ApiDocs() {
  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardHeader className="px-6 py-5 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium text-gray-900">API Documentation</CardTitle>
                <CardDescription className="text-sm text-gray-500">Use our API to integrate dog boarding and grooming services into your application.</CardDescription>
              </div>
              <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                VERIFIED
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs defaultValue="authentication">
              <TabsList className="mb-6">
                <TabsTrigger value="authentication">Authentication</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="owners">Owners</TabsTrigger>
                <TabsTrigger value="pets">Pets</TabsTrigger>
                <TabsTrigger value="mcp">Model Context Protocol</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="authentication">
                <h3 className="text-lg font-medium text-gray-900">Authentication</h3>
                <p className="mt-1 text-sm text-gray-500">All API requests use session-based authentication. You must first log in to access protected endpoints.</p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">Login</h4>
                  <p className="mt-1 text-sm text-gray-500">Authenticate with the API using your credentials.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/login</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "username": "admin",
  "password": "password123"
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "id": 3,
  "username": "admin",
  "email": "admin@pawperfect.com",
  "isAdmin": true,
  "ownerId": null
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Get Current User</h4>
                  <p className="mt-1 text-sm text-gray-500">Retrieve the currently authenticated user.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/user</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "id": 3,
  "username": "admin",
  "email": "admin@pawperfect.com",
  "isAdmin": true,
  "ownerId": null
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Logout</h4>
                  <p className="mt-1 text-sm text-gray-500">End the current user session.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/logout</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "message": "Logged out successfully"
}`}</code></pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="services">
                <h3 className="text-lg font-medium text-gray-900">Services Endpoints</h3>
                <p className="mt-1 mb-4 text-sm text-gray-500">
                  <Badge className="mr-2 text-green-600 bg-green-50 border-green-200">VERIFIED</Badge>
                  These endpoints have been tested and confirmed working.
                </p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">Get All Services</h4>
                  <p className="mt-1 text-sm text-gray-500">Retrieve a list of all available services.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/services</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "services": [
    {
      "id": 1,
      "serviceId": "boarding-standard",
      "name": "Standard Boarding",
      "description": "Daily walks, feeding, and basic care",
      "price": 45.00,
      "priceUnit": "per_night",
      "category": "boarding"
    },
    {
      "id": 4,
      "serviceId": "grooming-bath",
      "name": "Bath & Brush",
      "description": "Shampoo, conditioning, blow dry, and brush out",
      "price": 40.00,
      "priceUnit": "per_service",
      "category": "grooming"
    }
    // Additional services...
  ]
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Get Service Details</h4>
                  <p className="mt-1 text-sm text-gray-500">Retrieve details for a specific service.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/services/{"{serviceId}"}</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Path Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">serviceId</td>
                            <td className="px-3 py-2 whitespace-nowrap">string</td>
                            <td className="px-3 py-2">The ID of the service to retrieve</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "service": {
    "id": 1,
    "serviceId": "boarding-standard",
    "name": "Standard Boarding",
    "description": "Daily walks, feeding, and basic care",
    "price": 45.00,
    "priceUnit": "per_night",
    "category": "boarding"
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="availability">
                <h3 className="text-lg font-medium text-gray-900">Availability Endpoints</h3>
                <p className="mt-1 mb-4 text-sm text-gray-500">
                  <Badge className="mr-2 text-green-600 bg-green-50 border-green-200">VERIFIED</Badge>
                  These endpoints have been tested and confirmed working.
                </p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">Get Service Availability</h4>
                  <p className="mt-1 text-sm text-gray-500">Check availability for a specific service and date range.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/availability/{"{serviceId}"}</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Path Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">serviceId</td>
                            <td className="px-3 py-2 whitespace-nowrap">string</td>
                            <td className="px-3 py-2">The ID of the service to check availability for</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Query Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">start_date</td>
                            <td className="px-3 py-2 whitespace-nowrap">string (YYYY-MM-DD)</td>
                            <td className="px-3 py-2">Start date for availability check</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">end_date</td>
                            <td className="px-3 py-2 whitespace-nowrap">string (YYYY-MM-DD)</td>
                            <td className="px-3 py-2">End date for availability check</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "availability": [
    {
      "date": "2023-09-06",
      "available": true,
      "timeSlots": [
        {
          "time": "08:00:00",
          "available": true
        },
        {
          "time": "10:00:00",
          "available": true
        },
        // Additional time slots...
      ]
    },
    // Additional dates...
  ]
}`}</code></pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="bookings">
                <h3 className="text-lg font-medium text-gray-900">Booking Endpoints</h3>
                <p className="mt-1 mb-4 text-sm text-gray-500">
                  <Badge className="mr-2 text-green-600 bg-green-50 border-green-200">VERIFIED</Badge>
                  These endpoints have been tested and confirmed working.
                </p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">Create Booking</h4>
                  <p className="mt-1 text-sm text-gray-500">Create a new booking for a service.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/bookings</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "serviceId": "boarding-standard",
  "startDate": "2023-09-06",
  "startTime": "08:00:00",
  "endDate": "2023-09-09",
  "endTime": "10:00:00",
  "selectedPetId": 1
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1,
    "bookingId": "BOK-12345678",
    "serviceId": "boarding-standard",
    "startDate": "2023-09-06T00:00:00.000Z",
    "startTime": "08:00:00",
    "endDate": "2023-09-09T00:00:00.000Z",
    "endTime": "10:00:00",
    "totalPrice": 135.00,
    "status": "confirmed",
    "petId": 1,
    "ownerId": 1
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Get Booking Details</h4>
                  <p className="mt-1 text-sm text-gray-500">Retrieve details for a specific booking.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/bookings/{"{bookingId}"}</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Path Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">bookingId</td>
                            <td className="px-3 py-2 whitespace-nowrap">string</td>
                            <td className="px-3 py-2">The ID of the booking to retrieve</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "booking": {
    "id": 1,
    "bookingId": "BOK-12345678",
    "serviceId": "boarding-standard",
    "startDate": "2023-09-06T00:00:00.000Z",
    "startTime": "08:00:00",
    "endDate": "2023-09-09T00:00:00.000Z",
    "endTime": "10:00:00",
    "totalPrice": 135.00,
    "status": "confirmed",
    "petId": 1,
    "ownerId": 1,
    "createdAt": "2023-09-01T12:00:00.000Z"
  },
  "pet": {
    "id": 1,
    "name": "Buddy",
    "breed": "Golden Retriever",
    "age": 3,
    "weight": 65,
    "gender": "male",
    "specialNeeds": "Takes medication twice daily",
    "isVaccinated": true
  },
  "owner": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "phone": "5551234567",
    "address": "123 Main St, Anytown, USA"
  },
  "service": {
    "id": 1,
    "serviceId": "boarding-standard",
    "name": "Standard Boarding",
    "description": "Daily walks, feeding, and basic care",
    "price": 45.00,
    "priceUnit": "per_night",
    "category": "boarding"
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Update Booking Status</h4>
                  <p className="mt-1 text-sm text-gray-500">Update the status of a booking.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 font-medium">PATCH</span>
                      <span className="ml-2 font-mono">/api/bookings/{"{bookingId}"}/status</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Path Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">bookingId</td>
                            <td className="px-3 py-2 whitespace-nowrap">string</td>
                            <td className="px-3 py-2">The ID of the booking to update</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "status": "completed"
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "bookingId": "BOK-12345678",
    "status": "completed"
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="owners">
                <h3 className="text-lg font-medium text-gray-900">Owner Endpoints</h3>
                <p className="mt-1 mb-4 text-sm text-gray-500">
                  <Badge className="mr-2 text-green-600 bg-green-50 border-green-200">VERIFIED</Badge>
                  These endpoints have been tested and confirmed working.
                </p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">Create Owner</h4>
                  <p className="mt-1 text-sm text-gray-500">Create a new pet owner in the system.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/owners</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "555-123-4567",
  "address": "123 Main St"
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "success": true,
  "message": "Owner created successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St"
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Update Owner</h4>
                  <p className="mt-1 text-sm text-gray-500">Update an existing owner's information.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 font-medium">PUT</span>
                      <span className="ml-2 font-mono">/api/owners/{"{id}"}</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Path Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">id</td>
                            <td className="px-3 py-2 whitespace-nowrap">number</td>
                            <td className="px-3 py-2">The ID of the owner to update</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "phone": "555-987-6543",
  "address": "456 New Address St"
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "success": true,
  "message": "Owner updated successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "phone": "555-987-6543",
    "address": "456 New Address St"
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mcp">
                <h3 className="text-lg font-medium text-gray-900">Model Context Protocol API</h3>
                <p className="mt-1 mb-4 text-sm text-gray-500">
                  <Badge className="mr-2 text-blue-600 bg-blue-50 border-blue-200">NEW</Badge>
                  Standardized API for AI and automation integration
                </p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">MCP Provider Info</h4>
                  <p className="mt-1 text-sm text-gray-500">Get information about the MCP provider and available contexts</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/mcp/info</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "name": "PawPerfect Pet Boarding",
  "description": "Model Context Protocol provider for PawPerfect pet boarding application",
  "version": "1.0.0",
  "tools": [
    {
      "name": "book_appointment",
      "description": "Create a new booking for a pet service",
      "parameters": [...]
    },
    {
      "name": "check_availability",
      "description": "Query available time slots for a service",
      "parameters": [...]
    },
    {
      "name": "create_customer",
      "description": "Create a new customer record",
      "parameters": [...]
    },
    {
      "name": "add_pet",
      "description": "Register a new pet for an owner",
      "parameters": [...]
    }
  ],
  "contextSchema": {
    "services": { ... },
    "bookings": { ... },
    "pets": { ... },
    "owners": { ... },
    "availability": { ... }
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Request Context</h4>
                  <p className="mt-1 text-sm text-gray-500">Retrieve context data from the MCP provider</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/mcp/context</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "contexts": ["services", "pets"],
  "parameters": {
    "category": "boarding",
    "isVaccinated": true
  },
  "authentication": {
    "apiKey": "your-api-key"
  }
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
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
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Stream Context</h4>
                  <p className="mt-1 text-sm text-gray-500">Stream context data using Server-Sent Events (SSE)</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">GET</span>
                      <span className="ml-2 font-mono">/api/mcp/context-stream</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Query Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">contexts</td>
                            <td className="px-3 py-2 whitespace-nowrap">string</td>
                            <td className="px-3 py-2">Comma-separated list of contexts to retrieve</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">parameters</td>
                            <td className="px-3 py-2 whitespace-nowrap">string (JSON)</td>
                            <td className="px-3 py-2">Filter parameters as JSON string</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">apiKey</td>
                            <td className="px-3 py-2 whitespace-nowrap">string</td>
                            <td className="px-3 py-2">Authentication API key</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response Events</h5>
                      <p className="mt-1 text-sm text-gray-600">Server-Sent Events with the following event types:</p>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">info</td>
                            <td className="px-3 py-2">Connection established</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">context</td>
                            <td className="px-3 py-2">Context data for a requested context</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">error</td>
                            <td className="px-3 py-2">Error information</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">complete</td>
                            <td className="px-3 py-2">All contexts have been streamed</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Execute Tools</h4>
                  <p className="mt-1 text-sm text-gray-500">Execute MCP tools to perform actions in the system</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/mcp/messages</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
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
  "authentication": {
    "apiKey": "your-api-key"
  }
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
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
}`}</code></pre>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">MCP Tools</h4>
                  <p className="mt-1 text-sm text-gray-500">Available tools for performing actions through the MCP API</p>
                  
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                      <h5 className="text-base font-medium text-gray-900">book_appointment</h5>
                      <p className="mt-1 text-sm text-gray-500">Create a new booking for a pet service</p>
                      
                      <div className="mt-2">
                        <h6 className="text-xs font-semibold text-gray-700">Parameters</h6>
                        <table className="mt-1 min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">serviceId</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">petId</td>
                              <td className="px-3 py-2 whitespace-nowrap">number</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">startDate</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">startTime</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">endDate</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">notes</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                      <h5 className="text-base font-medium text-gray-900">check_availability</h5>
                      <p className="mt-1 text-sm text-gray-500">Query available time slots for a specific service and date range</p>
                      
                      <div className="mt-2">
                        <h6 className="text-xs font-semibold text-gray-700">Parameters</h6>
                        <table className="mt-1 min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">serviceId</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">startDate</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">endDate</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">includeTimeSlots</td>
                              <td className="px-3 py-2 whitespace-nowrap">boolean</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                      <h5 className="text-base font-medium text-gray-900">create_customer</h5>
                      <p className="mt-1 text-sm text-gray-500">Create a new customer record in the system</p>
                      
                      <div className="mt-2">
                        <h6 className="text-xs font-semibold text-gray-700">Parameters</h6>
                        <table className="mt-1 min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">firstName</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">lastName</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">email</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">phone</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">address</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                      <h5 className="text-base font-medium text-gray-900">add_pet</h5>
                      <p className="mt-1 text-sm text-gray-500">Register a new pet associated with an existing owner</p>
                      
                      <div className="mt-2">
                        <h6 className="text-xs font-semibold text-gray-700">Parameters</h6>
                        <table className="mt-1 min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">ownerId</td>
                              <td className="px-3 py-2 whitespace-nowrap">number</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">name</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">breed</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">Yes</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">age</td>
                              <td className="px-3 py-2 whitespace-nowrap">number</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">weight</td>
                              <td className="px-3 py-2 whitespace-nowrap">number</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">gender</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">isVaccinated</td>
                              <td className="px-3 py-2 whitespace-nowrap">boolean</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">specialNeeds</td>
                              <td className="px-3 py-2 whitespace-nowrap">string</td>
                              <td className="px-3 py-2 whitespace-nowrap">No</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 mb-4">
                  <h4 className="text-base font-medium text-gray-900">More MCP Documentation</h4>
                  <p className="mt-1 text-sm text-gray-500">For more detailed information about the Model Context Protocol implementation, visit the MCP page.</p>
                  <div className="mt-2">
                    <a href="/model-context-protocol" className="text-blue-600 hover:text-blue-800 font-medium">
                      View MCP Documentation →
                    </a>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pets">
                <h3 className="text-lg font-medium text-gray-900">Pet Endpoints</h3>
                <p className="mt-1 mb-4 text-sm text-gray-500">
                  <Badge className="mr-2 text-green-600 bg-green-50 border-green-200">VERIFIED</Badge>
                  These endpoints have been tested and confirmed working.
                </p>
                
                <div className="mt-4">
                  <h4 className="text-base font-medium text-gray-900">Create Pet</h4>
                  <p className="mt-1 text-sm text-gray-500">Create a new pet profile in the system.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 font-medium">POST</span>
                      <span className="ml-2 font-mono">/api/pets</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "name": "Buddy",
  "ownerId": 1,
  "breed": "Golden Retriever",
  "age": 3,
  "weight": 30,
  "gender": "male",
  "specialNeeds": null,
  "isVaccinated": true,
  "vetName": "Dr. Smith",
  "vetPhone": "123-456-7890"
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "success": true,
  "message": "Pet created successfully",
  "data": {
    "id": 1,
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
    "vetAddress": null,
    "vetLastVisit": null,
    "medicalHistory": null,
    "medicationInstructions": null,
    "dietaryRestrictions": null,
    "behavioralNotes": null
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Update Pet</h4>
                  <p className="mt-1 text-sm text-gray-500">Update an existing pet's information.</p>
                  
                  <div className="mt-2 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 font-medium">PUT</span>
                      <span className="ml-2 font-mono">/api/pets/{"{id}"}</span>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Path Parameters</h5>
                      <table className="mt-1 min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">id</td>
                            <td className="px-3 py-2 whitespace-nowrap">number</td>
                            <td className="px-3 py-2">The ID of the pet to update</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Request Body</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "name": "Buddy",
  "age": 4,
  "weight": 35,
  "vetName": "Dr. Johnson",
  "behavioralNotes": "Friendly with children and other dogs"
}`}</code></pre>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700">Response</h5>
                      <pre className="mt-1 text-sm font-mono"><code>{`{
  "success": true,
  "message": "Pet updated successfully",
  "data": {
    "id": 1,
    "name": "Buddy",
    "ownerId": 1,
    "breed": "Golden Retriever",
    "age": 4,
    "weight": 35,
    "gender": "male",
    "specialNeeds": null,
    "isVaccinated": true,
    "vetName": "Dr. Johnson",
    "vetPhone": "123-456-7890",
    "vetAddress": null,
    "vetLastVisit": null,
    "medicalHistory": null,
    "medicationInstructions": null,
    "dietaryRestrictions": null,
    "behavioralNotes": "Friendly with children and other dogs"
  }
}`}</code></pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="errors">
                <h3 className="text-lg font-medium text-gray-900">Error Handling</h3>
                <p className="mt-1 text-sm text-gray-500">The API uses standard HTTP status codes and provides error details in the response body.</p>
                
                <div className="mt-4 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto">
                  <pre className="text-sm font-mono"><code>{`{
  "error": {
    "code": "service_unavailable",
    "message": "The requested service is not available for the specified date and time.",
    "details": {
      "service_id": "boarding-standard",
      "date": "2023-09-06"
    }
  }
}`}</code></pre>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Common Error Codes</h4>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Error Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">400</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">invalid_request</td>
                          <td className="px-6 py-4 text-sm text-gray-500">The request is malformed or missing required parameters</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">400</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">invalid_pet_data</td>
                          <td className="px-6 py-4 text-sm text-gray-500">The pet data provided is invalid</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">400</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">invalid_owner_data</td>
                          <td className="px-6 py-4 text-sm text-gray-500">The owner data provided is invalid</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">401</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">unauthorized</td>
                          <td className="px-6 py-4 text-sm text-gray-500">Authentication failed or token is invalid</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">404</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">service_not_found</td>
                          <td className="px-6 py-4 text-sm text-gray-500">The requested service was not found</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">404</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">booking_not_found</td>
                          <td className="px-6 py-4 text-sm text-gray-500">The requested booking was not found</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">409</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">service_unavailable</td>
                          <td className="px-6 py-4 text-sm text-gray-500">The requested service is not available for the specified date and time</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">500</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">internal_server_error</td>
                          <td className="px-6 py-4 text-sm text-gray-500">An unexpected error occurred on the server</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
