import React, { useState, useEffect, ChangeEvent } from 'react';
import { Plus, Minus, X, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface Tool {
  id: string;
  Tool: string;
  Quantity: number;
}

interface StepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface FormData {
  ProductsManufactured: string[];
  BulkofCommodity: string;
  Tools: string;
  [key: string]: any;
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
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
    setSearchTerm('');
  };

  const removeTool = (toolId: string) => {
    const updatedTools = selectedTools.filter(tool => tool.id !== toolId);
    setSelectedTools(updatedTools);
    updateParentValue(updatedTools);
  };

  const updateQuantity = (toolId: string, delta: number) => {
    const updatedTools = selectedTools.map(tool => {
      if (tool.id === toolId) {
        const availableTool = availableTools.find(t => t.id === toolId);
        const maxQuantity = availableTool ? availableTool.Quantity : 1;
        
        const newQuantity = Math.max(1, Math.min(tool.Quantity + delta, maxQuantity));
        return { ...tool, Quantity: newQuantity };
      }
      return tool;
    });

    setSelectedTools(updatedTools);
    updateParentValue(updatedTools);
  };

  const filteredTools = availableTools
    .filter(tool => !selectedTools.some(st => st.Tool === tool.Tool))
    .filter(tool => tool.Tool.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative">
      <div className={`min-h-[120px] p-4 border rounded-md ${
        disabled ? 'bg-gray-100' : 'bg-white'
      } ${className}`}>
        {selectedTools.length === 0 ? (
          <div className="text-gray-500 text-sm flex items-center justify-center h-24">
            {isLoading ? 'Loading tools...' : 'No tools selected'}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedTools.map(tool => {
              const availableTool = availableTools.find(t => t.id === tool.id);
              const maxQuantity = availableTool ? availableTool.Quantity : 1;
              const isAtMaxQuantity = tool.Quantity >= maxQuantity;
              const isAtMinQuantity = tool.Quantity <= 1;

              return (
                <div key={tool.id} className="flex items-center justify-between bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors">
                  <span className="flex-grow font-medium">{tool.Tool}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(tool.id, -1)}
                      className={`p-1 hover:bg-gray-200 rounded-full transition-colors ${isAtMinQuantity ? 'opacity-25 cursor-not-allowed' : 'opacity-100'}`}
                      disabled={disabled || isAtMinQuantity}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center bg-white border rounded px-2 py-1">
                      {tool.Quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(tool.id, 1)}
                      className={`p-1 hover:bg-gray-200 rounded-full transition-colors ${isAtMaxQuantity ? 'opacity-25 cursor-not-allowed' : 'opacity-100'}`}
                      disabled={disabled || isAtMaxQuantity}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTool(tool.id)}
                      className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors ml-2"
                      disabled={disabled}
                      aria-label="Remove tool"
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
            className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
            disabled={isLoading || availableTools.length === 0}
          >
            <Plus size={16} className="mr-1" />
            {showDropdown ? 'Close Selection' : 'Add Tool'}
          </button>
        )}

        {error && (
          <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">{error}</div>
        )}

        {showDropdown && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading tools...</div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {filteredTools.length > 0 ? (
                  filteredTools.map(tool => (
                    <div
                      key={tool.id}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      onClick={() => addTool(tool)}
                    >
                      <span>{tool.Tool}</span>
                      <span className="text-xs text-gray-500">Available: {tool.Quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No matching tools found' : 'No additional tools available'}
                  </div>
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
    const baseClasses = "mt-1 block w-full border rounded-md shadow-sm p-3";
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
            error = 'Please select at least one tool';
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
        newErrors.Tools = 'Please select at least one tool';
        isValid = false;
      }
    }

    setErrors(newErrors);
    const allFields = new Set(Object.keys(formData) as Array<keyof FormData>);
    setTouchedFields(allFields);
    return isValid;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-8 text-gray-800 border-b pb-4">Utilization Information</h2>
      
      <div className="space-y-8">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Services to be availed<span className="text-red-500 ml-1">*</span>
          </label>
          
          {isLoadingServices ? (
            <div className="block w-full border rounded-md shadow-sm p-3 bg-gray-50 text-gray-500">
              Loading services...
            </div>
          ) : serviceError ? (
            <div className="block w-full border rounded-md shadow-sm p-3 bg-red-50 text-red-500">
              {serviceError}
            </div>
          ) : (
            <div>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`block w-full border rounded-md shadow-sm p-3 cursor-pointer bg-white flex justify-between items-center ${
                  touchedFields.has('ProductsManufactured') && errors.ProductsManufactured 
                    ? "border-red-500" : "border-gray-300 hover:border-blue-300"
                }`}
              >
                <span>
                  {formData.ProductsManufactured && formData.ProductsManufactured.length > 0
                    ? `${formData.ProductsManufactured.length} service(s) selected`
                    : 'Select services'}
                </span>
                {isDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {services.map((service) => (
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
                  ))}
                </div>
              )}
            </div>
          )}
          
          {touchedFields.has('ProductsManufactured') && errors.ProductsManufactured && (
            <p className="mt-1 text-sm text-red-500">{errors.ProductsManufactured}</p>
          )}

          {formData.ProductsManufactured && formData.ProductsManufactured.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.ProductsManufactured.map(service => (
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

        <div className={`transition-opacity duration-300 ${isFieldDisabled('BulkofCommodity') ? 'opacity-50' : 'opacity-100'}`}>
          <label htmlFor="BulkofCommodity" className="block text-sm font-medium text-gray-700 mb-2">
            Bulk of Commodity per Production (in volume or weight)
            {!isFieldDisabled('BulkofCommodity') && <span className="text-red-500 ml-1">*</span>}
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
            placeholder="e.g. 500 kg, 200 liters"
            required={!isFieldDisabled('BulkofCommodity')}
          />
          {!isFieldDisabled('BulkofCommodity') && touchedFields.has('BulkofCommodity') && errors.BulkofCommodity && (
            <p className="mt-1 text-sm text-red-500">{errors.BulkofCommodity}</p>
          )}
        </div>

        <div className={`transition-opacity duration-300 ${isFieldDisabled('Tools') ? 'opacity-50' : 'opacity-100'}`}>
          <label htmlFor="Tools" className="block text-sm font-medium text-gray-700 mb-2">
            Tools Required
            {!isFieldDisabled('Tools') && <span className="text-red-500 ml-1">*</span>}
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

      <div className="mt-10 pt-6 border-t flex justify-between">
        <button 
          onClick={prevStep} 
          className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors flex items-center"
        >
          <ChevronDown className="rotate-90 mr-2" size={18} />
          Previous
        </button>
        <button 
          onClick={handleNext} 
          className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center"
        >
          Next
          <ChevronDown className="-rotate-90 ml-2" size={18} />
        </button>
      </div>
    </div>
  );
}