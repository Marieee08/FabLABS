// src\components\user\machine-calendar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Info, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

interface BlockedDate {
  id: string;
  date: Date;
}

interface MachineCalendarProps {
  machines: Machine[];
  onClose?: () => void;
}

const MachineCalendar: React.FC<MachineCalendarProps> = ({ machines, onClose }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Time slots definitions
  const MORNING_START = 8; // 8 AM
  const MORNING_END = 12; // 12 PM
  const AFTERNOON_START = 13; // 1 PM
  const AFTERNOON_END = 17; // 5 PM

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
        // and exclude EVC reservations
        const filteredReservations = reservationsData.filter((res: Reservation) => 
          ['Approved', 'Ongoing'].includes(res.status) && 
          res.type !== 'evc' &&
          res.machines.some(machine => machine !== 'Not specified' && machine)
        );
        
        console.log("Fetched reservations:", filteredReservations);
        
        setReservations(filteredReservations);
        setBlockedDates(blockedDatesData);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  // Process reservations and blocked dates into calendar events
  useEffect(() => {
    const events = [];

    // Filter reservations by selected machine if needed
    const filteredReservations = selectedMachine === 'all' 
      ? reservations 
      : reservations.filter(res => res.machines.includes(selectedMachine));

    // Process reservations - create separate events for each machine
    for (const reservation of filteredReservations) {
      // Process each machine separately
      for (const machineName of reservation.machines) {
        // Skip if we're filtering for a specific machine and this isn't it
        if (selectedMachine !== 'all' && machineName !== selectedMachine) continue;
        
        // Skip any "Not specified" or empty machine names
        if (!machineName || machineName === 'Not specified') continue;
        
        // Find the machine object to get its proper name
        const machineObj = machines.find(m => m.id === machineName || m.Machine === machineName);
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
                  title: displayName,
                  start: allDayStart,
                  end: allDayEnd,
                  allDay: true,
                  resource: {
                    machine: machineName,
                    timeSlot: 'allday'
                  }
                });
              } else if (isMorning) {
                // Create morning event
                const morningStart = new Date(startTime);
                morningStart.setHours(MORNING_START, 0, 0);
                
                const morningEnd = new Date(startTime);
                morningEnd.setHours(MORNING_END, 0, 0);
                
                events.push({
                  title: displayName,
                  start: morningStart,
                  end: morningEnd,
                  allDay: false,
                  resource: {
                    machine: machineName,
                    timeSlot: 'morning'
                  }
                });
              } else if (isAfternoon) {
                // Create afternoon event
                const afternoonStart = new Date(startTime);
                afternoonStart.setHours(AFTERNOON_START, 0, 0);
                
                const afternoonEnd = new Date(startTime);
                afternoonEnd.setHours(AFTERNOON_END, 0, 0);
                
                events.push({
                  title: displayName,
                  start: afternoonStart,
                  end: afternoonEnd,
                  allDay: false,
                  resource: {
                    machine: machineName,
                    timeSlot: 'afternoon'
                  }
                });
              }
            }
          }
        } else {
          // If no time slots, use the reservation date as an all-day event
          const reservationDate = new Date(reservation.date);
          
          events.push({
            title: displayName,
            start: new Date(reservationDate.setHours(0, 0, 0, 0)),
            end: new Date(reservationDate.setHours(23, 59, 59, 999)),
            allDay: true,
            resource: {
              machine: machineName,
              timeSlot: 'allday'
            }
          });
        }
      }
    }

    // Process blocked dates (these apply to all machines)
    if (selectedMachine === 'all' || machines.find(m => m.id === selectedMachine)) {
      for (const blockedDate of blockedDates) {
        const date = new Date(blockedDate.date);
        
        events.push({
          title: 'All Machines',
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999)),
          allDay: true,
          resource: {
            timeSlot: 'blocked'
          }
        });
      }
    }

    setCalendarEvents(events);
    console.log("Calendar Events:", events);
  }, [reservations, blockedDates, selectedMachine, machines]);

  // Custom event styling based on time slot
  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#1c62b5'; // Default blue for all day
    
    if (event.resource) {
      if (event.resource.timeSlot === 'blocked') {
        backgroundColor = '#1c62b5'; // Red for blocked dates
      } else if (event.resource.timeSlot === 'morning') {
        backgroundColor = '#22C55E'; // Green for morning reservations
      } else if (event.resource.timeSlot === 'afternoon') {
        backgroundColor = '#F59E0B'; // Amber for afternoon reservations
      }
    }
    
    const style = {
      backgroundColor,
      color: 'white',
      border: 'none',
      display: 'block',
      borderRadius: '4px',
      fontSize: '0.8rem'
    };
    
    return {
      style
    };
  };
  
  // Custom toolbar with month navigation
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
      <div className="rbc-toolbar">
        <div className="flex items-center justify-center py-2">
          <button 
            onClick={goToBack} 
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold mx-4">{toolbar.label}</span>
          <button 
            onClick={goToNext} 
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h3 className="text-xl font-bold font-qanelas2">
          Machine Availability Calendar
        </h3>
        
        <div className="relative">
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Machines</option>
            {machines.filter(machine => machine.id !== 'EVC Lab' && machine.Machine !== 'EVC Lab').map(machine => (
              <option key={machine.id} value={machine.id} disabled={!machine.isAvailable}>
                {machine.Machine} {!machine.isAvailable ? '(Unavailable)' : ''}
              </option>
            ))}
          </select>
          <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
        </div>
      </div>
      
      <div className="font-poppins1 mb-4 flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
        <Info className="text-blue-500 h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-gray-700">
            This calendar shows the availability of all machines. Reserved time slots 
            are marked on the calendar. Use the filter to view availability for a specific machine.
          </p>
        </div>
      </div>
      
      <div className="mb-3 flex flex-wrap gap-3">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#1c62b5] rounded-sm mr-2"></div>
          <span className="text-sm">All Day</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#22C55E] rounded-sm mr-2"></div>
          <span className="text-sm">Morning (8AM-12PM)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#F59E0B] rounded-sm mr-2"></div>
          <span className="text-sm">Afternoon (1PM-5PM)</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-[500px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="h-[500px]">
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
              toolbar: CustomToolbar
            }}
            eventPropGetter={eventStyleGetter}
            popup
            className="font-poppins1"
          />
        </div>
      )}
      
      {onClose && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-100 text-gray-700 py-2 px-6 rounded-full transition duration-300 hover:bg-gray-200 font-poppins1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default MachineCalendar;