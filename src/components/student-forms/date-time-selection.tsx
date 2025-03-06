'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from "@/components/ui/use-toast";

// Day interface aligned with LabDate schema
export interface LabDay {
  date: Date;
  LabDay: number | null; // Day of the week (0-6)
  LabStart: Date | null;
  LabEnd: Date | null;
}

export interface DateTimeSelectionProps {
  formData: {
    days: LabDay[];
    syncTimes: boolean;
    unifiedLabStart: Date | null;
    unifiedLabEnd: Date | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  nextStep: () => void;
  maxDates?: number;
  evcId?: number | null; // Added for the foreign key relationship
}

// Convert timeString to Date object for proper DateTime storage
const timeStringToDate = (dateObj: Date, timeString: string | null): Date | null => {
  if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') return null;
  
  const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) return null;
  
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  const result = new Date(dateObj);
  result.setHours(hour, parseInt(minutes), 0, 0);
  return result;
};

// Format a Date object to a time string for display
const formatTimeFromDate = (date: Date | null): string => {
  if (!date) return '--:-- AM';
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  
  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
};

// Convert Date to just the time part as a string
const dateToTimeString = (date: Date | null): string | null => {
  if (!date) return null;
  return formatTimeFromDate(date);
};

function formatTime(hour: string, minute: string): string {
  const [hourNum, period] = hour.split(' ');
  const paddedHour = hourNum.padStart(2, '0');
  return `${paddedHour}:${minute} ${period}`;
}

export function DateTimeSelection({ formData, setFormData, nextStep, maxDates = 5, evcId }: DateTimeSelectionProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch('/api/blocked-dates');
      const data = await response.json();
      const dates = data.map((item: { id: string; date: string }) => {
        // Create date at noon to avoid timezone issues
        const date = new Date(item.date);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      });
      setBlockedDates(dates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch blocked dates",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate => 
      date.getFullYear() === blockedDate.getFullYear() &&
      date.getMonth() === blockedDate.getMonth() &&
      date.getDate() === blockedDate.getDate()
    );
  };
  
  const validateTimes = () => {
    const newErrors: string[] = [];

    if (formData.days.length === 0) {
      newErrors.push("Please select at least one date");
      return newErrors;
    }

    for (const day of formData.days) {
      const date = new Date(day.date).toDateString();
      
      // Ensure both start and end times exist
      if (day.LabStart && day.LabEnd) {
        // Ensure end time is after start time
        if (day.LabEnd <= day.LabStart) {
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
    
    setFormData((prevData: any) => {
      // If date already exists, remove it
      if (existingDayIndex >= 0) {
        const updatedDays = [...prevData.days];
        updatedDays.splice(existingDayIndex, 1);
        return {
          ...prevData,
          days: updatedDays,
        };
      }
      
      // Add date only if under maxDates limit
      if (prevData.days.length < maxDates) {
        // When sync is enabled, use the unified times for new dates
        const newDay = {
          date,
          LabDay: date.getDay(), // Store day of week (0-6)
          LabStart: prevData.syncTimes ? prevData.unifiedLabStart : null,
          LabEnd: prevData.syncTimes ? prevData.unifiedLabEnd : null
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
  const handleUnifiedTimeChange = (timeString: string, field: 'LabStart' | 'LabEnd') => {
    setFormData((prevData: any) => {
      // Create a date object for the time (using today's date as base)
      const baseDate = new Date();
      const timeDate = timeStringToDate(baseDate, timeString);
      
      // Update all days with the new time when sync is enabled
      const updatedDays = prevData.days.map((day: LabDay) => {
        // Create a new date object using the selected day's date but with the new time
        let newTimeDate = null;
        if (timeDate) {
          newTimeDate = new Date(day.date);
          newTimeDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
        }
        
        return {
          ...day,
          [field]: newTimeDate
        };
      });
     
      return {
        ...prevData,
        [field === 'LabStart' ? 'unifiedLabStart' : 'unifiedLabEnd']: timeDate,
        days: updatedDays
      };
    });
  };

  // Handle individual time changes
  const handleIndividualTimeChange = (timeString: string, field: 'LabStart' | 'LabEnd', index: number) => {
    setFormData((prevData: any) => {
      const updatedDays = [...prevData.days];
      const day = updatedDays[index];
      
      // Create a date object for the time using the day's date
      const timeDate = timeStringToDate(day.date, timeString);
      
      if (prevData.syncTimes) {
        // If sync is enabled, update all days
        const baseDate = new Date(); // For storing in unifiedLabStart/End
        const baseDateWithTime = timeStringToDate(baseDate, timeString);
        
        updatedDays.forEach(day => {
          if (timeDate) {
            // Create a new time for each day preserving their date
            const newTimeForDay = new Date(day.date);
            newTimeForDay.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
            day[field] = newTimeForDay;
          } else {
            day[field] = null;
          }
        });
       
        return {
          ...prevData,
          [field === 'LabStart' ? 'unifiedLabStart' : 'unifiedLabEnd']: baseDateWithTime,
          days: updatedDays
        };
      } else {
        // If sync is disabled, update only the selected day
        updatedDays[index] = {
          ...updatedDays[index],
          [field]: timeDate
        };
        return {
          ...prevData,
          days: updatedDays
        };
      }
    });
  };

  // Handle sync toggle
  const handleSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSyncState = e.target.checked;
   
    setFormData((prevData: any) => {
      let newLabStart = prevData.unifiedLabStart;
      let newLabEnd = prevData.unifiedLabEnd;
     
      if (newSyncState && prevData.days.length > 0) {
        // If unified times aren't set, use the first day's times or default to null
        if (!newLabStart || !newLabEnd) {
          const firstDay = prevData.days[0];
          newLabStart = firstDay.LabStart;
          newLabEnd = firstDay.LabEnd;
        }
       
        // Apply these times to all existing dates
        const updatedDays = prevData.days.map((day: LabDay) => {
          let updatedLabStart = null;
          let updatedLabEnd = null;
          
          if (newLabStart) {
            updatedLabStart = new Date(day.date);
            updatedLabStart.setHours(newLabStart.getHours(), newLabStart.getMinutes(), 0, 0);
          }
          
          if (newLabEnd) {
            updatedLabEnd = new Date(day.date);
            updatedLabEnd.setHours(newLabEnd.getHours(), newLabEnd.getMinutes(), 0, 0);
          }
          
          return {
            ...day,
            LabStart: updatedLabStart,
            LabEnd: updatedLabEnd
          };
        });
       
        return {
          ...prevData,
          syncTimes: newSyncState,
          unifiedLabStart: newLabStart,
          unifiedLabEnd: newLabEnd,
          days: updatedDays
        };
      }
     
      return {
        ...prevData,
        syncTimes: newSyncState,
        unifiedLabStart: newLabStart,
        unifiedLabEnd: newLabEnd
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
   
    return !isAlreadySelected && formData.days.length >= maxDates;
  };

  const sortedDays = [...formData.days].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 mt-8">Select Lab Dates and Times</h2>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="items-start w-full h-full">
          {errors.length > 0 && (
            <div>
              {errors.map((error, index) => (
                <p key={index} className="ml-2 text-red-500">{error}</p>
              ))}
            </div>
          )}
          <Calendar
            mode="multiple"
            selected={formData.days.map(day => new Date(day.date))}
            onSelect={(dates) => {
              if (dates && dates.length > 0) {
                // Find the newly selected date (the one not in previously selected dates)
                const previousDates = formData.days.map(d => d.date.getTime());
                const newDate = (dates as Date[]).find(d => 
                  !previousDates.includes(d.getTime())
                );
                
                if (newDate) {
                  addNewDay(newDate);
                } else if (dates.length < formData.days.length) {
                  // Handle deselection
                  const removedDate = formData.days.find(d => 
                    !(dates as Date[]).some(selectedDate => 
                      selectedDate.getTime() === d.date.getTime()
                    )
                  )?.date;
                  
                  if (removedDate) {
                    addNewDay(removedDate); // This will remove it since it exists
                  }
                }
              }
            }}
            disabled={(date) => isDateDisabled(date) || isDateBlocked(date)}
            className="w-full h-full"
          />
        </div>
        <div className="mt-4 space-y-4">
          {/* Sync times checkbox */}
          {formData.days.length >= 2 && (
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="syncTimes"
                checked={formData.syncTimes}
                onChange={handleSyncToggle}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="syncTimes" className="ml-2 block text-sm text-gray-900">
                Use same time for all lab dates
              </label>
            </div>
          )}

          {/* Unified time selection */}
          {formData.syncTimes && formData.days.length >= 2 && (
            <div className="border border-blue-200 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">Set Lab Times for All Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <TimePicker
                  required
                  label="Lab Start Time"
                  value={formData.unifiedLabStart ? dateToTimeString(formData.unifiedLabStart) : null}
                  onChange={(time) => handleUnifiedTimeChange(time, 'LabStart')}
                />
                <TimePicker
                  required
                  label="Lab End Time"
                  value={formData.unifiedLabEnd ? dateToTimeString(formData.unifiedLabEnd) : null}
                  onChange={(time) => handleUnifiedTimeChange(time, 'LabEnd')}
                  startTime={formData.unifiedLabStart ? dateToTimeString(formData.unifiedLabStart) : null}
                  isEndTime={true}
                />
              </div>
            </div>
          )}
         
          {/* Selected dates */}
          {sortedDays.map((day, index) => (
            <div key={new Date(day.date).toISOString()} className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold">
                {new Date(day.date).toDateString()}
              </h3>
              {!formData.syncTimes ? (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <TimePicker
                    required
                    label="Lab Start Time"
                    value={dateToTimeString(day.LabStart)}
                    onChange={(time) => handleIndividualTimeChange(time, 'LabStart', index)}
                  />
                  <TimePicker
                    required
                    label="Lab End Time"
                    value={dateToTimeString(day.LabEnd)}
                    onChange={(time) => handleIndividualTimeChange(time, 'LabEnd', index)}
                    startTime={dateToTimeString(day.LabStart)}
                    isEndTime={true}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-medium">Lab Start Time</p>
                    <p className="mt-1">{day.LabStart ? formatTimeFromDate(day.LabStart) : 'No time selected'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Lab End Time</p>
                    <p className="mt-1">{day.LabEnd ? formatTimeFromDate(day.LabEnd) : 'No time selected'}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

interface TimePickerProps {
  label: string;
  value: string | null;
  onChange: (time: string) => void;
  startTime?: string | null;
  isEndTime?: boolean;
  required?: boolean;
}

export function TimePicker({
  label,
  value,
  onChange,
  startTime,
  isEndTime = false,
  required = true
}: TimePickerProps) {
  const isFirstSelection = React.useRef(true);
  const [showError, setShowError] = React.useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);

  // Listen for validation attempts from parent
  React.useEffect(() => {
    const handleNextClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).textContent?.includes('Next')) {
        setHasAttemptedSubmit(true);
      }
    };

    document.addEventListener('click', handleNextClick);

    return () => {
      document.removeEventListener('click', handleNextClick);
    };
  }, []);

  const validateTimeOrder = React.useCallback((currentTime: string) => {
    if (!isEndTime || !startTime) return false;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(currentTime);
   
    if (startMinutes === -1 || endMinutes === -1) return false;
    return endMinutes <= startMinutes;
  }, [isEndTime, startTime]);

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

  const [localHour, setLocalHour] = React.useState<string>(() => parseTime(value).hour);
  const [localMinute, setLocalMinute] = React.useState<string>(() => parseTime(value).minute);
  const [isInvalid, setIsInvalid] = React.useState(false);

  // Listen for parent validation triggers
  React.useEffect(() => {
    if (hasAttemptedSubmit) {
      setShowError(required && (localHour === '--' || localMinute === '--'));
    }
  }, [hasAttemptedSubmit, required, localHour, localMinute]);

  // Helper function for time validation
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

  // Validate times whenever either time changes
  const validateTimes = React.useCallback((currentTime: string) => {
    if (!isEndTime || !startTime) return false;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(currentTime);
   
    if (startMinutes === -1 || endMinutes === -1) return false;
    return endMinutes <= startMinutes;
  }, [isEndTime, startTime]);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    setLocalHour(newHour);
  
    if (newHour !== '--') {
      // Automatically set minutes to '00' when hour is selected
      setLocalMinute('00');
      const formattedTime = formatTime(newHour, '00');
      setIsInvalid(validateTimes(formattedTime));
      onChange(formattedTime);
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
 
    isFirstSelection.current = false;
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    setLocalMinute(newMinute);
   
    if (localHour !== '--' && newMinute !== '--') {
      const formattedTime = formatTime(localHour, newMinute);
      setIsInvalid(validateTimes(formattedTime));
      onChange(formattedTime);
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
   
    isFirstSelection.current = false;
  };

  // Sync with parent value changes
  React.useEffect(() => {
    if (!isFirstSelection.current) {
      const parsed = parseTime(value);
      setLocalHour(parsed.hour);
      setLocalMinute(parsed.minute);
    }
  }, [value]);

  // Validate on startTime changes
  React.useEffect(() => {
    if (value && startTime && isEndTime) {
      setIsInvalid(validateTimeOrder(value));
    }
  }, [startTime, value, isEndTime, validateTimeOrder]);

  const hours = [
    '--',
    '08 AM', '09 AM', '10 AM', '11 AM', '12 PM',
    '01 PM', '02 PM', '03 PM', '04 PM'
  ];

  const minutes = ['--', '00', '15', '30', '45'];

  const selectClassName = `border rounded-md p-2 w-auto ${
    isInvalid ? 'border-red-500' :
    showError ? 'border-red-500' :
    'border-gray-300'
  }`;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex space-x-2">
        <select
          className={selectClassName}
          value={localHour}
          onChange={handleHourChange}
          required={required}
        >
          {hours.map(hourValue => (
            <option key={hourValue} value={hourValue}>{hourValue}</option>
          ))}
        </select>

        <select
          className={selectClassName}
          value={localMinute}
          onChange={handleMinuteChange}
          required={required}
        >
          {minutes.map(minuteValue => (
            <option key={minuteValue} value={minuteValue}>{minuteValue}</option>
          ))}
        </select>
      </div>

      <div className="mt-1">
        {isInvalid && (
          <span className="text-red-500 text-sm block">
            End time must be after start time
          </span>
        )}
        {showError && (
          <span className="text-red-500 text-sm block">
            This field is required
          </span>
        )}
      </div>
    </div>
  );
}