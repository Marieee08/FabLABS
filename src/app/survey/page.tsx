"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const SURVEY_QUESTIONS = {
  customer: [
    "How satisfied were you with our service?",
    "How would you rate the quality of our product?",
    "How likely are you to recommend us to others?",
    "How would you rate our customer support?",
    "How easy was it to use our service?",
    "How well did we meet your expectations?",
    "How would you rate the overall experience?"
  ],
  employee: [
    "Technical knowledge and skills",
    "Problem-solving abilities",
    "Communication skills",
    "Team collaboration",
    "Time management",
    "Initiative and proactiveness",
    "Adaptability to change",
    "Quality of work",
    "Meeting deadlines",
    "Following procedures",
    "Overall performance"
  ]
};

const SurveyForm = () => {
  const [formType, setFormType] = useState('customer');
  const [customerFormData, setCustomerFormData] = useState(
    Object.fromEntries(SURVEY_QUESTIONS.customer.map((_, i) => [`Q${i + 1}`, null]))
  );
  const [employeeFormData, setEmployeeFormData] = useState({
    ...Object.fromEntries(SURVEY_QUESTIONS.employee.map((_, i) => [`E${i + 1}`, null])),
    EvalSig: false
  });

  const handleInputChange = (question, value) => {
    if (formType === 'customer') {
      setCustomerFormData(prev => ({
        ...prev,
        [question]: parseInt(value)
      }));
    } else {
      setEmployeeFormData(prev => ({
        ...prev,
        [question]: parseInt(value)
      }));
    }
  };

  const handleFormTypeChange = (type) => {
    setFormType(type);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = formType === 'customer' ? customerFormData : employeeFormData;
    console.log('Form submitted:', {
      type: formType,
      date: new Date(),
      ...formData
    });
  };

  const renderRatingScale = (question, questionKey, value) => (
    <div key={questionKey} className="mb-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-blue-300/50 transition-all duration-300">
      <Label className="block mb-4 font-qanelas2 text-lg text-gray-700">{question}</Label>
      <RadioGroup
        className="flex space-x-6"
        value={value?.toString()}
        onValueChange={(val) => handleInputChange(questionKey, val)}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={rating.toString()} 
              id={`${questionKey}-${rating}`}
              className="text-[#193d83] border-[#5e86ca]"
            />
            <Label 
              htmlFor={`${questionKey}-${rating}`}
              className="font-poppins1 text-gray-600"
            >
              {rating}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  const currentFormData = formType === 'customer' ? customerFormData : employeeFormData;

  return (
    <Card className="w-full max-w-3xl mx-auto bg-[#f4f8fc] border border-[#5e86ca] rounded-2xl">
      <CardHeader className="space-y-6">
        <div>
          <p className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium text-sm border border-[#5e86ca] mb-4">
            {formType === 'customer' ? 'Share Your Experience' : 'Performance Review'}
          </p>
          <CardTitle className="text-3xl font-qanelas2 text-[#0e4579]">
            {formType === 'customer' ? 'Customer Feedback' : 'Employee Evaluation'}
          </CardTitle>
        </div>
        
        <div className="flex space-x-4">
          <Button
            onClick={() => handleFormTypeChange('customer')}
            className={`font-qanelas1 transition duration-300 ${
              formType === 'customer' 
                ? 'bg-[#193d83] text-white hover:bg-[#2f61c2]' 
                : 'bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50'
            }`}
          >
            Customer Feedback
          </Button>
          <Button
            onClick={() => handleFormTypeChange('employee')}
            className={`font-qanelas1 transition duration-300 ${
              formType === 'employee' 
                ? 'bg-[#193d83] text-white hover:bg-[#2f61c2]' 
                : 'bg-white text-[#193d83] border border-[#5e86ca] hover:bg-blue-50'
            }`}
          >
            Employee Evaluation
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formType === 'customer' ? (
            SURVEY_QUESTIONS.customer.map((question, index) => (
              renderRatingScale(
                question,
                `Q${index + 1}`,
                customerFormData[`Q${index + 1}`]
              )
            ))
          ) : (
            SURVEY_QUESTIONS.employee.map((question, index) => (
              renderRatingScale(
                question,
                `E${index + 1}`,
                employeeFormData[`E${index + 1}`]
              )
            ))
          )}
          
          {formType === 'employee' && (
            <div className="flex items-center space-x-3 mt-6 bg-white p-6 rounded-xl shadow-lg">
              <input
                type="checkbox"
                id="evalSig"
                checked={employeeFormData.EvalSig}
                onChange={(e) => setEmployeeFormData(prev => ({...prev, EvalSig: e.target.checked}))}
                className="w-5 h-5 rounded border-[#5e86ca] text-[#193d83]"
              />
              <Label htmlFor="evalSig" className="font-poppins1 text-gray-700">
                I confirm this evaluation is accurate
              </Label>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#193d83] text-white font-qanelas1 text-lg py-3 rounded-full hover:bg-[#2f61c2] transition duration-300 mt-8"
          >
            Submit {formType === 'customer' ? 'Feedback' : 'Evaluation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SurveyForm;