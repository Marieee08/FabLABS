import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Briefcase, User, CreditCard, FileText, Link as LinkIcon, MessageSquare } from 'lucide-react';
import Link from 'next/link';
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

interface GroupedServiceData {
  [serviceName: string]: {
    service: ServiceCost;
    dates: DateInfo[];
    totalServiceCost: number;
  }
}

interface CostReviewProps {
  selectedServices: string[];
  days: Day[];
  onCostCalculated?: (cost: number) => void;
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

const CostReviewTable = ({ 
  selectedServices, 
  days, 
  onCostCalculated = () => {},
  onServiceCostsCalculated = () => {} 
}: CostReviewProps & { onServiceCostsCalculated?: (serviceData: GroupedServiceData) => void }) => {
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedData, setGroupedData] = useState<GroupedServiceData>({});

  const getNumericCost = useCallback((cost: number | string): number => {
    if (typeof cost === 'number') return cost;
    const cleanedCost = cost.replace(/[₱,]/g, '');
    const parsedCost = parseFloat(cleanedCost);
    return isNaN(parsedCost) ? 0 : parsedCost;
  }, []);

  const calculateDuration = useCallback((startTime: string | null, endTime: string | null): number => {
    if (!startTime || !endTime) return 0;
    
    const convertTo24Hour = (time: string): string => {
      const [timePart, meridiem] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (meridiem?.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (meridiem?.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const start24 = startTime.toLowerCase().includes('m') ? convertTo24Hour(startTime) : startTime;
    const end24 = endTime.toLowerCase().includes('m') ? convertTo24Hour(endTime) : endTime;
    
    const [startHour, startMinute] = start24.split(':').map(Number);
    const [endHour, endMinute] = end24.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const durationInHours = (endTotalMinutes - startTotalMinutes) / 60;
    return durationInHours > 0 ? durationInHours : 0;
  }, []);

  const calculateBillableHours = useCallback((duration: number): number => {
    return Math.ceil(duration);
  }, []);

  useEffect(() => {
    const fetchServiceCosts = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch service costs');
        const data = await response.json();
        setServiceCosts(data);
      } catch (err) {
        setError('Failed to load service costs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceCosts();
  }, []);

  useEffect(() => {
    if (!serviceCosts.length || !selectedServices.length || !days.length) {
      setGroupedData({});
      return;
    }


    // New function to validate machine availability for all time slots
const validateMachineAvailability = async () => {
  const selectedServices = Array.isArray(formData.ProductsManufactured) 
    ? formData.ProductsManufactured 
    : [formData.ProductsManufactured];
    
  if (selectedServices.length === 0 || formData.days.length === 0) {
    return false;
  }
  
  try {
    // Check each day and time slot
    for (const day of formData.days) {
      if (!day.startTime || !day.endTime) continue;
      
      // Check against the API
      const response = await fetch('/api/machine-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedServices[0], // Check primary service
          date: new Date(day.date).toISOString(),
          startTime: day.startTime,
          endTime: day.endTime
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check machine availability');
      }
      
      const data = await response.json();
      
      if (!data.available) {
        setError(`No machines available for ${new Date(day.date).toLocaleDateString()} from ${day.startTime} to ${day.endTime}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating machine availability:', error);
    setError('Failed to validate machine availability');
    return false;
  }
};
    
    // Group data by service for clearer organization
    const calculatedGroupedData: GroupedServiceData = selectedServices.reduce<GroupedServiceData>((acc, serviceName) => {
      const service = serviceCosts.find(s => s.Service === serviceName);
      if (!service || !service.Costs) return acc;
      
      if (!acc[serviceName]) {
        acc[serviceName] = { 
          service, 
          dates: [], 
          totalServiceCost: 0 
        };
      }
      
      return acc;
    }, {});

    // Fill the grouped data with dates and costs
    Object.keys(calculatedGroupedData).forEach(serviceName => {
      const { service } = calculatedGroupedData[serviceName];
      let serviceTotalCost = 0;
      
      days.forEach(day => {
        const duration = calculateDuration(day.startTime, day.endTime);
        const billableHours = calculateBillableHours(duration);
        const numericCost = getNumericCost(service.Costs);
        const cost = billableHours * numericCost;
        
        calculatedGroupedData[serviceName].dates.push({
          day,
          duration,
          billableHours,
          cost
        });
        
        serviceTotalCost += cost;
      });
      
      calculatedGroupedData[serviceName].totalServiceCost = serviceTotalCost;
    });

    setGroupedData(calculatedGroupedData);
    
    // Call the callback with the calculated data
    onServiceCostsCalculated(calculatedGroupedData);
    
    // Calculate and report the total cost
    let totalCost = 0;
    Object.values(calculatedGroupedData).forEach(data => {
      totalCost += data.totalServiceCost;
    });
    onCostCalculated(totalCost);
    
  }, [serviceCosts, selectedServices, days, getNumericCost, calculateDuration, calculateBillableHours, onCostCalculated, onServiceCostsCalculated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  // Create an array of service cost details for the API
  const serviceCostDetails = Object.entries(groupedData).map(([serviceName, data]) => ({
    serviceName,
    totalCost: data.totalServiceCost,
    daysCount: data.dates.length
  }));

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="p-3 text-left border text-gray-700 font-semibold">Service</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Date</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Duration</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Rate</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Cost</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([serviceName, data], serviceIndex) => (
            <React.Fragment key={serviceName}>
              {data.dates.map((dateInfo, dateIndex) => (
                <tr 
                  key={`${serviceName}-${dateIndex}`} 
                  className={`
                    ${dateIndex === data.dates.length - 1 && serviceIndex !== Object.keys(groupedData).length - 1 ? 'border-b-2 border-gray-200' : 'border-b'} 
                    hover:bg-gray-50
                  `}
                >
                  {dateIndex === 0 ? (
                    <td className="p-3 border font-medium" rowSpan={data.dates.length}>
                      {serviceName}
                    </td>
                  ) : null}
                  <td className="p-3 border">
                    {new Date(dateInfo.day.date).toLocaleDateString('en-US', {
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </td>
                  <td className="p-3 border">
                    {dateInfo.duration.toFixed(2)} hours
                    {dateInfo.duration !== dateInfo.billableHours && (
                      <div className="text-xs text-gray-500">
                        (Billed as {dateInfo.billableHours} {dateInfo.billableHours === 1 ? 'hour' : 'hours'})
                      </div>
                    )}
                  </td>
                  <td className="p-3 border">
                    ₱{getNumericCost(data.service.Costs).toFixed(2)} per {data.service.Per}
                  </td>
                  <td className="p-3 border">₱{dateInfo.cost.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-b hover:bg-blue-100">
                <td colSpan={4} className="p-3 border text-right font-medium">
                  Subtotal for {serviceName}
                </td>
                <td className="p-3 border text-blue-700 font-medium">
                  ₱{data.totalServiceCost.toFixed(2)}
                </td>
              </tr>
            </React.Fragment>
          ))}
          <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
            <td colSpan={4} className="p-3 border text-right">Total Cost</td>
            <td className="p-3 border text-blue-800">
              ₱{Object.values(groupedData).reduce((total, data) => total + data.totalServiceCost, 0).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
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

  useEffect(() => {
    // Log formData when it changes to help with debugging
    console.log("Review submit formData:", {
      services: formData.ProductsManufactured,
      hasServiceLinks: !!formData.serviceLinks,
      serviceLinksKeys: formData.serviceLinks ? Object.keys(formData.serviceLinks) : [],
      remarks: formData.Remarks
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
      setIsSubmitting(true);
      setError('');
      
      // Check machine availability before proceeding
      const availability = await validateMachineAvailability();
      if (!availability) {
        setIsSubmitting(false);
        return; // Don't proceed if machines aren't available
      }
      
      // Rest of your submit logic...
      const token = await getToken();
      
      // (Your existing code for submitting the reservation...)
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reservation');
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

  // Get all selected services
  const selectedServices = Array.isArray(formData.ProductsManufactured) 
    ? formData.ProductsManufactured 
    : [formData.ProductsManufactured].filter(Boolean);

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
            <CostReviewTable
              selectedServices={selectedServices}
              days={formData.days}
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

function validateMachineAvailability() {
  throw new Error('Function not implemented.');
}
