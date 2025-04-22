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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
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
  selectedPetIds: z.array(z.number()).default([]),
  addNewPet: z.boolean().default(false),
});

export default function PetOwnerFormSimplified({ 
  onSubmit, 
  initialPet, 
  initialOwner, 
  isUserLoggedIn = false 
}: PetOwnerFormProps) {
  const { user } = useAuth();
  
  // State initialization
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [showPetForm, setShowPetForm] = useState(!isUserLoggedIn);
  
  // Flag to track if we've done the initial setup
  const initialSetupDone = useRef(false);
  
  // Fetch user's existing pets if logged in
  const {
    data: petsData,
    isLoading: isLoadingPets,
    error: petsError
  } = useQuery<Pet[]>({
    queryKey: ['/api/user/pets'],
    enabled: isUserLoggedIn && !!user?.ownerId,
  });
  
  // Form setup
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
      selectedPetIds: [],
      addNewPet: !isUserLoggedIn,
    },
  });
  
  // One-time initialization when pets data loads
  useEffect(() => {
    // Skip if we've already done the setup or data isn't available yet
    if (initialSetupDone.current || !petsData?.length || selectedPetIds.length > 0) {
      return;
    }
    
    // Set the first pet as default selection
    const firstPet = petsData[0];
    setSelectedPetIds([firstPet.id]);
    
    // Update the form values
    form.setValue('selectedPetIds', [firstPet.id]);
    form.setValue('addNewPet', false);
    
    // Also populate pet fields with selected pet data
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
    
    setShowPetForm(false);
    
    // Mark setup as complete
    initialSetupDone.current = true;
  }, [petsData]);
  
  // Handle selecting an existing pet
  const handlePetSelect = (petId: number) => {
    // Toggle selection
    const newSelectedPetIds = [...selectedPetIds];
    const petIndex = newSelectedPetIds.indexOf(petId);
    
    if (petIndex === -1) {
      // Add to selection
      newSelectedPetIds.push(petId);
    } else {
      // Remove from selection
      newSelectedPetIds.splice(petIndex, 1);
    }
    
    // Update state and form
    setSelectedPetIds(newSelectedPetIds);
    form.setValue('selectedPetIds', newSelectedPetIds);
    
    // Hide the pet form if pets are selected
    if (newSelectedPetIds.length > 0) {
      setShowPetForm(false);
      form.setValue('addNewPet', false);
    }
    
    // If a pet is selected, update the form fields with its data
    if (newSelectedPetIds.length > 0) {
      const lastSelectedPet = petsData?.find(pet => pet.id === newSelectedPetIds[newSelectedPetIds.length - 1]);
      if (lastSelectedPet) {
        form.setValue('pet', {
          name: lastSelectedPet.name,
          breed: lastSelectedPet.breed,
          age: lastSelectedPet.age,
          weight: lastSelectedPet.weight,
          gender: lastSelectedPet.gender as "male" | "female",
          specialNeeds: lastSelectedPet.specialNeeds || '',
          isVaccinated: lastSelectedPet.isVaccinated,
          vetName: lastSelectedPet.vetName || '',
          vetPhone: lastSelectedPet.vetPhone || '',
          vetAddress: lastSelectedPet.vetAddress || '',
          vetLastVisit: lastSelectedPet.vetLastVisit ? new Date(lastSelectedPet.vetLastVisit) : null,
          medicalHistory: lastSelectedPet.medicalHistory || '',
          medicationInstructions: lastSelectedPet.medicationInstructions || '',
          dietaryRestrictions: lastSelectedPet.dietaryRestrictions || '',
          behavioralNotes: lastSelectedPet.behavioralNotes || '',
        });
      }
    }
  };
  
  // Handle adding a new pet
  const handleAddNewPet = () => {
    setSelectedPetIds([]);
    setShowPetForm(true);
    form.setValue('addNewPet', true);
    form.setValue('selectedPetIds', []);
  };
  
  // Form submission handler
  function handleSubmit(values: z.infer<typeof formSchema>) {
    if (values.addNewPet || selectedPetIds.length === 0) {
      // User is creating a new pet
      onSubmit({
        pet: values.pet,
        owner: values.owner,
      });
    } else {
      // User selected existing pets
      onSubmit({
        pet: values.pet,
        owner: values.owner,
        petIds: selectedPetIds,
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
                        className={`cursor-pointer transition ${selectedPetIds.includes(pet.id) ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-300'}`}
                        onClick={() => handlePetSelect(pet.id)}
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
                            checked={selectedPetIds.includes(pet.id)}
                            // No onCheckedChange - the entire card is clickable
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Add new pet option */}
                  <Button 
                    type="button"
                    variant={showPetForm ? "default" : "outline"}
                    className="mt-4 w-full"
                    onClick={handleAddNewPet}
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
                    onClick={handleAddNewPet}
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
          {(showPetForm || !isUserLoggedIn) && (
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
                          <Input 
                            {...field} 
                            value={field.value || ''} 
                            placeholder="Medication, dietary restrictions, etc." 
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
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Vaccinations are up to date
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Selected Pets Summary (if multiple) */}
          {isUserLoggedIn && selectedPetIds.length > 0 && !showPetForm && (
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
              disabled={isUserLoggedIn && !showPetForm && selectedPetIds.length === 0}
            >
              Review & Confirm
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}