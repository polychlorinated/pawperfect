import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Service schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  serviceId: text("service_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  priceUnit: text("price_unit").notNull(),
  category: text("category").notNull(),
  durationInMinutes: integer("duration_in_minutes").default(60),
  capacity: integer("capacity").default(1),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  serviceId: true,
  name: true,
  description: true,
  price: true,
  priceUnit: true,
  category: true,
  durationInMinutes: true,
  capacity: true,
  isArchived: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Pet schema
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  breed: text("breed").notNull(),
  age: integer("age").notNull(),
  weight: doublePrecision("weight").notNull(),
  gender: text("gender").notNull(),
  specialNeeds: text("special_needs"),
  isVaccinated: boolean("is_vaccinated").notNull().default(false),
  ownerId: integer("owner_id").notNull(), // Add a reference to owner
  // Veterinarian information
  vetName: text("vet_name"),
  vetPhone: text("vet_phone"),
  vetAddress: text("vet_address"),
  vetLastVisit: timestamp("vet_last_visit"),
  // Medical information
  medicalHistory: text("medical_history"),
  medicationInstructions: text("medication_instructions"),
  dietaryRestrictions: text("dietary_restrictions"),
  behavioralNotes: text("behavioral_notes"),
});

export const insertPetSchema = createInsertSchema(pets).pick({
  name: true,
  breed: true,
  age: true,
  weight: true,
  gender: true,
  specialNeeds: true,
  isVaccinated: true,
  ownerId: true,
  vetName: true,
  vetPhone: true,
  vetAddress: true,
  vetLastVisit: true,
  medicalHistory: true,
  medicationInstructions: true,
  dietaryRestrictions: true,
  behavioralNotes: true,
});

export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;

// Owner schema
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  timezone: text("timezone").default("America/Chicago"), // Default timezone
});

export const insertOwnerSchema = createInsertSchema(owners).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  timezone: true,
});

export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect & {
  petCount?: number; // Added for UI display purposes
  
  // These fields don't exist in the database but are required for UI
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  profileNotes?: string | null;
  preferredCommunication?: string | null;
};

// Booking schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique(),
  serviceId: text("service_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  startTime: text("start_time").notNull(),
  endDate: timestamp("end_date"),
  endTime: text("end_time"),
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status").notNull().default("confirmed"),
  petId: integer("pet_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  bookingId: true,
  serviceId: true,
  startDate: true,
  startTime: true,
  endDate: true,
  endTime: true,
  totalPrice: true,
  status: true,
  petId: true,
  ownerId: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Schema extensions for validation
export const petFormSchema = insertPetSchema.omit({ ownerId: true }).extend({
  name: z.string().min(1, "Pet name is required"),
  breed: z.string().min(1, "Breed is required"),
  age: z.number().int().min(0, "Age must be a positive number"),
  weight: z.number().positive("Weight must be positive"),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  isVaccinated: z.boolean(),
  // We'll set this in the backend
  ownerId: z.number().optional(),
  // Optional veterinary fields with validation
  vetName: z.string().optional(),
  vetPhone: z.string().optional(),
  vetAddress: z.string().optional(),
  vetLastVisit: z.date().optional().nullable(),
  // Optional medical and behavioral fields
  medicalHistory: z.string().optional(),
  medicationInstructions: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  behavioralNotes: z.string().optional(),
});

export const ownerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  timezone: z.string().default("America/Chicago").optional(),
  // Emergency contact validation - these won't be saved to database
  // but included in form for backward compatibility
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  // Additional owner details validation - these won't be saved to database
  // but included in form for backward compatibility
  profileNotes: z.string().optional(),
  preferredCommunication: z.enum(["email", "phone", "text"]).default("email").optional(),
});

// Combined booking form schema
export const bookingFormSchema = z.object({
  service: z.object({
    serviceId: z.string(),
    name: z.string(),
    price: z.number(),
  }),
  dates: z.object({
    startDate: z.date(),
    startTime: z.string(),
    endDate: z.date().optional(),
    endTime: z.string().optional(),
    // Additional properties for timezone-safe date formatting
    formattedStartDate: z.string().optional(),
    formattedEndDate: z.string().optional(),
  }),
  pet: petFormSchema,
  owner: ownerFormSchema,
  selectedPetId: z.number().optional(), // For tracking a single existing pet in the UI
  selectedPetIds: z.array(z.number()).optional(), // For tracking multiple existing pets in the UI
  multiplePets: z.array(z.object({
    id: z.number(),
    name: z.string(),
    breed: z.string()
  })).optional(), // For storing selected multiple pets with minimal info
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

// API response types
export type ServiceAvailability = {
  date: string;
  available: boolean;
  // For boarding services (capacity-based)
  totalCapacity?: number;
  bookedCount?: number;
  remainingCapacity?: number;
  // For grooming services (time slot-based)
  timeSlots?: {
    time: string;
    available: boolean;
  }[];
};

export type ServiceWithAvailability = Service & {
  availability?: ServiceAvailability[];
};

// Users schema (for admin access)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  ownerId: integer("owner_id").references(() => owners.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  isAdmin: true,
  ownerId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Staff schema
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull(), // groomer, caretaker, vet, admin
  isActive: boolean("is_active").notNull().default(true),
});

export const insertStaffSchema = createInsertSchema(staff).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

// Staff schedule schema
export const staffSchedules = pgTable("staff_schedules", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  notes: text("notes"),
});

export const insertStaffScheduleSchema = createInsertSchema(staffSchedules).pick({
  staffId: true,
  date: true,
  startTime: true,
  endTime: true,
  notes: true,
});

export type InsertStaffSchedule = z.infer<typeof insertStaffScheduleSchema>;
export type StaffSchedule = typeof staffSchedules.$inferSelect;

// Pet task assignments (feeding, medication, walks, grooming, etc.)
export const petTasks = pgTable("pet_tasks", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.bookingId),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  taskType: text("task_type").notNull(), // feeding, medication, walk, grooming, etc.
  scheduledTime: timestamp("scheduled_time").notNull(),
  completedTime: timestamp("completed_time"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, missed
  notes: text("notes"),
});

export const insertPetTaskSchema = createInsertSchema(petTasks).pick({
  bookingId: true,
  staffId: true,
  taskType: true,
  scheduledTime: true,
  completedTime: true,
  status: true,
  notes: true,
});

export type InsertPetTask = z.infer<typeof insertPetTaskSchema>;
export type PetTask = typeof petTasks.$inferSelect;

// Notifications schema - for storing user notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  userId: integer("user_id"), // Null means system-wide notification
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  notificationType: text("notification_type").default("general"), // general, booking, system
  relatedId: text("related_id"), // ID of related entity (booking, etc)
  isArchived: boolean("is_archived").notNull().default(false), // For archiving instead of deletion
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  message: true,
  userId: true,
  isRead: true,
  notificationType: true,
  relatedId: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
