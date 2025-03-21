import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

interface Service {
  id: string;
  Service: string;
  Machines?: { 
    machine: { 
      id: string;
      Machine: string;
    } 
  }[];
}

interface ServiceSelectorProps {
  selectedServices: string[];
  onChange: (services: string[]) => void;
  onBlur: () => void;
  hasError: boolean;
  errorMessage?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onChange,
  onBlur,
  hasError,
  errorMessage
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setError('Failed to load services. Please try again.');
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceChange = (service: string) => {
    const currentServices = selectedServices || [];
    let newServices;

    // Special handling for Benchmarking
    if (service === 'Benchmarking') {
      newServices = currentServices.includes(service)
        ? currentServices.filter(s => s !== service)
        : [service]; // Only Benchmarking when selected
    } else {
      // For other services
      newServices = currentServices.includes(service)
        ? currentServices.filter(s => s !== service)
        : [...currentServices.filter(s => s !== 'Benchmarking'), service];
    }
    
    onChange(newServices);
  };

  const isServiceSelected = (service: string) => {
    return (selectedServices || []).includes(service);
  };

  return (
    <div>
      <div 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`block w-full border rounded-md shadow-sm p-3 cursor-pointer bg-white flex justify-between items-center ${
          hasError ? "border-red-500" : "border-gray-300 hover:border-blue-300"
        }`}
      >
        <span>
          {selectedServices && selectedServices.length > 0
            ? `${selectedServices.length} service(s) selected`
            : 'Select services'}
        </span>
        {isDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      
      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading services...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : (
            services.map((service) => (
              <div 
                key={service.id} 
                className="px-4 py-3 hover:bg-gray-100 flex items-center cursor-pointer transition-colors"
                onClick={() => handleServiceChange(service.Service)}
              >
                <div className={`w-5 h-5 mr-3 flex-shrink-0 border rounded ${
                  isServiceSelected(service.Service) 
                    ? "bg-blue-500 border-blue-500 flex items-center justify-center" 
                    : "border-gray-300"
                }`}>
                  {isServiceSelected(service.Service) && <Check size={16} className="text-white" />}
                </div>
                <span className={isServiceSelected(service.Service) ? "font-medium" : ""}>
                  {service.Service}
                </span>
              </div>
            ))
          )}
        </div>
      )}
      
      {hasError && errorMessage && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}

      {selectedServices && selectedServices.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedServices.map(service => (
            <div key={service} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              {service}
              <button 
                onClick={() => handleServiceChange(service)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;