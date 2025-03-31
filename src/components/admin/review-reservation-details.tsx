import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
  DateStatus?: string | null;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  UserServices: UserService[];
  UtilTimes: UtilTime[];
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

// Simplified structure for selected machine without quantity
interface SelectedMachine {
  name: string;
}

// Extended service that includes selected machines
interface UserServiceWithMachines extends UserService {
  selectedMachines: SelectedMachine[];
}

interface ReservationDetailsTabProps {
  reservation: DetailedReservation;
  machines: Machine[];
  editMode: boolean;
  validationError: string | null;
  onUpdateService: (updatedService: UserServiceWithMachines) => void;
  hideRequiresEquipment?: boolean; // Added prop to hide "requires equipment" label
  onUpdateTimeStatus?: (updatedTimes: UtilTime[]) => void; // Added prop to handle time status updates
}

// Custom error alert component to avoid issues with AlertCircle
const ErrorAlert = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
    <div className="flex">
      <div className="shrink-0">
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">!</div>
      </div>
      <div className="ml-3">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  </div>
);

const ReservationDetailsTab: React.FC<ReservationDetailsTabProps> = ({
  reservation,
  machines,
  editMode,
  validationError,
  onUpdateService,
  hideRequiresEquipment = false, // Default to false for backward compatibility
  onUpdateTimeStatus
}) => {
  const [servicesWithMachines, setServicesWithMachines] = useState<UserServiceWithMachines[]>([]);
  // State for tracking equipment text input for direct editing
  const [equipmentTexts, setEquipmentTexts] = useState<{[serviceId: string]: string}>({});
  // State for managing time slots
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>([]);
  
  // Time status options
  const statusOptions = [
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" }
  ];

  // Modified to parse machines without quantity
  const parseMachines = (equipmentStr: string): SelectedMachine[] => {
    if (!equipmentStr) return [];
    if (equipmentStr.trim().toLowerCase() === 'not specified') return [];
    
    return equipmentStr.split(',').map(machine => {
      // Split by colon to handle legacy data that might have quantities
      const parts = machine.trim().split(':');
      const name = parts[0].trim();
      
      // Skip "Not Specified" values
      if (name.toLowerCase() === 'not specified') return { name: '' };
      
      return { name };
    }).filter(m => m.name !== '');
  };
  
  // Modified to stringify machines without quantity
  const stringifyMachines = (machines: SelectedMachine[]): string => {
    return machines.map(m => m.name).join(', ');
  };

  // Initialize the services with machines data and time status
  useEffect(() => {
    if (reservation) {
      const servicesWithMachines = reservation.UserServices.map(service => {
        // Default to "Not Specified" if equipment is empty or null
        const equipmentAvail = service.EquipmentAvail || "Not Specified";
        return {
          ...service,
          EquipmentAvail: equipmentAvail,
          selectedMachines: parseMachines(equipmentAvail)
        };
      });
      
      setServicesWithMachines(servicesWithMachines);
      
      // Initialize the equipment text inputs
      const initialTexts: {[serviceId: string]: string} = {};
      servicesWithMachines.forEach(service => {
        initialTexts[service.id] = service.EquipmentAvail || "Not Specified";
      });
      setEquipmentTexts(initialTexts);
      
      // Initialize time status
      setEditedTimes(reservation.UtilTimes.map(time => ({
        ...time,
        // Set default status if none exists
        DateStatus: time.DateStatus || "Ongoing"
      })));
    }
  }, [reservation]);

  // Find machines that can perform a specific service
  const getMachinesForService = (serviceName: string) => {
    return machines.filter(machine => 
      machine.isAvailable && machine.Services.some(service => 
        service.Service.toLowerCase() === serviceName.toLowerCase()
      )
    );
  };

  // Check if a service requires machines
  const serviceRequiresMachines = (serviceName: string) => {
    if (hideRequiresEquipment) return false;
    return getMachinesForService(serviceName).length > 0;
  };

  // Add a machine to a service's selected machines - replacing any existing ones
  const handleAddMachine = (service: UserServiceWithMachines, machineName: string) => {
    // Only allow one machine - replace any existing ones
    const updatedMachines = [{ name: machineName }];
    
    const equipmentStr = stringifyMachines(updatedMachines);
    
    const updatedService = {
      ...service,
      selectedMachines: updatedMachines,
      EquipmentAvail: equipmentStr
    };
    
    // Update local state
    setServicesWithMachines(prev => 
      prev.map(s => s.id === service.id ? updatedService : s)
    );
    
    // Update equipment text state
    setEquipmentTexts(prev => ({
      ...prev,
      [service.id]: equipmentStr
    }));
    
    // Propagate changes to parent component
    onUpdateService(updatedService);
  };

  // Remove a machine from a service's selected machines
  const handleRemoveMachine = (service: UserServiceWithMachines, machineName: string) => {
    // Set to "Not Specified" instead of empty string when removing the last machine
    const equipmentStr = "Not Specified";
    
    const updatedService = {
      ...service,
      selectedMachines: [],
      EquipmentAvail: equipmentStr
    };
    
    // Update local state
    setServicesWithMachines(prev => 
      prev.map(s => s.id === service.id ? updatedService : s)
    );
    
    // Update equipment text state
    setEquipmentTexts(prev => ({
      ...prev,
      [service.id]: equipmentStr
    }));
    
    // Propagate changes to parent component
    onUpdateService(updatedService);
  };

  // Handle status change for a time slot
  const handleStatusChange = (index: number, newStatus: string) => {
    setEditedTimes(prev => {
      const newTimes = [...prev];
      newTimes[index] = {
        ...newTimes[index],
        DateStatus: newStatus
      };
      
      // Propagate changes to parent component if handler provided
      if (onUpdateTimeStatus) {
        onUpdateTimeStatus(newTimes);
      }
      
      return newTimes;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-red-100 text-red-800',
      'Pending payment': 'bg-orange-100 text-orange-800',
      Paid: 'bg-emerald-100 text-emerald-800',
      Ongoing: 'bg-indigo-100 text-indigo-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Format date for display
  const formatDateTime = (dateTimeStr: string | null): string => {
    if (!dateTimeStr) return 'Not set';
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get time slot background color based on status
  const getTimeSlotBgColor = (status: string | null | undefined): string => {
    switch (status) {
      case "Completed":
        return "bg-green-50 border-green-200";
      case "Cancelled":
        return "bg-red-50 border-red-200";
      case "Ongoing":
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {validationError && (
        <ErrorAlert message={validationError} />
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-gray-900">Request Date</h3>
          <p>{new Date(reservation.RequestDate).toLocaleDateString()}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Status</h3>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            getStatusColor(reservation.Status)
          }`}>
            {reservation.Status}
          </span>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-900">Services Information</h3>
        </div>
        <div className="space-y-4">
          {servicesWithMachines.map((service, index) => (
            <div key={index} className="p-3 rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="text-sm text-gray-600">Service</label>
                  <p className="font-medium">{service.ServiceAvail}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Equipment</label>
                  {editMode ? (
                    <div>
                      <Select 
                        value={service.selectedMachines.length > 0 ? service.selectedMachines[0].name : "none"}
                        onValueChange={(value) => {
                          if (value && value !== "none") {
                            handleAddMachine(service, value);
                          } else {
                            handleRemoveMachine(service, "");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {getMachinesForService(service.ServiceAvail)
                            .map(machine => (
                              <SelectItem key={machine.id} value={machine.Machine}>
                                {machine.Machine}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="font-medium">
                      {service.selectedMachines.length > 0 
                        ? service.selectedMachines[0].name 
                        : <span className="italic text-gray-500">Not assigned</span>}
                    </p>
                  )}
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
        <div className="space-y-4">
          {editedTimes.map((time, index) => {
            const formattedDate = time.StartTime 
              ? format(new Date(time.StartTime), 'MMMM d, yyyy')
              : 'Date not set';
            
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${getTimeSlotBgColor(time.DateStatus)}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Time Slot {index + 1}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(time.StartTime)} - {formatDateTime(time.EndTime)}
                    </p>
                  </div>
                  <div>
  {editMode && reservation.Status !== 'Approved' && reservation.Status === 'Ongoing' ? (
    <Select
      value={time.DateStatus || "Ongoing"}
      onValueChange={(value) => handleStatusChange(index, value)}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : reservation.Status !== 'Approved' ? (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      time.DateStatus === "Completed" ? "bg-green-100 text-green-800 border border-green-200" :
      time.DateStatus === "Cancelled" ? "bg-red-100 text-red-800 border border-red-200" :
      "bg-blue-100 text-blue-800 border border-blue-200"
    }`}>
      {time.DateStatus || "Ongoing"}
    </span>
  ) : null}
</div>
                </div>
              </div>
            );
          })}
          {editedTimes.length === 0 && (
            <p className="text-gray-500 italic">No schedules available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsTab;