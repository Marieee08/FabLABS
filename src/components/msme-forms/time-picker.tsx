import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from 'lucide-react';

export interface TimeSelectionProps {
  date: Date;
  startTime: string | null;
  endTime: string | null;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  availableMorning: boolean;
  availableAfternoon: boolean;
  disabled?: boolean;
}

/**
 * A component for selecting start and end times with quarterly increments
 */
const TimeSelection: React.FC<TimeSelectionProps> = ({
  date,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  availableMorning,
  availableAfternoon,
  disabled = false
}) => {
  // Generate time options with quarterly increments
  const generateStartTimeOptions = () => {
    const options: string[] = [];
    
    // Morning options (8:00 AM - 11:45 AM)
    if (availableMorning) {
      for (let hour = 8; hour < 12; hour++) {
        ['00', '15', '30', '45'].forEach(minute => {
          options.push(`${hour}:${minute}`);
        });
      }
    }
    
    // Afternoon options (1:00 PM - 4:45 PM)
    if (availableAfternoon) {
      for (let hour = 13; hour < 17; hour++) {
        ['00', '15', '30', '45'].forEach(minute => {
          options.push(`${hour}:${minute}`);
        });
      }
    }
    
    return options;
  };

  const generateEndTimeOptions = () => {
    const options: string[] = [];
    
    if (!startTime) return options;
    
    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(part => parseInt(part));
    
    // Determine if start time is in morning or afternoon
    const isStartMorning = startHour < 12;
    
    // Generate end times after start time
    if (isStartMorning && availableMorning) {
      // Morning options (start time + 15min to 12:00 PM)
      let startMinuteIndex = ['00', '15', '30', '45'].indexOf(startMinute.toString().padStart(2, '0'));
      
      // Loop through remaining morning hours
      for (let hour = startHour; hour <= 12; hour++) {
        // Skip minutes before startMinute in the first hour
        const minutesToUse = hour === startHour ? ['00', '15', '30', '45'].slice(startMinuteIndex + 1) : ['00', '15', '30', '45'];
        
        minutesToUse.forEach(minute => {
          options.push(`${hour}:${minute}`);
        });
      }
    }
    
    if (isStartMorning && availableAfternoon) {
      // Add afternoon options (1:00 PM - 5:00 PM)
      for (let hour = 13; hour <= 17; hour++) {
        ['00', '15', '30', '45'].forEach(minute => {
          // Don't include 5:15, 5:30, 5:45
          if (hour === 17 && minute !== '00') return;
          options.push(`${hour}:${minute}`);
        });
      }
    } else if (!isStartMorning && availableAfternoon) {
      // Afternoon only options (start time + 15min to 5:00 PM)
      let startMinuteIndex = ['00', '15', '30', '45'].indexOf(startMinute.toString().padStart(2, '0'));
      
      // Loop through remaining afternoon hours
      for (let hour = startHour; hour <= 17; hour++) {
        // Skip minutes before startMinute in the first hour
        const minutesToUse = hour === startHour ? ['00', '15', '30', '45'].slice(startMinuteIndex + 1) : ['00', '15', '30', '45'];
        
        // Don't include 5:15, 5:30, 5:45
        if (hour === 17) {
          options.push(`${hour}:00`);
        } else {
          minutesToUse.forEach(minute => {
            options.push(`${hour}:${minute}`);
          });
        }
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

  const startTimeOptions = generateStartTimeOptions();
  const endTimeOptions = generateEndTimeOptions();

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
        </div>

        {!availableMorning && !availableAfternoon ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              No available time slots for this date. Please select a different date.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`start-time-${date.toISOString()}`}>Start Time</Label>
              <Select 
                value={startTime || ""} 
                onValueChange={onStartTimeChange}
                disabled={disabled || (!availableMorning && !availableAfternoon)}
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
              {!availableMorning && (
                <p className="text-xs text-amber-600">Morning unavailable</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`end-time-${date.toISOString()}`}>End Time</Label>
              <Select 
                value={endTime || ""} 
                onValueChange={onEndTimeChange}
                disabled={disabled || !startTime || (!availableMorning && !availableAfternoon)}
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
              {!availableAfternoon && (
                <p className="text-xs text-amber-600">Afternoon unavailable</p>
              )}
            </div>
          </div>
        )}
        
        {startTime && endTime && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Selected time: {formatTimeDisplay(startTime)} - {formatTimeDisplay(endTime)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSelection;