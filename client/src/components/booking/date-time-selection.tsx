import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookingFormData } from "@shared/schema";
import { formatDateWithTimezone } from "@/lib/timezones";
import { useAuth } from "@/hooks/use-auth";

interface DateTimeSelectionProps {
  serviceType: 'boarding' | 'grooming';
  serviceId: string;
  onDateTimeSelect: (dates: BookingFormData['dates']) => void;
  initialDates?: BookingFormData['dates'];
}

export default function DateTimeSelection({
  serviceType,
  serviceId,
  onDateTimeSelect,
  initialDates
}: DateTimeSelectionProps) {
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  // Set default values based on service type
  const [startDate, setStartDate] = useState<Date>(initialDates?.startDate || today);
  const [endDate, setEndDate] = useState<Date | undefined>(initialDates?.endDate || (serviceType === 'boarding' ? new Date(today.getTime() + 86400000) : undefined));
  const [startTime, setStartTime] = useState<string>(initialDates?.startTime || '08:00:00');
  const [endTime, setEndTime] = useState<string | undefined>(initialDates?.endTime || (serviceType === 'boarding' ? '10:00:00' : undefined));
  
  // For boarding, ensure end date is after start date
  useEffect(() => {
    if (serviceType === 'boarding' && endDate && startDate >= endDate) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      setEndDate(newEndDate);
    }
  }, [startDate, endDate, serviceType]);

  // Calculate date range for availability query (today to 30 days from now)
  const endDateForQuery = new Date(today);
  endDateForQuery.setDate(endDateForQuery.getDate() + 30);

  // Fetch availability for the service
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: [
      `/api/availability/${serviceId}`, 
      { start_date: format(today, 'yyyy-MM-dd'), end_date: format(endDateForQuery, 'yyyy-MM-dd') }
    ],
    staleTime: 60000, // 1 minute
  });

  const availability = availabilityData?.availability || [];

  // Time slots based on service type
  const getTimeSlots = () => {
    if (serviceType === 'boarding') {
      return ['08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00'];
    } else {
      return ['09:00:00', '10:30:00', '12:00:00', '13:30:00', '15:00:00', '16:30:00'];
    }
  };
  
  const timeSlots = getTimeSlots();

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  // Check if a time slot is available for a given date
  const isTimeSlotAvailable = (date: Date, time: string) => {
    if (isLoading || !availability) return true;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability.find(a => a.date === dateString);
    
    if (!dateAvailability) return true;
    
    const timeSlot = dateAvailability.timeSlots.find(t => t.time === time);
    return timeSlot ? timeSlot.available : true;
  };
  
  // Get user data including timezone
  const { user } = useAuth();
  
  // Fetch owner data to get timezone
  const { data: ownerData } = useQuery({
    queryKey: ['owner', user?.ownerId],
    queryFn: async () => {
      if (!user?.ownerId) return null;
      return await fetch(`/api/owners/${user.ownerId}`).then(res => res.json());
    },
    enabled: !!user?.ownerId,
  });
  
  const handleNext = () => {
    // Get the user's timezone or use a default
    const timezone = ownerData?.timezone || 'America/Chicago';
    
    // Format dates with timezone awareness - make sure they're in YYYY-MM-DD format
    const formatDateForSubmission = (date: Date) => {
      return formatDateWithTimezone(date, timezone);
    };
    
    console.log(`Using timezone ${timezone} for date formatting`);
    
    const formattedStartDate = formatDateForSubmission(startDate);
    const formattedEndDate = endDate ? formatDateForSubmission(endDate) : undefined;
    
    console.log(`Start date: ${startDate.toISOString()} → ${formattedStartDate}`);
    if (endDate) {
      console.log(`End date: ${endDate.toISOString()} → ${formattedEndDate}`);
    }
    
    onDateTimeSelect({
      // Keep the original Date objects for UI display
      startDate,
      startTime,
      endDate,
      endTime,
      // Include properly formatted date strings for API submission
      formattedStartDate,
      formattedEndDate
    });
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Select Date & Time</h2>
      <p className="mt-1 text-sm text-gray-500">
        {serviceType === 'boarding' 
          ? 'Choose your check-in and check-out dates and times.' 
          : 'Choose your grooming appointment date and time.'}
      </p>
      
      <div className="mt-6">
        {serviceType === 'boarding' ? (
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
              <Card className="mt-1">
                <CardContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date < today || date > oneYearFromNow}
                    className="border-0"
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
              <Card className="mt-1">
                <CardContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date <= startDate || date > oneYearFromNow}
                    className="border-0"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
            <Card className="mt-1">
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < today || date > oneYearFromNow}
                  className="border-0"
                />
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            {serviceType === 'boarding' ? 'Drop-off Time' : 'Appointment Time'}
          </label>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {timeSlots.map((time) => {
              const isAvailable = isTimeSlotAvailable(startDate, time);
              return (
                <button
                  key={time}
                  type="button"
                  className={`border rounded-md py-2 px-3 text-sm text-center ${
                    !isAvailable
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : startTime === time
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 text-gray-700 hover:border-primary'
                  }`}
                  onClick={() => isAvailable && setStartTime(time)}
                  disabled={!isAvailable}
                >
                  {formatTime(time)}
                </button>
              );
            })}
          </div>
          
          {serviceType === 'boarding' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Pick-up Time</label>
              <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`border rounded-md py-2 px-3 text-sm text-center ${
                      endTime === time
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 text-gray-700 hover:border-primary'
                    }`}
                    onClick={() => setEndTime(time)}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!startDate || !startTime || (serviceType === 'boarding' && (!endDate || !endTime))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
