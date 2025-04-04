// components/custom/calendar-reservation.tsx

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

// Types definition
type Reservation = {
  id: number;
  machineId: string;
  machineName: string;
  startTime: Date;
  endTime: Date;
  status: string;
  userName: string;
};

type CalendarProps = {
  reservations: Reservation[];
  onReservationClick?: (reservation: Reservation) => void;
};

const MachineReservationCalendar: React.FC<CalendarProps> = ({ 
  reservations = [], 
  onReservationClick 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  
  // Filter only approved reservations
  useEffect(() => {
    setFilteredReservations(reservations.filter(res => res.status === 'Approved'));
  }, [reservations]);

  // Find reservations for a specific day
  const getReservationsForDay = (day: Date) => {
    return filteredReservations.filter(reservation => 
      isSameDay(parseISO(reservation.startTime.toString()), day)
    );
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(prevDate => {
      return new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
    });
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(prevDate => {
      return new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
    });
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Render the header with navigation and month/year
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            &lt;
          </button>
          <button 
            onClick={goToToday}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            &gt;
          </button>
        </div>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="w-24 flex justify-end">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-100 border-green-600 border rounded mr-1"></span>
            <span className="text-xs">Approved</span>
          </div>
        </div>
      </div>
    );
  };

  // Render the days of the week
  const renderDays = () => {
    const days = [];
    const date = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="font-semibold text-center p-2 bg-gray-50">
          {format(addDays(date, i), 'EEE')}
        </div>
      );
    }

    return <div className="grid grid-cols-7">{days}</div>;
  };

  // Group reservations by machine
  const groupReservationsByMachine = (reservations: Reservation[]) => {
    const grouped: Record<string, Reservation[]> = {};
    
    reservations.forEach(reservation => {
      if (!grouped[reservation.machineId]) {
        grouped[reservation.machineId] = [];
      }
      grouped[reservation.machineId].push(reservation);
    });
    
    return grouped;
  };

  // Render the calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayReservations = getReservationsForDay(cloneDay);
        const groupedReservations = groupReservationsByMachine(dayReservations);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-32 border p-2 ${
              isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'
            } ${isSameDay(day, selectedDate) ? 'bg-blue-50 border-blue-300' : ''}
            ${isToday ? 'border-blue-500 border-2' : ''}
            hover:bg-gray-50 cursor-pointer transition`}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className={`text-right ${isToday ? 'font-bold text-blue-600' : ''}`}>
              {format(day, 'd')}
            </div>
            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
              {Object.entries(groupedReservations).map(([machineId, reservations]) => {
                const firstReservation = reservations[0];
                return (
                  <div
                    key={machineId}
                    className="text-xs p-1 rounded bg-green-100 text-green-800 border-l-4 border-green-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReservationClick && onReservationClick(firstReservation);
                    }}
                  >
                    <div className="font-medium">{firstReservation.machineName}</div>
                    <div className="text-xs text-green-700">
                      {reservations.length > 1 ? 
                        `${reservations.length} bookings` : 
                        `${format(parseISO(firstReservation.startTime.toString()), 'HH:mm')} - 
                         ${format(parseISO(firstReservation.endTime.toString()), 'HH:mm')}`
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="mt-2">{rows}</div>;
  };

  // Render the selected day's details
  const renderSelectedDayDetails = () => {
    const dayReservations = getReservationsForDay(selectedDate);
    const groupedReservations = groupReservationsByMachine(dayReservations);
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">
          {format(selectedDate, 'MMMM d, yyyy')} - Machine Usage
        </h3>
        
        {Object.keys(groupedReservations).length === 0 ? (
          <p className="text-gray-500">No approved machine reservations for this day</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedReservations).map(([machineId, reservations]) => (
              <div key={machineId} className="bg-white rounded shadow p-3">
                <div className="font-medium text-lg text-blue-800">
                  {reservations[0].machineName}
                </div>
                
                <div className="mt-2 space-y-2">
                  {reservations.map((reservation) => (
                    <div 
                      key={reservation.id} 
                      className="flex justify-between items-center p-2 bg-green-50 rounded border-l-4 border-green-500 hover:bg-green-100 cursor-pointer transition"
                      onClick={() => onReservationClick && onReservationClick(reservation)}
                    >
                      <div>
                        <div className="text-sm text-gray-600">
                          {format(parseISO(reservation.startTime.toString()), 'HH:mm')} - 
                          {format(parseISO(reservation.endTime.toString()), 'HH:mm')}
                        </div>
                        <div className="text-xs mt-1">Reserved by: {reservation.userName}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Approved
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderSelectedDayDetails()}
    </div>
  );
};

export default MachineReservationCalendar;