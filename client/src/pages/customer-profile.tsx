import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { ownerFormSchema, petFormSchema } from '@shared/schema';
import { timezones, timezoneLabels, formatDateWithTimezone } from '@/lib/timezones';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Calendar as CalendarIcon,
  User,
  Mail,
  Phone,
  Home,
  Heart,
  AlertCircle,
  Check,
  X,
  Loader2,
  Plus,
  PlusCircle,
  CalendarDays,
  RefreshCw
} from 'lucide-react';

// API
import { mcpAPI } from '@/lib/mcpAPI';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

// Since we can't import specific components from profiles.tsx, we'll implement these components directly
// We'll refer to the original profiles.tsx implementation when needed

// Customer profile page shows the customer's own profile, pets, and bookings
// Owner Edit Form Component
function OwnerEditForm({ owner, onSuccess }: { owner: any, onSuccess: () => void }) {
  const { toast } = useToast();
  
  // Create form with React Hook Form
  const form = useForm({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      // Optional fields (might not be in the database)
      emergencyContactName: owner.emergencyContactName || '',
      emergencyContactPhone: owner.emergencyContactPhone || '',
      emergencyContactRelationship: owner.emergencyContactRelationship || '',
      profileNotes: owner.profileNotes || '',
      preferredCommunication: owner.preferredCommunication as 'email' | 'phone' | 'text' || 'email',
      timezone: owner.timezone || 'America/Chicago',
    }
  });
  
  // Setup mutation
  const updateOwnerMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const res = await apiRequest('PATCH', '/api/user/owner', updateData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update owner details');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your details have been updated successfully.',
      });
      // Invalidate queries and refresh data
      queryClient.invalidateQueries({queryKey: ['owner']});
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: any) => {
    updateOwnerMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4 col-span-2">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="space-y-4 col-span-2">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Emergency contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Emergency contact phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emergencyContactRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Family member, friend" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Preferences */}
          <div className="space-y-4 col-span-2">
            <h3 className="text-lg font-medium">Communication Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredCommunication"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How would you like us to contact you?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="email" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Email
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="phone" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Phone call
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="text" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Text message
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Timezone Selector */}
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Timezone</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {timezoneLabels[tz] || tz.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used for accurate booking times and notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Additional Notes */}
          <div className="space-y-4 col-span-2">
            <h3 className="text-lg font-medium">Additional Notes</h3>
            <FormField
              control={form.control}
              name="profileNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions or Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information we should know"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updateOwnerMutation.isPending}
          >
            {updateOwnerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Pet Edit Form Component
function PetEditForm({ 
  pet, 
  onSuccess, 
  onCancel
}: { 
  pet: any, 
  onSuccess: () => void,
  onCancel: () => void
}) {
  const { toast } = useToast();
  
  // Convert veterinarian last visit from string to Date
  const lastVisit = pet.vetLastVisit ? new Date(pet.vetLastVisit) : null;
  
  // Create form with React Hook Form
  const form = useForm({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender as 'male' | 'female',
      specialNeeds: pet.specialNeeds || '',
      isVaccinated: pet.isVaccinated,
      // Optional veterinary fields
      vetName: pet.vetName || '',
      vetPhone: pet.vetPhone || '',
      vetAddress: pet.vetAddress || '',
      vetLastVisit: lastVisit || undefined,
      // Optional medical and behavioral fields
      medicalHistory: pet.medicalHistory || '',
      medicationInstructions: pet.medicationInstructions || '',
      dietaryRestrictions: pet.dietaryRestrictions || '',
      behavioralNotes: pet.behavioralNotes || '',
    }
  });
  
  // Setup mutation
  const updatePetMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const res = await apiRequest('PATCH', `/api/pets/${pet.id}`, updateData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update pet details');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pet updated',
        description: `${pet.name}'s details have been updated successfully.`,
      });
      // Invalidate queries and refresh data
      queryClient.invalidateQueries({queryKey: ['pets']});
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: any) => {
    updatePetMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Basic Pet Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Pet name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input placeholder="Breed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Age" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Weight" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isVaccinated"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Vaccinated</FormLabel>
                      <FormDescription>
                        Is your pet up-to-date on vaccinations?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="specialNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Needs</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special needs or requirements" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Veterinary Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Veterinary Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinarian Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vet's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vetPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinarian Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Vet's phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vetAddress"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Veterinarian Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Vet's address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vetLastVisit"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Last Vet Visit</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Medical Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Medical Information</h3>
            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any notable medical history" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="medicationInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Current medications and instructions" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dietaryRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Restrictions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any food allergies or dietary needs" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Behavioral Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Behavioral Information</h3>
            <FormField
              control={form.control}
              name="behavioralNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Behavioral Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Information about your pet's behavior and temperament" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updatePetMutation.isPending}
          >
            {updatePetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function CustomerProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Make sure we have the owner ID from the user
  const ownerId = user?.ownerId;
  
  // Fetch owner data
  const { 
    data: ownerData, 
    isLoading: isLoadingOwner 
  } = useQuery({
    queryKey: ['owner', ownerId],
    queryFn: async () => {
      if (!ownerId) return null;
      
      // Use the user/owner endpoint which should be less likely to get intercepted
      try {
        console.log("Fetching owner data for user with ID:", user.id);
        const response = await apiRequest('GET', `/api/user/owner`);
        const data = await response.json();
        console.log("Owner data fetched successfully:", data);
        
        // Add missing fields that would be expected by the profile component
        return {
          ...data,
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
          emergencyContactRelationship: data.emergencyContactRelationship || '',
          profileNotes: data.profileNotes || '',
          preferredCommunication: data.preferredCommunication || 'email',
        };
      } catch (error) {
        console.error("Failed to fetch owner data:", error);
        throw error;
      }
    },
    enabled: !!ownerId
  });

  // Fetch owner's pets
  const { 
    data: petsData, 
    isLoading: isLoadingPets 
  } = useQuery({
    queryKey: ['pets', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      
      // Try to use the /api/user/pets endpoint which should be less likely to get intercepted
      try {
        console.log("Fetching pet data for owner:", ownerId);
        const response = await apiRequest('GET', `/api/user/pets`);
        const data = await response.json();
        console.log("Pet data fetched successfully:", data);
        return data;
      } catch (error) {
        console.error("Failed to fetch pet data:", error);
        // If the user/pets endpoint fails, we'll return an empty array
        // This is a graceful fallback so the UI can still render
        return [];
      }
    },
    enabled: !!ownerId
  });

  // Fetch owner's booking history
  const { 
    data: bookingsData, 
    isLoading: isLoadingBookings,
    refetch: refetchBookings
  } = useQuery({
    queryKey: ['bookings', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      
      // Try to use the /api/user/bookings endpoint which should be less likely to get intercepted
      try {
        console.log("Fetching booking data for owner:", ownerId);
        const response = await apiRequest('GET', `/api/user/bookings`);
        const data = await response.json();
        console.log("Booking data fetched successfully:", data);
        return data;
      } catch (error) {
        console.error("Failed to fetch booking data:", error);
        // Fallback to MCPClient to attempt a real-time fetch
        try {
          console.log("Attempting to fetch bookings via MCP client");
          const mcpBookings = await mcpAPI.getBookingsByOwnerId(ownerId);
          console.log("MCP booking data:", mcpBookings);
          return mcpBookings || [];
        } catch (mcpError) {
          console.error("Failed to fetch booking data via MCP:", mcpError);
          return [];
        }
      }
    },
    enabled: !!ownerId,
    // Don't cache the results for as long
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true
  });
  
  // Force refetch bookings data when the bookings tab is selected
  useEffect(() => {
    if (activeTab === 'bookings' && ownerId) {
      // Invalidate the cache and refetch
      queryClient.invalidateQueries({queryKey: ['bookings', ownerId]});
      refetchBookings();
    }
  }, [activeTab, ownerId, refetchBookings]);

  // If user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/20 p-4 rounded-lg">
          <h2 className="text-xl font-semibold flex items-center">
            <AlertCircle className="mr-2" />
            Authentication Required
          </h2>
          <p className="mt-2">You need to log in to view your profile information.</p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Fetch owner data for the logged-in user
  const { 
    data: ownerByEmail, 
    isLoading: isLoadingOwnerByEmail 
  } = useQuery({
    queryKey: ['owner-by-email', user.email],
    queryFn: async () => {
      if (!user.email) return null;
      // Use a custom API endpoint to find owner by email
      const response = await apiRequest('GET', `/api/owners/by-email/${encodeURIComponent(user.email)}`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!user.email && !ownerId // Only run this query if user has an email and no ownerId
  });

  // Setup mutation for linking account
  const { mutate: linkAccount, isPending: isLinking } = useMutation({
    mutationFn: async (ownerId: number) => {
      // Use the API endpoint to update the user and set their ownerId
      const response = await apiRequest('PATCH', `/api/user/owner`, { 
        ownerId: ownerId 
      });
      
      if (!response.ok) {
        throw new Error('Failed to link account');
      }
      
      // Update user in cache with new ownerId
      const userData = queryClient.getQueryData(['/api/user']);
      if (userData) {
        queryClient.setQueryData(['/api/user'], { ...userData, ownerId: ownerId });
      }
      
      return true;
    },
    onSuccess: () => {
      // Reload the page to refresh all queries with the new ownerId
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Account linking failed",
        description: "We couldn't automatically link your account. Please try again or contact support.",
        variant: "destructive",
      });
    }
  });
  
  // Effect to auto-link account when owner is found
  React.useEffect(() => {
    if (ownerByEmail && !ownerId && !isLinking) {
      linkAccount(ownerByEmail.id);
    }
  }, [ownerByEmail, ownerId, isLinking, linkAccount]);

  // If user doesn't have an ownerId, handle various states
  if (!ownerId) {
    // If we found an owner by email, show the linking UI
    if (ownerByEmail && !isLoadingOwnerByEmail) {
      // Show progress while linking
      return (
        <div className="container mx-auto py-8">
          <div className="bg-amber-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold flex items-center text-amber-800">
              <AlertCircle className="mr-2" />
              {isLinking ? "Linking Your Account..." : "Account Linking Required"}
            </h2>
            <p className="mt-2 text-amber-700">
              {isLinking 
                ? "We found your profile information and are linking it to your account. Please wait..." 
                : "We found your profile information, but were unable to link it to your account automatically. Please try again or contact support."}
            </p>
            
            {isLinking ? (
              <div className="flex items-center mt-4">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Connecting your information...</span>
              </div>
            ) : (
              <div className="flex gap-4 mt-4">
                <Button 
                  variant="default"
                  onClick={() => linkAccount(ownerByEmail.id)}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // If still loading, show loading state
    if (isLoadingOwnerByEmail) {
      return <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span className="text-xl">Searching for your profile...</span>
      </div>;
    }

    // If we can't find an owner, show a message that we need to set up a profile
    return (
      <div className="container mx-auto py-8">
        <div className="bg-amber-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold flex items-center text-amber-800">
            <AlertCircle className="mr-2" />
            Profile Setup Required
          </h2>
          <p className="mt-2 text-amber-700">
            You need to set up your profile before you can book services. 
            Please complete your profile information.
          </p>
          <Button 
            className="mt-4" 
            variant="default"
            onClick={() => navigate('/booking')}
          >
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingOwner) {
    return <div className="flex items-center justify-center min-h-[600px]">
      <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <span className="text-xl">Loading your profile...</span>
    </div>;
  }

  if (!ownerData) {
    return <div className="container mx-auto py-8">
      <div className="bg-amber-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold flex items-center text-amber-800">
          <AlertCircle className="mr-2" />
          Profile Setup Required
        </h2>
        <p className="mt-2 text-amber-700">
          You need to set up your profile before you can view your information.
          Please complete your profile by booking a service or updating your details.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button 
            variant="default"
            onClick={() => navigate('/booking')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Book a Service
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">
          My Profile
        </h1>
        <Button 
          className="ml-auto"
          onClick={() => navigate('/booking')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Book a Service
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="owner">My Details</TabsTrigger>
          <TabsTrigger value="pets">My Pets</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  My Information
                </CardTitle>
                <CardDescription>Your contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{ownerData.firstName} {ownerData.lastName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium">{ownerData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span className="ml-2 font-medium">{ownerData.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <Home className="mr-2 h-4 w-4 opacity-70 mt-1" />
                    <span className="text-sm text-muted-foreground">Address:</span>
                    <span className="ml-2 font-medium">{ownerData.address}</span>
                  </div>
                </div>
                
                {/* Emergency Contact Preview */}
                {ownerData.emergencyContactName && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                      Emergency Contact
                    </h4>
                    <p className="text-sm mt-1">{ownerData.emergencyContactName} ({ownerData.emergencyContactRelationship}): {ownerData.emergencyContactPhone}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveTab('owner')}
                >
                  Edit My Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Pets Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  My Pets
                </CardTitle>
                <CardDescription>
                  {isLoadingPets ? 'Loading your pets...' : 
                    petsData && petsData.length > 0 
                      ? `${petsData.length} pet${petsData.length > 1 ? 's' : ''} registered` 
                      : 'No pets registered yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPets ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Loading your pets...</span>
                  </div>
                ) : petsData && petsData.length > 0 ? (
                  <ul className="space-y-3">
                    {petsData.slice(0, 3).map(pet => (
                      <li key={pet.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-3 ${pet.isVaccinated ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                          <div>
                            <p className="font-medium">{pet.name}</p>
                            <p className="text-sm text-muted-foreground">{pet.breed}, {pet.age} years, {pet.gender}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('pets');
                          }}
                        >
                          Details
                        </Button>
                      </li>
                    ))}
                    {petsData.length > 3 && (
                      <li className="text-center pt-2">
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab('pets')}
                        >
                          See all {petsData.length} pets
                        </Button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You haven't added any pets yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('pets')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add a Pet
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setActiveTab('pets')}
                >
                  Manage My Pets
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Bookings Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="mr-2 h-5 w-5" />
                  My Recent Bookings
                </CardTitle>
                <CardDescription>
                  {isLoadingBookings ? 'Loading your booking history...' : 
                    bookingsData && bookingsData.length > 0 
                      ? `${bookingsData.length} booking${bookingsData.length > 1 ? 's' : ''} found` 
                      : 'No booking history available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Loading booking history...</span>
                  </div>
                ) : bookingsData && bookingsData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Service</th>
                          <th className="text-left py-2 px-3 font-medium">Pet</th>
                          <th className="text-left py-2 px-3 font-medium">Date</th>
                          <th className="text-left py-2 px-3 font-medium">Status</th>
                          <th className="text-left py-2 px-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingsData.slice(0, 5).map(booking => {
                          const pet = petsData?.find(p => p.id === booking.petId);
                          return (
                            <tr key={booking.id} className="border-b">
                              <td className="py-2 px-3">{booking.serviceId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
                              <td className="py-2 px-3">{pet?.name || `Pet #${booking.petId}`}</td>
                              <td className="py-2 px-3">
                                {formatDateWithTimezone(
                                  new Date(booking.startDate),
                                  ownerData?.timezone || 'America/Chicago',
                                  'MMM d, yyyy'
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => navigate(`/booking?service=${booking.serviceId}`)}
                                >
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  Rebook
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {bookingsData.length > 5 && (
                      <div className="text-center mt-4">
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab('bookings')}
                        >
                          See all {bookingsData.length} bookings
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You don't have any bookings yet</p>
                    <Button 
                      onClick={() => navigate('/booking')}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Book a Service
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Owner Details Tab */}
        <TabsContent value="owner" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit My Details</CardTitle>
              <CardDescription>Update your contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <OwnerEditForm owner={ownerData} onSuccess={() => {
                setActiveTab('overview');
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pets Tab */}
        <TabsContent value="pets" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>My Pets</CardTitle>
                <CardDescription>Manage your pet information</CardDescription>
              </div>
              <Button 
                size="sm"
                onClick={() => navigate('/booking')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPets ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  <span>Loading your pets...</span>
                </div>
              ) : !petsData || petsData.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">You haven't added any pets yet</p>
                  <Button onClick={() => navigate('/booking')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Pet
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {petsData.map((pet) => (
                    <div key={pet.id} className="py-4">
                      {editingPetId === pet.id ? (
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>Edit Pet: {pet.name}</CardTitle>
                            <CardDescription>Update information for your pet</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <PetEditForm 
                              pet={pet} 
                              onSuccess={() => {
                                setEditingPetId(null);
                                queryClient.invalidateQueries({queryKey: ['pets', ownerId]});
                              }}
                              onCancel={() => setEditingPetId(null)}
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-medium">{pet.name}</h3>
                              <p className="text-sm text-muted-foreground">{pet.breed}, {pet.age} years, {pet.gender}</p>
                              <div className="flex items-center mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pet.isVaccinated ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {pet.isVaccinated ? 'Vaccinated' : 'Vaccination needed'}
                                </span>
                                {pet.specialNeeds && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Special needs
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Set the editing pet ID to show the edit form
                                setEditingPetId(pet.id);
                              }}
                            >
                              Edit Pet
                            </Button>
                          </div>
                          
                          {pet.specialNeeds && (
                            <div className="mt-2 text-sm">
                              <span className="font-semibold">Special Needs:</span> {pet.specialNeeds}
                            </div>
                          )}
                          
                          {/* Veterinarian Info */}
                          {pet.vetName && (
                            <div className="mt-4 border-t pt-2">
                              <h4 className="text-sm font-semibold">Veterinarian Information</h4>
                              <div className="text-sm mt-1">
                                <p><span className="text-muted-foreground">Name:</span> {pet.vetName}</p>
                                {pet.vetPhone && <p><span className="text-muted-foreground">Phone:</span> {pet.vetPhone}</p>}
                                {pet.vetAddress && <p><span className="text-muted-foreground">Address:</span> {pet.vetAddress}</p>}
                                {pet.vetLastVisit && <p><span className="text-muted-foreground">Last Visit:</span> {formatDateWithTimezone(new Date(pet.vetLastVisit), ownerData?.timezone || 'America/Chicago', 'MMM d, yyyy')}</p>}
                              </div>
                            </div>
                          )}
                          
                          {/* Medical Information */}
                          {(pet.medicalHistory || pet.medicationInstructions || pet.dietaryRestrictions) && (
                            <div className="mt-4 border-t pt-2">
                              <h4 className="text-sm font-semibold">Medical Information</h4>
                              <div className="text-sm mt-1">
                                {pet.medicalHistory && <p><span className="text-muted-foreground">Medical History:</span> {pet.medicalHistory}</p>}
                                {pet.medicationInstructions && <p><span className="text-muted-foreground">Medication:</span> {pet.medicationInstructions}</p>}
                                {pet.dietaryRestrictions && <p><span className="text-muted-foreground">Dietary Restrictions:</span> {pet.dietaryRestrictions}</p>}
                              </div>
                            </div>
                          )}
                          
                          {/* Behavioral Notes */}
                          {pet.behavioralNotes && (
                            <div className="mt-4 border-t pt-2">
                              <h4 className="text-sm font-semibold">Behavioral Notes</h4>
                              <p className="text-sm mt-1">{pet.behavioralNotes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 items-start">
              <div>
                <CardTitle>My Booking History</CardTitle>
                <CardDescription>Complete history of all your bookings</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Invalidate the cache and refetch
                  queryClient.invalidateQueries({queryKey: ['bookings', ownerId]});
                  refetchBookings();
                  toast({
                    title: "Refreshing bookings",
                    description: "Your booking list is being updated...",
                  });
                }}
                disabled={isLoadingBookings}
              >
                {isLoadingBookings ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !bookingsData || bookingsData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-6">You don't have any bookings yet</p>
                  <Button onClick={() => navigate('/booking')}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Book a Service
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Booking ID</th>
                        <th className="text-left py-3 px-4 font-medium">Service</th>
                        <th className="text-left py-3 px-4 font-medium">Pet</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Price</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsData.map(booking => {
                        // Find the pet for this booking
                        const pet = petsData?.find(p => p.id === booking.petId);
                        
                        return (
                          <tr 
                            key={booking.id} 
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              // Find the service name from the serviceId
                              const serviceName = booking.serviceId.split('-')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                                
                              setSelectedBooking({
                                booking: booking,
                                pet: pet,
                                owner: ownerData,
                                service: { name: serviceName }
                              });
                            }}
                          >
                            <td className="py-3 px-4 font-medium">{booking.bookingId}</td>
                            <td className="py-3 px-4">
                              {booking.serviceId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </td>
                            <td className="py-3 px-4">{pet?.name || `Pet #${booking.petId}`}</td>
                            <td className="py-3 px-4">
                              {formatDateWithTimezone(
                                new Date(booking.startDate),
                                ownerData?.timezone || 'America/Chicago',
                                'MMM d, yyyy'
                              )}
                              <div className="text-xs text-muted-foreground">
                                {booking.startTime ? format(new Date(`2023-01-01T${booking.startTime}`), 'h:mm a') : 'All day'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">${booking.totalPrice.toFixed(2)}</td>
                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/booking?service=${booking.serviceId}`);
                                }}
                              >
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Rebook
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/booking')}>
                <Plus className="h-4 w-4 mr-2" />
                Book a New Service
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Booking Details</span>
                <Badge className={`${
                  selectedBooking.booking.status === 'confirmed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                  selectedBooking.booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                  selectedBooking.booking.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                  selectedBooking.booking.status === 'completed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                  'bg-gray-100 text-gray-800 hover:bg-gray-100'
                }`}>
                  {selectedBooking.booking.status.charAt(0).toUpperCase() + selectedBooking.booking.status.slice(1)}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Booking ID: {selectedBooking.booking.bookingId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-lg mb-2">Service Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-2">
                    <span className="font-medium">Service: </span>
                    {selectedBooking.service?.name || `Service ID: ${selectedBooking.booking.serviceId}`}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Dropoff: </span>
                    {formatDateWithTimezone(
                      new Date(selectedBooking.booking.startDate),
                      selectedBooking.owner?.timezone || 'America/Chicago',
                      'MMM d, yyyy'
                    )} at {selectedBooking.booking.startTime ? 
                      format(new Date(`2023-01-01T${selectedBooking.booking.startTime}`), 'h:mm a') : 
                      'All day'}
                  </div>
                  {selectedBooking.booking.endDate && (
                    <div className="mb-2">
                      <span className="font-medium">Pickup: </span>
                      {formatDateWithTimezone(
                        new Date(selectedBooking.booking.endDate),
                        selectedBooking.owner?.timezone || 'America/Chicago',
                        'MMM d, yyyy'
                      )} at {selectedBooking.booking.endTime ? 
                        format(new Date(`2023-01-01T${selectedBooking.booking.endTime}`), 'h:mm a') : 
                        'End of day'}
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="font-medium">Total Price: </span>
                    ${selectedBooking.booking.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Pet Information</h3>
                {selectedBooking.pet ? (
                  <>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-2">
                        <span className="font-medium">Name: </span>
                        {selectedBooking.pet.name}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Breed: </span>
                        {selectedBooking.pet.breed}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Age: </span>
                        {selectedBooking.pet.age} years
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Weight: </span>
                        {selectedBooking.pet.weight} lbs
                      </div>
                      {selectedBooking.pet.specialNeeds && (
                        <div className="mb-2">
                          <span className="font-medium">Special Needs: </span>
                          {selectedBooking.pet.specialNeeds}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <span className="font-medium">Pet ID: </span>
                    {selectedBooking.booking.petId}
                    <p className="text-sm text-gray-500 mt-1">Pet details could not be loaded</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedBooking(null);
                    navigate(`/booking?service=${selectedBooking.booking.serviceId}`);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Book Similar Service
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}