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
  Number?: number | null; // Number of available units
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
  hideRequiresEquipment?: boolean; // Flag to hide "requires equipment" label
  onUpdateTimeStatus?: (updatedTimes: UtilTime[]) => void; // Handler for time status updates
  machineUsageCounts?: {[machineName: string]: number};
}

// Simple time status badge component that hides status for specific reservation statuses
const TimeStatusBadge = ({ status, reservationStatus }: { status: string | null | undefined, reservationStatus: string }) => {
  // Return null (hide the badge) when reservation is in these statuses
  if (
    reservationStatus === 'Pending Admin Approval' ||
    reservationStatus === 'Approved' ||
    reservationStatus === 'Rejected'
  ) {
    return null;
  }
  
  const getStatusBadgeStyle = (): string => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Ongoing":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeStyle()}`}>
      {status || "Ongoing"}
    </span>
  );
};

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
  hideRequiresEquipment = false,
  onUpdateTimeStatus,
  machineUsageCounts: externalMachineUsageCounts
}) => {
  const [servicesWithMachines, setServicesWithMachines] = useState<UserServiceWithMachines[]>([]);
  const [equipmentTexts, setEquipmentTexts] = useState<{[serviceId: string]: string}>({});
  const [internalMachineUsageCounts, setInternalMachineUsageCounts] = useState<{[machineName: string]: number}>({});
  const [editedTimes, setEditedTimes] = useState<UtilTime[]>([]);
  
  // Use external counts if provided, otherwise use internal counts
  const effectiveMachineUsageCounts = externalMachineUsageCounts || internalMachineUsageCounts;
  
  // Time status options
  const statusOptions = [
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" }
  ];

  // Check if status should be hidden based on reservation status
  const shouldHideStatus = 
    reservation.Status === 'Pending Admin Approval' ||
    reservation.Status === 'Approved' ||
    reservation.Status === 'Rejected';

  // Parse machines without quantity
  const parseMachines = (equipmentStr: string): SelectedMachine[] => {
    if (!equipmentStr) return [];
    if (equipmentStr.trim().toLowerCase() === 'not specified') return [];
    
    return equipmentStr.split(',').map(machine => {
      const parts = machine.trim().split(':');
      const name = parts[0].trim();
      if (name.toLowerCase() === 'not specified') return { name: '' };
      return { name };
    }).filter(m => m.name !== '');
  };
  
  // Stringify machines without quantity
  const stringifyMachines = (machines: SelectedMachine[]): string => {
    return machines.map(m => m.name).join(', ');
  };

  // Initialize the services with machines data and calculate machine usage
  useEffect(() => {
    if (reservation) {
      const servicesWithMachines = reservation.UserServices.map(service => {
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

      // Calculate initial machine usage counts only if external counts aren't provided
      if (!externalMachineUsageCounts) {
        const initialUsage: {[machineName: string]: number} = {};
        servicesWithMachines.forEach(service => {
          service.selectedMachines.forEach(machine => {
            initialUsage[machine.name] = (initialUsage[machine.name] || 0) + 1;
          });
        });
        setInternalMachineUsageCounts(initialUsage);
      }
      
      // Initialize time status
      setEditedTimes(reservation.UtilTimes.map(time => ({
        ...time,
        // Set default status if none exists
        DateStatus: time.DateStatus || "Ongoing"
      })));
    }
  }, [reservation, externalMachineUsageCounts]);

  // Find machines that can perform a specific service
  const getMachinesForService = (serviceName: string) => {
    return machines.filter(machine => {
      if (!machine.isAvailable) return false;
      
      // Check if machine provides this service
      return machine.Services.some(service => 
        service.Service.toLowerCase() === serviceName.toLowerCase()
      );
    });
  };

  const serviceRequiresMachines = (serviceName: string) => {
    if (hideRequiresEquipment) return false;
    return getMachinesForService(serviceName).length > 0;
  };

  // Add a machine to a service's selected machines
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
    
    // Update machine usage counts if managing internally
    if (!externalMachineUsageCounts) {
      setInternalMachineUsageCounts(prev => {
        const newCounts = {...prev};
        
        // Decrement count for previously selected machine if any
        if (service.selectedMachines.length > 0) {
          const prevMachine = service.selectedMachines[0].name;
          newCounts[prevMachine] = Math.max((newCounts[prevMachine] || 0) - 1, 0);
        }
        
        // Increment count for newly selected machine
        newCounts[machineName] = (newCounts[machineName] || 0) + 1;
        
        return newCounts;
      });
    }
    
    // Propagate changes to parent component
    onUpdateService(updatedService);
  };

  // Remove a machine from a service's selected machines
  const handleRemoveMachine = (service: UserServiceWithMachines) => {
    // Update machine usage count if managing internally
    if (!externalMachineUsageCounts && service.selectedMachines.length > 0) {
      const oldMachineName = service.selectedMachines[0].name;
      setInternalMachineUsageCounts(prev => ({
        ...prev,
        [oldMachineName]: Math.max(0, (prev[oldMachineName] || 0) - 1)
      }));
    }
    
    const updatedService = {
      ...service,
      selectedMachines: [],
      EquipmentAvail: "Not Specified"
    };
  
    // Update local state
    setServicesWithMachines(prev => 
      prev.map(s => s.id === service.id ? updatedService : s)
    );
    
    // Update equipment texts
    setEquipmentTexts(prev => ({
      ...prev,
      [service.id]: "Not Specified"
    }));
  
    // Update parent component
    onUpdateService(updatedService);
  };

  // Handle manual equipment text changes
  const handleEquipmentTextChange = (service: UserServiceWithMachines, text: string) => {
    const finalText = text.trim() === '' ? 'Not Specified' : text;
    setEquipmentTexts(prev => ({
      ...prev,
      [service.id]: finalText
    }));
    
    // Update machine usage count if managing internally
    if (!externalMachineUsageCounts) {
      // Decrease count for old machines
      service.selectedMachines.forEach(machine => {
        setInternalMachineUsageCounts(prev => ({
          ...prev,
          [machine.name]: Math.max(0, (prev[machine.name] || 0) - 1)
        }));
      });
      
      // Increase count for new machines
      const newMachines = parseMachines(finalText);
      newMachines.forEach(machine => {
        setInternalMachineUsageCounts(prev => ({
          ...prev,
          [machine.name]: (prev[machine.name] || 0) + 1
        }));
      });
    }
    
    const machines = parseMachines(finalText);
    const updatedService = {
      ...service,
      selectedMachines: machines,
      EquipmentAvail: finalText
    };
    
    setServicesWithMachines(prev => 
      prev.map(s => s.id === service.id ? updatedService : s)
    );
    
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
      // Use date-fns format if available, otherwise fallback to toLocaleString
      return format ? format(date, 'MMM d, yyyy h:mm a') : date.toLocaleString();
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

  // Render equipment selection UI based on editMode and component version
  const renderEquipmentSelection = (service: UserServiceWithMachines) => {
    if (!editMode) {
      return (
        <div>
          {service.selectedMachines.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-50 px-2 py-1 rounded-lg text-sm">
                {service.selectedMachines[0].name}
              </span>
            </div>
          ) : (
            <p className="italic text-gray-500">
              Not assigned
            </p>
          )}
        </div>
      );
    }

    // For second version of the component (using shadcn/ui Select)
    return (
      <div>
        <Select 
          value={service.selectedMachines.length > 0 ? service.selectedMachines[0].name : "none"}
          onValueChange={(value) => {
            if (value && value !== "none") {
              handleAddMachine(service, value);
            } else {
              handleRemoveMachine(service);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {getMachinesForService(service.ServiceAvail)
              .map(machine => {
                const currentUsage = effectiveMachineUsageCounts[machine.Machine] || 0;
                const machineCount = machine.Number || 1;
                const remaining = machineCount - currentUsage;
                
                // If this machine is already selected for this service, 
                // it should be selectable regardless of remaining count
                const isCurrentlySelected = service.selectedMachines.some(m => m.name === machine.Machine);
                const adjustedRemaining = isCurrentlySelected ? remaining + 1 : remaining;
                
                return (
                  <SelectItem 
                    key={machine.id} 
                    value={machine.Machine}
                    disabled={!isCurrentlySelected && adjustedRemaining <= 0}
                  >
                    {machine.Machine} {adjustedRemaining > 0 ? `(${adjustedRemaining} available)` : '(unavailable)'}
                  </SelectItem>
                );
              })
            }
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Render schedule items with status conditional visibility
  const renderScheduleItems = () => {
    const timesToRender = editedTimes.length > 0 ? editedTimes : reservation.UtilTimes;
    
    if (timesToRender.length === 0) {
      return <p className="text-gray-500 italic">No schedules available</p>;
    }

    // Enhanced time slots version with status control
    if (onUpdateTimeStatus) {
      return (
        <div className="space-y-4">
          {timesToRender.map((time, index) => {
            const formattedDate = time.StartTime 
              ? format(new Date(time.StartTime), 'MMMM d, yyyy')
              : 'Date not set';
            
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${shouldHideStatus ? 'bg-gray-50 border-gray-200' : getTimeSlotBgColor(time.DateStatus)}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Time Slot {index + 1}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(time.StartTime)} - {formatDateTime(time.EndTime)}
                    </p>
                  </div>
                  <div>
                    {/* Only show status controls when not in the restricted statuses */}
                    {!shouldHideStatus && editMode && reservation.Status === 'Ongoing' ? (
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
                    ) : !shouldHideStatus ? (
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
        </div>
      );
    }
    
    // Simple time slot display with badge
    return (
      <div className="space-y-2">
        {timesToRender.map((time, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
            <div>
              <p><span className="text-gray-600">Day {time.DayNum || index + 1}:</span></p>
              <p className="ml-4">Start: {formatDateTime(time.StartTime)}</p>
              <p className="ml-4">End: {formatDateTime(time.EndTime)}</p>
            </div>
            <div className="pt-1">
              {/* Only show status badge when not in the restricted statuses */}
              {!shouldHideStatus && (
                <TimeStatusBadge status={time.DateStatus} reservationStatus={reservation.Status} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
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
                  <p className="font-medium flex items-center">
                    {service.ServiceAvail}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Equipment</label>
                  {renderEquipmentSelection(service)}
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
        {renderScheduleItems()}
      </div>
    </div>
  );
};

export default ReservationDetailsTab;