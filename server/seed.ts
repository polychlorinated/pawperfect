import { InsertService, InsertUser } from '@shared/schema';
import { storage } from './storage';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Hash password function
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to seed the database with initial data
export async function seedDatabase() {
  try {
    console.log('Seeding database with initial data...');
    
    // Check if services already exist
    const existingServices = await storage.getServices();
    if (existingServices.length === 0) {
      // Create default services
      const defaultServices: InsertService[] = [
        {
          serviceId: "boarding-standard",
          name: "Standard Boarding",
          description: "Daily walks, feeding, and basic care",
          price: 45.00,
          priceUnit: "per_night",
          category: "boarding",
          durationInMinutes: 0, // Not applicable for boarding
          capacity: 10 // Standard suites have 10 spots available
        },
        {
          serviceId: "boarding-deluxe",
          name: "Deluxe Boarding",
          description: "Extra playtime, premium beds, and special treats",
          price: 65.00,
          priceUnit: "per_night",
          category: "boarding",
          durationInMinutes: 0, // Not applicable for boarding
          capacity: 5 // Deluxe suites have 5 spots available
        },
        {
          serviceId: "boarding-vip",
          name: "VIP Suite",
          description: "Private room, one-on-one care, and video updates",
          price: 85.00,
          priceUnit: "per_night",
          category: "boarding",
          durationInMinutes: 0, // Not applicable for boarding
          capacity: 2 // VIP suites have 2 spots available
        },
        {
          serviceId: "grooming-bath",
          name: "Bath & Brush",
          description: "Shampoo, conditioning, blow dry, and brush out",
          price: 40.00,
          priceUnit: "per_service",
          category: "grooming",
          durationInMinutes: 45, // 45 min service
          capacity: 1 // One pet at a time
        },
        {
          serviceId: "grooming-full",
          name: "Full Grooming",
          description: "Bath, haircut, ear cleaning, nail trim, and more",
          price: 65.00,
          priceUnit: "per_service",
          category: "grooming",
          durationInMinutes: 90, // 90 min service
          capacity: 1 // One pet at a time
        },
        {
          serviceId: "grooming-premium",
          name: "Premium Spa Package",
          description: "Full grooming plus teeth brushing, facial, and pawdicure",
          price: 85.00,
          priceUnit: "per_service",
          category: "grooming",
          durationInMinutes: 120, // 120 min service
          capacity: 1 // One pet at a time
        }
      ];

      // Add services to database
      for (const service of defaultServices) {
        await storage.createService(service);
        console.log(`Created service: ${service.name}`);
      }
    } else {
      console.log(`Skipping service creation: ${existingServices.length} services already exist`);
    }

    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      // Create admin user with hashed password
      const hashedAdminPassword = await hashPassword("admin123");
      const adminUser: InsertUser = {
        username: "admin",
        email: "admin@pawperfect.com",
        password: hashedAdminPassword,
        isAdmin: true
      };
      
      await storage.createUser(adminUser);
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if demo user exists
    const existingDemoUser = await storage.getUserByUsername('customer');
    if (!existingDemoUser) {
      // Create demo customer user with hashed password
      const hashedCustomerPassword = await hashPassword("password123");
      const demoUser: InsertUser = {
        username: "customer",
        email: "customer@example.com",
        password: hashedCustomerPassword,
        isAdmin: false
      };
      
      await storage.createUser(demoUser);
      console.log('Created demo customer user');
    } else {
      console.log('Demo customer user already exists');
    }

    console.log('Database seeding complete');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}