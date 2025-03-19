// /components/student-forms/utilization-info/page.tsx

import React, { useState, ChangeEvent, useEffect } from 'react';
import { Plus, Minus, X } from 'lucide-react';

interface FormData {
  ProductsManufactured: string[];
  BulkofCommodity: string;
  Tools: string;
}

interface StepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: FormData[keyof FormData]) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface Tool {
  id: string;
  Tool: string;
  Quantity: number;
}

interface ToolsSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const ToolsSelector: React.FC<ToolsSelectorProps> = ({ 
  value, 
  onChange, 
  onBlur, 
  disabled, 
  className 
}) => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseToolString = (str: string): Tool[] => {
    if (!str || str === 'NOT APPLICABLE') return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const [selectedTools, setSelectedTools] = useState<Tool[]>(parseToolString(value));
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchTools = async () => {
      // Skip fetching if disabled
      if (disabled) {
        setAvailableTools([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data = await response.json();
        setAvailableTools(data);
      } catch (err) {
        setError('Failed to fetch tools. Please try again.');
        console.error('Tools fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [disabled]);

  const updateParentValue = (tools: Tool[]) => {
    const toolString = tools.length > 0 ? JSON.stringify(tools) : '';
    onChange(toolString);
  };

  const addTool = (tool: Tool) => {
    const existingToolIndex = selectedTools.findIndex(t => t.Tool === tool.Tool);
    
    if (existingToolIndex === -1) {
      const newTool: Tool = {
        id: tool.id,
        Tool: tool.Tool,
        Quantity: 1
      };
      const updatedTools = [...selectedTools, newTool];
      setSelectedTools(updatedTools);
      updateParentValue(updatedTools);
    }
    setShowDropdown(false);
  };

  const removeTool = (toolId: string) => {
    const updatedTools = selectedTools.filter(tool => tool.id !== toolId);
    setSelectedTools(updatedTools);
    updateParentValue(updatedTools);
  };

  const updateQuantity = (toolId: string, delta: number) => {
    const updatedTools = selectedTools.map(tool => {
      if (tool.id === toolId) {
        // Find the corresponding available tool to get its max quantity
        const availableTool = availableTools.find(t => t.id === toolId);
        const maxQuantity = availableTool ? availableTool.Quantity : 1;
        
        // Calculate new quantity, ensuring it's between 1 and maxQuantity
        const newQuantity = Math.max(
          1, 
          Math.min(tool.Quantity + delta, maxQuantity)
        );

        return { ...tool, Quantity: newQuantity };
      }
      return tool;
    });

    setSelectedTools(updatedTools);
    updateParentValue(updatedTools);
  };

  return (
    <div className="relative">
    <div 
      className={`min-h-[120px] p-4 border rounded-md ${
        disabled ? 'bg-gray-100' : 'bg-white'
      } ${className}`}
    >
        {selectedTools.length === 0 ? (
          <div className="text-gray-500 text-sm">
            {isLoading ? 'Loading tools...' : 'No tools selected'}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedTools.map(tool => {
              // Find the corresponding available tool to get its max quantity
              const availableTool = availableTools.find(t => t.id === tool.id);
              const maxQuantity = availableTool ? availableTool.Quantity : 1;

              return (
                <div key={tool.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="flex-grow">{tool.Tool}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(tool.id, -1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={disabled}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center">
                      {tool.Quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(tool.id, 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={disabled || tool.Quantity >= maxQuantity}
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTool(tool.id)}
                      className="p-1 hover:bg-gray-200 rounded text-red-500"
                      disabled={disabled}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="mt-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isLoading || availableTools.length === 0}
          >
            Add Tool
          </button>
        )}

        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}

        {showDropdown && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading tools...</div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {availableTools
                  .filter(tool => !selectedTools.some(st => st.Tool === tool.Tool))
                  .map(tool => (
                    <div
                      key={tool.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => addTool(tool)}
                    >
                      {tool.Tool}
                    </div>
                  ))}
                {availableTools.filter(tool => !selectedTools.some(st => st.Tool === tool.Tool)).length === 0 && (
                  <div className="p-4 text-center text-gray-500">No additional tools available</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProcessInformation({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormData>>(new Set());
  const [services, setServices] = useState<{ id: string; Service: string }[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
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
        setIsLoadingServices(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setServiceError('Failed to load services. Please try again.');
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData(name as keyof FormData, value);
    validateField(name as keyof FormData, value);
  };

  const isFieldDisabled = (fieldName: keyof FormData): boolean => {
    // Disable fields if Benchmarking is selected
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
    const baseClasses = "mt-1 block w-full border rounded-md shadow-sm p-2";
    const errorClasses = touchedFields.has(fieldName) && errors[fieldName] 
      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    const disabledClasses = isFieldDisabled(fieldName) ? "bg-gray-100 cursor-not-allowed" : "";
    return `${baseClasses} ${errorClasses} ${disabledClasses}`;
  };

  const handleServiceChange = (service: string) => {
    const currentServices = formData.ProductsManufactured || [];
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
    
    updateFormData('ProductsManufactured', newServices);

    // Reset dependent fields when services change
    if (newServices.length === 0 || newServices.includes('Benchmarking')) {
      updateFormData('BulkofCommodity', '');
      updateFormData('Tools', '');
    }

    validateField('ProductsManufactured', newServices);
  };

  const isServiceSelected = (service: string) => {
    return (formData.ProductsManufactured || []).includes(service);
  };

  const validateField = (fieldName: keyof FormData, value: string | string[]) => {
    let error = '';

    if (fieldName === 'ProductsManufactured') {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        error = 'Please select at least one service';
      }
    }

    // Add validation for other fields when not in Benchmarking mode
    if (!isFieldDisabled(fieldName)) {
      switch(fieldName) {
        case 'BulkofCommodity':
          if (!value) {
            error = 'This field is required';
          }
          break;
        case 'Tools':
          if (!value) {
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
      if (!formData.BulkofCommodity) {
        newErrors.BulkofCommodity = 'This field is required';
        isValid = false;
      }
      if (!formData.Tools) {
        newErrors.Tools = 'This field is required';
        isValid = false;
      }
    }

    setErrors(newErrors);
    const allFields = new Set(Object.keys(formData) as Array<keyof FormData>);
    setTouchedFields(allFields);
    return isValid;
  };

  return (
    <div className="max-w-4xl mx-auto">
    <h2 className="text-2xl font-semibold mb-6 mt-12">Laboratory Request and Equipment Accountability</h2>
    
    <div className="grid grid-cols-2 gap-6">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700">
          Services to be availed<span className="text-red-500">*</span>
        </label>
        
        {isLoadingServices ? (
          <div className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-gray-100 text-gray-500">
            Loading services...
          </div>
        ) : serviceError ? (
          <div className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-red-50 text-red-500">
            {serviceError}
          </div>
        ) : (
          <div>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 cursor-pointer bg-white"
            >
              {formData.ProductsManufactured && formData.ProductsManufactured.length > 0
                ? `${formData.ProductsManufactured.length} service(s) selected`
                : 'Select services'}
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {services.map((service) => (
                  <div 
                    key={service.id} 
                    className="px-4 py-2 hover:bg-gray-100 flex items-center"
                    onClick={() => handleServiceChange(service.Service)}
                  >
                    <input
                      type="checkbox"
                      checked={isServiceSelected(service.Service)}
                      onChange={() => handleServiceChange(service.Service)}
                      className="mr-2"
                    />
                    <span>{service.Service}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {errors.ProductsManufactured && (
          <p className="mt-1 text-sm text-red-500">{errors.ProductsManufactured}</p>
        )}
      </div>

        <div>
          <label htmlFor="BulkofCommodity" className="block text-sm font-medium text-gray-700">
            Bulk of Commodity per Production (in volume or weight)
            {!isFieldDisabled('BulkofCommodity') && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            id="BulkofCommodity"
            name="BulkofCommodity"
            value={formData.BulkofCommodity}
            onChange={handleInputChange}
            onBlur={() => handleBlur('BulkofCommodity')}
            className={getInputClassName('BulkofCommodity')}
            disabled={isFieldDisabled('BulkofCommodity')}
            required={!isFieldDisabled('BulkofCommodity')}
          />
          {!isFieldDisabled('BulkofCommodity') && touchedFields.has('BulkofCommodity') && errors.BulkofCommodity && (
            <p className="mt-1 text-sm text-red-500">{errors.BulkofCommodity}</p>
          )}
        </div>

        <div>
          <label htmlFor="Tools" className="block text-sm font-medium text-gray-700">
            Tools{!isFieldDisabled('Tools') && <span className="text-red-500">*</span>}
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

      <div className="mt-6 flex justify-between">
        <button onClick={prevStep} className="bg-gray-500 text-white px-4 py-2 rounded">Previous</button>
        <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded">Next</button>
      </div>
    </div>
  );
}