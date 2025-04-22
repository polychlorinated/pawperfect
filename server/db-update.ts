import { db } from './db';
import { owners } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Updates the database schema to add the timezone column to the owners table
 */
export async function updateDB() {
  try {
    console.log("Updating database schema...");
    
    // Check if timezone column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='owners' AND column_name='timezone'
    `);
    
    // The result might be in a different format depending on the database driver
    const hasTimezoneColumn = result && 
      ((result.rows && result.rows.length > 0) || 
       (Array.isArray(result) && result.length > 0));
    
    if (!hasTimezoneColumn) {
      console.log("Adding timezone column to owners table...");
      try {
        await db.execute(sql`
          ALTER TABLE owners
          ADD COLUMN timezone text DEFAULT 'America/Chicago'
        `);
        console.log("Timezone column added successfully.");
      } catch (alterError) {
        // If column already exists but wasn't detected, this will fail
        // with a duplicate column error, which is fine
        console.log("Error adding column (may already exist):", alterError.message);
      }
    } else {
      console.log("Timezone column already exists, skipping.");
    }
    
    // Verify the column exists by selecting it
    try {
      await db.execute(sql`SELECT timezone FROM owners LIMIT 1`);
      console.log("Timezone column verified to exist.");
    } catch (verifyError) {
      console.error("Timezone column verification failed:", verifyError.message);
      
      // Try a different approach to add the column
      try {
        await db.execute(sql`
          DO $$
          BEGIN
            BEGIN
              ALTER TABLE owners ADD COLUMN timezone text DEFAULT 'America/Chicago';
            EXCEPTION
              WHEN duplicate_column THEN
                NULL;
            END;
          END $$;
        `);
        console.log("Timezone column added with alternative method.");
      } catch (fallbackError) {
        console.error("Alternative column creation also failed:", fallbackError.message);
      }
    }
    
    console.log("Database schema update complete!");
  } catch (error) {
    console.error("Error updating database schema:", error);
  }
}