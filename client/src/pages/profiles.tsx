import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useLocation, useRoute, Link } from 'wouter';
import { format } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

// Icons
import {
  Calendar as CalendarIcon,
  Clock,
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
  UserCircle,
  CalendarDays
} from 'lucide-react';

// API
import { mcpAPI } from '@/lib/mcpAPI';
import { queryClient } from '@/lib/queryClient';
import { mcpClient, ClientRole } from '@/lib/mcpClient';
import { 
  petFormSchema, 
  ownerFormSchema, 
  type Pet, 
  type Owner 
} from '@shared/schema';

// Profile page with both pet and owner information
export default function ProfilesPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/admin/profiles/:id');
  const [activeTab, setActiveTab] = useState('overview');
  const id = match ? parseInt(params.id) : undefined;

  // Fetch owner data
  const { 
    data: ownerData, 
    isLoading: isLoadingOwner 
  } = useQuery({
    queryKey: ['owner', id],
    queryFn: async () => {
      if (!id) return null;
      return await mcpAPI.getOwner(id);
    },
    enabled: !!id
  });

  // Fetch owner's pets
  const { 
    data: petsData, 
    isLoading: isLoadingPets 
  } = useQuery({
    queryKey: ['pets', id],
    queryFn: async () => {
      if (!id) return [];
      return await mcpAPI.getPetsByOwnerId(id);
    },
    enabled: !!id
  });

  // Fetch owner's booking history
  const { 
    data: bookingsData, 
    isLoading: isLoadingBookings 
  } = useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      if (!id) return [];
      return await mcpAPI.getBookingsByOwnerId(id);
    },
    enabled: !!id
  });

  if (!match) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Owner and Pet Profiles</h1>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <Home className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
        <OwnersList />
      </div>
    );
  }

  if (isLoadingOwner) {
    return <div className="flex items-center justify-center min-h-[600px]">
      <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <span className="text-xl">Loading profile...</span>
    </div>;
  }

  if (!ownerData) {
    return <div className="container mx-auto py-8">
      <div className="bg-destructive/20 p-4 rounded-lg">
        <h2 className="text-xl font-semibold flex items-center">
          <AlertCircle className="mr-2" />
          Owner not found
        </h2>
        <p className="mt-2">The requested owner profile could not be found.</p>
        <Button 
          className="mt-4" 
          variant="outline"
          onClick={() => navigate('/admin/profiles')}
        >
          Back to Profiles
        </Button>
      </div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">
          {ownerData.firstName} {ownerData.lastName}'s Profile
        </h1>
        <Button 
          className="ml-auto"
          variant="outline"
          onClick={() => navigate('/admin/profiles')}
        >
          Back to All Profiles
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="owner">Owner Details</TabsTrigger>
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="bookings">Booking History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Owner Information
                </CardTitle>
                <CardDescription>Basic contact information</CardDescription>
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
                  Edit Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Pets Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Pets
                </CardTitle>
                <CardDescription>
                  {isLoadingPets ? 'Loading pets...' : 
                    petsData && petsData.length > 0 
                      ? `${petsData.length} pet${petsData.length > 1 ? 's' : ''} registered` 
                      : 'No pets registered yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPets ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Loading pets...</span>
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
                    <p className="text-muted-foreground mb-4">No pets have been added yet</p>
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
                  Manage Pets
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Bookings Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="mr-2 h-5 w-5" />
                  Recent Bookings
                </CardTitle>
                <CardDescription>
                  {isLoadingBookings ? 'Loading booking history...' : 
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
                                {format(new Date(booking.startDate), 'MMM d, yyyy')}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
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
                    <p className="text-muted-foreground mb-4">No booking history available</p>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/')}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Make a Booking
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Owner Details Tab */}
        <TabsContent value="owner" className="space-y-6 mt-6">
          <OwnerProfileForm owner={ownerData} ownerId={id} />
        </TabsContent>

        {/* Pets Tab */}
        <TabsContent value="pets" className="space-y-6 mt-6">
          <PetsManager ownerId={id || 0} pets={petsData || []} isLoading={isLoadingPets} />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Complete history of all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-3" />
                  <span className="text-lg">Loading booking history...</span>
                </div>
              ) : bookingsData && bookingsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Booking ID</th>
                        <th className="text-left py-3 px-4 font-medium">Service</th>
                        <th className="text-left py-3 px-4 font-medium">Pet</th>
                        <th className="text-left py-3 px-4 font-medium">Start Date</th>
                        <th className="text-left py-3 px-4 font-medium">End Date</th>
                        <th className="text-left py-3 px-4 font-medium">Price</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsData.map(booking => {
                        const pet = petsData?.find(p => p.id === booking.petId);
                        return (
                          <tr key={booking.id} className="border-b">
                            <td className="py-3 px-4">{booking.id}</td>
                            <td className="py-3 px-4">{booking.serviceId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
                            <td className="py-3 px-4">{pet?.name || `Pet #${booking.petId}`}</td>
                            <td className="py-3 px-4">{format(new Date(booking.startDate), 'MMM d, yyyy')}</td>
                            <td className="py-3 px-4">{booking.endDate ? format(new Date(booking.endDate), 'MMM d, yyyy') : 'N/A'}</td>
                            <td className="py-3 px-4">${booking.totalPrice}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No booking history available for this owner</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Make a Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Owners list component
function OwnersList() {
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(mcpClient.getRole() === ClientRole.ADMIN);
  const { toast } = useToast();
  
  // Connect to MCP server if not already connected
  useEffect(() => {
    if (!mcpClient.isConnected()) {
      mcpClient.connect();
    }
  }, []);
  
  // Fetch all owners using react-query
  const { 
    data: owners, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      return await mcpAPI.getAllOwners();
    }
  });
  
  // Setup authentication event listener
  useEffect(() => {
    const unsubscribe = mcpClient.onAuthentication((success, role, error) => {
      if (success && role === ClientRole.ADMIN) {
        toast({
          title: "Authentication Successful",
          description: "You now have admin privileges.",
          variant: "default",
        });
        setIsAdmin(true);
        refetch();
      } else if (error) {
        toast({
          title: "Authentication Failed",
          description: error,
          variant: "destructive",
        });
      }
    });
    
    return () => unsubscribe();
  }, [toast, refetch]);
  
  const handleAdminAuth = () => {
    mcpClient.authenticate({ adminKey: 'admin123' });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg">Loading owner profiles...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {isCreatingOwner ? (
        <CreateOwnerForm onCancel={() => setIsCreatingOwner(false)} />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Pet Owners</CardTitle>
              <CardDescription>Browse and manage pet owner profiles</CardDescription>
            </div>
            <div className="flex space-x-2">
              {!isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={handleAdminAuth}
                >
                  Become Admin
                </Button>
              )}
              <Button onClick={() => setIsCreatingOwner(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Owner
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!owners || owners.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No pet owners have been added yet</p>
                <Button onClick={() => setIsCreatingOwner(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Owner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {owners.map((owner) => (
                  <div 
                    key={owner.id} 
                    className="p-4 border rounded-lg flex items-center hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/profiles/${owner.id}`)}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <UserCircle className="h-6 w-6" />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">{owner.firstName} {owner.lastName}</h3>
                      <div className="flex flex-col sm:flex-row text-sm text-muted-foreground">
                        <p className="flex items-center mr-4">
                          <Mail className="h-3 w-3 mr-1" />
                          {owner.email}
                        </p>
                        <p className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {owner.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {/* Add indicator for pet count if available */}
                      <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {owner.petCount || 0} pet{(owner.petCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/profiles/${owner.id}`} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Owner profile form component
function OwnerProfileForm({ owner, ownerId }: { owner: Owner, ownerId?: number }) {
  const form = useForm<z.infer<typeof ownerFormSchema>>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      emergencyContactName: owner.emergencyContactName || "",
      emergencyContactPhone: owner.emergencyContactPhone || "",
      emergencyContactRelationship: owner.emergencyContactRelationship || "",
      preferredCommunication: owner.preferredCommunication || "email",
      profileNotes: owner.profileNotes || ""
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ownerFormSchema>) => {
      if (!ownerId) throw new Error("Owner ID is required");
      return await mcpAPI.updateOwner(ownerId, values);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "The owner profile has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['owner', ownerId] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.toString(),
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: z.infer<typeof ownerFormSchema>) {
    updateMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner Details</CardTitle>
        <CardDescription>Edit the owner's contact information and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                        />
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(555) 123-4567" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main St, City, State, ZIP" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredCommunication"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Preferred Communication</FormLabel>
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
                              Phone Call
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sms" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              SMS/Text
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Emergency Contact */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Emergency Contact</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
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
                        <Input placeholder="(555) 987-6543" {...field} />
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
                        <Input placeholder="e.g., Spouse, Parent, Friend" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <FormField
              control={form.control}
              name="profileNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information we should know about the owner" 
                      {...field} 
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending}
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Pet profile form component
function PetProfileForm({ 
  pet, 
  ownerId, 
  onSuccess
}: { 
  pet?: Pet, 
  ownerId: number, 
  onSuccess?: () => void 
}) {
  const isNewPet = !pet;
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof petFormSchema>>({
    resolver: zodResolver(petFormSchema),
    defaultValues: pet ? {
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender as "male" | "female",
      isVaccinated: pet.isVaccinated,
      specialNeeds: pet.specialNeeds || "",
      vetName: pet.vetName || "",
      vetPhone: pet.vetPhone || "",
      vetAddress: pet.vetAddress || "",
      medicalHistory: pet.medicalHistory || "",
      medicationInstructions: pet.medicationInstructions || "",
      dietaryRestrictions: pet.dietaryRestrictions || "",
      behavioralNotes: pet.behavioralNotes || "",
      ownerId
    } : {
      name: "",
      breed: "",
      age: 0,
      weight: 0,
      gender: "male",
      isVaccinated: false,
      specialNeeds: "",
      vetName: "",
      vetPhone: "",
      vetAddress: "",
      medicalHistory: "",
      medicationInstructions: "",
      dietaryRestrictions: "",
      behavioralNotes: "",
      ownerId
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof petFormSchema>) => {
      return await mcpAPI.createPet({
        ...values,
        ownerId
      });
    },
    onSuccess: () => {
      toast({
        title: "Pet Added Successfully",
        description: "The new pet has been added to this owner's profile.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['pets', ownerId] });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Pet",
        description: error.message || "An error occurred while adding the pet.",
        variant: "destructive",
      });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof petFormSchema>) => {
      if (!pet?.id) throw new Error("Pet ID is required");
      return await mcpAPI.updatePet(pet.id, values);
    },
    onSuccess: () => {
      toast({
        title: "Pet Updated Successfully",
        description: "The pet information has been updated.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['pets', ownerId] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Pet",
        description: error.message || "An error occurred while updating the pet.",
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: z.infer<typeof petFormSchema>) {
    if (isNewPet) {
      createMutation.mutate(values);
    } else {
      updateMutation.mutate(values);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNewPet ? 'Add New Pet' : `Edit ${pet?.name}'s Information`}</CardTitle>
        <CardDescription>
          {isNewPet 
            ? 'Add a new pet to this owner\'s profile' 
            : 'Update pet information, medical history, and special needs'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Basic Information</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Max" {...field} />
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
                        <Input placeholder="e.g., Labrador Retriever" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (years)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.5" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                            min="0" 
                            step="0.5" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="gender"
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
                
                <FormField
                  control={form.control}
                  name="isVaccinated"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Vaccinated</FormLabel>
                        <FormDescription>
                          Pet has up-to-date vaccinations
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specialNeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Needs</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special needs, accommodations, or concerns" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Veterinary Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Veterinary Information</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="vetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veterinarian Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Smith" {...field} />
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
                        <Input placeholder="(555) 987-6543" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vetAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veterinarian Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Address of vet clinic" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any past medical issues, surgeries, conditions, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Care Information</h3>
              
              <FormField
                control={form.control}
                name="medicationInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Current medications and dosage instructions" 
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
                        placeholder="Any food allergies, restrictions, or feeding instructions" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="behavioralNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behavioral Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Important behavioral information (e.g., anxiety, fear of thunder, doesn't get along with cats)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  if (onSuccess) onSuccess();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                }
                {isNewPet ? 'Add Pet' : 'Update Pet'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Pets manager component
function PetsManager({ 
  ownerId, 
  pets, 
  isLoading 
}: { 
  ownerId: number, 
  pets: Pet[], 
  isLoading: boolean 
}) {
  const [selectedPet, setSelectedPet] = useState<Pet | undefined>(undefined);
  const [isAddingPet, setIsAddingPet] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg">Loading pets...</span>
      </div>
    );
  }
  
  if (isAddingPet) {
    return (
      <PetProfileForm 
        ownerId={ownerId} 
        onSuccess={() => setIsAddingPet(false)} 
      />
    );
  }
  
  if (selectedPet) {
    return (
      <PetProfileForm 
        pet={selectedPet}
        ownerId={ownerId}
        onSuccess={() => setSelectedPet(undefined)}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pets</h2>
        <Button onClick={() => setIsAddingPet(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Pet
        </Button>
      </div>
      
      {pets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No pets have been added to this owner's profile yet</p>
            <Button onClick={() => setIsAddingPet(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-3 ${pet.isVaccinated ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <CardTitle>{pet.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPet(pet)}>
                    Edit
                  </Button>
                </div>
                <CardDescription>{pet.breed}, {pet.age} years old</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <p className="font-medium">{pet.gender}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <p className="font-medium">{pet.weight} lbs</p>
                    </div>
                  </div>
                  
                  {pet.specialNeeds && (
                    <div>
                      <h4 className="text-sm font-medium text-amber-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Special Needs
                      </h4>
                      <p className="text-sm mt-1">{pet.specialNeeds}</p>
                    </div>
                  )}
                  
                  {pet.vetName && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Veterinarian</h4>
                      <p className="text-sm">{pet.vetName}{pet.vetPhone ? ` · ${pet.vetPhone}` : ''}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedPet(pet)}
                >
                  View Full Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Create owner form component 
function CreateOwnerForm({ onCancel }: { onCancel: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof ownerFormSchema>>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      preferredCommunication: "email",
      profileNotes: ""
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ownerFormSchema>) => {
      return await mcpAPI.createOwner(values);
    },
    onSuccess: () => {
      toast({
        title: "Owner Created",
        description: "The new owner profile has been created successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.toString(),
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: z.infer<typeof ownerFormSchema>) {
    createMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Owner</CardTitle>
        <CardDescription>Create a new pet owner profile</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                        />
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(555) 123-4567" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main St, City, State, ZIP" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredCommunication"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Preferred Communication</FormLabel>
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
                              Phone Call
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sms" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              SMS/Text
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Emergency Contact */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Emergency Contact (Optional)</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
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
                        <Input placeholder="(555) 987-6543" {...field} />
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
                        <Input placeholder="e.g., Spouse, Parent, Friend" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="profileNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information about the owner" 
                          {...field} 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Owner
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}