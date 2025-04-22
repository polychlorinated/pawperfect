import { Button } from "@/components/ui/button";
import { CheckCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { BookingFormData } from "@shared/schema";
import { Link } from "wouter";

// Extended type for booking data with multiple pets support
interface ExtendedBookingFormData extends BookingFormData {
  selectedPetIds?: number[];
  multiplePets?: { id: number; name: string; breed: string; }[];
}

interface ConfirmationProps {
  confirmationData: {
    booking_id: string;
    service_id: string;
    status: string;
    total_price: number;
    start_date: string;
    start_time: string;
    end_date?: string;
    end_time?: string;
  };
  bookingData: ExtendedBookingFormData;
}

export default function Confirmation({
  confirmationData,
  bookingData,
}: ConfirmationProps) {
  const isBoarding = confirmationData.service_id.startsWith("boarding");
  
  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
      <h2 className="mt-3 text-lg font-medium text-gray-900">Booking Confirmed!</h2>
      <p className="mt-1 text-sm text-gray-500">
        Your booking has been successfully confirmed. A confirmation email has been sent to your email address.
      </p>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Confirmation #:</span>
            <span className="text-sm text-gray-900">{confirmationData.booking_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Service:</span>
            <span className="text-sm text-gray-900">{bookingData.service.name}</span>
          </div>
          
          {isBoarding ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Check-in:</span>
                <span className="text-sm text-gray-900">
                  {confirmationData.start_date && format(new Date(confirmationData.start_date), "MMM d, yyyy")} at {formatTime(confirmationData.start_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Check-out:</span>
                <span className="text-sm text-gray-900">
                  {confirmationData.end_date && format(new Date(confirmationData.end_date), "MMM d, yyyy")} at {formatTime(confirmationData.end_time || '')}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Appointment:</span>
                <span className="text-sm text-gray-900">
                  {confirmationData.start_date && format(new Date(confirmationData.start_date), "MMM d, yyyy")} at {formatTime(confirmationData.start_time)}
                </span>
              </div>
            </div>
          )}
          
          {/* Display pet information */}
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
          </div>
          
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-500">Total:</span>
            <span className="text-sm font-bold text-gray-900">
              ${confirmationData.total_price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900">What's Next?</h3>
        <ul className="mt-3 list-disc text-sm text-gray-500 pl-5 text-left">
          <li>Bring {bookingData.multiplePets && bookingData.multiplePets.length > 1 ? 'all your pets\'' : 'your pet\'s'} vaccination records</li>
          <li>Pack {bookingData.multiplePets && bookingData.multiplePets.length > 1 ? 'your pets\' food and favorite toys' : 'your pet\'s food and favorite toys'}</li>
          <li>Arrive 15 minutes before your scheduled time</li>
          <li>
            If you need to cancel or modify your booking, please contact us at
            least 24 hours in advance
          </li>
        </ul>
      </div>

      <div className="mt-6 flex">
        <Button variant="outline" className="flex-1 mr-2" onClick={handlePrint}>
          <Printer className="h-5 w-5 mr-2" />
          Print
        </Button>
        <Link href="/">
          <Button className="flex-1 ml-2">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
