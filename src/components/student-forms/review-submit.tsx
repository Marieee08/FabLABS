'use client';

import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useAuth } from '@clerk/nextjs';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Book, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// Interface definitions
interface Material {
  Item: string;
  ItemQty: number;
  Description: string;
}

// Day interface
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

  // Class details
  ControlNo?: number;
  LvlSec: string;
  NoofStudents: number;
  Subject: string;
  Teacher: string;
  TeacherEmail: string; // Teacher email for approval
  Topic: string;
  SchoolYear: number;
  
  // Materials
  NeededMaterials: Material[];
  
  // Add index signature for dynamic access
  [key: string]: any;
}

interface ReviewSubmitProps {
  formData: FormData;
  prevStep: () => void;
  nextStep?: () => void;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function ReviewSubmit({ formData, prevStep, updateFormData, nextStep }: ReviewSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const token = await getToken();
      
      // Format dates for API submission
      const submissionData = {
        ...formData,
        days: formData.days.map(day => ({
          ...day,
          date: new Date(day.date)
        })),
        // Initial status set to pending teacher approval
        Status: 'Pending Teacher\'s Approval'
      };

      const response = await fetch('/api/student/submit-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...submissionData,
          studentInfo: {
            name: user?.fullName || '',
            email: user?.primaryEmailAddress?.emailAddress || '',
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reservation');
      }

      // Redirect to dashboard after successful submission
      router.push('/student-dashboard');
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
        <Card className="p-6 mt-6 bg-white shadow-sm border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
      <Card className="bg-white shadow-sm border border-gray-200 mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-medium text-gray-800 flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" /> Review Your Reservation
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Dates and Times */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" /> Selected Dates and Times
            </h3>
            <div className="grid md:grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50">
              {formData.days.length > 0 ? (
                [...formData.days]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((day, index) => (
                    <Card key={index} className="bg-white border-gray-200 shadow-none">
                      <CardContent className="p-4">
                        <h4 className="text-md font-semibold text-blue-800 mb-3">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Start Time</p>
                            <p className="mt-1 text-blue-700">{day.startTime || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">End Time</p>
                            <p className="mt-1 text-blue-700">{day.endTime || 'Not set'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <p className="text-gray-500 text-center p-4">No dates selected</p>
              )}
            </div>
          </div>

          {/* Class Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Book className="h-5 w-5 text-blue-600 mr-2" /> Class Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Level/Section</p>
                    <p className="mt-1 text-gray-800">{formData.LvlSec}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Number of Students</p>
                    <p className="mt-1 text-gray-800">{formData.NoofStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject</p>
                    <p className="mt-1 text-gray-800">{formData.Subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Topic</p>
                    <p className="mt-1 text-gray-800">{formData.Topic}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher</p>
                    <p className="mt-1 text-gray-800">{formData.Teacher}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher Email</p>
                    <p className="mt-1 text-gray-800">{formData.TeacherEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">School Year</p>
                    <p className="mt-1 text-gray-800">{formData.SchoolYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" /> Student Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="mt-1 text-gray-800">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="mt-1 text-gray-800">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Materials Information */}
          {formData.NeededMaterials && formData.NeededMaterials.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" /> Required Materials
              </h3>
              <Card className="border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 mb-2 font-medium text-gray-700 border-b pb-2">
                    <div>Item</div>
                    <div>Quantity</div>
                    <div>Description</div>
                  </div>
                  {formData.NeededMaterials.map((material, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200 last:border-0">
                      <div>{material.Item}</div>
                      <div>{material.ItemQty}</div>
                      <div>{material.Description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Teacher Approval Notice */}
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-md font-semibold text-orange-800 mb-1">Teacher Approval Required</h4>
                    <p className="text-sm text-orange-700">
                      After submission, an email will be sent to {formData.TeacherEmail} requesting approval.
                      Your reservation will remain in "Pending Teacher's Approval" status until they confirm.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              onClick={prevStep}
              disabled={isSubmitting}
              className="bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Previous Step
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Reservation'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}