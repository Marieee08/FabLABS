// src/app/staff-schedule/page.tsx - FIXED VERSION WITH CORRECT TYPES

'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import LabReservation from '@/components/student-forms/lab-reservation';
import DateTimeSelection from '@/components/staff-forms/staff-date-time-selection'; // Keep using the original for now
import ReviewSubmit from '@/components/student-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// Staff reservation form data - FIXED: Match exactly what components expect
interface StaffReservationFormData {
  days: DayInfo[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // Lab reservation fields - FIXED: Match LabReservationFormData exactly
  ProductsManufactured: string | string[];
  BulkofCommodity: string; // ❌ Remove the optional - make it required
  Equipment: string[] | string; // ❌ Remove the optional - make it required
  Tools: string; // ❌ Remove the optional - make it required
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
  
  // Equipment and materials
  NeededMaterials: Material[];
  Students: Student[];
  
  [key: string]: any;
}

export default function StaffSchedule() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StaffReservationFormData>({
    days: [],
    syncTimes: true,
    unifiedStartTime: null,
    unifiedEndTime: null,

    // Initialize with staff defaults - FIXED: Add required fields
    ProductsManufactured: '',
    BulkofCommodity: 'Staff Equipment Request', // ❌ Required field
    Equipment: [], // ❌ Required field  
    Tools: '', // ❌ Required field
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

  // FIXED: Single updateFormData function (remove the duplicate)
  const updateFormData = <K extends keyof StaffReservationFormData>(
    field: K, 
    value: StaffReservationFormData[K]
  ) => {
    console.log(`🔧 Staff form updating ${String(field)}:`, value);
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [field]: value
      };
      console.log('📊 New staff form data:', newData);
      return newData;
    });
  };

  // FIXED: Create a wrapper for setFormData that matches DateTimeSelection expectations
  const setFormDataWrapper = React.useCallback((updater: any) => {
    console.log('🔄 Staff setFormDataWrapper called with:', updater);
    
    if (typeof updater === 'function') {
      setFormData(prevData => {
        console.log('📊 Previous staff data:', prevData);
        const result = updater(prevData);
        console.log('📊 Updated staff data:', result);
        return { ...prevData, ...result };
      });
    } else {
      console.log('📊 Direct staff data update:', updater);
      setFormData(prevData => ({ ...prevData, ...updater }));
    }
  }, []);
  
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
                      <LabReservation 
                        formData={formData} 
                        updateFormData={updateFormData} 
                        nextStep={nextStep}
                        prevStep={prevStep}
                        userRole="STAFF"
                      />
                    </div>
                  </div>
                ) : step === 2 ? (
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Date and Time Selection</h2>
                    
                    <DateTimeSelection
                      formData={formData}
                      setFormData={setFormDataWrapper}
                      nextStep={nextStep}
                      prevStep={prevStep}
                      isDateBlocked={isDateBlocked}
                      standalonePage={true}
                    />
                  </div>
                ) : ( 
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Review and Submit</h2>
                    
                    <ReviewSubmit 
                      formData={formData}
                      prevStep={prevStep}
                      updateFormData={updateFormData}
                      userRole="STAFF"
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