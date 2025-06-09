"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Info, Filter, ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, X } from 'lucide-react';

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
  Number?: number; // Total available quantity of this machine
  bookedCount?: number; // Currently booked count (will be calculated)
}

interface BlockedDate {
  id: string;
  date: Date;
}

interface MachineCalendarProps {
  machines: Machine[];
  onClose?: () => void;
  isOpen: boolean;
}

const MachineCalendar: React.FC<MachineCalendarProps> = ({ machines, onClose, isOpen }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Time slots definitions
  const MORNING_START = 8; // 8 AM
  const MORNING_END = 12; // 12 PM
  const AFTERNOON_START = 13; // 1 PM
  const AFTERNOON_END = 17; // 5 PM
  const [machineAvailability, setMachineAvailability] = useState<Record<string, Record<string, number>>>({});

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
          res.machines.some(machine => machine !== 'Not specified' && machine)
        );
        
        // Calculate machine availability per date
        const availability: Record<string, Record<string, number>> = {};
        
        // Initialize with all machines available
        machines.forEach(machine => {
          if (machine.Number && machine.Number > 0) {
            // Initialize the machine's availability
            for (let i = -7; i <= 31; i++) {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              
              if (!availability[dateStr]) {
                availability[dateStr] = {};
              }
              availability[dateStr][machine.id] = machine.Number;
            }
          }
        });
        
        // Reduce availability based on reservations
        filteredReservations.forEach((reservation: Reservation) => {
          // Get the date for this reservation
          const reservationDate = new Date(reservation.date);
          const dateStr = reservationDate.toISOString().split('T')[0];
          
          // For each machine in the reservation
          reservation.machines.forEach(machineId => {
            // Skip non-specific machines
            if (machineId === 'Not specified' || !machineId) return;
            
            // Reduce available count for this machine on this date
            if (availability[dateStr] && availability[dateStr][machineId] !== undefined) {
              availability[dateStr][machineId] = Math.max(0, availability[dateStr][machineId] - 1);
            }
          });
        });
        
        setMachineAvailability(availability);
        setReservations(filteredReservations);
        setBlockedDates(blockedDatesData);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [machines]); // Added machines dependency

  // Process reservations and blocked dates into calendar events
  useEffect(() => {
    const events = [];

    // First, filter reservations by selected machine
    let filteredReservations = reservations;
    
    if (selectedMachine !== 'all') {
      // Find the machine ID or name for comparison
      const selectedMachineObj = machines.find(m => 
        m.id === selectedMachine || m.Machine === selectedMachine
      );
      
      const machineId = selectedMachineObj?.id || selectedMachine;
      const machineName = selectedMachineObj?.Machine || selectedMachine;
      
      // Filter reservations that contain this machine
      filteredReservations = reservations.filter(res => 
        res.machines.some(machine => 
          machine === machineId || machine === machineName
        )
      );
    }

    // Process reservations - create separate events for each machine
    for (const reservation of filteredReservations) {
      // Process each machine separately
      for (const machineName of reservation.machines) {
        // Skip if we're filtering for a specific machine and this isn't it
        if (selectedMachine !== 'all') {
          const selectedMachineObj = machines.find(m => 
            m.id === selectedMachine || m.Machine === selectedMachine
          );
          
          const machineId = selectedMachineObj?.id || selectedMachine;
          const machineName2 = selectedMachineObj?.Machine || selectedMachine;
          
          if (machineName !== machineId && machineName !== machineName2) continue;
        }
        
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
                    timeSlot: 'allday',
                    reservationId: reservation.id
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
                    timeSlot: 'morning',
                    reservationId: reservation.id
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
                    timeSlot: 'afternoon',
                    reservationId: reservation.id
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
              timeSlot: 'allday',
              reservationId: reservation.id
            }
          });
        }
      }
    }

    // Process blocked dates - show for all machines or just the selected one
    for (const blockedDate of blockedDates) {
      const date = new Date(blockedDate.date);
      
      events.push({
        title: 'Unavailable', 
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

    setCalendarEvents(events);
  }, [reservations, blockedDates, selectedMachine, machines]);

  // Custom event styling based on time slot
  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#4F46E5'; // Indigo for all day
    let borderColor = '#4338CA';
    let opacity = 1;
    
    if (event.resource) {
      // Check if this is a blocked date
      if (event.resource.isBlocked) {
        backgroundColor = '#EF4444'; // Red for blocked dates
        borderColor = '#DC2626';
      } else if (event.resource.timeSlot === 'morning') {
        backgroundColor = '#10B981'; // Green for morning reservations
        borderColor = '#059669';
      } else if (event.resource.timeSlot === 'afternoon') {
        backgroundColor = '#F59E0B'; // Amber for afternoon reservations
        borderColor = '#D97706';
      }
      
      // Check if machine is fully booked
      if (event.resource.machine && !event.resource.isBlocked) {
        const machineId = event.resource.machine;
        const dateStr = event.start.toISOString().split('T')[0];
        
        // If availability info exists and machine is fully booked
        if (
          machineAvailability[dateStr] && 
          machineAvailability[dateStr][machineId] !== undefined &&
          machineAvailability[dateStr][machineId] === 0
        ) {
          // Add "FULL" to the title
          event.title = `${event.title} (FULL)`;
          opacity = 0.8;
          backgroundColor = '#9CA3AF'; // Gray for fully booked
          borderColor = '#6B7280';
        }
      }
    }
    
    const style = {
      backgroundColor,
      borderLeft: `4px solid ${borderColor}`,
      color: 'white',
      borderRadius: '4px',
      fontSize: '0.8rem',
      padding: '4px 6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease-in-out',
      opacity
    };
    
    return {
      style,
      className: 'event-item hover:shadow-md'
    };
  };
  
  
  // Day cell styling
  const dayPropGetter = (date: Date) => {
    // Check if the date is a weekend
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = moment(date).isSame(moment(), 'day');
    // Check if the date is in the past
    const isPastDate = moment(date).isBefore(moment(), 'day');
    
    let className = '';
    let style = {};
    
    if (isWeekend) {
      style = {
        ...style,
        backgroundColor: '#F9FAFB'
      };
      className += ' weekend-day';
    }
    
    if (isToday) {
      className += ' today-cell';
    }
    
    if (isPastDate) {
      className += ' past-date';
      style = {
        ...style,
        backgroundColor: '#F1F1F1',
        opacity: 0.7
      };
    }
    
    return {
      style,
      className: className.trim()
    };
  };
  
  // Custom toolbar with modern month navigation - more compact
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
  
  {/* Empty middle space to push filter to the right */}
  <div className="flex-grow"></div>
  
  {/* Machine filter - moved to right with padding */}
  <div className="relative pl-4">
    <div className="relative flex items-center">
      <Filter className="text-indigo-500 h-3 w-3 absolute left-2" />
      <select
        value={selectedMachine}
        onChange={(e) => setSelectedMachine(e.target.value)}
        className="pl-6 pr-6 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium min-w-[180px] appearance-none bg-white"
        aria-label="Select Machine"
      >
        <option value="all">All Machines</option>
        {machines
          .filter(machine => machine.id !== 'EVC Lab' && machine.Machine !== 'EVC Lab')
          .map(machine => (
            <option key={machine.id} value={machine.id} disabled={!machine.isAvailable}>
              {machine.Machine} {!machine.isAvailable ? '(Unavailable)' : ''}
            </option>
        ))}
      </select>
      <ChevronRight className="h-3 w-3 text-gray-500 transform rotate-90 absolute right-2 pointer-events-none" />
    </div>
  </div>
</div>
    );
  };

  // Custom event component without tooltip functionality
  const EventComponent = ({ event }: { event: any }) => {
    // Check for machine availability info
    let availabilityInfo = null;
    
    if (event.resource?.machine && !event.resource.isBlocked) {
      const machineId = event.resource.machine;
      const dateStr = event.start.toISOString().split('T')[0];
      
      if (machineAvailability[dateStr] && machineAvailability[dateStr][machineId] !== undefined) {
        const availableCount = machineAvailability[dateStr][machineId];
        
        // Find the total count for this machine
        const machine = machines.find(m => m.id === machineId);
        const totalCount = machine?.Number || 0;
        
        if (availableCount === 0) {
          availabilityInfo = (
            <span className="text-white text-xs bg-red-500 px-1 rounded-sm ml-1">
              FULL
            </span>
          );
        } else if (availableCount < totalCount) {
          availabilityInfo = (
            <span className="text-white text-xs bg-yellow-500 px-1 rounded-sm ml-1">
              {availableCount}/{totalCount}
            </span>
          );
        }
      }
    }
    
    return (
      <div className="event-content truncate px-1 py-0.5 flex items-center justify-between">
        <span>{event.title.replace(' (FULL)', '')}</span>
        {availabilityInfo}
      </div>
    );
  };

  // Debugs to help identify issues
  console.log('Calendar rendering with:', {
    machinesCount: machines?.length || 0,
    eventsCount: calendarEvents?.length || 0,
    reservationsCount: reservations?.length || 0,
    isLoading
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Info banner - More compact */}
      <div className="p-2 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-start gap-2">
          <Info className="text-indigo-500 h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700 leading-relaxed">
            This calendar shows machine availability. Reserved time slots are marked.
            Use the filter to view a specific machine. Past dates are grayed out.
          </p>
        </div>
      </div>

      {/* Legend - More compact */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#4F46E5] rounded-sm mr-1 shadow-sm"></div>
            <span className="text-xs text-gray-700">All Day</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#10B981] rounded-sm mr-1 shadow-sm"></div>
            <span className="text-xs text-gray-700">Morning (8AM-12PM)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#F59E0B] rounded-sm mr-1 shadow-sm"></div>
            <span className="text-xs text-gray-700">Afternoon (1PM-5PM)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#EF4444] rounded-sm mr-1 shadow-sm"></div>
            <span className="text-xs text-gray-700">Blocked Dates</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#F1F1F1] rounded-sm mr-1 shadow-sm border border-gray-200"></div>
            <span className="text-xs text-gray-700">Past Dates</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#9CA3AF] rounded-sm mr-1 shadow-sm"></div>
          <span className="text-xs text-gray-700">Fully Booked</span>
        </div>

      </div>
      
      {/* Calendar Section */}
      {isLoading ? (
        <div className="h-[450px] md:h-[550px] flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-2" />
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
      
      {/* Add custom styling for better calendar appearance */}
      <style jsx global>{`
        /* Calendar header styling - more compact */
        .rbc-header {
          padding: 6px 4px;
          font-weight: 600;
          font-size: 0.7rem;
          background-color: #F1F5F9;
          color: #475569;
          border-width: 1px;
          border-color: #E2E8F0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Calendar cell styling - more compact */
        .rbc-date-cell {
          padding: 4px 4px 0 0;
          font-size: 0.7rem;
          color: #64748B;
          font-weight: 500;
        }
        
        /* Remove the today cell special styling */
        .rbc-date-cell.rbc-now {
          font-weight: 700;
          color: #4F46E5;
        }
        
        /* Today indicator */
        .rbc-day-bg.rbc-today {
          background-color: rgba(224, 231, 255, 0.5);
        }
        
        /* Month view cell border styling */
        .rbc-month-view {
          border-width: 1px;
          border-style: solid;
          border-color: #E2E8F0;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: #FFFFFF;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          margin: 4px;
        }
        
        .rbc-month-row {
          border-width: 0;
          margin-bottom: 0;
          min-height: 0;
        }
        
        .rbc-day-bg {
          border-width: 0;
          margin: 1px;
          border-radius: 2px;
          background-color: #FAFBFC;
        }
        
        /* Event styling - more compact */
        .rbc-event {
          padding: 0 !important;
          border-radius: 2px !important;
          margin-bottom: 1px;
          transition: all 0.15s ease-in-out;
          font-size: 0.65rem !important;
        }
        
        .rbc-event:hover {
          transform: translateY(-1px);
        }
        
        /* Month row styling - more compact */
        .rbc-month-row {
          min-height: 65px;
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

        /* Popup styling - more compact */
        .rbc-overlay {
          z-index: 100;
          border-radius: 4px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border: 1px solid #E5E7EB;
          overflow: hidden;
          font-size: 0.75rem;
        }
        
        .rbc-overlay-header {
          padding: 6px 10px;
          background-color: #F1F5F9;
          border-bottom: 1px solid #E2E8F0;
          font-weight: 600;
          color: #334155;
          font-size: 0.75rem;
        }
        
        /* Animation for hover effects */
        .event-item {
          transition: all 0.2s ease-in-out;
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
        
        /* Compact rows*/
        .rbc-row {
          margin-bottom: 0;
        }
        
        /* Make all components more compact */
        .rbc-calendar, .rbc-month-view, .rbc-month-row {
          box-sizing: border-box !important;
        }
        
        /* Fix the row height to make a compact calendar */
        .rbc-row-segment {
          padding: 0 1px !important;
        }
        
        /* Adjust the toolbar size */
        .rbc-toolbar {
          font-size: 0.8rem !important;
          margin-bottom: 5px !important;
        }
        
        /* Adjust the time information display in events */
        .rbc-event-label {
          font-size: 0.65rem !important;
        }
        
        /* Fixed height for more deterministic sizing */
        .calendar-container {
          height: 500px !important;
        }
      `}</style>
    </div>
  );
};

export default MachineCalendar;