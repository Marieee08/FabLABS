
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/custom/navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Steps, Step, StepStatus } from "@/components/ui/steps";
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@clerk/nextjs';

// Import our new components
import ServiceSelection from '@/components/msme-forms/service-selector';
import ScheduleCalendar from '@/components/msme-forms/schedule-calendar';
import DayTimeMachineCard, { DaySelectionData } from '@/components/msme-forms/time-machine-card';
import BatchActions from '@/components/msme-forms/batch-actions';
import CostReview from '@/components/msme-forms/cost-review';

// Service selection data interface
interface ServiceSelectionData {
  serviceId: string;
  serviceName: string;
  googleDriveLink: string;
  requiresFiles: boolean;
}

// Calendar selected date interface
interface SelectedDate {
  date: Date;
  availableMorning: boolean;
  availableAfternoon: boolean;
}

// Full day selection with time and machines interface
interface DaySelectionData {
  date: Date;
  startTime: string | null;
  endTime: string | null;
  machineQuantity: number;
  availableMorning: boolean;
  availableAfternoon: boolean;
  maxMachines: number;
}

// Define our form data interface
interface ScheduleFormData {
  // Service information
  serviceId: string;
  serviceName: string;
  googleDriveLink: string;
  
  // Selected days with time and machine details
  daySelections: DaySelectionData[];
  
  // Additional information
  remarks: string;
  
  // Cost calculation
  totalCost: number;
}

const MsmeSchedulePage: React.FC = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Initialize form data
  const [formData, setFormData] = useState<ScheduleFormData>({
    serviceId: '',
    serviceName: '',
    googleDriveLink: '',
    daySelections: [],
    remarks: '',
    totalCost: 0
  });
  
  const [minMachineQuantity, setMinMachineQuantity] = useState(1);
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [maxGlobalMachineQuantity, setMaxGlobalMachineQuantity] = useState(1);
  
  // Update service selection
  const handleServiceSelection = (serviceData: ServiceSelectionData) => {
    setFormData(prev => ({
      ...prev,
      serviceId: serviceData.serviceId,
      serviceName: serviceData.serviceName,
      googleDriveLink: serviceData.googleDriveLink
    }));
  };
  
  // Handle calendar date selection
  const handleDateSelect = (dates: SelectedDate[]) => {
    setSelectedDates(dates);
    
    // When dates change, update daySelections to add new dates or remove deselected ones
    setFormData(prev => {
      // Keep existing selections for dates that are still selected
      const existingSelections = prev.daySelections.filter(daySelection => 
        dates.some(date => date.date.toDateString() === daySelection.date.toDateString())
      );
      
      // Add new date selections
      const newDates = dates.filter(date => 
        !prev.daySelections.some(daySelection => 
          daySelection.date.toDateString() === date.date.toDateString()
        )
      );
      
      const newSelections = newDates.map(date => ({
        date: date.date,
        startTime: null,
        endTime: null,
        machineQuantity: minMachineQuantity,
        availableMorning: date.availableMorning,
        availableAfternoon: date.availableAfternoon,
        maxMachines: maxGlobalMachineQuantity
      }));
      
      return {
        ...prev,
        daySelections: [...existingSelections, ...newSelections]
      };
    });
  };
  
  // Update a specific day's time and machine selection
  const handleDayUpdate = (updatedDay: DaySelectionData, index: number) => {
    setFormData(prev => {
      const updatedSelections = [...prev.daySelections];
      updatedSelections[index] = updatedDay;
      return {
        ...prev,
        daySelections: updatedSelections
      };
    });
  };
  
  // Remove a day from selections
  const handleDayRemove = (index: number) => {
    setFormData(prev => {
      const updatedSelections = [...prev.daySelections];
      const removedDate = updatedSelections[index].date;
      updatedSelections.splice(index, 1);
      
      // Also remove from selectedDates
      setSelectedDates(selectedDates.filter(date => 
        date.date.toDateString() !== removedDate.toDateString()
      ));
      
      return {
        ...prev,
        daySelections: updatedSelections
      };
    });
  };
  
  // Batch apply time slots to all selected days
  const handleApplyTimeSlots = (startTime: string, endTime: string) => {
    // Validate that the selected times work for each day's availability
    const errors: string[] = [];
    
    formData.daySelections.forEach((day, index) => {
      const isStartMorning = parseInt(startTime.split(':')[0]) < 12;
      const isEndAfternoon = parseInt(endTime.split(':')[0]) >= 12;
      
      // Check if we need morning availability
      if (isStartMorning && !day.availableMorning) {
        errors.push(`Day ${index + 1} (${day.date.toLocaleDateString()}) doesn't have morning availability`);
      }
      
      // Check if we need afternoon availability
      if (isEndAfternoon && !day.availableAfternoon) {
        errors.push(`Day ${index + 1} (${day.date.toLocaleDateString()}) doesn't have afternoon availability`);
      }
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Apply times to all days
    setFormData(prev => {
      const updatedSelections = prev.daySelections.map(day => {
        // Only update if the day can accommodate these times
        const isStartMorning = parseInt(startTime.split(':')[0]) < 12;
        const isEndAfternoon = parseInt(endTime.split(':')[0]) >= 12;
        
        // Skip if day can't accommodate the times
        if ((isStartMorning && !day.availableMorning) || 
            (isEndAfternoon && !day.availableAfternoon)) {
          return day;
        }
        
        return {
          ...day,
          startTime,
          endTime
        };
      });
      
      return {
        ...prev,
        daySelections: updatedSelections
      };
    });
    
    // Clear validation errors
    setValidationErrors([]);
    
    toast({
      title: "Time slots applied",
      description: "Time slots have been applied to eligible days",
    });
  };
  
  // Batch apply machine quantity to all selected days
  const handleApplyMachineQuantity = (quantity: number) => {
    setFormData(prev => {
      const updatedSelections = prev.daySelections.map(day => {
        // Use the minimum of requested quantity and max available machines
        const actualQuantity = Math.min(quantity, day.maxMachines);
        
        return {
          ...day,
          machineQuantity: actualQuantity
        };
      });
      
      return {
        ...prev,
        daySelections: updatedSelections
      };
    });
    
    toast({
      title: "Machine quantity applied",
      description: "Machine quantity has been applied to all days",
    });
  };
  
  // Handle remarks input
  const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      remarks: e.target.value
    }));
  };
  
  // Handle cost calculation
  const handleCostCalculated = (totalCost: number) => {
    setFormData(prev => ({
      ...prev,
      totalCost
    }));
  };
  
  // Validate each step before proceeding
  const validateStep = (currentStep: number): boolean => {
    setValidationErrors([]);
    const errors: string[] = [];
    
    switch(currentStep) {
      case 1: // Service selection validation
        if (!formData.serviceId) {
          errors.push("Please select a service");
        }
        
        // If service requires files, validate the Google Drive link
        const linkRegex = /https:\/\/drive\.google\.com\/.+/i;
        if (formData.serviceName && 
            ['3D Printing', 'Laser Cutting', 'CNC Machining', 'PCB Manufacturing'].includes(formData.serviceName) && 
            (!formData.googleDriveLink || !linkRegex.test(formData.googleDriveLink))) {
          errors.push("Please provide a valid Google Drive link for the selected service");
        }
        break;
        
      case 2: // Date selection validation
        if (selectedDates.length === 0) {
          errors.push("Please select at least one date");
        }
        break;
        
      case 3: // Time and machine selection validation
        // Check if all selected days have start and end times
        formData.daySelections.forEach((day, index) => {
          if (!day.startTime || !day.endTime) {
            errors.push(`Please select start and end times for day ${index + 1} (${day.date.toLocaleDateString()})`);
          }
          
          if (day.machineQuantity <= 0) {
            errors.push(`Please select at least one machine for day ${index + 1} (${day.date.toLocaleDateString()})`);
          }
        });
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  // Navigation between steps
  const goToNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToPrevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!validateStep(step)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = await getToken();
      
      // Convert day selections to the format expected by the API
      const processedDays = formData.daySelections.map(day => ({
        date: day.date.toISOString(),
        startTime: day.startTime,
        endTime: day.endTime,
        machineQuantity: day.machineQuantity
      }));
      
      // Prepare payload for API
      const payload = {
        serviceId: formData.serviceId,
        serviceName: formData.serviceName,
        googleDriveLink: formData.googleDriveLink,
        days: processedDays,
        remarks: formData.remarks,
        totalCost: formData.totalCost
      };
      
      // Send to API
      const response = await fetch('/api/user/create-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }
      
      // Handle success
      toast({
        title: "Reservation created successfully",
        description: "Your service has been scheduled",
        variant: "success"
      });
      
      // Redirect to dashboard
      router.push('/user-dashboard');
      
    } catch (error) {
      console.error('Reservation submission error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create reservation',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <ServiceSelection 
              onSelection={handleServiceSelection}
              initialSelection={{
                serviceId: formData.serviceId,
                serviceName: formData.serviceName,
                googleDriveLink: formData.googleDriveLink,
                requiresFiles: ['3D Printing', 'Laser Cutting', 'CNC Machining', 'PCB Manufacturing'].includes(formData.serviceName)
              }}
            />
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <ScheduleCalendar
              serviceId={formData.serviceId}
              onDateSelect={handleDateSelect}
              minMachineQuantity={minMachineQuantity}
              initialSelectedDates={selectedDates}
              maxSelectableDates={5}
            />
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <BatchActions
              selectedDays={formData.daySelections}
              onApplyTimeSlots={handleApplyTimeSlots}
              onApplyMachineQuantity={handleApplyMachineQuantity}
              maxGlobalMachineQuantity={maxGlobalMachineQuantity}
              validationErrors={validationErrors}
            />
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Time & Machine Selection
              </h3>
              
              {formData.daySelections.length > 0 ? (
                formData.daySelections.map((day, index) => (
                  <DayTimeMachineCard
                    key={day.date.toISOString()}
                    dayData={day}
                    onUpdate={(updatedDay) => handleDayUpdate(updatedDay, index)}
                    onRemove={() => handleDayRemove(index)}
                    disabled={isLoading}
                  />
                ))
              ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No dates selected</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Go back to the previous step to select dates for your reservation.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Review Your Reservation</h3>
            
            {/* Service Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Selected Service</h4>
                    <p className="text-gray-900">{formData.serviceName || "No service selected"}</p>
                  </div>
                  
                  {formData.googleDriveLink && (
                    <div>
                      <h4 className="font-medium text-gray-700">Google Drive Link</h4>
                      <p className="text-blue-600 break-all">{formData.googleDriveLink}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Date and Time Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.daySelections.map((day, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">
                          {day.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </h4>
                        <span className="text-sm text-blue-600 font-medium">
                          {day.machineQuantity} machine{day.machineQuantity !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <p className="mt-2 text-gray-700">
                        {day.startTime && day.endTime ? (
                          <>
                            <Clock className="inline-block mr-2 h-4 w-4" />
                            <span>
                              {formatTimeDisplay(day.startTime)} - {formatTimeDisplay(day.endTime)}
                            </span>
                          </>
                        ) : (
                          <span className="text-red-500">No time selected</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <CostReview
                  selectedServices={[formData.serviceName]}
                  days={formData.daySelections.map(day => ({
                    date: day.date,
                    startTime: day.startTime,
                    endTime: day.endTime
                  }))}
                  serviceMachineNumbers={{ [formData.serviceName]: Math.max(...formData.daySelections.map(d => d.machineQuantity), 0) }}
                  onCostCalculated={handleCostCalculated}
                />
              </CardContent>
            </Card>
            
            {/* Additional Remarks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any special requirements or notes for your reservation..."
                  value={formData.remarks}
                  onChange={handleRemarksChange}
                  className="min-h-32 resize-none"
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Helper function to format time display
  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    
    const [hour, minute] = time.split(':').map(part => parseInt(part));
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const amPm = isPM ? 'PM' : 'AM';
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${amPm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto py-10 px-4 mt-16 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Schedule a Service</h1>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto">Complete the form below to schedule your service appointment</p>
        </div>
        
        {/* Steps indicator */}
        <div className="mb-8">
          <Steps 
            currentStep={step}
            status={isLoading ? 'loading' : undefined}
          >
            <Step 
              title="Select Service" 
              status={step > 1 ? 'complete' : step === 1 ? 'current' : 'incomplete'} 
            />
            <Step 
              title="Choose Dates" 
              status={step > 2 ? 'complete' : step === 2 ? 'current' : 'incomplete'} 
            />
            <Step 
              title="Set Times & Machines" 
              status={step > 3 ? 'complete' : step === 3 ? 'current' : 'incomplete'} 
            />
            <Step 
              title="Review & Submit" 
              status={step > 4 ? 'complete' : step === 4 ? 'current' : 'incomplete'} 
            />
          </Steps>
        </div>
        
        {/* Main form card */}
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="pt-8 pb-6 px-8">
            {/* Display validation errors at the top */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Current step content */}
            {renderStepContent()}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <Button
                  onClick={goToPrevStep}
                  variant="outline"
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous Step
                </Button>
              ) : (
                <div></div> // Empty div to maintain spacing
              )}
              
              {step < 4 ? (
                <Button
                  onClick={goToNextStep}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Reservation
                    </>
                  )}
                </Button>
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
};

export default MsmeSchedulePage;