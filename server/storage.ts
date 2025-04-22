import {
  type Service,
  type InsertService,
  type Pet,
  type InsertPet,
  type Owner,
  type InsertOwner,
  type Booking,
  type InsertBooking,
  type User,
  type InsertUser,
  type ServiceAvailability,
  type Staff,
  type InsertStaff,
  type StaffSchedule,
  type InsertStaffSchedule,
  type PetTask,
  type InsertPetTask,
  type Notification,
  type InsertNotification,
  staff,
  staffSchedules,
  petTasks,
  notifications
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Service methods
  getServices(): Promise<Service[]>;
  getServiceByServiceId(serviceId: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(serviceId: string, serviceData: Partial<InsertService>): Promise<Service | undefined>;

  // Pet methods
  getPet(id: number): Promise<Pet | undefined>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, petData: Partial<InsertPet>): Promise<Pet | undefined>;
  getPetsByOwnerId(ownerId: number): Promise<Pet[]>;
  getAllPets(): Promise<Pet[]>;

  // Owner methods
  getOwner(id: number): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: number, ownerData: Partial<InsertOwner>): Promise<Owner | undefined>;
  getAllOwners(): Promise<Owner[]>;

  // Booking methods
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(bookingId: string, status: string): Promise<Booking | undefined>;
  getBookingsByOwnerId(ownerId: number): Promise<Booking[]>;
  getBookingsByPetId(petId: number): Promise<Booking[]>;

  // Availability methods
  getServiceAvailability(serviceId: string, startDate: string, endDate: string): Promise<ServiceAvailability[]>;
  updateServiceAvailability(serviceId: string, date: string, availabilityData: Partial<ServiceAvailability>): Promise<ServiceAvailability | undefined>;

  // Staff methods
  getStaff(id: number): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  getActiveStaff(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staffData: Partial<InsertStaff>): Promise<Staff | undefined>;

  // Staff Schedule methods
  getStaffSchedule(id: number): Promise<StaffSchedule | undefined>;
  getStaffSchedulesByStaffId(staffId: number): Promise<StaffSchedule[]>;
  getStaffSchedulesByDate(date: string): Promise<StaffSchedule[]>;
  createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule>;
  updateStaffSchedule(id: number, scheduleData: Partial<InsertStaffSchedule>): Promise<StaffSchedule | undefined>;
  
  // Pet Task methods
  getPetTask(id: number): Promise<PetTask | undefined>;
  getPetTasksByBookingId(bookingId: string): Promise<PetTask[]>;
  getPetTasksByStaffId(staffId: number): Promise<PetTask[]>;
  getPetTasksByStatus(status: string): Promise<PetTask[]>;
  createPetTask(task: InsertPetTask): Promise<PetTask>;
  updatePetTaskStatus(id: number, status: string, completedTime?: Date): Promise<PetTask | undefined>;
  
  // Notification methods
  getNotifications(userId?: number): Promise<Notification[]>; // Get all or user-specific notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: number, userId?: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: number): Promise<void>;
  archiveNotification(notificationId: number, userId?: number): Promise<Notification | undefined>;
  archiveAllNotifications(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private services: Map<number, Service> = new Map();
  private pets: Map<number, Pet> = new Map();
  private owners: Map<number, Owner> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private staff: Map<number, Staff> = new Map();
  private staffSchedules: Map<number, StaffSchedule> = new Map();
  private petTasks: Map<number, PetTask> = new Map();
  private notifications: Map<number, Notification> = new Map();
  
  private currentUserId: number;
  private currentServiceId: number;
  private currentPetId: number;
  private currentOwnerId: number;
  private currentBookingId: number;
  private currentStaffId: number;
  private currentScheduleId: number;
  private currentTaskId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.pets = new Map();
    this.owners = new Map();
    this.bookings = new Map();
    this.staff = new Map();
    this.staffSchedules = new Map();
    this.petTasks = new Map();
    this.notifications = new Map();
    
    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentPetId = 1;
    this.currentOwnerId = 1;
    this.currentBookingId = 1;
    this.currentStaffId = 1;
    this.currentScheduleId = 1;
    this.currentTaskId = 1;
    this.currentNotificationId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Initialize with default services
    this.createService({
      serviceId: "boarding-standard",
      name: "Standard Boarding",
      description: "Daily walks, feeding, and basic care",
      price: 45.00,
      priceUnit: "per_night",
      category: "boarding"
    });

    this.createService({
      serviceId: "boarding-deluxe",
      name: "Deluxe Boarding",
      description: "Extra playtime, premium beds, and special treats",
      price: 65.00,
      priceUnit: "per_night",
      category: "boarding"
    });

    this.createService({
      serviceId: "boarding-vip",
      name: "VIP Suite",
      description: "Private room, one-on-one care, and video updates",
      price: 85.00,
      priceUnit: "per_night",
      category: "boarding"
    });

    this.createService({
      serviceId: "grooming-bath",
      name: "Bath & Brush",
      description: "Shampoo, conditioning, blow dry, and brush out",
      price: 40.00,
      priceUnit: "per_service",
      category: "grooming"
    });

    this.createService({
      serviceId: "grooming-full",
      name: "Full Grooming",
      description: "Bath, haircut, ear cleaning, nail trim, and more",
      price: 65.00,
      priceUnit: "per_service",
      category: "grooming"
    });

    this.createService({
      serviceId: "grooming-premium",
      name: "Premium Spa Package",
      description: "Full grooming plus teeth brushing, facial, and pawdicure",
      price: 85.00,
      priceUnit: "per_service",
      category: "grooming"
    });

    // Create an admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false // Ensure isAdmin is never undefined
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getServiceByServiceId(serviceId: string): Promise<Service | undefined> {
    return Array.from(this.services.values()).find(
      (service) => service.serviceId === serviceId,
    );
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const service: Service = { 
      ...insertService, 
      id,
      durationInMinutes: insertService.durationInMinutes ?? 60,
      capacity: insertService.capacity ?? 1,
      isArchived: insertService.isArchived ?? false
    };
    this.services.set(id, service);
    return service;
  }
  
  async updateService(serviceId: string, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const service = await this.getServiceByServiceId(serviceId);
    if (!service) {
      return undefined;
    }
    
    const updatedService: Service = { ...service, ...serviceData };
    this.services.set(service.id, updatedService);
    return updatedService;
  }

  // Pet methods
  async getPet(id: number): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const id = this.currentPetId++;
    const pet: Pet = { 
      ...insertPet, 
      id,
      specialNeeds: insertPet.specialNeeds ?? null,
      isVaccinated: insertPet.isVaccinated ?? false
    };
    this.pets.set(id, pet);
    return pet;
  }

  async updatePet(id: number, petData: Partial<InsertPet>): Promise<Pet | undefined> {
    const pet = await this.getPet(id);
    if (!pet) {
      return undefined;
    }
    
    const updatedPet: Pet = { ...pet, ...petData };
    this.pets.set(id, updatedPet);
    return updatedPet;
  }
  
  async getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    return Array.from(this.pets.values()).filter(
      (pet) => pet.ownerId === ownerId,
    );
  }

  async getAllPets(): Promise<Pet[]> {
    return Array.from(this.pets.values());
  }

  // Owner methods
  async getOwner(id: number): Promise<Owner | undefined> {
    return this.owners.get(id);
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    return Array.from(this.owners.values()).find(
      (owner) => owner.email === email,
    );
  }

  async createOwner(insertOwner: InsertOwner): Promise<Owner> {
    const id = this.currentOwnerId++;
    const owner: Owner = { ...insertOwner, id };
    this.owners.set(id, owner);
    return owner;
  }

  async getAllOwners(): Promise<Owner[]> {
    const owners = Array.from(this.owners.values());
    // Add pet count to each owner
    for (const owner of owners) {
      const pets = Array.from(this.pets.values()).filter(pet => pet.ownerId === owner.id);
      owner.petCount = pets.length;
    }
    return owners;
  }

  async updateOwner(id: number, ownerData: Partial<InsertOwner>): Promise<Owner | undefined> {
    const owner = await this.getOwner(id);
    if (!owner) {
      return undefined;
    }
    
    const updatedOwner: Owner = { ...owner, ...ownerData };
    this.owners.set(id, updatedOwner);
    return updatedOwner;
  }

  // Booking methods
  async getBookingByBookingId(bookingId: string): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(
      (booking) => booking.bookingId === bookingId,
    );
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const booking: Booking = { 
      ...insertBooking, 
      id,
      createdAt: new Date(),
      status: insertBooking.status ?? "confirmed",
      endDate: insertBooking.endDate ?? null,
      endTime: insertBooking.endTime ?? null
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking | undefined> {
    const booking = await this.getBookingByBookingId(bookingId);
    if (booking) {
      const updatedBooking = { ...booking, status };
      this.bookings.set(booking.id, updatedBooking);
      return updatedBooking;
    }
    return undefined;
  }

  async getBookingsByOwnerId(ownerId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.ownerId === ownerId,
    );
  }

  async getBookingsByPetId(petId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.petId === petId,
    );
  }

  // Availability methods
  async getServiceAvailability(serviceId: string, startDate: string, endDate: string): Promise<ServiceAvailability[]> {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get the service to determine if it's boarding or grooming
    const service = await this.getServiceByServiceId(serviceId);
    if (!service) {
      return [];
    }
    
    // Is this a boarding service? (all non-grooming services are considered boarding)
    const isBoardingService = !serviceId.startsWith('grooming');
    
    // Generate days between start and end date
    const days: ServiceAvailability[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Check for existing bookings on this date to determine availability
      const existingBookings = Array.from(this.bookings.values()).filter(booking => {
        const bookingStartDate = new Date(booking.startDate);
        const bookingEndDate = booking.endDate ? new Date(booking.endDate) : bookingStartDate;
        const bookingDay = bookingStartDate.toISOString().split('T')[0];
        
        return booking.serviceId === serviceId && 
               bookingDay === dateString && 
               booking.status !== 'cancelled';
      });
      
      // For boarding services, use capacity-based availability
      if (isBoardingService) {
        const totalCapacity = service.capacity || 1;
        const bookedCount = existingBookings.length;
        const remainingCapacity = Math.max(0, totalCapacity - bookedCount);
        
        days.push({
          date: dateString,
          available: remainingCapacity > 0,
          totalCapacity,
          bookedCount,
          remainingCapacity,
          // Add check-in time slots for display purposes
          timeSlots: [
            '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00'
          ].map(time => ({
            time,
            available: remainingCapacity > 0
          }))
        });
      }
      // For grooming services, use time slot-based availability
      else {
        const hours = ['09:00:00', '10:30:00', '12:00:00', '13:30:00', '15:00:00', '16:30:00'];
        const timeSlots = [];
        
        for (const hour of hours) {
          // Check if this time slot is booked
          const isBooked = existingBookings.some(booking => {
            return booking.startTime === hour;
          });
          
          timeSlots.push({
            time: hour,
            available: !isBooked
          });
        }
        
        days.push({
          date: dateString,
          available: timeSlots.some(slot => slot.available), // Date is available if at least one time slot is available
          timeSlots
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }
  
  async updateServiceAvailability(
    serviceId: string, 
    date: string, 
    availabilityData: Partial<ServiceAvailability>
  ): Promise<ServiceAvailability | undefined> {
    // First get the current availability
    const [currentAvailability] = await this.getServiceAvailability(serviceId, date, date);
    
    if (!currentAvailability) {
      return undefined;
    }
    
    // Get the service to determine if it's boarding or grooming
    const service = await this.getServiceByServiceId(serviceId);
    if (!service) {
      return undefined;
    }
    
    const isBoardingService = !serviceId.startsWith('grooming');
    
    // For boarding services, we need to update the capacity in the service record
    if (isBoardingService && availabilityData.totalCapacity !== undefined) {
      // Update the service capacity
      const updatedService = await this.updateService(serviceId, { 
        capacity: availabilityData.totalCapacity 
      });
      
      // Re-fetch the availability with the updated capacity
      const [updatedAvailability] = await this.getServiceAvailability(serviceId, date, date);
      return updatedAvailability;
    }
    // For grooming services, we update the time slots
    else {
      // Create the updated availability
      const updatedAvailability: ServiceAvailability = {
        date: currentAvailability.date,
        available: availabilityData.available ?? currentAvailability.available,
        timeSlots: availabilityData.timeSlots ?? currentAvailability.timeSlots
      };
      
      // In a real implementation with grooming, we would store this in the database
      // But for now, we'll just return the updated object
      return updatedAvailability;
    }
  }
  
  // Notification methods
  async getNotifications(userId?: number): Promise<Notification[]> {
    let notifications: Notification[] = Array.from(this.notifications.values());
    
    // Filter by userId if provided
    if (userId !== undefined) {
      notifications = notifications.filter(
        n => n.userId === userId && !n.isArchived
      );
    } else {
      // For admin/system, get all non-archived notifications
      notifications = notifications.filter(n => !n.isArchived);
    }
    
    // Sort by createdAt in descending order
    return notifications.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      isRead: notification.isRead ?? false,
      notificationType: notification.notificationType ?? "general",
      isArchived: false,
      expiresAt: null
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(notificationId: number, userId?: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return undefined;
    }
    
    // If it's a user-specific notification, just mark it as read
    if (notification.userId !== null) {
      const updatedNotification = { ...notification, isRead: true };
      this.notifications.set(notificationId, updatedNotification);
      return updatedNotification;
    }
    
    // If it's a system-wide notification and we have a userId, create a shadow copy
    if (notification.userId === null && userId !== undefined) {
      // Check if a shadow copy already exists for this user
      const existingShadowCopy = Array.from(this.notifications.values()).find(
        n => n.relatedId === notification.id.toString() && n.userId === userId
      );
      
      if (existingShadowCopy) {
        // Update the existing shadow copy
        const updatedShadowCopy = { ...existingShadowCopy, isRead: true };
        this.notifications.set(existingShadowCopy.id, updatedShadowCopy);
        return updatedShadowCopy;
      }
      
      // Create a shadow copy of the notification for this user
      const shadowCopy: Notification = {
        id: this.currentNotificationId++,
        message: notification.message,
        userId: userId,
        isRead: true, // Mark as read
        isArchived: false,
        createdAt: new Date(),
        notificationType: notification.notificationType || "general",
        expiresAt: notification.expiresAt,
        relatedId: notification.id.toString(), // Store original notification ID
      };
      
      this.notifications.set(shadowCopy.id, shadowCopy);
      return shadowCopy;
    }
    
    // Otherwise, just mark the system-wide notification as read (this should be avoided)
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(notificationId, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    // Get all unread notifications for this user
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead && !n.isArchived);
    
    // Mark each as read
    for (const notification of userNotifications) {
      notification.isRead = true;
      this.notifications.set(notification.id, notification);
    }
  }

  async archiveNotification(notificationId: number, userId?: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return undefined;
    }
    
    // If it's a user-specific notification, just mark it as archived
    if (notification.userId !== null) {
      const updatedNotification = { ...notification, isArchived: true };
      this.notifications.set(notificationId, updatedNotification);
      return updatedNotification;
    }
    
    // If it's a system-wide notification and we have a userId, create a shadow copy
    if (notification.userId === null && userId !== undefined) {
      // Create a shadow copy of the notification for this user
      const shadowCopy: Notification = {
        id: this.currentNotificationId++,
        message: notification.message,
        userId: userId,
        isRead: true, // Mark as read since we're archiving
        isArchived: true, // Mark as archived
        createdAt: new Date(),
        notificationType: notification.notificationType || "general",
        expiresAt: notification.expiresAt,
        relatedId: notification.id.toString(), // Store original notification ID
      };
      
      this.notifications.set(shadowCopy.id, shadowCopy);
      return shadowCopy;
    }
    
    // If it's a system-wide notification but no userId provided, just mark it as archived
    // (this should be avoided in practice, as it would archive for everyone)
    const updatedNotification = { ...notification, isArchived: true };
    this.notifications.set(notificationId, updatedNotification);
    return updatedNotification;
  }

  async archiveAllNotifications(userId: number): Promise<void> {
    // Get all non-archived notifications for this user
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isArchived);
    
    // Archive each notification
    for (const notification of userNotifications) {
      notification.isArchived = true;
      this.notifications.set(notification.id, notification);
    }
  }

  // Staff methods
  async getStaff(id: number): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async getAllStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getActiveStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter(
      (staff) => staff.isActive
    );
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const id = this.currentStaffId++;
    const staff: Staff = {
      ...staffData,
      id,
      isActive: staffData.isActive ?? true
    };
    this.staff.set(id, staff);
    return staff;
  }

  async updateStaff(id: number, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const staff = await this.getStaff(id);
    if (!staff) {
      return undefined;
    }
    
    const updatedStaff: Staff = { ...staff, ...staffData };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  // Staff Schedule methods
  async getStaffSchedule(id: number): Promise<StaffSchedule | undefined> {
    return this.staffSchedules.get(id);
  }

  async getStaffSchedulesByStaffId(staffId: number): Promise<StaffSchedule[]> {
    return Array.from(this.staffSchedules.values()).filter(
      (schedule) => schedule.staffId === staffId
    );
  }

  async getStaffSchedulesByDate(date: string): Promise<StaffSchedule[]> {
    return Array.from(this.staffSchedules.values()).filter(
      (schedule) => schedule.date === date
    );
  }

  async createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule> {
    const id = this.currentScheduleId++;
    const staffSchedule: StaffSchedule = {
      ...schedule,
      id
    };
    this.staffSchedules.set(id, staffSchedule);
    return staffSchedule;
  }

  async updateStaffSchedule(id: number, scheduleData: Partial<InsertStaffSchedule>): Promise<StaffSchedule | undefined> {
    const schedule = await this.getStaffSchedule(id);
    if (!schedule) {
      return undefined;
    }
    
    const updatedSchedule: StaffSchedule = { ...schedule, ...scheduleData };
    this.staffSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  // Pet Task methods
  async getPetTask(id: number): Promise<PetTask | undefined> {
    return this.petTasks.get(id);
  }

  async getPetTasksByBookingId(bookingId: string): Promise<PetTask[]> {
    return Array.from(this.petTasks.values()).filter(
      (task) => task.bookingId === bookingId
    );
  }

  async getPetTasksByStaffId(staffId: number): Promise<PetTask[]> {
    return Array.from(this.petTasks.values()).filter(
      (task) => task.assignedToStaffId === staffId
    );
  }

  async getPetTasksByStatus(status: string): Promise<PetTask[]> {
    return Array.from(this.petTasks.values()).filter(
      (task) => task.status === status
    );
  }

  async createPetTask(task: InsertPetTask): Promise<PetTask> {
    const id = this.currentTaskId++;
    const petTask: PetTask = {
      ...task,
      id,
      status: task.status ?? "pending",
      completedAt: task.completedAt ?? null
    };
    this.petTasks.set(id, petTask);
    return petTask;
  }

  async updatePetTaskStatus(id: number, status: string, completedTime?: Date): Promise<PetTask | undefined> {
    const task = await this.getPetTask(id);
    if (!task) {
      return undefined;
    }
    
    const updatedTask: PetTask = { 
      ...task, 
      status, 
      completedAt: status === "completed" ? (completedTime ?? new Date()) : task.completedAt 
    };
    this.petTasks.set(id, updatedTask);
    return updatedTask;
  }
}

// Database implementation
import { db } from "./db";
import { eq, and, gte, lte, sql, desc, or, isNull } from "drizzle-orm";
import { users, services, pets, owners, bookings, staff, staffSchedules, petTasks, notifications } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getServiceByServiceId(serviceId: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.serviceId, serviceId));
    return service;
  }

  async createService(insertService: InsertService): Promise<Service> {
    // Ensure required fields have defaults
    const serviceData = {
      ...insertService,
      durationInMinutes: insertService.durationInMinutes ?? 60,
      capacity: insertService.capacity ?? 1,
      isArchived: insertService.isArchived ?? false
    };
    
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }
  
  async updateService(serviceId: string, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(serviceData)
      .where(eq(services.serviceId, serviceId))
      .returning();
    return updatedService;
  }

  // Pet methods
  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const [pet] = await db.insert(pets).values(insertPet).returning();
    return pet;
  }
  
  async updatePet(id: number, petData: Partial<InsertPet>): Promise<Pet | undefined> {
    const [updatedPet] = await db
      .update(pets)
      .set(petData)
      .where(eq(pets.id, id))
      .returning();
    return updatedPet;
  }

  async getPetsByOwnerId(ownerId: number): Promise<Pet[]> {
    return await db.select().from(pets).where(eq(pets.ownerId, ownerId));
  }
  
  async getAllPets(): Promise<Pet[]> {
    return await db.select().from(pets);
  }

  // Owner methods
  async getOwner(id: number): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.email, email));
    return owner;
  }

  async createOwner(insertOwner: InsertOwner): Promise<Owner> {
    const [owner] = await db.insert(owners).values(insertOwner).returning();
    return owner;
  }
  
  async updateOwner(id: number, ownerData: Partial<InsertOwner>): Promise<Owner | undefined> {
    const [updatedOwner] = await db
      .update(owners)
      .set(ownerData)
      .where(eq(owners.id, id))
      .returning();
    return updatedOwner;
  }

  async getAllOwners(): Promise<Owner[]> {
    const ownersData = await db.select().from(owners);
    
    // Add pet count to each owner
    for (const owner of ownersData) {
      const petCount = await db.select({ count: sql`count(*)` })
        .from(pets)
        .where(eq(pets.ownerId, owner.id));
      
      owner.petCount = Number(petCount[0]?.count || 0);
    }
    
    return ownersData;
  }

  // Booking methods
  async getBookingByBookingId(bookingId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId));
    return booking;
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.bookingId, bookingId))
      .returning();
    return updatedBooking;
  }

  async getBookingsByOwnerId(ownerId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.ownerId, ownerId));
  }

  async getBookingsByPetId(petId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.petId, petId));
  }

  // Availability methods
  async getServiceAvailability(serviceId: string, startDate: string, endDate: string): Promise<ServiceAvailability[]> {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get the service to determine if it's boarding or grooming
    const service = await this.getServiceByServiceId(serviceId);
    if (!service) {
      return [];
    }
    
    // Get existing bookings in the date range for this service
    const existingBookings = await db.select()
      .from(bookings)
      .where(
        and(
          eq(bookings.serviceId, serviceId),
          gte(bookings.startDate, start),
          lte(bookings.startDate, end),
          eq(bookings.status, "confirmed")
        )
      );
    
    // Is this a boarding service? (all non-grooming services are considered boarding)
    const isBoardingService = !serviceId.startsWith('grooming');
    
    // Generate days between start and end date
    const days: ServiceAvailability[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Filter bookings for this specific date
      const dateBookings = existingBookings.filter(booking => {
        const bookingDate = new Date(booking.startDate);
        return bookingDate.toISOString().split('T')[0] === dateString;
      });
      
      // For boarding services, use capacity-based availability
      if (isBoardingService) {
        const totalCapacity = service.capacity || 1;
        const bookedCount = dateBookings.length;
        const remainingCapacity = Math.max(0, totalCapacity - bookedCount);
        
        days.push({
          date: dateString,
          available: remainingCapacity > 0,
          totalCapacity,
          bookedCount,
          remainingCapacity,
          // Add check-in time slots for display purposes
          timeSlots: [
            '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00'
          ].map(time => ({
            time,
            available: remainingCapacity > 0
          }))
        });
      }
      // For grooming services, use time slot-based availability
      else {
        const hours = ['09:00:00', '10:30:00', '12:00:00', '13:30:00', '15:00:00', '16:30:00'];
        const timeSlots = [];
        
        for (const hour of hours) {
          // Check if this time slot is booked
          const isBooked = dateBookings.some(booking => booking.startTime === hour);
          
          timeSlots.push({
            time: hour,
            available: !isBooked
          });
        }
        
        days.push({
          date: dateString,
          available: timeSlots.some(slot => slot.available), // Date is available if at least one time slot is available
          timeSlots
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }
  
  async updateServiceAvailability(
    serviceId: string, 
    date: string, 
    availabilityData: Partial<ServiceAvailability>
  ): Promise<ServiceAvailability | undefined> {
    // First get the current availability
    const [currentAvailability] = await this.getServiceAvailability(serviceId, date, date);
    
    if (!currentAvailability) {
      return undefined;
    }
    
    // Get the service to determine if it's boarding or grooming
    const service = await this.getServiceByServiceId(serviceId);
    if (!service) {
      return undefined;
    }
    
    const isBoardingService = !serviceId.startsWith('grooming');
    
    // For boarding services, we need to update the capacity in the service record
    if (isBoardingService && availabilityData.totalCapacity !== undefined) {
      // Update the service capacity
      await this.updateService(serviceId, { 
        capacity: availabilityData.totalCapacity 
      });
      
      // Re-fetch the availability with the updated capacity
      const [updatedAvailability] = await this.getServiceAvailability(serviceId, date, date);
      return updatedAvailability;
    }
    // For grooming services, we update the time slots
    else {
      // Create the updated availability
      const updatedAvailability: ServiceAvailability = {
        date: currentAvailability.date,
        available: availabilityData.available ?? currentAvailability.available,
        timeSlots: availabilityData.timeSlots ?? currentAvailability.timeSlots
      };
      
      // In a real implementation with grooming, we would store this in the database
      // But for now, we'll just return the updated object
      return updatedAvailability;
    }
  }

  // Staff methods
  async getStaff(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember;
  }

  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }

  async getActiveStaff(): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.isActive, true));
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [staffMember] = await db.insert(staff).values(staffData).returning();
    return staffMember;
  }

  async updateStaff(id: number, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updatedStaff] = await db
      .update(staff)
      .set(staffData)
      .where(eq(staff.id, id))
      .returning();
    return updatedStaff;
  }

  // Staff Schedule methods
  async getStaffSchedule(id: number): Promise<StaffSchedule | undefined> {
    const [schedule] = await db.select().from(staffSchedules).where(eq(staffSchedules.id, id));
    return schedule;
  }

  async getStaffSchedulesByStaffId(staffId: number): Promise<StaffSchedule[]> {
    return await db.select().from(staffSchedules).where(eq(staffSchedules.staffId, staffId));
  }

  async getStaffSchedulesByDate(date: string): Promise<StaffSchedule[]> {
    const searchDate = new Date(date);
    return await db.select().from(staffSchedules).where(
      and(
        gte(staffSchedules.date, new Date(`${date}T00:00:00Z`)),
        lte(staffSchedules.date, new Date(`${date}T23:59:59Z`))
      )
    );
  }

  async createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule> {
    const [newSchedule] = await db.insert(staffSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateStaffSchedule(id: number, scheduleData: Partial<InsertStaffSchedule>): Promise<StaffSchedule | undefined> {
    const [updatedSchedule] = await db
      .update(staffSchedules)
      .set(scheduleData)
      .where(eq(staffSchedules.id, id))
      .returning();
    return updatedSchedule;
  }
  
  // Pet Task methods
  async getPetTask(id: number): Promise<PetTask | undefined> {
    const [task] = await db.select().from(petTasks).where(eq(petTasks.id, id));
    return task;
  }

  async getPetTasksByBookingId(bookingId: string): Promise<PetTask[]> {
    return await db.select().from(petTasks).where(eq(petTasks.bookingId, bookingId));
  }

  async getPetTasksByStaffId(staffId: number): Promise<PetTask[]> {
    return await db.select().from(petTasks).where(eq(petTasks.staffId, staffId));
  }

  async getPetTasksByStatus(status: string): Promise<PetTask[]> {
    return await db.select().from(petTasks).where(eq(petTasks.status, status));
  }

  async createPetTask(task: InsertPetTask): Promise<PetTask> {
    const [newTask] = await db.insert(petTasks).values(task).returning();
    return newTask;
  }

  async updatePetTaskStatus(id: number, status: string, completedTime?: Date): Promise<PetTask | undefined> {
    const updateData: Partial<PetTask> = { status };
    if (completedTime) {
      updateData.completedTime = completedTime;
    }
    
    const [updatedTask] = await db
      .update(petTasks)
      .set(updateData)
      .where(eq(petTasks.id, id))
      .returning();
    return updatedTask;
  }

  // Notification methods
  async getNotifications(userId?: number): Promise<Notification[]> {
    // If userId is provided, get user-specific and system-wide notifications
    // Otherwise, get all notifications (used by admin)
    if (userId !== undefined) {
      // Get system notifications that aren't marked as archived by this user
      const systemNotifications = await db
        .select()
        .from(notifications)
        .where(and(
          isNull(notifications.userId),
          eq(notifications.isArchived, false)
        ));
      
      // Check which system notifications have been archived by this specific user
      const archivedSystemNotificationIds = new Set<number>();
      
      for (const sysNotification of systemNotifications) {
        // Look for a user-specific "shadow" notification that's been archived
        const userShadowCopies = await db
          .select()
          .from(notifications)
          .where(and(
            eq(notifications.userId, userId),
            eq(notifications.isArchived, true),
            eq(notifications.relatedId, sysNotification.id.toString())
          ));
        
        // If found, mark this system notification as archived for this user
        if (userShadowCopies.length > 0) {
          archivedSystemNotificationIds.add(sysNotification.id);
        }
      }
      
      // Filter system notifications that haven't been archived by this user
      const filteredSystemNotifications = systemNotifications.filter(
        notification => !archivedSystemNotificationIds.has(notification.id)
      );
      
      // Get user-specific notifications that aren't archived
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isArchived, false)
        ));
      
      // Combine both sets of notifications and sort by creation time
      const allNotifications = [...filteredSystemNotifications, ...userNotifications];
      return allNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // For admin, get all notifications that aren't archived
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.isArchived, false))
        .orderBy(sql`${notifications.createdAt} DESC`);
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    return newNotification;
  }

  async markNotificationRead(notificationId: number, userId?: number): Promise<Notification | undefined> {
    // Find the notification first
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));
    
    if (!notification) {
      return undefined;
    }
    
    // If it's a user-specific notification, just mark it as read
    if (notification.userId !== null) {
      const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId))
        .returning();
      
      return updated;
    }
    
    // If it's a system-wide notification and we have a userId, create a shadow copy
    if (notification.userId === null && userId !== undefined) {
      // Check if a shadow copy already exists for this user
      const [existingShadowCopy] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.relatedId, notification.id.toString()),
            eq(notifications.userId, userId)
          )
        );
      
      if (existingShadowCopy) {
        // Update the existing shadow copy
        const [updatedShadow] = await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.id, existingShadowCopy.id))
          .returning();
        
        return updatedShadow;
      }
      
      // Create a shadow copy for this user
      const [shadowCopy] = await db
        .insert(notifications)
        .values({
          message: notification.message,
          userId: userId,
          isRead: true,
          isArchived: false,
          createdAt: new Date(),
          notificationType: notification.notificationType,
          expiresAt: notification.expiresAt,
          relatedId: notification.id.toString()
        })
        .returning();
      
      return shadowCopy;
    }
    
    // Otherwise, just mark the system-wide notification as read (this should be avoided)
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return updated;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    // Update user-specific notifications
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        eq(notifications.isArchived, false)
      ));
    
    // Get all unread system-wide notifications
    const systemNotifications = await db
      .select()
      .from(notifications)
      .where(and(
        isNull(notifications.userId),
        eq(notifications.isRead, false),
        eq(notifications.isArchived, false)
      ));
    
    // For each system notification, check if there's a shadow copy for this user
    for (const notification of systemNotifications) {
      // Check if a shadow copy already exists for this user
      const [existingShadowCopy] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.relatedId, notification.id.toString()),
            eq(notifications.userId, userId)
          )
        );
      
      if (existingShadowCopy) {
        // Update existing shadow copy
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.id, existingShadowCopy.id));
      } else {
        // Create a new shadow copy
        await db
          .insert(notifications)
          .values({
            message: notification.message,
            userId: userId,
            isRead: true,
            isArchived: false,
            createdAt: new Date(),
            notificationType: notification.notificationType,
            expiresAt: notification.expiresAt,
            relatedId: notification.id.toString()
          });
      }
    }
  }

  async archiveNotification(notificationId: number, userId?: number): Promise<Notification | undefined> {
    // Find the notification first
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));
    
    if (!notification) {
      return undefined;
    }
    
    // If it's a user-specific notification, just mark it as archived
    if (notification.userId !== null) {
      const [updated] = await db
        .update(notifications)
        .set({ isArchived: true })
        .where(eq(notifications.id, notificationId))
        .returning();
      
      return updated;
    }
    
    // If it's a system-wide notification and we have a userId, create a shadow copy
    if (notification.userId === null && userId !== undefined) {
      const [shadowCopy] = await db
        .insert(notifications)
        .values({
          message: notification.message,
          userId: userId,
          isRead: true, // Mark as read since we're archiving
          isArchived: true, // Mark as archived
          notificationType: notification.notificationType,
          relatedId: notification.id.toString(), // Store original notification ID
        })
        .returning();
      
      return shadowCopy;
    }
    
    // If it's a system-wide notification but no userId provided, just mark it as archived
    // (this should be avoided in practice, as it would archive for everyone)
    const [updated] = await db
      .update(notifications)
      .set({ isArchived: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return updated;
  }

  async archiveAllNotifications(userId: number): Promise<void> {
    // For user-specific notifications, just set them as archived
    await db
      .update(notifications)
      .set({ isArchived: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isArchived, false)
      ));
      
    // For system-wide notifications (userId is null), create a record in the database
    // to track that this specific user has archived this notification
    const systemNotifications = await db
      .select()
      .from(notifications)
      .where(and(
        isNull(notifications.userId),
        eq(notifications.isArchived, false)
      ));
      
    // For each system notification, create a user-specific "shadow" copy that is marked as archived
    for (const notification of systemNotifications) {
      await db
        .insert(notifications)
        .values({
          message: notification.message,
          userId: userId,
          isRead: true, // Mark as read since we're archiving
          isArchived: true, // Mark as archived
          notificationType: notification.notificationType,
          relatedId: notification.id.toString(), // Store original notification ID to track it
        });
    }
  }
}

export const storage = new DatabaseStorage();
