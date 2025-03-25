// src\components\student-forms\utilization-info.tsx
import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import ToolsSelector from '@/components/msme-forms/tools-selector';
import ServiceSelector from '@/components/msme-forms/service-selector';

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

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface Material {
  Item: string;
  ItemQty: number;
  Description: string;
}

interface FormData {
  days: Day[];
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string[] | string;
  Tools: string;
  NeededMaterials: Material[];
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
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormData>>(new Set());
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  
  // Updated fetchServices function
useEffect(() => {
  const fetchServices = async () => {
    setIsLoadingServices(true);
    setServiceError(null);
    
    try {
      // Add error handling for the fetch itself
      const response = await fetch('/api/services', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add cache control to prevent cached responses
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
      });
      
      // Check if the response is valid before trying to parse JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Service API returned error status:', response.status, errorData);
        throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate the data structure
      if (!Array.isArray(data)) {
        console.error('Unexpected API response format:', data);
        throw new Error('Invalid service data format received');
      }
      
      setServices(data);
      setIsLoadingServices(false);
    } catch (err) {
      console.error('Services fetch error:', err);
      setServiceError(err instanceof Error ? err.message : 'Failed to load services. Please try again.');
      setIsLoadingServices(false);
    }
  };

  fetchServices();
}, []);

  // Store services in a ref to avoid unnecessary re-renders
  const servicesRef = useRef(services);
  
  // Update ref when services change
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);
  
  // Update available equipment based on selected services
  useEffect(() => {
    if (formData.ProductsManufactured && formData.ProductsManufactured.length > 0) {
      // Find all machines associated with the selected services
      const selectedServices = servicesRef.current.filter(service => 
        Array.isArray(formData.ProductsManufactured) && 
        formData.ProductsManufactured.includes(service.Service)
      );
      
      // Extract unique machine names from the selected services
      const machines = selectedServices.flatMap(service => 
        service.Machines?.map(m => m.machine.Machine) || []
      );
      
      // Remove duplicates
      const uniqueMachines = [...new Set(machines)];
      
      setAvailableEquipment(uniqueMachines);
      
      // Reset equipment if current selections are not available
      if (Array.isArray(formData.Equipment)) {
        const validEquipment = formData.Equipment.filter(eq => uniqueMachines.includes(eq));
        if (validEquipment.length !== formData.Equipment.length) {
          updateFormData('Equipment', validEquipment);
        }
      } else if (typeof formData.Equipment === 'string' && formData.Equipment && !uniqueMachines.includes(formData.Equipment)) {
        updateFormData('Equipment', []);
      }
    } else {
      setAvailableEquipment([]);
      updateFormData('Equipment', []);
    }
  }, [formData.ProductsManufactured, updateFormData]);

  // Validate fields
  const validateField = useCallback((fieldName: keyof FormData, value: any) => {
    let error = '';

    if (fieldName === 'ProductsManufactured') {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        error = 'Please select at least one service';
      }
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  }, []);

  // Mark field as touched on blur
  const handleBlur = useCallback((fieldName: keyof FormData) => {
    setTouchedFields(prev => {
      const newTouchedFields = new Set(prev);
      newTouchedFields.add(fieldName);
      return newTouchedFields;
    });
    validateField(fieldName, formData[fieldName]);
  }, [formData, validateField]);

  // Handle service selection
  const handleServiceChange = useCallback((services: string[]) => {
    updateFormData('ProductsManufactured', services);
    validateField('ProductsManufactured', services);
  }, [updateFormData, validateField]);

  // Toggle equipment selection
  const toggleEquipment = (equipmentName: string) => {
    let currentEquipment: string[] = [];
    
    if (Array.isArray(formData.Equipment)) {
      currentEquipment = [...formData.Equipment];
    } else if (typeof formData.Equipment === 'string' && formData.Equipment) {
      currentEquipment = [formData.Equipment];
    }
    
    const index = currentEquipment.indexOf(equipmentName);
    
    if (index > -1) {
      // Remove if already selected
      currentEquipment.splice(index, 1);
    } else {
      // Add if not selected
      currentEquipment.push(equipmentName);
    }
    
    updateFormData('Equipment', currentEquipment);
  };

  // Get CSS classes for form fields
  const getInputClassName = useCallback((fieldName: keyof FormData) => {
    const baseClasses = "mt-1 block w-full border rounded-md shadow-sm p-3";
    const errorClasses = touchedFields.has(fieldName) && errors[fieldName] 
      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    return `${baseClasses} ${errorClasses}`;
  }, [touchedFields, errors]);

  // Check if an equipment is selected
  const isEquipmentSelected = (equipmentName: string) => {
    if (Array.isArray(formData.Equipment)) {
      return formData.Equipment.includes(equipmentName);
    } else if (typeof formData.Equipment === 'string') {
      return formData.Equipment === equipmentName;
    }
    return false;
  };

  return (
    <div className="w-full mx-auto">
      <div className="space-y-5 h-full">
        {/* Services Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Services to be availed<span className="text-red-500 ml-1">*</span>
          </label>
          
          {isLoadingServices ? (
            <div className="py-3 text-gray-500">Loading services...</div>
          ) : serviceError ? (
            <div className="py-3 text-red-500">{serviceError}</div>
          ) : (
            <ServiceSelector 
              selectedServices={Array.isArray(formData.ProductsManufactured) ? formData.ProductsManufactured : []}
              onChange={handleServiceChange}
              onBlur={() => handleBlur('ProductsManufactured')}
              hasError={touchedFields.has('ProductsManufactured') && !!errors.ProductsManufactured}
              errorMessage={errors.ProductsManufactured}
            />
          )}
        </div>

        {/* Equipment Selection (Simple checkbox-based selection) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipment
            {availableEquipment.length > 0 && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {availableEquipment.length > 0 ? (
            <div className="flex flex-wrap gap-2 border rounded-lg p-3 bg-gray-50">
              {availableEquipment.map(equipment => (
                <div key={equipment} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`equipment-${equipment}`}
                    checked={isEquipmentSelected(equipment)}
                    onChange={() => toggleEquipment(equipment)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`equipment-${equipment}`}
                    className="ml-2 block text-gray-700 text-sm font-medium"
                  >
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              {formData.ProductsManufactured && Array.isArray(formData.ProductsManufactured) && 
               formData.ProductsManufactured.length > 0 
                ? "No equipment available for selected services" 
                : "Please select services first to see available equipment"}
            </p>
          )}
          
          {/* Display selected equipment summary */}
          {Array.isArray(formData.Equipment) && formData.Equipment.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm text-blue-700 font-medium">Selected Equipment:</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {formData.Equipment.map((item, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tools Selection */}
        <div className="relative">
          <label htmlFor="Tools" className="block text-sm font-medium text-gray-700 mb-2">
            Tools
          </label>
          <ToolsSelector
            id="Tools"
            value={formData.Tools}
            onChange={(value) => updateFormData('Tools', value)}
            onBlur={() => handleBlur('Tools')}
            className={getInputClassName('Tools')}
          />
        </div>
      </div>
    </div>
  );
}