import React, { useState, useEffect } from 'react';
import { Calendar, MoreHorizontal as MoreHorizontalIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ReviewReservation from '@/components/admin/review-reservation';
import ReviewEVCReservation from '@/components/admin/review-evcreservation';
import { FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { downloadPDF } from "@/components/admin-functions/pdf/utilization-request-pdf";
import { downloadJobPaymentPDF } from "@/components/admin-functions/pdf/job-payment-pdf";
import { downloadRegistrationFormPDF } from "@/components/admin-functions/pdf/registration-form-pdf";
import { downloadLabRequestFormPDF } from "@/components/admin-functions/pdf/lab-request-form-pdf";
import { downloadLabReservationFormPDF } from "@/components/admin-functions/pdf/lab-reservation-form-pdf";

interface UserService {
  MachineNo: number;
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
  ActualStart: string | null; // Remove undefined, only allow string | null
  ActualEnd: string | null;   // Remove undefined, only allow string | null
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
    ClientInfo?: {
      ContactNum: string;
      Address: string;
      City: string;
      Province: string;
      Zipcode: number;
    };
    BusinessInfo?: {
      CompanyName: string;
      BusinessOwner: string;
      BusinessPermitNum: string;
      TINNum: string;
      CompanyIDNum: string;
      CompanyEmail: string;
      ContactPerson: string;
      Designation: string;
      CompanyAddress: string;
      CompanyCity: string;
      CompanyProvince: string;
      CompanyZipcode: number;
      CompanyPhoneNum: string;
      CompanyMobileNum: string;
      Manufactured: string;
      ProductionFrequency: string;
      Bulk: string;
    };
  };
}

type Reservation = {
  id: string;
  date: string;
  name: string;
  email: string;
  status: string;
  role: string;
  service: string;
  totalAmount: number | null | undefined;
  type?: 'utilization' | 'evc';
};

interface DetailedEVCReservation {
  id: number;
  ControlNo: number | null;
  EVCStatus: string;
  LvlSec: string | null;
  NoofStudents: number | null;
  Subject: string | null;
  Teacher: string | null;
  TeacherEmail: string | null;
  Topic: string | null;
  DateRequested: string | null;
  ApprovedBy: string | null;
  SchoolYear: number | null;
  ReceivedBy: string | null;
  ReceivedDate: string | null;
  InspectedBy: string | null;
  InspectedDate: string | null;
  EVCStudents: any[];
  NeededMaterials: any[];
  UtilTimes: UtilTime[];
  accInfo: {
    Name: string;
    email: string;
    Role: string;
  };
}

interface MaterialItem {
  quantity: string;
  item: string;
  description: string;
  issuedCondition: string;
  returnedCondition: string;
  machineName?: string;    // Add machine name field
  machineQuantity?: string; // Add machine quantity field
}


interface StudentInfo {
  name: string;
}


interface LabRequestFormData {
  campus: string;
  controlNo: string;
  schoolYear: string;
  gradeLevel: string;
  numberOfStudents: string;
  subject: string;
  concurrentTopic: string;
  unit: string;
  teacherInCharge: string;
  venue: string;
  inclusiveTimeOfUse: string;
  date: string;
  materials: MaterialItem[];
  receivedBy: string;
  receivedAndInspectedBy: string;
  receivedDate: string;
  inspectedDate: string;
  requestedBy: string;
  dateRequested: string;
  students: StudentInfo[];
  endorsedBy: string;
  approvedBy: string;
  preferredLabRoom: string; // Make this required, not optional
}

// Add a separate interface for Lab Reservation if it's different
interface LabReservationFormData {
  campus: string;
  controlNo: string;
  schoolYear: string;
  gradeLevel: string;
  numberOfStudents: string;
  subject: string;
  concurrentTopic: string;
  unit: string;
  teacherInCharge: string;
  venue: string;
  inclusiveTimeOfUse: string;
  date: string;
  materials: MaterialItem[];
  receivedBy: string;
  receivedAndInspectedBy: string;
  receivedDate: string;
  inspectedDate: string;
  requestedBy: string;
  dateRequested: string;
  students: StudentInfo[];
  endorsedBy: string;
  approvedBy: string;
  preferredLabRoom: string; // Required field
}

const ReservationHistory = () => {
  // State definitions
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [isCustomSelectOpen, setIsCustomSelectOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEVCModalOpen, setIsEVCModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<DetailedReservation | null>(null);
  const [selectedEVCReservation, setSelectedEVCReservation] = useState<DetailedEVCReservation | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [needsScrollFix, setNeedsScrollFix] = useState(false);
 
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
 
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Effect to fix body scroll when modal closes
  useEffect(() => {
    if (needsScrollFix) {
      document.body.style.overflow = '';
      document.body.style.overflowY = 'auto';
      document.body.style.position = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      
      document.body.removeAttribute('inert');
      document.body.removeAttribute('aria-hidden');
      
      const overlays = document.querySelectorAll('[role="presentation"]');
      overlays.forEach(node => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
      
      setNeedsScrollFix(false);
    }
  }, [needsScrollFix]);

  // Fetch reservations and consolidate services with the same name
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/admin/reservations');
        if (!response.ok) {
          throw new Error(`Failed to fetch reservations: ${response.status} ${response.statusText}`);
        }
        
        let data = await response.json();
        
        // Process the data to consolidate duplicate services
        const processedData = data.map((reservation: Reservation) => {
          // If the service contains multiple instances of the same service name separated by commas,
          // we'll extract unique service names and join them again
          if (reservation.service && reservation.service.includes(',')) {
            const serviceNames = reservation.service.split(',').map(s => s.trim());
            const uniqueServiceNames = Array.from(new Set(serviceNames));
            reservation.service = uniqueServiceNames.join(', ');
          }
          
          return reservation;
        });
        
        setReservations(processedData);
      } catch (error: any) {
        console.error('Error fetching reservations:', error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchReservations();
  }, []);

  // Helper functions
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending admin approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending teacher approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-purple-100 text-purple-800';
      case 'pending payment':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-indigo-100 text-indigo-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDateSelect = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDate(`${year}-${month + 1}`);
    setIsCustomSelectOpen(false);
  };

  const handleReviewClick = async (reservation: Reservation) => {
    try {
      console.log("Review clicked for reservation:", reservation);
      
      if (reservation.type === 'evc') {
        const evcId = reservation.id.replace('evc-', '');
        console.log(`Fetching EVC reservation with ID: ${evcId}`);
        
        const response = await fetch(`/api/admin/evc-reservation-review/${evcId}`);
        console.log("EVC API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("EVC API error response:", errorText);
          throw new Error(`Failed to fetch EVC details: ${response.status} ${response.statusText}`);
        }
        
        const detailedData = await response.json();
        console.log("EVC detailed data:", detailedData);
        
        setSelectedEVCReservation(detailedData);
        setIsEVCModalOpen(true);
      } else {
        console.log(`Fetching utilization reservation with ID: ${reservation.id}`);
        
        const response = await fetch(`/api/admin/reservation-review/${reservation.id}`);
        console.log("Utilization API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Utilization API error response:", errorText);
          throw new Error(`Failed to fetch details: ${response.status} ${response.statusText}`);
        }
        
        const detailedData = await response.json();
        console.log("Original UserServices from API:", JSON.parse(JSON.stringify(detailedData.UserServices)));
        console.log("Number of UserServices before processing:", detailedData.UserServices.length);
        
        // IMPORTANT: REMOVING THE DEDUPLICATION CODE
        // Do not include the serviceMap code here
        
        console.log("Final UserServices being set:", JSON.parse(JSON.stringify(detailedData.UserServices)));
        console.log("Number of UserServices after processing:", detailedData.UserServices.length);
        
        setSelectedReservation(detailedData);
        setIsModalOpen(true);
      }
    } catch (error: any) {
      console.error('Error fetching reservation details:', error instanceof Error ? error.message : String(error));
      alert(`Error fetching details: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Function to open the PDF generation modal
  const handleGeneratePdfClick = (reservation: Reservation) => {
    setSelectedReservationId(null);
    setTimeout(() => {
      setSelectedReservationId(reservation.id);
      setIsPdfModalOpen(true);
    }, 10);
  };

  // Rest of your code remains mostly the same
  // Displaying the function signatures for reference
  const handleGeneratePDF = async (
    reservationId: string,
    formType: string
  ): Promise<void> => {
    try {
      // First check if this is an EVC reservation (if the ID starts with "evc-")
      const isEVC = reservationId.toString().startsWith('evc-');
      let detailedData: any;
     
      if (isEVC) {
        // Extract the actual ID for EVC reservations
        const evcId = reservationId.replace('evc-', '');
        const response = await fetch(`/api/admin/evc-reservation-review/${evcId}`);
       
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch EVC details: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to fetch EVC details: ${response.status} ${response.statusText}`);
        }
       
        detailedData = await response.json();
        console.log('EVC Reservation details for PDF generation:', detailedData);
       
        if (formType === 'lab-request' || formType === 'lab-reservation') {
          // Format the needed materials into the required format
          const materialItems = Array.isArray(detailedData.NeededMaterials)
            ? detailedData.NeededMaterials.map((material: any) => ({
                quantity: material.ItemQty?.toString() || '',
                item: material.Item || '',
                description: material.Description || '',
                issuedCondition: material.Issued || '',
                returnedCondition: material.Returned || '',
                machineName: material.Item || '', // Use Item as machine name
                machineQuantity: material.ItemQty?.toString() || '' // Use ItemQty as machine quantity
              }))
            : [];
        
        // Format student list - handle both Students and StudentName properties
        const studentList = Array.isArray(detailedData.EVCStudents)
          ? detailedData.EVCStudents.map((student: any) => {
              // Try all possible property names for student name
              const studentName = student.Students || student.StudentName || student.Name || student.name;
              return {
                name: studentName || ''
              };
            })
          : [];
        
        console.log('Student list for PDF:', studentList); // Debug log
        
        // Format time from UtilTimes if available
        let inclusiveTime = '';
        if (Array.isArray(detailedData.UtilTimes) && detailedData.UtilTimes.length > 0) {
          const firstTime = detailedData.UtilTimes[0];
          if (firstTime.StartTime && firstTime.EndTime) {
            const startTime = new Date(firstTime.StartTime);
            const endTime = new Date(firstTime.EndTime);
            inclusiveTime = `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
          }
        }
        
        // Create lab request form data with preferredLabRoom
        const labFormData: LabRequestFormData = {
          campus: 'Eastern Visayas Campus',
          controlNo: detailedData.ControlNo?.toString() || '',
          schoolYear: detailedData.SchoolYear?.toString() || new Date().getFullYear().toString(),
          gradeLevel: detailedData.LvlSec || '',
          numberOfStudents: detailedData.NoofStudents?.toString() || '',
          subject: detailedData.Subject || '',
          concurrentTopic: detailedData.Topic || '',
          unit: '',
          teacherInCharge: detailedData.Teacher || '',
          venue: '',
          inclusiveTimeOfUse: inclusiveTime,
          date: detailedData.DateRequested ? new Date(detailedData.DateRequested).toLocaleDateString() : '',
          materials: materialItems,
          receivedBy: detailedData.ReceivedBy || '',
          receivedAndInspectedBy: detailedData.InspectedBy || '',
          receivedDate: detailedData.ReceivedDate ? new Date(detailedData.ReceivedDate).toLocaleDateString() : '',
          inspectedDate: detailedData.InspectedDate ? new Date(detailedData.InspectedDate).toLocaleDateString() : '',
          requestedBy: detailedData.accInfo?.Name || '',
          dateRequested: detailedData.DateRequested ? new Date(detailedData.DateRequested).toLocaleDateString() : '',
          students: studentList, // Use the properly formatted student list
          endorsedBy: detailedData.Teacher || '',
          approvedBy: detailedData.ApprovedBy || '',
          preferredLabRoom: 'Fabrication Laboratory' // Required field with default value
        };

        // For lab reservation, create the proper type
        const labReservationFormData: LabReservationFormData = {
          campus: 'Eastern Visayas Campus',
          controlNo: detailedData.ControlNo?.toString() || '',
          schoolYear: detailedData.SchoolYear?.toString() || new Date().getFullYear().toString(),
          gradeLevel: detailedData.LvlSec || '',
          numberOfStudents: detailedData.NoofStudents?.toString() || '',
          subject: detailedData.Subject || '',
          concurrentTopic: detailedData.Topic || '',
          unit: '',
          teacherInCharge: detailedData.Teacher || '',
          venue: '',
          inclusiveTimeOfUse: inclusiveTime,
          date: detailedData.DateRequested ? new Date(detailedData.DateRequested).toLocaleDateString() : '',
          materials: materialItems,
          receivedBy: detailedData.ReceivedBy || '',
          receivedAndInspectedBy: detailedData.InspectedBy || '',
          receivedDate: detailedData.ReceivedDate ? new Date(detailedData.ReceivedDate).toLocaleDateString() : '',
          inspectedDate: detailedData.InspectedDate ? new Date(detailedData.InspectedDate).toLocaleDateString() : '',
          requestedBy: detailedData.accInfo?.Name || '',
          dateRequested: detailedData.DateRequested ? new Date(detailedData.DateRequested).toLocaleDateString() : '',
          students: studentList,
          endorsedBy: detailedData.Teacher || '',
          approvedBy: detailedData.ApprovedBy || '',
          preferredLabRoom: 'Fabrication Laboratory' // Required field with default value
        };
        
        try {
          if (formType === 'lab-request') {
            console.log('Generating lab request PDF with data:', labFormData);
            downloadLabRequestFormPDF(labFormData);
          } else if (formType === 'lab-reservation') {
            console.log('Generating lab reservation PDF with data:', labReservationFormData);
            downloadLabReservationFormPDF(labReservationFormData);
          }
        } catch (error) {
          console.error(`Error in ${formType} PDF generation:`, error);
          alert(`Error generating ${formType} PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      
        // After generating, close modal and trigger scroll fix
        setIsPdfModalOpen(false);
        setSelectedReservationId(null);
        setNeedsScrollFix(true);
        return;
      } else {
          // For other form types with EVC data, show not implemented message
          alert(`${formType} PDF generation for EVC reservations is not yet implemented`);
          setIsPdfModalOpen(false);
          setSelectedReservationId(null);
          setNeedsScrollFix(true);
          return;
        }
      } else {
        // It's a regular utilization reservation
        const response = await fetch(`/api/admin/reservation-review/${reservationId}`);
       
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch utilization details: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to fetch details: ${response.status} ${response.statusText}`);
        }
       
        detailedData = await response.json();
        console.log('Reservation details for PDF generation:', detailedData);
        
       
        // Ensure detailedData has all required properties with defaults
        detailedData = {
          ...detailedData,
          id: detailedData.id || 0,
          Status: detailedData.Status || 'Pending Admin Approval',
          RequestDate: detailedData.RequestDate || new Date().toISOString(),
          TotalAmntDue: detailedData.TotalAmntDue || 0,
          BulkofCommodity: detailedData.BulkofCommodity || '',
          UserServices: detailedData.UserServices || [],
          UserTools: detailedData.UserTools || [],
          UtilTimes: (detailedData.UtilTimes || []).map((time: any) => ({
            ...time,
            ActualStart: time.ActualStart || null,
            ActualEnd: time.ActualEnd || null
          })),
          accInfo: {
            Name: detailedData.accInfo?.Name || 'Name Not Available',
            email: detailedData.accInfo?.email || 'Email Not Available',
            Role: detailedData.accInfo?.Role || 'Role Not Specified',
            ClientInfo: detailedData.accInfo?.ClientInfo || {},
            BusinessInfo: detailedData.accInfo?.BusinessInfo || {}
          }
        };
      }
  
      switch (formType) {
        case 'utilization-request':
          try {
            // Add detailed logging to diagnose the issue
            console.log('BEFORE GENERATING PDF - Full data object:', detailedData);
            console.log('BEFORE GENERATING PDF - accInfo available:', detailedData.accInfo);
            console.log('BEFORE GENERATING PDF - Type of data:', typeof detailedData);
            console.log('BEFORE GENERATING PDF - Keys in data:', Object.keys(detailedData));
           
            console.log('Generating utilization request PDF with data:', {
              id: detailedData.id,
              status: detailedData.Status,
              role: detailedData.accInfo?.Role
            });
           
            downloadPDF(detailedData);
          } catch (error) {
            console.error('Error in utilization request PDF generation:', error);
            alert(`Error generating utilization request: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
         
        case 'job-payment':
          try {
            // Create job payment data from reservation details
            const jobPaymentData = {
              id: detailedData.id || 0,
              orderNumber: `ORD-${detailedData.id || '0'}`, // Add this missing field
              invoiceNumber: `INV-${detailedData.id || '0'}`,
              dateIssued: new Date().toISOString(),
              dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
              paymentStatus: detailedData.Status || 'Unpaid',
              items: detailedData.UserServices?.map((service: any) => ({
                id: service.id || 'item-' + Math.random().toString(36).substr(2, 9),
                name: service.ServiceAvail || 'Service',
                quantity: 1,
                unitPrice: service.CostsAvail || 0,
                totalPrice: service.CostsAvail || 0,
                description: service.EquipmentAvail || 'Equipment'
              })) || [],
              subtotal: detailedData.TotalAmntDue || 0,
              taxRate: 0,
              taxAmount: 0,
              totalAmount: detailedData.TotalAmntDue || 0,
              amountPaid: detailedData.Status === 'Paid' ? (detailedData.TotalAmntDue || 0) : 0,
              balanceDue: detailedData.Status === 'Paid' ? 0 : (detailedData.TotalAmntDue || 0),
              client: {
                name: detailedData.accInfo?.Name || 'Name Not Available',
                email: detailedData.accInfo?.email || 'Email Not Available',
                phone: detailedData.accInfo?.ClientInfo?.ContactNum || 'Phone Not Available',
                address: detailedData.accInfo?.ClientInfo
                  ? `${detailedData.accInfo.ClientInfo.Address || ''}, ${detailedData.accInfo.ClientInfo.City || ''}, ${detailedData.accInfo.ClientInfo.Province || ''}`
                  : 'Address Not Available',
                role: detailedData.accInfo?.Role || 'Role Not Specified'
              }
            };
           
            downloadJobPaymentPDF(jobPaymentData);
          } catch (error) {
            console.error('Error in job payment PDF generation:', error);
            alert(`Error generating job payment PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
         
        case 'registration':
          try {
            // Create registration form data from reservation details
            if (!detailedData.accInfo?.BusinessInfo) {
              alert('Cannot generate registration form: No business information available');
              break;
            }
           
            const businessInfo = detailedData.accInfo.BusinessInfo;
           
            // Create client info list - at least add the current user
            const clientInfoList = [{
              Name: detailedData.accInfo.Name || '',
              CompanyIDNo: businessInfo.CompanyIDNum || '',
              TINNo: businessInfo.TINNum || '',
              ContactNo: detailedData.accInfo.ClientInfo?.ContactNum || '',
              Address: detailedData.accInfo.ClientInfo?.Address || '',
              City: detailedData.accInfo.ClientInfo?.City || '',
              Province: detailedData.accInfo.ClientInfo?.Province || '',
              ZipCode: detailedData.accInfo.ClientInfo?.Zipcode?.toString() || ''
            }];
           
            const registrationData = {
              businessInfo: {
                CompanyName: businessInfo.CompanyName || '',
                BusinessOwner: businessInfo.BusinessOwner || '',
                BusinessPermitNo: businessInfo.BusinessPermitNum || '',
                TINNo: businessInfo.TINNum || '',
                Email: businessInfo.CompanyEmail || '',
                ContactPerson: businessInfo.ContactPerson || '',
                PositionDesignation: businessInfo.Designation || '',
                CompanyAddress: businessInfo.CompanyAddress || '',
                City: businessInfo.CompanyCity || '',
                Province: businessInfo.CompanyProvince || '',
                ZipCode: businessInfo.CompanyZipcode?.toString() || '',
                PhoneNo: businessInfo.CompanyPhoneNum || '',
                MobileNo: businessInfo.CompanyMobileNum || '',
                CommodityManufactured: businessInfo.Manufactured || '',
                ProductionFrequency: businessInfo.ProductionFrequency || '',
                BulkOfCommodity: businessInfo.Bulk || detailedData.BulkofCommodity || ''
              },
              clientInfoList: clientInfoList,
              numberOfClients: 1 // Default to 1 for now
            };
           
            console.log('Registration form data before PDF generation:', registrationData);
            downloadRegistrationFormPDF(registrationData);
          } catch (error) {
            console.error('Error in registration form PDF generation:', error);
            alert(`Error generating registration form: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
         
          // Updated section of handleGeneratePDF function specifically for lab-request form handling
          case 'lab-request':
            // For normal utilization reservations, create a properly formatted lab request form
            try {
              // Format time from UtilTimes if available
              let inclusiveTime = '';
              if (Array.isArray(detailedData.UtilTimes) && detailedData.UtilTimes.length > 0) {
                const firstTime = detailedData.UtilTimes[0];
                if (firstTime.StartTime && firstTime.EndTime) {
                  const startTime = new Date(firstTime.StartTime);
                  const endTime = new Date(firstTime.EndTime);
                  inclusiveTime = `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }
              }
              
              // Create material items from UserServices with property names that match the UI component
              const materialItems = [];
              
              // Process UserServices to create material items with consistent property names
              if (Array.isArray(detailedData.UserServices)) {
                for (const service of detailedData.UserServices) {
                  // Create a material item for each service
                  materialItems.push({
                    quantity: service.MinsAvail?.toString() || '1',
                    item: service.ServiceAvail || '',
                    description: service.EquipmentAvail || '',
                    issuedCondition: '',
                    returnedCondition: '',
                    // Use the same property names as in your UI component
                    Item: service.ServiceAvail || '', // This is what your PDF code will look at
                    ItemQty: service.MinsAvail || 1,  // This is what your PDF code will look at
                    Description: service.EquipmentAvail || ''
                  });
                }
              }
              
              // Add tools as materials
              if (Array.isArray(detailedData.UserTools)) {
                for (const tool of detailedData.UserTools) {
                  materialItems.push({
                    quantity: tool.ToolQuantity?.toString() || '1',
                    item: tool.ToolUser || '',
                    description: '',
                    issuedCondition: '',
                    returnedCondition: '',
                    // Use the same property names as in your UI component
                    Item: tool.ToolUser || '',
                    ItemQty: tool.ToolQuantity || 1,
                    Description: ''
                  });
                }
              }
              
              // Create a lab request form data object with all required fields
              const labRequestData: LabRequestFormData = {
                campus: 'Eastern Visayas Campus',
                controlNo: `U-${detailedData.id}`,
                schoolYear: new Date().getFullYear().toString(),
                gradeLevel: '',
                numberOfStudents: '1',
                subject: '',
                concurrentTopic: '',
                unit: '',
                teacherInCharge: '',
                venue: 'Fabrication Laboratory',
                inclusiveTimeOfUse: inclusiveTime,
                date: new Date(detailedData.RequestDate).toLocaleDateString(),
                materials: materialItems,
                receivedBy: '',
                receivedAndInspectedBy: '',
                receivedDate: '',
                inspectedDate: '',
                requestedBy: detailedData.accInfo?.Name || '',
                dateRequested: new Date(detailedData.RequestDate).toLocaleDateString(),
                students: [{ name: detailedData.accInfo?.Name || '' }],
                endorsedBy: '',
                approvedBy: '',
                preferredLabRoom: 'Fabrication Laboratory' // Add this required field
              };
              
              console.log('Lab request data with material items:', labRequestData);
              console.log('Material items with consistent property names:', materialItems);
              
              downloadLabRequestFormPDF(labRequestData);
            } catch (error) {
              console.error('Error in lab request PDF generation for regular utilization:', error);
              alert(`Error generating lab request PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            break;
            
        case 'lab-reservation':
          // For normal utilization reservations, create a basic lab reservation form
          try {
            // Format time from UtilTimes if available
            let inclusiveTime = '';
            if (Array.isArray(detailedData.UtilTimes) && detailedData.UtilTimes.length > 0) {
              const firstTime = detailedData.UtilTimes[0];
              if (firstTime.StartTime && firstTime.EndTime) {
                const startTime = new Date(firstTime.StartTime);
                const endTime = new Date(firstTime.EndTime);
                inclusiveTime = `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
              }
            }
           
            // Create material items from UserServices and UserTools
            const materialItems = [
              // Convert services to materials
              ...detailedData.UserServices.map((service: any) => ({
                quantity: '1',
                item: service.ServiceAvail || '',
                description: service.EquipmentAvail || '',
                issuedCondition: '',
                returnedCondition: '',
                machineName: service.MachineName || '',       // Add machine name
                machineQuantity: service.MachineQty?.toString() || '' // Add machine quantity
              })),
              // Add tools as materials
              ...detailedData.UserTools.map((tool: any) => ({
                quantity: tool.ToolQuantity?.toString() || '1',
                item: tool.ToolUser || '',
                description: '',
                issuedCondition: '',
                returnedCondition: '',
                machineName: '', // No machine name for tools
                machineQuantity: '' // No machine quantity for tools
              }))
            ];
           
            // Create a basic lab reservation form for non-EVC reservations with all required fields
            const labReservationData: LabReservationFormData = {
              campus: 'Eastern Visayas Campus', // Default value
              controlNo: `S-${detailedData.id}`,
              schoolYear: new Date().getFullYear().toString(),
              gradeLevel: '', // Not applicable for regular utilization
              numberOfStudents: '1', // Default to 1 for regular utilization
              subject: '', // Not applicable for regular utilization
              concurrentTopic: '', // Not applicable for regular utilization
              unit: '', // Not applicable for regular utilization
              teacherInCharge: '', // Not applicable for regular utilization
              venue: 'Fabrication Laboratory',
              inclusiveTimeOfUse: inclusiveTime,
              date: new Date(detailedData.RequestDate).toLocaleDateString(),
              materials: materialItems,
              receivedBy: '',
              receivedAndInspectedBy: '',
              receivedDate: '',
              inspectedDate: '',
              requestedBy: detailedData.accInfo?.Name || '',
              dateRequested: new Date(detailedData.RequestDate).toLocaleDateString(),
              students: [{ name: detailedData.accInfo?.Name || '' }],
              endorsedBy: '',
              approvedBy: '',
              preferredLabRoom: 'Fabrication Laboratory' // Required field with proper value
            };
           
            console.log('Lab reservation data for regular utilization:', labReservationData);
            downloadLabReservationFormPDF(labReservationData);
          } catch (error) {
            console.error('Error in lab reservation PDF generation for regular utilization:', error);
            alert(`Error generating lab reservation PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
         
        default:
          console.error('Unknown form type:', formType);
      }
  
      // Close modal and trigger scroll fix
      setIsPdfModalOpen(false);
      setSelectedReservationId(null);
      setNeedsScrollFix(true);
    } catch (error) {
      console.error('Error in overall PDF generation process:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error. Please try again.'}`);
     
      // Still need to close modal and fix scroll
      setIsPdfModalOpen(false);
      setSelectedReservationId(null);
      setNeedsScrollFix(true);
    }
  };

  const handleStatusUpdate = async (
    reservationId: number,
    newStatus: string // Changed from specific union type to string
  ) => {
    try {
      // Update database status
      const response = await fetch(`/api/admin/reservation-status/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
      }
  
      // Send email notification based on status
      if (newStatus === 'Approved') {
        try {
          console.log("Sending approval email for reservation:", reservationId);
          const emailResponse = await fetch('/api/admin-email/approved-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reservationId: reservationId.toString(),
              reservationType: 'utilization'
            }),
          });
          
          if (!emailResponse.ok) {
            console.warn('Failed to send approval email:', await emailResponse.text());
          } else {
            console.log('Approval email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
      } else if (newStatus === 'Rejected') {
        try {
          console.log("Sending rejection email for reservation:", reservationId);
          const emailResponse = await fetch('/api/admin-email/rejected-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reservationId: reservationId.toString(),
              reservationType: 'utilization',
              rejectionReason: 'Your reservation request could not be accommodated at this time.'
            }),
          });
          
          if (!emailResponse.ok) {
            console.warn('Failed to send rejection email:', await emailResponse.text());
          } else {
            console.log('Rejection email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
        }
      }
  
      // Update the UI
      setReservations(prevReservations =>
        prevReservations.map(res =>
          res.id === String(reservationId)
            ? { ...res, status: newStatus }
            : res
        )
      );
  
      if (selectedReservation && selectedReservation.id === reservationId) {
        setSelectedReservation({ ...selectedReservation, Status: newStatus });
      }
  
      // Close the modal
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error updating reservation status:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleEVCStatusUpdate = async (
  reservationId: number,
  newStatus: 'Pending Admin Approval' | 'Pending Teacher Approval' | 'Approved' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Rejected'
) => {
  try {
    const response = await fetch(`/api/admin/evc-reservation-status/${reservationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: newStatus,
        adminName: "Admin" // You might want to replace this with the actual admin name
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update EVC status: ${response.status} ${response.statusText}`);
    }

    // Send email notification based on status for EVC reservations
    if (newStatus === 'Approved') {
      try {
        console.log("Sending approval email for EVC reservation:", reservationId);
        const emailResponse = await fetch('/api/admin-email/approved-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reservationId: reservationId.toString(),
            reservationType: 'evc'
          }),
        });
        
        if (!emailResponse.ok) {
          console.warn('Failed to send EVC approval email:', await emailResponse.text());
        } else {
          console.log('EVC approval email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending EVC approval email:', emailError);
      }
    } else if (newStatus === 'Rejected') {
      try {
        console.log("Sending rejection email for EVC reservation:", reservationId);
        const emailResponse = await fetch('/api/admin-email/rejected-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reservationId: reservationId.toString(),
            reservationType: 'evc',
            rejectionReason: 'Your EVC reservation request could not be accommodated at this time.'
          }),
        });
        
        if (!emailResponse.ok) {
          console.warn('Failed to send EVC rejection email:', await emailResponse.text());
        } else {
          console.log('EVC rejection email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending EVC rejection email:', emailError);
      }
    }

    // Update UI states
    setReservations(prevReservations =>
      prevReservations.map(res =>
        res.id === `evc-${reservationId}`
          ? { ...res, status: newStatus }
          : res
      )
    );

    if (selectedEVCReservation && selectedEVCReservation.id === reservationId) {
      setSelectedEVCReservation({ ...selectedEVCReservation, EVCStatus: newStatus });
    }

    // Close the modal
    setIsEVCModalOpen(false);
  } catch (error: any) {
    console.error('Error updating EVC reservation status:', error instanceof Error ? error.message : String(error));
  }
};

  const filteredReservations = reservations.filter(reservation => {
    const matchesTab = activeTab === 'all' || reservation.role.toLowerCase() === activeTab.toLowerCase();
    
    if (selectedDate === 'all') {
      return matchesTab;
    }
    
    const reservationDate = new Date(reservation.date);
    const [filterYear, filterMonth] = selectedDate.split('-').map(Number);
    
    return matchesTab &&
           reservationDate.getFullYear() === filterYear &&
           reservationDate.getMonth() === filterMonth - 1;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Loading...</div>;
  }

  const formatCurrency = (amount: number | string | null): string => {
    if (amount === null || amount === undefined) return '0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Number(numAmount).toFixed(2);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="all" className="w-[400px]" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="msme">MSME</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative">
          <Button
            variant="outline"
            className="w-[240px] justify-start text-left font-normal"
            onClick={() => setIsCustomSelectOpen(!isCustomSelectOpen)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate === 'all'
              ? 'All Dates'
              : `${months[selectedMonth]} ${selectedYear}`
            }
          </Button>

          {isCustomSelectOpen && (
            <div className="absolute top-full mt-2 right-0 w-[280px] rounded-md border bg-white shadow-lg z-50">
              <div className="p-2">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md mb-2"
                  onClick={() => {
                    setSelectedDate('all');
                    setIsCustomSelectOpen(false);
                  }}
                >
                  All Dates
                </button>
                
                <div className="flex gap-2">
                  <div className="w-1/2 border-r">
                    <div className="font-medium px-3 py-1">Year</div>
                    <div className="max-h-48 overflow-y-auto">
                      {years.map(year => (
                        <button
                          key={year}
                          className={cn(
                            "w-full text-left px-3 py-1 hover:bg-gray-100",
                            selectedYear === year && "bg-gray-100 font-medium"
                          )}
                          onClick={() => setSelectedYear(year)}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-1/2">
                    <div className="font-medium px-3 py-1">Month</div>
                    <div className="max-h-48 overflow-y-auto">
                      {months.map((month, index) => (
                        <button
                          key={month}
                          className={cn(
                            "w-full text-left px-3 py-1 hover:bg-gray-100",
                            selectedMonth === index && "bg-gray-100 font-medium"
                          )}
                          onClick={() => handleDateSelect(selectedYear, index)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell className="font-medium">{formatDate(reservation.date)}</TableCell>
              <TableCell>
                <div>{reservation.name}</div>
                <div className="text-sm text-gray-500">{reservation.email}</div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                  {reservation.status}
                </span>
              </TableCell>
              <TableCell>{reservation.role}</TableCell>
              <TableCell>{reservation.service}</TableCell>
              <TableCell>
                ₱{reservation.totalAmount !== undefined ? formatCurrency(reservation.totalAmount) : '0.00'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleReviewClick(reservation)}>
                      Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleGeneratePdfClick(reservation)}>
                      Generate PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Regular Utilization Reservation Review Modal */}
      <ReviewReservation
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedReservation={selectedReservation}
        handleStatusUpdate={handleStatusUpdate}
      />

      {/* EVC Reservation Review Modal */}
      <ReviewEVCReservation
        isModalOpen={isEVCModalOpen}
        setIsModalOpen={setIsEVCModalOpen}
        selectedReservation={selectedEVCReservation}
        handleStatusUpdate={handleEVCStatusUpdate}
      />

      {/* PDF Generation Modal */}
      <Dialog
        open={isPdfModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPdfModalOpen(false);
            setSelectedReservationId(null);
            // Schedule scroll fix
            setTimeout(() => {
              setNeedsScrollFix(true);
            }, 50);
          }
        }}
      >
        <DialogContent className="max-w-lg" forceMount>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Generate PDF Documents
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const currentReservation = reservations.find(
                    res => res.id === selectedReservationId
                  );
                  
                    // Check if the role is student or staff (they share same forms)
                  const isStudentOrStaff = ['student', 'staff'].includes(currentReservation?.role.toLowerCase() || '');
                  const isMSME = currentReservation?.role.toLowerCase() === 'msme';
                  const isCompleted = currentReservation?.status.toLowerCase() === 'completed';
                  
                  // Return appropriate table rows based on role
                  if (isStudentOrStaff) {
                    // Only show Laboratory Request Form for students
                    return (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">Laboratory Request Form</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectedReservationId && handleGeneratePDF(selectedReservationId, 'lab-request')}
                              >
                                Generate PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Laboratory Reservation Form</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectedReservationId && handleGeneratePDF(selectedReservationId, 'lab-reservation')}
                              >
                                Generate PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    } else if (isMSME) {
                      // Show all MSME forms, but Job and Payment Order only for completed
                      return (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">Registration Form</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectedReservationId && handleGeneratePDF(selectedReservationId, 'registration')}
                              >
                                Generate PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Utilization Request Form</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectedReservationId && handleGeneratePDF(selectedReservationId, 'utilization-request')}
                              >
                                Generate PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                          {isCompleted && (
                            <TableRow>
                              <TableCell className="font-medium">Job and Payment Order</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => selectedReservationId && handleGeneratePDF(selectedReservationId, 'job-payment')}
                                >
                                  Generate PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    } else {
                      // Fallback for unknown roles
                      return (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-gray-500">
                            No PDF forms available for this user role
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })()}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsPdfModalOpen(false);
                setSelectedReservationId(null);
                // Schedule scroll fix
                setTimeout(() => {
                  setNeedsScrollFix(true);
                }, 50);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationHistory;