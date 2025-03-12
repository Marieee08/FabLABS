
'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import { toast } from "@/components/ui/use-toast";
import { DateTimeSelection } from '@/components/student-forms/date-time-selection';
import { LabReservation } from '@/components/student-forms/lab-reservation';
import ReviewSubmit from '@/components/msme-forms/review-submit';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoleGuard from '@/components/auth/role-guard';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { TeacherApprovalEmail } from '@/components/emails/teacher-approval';

// Configure your email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
});

export type ReservationDetailsForEmail = {
  id: string;
  studentName: string;
  lvlSec: string;
  subject: string;
  topic: string;
  noOfStudents: number;
  dates: string[];
  approvalToken: string;
  teacherName: string;
};

export async function sendTeacherApprovalEmail(
  teacherEmail: string,
  details: ReservationDetailsForEmail
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const approvalUrl = `${baseUrl}/api/teacher-approval/confirm?token=${details.approvalToken}&id=${details.id}`;
  const declineUrl = `${baseUrl}/api/teacher-approval/decline?token=${details.approvalToken}&id=${details.id}`;
  
  const emailHtml = render(
    TeacherApprovalEmail({
      ...details,
      approvalUrl,
      declineUrl,
    })
  );

  try {
    await transporter.sendMail({
      from: `"FabLab Scheduler" <${process.env.EMAIL_FROM}>`,
      to: teacherEmail,
      subject: 'FabLab Reservation Approval Request',
      html: emailHtml,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

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

  ControlNo?: number;
  LvlSec: string;
  NoofStudents: number;
  Subject: string;
  Teacher: string;
  TeacherEmail: string; // Added teacher email field
  Topic: string;
  SchoolYear: number;
  
  // Needed Materials array
  NeededMaterials: Material[];
}

// Fixed UpdateFormData type
type UpdateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => void;

export default function StudentSchedule() {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<FormData>({
    days: [],
    syncTimes: false,
    unifiedStartTime: null,
    unifiedEndTime: null,

    LvlSec: '',
    NoofStudents: 0,
    Subject: '',
    Teacher: '',
    TeacherEmail: '',
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
  

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Select Date & Time";
      case 2: return "Lab Reservation";
      case 3: return "Review & Submit";
      default: return "Schedule a Class";
    }
  };

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
        return <DateTimeSelection 
                formData={formData} 
                setFormData={setFormData} 
                nextStep={nextStep} 
                maxDates={MAX_DATES} 
              />;
    }
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        
        <div className="container mx-auto py-10 px-4 mt-16 max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Schedule a Class</h1>
            <p className="text-gray-600 mt-2 max-w-3xl mx-auto">Complete the form below to reserve the lab for your class</p>
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
                {renderStep()}
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Need help? Contact our support team at support@labscheduler.com</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}