// src\components\msme-forms\utilization-info.tsx

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import ToolsSelector from '@/components/msme-forms/tools-selector';
import ServiceSelector from '@/components/msme-forms/service-selector';
import FileUploader from '@/components/custom/file-uploader'; // Updated import path
import { uploadFiles } from '../../../utils/fileUpload';

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface FormData {
  days: Day[];
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  serviceFiles?: {[service: string]: string[]};
  serviceFilePaths?: {[service: string]: string[]};
  NeededMaterials?: Array<{
    Item: string;
    ItemQty: number;
    Description: string;
  }>;
  [key: string]: any; // Add index signature for dynamic access
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
  // Add state for file uploads
  const [files, setFiles] = useState<{[service: string]: File[]}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
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

  // Store services in a ref to avoid unnecessary re-renders
  const servicesRef = useRef(services);
  
  // Update ref when services change
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  // Check if selected services have machines - optimized to prevent unnecessary re-renders
  useEffect(() => {
    if (formData.ProductsManufactured && formData.ProductsManufactured.length > 0) {
      // Use servicesRef.current instead of services directly
      const selectedServices = servicesRef.current.filter(service => 
        formData.ProductsManufactured.includes(service.Service)
      );
      
      const anyServiceHasMachines = selectedServices.some(service => 
        service.Machines && service.Machines.length > 0
      );
      
      // Only update state if it actually changed
      if (hasMachines !== anyServiceHasMachines) {
        setHasMachines(anyServiceHasMachines);
      }
      
      // Only update if necessary
      if (!anyServiceHasMachines && formData.BulkofCommodity !== 'none') {
        updateFormData('BulkofCommodity', 'none');
      } else if (anyServiceHasMachines && formData.BulkofCommodity === 'none') {
        updateFormData('BulkofCommodity', '');
      }
    }
  }, [formData.ProductsManufactured, formData.BulkofCommodity, hasMachines, updateFormData]);

  // Memoize event handlers to prevent recreating functions on every render
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData(name as keyof FormData, value);
    validateField(name as keyof FormData, value);
  }, [updateFormData]);

  // Memoize this function to prevent recalculation on every render
  const isFieldDisabled = useCallback((fieldName: keyof FormData): boolean => {
    // Disable fields if Benchmarking is selected or if no machines for BulkofCommodity
    if (fieldName === 'BulkofCommodity') {
      return formData.ProductsManufactured?.includes('Benchmarking') || !hasMachines;
    }
    return formData.ProductsManufactured?.includes('Benchmarking') || false;
  }, [formData.ProductsManufactured, hasMachines]);

  const handleBlur = useCallback((fieldName: keyof FormData) => {
    setTouchedFields(prev => {
      const newTouchedFields = new Set(prev);
      newTouchedFields.add(fieldName);
      return newTouchedFields;
    });
    validateField(fieldName, formData[fieldName]);
  }, [formData]);

  // Add handler for file uploads
  const handleFileUpload = useCallback((service: string, uploadedFiles: File[]) => {
    setFiles(prev => ({
      ...prev,
      [service]: uploadedFiles
    }));
    
    // Update form data to include the files information
    updateFormData('serviceFiles', {
      ...formData.serviceFiles,
      [service]: uploadedFiles.map(file => file.name)
    });
  }, [formData.serviceFiles, updateFormData]);

  const validateField = useCallback((fieldName: keyof FormData, value: string | string[]) => {
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
  }, [formData, hasMachines]);

  // Now define handleNext after validateForm
  const handleNext = useCallback(async () => {
    if (validateForm()) {
      // Check if there are files to upload
      const hasFiles = Object.values(files).some(serviceFiles => serviceFiles.length > 0);
      
      if (hasFiles) {
        setIsUploading(true);
        setUploadError(null);
        
        try {
          // Upload files for each service
          const filePromises = Object.entries(files).map(([service, serviceFiles]) => {
            if (serviceFiles.length === 0) return Promise.resolve();
            
            return uploadFiles(
              serviceFiles, 
              service, 
              undefined, // serviceId will be assigned later
              undefined  // reservationId will be assigned later
            );
          });
          
          const results = await Promise.all(filePromises);
          
          // Store file paths in form data for future reference
          const filePaths: {[service: string]: string[]} = {};
          
          results.forEach((result, index) => {
            if (result && result.files) {
              const service = Object.keys(files)[index];
              filePaths[service] = result.files.map((file: any) => file.path);
            }
          });
          
          // Update form data with file paths
          updateFormData('serviceFilePaths', filePaths);
          
          // Proceed to next step
          nextStep();
        } catch (error) {
          console.error('Error uploading files:', error);
          setUploadError('Failed to upload files. Please try again.');
        } finally {
          setIsUploading(false);
        }
      } else {
        // No files to upload, just proceed
        nextStep();
      }
    }
  }, [nextStep, files, updateFormData, validateForm]);

  const getInputClassName = useCallback((fieldName: keyof FormData) => {
    const baseClasses = "mt-1 block w-full border rounded-md shadow-sm p-3";
    const errorClasses = touchedFields.has(fieldName) && errors[fieldName] 
      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
      : "border-gray=-300 focus:ring-blue-500 focus:border-blue-500";
    const disabledClasses = isFieldDisabled(fieldName) ? "bg-gray-100 cursor-not-allowed" : "";
    return `${baseClasses} ${errorClasses} ${disabledClasses}`;
  }, [touchedFields, errors, isFieldDisabled]);

  const handleServiceChange = useCallback((services: string[]) => {
    updateFormData('ProductsManufactured', services);

    // Reset dependent fields when services change
    if (services.length === 0 || services.includes('Benchmarking')) {
      updateFormData('BulkofCommodity', '');
      updateFormData('Tools', '');
    }

    validateField('ProductsManufactured', services);
  }, [updateFormData]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-1">
      <div className="space-y-4 md:space-y-6 h-full">
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

          {/* File Upload for selected services that have machines */}
          {formData.ProductsManufactured && 
           formData.ProductsManufactured.length > 0 && 
           hasMachines && (
            <div className="mt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Upload Files</h3>
              <p className="text-xs text-gray-500">Upload any relevant files for your selected services with machines</p>
              
              {Array.isArray(formData.ProductsManufactured) && formData.ProductsManufactured.map((service) => {
                // Find the service in the services array
                const serviceInfo = servicesRef.current.find(s => s.Service === service);
                
                // Check if this service has machines
                const serviceHasMachines = serviceInfo?.Machines && serviceInfo.Machines.length > 0;
                
                // Only render if the service has machines
                return serviceHasMachines ? (
                  <div key={service} className="p-4 border rounded-md bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">{service}</h4>
                    <FileUploader
                      serviceName={service}
                      onFileUpload={(uploadedFiles) => handleFileUpload(service, uploadedFiles)}
                      maxFiles={5}
                      acceptedFileTypes="*/*"
                    />
                  </div>
                ) : null;
              })}
              
              {uploadError && (
                <div className="text-red-500 text-sm mt-2">
                  {uploadError}
                </div>
              )}
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

      {/* Navigation buttons - Only show when in standalone mode */}
      {standalonePage && (
        <div className="mt-8 flex justify-between">
          <button 
            onClick={prevStep} 
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            disabled={isUploading}
          >
            <ChevronDown className="rotate-90 mr-2" size={18} />
            Previous
          </button>
          <button 
            onClick={handleNext} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="mr-2">Uploading...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <>
                Continue to Next Step
                <ChevronDown className="-rotate-90 ml-2" size={18} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}