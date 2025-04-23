import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ServiceSelection from "@/components/booking/service-selection";
import DateTimeSelection from "@/components/booking/date-time-selection";
import BasicPetOwnerForm from "@/components/booking/basic-pet-owner-form";
import BookingSummary from "@/components/booking/booking-summary";
import Confirmation from "@/components/booking/confirmation";
import { BookingFormData } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { mcpAPI } from "@/lib/mcpAPI";
import { formatDateWithTimezone } from "@/lib/timezones";

// Extended type for our booking data state that includes multiple pets support
interface ExtendedBookingFormData extends BookingFormData {
  selectedPetIds?: number[];
  multiplePets?: { id: number; name: string; breed: string; }[];
}

const STEPS = [
  { id: 1, name: "Service Selection" },
  { id: 2, name: "Date & Time" },
  { id: 3, name: "Pet Information" },
  { id: 4, name: "Confirmation" }
];

export default function Booking() {
  const [, navigate] = useLocation();
  const params = useParams();
  const [, paramMatch] = useRoute("/booking/:step");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Safely handle the step parameter
  const stepParam = paramMatch && params.step ? params.step : "1";
  const currentStep = parseInt(stepParam, 10);

  const [bookingData, setBookingData] = useState<Partial<ExtendedBookingFormData>>({});
  const [confirmationData, setConfirmationData] = useState<any | null>(null);
  const [userDataFetched, setUserDataFetched] = useState(false);

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useQuery<{services: any[]}>({
    queryKey: ['/api/services'],
    staleTime: 3600000, // 1 hour
  });
  
  // Fetch owner and pet info for logged-in user
  const { data: ownerData, isLoading: ownerLoading } = useQuery({
    queryKey: ['owner', user?.ownerId],
    queryFn: async () => {
      if (!user?.ownerId) return null;
      return await mcpAPI.getOwner(user.ownerId);
    },
    enabled: !!user?.ownerId,
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch pets owned by the user
  const { data: petsData, isLoading: petsLoading } = useQuery({
    queryKey: ['pets', user?.ownerId],
    queryFn: async () => {
      if (!user?.ownerId) return [];
      return await mcpAPI.getPetsByOwnerId(user.ownerId);
    },
    enabled: !!user?.ownerId,
    staleTime: 300000, // 5 minutes
  });

  // Parse query parameters
  useEffect(() => {
    // If the URL contains a service ID in query parameters, pre-select it
    const queryParams = new URLSearchParams(window.location.search);
    const serviceId = queryParams.get('service');
    
    if (serviceId && servicesData?.services) {
      const selectedService = servicesData.services.find(s => s.serviceId === serviceId);
      if (selectedService) {
        setBookingData(prev => ({
          ...prev,
          service: {
            serviceId: selectedService.serviceId,
            name: selectedService.name,
            price: selectedService.price
          }
        }));
        
        // Auto-navigate to the date/time selection step if coming from a rebook action
        if (currentStep === 1) {
          navigate("/booking/2");
        }
      }
    }
  }, [servicesData, currentStep, navigate]);
  
  // Pre-populate owner and pet information when user is logged in
  useEffect(() => {
    if (
      !userDataFetched && 
      user?.ownerId && 
      ownerData && 
      petsData && 
      !ownerLoading && 
      !petsLoading && 
      !bookingData.owner
    ) {
      // We have owner data from the logged-in user, prefill it
      const petData = petsData.length > 0 ? petsData[0] : null;
      
      setBookingData(prev => ({
        ...prev,
        owner: {
          firstName: ownerData.firstName,
          lastName: ownerData.lastName,
          email: ownerData.email,
          phone: ownerData.phone,
          address: ownerData.address,
          // Include any emergency contact info if it exists
          emergencyContactName: ownerData.emergencyContactName || '',
          emergencyContactPhone: ownerData.emergencyContactPhone || '',
          emergencyContactRelationship: ownerData.emergencyContactRelationship || '',
        },
        pet: petData ? {
          name: petData.name,
          breed: petData.breed,
          age: petData.age,
          weight: petData.weight,
          gender: petData.gender as "male" | "female",
          specialNeeds: petData.specialNeeds || '',
          isVaccinated: petData.isVaccinated,
          // Don't include ownerId in the form data
          // Additional pet info if available
          vetName: petData.vetName || '',
          vetPhone: petData.vetPhone || '',
          vetAddress: petData.vetAddress || '',
          vetLastVisit: petData.vetLastVisit ? new Date(petData.vetLastVisit) : null,
          medicalHistory: petData.medicalHistory || '',
          medicationInstructions: petData.medicationInstructions || '',
          dietaryRestrictions: petData.dietaryRestrictions || '',
          behavioralNotes: petData.behavioralNotes || '',
        } : undefined
      }));
      
      setUserDataFetched(true);
    }
  }, [user, ownerData, petsData, ownerLoading, petsLoading, bookingData.owner, userDataFetched]);

  // Validate that the step is complete before allowing to navigate forward
  const canNavigateToStep = (step: number) => {
    if (step <= currentStep) return true;
    
    if (step === 2 && bookingData.service) return true;
    if (step === 3 && bookingData.service && bookingData.dates) return true;
    if (step === 4 && bookingData.service && bookingData.dates && bookingData.pet && bookingData.owner) return true;
    
    return false;
  };

  const handleServiceSelect = (service: BookingFormData['service']) => {
    setBookingData(prev => ({ ...prev, service }));
    navigate("/booking/2");
  };

  const handleDateTimeSelect = (dates: BookingFormData['dates']) => {
    setBookingData(prev => ({ ...prev, dates }));
    navigate("/booking/3");
  };

  const handlePetOwnerSubmit = (data: { 
    pet: BookingFormData['pet'], 
    owner: BookingFormData['owner'],
    petId?: number,
    petIds?: number[]
  }) => {
    console.log("Pet Owner Form Submission:", data);
    
    // Check if multiple pets were selected and fetch their basic info
    let multiplePetsData: { id: number; name: string; breed: string; }[] | undefined = undefined;
    
    if (data.petIds && data.petIds.length > 0 && petsData) {
      multiplePetsData = data.petIds
        .map(id => {
          const pet = petsData.find(p => p.id === id);
          if (pet) {
            return {
              id: pet.id,
              name: pet.name,
              breed: pet.breed
            };
          }
          return null;
        })
        .filter((pet): pet is { id: number; name: string; breed: string; } => pet !== null);
    }
    
    // Store the selected pet IDs and pet details if provided (for using existing pets)
    setBookingData(prev => ({ 
      ...prev, 
      pet: data.pet, 
      owner: data.owner,
      selectedPetId: data.petId,
      selectedPetIds: data.petIds,
      multiplePets: multiplePetsData
    }));
    
    console.log("Updated booking data with pet/owner info");
    navigate("/booking/4");
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.service || !bookingData.dates || !bookingData.pet || !bookingData.owner) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing booking information. Please complete all steps."
      });
      return;
    }

    try {
      // Pre-calculate the total price so we can log and debug any issues
      const totalPrice = calculateTotalPrice(bookingData);
      console.log(`Booking total price calculated: ${totalPrice}`);
      
      // Ensure dates are properly formatted for API submission
      const startDate = bookingData.dates.formattedStartDate || 
                      (bookingData.dates.startDate instanceof Date ? 
                        bookingData.dates.startDate.toISOString().split('T')[0] :
                        bookingData.dates.startDate);
                        
      const endDate = bookingData.dates.formattedEndDate || 
                    (bookingData.dates.endDate && bookingData.dates.endDate instanceof Date ? 
                      bookingData.dates.endDate.toISOString().split('T')[0] : 
                      bookingData.dates.endDate);
                      
      console.log(`Submitting booking with dates: start=${startDate}, end=${endDate}`);
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: bookingData.service.serviceId,
          startDate,
          startTime: bookingData.dates.startTime,
          endDate,
          endTime: bookingData.dates.endTime,
          pet: bookingData.pet,
          owner: bookingData.owner,
          selectedPetId: bookingData.selectedPetId,
          selectedPetIds: bookingData.selectedPetIds,
          multiplePets: bookingData.multiplePets,
          totalPrice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create booking');
      }

      const data = await response.json();
      setConfirmationData(data);
      navigate("/booking/5");

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking"
      });
    }
  };

  // Calculate total price for the booking
  const calculateTotalPrice = (data: Partial<ExtendedBookingFormData>) => {
    if (!data.service) return 0;
    
    // Get number of pets
    const numberOfPets = data.multiplePets?.length || 1;
    
    // For boarding, calculate number of nights
    if (data.service.serviceId.startsWith('boarding') && data.dates?.endDate && data.dates?.startDate) {
      // Use the formatted dates if available, otherwise use the date objects
      let startDate, endDate;
      
      try {
        if (data.dates.formattedStartDate) {
          startDate = new Date(data.dates.formattedStartDate);
        } else if (data.dates.startDate instanceof Date) {
          startDate = data.dates.startDate;
        } else {
          startDate = new Date(data.dates.startDate);
        }
        
        if (data.dates.formattedEndDate) {
          endDate = new Date(data.dates.formattedEndDate);
        } else if (data.dates.endDate instanceof Date) {
          endDate = data.dates.endDate;
        } else {
          endDate = new Date(data.dates.endDate);
        }
        
        // Ensure both dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('Invalid date format for price calculation', {
            startDate: data.dates.startDate,
            endDate: data.dates.endDate,
            formattedStartDate: data.dates.formattedStartDate,
            formattedEndDate: data.dates.formattedEndDate
          });
          return data.service.price; // Fallback to base price
        }
        
        // Calculate nights, ensuring it's at least 1
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const totalPrice = data.service.price * nights * numberOfPets;
        console.log(`Price calculation: ${data.service.price} × ${nights} nights × ${numberOfPets} pets = ${totalPrice}`);
        
        return totalPrice;
      } catch (err) {
        console.error('Error calculating price:', err);
        return data.service.price * numberOfPets; // Fallback to base price
      }
    } else {
      // For grooming, just use the service price multiplied by number of pets
      const totalPrice = data.service.price * numberOfPets;
      console.log(`Price calculation: ${data.service.price} × ${numberOfPets} pets = ${totalPrice}`);
      return totalPrice;
    }
  };

  // Calculate progress value for progress bar
  const progressValue = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {/* Progress Bar */}
            {currentStep <= 4 && (
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border" style={{borderColor:"#e5e7eb"}}>
                <Progress value={progressValue} className="h-2" />
                <div className="mt-4 flex justify-between">
                  {STEPS.map((step) => (
                    <div key={step.id} className="text-center">
                      <div 
                        className={`
                          w-8 h-8 mx-auto flex items-center justify-center rounded-full 
                          ${step.id < currentStep
                            ? 'bg-primary text-white'
                            : step.id === currentStep
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-600'
                          }
                        `}
                        role="button"
                        onClick={() => canNavigateToStep(step.id) && navigate(`/booking/${step.id}`)}
                        aria-disabled={!canNavigateToStep(step.id)}
                        style={{ cursor: canNavigateToStep(step.id) ? 'pointer' : 'not-allowed' }}
                      >
                        <span className="text-sm font-medium">{step.id}</span>
                      </div>
                      <span className={`mt-2 block text-xs ${step.id === currentStep ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="p-6">
              {currentStep === 1 && (
                <ServiceSelection 
                  onServiceSelect={handleServiceSelect} 
                  selectedServiceId={bookingData.service?.serviceId}
                  services={servicesData?.services || []}
                  isLoading={servicesLoading}
                  error={servicesError ? true : false}
                />
              )}
              
              {currentStep === 2 && bookingData.service && (
                <DateTimeSelection 
                  serviceType={bookingData.service.serviceId.startsWith('boarding') ? 'boarding' : 'grooming'} 
                  serviceId={bookingData.service.serviceId}
                  onDateTimeSelect={handleDateTimeSelect}
                  initialDates={bookingData.dates}
                />
              )}
              
              {currentStep === 3 && (
                <>
                  {user?.ownerId && (ownerLoading || petsLoading) ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      <p className="ml-3 text-gray-500">Loading your information...</p>
                    </div>
                  ) : (
                    <BasicPetOwnerForm 
                      onSubmit={handlePetOwnerSubmit} 
                      initialPet={bookingData.pet}
                      initialOwner={bookingData.owner}
                      isUserLoggedIn={!!user?.ownerId}
                    />
                  )}
                </>
              )}
              
              {currentStep === 4 && bookingData.service && bookingData.dates && bookingData.pet && bookingData.owner && (
                <BookingSummary 
                  bookingData={bookingData as ExtendedBookingFormData} 
                  onConfirm={handleConfirmBooking} 
                  onEdit={(step) => navigate(`/booking/${step}`)}
                />
              )}
              
              {currentStep === 5 && confirmationData && (
                <Confirmation 
                  confirmationData={confirmationData}
                  bookingData={bookingData as ExtendedBookingFormData}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
