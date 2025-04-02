// src/components/admin/time-editor.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronUp, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMinutes, parse, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
  DateStatus?: string | null;
}

interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null; // Time in minutes
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
}

interface MachineUtilization {
  id?: number;
  Machine: string | null;
  ServiceName: string | null;
  DownTimes: DownTime[];
}

interface TimeEditorProps {
  utilTimes: UtilTime[];
  serviceRates: Map<string, number>;
  machineUtilizations?: MachineUtilization[]; // Add machine utilizations
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
  machineUtilizations = [],
  onSave,
  onCancel
}) => {
  // Initialize editedTimes with original times, but formatted for display
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>(
    utilTimes.map(time => ({
      ...time,
      // Keep the original date but format for display
      StartTime: time.StartTime ? time.StartTime : null,
      EndTime: time.EndTime ? time.EndTime : null,
      DateStatus: time.DateStatus || "Ongoing"
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDowntimeMinutes, setTotalDowntimeMinutes] = useState<number>(0);
  const [downtimeDeduction, setDowntimeDeduction] = useState<number>(0);

  // Time status options
  const statusOptions = [
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" }
  ];

  // Calculate total downtime on component mount
  useEffect(() => {
    calculateTotalDowntime();
  }, [machineUtilizations]);

  // Calculate total downtime minutes from machine utilizations
  const calculateTotalDowntime = () => {
    let totalMinutes = 0;
    
    // Sum up all downtime minutes across all machines
    machineUtilizations.forEach(machine => {
      if (machine.DownTimes && Array.isArray(machine.DownTimes)) {
        machine.DownTimes.forEach(downtime => {
          totalMinutes += (downtime.DTTime || 0);
        });
      }
    });
    
    setTotalDowntimeMinutes(totalMinutes);
  };

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

  // Calculate the total minutes between start and end times for active time slots
  const calculateTotalMinutes = (times: UtilTime[]): number => {
    return times.reduce((total, time) => {
      // Don't count cancelled time slots in the total time calculation
      if (time.DateStatus === "Cancelled") return total;
      if (!time.StartTime || !time.EndTime) return total;
      
      const startTime = new Date(time.StartTime);
      const endTime = new Date(time.EndTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return total;
      
      // Calculate minutes difference
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      return total + (diffMinutes > 0 ? diffMinutes : 0);
    }, 0);
  };

  // Calculate the effective minutes after deducting downtime
  const calculateEffectiveMinutes = (times: UtilTime[]): number => {
    const totalMins = calculateTotalMinutes(times);
    // Ensure we don't go below zero
    return Math.max(0, totalMins - totalDowntimeMinutes);
  };

  // Format price to have 2 decimal places and currency symbol
  const formatPrice = (price: number): string => {
    return `₱${price.toFixed(2)}`;
  };

  // Calculate the cost based on updated times, service rates, and downtime
  const calculateUpdatedCost = (): { originalCost: number, adjustedCost: number } => {
    const totalMinutes = calculateTotalMinutes(editedTimes);
    const effectiveMinutes = calculateEffectiveMinutes(editedTimes);
    
    // If we have explicit service rates, use them
    // For simplicity, here we're using a flat rate for all services
    // In a real implementation, you'd calculate based on specific services
    const defaultRatePerMinute = Array.from(serviceRates.values())[0] || 1;
    
    const originalCost = totalMinutes * defaultRatePerMinute;
    const adjustedCost = effectiveMinutes * defaultRatePerMinute;
    
    // Update downtime deduction state
    setDowntimeDeduction(originalCost - adjustedCost);
    
    return { originalCost, adjustedCost };
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
      
      if (!time.StartTime || !time.EndTime) {
        setError("All active time slots must have start and end times set");
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
      const { adjustedCost } = calculateUpdatedCost();
      const totalDuration = calculateTotalMinutes(editedTimes);
      
      // Call the parent's save handler with the downtime-adjusted cost
      await onSave(editedTimes, adjustedCost, totalDuration);
    } catch (err) {
      setError("Failed to save time changes");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate duration for a specific time slot
  const calculateDuration = (time: UtilTime): number => {
    if (time.DateStatus === "Cancelled") return 0;
    if (!time.StartTime || !time.EndTime) return 0;
    
    const startTime = new Date(time.StartTime);
    const endTime = new Date(time.EndTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;
    
    // Calculate minutes difference
    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return diffMinutes > 0 ? diffMinutes : 0;
  };

  // Calculate and display the estimated updated cost
  const { originalCost, adjustedCost } = calculateUpdatedCost();
  const totalDuration = calculateTotalMinutes(editedTimes);
  const effectiveDuration = calculateEffectiveMinutes(editedTimes);

  const renderTimeSlotSummary = () => {
    const ongoingCount = editedTimes.filter(time => 
      time.DateStatus === "Ongoing" || time.DateStatus === null || time.DateStatus === undefined
    ).length;
    
    const completedCount = editedTimes.filter(time => time.DateStatus === "Completed").length;
    const cancelledCount = editedTimes.filter(time => time.DateStatus === "Cancelled").length;
    
    return (
      <div className="my-4 p-3 rounded-lg border">
        <h4 className="font-medium mb-2">Time Slot Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
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
        
        {ongoingCount > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm">
            <AlertCircle className="h-4 w-4 inline mr-1 text-yellow-500" />
            <span>All time slots must be marked as Completed or Cancelled before proceeding to payment.</span>
          </div>
        )}
      </div>
    );
  };

  const renderCostSummary = () => {
    return (
      <div className="my-4 p-3 rounded-lg border">
        <h4 className="font-medium mb-3">Cost Calculation</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Total Duration:</span>
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>
          
          {totalDowntimeMinutes > 0 && (
            <>
              <div className="flex justify-between items-center text-red-600">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center cursor-help">
                        <Clock className="h-4 w-4 mr-1" />
                        Downtime Deduction:
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="p-2 max-w-xs bg-white shadow-lg rounded-md">
                      <div className="text-xs text-gray-800">
                        <p>Downtime is recorded for machines in Machine Utilization records. This time is deducted from the billable duration.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-medium">-{formatDuration(totalDowntimeMinutes)}</span>
              </div>
              
              <div className="flex justify-between items-center text-green-600">
                <span>Effective Duration:</span>
                <span className="font-medium">{formatDuration(effectiveDuration)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between items-center">
                <span>Original Cost:</span>
                <span className={totalDowntimeMinutes > 0 ? "line-through text-gray-500" : "font-medium"}>
                  {formatPrice(originalCost)}
                </span>
              </div>
              
              {totalDowntimeMinutes > 0 && (
                <>
                  <div className="flex justify-between items-center text-red-600">
                    <span>Downtime Deduction:</span>
                    <span className="font-medium">-{formatPrice(downtimeDeduction)}</span>
                  </div>
                
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold">Adjusted Total:</span>
                    <span className="font-bold text-green-600">{formatPrice(adjustedCost)}</span>
                  </div>
                </>
              )}
            </>
          )}
          
          {totalDowntimeMinutes === 0 && (
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">Total Cost:</span>
              <span className="font-bold">{formatPrice(originalCost)}</span>
            </div>
          )}
        </div>
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
      
      {totalDowntimeMinutes > 0 && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <span className="font-medium">{totalDowntimeMinutes} minutes</span> of machine downtime detected. 
            This will be deducted from the billable duration and total cost.
          </AlertDescription>
        </Alert>
      )}
      
      {renderTimeSlotSummary()}
      
      <div className="space-y-4">
        {editedTimes.map((time, index) => {
          const duration = calculateDuration(time);
          const formattedDate = time.StartTime 
            ? format(new Date(time.StartTime), 'MMMM d, yyyy')
            : 'Date not set';
            
          return (
            <div key={index} className="p-3 bg-white rounded-lg border">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Time Slot {index + 1} - {formattedDate}</h4>
                  <p className="text-sm text-gray-500">
                    Duration: {formatDuration(duration)}
                  </p>
                </div>
                <div>
                  <StatusBadge status={time.DateStatus} />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual Start Time</label>
                  <Select
                    value={getTimePartFromDate(time.StartTime)}
                    onValueChange={(value) => handleTimeChange(index, 'StartTime', value)}
                    disabled={time.DateStatus === "Cancelled"}
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
                    disabled={time.DateStatus === "Cancelled"}
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
      
      {renderCostSummary()}
      
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
            {isSubmitting ? 'Saving...' : `Save & Update Cost${totalDowntimeMinutes > 0 ? ' with Downtime' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeEditor;