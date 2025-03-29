import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import ToolsSelector from '@/components/msme-forms/tools-selector';
import ServiceSelector from '@/components/msme-forms/service-selector';
import { Textarea } from '@/components/ui/textarea';

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface FormData {
  days: Day[];
  ProductsManufactured: string;  // Changed from string | string[] to just string
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  serviceMachineNumbers?: Record<string, number>;
  serviceLinks?: {[service: string]: string}; 
  Remarks?: string;
  NeededMaterials?: Array<{
    Item: string;
    ItemQty: number;
    Description: string;
  }>;
  [key: string]: any;
}

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

interface ProcessInformationProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  standalonePage?: boolean;
}


// Machine Quantity Selector Component
interface MachineQuantitySelectorProps {
  selectedServices: string[];
  servicesMachineData: Record<string, { machineCount: number }>;
  onChange: (machineNumbers: Record<string, number>) => void;
  initialValues?: Record<string, number>;
}

const MachineQuantitySelector: React.FC<MachineQuantitySelectorProps> = ({
  selectedServices,
  servicesMachineData,
  onChange,
  initialValues = {}
}) => {
  // Initialize state with provided initial values
  const [machineNumbers, setMachineNumbers] = useState<Record<string, number>>(() => {
    // Use provided initial values or default to empty object
    return { ...initialValues };
  });
  
  // Use a ref to track previous initialValues to avoid unnecessary updates
  const prevInitialValuesRef = useRef<string>(JSON.stringify(initialValues));
  
  // Update state when initialValues change (e.g., when navigating back from review)
  useEffect(() => {
    const currentInitialValuesString = JSON.stringify(initialValues);
    
    // Only update if initialValues have changed
    if (currentInitialValuesString !== prevInitialValuesRef.current) {
      console.log("Machine quantity state updated from initialValues:", initialValues);
      setMachineNumbers({ ...initialValues });
      prevInitialValuesRef.current = currentInitialValuesString;
    }
  }, [initialValues]);
  
  // Handle machine quantity change
  const handleMachineNumberChange = (service: string, value: string) => {
    // Parse the input value to a number
    const count = parseInt(value);
    
    // Validate input: ensure it's a number, not negative, and doesn't exceed max
    const maxCount = servicesMachineData[service]?.machineCount || 0;
    const validCount = isNaN(count) ? 0 : Math.min(Math.max(0, count), maxCount);
    
    // Update local state
    const newMachineNumbers = {
      ...machineNumbers,
      [service]: validCount
    };
    
    // Update local state
    setMachineNumbers(newMachineNumbers);
    
    // Notify parent component
    onChange(newMachineNumbers);
  };
  
  // For debugging - log when component renders
  console.log("MachineQuantitySelector rendering with:", {
    selectedServices,
    machineData: Object.keys(servicesMachineData).map(service => ({
      service,
      count: servicesMachineData[service]?.machineCount
    })),
    currentValues: machineNumbers
  });

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Machine Quantity</h3>
      <p className="text-xs text-gray-500">Select the number of machines for each service</p>
      
      {selectedServices.length === 0 ? (
        <p className="text-sm text-gray-500">Please select at least one service that requires machines.</p>
      ) : (
        selectedServices.map((service) => {
          // Check if this service has machine data
          const serviceData = servicesMachineData[service];
          if (!serviceData || serviceData.machineCount <= 0) {
            return null;
          }
          
          const machineCount = serviceData.machineCount;
          const currentValue = machineNumbers[service] !== undefined ? machineNumbers[service] : 0;
          
          return (
            <div key={service} className="p-4 border rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">{service}</h4>
                <p className="text-xs text-gray-500">Max Available: {machineCount}</p>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max={machineCount}
                  value={currentValue}
                  onChange={(e) => handleMachineNumberChange(service, e.target.value)}
                  className="w-20 p-2 border rounded mr-2"
                />
                <span className="text-xs text-gray-500">machines</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default function ProcessInformation({ 
  formData, 
  updateFormData, 
  nextStep, 
  prevStep,
  standalonePage = true 
}: ProcessInformationProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormData>>(new Set());
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [hasMachines, setHasMachines] = useState<boolean>(true);
  const [servicesMachineData, setServicesMachineData] = useState<Record<string, { machineCount: number }>>({});
  
  // Store current form data in a ref to detect changes
  const formDataRef = useRef(formData);
  
  const [selectedService, setSelectedService] = useState<string>(() => {
    return typeof formData.ProductsManufactured === 'string' 
      ? formData.ProductsManufactured 
      : '';
  });

  // Log initial form state for debugging
  useEffect(() => {
    console.log("ProcessInformation mounted with formData:", {
      ProductsManufactured: formData.ProductsManufactured,
      BulkofCommodity: formData.BulkofCommodity,
      serviceMachineNumbers: formData.serviceMachineNumbers,
      serviceLinks: formData.serviceLinks,
      Remarks: formData.Remarks
    });
  }, []);

  useEffect(() => {
    console.log("Debug Render Conditions:", {
      selectedService,
      hasMachines,
      servicesMachineData,
      servicesData: servicesRef.current
    });

    // Additional detailed logging for machine data
    const selectedServiceObject = servicesRef.current.find(service => 
      service.Service === selectedService
    );

    console.log("Selected Service Object:", selectedServiceObject);
    
    const machineDetails = selectedServiceObject ? [{
      service: selectedServiceObject.Service,
      hasMachines: selectedServiceObject.Machines && selectedServiceObject.Machines.length > 0,
      machineCount: selectedServiceObject.Machines?.reduce((total, machineService) => {
        return total + (machineService.machine.Quantity || 0);
      }, 0) || 0
    }] : [];

    console.log("Machine Details for Selected Service:", machineDetails);
  }, [selectedService, hasMachines, servicesMachineData]);


  useEffect(() => {
    // Update selected service when formData changes
    const newSelectedService = typeof formData.ProductsManufactured === 'string' 
      ? formData.ProductsManufactured 
      : '';
    
    // Only update state if there's an actual change to avoid render loops
    if (newSelectedService !== selectedService) {
      console.log("Updating selectedService from formData:", newSelectedService);
      setSelectedService(newSelectedService);
    }
  }, [formData]);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
        
        // Process machine data correctly by summing actual quantities
        const machineData = {};
        data.forEach(service => {
          let totalMachineQuantity = 0;
          
          if (service.Machines && Array.isArray(service.Machines)) {
            service.Machines.forEach(machineService => {
              // Sum up the actual quantities (Number field)
              const machineQuantity = machineService.machine.Number || 0;
              totalMachineQuantity += machineQuantity;
            });
          }
          
          machineData[service.Service] = {
            machineCount: totalMachineQuantity,
            hasMachines: totalMachineQuantity > 0
          };
        });
        
        console.log("Processed Machine Data:", machineData);
        setServicesMachineData(machineData);
        setIsLoadingServices(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setServiceError('Failed to load services. Please try again.');
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

  // Determine if any selected service has machines
  useEffect(() => {
    if (selectedService && !isLoadingServices) {
      // Check if the selected service has machines with quantity > 0
      let anyServiceHasMachines = false;
      
      if (servicesMachineData[selectedService]?.machineCount > 0) {
        anyServiceHasMachines = true;
      }
      
      // Only update state if it changed
      if (hasMachines !== anyServiceHasMachines) {
        console.log(`Setting hasMachines to ${anyServiceHasMachines}`);
        setHasMachines(anyServiceHasMachines);
      }
    } else if (!selectedService && hasMachines) {
      // Reset when no service is selected
      setHasMachines(false);
    }
  }, [selectedService, servicesMachineData, isLoadingServices, hasMachines]);

  useEffect(() => {
    if (formData.serviceMachineNumbers && Object.keys(formData.serviceMachineNumbers).length > 0) {
      console.log("Found saved machine numbers:", formData.serviceMachineNumbers);
      
      // Ensure the selected service has machine numbers
      const updatedMachineNumbers = { ...formData.serviceMachineNumbers };
      let needsUpdate = false;
      
      if (selectedService) {
        if (updatedMachineNumbers[selectedService] === undefined) {
          updatedMachineNumbers[selectedService] = 0;
          needsUpdate = true;
        }
      }
      
      // Remove any services that are no longer selected
      Object.keys(updatedMachineNumbers).forEach(service => {
        if (service !== selectedService) {
          delete updatedMachineNumbers[service];
          needsUpdate = true;
        }
      });
      
      // Update formData if changes were made
      if (needsUpdate) {
        updateFormData('serviceMachineNumbers', updatedMachineNumbers);
      }
    } else if (selectedService && hasMachines) {
      // Initialize machine numbers if not present
      const initialMachineNumbers = {
        [selectedService]: 0
      };
      updateFormData('serviceMachineNumbers', initialMachineNumbers);
    }
  }, [formData.serviceMachineNumbers, selectedService, hasMachines, updateFormData]);

  // Handle input changes
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData(name as keyof FormData, value);
    validateField(name as keyof FormData, value);
  }, [updateFormData]);

  // Handle links for selected services
  const handleLinkChange = useCallback((service: string, value: string) => {
    // Create a new object to avoid reference issues
    const updatedLinks = { ...(formData.serviceLinks || {}) };
    updatedLinks[service] = value;
    updateFormData('serviceLinks', updatedLinks);
  }, [formData.serviceLinks, updateFormData]);

  // Handle machine numbers changes
  const handleMachineNumbersChange = useCallback((machineNumbers: Record<string, number>) => {
    updateFormData('serviceMachineNumbers', machineNumbers);
  }, [updateFormData]);

  // Determine if a field should be disabled
  const isFieldDisabled = useCallback((fieldName: keyof FormData): boolean => {
    // Disable fields if selected service is Benchmarking or if no machines
    if (fieldName === 'BulkofCommodity') {
      return selectedService === 'Benchmarking' || !hasMachines;
    }
    return selectedService === 'Benchmarking' || false;
  }, [selectedService, hasMachines]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: keyof FormData) => {
    setTouchedFields(prev => {
      const newTouchedFields = new Set(prev);
      newTouchedFields.add(fieldName);
      return newTouchedFields;
    });
    validateField(fieldName, formData[fieldName]);
  }, [formData]);

  const validateField = useCallback((fieldName: keyof FormData, value: string) => {
    let error = '';

    if (fieldName === 'ProductsManufactured') {
      if (!value) {
        error = 'Please select a service';
      }
    }

    // Add validation for other fields when not in Benchmarking mode and has machines
    if (!isFieldDisabled(fieldName) || (fieldName === 'BulkofCommodity' && hasMachines)) {
      switch(fieldName) {
        case 'BulkofCommodity':
          if (!value && hasMachines) {
            error = 'This field is required';
          }
          break;
      }
    }

    setErrors(prev => {
      // Only update if the error actually changed
      if (prev[fieldName] === error) {
        return prev;
      }
      return {
        ...prev,
        [fieldName]: error
      };
    });

    return !error;
  }, [isFieldDisabled, hasMachines]);

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    if (!selectedService) {
      newErrors.ProductsManufactured = 'Please select a service';
      isValid = false;
    }

    // Only validate dependent fields if not in Benchmarking mode
    if (selectedService && 
        selectedService !== 'Benchmarking') {
      if (!formData.BulkofCommodity && hasMachines) {
        newErrors.BulkofCommodity = 'This field is required';
        isValid = false;
      }
    }

    // Only update state if there's actually a change
    setErrors(prev => {
      if (JSON.stringify(prev) === JSON.stringify(newErrors)) {
        return prev;
      }
      return newErrors;
    });
    
    setTouchedFields(() => {
      return new Set(Object.keys(formData) as Array<keyof FormData>);
    });
    
    return isValid;
  }, [selectedService, formData, hasMachines]);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (validateForm()) {
      // Make sure ProductsManufactured is always an array before proceeding
      if (!Array.isArray(formData.ProductsManufactured) && formData.ProductsManufactured) {
        updateFormData('ProductsManufactured', [formData.ProductsManufactured]);
      }
      
      nextStep();
    }
  }, [nextStep, validateForm, formData.ProductsManufactured, updateFormData]);

  // Get CSS class for input fields
  const getInputClassName = useCallback((fieldName: keyof FormData) => {
    const baseClasses = "mt-1 block w-full border rounded-md shadow-sm p-3";
    const errorClasses = touchedFields.has(fieldName) && errors[fieldName] 
      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    const disabledClasses = isFieldDisabled(fieldName) ? "bg-gray-100 cursor-not-allowed" : "";
    return `${baseClasses} ${errorClasses} ${disabledClasses}`;
  }, [touchedFields, errors, isFieldDisabled]);

  const handleServiceChange = useCallback((services: string[]) => {
    // Take only the first service if multiple are somehow passed
    const selectedService = services[0] || '';
    
    // Update local state
    setSelectedService(selectedService);
    
    // Update form data
    updateFormData('ProductsManufactured', selectedService);
    
    // Update serviceMachineNumbers to synchronize with selected service
    if (formData.serviceMachineNumbers) {
      const updatedMachineNumbers: Record<string, number> = {};
      
      // Keep existing machine number for selected service or initialize to 0
      if (selectedService) {
        updatedMachineNumbers[selectedService] = 
          formData.serviceMachineNumbers[selectedService] !== undefined 
            ? formData.serviceMachineNumbers[selectedService] 
            : 0;
      }
      
      updateFormData('serviceMachineNumbers', updatedMachineNumbers);
    }
    
    // Update serviceLinks to synchronize with selected service
    if (formData.serviceLinks) {
      const updatedLinks: Record<string, string> = {};
      
      if (selectedService && formData.serviceLinks[selectedService]) {
        updatedLinks[selectedService] = formData.serviceLinks[selectedService];
      }
      
      updateFormData('serviceLinks', updatedLinks);
    }
    
    validateField('ProductsManufactured', selectedService);
  }, [updateFormData, formData.serviceMachineNumbers, formData.serviceLinks, validateField]);


  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-1">
      <div className="space-y-4 md:space-y-6 h-full">
        <div className="space-y-8">
          {/* Services Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service to be availed<span className="text-red-500 ml-1">*</span>
            </label>
            
            <ServiceSelector 
              selectedServices={selectedService ? [selectedService] : []}
              onChange={handleServiceChange}
              onBlur={() => handleBlur('ProductsManufactured')}
              hasError={touchedFields.has('ProductsManufactured') && !!errors.ProductsManufactured}
              errorMessage={errors.ProductsManufactured}
              // Add prop to enforce single selection
              singleSelect={true}
            />
          </div>

          {/* Modify the rest of the existing rendering logic to use selectedService instead of selectedServices.length */}
          {selectedService ? (
            <div className="mt-6">
              {/* Existing loading and error rendering */}
              {isLoadingServices ? (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="text-sm">Loading machine information...</p>
                </div>
              ) : serviceError ? (
                <div className="p-4 border rounded-md bg-red-50 text-red-600">
                  <p className="text-sm">{serviceError}</p>
                </div>
              ) : (
                <>
                  {hasMachines ? (
                    <MachineQuantitySelector
                      selectedServices={[selectedService]}
                      servicesMachineData={servicesMachineData}
                      onChange={handleMachineNumbersChange}
                      initialValues={formData.serviceMachineNumbers || {}}
                    />
                  ) : (
                    <div className="p-4 border rounded-md bg-gray-50">
                      <p className="text-sm text-gray-500">The selected service doesn't have any machines available.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}

          {/* Links for selected service that has machines */}
          {selectedService && hasMachines && (
            <div className="mt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Resource Links</h3>
              <p className="text-xs text-gray-500">Add Google Drive or other resource links for your selected service</p>
              
              {/* Find the service in the services array */}
              {(() => {
                const serviceInfo = servicesRef.current.find(s => s.Service === selectedService);
                const serviceHasMachines = serviceInfo?.Machines && serviceInfo.Machines.length > 0;
                
                return serviceHasMachines ? (
                  <div key={selectedService} className="p-4 border rounded-md bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">{selectedService}</h4>
                    <input
                      type="text"
                      placeholder="Paste Google Drive or resource link here"
                      className="w-full p-2 border rounded"
                      value={formData.serviceLinks?.[selectedService] || ''}
                      onChange={(e) => handleLinkChange(selectedService, e.target.value)}
                    />
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Bulk of Commodity */}
          <div className={`transition-opacity duration-300 ${isFieldDisabled('BulkofCommodity') ? 'opacity-50' : 'opacity-100'}`}>
            <label htmlFor="BulkofCommodity" className="block text-sm font-medium text-gray-700 mb-2">
              Bulk of Commodity per Production (in volume or weight)
              {!isFieldDisabled('BulkofCommodity') && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              id="BulkofCommodity"
              name="BulkofCommodity"
              value={formData.BulkofCommodity || ''}
              onChange={handleInputChange}
              onBlur={() => handleBlur('BulkofCommodity')}
              className={getInputClassName('BulkofCommodity')}
              disabled={isFieldDisabled('BulkofCommodity')}
              placeholder={!hasMachines ? 'none' : 'e.g. 500 kg, 200 liters'}
              required={!isFieldDisabled('BulkofCommodity')}
            />
            {!isFieldDisabled('BulkofCommodity') && touchedFields.has('BulkofCommodity') && errors.BulkofCommodity && (
              <p className="mt-1 text-sm text-red-500">{errors.BulkofCommodity}</p>
            )}
            {!hasMachines && (
              <p className="mt-1 text-sm text-gray-500">No machines are connected to the selected services.</p>
            )}
          </div>

          {/* Tools Selection */}
          <div className={`transition-opacity duration-300 ${isFieldDisabled('Tools') ? 'opacity-50' : 'opacity-100'}`}>
            <label htmlFor="Tools" className="block text-sm font-medium text-gray-700 mb-2">
              Tools
            </label>
            <ToolsSelector
              id="Tools"
              value={formData.Tools}
              onChange={(value) => updateFormData('Tools', value)}
              onBlur={() => handleBlur('Tools')}
              className={getInputClassName('Tools')}
              disabled={isFieldDisabled('Tools')}
            />
            {!isFieldDisabled('Tools') && touchedFields.has('Tools') && errors.Tools && (
              <p className="mt-1 text-sm text-red-500">{errors.Tools}</p>
            )}
          </div>

          {/* Remarks Field */}
          <div>
            <label htmlFor="Remarks" className="block text-sm font-medium text-gray-700 mb-2">
              Remarks or Additional Information
            </label>
            <Textarea
              id="Remarks"
              name="Remarks"
              value={formData.Remarks || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-3"
              placeholder="Add any additional information, requirements, or notes for your reservation"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Navigation buttons - Only show when in standalone mode */}
      {standalonePage && (
        <div className="mt-8 flex justify-between">
          <button 
            onClick={prevStep} 
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors flex items-center"
          >
            <ChevronDown className="rotate-90 mr-2" size={18} />
            Previous
          </button>
          <button 
            onClick={handleNext} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center"
          >
            Continue to Next Step
            <ChevronDown className="-rotate-90 ml-2" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}