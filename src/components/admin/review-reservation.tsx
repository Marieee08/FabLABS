// Modified ReviewReservation component with fixes for the three issues:
// 1. Remove changeable costs of the machine
// 2. Fix equipment add/delete functionality
// 3. Remove "requires equipment" label

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
import { EditIcon, Save, X, Clock, AlertCircle, Database } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReservationDetailsTab from './review-reservation-details';
import TimeEditor from './time-editor';
import  MachineUtilization from './machine-utilization';
import { toast } from 'sonner';
import CostBreakdown from './cost-breakdown';

// Interface definitions (keep these unchanged)
interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
  Files?: string | null;
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
  DateStatus?: string | null;
}

interface MachineUtilization {
  id: number;
  Machine: string | null;
  ReviwedBy: string | null;
  MachineApproval: boolean | null;
  DateReviewed: string | null;
  ServiceName: string | null;
  OperatingTimes?: OperatingTime[];
  DownTimes?: DownTime[];
  RepairChecks?: RepairCheck[];
}

interface OperatingTime {
  id: number;
  OTDate: string | null;
  OTTypeofProducts: string | null;
  OTStartTime: string | null;
  OTEndTime: string | null;
  OTMachineOp: string | null;
}

interface DownTime {
  id: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null;
  Cause: string | null;
  DTMachineOp: string | null;
}

interface RepairCheck {
  id: number;
  RepairDate: string | null;
  Service: string | null;
  Duration: number | null;
  RepairReason: string | null;
  PartsReplaced: string | null;
  RPPersonnel: string | null;
}

interface SelectedMachine {
  name: string;
  quantity: number;
}

interface UserServiceWithMachines extends UserService {
  selectedMachines: SelectedMachine[];
}

interface ReviewReservationProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  selectedReservation: DetailedReservation | null;
  handleStatusUpdate: (id: number, status: string) => void;
}

interface Machine {
  id: string;
  name: string;
  isAvailable: boolean;
  Services: {
    id: string;
    Service: string;
  }[];
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
  MachineUtilizations?: MachineUtilization[];
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
  const [editingMachineUtilization, setEditingMachineUtilization] = useState(false);
  const [editedServices, setEditedServices] = useState<UserServiceWithMachines[]>([]);
  const [comments, setComments] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isEditingDisabled = (status: string): boolean => {
    const nonEditableStatuses = ['Pending Payment', 'Paid', 'Completed'];
    return nonEditableStatuses.includes(status);
  };

  const isPendingStatus = (status: string): boolean => {
    return status === 'Pending' || status === 'Pending Admin Approval';
  };

  const hasOngoingTimeSlots = (utilTimes: UtilTime[]): boolean => {
    return utilTimes.some(time => 
      time.DateStatus === "Ongoing" || 
      time.DateStatus === null || 
      time.DateStatus === undefined
    );
  };
  
  const handleMarkAsPendingPayment = () => {
    if (!localReservation) return;
    
    if (hasOngoingTimeSlots(localReservation.UtilTimes)) {
      toast({
        title: "Cannot proceed to payment",
        description: "All time slots must be marked as Completed or Cancelled before proceeding to payment.",
        variant: "destructive",
        duration: 5000,
      });
      
      alert("Cannot proceed to payment: All time slots must be marked as Completed or Cancelled first.");
      return;
    }
    
    handleStatusUpdate(localReservation.id, 'Pending Payment');
  };

  // Parse the EquipmentAvail string into an array of machine objects with names and quantities
  const parseMachines = (equipmentStr: string): SelectedMachine[] => {
    if (!equipmentStr) return [];
    
    return equipmentStr.split(',').map(machine => {
      const parts = machine.trim().split(':');
      const name = parts[0].trim();
      const quantity = parts.length > 1 ? parseInt(parts[1].trim()) || 1 : 1;
      
      return { name, quantity };
    }).filter(m => m.name !== '');
  };

  // Convert the array of machine objects back to a comma-separated string
  const stringifyMachines = (machines: SelectedMachine[]): string => {
    return machines.map(m => `${m.name}:${m.quantity}`).join(', ');
  };

  // Update local state when selected reservation changes
<<<<<<< Updated upstream
// Update local state when selected reservation changes
useEffect(() => {
  if (selectedReservation) {
    setLocalReservation(selectedReservation);
    
    // Make sure UserServices exists and is an array before mapping
    if (selectedReservation.UserServices && Array.isArray(selectedReservation.UserServices)) {
      // Convert each service to include an array of selected machines with quantities
=======
  useEffect(() => {
    if (selectedReservation) {
      setLocalReservation(selectedReservation);
      
>>>>>>> Stashed changes
      const servicesWithMachines = selectedReservation.UserServices.map(service => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setEditedServices(servicesWithMachines);
<<<<<<< Updated upstream
    } else {
      // Handle the case where UserServices is undefined or not an array
      setEditedServices([]);
=======
      setComments(selectedReservation.Comments || '');
      setEditMode(false);
      setEditingTimes(false);
      setEditingMachineUtilization(false);
      setValidationError(null);
      setHasUnsavedChanges(false);
>>>>>>> Stashed changes
    }
    
    setComments(selectedReservation.Comments || '');
    setEditMode(false);
    setEditingTimes(false); // Reset time editing mode
    setEditingMachineUtilization(false); // Reset machine utilization editing mode
    setValidationError(null);
    setHasUnsavedChanges(false);
  }
}, [selectedReservation]);


  // Fetch machines from the API endpoint
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

  // Debug useEffects for monitoring MachineUtilizations
  useEffect(() => {
    if (selectedReservation) {
      console.log("Selected reservation MachineUtilizations:", selectedReservation.MachineUtilizations);
    }
  }, [selectedReservation]);

  useEffect(() => {
    if (localReservation && localReservation.Status === 'Approved') {
      console.log("Reservation was approved, checking MachineUtilizations:", 
        localReservation.MachineUtilizations);
    }
  }, [localReservation?.Status]);

  const getMachinesForService = (serviceName: string) => {
    return machines.filter(machine => 
      machine.isAvailable && machine.Services.some(service => 
        service.Service.toLowerCase() === serviceName.toLowerCase()
      )
    );
  };

  // FIX #3: Remove the serviceRequiresMachines check
  // This will remove the "requires equipment" label

  const getServiceRates = (): Map<string, number> => {
    const rates = new Map<string, number>();
    
    editedServices.forEach(service => {
      const cost = service.CostsAvail ? parseFloat(service.CostsAvail.toString()) : 0;
      const minutes = service.MinsAvail || 60;
      
      const ratePerMinute = minutes > 0 ? cost / minutes : 0;
      rates.set(service.id, ratePerMinute);
    });
    
    return rates;
  };

  const handleSaveChanges = async () => {
    try {
      // Calculate total duration from all edited time slots
      let totalDurationMinutes = 0;
      
      for (const time of editedTimes) {
        if (time.StartTime && time.EndTime && time.DateStatus !== 'Cancelled') {
          // Parse start time
          const [startHour, startMinute] = time.StartTime.split(':').map(Number);
          const startTotalMinutes = startHour * 60 + startMinute;
          
          // Parse end time
          const [endHour, endMinute] = time.EndTime.split(':').map(Number);
          let endTotalMinutes = endHour * 60 + endMinute;
          
          // If end time is earlier than start time, assume it's the next day
          if (endTotalMinutes < startTotalMinutes) {
            endTotalMinutes += 24 * 60; // Add 24 hours in minutes
          }
          
          // Add the duration of this time slot to the total
          totalDurationMinutes += (endTotalMinutes - startTotalMinutes);
        }
      }
      
      console.log(`Total calculated duration: ${totalDurationMinutes} minutes`);
      
      // Save the updated time slots and the calculated duration
      onSave(editedTimes, totalCost, totalDurationMinutes);
    } catch (error) {
      console.error('Error calculating duration:', error);
      alert('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSaveTimeChanges = async (updatedTimes: UtilTime[], updatedCost: number, totalDuration: number) => {
    if (!localReservation) return;
    
    if (isEditingDisabled(localReservation.Status)) {
      alert('Cannot update times for reservations in Pending Payment, Paid, or Completed status.');
      setEditingTimes(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/reservation-update-times/${localReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          utilTimes: updatedTimes,
          totalAmount: updatedCost,
          totalDuration: totalDuration // Pass the duration explicitly
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update times');
      }
      
      const updatedData = await response.json();
      
      setLocalReservation({
        ...updatedData,
        UtilTimes: updatedData.UtilTimes,
        TotalAmntDue: updatedData.TotalAmntDue
      });
      
      setEditingTimes(false);
      alert('Usage times, duration, and cost updated successfully');
    } catch (error) {
      console.error('Error updating times:', error);
      alert(`Failed to update times: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleMachineUtilizationComplete = () => {
    setEditingMachineUtilization(false);
  };

  const attemptEnterEditMode = () => {
    if (!localReservation) return;
    
    if (isEditingDisabled(localReservation.Status)) {
      alert('Cannot edit details for reservations in Pending Payment, Paid, or Completed status.');
      return;
    }
    
    setEditMode(true);
  };

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

  const attemptEnterMachineUtilizationMode = () => {
    if (!localReservation) return;
    
    if (localReservation.Status !== 'Ongoing') {
      alert('Machine utilization can only be updated for ongoing reservations.');
      return;
    }
    
    setEditingMachineUtilization(true);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to exit edit mode?')) {
        resetToOriginalData();
      }
    } else {
      resetToOriginalData();
    }
  };

  const resetToOriginalData = () => {
    if (selectedReservation) {
      const servicesWithMachines = selectedReservation.UserServices.map(service => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setEditedServices(servicesWithMachines);
      setComments(selectedReservation.Comments || '');
      setEditMode(false);
      setEditingTimes(false);
      setEditingMachineUtilization(false);
      setValidationError(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleUpdateService = (updatedService: UserServiceWithMachines) => {
    const updatedServices = editedServices.map(service => 
      service.id === updatedService.id ? updatedService : service
    );
    
    setEditedServices(updatedServices);
    setHasUnsavedChanges(true);
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleApproveReservation = async () => {
    if (!localReservation) return;

<<<<<<< Updated upstream
const handleApproveReservation = async () => {
  if (!localReservation) return;
  
  // 1. First validate that all required services have machines assigned
  if (!validateRequiredMachines()) {
    return;
  }
  
  try {
    // 2. Set up loading state for better UX
    setIsLoading(true);
    
    // 3. For each UserService with equipment, prepare MachineUtilization records
    const machineUtilizations = editedServices
      .filter(service => service.selectedMachines.length > 0)
      .flatMap(service => 
        service.selectedMachines.map(machine => ({
          Machine: machine.name,
          ReviewedBy: null,  // This will be filled in later when reviewed
          MachineApproval: false,
          DateReviewed: null,
          ServiceName: service.ServiceAvail,
          OperatingTimes: [],  // Empty arrays for now, will be filled later
          DownTimes: [],
          RepairChecks: []
        }))
      );
    
    // 4. Create all machine utilization records in a single API call
    const response = await fetch(`/api/admin/machine-utilization/${localReservation.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(machineUtilizations)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create machine utilization records');
    }
    
    // 5. Now update the status to Approved
    await handleStatusUpdate(localReservation.id, 'Approved');


  // 6. Send approval email notification - ADD THIS PART
  try {
    const emailResponse = await fetch('/api/admin-email/approved-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: localReservation.id.toString(),
        reservationType: 'utilization' // Specifies this is a regular utilization, not EVC
      }),
    });
    
    if (!emailResponse.ok) {
      console.warn('Email notification failed to send:', await emailResponse.text());
    } else {
      console.log('Approval email sent successfully');
    }
  } catch (emailError) {
    console.error('Error sending approval email:', emailError);
    // We don't want to fail the whole approval process if just the email fails
  }
    

    
    // 6. Fetch the updated reservation data to ensure we have the latest MachineUtilizations
    const updatedResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}`);
    if (updatedResponse.ok) {
      const updatedReservation = await updatedResponse.json();
      setLocalReservation(updatedReservation);
=======
    try {
      setIsLoading(true);
>>>>>>> Stashed changes
      
      // Calculate the total amount
      const totalAmount = editedServices.reduce((sum, service) => {
        const serviceCost = service.CostsAvail 
          ? typeof service.CostsAvail === 'string' 
            ? parseFloat(service.CostsAvail) 
            : service.CostsAvail 
          : 0;
        return sum + serviceCost;
      }, 0);
      
      // Prepare machine utilization records
      const machineUtilizations = editedServices
        .filter(service => service.selectedMachines.length > 0)
        .flatMap(service => 
          service.selectedMachines.map(machine => ({
            Machine: machine.name,
            ReviewedBy: null,
            MachineApproval: false,
            DateReviewed: null,
            ServiceName: service.ServiceAvail,
            OperatingTimes: [],
            DownTimes: [],
            RepairChecks: []
          }))
        );
      
      // Create machine utilization records
      const response = await fetch(`/api/admin/machine-utilization/${localReservation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(machineUtilizations)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create machine utilization records');
      }
      
      // Update the total amount
      await fetch(`/api/admin/update-total/${localReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: totalAmount
        }),
      });
      
      // Update status to Approved
      await handleStatusUpdate(localReservation.id, 'Approved');
      
      // Fetch updated reservation data
      const updatedResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}`);
      if (updatedResponse.ok) {
        const updatedReservation = await updatedResponse.json();
        setLocalReservation(updatedReservation);
        
        const updatedServices = updatedReservation.UserServices.map((service) => ({
          ...service,
          selectedMachines: parseMachines(service.EquipmentAvail || '')
        }));
        
        setEditedServices(updatedServices);
      }
      
      alert('Reservation approved successfully with machine utilization records');
    } catch (error) {
      console.error('Error during reservation approval:', error);
      alert(`Failed to approve reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
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
                {/* Display machine utilization editor when in machine utilization editing mode */}
                {editingMachineUtilization ? (
                  <MachineUtilization
                    reservationId={localReservation.id}
                    userServices={localReservation.UserServices}
                    onClose={() => setEditingMachineUtilization(false)}
                    onSave={handleMachineUtilizationComplete}
                  />
                ) : editingTimes ? (
                  <TimeEditor
                    utilTimes={localReservation.UtilTimes}
                    serviceRates={getServiceRates()}
                    onSave={handleSaveTimeChanges}
                    onCancel={() => setEditingTimes(false)}
                  />
                ) : (
                  <>
                    {/* Using the updated ReservationDetailsTab component with hideRequiresEquipment prop */}
                    <ReservationDetailsTab 
                      reservation={localReservation}
                      machines={machines}
                      editMode={editMode}
                      validationError={validationError}
                      onUpdateService={handleUpdateService}
                      hideRequiresEquipment={true}
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
                    
                    <Separator />
  
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Pricing Information</h3>
                      <CostBreakdown 
                        userServices={editedServices.length > 0 ? editedServices : localReservation.UserServices} 
                        totalAmountDue={localReservation.TotalAmntDue}
                        reservationId={localReservation.id}
                        allowFix={!editMode && !isEditingDisabled(localReservation.Status)}
                      />
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
                {localReservation && !editingTimes && !editingMachineUtilization && (
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
                        
                        {/* Special buttons for when status is Ongoing */}
                        {localReservation.Status === 'Ongoing' && !isEditingDisabled(localReservation.Status) && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={attemptEnterTimeEditMode}
                              className="ml-2"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Edit Times
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={attemptEnterMachineUtilizationMode}
                              className="ml-2"
                            >
                              <Database className="h-4 w-4 mr-2" />
                              Edit Util
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Status flow section in the DialogFooter of ReviewReservation component */}
                <div className="flex gap-4">
                  {/* Updated status flow to include "Pending Admin Approval" status */}
                  {(localReservation.Status === 'Pending' || localReservation.Status === 'Pending Admin Approval') && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Rejected')}
                      disabled={isLoading}
                    >
                      Reject Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleApproveReservation}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin mr-2">⊚</span>
                          Processing...
                        </>
                      ) : (
                        'Accept Reservation'
                      )}
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
  
                {localReservation.Status === 'Ongoing' && !editingMachineUtilization && !editingTimes && (
                  <>
                    {/* Add the TimeStatusIndicator right above the buttons */}
                    {hasOngoingTimeSlots(localReservation.UtilTimes) && (
                      <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-amber-50 border-b border-amber-200 rounded-t-lg">
                        <div className="flex items-center text-amber-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            Some time slots are still marked as Ongoing. Update them before proceeding to payment.
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Cancelled')}
                    >
                      Cancel Reservation
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleMarkAsPendingPayment}
                      disabled={hasOngoingTimeSlots(localReservation.UtilTimes)}
                      title={hasOngoingTimeSlots(localReservation.UtilTimes) ? 
                        "All time slots must be marked as Completed or Cancelled first" : 
                        "Mark reservation as ready for payment"}
                    >
                      Mark as Pending Payment
                    </Button>
                  </>
                )}
                  
                  {localReservation.Status === 'Pending Payment' && (
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Paid')}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  
                  {localReservation.Status === 'Paid' && (
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(localReservation.id, 'Completed')}
                    >
                      Mark as Completed
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
}

export default ReviewReservation; 