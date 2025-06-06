// src/components/admin/time-editor.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes, parse, parseISO } from 'date-fns';

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
  ActualStart: string | null;  // Added actual start time
  ActualEnd: string | null;    // Added actual end time
  DateStatus?: string | null;
}

interface TimeEditorProps {
  utilTimes: UtilTime[];
  serviceRates: Map<string, number>;
  onSave: (updatedTimes: UtilTime[], updatedCost: number, totalDuration: number) => void;
  onCancel: () => void;
}

// Simple inline status badge component
const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  // Determine badge styling based on status
  const getBadgeStyle = (): string => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Ongoing":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getBadgeStyle()}`}>
      {status || "Ongoing"}
    </span>
  );
};

const TimeEditor: React.FC<TimeEditorProps> = ({
  utilTimes,
  serviceRates,
  onSave,
  onCancel
}) => {
  // Initialize editedTimes with original times, including actual times
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>(
    utilTimes.map(time => ({
      ...time,
      // Keep the original scheduled times unchanged
      StartTime: time.StartTime ? time.StartTime : null,
      EndTime: time.EndTime ? time.EndTime : null,
      // Initialize actual times - use existing actual times or default to scheduled times
      ActualStart: time.ActualStart ? time.ActualStart : time.StartTime,
      ActualEnd: time.ActualEnd ? time.ActualEnd : time.EndTime,
      DateStatus: time.DateStatus || "Ongoing"
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time status options
  const statusOptions = [
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" }
  ];

  const validateAllUtilTimesComplete = (utilTimes) => {
    if (!utilTimes || !Array.isArray(utilTimes) || utilTimes.length === 0) {
      return {
        valid: false,
        message: "No time slots found to validate."
      };
    }
    
    const incompleteSlots = utilTimes.filter(
      time => time.DateStatus !== "Completed" && time.DateStatus !== "Cancelled"
    );
    
    if (incompleteSlots.length > 0) {
      return {
        valid: false,
        message: `${incompleteSlots.length} time slot(s) still marked as Ongoing. All time slots must be marked as Completed or Cancelled before proceeding to payment.`
      };
    }
    
    return {
      valid: true,
      message: "All time slots are properly marked."
    };
  };

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

  // Calculate the total minutes between actual start and end times for active time slots
  const calculateTotalMinutes = (times: UtilTime[]): number => {
    return times.reduce((total, time) => {
      // Don't count cancelled time slots in the total time calculation
      if (time.DateStatus === "Cancelled") return total;
      // Use actual times instead of scheduled times
      if (!time.ActualStart || !time.ActualEnd) return total;
      
      const startTime = new Date(time.ActualStart);
      const endTime = new Date(time.ActualEnd);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return total;
      
      // Calculate minutes difference
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      return total + (diffMinutes > 0 ? diffMinutes : 0);
    }, 0);
  };

  // Calculate the cost based on updated actual times and service rates
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

  // Updated to handle actual time changes instead of scheduled times
  const handleTimeChange = (index: number, field: 'ActualStart' | 'ActualEnd', timeValue: string) => {
    setEditedTimes(prev => {
      const newTimes = [...prev];
      const time = newTimes[index];
      
      // Update the actual time while keeping the same date
      // Use the original scheduled time as reference for the date, or the existing actual time
      const referenceDate = time[field] || (field === 'ActualStart' ? time.StartTime : time.EndTime);
      const updatedDateTime = updateTimeKeepingDate(referenceDate, timeValue);
      
      newTimes[index] = {
        ...time,
        [field]: updatedDateTime
      };
      
      return newTimes;
    });
    
    // Clear any previous errors
    setError(null);
  };

  // Handle status change for a time slot
  const handleStatusChange = (index: number, newStatus: string) => {
    setEditedTimes(prev => {
      const newTimes = [...prev];
      newTimes[index] = {
        ...newTimes[index],
        DateStatus: newStatus
      };
      return newTimes;
    });
    
    // Clear any previous errors
    setError(null);
  };

  const validateTimes = (): boolean => {
    for (const time of editedTimes) {
      // Skip validation for cancelled time slots
      if (time.DateStatus === "Cancelled") continue;
      
      // Validate actual times instead of scheduled times
      if (!time.ActualStart || !time.ActualEnd) {
        setError("All active time slots must have actual start and end times set");
        return false;
      }
      
      const startTime = new Date(time.ActualStart);
      const endTime = new Date(time.ActualEnd);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        setError("Invalid date format");
        return false;
      }
      
      if (endTime <= startTime) {
        setError("Actual end time must be after actual start time");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTimes()) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate the updated cost based on actual times
      const updatedCost = calculateUpdatedCost();
      
      // Call the parent's save handler
      await onSave(editedTimes, updatedCost);
    } catch (err) {
      setError("Failed to save time changes");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate duration for a specific time slot using actual times
  const calculateDuration = (time: UtilTime): number => {
    if (time.DateStatus === "Cancelled") return 0;
    // Use actual times for duration calculation
    if (!time.ActualStart || !time.ActualEnd) return 0;
    
    const startTime = new Date(time.ActualStart);
    const endTime = new Date(time.ActualEnd);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;
    
    // Calculate minutes difference
    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return diffMinutes > 0 ? diffMinutes : 0;
  };

  // Calculate scheduled duration for comparison
  const calculateScheduledDuration = (time: UtilTime): number => {
    if (!time.StartTime || !time.EndTime) return 0;
    
    const startTime = new Date(time.StartTime);
    const endTime = new Date(time.EndTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;
    
    // Calculate minutes difference
    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return diffMinutes > 0 ? diffMinutes : 0;
  };

  // Calculate time difference between actual and scheduled
  const calculateTimeDifference = (time: UtilTime): { 
    startDiff: number; 
    endDiff: number; 
    durationDiff: number;
    hasChanges: boolean;
  } => {
    const scheduledDuration = calculateScheduledDuration(time);
    const actualDuration = calculateDuration(time);
    
    let startDiff = 0;
    let endDiff = 0;
    
    // Calculate start time difference in minutes
    if (time.StartTime && time.ActualStart) {
      const scheduledStart = new Date(time.StartTime);
      const actualStart = new Date(time.ActualStart);
      if (!isNaN(scheduledStart.getTime()) && !isNaN(actualStart.getTime())) {
        startDiff = (actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60);
      }
    }
    
    // Calculate end time difference in minutes
    if (time.EndTime && time.ActualEnd) {
      const scheduledEnd = new Date(time.EndTime);
      const actualEnd = new Date(time.ActualEnd);
      if (!isNaN(scheduledEnd.getTime()) && !isNaN(actualEnd.getTime())) {
        endDiff = (actualEnd.getTime() - scheduledEnd.getTime()) / (1000 * 60);
      }
    }
    
    const durationDiff = actualDuration - scheduledDuration;
    const hasChanges = Math.abs(startDiff) > 0 || Math.abs(endDiff) > 0 || Math.abs(durationDiff) > 0;
    
    return { startDiff, endDiff, durationDiff, hasChanges };
  };

  // Format time difference for display
  const formatTimeDifference = (diffMinutes: number): string => {
    if (diffMinutes === 0) return 'No change';
    
    const absMinutes = Math.abs(diffMinutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = Math.round(absMinutes % 60);
    
    let timeStr = '';
    if (hours > 0) {
      timeStr += `${hours}h `;
    }
    if (mins > 0) {
      timeStr += `${mins}m`;
    }
    
    const prefix = diffMinutes > 0 ? '+' : '-';
    return `${prefix}${timeStr.trim()}`;
  };

  // Calculate and display the estimated updated cost
  const updatedCost = calculateUpdatedCost();

  const renderTimeSlotSummary = () => {
    const ongoingCount = editedTimes.filter(time => 
      time.DateStatus === "Ongoing" || time.DateStatus === null || time.DateStatus === undefined
    ).length;
    
    const completedCount = editedTimes.filter(time => time.DateStatus === "Completed").length;
    const cancelledCount = editedTimes.filter(time => time.DateStatus === "Cancelled").length;
    
    // Calculate total changes summary
    const totalScheduledDuration = editedTimes.reduce((sum, time) => sum + calculateScheduledDuration(time), 0);
    const totalActualDuration = editedTimes.reduce((sum, time) => sum + calculateDuration(time), 0);
    const totalDurationDiff = totalActualDuration - totalScheduledDuration;
    const slotsWithChanges = editedTimes.filter(time => calculateTimeDifference(time).hasChanges).length;
    
    return (
      <div className="my-4 p-3 rounded-lg border">
        <h4 className="font-medium mb-3">Time Slot Summary</h4>
        
        {/* Status counts */}
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className={`p-2 rounded-lg ${ongoingCount > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <p className="font-medium">{ongoingCount}</p>
            <p className="text-sm">Ongoing</p>
          </div>
          <div className="p-2 rounded-lg bg-green-100">
            <p className="font-medium">{completedCount}</p>
            <p className="text-sm">Completed</p>
          </div>
          <div className="p-2 rounded-lg bg-red-100">
            <p className="font-medium">{cancelledCount}</p>
            <p className="text-sm">Cancelled</p>
          </div>
        </div>

        {/* Overall time changes summary */}
        {slotsWithChanges > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <h5 className="font-medium text-blue-900 mb-2">Overall Time Changes:</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="text-gray-600">Slots with changes:</span> <span className="font-medium">{slotsWithChanges}</span></p>
                <p><span className="text-gray-600">Scheduled total:</span> <span className="font-medium">{formatDuration(totalScheduledDuration)}</span></p>
              </div>
              <div>
                <p><span className="text-gray-600">Actual total:</span> <span className="font-medium">{formatDuration(totalActualDuration)}</span></p>
                <p>
                  <span className="text-gray-600">Net change:</span> 
                  <span className={`font-medium ml-1 ${totalDurationDiff > 0 ? 'text-orange-600' : totalDurationDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatTimeDifference(totalDurationDiff)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {ongoingCount > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm">
            <AlertCircle className="h-4 w-4 inline mr-1 text-yellow-500" />
            <span>All time slots must be marked as Completed or Cancelled before proceeding to payment.</span>
          </div>
        )}
      </div>
    );
  };

  const markAllSlotsCompleted = () => {
    setEditedTimes(prev => prev.map(time => ({
      ...time,
      DateStatus: time.DateStatus === "Cancelled" ? "Cancelled" : "Completed"
    })));
    setError(null);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium text-lg">Update Actual Usage Times</h3>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {renderTimeSlotSummary()}
      
      <div className="space-y-4">
        {editedTimes.map((time, index) => {
          const duration = calculateDuration(time);
          const scheduledDuration = calculateScheduledDuration(time);
          const timeDiff = calculateTimeDifference(time);
          
          // Use actual start time for date display, fallback to scheduled start time
          const displayDate = time.ActualStart || time.StartTime;
          const formattedDate = displayDate 
            ? format(new Date(displayDate), 'MMMM d, yyyy')
            : 'Date not set';
            
          return (
            <div key={index} className="p-3 bg-white rounded-lg border">
              <div className="mb-3 flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Time Slot {index + 1} - {formattedDate}</h4>
                  
                  {/* Time comparison section */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="space-y-1">
                      <p className="text-gray-600 font-medium">Scheduled Times:</p>
                      <p className="text-gray-700">
                        {time.StartTime ? format(new Date(time.StartTime), 'h:mm a') : 'Not set'} - {' '}
                        {time.EndTime ? format(new Date(time.EndTime), 'h:mm a') : 'Not set'}
                      </p>
                      <p className="text-gray-600">Duration: {formatDuration(scheduledDuration)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-gray-600 font-medium">Actual Times:</p>
                      <p className="text-gray-700">
                        {time.ActualStart ? format(new Date(time.ActualStart), 'h:mm a') : 'Not set'} - {' '}
                        {time.ActualEnd ? format(new Date(time.ActualEnd), 'h:mm a') : 'Not set'}
                      </p>
                      <p className="text-gray-600">Duration: {formatDuration(duration)}</p>
                    </div>
                  </div>

                  {/* Changes indicator */}
                  {timeDiff.hasChanges && time.DateStatus !== "Cancelled" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <h5 className="font-medium text-blue-900 mb-2">Changes Made:</h5>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Start Time:</span>
                          <p className={`${timeDiff.startDiff > 0 ? 'text-orange-600' : timeDiff.startDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {formatTimeDifference(timeDiff.startDiff)}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">End Time:</span>
                          <p className={`${timeDiff.endDiff > 0 ? 'text-orange-600' : timeDiff.endDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {formatTimeDifference(timeDiff.endDiff)}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Duration:</span>
                          <p className={`font-medium ${timeDiff.durationDiff > 0 ? 'text-orange-600' : timeDiff.durationDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {formatTimeDifference(timeDiff.durationDiff)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700">
                          <span className="text-orange-600">+</span> = Later/Longer than scheduled | 
                          <span className="text-green-600 ml-1">-</span> = Earlier/Shorter than scheduled
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No changes indicator */}
                  {!timeDiff.hasChanges && time.DateStatus !== "Cancelled" && time.ActualStart && time.ActualEnd && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                      <p className="text-green-700 text-sm font-medium">✓ Times match scheduled times exactly</p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4">
                  <StatusBadge status={time.DateStatus} />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual Start Time</label>
                  <Select
                    value={getTimePartFromDate(time.ActualStart)}
                    onValueChange={(value) => handleTimeChange(index, 'ActualStart', value)}
                    disabled={time.DateStatus === "Cancelled"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select actual start time" />
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
                    value={getTimePartFromDate(time.ActualEnd)}
                    onValueChange={(value) => handleTimeChange(index, 'ActualEnd', value)}
                    disabled={time.DateStatus === "Cancelled"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select actual end time" />
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
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={time.DateStatus || "Ongoing"}
                    onValueChange={(value) => handleStatusChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
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
      
      <div className="flex flex-col gap-4">
        {/* Add a warning if there are ongoing time slots */}
        {editedTimes.some(time => time.DateStatus === "Ongoing" || time.DateStatus === null || time.DateStatus === undefined) && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 flex justify-between items-center">
              <span>Some time slots are still marked as Ongoing</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllSlotsCompleted}
                disabled={isSubmitting}
                className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark All as Completed
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
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
    </div>
  );
};

export default TimeEditor;