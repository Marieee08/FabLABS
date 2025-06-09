import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CalendarDate extends Date {}

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
}

interface BlockDateModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedDate: CalendarDate | null;
  isDateBlocked: (date: CalendarDate | null) => boolean;
  formatDate: (date: CalendarDate | null) => string;
  getDateReservations: (date: CalendarDate | null) => Reservation[];
  handleBlockDate: () => Promise<void>;
  handleUnblockDate: () => Promise<void>;
  isLoading: boolean;
}

const BlockDateModal: React.FC<BlockDateModalProps> = ({
  isOpen,
  setIsOpen,
  selectedDate,
  isDateBlocked,
  formatDate,
  getDateReservations,
  handleBlockDate,
  handleUnblockDate,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{formatDate(selectedDate)}</DialogTitle>
          <DialogDescription>
            {isDateBlocked(selectedDate) 
              ? 'Unblocking this date will allow new reservations to be made.'
              : 'Blocking this date will prevent new reservations from being made.'}
          </DialogDescription>
        </DialogHeader>
        
        {selectedDate && (
          <div className="py-2">
            {getDateReservations(selectedDate).length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                <p className="font-medium">Note: {getDateReservations(selectedDate).length} reservation(s) already exist on this date.</p>
                <p className="mt-1 text-xs">Blocking this date won&apos;t affect existing reservations.</p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={isDateBlocked(selectedDate) ? "destructive" : "default"}
            onClick={isDateBlocked(selectedDate) ? handleUnblockDate : handleBlockDate}
            disabled={isLoading}
            className={isDateBlocked(selectedDate) ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isLoading ? 'Processing...' : isDateBlocked(selectedDate) ? 'Unblock Date' : 'Block Date'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDateModal;