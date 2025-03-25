'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import ProcessInformation from '@/components/msme-forms/utilization-info';
import ReviewSubmit from '@/components/msme-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import DateTimeSelection from '@/components/msme-forms/date-time-selection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MachineCalendar from '@/components/user/machine-calendar';
import { Button } from "@/components/ui/button";
import { CalendarX2, CalendarCheck } from 'lucide-react';

export interface FormData {
  days: {
    date: Date;
    startTime: string | null;
    endTime: string | null;
  }[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // UtilizationInfo fields
  ProductsManufactured: string;
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  ToolsQty: number;
}

interface Machine {
  id: string;
  Machine: string;
  isAvailable: boolean;
}

type UpdateFormData = (field: keyof FormData, value: FormData[keyof FormData] | number) => void;

export default function Schedule() {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<FormData>({
    days: [],
    syncTimes: false,
    unifiedStartTime: null,
    unifiedEndTime: null,

    // Initialize ProcessInfo fields
    ProductsManufactured: '',
    BulkofCommodity: '',
    Equipment: '',
    Tools: '',
    ToolsQty: 0,
  });
  
  interface BlockedDate {
    id: string;
    date: string;
  }

  interface CalendarDate extends Date {}

  const [blockedDates, setBlockedDates] = useState<CalendarDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);

  const fetchBlockedDates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/blocked-dates');
      const data = await response.json();
      const dates = data.map((item: BlockedDate) => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines');
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch machine data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBlockedDates();
    fetchMachines();
  }, []);

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate => 
      date.getFullYear() === blockedDate.getFullYear() &&
      date.getMonth() === blockedDate.getMonth() &&
      date.getDate() === blockedDate.getDate()
    );
  };

  const updateFormData: UpdateFormData = (field, value) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  
  const nextStep = () => setStep(prevStep => prevStep + 1);
  const prevStep = () => setStep(prevStep => prevStep - 1);
  
  const toggleCalendar = () => {
    setShowCalendar(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto py-10 px-4 mt-16 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Schedule a Service</h1>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto">Complete the form below to schedule your service appointment</p>
        </div>
        
        {/* Calendar toggle button */}
        <div className="mb-4 flex justify-end">
          <Button 
            variant={showCalendar ? "secondary" : "outline"}
            onClick={toggleCalendar}
            className="flex items-center gap-2 text-sm"
          >
            {showCalendar ? (
              <>
                <CalendarX2 className="h-4 w-4" />
                Hide Calendar
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" />
                View Available Dates
              </>
            )}
          </Button>
        </div>
        
        {/* Calendar section */}
        {showCalendar && (
          <Card className="shadow-lg border border-gray-200 mb-6 overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-gray-50 py-4">
              <CardTitle className="text-lg text-blue-800">Machine Availability Calendar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MachineCalendar 
                  machines={machines} 
                  isOpen={showCalendar}
                  onClose={() => setShowCalendar(false)}
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main form card */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-gray-50 py-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-800">Service Scheduling</CardTitle>
              <span className="text-sm font-medium text-gray-500">Step {step} of 2</span>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 pb-6 px-8">
            <ProgressBar currentStep={step} totalSteps={2} />
            
            <div className="mt-8 w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading calendar data...</p>
                </div>
              ) : (
                step === 1 ? (
                  <div className="space-y-8">
                    {/* Process Information Section */}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Process Information</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <ProcessInformation 
                          formData={formData} 
                          updateFormData={updateFormData} 
                          nextStep={() => {}} // No step change for combined view
                          prevStep={() => {}} // No step change for combined view
                          standalonePage={false} // Indicate this is part of a combined form
                        />
                      </div>
                    </div>
                    
                    {/* DateTime Selection Section */}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Date & Time</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <DateTimeSelection
                          formData={formData}
                          setFormData={setFormData}
                          nextStep={() => {}} // No step change for combined view
                          isDateBlocked={isDateBlocked}
                          standalonePage={false} // Indicate this is part of a combined form
                        />
                      </div>
                    </div>
                    
                    {/* Combined Navigation Buttons - Cancel button removed */}
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={nextStep} 
                        disabled={
                          formData.days.length === 0 || 
                          !formData.ProductsManufactured || 
                          !formData.BulkofCommodity
                        }
                      >
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ReviewSubmit 
                    formData={formData} 
                    prevStep={prevStep}
                    updateFormData={updateFormData}
                    nextStep={() => {
                      toast({
                        title: "Success",
                        description: "Your service has been scheduled successfully!",
                      });
                    }}
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