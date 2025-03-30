// src/components/msme-forms/interactive-machine-calendar.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Info, Filter, ChevronLeft, ChevronRight, Loader2, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import TimeSlotSelector from '@/components/msme-forms/time-slot-selector';

// Set up the localizer for the calendar
const localizer = momentLocalizer(moment);

interface TimeSlot {
  id: number;
  dayNum?: number;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
}

interface Reservation {
  id: string;
  date: string;
  machines: string[];
  timeSlots: TimeSlot[];
  status: string;
  type: 'utilization' | 'evc';
}

interface Machine {
  id: string;
  Machine: string;
  isAvailable: boolean;
  Number?: number;  // Number of machines available
}

interface BlockedDate {
  id: string;
  date: Date;
}

interface Service {
  id: string;
  Service: string;
  Machines?: { 
    machine: { 
      id: string;
      Machine: string;
      Number?: number;
    } 
  }[];
}

interface InteractiveMachineCalendarProps {
  selectedService: string;
  machineQuantityNeeded: number;
  onDateSelect: (dates: Date[]) => void;
  onDateTimeSelect?: (dateTimeSelections: Array<{
    date: Date;
    startTime: string | null;
    endTime: string | null;
  }>) => void;
  selectedDates: Date[];
  servicesData: Service[];
  maxDates?: number;
}

const InteractiveMachineCalendar: React.FC<InteractiveMachineCalendarProps> = ({
  selectedService,
  machineQuantityNeeded,
  onDateSelect,
  onDateTimeSelect,
  selectedDates = [],
  servicesData = [],
  maxDates = 5
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [machinesForService, setMachinesForService] = useState<Machine[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [machineAvailabilityMap, setMachineAvailabilityMap] = useState<Record<string, {
    morning: number,
    afternoon: number,
    allDay: number,
    overall: number
  }>>({});
  const [dateTimeSelections, setDateTimeSelections] = useState<Array<{
    date: Date;
    startTime: string | null;
    endTime: string | null;
    slot: 'morning' | 'afternoon' | null;
  }>>([]);

  // Time slots definitions
  const MORNING_START = 8; // 8 AM
  const MORNING_END = 12; // 12 PM
  const AFTERNOON_START = 13; // 1 PM
  const AFTERNOON_END = 17; // 5 PM

  // Fetch reservation and blocked date data
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        // Fetch all reservations
        const reservationsRes = await fetch('/api/user/calendar-reservations');
        const reservationsData = await reservationsRes.json();
        
        // Fetch all blocked dates
        const blockedDatesRes = await fetch('/api/blocked-dates');
        const blockedDatesData = await blockedDatesRes.json();
        
        // Filter to only include approved and ongoing reservations
        const filteredReservations = reservationsData.filter((res: Reservation) => 
          ['Approved', 'Ongoing'].includes(res.status) && 
          res.type !== 'evc' &&
          res.machines.some(machine => machine !== 'Not specified' && machine)
        );
        
        setReservations(filteredReservations);
        setBlockedDates(blockedDatesData);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  // Extract machines for the selected service
  useEffect(() => {
    if (selectedService && servicesData.length > 0) {
      const service = servicesData.find(s => s.Service === selectedService);
      
      if (service && service.Machines) {
        const machines = service.Machines.map(m => ({
          id: m.machine.id,
          Machine: m.machine.Machine,
          isAvailable: true,
          Number: m.machine.Number || 1
        }));
        
        setMachinesForService(machines);
      } else {
        setMachinesForService([]);
      }
    } else {
      setMachinesForService([]);
    }
  }, [selectedService, servicesData]);

  // Calculate machine availability for each date based on reservations
  useEffect(() => {
    if (!selectedService || machinesForService.length === 0) {
      setMachineAvailabilityMap({});
      return;
    }
  
    // Calculate total machines available for this service
    const totalMachinesForService = machinesForService.reduce(
      (sum, machine) => sum + (machine.Number || 1), 0
    );
    
    // Create a map to track machine usage by date and time slot
    const dateUsageMap: Record<string, {
      morning: number, // 8AM-12PM
      afternoon: number, // 1PM-5PM
      allDay: number // For all-day reservations
    }> = {};
    
    // Initialize usage map for a 3-month range
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    for (let date = new Date(today); date <= threeMonthsLater; date.setDate(date.getDate() + 1)) {
      const dateStr = new Date(date).toDateString();
      dateUsageMap[dateStr] = { morning: 0, afternoon: 0, allDay: 0 };
    }
    
    // Process each reservation to determine machine usage by date and time slot
    reservations.forEach(reservation => {
      // Check if this reservation involves any machines from our service
      const reservedMachines = reservation.machines.filter(machineName => 
        machinesForService.some(m => m.id === machineName || m.Machine === machineName)
      );
      
      if (reservedMachines.length > 0) {
        // Get date from reservation or time slots
        let dateStr = '';
        if (reservation.timeSlots && reservation.timeSlots.length > 0 && reservation.timeSlots[0].startTime) {
          dateStr = new Date(reservation.timeSlots[0].startTime).toDateString();
        } else if (reservation.date) {
          dateStr = new Date(reservation.date).toDateString();
        }
        
        if (dateStr && dateUsageMap[dateStr]) {
          // Determine which time slots are affected
          if (reservation.timeSlots && reservation.timeSlots.length > 0) {
            for (const slot of reservation.timeSlots) {
              if (slot.startTime && slot.endTime) {
                const startTime = new Date(slot.startTime);
                const endTime = new Date(slot.endTime);
                
                // Morning slot: 8AM-12PM
                if (startTime.getHours() < 12 && endTime.getHours() <= 12) {
                  dateUsageMap[dateStr].morning += reservedMachines.length;
                }
                // Afternoon slot: 1PM-5PM
                else if (startTime.getHours() >= 12 && startTime.getHours() < 17) {
                  dateUsageMap[dateStr].afternoon += reservedMachines.length;
                }
                // Spans both morning and afternoon
                else if (startTime.getHours() < 12 && endTime.getHours() >= 12) {
                  dateUsageMap[dateStr].morning += reservedMachines.length;
                  dateUsageMap[dateStr].afternoon += reservedMachines.length;
                }
                // Default to all day if unable to determine
                else {
                  dateUsageMap[dateStr].allDay += reservedMachines.length;
                }
              } else {
                // No specific times, count as all day
                dateUsageMap[dateStr].allDay += reservedMachines.length;
              }
            }
          } else {
            // No time slots, count as all day
            dateUsageMap[dateStr].allDay += reservedMachines.length;
          }
        }
      }
    });
    
    // Create the availability map (total - used = available)
    const availabilityMap: Record<string, {
      morning: number,
      afternoon: number,
      allDay: number,
      overall: number // Maximum availability between morning and afternoon
    }> = {};
    
    // Calculate availability for each date
    Object.keys(dateUsageMap).forEach(dateStr => {
      const usage = dateUsageMap[dateStr];
      const allDayUsage = usage.allDay;
      
      // Calculate available machines for each time slot
      const morningAvailable = Math.max(0, totalMachinesForService - usage.morning - allDayUsage);
      const afternoonAvailable = Math.max(0, totalMachinesForService - usage.afternoon - allDayUsage);
      
      // Calculate overall availability (maximum of morning and afternoon)
      const overallAvailable = Math.max(morningAvailable, afternoonAvailable);
      
      availabilityMap[dateStr] = {
        morning: morningAvailable,
        afternoon: afternoonAvailable,
        allDay: totalMachinesForService - allDayUsage,
        overall: overallAvailable
      };
    });
    
    setMachineAvailabilityMap(availabilityMap);
  }, [machinesForService, reservations, selectedService]);

  // Process reservations and blocked dates into calendar events
  useEffect(() => {
    if (!selectedService) {
      setCalendarEvents([]);
      return;
    }
    
    const events = [];

    // Create events for each machine reservation
    for (const reservation of reservations) {
      // Check if the reservation involves any of our service's machines
      const reservedMachines = reservation.machines.filter(machineName => 
        machinesForService.some(m => m.id === machineName || m.Machine === machineName)
      );
      
      if (reservedMachines.length === 0) continue;
      
      // Process each reserved machine
      for (const machineName of reservedMachines) {
        // Find the machine object to get its proper name
        const machineObj = machinesForService.find(m => m.id === machineName || m.Machine === machineName);
        const displayName = machineObj ? machineObj.Machine : machineName;
        
        if (reservation.timeSlots && reservation.timeSlots.length > 0) {
          // Process each time slot
          for (const slot of reservation.timeSlots) {
            if (slot.startTime && slot.endTime) {
              const startTime = new Date(slot.startTime);
              const endTime = new Date(slot.endTime);
              
              // Determine if this crosses morning and afternoon
              const isMorning = startTime.getHours() < MORNING_END && startTime.getHours() >= MORNING_START;
              const isAfternoon = endTime.getHours() <= AFTERNOON_END && endTime.getHours() > AFTERNOON_START;
              const spansBoth = startTime.getHours() < MORNING_END && endTime.getHours() > AFTERNOON_START;
              
              if (spansBoth) {
                // Create all-day event
                const allDayStart = new Date(startTime);
                allDayStart.setHours(0, 0, 0, 0);
                
                const allDayEnd = new Date(startTime);
                allDayEnd.setHours(23, 59, 59, 999);
                
                events.push({
                  title: `${displayName} (Reserved)`,
                  start: allDayStart,
                  end: allDayEnd,
                  allDay: true,
                  resource: {
                    machine: machineName,
                    timeSlot: 'allday',
                    reservationId: reservation.id,
                    isReservation: true
                  }
                });
              } else if (isMorning) {
                // Create morning event
                const morningStart = new Date(startTime);
                morningStart.setHours(MORNING_START, 0, 0);
                
                const morningEnd = new Date(startTime);
                morningEnd.setHours(MORNING_END, 0, 0);
                
                events.push({
                  title: `${displayName} (Morning)`,
                  start: morningStart,
                  end: morningEnd,
                  allDay: false,
                  resource: {
                    machine: machineName,
                    timeSlot: 'morning',
                    reservationId: reservation.id,
                    isReservation: true
                  }
                });
              } else if (isAfternoon) {
                // Create afternoon event
                const afternoonStart = new Date(startTime);
                afternoonStart.setHours(AFTERNOON_START, 0, 0);
                
                const afternoonEnd = new Date(startTime);
                afternoonEnd.setHours(AFTERNOON_END, 0, 0);
                
                events.push({
                  title: `${displayName} (Afternoon)`,
                  start: afternoonStart,
                  end: afternoonEnd,
                  allDay: false,
                  resource: {
                    machine: machineName,
                    timeSlot: 'afternoon',
                    reservationId: reservation.id,
                    isReservation: true
                  }
                });
              }
            }
          }
        } else {
          // If no time slots, use the reservation date as an all-day event
          const reservationDate = new Date(reservation.date);
          
          events.push({
            title: `${displayName} (Reserved)`,
            start: new Date(reservationDate.setHours(0, 0, 0, 0)),
            end: new Date(reservationDate.setHours(23, 59, 59, 999)),
            allDay: true,
            resource: {
              machine: machineName,
              timeSlot: 'allday',
              reservationId: reservation.id,
              isReservation: true
            }
          });
        }
      }
    }

    // Process blocked dates
    for (const blockedDate of blockedDates) {
      const date = new Date(blockedDate.date);
      
      events.push({
        title: 'Unavailable (Blocked)', 
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999)),
        allDay: true,
        resource: {
          timeSlot: 'allday',
          isBlocked: true,
          blockedId: blockedDate.id
        }
      });
    }

    // Add user selections as events
    selectedDates.forEach(date => {
      events.push({
        title: 'Your Selection',
        start: new Date(new Date(date).setHours(0, 0, 0, 0)),
        end: new Date(new Date(date).setHours(23, 59, 59, 999)),
        allDay: true,
        resource: {
          timeSlot: 'allday',
          isSelected: true
        }
      });
    });

    setCalendarEvents(events);
  }, [reservations, blockedDates, selectedDates, selectedService, machinesForService]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Check if date is selectable
    if (isDateDisabled(date)) {
      return;
    }

    // Check if date is already selected
    const dateStr = date.toDateString();
    const isAlreadySelected = selectedDates.some(d => d.toDateString() === dateStr);
    
    let newSelectedDates;
    
    if (isAlreadySelected) {
      // Remove the date if already selected
      newSelectedDates = selectedDates.filter(d => d.toDateString() !== dateStr);
    } else {
      // Add the date if under max limit
      if (selectedDates.length >= maxDates) {
        toast({
          title: "Maximum dates reached",
          description: `You can only select up to ${maxDates} dates`,
          variant: "destructive",
        });
        return;
      }
      newSelectedDates = [...selectedDates, date];
    }
    
    // Notify parent
    onDateSelect(newSelectedDates);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (selections: Array<{
    date: Date;
    startTime: string | null;
    endTime: string | null;
    slot: 'morning' | 'afternoon' | null;
  }>) => {
    setDateTimeSelections(selections);
    
    // Update the formData with the selected dates and times
    const updatedDays = selections.filter(s => s.slot).map(selection => ({
      date: selection.date,
      startTime: selection.startTime,
      endTime: selection.endTime
    }));
    
    // Call the parent component's update function if it exists
    if (typeof onDateTimeSelect === 'function') {
      onDateTimeSelect(updatedDays);
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#4F46E5'; // Default Indigo
    let borderColor = '#4338CA';
    let textColor = 'white';
    
    if (event.resource) {
      if (event.resource.isBlocked) {
        backgroundColor = '#EF4444'; // Red for blocked dates
        borderColor = '#DC2626';
      } else if (event.resource.isSelected) {
        backgroundColor = '#22C55E'; // Green for selected dates
        borderColor = '#16A34A';
      } else if (event.resource.isReservation) {
        if (event.resource.timeSlot === 'morning') {
          backgroundColor = '#10B981'; // Green for morning
          borderColor = '#059669';
        } else if (event.resource.timeSlot === 'afternoon') {
          backgroundColor = '#F59E0B'; // Amber for afternoon
          borderColor = '#D97706';
        } else {
          backgroundColor = '#4F46E5'; // Indigo for all day
          borderColor = '#4338CA';
        }
      }
    }
    
    const style = {
      backgroundColor,
      borderLeft: `3px solid ${borderColor}`,
      color: textColor,
      borderRadius: '3px',
      fontSize: '0.7rem',
      padding: '1px 4px',
      margin: '1px 0',
      height: '20px',
      lineHeight: '18px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease-in-out',
      opacity: event.resource?.isSelected ? 1 : 0.85 // Slightly transparent for reservations
    };
    
    return {
      style,
      className: 'event-item hover:opacity-100'
    };
  };

  // Day cell styling with availability information
  const dayPropGetter = (date: Date) => {
    const dateStr = date.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = moment(date).isSame(moment(), 'day');
    const isPastDate = moment(date).isBefore(moment(), 'day');
    const isBlocked = blockedDates.some(d => new Date(d.date).toDateString() === dateStr);
    const isSelected = selectedDates.some(d => d.toDateString() === dateStr);
    
    // Get availability for this date
    const availability = machineAvailabilityMap[dateStr] || { morning: 0, afternoon: 0, overall: 0 };
    
    // Check if there's at least partial availability
    const hasPartialAvailability = availability.overall >= machineQuantityNeeded;
    const hasMorningAvailability = availability.morning >= machineQuantityNeeded;
    const hasAfternoonAvailability = availability.afternoon >= machineQuantityNeeded;
    const hasFullDayAvailability = hasMorningAvailability && hasAfternoonAvailability;
    
    let className = '';
    let style: React.CSSProperties = {};
    
    // Apply basic styling
    if (isWeekend) {
      style = { ...style, backgroundColor: '#F9FAFB' };
      className += ' weekend-day';
    }
    
    if (isToday) {
      className += ' today-cell';
    }
    
    if (isPastDate) {
      className += ' past-date';
      style = { ...style, backgroundColor: '#F1F1F1', opacity: 0.7 };
    }
    
    if (isBlocked) {
      className += ' blocked-date';
      style = { ...style, backgroundColor: '#FEE2E2', opacity: 0.85 };
    }
    
    // Apply availability styling
    if (!isPastDate && !isBlocked && !isWeekend) {
      if (!hasPartialAvailability) {
        // No availability at all
        className += ' no-availability';
        style = { ...style, backgroundColor: '#FEE2E2', opacity: 0.7 };
      } else if (!hasFullDayAvailability) {
        // Partial availability (either morning or afternoon)
        className += ' partial-availability';
        style = { ...style, backgroundColor: '#FEF3C7' };
        
        // Add a special class for morning-only or afternoon-only
        if (hasMorningAvailability && !hasAfternoonAvailability) {
          className += ' morning-only';
        } else if (!hasMorningAvailability && hasAfternoonAvailability) {
          className += ' afternoon-only';
        }
      } else {
        // Full availability
        className += ' full-availability';
      }
    }
    
    if (isSelected) {
      className += ' selected-date';
      style = { ...style, backgroundColor: '#DCFCE7', borderColor: '#16A34A', borderWidth: '2px' };
    }
    
    return {
      style,
      className: className.trim()
    };
  };
  
  // Determine if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isPastDate = moment(date).isBefore(moment(), 'day');
    const isBlocked = blockedDates.some(d => new Date(d.date).toDateString() === dateStr);
    
    // Check dates beyond the 1-month future limit
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const isTooFarInFuture = date > oneMonthLater;
    
    // If any of these basic conditions apply, disable the date
    if (isWeekend || isPastDate || isBlocked || isTooFarInFuture) {
      return true;
    }
    
    // Get availability for this date - check if ANY slots have machines available
    const availability = machineAvailabilityMap[dateStr] || { overall: 0 };
    
    // IMPORTANT: Only disable the date when there are NO machines available at all
    // This allows selection of dates with partial availability (e.g., morning only)
    return availability.overall < machineQuantityNeeded;
  };
  
  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      const newDate = new Date(toolbar.date);
      newDate.setMonth(newDate.getMonth() - 1);
      toolbar.onNavigate('prev');
      setCurrentDate(newDate);
    };
    
    const goToNext = () => {
      const newDate = new Date(toolbar.date);
      newDate.setMonth(newDate.getMonth() + 1);
      toolbar.onNavigate('next');
      setCurrentDate(newDate);
    };

    return (
      <div className="rbc-toolbar py-2 px-3 flex flex-row items-center justify-between border-b border-gray-200 bg-white relative">
        <div className="flex items-center">
          <div className="flex items-center">
            <button 
              onClick={goToBack} 
              className="p-1 rounded-l border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          <span className="font-semibold mx-3 text-gray-800 text-base">{toolbar.label}</span>
          <button 
              onClick={goToNext} 
              className="p-1 rounded-r border-t border-r border-b border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
        </div>
        
        {/* Empty middle space */}
        <div className="flex-grow"></div>
        
        {/* Selection counter */}
        <div className="text-sm font-medium text-gray-600">
          {selectedDates.length} of {maxDates} dates selected
        </div>
      </div>
    );
  };

  // Basic event component
  const EventComponent = ({ event }: { event: any }) => {
    return (
      <div className="event-content truncate py-0 px-1 text-xs">
        {event.title}
      </div>
    );
  };

  // Custom day cell component with availability info
  const DayCellWrapper = ({ children, value }: any) => {
    const dateStr = value.toDateString();
    const availability = machineAvailabilityMap[dateStr] || { morning: 0, afternoon: 0, overall: 0 };
    const isSelectable = !isDateDisabled(value);
    const isSelected = selectedDates.some(d => d.toDateString() === dateStr);
    const isPastDate = moment(value).isBefore(moment(), 'day');
    const isBlocked = blockedDates.some(d => new Date(d.date).toDateString() === dateStr);
    
    // Calculate availability status for morning and afternoon
    const hasMorningAvailability = availability.morning >= machineQuantityNeeded;
    const hasAfternoonAvailability = availability.afternoon >= machineQuantityNeeded;
    
    // Only show availability badges for selectable dates
    const showAvailabilityBadges = isSelectable && !isPastDate && !isBlocked;
    
    return (
        <div 
        className={`relative day-cell-wrapper ${isSelectable ? 'selectable' : 'disabled'} ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          // Stop propagation to prevent event bubbling
          e.stopPropagation();
          if (isSelectable) handleDateSelect(value);
        }}
        // Add this - prevent popup from closing
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {children}
        
        {/* Only show availability indicators for selectable dates */}
        {showAvailabilityBadges && (
          <div className="absolute bottom-1 left-1 flex space-x-1">
            {/* Morning availability badge (8AM-12PM) */}
            <div 
              className={`h-2 w-2 rounded-full ${
                hasMorningAvailability 
                  ? 'bg-green-500' 
                  : 'bg-red-400'
              }`}
              title={`Morning: ${hasMorningAvailability ? 'Available' : 'Unavailable'}`}
            />
            
            {/* Afternoon availability badge (1PM-5PM) */}
            <div 
              className={`h-2 w-2 rounded-full ${
                hasAfternoonAvailability 
                  ? 'bg-green-500' 
                  : 'bg-red-400'
              }`}
              title={`Afternoon: ${hasAfternoonAvailability ? 'Available' : 'Unavailable'}`}
            />
          </div>
        )}
        
        {/* Machine quantity indicator */}
        {isSelectable && !isSelected && (
          <div className="absolute bottom-1 right-1 bg-white rounded-full px-1.5 py-0.5 text-xs font-medium text-blue-600 shadow-sm border border-blue-100 z-10">
            {Math.max(availability.morning, availability.afternoon)} free
          </div>
        )}
        
        {isSelected && (
          <div className="absolute bottom-1 right-1 bg-green-100 rounded-full px-1.5 py-0.5 text-xs font-medium text-green-700 shadow-sm border border-green-200 z-10">
            <CheckCircle className="h-3 w-3" />
          </div>
        )}
      </div>
    );
  };

    // Tooltips for info about the calendar
    const availabilityInfo = useMemo(() => {
        if (!selectedService || !machineQuantityNeeded) {
          return "Please select a service and specify machine quantity first";
        }
        
        return `Showing availability for ${selectedService} with ${machineQuantityNeeded} machine(s) needed`;
      }, [selectedService, machineQuantityNeeded]);


      return (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar Section */}
    
          <div className="flex-1 overflow-hidden bg-white rounded-lg border border-gray-200">
        {/* Info banner */}
        <div className="p-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2">
            <Info className="text-blue-500 h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700 leading-relaxed">
              {availabilityInfo}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#22C55E] rounded-sm mr-1 shadow-sm"></div>
              <span className="text-gray-700">Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#4F46E5] rounded-sm mr-1 shadow-sm"></div>
              <span className="text-gray-700">Reserved (All Day)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#10B981] rounded-sm mr-1 shadow-sm"></div>
              <span className="text-gray-700">Morning (8AM-12PM)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#F59E0B] rounded-sm mr-1 shadow-sm"></div>
              <span className="text-gray-700">Afternoon (1PM-5PM)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#EF4444] rounded-sm mr-1 shadow-sm"></div>
              <span className="text-gray-700">Blocked</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 text-xs mt-2">
            <div className="flex items-center">
              <div className="flex mr-2">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-0.5"></div>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-700">Full Day Available</span>
            </div>
            <div className="flex items-center">
              <div className="flex mr-2">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-0.5"></div>
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
              </div>
              <span className="text-gray-700">Morning Only</span>
            </div>
            <div className="flex items-center">
              <div className="flex mr-2">
                <div className="h-2 w-2 rounded-full bg-red-400 mr-0.5"></div>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-700">Afternoon Only</span>
            </div>
            <div className="flex items-center">
              <div className="flex mr-2">
                <div className="h-2 w-2 rounded-full bg-red-400 mr-0.5"></div>
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
              </div>
              <span className="text-gray-700">No Availability</span>
            </div>
          </div>
        </div>
        
        {/* Calendar Section */}
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Loading calendar data...</p>
          </div>
        ) : (
          <div className="calendar-container flex-grow" style={{ height: "500px" }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              view="month"
              views={['month']}
              date={currentDate}
              toolbar={true}
              components={{
                toolbar: CustomToolbar,
                dateCellWrapper: DayCellWrapper,
                event: EventComponent
              }}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              popup
              className="font-sans h-full"
              formats={{
                monthHeaderFormat: 'MMMM YYYY',
                dayHeaderFormat: 'dddd, MMMM D',
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${moment(start).format('MMMM D')} - ${moment(end).format('MMMM D, YYYY')}`
              }}
            />
          </div>
        )}
        
        {/* Selected dates summary */}
        {selectedDates.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Dates:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <div 
                  key={index}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs flex items-center"
                >
                  {moment(date).format('MMM D, YYYY')}
                  <button
                    onClick={() => handleDateSelect(date)}
                    className="ml-1 p-0.5 hover:bg-green-200 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Time Slot Selection Section */}
      {selectedDates.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <Card className="h-full">
            <CardContent className="p-4 h-full overflow-y-auto">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Select Time Slots</h3>
              
              <TimeSlotSelector
                selectedDates={selectedDates}
                selectedService={selectedService}
                machineQuantityNeeded={machineQuantityNeeded}
                machineAvailabilityMap={machineAvailabilityMap}
                onTimeSlotSelect={handleTimeSlotSelect}
                initialSelections={dateTimeSelections}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add custom styling for better calendar appearance */}
      <style jsx global>{`
        /* Partial availability styling */
        .partial-availability:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(45deg, 
            rgba(251, 191, 36, 0.1) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(251, 191, 36, 0.1) 50%, 
            rgba(251, 191, 36, 0.1) 75%, 
            transparent 75%, 
            transparent);
          background-size: 8px 8px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.6;
        }
        
        /* Morning-only indicator */
        .morning-only:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 50%;
          background-color: rgba(34, 197, 94, 0.1);
          pointer-events: none;
          z-index: 1;
        }
        
        /* Afternoon-only indicator */
        .afternoon-only:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 50%;
          background-color: rgba(34, 197, 94, 0.1);
          pointer-events: none;
          z-index: 1;
        }
        
        /* Make the availability dots more visible */
        .day-cell-wrapper .rounded-full {
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
        }
        
        /* Reduce event card height to prevent blocking availability indicators */
        .rbc-event {
          padding: 1px 6px !important;
          margin-bottom: 1px;
          max-height: 24px;
          overflow: hidden;
        }

        /* Make day cells scrollable when they have many events */
        .rbc-day-bg {
          overflow-y: auto;
          max-height: 100%;
        }
        
        /* Ensure the "X free" indicator stays visible */
        .day-cell-wrapper .absolute.bottom-1.right-1 {
          z-index: 10;
          background-color: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        /* Make the grid wider on larger screens */
        @media (min-width: 1024px) {
          .rbc-calendar {
            max-width: 1200px;
            margin: 0 auto;
          }
        }

        /* Ensure events don't block interaction with the day cell */
        .rbc-event {
          pointer-events: auto;
          z-index: 4;
        }

        .day-cell-wrapper {
          z-index: 5;
        }

        /* Month row styling */
        .rbc-month-row {
          min-height: 90px
        }
        
        /* Weekends styling */
        .weekend-day {
          background-color: #F8FAFC !important;
        }
        
        /* Today's cell */
        .today-cell {
          box-shadow: inset 0 0 0 1px #4F46E5;
          z-index: 1;
          position: relative;
        }
        
        /* Off-range day styling (days from other months) */
        .rbc-off-range {
          color: #CBD5E1;
        }
        
        /* Active day styling when clicked */
        .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(224, 231, 255, 0.5);
        }
        
        /* Past dates styling */
        .past-date .rbc-date-cell {
          color: #94A3B8;
          text-decoration: line-through;
          opacity: 0.85;
        }
        
        /* Events on past dates */
        .past-date .rbc-event {
          opacity: 0.65 !important;
        }
        
        /* Diagonal striped background for past dates */
        .past-date:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(45deg, 
            rgba(203, 213, 225, 0.1) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(203, 213, 225, 0.1) 50%, 
            rgba(203, 213, 225, 0.1) 75%, 
            transparent 75%, 
            transparent);
          background-size: 8px 8px;
          pointer-events: none;
          z-index: 2;
        }
        
        /* Blocked dates styling */
        .blocked-date .rbc-date-cell {
          color: #EF4444;
          font-weight: 500;
        }
        
        /* Not enough machines styling */
        .insufficient-machines:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(45deg, 
            rgba(251, 191, 36, 0.1) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(251, 191, 36, 0.1) 50%, 
            rgba(251, 191, 36, 0.1) 75%, 
            transparent 75%, 
            transparent);
          background-size: 8px 8px;
          pointer-events: none;
          z-index: 1;
        }
        
        /* Cell wrapper for interaction */
        .day-cell-wrapper {
          height: 100%;
          min-height: 5rem;
          width: 100%;
        }
        
        .day-cell-wrapper.selectable {
          cursor: pointer;
        }
        
        .day-cell-wrapper.selectable:hover {
          background-color: rgba(224, 231, 255, 0.3);
          transition: background-color 0.15s ease;
        }
        
        .day-cell-wrapper.disabled {
          cursor: not-allowed;
        }
        
        .day-cell-wrapper.selected .rbc-date-cell {
          font-weight: 700;
          color: #16A34A;
        }
        
        /* Add position relative for pseudo-element placement */
        .rbc-day-bg {
          position: relative;
        }
        
        /* Ensure borders connect properly */
        .rbc-month-view, .rbc-month-row, .rbc-week-row, .rbc-day-bg {
          border-collapse: separate;
        }
        
        /* Make events container scrollable if many events */
        .rbc-row-content {
          max-height: 100%;
        }
        
        /* Calendar container scroll */
        .rbc-calendar {
          height: 100% !important;
        }
        
        /* Custom scrollbar for calendar */
        .rbc-month-view::-webkit-scrollbar {
          width: 6px;
        }
        
        .rbc-month-view::-webkit-scrollbar-track {
          background: #F1F5F9;
        }
        
        .rbc-month-view::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
        }

        /* Add this to your style jsx global section */
        .rbc-overlay {
        z-index: 50;
        }

        .rbc-event {
        pointer-events: none;
        }

        .day-cell-wrapper {
        pointer-events: auto;
        }
      `}</style>
    </div>
  );
};

// Now let's create the TimeSlotSelector component
const TimeSlotSelector = ({ 
  selectedDates,
  selectedService,
  machineQuantityNeeded,
  machineAvailabilityMap,
  onTimeSlotSelect,
  initialSelections = []
}) => {
  const DEFAULT_MORNING_START = "08:00 AM";
  const DEFAULT_MORNING_END = "12:00 PM";
  const DEFAULT_AFTERNOON_START = "01:00 PM";
  const DEFAULT_AFTERNOON_END = "05:00 PM";
  
  const [dateTimeSelections, setDateTimeSelections] = useState(
    selectedDates.map(date => {
      // Look for initial value
      const initialSelection = initialSelections.find(
        selection => selection.date.toDateString() === date.toDateString()
      );
      
      if (initialSelection) {
        return initialSelection;
      }
      
      // Default to no selection
      return {
        date,
        startTime: null,
        endTime: null,
        slot: null
      };
    })
  );
  
  // Effect to update selections when selected dates change
  useEffect(() => {
    // Create a map of existing selections
    const existingSelectionsMap = dateTimeSelections.reduce((acc, selection) => {
      acc[selection.date.toDateString()] = selection;
      return acc;
    }, {});
    
    // Create new array with updated date selections
    const newSelections = selectedDates.map(date => {
      const dateString = date.toDateString();
      
      // Keep existing selection if available
      if (existingSelectionsMap[dateString]) {
        return existingSelectionsMap[dateString];
      }
      
      // Initialize new date
      return {
        date,
        startTime: null,
        endTime: null,
        slot: null
      };
    });
    
    setDateTimeSelections(newSelections);
  }, [selectedDates]);
  
  // Notify parent component when selections change
  useEffect(() => {
    onTimeSlotSelect(dateTimeSelections);
  }, [dateTimeSelections, onTimeSlotSelect]);
  
  // Check if a time slot is available for a date
  const isTimeSlotAvailable = (date, slot) => {
    const dateStr = date.toDateString();
    const availability = machineAvailabilityMap[dateStr] || { morning: 0, afternoon: 0 };
    
    return availability[slot] >= machineQuantityNeeded;
  };
  
  // Handle slot selection
  const handleSlotSelect = (dateIndex, slot) => {
    const newSelections = [...dateTimeSelections];
    const currentSelection = newSelections[dateIndex];
    
    // Toggle selection off if already selected
    if (currentSelection.slot === slot) {
      newSelections[dateIndex] = {
        ...currentSelection,
        startTime: null,
        endTime: null,
        slot: null
      };
    } 
    // Set new time slot
    else {
      const startTime = slot === 'morning' ? DEFAULT_MORNING_START : DEFAULT_AFTERNOON_START;
      const endTime = slot === 'morning' ? DEFAULT_MORNING_END : DEFAULT_AFTERNOON_END;
      
      newSelections[dateIndex] = {
        ...currentSelection,
        startTime,
        endTime,
        slot
      };
    }
    
    setDateTimeSelections(newSelections);
  };
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        <p>Select a time slot for each of your chosen dates. Only slots with sufficient machine availability are enabled.</p>
      </div>
      
      {dateTimeSelections.length > 0 ? (
        dateTimeSelections.map((selection, index) => {
          const date = selection.date;
          const morningAvailable = isTimeSlotAvailable(date, 'morning');
          const afternoonAvailable = isTimeSlotAvailable(date, 'afternoon');
          
          return (
            <Card key={date.toISOString()} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800">
                    {date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Time slot selection */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Time Slot:</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Morning slot */}
                      <button
                        type="button"
                        onClick={() => morningAvailable && handleSlotSelect(index, 'morning')}
                        disabled={!morningAvailable}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !morningAvailable 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : selection.slot === 'morning'
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {selection.slot === 'morning' && <Check className="h-4 w-4 mr-1 text-blue-600" />}
                          <span>Morning (8AM-12PM)</span>
                        </div>
                        {!morningAvailable && (
                          <div className="text-xs mt-1 text-red-500">Not available</div>
                        )}
                      </button>
                      
                      {/* Afternoon slot */}
                      <button
                        type="button"
                        onClick={() => afternoonAvailable && handleSlotSelect(index, 'afternoon')}
                        disabled={!afternoonAvailable}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !afternoonAvailable 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : selection.slot === 'afternoon'
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {selection.slot === 'afternoon' && <Check className="h-4 w-4 mr-1 text-blue-600" />}
                          <span>Afternoon (1PM-5PM)</span>
                        </div>
                        {!afternoonAvailable && (
                          <div className="text-xs mt-1 text-red-500">Not available</div>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Time display */}
                  {selection.slot && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Selected Time</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Start Time</p>
                          <p className="font-medium">{selection.startTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">End Time</p>
                          <p className="font-medium">{selection.endTime}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Availability warning if needed */}
                  {!morningAvailable && !afternoonAvailable ? (
                    <div className="mt-2 p-3 bg-red-50 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm text-red-700 font-medium">No Available Time Slots</p>
                          <p className="text-xs text-red-600 mt-1">
                            All machines for this service are fully booked on this date.
                            Please select a different date or contact support.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !selection.slot ? (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                        <p className="text-sm text-yellow-700">
                          Please select a time slot to continue.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No dates selected yet</p>
          <p className="text-sm text-gray-400 mt-2">Select dates from the calendar above</p>
        </div>
      )}
      
      {/* Summary of selections */}
      {dateTimeSelections.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h4 className="text-blue-800 font-medium mb-2">Time Slot Summary</h4>
          <ul className="space-y-2">
            {dateTimeSelections.filter(s => s.slot).map((s, i) => (
              <li key={i} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">{s.date.toLocaleDateString()}</span>
                <span className="mx-2">-</span>
                <span>{s.slot === 'morning' ? 'Morning' : 'Afternoon'}</span>
                <span className="mx-1">:</span>
                <span className="text-gray-600">{s.startTime} - {s.endTime}</span>
              </li>
            ))}
          </ul>
          {dateTimeSelections.some(s => !s.slot) && (
            <p className="text-sm text-yellow-600 mt-2">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {dateTimeSelections.filter(s => !s.slot).length} date(s) still need time slots selected.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Wrapper component that can be used in the MSME scheduling flow
export const InteractiveMachineCalendarWrapper = ({ 
  formData, 
  updateFormData 
}: { 
  formData: any;
  updateFormData: (field: string, value: any) => void;
}) => {
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch services data
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServicesData(data);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load services data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleDateSelect = (dates: Date[]) => {
    // Update form data with the new dates
    updateFormData('days', dates.map(date => ({
      date,
      startTime: formData.unifiedStartTime || null,
      endTime: formData.unifiedEndTime || null
    })));
  };

  const handleDateTimeSelect = (dateTimeSelections) => {
    // Update form data with the selected dates and times
    updateFormData('days', dateTimeSelections);
  };

  // Determine the selected service
  const selectedService = typeof formData.ProductsManufactured === 'string' 
    ? formData.ProductsManufactured 
    : Array.isArray(formData.ProductsManufactured) && formData.ProductsManufactured.length > 0
      ? formData.ProductsManufactured[0]
      : '';

  // Determine machine quantity needed
  const machineQuantityNeeded = selectedService && formData.serviceMachineNumbers 
    ? formData.serviceMachineNumbers[selectedService] || 0
    : 0;

  // Extract currently selected dates
  const selectedDates = formData.days?.map((day: any) => new Date(day.date)) || [];

  return (
    <Card className="mt-6 shadow-sm">
      <CardContent className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Loading service data...</p>
          </div>
        ) : (
          <>
            {!selectedService ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Service Selection Required</h3>
                <p className="text-gray-600 mb-4">Please select a service and specify machine quantity first</p>
              </div>
            ) : machineQuantityNeeded <= 0 ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Machine Quantity Required</h3>
                <p className="text-gray-600 mb-4">Please specify how many machines you need for this service</p>
              </div>
            ) : (
              <InteractiveMachineCalendar
                selectedService={selectedService}
                machineQuantityNeeded={machineQuantityNeeded}
                onDateSelect={handleDateSelect}
                onDateTimeSelect={handleDateTimeSelect}
                selectedDates={selectedDates}
                servicesData={servicesData}
                maxDates={5}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMachineCalendar;