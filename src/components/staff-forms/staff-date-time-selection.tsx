// src/components/staff-forms/staff-date-time-selection.tsx
// Simplified version specifically for staff use

'use client';

import React, { useState, useCallback } from 'react';
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

export default function StaffDateTimeSelection({ 
  formData, 
  setFormData, 
  nextStep, 
  prevStep,
  isDateBlocked
}: StaffDateTimeSelectionProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const validateTimes = useCallback(() => {
    const newErrors: string[] = [];

    if (formData.days.length === 0) {
      newErrors.push("Please select at least one date");
      return newErrors;
    }

    for (const day of formData.days) {
      const date = new Date(day.date).toDateString();
      if (!day.startTime || !day.endTime || 
          day.startTime === '--:-- AM' || day.endTime === '--:-- AM') {
        newErrors.push(`Please select both start and end times for ${date}`);
      } else {
        const startTime = parseTime(day.startTime);
        const endTime = parseTime(day.endTime);
        if (endTime <= startTime) {
          newErrors.push(`End time must be after start time for ${date}`);
        }
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

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', time: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, index) => 
        index === dayIndex ? { ...day, [field]: time } : day
      )
    }));
  };

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

  const selectedDates = formData.days.map(day => new Date(day.date));
  const sortedDays = [...formData.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
          <div className="space-y-4 h-full overflow-hidden">
            {formData.days.length > 0 ? (
              <div className="space-y-4 h-full overflow-hidden">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" /> Selected Dates & Times
                </h3>
                        
                <div className="max-h-[330px] overflow-y-auto">
                  <div className="max-h-full overflow-y-auto pr-2 space-y-3">
                    {sortedDays.map((day, index) => {
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
                            
                            <div className="grid grid-cols-2 gap-4">
                              <StaffTimePicker
                                label="Start Time"
                                value={day.startTime}
                                onChange={(time) => handleTimeChange(actualIndex, 'startTime', time)}
                              />
                              <StaffTimePicker
                                label="End Time"
                                value={day.endTime}
                                onChange={(time) => handleTimeChange(actualIndex, 'endTime', time)}
                                startTime={day.startTime}
                                isEndTime={true}
                              />
                            </div>
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

// Simplified TimePicker for staff use
function StaffTimePicker({
  label,
  value,
  onChange,
  startTime,
  isEndTime = false
}: {
  label: string;
  value: string | null;
  onChange: (time: string) => void;
  startTime?: string | null;
  isEndTime?: boolean;
}) {
  const [hour, setHour] = useState('--');
  const [minute, setMinute] = useState('--');

  // Parse initial value
  React.useEffect(() => {
    if (value && value !== '--:-- AM') {
      const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        const [_, hours, minutes, period] = match;
        setHour(`${hours.padStart(2, '0')} ${period.toUpperCase()}`);
        setMinute(minutes);
      }
    } else {
      setHour('--');
      setMinute('--');
    }
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    if (newHour !== '--' && minute !== '--') {
      const [hourNum, period] = newHour.split(' ');
      onChange(`${hourNum.padStart(2, '0')}:${minute} ${period}`);
    } else {
      onChange('--:-- AM');
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    if (hour !== '--' && newMinute !== '--') {
      const [hourNum, period] = hour.split(' ');
      onChange(`${hourNum.padStart(2, '0')}:${newMinute} ${period}`);
    } else {
      onChange('--:-- AM');
    }
  };

  const hours = ['--', '08 AM', '09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM', '04 PM'];
  const minutes = ['--', '00', '15', '30', '45'];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex space-x-2">
        <select
          className="border border-gray-300 rounded-md p-2 flex-1"
          value={hour}
          onChange={(e) => handleHourChange(e.target.value)}
        >
          {hours.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          className="border border-gray-300 rounded-md p-2 flex-1"
          value={minute}
          onChange={(e) => handleMinuteChange(e.target.value)}
        >
          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

// Helper function
function parseTime(timeString: string): number {
  const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return -1;
  
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
  
  return hour * 60 + parseInt(minutes);
}