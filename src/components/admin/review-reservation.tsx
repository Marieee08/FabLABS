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
import { EditIcon, Save, X, Clock, AlertCircle, Database } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReservationDetailsTab from './review-reservation-details';
import TimeEditor from './time-editor';
import MachineUtilization from './machine-utilization';

// Updated interface definitions
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

// This extends the UserService interface to include selectedMachines
interface UserServiceWithMachines extends UserService {
  selectedMachines: SelectedMachine[];
}

// Make sure your ReviewReservationProps interface is defined
interface ReviewReservationProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  selectedReservation: DetailedReservation | null;
  handleStatusUpdate: (id: number, status: string) => void;
}

// Also make sure Machine interface is defined
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
  const isEditingDisabled = (status: string): boolean => {
    const nonEditableStatuses = ['Pending Payment', 'Paid', 'Completed'];
    return nonEditableStatuses.includes(status);
  };

  const isPendingStatus = (status: string): boolean => {
    return status === 'Pending' || status === 'Pending Admin Approval';
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
      setEditingMachineUtilization(false); // Reset machine utilization editing mode
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

  // Debug useEffect 1: Log MachineUtilizations when a reservation is selected
useEffect(() => {
  if (selectedReservation) {
    console.log("Selected reservation MachineUtilizations:", selectedReservation.MachineUtilizations);
    // ...
  }
}, [selectedReservation]);

// Debug useEffect 2: Log when a reservation is approved
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

  // Check if a service requires machines (has associated machines in the database)
  const serviceRequiresMachines = (serviceName: string) => {
    return getMachinesForService(serviceName).length > 0;
  };

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
  
      // For each service, create separate UserService records for each machine
      for (const service of editedServices) {
        // If no machines selected for this service, keep the service as is but clear equipment
        if (service.selectedMachines.length === 0) {
          await fetch(`/api/admin/reservation-review/${localReservation.id}?type=equipment`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: service.id,
              equipment: '',
              cost: service.CostsAvail
            }),
          });
          continue;
        }
        
        // Get the original service to compare
        const originalService = localReservation.UserServices.find(s => s.id === service.id);
        const originalMachines = originalService ? parseMachines(originalService.EquipmentAvail || '') : [];
        
        // Get cost per machine by dividing total cost by number of machines
        const costPerMachine = service.CostsAvail 
          ? parseFloat(service.CostsAvail.toString()) / service.selectedMachines.length 
          : 0;
        
        // Update or create separate UserService records for each machine
        for (const machine of service.selectedMachines) {
          // For the first machine, update the existing service record
          if (machine === service.selectedMachines[0]) {
            await fetch(`/api/admin/reservation-review/${localReservation.id}?type=equipment`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                serviceId: service.id,
                equipment: `${machine.name}:${machine.quantity}`,
                cost: costPerMachine
              }),
            });
          } else {
            // For additional machines, create new UserService records
            await fetch(`/api/admin/reservation-review/${localReservation.id}?type=service`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                serviceAvail: service.ServiceAvail,
                equipment: `${machine.name}:${machine.quantity}`,
                cost: costPerMachine,
                mins: service.MinsAvail
              }),
            });
          }
        }
        
        // Find machines that were removed and should be deleted
        const removedMachines = originalMachines.filter(
          om => !service.selectedMachines.some(sm => sm.name === om.name)
        );
        
        // If there are removed machines, delete the corresponding service records
        if (removedMachines.length > 0 && originalService) {
          for (const machine of removedMachines) {
            // Find the service with this machine (not the first service which we updated)
            const serviceToDelete = localReservation.UserServices.find(s => 
              s.id !== service.id && 
              s.ServiceAvail === service.ServiceAvail && 
              s.EquipmentAvail?.includes(machine.name)
            );
            
            if (serviceToDelete) {
              await fetch(`/api/admin/reservation-review/${localReservation.id}?type=service&serviceId=${serviceToDelete.id}`, {
                method: 'DELETE',
              });
            }
          }
        }
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
  
      // Fetch the updated reservation data
      const fetchResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}`);
      const updatedData = await fetchResponse.json();
      
      // Update the local data with the new services
      const updatedServices = updatedData.UserServices.map((service: UserService) => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setLocalReservation(updatedData);
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

  // Handle completion of machine utilization editing
  const handleMachineUtilizationComplete = () => {
    setEditingMachineUtilization(false);
    // Optionally refresh the reservation data
    // fetchReservationDetails(localReservation.id);
  };

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

  // Attempt to enter machine utilization editing mode with proper validation
  const attemptEnterMachineUtilizationMode = () => {
    if (!localReservation) return;
    
    if (localReservation.Status !== 'Ongoing') {
      alert('Machine utilization can only be updated for ongoing reservations.');
      return;
    }
    
    setEditingMachineUtilization(true);
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
      setEditingMachineUtilization(false); // Also reset machine utilization editing mode
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

// Custom approve function with reliable MachineUtilization creation
const handleApproveReservation = async () => {
  if (!localReservation) return;
  
  // 1. First validate that all required services have machines assigned
  if (!validateRequiredMachines()) {
    return;
  }
  
  try {
    // 2. Set up loading state for better UX
    setIsLoading(true);
    
    // 3. For each UserService, ensure we create a MachineUtilization record
    // We'll work with what's in the database rather than local state to be safe
    const servicesResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}`);
    if (!servicesResponse.ok) {
      throw new Error('Failed to fetch current reservation data');
    }
    
    const currentReservation = await servicesResponse.json();
    const userServices = currentReservation.UserServices || [];
    
    // 4. Create MachineUtilization records for each UserService with a machine
    const creationPromises = userServices.map(async (service: UserService) => {
      // Skip if no equipment
      if (!service.EquipmentAvail || service.EquipmentAvail.trim() === '') {
        return null;
      }
      
      // Extract machine name from EquipmentAvail (format: "MachineName:Quantity")
      const machineName = service.EquipmentAvail.split(':')[0].trim();
      
      // Skip if no machine name
      if (!machineName) {
        return null;
      }
      
      // Create the MachineUtilization record
      try {
        const createResponse = await fetch(`/api/admin/machine-utilization/${localReservation.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            machine: machineName,
            serviceName: service.ServiceAvail,
            machineApproval: false
          }),
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.warn('Skipping machine utilization creation:', errorData.error);
          // We'll continue even if this fails - might be a duplicate
          return null;
        }
        
        return await createResponse.json();
      } catch (error) {
        console.error(`Error creating machine utilization for ${machineName}:`, error);
        // Continue with others even if one fails
        return null;
      }
    });
    
    // Wait for all creation operations to complete
    await Promise.all(creationPromises);
    
    // 5. Now update the status to Approved
    await handleStatusUpdate(localReservation.id, 'Approved');
    
    alert('Reservation approved successfully with machine utilization records');
  } catch (error) {
    console.error('Error during reservation approval:', error);
    alert(`Failed to approve reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsLoading(false);
  }
};

// Add this loading state to component
const [isLoading, setIsLoading] = useState(false);

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
                              Update Usage Times
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
      <Button
        variant="destructive"
        onClick={() => handleStatusUpdate(localReservation.id, 'Cancelled')}
      >
        Cancel Reservation
      </Button>
      <Button
        variant="default"
        onClick={() => handleStatusUpdate(localReservation.id, 'Pending Payment')}
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
};

export default ReviewReservation;