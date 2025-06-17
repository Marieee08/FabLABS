// /survey/internal-survey/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/custom/navbar';

// Constants moved outside component to prevent re-creation on each render
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

const SATISFACTION_OPTIONS = ["Strongly Agree", "Agree", "Neither Agree nor Disagree", "Disagree", "Strongly Disagree", "N/A"];

const SQD_QUESTIONS = [
  "SQD0. I am satisfied with the services that I availed.",
  "SQD1. I spent reasonable amount of time for my transaction.",
  "SQD2. The office followed the transaction's requirements and steps based on the information provided.",
  "SQD3. The steps (including payment) I needed to do for my transaction were easy and simple.",
  "SQD4. I easily found information about my transaction from the office's website.",
  "SQD5. I paid a reasonable amount of fees for my transaction. (If service was free, mark the N/A column)",
  "SQD6. I am confident my transaction was secure.",
  "SQD7. The office's support was available, and (if asked questions) support was quick to respond.",
  "SQD8. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
];

interface InternalSurveyData {
  clientType: string | undefined;
  sex: string | undefined;
  age: string;
  dateOfTransaction: string;
  officeAvailed: string;
  serviceAvailed: string[];
  otherService: string;
  CC1: string | undefined;
  CC2: string | undefined;
  CC3: string | undefined;
}

// Memoized component for radio options
const RadioOption = memo(({ 
  id, 
  value, 
  label 
}: { 
  id: string, 
  value: string, 
  label: string 
}) => (
  <div className="flex items-center space-x-2">
    <RadioGroupItem value={value} id={id} className="text-[#193d83] border-[#5e86ca]" />
    <Label htmlFor={id} className="font-poppins1 text-gray-600">{label}</Label>
  </div>
));

RadioOption.displayName = 'RadioOption';

// Fixed RatingScale component with proper RadioGroup wrapper
const RatingScale = memo(({ 
  question, 
  questionKey, 
  value, 
  options, 
  onChange 
}: { 
  question: React.ReactNode, 
  questionKey: string, 
  value: string | undefined, 
  options: string[], 
  onChange: (key: string, value: string) => void 
}) => {
  const handleChange = useCallback((val: string) => {
    onChange(questionKey, val);
  }, [onChange, questionKey]);

  return (
    <div className="mb-6 bg-white p-4 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
      <Label className="block mb-3 font-qanelas2 text-md text-gray-700">{question}</Label>
      <RadioGroup value={value} onValueChange={handleChange} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${questionKey}-${option}`} className="text-[#193d83] border-[#5e86ca]" />
            <Label htmlFor={`${questionKey}-${option}`} className="font-poppins1 text-sm text-gray-600">{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
});

RatingScale.displayName = 'RatingScale';

// Checkbox option component
const CheckboxOption = memo(({ 
  id, 
  label, 
  checked, 
  onChange 
}: { 
  id: string, 
  label: string, 
  checked: boolean, 
  onChange: (checked: boolean) => void 
}) => {
  const handleChange = useCallback((checked: boolean) => {
    onChange(checked === true);
  }, [onChange]);

  return (
    <div className="flex items-start space-x-2">
      <Checkbox 
        id={id} 
        checked={checked}
        onCheckedChange={handleChange}
        className="mt-1 text-[#193d83] border-[#5e86ca]"
      />
      <Label htmlFor={id} className="font-poppins1 text-gray-600">{label}</Label>
    </div>
  );
});

CheckboxOption.displayName = 'CheckboxOption';

const InternalSurveyForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');
  
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [surveyData, setSurveyData] = useState<InternalSurveyData>({
    clientType: "Government (Employee or another agency)", // Pre-filled for staff
    sex: undefined,
    age: '',
    dateOfTransaction: '',
    officeAvailed: 'SRA OFFICE',
    serviceAvailed: ["Availment of school facilities"], // Pre-filled
    otherService: '',
    CC1: undefined,
    CC2: undefined,
    CC3: undefined
  });
  
  // Initialize SQD form data
  const [sqdFormData, setSqdFormData] = useState<Record<string, string | undefined>>(
    Object.fromEntries(SQD_QUESTIONS.map((_, i) => [`SQD${i}`, undefined]))
  );

  const validateAge = useCallback((age: string): string => {
    if (!age) return 'Age is required';
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return 'Age must be between 1 and 120';
    return '';
  }, []);

  const validateDate = useCallback((date: string): string => {
    if (!date) return 'Date of transaction is required';
    return '';
  }, []);

  const validateOtherService = useCallback((service: string): string => {
    if (!service.trim()) return 'Please specify the other service';
    if (service.trim().length < 3) return 'Service description must be at least 3 characters';
    return '';
  }, []);

  // Fetch user role only once on mount
  useEffect(() => {
    if (!reservationId) {
      toast({
        title: "Error",
        description: "No reservation ID provided.",
        variant: "destructive",
      });
      router.push('/survey');
      return;
    }
    
    const abortController = new AbortController();
    
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/check-roles', {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        
        const data = await response.json();
        
        if (data.role !== 'STAFF') {
          toast({
            title: "Access Denied",
            description: "You need staff access to view this page.",
            variant: "destructive",
          });
          router.push('/');
          return;
        }
        
        setUserRole('STAFF');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching user role:', error);
          // Fallback for development
          setUserRole('STAFF');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserRole();
    
    return () => {
      abortController.abort();
    };
  }, [reservationId, router]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((question: string, value: string) => {
    setSurveyData(prev => ({ ...prev, [question]: value }));
    
    // Real-time validation
    let error = '';
    switch (question) {
      case 'age':
        error = validateAge(value);
        break;
      case 'dateOfTransaction':
        error = validateDate(value);
        break;
      case 'otherService':
        error = validateOtherService(value);
        break;
    }
    
    setValidationErrors(prev => ({ ...prev, [question]: error }));
  }, [validateAge, validateDate, validateOtherService]);

  const handleCheckboxChange = useCallback((service: string, checked: boolean) => {
    setSurveyData(prev => {
      if (checked) {
        return { ...prev, serviceAvailed: [...prev.serviceAvailed, service] };
      } else {
        return { ...prev, serviceAvailed: prev.serviceAvailed.filter(s => s !== service) };
      }
    });
  }, []);

  const handleSqdChange = useCallback((question: string, value: string) => {
    setSqdFormData(prev => ({ ...prev, [question]: value }));
  }, []);

  // Memoized validation check
  const formComplete = useMemo(() => Boolean(
    surveyData.clientType && 
    surveyData.sex && 
    surveyData.age && 
    surveyData.age !== '0' &&
    !validationErrors.age &&
    surveyData.dateOfTransaction &&
    !validationErrors.dateOfTransaction &&
    surveyData.officeAvailed &&
    surveyData.serviceAvailed.length > 0 &&
    !(surveyData.serviceAvailed.includes("Others") && (!surveyData.otherService || surveyData.otherService.trim() === '' || validationErrors.otherService)) &&
    surveyData.CC1 &&
    (surveyData.CC1 === CC1_OPTIONS[3] || (surveyData.CC2 && surveyData.CC3)) &&
    Object.values(sqdFormData).every(value => value !== undefined)
  ), [surveyData, validationErrors, sqdFormData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservationId) {
      toast({
        title: "Error",
        description: "No reservation ID provided.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const submissionData = {
      reservationId,
      surveyData: {
        preliminary: {
          userRole: 'STAFF',
          ...surveyData,
        },
        customer: sqdFormData,
        serviceAvailed: surveyData.serviceAvailed
      }
    };
    
    try {
      const response = await fetch('/api/survey/submit-internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }
      
      router.push('/survey/thank-you');
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
  }, [surveyData, sqdFormData, reservationId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">Loading survey...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8 pt-28 px-4">
        <Card className="w-full max-w-4xl mx-auto bg-[#f4f8fc] border border-[#5e86ca] rounded-2xl">
          <CardHeader className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Republic of the Philippines</h1>
                <h2 className="text-lg font-semibold text-gray-700">Department of Science and Technology</h2>
                <h3 className="text-md font-semibold text-gray-700">PHILIPPINE SCIENCE HIGH SCHOOL SYSTEM</h3>
                <p className="text-sm text-gray-600">Campus/Office: ___EASTERN VISAYAS___</p>
              </div>
              <CardTitle className="text-2xl font-qanelas2 text-[#0e4579] mb-2">
                CLIENT SATISFACTION SURVEY
              </CardTitle>
              <p className="text-sm text-gray-600">(Internal Clients)</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
              <p className="font-qanelas2 text-sm text-gray-700">
                This Client Satisfaction Measurement (CSM) tracks the customer experience of Philippine Science High School. 
                Your feedback on your recently concluded transaction will help us provide better services. Personal information 
                shared will be kept confidential and you always have the option not to answer this form.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Information */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-qanelas2 text-gray-800 mb-4">Client Information</h3>
                
                <div className="mb-6">
                  <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Client type:</Label>
                  <RadioGroup 
                    className="flex flex-wrap gap-4" 
                    value={surveyData.clientType} 
                    onValueChange={(val) => handleInputChange('clientType', val)}
                  >
                    {CLIENT_TYPE_OPTIONS.map((option) => (
                      <RadioOption 
                        key={option}
                        id={`clientType-${option}`}
                        value={option}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Sex:</Label>
                    <RadioGroup 
                      className="flex space-x-6" 
                      value={surveyData.sex} 
                      onValueChange={(val) => handleInputChange('sex', val)}
                    >
                      {SEX_OPTIONS.map((option) => (
                        <RadioOption 
                          key={option}
                          id={`sex-${option}`}
                          value={option}
                          label={option}
                        />
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="age" className="block mb-3 font-qanelas2 text-lg text-gray-700">Age:</Label>
                    <Input 
                      id="age" 
                      type="number" 
                      min="0" 
                      max="120" 
                      placeholder="Enter your age" 
                      value={surveyData.age} 
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-full border-[#5e86ca] focus:ring-[#193d83]"
                    />
                    {validationErrors.age && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.age}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="dateOfTransaction" className="block mb-3 font-qanelas2 text-lg text-gray-700">Date of Transaction:</Label>
                    <Input 
                      id="dateOfTransaction" 
                      type="date"
                      value={surveyData.dateOfTransaction} 
                      onChange={(e) => handleInputChange('dateOfTransaction', e.target.value)}
                      className="w-full border-[#5e86ca] focus:ring-[#193d83]"
                    />
                    {validationErrors.dateOfTransaction && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.dateOfTransaction}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="office" className="block mb-3 font-qanelas2 text-lg text-gray-700">Office where the service was availed:</Label>
                    <Input 
                      id="office" 
                      type="text"
                      placeholder="Enter office name" 
                      value={surveyData.officeAvailed} 
                      onChange={(e) => handleInputChange('officeAvailed', e.target.value)}
                      className="w-full border-[#5e86ca] focus:ring-[#193d83]"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Service Availed (please check):</Label>
                  <div className="space-y-2">
                    {SERVICE_OPTIONS.slice(0, -1).map((service) => (
                      <CheckboxOption
                        key={service}
                        id={`service-${service}`}
                        label={service}
                        checked={surveyData.serviceAvailed.includes(service)}
                        onChange={(checked) => handleCheckboxChange(service, checked)}
                      />
                    ))}
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="service-others" 
                        checked={surveyData.serviceAvailed.includes("Others")}
                        onCheckedChange={(checked) => handleCheckboxChange("Others", checked === true)}
                        className="mt-1 text-[#193d83] border-[#5e86ca]"
                      />
                      <div className="flex flex-col">
                        <Label htmlFor="service-others" className="font-poppins1 text-gray-600">Others (Please specify):</Label>
                        {surveyData.serviceAvailed.includes("Others") && (
                          <Input 
                            id="otherService" 
                            type="text" 
                            placeholder="Specify other service" 
                            value={surveyData.otherService} 
                            onChange={(e) => handleInputChange('otherService', e.target.value)}
                            className="mt-2 w-full border-[#5e86ca] focus:ring-[#193d83]"
                          />
                        )}
                        {validationErrors.otherService && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.otherService}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citizen's Charter Section */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="font-qanelas2 text-sm text-gray-700">
                    <strong>INSTRUCTIONS:</strong> Check mark (✓) your answer to the Citizen&apos;s Charter (CC) questions. 
                    The Citizen&apos;s Charter is an official document that reflects the services of a government agency/office 
                    including its requirements, fees, and processing times among others.
                  </p>
                </div>
                
                <div className="mb-6">
                  <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC1: Which of the following best describes your awareness of a CC?</Label>
                  <RadioGroup 
                    className="space-y-2" 
                    value={surveyData.CC1} 
                    onValueChange={(val) => handleInputChange('CC1', val)}
                  >
                    {CC1_OPTIONS.map((option) => (
                      <RadioOption
                        key={option}
                        id={`CC1-${option}`}
                        value={option}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="mb-6">
                  <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC2: If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was...?</Label>
                  <RadioGroup 
                    className="flex flex-wrap gap-4" 
                    value={surveyData.CC2} 
                    onValueChange={(val) => handleInputChange('CC2', val)}
                  >
                    {CC2_OPTIONS.map((option) => (
                      <RadioOption
                        key={option}
                        id={`CC2-${option}`}
                        value={option}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="mb-2">
                  <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">CC3: If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?</Label>
                  <RadioGroup 
                    className="flex flex-wrap gap-4" 
                    value={surveyData.CC3} 
                    onValueChange={(val) => handleInputChange('CC3', val)}
                  >
                    {CC3_OPTIONS.map((option) => (
                      <RadioOption
                        key={option}
                        id={`CC3-${option}`}
                        value={option}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Service Quality Dimension Section */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="font-qanelas2 text-sm text-gray-700">
                    <strong>INSTRUCTIONS:</strong> For SQD 0-8, please choose the option that best corresponds to your answer.
                  </p>
                </div>
                
                <h3 className="text-lg font-qanelas2 text-gray-800 mb-4">Service Quality Dimension (SQD)</h3>
                
                {SQD_QUESTIONS.map((question, index) => (
                  <RatingScale
                    key={`SQD${index}`}
                    question={question}
                    questionKey={`SQD${index}`}
                    value={sqdFormData[`SQD${index}`]}
                    options={SATISFACTION_OPTIONS}
                    onChange={handleSqdChange}
                  />
                ))}
              </div>

              <div className="flex justify-end mt-8">
                <Button 
                  type="submit" 
                  className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1 px-8"
                  disabled={!formComplete || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                </Button>
              </div>

              {!formComplete && (
                <div className="text-red-500 text-sm text-center mt-2">
                  Please complete all required fields
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InternalSurveyForm;