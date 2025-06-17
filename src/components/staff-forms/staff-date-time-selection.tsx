// src/components/staff-forms/staff-date-time-selection.tsx
// Fixed version with proper time sync functionality

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from 'lucide-react';

interface StaffFormData {
  days: {
    date: Date;
    startTime: string | null;
    endTime: string | null;
  }[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;
}

interface StaffDateTimeSelectionProps {
  formData: StaffFormData;
  setFormData: (updater: (prev: StaffFormData) => StaffFormData) => void;
  nextStep: () => void;
  prevStep: () => void;
  isDateBlocked: (date: Date) => boolean;
}

const MAX_DATES = 5;

// Helper function to convert time string to minutes
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

export default function StaffDateTimeSelection({ 
  formData, 
  setFormData, 
  nextStep, 
  prevStep,
  isDateBlocked
}: StaffDateTimeSelectionProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  const validateTimes = useCallback(() => {
    const newErrors: string[] = [];

    if (formData.days.length === 0) {
      newErrors.push("Please select at least one date");
      return newErrors;
    }

    for (const day of formData.days) {
      const date = new Date(day.date).toDateString();
      // Ensure both start and end times exist
      if (
        day.startTime &&
        day.endTime &&
        day.startTime !== '--:-- AM' &&
        day.endTime !== '--:-- PM'
      ) {
        const startMinutes = timeToMinutes(day.startTime);
        const endMinutes = timeToMinutes(day.endTime);
        
        // Ensure end time is after start time (not equal to it)
        if (endMinutes <= startMinutes) {
          newErrors.push(`End time must be after start time for ${date}`);
        }
      } else {
        newErrors.push(`Please select both start and end times for ${date}`);
      }
    }
    return newErrors;
  }, [formData.days]);

  const handleNext = useCallback(() => {
    const validationErrors = validateTimes();
    setErrors(validationErrors);
    if (validationErrors.length === 0) {
      nextStep();
    }
  }, [validateTimes, nextStep]);

  const addNewDay = useCallback((date: Date) => {
    const clickedDateString = date.toDateString();
    
    setFormData((prevData) => {
      const existingDayIndex = prevData.days.findIndex(
        day => new Date(day.date).toDateString() === clickedDateString
      );
      
      if (existingDayIndex >= 0) {
        const updatedDays = [...prevData.days];
        updatedDays.splice(existingDayIndex, 1);
        return { ...prevData, days: updatedDays };
      }
      
      if (prevData.days.length < MAX_DATES) {
        const newDay = {
          date,
          startTime: prevData.syncTimes ? prevData.unifiedStartTime : null,
          endTime: prevData.syncTimes ? prevData.unifiedEndTime : null
        };

        return { ...prevData, days: [...prevData.days, newDay] };
      }
      
      return prevData;
    });
  }, [setFormData]);

  // Handle unified time changes
  const handleUnifiedTimeChange = useCallback((time: string, field: 'startTime' | 'endTime') => {
    setFormData(prevData => {
      if (field === 'startTime') {
        return {
          ...prevData,
          unifiedStartTime: time,
          days: prevData.syncTimes ? prevData.days.map(day => ({
            ...day,
            startTime: time
          })) : prevData.days
        };
      } else {
        return {
          ...prevData,
          unifiedEndTime: time,
          days: prevData.syncTimes ? prevData.days.map(day => ({
            ...day,
            endTime: time
          })) : prevData.days
        };
      }
    });
  }, [setFormData]);

  // Handle individual time changes
  function handleIndividualTimeChange(time: string, field: 'startTime' | 'endTime', index: number) {
    setEditingDayIndex(index);
    
    setFormData(prev => {
      const newDays = [...prev.days];
      
      if (prev.syncTimes) {
        // In sync mode: update the unified time and all days
        const updatedDays = newDays.map(day => ({
          ...day,
          [field]: time
        }));
        
        return {
          ...prev,
          days: updatedDays,
          [field === 'startTime' ? 'unifiedStartTime' : 'unifiedEndTime']: time
        };
      } else {
        // NON-sync mode: ONLY update the specific day
        newDays[index] = {
          ...newDays[index],
          [field]: time
        };
        
        return {
          ...prev,
          days: newDays
        };
      }
    });
  }

  // Handle sync toggle
  const handleSyncToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSyncState = e.target.checked;
    
    setFormData(prevData => {
      if (prevData.syncTimes === newSyncState) {
        return prevData;
      }
      
      let newStartTime = prevData.unifiedStartTime;
      let newEndTime = prevData.unifiedEndTime;
      
      // When enabling sync
      if (newSyncState) {
        // If unified times aren't set, use the first day's times as default
        if ((!newStartTime || newStartTime === '--:-- AM') && prevData.days.length > 0) {
          newStartTime = prevData.days[0].startTime;
        }
        
        if ((!newEndTime || newEndTime === '--:-- PM') && prevData.days.length > 0) {
          newEndTime = prevData.days[0].endTime;
        }
        
        // Apply unified times to all days
        const updatedDays = prevData.days.map(day => ({
          ...day,
          startTime: newStartTime,
          endTime: newEndTime
        }));
        
        return {
          ...prevData,
          syncTimes: newSyncState,
          unifiedStartTime: newStartTime,
          unifiedEndTime: newEndTime,
          days: updatedDays
        };
      } else {
        // When disabling sync, keep current times for each day
        return {
          ...prevData,
          syncTimes: newSyncState
        };
      }
    });
  }, [setFormData]);

  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);
    
    const minDate = new Date();
    minDate.setDate(today.getDate() + 7);
    
    today.setHours(0, 0, 0, 0);
    oneMonthLater.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);

    if (date < minDate || date > oneMonthLater || date.getDay() === 0 || date.getDay() === 6) {
      return true;
    }

    const dateString = date.toDateString();
    const isAlreadySelected = formData.days.some(day => new Date(day.date).toDateString() === dateString);
    
    return !isAlreadySelected && formData.days.length >= MAX_DATES;
  }, [formData.days]);

  // Clear editing index when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'SELECT' || 
        target.closest('select') || 
        target.closest('.time-picker-container')
      )) {
        return;
      }
      setEditingDayIndex(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Memoize the selected days to prevent unnecessary re-renders
  const selectedDates = useMemo(() => {
    return formData.days.map(day => new Date(day.date));
  }, [formData.days]);
  
  // Memoize the sorted days array to prevent unnecessary re-renders
  const sortedDays = useMemo(() => {
    return [...formData.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [formData.days]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 mt-6 flex-grow"> 
        {/* Calendar Section */}
        <div className="space-y-4 md:space-y-6 h-full">
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200 h-[645px]">
            <h3 className="text-xl font-medium text-gray-800 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" /> Select Available Dates
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click on a date to select it. You can choose up to {MAX_DATES} dates. 
              Staff reservations must be made at least 7 days in advance.
            </p>
            
            <div className="border rounded-lg overflow-hidden p-2 sm:p-4">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(_, selectedDay) => {
                  if (selectedDay) {
                    addNewDay(selectedDay);
                  }
                }}
                disabled={(date) => isDateDisabled(date) || isDateBlocked(date)}
                className="w-full"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-500 flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 mr-2"></div>
              <span>Selected dates ({formData.days.length}/{MAX_DATES})</span>
            </div>
          </div>
        </div>
        
        {/* Time Selection Section */}
        <div className="space-y-4 h-full overflow-hidden">
          {/* Sync times toggle */}
          {formData.days.length >= 2 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center">
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="syncTimes"
                      checked={formData.syncTimes}
                      onChange={handleSyncToggle}
                      className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label
                      htmlFor="syncTimes"
                      className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                    ></label>
                  </div>
                  <label htmlFor="syncTimes" className="text-sm font-medium text-gray-900 ml-1">
                    Use same time for all dates
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unified time selection */}
          {formData.syncTimes && formData.days.length >= 2 && (
            <Card className="border-blue-200 shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">Set Time for All Dates</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <StaffTimePicker
                    required
                    label="Start Time"
                    value={formData.unifiedStartTime}
                    onChange={(time) => handleUnifiedTimeChange(time, 'startTime')}
                  />
                  <StaffTimePicker
                    required
                    label="End Time"
                    value={formData.unifiedEndTime}
                    onChange={(time) => handleUnifiedTimeChange(time, 'endTime')}
                    startTime={formData.unifiedStartTime}
                    isEndTime={true}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected dates */}
          <div className="space-y-4 h-full overflow-hidden">
            {formData.days.length > 0 ? (
              <div className="space-y-4 h-full overflow-hidden">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" /> Selected Dates & Times
                </h3>
                        
                <div className="max-h-[330px] overflow-y-auto">
                  <div className="max-h-full overflow-y-auto pr-2 space-y-3">
                    {sortedDays.map((day, sortedIndex) => {
                      const actualIndex = formData.days.findIndex(d => 
                        new Date(d.date).toISOString() === new Date(day.date).toISOString()
                      );
                      
                      return (
                        <Card key={`day-${new Date(day.date).toISOString()}`} className="bg-white border-gray-200">
                          <CardContent className="p-4">
                            <h4 className="text-md font-semibold text-blue-800 mb-3">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </h4>
                            
                            {!formData.syncTimes || formData.days.length === 1 ? (
                              <div className="grid grid-cols-2 gap-4">
                                <StaffTimePicker
                                  required
                                  label="Start Time"
                                  value={day.startTime}
                                  onChange={(time) => handleIndividualTimeChange(time, 'startTime', actualIndex)}
                                  isEditing={editingDayIndex === actualIndex}
                                  onFocus={() => setEditingDayIndex(actualIndex)}
                                />
                                <StaffTimePicker
                                  required
                                  label="End Time"
                                  value={day.endTime}
                                  onChange={(time) => handleIndividualTimeChange(time, 'endTime', actualIndex)}
                                  startTime={day.startTime}
                                  isEndTime={true}
                                  isEditing={editingDayIndex === actualIndex}
                                  onFocus={() => setEditingDayIndex(actualIndex)}
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md h-full items-center">
                                <div className="pb-1.5 pt-1.5">
                                  <p className="text-sm font-medium text-gray-700">Start Time</p>
                                  <p className="mt-1 text-blue-700">{day.startTime || 'Not set'}</p>
                                </div>
                                <div className="pb-1.5 pt-1.5">
                                  <p className="text-sm font-medium text-gray-700">End Time</p>
                                  <p className="mt-1 text-blue-700">{day.endTime || 'Not set'}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center h-[352px] flex flex-col justify-center">
                <p className="text-gray-500">No dates selected yet</p>
                <p className="text-sm text-gray-400 mt-2">Click on available dates in the calendar</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-600 font-medium mb-1">Please fix the following issues:</h4>
          <ul className="list-disc pl-5 text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="mt-4 flex justify-between">
        <Button
          onClick={prevStep}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          disabled={formData.days.length === 0}
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}

// Fixed TimePicker component for staff use
function StaffTimePicker({
  label,
  value,
  onChange,
  startTime,
  isEndTime = false,
  required = true,
  isEditing = false,
  onFocus = () => {}
}: {
  label: string;
  value: string | null;
  onChange: (time: string) => void;
  startTime?: string | null;
  isEndTime?: boolean;
  required?: boolean;
  isEditing?: boolean;
  onFocus?: () => void;
}) {
  // Parse the current value for initialization
  const parseTimeValue = (val: string | null) => {
    if (!val || val === '--:-- AM' || val === '--:-- PM') {
      return { hour: '--', minute: '--' };
    }
    
    const match = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      const [_, hours, minutes, period] = match;
      const hour = `${hours.padStart(2, '0')} ${period.toUpperCase()}`;
      return { hour, minute: minutes };
    }
    return { hour: '--', minute: '--' };
  };
  
  // Initialize state from parsed value
  const [timeState, setTimeState] = useState(() => parseTimeValue(value));
  const [showError, setShowError] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  
  // Re-sync the local state when prop value changes (for time sync feature)
  useEffect(() => {
    const parsedTime = parseTimeValue(value);
    setTimeState(parsedTime);
  }, [value]);
  
  // Validate time order - end time must be after start time
  const validateTimeOrder = useCallback(() => {
    if (!isEndTime || !startTime || startTime === '--:-- AM' || startTime === '--:-- PM') {
      return false;
    }
    
    const currentTime = timeState.hour === '--' || timeState.minute === '--' 
      ? null 
      : `${timeState.hour.split(' ')[0]}:${timeState.minute} ${timeState.hour.split(' ')[1]}`;
    
    if (!currentTime) return false;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(currentTime);
    
    if (startMinutes === -1 || endMinutes === -1) return false;
    
    // End time must be AFTER start time (not equal)
    return endMinutes <= startMinutes;
  }, [isEndTime, startTime, timeState.hour, timeState.minute]);
  
  // Effect for validation after mount and when dependencies change
  useEffect(() => {
    if (isEndTime && startTime) {
      const invalid = validateTimeOrder();
      setIsInvalid(invalid);
    } else {
      setIsInvalid(false);
    }
  }, [validateTimeOrder, startTime, isEndTime]);
  
  // Focus handler
  const handleFocus = () => {
    onFocus();
  };
  
  // Listen for validation attempts
  useEffect(() => {
    const handleNextClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (
          target.textContent?.includes('Next') || 
          target.textContent?.includes('Continue'))) {
        setHasAttemptedSubmit(true);
      }
    };

    document.addEventListener('click', handleNextClick);
    return () => {
      document.removeEventListener('click', handleNextClick);
    };
  }, []);
  
  // Show error when submit is attempted
  useEffect(() => {
    if (hasAttemptedSubmit) {
      setShowError(required && (timeState.hour === '--' || timeState.minute === '--'));
    }
  }, [hasAttemptedSubmit, required, timeState.hour, timeState.minute]);
  
  // Format time helper
  const formatTime = (hour: string, minute: string): string => {
    if (hour === '--' || minute === '--') return '--:-- AM';
    
    const [hourNum, period] = hour.split(' ');
    const paddedHour = hourNum.padStart(2, '0');
    return `${paddedHour}:${minute} ${period}`;
  };
  
  // Handle hour changes
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    const newState = { ...timeState, hour: newHour };
    setTimeState(newState);
    onFocus();
    
    if (newHour !== '--') {
      // If minute is not set, default to '00'
      const minuteToUse = timeState.minute === '--' ? '00' : timeState.minute;
      if (timeState.minute === '--') {
        setTimeState(prev => ({ ...prev, minute: '00' }));
      }
      
      const formattedTime = formatTime(newHour, minuteToUse);
      onChange(formattedTime);
      
      if (hasAttemptedSubmit) {
        setShowError(false);
      }
    } else {
      onChange('--:-- AM');
      if (hasAttemptedSubmit) {
        setShowError(true);
      }
    }
  };
  
  // Handle minute changes
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    const newState = { ...timeState, minute: newMinute };
    setTimeState(newState);
    onFocus();
    
    if (timeState.hour !== '--' && newMinute !== '--') {
      const formattedTime = formatTime(timeState.hour, newMinute);
      onChange(formattedTime);
      
      if (hasAttemptedSubmit) {
        setShowError(false);
      }
    } else if (newMinute === '--') {
      onChange('--:-- AM');
      if (hasAttemptedSubmit) {
        setShowError(true);
      }
    }
  };
  
  const hours = [
    '--',
    '08 AM', '09 AM', '10 AM', '11 AM', '12 PM',
    '01 PM', '02 PM', '03 PM', '04 PM'
  ];

  const minutes = ['--', '00', '15', '30', '45'];

  const selectClassName = `
    border rounded-md p-2 w-full
    ${isInvalid ? 'border-red-500 bg-red-50' : 
      showError ? 'border-red-500 bg-red-50' : 
      'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}
    transition-colors
  `;

  return (
    <div className="time-picker-container" onFocus={handleFocus} onClick={(e) => e.stopPropagation()}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex space-x-3">
        <select
          className={`${selectClassName} flex-1 h-10`}
          value={timeState.hour}
          onChange={handleHourChange}
          required={required}
        >
          {hours.map(hourValue => (
            <option key={hourValue} value={hourValue}>{hourValue}</option>
          ))}
        </select>

        <select
          className={`${selectClassName} flex-1 h-10`}
          value={timeState.minute}
          onChange={handleMinuteChange}
          required={required}
        >
          {minutes.map(minuteValue => (
            <option key={minuteValue} value={minuteValue}>{minuteValue}</option>
          ))}
        </select>
      </div> 

      <div className="mt-1 min-h-4">
        {isInvalid && (
          <span className="text-red-500 text-xs block">
            End time must be after start time
          </span>
        )}
        {showError && !isInvalid && (
          <span className="text-red-500 text-xs block">
            This field is required
          </span>
        )}
      </div>
    </div>
  );
}