'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { FormData } from './schedule';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from 'lucide-react';

interface DateTimeSelectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  nextStep: () => void;
  isDateBlocked: (date: Date) => boolean;
}

const MAX_DATES = 5;

// Helper functions
const timeToMinutes = (timeString: string | null): number => {
  if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') return -1;
  const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) return -1;
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + parseInt(minutes);
};

function formatTime(hour: string, minute: string): string {
  const [hourNum, period] = hour.split(' ');
  const paddedHour = hourNum.padStart(2, '0');
  return `${paddedHour}:${minute} ${period}`;
}

export default function DateTimeSelection({ formData, setFormData, nextStep, isDateBlocked }: DateTimeSelectionProps) {
  const [errors, setErrors] = useState<string[]>([]);
  // Track which individual day is being edited to prevent propagation to other days
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  const validateTimes = () => {
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
        // Ensure end time is after start time
        if (endMinutes <= startMinutes) {
          newErrors.push(`End time must be after start time for ${date}`);
        }
      } else {
        newErrors.push(`Please select both start and end times for ${date}`);
      }
    }
    return newErrors;
  };

  const handleNext = () => {
    const validationErrors = validateTimes();
    setErrors(validationErrors);
   
    if (validationErrors.length === 0) {
      nextStep();
    }
  };

  const addNewDay = (date: Date) => {
    const clickedDateString = date.toDateString();
    const existingDayIndex = formData.days.findIndex(
      day => new Date(day.date).toDateString() === clickedDateString
    );
    
    setFormData((prevData) => {
      // If date already exists, remove it
      if (existingDayIndex >= 0) {
        const updatedDays = [...prevData.days];
        updatedDays.splice(existingDayIndex, 1);
        return {
          ...prevData,
          days: updatedDays,
        };
      }
      
      // Add date only if under MAX_DATES limit
      if (prevData.days.length < MAX_DATES) {
        // When sync is enabled, use the unified times for new dates
        const newDay = {
          date,
          startTime: prevData.syncTimes ? prevData.unifiedStartTime : null,
          endTime: prevData.syncTimes ? prevData.unifiedEndTime : null
        };

        return {
          ...prevData,
          days: [...prevData.days, newDay],
        };
      }
      
      return prevData;
    });
  };

  // Handle unified time changes
  const handleUnifiedTimeChange = (time: string, field: 'startTime' | 'endTime') => {
    setFormData(prevData => {
      // Only update the unified time field without automatically propagating to individual days
      if (field === 'startTime') {
        return {
          ...prevData,
          unifiedStartTime: time,
          // When sync is on, also update all days
          days: prevData.syncTimes ? prevData.days.map(day => ({
            ...day,
            startTime: time
          })) : prevData.days
        };
      } else {
        return {
          ...prevData,
          unifiedEndTime: time,
          // When sync is on, also update all days
          days: prevData.syncTimes ? prevData.days.map(day => ({
            ...day,
            endTime: time
          })) : prevData.days
        };
      }
    });
  };

  // Handle individual time changes - fixed to prevent unwanted propagation
  const handleIndividualTimeChange = (time: string, field: 'startTime' | 'endTime', index: number) => {
    setEditingDayIndex(index);
    
    setFormData(prevData => {
      const updatedDays = [...prevData.days];
      
      if (prevData.syncTimes) {
        // If sync is enabled, update all days AND the unified time
        updatedDays.forEach(day => {
          day[field] = time;
        });
        
        return {
          ...prevData,
          [field === 'startTime' ? 'unifiedStartTime' : 'unifiedEndTime']: time,
          days: updatedDays
        };
      } else {
        // If sync is disabled, update only the selected day
        updatedDays[index] = {
          ...updatedDays[index],
          [field]: time
        };
        
        return {
          ...prevData,
          days: updatedDays
        };
      }
    });
  };

  // Handle sync toggle with improved logic
  const handleSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSyncState = e.target.checked;
    
    setFormData(prevData => {
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
      }
      
      // When disabling sync, keep current times but don't auto-propagate changes
      return {
        ...prevData,
        syncTimes: newSyncState,
        unifiedStartTime: newStartTime,
        unifiedEndTime: newEndTime
      };
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);
    today.setHours(0, 0, 0, 0);
    oneMonthLater.setHours(0, 0, 0, 0);

    if (date < today || date > oneMonthLater || date.getDay() === 0 || date.getDay() === 6) {
      return true;
    }

    const dateString = date.toDateString();
    const isAlreadySelected = formData.days.some(day => new Date(day.date).toDateString() === dateString);
    
    return !isAlreadySelected && formData.days.length >= MAX_DATES;
  };

  // Clear editing index when switching away
  useEffect(() => {
    return () => {
      setEditingDayIndex(null);
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
      {/* Calendar and Error Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 mt-6 flex-grow"> 
        <div className="space-y-4 md:space-y-6 h-full">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200 h-[645px]">
            <h3 className="text-xl font-medium text-gray-800 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" /> Select Available Dates
            </h3>
            <p className="text-sm text-gray-600 mb-4">Click on a date to select it. You can choose up to {MAX_DATES} dates.</p>
            
            <div className="border rounded-lg overflow-hidden p-2 sm:p-4">
              <Calendar
                mode="multiple"
                selected={formData.days.map(day => new Date(day.date))}
                onSelect={(_, selectedDay) => {
                  if (selectedDay) {
                    addNewDay(selectedDay);
                  }
                }}
                disabled={(date) => isDateDisabled(date) || isDateBlocked(date)}
                className="w-full"
                styles={{
                  day: { width: 'auto', height: 'auto', minWidth: '2rem', minHeight: '2rem' },
                  head_cell: { width: 'auto', paddingBottom: '0.5rem' },
                  table: { width: '100%', tableLayout: 'fixed', borderSpacing: '0.25rem', borderCollapse: 'separate' },
                  cell: { padding: '0.1rem' },
                  nav_button: { width: 'auto', height: 'auto', padding: '0.25rem' }
                }}
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-500 flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 mr-2"></div>
              <span>Selected dates ({formData.days.length}/{MAX_DATES})</span>
            </div>
            
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
              <span>Unavailable (weekends, past dates, or blocked)</span>
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
                  <TimePicker
                    required
                    label="Start Time"
                    value={formData.unifiedStartTime}
                    onChange={(time) => handleUnifiedTimeChange(time, 'startTime')}
                  />
                  <TimePicker
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
                    {[...formData.days]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((day, index) => (
                        <Card key={new Date(day.date).toISOString()} className="bg-white border-gray-200">
                        <CardContent className="p-4">
                          <h4 className="text-md font-semibold text-blue-800 mb-3">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </h4>
                          
                          {!formData.syncTimes ? (
                            <div className="grid grid-cols-2 gap-4">
                              <TimePicker
                                required
                                label="Start Time"
                                value={day.startTime}
                                onChange={(time) => handleIndividualTimeChange(time, 'startTime', index)}
                                isEditing={editingDayIndex === index}
                                onFocus={() => setEditingDayIndex(index)}
                              />
                              <TimePicker
                                required
                                label="End Time"
                                value={day.endTime}
                                onChange={(time) => handleIndividualTimeChange(time, 'endTime', index)}
                                startTime={day.startTime}
                                isEndTime={true}
                                isEditing={editingDayIndex === index}
                                onFocus={() => setEditingDayIndex(index)}
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
                      ))}
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
      <div className="mt-4 flex justify-end">  {/* Reduced margin */}
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

// TimePicker Component - Improved to prevent cascading validation errors
function TimePicker({
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
  const timePickerRef = React.useRef<HTMLDivElement>(null);
  const [showError, setShowError] = React.useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
  const [isInvalid, setIsInvalid] = React.useState(false);
  const hasRendered = React.useRef(false);

  // Parse the incoming time value
  const parseTime = (timeString: string | null): { hour: string; minute: string } => {
    if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') {
      return { hour: '--', minute: '--' };
    }
   
    const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
    if (match) {
      const [_, hours, minutes, period] = match;
      const hour = `${hours.padStart(2, '0')} ${period}`;
      return { hour, minute: minutes };
    }
    return { hour: '--', minute: '--' };
  };

  // Local state for hour and minute values
  const [localHour, setLocalHour] = React.useState<string>(() => parseTime(value).hour);
  const [localMinute, setLocalMinute] = React.useState<string>(() => parseTime(value).minute);

  // Listen for validation attempts from parent
  React.useEffect(() => {
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

  // Validate time order only when relevant
  const validateTimeOrder = React.useCallback((currentTime: string) => {
    if (!isEndTime || !startTime) return false;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(currentTime);
   
    if (startMinutes === -1 || endMinutes === -1) return false;
    return endMinutes <= startMinutes;
  }, [isEndTime, startTime]);

  // Focus handler to indicate which time picker is being edited
  const handleFocus = () => {
    onFocus();
  };

  // Listen for parent validation triggers
  React.useEffect(() => {
    if (hasAttemptedSubmit) {
      setShowError(required && (localHour === '--' || localMinute === '--'));
    }
  }, [hasAttemptedSubmit, required, localHour, localMinute]);

  // Handle hour changes with validation
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    setLocalHour(newHour);
    
    onFocus(); // Set this time picker as being edited
    
    if (newHour !== '--') {
      // If minute is not set, default to '00'
      const minuteToUse = localMinute === '--' ? '00' : localMinute;
      setLocalMinute(minuteToUse);
      
      const formattedTime = formatTime(newHour, minuteToUse);
      const newIsInvalid = validateTimeOrder(formattedTime);
      setIsInvalid(newIsInvalid);
      
      if (!newIsInvalid) {
        onChange(formattedTime);
      }
      
      if (hasAttemptedSubmit) {
        setShowError(false);
      }
    } else {
      setIsInvalid(false);
      onChange('--:-- AM');
      if (hasAttemptedSubmit) {
        setShowError(true);
      }
    }
  };

  // Handle minute changes with validation
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    setLocalMinute(newMinute);
    
    onFocus(); // Set this time picker as being edited
    
    if (localHour !== '--' && newMinute !== '--') {
      const formattedTime = formatTime(localHour, newMinute);
      const newIsInvalid = validateTimeOrder(formattedTime);
      setIsInvalid(newIsInvalid);
      
      if (!newIsInvalid) {
        onChange(formattedTime);
      }
      
      if (hasAttemptedSubmit) {
        setShowError(false);
      }
    } else if (newMinute === '--') {
      setIsInvalid(false);
      onChange('--:-- AM');
      if (hasAttemptedSubmit) {
        setShowError(true);
      }
    }
  };

  // Sync with parent value changes, but only when not actively editing
  React.useEffect(() => {
    if (hasRendered.current && !isEditing && value) {
      const parsed = parseTime(value);
      setLocalHour(parsed.hour);
      setLocalMinute(parsed.minute);
    }
    
    // Mark component as rendered after first render
    if (!hasRendered.current) {
      hasRendered.current = true;
    }
  }, [value, isEditing]);

  // Validate on startTime changes for end time pickers
  React.useEffect(() => {
    if (value && startTime && isEndTime) {
      const newIsInvalid = validateTimeOrder(value);
      setIsInvalid(newIsInvalid);
    }
  }, [startTime, value, isEndTime, validateTimeOrder]);

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
    <div ref={timePickerRef} onFocus={handleFocus}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex space-x-3">
        <select
          className={`${selectClassName} flex-1 h-10`}
          value={localHour}
          onChange={handleHourChange}
          required={required}
        >
          {hours.map(hourValue => (
            <option key={hourValue} value={hourValue}>{hourValue}</option>
          ))}
        </select>

        <select
          className={`${selectClassName} flex-1 h-10`}
          value={localMinute}
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