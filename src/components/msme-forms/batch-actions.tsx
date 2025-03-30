import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DaySelectionData } from './time-machine-card';

interface BatchActionsProps {
  selectedDays: DaySelectionData[];
  onApplyTimeSlots: (startTime: string, endTime: string) => void;
  onApplyMachineQuantity: (quantity: number) => void;
  maxGlobalMachineQuantity: number;
  validationErrors: string[];
}

/**
 * Component for batch applying time slots and machine quantities across all selected days
 */
const BatchActions: React.FC<BatchActionsProps> = ({
  selectedDays,
  onApplyTimeSlots,
  onApplyMachineQuantity,
  maxGlobalMachineQuantity,
  validationErrors
}) => {
  const [useTimeSlots, setUseTimeSlots] = React.useState(false);
  const [useMachineQuantity, setUseMachineQuantity] = React.useState(false);
  const [startTime, setStartTime] = React.useState<string>("");
  const [endTime, setEndTime] = React.useState<string>("");
  const [machineQuantity, setMachineQuantity] = React.useState<number>(1);
  
  // Determine if we can apply time slots (at least one day must be available)
  const canApplyTimeSlots = selectedDays.some(day => day.availableMorning || day.availableAfternoon);
  
  // Generate time options for batch application
  const generateStartTimeOptions = () => {
    const options: string[] = [];
    
    // Morning options (8:00 AM - 11:45 AM)
    for (let hour = 8; hour < 12; hour++) {
      ['00', '15', '30', '45'].forEach(minute => {
        options.push(`${hour}:${minute}`);
      });
    }
    
    // Afternoon options (1:00 PM - 4:45 PM)
    for (let hour = 13; hour < 17; hour++) {
      ['00', '15', '30', '45'].forEach(minute => {
        options.push(`${hour}:${minute}`);
      });
    }
    
    return options;
  };

  const generateEndTimeOptions = () => {
    if (!startTime) return [];
    
    const options: string[] = [];
    
    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(part => parseInt(part));
    
    // Generate end times after start time
    let startMinuteIndex = ['00', '15', '30', '45'].indexOf(startMinute.toString().padStart(2, '0'));
    
    // Start from the next time slot after start time
    for (let hour = startHour; hour <= 17; hour++) {
      // Skip minutes before startMinute in the first hour
      const minutesToUse = hour === startHour ? ['00', '15', '30', '45'].slice(startMinuteIndex + 1) : ['00', '15', '30', '45'];
      
      // Don't include times after 5:00 PM
      if (hour === 17) {
        options.push(`${hour}:00`);
      } else {
        minutesToUse.forEach(minute => {
          options.push(`${hour}:${minute}`);
        });
      }
    }
    
    return options;
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    
    const [hour, minute] = time.split(':').map(part => parseInt(part));
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const amPm = isPM ? 'PM' : 'AM';
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${amPm}`;
  };

  // Handle apply actions
  const handleApplyTimeSlots = () => {
    if (startTime && endTime) {
      onApplyTimeSlots(startTime, endTime);
    }
  };

  const handleApplyMachineQuantity = () => {
    if (machineQuantity > 0) {
      onApplyMachineQuantity(machineQuantity);
    }
  };

  // Handle machine quantity change, ensuring it's within range
  const handleMachineQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setMachineQuantity(Math.min(Math.max(1, value), maxGlobalMachineQuantity));
    }
  };

  const startTimeOptions = generateStartTimeOptions();
  const endTimeOptions = generateEndTimeOptions();

  return (
    <Card className="mb-6 border-blue-200">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Wand2 className="mr-2 h-5 w-5 text-blue-600" />
          Batch Actions
        </h3>
        
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <ul className="list-disc pl-5">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          {/* Time slots batch action */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-time-slots" className="cursor-pointer">
                Use same time slots for all days
              </Label>
              <Switch
                id="use-time-slots"
                checked={useTimeSlots}
                onCheckedChange={setUseTimeSlots}
                disabled={!canApplyTimeSlots}
              />
            </div>
            
            {useTimeSlots && (
              <div className="pl-6 border-l-2 border-blue-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select 
                      value={startTime} 
                      onValueChange={value => {
                        setStartTime(value);
                        setEndTime(""); // Reset end time when start time changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {startTimeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select 
                      value={endTime} 
                      onValueChange={setEndTime}
                      disabled={!startTime}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {endTimeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleApplyTimeSlots}
                  disabled={!startTime || !endTime}
                  variant="outline"
                  size="sm"
                >
                  Apply Time Slots to All Days
                </Button>
                
                <p className="text-xs text-gray-500">
                  This will only apply to days that can accommodate these time slots. Days without availability 
                  for the selected time range will keep their original slots.
                </p>
              </div>
            )}
          </div>
          
          {/* Machine quantity batch action */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-machine-quantity" className="cursor-pointer">
                Use same machine quantity for all days
              </Label>
              <Switch
                id="use-machine-quantity"
                checked={useMachineQuantity}
                onCheckedChange={setUseMachineQuantity}
              />
            </div>
            
            {useMachineQuantity && (
              <div className="pl-6 border-l-2 border-blue-200 space-y-4">
                <div className="space-y-2">
                  <Label>Machine Quantity (Max: {maxGlobalMachineQuantity})</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={1}
                      max={maxGlobalMachineQuantity}
                      value={machineQuantity}
                      onChange={handleMachineQuantityChange}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">machines</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleApplyMachineQuantity}
                  disabled={machineQuantity <= 0}
                  variant="outline"
                  size="sm"
                >
                  Apply Machine Quantity to All Days
                </Button>
                
                <p className="text-xs text-gray-500">
                  This will only apply to days that have sufficient machines available. Days with fewer 
                  available machines will use their maximum available quantity.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchActions;