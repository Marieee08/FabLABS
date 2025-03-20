import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import CalendarGrid from '@/components/custom/calendar-grid';
import BlockDateModal from '@/components/custom/block-date-modal';
import ReservationModal from '@/components/custom/reservation-modal';

interface CalendarDate extends Date {}

interface BlockedDate {
  id: string;
  date: string;
}

interface Reservation {
  id: string;
  date: string;
  name: string;
  email: string;
  status: string;
  role: string;
  service: string;
  machine?: string; // Add machine property
  totalAmount: number | null;
  type: 'utilization' | 'evc';
  startTime?: string;
  endTime?: string;
  UtilTimes?: Array<{StartTime: string, EndTime: string}>;
}

const AdminCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [blockedDates, setBlockedDates] = useState<CalendarDate[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [currentMonth, setCurrentMonth] = useState<CalendarDate>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch('/api/blocked-dates');
      const data = await response.json();
      const dates = data.map((item: BlockedDate) => {
        // Create date at noon to avoid timezone issues
        const date = new Date(item.date);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      });
      setBlockedDates(dates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch blocked dates",
        variant: "destructive",
      });
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/admin/reservations');
      const data = await response.json();
      
      const processedReservations = data.map((reservation: any) => {
        // Check if reservation has timeSlots array
        if (reservation.timeSlots && reservation.timeSlots.length > 0) {
          const firstTimeSlot = reservation.timeSlots[0];
          return {
            ...reservation,
            startTime: firstTimeSlot.startTime ? formatTimeString(firstTimeSlot.startTime) : undefined,
            endTime: firstTimeSlot.endTime ? formatTimeString(firstTimeSlot.endTime) : undefined,
            // Keep the original UtilTimes for reference if needed
            UtilTimes: reservation.UtilTimes,
            // Ensure we keep the machine information
            machine: reservation.machine || "No machine"
          };
        }
        // Fallback to existing logic for backward compatibility
        else if (reservation.startTime && reservation.endTime) {
          return {
            ...reservation,
            startTime: formatTimeString(reservation.startTime),
            endTime: formatTimeString(reservation.endTime),
            // Ensure we keep the machine information
            machine: reservation.machine || "No machine"
          };
        }
        // For UtilReq, use UtilTimes if available
        else if (reservation.type === 'utilization' && reservation.UtilTimes && reservation.UtilTimes.length > 0) {
          const startTime = reservation.UtilTimes[0].StartTime;
          const endTime = reservation.UtilTimes[0].EndTime;
          return {
            ...reservation,
            startTime: startTime ? formatTimeString(startTime) : undefined,
            endTime: endTime ? formatTimeString(endTime) : undefined,
            // Ensure we keep the machine information
            machine: reservation.machine || "No machine"
          };
        }
        return {
          ...reservation,
          machine: reservation.machine || "No machine"
        };
      });
      
      // Sort reservations by start time
      const sortedReservations = processedReservations.sort((a, b) => {
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });
      
      setReservations(sortedReservations);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reservations",
        variant: "destructive",
      });
    }
  };
  
  const formatTimeString = (timeString: string): string => {
    try {
      // Ensure we have a valid date string
      if (!timeString) return '';
      
      const date = new Date(timeString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', timeString);
        return timeString;
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString; // Return original if parsing fails
    }
  };

  useEffect(() => {
    fetchBlockedDates();
    fetchReservations();
  }, []);

  const handleBlockDate = async () => {
    if (!selectedDate || isDateBlocked(selectedDate)) return;
    
    setIsLoading(true);
    try {
      // Create a new date at noon to avoid timezone issues
      const dateToBlock = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12, 0, 0
      );

      const response = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: dateToBlock.toISOString().split('T')[0] // Send only the date part
        }),
      });

      if (!response.ok) throw new Error('Failed to block date');

      setBlockedDates([...blockedDates, dateToBlock]);
      toast({
        title: "Success",
        description: "Date blocked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block date",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleDateClick = (date: Date): void => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleReservationClick = (reservation: Reservation): void => {
    setSelectedReservation(reservation);
    setIsReservationModalOpen(true);
  };

  const handleUnblockDate = async () => {
    if (!selectedDate) return;
     
    setIsLoading(true);
    try {
      // Create a new date at noon to avoid timezone issues, similar to how we handle blocking
      const dateToUnblock = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12, 0, 0
      );
  
      const response = await fetch('/api/blocked-dates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: dateToUnblock.toISOString().split('T')[0] // Send only the date part, consistent with block function
        }),
      });
  
      if (!response.ok) throw new Error('Failed to unblock date');
  
      // Use the same date comparison logic as isDateBlocked function
      setBlockedDates(blockedDates.filter(date => !isSameDay(date, dateToUnblock)));
      
      toast({
        title: "Success",
        description: "Date unblocked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock date",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const isSameDay = (date1: CalendarDate | null, date2: CalendarDate): boolean => {
    if (!date1) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
 
  const isDateBlocked = (date: CalendarDate | null): boolean => {
    if (!date) return false;
    return blockedDates.some(blockedDate => isSameDay(blockedDate, date));
  };

  const isDateInPast = (date: CalendarDate | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isToday = (date: CalendarDate | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDateReservations = (date: CalendarDate | null): Reservation[] => {
    if (!date) return [];
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return isSameDay(reservationDate, date);
    });
  };

  const nextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const previousMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const formatDate = (date: CalendarDate | null): string => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
   
    const days: (Date | null)[] = [];
   
    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
   
    // Add dates for current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
   
    return days;
  };

  // Format time to 12-hour format
  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  return (
    <div className="calendar-container p-4">
      <div className="calendar rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden">
        <div className="calendar-header p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <Calendar className="h-5 w-5 text-blue-600" />
              {new Intl.DateTimeFormat('en-US', {
                month: 'long',
                year: 'numeric'
              }).format(currentMonth)}
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-300"></span>
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></span>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-50 border border-red-200"></span>
                  <span>Blocked</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-slate-100 border border-slate-300 relative overflow-hidden">
                    <span className="absolute inset-0" style={{ 
                      background: "linear-gradient(to bottom right, transparent 48%, #cbd5e1 49%, #cbd5e1 51%, transparent 52%)"
                    }}></span>
                  </span>
                  <span>Past</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={previousMonth}
                  className="rounded-l-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextMonth}
                  className="rounded-r-md border-l-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CalendarGrid 
          days={getDaysInMonth(currentMonth)}
          isDateBlocked={isDateBlocked}
          isDateInPast={isDateInPast}
          isToday={isToday}
          getDateReservations={getDateReservations}
          handleDateClick={handleDateClick}
          handleReservationClick={handleReservationClick}
          formatTime={formatTime}
        />
      </div>
      
      <BlockDateModal 
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        selectedDate={selectedDate}
        isDateBlocked={isDateBlocked}
        formatDate={formatDate}
        getDateReservations={getDateReservations}
        handleBlockDate={handleBlockDate}
        handleUnblockDate={handleUnblockDate}
        isLoading={isLoading}
      />
      
      <ReservationModal 
        isOpen={isReservationModalOpen}
        setIsOpen={setIsReservationModalOpen}
        reservation={selectedReservation}
        formatTime={formatTime}
      />
      
      <style jsx>{`
        .calendar-container {
          max-width: 1200px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default AdminCalendar;