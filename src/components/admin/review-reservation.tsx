// src/components/admin/review-reservation.tsx
import React, { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { EditIcon, Save, X, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReservationDetailsTab from './review-reservation-details';
import TimeEditor from './time-editor';

// Interface definitions remain the same
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
  Comments?: string | null;
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

interface Service {
  id: string;
  Service: string;
  Costs?: number | null;
  Icon?: string | null;
  Info?: string | null;
  Per?: string | null;
}

interface Machine {
  id: string;
  Machine: string;
  Image: string;
  Desc: string;
  Number?: number | null;
  Instructions?: string | null;
  Link?: string | null;
  isAvailable: boolean;
  Services: Service[];
}

// Structure for selected machine with quantity
interface SelectedMachine {
  name: string;
  quantity: number;
}

// Extended service that includes selected machines
interface UserServiceWithMachines extends UserService {
  selectedMachines: SelectedMachine[];
}

interface ReviewReservationProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  selectedReservation: DetailedReservation | null;
  handleStatusUpdate: (
    reservationId: number,
    newStatus: 'Approved' | 'Ongoing' | 'Pending Payment' | 'Paid' | 'Completed' | 'Cancelled' | 'Rejected'
  ) => void;
}

const ReviewReservation: React.FC<ReviewReservationProps> = ({
  isModalOpen,
  setIsModalOpen,
  selectedReservation,
  handleStatusUpdate
}) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [localReservation, setLocalReservation] = useState<DetailedReservation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingTimes, setEditingTimes] = useState(false);
  const [editedServices, setEditedServices] = useState<UserServiceWithMachines[]>([]);
  const [comments, setComments] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Function to check if reservation is in a state where editing is no longer allowed
  const isEditingDisabled = (status: string): boolean => {
    const nonEditableStatuses = ['Pending Payment', 'Paid', 'Completed'];
    return nonEditableStatuses.includes(status);
  };

  // Parse the EquipmentAvail string into an array of machine objects with names and quantities
  const parseMachines = (equipmentStr: string): SelectedMachine[] => {
    if (!equipmentStr) return [];
    
    return equipmentStr.split(',').map(machine => {
      const parts = machine.trim().split(':');
      const name = parts[0].trim();
      // If quantity is specified with :, use it, otherwise default to 1
      const quantity = parts.length > 1 ? parseInt(parts[1].trim()) || 1 : 1;
      
      return { name, quantity };
    }).filter(m => m.name !== '');
  };

  // Convert the array of machine objects back to a comma-separated string
  const stringifyMachines = (machines: SelectedMachine[]): string => {
    return machines.map(m => `${m.name}:${m.quantity}`).join(', ');
  };

  // Update local state when selected reservation changes
  useEffect(() => {
    if (selectedReservation) {
      setLocalReservation(selectedReservation);
      
      // Convert each service to include an array of selected machines with quantities
      const servicesWithMachines = selectedReservation.UserServices.map(service => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setEditedServices(servicesWithMachines);
      setComments(selectedReservation.Comments || '');
      setEditMode(false);
      setEditingTimes(false); // Reset time editing mode
      setValidationError(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedReservation]);

  // Fetch machines from the correct API endpoint
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines?includeServices=true');
        if (!response.ok) throw new Error('Failed to fetch machines');
        const data = await response.json();
        setMachines(data);
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };
    fetchMachines();
  }, []);

  // Find machines that can perform a specific service
  const getMachinesForService = (serviceName: string) => {
    // Find machines that have this service in their Services array
    return machines.filter(machine => 
      machine.isAvailable && machine.Services.some(service => 
        service.Service.toLowerCase() === serviceName.toLowerCase()
      )
    );
  };

  // Check if a service requires machines (has associated machines in the database)
  const serviceRequiresMachines = (serviceName: string) => {
    return getMachinesForService(serviceName).length > 0;
  };

  // Check if all required services have machines assigned
  const validateRequiredMachines = (): boolean => {
    for (const service of editedServices) {
      if (serviceRequiresMachines(service.ServiceAvail) && service.selectedMachines.length === 0) {
        setValidationError(`Service "${service.ServiceAvail}" requires equipment assignment.`);
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  // Get service rates for time-based cost calculation
  const getServiceRates = (): Map<string, number> => {
    const rates = new Map<string, number>();
    
    // For each service in the reservation, extract or calculate the rate per minute
    editedServices.forEach(service => {
      const cost = service.CostsAvail ? parseFloat(service.CostsAvail.toString()) : 0;
      const minutes = service.MinsAvail || 60; // Default to 60 minutes if not specified
      
      // Calculate rate per minute, avoid division by zero
      const ratePerMinute = minutes > 0 ? cost / minutes : 0;
      rates.set(service.id, ratePerMinute);
    });
    
    return rates;
  };

  const handleSaveChanges = async () => {
    if (!localReservation) return;

    // Check if editing is disabled for this reservation status
    if (isEditingDisabled(localReservation.Status)) {
      alert('Cannot edit details for reservations in Pending Payment, Paid, or Completed status.');
      setEditMode(false);
      return;
    }

    // First validate that all required services have machines assigned
    if (!validateRequiredMachines()) {
      return;
    }

    try {
      // Calculate total amount due
      const totalAmount = editedServices.reduce((sum, service) => {
        const serviceCost = service.CostsAvail ? parseFloat(service.CostsAvail.toString()) : 0;
        return sum + serviceCost;
      }, 0);

      // Convert selectedMachines array to comma-separated string before saving
      for (const service of editedServices) {
        const equipmentString = stringifyMachines(service.selectedMachines);
        
        await fetch(`/api/admin/reservation-review/${localReservation.id}?type=equipment`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceId: service.id,
            equipment: equipmentString,
            cost: service.CostsAvail
          }),
        });
      }

      // Save comments and total amount
      const updateResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}?type=comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments: comments,
          totalAmount: totalAmount
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update reservation information');

      const updatedData = await updateResponse.json();
      
      // Update the local data with the new EquipmentAvail strings
      const updatedServices = updatedData.UserServices.map((service: UserService) => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setLocalReservation({
        ...updatedData,
        UserServices: updatedData.UserServices
      });
      
      setEditedServices(updatedServices);
      setEditMode(false);
      setHasUnsavedChanges(false);
      alert('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    }
  };

  // Handle saving updated time information
  const handleSaveTimeChanges = async (updatedTimes: UtilTime[], updatedCost: number) => {
    if (!localReservation) return;
    
    // Check if editing is disabled for this reservation status
    if (isEditingDisabled(localReservation.Status)) {
      alert('Cannot update times for reservations in Pending Payment, Paid, or Completed status.');
      setEditingTimes(false);
      return;
    }
    
    try {
      // Call the API to update the times and costs
      const response = await fetch(`/api/admin/reservation-update-times/${localReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          utilTimes: updatedTimes,
          totalAmount: updatedCost
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update times');
      }
      
      const updatedData = await response.json();
      
      // Update local reservation data
      setLocalReservation({
        ...updatedData,
        UtilTimes: updatedData.UtilTimes,
        TotalAmntDue: updatedData.TotalAmntDue
      });
      
      // Exit time editing mode
      setEditingTimes(false);
      alert('Usage times and cost updated successfully');
    } catch (error) {
      console.error('Error updating times:', error);
      alert(`Failed to update times: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Attempt to enter edit mode with proper validation
  const attemptEnterEditMode = () => {
    if (!localReservation) return;
    
    if (isEditingDisabled(localReservation.Status)) {
      alert('Cannot edit details for reservations in Pending Payment, Paid, or Completed status.');
      return;
    }
    
    setEditMode(true);
  };

  // Attempt to enter time editing mode with proper validation
  const attemptEnterTimeEditMode = () => {
    if (!localReservation) return;
    
    if (isEditingDisabled(localReservation.Status)) {
      alert('Cannot update times for reservations in Pending Payment, Paid, or Completed status.');
      return;
    }
    
    if (localReservation.Status !== 'Ongoing') {
      alert('Usage times can only be updated for ongoing reservations.');
      return;
    }
    
    setEditingTimes(true);
  };

  // Handle cancel edit mode with confirmation if there are unsaved changes
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to exit edit mode?')) {
        resetToOriginalData();
      }
    } else {
      resetToOriginalData();
    }
  };

  // Reset data to original state
  const resetToOriginalData = () => {
    if (selectedReservation) {
      const servicesWithMachines = selectedReservation.UserServices.map(service => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setEditedServices(servicesWithMachines);
      setComments(selectedReservation.Comments || '');
      setEditMode(false);
      setEditingTimes(false); // Also reset time editing mode
      setValidationError(null);
      setHasUnsavedChanges(false);
    }
  };

  // Handle update of a service from the child component
  const handleUpdateService = (updatedService: UserServiceWithMachines) => {
    setEditedServices(prev => 
      prev.map(service => 
        service.id === updatedService.id ? updatedService : service
      )
    );
    setHasUnsavedChanges(true);
  };

  // Track changes to comments
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(e.target.value);
    setHasUnsavedChanges(true);
  };

  // Custom approve function that validates machine requirements
  const handleApproveReservation = () => {
    if (!localReservation) return;
    
    if (!validateRequiredMachines()) {
      return;
    }
    
    handleStatusUpdate(localReservation.id, 'Approved');
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Reservation Details</DialogTitle>
        </DialogHeader>
        
        {localReservation && (
          <div className="space-y-6">
            {/* Display notification if reservation is in non-editable state */}
            {isEditingDisabled(localReservation.Status) && (
              <Alert variant="warning" className="bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This reservation is in {localReservation.Status} status. Details can no longer be edited.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="reservation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="reservation">Reservation</TabsTrigger>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="business">Business Info</TabsTrigger>
              </TabsList>

              <TabsContent value="reservation" className="mt-4 space-y-6">
                {/* Display time editor when in time editing mode */}
                {editingTimes ? (
                  <TimeEditor
                    utilTimes={localReservation.UtilTimes}
                    serviceRates={getServiceRates()}
                    onSave={handleSaveTimeChanges}
                    onCancel={() => setEditingTimes(false)}
                  />
                ) : (
                  <>
                    {/* Using the extracted ReservationDetailsTab component */}
                    <ReservationDetailsTab 
                      reservation={localReservation}
                      machines={machines}
                      editMode={editMode}
                      validationError={validationError}
                      onUpdateService={handleUpdateService}
                    />
                    
                    <Separator />

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Tools Required</h3>
                      {localReservation.UserTools && localReservation.UserTools.length > 0 ? (
                        <div className="space-y-2">
                          {localReservation.UserTools.map((tool, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p><span className="text-gray-600">Tool:</span> {tool.ToolUser}</p>
                              <p><span className="text-gray-600">Quantity:</span> {tool.ToolQuantity}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No tools added to this reservation</p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Admin Comments</h3>
                      {editMode ? (
                        <Textarea
                          value={comments}
                          onChange={handleCommentsChange}
                          placeholder="Add comments about this reservation..."
                          className="min-h-[100px]"
                        />
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {localReservation.Comments ? (
                            <p>{localReservation.Comments}</p>
                          ) : (
                            <p className="text-gray-500 italic">No comments added</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="personal" className="mt-4 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Name</h3>
                      <p>{localReservation.accInfo.Name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                      <p>{localReservation.accInfo.email}</p>
                    </div>
                  </div>

                  {localReservation.accInfo.ClientInfo && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Contact Information</h3>
                        <p><span className="text-gray-600">Phone:</span> {localReservation.accInfo.ClientInfo.ContactNum}</p>
                        <p><span className="text-gray-600">Address:</span> {localReservation.accInfo.ClientInfo.Address}</p>
                        <p><span className="text-gray-600">City:</span> {localReservation.accInfo.ClientInfo.City}</p>
                        <p><span className="text-gray-600">Province:</span> {localReservation.accInfo.ClientInfo.Province}</p>
                        <p><span className="text-gray-600">Zipcode:</span> {localReservation.accInfo.ClientInfo.Zipcode}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="business" className="mt-4 space-y-6">
                {localReservation.accInfo.BusinessInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Company Name</h3>
                        <p>{localReservation.accInfo.BusinessInfo.CompanyName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Business Owner</h3>
                        <p>{localReservation.accInfo.BusinessInfo.BusinessOwner}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Business Details</h3>
                      <p><span className="text-gray-600">Permit Number:</span> {localReservation.accInfo.BusinessInfo.BusinessPermitNum}</p>
                      <p><span className="text-gray-600">TIN:</span> {localReservation.accInfo.BusinessInfo.TINNum}</p>
                      <p><span className="text-gray-600">Company ID:</span> {localReservation.accInfo.BusinessInfo.CompanyIDNum}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Company Contact</h3>
                      <p><span className="text-gray-600">Email:</span> {localReservation.accInfo.BusinessInfo.CompanyEmail}</p>
                      <p><span className="text-gray-600">Phone:</span> {localReservation.accInfo.BusinessInfo.CompanyPhoneNum}</p>
                      <p><span className="text-gray-600">Mobile:</span> {localReservation.accInfo.BusinessInfo.CompanyMobileNum}</p>
                      <p><span className="text-gray-600">Contact Person:</span> {localReservation.accInfo.BusinessInfo.ContactPerson}</p>
                      <p><span className="text-gray-600">Designation:</span> {localReservation.accInfo.BusinessInfo.Designation}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Production Information</h3>
                      <p><span className="text-gray-600">Products Manufactured:</span> {localReservation.accInfo.BusinessInfo.Manufactured}</p>
                      <p><span className="text-gray-600">Production Frequency:</span> {localReservation.accInfo.BusinessInfo.ProductionFrequency}</p>
                      <p><span className="text-gray-600">Bulk Production:</span> {localReservation.accInfo.BusinessInfo.Bulk}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No business information available</p>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <div className="flex w-full justify-between">
                {localReservation && !editingTimes && (
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={handleSaveChanges}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Only show edit buttons if reservation is not in a non-editable state */}
                        {!isEditingDisabled(localReservation.Status) && (
                          <Button 
                            variant="outline" 
                            onClick={attemptEnterEditMode}
                          >
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit Details
                          </Button>
                        )}
                        
                        {/* Special button for editing times when status is Ongoing */}
                        {localReservation.Status === 'Ongoing' && !isEditingDisabled(localReservation.Status) && (
                          <Button 
                            variant="outline" 
                            onClick={attemptEnterTimeEditMode}
                            className="ml-2"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Update Usage Times
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="flex gap-4">
                {/* Updated status flow for MSME users */}
                {localReservation.Status === 'Pending Admin Approval' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Rejected')}
                    >
                      Reject Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleApproveReservation}
                    >
                      Accept Reservation
                    </Button>
                  </>
                )}
                
                {localReservation.Status === 'Approved' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Cancelled')}
                    >
                      Cancel Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Ongoing')}
                    >
                      Mark as Ongoing
                    </Button>
                  </>
                )}

                {localReservation.Status === 'Ongoing' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Cancelled')}
                    >
                      Cancel Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        // If we're editing times, show a reminder to save first
                        if (editingTimes) {
                          alert('Please save your time changes first before proceeding to payment');
                          return;
                        }
                        handleStatusUpdate(localReservation.id, 'Pending Payment');
                      }}
                    >
                      Mark as Pending Payment
                    </Button>
                  </>
                )}

                {/* Display a view-only button for completed/rejected/cancelled reservations */}
                {(localReservation.Status === 'Completed' || 
                  localReservation.Status === 'Rejected' || 
                  localReservation.Status === 'Pending Payment' ||
                  localReservation.Status === 'Paid' ||  
                  localReservation.Status === 'Cancelled') && (
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>
                )}
                </div>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewReservation;