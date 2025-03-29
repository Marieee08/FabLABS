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
        // This is where we consolidate services with the same name
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
        console.log("Utilization detailed data:", detailedData);
        
        // Process UserServices to consolidate duplicate services in the detailed view
        if (detailedData.UserServices && Array.isArray(detailedData.UserServices)) {
          // Create a map to group services by ServiceAvail (service name)
          const serviceMap = new Map();
          
          detailedData.UserServices.forEach((service: UserService) => {
            const key = service.ServiceAvail;
            
            if (!serviceMap.has(key)) {
              serviceMap.set(key, service);
            }
            // If we wanted to count occurrences or sum values, we could do that here
          });
          
          // Convert map back to array
          detailedData.UserServices = Array.from(serviceMap.values());
        }
        
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
  const handleGeneratePDF = async (reservationId: string, formType: string): Promise<void> => {
    // Your existing implementation
  };

  const handleStatusUpdate = async (
    reservationId: number,
    newStatus: 'Approved' | 'Ongoing' | 'Pending Payment' | 'Paid' | 'Completed' | 'Cancelled' | 'Rejected'
  ) => {
    // Your existing implementation
  };

  const handleEVCStatusUpdate = async (
    reservationId: number,
    newStatus: 'Pending Admin Approval' | 'Approved' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Rejected'
  ) => {
    // Your existing implementation
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
                  
                  // Check if the role is student
                  const isStudent = currentReservation?.role.toLowerCase() === 'student';
                  
                  // Return appropriate table rows based on role
                  if (isStudent) {
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
                  } else {
                    // Show all other forms for non-students
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
                      </>
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