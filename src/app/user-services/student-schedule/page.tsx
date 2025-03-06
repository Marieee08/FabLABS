'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import ProcessInformation from '@/components/msme-forms/utilization-info';
import ReviewSubmit from '@/components/msme-forms/review-submit';
import { toast } from "@/components/ui/use-toast";
import { DateTimeSelection } from '@/components/student-forms/date-time-selection';
import { LabReservation } from '@/components/student-forms/lab-reservation'; // Import the new component

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
  ProductsManufactured: string;
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  ToolsQty: number;

  ControlNo?: number;
  LvlSec: string;
  NoofStudents: number;
  Subject: string;
  Teacher: string;
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
    syncTimes: false, // Initialize sync state
    unifiedStartTime: null, // Initialize unified start time
    unifiedEndTime: null,

    // Initialize ProcessInfo fields
    ProductsManufactured: '',
    BulkofCommodity: '',
    Equipment: '',
    Tools: '',
    ToolsQty: 0,

    LvlSec: '',
    NoofStudents: 0,
    Subject: '',
    Teacher: '',
    Topic: '',
    SchoolYear: new Date().getFullYear(),
    NeededMaterials: []
  });

  // Fixed updateFormData function with proper typing
  const updateFormData: UpdateFormData = (field, value) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };

  const nextStep = () => setStep(prevStep => prevStep + 1);
  const prevStep = () => setStep(prevStep => prevStep - 1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return <DateTimeSelection 
                formData={formData} 
                setFormData={setFormData} 
                nextStep={nextStep} 
                maxDates={MAX_DATES} 
              />;
      case 2:
        return <ProcessInformation 
                formData={formData} 
                updateFormData={updateFormData} 
                nextStep={nextStep} 
                prevStep={prevStep} 
              />;
      case 3:
        return <LabReservation 
                formData={formData} 
                updateFormData={updateFormData} 
                nextStep={nextStep} 
                prevStep={prevStep} 
              />;
      case 4:
        return <ReviewSubmit 
                formData={formData} 
                prevStep={prevStep} 
                updateFormData={updateFormData} 
                nextStep={nextStep} 
              />;
      default:
        return <DateTimeSelection 
                formData={formData} 
                setFormData={setFormData} 
                nextStep={nextStep} 
                maxDates={MAX_DATES} 
              />;
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 mt-16">
        <h1 className="text-2xl font-bold mb-4">Schedule a Service</h1>
        <ProgressBar currentStep={step} totalSteps={4} />
        {renderStep()}
      </div>
    </>
  );
}