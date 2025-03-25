// src\app\user-services\student-schedule\page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import ReviewSubmit from '@/components/student-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import DateTimeSelection from '@/components/msme-forms/date-time-selection';
import { LabReservation } from '@/components/student-forms/lab-reservation';
import UtilizationInfo from '@/components/student-forms/utilization-info';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_DATES = 5;

// Material interface definition
interface Material {
  Item: string;
  ItemQty: number;
  Description: string;
}

// Day interface definition
interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface FormData {
  days: Day[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // UtilizationInfo fields
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string[] | string;
  Tools: string;
  serviceLinks?: {[service: string]: string};
  Remarks?: string;

  ControlNo?: number;
  LvlSec: string;
  NoofStudents: number;
  Subject: string;
  Teacher: string;
  TeacherEmail: string; 
  Topic: string;
  SchoolYear: number;
  
  // Needed Materials array
  NeededMaterials: Material[];
}

// Fixed UpdateFormData type
type UpdateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => void;

export default function Schedule() {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<FormData>({
    days: [],
    syncTimes: false,
    unifiedStartTime: null,
    unifiedEndTime: null,

    // Initialize UtilizationInfo fields
    ProductsManufactured: [],
    BulkofCommodity: '',
    Equipment: [],
    Tools: '',
    serviceLinks: {},
    Remarks: '',

    LvlSec: '',
    NoofStudents: 0,
    Subject: '',
    Teacher: '',
    TeacherEmail: '',
    Topic: '',
    SchoolYear: new Date().getFullYear(),
    NeededMaterials: []
  });
  
  interface BlockedDate {
    id: string;
    date: string;
  }

  interface CalendarDate extends Date {}

  const [blockedDates, setBlockedDates] = useState<CalendarDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fixed updateFormData function with proper typing
  const updateFormData: UpdateFormData = (field, value) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  
  const nextStep = () => setStep(prevStep => prevStep + 1);
  const prevStep = () => setStep(prevStep => prevStep - 1);

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Service Information & Date Selection";
      case 2: return "Lab Reservation";
      case 3: return "Review & Submit";
      default: return "Schedule a Service";
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-12">
            {/* Utilization Info comes first */}
            <div className="border rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-700 mb-6">Utilization Information</h2>
              <UtilizationInfo 
                formData={formData} 
                updateFormData={updateFormData} 
                nextStep={() => {}} // No-op since we're on the same page
                prevStep={() => {}} // No-op since we're on the same page
                standalonePage={false} // Hide navigation buttons
              />
            </div>
            
            {/* Calendar Selection comes after */}
            <div className="border rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-700 mb-6">Select Date & Time</h2>
              <DateTimeSelection
                formData={formData}
                setFormData={setFormData}
                nextStep={nextStep}
                isDateBlocked={isDateBlocked}
                maxDates={MAX_DATES}
              />
            </div>
          </div>
        );
      case 2:
        return <LabReservation 
          formData={formData} 
          updateFormData={updateFormData} 
          nextStep={nextStep} 
          prevStep={prevStep} 
        />;
      case 3:
        return <ReviewSubmit 
          formData={formData} 
          prevStep={prevStep} 
          updateFormData={updateFormData} 
          nextStep={nextStep} 
        />;
      default:
        return (
          <div className="space-y-12">
            {/* Utilization Info comes first */}
            <div className="border rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-700 mb-6">Utilization Information</h2>
              <UtilizationInfo 
                formData={formData} 
                updateFormData={updateFormData} 
                nextStep={() => {}} // No-op since we're on the same page
                prevStep={() => {}} // No-op since we're on the same page
                standalonePage={false} // Hide navigation buttons
              />
            </div>
            
            {/* Calendar Selection comes after */}
            <div className="border rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-700 mb-6">Select Date & Time</h2>
              <DateTimeSelection
                formData={formData}
                setFormData={setFormData}
                nextStep={nextStep}
                isDateBlocked={isDateBlocked}
                maxDates={MAX_DATES}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto py-10 px-4 mt-16 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Schedule a Service</h1>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto">Complete the form below to schedule your lab reservation</p>
        </div>
        
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-gray-50 py-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-800">{getStepTitle()}</CardTitle>
              <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 pb-6 px-8">
            <ProgressBar currentStep={step} totalSteps={3} />
            
            <div className="mt-8 w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading calendar data...</p>
                </div>
              ) : (
                renderStep()
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact our support team at ctapales@evc.pshs.edu.ph</p>
        </div>
      </div>
    </div>
  );
}