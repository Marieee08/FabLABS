// app/admin-dashboard/reports/components/date-range-selector.tsx
"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface DateRangeSelectorProps {
  onRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const [isOpen, setIsOpen] = useState(false);

  // Predefined ranges
  const handleQuickSelect = (value: string) => {
    const today = new Date();
    let from: Date;
    
    switch (value) {
      case 'last7days':
        from = new Date();
        from.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        from = new Date();
        from.setDate(today.getDate() - 30);
        break;
      case 'last90days':
        from = new Date();
        from.setDate(today.getDate() - 90);
        break;
      case 'thisYear':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        from = new Date(today.getFullYear() - 1, 0, 1);
        const to = new Date(today.getFullYear() - 1, 11, 31);
        setDate({ from, to });
        onRangeChange({ from, to });
        return;
      default:
        from = new Date();
        from.setDate(today.getDate() - 30);
    }
    
    setDate({ from, to: today });
    onRangeChange({ from, to: today });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Select onValueChange={handleQuickSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="last90days">Last 90 days</SelectItem>
            <SelectItem value="thisYear">This year</SelectItem>
            <SelectItem value="lastYear">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal sm:w-[300px]",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                if (newDate?.from && newDate?.to) {
                  onRangeChange(newDate);
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}