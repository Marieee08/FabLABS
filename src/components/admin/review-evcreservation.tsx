// src\components\admin\review-evcreservation.tsx - with status timeline removed
import React from 'react';
import {
Dialog,
DialogContent,
DialogFooter,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface UtilTime {
id: number;
DayNum: number | null;
StartTime: string | null;
EndTime: string | null;
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
EVCStudents: any[];
NeededMaterials: any[];
UtilTimes: UtilTime[];
accInfo: {
  Name: string;
  email: string;
  Role: string;
};
}

interface ReviewEVCReservationProps {
isModalOpen: boolean;
setIsModalOpen: (isOpen: boolean) => void;
selectedReservation: DetailedEVCReservation | null;
handleStatusUpdate: (
  reservationId: number,
  newStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled'
) => void;
}

const ReviewEVCReservation: React.FC<ReviewEVCReservationProps> = ({
isModalOpen,
setIsModalOpen,
selectedReservation,
handleStatusUpdate
}) => {
const getStatusColor = (status: string) => {
  const colors = {
    'Pending Teacher Approval': 'bg-purple-100 text-purple-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-blue-100 text-blue-800',
    'Ongoing': 'bg-green-100 text-green-800',
    'Completed': 'bg-indigo-100 text-indigo-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const handleStatusUpdateWithApprover = async (
  reservationId: number, 
  newStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled'
) => {
  try {
    console.log(`Updating reservation ${reservationId} to status: ${newStatus}`);
    
    // REPLACE THIS WITH YOUR ACTUAL NAME
    const adminName = "Your Name"; 
    
    // Create payload with admin name
    const payload = { 
      status: newStatus,
      adminName: adminName
    };
    
    console.log("Sending payload to API:", payload);
    
    const response = await fetch(`/api/admin/evc-reservation-status/${reservationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log("API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update EVC status: ${response.status} ${errorText}`);
    }

    console.log("Update successful");
    
    // First close the modal
    setIsModalOpen(false);
    
    // Then update the parent component's state
    handleStatusUpdate(reservationId, newStatus);
    
  } catch (error: any) {
    console.error('Error updating EVC reservation status:', error);
    alert(`Failed to update reservation status: ${error.message}`);
  }
};

const formatTime = (timeString: string | null): string => {
  if (!timeString) return 'Not set';
  return new Date(timeString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return 'Not set';
  return new Date(dateTimeString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

return (
  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">EVC Reservation Details</DialogTitle>
      </DialogHeader>
      
      {selectedReservation && (
        <div className="space-y-6">
          <Tabs defaultValue="reservation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reservation">Reservation</TabsTrigger>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="processing">Processing Info</TabsTrigger>
            </TabsList>

            <TabsContent value="reservation" className="mt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Control No.</h3>
                  <p>{selectedReservation.ControlNo || 'Not assigned'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Approved By</h3>
                  <p>{selectedReservation.ApprovedBy || 'Not yet approved'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Request Date</h3>
                  <p>{selectedReservation.DateRequested ? formatDate(selectedReservation.DateRequested) : 'Not set'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    getStatusColor(selectedReservation.EVCStatus)
                  }`}>
                    {selectedReservation.EVCStatus}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Needed Materials</h3>
                <div className="space-y-2">
                  {selectedReservation.NeededMaterials && selectedReservation.NeededMaterials.length > 0 ? (
                    selectedReservation.NeededMaterials.map((material, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p><span className="text-gray-600">Material:</span> {material.Item || 'Not specified'}</p>
                        <p><span className="text-gray-600">Quantity:</span> {material.ItemQty || 0}</p>
                        {material.Description && <p><span className="text-gray-600">Description:</span> {material.Description}</p>}
                        {material.Issued && <p><span className="text-gray-600">Issued:</span> {material.Issued}</p>}
                        {material.Returned && <p><span className="text-gray-600">Returned:</span> {material.Returned}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No materials listed</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                <div className="space-y-2">
                  {selectedReservation.UtilTimes && selectedReservation.UtilTimes.length > 0 ? (
                    selectedReservation.UtilTimes.map((time, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p><span className="text-gray-600">Day {time.DayNum}:</span></p>
                        <p className="ml-4">Start: {time.StartTime ? formatDateTime(time.StartTime) : 'Not set'}</p>
                        <p className="ml-4">End: {time.EndTime ? formatDateTime(time.EndTime) : 'Not set'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No schedule information available</p>
                  )}
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

                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">School Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><span className="text-gray-600">School Year:</span> {selectedReservation.SchoolYear || 'Not set'}</p>
                    </div>
                    <div>
                      <p><span className="text-gray-600">Level/Section:</span> {selectedReservation.LvlSec || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p><span className="text-gray-600">Subject:</span> {selectedReservation.Subject || 'Not specified'}</p>
                    </div>
                    <div>
                      <p><span className="text-gray-600">Topic:</span> {selectedReservation.Topic || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p><span className="text-gray-600">Teacher:</span> {selectedReservation.Teacher || 'Not specified'}</p>
                    </div>
                    <div>
                      <p><span className="text-gray-600">Teacher Email:</span> {selectedReservation.TeacherEmail || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Student List ({selectedReservation.NoofStudents || 0} students)</h3>
                  <div className="space-y-2">
                    {selectedReservation.EVCStudents && selectedReservation.EVCStudents.length > 0 ? (
                      selectedReservation.EVCStudents.map((student, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p><span className="text-gray-600">Name:</span> {student.Students || 'Not provided'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No student list available</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="processing" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Processing Details</h3>
                  <p><span className="text-gray-600">Received By:</span> {selectedReservation.ReceivedBy || 'Not yet received'}</p>
                  <p><span className="text-gray-600">Received Date:</span> {selectedReservation.ReceivedDate ? formatDate(selectedReservation.ReceivedDate) : 'Not yet received'}</p>
                  <p><span className="text-gray-600">Inspected By:</span> {selectedReservation.InspectedBy || 'Not yet inspected'}</p>
                  <p><span className="text-gray-600">Inspected Date:</span> {selectedReservation.InspectedDate ? formatDate(selectedReservation.InspectedDate) : 'Not yet inspected'}</p>
                </div>
                
                {/* Status Timeline has been removed */}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <div className="flex w-full justify-end gap-4">
              {selectedReservation.EVCStatus === 'Pending Teacher Approval' && (
                <Button variant="outline" disabled>
                  Awaiting Teacher Approval
                </Button>
              )}
              
              {selectedReservation.EVCStatus === 'Pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdateWithApprover(selectedReservation.id, 'Rejected')}
                  >
                    Reject Reservation
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdateWithApprover(selectedReservation.id, 'Approved')}
                  >
                    Accept Reservation
                  </Button>
                </>
              )}
              
              {selectedReservation.EVCStatus === 'Approved' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdateWithApprover(selectedReservation.id, 'Cancelled')}
                  >
                    Cancel Reservation
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdateWithApprover(selectedReservation.id, 'Completed')}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
              
              {selectedReservation.EVCStatus === 'Ongoing' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdateWithApprover(selectedReservation.id, 'Cancelled')}
                  >
                    Cancel Reservation
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdateWithApprover(selectedReservation.id, 'Completed')}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
              
              {(selectedReservation.EVCStatus === 'Completed' || 
                selectedReservation.EVCStatus === 'Rejected' ||
                selectedReservation.EVCStatus === 'Cancelled') && (
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      )}
    </DialogContent>
  </Dialog>
);
};

export default ReviewEVCReservation;