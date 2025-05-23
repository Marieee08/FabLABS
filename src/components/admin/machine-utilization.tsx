// src/components/admin/machine-utilization.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Trash2, ArrowLeft, Save, Calendar, Clock, AlertTriangle, Wrench, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { downloadMachineUtilPDF } from "@/components/admin-functions/pdf/machine-utilization-pdf";

// Interfaces for machine utilization data
interface OperatingTime {
  id?: number;
  OTDate: string | null;
  OTTypeofProducts: string | null;
  OTStartTime: string | null;
  OTEndTime: string | null;
  OTMachineOp: string | null;
  machineUtilId?: number | null;
  isNew?: boolean;
}

interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null;
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
  isNew?: boolean;
}

interface RepairCheck {
  id?: number;
  RepairDate: string | null;
  Service: string | null;
  Duration: number | null;
  RepairReason: string | null;
  PartsReplaced: string | null;
  RPPersonnel: string | null;
  machineUtilId?: number | null;
  isNew?: boolean;
}

interface MachineUtilization {
  id?: number;
  Machine: string | null;
  ReviewedBy: string | null;
  MachineApproval: boolean | null;
  DateReviewed: string | null;
  ServiceName: string | null;
  utilReqId?: number | null;
  OperatingTimes: OperatingTime[];
  DownTimes: DownTime[];
  RepairChecks: RepairCheck[];
}

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  TotalAmntDue: number | string | null;
  Comments?: string | null;
  BulkofCommodity: string | null;
  UserServices: UserService[];
}

interface MachineUtilizationProps {
  reservationId: number;
  userServices: UserService[];
  onClose: () => void;
  onSave: () => void;
}

const MachineUtilization: React.FC<MachineUtilizationProps> = ({
    reservationId,
    userServices,
    onClose,
    onSave
  }) => {
    const [machineUtilizations, setMachineUtilizations] = useState<MachineUtilization[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
  
    // Fetch machine utilization data on component mount
    useEffect(() => {
      const fetchMachineUtilization = async () => {
        try {
          setLoading(true);
          
          // Check if the API endpoint is accessible
          try {
            const response = await fetch(`/api/admin/machine-utilization/${reservationId}`);
            
            if (!response.ok) {
              throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
              // If no machine utilization records exist, create initial ones from user services
              initializeFromServices();
            } else {
              // Format dates in the received data
              const formattedData = data.map((util: MachineUtilization) => ({
                ...util,
                DateReviewed: util.DateReviewed ? new Date(util.DateReviewed).toISOString().split('T')[0] : null,
                OperatingTimes: util.OperatingTimes.map((ot: OperatingTime) => ({
                  ...ot,
                  OTDate: ot.OTDate ? new Date(ot.OTDate).toISOString().split('T')[0] : null,
                  OTStartTime: ot.OTStartTime ? new Date(ot.OTStartTime).toISOString().split('T')[1].substring(0, 5) : null,
                  OTEndTime: ot.OTEndTime ? new Date(ot.OTEndTime).toISOString().split('T')[1].substring(0, 5) : null,
                })),
                DownTimes: util.DownTimes.map((dt: DownTime) => ({
                  ...dt,
                  DTDate: dt.DTDate ? new Date(dt.DTDate).toISOString().split('T')[0] : null,
                })),
                RepairChecks: util.RepairChecks.map((rc: RepairCheck) => ({
                  ...rc,
                  RepairDate: rc.RepairDate ? new Date(rc.RepairDate).toISOString().split('T')[0] : null,
                }))
              }));

              setMachineUtilizations(formattedData);
            }
          } catch (error) {
            // If API fails, initialize empty data structures
            console.error('API error:', error);
            initializeFromServices();
            setError('API not available. Working in offline mode.');
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error in fetchMachineUtilization:', err);
          setError('Failed to initialize machine utilization data. Please try again.');
          setLoading(false);
        }
      };
  
      // Helper function to initialize data from services when API fails
const initializeFromServices = () => {
  // Extract machine names from the EquipmentAvail field
  const initialUtilizations = userServices.flatMap(service => {
    if (!service.EquipmentAvail || service.EquipmentAvail.trim() === '') {
      return []; // Skip services with no equipment
    }
    
    // Skip if the equipment is just "Not Specified"
    if (service.EquipmentAvail.trim().toLowerCase() === 'not specified') {
      return [];
    }
    
    const machines = service.EquipmentAvail 
      .split(',')
      .map(m => {
        // Split by colon to handle legacy data that might have quantities
        const parts = m.trim().split(':');
        return parts[0].trim();
      })
      .filter(m => m.length > 0 && m.toLowerCase() !== 'not specified');
    
    return machines.map(machine => ({
      Machine: machine,
      ReviewedBy: null,
      MachineApproval: null,
      DateReviewed: null,
      ServiceName: service.ServiceAvail,
      utilReqId: reservationId,
      OperatingTimes: [],
      DownTimes: [],
      RepairChecks: []
    }));
  });

  // If no valid machines found, create a placeholder message (optional)
  if (initialUtilizations.length === 0) {
    console.log('No valid machines found for utilization data');
    // You can choose to not create a placeholder, or create one with an informative message
    // Placeholder option:
    // initialUtilizations.push({
    //   Machine: "No valid machines assigned",
    //   ReviewedBy: null,
    //   MachineApproval: null,
    //   DateReviewed: null,
    //   ServiceName: "Unspecified",
    //   utilReqId: reservationId,
    //   OperatingTimes: [],
    //   DownTimes: [],
    //   RepairChecks: []
    // });
  }

  setMachineUtilizations(initialUtilizations);
};
  
      fetchMachineUtilization();
    }, [reservationId, userServices]);
  
    // Add a new operating time to a machine utilization
    const handleAddOperatingTime = (machineIndex: number) => {
        const newOperatingTime: OperatingTime = {
          OTDate: new Date().toISOString().split('T')[0],
          OTTypeofProducts: "",
          OTStartTime: "09:00",
          OTEndTime: "17:00",
          OTMachineOp: "",
          id: undefined, // Ensure no ID is assigned to new items
          machineUtilId: undefined, // Ensure no machineUtilId is assigned
          isNew: true // Add a flag to distinguish new items
        };
      
        setMachineUtilizations(prev => {
          const updated = [...prev];
          // Use the spread operator to create a new array
          updated[machineIndex] = {
            ...updated[machineIndex],
            OperatingTimes: [...updated[machineIndex].OperatingTimes, newOperatingTime]
          };
          return updated;
        });
      };
  
    // Add a new downtime to a machine utilization
    const handleAddDownTime = (machineIndex: number) => {
        const newDownTime: DownTime = {
          DTDate: new Date().toISOString().split('T')[0],
          DTTypeofProducts: "",
          DTTime: 0,
          Cause: "",
          DTMachineOp: "",
          id: undefined,
          machineUtilId: undefined,
          isNew: true
        };
      
        setMachineUtilizations(prev => {
          const updated = [...prev];
          updated[machineIndex] = {
            ...updated[machineIndex],
            DownTimes: [...updated[machineIndex].DownTimes, newDownTime]
          };
          return updated;
        });
      };
  
    // Add a new repair check to a machine utilization
    const handleAddRepairCheck = (machineIndex: number) => {
        const newRepairCheck: RepairCheck = {
          RepairDate: new Date().toISOString().split('T')[0],
          Service: "",
          Duration: 0,
          RepairReason: "",
          PartsReplaced: "",
          RPPersonnel: "",
          id: undefined,
          machineUtilId: undefined,
          isNew: true
        };
      
        setMachineUtilizations(prev => {
          const updated = [...prev];
          updated[machineIndex] = {
            ...updated[machineIndex],
            RepairChecks: [...updated[machineIndex].RepairChecks, newRepairCheck]
          };
          return updated;
        });
      };
  
      const handleRemoveOperatingTime = (machineIndex: number, otIndex: number) => {
        setMachineUtilizations(prev => {
          const updated = [...prev];
          // Use splice to remove only the specific operating time
          updated[machineIndex] = {
            ...updated[machineIndex],
            OperatingTimes: updated[machineIndex].OperatingTimes.filter((_, index) => index !== otIndex)
          };
          return updated;
        });
      };
      
      const handleRemoveDownTime = (machineIndex: number, dtIndex: number) => {
        setMachineUtilizations(prev => {
          const updated = [...prev];
          // Use filter to remove only the specific down time
          updated[machineIndex] = {
            ...updated[machineIndex],
            DownTimes: updated[machineIndex].DownTimes.filter((_, index) => index !== dtIndex)
          };
          return updated;
        });
      };
      
      const handleRemoveRepairCheck = (machineIndex: number, rcIndex: number) => {
        setMachineUtilizations(prev => {
          const updated = [...prev];
          // Use filter to remove only the specific repair check
          updated[machineIndex] = {
            ...updated[machineIndex],
            RepairChecks: updated[machineIndex].RepairChecks.filter((_, index) => index !== rcIndex)
          };
          return updated;
        });
      };
  
    // Update machine utilization information
    const handleUpdateMachineUtilization = (index: number, field: string, value: any) => {
      setMachineUtilizations(prev => {
        const updated = [...prev];
        (updated[index] as any)[field] = value;
        return updated;
      });
    };
  
    // Update operating time information
    const handleUpdateOperatingTime = (machineIndex: number, otIndex: number, field: string, value: any) => {
      setMachineUtilizations(prev => {
        const updated = [...prev];
        (updated[machineIndex].OperatingTimes[otIndex] as any)[field] = value;
        return updated;
      });
    };
  
    // Update downtime information
    const handleUpdateDownTime = (machineIndex: number, dtIndex: number, field: string, value: any) => {
      setMachineUtilizations(prev => {
        const updated = [...prev];
        (updated[machineIndex].DownTimes[dtIndex] as any)[field] = value;
        return updated;
      });
    };
  
    // Update repair check information
    const handleUpdateRepairCheck = (machineIndex: number, rcIndex: number, field: string, value: any) => {
      setMachineUtilizations(prev => {
        const updated = [...prev];
        (updated[machineIndex].RepairChecks[rcIndex] as any)[field] = value;
        return updated;
      });
    };

    // Handle generating PDF for all machine utilizations
// Update the handleGeneratePDF function in your modal component
const handleGeneratePDF = () => {
  if (machineUtilizations.length === 0) {
    alert('No machine utilization data to generate PDF');
    return;
  }

  // Transform each machine utilization to the PDF format
  machineUtilizations.forEach((machineUtil) => {
    const pdfData = {
      id: machineUtil.id || reservationId,
      Machine: machineUtil.Machine || 'Unknown Machine',
      ReviewedBy: machineUtil.ReviewedBy || 'Unknown',
      ServiceName: machineUtil.ServiceName || 'Unspecified',
      OperatingTimes: machineUtil.OperatingTimes.map(ot => ({
        OTDate: ot.OTDate,
        OTTypeofProducts: ot.OTTypeofProducts || '',
        OTStartTime: ot.OTStartTime || '',
        OTEndTime: ot.OTEndTime || '',
        OTMachineOp: ot.OTMachineOp || ''
      })),
      DownTimes: machineUtil.DownTimes.map(dt => ({
        DTDate: dt.DTDate,
        DTTypeofProducts: dt.DTTypeofProducts || '',
        DTTime: dt.DTTime || 0,
        Cause: dt.Cause || '',
        DTMachineOp: dt.DTMachineOp || ''
      })),
      RepairChecks: machineUtil.RepairChecks.map(rc => ({
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
  
    // Handle saving all machine utilization data
    const handleSaveAll = async () => {
      try {
        setSaving(true);
        
        // Get the current user's name
        // This is a placeholder - replace with your actual method of getting the current admin's name
        const currentUserName = "Admin"; // Replace with actual user name from your auth system
        
        // Get current date for automatic DateReviewed field
        const currentDate = new Date().toISOString();
        
        // Prepare data for submission with safer date handling
        const preparedData = machineUtilizations.map(util => {
          return {
            ...util,
            // Automatically set ReviewedBy to current admin
            ReviewedBy: currentUserName,
            ReviwedBy: currentUserName, // Using the misspelled field name from the schema 
            // Automatically set DateReviewed to now
            DateReviewed: currentDate,
            // Remove MachineApproval
            MachineApproval: null,
            // Process operating times
            OperatingTimes: util.OperatingTimes.map(ot => {
              // Safely process OTDate
              let otDate = null;
              if (ot.OTDate) {
                try {
                  otDate = new Date(ot.OTDate).toISOString();
                } catch (e) {
                  console.warn("Invalid date format for OTDate:", ot.OTDate);
                }
              }
              
              // Safely process start time
              let otStartTime = null;
              if (ot.OTDate && ot.OTStartTime) {
                try {
                  // Make sure the time format is valid (HH:MM)
                  if (/^\d{1,2}:\d{2}$/.test(ot.OTStartTime)) {
                    otStartTime = new Date(`${ot.OTDate}T${ot.OTStartTime}:00`).toISOString();
                  } else {
                    console.warn("Invalid time format for OTStartTime:", ot.OTStartTime);
                  }
                } catch (e) {
                  console.warn("Error combining OTDate and OTStartTime:", ot.OTDate, ot.OTStartTime);
                }
              }
              
              // Safely process end time
              let otEndTime = null;
              if (ot.OTDate && ot.OTEndTime) {
                try {
                  // Make sure the time format is valid (HH:MM)
                  if (/^\d{1,2}:\d{2}$/.test(ot.OTEndTime)) {
                    otEndTime = new Date(`${ot.OTDate}T${ot.OTEndTime}:00`).toISOString();
                  } else {
                    console.warn("Invalid time format for OTEndTime:", ot.OTEndTime);
                  }
                } catch (e) {
                  console.warn("Error combining OTDate and OTEndTime:", ot.OTDate, ot.OTEndTime);
                }
              }
              
              return {
                ...ot,
                OTDate: otDate,
                OTStartTime: otStartTime,
                OTEndTime: otEndTime
              };
            }),
            DownTimes: util.DownTimes.map(dt => {
              // Safely process DTDate
              let dtDate = null;
              if (dt.DTDate) {
                try {
                  dtDate = new Date(dt.DTDate).toISOString();
                } catch (e) {
                  console.warn("Invalid date format for DTDate:", dt.DTDate);
                }
              }
              
              return {
                ...dt,
                DTDate: dtDate
              };
            }),
            RepairChecks: util.RepairChecks.map(rc => {
              // Safely process RepairDate
              let repairDate = null;
              if (rc.RepairDate) {
                try {
                  repairDate = new Date(rc.RepairDate).toISOString();
                } catch (e) {
                  console.warn("Invalid date format for RepairDate:", rc.RepairDate);
                }
              }
              
              return {
                ...rc,
                RepairDate: repairDate
              };
            })
          };
        });

        console.log('Sending data to server:', JSON.stringify(preparedData, null, 2));

        try {
          const response = await fetch(`/api/admin/machine-utilization/${reservationId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(preparedData),
          });

          if (!response.ok) {
            // Try to get more detailed error information
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API responded with status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
          }

          // Get the updated data from the response
          const updatedData = await response.json();
          
          // Update the local state with the data returned from the server
          setMachineUtilizations(updatedData.map((util: MachineUtilization) => ({
            ...util,
            DateReviewed: util.DateReviewed ? new Date(util.DateReviewed).toISOString().split('T')[0] : null,
            OperatingTimes: util.OperatingTimes.map((ot: OperatingTime) => ({
              ...ot,
              OTDate: ot.OTDate ? new Date(ot.OTDate).toISOString().split('T')[0] : null,
              OTStartTime: ot.OTStartTime ? new Date(ot.OTStartTime).toISOString().split('T')[1].substring(0, 5) : null,
              OTEndTime: ot.OTEndTime ? new Date(ot.OTEndTime).toISOString().split('T')[1].substring(0, 5) : null
            })),
            DownTimes: util.DownTimes.map((dt: DownTime) => ({
              ...dt,
              DTDate: dt.DTDate ? new Date(dt.DTDate).toISOString().split('T')[0] : null
            })),
            RepairChecks: util.RepairChecks.map((rc: RepairCheck) => ({
              ...rc,
              RepairDate: rc.RepairDate ? new Date(rc.RepairDate).toISOString().split('T')[0] : null
            }))
          })));

          // Show success message
          setSaving(false);
          alert('Machine utilization data saved successfully');
          onSave(); // Notify parent component that save is complete
        } catch (error) {
          console.error('API Error:', error);
          
          // Let user know we're in offline mode but save appeared successful
          setSaving(false);
          alert('Error saving data: ' + (error instanceof Error ? error.message : String(error)));
        }
      } catch (err) {
        console.error('Error in save operation:', err);
        setError('Failed to save machine utilization data. Please try again.');
        setSaving(false);
      }
    };
  
    if (loading) {
      return <div className="flex justify-center items-center p-8">Loading machine utilization data...</div>;
    }
  
    if (error) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-2" onClick={onClose}>Go Back</Button>
        </Alert>
      );
    }
  
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Machine Utilization</h3>
          
          <Accordion type="multiple" defaultValue={[]}>
            {machineUtilizations.map((machineUtil, machineIndex) => (
              <AccordionItem value={`item-${machineIndex}`} key={machineIndex}>
                <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-lg">
                  <span className="font-medium">{machineUtil.Machine || 'Unnamed Machine'}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Machine</label>
                        <Input 
                          value={machineUtil.Machine || ''} 
                          onChange={(e) => handleUpdateMachineUtilization(machineIndex, 'Machine', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Service</label>
                        <Input 
                          value={machineUtil.ServiceName || ''} 
                          onChange={(e) => handleUpdateMachineUtilization(machineIndex, 'ServiceName', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Operating Times */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Operating Times
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAddOperatingTime(machineIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Time
                        </Button>
                      </div>
                      
                      {machineUtil.OperatingTimes.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No operating times recorded</p>
                      ) : (
                        <div className="space-y-4">
                          {machineUtil.OperatingTimes.map((operatingTime, otIndex) => (
                            <div key={`op-time-${machineIndex}-${otIndex}-${operatingTime.id || 'new'}`} className="bg-blue-50 p-3 rounded-lg relative">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleRemoveOperatingTime(machineIndex, otIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Date</label>
                                  <Input 
                                    type="date"
                                    value={operatingTime.OTDate || ''}
                                    onChange={(e) => handleUpdateOperatingTime(machineIndex, otIndex, 'OTDate', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Type of Products</label>
                                  <Input 
                                    value={operatingTime.OTTypeofProducts || ''}
                                    onChange={(e) => handleUpdateOperatingTime(machineIndex, otIndex, 'OTTypeofProducts', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Start Time</label>
                                  <Input 
                                    type="time"
                                    value={operatingTime.OTStartTime || ''}
                                    onChange={(e) => handleUpdateOperatingTime(machineIndex, otIndex, 'OTStartTime', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">End Time</label>
                                  <Input 
                                    type="time"
                                    value={operatingTime.OTEndTime || ''}
                                    onChange={(e) => handleUpdateOperatingTime(machineIndex, otIndex, 'OTEndTime', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Machine Operator</label>
                                  <Input 
                                    value={operatingTime.OTMachineOp || ''}
                                    onChange={(e) => handleUpdateOperatingTime(machineIndex, otIndex, 'OTMachineOp', e.target.value)}
                                    placeholder="Enter operator name"
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Down Times */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Down Times
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAddDownTime(machineIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Down Time
                        </Button>
                      </div>
                      
                      {machineUtil.DownTimes.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No down times recorded</p>
                      ) : (
                        <div className="space-y-4">
                          {machineUtil.DownTimes.map((downTime, dtIndex) => (
                            <div key={`down-time-${machineIndex}-${dtIndex}-${downTime.id || 'new'}`} className="bg-amber-50 p-3 rounded-lg relative">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleRemoveDownTime(machineIndex, dtIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Date</label>
                                  <Input 
                                    type="date"
                                    value={downTime.DTDate || ''}
                                    onChange={(e) => handleUpdateDownTime(machineIndex, dtIndex, 'DTDate', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Type of Products</label>
                                  <Input 
                                    value={downTime.DTTypeofProducts || ''}
                                    onChange={(e) => handleUpdateDownTime(machineIndex, dtIndex, 'DTTypeofProducts', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Down Time (minutes)</label>
                                  <Input 
                                    type="number"
                                    min="0"
                                    value={downTime.DTTime || 0}
                                    onChange={(e) => handleUpdateDownTime(machineIndex, dtIndex, 'DTTime', parseInt(e.target.value) || 0)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Machine Operator</label>
                                  <Input 
                                    value={downTime.DTMachineOp || ''}
                                    onChange={(e) => handleUpdateDownTime(machineIndex, dtIndex, 'DTMachineOp', e.target.value)}
                                    placeholder="Enter operator name"
                                    className="w-full"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <label className="block text-xs font-medium mb-1">Cause</label>
                                  <Textarea 
                                    value={downTime.Cause || ''}
                                    onChange={(e) => handleUpdateDownTime(machineIndex, dtIndex, 'Cause', e.target.value)}
                                    className="w-full"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Repair Checks */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium flex items-center">
                          <Wrench className="h-4 w-4 mr-2" />
                          Repair Checks
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAddRepairCheck(machineIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Repair
                        </Button>
                      </div>
                      
                      {machineUtil.RepairChecks.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No repair checks recorded</p>
                      ) : (
                        <div className="space-y-4">
                          {machineUtil.RepairChecks.map((repairCheck, rcIndex) => (
                            <div key={`repair-check-${machineIndex}-${rcIndex}-${repairCheck.id || 'new'}`} className="bg-green-50 p-3 rounded-lg relative">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleRemoveRepairCheck(machineIndex, rcIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Repair Date</label>
                                  <Input 
                                    type="date"
                                    value={repairCheck.RepairDate || ''}
                                    onChange={(e) => handleUpdateRepairCheck(machineIndex, rcIndex, 'RepairDate', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Service Type</label>
                                  <Input 
                                    value={repairCheck.Service || ''}
                                    onChange={(e) => handleUpdateRepairCheck(machineIndex, rcIndex, 'Service', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Duration (minutes)</label>
                                  <Input 
                                    type="number"
                                    min="0"
                                    value={repairCheck.Duration || 0}
                                    onChange={(e) => handleUpdateRepairCheck(machineIndex, rcIndex, 'Duration', parseInt(e.target.value) || 0)}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Parts Replaced</label>
                                  <Input 
                                    value={repairCheck.PartsReplaced || ''}
                                    onChange={(e) => handleUpdateRepairCheck(machineIndex, rcIndex, 'PartsReplaced', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Personnel</label>
                                  <Input 
                                    value={repairCheck.RPPersonnel || ''}
                                    onChange={(e) => handleUpdateRepairCheck(machineIndex, rcIndex, 'RPPersonnel', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium mb-1">Repair Reason</label>
                                <Textarea 
                                  value={repairCheck.RepairReason || ''}
                                  onChange={(e) => handleUpdateRepairCheck(machineIndex, rcIndex, 'RepairReason', e.target.value)}
                                  className="w-full"
                                  rows={2}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {machineUtilizations.length === 0 && (
            <Alert className="bg-gray-50 border border-gray-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No machines found for this reservation. Please add services with equipment to the reservation first.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reservation
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleGeneratePDF}
              disabled={machineUtilizations.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
            <Button 
              variant="default" 
              onClick={handleSaveAll}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

export default MachineUtilization;