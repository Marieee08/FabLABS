import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileOutput, Clipboard, Wrench } from 'lucide-react';
// Import PDF generation functions
import { downloadJobPaymentPDF } from "@/components/admin-functions/job-payment-pdf";
import { downloadPDF } from "@/components/admin-functions/utilization-request-pdf";
import { downloadMachineUtilPDF } from "@/components/admin-functions/machine-utilization-pdf";

// Define interfaces locally based on the provided PDF functions
interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
}

interface JobPayment {
  id: number;
  invoiceNumber: string;
  dateIssued: string;
  datePaid?: string;
  dueDate: string;
  paymentStatus: string;
  items: ServiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  client: Client;
}

// Define the MachineUtilization interface
interface MachineUtilization {
  id: number;
  Machine: string;
  UtilizationDate: string;
  StartTime: string | null;
  EndTime: string | null;
  Duration: number | null;
  User: {
    Name: string;
    email: string;
    Role: string;
  };
  Status: string;
  Notes?: string;
}

// Define the basic structure needed for DetailedReservation
interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface UserTool {
  id: string;
  ToolUser: string;
  ToolQuantity: number;
}

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  TotalAmntDue: number | string | null;
  BulkofCommodity: string | null;
  UserServices: UserService[];
  UserTools: UserTool[];
  UtilTimes: UtilTime[];
  accInfo: {
    Name: string;
    email: string;
    Role: string;
    ClientInfo?: any;
    BusinessInfo?: any;
  };
}

interface PdfModalProps {
  isModalOpen: boolean;  // Changed from isOpen to isModalOpen to match other modals
  setIsModalOpen: (isOpen: boolean) => void;  // Changed from onClose to setIsModalOpen to match others
  reservation: any;
  reservationType: 'utilization' | 'evc' | null;
}

const PdfModal: React.FC<PdfModalProps> = ({ 
  isModalOpen, 
  setIsModalOpen, 
  reservation, 
  reservationType 
}) => {
  if (!reservation) return null;

  const handleGenerateJobPayment = () => {
    // Create a JobPayment object from the reservation data
    // This is a simplified example - you'll need to map your reservation data to the JobPayment interface
    const jobPaymentData: JobPayment = {
      id: reservation.id,
      invoiceNumber: `INV-${reservation.id}`,
      dateIssued: new Date().toISOString(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      paymentStatus: reservation.Status || 'Unpaid',
      items: reservation.UserServices?.map((service: any) => ({
        id: service.id,
        name: service.ServiceAvail,
        quantity: 1,
        unitPrice: service.CostsAvail || 0,
        totalPrice: service.CostsAvail || 0,
        description: service.EquipmentAvail
      })) || [],
      subtotal: reservation.TotalAmntDue || 0,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: reservation.TotalAmntDue || 0,
      amountPaid: reservation.Status === 'Paid' ? (reservation.TotalAmntDue || 0) : 0,
      balanceDue: reservation.Status === 'Paid' ? 0 : (reservation.TotalAmntDue || 0),
      client: {
        name: reservation.accInfo?.Name || '',
        email: reservation.accInfo?.email || '',
        phone: reservation.accInfo?.ClientInfo?.ContactNum || '',
        address: reservation.accInfo?.ClientInfo ? 
          `${reservation.accInfo.ClientInfo.Address}, ${reservation.accInfo.ClientInfo.City}, ${reservation.accInfo.ClientInfo.Province}` : '',
        role: reservation.accInfo?.Role || ''
      }
    };

    downloadJobPaymentPDF(jobPaymentData);
    setIsModalOpen(false);
  };

  const handleGenerateUtilizationRequest = () => {
    if (reservationType === 'utilization' && reservation) {
      // The reservation object should already be in the correct format for downloadPDF
      downloadPDF(reservation as DetailedReservation);
      setIsModalOpen(false);
    }
  };

  const handleGenerateMachineUtilization = () => {
    // Create a MachineUtilization object from the reservation data
    if (reservation.UserServices && reservation.UserServices.length > 0) {
      const service = reservation.UserServices[0];
      
      const machineUtilData: MachineUtilization = {
        id: reservation.id,
        Machine: service.EquipmentAvail || 'N/A',
        UtilizationDate: reservation.RequestDate || new Date().toISOString(),
        StartTime: reservation.UtilTimes && reservation.UtilTimes.length > 0 ? 
          reservation.UtilTimes[0].StartTime : null,
        EndTime: reservation.UtilTimes && reservation.UtilTimes.length > 0 ? 
          reservation.UtilTimes[0].EndTime : null,
        Duration: service.MinsAvail || null,
        User: {
          Name: reservation.accInfo?.Name || '',
          email: reservation.accInfo?.email || '',
          Role: reservation.accInfo?.Role || ''
        },
        Status: reservation.Status || 'Pending',
        Notes: ''
      };

      downloadMachineUtilPDF(machineUtilData);
      setIsModalOpen(false);
    }
  };

  // Currently just displaying a notification for the registration form
  // You would need to implement this functionality
  const handleGenerateRegistrationForm = () => {
    alert('Registration Form PDF generation not yet implemented');
    setIsModalOpen(false);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate PDF Document</DialogTitle>
          <DialogDescription>
            Select the type of document you want to generate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 text-center"
            onClick={handleGenerateJobPayment}
          >
            <FileText className="h-8 w-8 mb-2" />
            <span>Job and Payment Order</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 text-center"
            onClick={handleGenerateRegistrationForm}
          >
            <FileOutput className="h-8 w-8 mb-2" />
            <span>Registration Form</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 text-center"
            onClick={handleGenerateUtilizationRequest}
            disabled={reservationType !== 'utilization'}
          >
            <Clipboard className="h-8 w-8 mb-2" />
            <span>Utilization Request Form</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 text-center"
            onClick={handleGenerateMachineUtilization}
            disabled={!reservation.UserServices || reservation.UserServices.length === 0}
          >
            <Wrench className="h-8 w-8 mb-2" />
            <span>Machine Utilization Form</span>
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfModal;