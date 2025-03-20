// components/custom/CalendarPage.tsx

import React, { useState } from 'react';
import ReservationCalendar from '@/components/custom/ReservationCalendar';

export type MachineReservation = {
  id: string;
  machineId: string;
  machineName: string;
  startTime: Date;
  endTime: Date;
  status: string;
  userName: string;
  email: string;
  reservationType: 'utilization' | 'evc';
};

const CalendarPage: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [selectedReservation, setSelectedReservation] = useState<MachineReservation | null>(null);
  
  const handleReservationClick = (reservation: MachineReservation) => {
    setSelectedReservation(reservation);
  };
  
  const closeModal = () => {
    setSelectedReservation(null);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isAdmin ? 'All Machine Reservations' : 'My Machine Reservations'}
      </h1>
      
      <ReservationCalendar 
        userView={!isAdmin} 
        onReservationClick={handleReservationClick}
      />
      
      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Reservation Details</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Machine:</p>
                <p>{selectedReservation.machineName}</p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Time:</p>
                <p>
                  {new Date(selectedReservation.startTime).toLocaleString()} -<br />
                  {new Date(selectedReservation.endTime).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Reserved By:</p>
                <p>{selectedReservation.userName}</p>
                <p className="text-sm text-gray-600">{selectedReservation.email}</p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Reservation Type:</p>
                <p className={`inline-block px-2 py-1 rounded ${
                  selectedReservation.reservationType === 'evc' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedReservation.reservationType === 'evc' ? 'Educational Visit' : 'Machine Utilization'}
                </p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-semibold">Status:</p>
                <p className="text-green-600">Approved</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;