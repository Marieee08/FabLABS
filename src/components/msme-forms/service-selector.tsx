
// Enhanced service-selector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, ChevronUp, X, AlertTriangle, Search } from 'lucide-react';

interface Service {
  id: string;
  Service: string;
  Machines?: { 
    machine: {
      isAvailable: boolean; 
      id: string;
      Machine: string;
      Number?: number;
    } 
  }[];
}

interface ServiceSelectorProps {
  selectedServices: string[];
  onChange: (services: string[]) => void;
  onBlur: () => void;
  hasError: boolean;
  errorMessage?: string;
  singleSelect?: boolean;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onChange,
  onBlur,
  hasError,
  errorMessage,
  singleSelect = false
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  const handleServiceChange = (service: string) => {
    const currentServices = selectedServices || [];
    let newServices: string[];

    if (singleSelect) {
      // Single selection mode
      newServices = [service];
      setIsDropdownOpen(false);
    } else {
      // Multi-selection mode (with special handling for Benchmarking)
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
    }
    
    onChange(newServices);
  };

  const isServiceSelected = (service: string) => {
    return (selectedServices || []).includes(service);
  };
  
  const filteredServices = services.filter(service => 
    service.Service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredServices.map((service) => {
    // ADD THIS CODE HERE for calculating machine counts
    const totalMachines = service.Machines?.reduce((sum, m) => sum + (m.machine.Number || 1), 0) || 0;
    const availableMachines = service.Machines?.reduce((sum, m) => 
      m.machine.isAvailable !== false ? sum + (m.machine.Number || 1) : sum, 0) || 0;
    const machineCount = availableMachines;
    const isServiceAvailable = !service.Machines || service.Machines.length === 0 || machineCount > 0;
    
    return (
      <div 
        key={service.id} 
        className={`
          px-4 py-3 hover:bg-blue-50 flex items-center 
          ${!isServiceAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
          ${isServiceSelected(service.Service) ? 'bg-blue-50' : ''}
        `}
        onClick={() => isServiceAvailable && handleServiceChange(service.Service)}
      >
        {/* checkbox part */}
        <div className="flex-grow">
          <span className={isServiceSelected(service.Service) ? "font-medium text-blue-800" : ""}>
            {service.Service}
          </span>
          
          {/* REPLACE THIS PART with improved machine count display */}
          {service.Machines && service.Machines.length > 0 && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              machineCount > 0 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {machineCount > 0 
                ? `${machineCount}/${totalMachines} machines available` 
                : 'No machines available'}
            </span>
          )}
        </div>
      </div>
    );
  })

  return (
    <div ref={dropdownRef} className="relative">
      <div 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`
          block w-full border rounded-lg shadow-sm p-4 cursor-pointer bg-white 
          flex justify-between items-center transition-all duration-200
          ${hasError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 hover:border-blue-400"}
          ${isDropdownOpen ? "ring-2 ring-blue-300" : ""}
        `}
      >
        <span className="text-base">
          {selectedServices && selectedServices.length > 0
            ? singleSelect 
              ? selectedServices[0] 
              : `${selectedServices.length} service(s) selected`
            : 'Select services'}
        </span>
        {isDropdownOpen ? 
          <ChevronUp size={20} className="text-blue-500" /> : 
          <ChevronDown size={20} className="text-gray-400" />
        }
      </div>
      
      {isDropdownOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-3 border-b">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-64">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                Loading services...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredServices.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No matching services</div>
            ) : (
              filteredServices.map((service) => {
                // ADD THIS CODE HERE for calculating machine counts
                const totalMachines = service.Machines?.reduce((sum, m) => sum + (m.machine.Number || 1), 0) || 0;
                const availableMachines = service.Machines?.reduce((sum, m) => 
                  m.machine.isAvailable !== false ? sum + (m.machine.Number || 1) : sum, 0) || 0;
                const machineCount = availableMachines;
                const isServiceAvailable = !service.Machines || service.Machines.length === 0 || machineCount > 0;
                
                return (
                  <div 
                    key={service.id} 
                    className={`
                      px-4 py-3 hover:bg-blue-50 flex items-center 
                      ${!isServiceAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                      ${isServiceSelected(service.Service) ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => isServiceAvailable && handleServiceChange(service.Service)}
                  >
                    {/* checkbox part */}
                    <div className="flex-grow">
                      <span className={isServiceSelected(service.Service) ? "font-medium text-blue-800" : ""}>
                        {service.Service}
                      </span>
                      
                      {/* REPLACE THIS PART with improved machine count display */}
                      {service.Machines && service.Machines.length > 0 && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          machineCount > 0 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {machineCount > 0 
                            ? `${machineCount}/${totalMachines} machines available` 
                            : 'No machines available'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {hasError && errorMessage && (
        <p className="mt-1.5 text-sm text-red-500 flex items-start">
          <AlertTriangle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {selectedServices && selectedServices.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedServices.map(service => (
            <div key={service} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm flex items-center shadow-sm">
              {service}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newServices = selectedServices.filter(s => s !== service);
                  onChange(newServices);
                }}
                className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-0.5 rounded-full transition-colors"
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
