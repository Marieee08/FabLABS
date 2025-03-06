"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

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
  // Adding "preliminary" as the initial form type
  const [formType, setFormType] = useState('preliminary');
  
  // Add demographic data state
  const [demographicData, setDemographicData] = useState({
    age: '',
    sex: null,
    CC1: null,
    CC2: null,
    CC3: null
  });
  
  const [customerFormData, setCustomerFormData] = useState(
    Object.fromEntries(SURVEY_QUESTIONS.customer.map((_, i) => [`Q${i + 1}`, null]))
  );
  const [employeeFormData, setEmployeeFormData] = useState(
    Object.fromEntries(SURVEY_QUESTIONS.employee.map((_, i) => [`E${i + 1}`, null]))
  );

  const handleInputChange = (question, value) => {
    if (formType === 'preliminary') {
      setDemographicData(prev => ({ ...prev, [question]: value }));
    } else if (formType === 'customer') {
      setCustomerFormData(prev => ({ ...prev, [question]: value }));
    } else {
      setEmployeeFormData(prev => ({ ...prev, [question]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', {
      type: formType,
      date: new Date(),
      demographics: demographicData,
      data: formType === 'customer' ? customerFormData : employeeFormData
    });
  };

  const renderRatingScale = (question, questionKey, value) => {
    const options = formType === 'customer' ? CUSTOMER_RATING_OPTIONS : EMPLOYEE_RATING_OPTIONS;
    return (
      <div key={questionKey} className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
        <Label className="block mb-4 font-qanelas2 text-lg text-gray-700">{question}</Label>
        <RadioGroup className="flex space-x-6" value={value} onValueChange={(val) => handleInputChange(questionKey, val)}>
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

  const renderPreliminarySection = () => {
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
            value={demographicData.age} 
            onChange={(e) => handleInputChange('age', e.target.value)}
            className="w-full max-w-xs border-[#5e86ca] focus:ring-[#193d83]"
          />
        </div>
        
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
          <Label className="block mb-4 font-qanelas2 text-lg text-gray-700">Sex</Label>
          <RadioGroup 
            className="flex space-x-6" 
            value={demographicData.sex} 
            onValueChange={(val) => handleInputChange('sex', val)}
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
              value={demographicData.CC1} 
              onValueChange={(val) => handleInputChange('CC1', val)}
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
              value={demographicData.CC2} 
              onValueChange={(val) => handleInputChange('CC2', val)}
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
              value={demographicData.CC3} 
              onValueChange={(val) => handleInputChange('CC3', val)}
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

  return (
    <Card className="w-full max-w-3xl mx-auto bg-[#f4f8fc] border border-[#5e86ca] rounded-2xl">
      <CardHeader className="space-y-6">
        <CardTitle className="text-3xl font-qanelas2 text-[#0e4579]">
          {formType === 'preliminary' 
            ? 'Demographic Information' 
            : formType === 'customer' 
              ? 'Customer Feedback' 
              : 'Employee Evaluation'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formType === 'preliminary' && renderPreliminarySection()}
          
          {formType === 'customer' && renderCustomerSection()}
          
          {formType === 'employee' && SURVEY_QUESTIONS.employee.map((question, index) => (
            renderRatingScale(question, `E${index + 1}`, employeeFormData[`E${index + 1}`])
          ))}
          
          <div className="flex justify-between mt-8">
            {formType === 'customer' && (
              <Button onClick={() => setFormType('preliminary')} className="bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50 font-qanelas1">Back</Button>
            )}
            
            {formType === 'employee' && (
              <Button onClick={() => setFormType('customer')} className="bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50 font-qanelas1">Back</Button>
            )}
            
            {formType === 'preliminary' && (
              <Button 
                onClick={() => setFormType('customer')} 
                className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1"
                disabled={!demographicData.age || !demographicData.sex}
              >
                Next
              </Button>
            )}
            
            {formType === 'customer' && (
              <Button onClick={() => setFormType('employee')} className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1">Next</Button>
            )}
            
            {formType === 'employee' && (
              <Button type="submit" className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1">Submit</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SurveyForm;