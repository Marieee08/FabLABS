// src\components\msme-forms\review-submit.tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Briefcase, User, CreditCard, FileText, Link as LinkIcon, MessageSquare } from 'lucide-react';
import CostReview from '@/components/msme-forms/cost-review';
import { toast } from 'sonner';

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

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface FormData {
  days: Day[];
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  serviceLinks?: {[service: string]: string};
  Remarks?: string;
  serviceMachineNumbers?: Record<string, number>;
  NeededMaterials?: Array<{
    Item: string;
    ItemQty: number;
    Description: string;
  }>;
  // Add other fields as needed
  [key: string]: any; // Add index signature for dynamic access
}

interface ReviewSubmitProps {
  formData: FormData;
  prevStep: () => void;
  nextStep?: () => void;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

interface GroupedServiceData {
  [serviceName: string]: {
    service: {
      Service: string;
      Costs: number | string;
      Per: string;
    };
    dates: Array<{
      day: Day;
      duration: number;
      billableHours: number;
      cost: number;
    }>;
    totalServiceCost: number;
  }
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

export default function ReviewSubmit({ formData, prevStep, updateFormData, nextStep }: ReviewSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [accInfo, setAccInfo] = useState<AccInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [serviceCostData, setServiceCostData] = useState<GroupedServiceData>({});
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    return Array.isArray(formData.ProductsManufactured) 
      ? formData.ProductsManufactured 
      : [formData.ProductsManufactured].filter(Boolean);
  });

  const handlePrevStep = useCallback(() => {
    // Make sure the ProductsManufactured is always an array before going back
    if (!Array.isArray(formData.ProductsManufactured) && formData.ProductsManufactured) {
      updateFormData('ProductsManufactured', [formData.ProductsManufactured]);
    }
    
    // Log state for debugging
    console.log("Going back to previous step with formData:", {
      services: formData.ProductsManufactured,
      serviceLinks: formData.serviceLinks,
      machineNumbers: formData.serviceMachineNumbers
    });
    
    // Call the original prevStep function
    prevStep();
  }, [formData, prevStep, updateFormData]);

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

  // Update selectedServices whenever formData.ProductsManufactured changes
  useEffect(() => {
    const newSelectedServices = Array.isArray(formData.ProductsManufactured) 
      ? formData.ProductsManufactured 
      : [formData.ProductsManufactured].filter(Boolean);
    
    console.log("Updating selectedServices from formData:", newSelectedServices);
    setSelectedServices(newSelectedServices);
  }, [formData.ProductsManufactured]);

  useEffect(() => {
    // Log formData when it changes to help with debugging
    console.log("Review submit formData:", {
      services: formData.ProductsManufactured,
      hasServiceLinks: !!formData.serviceLinks,
      serviceLinksKeys: formData.serviceLinks ? Object.keys(formData.serviceLinks) : [],
      remarks: formData.Remarks,
      machineNumbers: formData.serviceMachineNumbers,
    });
  }, [formData]);

  const handleCostCalculated = useCallback((cost: number) => {
    setTotalCost(cost);
  }, []);

  const handleServiceCostsCalculated = useCallback((serviceData: GroupedServiceData) => {
    setServiceCostData(serviceData);
  }, []);

  const handleSubmit = async () => {
    try {
      // Set submission state
      setIsSubmitting(true);
      setError('');
  
      // Get authentication token
      const token = await getToken();
      
      // Create a clean version of service cost data to avoid circular references
      const simplifiedServiceData = {};
      Object.entries(serviceCostData).forEach(([service, data]) => {
        simplifiedServiceData[service] = {
          totalServiceCost: data.totalServiceCost,
          dates: data.dates.map(date => ({
            day: {
              date: date.day.date,
              startTime: date.day.startTime,
              endTime: date.day.endTime
            },
            duration: date.duration,
            billableHours: date.billableHours,
            cost: date.cost
          }))
        };
      });
      
      // Prepare service cost details array for the API
      const serviceCostDetails = Object.entries(serviceCostData).map(([serviceName, data]) => ({
        serviceName,
        totalCost: data.totalServiceCost,
        daysCount: data.dates.length
      }));
      
      // Helper function to calculate total minutes across selected days
      const calculateTotalMinutes = (days: Day[]) => {
        return days.reduce((total, day) => {
          if (day.startTime && day.endTime) {
            const start = new Date(`1970-01-01T${day.startTime}`);
            const end = new Date(`1970-01-01T${day.endTime}`);
            return total + (end.getTime() - start.getTime()) / (1000 * 60);
          }
          return total;
        }, 0);
      };
  
      // Prepare UserServices with correct quantity
      const prepareUserServices = () => {
        const userServices: any[] = [];
      
        // Iterate through selected services
        Object.entries(formData.serviceMachineNumbers || {}).forEach(([service, quantity]) => {
          // Get the total cost for this service
          const serviceData = serviceCostData[service];
          const totalServiceCost = serviceData?.totalServiceCost || 0;
          const totalMinutes = calculateTotalMinutes(formData.days);
      
          // Create multiple UserService entries based on quantity
          for (let i = 0; i < quantity; i++) {
            userServices.push({
              ServiceAvail: service,
              EquipmentAvail: 'Not Specified',
              CostsAvail: totalServiceCost / quantity,
              MinsAvail: totalMinutes,
              Files: formData.serviceLinks?.[service] || ''
              // Removed MachineNo field
            });
          }
        });
      
        return userServices;
      };
  
      // Prepare tools data for submission
      const prepareUserTools = () => {
        try {
          if (formData.Tools) {
            const toolsData = typeof formData.Tools === 'string' 
              ? JSON.parse(formData.Tools) 
              : formData.Tools;
            
            return Array.isArray(toolsData) 
              ? toolsData.map(tool => ({
                  ToolUser: tool.Tool,
                  ToolQuantity: parseInt(tool.Quantity) || 1
                }))
              : [];
          }
          return [];
        } catch (e) {
          console.warn('Error parsing tools data:', e);
          return [];
        }
      };
  
      // Remove any circular references from form data
      const cleanedFormData = {
        ...formData,
        // Normalize dates
        days: formData.days.map(day => ({
          date: day.date instanceof Date ? day.date.toISOString() : day.date,
          startTime: day.startTime,
          endTime: day.endTime
        })),
        // Ensure ProductsManufactured is always an array
        ProductsManufactured: Array.isArray(formData.ProductsManufactured) 
          ? formData.ProductsManufactured 
          : [formData.ProductsManufactured],
        // Add processed data
        TotalAmntDue: totalCost,
        serviceCostDetails,
        groupedServiceData: simplifiedServiceData,
        UserServices: prepareUserServices(),
        UserTools: prepareUserTools()
      };
  
      // Log cleaned data for debugging
      console.log("Submitting reservation with cleaned data:", JSON.stringify(cleanedFormData, null, 2));
  
      // Send reservation request
      const response = await fetch('/api/user/create-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...cleanedFormData,
          userInfo: {
            clientInfo: accInfo?.ClientInfo,
            businessInfo: accInfo?.BusinessInfo
          }
        }),
      });
  
      // Log full response details for debugging
      console.log('Response status:', response.status);
  
      // Parse response
      let responseData: any;
      try {
        responseData = await response.text();
        
        // Try to parse the text as JSON
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // If parsing fails, keep the original text
          console.warn('Response was not JSON', responseData);
        }
        
        // Log the parsed or raw response data
        console.log('Full response body:', responseData);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = { error: 'Failed to parse server response' };
      }
  
      // Handle non-successful responses
      if (!response.ok) {
        // More comprehensive error logging
        console.error('Reservation submission error details:', {
          status: response.status,
          responseData,
          cleanedFormData
        });
        
        // Extract most informative error message
        const errorMessage = 
          // Check for nested error messages
          (typeof responseData === 'object' && 
            (responseData.details?.message || 
             responseData.details?.error || 
             responseData.error || 
             responseData.message)) || 
          // Fallback to response status text
          response.statusText || 
          // Ultimate fallback
          'Failed to submit reservation';
        
        // Throw an error with the extracted message
        throw new Error(errorMessage);
      }
  
      // Log successful reservation
      console.log("Reservation created successfully:", responseData);
  
      // Show success toast
      toast({
        title: "Success!",
        description: "Your service has been scheduled successfully!",
      });
  
      // Redirect to dashboard
      router.push('/user-dashboard');
      
    } catch (err) {
      // Handle submission errors
      console.error('Submission error:', err);
      
      // Extract error message
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to submit reservation';
      
      // Set error state
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Reset submission state
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
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-medium text-gray-800 flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" /> Review Your Information
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
  
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" /> Personal Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="mt-1 text-gray-800">{user?.firstName} {user?.lastName}</p>
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
  
          {/* Business Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Briefcase className="h-5 w-5 text-blue-600 mr-2" /> Business Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Company Name</p>
                    <p className="mt-1 text-gray-800">{accInfo?.BusinessInfo?.CompanyName || 'Not provided'}</p>
                  </div>
                  {[
                    { label: 'Business Owner', value: accInfo?.BusinessInfo?.BusinessOwner },
                    { label: 'Email', value: accInfo?.BusinessInfo?.CompanyEmail },
                    { label: 'Business Permit Number', value: accInfo?.BusinessInfo?.BusinessPermitNum },
                    { label: 'TIN Number', value: accInfo?.BusinessInfo?.TINNum },
                    { label: 'Contact Person', value: accInfo?.BusinessInfo?.ContactPerson },
                    { label: 'Position/Designation', value: accInfo?.BusinessInfo?.Designation }
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="mt-1 text-gray-800">{value || 'Not provided'}</p>
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Company Address</p>
                    <p className="mt-1 text-gray-800">
                      {accInfo?.BusinessInfo ? 
                        `${accInfo.BusinessInfo.CompanyAddress || ''}, ${accInfo.BusinessInfo.CompanyCity || ''}, ${accInfo.BusinessInfo.CompanyProvince || ''} ${accInfo.BusinessInfo.CompanyZipcode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '')
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
  
          {/* Utilization Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" /> Utilization Information
            </h3>
            <Card className="border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Services Availed</p>
                    {selectedServices.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedServices.map((service, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-800">No services selected</p>
                    )}
                  </div>
                  
                  {formData.serviceMachineNumbers && Object.keys(formData.serviceMachineNumbers).length > 0 && (
                    <div className="md:col-span-2 mt-4">
                      <p className="text-sm font-medium text-gray-700">Machine Quantities</p>
                      <div className="mt-2 space-y-2">
                        {Object.entries(formData.serviceMachineNumbers)
                          .filter(([service, quantity]) => selectedServices.includes(service) && quantity > 0)
                          .map(([service, quantity]) => (
                            <div 
                              key={service} 
                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                              <span className="font-medium text-gray-800">{service}</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {quantity} {quantity === 1 ? 'machine' : 'machines'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
  
                  {/* Display resource links for each service */}
                  {formData.serviceLinks && Object.keys(formData.serviceLinks).length > 0 && (
                    <div className="md:col-span-2 mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Resource Links</p>
                      {selectedServices.map(service => 
                        formData.serviceLinks && formData.serviceLinks[service] ? (
                          <div key={service} className="mb-3 p-3 border rounded-md">
                            <p className="text-sm font-medium text-blue-700">{service}</p>
                            <div className="mt-2 flex items-start">
                              <LinkIcon className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                              <p className="text-sm text-blue-600 break-all">
                                {formData.serviceLinks[service]}
                              </p>
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Bulk of Commodity</p>
                    <p className="mt-1 text-gray-800">{formData.BulkofCommodity || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Tools</p>
                    {parseToolString(formData.Tools).length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {parseToolString(formData.Tools).map((tool, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <span className="flex-grow text-gray-800">{tool.Tool}</span>
                            <span className="text-gray-600">
                              Quantity: {tool.Quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-800">No tools selected</p>
                    )}
                  </div>
                  
                  {/* Display Remarks */}
                  {formData.Remarks && (
                    <div className="md:col-span-2 mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Remarks</p>
                      <div className="p-3 border rounded-md bg-gray-50">
                        <div className="flex gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 whitespace-pre-wrap">{formData.Remarks}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
  
          {/* Cost Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" /> Cost Breakdown
            </h3>
            <CostReview
            selectedServices={selectedServices}
            days={formData.days}
            serviceMachineNumbers={formData.serviceMachineNumbers}
            onCostCalculated={handleCostCalculated}
            onServiceCostsCalculated={handleServiceCostsCalculated}
          />
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
              onClick={handlePrevStep}
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
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : 'Submit Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}