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
import { downloadMachineUtilPDF } from "@/components/admin-functions/pdf/machine-utilization-pdf";
import CostBreakdown from './cost-breakdown'; // Import the new CostBreakdown component
import { toast } from 'sonner';
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

interface Service {
  id: string;
  Service: string;
  Costs: number | string | null;
  Icon?: string | null;
  Info?: string | null;
  Per?: string | null;
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
  const [editingMachineUtilization, setEditingMachineUtilization] = useState(false);
  const [editedServices, setEditedServices] = useState<UserServiceWithMachines[]>([]);
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>([]);
  const [comments, setComments] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
<<<<<<< Updated upstream
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>([]);
=======
  const [machineUsageCounts, setMachineUsageCounts] = useState<{[machineName: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [servicePricing, setServicePricing] = useState<ServicePricing[]>([]);

  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    action: '',
    message: '',
    onConfirm: () => {},
  });

  // Helper function to show confirmation dialog
  const showConfirmation = (action: string, message: string, onConfirm: () => void) => {
    setConfirmationDialog({
      isOpen: true,
      action,
      message,
      onConfirm,
    });
  };

  // Status change handlers with confirmation dialogs
  const handleMarkAsOngoing = () => {
    if (!localReservation) return;

    // Check if any service requires machines but doesn't have them assigned
    const hasUnassignedRequiredMachines = editedServices.some(service => {
      const requiresMachines = serviceRequiresMachines(service.ServiceAvail);
      const hasMachinesAssigned = service.selectedMachines.length > 0;
      return requiresMachines && !hasMachinesAssigned;
    });

    if (hasUnassignedRequiredMachines) {
      // Show modal instead of confirmation dialog
      setConfirmationDialog({
        isOpen: true,
        action: 'Assign Machines',
        message: 'Please assign machines to all required services before marking as Ongoing.',
        onConfirm: () => {} // Empty function since we just want to show a message
      });
      return;
    }

    // Proceed with original confirmation if machines are assigned
    showConfirmation(
      'Mark as Ongoing',
      'Are you sure you want to mark this reservation as Ongoing? This will start the utilization process.',
      () => handleStatusUpdate(localReservation.id, 'Ongoing')
    );
  };

  const handleMarkAsPendingPayment = () => {
    if (!localReservation) return;
    // Check if all UtilTimes are marked as Completed or Cancelled
    const incompleteTimes = localReservation.UtilTimes.filter(
      time => time.DateStatus !== "Completed" && time.DateStatus !== "Cancelled"
    );
    
    if (incompleteTimes.length > 0) {
      toast.error("Cannot proceed to payment", {
        description: `${incompleteTimes.length} time slot(s) are not yet marked as Completed or Cancelled. 
        Please review and update all time slots before proceeding.`,
        duration: 5000
      });
      return;
    }
    
    showConfirmation(
      'Mark as Pending Payment',
      'Are you sure you want to mark this reservation as Pending Payment? This will notify the client to proceed with payment.',
      () => handleStatusUpdate(localReservation.id, 'Pending Payment')
    );
  };

  const handleMarkAsCompleted = () => {
    if (!localReservation) return;
    showConfirmation(
      'Mark as Completed',
      'Are you sure you want to mark this reservation as Completed? This will finalize the process.',
      () => handleStatusUpdate(localReservation.id, 'Completed')
    );
  };

  const handleAcceptReservation = () => {
    if (!localReservation) return;
    showConfirmation(
      'Accept Reservation',
      'Are you sure you want to accept this reservation? This will approve the request and notify the client.',
      handleApproveReservation
    );
  };

  const handleRejectReservation = () => {
    if (!localReservation) return;
    showConfirmation(
      'Reject Reservation',
      'Are you sure you want to reject this reservation? This action cannot be undone.',
      () => handleStatusUpdate(localReservation.id, 'Rejected')
    );
  };

  const handleCancelReservation = () => {
    if (!localReservation) return;
    showConfirmation(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation? This action cannot be undone.',
      () => handleStatusUpdate(localReservation.id, 'Cancelled')
    );
  };
  
>>>>>>> Stashed changes
  const isEditingDisabled = (status: string): boolean => {
    const nonEditableStatuses = ['Pending Payment', 'Paid', 'Completed'];
    return nonEditableStatuses.includes(status);
  };
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [services, setServices] = useState<ServicePricing[]>([]);

  const isPendingStatus = (status: string): boolean => {
    return status === 'Pending' || status === 'Pending Admin Approval';
  };

  const parseMachines = (equipmentStr: string): SelectedMachine[] => {
    // Return empty array for empty or null strings
    if (!equipmentStr || equipmentStr.trim() === '') {
      return [];
    }
    
    // If the entire string is just "Not Specified" (case insensitive), return empty array
    if (equipmentStr.trim().toLowerCase() === 'not specified') {
      return [];
    }
    
    return equipmentStr
      .split(',')
      .map(machine => {
        // Split by colon to handle legacy data that might have quantities
        const parts = machine.trim().split(':');
        const name = parts[0].trim();
        
        // Skip empty names or "Not Specified" values
        if (name === '' || name.toLowerCase() === 'not specified') {
          return { name: '' };
        }
        
        return { name };
      })
      .filter(m => m.name !== ''); // Filter out any empty machine names
  };

  // Convert the array of machine objects back to a comma-separated string
  const stringifyMachines = (machines: SelectedMachine[]): string => {
    return machines.map(m => m.name).join(', ');
  };

  const handleGeneratePDF = () => {
    if (!localReservation || !localReservation.MachineUtilizations || localReservation.MachineUtilizations.length === 0) {
      toast.error('No machine utilization data to generate PDF');
      return;
    }
  
    // Transform each machine utilization to the PDF format
    localReservation.MachineUtilizations.forEach((machineUtil) => {
      const pdfData = {
        id: machineUtil.id || localReservation.id,
        Machine: machineUtil.Machine || 'Unknown Machine',
        ReviewedBy: machineUtil.ReviwedBy || 'Unknown',
        ServiceName: machineUtil.ServiceName || 'Unspecified',
        OperatingTimes: (machineUtil.OperatingTimes || []).map(ot => ({
          OTDate: ot.OTDate,
          OTTypeofProducts: ot.OTTypeofProducts || '',
          OTStartTime: ot.OTStartTime || '',
          OTEndTime: ot.OTEndTime || '',
          OTMachineOp: ot.OTMachineOp || ''
        })),
        DownTimes: (machineUtil.DownTimes || []).map(dt => ({
          DTDate: dt.DTDate,
          DTTypeofProducts: dt.DTTypeofProducts || '',
          DTTime: dt.DTTime || 0,
          Cause: dt.Cause || '',
          DTMachineOp: dt.DTMachineOp || ''
        })),
        RepairChecks: (machineUtil.RepairChecks || []).map(rc => ({
          RepairDate: rc.RepairDate,
          Service: rc.Service || '',
          Duration: rc.Duration || 0,
          RepairReason: rc.RepairReason || '',
          PartsReplaced: rc.PartsReplaced || '',
          RPPersonnel: rc.RPPersonnel || ''
        }))
      };
  
      // Generate PDF for each machine
      downloadMachineUtilPDF(pdfData);
    });
  };

  // Update local state when selected reservation changes
  useEffect(() => {
    if (selectedReservation) {
      console.log("selectedReservation received in ReviewReservation:", selectedReservation);
      
      setLocalReservation(selectedReservation);
      
      // Make sure UserServices exists and is an array before mapping
      if (selectedReservation.UserServices && Array.isArray(selectedReservation.UserServices)) {
        // Convert each service to include an array of selected machines with quantities
        const servicesWithMachines = selectedReservation.UserServices.map(service => {
          console.log("Processing service:", service);
          return {
            ...service,
            selectedMachines: parseMachines(service.EquipmentAvail || '')
          };
        });
        
        setEditedServices(servicesWithMachines);
      } else {
        setEditedServices([]);
      }
      
      // Initialize editedTimes with the selected reservation's UtilTimes
      if (selectedReservation.UtilTimes && Array.isArray(selectedReservation.UtilTimes)) {
        setEditedTimes(selectedReservation.UtilTimes.map(time => ({
          ...time,
          DateStatus: time.DateStatus || "Ongoing"
        })));
      } else {
        setEditedTimes([]);
      }
      
      setComments(selectedReservation.Comments || '');
      setEditMode(false);
      setEditingMachineUtilization(false);
      setValidationError(null);
      setHasUnsavedChanges(false);
    } else {
      console.log("selectedReservation is null or undefined");
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

  useEffect(() => {
    // Calculate initial machine usage counts
    const initialUsage: {[machineName: string]: number} = {};
    editedServices.forEach(service => {
      service.selectedMachines.forEach(machine => {
        initialUsage[machine.name] = (initialUsage[machine.name] || 0) + 1;
      });
    });
    setMachineUsageCounts(initialUsage);
  }, [editedServices]);

  useEffect(() => {
    const fetchServicePricing = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch service pricing');
        const data = await response.json();
        setServicePricing(data);
      } catch (error) {
        console.error('Error fetching service pricing:', error);
      }
    };
    fetchServicePricing();
  }, []);

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

  // Handle time status updates from ReservationDetailsTab component
  const handleUpdateTimeStatus = (updatedTimes: UtilTime[]) => {
    setEditedTimes(updatedTimes);
    setHasUnsavedChanges(true);
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
      // Start loading state
      setIsLoading(true);
      
      // Calculate total amount due
      const totalAmount = editedServices.reduce((sum, service) => {
        const serviceCost = service.CostsAvail ? parseFloat(service.CostsAvail.toString()) : 0;
        return sum + serviceCost;
      }, 0);
  
      // Create an array to store all promises
      const updatePromises = [];
  
      // For each service, update the equipment information without quantities
      for (const service of editedServices) {
        // Determine equipment value - if no machines selected, use "Not Specified"
        const equipmentValue = service.selectedMachines.length === 0 
          ? 'Not Specified' 
          : service.selectedMachines[0].name;
        
        // Add the API call to our promises array (but don't await it yet)
        updatePromises.push(
          fetch(`/api/admin/reservation-review/${localReservation.id}?type=equipment`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceId: service.id,
              equipment: equipmentValue,
              cost: service.CostsAvail
            }),
          })
        );
      }
  
      // Update time statuses if there are changes
      if (editedTimes.length > 0) {
        updatePromises.push(
          fetch(`/api/admin/reservation-update-times/${localReservation.id}?updateStatusOnly=true`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              utilTimes: editedTimes
            }),
          })
        );
      }
  
      // Wait for all updates to complete
      await Promise.all(updatePromises);
  
      // Now save comments and total amount
      await fetch(`/api/admin/reservation-review/${localReservation.id}?type=comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments: comments,
          totalAmount: totalAmount
        }),
      });
  
      // Fetch the updated reservation data
      const fetchResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}`);
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch updated reservation data');
      }
      
      const updatedData = await fetchResponse.json();
      
      // Update the local data
      setLocalReservation(updatedData);
      
      // Update the edited services with the latest data
      const updatedServices = updatedData.UserServices.map((service) => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setEditedServices(updatedServices);
      
      // Update edited times with the latest data
      setEditedTimes(updatedData.UtilTimes.map(time => ({
        ...time,
        DateStatus: time.DateStatus || "Ongoing"
      })));
      
      setEditMode(false);
      setHasUnsavedChanges(false);
      toast.success('Changes saved successfully');
      
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

=======
>>>>>>> Stashed changes
  // Handle completion of machine utilization editing
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
      setEditedTimes(selectedReservation.UtilTimes.map(time => ({
        ...time,
        DateStatus: time.DateStatus || "Ongoing"
      })));
      setComments(selectedReservation.Comments || '');
      setEditMode(false);
      setEditingMachineUtilization(false);
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

  const handleUpdateTimeStatus = (updatedTimes: UtilTime[]) => {
    setEditedTimes(updatedTimes);
    setHasUnsavedChanges(true);
  };

  // Track changes to comments
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(e.target.value);
    setHasUnsavedChanges(true);
  };

  // handleApproveReservation function
  const handleApproveReservation = async () => {
    if (!localReservation) return;
    
    console.log("Starting approval process for reservation:", localReservation.id);
    
    // 1. First validate that all required services have machines assigned
    if (!validateRequiredMachines()) {
      console.log("Machine validation failed");
      return;
    }
    
    try {
      // 2. Set up loading state for better UX
      setIsLoading(true);
      
      // Log services and machine selections
      console.log("Services with machines:", editedServices.filter(s => s.selectedMachines.length > 0).length);
      
      // 3. Prepare the operating times from UtilTimes
      const operatingTimes = localReservation.UtilTimes.map(time => {
        // Convert the StartTime and EndTime to proper format for operating times
        let startTime = null;
        let endTime = null;
        
        // Handle conversion of date strings or objects to proper format
        if (time.StartTime) {
          startTime = typeof time.StartTime === 'string' 
            ? time.StartTime 
            : new Date(time.StartTime).toISOString();
        }
        
        if (time.EndTime) {
          endTime = typeof time.EndTime === 'string' 
            ? time.EndTime 
            : new Date(time.EndTime).toISOString();
        }
        
        // Create a standard operating time object
        return {
          OTDate: startTime ? new Date(startTime).toISOString().split('T')[0] : null,
          OTStartTime: startTime,
          OTEndTime: endTime,
          OTTypeofProducts: localReservation.BulkofCommodity || "Not specified",
          OTMachineOp: null // This will be filled in later by machine operators
        };
      });
      
      // 4. For each UserService with valid equipment, prepare MachineUtilization records
      const machineUtilizations = editedServices
        .filter(service => {
          // Check if service has at least one machine
          if (service.selectedMachines.length === 0) {
            return false;
          }
          
          // Check if first machine has a valid name (not empty and not "Not Specified")
          const machineName = service.selectedMachines[0].name.trim();
          return machineName !== '' && 
                machineName.toLowerCase() !== 'not specified';
        })
        .map(service => ({
          Machine: service.selectedMachines[0].name, // Just the machine name
          ReviewedBy: null,  // This will be filled in later when reviewed
          MachineApproval: false,
          DateReviewed: null,
          ServiceName: service.ServiceAvail,
          // Add the operating times from the reservation's UtilTimes
          OperatingTimes: operatingTimes,
          DownTimes: [],     // Empty arrays for now, will be filled later
          RepairChecks: []
        }));
      
      console.log("Machine utilizations to create:", machineUtilizations.length);
      
      // 5. Create all machine utilization records in a single API call - only if there are any
      if (machineUtilizations.length > 0) {
        console.log("Calling machine utilization API");
        const response = await fetch(`/api/admin/machine-utilization/${localReservation.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(machineUtilizations)
        });
        
        const responseData = await response.json();
        console.log("API response status:", response.status);
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to create machine utilization records');
        }
      } else {
        console.log("No valid machine utilizations to create");
      }
      
      // 6. Now update the status to Approved
      console.log("Updating status to Approved");
      await handleStatusUpdate(localReservation.id, 'Approved');
    
      // 7. Send approval email notification
      console.log("Sending email notification");
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
        
        console.log("Email API response status:", emailResponse.status);
        
        if (!emailResponse.ok) {
          const emailErrorText = await emailResponse.text();
          console.warn('Email notification failed to send:', emailErrorText);
        } else {
          console.log('Approval email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // We don't want to fail the whole approval process if just the email fails
      }
      
      // 8. Fetch the updated reservation data to ensure we have the latest MachineUtilizations
      console.log("Fetching updated reservation data");
      const updatedResponse = await fetch(`/api/admin/reservation-review/${localReservation.id}`);
      console.log("Updated data API response status:", updatedResponse.status);
      
      if (updatedResponse.ok) {
        const updatedReservation = await updatedResponse.json();
        console.log("Updated reservation data received");
        
        setLocalReservation(updatedReservation);
        
        // Update the edited services with the latest data
        const updatedServices = updatedReservation.UserServices.map((service) => ({
          ...service,
          selectedMachines: parseMachines(service.EquipmentAvail || '')
        }));
        
        setEditedServices(updatedServices);
        setEditedTimes(updatedReservation.UtilTimes.map(time => ({
          ...time,
          DateStatus: time.DateStatus || "Ongoing"
        })));
      } else {
        console.error("Failed to fetch updated reservation data");
      }
      
      toast.success('Reservation approved successfully with machine utilization records and operating times');
      console.log("Approval process complete");
    } catch (error) {
      console.error('Error during reservation approval:', error);
      toast.error(`Failed to approve reservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
                    ) : (
                      <>
                        <ReservationDetailsTab 
                          reservation={localReservation}
                          machines={machines}
                          editMode={editMode}
                          validationError={null}
                          onUpdateService={handleUpdateService}
                          machineUsageCounts={machineUsageCounts}
                          onUpdateTimeStatus={handleUpdateTimeStatus}
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

                        {!editingMachineUtilization && (
        <CostBreakdown 
          userServices={localReservation.UserServices}
          totalAmountDue={localReservation.TotalAmntDue}
          machineUtilizations={localReservation.MachineUtilizations || []}
          reservationId={localReservation.id}
          allowFix={true}
          reservationStatus={localReservation.Status} // Make sure to pass the status
          servicePricing={servicePricing}
        />
      )}
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
                <div className="w-full flex flex-col">
                  {validationError && (
                    <Alert variant="destructive" className="mb-4 w-full">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex w-full justify-between">
                    {localReservation && !editingMachineUtilization && (
                      <div className="flex gap-2">
                        {editMode ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleCancelEdit}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="animate-spin mr-2">⊚</span>
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Cancel
                            </Button>
                            <Button 
                              variant="default" 
                              onClick={handleSaveChanges}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="animate-spin mr-2">⊚</span>
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Only show edit buttons if reservation is not in a non-editable state */}
                            {!isEditingDisabled(localReservation.Status) && localReservation.Status !== 'Rejected' && (
                              <Button 
                                variant="outline" 
                                onClick={attemptEnterEditMode}
                              >
                                <EditIcon className="h-4 w-4 mr-2" />
                                Edit Details
                              </Button>
                            )}
                            
                            {/* Special button for machine utilization when status is Ongoing */}
                            {localReservation.Status === 'Ongoing' && !isEditingDisabled(localReservation.Status) && (
                              <Button 
                                variant="outline" 
                                onClick={attemptEnterMachineUtilizationMode}
                                className="ml-2"
                              >
                                <Database className="h-4 w-4 mr-2" />
                                Edit Util
                              </Button>
                            )}
                          </>
                        )}
                        {localReservation.Status === 'Completed' && (
                          <Button 
                            variant="outline" 
                            onClick={handleGeneratePDF}
                            className="ml-2"
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Status flow section in the DialogFooter */}
                    <div className="flex gap-4">
                      {(localReservation.Status === 'Pending' || localReservation.Status === 'Pending Admin Approval') && (
                        <>
                          <Button
                            variant="destructive"
                            onClick={handleRejectReservation}
                            disabled={isLoading}
                          >
                            Reject Reservation
                          </Button>
                          <Button
                            variant="default"
                            onClick={handleAcceptReservation}
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
                            onClick={handleCancelReservation}
                          >
                            Cancel Reservation
                          </Button>
                          <Button
                            variant="default"
                            onClick={handleMarkAsOngoing}
                          >
                            Mark as Ongoing
                          </Button>
                        </>
                      )}
  
                      {localReservation.Status === 'Ongoing' && !editingMachineUtilization && (
                        <Button
                          variant="default"
                          onClick={handleMarkAsPendingPayment}
                        >
                          Mark as Pending Payment
                        </Button>
                      )}
                      
                      {localReservation.Status === 'Pending Payment' && (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                          <span className="text-sm text-amber-700">Payment status is managed by the cashier</span>
                        </div>
                      )}
                      
                      {localReservation.Status === 'Paid' && (
                        <Button
                          variant="default"
                          onClick={handleMarkAsCompleted}
                        >
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  </div>
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
  
        <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => setConfirmationDialog(prev => ({...prev, isOpen: open}))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm {confirmationDialog.action}</DialogTitle>
              <DialogDescription>{confirmationDialog.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmationDialog(prev => ({...prev, isOpen: false}))}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={() => {
                  confirmationDialog.onConfirm();
                  setConfirmationDialog(prev => ({...prev, isOpen: false}));
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
};

export default ReviewReservation;