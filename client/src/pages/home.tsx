import { Link } from "wouter";
import HeroSection from "@/components/home/hero-section";
import ServiceCard from "@/components/services/service-card";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/services'],
    staleTime: 3600000, // 1 hour
  });

  const services = data?.services || [];
  const boardingServices = services.filter(service => service.category === 'boarding');
  const groomingServices = services.filter(service => service.category === 'grooming');

  return (
    <div className="bg-background">
      <HeroSection />
      
      <div id="services" className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Our Services</h2>
              <p className="mt-4 text-lg text-gray-500">Choose from our premium dog boarding and grooming services tailored to your pet's needs.</p>
              <p className="mt-4 text-lg text-gray-500">All services include professional care, comfortable facilities, and peace of mind for pet parents.</p>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-2">
              <div className="space-y-5 sm:space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-700">Failed to load services. Please try again later.</p>
                  </div>
                ) : (
                  <>
                    <ServiceCard 
                      title="Dog Boarding"
                      description="Comfortable overnight stay with plenty of playtime and care."
                      iconColor="bg-primary"
                      buttonText="Book Boarding"
                      buttonColor="bg-primary hover:bg-blue-600"
                      services={boardingServices}
                      onBookService={() => window.location.href = '/booking'}
                    />
                    
                    <ServiceCard 
                      title="Dog Grooming"
                      description="Professional grooming services to keep your pup looking and feeling great."
                      iconColor="bg-emerald-500"
                      buttonText="Book Grooming"
                      buttonColor="bg-emerald-500 hover:bg-emerald-600"
                      services={groomingServices}
                      onBookService={() => window.location.href = '/booking'}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
