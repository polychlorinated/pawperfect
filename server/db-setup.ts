import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

// Create Postgres client
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString);

// Create Drizzle client
const db = drizzle(client, { schema });

// Function to ensure tables are created
async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        service_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        price_unit TEXT NOT NULL,
        category TEXT NOT NULL,
        duration_in_minutes INTEGER DEFAULT 60,
        capacity INTEGER DEFAULT 1,
        is_archived BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS owners (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        address TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        breed TEXT NOT NULL,
        age INTEGER NOT NULL,
        weight DOUBLE PRECISION NOT NULL,
        gender TEXT NOT NULL,
        special_needs TEXT,
        is_vaccinated BOOLEAN NOT NULL DEFAULT false,
        owner_id INTEGER NOT NULL,
        vet_name TEXT,
        vet_phone TEXT,
        vet_address TEXT,
        vet_last_visit TIMESTAMP,
        medical_history TEXT,
        medication_instructions TEXT,
        dietary_restrictions TEXT,
        behavioral_notes TEXT
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_id TEXT NOT NULL UNIQUE,
        service_id TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        start_time TEXT NOT NULL,
        end_date TIMESTAMP,
        end_time TEXT,
        total_price DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        pet_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        owner_id INTEGER REFERENCES owners(id)
      );

      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS staff_schedules (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER NOT NULL REFERENCES staff(id),
        date TIMESTAMP NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS pet_tasks (
        id SERIAL PRIMARY KEY,
        booking_id TEXT NOT NULL REFERENCES bookings(booking_id),
        staff_id INTEGER NOT NULL REFERENCES staff(id),
        task_type TEXT NOT NULL,
        scheduled_time TIMESTAMP NOT NULL,
        completed_time TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'scheduled',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "sid" VARCHAR NOT NULL PRIMARY KEY,
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    
    console.log('Database schema setup completed successfully');
  } catch (error) {
    console.error('Error setting up database schema:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();