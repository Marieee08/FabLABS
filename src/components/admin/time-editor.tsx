// src/components/admin/time-editor.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes, parse, parseISO } from 'date-fns';

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
}

interface TimeEditorProps {
  utilTimes: UtilTime[];
  serviceRates: Map<string, number>; // Service ID to rate per minute
  onSave: (updatedTimes: UtilTime[], updatedCost: number) => Promise<void>;
  onCancel: () => void;
}

const TimeEditor: React.FC<TimeEditorProps> = ({
  utilTimes,
  serviceRates,
  onSave,
  onCancel
}) => {
  // Initialize editedTimes with original times, but formatted for display
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>(
    utilTimes.map(time => ({
      ...time,
      // Keep the original date but format for display
      StartTime: time.StartTime ? time.StartTime : null,
      EndTime: time.EndTime ? time.EndTime : null
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate time options in 15-minute increments for a 24-hour period
  const generateTimeOptions = () => {
    const options = [];
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 96; i++) { // 24 hours * 4 increments per hour
      const time = addMinutes(startTime, i * 15);
      options.push({
        value: format(time, 'HH:mm'),
        label: format(time, 'h:mm a')
      });
    }
    
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Format a date string to just show the time part in 12-hour format
  const formatTimeForDisplay = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return '';
    }
  };

  // Extract just the time part (HH:mm) from a date string
  const getTimePartFromDate = (dateString: string | null): string => {
    if (!dateString) return '00:00';
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch (error) {
      console.error("Error extracting time part:", error);
      return '00:00';
    }
  };

  // Create a new date with the same day but updated time
  const updateTimeKeepingDate = (originalDateString: string | null, newTimeString: string): string => {
    if (!originalDateString) {
      // If no original date, use today's date with the new time
      const today = new Date();
      const [hours, minutes] = newTimeString.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today.toISOString();
    }
    
    try {
      // Parse the original date
      const originalDate = new Date(originalDateString);
      
      // Parse the new time
      const [hours, minutes] = newTimeString.split(':').map(Number);
      
      // Create a new date with original date but new time
      const updatedDate = new Date(originalDate);
      updatedDate.setHours(hours, minutes, 0, 0);
      
      return updatedDate.toISOString();
    } catch (error) {
      console.error("Error updating time:", error);
      return new Date().toISOString();
    }
  };

  // Calculate the total minutes between start and end times
  const calculateTotalMinutes = (times: UtilTime[]): number => {
    return times.reduce((total, time) => {
      if (!time.StartTime || !time.EndTime) return total;
      
      const startTime = new Date(time.StartTime);
      const endTime = new Date(time.EndTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return total;
      
      // Calculate minutes difference
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      return total + (diffMinutes > 0 ? diffMinutes : 0);
    }, 0);
  };

  // Calculate the cost based on updated times and service rates
  const calculateUpdatedCost = (): number => {
    const totalMinutes = calculateTotalMinutes(editedTimes);
    
    // If we have explicit service rates, use them
    // For simplicity, here we're using a flat rate for all services
    // In a real implementation, you'd calculate based on specific services
    const defaultRatePerMinute = Array.from(serviceRates.values())[0] || 1;
    
    return totalMinutes * defaultRatePerMinute;
  };

  // Format a duration in minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTimeChange = (index: number, field: 'StartTime' | 'EndTime', timeValue: string) => {
    setEditedTimes(prev => {
      const newTimes = [...prev];
      const time = newTimes[index];
      
      // Update the time while keeping the same date
      const updatedDateTime = updateTimeKeepingDate(
        time[field],
        timeValue
      );
      
      newTimes[index] = {
        ...time,
        [field]: updatedDateTime
      };
      
      return newTimes;
    });
    
    // Clear any previous errors
    setError(null);
  };

  const validateTimes = (): boolean => {
    for (const time of editedTimes) {
      if (!time.StartTime || !time.EndTime) {
        setError("All start and end times must be set");
        return false;
      }
      
      const startTime = new Date(time.StartTime);
      const endTime = new Date(time.EndTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        setError("Invalid date format");
        return false;
      }
      
      if (endTime <= startTime) {
        setError("End time must be after start time");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTimes()) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate the updated cost
      const updatedCost = calculateUpdatedCost();
      
      // Format dates back to ISO strings (no changes needed since we're keeping them as ISO strings)
      // Call the parent's save handler
      await onSave(editedTimes, updatedCost);
    } catch (err) {
      setError("Failed to save time changes");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate duration for a specific time slot
  const calculateDuration = (time: UtilTime): number => {
    if (!time.StartTime || !time.EndTime) return 0;
    
    const startTime = new Date(time.StartTime);
    const endTime = new Date(time.EndTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;
    
    // Calculate minutes difference
    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return diffMinutes > 0 ? diffMinutes : 0;
  };

  // Calculate and display the estimated updated cost
  const updatedCost = calculateUpdatedCost();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium text-lg">Update Actual Usage Times</h3>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {editedTimes.map((time, index) => {
          const duration = calculateDuration(time);
          const formattedDate = time.StartTime 
            ? format(new Date(time.StartTime), 'MMMM d, yyyy')
            : 'Date not set';
            
          return (
            <div key={index} className="p-3 bg-white rounded-lg border">
              <div className="mb-2">
                <h4 className="font-medium">Time Slot {index + 1} - {formattedDate}</h4>
                <p className="text-sm text-gray-500">
                  Duration: {formatDuration(duration)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual Start Time</label>
                  <Select
                    value={getTimePartFromDate(time.StartTime)}
                    onValueChange={(value) => handleTimeChange(index, 'StartTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual End Time</label>
                  <Select
                    value={getTimePartFromDate(time.EndTime)}
                    onValueChange={(value) => handleTimeChange(index, 'EndTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
        <p className="font-medium">Updated Cost Estimate: ₱{updatedCost.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Based on actual usage time</p>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save & Update Cost'}
        </Button>
      </div>
    </div>
  );
};

export default TimeEditor;