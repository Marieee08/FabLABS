// components/admin-reports/time-interval-selector.tsx
"use client";

import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CalendarClock } from 'lucide-react';

export type TimeInterval = 'day' | 'week' | 'month' | 'year';

interface TimeIntervalSelectorProps {
  value: TimeInterval;
  onChange: (value: TimeInterval) => void;
  className?: string;
}

export function TimeIntervalSelector({ 
  value, 
  onChange, 
  className = "" 
}: TimeIntervalSelectorProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Select value={value} onValueChange={(val) => onChange(val as TimeInterval)}>
        <SelectTrigger className="w-full sm:w-48">
          <div className="flex items-center">
            <CalendarClock className="mr-2 h-4 w-4 text-[#143370]" />
            <SelectValue placeholder="Select time interval" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Daily View</SelectItem>
          <SelectItem value="week">Weekly View</SelectItem>
          <SelectItem value="month">Monthly View</SelectItem>
          <SelectItem value="year">Yearly View</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}