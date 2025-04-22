import { Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Home, Smile } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  iconColor: string;
  buttonText: string;
  buttonColor: string;
  services: Service[];
  onBookService: (serviceId: string) => void;
  showDetails?: boolean;
}

export default function ServiceCard({
  title,
  description,
  iconColor,
  buttonText,
  buttonColor,
  services,
  onBookService,
  showDetails = false,
}: ServiceCardProps) {
  const renderIcon = () => {
    if (title.includes("Boarding")) {
      return <Home className="h-8 w-8 text-white" />;
    } else {
      return <Smile className="h-8 w-8 text-white" />;
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="flex">
        <div className="flex-1 px-6 py-8">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-12 w-12 ${iconColor} rounded-md flex items-center justify-center`}>
              {renderIcon()}
            </div>
            <div className="ml-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            </div>
          </div>
          
          <div className="mt-5">
            {services.map((service, index) => (
              <div key={service.serviceId} className={index > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}>
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                    
                    {showDetails && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onBookService(service.serviceId)}
                          className="text-xs"
                        >
                          Select
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${service.price.toFixed(2)}
                    {service.priceUnit === 'per_night' ? '/night' : '+'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {!showDetails && (
            <div className="mt-6">
              <Button 
                onClick={() => onBookService(services[0].serviceId)}
                className={`w-full inline-flex items-center justify-center px-4 py-2 ${buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
              >
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
