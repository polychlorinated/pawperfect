import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format, addDays, subDays } from "date-fns";
import { formatDateWithTimezone } from "@/lib/timezones";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Edit, Check, X, RefreshCw, Settings, Home, CalendarDays, Archive, ArrowUpCircle, Users, Plus, AlertCircle, PawPrint, Search, SearchX, Loader2 } from "lucide-react";
import { mcpAPI } from "@/lib/mcpAPI";
import { mcpClient } from "@/lib/mcpClient";

export default function Admin() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>("active"); // active, archived, all
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // For booking date sorting
  const [selectedBooking, setSelectedBooking] = useState<any>(null); // For booking details
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list"); // Toggle between list and calendar view
  
  // State for service editing
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceFormData, setServiceFormData] = useState<any>({});
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    description: '',
    price: 0,
    priceUnit: 'per_night',
    category: 'boarding',
    durationInMinutes: 60,
    capacity: 1,
    serviceId: '',
    isArchived: false,
  });
  
  // State for availability editing
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [editedTimeSlots, setEditedTimeSlots] = useState<any[]>([]);

  // Fetch all bookings for admin view
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/admin/bookings'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch all services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
    retry: false,
  });
  
  // Fetch all pets for the admin
  const { data: petsData, isLoading: isLoadingPets } = useQuery({
    queryKey: ['/api/admin/pets'],
    queryFn: async () => {
      try {
        const pets = await mcpAPI.getAllPets();
        return { pets };
      } catch (error) {
        console.error("Error fetching pets:", error);
        throw error;
      }
    },
    retry: false,
  });
  
  // Fetch availability for the selected service and date
  const { data: availabilityAPIData, isLoading: isLoadingAvailability, refetch: refetchAvailability } = useQuery({
    queryKey: ['/api/availability', selectedServiceId, selectedDate],
    enabled: !!selectedServiceId && selectedServiceId !== "none" && !!selectedDate,
    queryFn: async () => {
      const result = await fetch(
        `/api/availability/${selectedServiceId}?start_date=${selectedDate}&end_date=${selectedDate}`
      ).then(res => res.json());
      return result;
    },
    retry: false,
  });
  
  // When availability data changes, update the edited time slots
  useEffect(() => {
    if (availabilityAPIData?.availability?.[0]) {
      setAvailabilityData(availabilityAPIData.availability[0]);
      setEditedTimeSlots(availabilityAPIData.availability[0].timeSlots);
    } else {
      setAvailabilityData(null);
      setEditedTimeSlots([]);
    }
  }, [availabilityAPIData]);

  // Update booking status
  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string, status: string }) => {
      return apiRequest('PATCH', `/api/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Booking status has been successfully updated.",
      });
      // Invalidate the bookings query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update booking status",
      });
    },
  });
  
  // Mutation for updating a service
  const updateServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/services/${data.serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.serviceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Service updated",
        description: "The service has been updated successfully",
      });
      
      // Reset the editing state
      setEditingService(null);
      setServiceFormData({});
      
      // Invalidate the services query to reload the data
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating a new service
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Service created",
        description: "The new service has been created successfully",
      });
      
      // Reset the creation state
      setIsCreatingService(false);
      setNewServiceData({
        name: '',
        description: '',
        price: 0,
        priceUnit: 'per_night',
        category: 'boarding',
        durationInMinutes: 60,
        capacity: 1,
        serviceId: '',
        isArchived: false,
      });
      
      // Invalidate the services query to reload the data
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating availability
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create payload based on what we're updating (time slots or capacity)
      const payload: any = {};
      if (data.timeSlots) {
        payload.timeSlots = data.timeSlots;
      }
      if (data.totalCapacity !== undefined) {
        payload.totalCapacity = data.totalCapacity;
      }
      
      const response = await fetch(`/api/admin/services/${data.serviceId}/availability/${data.date}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update availability');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability updated",
        description: "The availability has been updated successfully",
      });
      
      // Refetch the availability data
      refetchAvailability();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Define types to resolve TypeScript errors
  interface Booking {
    bookingId: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime?: string;
    totalPrice: number;
    status: string;
    createdAt?: string;
  }
  
  interface Owner {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  }
  
  interface Pet {
    id: number;
    name: string;
    breed: string;
    age: number;
    weight: number;
    specialNeeds?: string;
    gender?: string;
  }
  
  interface Service {
    serviceId: string;
    name: string;
    price: number;
  }
  
  interface BookingItem {
    booking: Booking;
    owner: Owner;
    pet: Pet;
    service: Service;
  }

  const bookings: BookingItem[] = bookingsData?.bookings || [];
  
  // Filter bookings based on status if a filter is selected
  const filteredBookings = statusFilter && statusFilter !== "all"
    ? bookings.filter((b) => b.booking.status === statusFilter)
    : bookings;
    
  // Sort bookings by scheduled date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.booking.startDate).getTime();
    const dateB = new Date(b.booking.startDate).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });
    
  // Search and filter state for pets
  const [petSearchQuery, setPetSearchQuery] = useState("");
  const [vaccinationFilter, setVaccinationFilter] = useState<string>("all");

  // Authenticate as admin when component mounts
  useEffect(() => {
    // Authenticate with admin key for MCP operations
    mcpClient.authenticate({
      adminKey: 'admin123' // In a production app, this should be securely stored
    });
  }, []);
    
  // Function to start editing a service
  const handleEditService = (service: any) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      priceUnit: service.priceUnit,
      capacity: service.capacity || 1,
      durationInMinutes: service.durationInMinutes || 60,
    });
  };
  
  // Function to save service changes
  const handleSaveService = () => {
    updateServiceMutation.mutate({
      serviceId: editingService.serviceId,
      serviceData: serviceFormData,
    });
  };
  
  // Function to archive or restore a service
  const handleArchiveService = (service: any) => {
    const isCurrentlyArchived = service.isArchived;
    const actionText = isCurrentlyArchived ? "restore" : "archive";
    
    // Confirm the action with the user
    if (window.confirm(`Are you sure you want to ${actionText} the service: ${service.name}?`)) {
      updateServiceMutation.mutate({
        serviceId: service.serviceId,
        serviceData: { isArchived: !isCurrentlyArchived },
      });
    }
  };
  
  // Function to update availability
  const handleUpdateAvailability = () => {
    updateAvailabilityMutation.mutate({
      serviceId: selectedServiceId,
      date: selectedDate,
      timeSlots: editedTimeSlots,
    });
  };
  
  // Handle time slot toggle
  const handleTimeSlotToggle = (index: number) => {
    const newTimeSlots = [...editedTimeSlots];
    newTimeSlots[index] = {
      ...newTimeSlots[index],
      available: !newTimeSlots[index].available,
    };
    setEditedTimeSlots(newTimeSlots);
  };
  
  // Change the selected date
  const handleDateChange = (offset: number) => {
    const currentDate = new Date(selectedDate);
    const newDate = offset > 0 ? 
      addDays(currentDate, offset) : 
      subDays(currentDate, Math.abs(offset));
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">
            Manage bookings, availability, and services
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => navigate('/mcp')}>
            <Settings className="h-4 w-4 mr-2" />
            MCP Dashboard
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="bookings">
        <TabsList className="mb-4">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="pets">All Pets</TabsTrigger>
          <TabsTrigger value="webhooks" onClick={() => navigate('/admin/webhooks')}>Webhooks</TabsTrigger>
        </TabsList>
        
        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>Manage all dog boarding and grooming bookings</CardDescription>
              
              <div className="flex flex-wrap justify-between items-center gap-2 mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                    <Select value={statusFilter || ''} onValueChange={(value) => setStatusFilter(value || null)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All bookings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All bookings</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Sort by date:</span>
                    <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest first</SelectItem>
                        <SelectItem value="asc">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex border rounded-md overflow-hidden">
                    <Button 
                      variant={viewMode === "list" ? "default" : "outline"} 
                      className="rounded-none"
                      onClick={() => setViewMode("list")}
                    >
                      List View
                    </Button>
                    <Button 
                      variant={viewMode === "calendar" ? "default" : "outline"} 
                      className="rounded-none"
                      onClick={() => setViewMode("calendar")}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Calendar
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] })}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : !bookingsData ? (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-700">Failed to load bookings. Please try again later.</p>
                </div>
              ) : viewMode === "calendar" ? (
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Booking Calendar</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">Confirmed</Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>
                      <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="border rounded-md p-4 md:w-1/3 bg-white">
                      <Calendar
                        mode="single"
                        selected={new Date()}
                        className="w-full"
                        modifiers={{
                          booking: sortedBookings.map(b => new Date(b.booking.startDate))
                        }}
                        modifiersClassNames={{
                          booking: "bg-primary text-primary-foreground font-bold"
                        }}
                        onSelect={(date) => {
                          if (!date) return;
                          // Find bookings for this date
                          const dateStr = date.toISOString().split('T')[0];
                          const bookingsForDate = sortedBookings.filter(b => 
                            b.booking.startDate.startsWith(dateStr) ||
                            (b.booking.endDate && b.booking.startDate <= dateStr && b.booking.endDate >= dateStr)
                          );
                          
                          if (bookingsForDate.length > 0) {
                            setSelectedBooking(bookingsForDate[0]);
                          }
                        }}
                      />
                    </div>
                    
                    <div className="border rounded-md p-4 md:w-2/3 space-y-2">
                      <h3 className="text-lg font-semibold mb-4">Today's Bookings</h3>
                      {sortedBookings
                        .filter(b => {
                          const today = new Date().toISOString().split('T')[0];
                          return b.booking.startDate.startsWith(today) ||
                            (b.booking.endDate && 
                             b.booking.startDate <= today && 
                             b.booking.endDate >= today);
                        })
                        .map((booking, index) => (
                          <div 
                            key={booking.booking.bookingId}
                            className={`p-3 rounded-md cursor-pointer ${
                              getStatusBadgeColor(booking.booking.status).replace('text-', 'hover:text-').replace('bg-', 'hover:bg-')
                            }`}
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{booking.service.name}</div>
                                <div className="text-sm">{booking.pet.name} ({booking.owner.lastName})</div>
                              </div>
                              <div>
                                <div className="text-sm">{booking.booking.startTime ? 
                                  format(new Date(`2023-01-01T${booking.booking.startTime}`), 'h:mm a') : 
                                  'All day'}</div>
                                <Badge className={getStatusBadgeColor(booking.booking.status)}>
                                  {booking.booking.status.charAt(0).toUpperCase() + booking.booking.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {sortedBookings.filter(b => {
                        const today = new Date().toISOString().split('T')[0];
                        return b.booking.startDate.startsWith(today) ||
                          (b.booking.endDate && 
                           b.booking.startDate <= today && 
                           b.booking.endDate >= today);
                      }).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No bookings scheduled for today
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>List of all bookings</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Pet</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                            No bookings found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedBookings.map((item: any) => (
                          <TableRow 
                            key={item.booking.bookingId} 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedBooking(item)}
                          >
                            <TableCell className="font-medium">{item.booking.bookingId}</TableCell>
                            <TableCell>{item.service?.name || `Service: ${item.booking.serviceId}`}</TableCell>
                            <TableCell>
                              <div>
                                <span className="text-xs font-medium text-gray-700">Dropoff:</span> {formatDateWithTimezone(
                                  new Date(item.booking.startDate),
                                  item.owner?.timezone || 'America/Chicago',
                                  'MMM d, yyyy'
                                )} at {item.booking.startTime ? 
                                  format(new Date(`2023-01-01T${item.booking.startTime}`), 'h:mm a') : 
                                  'All day'}
                              </div>
                              {item.booking.endDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium text-gray-700">Pickup:</span> {(() => {
                                    try {
                                      // Format date with timezone awareness
                                      const dateStr = item.booking.endDate;
                                      // Use the pet owner's timezone or default to Central Time
                                      const tz = item.owner?.timezone || 'America/Chicago';
                                      const date = new Date(dateStr);
                                      // Format manually to ensure timezone is respected
                                      const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: tz }));
                                      return format(dateInTz, 'MMM d, yyyy');
                                    } catch (err) {
                                      // Fallback to simple formatting
                                      return format(new Date(item.booking.endDate), 'MMM d, yyyy');
                                    }
                                  })()} at {item.booking.endTime ? 
                                    format(new Date(`2023-01-01T${item.booking.endTime}`), 'h:mm a') : 
                                    'End of day'}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.owner ? (
                                <>
                                  <Button 
                                    variant="link" 
                                    className="h-auto p-0 text-left font-normal"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profiles?ownerId=${item.owner.id}`);
                                    }}
                                  >
                                    {`${item.owner.firstName} ${item.owner.lastName}`}
                                  </Button>
                                  <div className="text-xs text-gray-500">
                                    {item.owner.email}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-500">Owner ID: {item.booking.ownerId}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.pet ? (
                                <>
                                  <Button 
                                    variant="link" 
                                    className="h-auto p-0 text-left font-normal"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profiles?petId=${item.pet.id}`);
                                    }}
                                  >
                                    {item.pet.name}
                                  </Button>
                                  <div className="text-xs text-gray-500">
                                    {item.pet.breed}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-500">Pet ID: {item.booking.petId}</span>
                              )}
                            </TableCell>
                            <TableCell>${item.booking.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(item.booking.status)}>
                                {item.booking.status.charAt(0).toUpperCase() + item.booking.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select 
                                defaultValue={item.booking.status} 
                                onValueChange={(value) => {
                                  if (value !== item.booking.status) {
                                    updateBookingStatus.mutate({ bookingId: item.booking.bookingId, status: value });
                                  }
                                }}
                                disabled={updateBookingStatus.isPending}
                                // @ts-ignore - Adding click handler to prevent row click from triggering when clicking select
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Update status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Confirm</SelectItem>
                                  <SelectItem value="completed">Complete</SelectItem>
                                  <SelectItem value="cancelled">Cancel</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Booking Detail Dialog */}
          <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
            {selectedBooking && (
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Booking Details</span>
                    <Badge className={getStatusBadgeColor(selectedBooking.booking.status)}>
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
                        <span className="font-medium">Price: </span>
                        ${selectedBooking.booking.totalPrice.toFixed(2)}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Booking Created: </span>
                        {selectedBooking.booking.createdAt && formatDateWithTimezone(
                          new Date(selectedBooking.booking.createdAt),
                          selectedBooking.owner?.timezone || 'America/Chicago',
                          'MMM d, yyyy h:mm a'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {selectedBooking.owner ? (
                      <>
                        <h3 className="font-medium text-lg mb-2">Customer Information</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium">Owner: </span>
                              {selectedBooking.owner.firstName} {selectedBooking.owner.lastName}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(null);
                                navigate(`/profiles?ownerId=${selectedBooking.owner.id}`);
                              }}
                            >
                              View Profile
                            </Button>
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Email: </span>
                            {selectedBooking.owner.email}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Phone: </span>
                            {selectedBooking.owner.phone}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Address: </span>
                            {selectedBooking.owner.address}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <span className="font-medium">Owner ID: </span>
                        {selectedBooking.booking.ownerId}
                        <p className="text-sm text-gray-500 mt-1">Owner details could not be loaded</p>
                      </div>
                    )}
                    
                    {selectedBooking.pet ? (
                      <>
                        <h3 className="font-medium text-lg mt-4 mb-2">Pet Information</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium">Pet: </span>
                              {selectedBooking.pet.name}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(null);
                                navigate(`/profiles?petId=${selectedBooking.pet.id}`);
                              }}
                            >
                              View Pet Details
                            </Button>
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
                
                <DialogFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">Change Status:</div>
                    <Select 
                      value={selectedBooking.booking.status}
                      onValueChange={(value) => {
                        if (value !== selectedBooking.booking.status) {
                          updateBookingStatus.mutate({ 
                            bookingId: selectedBooking.booking.bookingId, 
                            status: value 
                          }, {
                            onSuccess: () => {
                              setSelectedBooking((prev: BookingItem | null) => prev ? {...prev, booking: {...prev.booking, status: value}} : null);
                            }
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Services Management</CardTitle>
                  <CardDescription>
                    Edit service details, prices, and descriptions
                  </CardDescription>
                </div>
                
                {!isCreatingService && (
                  <Button
                    onClick={() => setIsCreatingService(true)}
                    size="sm"
                  >
                    Add New Service
                  </Button>
                )}
              </div>
              
              <div className="flex justify-start items-center mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Filter services:</span>
                  <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Active services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active services</SelectItem>
                      <SelectItem value="archived">Archived services</SelectItem>
                      <SelectItem value="all">All services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isCreatingService ? (
                <Card className="border border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle>Create New Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="serviceId">Service ID</Label>
                          <Input 
                            id="serviceId" 
                            placeholder="e.g., grooming-deluxe"
                            value={newServiceData.serviceId}
                            onChange={(e) => setNewServiceData({...newServiceData, serviceId: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground">
                            This will be used in URLs and API calls. Use lowercase letters, numbers, and hyphens only.
                          </p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="name">Service Name</Label>
                          <Input 
                            id="name" 
                            placeholder="e.g., Deluxe Grooming"
                            value={newServiceData.name}
                            onChange={(e) => setNewServiceData({...newServiceData, name: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Describe the service..."
                            value={newServiceData.description}
                            onChange={(e) => setNewServiceData({...newServiceData, description: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price</Label>
                          <Input 
                            id="price" 
                            type="number" 
                            value={newServiceData.price}
                            onChange={(e) => setNewServiceData({
                              ...newServiceData, 
                              price: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="priceUnit">Price Unit</Label>
                          <Select 
                            value={newServiceData.priceUnit} 
                            onValueChange={(value) => 
                              setNewServiceData({...newServiceData, priceUnit: value})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select price unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_night">Per Night</SelectItem>
                              <SelectItem value="one_time">One Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newServiceData.category} 
                            onValueChange={(value) => 
                              setNewServiceData({...newServiceData, category: value})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="boarding">Boarding</SelectItem>
                              <SelectItem value="grooming">Grooming</SelectItem>
                              <SelectItem value="daycare">Daycare</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Show duration for grooming services, capacity for boarding services */}
                        {newServiceData.serviceId.startsWith('grooming') ? (
                          <div className="grid gap-2">
                            <Label htmlFor="durationInMinutes">Duration (minutes)</Label>
                            <Input 
                              id="durationInMinutes" 
                              type="number" 
                              value={newServiceData.durationInMinutes}
                              onChange={(e) => setNewServiceData({
                                ...newServiceData, 
                                durationInMinutes: parseInt(e.target.value) || 60
                              })}
                            />
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <Label htmlFor="capacity">Capacity (kennels/suites available)</Label>
                            <Input 
                              id="capacity" 
                              type="number" 
                              value={newServiceData.capacity}
                              onChange={(e) => setNewServiceData({
                                ...newServiceData, 
                                capacity: parseInt(e.target.value) || 1
                              })}
                            />
                            <p className="text-xs text-muted-foreground">
                              The total number of pets that can occupy this boarding service at once
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreatingService(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => createServiceMutation.mutate(newServiceData)}
                          disabled={createServiceMutation.isPending || !newServiceData.name || !newServiceData.serviceId}
                        >
                          Create Service
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isLoadingServices ? (
                <div className="text-center py-6">Loading services...</div>
              ) : !servicesData?.services ? (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-destructive">
                    Error loading services. Please try again later.
                  </p>
                </div>
              ) : servicesData.services.length > 0 ? (
                <div className="grid gap-6">
                  {servicesData.services
                    .filter((service: any) => {
                      if (serviceFilter === 'active') return !service.isArchived;
                      if (serviceFilter === 'archived') return service.isArchived;
                      return true; // 'all' shows everything
                    })
                    .map((service: any) => (
                    <Card 
                      key={service.serviceId} 
                      className={`${editingService?.id === service.id ? "border-primary" : ""} ${service.isArchived ? "bg-gray-50" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle>{service.name}</CardTitle>
                              {service.isArchived && (
                                <Badge variant="outline" className="text-gray-500">Archived</Badge>
                              )}
                            </div>
                            <CardDescription>
                              {service.category.charAt(0).toUpperCase() + service.category.slice(1)} Service
                            </CardDescription>
                          </div>
                          {editingService?.id !== service.id && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleArchiveService(service)}
                                className={service.isArchived ? "text-green-600" : "text-red-600"}
                              >
                                {service.isArchived ? (
                                  <>
                                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {editingService?.id === service.id ? (
                          <div className="space-y-4">
                            <div className="grid gap-3">
                              <div className="grid gap-2">
                                <Label htmlFor="name">Service Name</Label>
                                <Input 
                                  id="name" 
                                  value={serviceFormData.name} 
                                  onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})}
                                />
                              </div>
                              
                              <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea 
                                  id="description" 
                                  value={serviceFormData.description} 
                                  onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                                />
                              </div>
                              
                              <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <Input 
                                  id="price" 
                                  type="number" 
                                  value={serviceFormData.price} 
                                  onChange={(e) => setServiceFormData({...serviceFormData, price: parseFloat(e.target.value)})}
                                />
                              </div>
                              
                              {/* Conditional display based on service category */}
                              {service.category === 'boarding' && (
                                <div className="grid gap-2">
                                  <Label htmlFor="capacity">Capacity (kennels/suites available)</Label>
                                  <Input 
                                    id="capacity" 
                                    type="number" 
                                    value={serviceFormData.capacity} 
                                    onChange={(e) => setServiceFormData({...serviceFormData, capacity: parseInt(e.target.value) || 1})}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    The maximum number of pets that can be boarded with this service at the same time
                                  </p>
                                </div>
                              )}
                              
                              {service.category === 'grooming' && (
                                <div className="grid gap-2">
                                  <Label htmlFor="durationInMinutes">Duration (minutes)</Label>
                                  <Input 
                                    id="durationInMinutes" 
                                    type="number" 
                                    value={serviceFormData.durationInMinutes} 
                                    onChange={(e) => setServiceFormData({...serviceFormData, durationInMinutes: parseInt(e.target.value) || 60})}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    The average time needed to complete this grooming service
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setEditingService(null)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleSaveService}>
                                <Check className="h-4 w-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm">{service.description}</p>
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">
                                ${service.price.toFixed(2)} 
                                <span className="text-muted-foreground font-normal text-sm">
                                  {service.priceUnit === "per_night" ? " per night" : " one-time"}
                                </span>
                              </p>
                              <Badge variant="outline">{service.serviceId}</Badge>
                            </div>
                            
                            <div className="flex gap-4 pt-2 text-sm text-muted-foreground">
                              {service.category === 'boarding' && (
                                <div>
                                  <span className="font-medium">Capacity:</span> {service.capacity || "Not set"}
                                </div>
                              )}
                              
                              {service.category === 'grooming' && (
                                <div>
                                  <span className="font-medium">Duration:</span> {service.durationInMinutes || "Not set"} minutes
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No services found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Availability Management</CardTitle>
              <CardDescription>
                Manage service availability and time slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="service">Select Service</Label>
                      <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select a service</SelectItem>
                          {!isLoadingServices && servicesData?.services?.map((service: any) => (
                            <SelectItem key={service.serviceId} value={service.serviceId}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Select Date</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDateChange(-1)}>
                          Previous Day
                        </Button>
                        <div className="px-3 py-1 border rounded">
                          {selectedDate ? (() => {
                            // Display date in administrator's timezone (default to Central Time)
                            const date = new Date(selectedDate);
                            // We use America/Chicago as the default timezone for the admin
                            const tz = 'America/Chicago';
                            try {
                              // Format manually to ensure timezone is respected
                              const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: tz }));
                              return format(dateInTz, "MMMM d, yyyy");
                            } catch (err) {
                              // Fallback to simple formatting
                              return format(date, "MMMM d, yyyy");
                            }
                          })() : "Select a date"}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDateChange(1)}>
                          Next Day
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={!selectedServiceId || selectedServiceId === "none" || !selectedDate}
                      onClick={() => refetchAvailability()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Availability
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {selectedServiceId && selectedServiceId.startsWith('grooming') 
                        ? "Time Slots" 
                        : "Capacity Management"}
                    </h3>
                    
                    {isLoadingAvailability ? (
                      <div className="text-center py-6">Loading availability...</div>
                    ) : !availabilityData ? (
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-muted-foreground">
                          Select a service and date to view availability
                        </p>
                      </div>
                    ) : selectedServiceId && !selectedServiceId.startsWith('grooming') ? (
                      // Boarding service - show capacity management
                      <div className="space-y-3">
                        <div className="bg-background border p-4 rounded-md space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Total Capacity</h4>
                              <p className="text-2xl font-bold">{availabilityData.totalCapacity || 0}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Booked</h4>
                              <p className="text-2xl font-bold">{availabilityData.bookedCount || 0}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Available</h4>
                              <p className="text-2xl font-bold">{availabilityData.remainingCapacity || 0}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="totalCapacity">Total Capacity</Label>
                            <Input 
                              id="totalCapacity" 
                              type="number" 
                              value={availabilityData.totalCapacity || 1}
                              onChange={(e) => {
                                const newCapacity = parseInt(e.target.value) || 1;
                                updateAvailabilityMutation.mutate({
                                  serviceId: selectedServiceId,
                                  date: selectedDate,
                                  totalCapacity: newCapacity
                                });
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              The total number of pets that can stay in this service on this date
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => refetchAvailability()}
                          variant="outline"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Capacity
                        </Button>
                      </div>
                    ) : (
                      // Grooming service - show time slots
                      <div className="space-y-3">
                        {editedTimeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between border p-3 rounded-md">
                            <div>
                              <span className="font-medium">{slot.time.substring(0, 5)}</span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {slot.available ? "Available" : "Unavailable"}
                              </span>
                            </div>
                            <Switch 
                              checked={slot.available} 
                              onCheckedChange={() => handleTimeSlotToggle(index)}
                            />
                          </div>
                        ))}
                        
                        <Button onClick={handleUpdateAvailability}>
                          Update Time Slots
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Customer & Pet Profiles</CardTitle>
                  <CardDescription>
                    Manage customer information and pet profiles
                  </CardDescription>
                </div>
                
                <Button
                  onClick={() => navigate("/admin/profiles")}
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View All Profiles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-4">
                <p className="text-gray-700">
                  The profiles section allows you to view and manage all customer and pet information.
                </p>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Profiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 list-disc pl-5">
                        <li>View and update customer contact information</li>
                        <li>Manage emergency contacts</li>
                        <li>Update communication preferences</li>
                        <li>Add notes to customer profiles</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/admin/profiles")}>
                        Manage Customers
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg">Pet Profiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 list-disc pl-5">
                        <li>Update pet details and care instructions</li>
                        <li>Manage medical information</li>
                        <li>Record vaccination status</li>
                        <li>Add behavioral notes and feeding instructions</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/admin/profiles")}>
                        Manage Pets
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* All Pets Tab */}
        <TabsContent value="pets">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pet Management</CardTitle>
                  <CardDescription>
                    View and manage all pets in the system
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/pets'] })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPets ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !petsData?.pets ? (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-700">Failed to load pets. Please try again later.</p>
                </div>
              ) : petsData.pets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No pets found in the system.</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <Input 
                            placeholder="Search pets by name or breed..."
                            className="pl-10"
                            value={petSearchQuery}
                            onChange={(e) => setPetSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-col space-y-1.5">
                          <Label htmlFor="vaccination-filter">Vaccination Status</Label>
                          <Select value={vaccinationFilter} onValueChange={setVaccinationFilter}>
                            <SelectTrigger id="vaccination-filter" className="w-[180px]">
                              <SelectValue placeholder="All pets" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All pets</SelectItem>
                              <SelectItem value="vaccinated">Vaccinated only</SelectItem>
                              <SelectItem value="unvaccinated">Unvaccinated only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {petSearchQuery || vaccinationFilter !== "all" ? 
                        `Showing ${petsData.pets.filter(pet => {
                          // Apply search query filter
                          if (petSearchQuery) {
                            const query = petSearchQuery.toLowerCase();
                            if (!(pet.name.toLowerCase().includes(query) || pet.breed.toLowerCase().includes(query))) {
                              return false;
                            }
                          }
                          
                          // Apply vaccination filter
                          if (vaccinationFilter === "vaccinated" && !pet.isVaccinated) {
                            return false;
                          }
                          if (vaccinationFilter === "unvaccinated" && pet.isVaccinated) {
                            return false;
                          }
                          
                          return true;
                        }).length} of ${petsData.pets.length} pets` : 
                        `Total: ${petsData.pets.length} pets`
                      }
                    </div>
                  </div>
                  
                  {petsData.pets
                      .filter(pet => {
                        // Apply search query filter
                        if (petSearchQuery) {
                          const query = petSearchQuery.toLowerCase();
                          if (!(pet.name.toLowerCase().includes(query) || pet.breed.toLowerCase().includes(query))) {
                            return false;
                          }
                        }
                        
                        // Apply vaccination filter
                        if (vaccinationFilter === "vaccinated" && !pet.isVaccinated) {
                          return false;
                        }
                        if (vaccinationFilter === "unvaccinated" && pet.isVaccinated) {
                          return false;
                        }
                        
                        return true;
                      }).length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-lg">
                      <SearchX className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No pets found</h3>
                      <p className="text-muted-foreground">No pets match your search criteria.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {petsData.pets
                        .filter(pet => {
                          // Apply search query filter
                          if (petSearchQuery) {
                            const query = petSearchQuery.toLowerCase();
                            if (!(pet.name.toLowerCase().includes(query) || pet.breed.toLowerCase().includes(query))) {
                              return false;
                            }
                          }
                          
                          // Apply vaccination filter
                          if (vaccinationFilter === "vaccinated" && !pet.isVaccinated) {
                            return false;
                          }
                          if (vaccinationFilter === "unvaccinated" && pet.isVaccinated) {
                            return false;
                          }
                          
                          return true;
                        })
                        .map((pet) => (
                          <Card key={pet.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50 pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className={`w-3 h-3 rounded-full mr-3 ${pet.isVaccinated ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                  <CardTitle>{pet.name}</CardTitle>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/profiles?petId=${pet.id}`)}>
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
                                  <div>
                                    <span className="text-muted-foreground">Owner ID:</span>
                                    <p className="font-medium">
                                      <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/admin/profiles?ownerId=${pet.ownerId}`)}>
                                        #{pet.ownerId}
                                      </Button>
                                    </p>
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
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
