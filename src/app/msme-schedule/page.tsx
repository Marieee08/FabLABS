// Modified Schedule.tsx to correctly implement per-day time selection

'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import ProcessInformation from '@/components/msme-forms/utilization-info';
import ReviewSubmit from '@/components/msme-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, AlertCircle, Calendar } from 'lucide-react';
import { InteractiveMachineCalendarWrapper } from '@/components/msme-forms/interactive-machine-calendar';

// Interface for days with time slots
interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

// Interface for form data
export interface FormData {
  days: Day[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // Process fields
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  ToolsQty?: number;
  
  // Additional fields
  serviceMachineNumbers?: Record<string, number>;
  serviceLinks?: {[service: string]: string};
  Remarks?: string;
  NeededMaterials?: Array<{
    Item: string;
    ItemQty: number;
    Description: string;
  }>;
  [key: string]: any; // Index signature for dynamic access
}

// Time options for dropdown menus
const START_TIME_OPTIONS = [
  { value: "--:-- AM", label: "Select Time" },
  { value: "08:00 AM", label: "08:00 AM" },
  { value: "09:00 AM", label: "09:00 AM" },
  { value: "10:00 AM", label: "10:00 AM" },
  { value: "11:00 AM", label: "11:00 AM" },
  { value: "12:00 PM", label: "12:00 PM" },
  { value: "01:00 PM", label: "01:00 PM" },
  { value: "02:00 PM", label: "02:00 PM" },
  { value: "03:00 PM", label: "03:00 PM" },
  { value: "04:00 PM", label: "04:00 PM" }
];

const END_TIME_OPTIONS = [
  { value: "--:-- AM", label: "Select Time" },
  { value: "09:00 AM", label: "09:00 AM" },
  { value: "10:00 AM", label: "10:00 AM" },
  { value: "11:00 AM", label: "11:00 AM" },
  { value: "12:00 PM", label: "12:00 PM" },
  { value: "01:00 PM", label: "01:00 PM" },
  { value: "02:00 PM", label: "02:00 PM" },
  { value: "03:00 PM", label: "03:00 PM" },
  { value: "04:00 PM", label: "04:00 PM" },
  { value: "05:00 PM", label: "05:00 PM" }
];

// Helper function to convert time string to minutes for comparison
function timeToMinutes(timeString: string | null): number {
  if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') return -1;
  
  const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) return -1;
  
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  
  // Convert to 24-hour format for proper comparison
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return hour * 60 + parseInt(minutes);
}

// Component to select time slots for individual days
const PerDayTimeSelector: React.FC<{
  days: Day[];
  updateDay: (index: number, field: keyof Day, value: any) => void;
}> = ({ days, updateDay }) => {
  return (
    <div className="space-y-6 mt-4">
      <h3 className="text-lg font-medium text-gray-800">Select Time for Each Day</h3>
      
      {days.map((day, index) => {
        const dateString = new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        const hasTimeError = day.startTime && day.endTime && 
          timeToMinutes(day.startTime) >= timeToMinutes(day.endTime);

        return (
          <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-gray-800">{dateString}</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  className="border rounded-md p-2 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={day.startTime || "--:-- AM"}
                  onChange={(e) => updateDay(index, 'startTime', e.target.value)}
                >
                  {START_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  className="border rounded-md p-2 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={day.endTime || "--:-- AM"}
                  onChange={(e) => updateDay(index, 'endTime', e.target.value)}
                >
                  {END_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {hasTimeError && (
              <div className="mt-2 flex items-start text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>End time must be after start time</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Improved type for updateFormData to handle nested objects
type UpdateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => void;

export default function Schedule() {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<FormData>({
    days: [],
    syncTimes: true,
    unifiedStartTime: null,
    unifiedEndTime: null,

    // Initialize ProcessInfo fields
    ProductsManufactured: '',
    BulkofCommodity: '',
    Equipment: '',
    Tools: '',
    ToolsQty: 0,
    
    // Initialize additional fields
    serviceMachineNumbers: {},
    serviceLinks: {},
    Remarks: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug effect to track form data changes
  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);

  const updateFormData: UpdateFormData = (field, value) => {
    setFormData(prevData => {
      console.log(`Updating ${String(field)}:`, value);
      
      // Special handling for ProductsManufactured changes
      if (field === 'ProductsManufactured') {
        // Create a deep copy of the previous data
        const updatedData = JSON.parse(JSON.stringify(prevData));
        
        // Update the ProductsManufactured field
        updatedData[field] = value;
        
        // If we have serviceMachineNumbers data, synchronize it with the selected services
        if (updatedData.serviceMachineNumbers) {
          const currentMachineNumbers = { ...updatedData.serviceMachineNumbers };
          const updatedMachineNumbers = {};
          
          // Get array of selected services
          const selectedServices = Array.isArray(value) ? value : [value].filter(Boolean);
          
          // Only keep machine numbers for selected services
          selectedServices.forEach(service => {
            if (currentMachineNumbers[service] !== undefined) {
              updatedMachineNumbers[service] = currentMachineNumbers[service];
            } else {
              // Initialize with 0 for new services
              updatedMachineNumbers[service] = 0;
            }
          });
          
          updatedData.serviceMachineNumbers = updatedMachineNumbers;
        }
        
        // Similarly update serviceLinks if present
        if (updatedData.serviceLinks) {
          const currentLinks = { ...updatedData.serviceLinks };
          const updatedLinks = {};
          
          const selectedServices = Array.isArray(value) ? value : [value].filter(Boolean);
          
          selectedServices.forEach(service => {
            if (currentLinks[service]) {
              updatedLinks[service] = currentLinks[service];
            }
          });
          
          updatedData.serviceLinks = updatedLinks;
        }
        
        return updatedData;
      }
      
      // Special handling for serviceLinks and serviceMachineNumbers to perform deep copies
      if (field === 'serviceLinks' || field === 'serviceMachineNumbers') {
        return {
          ...prevData,
          [field]: value ? JSON.parse(JSON.stringify(value)) : value
        };
      }
      
      // Special handling for days to preserve time info
      if (field === 'days') {
        // Ensure all days have time info from unified time if sync is on
        if (prevData.syncTimes && prevData.unifiedStartTime && prevData.unifiedEndTime) {
          const updatedDays = value.map((day: any) => ({
            ...day,
            startTime: day.startTime || prevData.unifiedStartTime,
            endTime: day.endTime || prevData.unifiedEndTime
          }));
          return { ...prevData, [field]: updatedDays };
        }
      }
      
      // Special handling for syncTimes toggle - synchronize all times when enabled
      if (field === 'syncTimes' && value === true && prevData.unifiedStartTime && prevData.unifiedEndTime) {
        const updatedDays = prevData.days.map(day => ({
          ...day,
          startTime: prevData.unifiedStartTime,
          endTime: prevData.unifiedEndTime
        }));
        
        return {
          ...prevData,
          [field]: value,
          days: updatedDays
        };
      }
      
      // Special handling for unified time changes - apply to all days if sync is on
      if ((field === 'unifiedStartTime' || field === 'unifiedEndTime') && prevData.syncTimes) {
        const updatedDays = prevData.days.map(day => ({
          ...day,
          startTime: field === 'unifiedStartTime' ? value : day.startTime,
          endTime: field === 'unifiedEndTime' ? value : day.endTime
        }));
        
        return {
          ...prevData,
          [field]: value,
          days: updatedDays
        };
      }
      
      // For all other fields, just do the simple update
      return { ...prevData, [field]: value };
    });
  };
  
  // Helper function to update individual day's time slots
  const updateDayTime = (index: number, field: keyof Day, value: any) => {
    const updatedDays = [...formData.days];
    updatedDays[index] = {
      ...updatedDays[index],
      [field]: value
    };
    
    updateFormData('days', updatedDays);
  };
  
  const nextStep = () => {
    // Validate the current step
    if (step === 1) {
      // Check if a service is selected
      if (!formData.ProductsManufactured) {
        toast({
          title: "Service required",
          description: "Please select a service before continuing",
          variant: "destructive",
        });
        return;
      }
      
      // Check machine quantity
      const service = formData.ProductsManufactured;
      const serviceArray = Array.isArray(service) ? service : [service];
      const machineNumbers = formData.serviceMachineNumbers || {};
      
      for (const svc of serviceArray) {
        if (!machineNumbers[svc] && machineNumbers[svc] !== 0) {
          toast({
            title: "Machine quantity required",
            description: "Please specify machine quantity for all selected services",
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    if (step === 2) {
      // Check if dates are selected
      if (formData.days.length === 0) {
        toast({
          title: "Date selection required",
          description: "Please select at least one date",
          variant: "destructive",
        });
        return;
      }
      
      // Check if all dates have time information
      const missingTimeInfo = formData.days.some(
        day => !day.startTime || !day.endTime || 
               day.startTime === '--:-- AM' || 
               day.endTime === '--:-- AM'
      );
      
      if (missingTimeInfo) {
        toast({
          title: "Time selection required",
          description: "Please specify start and end times for all dates",
          variant: "destructive",
        });
        return;
      }
      
      // Check if any day has invalid time (end before start)
      const invalidTimeOrder = formData.days.some(
        day => timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)
      );
      
      if (invalidTimeOrder) {
        toast({
          title: "Invalid time selection",
          description: "End time must be after start time for all dates",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Make sure ProductsManufactured is always an array before moving to the review step
    if (step === 2) {
      if (!Array.isArray(formData.ProductsManufactured) && formData.ProductsManufactured) {
        updateFormData('ProductsManufactured', [formData.ProductsManufactured]);
      }
    }
    
    setStep(prevStep => prevStep + 1);
  };
  
  const prevStep = () => {
    console.log("Moving back to previous step with formData:", formData);
    setStep(prevStep => prevStep - 1);
  };

  // Check if there are time validation errors in the unified time selectors
  const hasUnifiedTimeError = formData.unifiedStartTime && formData.unifiedEndTime && 
    timeToMinutes(formData.unifiedStartTime) >= timeToMinutes(formData.unifiedEndTime);
  
  // Check if there are time validation errors in any individual day
  const hasAnyDayTimeError = !formData.syncTimes && formData.days.some(day => 
    day.startTime && day.endTime && timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)
  );
  
  // Check if all time selections are valid for the next step validation
  const allTimesValid = formData.syncTimes
    ? (formData.unifiedStartTime && formData.unifiedEndTime && !hasUnifiedTimeError)
    : formData.days.every(day => 
        day.startTime && day.endTime && 
        day.startTime !== '--:-- AM' && day.endTime !== '--:-- AM' &&
        timeToMinutes(day.startTime) < timeToMinutes(day.endTime)
      );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto py-10 px-4 mt-16 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Schedule a Service</h1>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto">Complete the form below to schedule your service appointment</p>
        </div>
        
        {/* Main form card */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-gray-50 py-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-800">Service Scheduling</CardTitle>
              <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 pb-6 px-8">
            <ProgressBar currentStep={step} totalSteps={3} />
            
            <div className="mt-8 w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading data...</p>
                </div>
              ) : (
                step === 1 ? (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Service Information</h2>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <ProcessInformation 
                        formData={formData} 
                        updateFormData={updateFormData} 
                        nextStep={() => {}} 
                        prevStep={() => {}} 
                        standalonePage={false} 
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={nextStep} 
                        disabled={!formData.ProductsManufactured}
                        className="flex items-center gap-2"
                      >
                        Continue to Date Selection
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : step === 2 ? (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Date and Time Selection</h2>
                    
                    {/* Machine availability calendar with integrated date selection */}
                    <InteractiveMachineCalendarWrapper
                      formData={formData}
                      updateFormData={updateFormData}
                    />
                    
                    {/* Time selection */}
                    {formData.days.length > 0 && (
                      <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">Time Selection</h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Use same time for all dates</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                              <input
                                type="checkbox"
                                id="syncTimes"
                                checked={formData.syncTimes}
                                onChange={(e) => updateFormData('syncTimes', e.target.checked)}
                                className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                              />
                              <label
                                htmlFor="syncTimes"
                                className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                              ></label>
                            </div>
                          </div>
                        </div>
                        
                        {/* Unified time selection */}
                        {formData.syncTimes ? (
                          <div className="grid grid-cols-2 gap-6">
                            {/* Start Time Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time<span className="text-red-500 ml-1">*</span>
                              </label>
                              <select
                                className="border rounded-md p-2 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                value={formData.unifiedStartTime || '--:-- AM'}
                                onChange={(e) => updateFormData('unifiedStartTime', e.target.value)}
                                required={true}
                              >
                                {START_TIME_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* End Time Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time<span className="text-red-500 ml-1">*</span>
                              </label>
                              <select
                                className="border rounded-md p-2 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                value={formData.unifiedEndTime || '--:-- AM'}
                                onChange={(e) => updateFormData('unifiedEndTime', e.target.value)}
                                required={true}
                              >
                                {END_TIME_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Validation error */}
                            {hasUnifiedTimeError && (
                              <div className="col-span-2 mt-2 flex items-start text-red-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                <span>End time must be after start time</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Per-day time selection
                          <PerDayTimeSelector 
                            days={formData.days} 
                            updateDay={updateDayTime} 
                          />
                        )}
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-between">
                      <Button 
                        onClick={prevStep} 
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Service Information
                      </Button>
                      
                      <Button 
                        onClick={nextStep} 
                        disabled={
                          formData.days.length === 0 || 
                          !allTimesValid
                        }
                        className="flex items-center gap-2"
                      >
                        Continue to Review
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ReviewSubmit 
                    formData={formData} 
                    prevStep={prevStep}
                    updateFormData={updateFormData}
                  />
                )
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact our support team at fablab@evc.pshs.edu.ph</p>
        </div>
      </div>
    </div>
  );
}