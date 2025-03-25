// /survey/questionnaire/page.tsx
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

// Constants moved outside component to prevent re-creation on each render
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

interface DemographicData {
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

// Memoized RatingScale component
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
    <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
      <Label className="block mb-4 font-qanelas2 text-lg text-gray-700">{question}</Label>
      <RadioGroup className="flex space-x-6" value={value} onValueChange={handleChange}>
        {options.map((option) => (
          <RadioOption 
            key={option} 
            id={`${questionKey}-${option}`} 
            value={option} 
            label={option} 
          />
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

const SurveyForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');
  
  const [formType, setFormType] = useState('preliminary');
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [demographicData, setDemographicData] = useState<DemographicData>({
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
  
  // Initialize form data with undefined values
  const [customerFormData, setCustomerFormData] = useState<Record<string, string | undefined>>(
    Object.fromEntries(SURVEY_QUESTIONS.customer.map((_, i) => [`Q${i + 1}`, undefined]))
  );
  
  const [employeeFormData, setEmployeeFormData] = useState<Record<string, string | undefined>>(
    Object.fromEntries(SURVEY_QUESTIONS.employee.map((_, i) => [`E${i + 1}`, undefined]))
  );

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
        
        if (data.role !== 'SURVEY') {
          toast({
            title: "Access Denied",
            description: "You need survey access to view this page.",
            variant: "destructive",
          });
          router.push('/');
          return;
        }
        
        setUserRole('SURVEY');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching user role:', error);
          // Fallback for development
          setUserRole('SURVEY');
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
    setDemographicData(prev => ({ ...prev, [question]: value }));
  }, []);

  const handleCheckboxChange = useCallback((service: string, checked: boolean) => {
    setDemographicData(prev => {
      if (checked) {
        return { ...prev, serviceAvailed: [...prev.serviceAvailed, service] };
      } else {
        return { ...prev, serviceAvailed: prev.serviceAvailed.filter(s => s !== service) };
      }
    });
  }, []);

  const handleQuestionChange = useCallback((question: string, value: string) => {
    if (formType === 'customer') {
      setCustomerFormData(prev => ({ ...prev, [question]: value }));
    } else if (formType === 'employee') {
      setEmployeeFormData(prev => ({ ...prev, [question]: value }));
    }
  }, [formType]);

  const changeFormType = useCallback((newType: string) => {
    setFormType(newType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoized validation check
  const preliminaryComplete = useMemo(() => Boolean(
    demographicData.clientType && 
    demographicData.sex && 
    demographicData.age && 
    demographicData.age !== '0' &&
    demographicData.region && 
    demographicData.office && 
    demographicData.office.trim() !== '' &&
    demographicData.serviceAvailed.length > 0 &&
    !(demographicData.serviceAvailed.includes("Others") && (!demographicData.otherService || demographicData.otherService.trim() === '')) &&
    demographicData.CC1 &&
    (demographicData.CC1 === CC1_OPTIONS[3] || (demographicData.CC2 && demographicData.CC3))
  ), [demographicData]);

  // Check if all customer questions are answered
  const allCustomerQuestionsAnswered = useMemo(() => 
    Object.values(customerFormData).every(value => value !== undefined),
  [customerFormData]);

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
    
    if (formType === 'employee') {
      const missingFields = Object.entries(employeeFormData).some(([key, value]) => !value);
      if (missingFields) {
        toast({
          title: "Missing Information",
          description: "Please complete all fields in the employee evaluation section.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }
    
    const surveyData = {
      preliminary: {
        userRole: 'SURVEY',
        ...demographicData,
      },
      customer: Object.fromEntries(
        Object.entries(customerFormData).map(([key, value]) => {
          const sqKey = key.replace('Q', 'SQD');
          return [sqKey, value];
        })
      ),
      employee: employeeFormData,
      serviceAvailed: demographicData.serviceAvailed
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
  }, [demographicData, customerFormData, employeeFormData, formType, reservationId, router]);

  // Memoized section renderers
  const renderPreliminarySection = useCallback(() => {
    return (
      <>
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <div className="mb-4">
            <p className="font-qanelas2 text-sm text-gray-700 mb-4">
              This Client Satisfaction Measurement (CSM) tracks the customer experience. Your
              feedback on your recently concluded transaction will help us provide better services. Personal information shared will be
              kept confidential and you always have the option not to answer this form.
            </p>
          </div>
          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Client type:</Label>
            <RadioGroup 
              className="flex flex-wrap gap-4" 
              value={demographicData.clientType} 
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
          
          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Sex:</Label>
            <RadioGroup 
              className="flex space-x-6" 
              value={demographicData.sex} 
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="msme-age" className="block mb-3 font-qanelas2 text-lg text-gray-700">Age:</Label>
              <Input 
                id="msme-age" 
                type="number" 
                min="0" 
                max="120" 
                placeholder="Enter your age" 
                value={demographicData.age} 
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full border-[#5e86ca] focus:ring-[#193d83]"
              />
            </div>
            <div>
              <Label htmlFor="region" className="block mb-3 font-qanelas2 text-lg text-gray-700">Region of residence:</Label>
              <select
                id="region"
                value={demographicData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
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
              value={demographicData.office} 
              onChange={(e) => handleInputChange('office', e.target.value)}
              className="w-full border-[#5e86ca] focus:ring-[#193d83]"
            />
          </div>

          <div className="mb-6">
            <Label className="block mb-3 font-qanelas2 text-lg text-gray-700">Service Availed (please check):</Label>
            <div className="space-y-2">
              {SERVICE_OPTIONS.slice(0, -1).map((service) => (
                <CheckboxOption
                  key={service}
                  id={`service-${service}`}
                  label={service}
                  checked={demographicData.serviceAvailed.includes(service)}
                  onChange={(checked) => handleCheckboxChange(service, checked)}
                />
              ))}
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="service-others" 
                  checked={demographicData.serviceAvailed.includes("Others")}
                  onCheckedChange={(checked) => handleCheckboxChange("Others", checked === true)}
                  className="mt-1 text-[#193d83] border-[#5e86ca]"
                />
                <div className="flex flex-col">
                  <Label htmlFor="service-others" className="font-poppins1 text-gray-600">Others (Please specify):</Label>
                  {demographicData.serviceAvailed.includes("Others") && (
                    <Input 
                      id="otherService" 
                      type="text" 
                      placeholder="Specify other service" 
                      value={demographicData.otherService} 
                      onChange={(e) => handleInputChange('otherService', e.target.value)}
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
              value={demographicData.CC1} 
              onValueChange={(val) => handleInputChange('CC1', val)}
            >
              {CC1_OPTIONS.map((option) => (
                <RadioOption
                  key={option}
                  id={`msme-CC1-${option}`}
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
              value={demographicData.CC2} 
              onValueChange={(val) => handleInputChange('CC2', val)}
            >
              {CC2_OPTIONS.map((option) => (
                <RadioOption
                  key={option}
                  id={`msme-CC2-${option}`}
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
              value={demographicData.CC3} 
              onValueChange={(val) => handleInputChange('CC3', val)}
            >
              {CC3_OPTIONS.map((option) => (
                <RadioOption
                  key={option}
                  id={`msme-CC3-${option}`}
                  value={option}
                  label={option}
                />
              ))}
            </RadioGroup>
          </div>
        </div>
      </>
    );
  }, [demographicData, handleInputChange, handleCheckboxChange]);

  const renderCustomerSection = useCallback(() => {
    return (
      <>
        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <p className="font-qanelas2 text-sm text-gray-700">
            <strong>INSTRUCTIONS:</strong> For SQD 0-8, please choose the option that best corresponds to your answer.
          </p>
        </div>
        
        {SURVEY_QUESTIONS.customer.map((question, index) => (
          <RatingScale
            key={`Q${index + 1}`}
            question={question}
            questionKey={`Q${index + 1}`}
            value={customerFormData[`Q${index + 1}`]}
            options={CUSTOMER_RATING_OPTIONS}
            onChange={handleQuestionChange}
          />
        ))}
      </>
    );
  }, [customerFormData, handleQuestionChange]);

  const renderEmployeeSection = useCallback(() => {
    return (
      SURVEY_QUESTIONS.employee.map((question, index) => (
        <RatingScale
          key={`E${index + 1}`}
          question={question}
          questionKey={`E${index + 1}`}
          value={employeeFormData[`E${index + 1}`]}
          options={EMPLOYEE_RATING_OPTIONS}
          onChange={handleQuestionChange}
        />
      ))
    );
  }, [employeeFormData, handleQuestionChange]);

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
            {formType === 'preliminary' && renderPreliminarySection()}
            {formType === 'customer' && renderCustomerSection()}
            {formType === 'employee' && renderEmployeeSection()}
    
            <div className="flex justify-between mt-8">
              {/* Back buttons */}
              {formType === 'customer' && (
                <Button 
                  type="button" 
                  onClick={() => changeFormType('preliminary')} 
                  className="bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50 font-qanelas1"
                >
                  Back
                </Button>
              )}
              
              {formType === 'employee' && (
                <Button 
                  type="button" 
                  onClick={() => changeFormType('customer')} 
                  className="bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50 font-qanelas1"
                >
                  Back
                </Button>
              )}
              
              {/* Next/Submit buttons */}
              {formType === 'preliminary' && (
                <Button 
                  type="button"
                  onClick={() => changeFormType('customer')} 
                  className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1"
                  disabled={!preliminaryComplete}
                >
                  Next
                </Button>
              )}
              
              {formType === 'customer' && (
                <Button 
                  type="button" 
                  onClick={() => changeFormType('employee')} 
                  className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1"
                  disabled={!allCustomerQuestionsAnswered}
                >
                  Next
                </Button>
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

              {/* Show a message if preliminary form is incomplete */}
              {formType === 'preliminary' && !preliminaryComplete && (
                <div className="text-red-500 text-sm mt-2">
                  Please complete all required fields
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyForm;