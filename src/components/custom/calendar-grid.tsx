import React from 'react';
import { Ban, CircleSlash2, Clock, Cpu, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface CalendarDate extends Date {}

interface Reservation {
  id: string;
  date: string;
  name: string;
  email: string;
  status: string;
  role: string;
  service: string;
  machines: string[]; // Array of machines
  totalAmount: number | null;
  type: 'utilization' | 'evc';
  startTime?: string;
  endTime?: string;
}

interface CalendarGridProps {
  days: (Date | null)[];
  isDateBlocked: (date: Date | null) => boolean;
  isDateInPast: (date: Date | null) => boolean;
  isToday: (date: Date | null) => boolean;
  getDateReservations: (date: Date | null) => any[];
  handleDateClick: (date: Date) => void;
  handleReservationClick: (reservation: any) => void;
  formatTime: (timeString?: string) => string;
  currentMonth: Date;
  nextMonth: () => void;
  previousMonth: () => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  isDateBlocked,
  isDateInPast,
  isToday,
  getDateReservations,
  handleDateClick,
  handleReservationClick,
  formatTime,
  currentMonth,
  nextMonth,
  previousMonth
}) => {
  const weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ongoing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending payment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'paid':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCardBgColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-50';
      case 'pending':
        return 'bg-yellow-50';
      case 'completed':
        return 'bg-blue-50';
      case 'pending payment':
        return 'bg-orange-50';
      default:
        return 'bg-white';
    }
  };

  const getReservationTypeIcon = (type: string): JSX.Element => {
    if (type === 'evc') {
      return <span className="text-blue-500 mr-1" title="Educational Visit/Consultation">👨‍🎓</span>;
    } else {
      return <span className="text-green-500 mr-1" title="Utilization">🏭</span>;
    }
  };

  // Format multiple machines for display in the calendar
  const formatMachines = (machines: string[]): string => {
    if (!machines || machines.length === 0) return "Not specified";
    
    if (machines.length === 1) return machines[0];
    
    // If we have 2 machines, show both with a separator
    if (machines.length === 2) return `${machines[0]} & ${machines[1]}`;
    
    // If we have more than 2 machines, show the first one + count
    return `${machines[0]} +${machines.length - 1}`;
  };

  return (
    <div className="calendar-container">
      {/* Calendar Header with Legend */}
      <div className="calendar-header p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            {new Intl.DateTimeFormat('en-US', {
              month: 'long',
              year: 'numeric'
            }).format(currentMonth)}
          </h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Status Legend */}
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
                <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-200"></span>
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-slate-100 border border-slate-300"></span>
                <span>Past</span>
              </div>
            </div>
            
            {/* Month Navigation */}
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

      {/* Calendar Body */}
      <div className="calendar-body p-2 md:p-4 bg-gray-50">
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weekDays.map(day => (
            <div key={day} className="calendar-day-name p-2 text-center font-medium text-sm text-blue-800">
              {day}
            </div>
          ))}
        
          {days.map((date, index) => {
            const dateReservations = date ? getDateReservations(date) : [];
            const isBlocked = isDateBlocked(date);
            const isPast = isDateInPast(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={`calendar-day relative p-1 md:p-2 rounded-md transition-all 
                  ${!date ? 'bg-transparent' : 'bg-white border border-gray-200'} 
                  ${isBlocked ? 'bg-red-50 border-red-200' : ''}
                  ${isPast ? 'bg-gray-50 border-gray-200 opacity-75' : ''}
                  ${isTodayDate ? 'ring-2 ring-blue-400 border-blue-400' : ''}
                  ${date && !isPast ? 'hover:shadow-md' : ''}`}
              >
                {date && (
                  <>
                    <div className="day-header flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium py-1 px-2 rounded-full 
                        ${isTodayDate ? 'bg-blue-500 text-white' : 'text-gray-700'} 
                        ${isPast ? 'text-gray-400' : ''}`}
                      >
                        {date.getDate()}
                      </span>
                      
                      {!isPast && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="block-button h-6 w-6 p-0"
                          onClick={() => handleDateClick(date)}
                        >
                          {isBlocked ?
                            <Ban className="h-4 w-4 text-red-500" /> :
                            <CircleSlash2 className="h-4 w-4 text-gray-400" />
                          }
                        </Button>
                      )}
                    </div>
                    
                    {isBlocked && (
                      <div className="calendar-event blocked px-3 py-2 rounded-md bg-red-50 border border-red-200">
                        <p className="text-xs font-medium text-red-600 flex items-center">
                          <Ban className="h-3 w-3 mr-1" /> Blocked
                        </p>
                      </div>
                    )}
                    
                    {dateReservations.length > 0 && (
                      <div className="calendar-reservations flex flex-col space-y-1 mt-1 overflow-y-auto">
                        {dateReservations.slice(0, 3).map((reservation) => (
                          <div 
                            key={reservation.id}
                            className={`calendar-event px-3 py-2 rounded-md border cursor-pointer transition-opacity hover:opacity-90 ${getCardBgColor(reservation.status)}`}
                            onClick={() => handleReservationClick(reservation)}
                          >
                            {/* Name with status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getReservationTypeIcon(reservation.type)}
                                <span className="text-sm font-medium">{reservation.name}</span>
                              </div>
                              <span className="text-xs font-medium ml-1">{reservation.status}</span>
                            </div>
                            
                            {/* Machines row */}
                            {reservation.machines && reservation.machines.length > 0 && (
                              <div className="text-xs flex items-start mt-1">
                                <Cpu className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                                <span className="truncate">
                                  {formatMachines(reservation.machines)}
                                </span>
                              </div>
                            )}
                            
                            {/* Time row */}
                            {reservation.startTime && (
                              <div className="text-xs flex items-start mt-1">
                                <Clock className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                                <span className="truncate">
                                  {formatTime(reservation.startTime)}
                                  {reservation.endTime && ` - ${formatTime(reservation.endTime)}`}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {dateReservations.length > 3 && (
                          <div 
                            className="calendar-event more p-1 rounded-md bg-gray-100 border border-gray-200 text-xs text-center text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              // Click the first hidden reservation
                              if (dateReservations.length > 3) {
                                handleReservationClick(dateReservations[3]);
                              }
                            }}
                          >
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
      </div>

      <style jsx>{`
        .calendar-container {
          width: 100%;
          max-width: 1500px; /* Increased width */
          margin: 0 auto;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          background-color: white;
        }
        .calendar-day {
          aspect-ratio: 1 / 1;
          min-height: 160px; /* Increased height */
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .calendar-reservations {
          flex: 1;
          max-height: 210px;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        .calendar-reservations::-webkit-scrollbar {
          width: 6px;
        }
        .calendar-reservations::-webkit-scrollbar-track {
          background: transparent;
        }
        .calendar-reservations::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .calendar-event {
          word-break: keep-all;
          overflow-wrap: break-word;
        }
        .day-header .block-button {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .calendar-day:hover .day-header .block-button {
          opacity: 1;
        }
        .calendar-body {
          display: grid;
          grid-auto-rows: 1fr;
        }
        /* For tablet and mobile views */
        @media (max-width: 768px) {
          .calendar-day {
            min-height: 120px;
            aspect-ratio: auto;
          }
          .day-header .block-button {
            opacity: 1;
          }
        }
        /* For mobile views - stacked layout */
        @media (max-width: 640px) {
          .calendar-body .grid {
            gap: 4px;
          }
          .calendar-day {
            min-height: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarGrid;