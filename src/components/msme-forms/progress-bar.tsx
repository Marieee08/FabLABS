// src/components/msme-forms/progress-bar.tsx - Enhanced Step Indicator
import React from 'react';
import { FileText, Calendar, CheckSquare } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  // Step details
  const steps = [
    { number: 1, label: "Service", description: "Select service", icon: FileText },
    { number: 2, label: "Schedule", description: "Choose dates and times", icon: Calendar },
    { number: 3, label: "Review", description: "Review and submit", icon: CheckSquare }
  ];

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <div 
              key={step.number} 
              className={`flex flex-col items-center w-1/3 ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className={`
                relative flex h-10 w-10 items-center justify-center rounded-full border-2 
                ${isActive ? 'border-blue-600 bg-blue-50' : 
                  isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'}
                mb-2
              `}>
                <StepIcon className="h-5 w-5" />
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 bg-green-600 rounded-full h-4 w-4 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className={`font-medium text-sm ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs mt-1 text-gray-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
