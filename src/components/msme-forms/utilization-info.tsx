import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Plus, Minus, X, ChevronDown, ChevronUp, Check, Loader, AlertCircle, Search } from 'lucide-react';
import { CheckCircle } from 'lucide-react';

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
  className,
  id 
}) => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

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
    // Keep dropdown open for multiple selections
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter' && filteredTools.length > 0) {
      addTool(filteredTools[0]);
    }
  };

  const filteredTools = availableTools
    .filter(tool => !selectedTools.some(st => st.Tool === tool.Tool))
    .filter(tool => tool.Tool.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <div 
        className={`p-4 border rounded-md ${
          disabled ? 'bg-gray-100' : 'bg-white'
        } ${className}`}
      >
        {/* Header with tool count and add button */}
        <div className="flex justify-between items-center mb-3">
          <div className="font-medium text-gray-700">
            {selectedTools.length === 0 ? 'No tools selected' : 
             `${selectedTools.length} tool${selectedTools.length === 1 ? '' : 's'} selected`}
          </div>
          
          {!disabled && (
            <button
              type="button"
              onClick={toggleDropdown}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
              disabled={isLoading || availableTools.length === 0}
            >
              <Plus size={16} className="mr-1" />
              Add Tool
            </button>
          )}
        </div>

        {/* Selected tools list */}
        <div className={`min-h-[100px] ${selectedTools.length > 0 ? 'border rounded-md divide-y' : ''}`}>
          {selectedTools.length === 0 ? (
            <div className="flex items-center justify-center h-24 bg-gray-50 rounded-md border border-dashed border-gray-300">
              <span className="text-gray-500 text-sm">
                {isLoading ? 
                  <div className="flex items-center"><Loader size={16} className="animate-spin mr-2" />Loading tools...</div> : 
                  'Click "Add Tool" to select tools'}
              </span>
            </div>
          ) : (
            <div className="space-y-0">
              {selectedTools.map(tool => {
                const availableTool = availableTools.find(t => t.id === tool.id);
                const maxQuantity = availableTool ? availableTool.Quantity : 1;
                const isAtMaxQuantity = tool.Quantity >= maxQuantity;
                const isAtMinQuantity = tool.Quantity <= 1;

                return (
                  <div key={tool.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <span className="flex-grow font-medium text-gray-700">{tool.Tool}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(tool.id, -1)}
                        className={`p-1.5 hover:bg-gray-200 rounded-md transition-colors ${isAtMinQuantity ? 'opacity-25 cursor-not-allowed' : 'opacity-100'}`}
                        disabled={disabled || isAtMinQuantity}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center bg-white border rounded px-2 py-1">
                        {tool.Quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(tool.id, 1)}
                        className={`p-1.5 hover:bg-gray-200 rounded-md transition-colors ${isAtMaxQuantity ? 'opacity-25 cursor-not-allowed' : 'opacity-100'}`}
                        disabled={disabled || isAtMaxQuantity}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTool(tool.id)}
                        className="p-1.5 hover:bg-red-100 rounded-md text-red-500 transition-colors ml-1"
                        disabled={disabled}
                        aria-label="Remove tool"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">
            <AlertCircle size={16} className="mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropdown for tool selection */}
        {showDropdown && !disabled && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg"
          >
            <div className="p-3 border-b sticky top-0 bg-white z-10">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-3 py-2 border rounded"
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-6 text-center text-gray-500 flex items-center justify-center">
                <Loader size={16} className="animate-spin mr-2" />
                Loading tools...
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {filteredTools.length > 0 ? (
                  filteredTools.map(tool => (
                    <div
                      key={tool.id}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                      onClick={() => addTool(tool)}
                    >
                      <span className="text-gray-800">{tool.Tool}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Available: {tool.Quantity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {searchTerm ? 'No matching tools found' : 'No additional tools available'}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-2 border-t bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
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
      : "border-gray=-300 focus:ring-blue-500 focus:border-blue-500";
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

      {/* Placeholder for second column if needed */}
      <div className="space-y-4 md:space-y-6 h-full">
        {/* You can add additional content or leave empty */}
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