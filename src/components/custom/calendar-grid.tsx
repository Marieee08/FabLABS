import React from 'react';
import { Ban, CircleSlash2, Clock, Cpu } from 'lucide-react';
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
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  isDateBlocked,
  isDateInPast,
  isToday,
  getDateReservations,
  handleDateClick,
  handleReservationClick,
  formatTime
}) => {
  const weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getReservationStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getReservationStatusBadge = (status: string): JSX.Element => {
    let color = "";
    switch (status.toLowerCase()) {
      case 'approved':
        color = "bg-green-100 text-green-700 border-green-300";
        break;
      case 'pending':
        color = "bg-yellow-100 text-yellow-700 border-yellow-300";
        break;
      case 'rejected':
        color = "bg-red-100 text-red-700 border-red-300";
        break;
      case 'completed':
        color = "bg-blue-100 text-blue-700 border-blue-300";
        break;
      default:
        color = "bg-gray-100 text-gray-700 border-gray-300";
    }
    
    return (
      <Badge variant="outline" className={`font-medium ${color}`}>
        {status}
      </Badge>
    );
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
    if (machines.length === 2) return machines.join(" & ");
    
    // If we have more than 2 machines, show the first one + count
    return `${machines[0]} +${machines.length - 1}`;
  };

  return (
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="block-button h-7 w-7 p-0"
                              onClick={() => handleDateClick(date)}
                            >
                              {isBlocked ?
                                <Ban className="h-4 w-4 text-red-500" /> :
                                <CircleSlash2 className="h-4 w-4 text-gray-400" />
                              }
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isBlocked ? 'Unblock date' : 'Block date'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {isBlocked && (
                    <div className="calendar-event blocked p-2 rounded-md bg-red-50 border border-red-200">
                      <p className="text-xs font-medium text-red-600 flex items-center">
                        <Ban className="h-3 w-3 mr-1" /> Blocked
                      </p>
                    </div>
                  )}
                  
                  {dateReservations.length > 0 && (
                    <div className="calendar-reservations flex flex-col space-y-1 mt-1 max-h-28 overflow-y-auto">
                      {dateReservations.slice(0, 3).map((reservation) => (
                        <TooltipProvider key={reservation.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`calendar-event p-1.5 rounded-md border cursor-pointer transition-opacity hover:opacity-90
                                  ${getReservationStatusColor(reservation.status)}`}
                                onClick={() => handleReservationClick(reservation)}
                              >
                                {/* Name row with icon */}
                                <div className="flex items-center text-xs">
                                  {getReservationTypeIcon(reservation.type)}
                                  <span className="truncate font-medium">{reservation.name}</span>
                                </div>
                                
                                {/* Machines row - more compact display */}
                                {reservation.machines && reservation.machines.length > 0 && (
                                  <div className="text-xs flex items-start mt-0.5 opacity-90">
                                    <Cpu className="h-2.5 w-2.5 mr-0.5 flex-shrink-0 mt-0.5" />
                                    <span className="truncate leading-tight">
                                      {formatMachines(reservation.machines)}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Time row */}
                                {reservation.startTime && (
                                  <div className="text-xs flex items-start mt-0.5 opacity-90">
                                    <Clock className="h-2.5 w-2.5 mr-0.5 flex-shrink-0 mt-0.5" />
                                    <span className="truncate leading-tight">
                                      {formatTime(reservation.startTime)}
                                      {reservation.endTime && ` - ${formatTime(reservation.endTime)}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="text-sm">
                                <div className="font-bold">{reservation.name}</div>
                                <div className="text-gray-700">{reservation.service}</div>
                                
                                {/* List all machines in the tooltip */}
                                {reservation.machines && reservation.machines.length > 0 && (
                                  <div className="mt-1">
                                    <div className="flex items-center">
                                      <Cpu className="h-3 w-3 mr-1" />
                                      <span className="font-medium">Machines:</span>
                                    </div>
                                    <ul className="pl-5 list-disc text-xs mt-0.5">
                                      {reservation.machines.map((machine, i) => (
                                        <li key={i}>{machine}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 mt-1">
                                  <span>Status:</span>
                                  {getReservationStatusBadge(reservation.status)}
                                </div>
                                {reservation.startTime && (
                                  <div className="flex items-center mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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

      <style jsx>{`
        .calendar-day {
          aspect-ratio: 1 / 1;
          min-height: 120px;
          max-height: 180px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .calendar-reservations {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
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
            min-height: 100px;
            max-height: 150px;
            aspect-ratio: auto;
          }
          .day-header .block-button {
            opacity: 1;
          }
        }
        /* For mobile views - stacked layout */
        @media (max-width: 640px) {
          .calendar-body .grid {
            gap: 8px;
          }
          .calendar-day {
            min-height: 90px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarGrid;