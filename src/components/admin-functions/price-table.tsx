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

  const hardcodedServices = [
    {
      name: "3D Printing",
      rate: "4.50",
      unit: "hr",
      icon: "printer",
      description: "High-quality 3D printing services for your prototypes and models"
    },
    {
      name: "Large CNC",
      rate: "225",
      unit: "hr",
      icon: "crop",
      description: "Industrial-grade CNC machining for large-scale projects"
    },
    {
      name: "Large Format Printing",
      rate: "20",
      unit: "sq.ft.",
      icon: "printer",
      description: "Professional large format printing services"
    },
    {
      name: "Vinyl Cutting",
      rate: "15",
      unit: "hr",
      icon: "scissors",
      description: "Precise vinyl cutting for custom designs"
    },
    {
      name: "Desktop CNC",
      rate: "180",
      unit: "hr",
      icon: "crop",
      description: "Desktop CNC milling for smaller precision projects"
    },
    {
      name: "Laser Cutting",
      rate: "12",
      unit: "hr",
      icon: "clock",
      description: "High-precision laser cutting services"
    },
    {
      name: "Prototype Consultation",
      rate: "0",
      unit: "",
      icon: "messageSquare",
      description: "Expert consultation for your prototype development"
    }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        setDbServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  // Combine and format database services to match hardcoded structure
  const formattedDbServices = dbServices.map(service => ({
    name: service.Service,
    rate: service.Costs !== null ? service.Costs.toString() : '0',
    unit: service.Per || '',
    icon: service.Icon,
    description: service.Info || ''
  }));

  // Combine both arrays
  const allServices = [...hardcodedServices, ...formattedDbServices];

  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((service, index) => (
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
        ))}
      </div>
    </div>
  );
};

export default PricingTable;