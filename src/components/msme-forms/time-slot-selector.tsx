// src/components/msme-forms/time-slot-selector.tsx
// This is the standalone TimeSlotSelector component referenced in InteractiveMachineCalendar

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Check, AlertCircle, Calendar } from 'lucide-react';

interface DateTimeSelection {
  date: Date;
  startTime: string | null;
  endTime: string | null;
  slot: 'morning' | 'afternoon' | null;
}

interface TimeSlotSelectorProps {
  selectedDates: Date[];
  selectedService: string;
  machineQuantityNeeded: number;
  machineAvailabilityMap: Record<string, {
    morning: number,
    afternoon: number,
    allDay: number,
    overall: number
  }>;
  onTimeSlotSelect: (dateTimeSelections: DateTimeSelection[]) => void;
  initialSelections?: DateTimeSelection[];
}

const DEFAULT_MORNING_START = "08:00 AM";
const DEFAULT_MORNING_END = "12:00 PM";
const DEFAULT_AFTERNOON_START = "01:00 PM";
const DEFAULT_AFTERNOON_END = "05:00 PM";

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedDates,
  selectedService,
  machineQuantityNeeded,
  machineAvailabilityMap,
  onTimeSlotSelect,
  initialSelections = []
}) => {
  // Initialize state from initial selections or default values
  const [dateTimeSelections, setDateTimeSelections] = useState<DateTimeSelection[]>(
    selectedDates.map(date => {
      // Look for initial value
      const initialSelection = initialSelections.find(
        selection => selection.date.toDateString() === date.toDateString()
      );
      
      if (initialSelection) {
        return initialSelection;
      }
      
      // Default to no selection
      return {
        date,
        startTime: null,
        endTime: null,
        slot: null
      };
    })
  );
  
  // Effect to update selections when selected dates change
  useEffect(() => {
    // Create a map of existing selections
    const existingSelectionsMap = dateTimeSelections.reduce((acc, selection) => {
      acc[selection.date.toDateString()] = selection;
      return acc;
    }, {} as Record<string, DateTimeSelection>);
    
    // Create new array with updated date selections
    const newSelections = selectedDates.map(date => {
      const dateString = date.toDateString();
      
      // Keep existing selection if available
      if (existingSelectionsMap[dateString]) {
        return existingSelectionsMap[dateString];
      }
      
      // Initialize new date
      return {
        date,
        startTime: null,
        endTime: null,
        slot: null
      };
    });
    
    setDateTimeSelections(newSelections);
  }, [selectedDates]);
  
  // Notify parent component when selections change
  useEffect(() => {
    onTimeSlotSelect(dateTimeSelections);
  }, [dateTimeSelections, onTimeSlotSelect]);
  
  // Check if a time slot is available for a date
  const isTimeSlotAvailable = (date: Date, slot: 'morning' | 'afternoon'): boolean => {
    const dateStr = date.toDateString();
    const availability = machineAvailabilityMap[dateStr] || { morning: 0, afternoon: 0 };
    
    return availability[slot] >= machineQuantityNeeded;
  };
  
  // Handle slot selection
  const handleSlotSelect = (dateIndex: number, slot: 'morning' | 'afternoon') => {
    const newSelections = [...dateTimeSelections];
    const currentSelection = newSelections[dateIndex];
    
    // Toggle selection off if already selected
    if (currentSelection.slot === slot) {
      newSelections[dateIndex] = {
        ...currentSelection,
        startTime: null,
        endTime: null,
        slot: null
      };
    } 
    // Set new time slot
    else {
      const startTime = slot === 'morning' ? DEFAULT_MORNING_START : DEFAULT_AFTERNOON_START;
      const endTime = slot === 'morning' ? DEFAULT_MORNING_END : DEFAULT_AFTERNOON_END;
      
      newSelections[dateIndex] = {
        ...currentSelection,
        startTime,
        endTime,
        slot
      };
    }
    
    setDateTimeSelections(newSelections);
  };
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        <p>Select a time slot for each of your chosen dates. Only slots with sufficient machine availability are enabled.</p>
      </div>
      
      {dateTimeSelections.length > 0 ? (
        dateTimeSelections.map((selection, index) => {
          const date = selection.date;
          const morningAvailable = isTimeSlotAvailable(date, 'morning');
          const afternoonAvailable = isTimeSlotAvailable(date, 'afternoon');
          
          return (
            <Card key={date.toISOString()} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800">
                    {date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Time slot selection */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Time Slot:</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Morning slot */}
                      <button
                        type="button"
                        onClick={() => morningAvailable && handleSlotSelect(index, 'morning')}
                        disabled={!morningAvailable}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !morningAvailable 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : selection.slot === 'morning'
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {selection.slot === 'morning' && <Check className="h-4 w-4 mr-1 text-blue-600" />}
                          <span>Morning (8AM-12PM)</span>
                        </div>
                        {!morningAvailable && (
                          <div className="text-xs mt-1 text-red-500">Not available</div>
                        )}
                      </button>
                      
                      {/* Afternoon slot */}
                      <button
                        type="button"
                        onClick={() => afternoonAvailable && handleSlotSelect(index, 'afternoon')}
                        disabled={!afternoonAvailable}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !afternoonAvailable 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : selection.slot === 'afternoon'
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {selection.slot === 'afternoon' && <Check className="h-4 w-4 mr-1 text-blue-600" />}
                          <span>Afternoon (1PM-5PM)</span>
                        </div>
                        {!afternoonAvailable && (
                          <div className="text-xs mt-1 text-red-500">Not available</div>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Time display */}
                  {selection.slot && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Selected Time</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Start Time</p>
                          <p className="font-medium">{selection.startTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">End Time</p>
                          <p className="font-medium">{selection.endTime}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Availability warning if needed */}
                  {!morningAvailable && !afternoonAvailable ? (
                    <div className="mt-2 p-3 bg-red-50 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm text-red-700 font-medium">No Available Time Slots</p>
                          <p className="text-xs text-red-600 mt-1">
                            All machines for this service are fully booked on this date.
                            Please select a different date or contact support.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !selection.slot ? (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                        <p className="text-sm text-yellow-700">
                          Please select a time slot to continue.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No dates selected yet</p>
          <p className="text-sm text-gray-400 mt-2">Select dates from the calendar above</p>
        </div>
      )}
      
      {/* Summary of selections */}
      {dateTimeSelections.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h4 className="text-blue-800 font-medium mb-2">Time Slot Summary</h4>
          <ul className="space-y-2">
            {dateTimeSelections.filter(s => s.slot).map((s, i) => (
              <li key={i} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">{s.date.toLocaleDateString()}</span>
                <span className="mx-2">-</span>
                <span>{s.slot === 'morning' ? 'Morning' : 'Afternoon'}</span>
                <span className="mx-1">:</span>
                <span className="text-gray-600">{s.startTime} - {s.endTime}</span>
              </li>
            ))}
          </ul>
          {dateTimeSelections.some(s => !s.slot) && (
            <p className="text-sm text-yellow-600 mt-2">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {dateTimeSelections.filter(s => !s.slot).length} date(s) still need time slots selected.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;