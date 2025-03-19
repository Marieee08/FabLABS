// /components/student-forms/review-submit/page.tsx

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface ClientInfo {
  ContactNum: string;
  Address: string | null;
  City: string | null;
  Province: string | null;
  Zipcode: number | null;
}

interface BusinessInfo {
  CompanyName: string | null;
  BusinessOwner: string | null;
  BusinessPermitNum: string | null;
  TINNum: string | null;
  CompanyEmail: string | null;
  ContactPerson: string | null;
  Designation: string | null;
  CompanyAddress: string | null;
  CompanyCity: string | null;
  CompanyProvince: string | null;
  CompanyZipcode: number | null;
  CompanyPhoneNum: string | null;
  CompanyMobileNum: string | null;
  Manufactured: string | null;
  ProductionFrequency: string | null;
  Bulk: string | null;
}

interface AccInfo {
  id: number;
  clerkId: string;
  Name: string;
  email: string;
  Role: string;
  ClientInfo: ClientInfo | null;
  BusinessInfo: BusinessInfo | null;
}

interface FormData {
  days: {
    date: Date;
    startTime: string | null;
    endTime: string | null;
  }[];
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
}

interface ReviewSubmitProps {
  formData: FormData;
  prevStep: () => void;
  updateFormData: (field: keyof FormData, value: FormData[keyof FormData]) => void;
}

const parseToolString = (toolString: string): { Tool: string; Quantity: number }[] => {
  if (!toolString || toolString === 'NOT APPLICABLE') return [];
  try {
    return JSON.parse(toolString);
  } catch {
    return [];
  }
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function ReviewSubmit({ formData, prevStep, updateFormData }: ReviewSubmitProps) {
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
      
      const submissionData = {
        ...formData,
        days: formData.days.map(day => ({
          ...day,
          date: new Date(day.date)
        }))
      };

      const response = await fetch('/api/user/create-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...submissionData,
          userInfo: {
            clientInfo: accInfo?.ClientInfo,
            businessInfo: accInfo?.BusinessInfo
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reservation');
      }

      router.push('/user-dashboard');
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-11">
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        </Card>
      </div>
    );
  }

  const renderSection = (title: string, content: JSX.Element) => (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      {content}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 mt-11">
        <h2 className="text-2xl font-semibold mb-6">Review Your Information</h2>

        {renderSection('Selected Dates and Times',
          <div className="grid grid-cols-2 gap-6 border border-gray-300 rounded-md p-4">
            {formData.days.length > 0 ? (
              [...formData.days]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((day, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="font-medium">Day {index + 1}</h4>
                    <p>Date: {formatDate(day.date)}</p>
                    <p>Start Time: {day.startTime}</p>
                    <p>End Time: {day.endTime}</p>
                  </div>
                ))
            ) : (
              <p>No dates selected</p>
            )}
          </div>
        )}

        {renderSection('Personal Information',
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="mt-1">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Grade Level and Section</p>
              <p className="mt-1">{accInfo?.ClientInfo?.ContactNum || 'Not provided'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Email</p>
              <p className="mt-1">
                {accInfo?.ClientInfo ? 
                  `${accInfo.ClientInfo.Address || ''}, ${accInfo.ClientInfo.City || ''}, ${accInfo.ClientInfo.Province || ''} ${accInfo.ClientInfo.Zipcode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') 
                  : 'Not provided'}
              </p>
            </div>
          </div>
        )}


        {renderSection('Utilization Information',
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Services Availed</p>
              {Array.isArray(formData.ProductsManufactured) ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {formData.ProductsManufactured.map((service, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1">{formData.ProductsManufactured || 'Not provided'}</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Bulk of Commodity</p>
              <p className="mt-1">{formData.BulkofCommodity || 'Not provided'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Tools</p>
              {parseToolString(formData.Tools).length > 0 ? (
                <div className="mt-2 space-y-2">
                  {parseToolString(formData.Tools).map((tool, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="flex-grow">{tool.Tool}</span>
                      <span className="text-gray-600">
                        Quantity: {tool.Quantity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1">No tools selected</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 flex justify-between">
          <button 
            onClick={prevStep}
            disabled={isSubmitting}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </Card>
    </div>
  );
}