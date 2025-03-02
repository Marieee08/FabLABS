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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { downloadPDF } from "@/components/admin-functions/pdfgen";

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null; // Updated to handle Prisma decimal
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
  TotalAmntDue: number | string | null; // Updated to handle Prisma decimal
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
};

const ReservationHistory = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [isCustomSelectOpen, setIsCustomSelectOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<DetailedReservation | null>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/admin/reservation-history');
        if (!response.ok) throw new Error('Failed to fetch reservations');
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleDateSelect = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDate(`${year}-${String(month + 1).padStart(2, '0')}`);
    setIsCustomSelectOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      'Pending payment': 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReviewClick = async (reservation: Reservation) => {
    try {
      const response = await fetch(`/api/admin/reservation-review/${reservation.id}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const detailedData = await response.json();
      setSelectedReservation(detailedData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching reservation details:', error);
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


  const handleStatusUpdate = async (reservationId: number, newStatus: 'Approved' | 'Cancelled') => {
    try {
      const response = await fetch(`/api/admin/reservation-status/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update the reservations list with the new status
      setReservations(prevReservations =>
        prevReservations.map(res =>
          res.id === String(reservationId)
            ? { ...res, status: newStatus }
            : res
        )
      );

      // Update the selected reservation if it's open in the modal
      if (selectedReservation && selectedReservation.id === reservationId) {
        setSelectedReservation({ ...selectedReservation, Status: newStatus });
      }

      // Close the modal
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

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
                ₱{formatCurrency(reservation.totalAmount)}
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
                    <DropdownMenuItem onSelect={async () => {
                      try {
                        // First fetch the detailed reservation data if not already available
                        const response = await fetch(`/api/admin/reservation-review/${reservation.id}`);
                        if (!response.ok) throw new Error('Failed to fetch details');
                        const detailedData = await response.json();
                        
                        // Then download the PDF with the detailed data
                        downloadPDF(detailedData);
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                      }
                    }}>
                      Generate PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Reservation Details</DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
               <Tabs defaultValue="reservation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="reservation">Reservation</TabsTrigger>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="business">Business Info</TabsTrigger>
              </TabsList>

              <TabsContent value="reservation" className="mt-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Request Date</h3>
                    <p>{new Date(selectedReservation.RequestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Status</h3>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getStatusColor(selectedReservation.Status)
                    }`}>
                      {selectedReservation.Status}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Services Information</h3>
                  <div className="space-y-2">
                    {selectedReservation.UserServices.map((service, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p><span className="text-gray-600">Service:</span> {service.ServiceAvail}</p>
                      <p><span className="text-gray-600">Equipment:</span> {service.EquipmentAvail}</p>
                      <p><span className="text-gray-600">Duration:</span> {service.MinsAvail || 0} minutes</p>
                      <p><span className="text-gray-600">Cost:</span> ₱{service.CostsAvail ? Number(service.CostsAvail).toFixed(2) : '0.00'}</p>
                    </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                  <div className="space-y-2">
                    {selectedReservation.UtilTimes.map((time, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p><span className="text-gray-600">Day {time.DayNum}:</span></p>
                        <p className="ml-4">Start: {time.StartTime ? new Date(time.StartTime).toLocaleString() : 'Not set'}</p>
                        <p className="ml-4">End: {time.EndTime ? new Date(time.EndTime).toLocaleString() : 'Not set'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Name</h3>
                      <p>{selectedReservation.accInfo.Name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                      <p>{selectedReservation.accInfo.email}</p>
                    </div>
                  </div>

                  {selectedReservation.accInfo.ClientInfo && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Contact Information</h3>
                        <p><span className="text-gray-600">Phone:</span> {selectedReservation.accInfo.ClientInfo.ContactNum}</p>
                        <p><span className="text-gray-600">Address:</span> {selectedReservation.accInfo.ClientInfo.Address}</p>
                        <p><span className="text-gray-600">City:</span> {selectedReservation.accInfo.ClientInfo.City}</p>
                        <p><span className="text-gray-600">Province:</span> {selectedReservation.accInfo.ClientInfo.Province}</p>
                        <p><span className="text-gray-600">Zipcode:</span> {selectedReservation.accInfo.ClientInfo.Zipcode}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="business" className="mt-4">
                {selectedReservation.accInfo.BusinessInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Company Name</h3>
                        <p>{selectedReservation.accInfo.BusinessInfo.CompanyName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Business Owner</h3>
                        <p>{selectedReservation.accInfo.BusinessInfo.BusinessOwner}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Business Details</h3>
                      <p><span className="text-gray-600">Permit Number:</span> {selectedReservation.accInfo.BusinessInfo.BusinessPermitNum}</p>
                      <p><span className="text-gray-600">TIN:</span> {selectedReservation.accInfo.BusinessInfo.TINNum}</p>
                      <p><span className="text-gray-600">Company ID:</span> {selectedReservation.accInfo.BusinessInfo.CompanyIDNum}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Company Contact</h3>
                      <p><span className="text-gray-600">Email:</span> {selectedReservation.accInfo.BusinessInfo.CompanyEmail}</p>
                      <p><span className="text-gray-600">Phone:</span> {selectedReservation.accInfo.BusinessInfo.CompanyPhoneNum}</p>
                      <p><span className="text-gray-600">Mobile:</span> {selectedReservation.accInfo.BusinessInfo.CompanyMobileNum}</p>
                      <p><span className="text-gray-600">Contact Person:</span> {selectedReservation.accInfo.BusinessInfo.ContactPerson}</p>
                      <p><span className="text-gray-600">Designation:</span> {selectedReservation.accInfo.BusinessInfo.Designation}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Production Information</h3>
                      <p><span className="text-gray-600">Products Manufactured:</span> {selectedReservation.accInfo.BusinessInfo.Manufactured}</p>
                      <p><span className="text-gray-600">Production Frequency:</span> {selectedReservation.accInfo.BusinessInfo.ProductionFrequency}</p>
                      <p><span className="text-gray-600">Bulk Production:</span> {selectedReservation.accInfo.BusinessInfo.Bulk}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No business information available</p>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <div className="flex w-full justify-end gap-4">
                {selectedReservation.Status === 'Pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Cancelled')}
                    >
                      Reject Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Approved')}
                    >
                      Accept Reservation
                    </Button>
                  </>
                )}
                
                {selectedReservation.Status === 'Approved' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Cancelled')}
                    >
                      Cancel Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Pending payment')}
                    >
                      Mark as To Pay
                    </Button>
                  </>
                )}

                {selectedReservation.Status === 'Pending payment' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Cancelled')}
                    >
                      Cancel Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Completed')}
                    >
                      Mark as Completed
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationHistory;