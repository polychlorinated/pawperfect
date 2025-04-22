import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { BookingFormData } from "@shared/schema";
import { Label } from "@/components/ui/label";

// Extended type for booking data with multiple pets support
interface ExtendedBookingFormData extends BookingFormData {
  selectedPetIds?: number[];
  multiplePets?: { id: number; name: string; breed: string; }[];
}

interface BookingSummaryProps {
  bookingData: ExtendedBookingFormData;
  onConfirm: () => void;
  onEdit: (step: number) => void;
}

export default function BookingSummary({
  bookingData,
  onConfirm,
  onEdit,
}: BookingSummaryProps) {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const isBoarding = bookingData.service.serviceId.startsWith("boarding");

  // Calculate total price
  const calculateTotalPrice = () => {
    // Get number of pets
    const numberOfPets = bookingData.multiplePets?.length || 1;
    
    if (isBoarding && bookingData.dates.endDate) {
      // Calculate number of nights for boarding
      const startDate = new Date(bookingData.dates.startDate);
      const endDate = new Date(bookingData.dates.endDate);
      const nights = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return bookingData.service.price * nights * numberOfPets;
    } else {
      // For grooming, just use the service price multiplied by number of pets
      return bookingData.service.price * numberOfPets;
    }
  };

  const totalPrice = calculateTotalPrice();

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Booking Summary</h2>
      <p className="mt-1 text-sm text-gray-500">
        Please review your booking details before confirming.
      </p>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Service:</span>
            <span className="text-sm text-gray-900">{bookingData.service.name}</span>
          </div>
          
          {isBoarding ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Drop-off:</span>
                <span className="text-sm text-gray-900">
                  {format(bookingData.dates.startDate, "MMM d, yyyy")} at {formatTime(bookingData.dates.startTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Pick-up:</span>
                <span className="text-sm text-gray-900">
                  {bookingData.dates.endDate && 
                    `${format(bookingData.dates.endDate, "MMM d, yyyy")} at ${formatTime(bookingData.dates.endTime || '')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Duration:</span>
                <span className="text-sm text-gray-900">
                  {bookingData.dates.endDate && 
                    `${Math.ceil((bookingData.dates.endDate.getTime() - bookingData.dates.startDate.getTime()) / (1000 * 60 * 60 * 24))} nights`}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Appointment:</span>
                <span className="text-sm text-gray-900">
                  {format(bookingData.dates.startDate, "MMM d, yyyy")} at {formatTime(bookingData.dates.startTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Estimated Duration:</span>
                <span className="text-sm text-gray-900">1.5 hours</span>
              </div>
            </div>
          )}
          
          <div className="pt-3 border-t border-gray-200">
            {bookingData.multiplePets && bookingData.multiplePets.length > 0 ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Pets ({bookingData.multiplePets.length}):</span>
                  <span className="text-sm text-gray-900 text-right">
                    {bookingData.multiplePets.map((pet, index) => (
                      <div key={pet.id}>
                        {pet.name} ({pet.breed}){index < bookingData.multiplePets!.length - 1 ? ',' : ''}
                      </div>
                    ))}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Pet:</span>
                <span className="text-sm text-gray-900">
                  {bookingData.pet.name} ({bookingData.pet.breed})
                </span>
              </div>
            )}
            <div className="flex justify-between mt-1">
              <span className="text-sm font-medium text-gray-500">Owner:</span>
              <span className="text-sm text-gray-900">
                {bookingData.owner.firstName} {bookingData.owner.lastName}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm font-medium text-gray-500">Contact:</span>
              <span className="text-sm text-gray-900">
                {bookingData.owner.email} | {bookingData.owner.phone}
              </span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Base Rate:</span>
              <span className="text-sm text-gray-900">
                ${bookingData.service.price.toFixed(2)} per {isBoarding ? 'night' : 'service'}
              </span>
            </div>
            
            {/* Display multiple pets pricing calculation if applicable */}
            {bookingData.multiplePets && bookingData.multiplePets.length > 0 && (
              <div className="flex justify-between mt-2">
                <span className="text-sm font-medium text-gray-500">Number of Pets:</span>
                <span className="text-sm text-gray-900">
                  {bookingData.multiplePets.length}
                </span>
              </div>
            )}
            
            {isBoarding && bookingData.dates.endDate && (
              <div className="flex justify-between mt-2">
                <span className="text-sm font-medium text-gray-500">Number of Nights:</span>
                <span className="text-sm text-gray-900">
                  {Math.ceil((bookingData.dates.endDate.getTime() - bookingData.dates.startDate.getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            )}
            
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="text-base font-medium text-gray-900">Total:</span>
              <span className="text-base font-bold text-gray-900">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={termsAgreed}
            onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
          />
          <div>
            <Label htmlFor="terms" className="font-medium text-gray-700">
              I agree to the terms and conditions
            </Label>
            <p className="text-gray-500 text-sm">
              By checking this box, you agree to our <a href="#" className="text-primary hover:text-blue-600">Terms of Service</a> and <a href="#" className="text-primary hover:text-blue-600">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => onEdit(3)}>
          Edit Details
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={!termsAgreed}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
