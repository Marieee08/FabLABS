import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';
import { Alert, AlertDescription, AlertCircle } from "@/components/ui/alert";

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

// Structure for selected machine with quantity
interface SelectedMachine {
  name: string;
  quantity: number;
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
}

// Simple time status badge component
const TimeStatusBadge = ({ status }: { status: string | null | undefined }) => {
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

const ReservationDetailsTab: React.FC<ReservationDetailsTabProps> = ({
  reservation,
  machines,
  editMode,
  validationError,
  onUpdateService,
  hideRequiresEquipment = false // Default to false for backward compatibility
}) => {
  const [servicesWithMachines, setServicesWithMachines] = useState<UserServiceWithMachines[]>([]);
  // New state for tracking equipment text input for direct editing
  const [equipmentTexts, setEquipmentTexts] = useState<{[serviceId: string]: string}>({});

  const parseMachines = (equipmentStr: string): SelectedMachine[] => {
    if (!equipmentStr) return [];
    
    return equipmentStr.split(',').map(machine => {
      const parts = machine.trim().split(':');
      const name = parts[0].trim();
      // Always use quantity of 1
      const quantity = 1;
      
      return { name, quantity };
    }).filter(m => m.name !== '');
  };
  
  const stringifyMachines = (machines: SelectedMachine[]): string => {
    return machines.map(m => `${m.name}:${m.quantity}`).join(', ');
  };

  // Initialize the services with machines data
  useEffect(() => {
    if (reservation) {
      const servicesWithMachines = reservation.UserServices.map(service => ({
        ...service,
        selectedMachines: parseMachines(service.EquipmentAvail || '')
      }));
      
      setServicesWithMachines(servicesWithMachines);
      
      // Initialize the equipment text inputs
      const initialTexts: {[serviceId: string]: string} = {};
      servicesWithMachines.forEach(service => {
        initialTexts[service.id] = service.EquipmentAvail || '';
      });
      setEquipmentTexts(initialTexts);
    }
  }, [reservation]);

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
    // Return false if we're hiding the "requires equipment" label
    if (hideRequiresEquipment) return false;
    
    return getMachinesForService(serviceName).length > 0;
  };

  // Get available quantity for a specific machine
  const getAvailableMachineQuantity = (machineName: string): number => {
    const machine = machines.find(m => m.Machine === machineName);
    return machine?.Number || 1;
  };

  // Add a machine to a service's selected machines
  const handleAddMachine = (service: UserServiceWithMachines, machineName: string) => {
    if (!service.selectedMachines.some(m => m.name === machineName)) {
      // Find the machine to get its default number
      const machineObj = machines.find(m => m.Machine === machineName);
      const defaultQuantity = 1; // Start with 1 by default
      
      const updatedMachines = [
        ...service.selectedMachines, 
        { name: machineName, quantity: defaultQuantity }
      ];
      
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
    }
  };

  // Remove a machine from a service's selected machines
  const handleRemoveMachine = (service: UserServiceWithMachines, machineName: string) => {
    const updatedMachines = service.selectedMachines.filter(m => m.name !== machineName);
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

  // Update machine quantity with limit validation
  const handleUpdateMachineQuantity = (service: UserServiceWithMachines, machineName: string, quantity: number) => {
    // Get the maximum available quantity for this machine
    const maxQuantity = getAvailableMachineQuantity(machineName);
    
    // Ensure quantity is within bounds (at least 1, at most maxQuantity)
    const validatedQuantity = Math.min(Math.max(1, quantity), maxQuantity);
    
    const updatedMachines = service.selectedMachines.map(m => 
      m.name === machineName ? { ...m, quantity: validatedQuantity } : m
    );
    
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

  // FIX #2: Handle direct equipment text editing
  const handleEquipmentTextChange = (service: UserServiceWithMachines, text: string) => {
    // Update the equipment text state
    setEquipmentTexts(prev => ({
      ...prev,
      [service.id]: text
    }));
    
    // Parse the text to get the machines array
    const machines = parseMachines(text);
    
    // Create the updated service
    const updatedService = {
      ...service,
      selectedMachines: machines,
      EquipmentAvail: text
    };
    
    // Update local state
    setServicesWithMachines(prev => 
      prev.map(s => s.id === service.id ? updatedService : s)
    );
    
    // Propagate changes to parent component
    onUpdateService(updatedService);
  };

  // FIX #1: Removed handleCostChange function to prevent cost modifications

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
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationError}
          </AlertDescription>
        </Alert>
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
                    {/* FIX #3: Only show "requires equipment" if hideRequiresEquipment is false */}
                    {!hideRequiresEquipment && serviceRequiresMachines(service.ServiceAvail) && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                        Requires Equipment
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Equipment</label>
                  {editMode ? (
                    <div className="space-y-2">
                      {/* Display currently selected machines with quantities and remove button */}
                      {service.selectedMachines.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {service.selectedMachines.map((machine, idx) => {
                            const maxQuantity = getAvailableMachineQuantity(machine.name);
                            return (
                              <div key={idx} className="bg-blue-100 px-2 py-1 rounded-lg flex items-center text-sm">
                                <span className="mr-2">{machine.name}</span>
                                <div className="flex items-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    max={maxQuantity}
                                    value={machine.quantity}
                                    onChange={(e) => handleUpdateMachineQuantity(
                                      service, 
                                      machine.name, 
                                      parseInt(e.target.value) || 1
                                    )}
                                    className="w-16 h-6 text-xs py-0 px-1 mr-2"
                                  />
                                  <span className="text-xs mr-2 text-gray-500">
                                    / {maxQuantity}
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveMachine(service, machine.name)}
                                    className="text-blue-700 hover:text-blue-900"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="italic text-sm mb-2 text-gray-500">
                          No equipment assigned
                        </p>
                      )}
                      
                      {/* Dropdown to add more machines */}
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
                          <option value="">Add equipment...</option>
                          {getMachinesForService(service.ServiceAvail)
                            .filter(machine => !service.selectedMachines.some(m => m.name === machine.Machine)) // Only show machines not already selected
                            .map(machine => (
                              <option key={machine.id} value={machine.Machine}>
                                {machine.Machine} {machine.Number ? `(${machine.Number} available)` : ''}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {service.selectedMachines.length > 0 ? (
  <div className="flex flex-wrap gap-2">
    {service.selectedMachines.map((machine, idx) => (
      <span key={idx} className="bg-blue-50 px-2 py-1 rounded-lg text-sm">
        {machine.name}
      </span>
    ))}
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
                  {/* FIX #1: Changed to display the cost as read-only, even in edit mode */}
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
                <TimeStatusBadge status={time.DateStatus} />
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