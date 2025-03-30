import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, School, Book, User, Settings, HardDrive } from 'lucide-react';

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

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface Student {
  id: number;
  name: string;
}

interface SelectedMachine {
  id: string;
  quantity: number;
}

interface FormData {
  days: Day[];
  ProductsManufactured: string | string[];
  SelectedMachines?: SelectedMachine[];
  ControlNo?: number;
  LvlSec?: string;
  NoofStudents?: number;
  Subject?: string;
  Teacher?: string;
  TeacherEmail?: string;
  Topic?: string;
  SchoolYear?: number;
  Students?: Student[];
  [key: string]: any;
}

interface ReviewSubmitProps {
  formData: FormData;
  prevStep: () => void;
  nextStep?: () => void;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

// Fetch machine details
const fetchMachineDetails = async (selectedMachines: SelectedMachine[]) => {
  if (selectedMachines.length === 0) return [];
  
  try {
    const response = await fetch('/api/machines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch machine details');
    }
    
    const allMachines = await response.json();
    return allMachines.filter((machine: any) => 
      selectedMachines.some(sm => sm.id === machine.id)
    ).map((machine: any) => ({
      ...machine,
      selectedQuantity: selectedMachines.find(sm => sm.id === machine.id)?.quantity || 0
    }));
  } catch (error) {
    console.error('Error fetching machine details:', error);
    return [];
  }
};

const formatSchoolYear = (year: number | undefined): string => {
  if (!year) return 'Not provided';
  return `${year} to ${year + 1}`;
};

export default function ReviewSubmit({ formData, prevStep, updateFormData, nextStep }: ReviewSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [accInfo, setAccInfo] = useState<AccInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const [machineDetails, setMachineDetails] = useState<any[]>([]);

  // Fetch machine details when component mounts or selected machines change
  useEffect(() => {
    const loadMachineDetails = async () => {
      if (formData.SelectedMachines && formData.SelectedMachines.length > 0) {
        const details = await fetchMachineDetails(formData.SelectedMachines);
        setMachineDetails(details);
      }
    };

    loadMachineDetails();
  }, [formData.SelectedMachines]);

  // Scroll to top effect
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

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
      
      // Prepare submission data
      const submissionData = {
        ControlNo: formData.ControlNo ? Number(formData.ControlNo) : undefined,
        LvlSec: formData.LvlSec || undefined,
        NoofStudents: formData.Students?.length || 0,
        Subject: formData.Subject || undefined,
        Teacher: formData.Teacher || undefined,
        TeacherEmail: formData.TeacherEmail || undefined,
        Topic: formData.Topic || undefined,
        SchoolYear: formData.SchoolYear ? Number(formData.SchoolYear) : undefined,
        EVCStatus: 'Pending Teacher Approval',
        
        // Utilization information
        ProductsManufactured: formData.ProductsManufactured,
        SelectedMachines: formData.SelectedMachines || [],
        
        // Students
        EVCStudents: formData.Students?.map(student => ({ 
          Students: student.name 
        })) || [],
        
        // Time slots
        UtilTimes: formData.days.map((day, index) => ({
          DayNum: index + 1,
          StartTime: day.startTime ? new Date(day.date.toString() + ' ' + day.startTime).toISOString() : null,
          EndTime: day.endTime ? new Date(day.date.toString() + ' ' + day.endTime).toISOString() : null,
        })),
        
        // Link to user account
        accInfoId: accInfo?.id
      };
  
      // Send the request
      const response = await fetch('/api/user/create-evc-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit reservation');
      }
      
      const data = await response.json();
      
      // Send teacher approval email
      if (formData.TeacherEmail) {
        try {
          await fetch('/api/teacher-email/approval-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              reservationId: data.id,
              studentName: user?.firstName + ' ' + user?.lastName || 'Student',
              studentEmail: user?.emailAddresses[0]?.emailAddress || '',
              studentGrade: formData.LvlSec || 'Not specified',
              teacherEmail: formData.TeacherEmail,
              teacherName: formData.Teacher || 'Teacher',
              subject: formData.Subject || 'Not specified',
              topic: formData.Topic || 'Not specified',
              dates: formData.days.map(day => ({
                date: new Date(day.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                }),
                startTime: day.startTime || 'Not specified',
                endTime: day.endTime || 'Not specified'
              })),
              students: formData.Students || []
            }),
          });
        } catch (emailError) {
          console.error('Error sending teacher email:', emailError);
        }
      }
      
      // Set success message and redirect
      setSuccessMessage('Reservation submitted successfully!');
      setTimeout(() => {
        router.push('/student-dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
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

  // Render submission in progress state
  if (submittingReservation) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
        <Card className="p-6 mt-6 bg-white shadow-sm border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"/>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Processing Your Reservation</h3>
              <p className="text-gray-600 text-center max-w-md">
                Please wait while we submit your request and notify your teacher.
              </p>
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
          {/* Equipment Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Settings className="h-5 w-5 text-blue-600 mr-2" /> Equipment Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Service</p>
                    <div className="mt-1">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {typeof formData.ProductsManufactured === 'string' 
                          ? formData.ProductsManufactured 
                          : formData.ProductsManufactured[0] || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Machines Section */}
          {formData.SelectedMachines && formData.SelectedMachines.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <HardDrive className="h-5 w-5 text-blue-600 mr-2" /> Selected Machines
              </h3>
              <Card className="border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {machineDetails.map((machine) => (
                      <div 
                        key={machine.id} 
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-md font-semibold text-blue-800">
                            {machine.Machine}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {machine.Number || 1} Total
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              {machine.selectedQuantity} Selected
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {machine.Desc || 'No description available'}
                        </p>
                        {machine.Link && (
                          <a 
                            href={machine.Link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            More Information
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rest of the existing sections like Dates, School Info, etc. will remain the same */}
          
          {/* Dates and Times (existing code) */}
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
                    <p className="mt-1 text-gray-800">{formatSchoolYear(formData.SchoolYear)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Level/Section</p>
                    <p className="mt-1 text-gray-800">{formData.LvlSec || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Number of Students</p>
                    <p className="mt-1 text-gray-800">{formData.Students?.length || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher</p>
                    <p className="mt-1 text-gray-800">{formData.Teacher || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teacher Email</p>
                    <p className="mt-1 text-gray-800">{formData.TeacherEmail || 'Not provided'}</p>
                  </div>                 
                  <div>
                    <p className="text-sm font-medium text-gray-700">Topic</p>
                    <p className="mt-1 text-gray-800">{formData.Topic || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject</p>
                    <p className="mt-1 text-gray-800">{formData.Subject || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          {formData.Students && formData.Students.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-2" /> Students
              </h3>
              <Card className="border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {formData.Students.map((student) => (
                      <div key={student.id} className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-800">{student.name}</p>
                      </div>
                    ))}
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success message */}
          {successMessage && (
            <Alert className="mt-4 bg-green-50 border-green-100">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Teacher Email Warning */}
          {!formData.TeacherEmail && (
            <Alert className="mt-4 bg-yellow-50 border-yellow-100">
              <AlertDescription className="text-yellow-800">
                A teacher email is required for approval. Please go back and add a teacher email.
              </AlertDescription>
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
              disabled={
                isSubmitting || 
                loading || 
                !formData.TeacherEmail || 
                !formData.SelectedMachines?.length || 
                // Additional check to ensure at least one machine is selected with quantity > 0
                !formData.SelectedMachines.some(machine => machine.quantity > 0)
              }
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