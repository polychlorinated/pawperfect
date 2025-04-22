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

async function testUserAuthAndProfile() {
  console.log('==== Testing User Auth and Profile ====');
  // Get current user
  await apiRequest('/api/user');
}

async function testOwners() {
  console.log('==== Testing Owners API ====');
  
  // Create a new owner
  const ownerData = {
    firstName: 'Test',
    lastName: 'Owner',
    email: `test-${Date.now()}@example.com`,
    phone: '555-123-4567',
    address: '123 Test St'
  };
  
  const { data: ownerResponse } = await apiRequest('/api/owners', 'POST', ownerData);
  
  if (!ownerResponse || ownerResponse.error) {
    console.log('Owner creation failed');
    return;
  }
  
  const ownerId = ownerResponse.data.id;
  console.log(`Created owner with ID: ${ownerId}`);
  
  // Update owner - need to include all required fields
  const updateData = {
    firstName: 'Updated',
    lastName: 'Owner',
    email: ownerResponse.data.email, // Keep the same email
    phone: '555-987-6543',
    address: ownerResponse.data.address // Keep the same address
  };
  
  await apiRequest(`/api/owners/${ownerId}`, 'PUT', updateData);
}

async function testPets() {
  console.log('==== Testing Pets API ====');
  
  // First create an owner
  const ownerData = {
    firstName: 'Pet',
    lastName: 'Owner',
    email: `pet-owner-${Date.now()}@example.com`,
    phone: '555-123-7890',
    address: '456 Pet St'
  };
  
  const { data: ownerResponse } = await apiRequest('/api/owners', 'POST', ownerData);
  
  if (!ownerResponse || ownerResponse.error) {
    console.log('Owner creation failed, skipping pet tests');
    return;
  }
  
  const ownerId = ownerResponse.data.id;
  
  // Create a pet for this owner
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
    console.log('Pet creation failed');
    return;
  }
  
  const petId = petResponse.data.id;
  console.log(`Created pet with ID: ${petId}`);
  
  // Update pet
  const updatePetData = {
    name: 'Updated Pet Name',
    age: 3,
    vetName: 'Dr. Veterinarian'
  };
  
  await apiRequest(`/api/pets/${petId}`, 'PUT', updatePetData);
}

async function testServices() {
  console.log('==== Testing Services API ====');
  
  // Get all services
  const { data: servicesResponse } = await apiRequest('/api/services');
  
  // Get single service (using the first service ID)
  await apiRequest('/api/services/boarding-standard');
  
  // Get availability for a service
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  await apiRequest(`/api/availability/boarding-standard?date=${today}`);
  
  return servicesResponse;
}

async function testBookings() {
  console.log('==== Testing Bookings API ====');
  
  // First create an owner
  const ownerData = {
    firstName: 'Booking',
    lastName: 'Tester',
    email: `booking-${Date.now()}@example.com`,
    phone: '555-123-0000',
    address: '789 Booking St'
  };
  
  const { data: ownerResponse } = await apiRequest('/api/owners', 'POST', ownerData);
  
  if (!ownerResponse || ownerResponse.error) {
    console.log('Owner creation failed, skipping booking tests');
    return;
  }
  
  const ownerId = ownerResponse.data.id;
  
  // Create a pet for this owner
  const petData = {
    name: 'Booking Pet',
    ownerId,
    breed: 'Labrador',
    age: 4,
    weight: 25,
    gender: 'male',
    isVaccinated: true
  };
  
  const { data: petResponse } = await apiRequest('/api/pets', 'POST', petData);
  
  if (!petResponse || petResponse.error) {
    console.log('Pet creation failed, skipping booking tests');
    return;
  }
  
  const petId = petResponse.data.id;
  console.log(`Created pet with ID: ${petId}`);
  
  // Get services
  const { data: servicesResponse } = await apiRequest('/api/services');
  
  if (!servicesResponse || !servicesResponse.services || !servicesResponse.services.length) {
    console.log('No services found, skipping booking test');
    return;
  }
  
  const serviceId = servicesResponse.services[0].serviceId;
  console.log(`Using service ID: ${serviceId}`);
  
  // Create a booking
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 3);
  
  const bookingData = {
    ownerId,
    petId,
    selectedPetId: petId,
    serviceId,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '15:00',
    status: 'pending',
    notes: 'Booking created through API test'
  };
  
  const { data: bookingResponse } = await apiRequest('/api/bookings', 'POST', bookingData);
  
  if (!bookingResponse || bookingResponse.error) {
    console.log('Booking creation failed:');
    console.log(JSON.stringify(bookingResponse, null, 2));
    return;
  }
  
  // Extract booking ID (different API responses might structure this differently)
  let bookingId;
  if (bookingResponse.data && bookingResponse.data.bookingId) {
    bookingId = bookingResponse.data.bookingId;
  } else if (bookingResponse.bookingId) {
    bookingId = bookingResponse.bookingId;
  } else if (bookingResponse.id) {
    bookingId = bookingResponse.id;
  }
  
  if (bookingId) {
    console.log(`Created booking with ID: ${bookingId}`);
    
    // Update booking status
    await apiRequest(`/api/bookings/${bookingId}/status`, 'PATCH', { status: 'confirmed' });
  } else {
    console.log('Could not extract booking ID from response');
  }
}

async function runTests() {
  console.log('Starting API tests...');
  
  await testUserAuthAndProfile();
  await testOwners();
  await testPets();
  await testServices();
  await testBookings();
  
  console.log('Tests completed!');
}

// Run the tests
runTests().catch(console.error);