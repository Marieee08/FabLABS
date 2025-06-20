import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  hideRequiresEquipment?: boolean;
}

// Simple time status badge component that only shows when reservation is Ongoing
const TimeStatusBadge = ({ status, reservationStatus }: { status: string | null | undefined, reservationStatus: string }) => {
  if (reservationStatus !== 'Ongoing') return null;
  
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
  hideRequiresEquipment = false
}) => {
  const [servicesWithMachines, setServicesWithMachines] = useState<UserServiceWithMachines[]>([]);
  const [equipmentTexts, setEquipmentTexts] = useState<{[serviceId: string]: string}>({});
  const [machineUsageCounts, setMachineUsageCounts] = useState<{[machineName: string]: number}>({});

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

      // Calculate initial machine usage counts
      const initialUsage: {[machineName: string]: number} = {};
      servicesWithMachines.forEach(service => {
        service.selectedMachines.forEach(machine => {
          initialUsage[machine.name] = (initialUsage[machine.name] || 0) + 1;
        });
      });
      setMachineUsageCounts(initialUsage);
    }
  }, [reservation]);

  // Find machines that can perform a specific service and check their availability
  const getMachinesForService = (serviceName: string) => {
    return machines.filter(machine => {
      if (!machine.isAvailable) return false;
      
      // Check if machine provides this service
      const providesService = machine.Services.some(service => 
        service.Service.toLowerCase() === serviceName.toLowerCase()
      );
      
      if (!providesService) return false;
      
      // Check if machine has available units
      const currentUsage = machineUsageCounts[machine.Machine] || 0;
      const machineCount = machine.Number || 1; // Default to 1 if Number is not specified
      
      return currentUsage < machineCount;
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
    
    // Update machine usage counts
    setMachineUsageCounts(prev => {
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
    
    // Propagate changes to parent component
    onUpdateService(updatedService);
  };

  // Remove a machine from a service's selected machines
  const handleRemoveMachine = (service: UserServiceWithMachines, machineName: string) => {
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
    
    // Update machine usage counts
    setMachineUsageCounts(prev => {
      const newCounts = {...prev};
      newCounts[machineName] = Math.max((newCounts[machineName] || 0) - 1, 0);
      return newCounts;
    });
    
    // Propagate changes to parent component
    onUpdateService(updatedService);
  };

  const handleEquipmentTextChange = (service: UserServiceWithMachines, text: string) => {
    const finalText = text.trim() === '' ? 'Not Specified' : text;
    setEquipmentTexts(prev => ({
      ...prev,
      [service.id]: finalText
    }));
    
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

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending Teacher Approval': 'bg-amber-100 text-amber-800',
      'Pending Admin Approval': 'bg-orange-100 text-orange-800',
      Approved: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-red-100 text-red-800',
      'Pending payment': 'bg-yellow-100 text-yellow-800',
      Paid: 'bg-emerald-100 text-emerald-800',
      Ongoing: 'bg-indigo-100 text-indigo-800',
      Survey: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateTimeStr: string | null): string => {
    if (!dateTimeStr) return 'Not set';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
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
                  <p className="font-medium flex items-center">
                    {service.ServiceAvail}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Equipment</label>
                  {editMode ? (
                    <div className="space-y-2">
                      {service.selectedMachines.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          <div className="bg-blue-100 px-2 py-1 rounded-lg flex items-center text-sm">
                            <span className="mr-2">{service.selectedMachines[0].name}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveMachine(service, service.selectedMachines[0].name)}
                              className="text-blue-700 hover:text-blue-900"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="italic text-sm mb-2 text-gray-500">
                          No equipment assigned
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <select 
                          className="w-full border rounded px-2 py-1 text-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddMachine(service, e.target.value);
                              e.target.value = ''; // Reset the dropdown
                            }
                          }}
                          value=""
                        >
                          <option value="">Select equipment...</option>
                          {getMachinesForService(service.ServiceAvail)
                            .map(machine => {
                              const currentUsage = machineUsageCounts[machine.Machine] || 0;
                              const machineCount = machine.Number || 1;
                              const remaining = machineCount - currentUsage;
                              
                              return (
                                <option 
                                  key={machine.id} 
                                  value={machine.Machine}
                                  disabled={remaining <= 0}
                                >
                                  {machine.Machine} {remaining > 0 ? `(${remaining} available)` : '(unavailable)'}
                                </option>
                              );
                            })
                          }
                        </select>
                      </div>
                    </div>
                  ) : (
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
        <div className="space-y-2">
          {reservation.UtilTimes.map((time, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
              <div>
                <p><span className="text-gray-600">Day {time.DayNum || index + 1}:</span></p>
                <p className="ml-4">Start: {formatDateTime(time.StartTime)}</p>
                <p className="ml-4">End: {formatDateTime(time.EndTime)}</p>
              </div>
              <div className="pt-1">
                <TimeStatusBadge status={time.DateStatus} reservationStatus={reservation.Status} />
              </div>
            </div>
          ))}
          {reservation.UtilTimes.length === 0 && (
            <p className="text-gray-500 italic">No schedules available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsTab;