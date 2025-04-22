import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { petFormSchema, ownerFormSchema, BookingFormData, Pet } from "@shared/schema";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface PetOwnerFormProps {
  onSubmit: (data: { 
    pet: BookingFormData['pet'], 
    owner: BookingFormData['owner'], 
    petId?: number,
    petIds?: number[]
  }) => void;
  initialPet?: BookingFormData['pet'];
  initialOwner?: BookingFormData['owner'];
  isUserLoggedIn?: boolean;
}

// Combined form schema
const formSchema = z.object({
  pet: petFormSchema,
  owner: ownerFormSchema,
  selectedPetId: z.number().optional(),
  selectedPetIds: z.array(z.number()).default([]),
  addNewPet: z.boolean().default(false),
});

export default function PetOwnerForm({ onSubmit, initialPet, initialOwner, isUserLoggedIn = false }: PetOwnerFormProps) {
  const { user } = useAuth();
  const [showNewPetForm, setShowNewPetForm] = useState(!isUserLoggedIn);
  
  // For efficient rendering - moved watch outside of render
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [isAddNewPet, setIsAddNewPet] = useState(false);
  
  // Fetch user's existing pets if logged in
  const {
    data: petsData,
    isLoading: isLoadingPets,
    error: petsError
  } = useQuery<Pet[]>({
    queryKey: ['/api/user/pets'],
    enabled: isUserLoggedIn && !!user?.ownerId,
  });
  
  // Initialize form with default values or initial data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pet: initialPet || {
        name: "",
        breed: "",
        age: 0,
        weight: 0,
        gender: "male",
        specialNeeds: "",
        isVaccinated: false,
      },
      owner: initialOwner || {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
      },
      selectedPetId: undefined,
      selectedPetIds: [],
      addNewPet: !isUserLoggedIn,
    },
  });
  
  // Use a ref to track initialization state
  const initialized = useRef(false);
  
  // Initialize the pet form state only once when pets data is available
  useEffect(() => {
    // Skip if already initialized or no pets data
    if (initialized.current || !petsData || petsData.length === 0) {
      return;
    }
    
    // If user is adding a new pet, skip initializing with defaults
    if (form.getValues().addNewPet) {
      initialized.current = true;
      return;
    }
    
    // Select the first pet by default (only once)
    const firstPet = petsData[0];
    
    // Update form values (do this all at once)
    form.setValue('selectedPetId', firstPet.id);
    form.setValue('selectedPetIds', [firstPet.id]);
    form.setValue('addNewPet', false);
    form.setValue('pet', {
      name: firstPet.name,
      breed: firstPet.breed,
      age: firstPet.age,
      weight: firstPet.weight,
      gender: firstPet.gender as "male" | "female",
      specialNeeds: firstPet.specialNeeds || '',
      isVaccinated: firstPet.isVaccinated,
      vetName: firstPet.vetName || '',
      vetPhone: firstPet.vetPhone || '',
      vetAddress: firstPet.vetAddress || '',
      vetLastVisit: firstPet.vetLastVisit ? new Date(firstPet.vetLastVisit) : null,
      medicalHistory: firstPet.medicalHistory || '',
      medicationInstructions: firstPet.medicationInstructions || '',
      dietaryRestrictions: firstPet.dietaryRestrictions || '',
      behavioralNotes: firstPet.behavioralNotes || '',
    });
    
    // Update the local state variables
    setSelectedPetIds([firstPet.id]);
    setShowNewPetForm(false);
    setIsAddNewPet(false);
    
    // Mark as initialized to prevent running again
    initialized.current = true;
  }, [petsData, form]);
  
  // Handle pet selection change
  const handlePetSelectionChange = (petId: number) => {
    console.log("Selected pet ID:", petId);
    
    if (petId === -1) {
      // -1 is our code for "add new pet"
      setShowNewPetForm(true);
      setIsAddNewPet(true);
      form.setValue('addNewPet', true);
      // Clear selectedPetId when adding a new pet
      form.setValue('selectedPetId', undefined);
      console.log("Adding new pet, cleared selectedPetId");
    } else {
      // Selected an existing pet
      setShowNewPetForm(false);
      setIsAddNewPet(false);
      form.setValue('addNewPet', false);
      
      // For the multi-pet selection array
      const newSelectedPetIds = [...selectedPetIds];
      const petIndex = newSelectedPetIds.indexOf(petId);
      
      if (petIndex === -1) {
        // Add pet to selection
        newSelectedPetIds.push(petId);
      } else {
        // Remove pet from selection
        newSelectedPetIds.splice(petIndex, 1);
      }
      
      // Update state
      setSelectedPetIds(newSelectedPetIds);
      
      // Update form values
      form.setValue('selectedPetIds', newSelectedPetIds);
      console.log("Updated selectedPetIds:", newSelectedPetIds);
      
      // Keep the legacy selectedPetId for backward compatibility
      // Set it to the last selected pet or undefined if none selected
      const lastSelectedPet = newSelectedPetIds.length > 0 ? newSelectedPetIds[newSelectedPetIds.length - 1] : undefined;
      form.setValue('selectedPetId', lastSelectedPet);
      console.log("Set selectedPetId to:", lastSelectedPet);
      
      // Find the selected pet and populate the form fields for display (using the last selected pet)
      if (lastSelectedPet) {
        const selectedPet = petsData?.find(pet => pet.id === lastSelectedPet);
        if (selectedPet) {
          console.log("Found pet data:", selectedPet);
          form.setValue('pet', {
            name: selectedPet.name,
            breed: selectedPet.breed,
            age: selectedPet.age,
            weight: selectedPet.weight,
            gender: selectedPet.gender as "male" | "female",
            specialNeeds: selectedPet.specialNeeds || '',
            isVaccinated: selectedPet.isVaccinated,
            vetName: selectedPet.vetName || '',
            vetPhone: selectedPet.vetPhone || '',
            vetAddress: selectedPet.vetAddress || '',
            vetLastVisit: selectedPet.vetLastVisit ? new Date(selectedPet.vetLastVisit) : null,
            medicalHistory: selectedPet.medicalHistory || '',
            medicationInstructions: selectedPet.medicationInstructions || '',
            dietaryRestrictions: selectedPet.dietaryRestrictions || '',
            behavioralNotes: selectedPet.behavioralNotes || '',
          });
        }
      }
    }
  };

  function handleSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submission values:", values);
    
    // If user is adding a new pet, submit the pet form data
    if (values.addNewPet) {
      console.log("Submitting with new pet");
      onSubmit({
        pet: values.pet,
        owner: values.owner,
      });
    } else {
      // User selected existing pets, so pass their IDs
      if (!values.selectedPetIds?.length && !values.selectedPetId) {
        console.error("No pets selected but addNewPet is false!");
        // Handle error - fall back to creating a new pet
        console.log("Falling back to new pet creation");
        onSubmit({
          pet: values.pet,
          owner: values.owner,
        });
        return;
      }
      
      // Get the selected pet IDs (either from the new array or fallback to legacy single selection)
      const petIds = values.selectedPetIds?.length 
        ? values.selectedPetIds 
        : (values.selectedPetId ? [values.selectedPetId] : []);
      
      console.log("Submitting with pet IDs:", petIds);
      onSubmit({
        pet: values.pet,
        owner: values.owner,
        petIds: petIds,
        petId: values.selectedPetId, // Keep for backward compatibility
      });
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">
        {isUserLoggedIn && initialOwner 
          ? "Confirm Your Booking Details" 
          : "Pet & Owner Information"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {isUserLoggedIn && initialOwner
          ? "Please review and confirm your information for this booking. You can make any necessary changes."
          : "Please provide details about your pet and your contact information."}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-8">
          {/* Owner Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Owner Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="owner.firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="owner.lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="owner.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john.smith@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="owner.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-6">
                <FormField
                  control={form.control}
                  name="owner.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main St, Anytown, USA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          {/* Pet Selection (for logged-in users) */}
          {isUserLoggedIn && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">Select Pet for Service</h3>
              
              {isLoadingPets ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading your pets...</span>
                </div>
              ) : petsError ? (
                <Alert variant="destructive" className="my-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load your pets. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : petsData && petsData.length > 0 ? (
                <>
                  <div className="grid gap-4 mt-4">
                    {petsData.map(pet => (
                      <Card 
                        key={pet.id} 
                        className={`cursor-pointer transition ${selectedPetIds.includes(pet.id) && !isAddNewPet ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-300'}`}
                        onClick={() => handlePetSelectionChange(pet.id)}
                      >
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{pet.name}</h4>
                            <p className="text-sm text-muted-foreground">{pet.breed}, {pet.age} years old</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={pet.isVaccinated ? "secondary" : "outline"}>
                                {pet.isVaccinated ? 'Vaccinated' : 'Not vaccinated'}
                              </Badge>
                              {pet.specialNeeds && (
                                <Badge variant="secondary">Special needs</Badge>
                              )}
                            </div>
                          </div>
                          <Checkbox 
                            checked={selectedPetIds.includes(pet.id) && !isAddNewPet}
                            onCheckedChange={() => handlePetSelectionChange(pet.id)}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Add new pet option */}
                  <Button 
                    type="button"
                    variant={showNewPetForm ? "default" : "outline"}
                    className="mt-4 w-full"
                    onClick={() => handlePetSelectionChange(-1)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add a new pet
                  </Button>
                </>
              ) : (
                <div className="text-center p-6 border rounded-md bg-muted/10 mt-4">
                  <p className="text-muted-foreground mb-4">You don't have any pets on record yet.</p>
                  <Button 
                    type="button"
                    onClick={() => setShowNewPetForm(true)}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first pet
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Pet Information Form */}
          {(showNewPetForm || !isUserLoggedIn) && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isUserLoggedIn ? "Add New Pet" : "Pet Information"}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <FormField
                    control={form.control}
                    name="pet.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pet's name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Buddy" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-3">
                  <FormField
                    control={form.control}
                    name="pet.breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Golden Retriever" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="pet.age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="pet.weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="pet.gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
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
                </div>

                <div className="sm:col-span-6">
                  <FormField
                    control={form.control}
                    name="pet.specialNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special needs or instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Include any dietary restrictions, medications, or behavioral notes."
                            rows={3}
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-6">
                  <FormField
                    control={form.control}
                    name="pet.isVaccinated"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I confirm my pet is up-to-date on vaccinations
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            We require proof of rabies, distemper, and bordetella vaccinations.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Display read-only pet info if pets are selected */}
          {isUserLoggedIn && !showNewPetForm && selectedPetIds.length > 0 && (
            <div className="px-4 py-3 bg-muted/20 rounded-md">
              <h4 className="font-medium text-sm mb-2">Selected Pets</h4>
              
              {selectedPetIds.map(petId => {
                const pet = petsData?.find(p => p.id === petId);
                if (!pet) return null;
                
                return (
                  <div key={pet.id} className="text-sm mb-3 pb-3 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold">{pet.name}</p>
                      <Badge variant={pet.isVaccinated ? "secondary" : "outline"} className="ml-2">
                        {pet.isVaccinated ? 'Vaccinated' : 'Not vaccinated'}
                      </Badge>
                    </div>
                    <p><span className="font-medium">Breed:</span> {pet.breed}</p>
                    <p><span className="font-medium">Age:</span> {pet.age} years</p>
                    <p><span className="font-medium">Weight:</span> {pet.weight} lbs</p>
                    {pet.specialNeeds && (
                      <p><span className="font-medium">Special Needs:</span> {pet.specialNeeds}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Previous
            </Button>
            <Button 
              type="submit" 
              disabled={isUserLoggedIn && !isAddNewPet && selectedPetIds.length === 0}
            >
              Review & Confirm
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
