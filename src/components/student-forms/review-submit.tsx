import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, School, Book, User, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';

interface ClientInfo {
  ContactNum: string;
  Address: string | null;
  City: string | null;
  Province: string | null;
  Zipcode: number | null;
}

interface AccInfo {
  id: number;
  clerkId: string;
  Name: string;
  email: string;
  Role: string;
  ClientInfo: ClientInfo | null;
}

// Updated to match UtilTime model
interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface NeededMaterial {
  Item: string;
  ItemQty: number;
  Description: string;
}

interface EVCStudent {
  Students: string;
}

interface FormData {
  days: Day[];
  ControlNo?: number;
  LvlSec?: string;
  NoofStudents?: number;
  Subject?: string;
  Teacher?: string;
  Topic?: string;
  SchoolYear?: number;
  NeededMaterials?: NeededMaterial[];
  EVCStudents?: EVCStudent[];
  [key: string]: any; // Add index signature for dynamic access
}

interface ReviewSubmitProps {
  formData: FormData;
  prevStep: () => void;
  nextStep?: () => void;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

interface ServiceCost {
  Service: string;
  Costs: number | string;
  Per: string;
}

interface DateInfo {
  day: Day;
  duration: number;
  billableHours: number;
  cost: number;
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
  const [accInfo, setAccInfo] = useState<AccInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;
      try {
        const response = await fetch(`/api/account/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch user information');
        const data = await response.json();
        setAccInfo(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserInfo();
    }
  }, [user, isLoaded]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
  
      const token = await getToken();
      
      // Format UtilTimes to match the Prisma model
      const utilTimes = formData.days.map((day, index) => {
        // Make sure we have a proper date object
        const dateObj = day.date instanceof Date ? day.date : new Date(day.date);
        
        // Create ISO strings for the API
        let startTimeISO = null;
        let endTimeISO = null;
        
        if (day.startTime) {
          const [hours, minutes] = day.startTime.split(':');
          const startTimeDate = new Date(dateObj);
          startTimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          startTimeISO = startTimeDate.toISOString();
        }
        
        if (day.endTime) {
          const [hours, minutes] = day.endTime.split(':');
          const endTimeDate = new Date(dateObj);
          endTimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          endTimeISO = endTimeDate.toISOString();
        }
        
        // For debugging
        console.log(`Processing day ${index}:`, {
          date: dateObj.toISOString(),
          startTime: startTimeISO,
          endTime: endTimeISO
        });
        
        return {
          DayNum: index + 1,
          StartTime: startTimeISO,
          EndTime: endTimeISO,
        };
      });
  
      // Format needed materials to match the model
      const neededMaterials = formData.NeededMaterials?.map(material => ({
        Item: material.Item,
        ItemQty: Number(material.ItemQty), // Ensure this is a number
        Description: material.Description,
      })) || [];
  
      // Format EVC students to match the model
      const evcStudents = formData.EVCStudents?.map(student => ({
        Students: student.Students
      })) || [];
  
      // Prepare submission data in the format expected by the API
      const submissionData = {
        // EVCReservation base fields
        ControlNo: formData.ControlNo ? Number(formData.ControlNo) : undefined,
        LvlSec: formData.LvlSec || undefined,
        NoofStudents: formData.NoofStudents ? Number(formData.NoofStudents) : undefined,
        Subject: formData.Subject || undefined,
        Teacher: formData.Teacher || undefined,
        Topic: formData.Topic || undefined,
        SchoolYear: formData.SchoolYear ? Number(formData.SchoolYear) : undefined,
        
        // Related data collections
        UtilTimes: utilTimes,
        EVCStudents: evcStudents,
        NeededMaterials: neededMaterials,
        
        // Link to user account
        accInfoId: accInfo?.id
      };
  
      console.log('Sending data to API:', JSON.stringify(submissionData, null, 2));
  
      const response = await fetch('/api/user/create-evc-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = typeof errorData.details === 'string' 
          ? errorData.details 
          : (errorData.error || 'Failed to submit reservation');
        throw new Error(errorMessage);
      }
  
      // Redirect to dashboard on success
      router.push('/user-dashboard');
      
    } catch (err) {
      console.error('Submission error:', err);
      // Handle error object properly
      let errorMessage = 'Failed to submit reservation';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
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

          {/* School/Class Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <School className="h-5 w-5 text-blue-600 mr-2" /> School Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Control Number</p>
                    <p className="mt-1 text-gray-800">{formData.ControlNo || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">School Year</p>
                    <p className="mt-1 text-gray-800">{formData.SchoolYear || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Level/Section</p>
                    <p className="mt-1 text-gray-800">{formData.LvlSec || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Number of Students</p>
                    <p className="mt-1 text-gray-800">{formData.NoofStudents || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject</p>
                    <p className="mt-1 text-gray-800">{formData.Subject || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher</p>
                    <p className="mt-1 text-gray-800">{formData.Teacher || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Topic</p>
                    <p className="mt-1 text-gray-800">{formData.Topic || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          {formData.EVCStudents && formData.EVCStudents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-2" /> Students
              </h3>
              <Card className="border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {formData.EVCStudents.map((student, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-800">{student.Students}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Materials Needed */}
          {formData.NeededMaterials && formData.NeededMaterials.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" /> Materials Needed
              </h3>
              <Card className="border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-2 text-left border">Item</th>
                          <th className="p-2 text-center border">Quantity</th>
                          <th className="p-2 text-left border">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.NeededMaterials.map((material, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 border">{material.Item}</td>
                            <td className="p-2 border text-center">{material.ItemQty}</td>
                            <td className="p-2 border">{material.Description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Book className="h-5 w-5 text-blue-600 mr-2" /> Contact Information
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
                    <p className="mt-1 text-gray-800">{user?.emailAddresses[0]?.emailAddress || accInfo?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact Number</p>
                    <p className="mt-1 text-gray-800">{accInfo?.ClientInfo?.ContactNum || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Complete Address</p>
                    <p className="mt-1 text-gray-800">
                      {accInfo?.ClientInfo ? 
                        `${accInfo.ClientInfo.Address || ''}, ${accInfo.ClientInfo.City || ''}, ${accInfo.ClientInfo.Province || ''} ${accInfo.ClientInfo.Zipcode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') 
                        : 'Not provided'}
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
              disabled={isSubmitting || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}