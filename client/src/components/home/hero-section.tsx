import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <div className="bg-gray-100 bg-opacity-75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="sm:flex sm:flex-col sm:align-center max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Premium dog care services for your furry friends
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Boarding and grooming services with professional care. Book online in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/booking">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Book Now
              </Button>
            </Link>
            <Link href="/services">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto px-8"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
