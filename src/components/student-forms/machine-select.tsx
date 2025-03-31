// src/components/student-forms/OptimizedMachineSelector.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // Use useRef to store the selected machines state to avoid re-renders
  const selectedMachinesRef = useRef<SelectedMachine[]>(initialSelectedMachines || []);
  
  // Local state that we'll use only for forcing re-renders
  const [renderKey, setRenderKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Update the ref when initialSelectedMachines changes
  useEffect(() => {
    selectedMachinesRef.current = initialSelectedMachines || [];
    // Force a re-render
    setRenderKey(prev => prev + 1);
  }, [initialSelectedMachines]);

  const handleMachineSelection = useCallback((machine: Machine, newQuantity: number) => {
    if (!selectedService) {
      setError("Please select a service first");
      return;
    }

    // Get current machines from the ref
    const currentMachines = [...selectedMachinesRef.current];
    
    // Find if machine already exists
    const existingIndex = currentMachines.findIndex(m => m.id === machine.id);
    
    if (existingIndex !== -1) {
      // Update existing machine
      if (newQuantity <= 0) {
        // Remove if quantity is zero
        currentMachines.splice(existingIndex, 1);
      } else {
        // Update quantity
        currentMachines[existingIndex].quantity = newQuantity;
      }
    } else if (newQuantity > 0) {
      // Add new machine
      currentMachines.push({
        id: machine.id,
        name: machine.name,
        quantity: newQuantity,
        description: machine.description
      });
    }
    
    // Update the ref
    selectedMachinesRef.current = currentMachines;
    
    // Call the callback with the new machines array
    onMachineSelectionChange(currentMachines);
    
    // Force a re-render
    setRenderKey(prev => prev + 1);
    
    // Clear error if we have machines selected
    if (currentMachines.length > 0) {
      setError(null);
    }
  }, [selectedService, onMachineSelectionChange]);

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
          // Find the selected machine
          const selectedMachine = selectedMachinesRef.current.find(m => m.id === machine.id);
          const currentQuantity = selectedMachine ? selectedMachine.quantity : 0;
          const maxQuantity = machine.quantity;

          return (
            <div 
              key={machine.id}
              className={`
                border rounded-lg p-4 transition-all duration-200
                ${currentQuantity > 0 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-white border-gray-300 hover:border-blue-300'}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800">{machine.name}</h4>
                <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {machine.quantity} available
                </div>
              </div>
              
              {machine.description && (
                <p className="text-xs text-gray-600 mb-3">{machine.description}</p>
              )}
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleMachineSelection(machine, Math.max(0, currentQuantity - 1))}
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
                  type="button"
                  onClick={() => handleMachineSelection(machine, Math.min(maxQuantity, currentQuantity + 1))}
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
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Selected: {currentQuantity}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {error}
        </p>
      )}
      
      {selectedMachinesRef.current.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Selected Equipment</h4>
          <ul className="space-y-2">
            {selectedMachinesRef.current.map(machine => (
              <li key={machine.id} className="flex items-center justify-between">
                <span className="text-gray-800">
                  {machine.name} <span className="text-gray-500">×{machine.quantity}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleMachineSelection({...machine, quantity: machine.quantity}, 0)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${machine.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OptimizedMachineSelector;