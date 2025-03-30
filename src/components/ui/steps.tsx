import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'incomplete' | 'current' | 'complete' | 'error';

export interface StepProps {
  title: string;
  description?: string;
  status?: StepStatus;
  icon?: React.ReactNode;
}

export interface StepsProps {
  currentStep: number;
  status?: 'loading' | 'error';
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  status = 'incomplete',
  icon
}) => {
  // This component doesn't render anything by itself
  // It's just a configuration component for the Steps component
  return null;
};

export const Steps: React.FC<StepsProps> = ({
  currentStep,
  status,
  children,
  orientation = 'horizontal'
}) => {
  // Filter and map only Step components
  const steps = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child) && child.type === Step)
    .map((child, index) => {
      const stepProps = (child as React.ReactElement<StepProps>).props;
      const isActive = index + 1 === currentStep;
      const isCompleted = index + 1 < currentStep;
      
      // Determine status
      let stepStatus: StepStatus = stepProps.status || 'incomplete';
      if (isActive) stepStatus = status === 'error' ? 'error' : 'current';
      if (isCompleted && stepStatus !== 'error') stepStatus = 'complete';
      
      return {
        ...stepProps,
        index: index + 1,
        status: stepStatus
      };
    });

  return (
    <div className={cn("w-full", orientation === 'vertical' ? 'flex flex-col' : '')}>
      <ol className={cn(
        "flex w-full",
        orientation === 'horizontal' ? 'items-center' : 'flex-col space-y-6'
      )}>
        {steps.map((step, i) => (
          <li 
            key={i} 
            className={cn(
              "relative flex",
              orientation === 'horizontal' ? 'flex-col items-center' : 'items-start',
              orientation === 'horizontal' && i !== steps.length - 1 ? 'flex-1' : ''
            )}
          >
            {/* Step Icon */}
            <div 
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 z-10",
                step.status === 'complete' ? 'bg-green-100 border-green-600 text-green-600' :
                step.status === 'current' ? 'bg-blue-100 border-blue-600 text-blue-600' :
                step.status === 'error' ? 'bg-red-100 border-red-600 text-red-600' :
                'bg-white border-gray-300 text-gray-400'
              )}
            >
              {step.status === 'complete' ? (
                <CheckCircle className="h-5 w-5" />
              ) : step.status === 'current' && status === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="text-sm font-medium">{step.index}</span>
              )}
            </div>
            
            {/* Step Title & Description */}
            <div className={cn(
              "mt-2",
              orientation === 'horizontal' ? 'text-center' : 'ml-4'
            )}>
              <h3 className={cn(
                "text-sm font-medium",
                step.status === 'complete' ? 'text-green-600' :
                step.status === 'current' ? 'text-blue-600' :
                step.status === 'error' ? 'text-red-600' :
                'text-gray-500'
              )}>
                {step.title}
              </h3>
              
              {step.description && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {step.description}
                </p>
              )}
            </div>
            
            {/* Connector Line */}
            {i !== steps.length - 1 && (
              <div className={cn(
                orientation === 'horizontal' 
                  ? "absolute top-4 left-0 -ml-px h-0.5 w-full" 
                  : "absolute top-8 left-4 -ml-px w-0.5 h-full",
                step.status === 'complete' ? "bg-green-600" : "bg-gray-300"
              )}>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};