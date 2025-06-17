// src/app/staff-schedule/page.tsx - Revised to use lab reservation components

'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import LabReservation from '@/components/student-forms/lab-reservation';
import DateTimeSelection from '@/components/student-forms/date-time-selection';
import ReviewSubmit from '@/components/student-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, AlertCircle, Calendar } from 'lucide-react';

// Material interface for staff equipment requests
interface Material {
  id: string;
  Item: string;
  ItemQty: number;
  Description: string;
}

// Student interface (staff will have empty array)
interface Student {
  id: number;
  name: string;
}

// Day interface for scheduling
interface DayInfo {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

// Staff reservation form data - same structure as student EVC but with staff defaults
interface StaffReservationFormData {
  days: DayInfo[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // Lab reservation fields - staff will use "N/A" defaults
  ProductsManufactured: string | string[];
  ControlNo?: number;
  LvlSec: string;        // "N/A" for staff
  NoofStudents: number;  // 0 for staff
  Subject: string;       // "N/A" for staff  
  Teacher: string;       // "N/A" for staff
  TeacherEmail: string;  // "N/A" for staff
  Topic: string;         // "N/A" for staff
  SchoolYear: number;    // Current year for staff
  
  // Equipment and materials
  NeededMaterials: Material[];
  Students: Student[];   // Empty array for staff
  
  // Additional fields
  serviceLinks?: {[service: string]: string};
  Remarks?: string;
  Equipment?: string[] | string;
  Tools?: string;
  BulkofCommodity?: string;
  
  [key: string]: any;
}

export default function StaffSchedule() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StaffReservationFormData>({
    days: [],
    syncTimes: true,
    unifiedStartTime: null,
    unifiedEndTime: null,

    // Initialize with staff defaults
    ProductsManufactured: '',
    LvlSec: 'N/A',
    NoofStudents: 0,
    Subject: 'N/A',
    Teacher: 'N/A', 
    TeacherEmail: 'N/A',
    Topic: 'N/A',
    SchoolYear: new Date().getFullYear(),
    
    NeededMaterials: [],
    Students: [], // Empty for staff
    
    serviceLinks: {},
    Remarks: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  // Fetch blocked dates for calendar
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const response = await fetch('/api/blocked-dates');
        if (response.ok) {
          const data = await response.json();
          const dates = data.map((item: any) => new Date(item.date));
          setBlockedDates(dates);
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };

    fetchBlockedDates();
  }, []);

  // Check if date is blocked
  const isDateBlocked = (date: Date): boolean => {
    return blockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    );
  };

  // Update form data
  const updateFormData = <K extends keyof StaffReservationFormData>(
    field: K, 
    value: StaffReservationFormData[K]
  ) => {
    setFormData(prevData => {
      console.log(`Staff form updating ${String(field)}:`, value);
      return {
        ...prevData,
        [field]: value
      };
    });
  };
  
  const nextStep = () => {
    // Validation for each step
    if (step === 1) {
      // Check if service is selected and basic lab info is filled
      if (!formData.ProductsManufactured) {
        toast({
          title: "Service required",
          description: "Please select a service before continuing",
          variant: "destructive",
        });
        return;
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
    }
    
    setStep(prevStep => prevStep + 1);
  };
  
  const prevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto py-10 px-4 mt-16 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Schedule Lab Equipment</h1>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto">
            Reserve lab equipment and facilities for your research or teaching needs
          </p>
        </div>
        
        {/* Main form card */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-gray-50 py-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-800">Lab Equipment Reservation</CardTitle>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Lab Equipment & Information</h2>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      {/* Pass staff mode flag to modify behavior */}
                      <LabReservation 
                        formData={formData} 
                        updateFormData={updateFormData} 
                        nextStep={nextStep} 
                        prevStep={prevStep}
                        isStaffMode={true}  // NEW: Enable staff mode
                      />
                    </div>
                  </div>
                ) : step === 2 ? (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Date and Time Selection</h2>
                    
                    <DateTimeSelection
                      formData={formData}
                      setFormData={setFormData}
                      nextStep={nextStep}
                      prevStep={prevStep}
                      isDateBlocked={isDateBlocked}
                      standalonePage={false}
                    />
                  </div>
                ) : ( 
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Review and Submit</h2>
                    
                    <ReviewSubmit 
                      formData={formData} 
                      prevStep={prevStep}
                      updateFormData={updateFormData}
                      // Staff submissions skip teacher approval
                    />
                  </div>
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