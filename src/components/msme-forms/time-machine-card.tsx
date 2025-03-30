import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Calendar } from 'lucide-react';
import TimeSelection from './time-picker';
import MachineQuantitySelector from './machine-quantity-selector';

export interface DaySelectionData {
  date: Date;
  startTime: string | null;
  endTime: string | null;
  machineQuantity: number;
  availableMorning: boolean;
  availableAfternoon: boolean;
  maxMachines: number;
}

interface DayTimeMachineCardProps {
  dayData: DaySelectionData;
  onUpdate: (updatedData: DaySelectionData) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * A card component that combines date, time selection, and machine quantity selection
 */
const DayTimeMachineCard: React.FC<DayTimeMachineCardProps> = ({
  dayData,
  onUpdate,
  onRemove,
  disabled = false
}) => {
  const { date, startTime, endTime, machineQuantity, availableMorning, availableAfternoon, maxMachines } = dayData;
  
  // Handle start time change
  const handleStartTimeChange = (newTime: string) => {
    // When start time changes, reset end time
    onUpdate({
      ...dayData,
      startTime: newTime,
      endTime: null
    });
  };
  
  // Handle end time change
  const handleEndTimeChange = (newTime: string) => {
    onUpdate({
      ...dayData,
      endTime: newTime
    });
  };
  
  // Handle machine quantity change
  const handleMachineQuantityChange = (newQuantity: number) => {
    onUpdate({
      ...dayData,
      machineQuantity: newQuantity
    });
  };
  
  // Get availability status text and color
  const getAvailabilityStatus = () => {
    if (availableMorning && availableAfternoon) {
      return { text: "Fully Available", color: "bg-green-100 text-green-800" };
    } else if (availableMorning) {
      return { text: "Morning Only", color: "bg-amber-100 text-amber-800" };
    } else if (availableAfternoon) {
      return { text: "Afternoon Only", color: "bg-amber-100 text-amber-800" };
    } else {
      return { text: "Unavailable", color: "bg-red-100 text-red-800" };
    }
  };

  const availabilityStatus = getAvailabilityStatus();
  
  // Format the date for display
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="mb-6 shadow-sm border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            <CardTitle className="text-lg font-medium">{formattedDate}</CardTitle>
          </div>
          <Badge className={availabilityStatus.color}>
            {availabilityStatus.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Time Selection */}
        <TimeSelection
          date={date}
          startTime={startTime}
          endTime={endTime}
          onStartTimeChange={handleStartTimeChange}
          onEndTimeChange={handleEndTimeChange}
          availableMorning={availableMorning}
          availableAfternoon={availableAfternoon}
          disabled={disabled}
        />
        
        {/* Machine Quantity Selection - only show if times are selected */}
        {startTime && endTime && (
          <MachineQuantitySelector
            maxQuantity={maxMachines}
            value={machineQuantity}
            onChange={handleMachineQuantityChange}
            disabled={disabled}
          />
        )}
        
        {/* Remove button */}
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
            disabled={disabled}
          >
            Remove this date
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DayTimeMachineCard;