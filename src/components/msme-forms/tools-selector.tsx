import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, X, Search, AlertCircle, Loader } from 'lucide-react';

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

export default ToolsSelector;