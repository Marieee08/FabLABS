// src\components\admin\review-evcreservation.tsx
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EVCStudent {
  id: number;
  Students: string | null;
}

interface NeededMaterial {
  id: number;
  Item: string | null;
  ItemQty: number | null;
  Description: string | null;
  Issued: string | null;
  Returned: string | null;
}

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: Date | string | null;
  EndTime: Date | string | null;
}

interface AccInfo {
  id: number;
  Name: string;
  email: string;
  Role: string;
  ContactNum?: string;
  Address?: string;
  City?: string;
  Province?: string;
  Zipcode?: number;
}

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
  EVCStudents: EVCStudent[];
  NeededMaterials: NeededMaterial[];
  UtilTimes: UtilTime[];
  accInfo: AccInfo;
}

interface ReviewEVCReservationProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedReservation: DetailedEVCReservation | null;
  handleStatusUpdate: (
    reservationId: number,
    newStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled'
  ) => Promise<void>;
}

const getStatusColor = (status: string) => {
  const colors = {
    Pending: 'bg-yellow-500 hover:bg-yellow-600',
    Approved: 'bg-blue-500 hover:bg-blue-600',
    Completed: 'bg-green-500 hover:bg-green-600',
    Rejected: 'bg-red-500 hover:bg-red-600',
    Cancelled: 'bg-gray-500 hover:bg-gray-600'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600';
};

const formatDate = (dateString: string | null | Date) => {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTimeSlot = (utilTime: UtilTime) => {
  if (!utilTime.StartTime || !utilTime.EndTime) return 'Time not specified';
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = utilTime.DayNum !== null ? days[utilTime.DayNum] : 'Day not specified';
  
  const startTime = new Date(utilTime.StartTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const endTime = new Date(utilTime.EndTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return `${day}, ${startTime} - ${endTime}`;
};

const ReviewEVCReservation: React.FC<ReviewEVCReservationProps> = ({
  isModalOpen,
  setIsModalOpen,
  selectedReservation,
  handleStatusUpdate
}) => {
  if (!selectedReservation) return null;
  
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            EVC Reservation Details
            <Badge 
              className={`ml-2 ${
                selectedReservation.EVCStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                selectedReservation.EVCStatus === 'Approved' ? 'bg-blue-100 text-blue-800' :
                selectedReservation.EVCStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                selectedReservation.EVCStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {selectedReservation.EVCStatus}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reservation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Reservation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Control No:</div>
                <div className="text-sm">{selectedReservation.ControlNo || 'Not assigned'}</div>
                
                <div className="text-sm font-medium">Requested Date:</div>
                <div className="text-sm">{formatDate(selectedReservation.DateRequested || '')}</div>
                
                <div className="text-sm font-medium">School Year:</div>
                <div className="text-sm">{selectedReservation.SchoolYear || 'Not specified'}</div>
                
                <div className="text-sm font-medium">Level/Section:</div>
                <div className="text-sm">{selectedReservation.LvlSec || 'Not specified'}</div>

                <div className="text-sm font-medium">Subject:</div>
                <div className="text-sm">{selectedReservation.Subject || 'Not specified'}</div>
                
                <div className="text-sm font-medium">Topic:</div>
                <div className="text-sm">{selectedReservation.Topic || 'Not specified'}</div>
                
                <div className="text-sm font-medium">No. of Students:</div>
                <div className="text-sm">{selectedReservation.NoofStudents || 'Not specified'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Information */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">Teacher Name:</div>
                <div className="text-sm">{selectedReservation.Teacher || 'Not specified'}</div>
                
                <div className="text-sm font-medium">Email:</div>
                <div className="text-sm">{selectedReservation.TeacherEmail || 'Not specified'}</div>
                
                <div className="text-sm font-medium">Approval Status:</div>
                <div className="text-sm">{selectedReservation.ApprovedBy ? `Approved by ${selectedReservation.ApprovedBy}` : 'Not approved'}</div>
                
                <div className="text-sm font-medium">Received By:</div>
                <div className="text-sm">{selectedReservation.ReceivedBy || 'Not yet received'}</div>
                
                <div className="text-sm font-medium">Received Date:</div>
                <div className="text-sm">{selectedReservation.ReceivedDate ? formatDate(selectedReservation.ReceivedDate) : 'Not yet received'}</div>
                
                <div className="text-sm font-medium">Inspected By:</div>
                <div className="text-sm">{selectedReservation.InspectedBy || 'Not yet inspected'}</div>
                
                <div className="text-sm font-medium">Inspected Date:</div>
                <div className="text-sm">{selectedReservation.InspectedDate ? formatDate(selectedReservation.InspectedDate) : 'Not yet inspected'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {/* Account Information */}
          <AccordionItem value="account">
            <AccordionTrigger>Account Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name:</p>
                  <p className="text-sm">{selectedReservation.accInfo.Name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email:</p>
                  <p className="text-sm">{selectedReservation.accInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role:</p>
                  <p className="text-sm">{selectedReservation.accInfo.Role}</p>
                </div>
                {selectedReservation.accInfo.ContactNum && (
                  <div>
                    <p className="text-sm font-medium">Contact Number:</p>
                    <p className="text-sm">{selectedReservation.accInfo.ContactNum}</p>
                  </div>
                )}
                {selectedReservation.accInfo.Address && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Address:</p>
                    <p className="text-sm">
                      {`${selectedReservation.accInfo.Address}, ${selectedReservation.accInfo.City}, ${selectedReservation.accInfo.Province}, ${selectedReservation.accInfo.Zipcode}`}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Student List */}
          <AccordionItem value="students">
            <AccordionTrigger>Student List</AccordionTrigger>
            <AccordionContent>
              {selectedReservation.EVCStudents && selectedReservation.EVCStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Student Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReservation.EVCStudents.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{student.Students || 'Not specified'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500">No students listed</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Needed Materials */}
          <AccordionItem value="materials">
            <AccordionTrigger>Needed Materials</AccordionTrigger>
            <AccordionContent>
              {selectedReservation.NeededMaterials && selectedReservation.NeededMaterials.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Returned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReservation.NeededMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.Item || 'Not specified'}</TableCell>
                        <TableCell>{material.ItemQty || 0}</TableCell>
                        <TableCell>{material.Description || 'Not specified'}</TableCell>
                        <TableCell>{material.Issued || 'No'}</TableCell>
                        <TableCell>{material.Returned || 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500">No materials listed</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Time Slots */}
          <AccordionItem value="timeslots">
            <AccordionTrigger>Time Slots</AccordionTrigger>
            <AccordionContent>
              {selectedReservation.UtilTimes && selectedReservation.UtilTimes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schedule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReservation.UtilTimes.map((time) => (
                      <TableRow key={time.id}>
                        <TableCell>{formatTimeSlot(time)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500">No time slots specified</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'].map((status) => (
              <Button
                key={status}
                disabled={selectedReservation.EVCStatus === status}
                className={getStatusColor(status)}
                onClick={() => handleStatusUpdate(selectedReservation.id, status as any)}
              >
                Mark as {status}
              </Button>
            ))}
          </div>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewEVCReservation;