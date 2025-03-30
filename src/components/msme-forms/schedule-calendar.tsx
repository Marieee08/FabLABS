import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Filter, ChevronLeft, ChevronRight, Clock, Cpu, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface MachineAvailability {
  morning: number;  // Available machines in morning (8AM-12PM)
  afternoon: number; // Available machines in afternoon (1PM-5PM)
  allDay: number;    // Available machines all day
}

interface CalendarAvailabilityMap {
  [dateString: string]: MachineAvailability;
}

export interface SelectedDate {
  date: Date;
  availableMorning: boolean;
  availableAfternoon: boolean;
}

interface ScheduleCalendarProps {
  serviceId: string;
  onDateSelect: (selectedDates: SelectedDate[]) => void;
  minMachineQuantity: number;
  initialSelectedDates?: SelectedDate[];
  maxSelectableDates?: number;
}

// Set up the localizer for the calendar
const localizer = momentLocalizer(moment);

/**
 * A calendar component that displays machine availability and allows date selection
 */
const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  serviceId,
  onDateSelect,
  minMachineQuantity,
  initialSelectedDates = [],
  maxSelectableDates = 5
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>(initialSelectedDates);
  const [availabilityMap, setAvailabilityMap] = useState<CalendarAvailabilityMap>({});
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [totalMachines, setTotalMachines] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch availability data for the current month
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!serviceId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate month range for API request
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Fetch blocked dates
        const blockedResponse = await fetch('/api/blocked-dates');
        if (!blockedResponse.ok) {
          throw new Error('Failed to fetch blocked dates');
        }
        const blockedData = await blockedResponse.json();
        const blockedSet = new Set(blockedData.map((item: any) => 
          new Date(item.date).toDateString()
        ));
        setBlockedDates(blockedSet);
        
        // Fetch service details to get total machines
        const serviceResponse = await fetch(`/api/services/${serviceId}`);
        if (!serviceResponse.ok) {
          throw new Error('Failed to fetch service details');
        }
        const serviceData = await serviceResponse.json();
        
        // Calculate total machines for this service
        let machineTotal = 0;
        if (serviceData.Machines && Array.isArray(serviceData.Machines)) {
          machineTotal = serviceData.Machines.reduce((sum: any, machineService: { machine: { Number: number; }; }) => {
            const machineCount = machineService.machine.Number || 1;
            return sum + machineCount;
          }, 0);
        }
        setTotalMachines(machineTotal);
        
        // Fetch reservations to calculate availability
        const reservationsResponse = await fetch('/api/user/calendar-reservations');
        if (!reservationsResponse.ok) {
          throw new Error('Failed to fetch reservations');
        }
        const reservationsData = await reservationsResponse.json();
        
        // Process reservations to build availability map
        const availability: CalendarAvailabilityMap = {};
        
        // Initialize availability for each day in the month
        for (let day = new Date(monthStart); day <= monthEnd; day.setDate(day.getDate() + 1)) {
          const dateString = new Date(day).toDateString();
          availability[dateString] = {
            morning: machineTotal,
            afternoon: machineTotal,
            allDay: machineTotal
          };
        }
        
        // Process each reservation to update availability
        reservationsData.forEach((reservation: any) => {
          // Skip if reservation doesn't involve this service
          if (!reservation.machines.some((machine: string) => 
            serviceData.Machines.some((m: any) => m.machine.Machine === machine)
          )) {
            return;
          }
          
          // Calculate how many machines are used by this reservation
          const usedMachines = reservation.machines.filter((machine: string) => 
            serviceData.Machines.some((m: any) => m.machine.Machine === machine)
          ).length;
          
          // Update availability based on time slots
          if (reservation.timeSlots && reservation.timeSlots.length > 0) {
            reservation.timeSlots.forEach((slot: any) => {
              if (slot.startTime && slot.endTime) {
                const slotDate = new Date(slot.startTime);
                const dateString = slotDate.toDateString();
                
                if (availability[dateString]) {
                  const startHour = new Date(slot.startTime).getHours();
                  const endHour = new Date(slot.endTime).getHours();
                  
                  // Update morning availability (8AM-12PM)
                  if (startHour < 12) {
                    availability[dateString].morning = Math.max(
                      0, 
                      availability[dateString].morning - usedMachines
                    );
                  }
                  
                  // Update afternoon availability (1PM-5PM)
                  if (endHour >= 13) {
                    availability[dateString].afternoon = Math.max(
                      0, 
                      availability[dateString].afternoon - usedMachines
                    );
                  }
                  
                  // If spans both, update all day
                  if (startHour < 12 && endHour >= 13) {
                    availability[dateString].allDay = Math.max(
                      0, 
                      availability[dateString].allDay - usedMachines
                    );
                  }
                }
              }
            });
          } else {
            // If no time slots specified, assume all day
            const reservationDate = new Date(reservation.date);
            const dateString = reservationDate.toDateString();
            
            if (availability[dateString]) {
              availability[dateString].morning = Math.max(
                0, 
                availability[dateString].morning - usedMachines
              );
              availability[dateString].afternoon = Math.max(
                0, 
                availability[dateString].afternoon - usedMachines
              );
              availability[dateString].allDay = Math.max(
                0, 
                availability[dateString].allDay - usedMachines
              );
            }
          }
        });
        
        setAvailabilityMap(availability);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error fetching availability data:', err);
        setError(`Failed to load availability data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };
    
    fetchAvailability();
  }, [serviceId, currentMonth]);

  // Handle date selection
  const handleDateClick = (date: Date) => {
    // Don't allow selection if disabled
    if (isDateDisabled(date)) {
      return;
    }
    
    // Check if date is already selected
    const isAlreadySelected = selectedDates.some(d => 
      d.date.toDateString() === date.toDateString()
    );
    
    if (isAlreadySelected) {
      // Remove the date if already selected
      const updatedDates = selectedDates.filter(d => 
        d.date.toDateString() !== date.toDateString()
      );
      setSelectedDates(updatedDates);
      onDateSelect(updatedDates);
    } else {
      // Enforce maximum number of selectable dates
      if (selectedDates.length >= maxSelectableDates) {
        return;
      }
      
      // Add the date with availability info
      const dateString = date.toDateString();
      const availability = availabilityMap[dateString] || { morning: 0, afternoon: 0 };
      
      const newSelectedDate: SelectedDate = {
        date,
        availableMorning: availability.morning >= minMachineQuantity,
        availableAfternoon: availability.afternoon >= minMachineQuantity
      };
      
      const updatedDates = [...selectedDates, newSelectedDate];
      setSelectedDates(updatedDates);
      onDateSelect(updatedDates);
    }
  };
  
  // Navigate to next/previous month
  const nextMonth = () => {
    setCurrentMonth(prevMonth => {
      const next = new Date(prevMonth);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };
  
  const previousMonth = () => {
    setCurrentMonth(prevMonth => {
      const prev = new Date(prevMonth);
      prev.setMonth(prev.getMonth() - 1);
      return prev;
    });
  };
  
  // Check if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Past dates are disabled
    if (date < today) {
      return true;
    }
    
    // Blocked dates are disabled
    if (blockedDates.has(date.toDateString())) {
      return true;
    }
    
    // Check if there's any availability for this date
    const dateString = date.toDateString();
    const availability = availabilityMap[dateString];
    
    if (!availability) {
      return true;
    }
    
    // Date is disabled if there are not enough machines in either morning or afternoon
    return (
      availability.morning < minMachineQuantity && 
      availability.afternoon < minMachineQuantity
    );
  };
  
  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    return (
      <div className="rbc-toolbar py-2 px-3 flex flex-row items-center justify-between border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="flex items-center">
            <button 
              onClick={previousMonth} 
              className="p-1 rounded-l border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          <span className="font-semibold mx-3 text-gray-800 text-base">
            {moment(currentMonth).format('MMMM YYYY')}
          </span>
          
          <button 
            onClick={nextMonth} 
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
          {selectedDates.length} of {maxSelectableDates} dates selected
        </div>
      </div>
    );
  };
  
  // Day cell styling with availability information
  const dayPropGetter = (date: Date) => {
    const dateString = date.toDateString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = date.getTime() === today.getTime();
    const isPastDate = date < today;
    const isBlocked = blockedDates.has(dateString);
    const isSelected = selectedDates.some(d => d.date.toDateString() === dateString);
    
    // Get availability for this date
    const availability = availabilityMap[dateString];
    
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
    if (!isPastDate && !isBlocked && !isWeekend && availability) {
      const hasMorningAvailability = availability.morning >= minMachineQuantity;
      const hasAfternoonAvailability = availability.afternoon >= minMachineQuantity;
      
      if (!hasMorningAvailability && !hasAfternoonAvailability) {
        // No availability at all
        className += ' no-availability';
        style = { ...style, backgroundColor: '#FEE2E2', opacity: 0.7 };
      } else if (!hasMorningAvailability || !hasAfternoonAvailability) {
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
  
  // Custom day cell component with availability info
  const DayCellWrapper = ({ children, value }: any) => {
    const dateString = value.toDateString();
    const availability = availabilityMap[dateString];
    const isDateDisabledValue = isDateDisabled(value);
    const isSelected = selectedDates.some(d => d.date.toDateString() === dateString);
    
    // Calculate machine availability
    let morningMachines = 0;
    let afternoonMachines = 0;
    
    if (availability) {
      morningMachines = availability.morning;
      afternoonMachines = availability.afternoon;
    }
    
    return (
      <div 
        className={`relative day-cell-wrapper ${isDateDisabledValue ? 'disabled' : 'selectable'} ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          // Prevent bubbling to avoid issues with the calendar
          e.stopPropagation();
          if (!isDateDisabledValue) {
            handleDateClick(value);
          }
        }}
      >
        {children}
        
        {/* Only show availability indicators for selectable dates */}
        {!isDateDisabledValue && (
          <div className="absolute bottom-1 left-1 flex space-x-1">
            {/* Morning availability indicator (8AM-12PM) */}
            <div 
              className={`h-2 w-2 rounded-full ${
                morningMachines >= minMachineQuantity
                  ? 'bg-green-500' 
                  : 'bg-red-400'
              }`}
              title={`Morning: ${morningMachines} machines available`}
            />
            
            {/* Afternoon availability indicator (1PM-5PM) */}
            <div 
              className={`h-2 w-2 rounded-full ${
                afternoonMachines >= minMachineQuantity
                  ? 'bg-green-500' 
                  : 'bg-red-400'
              }`}
              title={`Afternoon: ${afternoonMachines} machines available`}
            />
          </div>
        )}
        
        {/* Machine quantity indicator */}
        {!isDateDisabledValue && !isSelected && (
          <div className="absolute bottom-1 right-1 bg-white rounded-full px-1.5 py-0.5 text-xs font-medium text-blue-600 shadow-sm border border-blue-100 z-10">
            {Math.max(morningMachines, afternoonMachines)} free
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Select Dates</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm text-gray-600">Loading calendar data...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="text-blue-500 h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  Select up to {maxSelectableDates} dates for your reservation. Green dots indicate machine availability.
                  You'll need at least {minMachineQuantity} machine(s) for your reservation.
                </p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#DCFCE7] border-2 border-[#16A34A] rounded-sm mr-1 shadow-sm"></div>
                  <span className="text-gray-700">Selected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#FEE2E2] rounded-sm mr-1 shadow-sm"></div>
                  <span className="text-gray-700">Blocked</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#F1F1F1] rounded-sm mr-1 shadow-sm"></div>
                  <span className="text-gray-700">Past Date</span>
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
              </div>
            </div>
            
            <div className="calendar-container" style={{ height: "500px" }}>
              <Calendar
                localizer={localizer}
                events={[]}
                startAccessor="start"
                endAccessor="end"
                view="month"
                views={['month']}
                date={currentMonth}
                onNavigate={(date) => setCurrentMonth(date)}
                toolbar={true}
                components={{
                  toolbar: CustomToolbar,
                  dateCellWrapper: DayCellWrapper
                }}
                dayPropGetter={dayPropGetter}
                className="font-sans h-full"
                formats={{
                  monthHeaderFormat: 'MMMM YYYY',
                  dayHeaderFormat: 'dddd, MMMM D',
                  dayRangeHeaderFormat: ({ start, end }) => 
                    `${moment(start).format('MMMM D')} - ${moment(end).format('MMMM D, YYYY')}`
                }}
              />
            </div>
            
            {/* Selected dates summary */}
            {selectedDates.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Dates:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((dateObj, index) => (
                    <div 
                      key={index}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs flex items-center"
                    >
                      {moment(dateObj.date).format('MMM D, YYYY')}
                      <button
                        onClick={() => handleDateClick(dateObj.date)}
                        className="ml-1 p-0.5 hover:bg-green-200 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Add custom styling for the calendar */}
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
        
        /* Today's cell */
        .today-cell {
          box-shadow: inset 0 0 0 1px #4F46E5;
          z-index: 1;
          position: relative;
        }
      `}</style>
    </Card>
  );
};

export default ScheduleCalendar;