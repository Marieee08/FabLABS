// src/components/msme-forms/per-day-time-selector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Check, AlertCircle, Calendar } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import moment from 'moment';

interface TimeSlot {
  id: number;
  dayNum?: number;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
}

interface Reservation {
  id: string;
  date: string;
  machines: string[];
  timeSlots: TimeSlot[];
  status: string;
  type: 'utilization' | 'evc';
}

interface Machine {
  id: string;
  Machine: string;
  isAvailable: boolean;
  Number?: number;
}

interface TimeSlotAvailability {
  morning: boolean; // 8 AM - 12 PM
  afternoon: boolean; // 1 PM - 5 PM
}

interface DayTimeSelection {
  date: Date;
  startTime: string | null;
  endTime: string | null;
  availableSlots: TimeSlotAvailability;
}

interface PerDayTimeSlotSelectorProps {
  selectedDates: Date[];
  selectedService: string;
  machineQuantityNeeded: number;
  machinesForService: Machine[];
  reservations: Reservation[];
  onChange: (updatedDays: DayTimeSelection[]) => void;
  initialTimes?: { [dateString: string]: { startTime: string | null; endTime: string | null } };
}

// Constants for time slots
const MORNING_START = 8; // 8 AM
const MORNING_END = 12; // 12 PM
const AFTERNOON_START = 13; // 1 PM
const AFTERNOON_END = 17; // 5 PM

// Available time slots
const morningTimeSlots = {
  start: ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"],
  end: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"]
};

const afternoonTimeSlots = {
  start: ["01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
  end: ["02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]
};

// Helper to convert time strings to minutes
const timeToMinutes = (timeString: string | null): number => {
  if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') return -1;
  
  const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) return -1;
  
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  
  // Convert to 24-hour format for proper comparison
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return hour * 60 + parseInt(minutes);
};

const PerDayTimeSlotSelector: React.FC<PerDayTimeSlotSelectorProps> = ({ 
  selectedDates,
  selectedService,
  machineQuantityNeeded,
  machinesForService,
  reservations,
  onChange,
  initialTimes = {}
}) => {
  const [dayTimeSelections, setDayTimeSelections] = useState<DayTimeSelection[]>([]);
  
  // Initialize day time selections based on selected dates and check availability
  useEffect(() => {
    if (!selectedDates.length || !machinesForService.length) return;
    
    const newDayTimeSelections: DayTimeSelection[] = selectedDates.map(date => {
      const dateString = date.toDateString();
      const initialTimeData = initialTimes[dateString];
      
      // Check time slot availability for this date
      const slotAvailability = checkTimeSlotAvailability(date);
      
      return {
        date,
        startTime: initialTimeData?.startTime || null,
        endTime: initialTimeData?.endTime || null,
        availableSlots: slotAvailability
      };
    });
    
    setDayTimeSelections(newDayTimeSelections);
    
    // Call onChange with the initial data
    onChange(newDayTimeSelections);
  }, [selectedDates, machinesForService, reservations, selectedService, machineQuantityNeeded]);
  
  // Check time slot availability for a specific date
  const checkTimeSlotAvailability = (date: Date): TimeSlotAvailability => {
    const dateString = date.toDateString();
    
    // Get reservations for this date that use machines from our service
    const dateReservations = reservations.filter(reservation => {
      // Check if reservation is for this date
      let reservationDate = '';
      
      if (reservation.timeSlots && reservation.timeSlots.length > 0 && reservation.timeSlots[0].startTime) {
        reservationDate = new Date(reservation.timeSlots[0].startTime).toDateString();
      } else if (reservation.date) {
        reservationDate = new Date(reservation.date).toDateString();
      }
      
      if (reservationDate !== dateString) return false;
      
      // Check if reservation involves any machines from our service
      return reservation.machines.some(machineName => 
        machinesForService.some(m => m.id === machineName || m.Machine === machineName)
      );
    });
    
    // Track machine usage by specific time slots for more granular availability
    const hourlyUsage: Record<number, number> = {};
    
    // Initialize hourly usage for the full day (8AM to 5PM)
    for (let hour = 8; hour <= 17; hour++) {
      hourlyUsage[hour] = 0;
    }
    
    // Process each reservation to update hourly usage
    dateReservations.forEach(reservation => {
      // Count reserved machines for this service
      const reservedServiceMachines = reservation.machines.filter(machineName => 
        machinesForService.some(m => m.id === machineName || m.Machine === machineName)
      );
      
      const reservedMachineCount = reservedServiceMachines.length;
      
      // Process reservation time slots
      if (reservation.timeSlots && reservation.timeSlots.length > 0) {
        reservation.timeSlots.forEach(slot => {
          if (slot.startTime && slot.endTime) {
            const startTime = new Date(slot.startTime);
            const endTime = new Date(slot.endTime);
            
            // Get start and end hours in 24-hour format
            let startHour = startTime.getHours();
            let endHour = endTime.getHours();
            
            // Make sure we're only considering business hours (8AM-5PM)
            startHour = Math.max(8, startHour);
            endHour = Math.min(17, endHour);
            
            // Update machine usage for each hour in the reservation
            for (let hour = startHour; hour <= endHour; hour++) {
              hourlyUsage[hour] += reservedMachineCount;
            }
          }
        });
      } else {
        // If no time slots specified, assume all day (8AM-5PM)
        for (let hour = 8; hour <= 17; hour++) {
          hourlyUsage[hour] += reservedMachineCount;
        }
      }
    });
    
    // Calculate total machines available for service
    const totalMachinesForService = machinesForService.reduce(
      (sum, machine) => sum + (machine.Number || 1), 0
    );
    
    // Check if morning slots (8AM-12PM) have enough available machines
    let morningAvailable = true;
    for (let hour = 8; hour < 12; hour++) {
      if (totalMachinesForService - hourlyUsage[hour] < machineQuantityNeeded) {
        morningAvailable = false;
        break;
      }
    }
    
    // Check if afternoon slots (1PM-5PM) have enough available machines
    let afternoonAvailable = true;
    for (let hour = 13; hour <= 17; hour++) {
      if (totalMachinesForService - hourlyUsage[hour] < machineQuantityNeeded) {
        afternoonAvailable = false;
        break;
      }
    }
    
    return {
      morning: morningAvailable,
      afternoon: afternoonAvailable
    };
  };
  
  // Handle time selection changes
  const handleTimeChange = (dateIndex: number, type: 'startTime' | 'endTime', value: string) => {
    const newSelections = [...dayTimeSelections];
    newSelections[dateIndex][type] = value;
    
    // If we have both times, ensure start time is before end time
    if (newSelections[dateIndex].startTime && newSelections[dateIndex].endTime) {
      const startMinutes = timeToMinutes(newSelections[dateIndex].startTime);
      const endMinutes = timeToMinutes(newSelections[dateIndex].endTime);
      
      if (endMinutes <= startMinutes) {
        // If end time is before or equal to start time, reset end time
        toast({
          title: "Invalid time selection",
          description: "End time must be after start time",
          variant: "destructive",
        });
        newSelections[dateIndex].endTime = null;
      }
      
      // Validate that selected times don't cross from morning to afternoon
      // if only one of those periods is available
      else {
        const startHour = Math.floor(startMinutes / 60);
        const endHour = Math.floor(endMinutes / 60);
        
        const isMorningOnly = newSelections[dateIndex].availableSlots.morning && 
                             !newSelections[dateIndex].availableSlots.afternoon;
        
        const isAfternoonOnly = !newSelections[dateIndex].availableSlots.morning && 
                               newSelections[dateIndex].availableSlots.afternoon;
        
        // Check if time slot crosses from morning to afternoon when only one is available
        if ((isMorningOnly && endHour >= 13) || (isAfternoonOnly && startHour < 12)) {
          toast({
            title: "Invalid time selection",
            description: "Selected time range includes unavailable time slots",
            variant: "destructive",
          });
          
          if (type === 'startTime') {
            newSelections[dateIndex].startTime = null;
          } else {
            newSelections[dateIndex].endTime = null;
          }
        }
      }
    }
    
    setDayTimeSelections(newSelections);
    onChange(newSelections);
  };
  
  const getTimeOptions = (dateIndex: number, type: 'startTime' | 'endTime') => {
    const { availableSlots } = dayTimeSelections[dateIndex];
    
    // If no slots are available, return empty array
    if (!availableSlots.morning && !availableSlots.afternoon) {
      return [];
    }
    
    let options: string[] = [];
    
    // Add morning time slots if available
    if (availableSlots.morning) {
      options = options.concat(type === 'startTime' ? morningTimeSlots.start : morningTimeSlots.end);
    }
    
    // Add afternoon time slots if available
    if (availableSlots.afternoon) {
      options = options.concat(type === 'startTime' ? afternoonTimeSlots.start : afternoonTimeSlots.end);
    }
    
    // If we're selecting an end time, filter based on start time
    if (type === 'endTime' && dayTimeSelections[dateIndex].startTime) {
      const startMinutes = timeToMinutes(dayTimeSelections[dateIndex].startTime);
      options = options.filter(time => timeToMinutes(time) > startMinutes);
    }
    
    return options;
  };
  
  const isTimeSelectDisabled = (dateIndex: number) => {
    const { availableSlots } = dayTimeSelections[dateIndex];
    return !availableSlots.morning && !availableSlots.afternoon;
  };
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        <p>Select start and end times for each of your chosen dates. Only time slots with sufficient machine availability are shown.</p>
      </div>
      
      {dayTimeSelections.map((daySelection, index) => (
        <Card key={daySelection.date.toISOString()} className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">
                {moment(daySelection.date).format('dddd, MMMM D, YYYY')}
              </h3>
              
              {isTimeSelectDisabled(index) ? (
                <div className="flex items-center text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  No machine availability
                </div>
              ) : (
                daySelection.startTime && daySelection.endTime ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <Check className="h-4 w-4 mr-1.5" />
                    Time selected
                  </div>
                ) : (
                  <div className="flex items-center text-blue-600 text-sm">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Select time
                  </div>
                )
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Available time slots indicators */}
              <div className="col-span-2 mb-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className={`px-2 py-1 rounded ${daySelection.availableSlots.morning 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-400 line-through'}`}>
                    Morning (8AM-12PM)
                  </div>
                  <div className={`px-2 py-1 rounded ${daySelection.availableSlots.afternoon 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-400 line-through'}`}>
                    Afternoon (1PM-5PM)
                  </div>
                </div>
              </div>
              
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <select
                  value={daySelection.startTime || ''}
                  onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    isTimeSelectDisabled(index) 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'bg-white'
                  }`}
                  disabled={isTimeSelectDisabled(index)}
                >
                  <option value="">Select Start Time</option>
                  {getTimeOptions(index, 'startTime').map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <select
                  value={daySelection.endTime || ''}
                  onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    isTimeSelectDisabled(index) || !daySelection.startTime
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'bg-white'
                  }`}
                  disabled={isTimeSelectDisabled(index) || !daySelection.startTime}
                >
                  <option value="">Select End Time</option>
                  {getTimeOptions(index, 'endTime').map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {dayTimeSelections.length === 0 && (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No dates selected yet</p>
          <p className="text-sm text-gray-400 mt-2">Select dates from the calendar above</p>
        </div>
      )}
    </div>
  );
};

export default PerDayTimeSlotSelector;