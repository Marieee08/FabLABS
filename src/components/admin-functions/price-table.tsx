import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  iconName: string;
}

const DynamicIcon = ({ iconName }: DynamicIconProps) => {
  if (!iconName) return null;
  
  // Handle different formats that might be stored in your database
  // This assumes icon names in the database could be in various formats like:
  // "file-text", "fileText", "FileText" or "file_text"
  const formatIconName = (name: any) => {
    // Convert kebab-case or snake_case to camelCase first
    const camelCase = name.replace(/[-_](.)/g, (_: any, c: any) => c.toUpperCase());
    // Then convert to PascalCase (first letter uppercase)
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  };
  
  const formattedIconName = formatIconName(iconName);
  const IconComponent = (LucideIcons as any)[formattedIconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found as "${formattedIconName}" in Lucide icons`);
    // Fallback to a default icon
    return <LucideIcons.HelpCircle className="w-6 h-6 text-blue-500" />;
  }
  
  return <IconComponent className="w-6 h-6 text-blue-500" />;
};

const PricingTable = () => {
  const [dbServices, setDbServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Add buffer state to control minimum loading time
  const [buffering, setBuffering] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(false);
      setBuffering(true);
      
      // Track start time for buffering
      const startTime = Date.now();
      const minBufferTime = 1000; // 1000ms minimum buffer time
      
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setDbServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
        setError(true);
        // Provide some fallback data if the API call fails
        setDbServices([]);
      } finally {
        setLoading(false);
        
        // Calculate remaining buffer time
        const elapsedTime = Date.now() - startTime;
        const remainingBuffer = Math.max(0, minBufferTime - elapsedTime);
        
        // Only hide the loading skeleton after both the data is loaded 
        // and the minimum buffer time has elapsed
        if (remainingBuffer > 0) {
          setTimeout(() => {
            setBuffering(false);
          }, remainingBuffer);
        } else {
          setBuffering(false);
        }
      }
    };

    fetchServices();
  }, []);

  // Format database services
  const formattedServices = dbServices.map(service => ({
    name: (service as any).Service,
    rate: (service as any).Costs !== null ? (service as any).Costs.toString() : '0',
    unit: (service as any).Per || '',
    icon: (service as any).Icon,
    description: (service as any).Info || ''
  }));

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="border border-[#5e86ca] opacity-60">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gray-200 rounded-lg w-10 h-10 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <div className="flex items-baseline mb-4">
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );

  // Progress bar component for buffering visualization
  const ProgressBar = () => (
    <div className="col-span-3 w-full">
      <div className="w-full h-1 bg-blue-100 overflow-hidden rounded-full">
        <div className="h-full bg-blue-500 animate-progress" 
             style={{
               width: '100%',
               animation: 'progressAnimation 2s ease-in-out infinite'
             }} />
      </div>
      <style jsx>{`
        @keyframes progressAnimation {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="col-span-3 text-center py-10">
      <LucideIcons.AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
      <h3 className="text-lg font-semibold">Unable to load services</h3>
      <p className="text-gray-500 mb-4">There was a problem loading the services. Please try again.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="">
      {(loading || buffering) && <ProgressBar />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(loading || buffering) ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : formattedServices.length === 0 ? (
          <div className="col-span-3 text-center py-10">
            <LucideIcons.AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold">No services available</h3>
            <p className="text-gray-500">Please try again later or contact support.</p>
          </div>
        ) : (
          formattedServices.map((service, index) => (
            <Card 
              key={index} 
              className="transition-all duration-300 hover:shadow-lg border border-[#5e86ca] animate-fadeIn"
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DynamicIcon iconName={service.icon} />
                  </div>
                  <CardTitle className="text-xl font-qanelas2">{service.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <div className="flex items-baseline mb-4">
                    {(service.rate === '0' || service.rate === 0 || !service.rate) ? (
                      <span className="text-3xl font-qanelas3">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-qanelas3">₱{service.rate}</span>
                        {service.unit && (
                          <span className="text-gray-500 ml-1">/{service.unit}</span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-gray-600 font-poppins1">{service.description}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PricingTable;