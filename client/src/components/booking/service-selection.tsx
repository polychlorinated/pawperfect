import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Home, Smile } from "lucide-react";
import { Service } from "@shared/schema";

interface ServiceSelectionProps {
  onServiceSelect: (service: { serviceId: string; name: string; price: number }) => void;
  selectedServiceId?: string;
  services: Service[];
  isLoading: boolean;
  error: boolean;
}

export default function ServiceSelection({ onServiceSelect, selectedServiceId, services, isLoading, error }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<string | undefined>(selectedServiceId);
  
  // Group services by category
  const boardingServices = services.filter(service => service.category === 'boarding');
  const groomingServices = services.filter(service => service.category === 'grooming');

  // Set initial selected service if provided
  useEffect(() => {
    if (selectedServiceId) {
      setSelectedService(selectedServiceId);
    }
  }, [selectedServiceId]);

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleNextClick = () => {
    if (selectedService) {
      const service = services.find(s => s.serviceId === selectedService);
      if (service) {
        onServiceSelect({
          serviceId: service.serviceId,
          name: service.name,
          price: service.price
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">Failed to load services. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Select Your Service</h2>
      <p className="mt-1 text-sm text-gray-500">Choose the service you'd like to book for your furry friend.</p>
      
      <RadioGroup value={selectedService} onValueChange={handleServiceChange} className="mt-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-4">
              <Home className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-base font-medium text-gray-900">Boarding Services</h3>
            </div>
            <div className="space-y-4">
              {boardingServices.map((service) => (
                <div 
                  key={service.serviceId} 
                  className={`relative bg-white border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none ${
                    selectedService === service.serviceId ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
                  }`}
                  onClick={() => handleServiceChange(service.serviceId)}
                >
                  <div className="flex items-center h-5">
                    <RadioGroupItem value={service.serviceId} id={service.serviceId} />
                  </div>
                  <div className="ml-3 flex-1">
                    <Label htmlFor={service.serviceId} className="font-medium text-gray-900 cursor-pointer">{service.name}</Label>
                    <p className="text-sm text-gray-500">{service.description}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      ${service.price.toFixed(2)}/{service.priceUnit === 'per_night' ? 'night' : 'service'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-4">
              <Smile className="h-5 w-5 text-emerald-500 mr-2" />
              <h3 className="text-base font-medium text-gray-900">Grooming Services</h3>
            </div>
            <div className="space-y-4">
              {groomingServices.map((service) => (
                <div 
                  key={service.serviceId} 
                  className={`relative bg-white border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none ${
                    selectedService === service.serviceId ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
                  }`}
                  onClick={() => handleServiceChange(service.serviceId)}
                >
                  <div className="flex items-center h-5">
                    <RadioGroupItem value={service.serviceId} id={service.serviceId} />
                  </div>
                  <div className="ml-3 flex-1">
                    <Label htmlFor={service.serviceId} className="font-medium text-gray-900 cursor-pointer">{service.name}</Label>
                    <p className="text-sm text-gray-500">{service.description}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      ${service.price.toFixed(2)}/{service.priceUnit === 'per_night' ? 'night' : 'service'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RadioGroup>

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleNextClick} 
          disabled={!selectedService}
          className="ml-3"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
