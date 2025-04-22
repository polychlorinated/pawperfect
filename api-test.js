import fetch from 'node-fetch';

// Configuration
const API_BASE = 'http://localhost:5000';
const USERNAME = 'admin';  // Admin username from seed data
const PASSWORD = 'admin123';  // Admin password from seed data

// Helper for making authenticated API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    // First authenticate
    const loginRes = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
      credentials: 'include'
    });
    
    const cookies = loginRes.headers.get('set-cookie');
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }
    
    // Now make the actual request
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: body ? JSON.stringify(body) : null,
      credentials: 'include'
    });
    
    const data = await res.json();
    
    console.log(`${method} ${endpoint} - Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    
    return { status: res.status, data };
  } catch (error) {
    console.error(`Error with ${method} ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('Testing API endpoints...');
  
  // Test 1: Get current user
  await apiRequest('/api/user');
  
  // Test 2: Create a new owner
  const ownerData = {
    firstName: 'Test',
    lastName: 'Owner',
    email: `test-${Date.now()}@example.com`,
    phone: '555-123-4567',
    address: '123 Test St'
  };
  
  const { data: ownerResponse } = await apiRequest('/api/owners', 'POST', ownerData);
  
  if (!ownerResponse || ownerResponse.error) {
    console.log('Owner creation failed, skipping pet creation test');
    return;
  }
  
  // The owner ID is in data.id (not data.ownerId)
  const ownerId = ownerResponse.data.id;
  console.log(`Created owner with ID: ${ownerId}`);
  
  // Test 3: Create a pet for this owner
  const petData = {
    name: 'Test Pet',
    ownerId,
    breed: 'Mixed',
    age: 2,
    weight: 15,
    gender: 'female',
    isVaccinated: true
  };
  
  const { data: petResponse } = await apiRequest('/api/pets', 'POST', petData);
  
  if (!petResponse || petResponse.error) {
    console.log('Pet creation failed, skipping booking creation test');
    return;
  }
  
  const petId = petResponse.data.id;
  console.log(`Created pet with ID: ${petId}`);
  
  // Test 4: Get all services
  const { data: servicesResponse } = await apiRequest('/api/services');
  
  if (!servicesResponse || !servicesResponse.services || !servicesResponse.services.length) {
    console.log('No services found, skipping booking creation test');
    return;
  }
  
  const serviceId = servicesResponse.services[0].serviceId;
  console.log(`Using service ID: ${serviceId}`);
  
  // Test 5: Create a booking
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 3);
  
  const bookingData = {
    ownerId,
    petId,
    selectedPetId: petId, // Add this field for the API
    serviceId,
    startDate: today.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '16:00', // Add end time
    status: 'pending',
    notes: 'Test booking created through API test'
  };
  
  const { data: bookingResponse } = await apiRequest('/api/bookings', 'POST', bookingData);
  
  if (!bookingResponse || bookingResponse.error) {
    console.log('Booking creation failed');
    return;
  }
  
  const bookingId = bookingResponse.data.bookingId;
  console.log(`Created booking with ID: ${bookingId}`);
  
  // Test 6: Update booking status
  await apiRequest(`/api/bookings/${bookingId}`, 'PUT', { status: 'confirmed' });
  
  // Test 7: Cancel booking
  await apiRequest(`/api/bookings/${bookingId}`, 'DELETE');
  
  console.log('Tests completed!');
}

// Run the tests
runTests().catch(console.error);