import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ServiceCard from "@/components/services/service-card";

export default function Services() {
  const [, navigate] = useLocation();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/services'],
    staleTime: 3600000, // 1 hour
  });

  const services = data?.services || [];
  const boardingServices = services.filter(service => service.category === 'boarding');
  const groomingServices = services.filter(service => service.category === 'grooming');

  const handleBookService = (serviceId: string) => {
    navigate(`/booking?service=${serviceId}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Our Services
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Choose from our premium dog boarding and grooming services tailored to your pet's needs.
          </p>
        </div>

        <div className="mt-12 max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-700">Failed to load services. Please try again later.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dog Boarding Services</h2>
                <ServiceCard 
                  title="Dog Boarding"
                  description="Comfortable overnight stay with plenty of playtime and care."
                  iconColor="bg-primary"
                  buttonText="Book Boarding"
                  buttonColor="bg-primary hover:bg-blue-600"
                  services={boardingServices}
                  onBookService={handleBookService}
                  showDetails={true}
                />
              </div>
              
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dog Grooming Services</h2>
                <ServiceCard 
                  title="Dog Grooming"
                  description="Professional grooming services to keep your pup looking and feeling great."
                  iconColor="bg-emerald-500"
                  buttonText="Book Grooming"
                  buttonColor="bg-emerald-500 hover:bg-emerald-600"
                  services={groomingServices}
                  onBookService={handleBookService}
                  showDetails={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
