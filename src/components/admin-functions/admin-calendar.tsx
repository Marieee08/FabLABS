import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
  machines: string[]; // Array of machines instead of single machine
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchBlockedDates = useCallback(async () => {
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
  }, []);

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

  const fetchReservations = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reservations');
      const data = await response.json();
      
      const processedReservations = data.map((reservation: any) => {
        // Ensure machines is always an array
        const machines = Array.isArray(reservation.machines) 
          ? reservation.machines 
          : reservation.machine 
            ? [reservation.machine] 
            : ["Not specified"];
        
        // Check if reservation has timeSlots array
        if (reservation.timeSlots && reservation.timeSlots.length > 0) {
          const firstTimeSlot = reservation.timeSlots[0];
          return {
            ...reservation,
            startTime: firstTimeSlot.startTime ? formatTimeString(firstTimeSlot.startTime) : undefined,
            endTime: firstTimeSlot.endTime ? formatTimeString(firstTimeSlot.endTime) : undefined,
            // Keep the original UtilTimes for reference if needed
            UtilTimes: reservation.UtilTimes,
            // Ensure machines is properly set
            machines: machines
          };
        }
        // Fallback to existing logic for backward compatibility
        else if (reservation.startTime && reservation.endTime) {
          return {
            ...reservation,
            startTime: formatTimeString(reservation.startTime),
            endTime: formatTimeString(reservation.endTime),
            // Ensure machines is properly set
            machines: machines
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
            // Ensure machines is properly set
            machines: machines
          };
        }
        return {
          ...reservation,
          // Ensure machines is properly set
          machines: machines
        };
      });
      
      // Sort reservations by start time
      const sortedReservations = processedReservations.sort((a: { startTime: string; }, b: { startTime: any; }) => {
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
  }, []);

  // Add a refresh function that updates both blocked dates and reservations
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchBlockedDates(),
        fetchReservations()
      ]);
      
      toast({
        title: "Success",
        description: "Calendar data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh calendar data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBlockedDates, fetchReservations]);

  useEffect(() => {
  fetchBlockedDates();
  fetchReservations();
}, [fetchBlockedDates, fetchReservations]); 

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
      {/* Month Navigation Row with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={previousMonth} 
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth)}
          </h2>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextMonth} 
            className="ml-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Add Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Calendar'}
        </Button>
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
        currentMonth={currentMonth}
        nextMonth={nextMonth}
        previousMonth={previousMonth}
      />
      
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
    </div>
  );
};

export default AdminCalendar;