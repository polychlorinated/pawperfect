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
import { petFormSchema, ownerFormSchema, BookingFormData } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

interface PetOwnerFormProps {
  onSubmit: (data: { 
    pet: BookingFormData['pet'], 
    owner: BookingFormData['owner']
  }) => void;
  initialPet?: BookingFormData['pet'];
  initialOwner?: BookingFormData['owner'];
  isUserLoggedIn?: boolean;
}

// Combined form schema (simplified - no pet selection)
const formSchema = z.object({
  pet: petFormSchema,
  owner: ownerFormSchema,
});

export default function BasicPetOwnerForm({ 
  onSubmit, 
  initialPet, 
  initialOwner, 
  isUserLoggedIn = false 
}: PetOwnerFormProps) {
  const { user } = useAuth();
  
  // Form setup with minimal state
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
    },
  });
  
  // Simple form submission handler - no complex state management
  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit({
      pet: values.pet,
      owner: values.owner,
    });
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
          ? "Please review and confirm your information for this booking."
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
          
          {/* Pet Information Form - always shown */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Pet Information</h3>
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

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Previous
            </Button>
            <Button type="submit">
              Review & Confirm
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}