'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import UtilizationInfo from '@/components/student-forms/utilization-info';
import ReviewSubmit from '@/components/student-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import DateTimeSelection from '@/components/msme-forms/date-time-selection';
import LabReservation from '@/components/student-forms/lab-reservation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Info } from "lucide-react";
import MachineCalendar from '@/components/user/machine-calendar';

const MAX_DATES = 5;

// Material interface definition
interface Material {
  id: string;
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

// Interface for blocked dates data structure
interface BlockedDate {
  id: string;
  date: string;
}

interface CalendarDate extends Date {}

interface Machine {
  id: string;
  Machine: string;
  isAvailable: boolean;
  Number?: number;
}

export default function Schedule() {
  // Use memoized initial state to avoid re-creating on each render
  const initialFormData = useMemo<FormData>(() => ({
    days: [],
    syncTimes: false,
    unifiedStartTime: null,
    unifiedEndTime: null,

    // Initialize UtilizationInfo fields
    ProductsManufactured: "",  // Changed to string instead of array for simplicity
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
  }), []);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [blockedDates, setBlockedDates] = useState<CalendarDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMachineCalendar, setShowMachineCalendar] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);

  // Use useCallback to memoize the fetching function
  const fetchBlockedDates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/blocked-dates');
      if (!response.ok) {
        throw new Error(`Failed to fetch blocked dates: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process dates efficiently in a single operation
      const processedDates = data.map((item: BlockedDate) => {
        const date = new Date(item.date);
        // Create dates at noon to avoid timezone issues
        return new Date(
          date.getFullYear(), 
          date.getMonth(), 
          date.getDate(), 
          12, 0, 0
        );
      });
      
      setBlockedDates(processedDates);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch blocked dates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch machines for calendar
  const fetchMachines = useCallback(async () => {
    try {
      const response = await fetch('/api/machines');
      if (!response.ok) {
        throw new Error(`Failed to fetch machines: ${response.status}`);
      }
      
      const machinesData = await response.json();
      setMachines(machinesData);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  }, []);

  // Load blocked dates on component mount
  useEffect(() => {
    fetchBlockedDates();
    fetchMachines();
  }, [fetchBlockedDates, fetchMachines]);

  // Memoize the date checking function for better performance
  const isDateBlocked = useCallback((date: Date) => {
    // Early exit for empty array to avoid unnecessary loops
    if (!blockedDates.length) return false;
    
    // Get date components once for comparison
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Use some for better performance as it exits early on first match
    return blockedDates.some(blockedDate => 
      year === blockedDate.getFullYear() &&
      month === blockedDate.getMonth() &&
      day === blockedDate.getDate()
    );
  }, [blockedDates]);

  // Memoized update function to avoid re-creation
  const updateFormData = useCallback<UpdateFormData>((field, value) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  }, []);
  
  // Navigation functions with scrolling
  const nextStep = useCallback(() => {
    setStep(prevStep => prevStep + 1);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);
  
  const prevStep = useCallback(() => {
    setStep(prevStep => prevStep - 1);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Machine calendar toggle
  const toggleMachineCalendar = useCallback(() => {
    setShowMachineCalendar(prev => !prev);
  }, []);

  // Memoize the step title to avoid recalculation
  const getStepTitle = useCallback(() => {
    switch(step) {
      case 1: return "Lab Reservation";
      case 2: return "Date & Time Selection";
      case 3: return "Review & Submit";
      default: return "Schedule a Service";
    }
  }, [step]);

  // Memoize the step component to prevent unnecessary re-renders
  const currentStep = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading calendar data...</p>
        </div>
      );
    }
  
    switch(step) {
      case 1:
        return (
          <LabReservation 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
          />
        );
      case 2:
        return (
          <div className="border rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-700">Select Date & Time</h2>
              
              {/* Machine Calendar Button */}
              <Button
                onClick={toggleMachineCalendar}
                variant="outline"
                className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Calendar className="h-4 w-4" />
                {showMachineCalendar ? "Hide Machine Calendar" : "View Machine Availability"}
              </Button>
            </div>
            
            {/* Machine Calendar Modal */}
            {showMachineCalendar && (
              <div className="mb-6 border rounded-lg shadow-sm overflow-hidden">
                <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Check machine availability before selecting your dates. This calendar shows when machines are reserved or unavailable.
                  </p>
                </div>
                <div className="h-[500px]">
                  <MachineCalendar machines={machines} isOpen={true} />
                </div>
              </div>
            )}
            
            <DateTimeSelection
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep} 
              isDateBlocked={isDateBlocked}
              maxDates={MAX_DATES}
            />
          </div>
        );
      case 3:
        return (
          <ReviewSubmit 
            formData={formData} 
            prevStep={prevStep} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
          />
        );
      default:
        return (
          <LabReservation 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
          />
        );
    }
  }, [step, isLoading, formData, nextStep, prevStep, updateFormData, isDateBlocked, showMachineCalendar, toggleMachineCalendar, machines]);

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
              {currentStep}
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