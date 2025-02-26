import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ iconName }) => {
  if (!iconName) return null;
  
  const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const IconComponent = LucideIcons[formattedIconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found`);
    return null;
  }
  
  return <IconComponent className="w-6 h-6" />;
};

const PricingTable = () => {
  const [dbServices, setDbServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        setDbServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Format database services
  const formattedServices = dbServices.map(service => ({
    name: service.Service,
    rate: service.Costs !== null ? service.Costs.toString() : '0',
    unit: service.Per || '',
    icon: service.Icon,
    description: service.Info || ''
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

  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          formattedServices.map((service, index) => (
            <Card key={index} className="transition-all duration-300 hover:shadow-lg border border-[#5e86ca]">
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