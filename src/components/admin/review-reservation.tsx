import React, { useState } from 'react';
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

interface ReviewReservationProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  selectedReservation: DetailedReservation | null;
  handleStatusUpdate: (
    reservationId: number,
    newStatus: 'Approved' | 'Ongoing' | 'Pending payment' | 'Paid' | 'Completed' | 'Cancelled'
  ) => void;
}

const ReviewReservation: React.FC<ReviewReservationProps> = ({
  isModalOpen,
  setIsModalOpen,
  selectedReservation,
  handleStatusUpdate
}) => {
  const [machines, setMachines] = useState<Array<{id: string, Machine: string}>>([]);

  // Fetch machines when component mounts
  React.useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/admin/machines');
        if (!response.ok) throw new Error('Failed to fetch machines');
        const data = await response.json();
        setMachines(data);
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };
    fetchMachines();
  }, []);

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

  return (
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
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">Services Information</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedReservation.UserServices.map((service, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <label className="text-sm text-gray-600">Service</label>
                          <p className="font-medium">{service.ServiceAvail}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Equipment</label>
                          <select 
                            className="w-full border rounded px-2 py-1"
                            value={service.EquipmentAvail}
                            onChange={async (e) => {
                              try {
                                const response = await fetch(`/api/admin/reservation-review/${selectedReservation.id}/equipment`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    serviceId: service.id,
                                    equipment: e.target.value
                                  }),
                                });

                                if (!response.ok) throw new Error('Failed to update equipment');

                                const updatedData = await response.json();
                                // Update UI with the new reservation data
                                setSelectedReservation(updatedData);
                              } catch (error) {
                                console.error('Error updating equipment:', error);
                                alert('Failed to update equipment');
                              }
                            }}
                          >
                            <option value="">Select Equipment</option>
                            {machines.map(machine => (
                              <option key={machine.id} value={machine.Machine}>
                                {machine.Machine}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">Duration</label>
                          <p className="font-medium">{service.MinsAvail || 0} minutes</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Cost</label>
                          <p className="font-medium">₱{service.CostsAvail ? Number(service.CostsAvail).toFixed(2) : '0.00'}</p>
                        </div>
                      </div>
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
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Ongoing')}
                    >
                      Mark as Ongoing
                    </Button>
                  </>
                )}

                {selectedReservation.Status === 'Ongoing' && (
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
                      variant="default"
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'Paid')}
                    >
                      Mark as Paid
                    </Button>
                  </>
                )}

                {selectedReservation.Status === 'Paid' && (
                  <>
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
  );
};

export default ReviewReservation;