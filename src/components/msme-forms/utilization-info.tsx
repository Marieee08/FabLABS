import React, { useState, useEffect, ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
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

interface FormData {
  ProductsManufactured: string[];
  BulkofCommodity: string;
  Tools: string;
  [key: string]: any;
}

interface StepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export default function ProcessInformation({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormData>>(new Set());
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [hasMachines, setHasMachines] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
        setIsLoadingServices(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setServiceError('Failed to load services. Please try again.');
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Check if selected services have machines
  useEffect(() => {
    if (formData.ProductsManufactured && formData.ProductsManufactured.length > 0) {
      // Find if any selected service has associated machines
      const selectedServices = services.filter(service => 
        formData.ProductsManufactured.includes(service.Service)
      );
      
      const anyServiceHasMachines = selectedServices.some(service => 
        service.Machines && service.Machines.length > 0
      );
      
      setHasMachines(anyServiceHasMachines);
      
      // If no machines, set BulkofCommodity to "none"
      if (!anyServiceHasMachines) {
        updateFormData('BulkofCommodity', 'none');
      } else if (formData.BulkofCommodity === 'none') {
        // If machines exist and value is 'none', reset it
        updateFormData('BulkofCommodity', '');
      }
    }
  }, [formData.ProductsManufactured, services]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData(name as keyof FormData, value);
    validateField(name as keyof FormData, value);
  };

  const isFieldDisabled = (fieldName: keyof FormData): boolean => {
    // Disable fields if Benchmarking is selected or if no machines for BulkofCommodity
    if (fieldName === 'BulkofCommodity') {
      return formData.ProductsManufactured?.includes('Benchmarking') || !hasMachines;
    }
    return formData.ProductsManufactured?.includes('Benchmarking') || false;
  };

  const handleBlur = (fieldName: keyof FormData) => {
    const newTouchedFields = new Set(touchedFields);
    newTouchedFields.add(fieldName);
    setTouchedFields(newTouchedFields);
    validateField(fieldName, formData[fieldName]);
  };

  const handleNext = () => {
    if (validateForm()) {
      nextStep();
    }
  };

  const getInputClassName = (fieldName: keyof FormData) => {
    const baseClasses = "mt-1 block w-full border rounded-md shadow-sm p-3";
    const errorClasses = touchedFields.has(fieldName) && errors[fieldName] 
      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
      : "border-gray=-300 focus:ring-blue-500 focus:border-blue-500";
    const disabledClasses = isFieldDisabled(fieldName) ? "bg-gray-100 cursor-not-allowed" : "";
    return `${baseClasses} ${errorClasses} ${disabledClasses}`;
  };

  const handleServiceChange = (services: string[]) => {
    updateFormData('ProductsManufactured', services);

    // Reset dependent fields when services change
    if (services.length === 0 || services.includes('Benchmarking')) {
      updateFormData('BulkofCommodity', '');
      updateFormData('Tools', '');
    }

    validateField('ProductsManufactured', services);
  };

  const validateField = (fieldName: keyof FormData, value: string | string[]) => {
    let error = '';

    if (fieldName === 'ProductsManufactured') {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        error = 'Please select at least one service';
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

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    if (!formData.ProductsManufactured || formData.ProductsManufactured.length === 0) {
      newErrors.ProductsManufactured = 'Please select at least one service';
      isValid = false;
    }

    // Only validate dependent fields if not in Benchmarking mode
    if (formData.ProductsManufactured && 
        !formData.ProductsManufactured.includes('Benchmarking')) {
      if (!formData.BulkofCommodity && hasMachines) {
        newErrors.BulkofCommodity = 'This field is required';
        isValid = false;
      }
    }

    setErrors(newErrors);
    const allFields = new Set(Object.keys(formData) as Array<keyof FormData>);
    setTouchedFields(allFields);
    return isValid;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-1">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 md:gap-10 mt-6">
        <div className="space-y-4 md:space-y-6 h-full">
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" /> Utilization Information
            </h2>
    
            <div className="space-y-8">
              {/* Services Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services to be availed<span className="text-red-500 ml-1">*</span>
                </label>
                
                <ServiceSelector 
                  selectedServices={formData.ProductsManufactured || []}
                  onChange={handleServiceChange}
                  onBlur={() => handleBlur('ProductsManufactured')}
                  hasError={touchedFields.has('ProductsManufactured') && !!errors.ProductsManufactured}
                  errorMessage={errors.ProductsManufactured}
                />
              </div>

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
                  value={!hasMachines ? 'none' : formData.BulkofCommodity}
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
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
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
    </div>
  );
}