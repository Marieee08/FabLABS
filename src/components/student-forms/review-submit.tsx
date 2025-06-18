// src/components/student-forms/review-submit.tsx - Fixed version for staff mode

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, School, Book, User, CreditCard, FileText, Info } from 'lucide-react';

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

interface Material {
  id: string; 
  Item: string;
  ItemQty: number;
  Description: string;
}

interface Student {
  id: number;
  name: string;
}

interface UserService {
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number;
  MinsAvail: number;
}

interface FormData {
  days: Day[];
  syncTimes?: boolean;
  unifiedStartTime?: string | null;
  unifiedEndTime?: string | null;
  ProductsManufactured: string | string[];
  BulkofCommodity?: string;
  Equipment: string[] | string;
  Tools: string;
  ToolsQty?: number;
  ControlNo?: number;
  LvlSec?: string;
  NoofStudents?: number;
  Subject?: string;
  Teacher?: string;
  TeacherEmail?: string;
  Topic?: string;
  SchoolYear?: number;
  NeededMaterials?: Material[];
  Students?: Student[];
  [key: string]: any;
}

interface ReviewSubmitProps {
  formData: FormData;
  prevStep: () => void;
  nextStep?: () => void;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  userRole?: string; // Change from isStaff to userRole
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatSchoolYear = (year: number | undefined): string => {
  if (!year) return 'Not provided';
  return `${year} to ${year + 1}`;
};

// Fixed time parsing function
const parseTimeString = (timeString: string, baseDate: Date): Date | null => {
  if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') {
    return null;
  }
  
  try {
    // Handle time format like "09:00 AM"
    const timeRegex = /^(\d+):(\d+)\s+(AM|PM)$/;
    const matches = timeString.match(timeRegex);
    
    if (!matches) {
      console.warn(`Time string '${timeString}' doesn't match expected format`);
      return null;
    }
    
    const [, hours, minutes, period] = matches;
    let hour = parseInt(hours, 10);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    const resultDate = new Date(baseDate);
    resultDate.setHours(hour, parseInt(minutes, 10), 0, 0);
    
    // Validate the resulting date
    if (isNaN(resultDate.getTime())) {
      console.warn('Resulting date is invalid after parsing time');
      return null;
    }
    
    return resultDate;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
};

export default function ReviewSubmit({ 
  formData, 
  prevStep, 
  updateFormData, 
  nextStep,
  userRole = "STUDENT" // Change from isStaff to userRole with default
}: ReviewSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [accInfo, setAccInfo] = useState<AccInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Add role check
  const isStaff = userRole === 'STAFF';

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
    
    // Fixed time processing logic (keep existing parseTimeString logic)
    const utilTimes = formData.days.map((day, index) => {
      const dateObj = day.date instanceof Date ? day.date : new Date(day.date);
      
      let startTimeISO = null;
      let endTimeISO = null;
      
      if (day.startTime) {
        const startTimeDate = parseTimeString(day.startTime, dateObj);
        if (startTimeDate) {
          startTimeISO = startTimeDate.toISOString();
        }
      }
      
      if (day.endTime) {
        const endTimeDate = parseTimeString(day.endTime, dateObj);
        if (endTimeDate) {
          endTimeISO = endTimeDate.toISOString();
        }
      }
      
      return {
        DayNum: index + 1,
        StartTime: startTimeISO,
        EndTime: endTimeISO,
      };
    });
  
      const neededMaterials = formData.NeededMaterials?.map(material => ({
        Item: material.Item,
        ItemQty: Number(material.ItemQty),
        Description: material.Description,
      })) || [];
      
      if (formData.Tools) {
        try {
          let toolsArray = [];
          
          if (typeof formData.Tools === 'string') {
            if (formData.Tools.startsWith('[') && formData.Tools.includes('Tool')) {
              try {
                toolsArray = JSON.parse(formData.Tools);
              } catch (e) {
                toolsArray = [formData.Tools];
              }
            } else {
              toolsArray = [formData.Tools];
            }
          } else if (Array.isArray(formData.Tools)) {
            toolsArray = formData.Tools;
          } else {
            toolsArray = [String(formData.Tools)];
          }
          
          toolsArray.forEach((tool: any) => {
            if (typeof tool === 'object' && tool !== null && 'Tool' in tool) {
              const toolItem = {
                Item: tool.Tool,
                ItemQty: tool.Quantity || 1,
                Description: ''
              };
              neededMaterials.push(toolItem);
            } 
            else if (tool && typeof tool === 'string' && tool.trim() !== '') {
              const toolItem = {
                Item: tool,
                ItemQty: 1,
                Description: ''
              };
              neededMaterials.push(toolItem);
            }
          });
        } catch (toolsError) {
          console.error('Error processing tools:', toolsError);
        }
      }
  
      const evcStudents = formData.Students?.map(student => ({
        Students: student.name
      })) || [];

      const studentName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : accInfo?.Name || (isStaff ? 'Staff Member' : 'Student');
      
      const studentEmail = user?.emailAddresses[0]?.emailAddress || accInfo?.email || '';
      const userServices: UserService[] = [];
      
      const products = Array.isArray(formData.ProductsManufactured) 
        ? formData.ProductsManufactured 
        : formData.ProductsManufactured ? [formData.ProductsManufactured] : [];
        
      const equipment = Array.isArray(formData.Equipment)
        ? formData.Equipment
        : formData.Equipment ? [formData.Equipment] : [];
      
      if (products.length > 0) {
        const defaultEquipment = equipment.length > 0 ? equipment[0] : '';
        
        products.forEach((product, index) => {
          if (product) {
            const equip = index < equipment.length ? equipment[index] : defaultEquipment;
            
            userServices.push({
              ServiceAvail: product,
              EquipmentAvail: equip,
              CostsAvail: 0,
              MinsAvail: 0,
            });
          }
        });
      }
      
        // STAFF MODE: Different submission logic
    if (isStaff) {
      const submissionData = {
        ControlNo: formData.ControlNo ? Number(formData.ControlNo) : undefined,
        LvlSec: 'N/A',
        NoofStudents: 0,
        Subject: 'N/A',
        Teacher: 'N/A',
        TeacherEmail: 'N/A',
        Topic: 'N/A',
        SchoolYear: formData.SchoolYear ? Number(formData.SchoolYear) : new Date().getFullYear(),
        EVCStatus: 'Pending Admin Approval', // Skip teacher approval
        
        UtilTimes: utilTimes,
        EVCStudents: [], // Empty for staff
        NeededMaterials: neededMaterials,
        UserServices: userServices,
        
        ProductsManufactured: formData.ProductsManufactured,
        Equipment: formData.Equipment,
        
        accInfoId: accInfo?.id
      };

      console.log('Sending staff data to EVC API:', JSON.stringify(submissionData, null, 2));

      const response = await fetch('/api/user/create-evc-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        let errorData = null;
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse response as JSON:', e);
          }
        }
        const errorMessage = errorData?.details || errorData?.error || 'Failed to submit staff reservation';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Staff reservation created:', data);
      
      setSuccessMessage('Your equipment reservation has been submitted successfully and is pending admin approval.');
      setIsRedirecting(true);
      
      setTimeout(() => {
        router.push('/staff-dashboard');
      }, 3000);
      
    } else {
      // STUDENT MODE: Original EVC submission logic with teacher email
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
        
        UtilTimes: utilTimes,
        EVCStudents: evcStudents,
        NeededMaterials: neededMaterials,
        UserServices: userServices,
        
        ProductsManufactured: formData.ProductsManufactured,
        Equipment: formData.Equipment,
        
        accInfoId: accInfo?.id
      };


        console.log('Sending student data to EVC API:', JSON.stringify(submissionData, null, 2));

        const response = await fetch('/api/user/create-evc-reservation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          let errorData = null;
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
            } catch (e) {
              console.error('Failed to parse response as JSON:', e);
            }
          }
          const errorMessage = errorData?.details || errorData?.error || 'Failed to submit reservation';
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Student reservation created:', data);
        
        // Send teacher approval email for students
        if (formData.TeacherEmail && formData.TeacherEmail !== 'N/A') {
          try {
            const approvalResponse = await fetch('/api/teacher-email/approval-request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                reservationId: data.id,
                studentName,
                studentEmail,
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
                materials: formData.NeededMaterials || [],
                students: formData.Students || []
              }),
            });
            
            if (!approvalResponse.ok) {
              const approvalError = await approvalResponse.text();
              console.error('Teacher approval request failed:', approvalError);
              setError('Reservation created but teacher approval email failed to send');
            } else {
              setSuccessMessage('Your reservation request has been submitted and an approval request has been sent to your teacher.');
              setIsRedirecting(true);
            }
          } catch (emailError) {
            console.error('Error sending approval email:', emailError);
            setError('Reservation created but there was an error sending the teacher approval email');
          }
        } else {
          setSuccessMessage('Your reservation request has been submitted successfully.');
          setIsRedirecting(true);
        }

        setTimeout(() => {
          router.push('/student-dashboard');
        }, 3000);
      }
      
      } catch (err) {
        console.error('Submission error:', err);
        let errorMessage = 'Failed to submit reservation';
        if (err instanceof Error) {
        errorMessage = err.message;
        }
        setError(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
    };

  const handleSubmitWithBuffer = async () => {
    try {
      setSubmittingReservation(true);
      await handleSubmit();
    } finally {
      setTimeout(() => {
        setSubmittingReservation(false);
      }, 3000);
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

  if (submittingReservation) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
        <Card className="p-6 mt-6 bg-white shadow-sm border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"/>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                {isStaff ? 'Processing Staff Reservation' : 'Processing Your Reservation'}
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                {isStaff 
                  ? 'Please wait while we submit your equipment request for admin approval.'
                  : 'Please wait while we submit your request and notify your teacher. This may take a few moments.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
        <Card className="p-6 mt-6 bg-white shadow-sm border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mb-6"/>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Successfully Submitted!</h3>
              <p className="text-gray-600 text-center max-w-md mb-4">
                {isStaff 
                  ? 'Your equipment reservation has been submitted successfully. Redirecting you to your dashboard...'
                  : 'Your reservation request has been submitted successfully. Redirecting you to your dashboard...'
                }
              </p>
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

    return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pt-0 flex flex-col">
        {/* Staff Mode Info Banner */}
        {isStaff && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
                <h4 className="text-blue-800 font-medium">Staff Equipment Reservation</h4>
                <p className="text-blue-700 text-sm mt-1">
                Your request will go directly to admin approval without requiring teacher approval.
                </p>
            </div>
            </div>
        </div>
        )}

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

            {/* School/Class Information - Hidden for staff */}
            {!isStaff && (
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
          )}

           {/* Students List - Hidden for staff */}
        {!isStaff && formData.Students && formData.Students.length > 0 && (
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

          {/* Materials Needed */}
          {formData.NeededMaterials && formData.NeededMaterials.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" /> 
                {isStaff ? 'Equipment Requested' : 'Materials Needed'}
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
                        {formData.NeededMaterials.map((material) => (
                          <tr key={material.id} className="border-b hover:bg-gray-50">
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
                  {isStaff && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <p className="mt-1 text-gray-800">Staff Member</p>
                    </div>
                  )}
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

          {/* Teacher Email Warning - Only for students */}
             {!isStaff && !formData.TeacherEmail && (
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
              onClick={handleSubmitWithBuffer}
              disabled={isSubmitting || loading || (!isStaff && !formData.TeacherEmail)}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : (isStaff ? 'Submit Equipment Request' : 'Submit Request')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}