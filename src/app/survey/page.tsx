"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Moved the questions to separate objects for better organization
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
  const [formData, setFormData] = useState({
    // Customer feedback initial state
    Q1: null, Q2: null, Q3: null, Q4: null, Q5: null, Q6: null, Q7: null,
    // Employee evaluation initial state
    E1: null, E2: null, E3: null, E4: null, E5: null, E6: null, E7: null,
    E8: null, E9: null, E10: null, E11: null,
    EvalSig: false
  });

  const handleInputChange = (question, value) => {
    setFormData(prev => ({
      ...prev,
      [question]: parseInt(value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', {
      type: formType,
      date: new Date(),
      ...formData
    });
  };

  const renderRatingScale = (question, value, onChange) => (
    <div className="mb-6">
      <Label className="block mb-2">{question}</Label>
      <RadioGroup
        className="flex space-x-4"
        value={value?.toString()}
        onValueChange={onChange}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <RadioGroupItem value={rating.toString()} id={`${question}-${rating}`} />
            <Label htmlFor={`${question}-${rating}`}>{rating}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {formType === 'customer' ? 'Customer Feedback' : 'Employee Evaluation'}
        </CardTitle>
        <div className="flex space-x-4 mt-4">
          <Button
            variant={formType === 'customer' ? 'default' : 'outline'}
            onClick={() => setFormType('customer')}
          >
            Customer Feedback
          </Button>
          <Button
            variant={formType === 'employee' ? 'default' : 'outline'}
            onClick={() => setFormType('employee')}
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
                formData[`Q${index + 1}`],
                (value) => handleInputChange(`Q${index + 1}`, value)
              )
            ))
          ) : (
            SURVEY_QUESTIONS.employee.map((question, index) => (
              renderRatingScale(
                question,
                formData[`E${index + 1}`],
                (value) => handleInputChange(`E${index + 1}`, value)
              )
            ))
          )}
          
          {formType === 'employee' && (
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="evalSig"
                checked={formData.EvalSig}
                onChange={(e) => setFormData(prev => ({...prev, EvalSig: e.target.checked}))}
                className="w-4 h-4"
              />
              <Label htmlFor="evalSig">I confirm this evaluation is accurate</Label>
            </div>
          )}

          <Button type="submit" className="w-full">
            Submit {formType === 'customer' ? 'Feedback' : 'Evaluation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SurveyForm;