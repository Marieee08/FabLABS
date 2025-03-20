import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Ban, CircleSlash2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      
      // In your fetchReservations function, modify the processing of reservations:
const processedReservations = data.map((reservation: any) => {
  // Check if reservation has timeSlots array
  if (reservation.timeSlots && reservation.timeSlots.length > 0) {
    const firstTimeSlot = reservation.timeSlots[0];
    return {
      ...reservation,
      startTime: firstTimeSlot.startTime ? formatTimeString(firstTimeSlot.startTime) : undefined,
      endTime: firstTimeSlot.endTime ? formatTimeString(firstTimeSlot.endTime) : undefined,
      // Keep the original UtilTimes for reference if needed
      UtilTimes: reservation.UtilTimes
    };
  }
  // Fallback to existing logic for backward compatibility
  else if (reservation.startTime && reservation.endTime) {
    return {
      ...reservation,
      startTime: formatTimeString(reservation.startTime),
      endTime: formatTimeString(reservation.endTime)
    };
  }
  // For UtilReq, use UtilTimes if available
  else if (reservation.type === 'utilization' && reservation.UtilTimes && reservation.UtilTimes.length > 0) {
    const startTime = reservation.UtilTimes[0].StartTime;
    const endTime = reservation.UtilTimes[0].EndTime;
    return {
      ...reservation,
      startTime: startTime ? formatTimeString(startTime) : undefined,
      endTime: endTime ? formatTimeString(endTime) : undefined
    };
  }
  return reservation;
});
      
      // Sort reservations by start time
      const sortedReservations = processedReservations.sort((a, b) => {
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });
      
      console.log('Processed reservations:', sortedReservations);
      setReservations(sortedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
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

  const getReservationStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getReservationTypeIcon = (type: string): JSX.Element => {
    if (type === 'evc') {
      return <span className="text-blue-500">👨‍🎓</span>;
    } else {
      return <span className="text-green-500">🏭</span>;
    }
  };

  // Format time to 12-hour format
  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="calendar shadow-lg">
      <div className="calendar-header">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
          }).format(currentMonth)}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 bg-green-100 rounded-full"></span>
            <span>Approved</span>
            <span className="inline-block w-3 h-3 bg-yellow-100 rounded-full ml-2"></span>
            <span>Pending</span>
            <span className="inline-block w-3 h-3 bg-red-50 rounded-full ml-2"></span>
            <span>Blocked</span>
          </div>
          <div>
            <button onClick={previousMonth}>&lt;</button>
            <button onClick={nextMonth}>&gt;</button>
          </div>
        </div>
      </div>

      <div className="calendar-body">
        {weekDays.map(day => (
          <div key={day} className="calendar-day-name text-[#143370]">
            {day}
          </div>
        ))}
       
        {days.map((date, index) => {
          const dateReservations = date ? getDateReservations(date) : [];
          const approvedReservations = dateReservations.filter(r => r.status.toLowerCase() === 'approved');
          
          return (
            <div
              key={index}
              className={`calendar-day ${!date ? 'empty' : ''} 
              ${isDateBlocked(date) ? 'bg-red-50' : ''}
              ${isDateInPast(date) ? 'past-date' : ''}`}
            >
              {date && (
                <>
                  <div className="day-header">
                    <span>{date.getDate()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="block-button"
                      onClick={() => handleDateClick(date)}
                    >
                      {isDateBlocked(date) ?
                        <Ban className="h-4 w-4 text-red-500" /> :
                        <CircleSlash2 className="h-4 w-4 text-gray-500" />
                      }
                    </Button>
                  </div>
                  {isDateBlocked(date) && (
                    <div className="calendar-event blocked">
                      <p className="text-red-600">Blocked</p>
                    </div>
                  )}
                  
                  {dateReservations.length > 0 && (
                    <div className="calendar-reservations">
                      {dateReservations.slice(0, 3).map((reservation, idx) => (
                        <TooltipProvider key={reservation.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`calendar-event reservation ${getReservationStatusColor(reservation.status)}`}
                                onClick={() => handleReservationClick(reservation)}
                              >
                                <div className="flex items-center gap-1">
                                  {getReservationTypeIcon(reservation.type)}
                                  <span className="truncate font-medium">{reservation.name}</span>
                                </div>
                                {reservation.startTime && (
                                  <div className="text-xs flex items-center mt-1 font-medium">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTime(reservation.startTime)} 
                                    {reservation.endTime && ` - ${formatTime(reservation.endTime)}`}
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>
                                <p><strong>{reservation.name}</strong></p>
                                <p>{reservation.service}</p>
                                <p>Status: {reservation.status}</p>
                                {reservation.startTime && (
                                  <p>Time: {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      
                      {dateReservations.length > 3 && (
                        <div className="calendar-event more">
                          + {dateReservations.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Block/Unblock Date Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formatDate(selectedDate)}</DialogTitle>
            <DialogDescription>
              Would you like to {isDateBlocked(selectedDate) ? 'unblock' : 'block'} this date?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isDateBlocked(selectedDate) ? "destructive" : "default"}
              onClick={isDateBlocked(selectedDate) ? handleUnblockDate : handleBlockDate}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isDateBlocked(selectedDate) ? 'Unblock Date' : 'Block Date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reservation Details Modal */}
      <Dialog open={isReservationModalOpen} onOpenChange={setIsReservationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Name:</div>
                <div>{selectedReservation.name}</div>
                
                <div className="font-semibold">Email:</div>
                <div>{selectedReservation.email}</div>
                
                <div className="font-semibold">Service:</div>
                <div>{selectedReservation.service}</div>
                
                <div className="font-semibold">Type:</div>
                <div className="capitalize">{selectedReservation.type}</div>
                
                <div className="font-semibold">Status:</div>
                <div className={`px-2 py-0.5 rounded text-xs inline-block ${getReservationStatusColor(selectedReservation.status)}`}>
                  {selectedReservation.status}
                </div>
                
                <div className="font-semibold">Date:</div>
                <div>{new Date(selectedReservation.date).toLocaleDateString()}</div>
                
                <div className="font-semibold">Time:</div>
                <div>
                  {selectedReservation.startTime 
                    ? `${formatTime(selectedReservation.startTime)} - ${formatTime(selectedReservation.endTime)}`
                    : 'Not specified'}
                </div>
                
                {selectedReservation.totalAmount !== null && (
                  <>
                    <div className="font-semibold">Amount:</div>
                    <div>₱{selectedReservation.totalAmount.toFixed(2)}</div>
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReservationModalOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to reservation details page
                    window.location.href = `/admin/reservations/${selectedReservation.id}`;
                  }}
                >
                  View Full Details
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <style jsx>{`
        .calendar {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          background-color: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background-color: white;
          color: black;
        }
        .calendar-header button {
          background: none;
          border: none;
          font-size: 24px;
          color: black;
          cursor: pointer;
          padding-left: 10px;
          padding-right: 10px;
          transition: transform 0.2s;
        }
        .calendar-header button:hover {
          transform: scale(1.1);
        }
        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
          padding: 20px;
        }
        .calendar-day-name {
          text-align: center;
          font-weight: bold;
          color: black;
          padding: 10px;
        }
        .calendar-day {
          background-color: white;
          border-radius: 5px;
          padding: 10px;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow-y: auto;
        }
        .calendar-day:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .calendar-day.empty {
          background-color: transparent;
        }
        .calendar-day.past-date {
          background-color: #f3f4f6;
          color: #9ca3af;
          border: 1px dashed #d1d5db;
        }
        .calendar-day.past-date .calendar-event {
          opacity: 0.7;
        }
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .day-header span {
          font-weight: bold;
        }
        .block-button {
          padding: 2px !important;
          height: auto !important;
          min-width: 0 !important;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .calendar-day:hover .block-button {
          opacity: 1;
        }
        .calendar-reservations {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
        }
        .calendar-event {
          border-radius: 4px;
          padding: 4px 6px;
          font-size: 12px;
          margin-top: 2px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .calendar-event:hover {
          opacity: 0.9;
        }
        .calendar-event.blocked {
          background-color: rgba(254, 202, 202, 0.5);
          color: #b91c1c;
          font-weight: 500;
          cursor: default;
        }
        .calendar-event.more {
          background-color: #e2e8f0;
          color: #475569;
          text-align: center;
          font-style: italic;
        }
        .calendar-event .time-display {
          margin-top: 2px;
          display: flex;
          align-items: center;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .calendar-body {
            grid-template-columns: repeat(1, 1fr);
          }
          .calendar-day-name {
            display: none;
          }
          .calendar-day {
            min-height: auto;
          }
          .block-button {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminCalendar;