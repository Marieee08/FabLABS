import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Cpu } from 'lucide-react';

export interface MachineQuantitySelectorProps {
  maxQuantity: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * A component for selecting machine quantity with a slider and numeric input
 */
const MachineQuantitySelector: React.FC<MachineQuantitySelectorProps> = ({
  maxQuantity,
  value,
  onChange,
  disabled = false
}) => {
  // Handle direct input changes (validate that it's a number and within range)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    
    if (isNaN(newValue)) {
      onChange(0);
    } else {
      onChange(Math.min(Math.max(0, newValue), maxQuantity));
    }
  };

  // Handle slider changes
  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center">
        <Cpu className="w-5 h-5 mr-2 text-blue-600" />
        <Label className="text-base font-medium">Machine Quantity</Label>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-grow">
          <Slider
            value={[value]}
            max={maxQuantity}
            step={1}
            onValueChange={handleSliderChange}
            disabled={disabled || maxQuantity === 0}
            className="my-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>Available: {maxQuantity}</span>
          </div>
        </div>
        
        <div className="w-16">
          <Input
            type="number"
            min={0}
            max={maxQuantity}
            value={value}
            onChange={handleInputChange}
            disabled={disabled || maxQuantity === 0}
            className="text-center"
          />
        </div>
      </div>
      
      {maxQuantity === 0 && (
        <p className="text-sm text-red-500">
          No machines available for this time slot.
        </p>
      )}
      
      {value > 0 && (
        <p className="text-sm text-green-600">
          You have selected {value} machine{value !== 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
};

export default MachineQuantitySelector;