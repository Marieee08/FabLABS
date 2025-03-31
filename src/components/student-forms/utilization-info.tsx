// src\components\student-forms\utilization-info.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ServiceSelector from '@/components/msme-forms/service-selector';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Service {
  id: string;
  Service: string;
  Machines?: { 
    machine: { 
      id: string;
      Machine: string;
      Number?: number;
      isAvailable?: boolean;
      Desc?: string;
    } 
  }[];
}

interface SelectedMachine {
  id: string;
  quantity: number;
}

interface FormData {
  ProductsManufactured: string | string[];
  SelectedMachines?: SelectedMachine[];
  [key: string]: any;
}

interface UtilizationInfoProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  nextStep?: () => void;
  prevStep?: () => void;
  standalonePage?: boolean;
}

export default function UtilizationInfo({ 
  formData, 
  updateFormData, 
  standalonePage = false 
}: UtilizationInfoProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [availableMachines, setAvailableMachines] = useState<{[service: string]: any[]}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch services and process machine data
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      setServiceError(null);
      
      try {
        const response = await fetch('/api/services', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process machine data
        const machinesByService: {[service: string]: any[]} = {};
        
        data.forEach((service: Service) => {
          if (service.Machines && service.Machines.length > 0) {
            // Filter and map machines, keeping only available ones
            const availableMachinesForService = service.Machines
              .filter(m => m.machine.isAvailable !== false && (m.machine.Number || 0) > 0)
              .map(m => ({
                id: m.machine.id,
                name: m.machine.Machine,
                quantity: m.machine.Number || 0,
                description: m.machine.Desc || ''
              }));
            
            if (availableMachinesForService.length > 0) {
              machinesByService[service.Service] = availableMachinesForService;
            }
          }
        });
        
        setServices(data);
        setAvailableMachines(machinesByService);
        setIsLoadingServices(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setServiceError(err instanceof Error ? err.message : 'Failed to load services');
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Handle service selection
  const handleServiceChange = useCallback((services: string[]) => {
    // Reset selected machines when services change
    const selectedService = services[0] || '';
    
    updateFormData('ProductsManufactured', selectedService);
    updateFormData('SelectedMachines', []);
    
    // Validate service selection
    setErrors(prev => ({
      ...prev,
      service: selectedService ? '' : 'Please select a service'
    }));
  }, [updateFormData]);

  // Handle machine selection with quantity
  const handleMachineSelection = useCallback((machineId: string, quantity: number) => {
    const currentService = Array.isArray(formData.ProductsManufactured) 
      ? formData.ProductsManufactured[0] 
      : formData.ProductsManufactured;
    
    if (!currentService) {
      setErrors(prev => ({
        ...prev,
        machines: 'Please select a service first'
      }));
      return;
    }

    const selectedMachines = formData.SelectedMachines || [];
    
    // Find the machine in the current selection
    const existingMachineIndex = selectedMachines.findIndex(m => m.id === machineId);
    
    let updatedMachines: SelectedMachine[];
    if (existingMachineIndex !== -1) {
      // If machine exists, update its quantity or remove if quantity is 0
      updatedMachines = quantity > 0
        ? selectedMachines.map((m, index) => 
            index === existingMachineIndex ? { id: machineId, quantity } : m
          )
        : selectedMachines.filter(m => m.id !== machineId);
    } else {
      // Add new machine if quantity is greater than 0
      if (quantity > 0) {
        updatedMachines = [...selectedMachines, { id: machineId, quantity }];
      } else {
        updatedMachines = selectedMachines;
      }
    }
    
    updateFormData('SelectedMachines', updatedMachines);
    
    // Clear machine selection error if machines are selected
    setErrors(prev => ({
      ...prev,
      machines: updatedMachines.length > 0 ? '' : 'Please select at least one machine'
    }));
  }, [formData.ProductsManufactured, formData.SelectedMachines, updateFormData]);

  // Render machine selection for the current service
  const renderMachineSelection = () => {
    const currentService = Array.isArray(formData.ProductsManufactured) 
      ? formData.ProductsManufactured[0] 
      : formData.ProductsManufactured;
    
    if (!currentService) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
          Please select a service first to see available machines
        </div>
      );
    }

    const serviceMachines = availableMachines[currentService] || [];
    
    if (serviceMachines.length === 0) {
      return (
        <div className="p-4 bg-yellow-50 rounded-lg text-center text-yellow-700">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          No machines currently available for the selected service
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceMachines.map((machine) => {
          // Find the selected machine and its quantity
          const selectedMachine = (formData.SelectedMachines || [])
            .find(m => m.id === machine.id);
          
          const currentQuantity = selectedMachine ? selectedMachine.quantity : 0;
          const maxQuantity = machine.quantity;

          return (
            <div 
              key={machine.id}
              className={`
                border rounded-lg p-4 transition-all duration-200
                ${currentQuantity > 0 
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' 
                  : 'bg-white border-gray-300 hover:border-blue-300'}
              `}
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-800">{machine.name}</h4>
                <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {machine.quantity} available
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">{machine.description}</p>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleMachineSelection(machine.id, Math.max(0, currentQuantity - 1))}
                  disabled={currentQuantity <= 0}
                  className={`
                    p-1.5 rounded border 
                    ${currentQuantity > 0 
                      ? 'bg-gray-200 hover:bg-gray-300' 
                      : 'bg-gray-100 cursor-not-allowed'}
                  `}
                >
                  -
                </button>
                
                <span className="font-medium text-gray-800 w-8 text-center">
                  {currentQuantity}
                </span>
                
                <button
                  onClick={() => handleMachineSelection(machine.id, Math.min(maxQuantity, currentQuantity + 1))}
                  disabled={currentQuantity >= maxQuantity}
                  className={`
                    p-1.5 rounded border 
                    ${currentQuantity < maxQuantity 
                      ? 'bg-blue-200 hover:bg-blue-300' 
                      : 'bg-gray-100 cursor-not-allowed'}
                  `}
                >
                  +
                </button>
              </div>
              
              {currentQuantity > 0 && (
                <div className="mt-2 text-green-600 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Selected: {currentQuantity} machine(s)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Services Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Services to be availed<span className="text-red-500 ml-1">*</span>
        </label>
        
        {isLoadingServices ? (
          <div className="py-3 text-gray-500">Loading services...</div>
        ) : serviceError ? (
          <div className="py-3 text-red-500">{serviceError}</div>
        ) : (
          <ServiceSelector 
                selectedServices={typeof formData.ProductsManufactured === 'string'
                  ? [formData.ProductsManufactured]
                  : formData.ProductsManufactured}
                onChange={handleServiceChange}
                hasError={!!errors.service}
                errorMessage={errors.service}
                singleSelect={true} onBlur={function (): void {
                  throw new Error('Function not implemented.');
                } }          />
        )}
      </div>

      {/* Machine Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Machines<span className="text-red-500 ml-1">*</span>
        </label>
        {renderMachineSelection()}
        {errors.machines && (
          <p className="mt-2 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {errors.machines}
          </p>
        )}
      </div>
    </div>
  );
}