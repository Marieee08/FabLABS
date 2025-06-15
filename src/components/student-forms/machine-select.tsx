// src/components/student-forms/OptimizedMachineSelector.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Machine {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

interface SelectedMachine {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

interface OptimizedMachineSelectorProps {
  selectedService: string;
  availableMachines: Record<string, Machine[]>;
  initialSelectedMachines: SelectedMachine[];
  onMachineSelectionChange: (machines: SelectedMachine[]) => void;
}

const OptimizedMachineSelector: React.FC<OptimizedMachineSelectorProps> = ({
  selectedService,
  availableMachines,
  initialSelectedMachines,
  onMachineSelectionChange
}) => {
  // Use proper state management instead of refs
  const [selectedMachines, setSelectedMachines] = useState<SelectedMachine[]>(initialSelectedMachines || []);
  const [error, setError] = useState<string | null>(null);

  // Sync with parent's initialSelectedMachines when it changes
  useEffect(() => {
    setSelectedMachines(initialSelectedMachines || []);
  }, [initialSelectedMachines]);

  // Clear selections when service changes
  useEffect(() => {
    if (selectedService) {
      // Reset selections when service changes
      setSelectedMachines([]);
      setError(null);
    }
  }, [selectedService]);

  const updateSelectedMachines = useCallback((newMachines: SelectedMachine[]) => {
    setSelectedMachines(newMachines);
    onMachineSelectionChange(newMachines);
    
    // Clear error if we have machines selected
    if (newMachines.length > 0) {
      setError(null);
    }
  }, [onMachineSelectionChange]);

  const handleQuantityChange = useCallback((machine: Machine, newQuantity: number) => {
    if (!selectedService) {
      setError("Please select a service first");
      return;
    }

    // Ensure quantity is within valid bounds
    const clampedQuantity = Math.max(0, Math.min(newQuantity, machine.quantity));
    
    // Get current machines
    const currentMachines = [...selectedMachines];
    
    // Find if machine already exists
    const existingIndex = currentMachines.findIndex(m => m.id === machine.id);
    
    if (existingIndex !== -1) {
      if (clampedQuantity <= 0) {
        // Remove machine if quantity is zero
        currentMachines.splice(existingIndex, 1);
      } else {
        // Update existing machine quantity
        currentMachines[existingIndex] = {
          ...currentMachines[existingIndex],
          quantity: clampedQuantity
        };
      }
    } else if (clampedQuantity > 0) {
      // Add new machine
      currentMachines.push({
        id: machine.id,
        name: machine.name,
        quantity: clampedQuantity,
        description: machine.description
      });
    }
    
    updateSelectedMachines(currentMachines);
  }, [selectedService, selectedMachines, updateSelectedMachines]);

  const removeMachine = useCallback((machineId: string) => {
    const updatedMachines = selectedMachines.filter(m => m.id !== machineId);
    updateSelectedMachines(updatedMachines);
  }, [selectedMachines, updateSelectedMachines]);

  // Get current quantity for a machine
  const getCurrentQuantity = useCallback((machineId: string): number => {
    const selectedMachine = selectedMachines.find(m => m.id === machineId);
    return selectedMachine ? selectedMachine.quantity : 0;
  }, [selectedMachines]);

  // Get the machines for the selected service
  const serviceMachines = selectedService ? (availableMachines[selectedService] || []) : [];
  
  if (!selectedService) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
        Please select a service first to see available equipment
      </div>
    );
  }
  
  if (serviceMachines.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg text-center text-yellow-700">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        No equipment currently available for the selected service
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceMachines.map((machine) => {
          const currentQuantity = getCurrentQuantity(machine.id);
          const maxQuantity = machine.quantity;
          const isMaxReached = currentQuantity >= maxQuantity;
          const isMinReached = currentQuantity <= 0;

          return (
            <div 
              key={machine.id}
              className={`
                border rounded-lg p-4 transition-all duration-200
                ${currentQuantity > 0 
                  ? 'bg-blue-50 border-blue-300 shadow-sm' 
                  : 'bg-white border-gray-300 hover:border-blue-300'}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">{machine.name}</h4>
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {machine.quantity} available
                </div>
              </div>
              
              {machine.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{machine.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(machine, currentQuantity - 1)}
                    disabled={isMinReached}
                    className={`
                      w-8 h-8 rounded border font-medium text-sm transition-colors
                      ${!isMinReached 
                        ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-700' 
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}
                    `}
                    aria-label={`Decrease ${machine.name} quantity`}
                  >
                    −
                  </button>
                  
                  <div className="w-12 text-center">
                    <span className="font-semibold text-gray-800 text-sm">
                      {currentQuantity}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(machine, currentQuantity + 1)}
                    disabled={isMaxReached}
                    className={`
                      w-8 h-8 rounded border font-medium text-sm transition-colors
                      ${!isMaxReached 
                        ? 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700' 
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}
                    `}
                    aria-label={`Increase ${machine.name} quantity`}
                  >
                    +
                  </button>
                </div>
                
                {currentQuantity > 0 && (
                  <div className="text-green-600 flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Selected</span>
                  </div>
                )}
              </div>
              
              {/* Show warning when max reached */}
              {isMaxReached && currentQuantity > 0 && (
                <div className="mt-2 text-xs text-amber-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Maximum quantity reached
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {error && (
        <p className="mt-4 text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {error}
        </p>
      )}
      
      {/* Selected Equipment Summary */}
      {selectedMachines.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3 text-sm">Selected Equipment</h4>
          <div className="space-y-2">
            {selectedMachines.map(machine => (
              <div key={machine.id} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800 text-sm font-medium">
                    {machine.name}
                  </span>
                  <span className="text-gray-500 text-sm">
                    × {machine.quantity}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMachine(machine.id)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                  aria-label={`Remove ${machine.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedMachineSelector;