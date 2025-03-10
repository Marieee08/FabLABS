"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation'; // Changed from 'next/router' to 'next/navigation'
import { useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast'; // Changed from 'sonner' to '@/components/ui/use-toast'

// Type definitions for our form data
interface StudentDemographicData {
  age: string;
  sex: string | undefined;
  CC1: string | undefined;
  CC2: string | undefined;
  CC3: string | undefined;
}

interface MsmeDemographicData {
  clientType: string | undefined;
  sex: string | undefined;
  age: string;
  region: string;
  office: string;
  serviceAvailed: string[];
  otherService: string;
  CC1: string | undefined;
  CC2: string | undefined;
  CC3: string | undefined;
}

const PHILIPPINE_REGIONS = [
  "NCR - National Capital Region",
  "CAR - Cordillera Administrative Region",
  "Region I - Ilocos Region",
  "Region II - Cagayan Valley",
  "Region III - Central Luzon",
  "Region IV-A - CALABARZON",
  "Region IV-B - MIMAROPA",
  "Region V - Bicol Region",
  "Region VI - Western Visayas",
  "Region VII - Central Visayas",
  "Region VIII - Eastern Visayas",
  "Region IX - Zamboanga Peninsula",
  "Region X - Northern Mindanao",
  "Region XI - Davao Region",
  "Region XII - SOCCSKSARGEN",
  "Region XIII - Caraga",
  "BARMM - Bangsamoro Autonomous Region in Muslim Mindanao"
];

const SURVEY_QUESTIONS = {
  customer: [
    "SQD0. I am satisfied with the services that I availed.",
    "SQD1. I spent reasonable amount of time for my transaction.",
    "SQD2. The office followed the transaction's requirements and steps based on the information provided.",
    "SQD3. The steps (including payment) I needed to do for my transaction were easy and simple.",
    "SQD4. I easily found information about my transaction from the office's website.",
    "SQD5. I paid a reasonable amount of fees for my transaction. (If service was free, mark the N/A column)",
    "SQD6. I am confident my transaction was secure.",
    "SQD7. The office's support was available, and (if asked questions) support was quick to respond.",
    "SQD8. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
  ],
  employee: [
    "Technical know-how on the given tasks at hand assigned (technical skills)",
    "Attitude in working with a team (teamwork)",
    "Works to full potential",
    "Quality of work",
    "Communication",
    "Independent work",
    "Takes initiative",
    "Productivity and creativity",
    "Honesty and integrity",
    "Punctuality and attendance",
    "SSF Personnel management and assistance while you are using the services of the SSF/ Client relations",
    "SSF personnel's professionalism and aptitude",
    "The facility's responsiveness in processing your request",
    "Cleanliness and orderliness of the facility",
    "Rate (charge) of the services of the SSF",
    "Performance (efficiency and quality of products produced) of the machineries and equipment",
    "Quality of the tools used"
  ]
};

const CUSTOMER_RATING_OPTIONS = ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree", "N/A"];
const EMPLOYEE_RATING_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];
const SEX_OPTIONS = ["Male", "Female"];
const CLIENT_TYPE_OPTIONS = ["Citizen", "Business", "Government (Employee or another agency)"];
const SERVICE_OPTIONS = [
  "Application for Incoming Grade 7 Students",
  "Freshmen Enrollment",
  "Application for Incoming Grade 8 and Grade 9 Transfer Student",
  "Processing of request for School credentials (alumni)",
  "Others"
];
const CC1_OPTIONS = [
  "1. I know what a CC is and I saw this office's CC.",
  "2. I know what a CC but I did NOT see this office's CC.",
  "3. I learned of the CC only when I saw this office's CC.",
  "4. I do not know what a CC is and I did not see one in this office. (Answer 'NA' on CC2 and CC3)"
];
const CC2_OPTIONS = [
  "1. Easy to see", 
  "2. Somewhat easy to see", 
  "3. Difficult to see", 
  "4. Not visible at all",
  "5. N/A"
];
const CC3_OPTIONS = [
  "1. Helped very much", 
  "2. Somewhat helped", 
  "3. Did not help", 
  "4. N/A"
];


const SurveyForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');
  
  const [formType, setFormType] = useState('preliminary');
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student demographic data
  const [studentDemographicData, setStudentDemographicData] = useState<StudentDemographicData>({
    age: '',
    sex: undefined,
    CC1: undefined,
    CC2: undefined,
    CC3: undefined
  });
  
  // MSME demographic data
  const [msmeDemographicData, setMsmeDemographicData] = useState<MsmeDemographicData>({
    clientType: undefined,
    sex: undefined,
    age: '',
    region: '',
    office: '',
    serviceAvailed: [],
    otherService: '',
    CC1: undefined,
    CC2: undefined,
    CC3: undefined
  });
  
  const [customerFormData, setCustomerFormData] = useState(
    Object.fromEntries(SURVEY_QUESTIONS.customer.map((_, i) => [`Q${i + 1}`, undefined]))
  );

  const [employeeFormData, setEmployeeFormData] = useState(
    Object.fromEntries(SURVEY_QUESTIONS.employee.map((_, i) => [`E${i + 1}`, undefined]))
  );

  useEffect(() => {
    // Update to check if reservationId exists
    if (!reservationId) {
      toast({
        title: "Error",
        description: "No reservation ID provided.",
        variant: "destructive",
      });
      router.push('/survey');
      return;
    }
    
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/check-roles');
        const data = await response.json();
        setUserRole(data.role);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default to STUDENT if role check fails
        setUserRole('STUDENT');
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [reservationId, router]);


  const handleStudentInputChange = (question: string, value: string) => {
    setStudentDemographicData(prev => ({ ...prev, [question]: value }));
  };

  const handleMsmeInputChange = (question: string, value: string) => {
    setMsmeDemographicData(prev => ({ ...prev, [question]: value }));
  };

  const handleCheckboxChange = (service: string, checked: boolean) => {
    setMsmeDemographicData(prev => {
      if (checked) {
        return { ...prev, serviceAvailed: [...prev.serviceAvailed, service] };
      } else {
        return { ...prev, serviceAvailed: prev.serviceAvailed.filter(s => s !== service) };
      }
    });
  };

  const handleQuestionChange = (question: any, value: string) => {
    if (formType === 'customer') {
      setCustomerFormData(prev => ({ ...prev, [question]: value }));
    } else if (formType === 'employee') {
      setEmployeeFormData(prev => ({ ...prev, [question]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const demographicData = userRole === 'MSME' ? msmeDemographicData : studentDemographicData;
    
    // Prepare data for API
    const surveyData = {
      preliminary: {
        userRole,
        ...demographicData,
      },
      customer: Object.fromEntries(
        Object.entries(customerFormData).map(([key, value]) => {
          // Map Q1, Q2, etc. to SQD0, SQD1, etc.
          const sqKey = key.replace('Q', 'SQD');
          const index = parseInt(key.substring(1)) - 1;
          return [sqKey, value];
        })
      ),
      employee: employeeFormData,
      serviceAvailed: userRole === 'MSME' ? msmeDemographicData.serviceAvailed : []
    };
    
    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId,
          surveyData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Survey submitted successfully!",
      });
      
      // Redirect to the survey dashboard
      router.push('/survey');
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingScale = (question: React.ReactNode, questionKey: string, value: string | undefined) => {
    const options = formType === 'customer' ? CUSTOMER_RATING_OPTIONS : EMPLOYEE_RATING_OPTIONS;
    return (
      <div key={questionKey} className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
        <Label className="block mb-4 font-qanelas2 text-lg text-gray-700">{question}</Label>
        <RadioGroup className="flex space-x-6" value={value} onValueChange={(val) => handleQuestionChange(questionKey, val)}>
          {options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${questionKey}-${option}`} className="text-[#193d83] border-[#5e86ca]" />
              <Label htmlFor={`${questionKey}-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  const renderStudentPreliminarySection = () => {
    return (
      <>
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <Label htmlFor="age" className="block mb-4 font-qanelas2 text-lg text-gray-700">Age</Label>
          <Input 
            id="age" 
            type="number" 
            min="0" 
            max="120" 
            placeholder="Enter your age" 
            value={studentDemographicData.age} 
            onChange={(e) => handleStudentInputChange('age', e.target.value)}
            className="w-full max-w-xs border-[#5e86ca] focus:ring-[#193d83]"
          />
        </div>
        
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <Label className="block mb-4 font-qanelas2 text-lg text-gray-700">Sex</Label>
          <RadioGroup 
            className="flex space-x-6" 
            value={studentDemographicData.sex} 
            onValueChange={(val) => handleStudentInputChange('sex', val)}
          >
            {SEX_OPTIONS.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`sex-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                <Label htmlFor={`sex-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Citizen's Charter Section */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="font-qanelas2 text-sm text-gray-700">
              <strong>INSTRUCTIONS:</strong> Check mark (✓) your answer to the Citizen's Charter (CC) questions. The Citizen's Charter is an 
              official document that reflects the services of a government agency/office including its requirements, fees, and processing 
              times among others.
            </p>
          </div>
          
          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC1: Which of the following best describes your awareness of a CC?</Label>
            <RadioGroup 
              className="space-y-2" 
              value={studentDemographicData.CC1} 
              onValueChange={(val) => handleStudentInputChange('CC1', val)}
            >
              {CC1_OPTIONS.map((option) => (
                <div key={option} className="flex items-start space-x-2">
                  <RadioGroupItem value={option} id={`CC1-${option}`} className="mt-1 text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`CC1-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC2: If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was...?</Label>
            <RadioGroup 
              className="flex flex-wrap gap-4" 
              value={studentDemographicData.CC2} 
              onValueChange={(val) => handleStudentInputChange('CC2', val)}
            >
              {CC2_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`CC2-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`CC2-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="mb-2">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC3: If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?</Label>
            <RadioGroup 
              className="flex flex-wrap gap-4" 
              value={studentDemographicData.CC3} 
              onValueChange={(val) => handleStudentInputChange('CC3', val)}
            >
              {CC3_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`CC3-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`CC3-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </>
    );
  };

  const renderMsmePreliminarySection = () => {
    return (
      <>
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <div className="mb-4">
            <p className="font-qanelas2 text-sm text-gray-700 mb-4">
              This Client Satisfaction Measurement (CSM) tracks the customer experience of Philippine Science High School. Your
              feedback on your recently concluded transaction will help us provide better services. Personal information shared will be
              kept confidential and you always have the option not to answer this form.
            </p>
          </div>

          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Client type:</Label>
            <RadioGroup 
              className="flex flex-wrap gap-4" 
              value={msmeDemographicData.clientType} 
              onValueChange={(val) => handleMsmeInputChange('clientType', val)}
            >
              {CLIENT_TYPE_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`clientType-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`clientType-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Sex:</Label>
            <RadioGroup 
              className="flex space-x-6" 
              value={msmeDemographicData.sex} 
              onValueChange={(val) => handleMsmeInputChange('sex', val)}
            >
              {SEX_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`msme-sex-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`msme-sex-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="msme-age" className="block mb-3 font-qanelas2 text-lg text-gray-700">Age:</Label>
              <Input 
                id="msme-age" 
                type="number" 
                min="0" 
                max="120" 
                placeholder="Enter your age" 
                value={msmeDemographicData.age} 
                onChange={(e) => handleMsmeInputChange('age', e.target.value)}
                className="w-full border-[#5e86ca] focus:ring-[#193d83]"
              />
            </div>
            <div>
              <Label htmlFor="region" className="block mb-3 font-qanelas2 text-lg text-gray-700">Region of residence:</Label>
              <select
                id="region"
                value={msmeDemographicData.region}
                onChange={(e) => handleMsmeInputChange('region', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-[#5e86ca] focus:outline-none focus:ring-2 focus:ring-[#193d83]"
              >
                <option value="" disabled>Select your region</option>
                {PHILIPPINE_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="office" className="block mb-3 font-qanelas2 text-lg text-gray-700">Office where the service was availed:</Label>
            <Input 
              id="office" 
              type="text"
              placeholder="Enter office name" 
              value={msmeDemographicData.office} 
              onChange={(e) => handleMsmeInputChange('office', e.target.value)}
              className="w-full border-[#5e86ca] focus:ring-[#193d83]"
            />
          </div>

          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Service Availed (please check):</Label>
            <div className="space-y-2">
              {SERVICE_OPTIONS.slice(0, -1).map((service) => (
                <div key={service} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`service-${service}`} 
                    checked={msmeDemographicData.serviceAvailed.includes(service)}
                    onCheckedChange={(checked) => handleCheckboxChange(service, checked === true)}
                    className="mt-1 text-[#193d83] border-[#5e86ca]"
                  />

                  <Label htmlFor={`service-${service}`} className="font-poppins1 text-gray-600">{service}</Label>
                </div>
              ))}
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="service-others" 
                  checked={msmeDemographicData.serviceAvailed.includes("Others")}
                  onCheckedChange={(checked) => handleCheckboxChange("Others", checked === true)}
                  className="mt-1 text-[#193d83] border-[#5e86ca]"
                />
              <div className="flex flex-col">
                  <Label htmlFor="service-others" className="font-poppins1 text-gray-600">Others (Please specify):</Label>
                  {msmeDemographicData.serviceAvailed.includes("Others") && (
                    <Input 
                      id="otherService" 
                      type="text" 
                      placeholder="Specify other service" 
                      value={msmeDemographicData.otherService} 
                      onChange={(e) => handleMsmeInputChange('otherService', e.target.value)}
                      className="mt-2 w-full border-[#5e86ca] focus:ring-[#193d83]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Citizen's Charter Section */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="font-qanelas2 text-sm text-gray-700">
              <strong>INSTRUCTIONS:</strong> Check mark (✓) your answer to the Citizen's Charter (CC) questions. The Citizen's Charter is an 
              official document that reflects the services of a government agency/office including its requirements, fees, and processing 
              times among others.
            </p>
          </div>
          
          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC1: Which of the following best describes your awareness of a CC?</Label>
            <RadioGroup 
              className="space-y-2" 
              value={msmeDemographicData.CC1} 
              onValueChange={(val) => handleMsmeInputChange('CC1', val)}
            >
              {CC1_OPTIONS.map((option) => (
                <div key={option} className="flex items-start space-x-2">
                  <RadioGroupItem value={option} id={`msme-CC1-${option}`} className="mt-1 text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`msme-CC1-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC2: If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was...?</Label>
            <RadioGroup 
              className="flex flex-wrap gap-4" 
              value={msmeDemographicData.CC2} 
              onValueChange={(val) => handleMsmeInputChange('CC2', val)}
            >
              {CC2_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`msme-CC2-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`msme-CC2-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="mb-2">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC3: If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?</Label>
            <RadioGroup 
              className="flex flex-wrap gap-4" 
              value={msmeDemographicData.CC3} 
              onValueChange={(val) => handleMsmeInputChange('CC3', val)}
            >
              {CC3_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`msme-CC3-${option}`} className="text-[#193d83] border-[#5e86ca]" />
                  <Label htmlFor={`msme-CC3-${option}`} className="font-poppins1 text-gray-600">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </>
    );
  };

  const renderCustomerSection = () => {
    return (
      <>
        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <p className="font-qanelas2 text-sm text-gray-700">
            <strong>INSTRUCTIONS:</strong> For SQD 0-8, please choose the option that best corresponds to your answer.
          </p>
        </div>
        
        {SURVEY_QUESTIONS.customer.map((question, index) => (
          renderRatingScale(question, `Q${index + 1}`, customerFormData[`Q${index + 1}`])
        ))}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">Loading survey...</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto bg-[#f4f8fc] border border-[#5e86ca] rounded-2xl">
        <CardHeader className="space-y-6">
          <CardTitle className="text-3xl font-qanelas2 text-[#0e4579]">
            {formType === 'preliminary' 
              ? 'Client Satisfaction Survey' 
              : formType === 'customer' 
                ? 'Customer Feedback' 
                : 'Employee Evaluation'}
          </CardTitle>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formType === 'preliminary' && userRole === 'STUDENT' && renderStudentPreliminarySection()}
          
          {formType === 'preliminary' && userRole === 'MSME' && renderMsmePreliminarySection()}
          
          {formType === 'customer' && renderCustomerSection()}
          
          {formType === 'employee' && SURVEY_QUESTIONS.employee.map((question, index) => (
            renderRatingScale(question, `E${index + 1}`, employeeFormData[`E${index + 1}`])
          ))}
          
          <div className="flex justify-between mt-8">
            {formType === 'customer' && (
              <Button type="button" onClick={() => setFormType('preliminary')} className="bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50 font-qanelas1">Back</Button>
            )}
            
            {formType === 'employee' && (
              <Button type="button" onClick={() => setFormType('customer')} className="bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50 font-qanelas1">Back</Button>
            )}
            
            {formType === 'preliminary' && (
              <Button 
                type="button"
                onClick={() => setFormType('customer')} 
                className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1"
                disabled={
                  userRole === 'STUDENT' 
                    ? !studentDemographicData.age || !studentDemographicData.sex 
                    : !msmeDemographicData.clientType || !msmeDemographicData.sex || !msmeDemographicData.age || msmeDemographicData.serviceAvailed.length === 0
                }
              >
                Next
              </Button>
            )}
            
            {formType === 'customer' && (
              <Button type="button" onClick={() => setFormType('employee')} className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1">Next</Button>
            )}
            
            {formType === 'employee' && (
              <Button 
                type="submit" 
                className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </form>
        </CardContent>
    </Card>
  </div>
);
};

export default SurveyForm;