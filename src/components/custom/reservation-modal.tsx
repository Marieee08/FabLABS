import React from 'react';
import { Clock, Cpu } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface ReservationModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  reservation: Reservation | null;
  formatTime: (timeString?: string) => string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  setIsOpen,
  reservation,
  formatTime
}) => {
  if (!reservation) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {reservation.type === 'evc' ? (
              <span className="text-blue-500">👨‍🎓</span>
            ) : (
              <span className="text-green-500">🏭</span>
            )}
            Reservation Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold">{reservation.name}</h3>
            {getReservationStatusBadge(reservation.status)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">Contact Details</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{reservation.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="font-medium capitalize">{reservation.role || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">Reservation Details</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="font-medium">{reservation.service}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium capitalize">{reservation.type}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Machines section */}
          {reservation.machines && reservation.machines.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                <Cpu className="h-4 w-4 mr-1" />
                Machines
              </h4>
              <div className="space-y-1">
                {reservation.machines.map((machine, index) => (
                  <div key={index} className="flex items-center p-1.5 bg-white rounded border border-gray-200">
                    <span className="font-medium">{machine}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-semibold text-gray-700 mb-2">Schedule</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{new Date(reservation.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-medium">
                  {reservation.startTime 
                    ? `${formatTime(reservation.startTime)} - ${formatTime(reservation.endTime)}`
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
          
          {reservation.totalAmount !== null && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">Payment</h4>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-medium text-lg">₱{reservation.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                // Navigate to reservation details page
                window.location.href = `/admin/reservations/${reservation.id}`;
              }}
            >
              View Full Details
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;