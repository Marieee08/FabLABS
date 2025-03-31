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

    const validHours = Array.from({ length: 10 }, (_, i) => i + 8);
    const formatHour = (hour) => {
      return hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    };
    const allMinutes = Array.from({ length: 60 }, (_, i) => i);
    const formatMinute = (minute) => {
      return minute.toString().padStart(2, '0');
    };
    const parseTimeString = (timeString) => {
      if (!timeString) return { hour: 8, minute: 0 };
      
      try {
        // Handle ISO format (e.g., "2023-05-15T09:30:00.000Z")
        if (timeString.includes('T')) {
          const date = new Date(timeString);
          return {
            hour: date.getHours(),
            minute: date.getMinutes()
          };
        } 
        // Handle HH:MM format (e.g., "09:30")
        else if (timeString.includes(':')) {
          const [hours, minutes] = timeString.split(':').map(Number);
          return { 
            hour: isNaN(hours) ? 8 : hours, 
            minute: isNaN(minutes) ? 0 : minutes 
          };
        }
        // Default fallback
        return { hour: 8, minute: 0 };
      } catch (e) {
        console.error('Error parsing time string:', e);
        return { hour: 8, minute: 0 };
      }
    };
    // More reliable time string creation
    const createTimeString = (hour, minute) => {
      // Ensure we're working with numbers
      const h = typeof hour === 'string' ? parseInt(hour, 10) : hour;
      const m = typeof minute === 'string' ? parseInt(minute, 10) : minute;
      
      // Validate and constrain values
      const validHour = isNaN(h) ? 8 : Math.max(0, Math.min(23, h));
      const validMinute = isNaN(m) ? 0 : Math.max(0, Math.min(59, m));
      
      // Format with padding
      return `${validHour.toString().padStart(2, '0')}:${validMinute.toString().padStart(2, '0')}`;
    };
    const handleHourChange = (machineIndex, otIndex, timeField, newHour) => {
      const machineUtil = machineUtilizations[machineIndex];
      if (!machineUtil) return;
      
      const operatingTime = machineUtil.OperatingTimes[otIndex];
      if (!operatingTime) return;
      
      const currentTime = timeField === 'OTStartTime' 
        ? operatingTime.OTStartTime
        : operatingTime.OTEndTime;
      
      const { minute } = parseTimeString(currentTime);
      
      // Validate working hours (8:00 AM to 5:00 PM)
      if (newHour < 8 || newHour > 17) {
        alert('Operating times must be between 8:00 AM and 5:00 PM');
        return;
      }
      
      const newTimeString = createTimeString(newHour, minute);
      handleUpdateOperatingTime(machineIndex, otIndex, timeField, newTimeString);
    };
    const handleMinuteChange = (machineIndex, otIndex, timeField, newMinute) => {
      const machineUtil = machineUtilizations[machineIndex];
      if (!machineUtil) return;
      
      const operatingTime = machineUtil.OperatingTimes[otIndex];
      if (!operatingTime) return;
      
      const currentTime = timeField === 'OTStartTime' 
        ? operatingTime.OTStartTime
        : operatingTime.OTEndTime;
      
      const { hour } = parseTimeString(currentTime);
      
      // Check if the resulting time is within working hours
      if (hour < 8 || hour > 17) {
        alert('Operating times must be between 8:00 AM and 5:00 PM');
        return;
      }
      
      const newTimeString = createTimeString(hour, newMinute);
      handleUpdateOperatingTime(machineIndex, otIndex, timeField, newTimeString);
    };
  
useEffect(() => {
  const fetchMachineUtilization = async () => {
    try {
      setLoading(true);
      
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
              // Properly extract just HH:MM from datetime strings
              OTStartTime: ot.OTStartTime ? formatTimeStringFromISO(ot.OTStartTime) : null,
              OTEndTime: ot.OTEndTime ? formatTimeStringFromISO(ot.OTEndTime) : null,
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

  const formatTimeStringFromISO = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      // Format as HH:MM
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Error formatting ISO time string:', e);
      // If parsing fails, try to extract time part from string if possible
      if (isoString.includes('T') && isoString.includes(':')) {
        const timePart = isoString.split('T')[1];
        return timePart.substring(0, 5); // Get HH:MM part
      }
      return "08:00"; // Fallback
    }
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
  
    const handleUpdateOperatingTime = (machineIndex: number, otIndex: number, field: string, value: any) => {
      // Special handling for time fields
      if (field === 'OTStartTime' || field === 'OTEndTime') {
        // Check if the time is within working hours
        if (value < '08:00' || value > '17:00') {
          // Don't update state if outside working hours - show alert
          alert('Operating times must be between 8:00 AM and 5:00 PM');
          return; // Exit without updating
        }
      }
    
      // If we get here, either it's not a time field or the time is valid
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

// Update the handleSaveAll function in MachineUtilization.tsx to use the correct field name
const handleSaveAll = async () => {
  try {
    setSaving(true);
    
    // Get the current date in proper ISO format
    const currentDateTime = new Date().toISOString();
    
    // Clone the data to avoid mutation
    const preparedData = JSON.parse(JSON.stringify(machineUtilizations));
    
    // Process each machine utilization record
    for (const util of preparedData) {
      // Set proper ISO datetime for DateReviewed
      util.DateReviewed = currentDateTime;
      
      // IMPORTANT: Use the correct field name (ReviwedBy, not ReviewedBy) as per schema
      util.ReviwedBy = util.ReviwedBy || util.ReviewedBy || "Admin";
      
      // If ReviewedBy was used (incorrect field), delete it to avoid confusion
      if (util.hasOwnProperty('ReviewedBy')) {
        delete util.ReviewedBy;
      }
      
      // Process operating times
      if (util.OperatingTimes && util.OperatingTimes.length > 0) {
        for (const ot of util.OperatingTimes) {
          // Remove temporary fields for new records
          if (ot.isNew) {
            delete ot.id;
            delete ot.isNew;
          }
          
          // Format dates and times as proper ISO strings if they exist
          if (ot.OTDate) {
            try {
              // Create a Date object from the date string (YYYY-MM-DD)
              const [year, month, day] = ot.OTDate.split('-').map(Number);
              const baseDate = new Date(year, month - 1, day);
              
              // Format OTDate as ISO string (just the date part)
              const isoDate = baseDate.toISOString();
              
              // Process start time if it exists (format: HH:MM)
              if (ot.OTStartTime) {
                const [hours, minutes] = ot.OTStartTime.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                  // Create a new date object with the correct date and time
                  const startDateTime = new Date(year, month - 1, day, hours, minutes);
                  ot.OTStartTime = startDateTime.toISOString();
                }
              }
              
              // Process end time if it exists (format: HH:MM)
              if (ot.OTEndTime) {
                const [hours, minutes] = ot.OTEndTime.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                  // Create a new date object with the correct date and time
                  const endDateTime = new Date(year, month - 1, day, hours, minutes);
                  ot.OTEndTime = endDateTime.toISOString();
                }
              }
              
              // Set the date part
              ot.OTDate = isoDate;
            } catch (e) {
              console.error('Error formatting operating time:', e);
            }
          }
        }
      }
      
      // Process dates in down times
      if (util.DownTimes && util.DownTimes.length > 0) {
        for (const dt of util.DownTimes) {
          if (dt.isNew) {
            delete dt.id;
            delete dt.isNew;
          }
          
          // Format DTDate as ISO string if it exists
          if (dt.DTDate) {
            try {
              const [year, month, day] = dt.DTDate.split('-').map(Number);
              const dateObj = new Date(year, month - 1, day);
              dt.DTDate = dateObj.toISOString();
            } catch (e) {
              console.error('Error formatting down time date:', e);
            }
          }
        }
      }
      
      // Process dates in repair checks
      if (util.RepairChecks && util.RepairChecks.length > 0) {
        for (const rc of util.RepairChecks) {
          if (rc.isNew) {
            delete rc.id;
            delete rc.isNew;
          }
          
          // Format RepairDate as ISO string if it exists
          if (rc.RepairDate) {
            try {
              const [year, month, day] = rc.RepairDate.split('-').map(Number);
              const dateObj = new Date(year, month - 1, day);
              rc.RepairDate = dateObj.toISOString();
            } catch (e) {
              console.error('Error formatting repair check date:', e);
            }
          }
        }
      }
    }
    
    // Log the data we're about to send (helpful for debugging)
    console.log('Sending to API:', JSON.stringify(preparedData, null, 2));
    
    // Send to API
    try {
      const response = await fetch(`/api/admin/machine-utilization/${reservationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preparedData),
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`API error: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      
      // Format the returned data for display
      const formattedResponseData = responseData.map((util) => ({
        ...util,
        DateReviewed: util.DateReviewed ? new Date(util.DateReviewed).toISOString().split('T')[0] : null,
        // Make sure we use ReviwedBy from response, but also set ReviewedBy for UI compatibility
        ReviwedBy: util.ReviwedBy,
        ReviewedBy: util.ReviwedBy, // For UI compatibility
        OperatingTimes: util.OperatingTimes.map((ot) => ({
          ...ot,
          OTDate: ot.OTDate ? new Date(ot.OTDate).toISOString().split('T')[0] : null,
          // Extract just the time part (HH:MM) from the ISO string
          OTStartTime: ot.OTStartTime ? formatTimeStringFromISO(ot.OTStartTime) : null,
          OTEndTime: ot.OTEndTime ? formatTimeStringFromISO(ot.OTEndTime) : null
        })),
        DownTimes: util.DownTimes.map((dt) => ({
          ...dt,
          DTDate: dt.DTDate ? new Date(dt.DTDate).toISOString().split('T')[0] : null
        })),
        RepairChecks: util.RepairChecks.map((rc) => ({
          ...rc,
          RepairDate: rc.RepairDate ? new Date(rc.RepairDate).toISOString().split('T')[0] : null
        }))
      }));
      
      // Helper function to format time string from ISO format
      function formatTimeStringFromISO(isoString) {
        try {
          const date = new Date(isoString);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } catch (e) {
          console.error('Error formatting time from ISO:', e);
          return "08:00"; // Fallback
        }
      }
      
      setMachineUtilizations(formattedResponseData);
      
      setSaving(false);
      alert('Data saved successfully');
      onSave();
    } catch (error) {
      console.error('API Error:', error);
      setSaving(false);
      alert('Error saving data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  } catch (err) {
    console.error('Error in save operation:', err);
    setSaving(false);
    setError('Failed to save data. Please try again.');
  }
};

// Also update the useEffect for fetching data to handle the field name difference
useEffect(() => {
  const fetchMachineUtilization = async () => {
    try {
      setLoading(true);
      
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
            // Handle the field name inconsistency by setting both fields
            ReviwedBy: util.ReviwedBy,
            ReviewedBy: util.ReviwedBy, // For UI compatibility
            DateReviewed: util.DateReviewed ? new Date(util.DateReviewed).toISOString().split('T')[0] : null,
            OperatingTimes: util.OperatingTimes.map((ot: OperatingTime) => ({
              ...ot,
              OTDate: ot.OTDate ? new Date(ot.OTDate).toISOString().split('T')[0] : null,
              // Properly extract just HH:MM from datetime strings
              OTStartTime: ot.OTStartTime ? formatTimeStringFromISO(ot.OTStartTime) : null,
              OTEndTime: ot.OTEndTime ? formatTimeStringFromISO(ot.OTEndTime) : null,
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

  // Helper function to format time string from ISO format
  const formatTimeStringFromISO = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      // Format as HH:MM
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Error formatting ISO time string:', e);
      // If parsing fails, try to extract time part from string if possible
      if (isoString.includes('T') && isoString.includes(':')) {
        const timePart = isoString.split('T')[1];
        return timePart.substring(0, 5); // Get HH:MM part
      }
      return "08:00"; // Fallback
    }
  };

  fetchMachineUtilization();
}, [reservationId, userServices]);
  
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

                    {/* Operating Times Section - Fixed Layout */}
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
    <div className="flex space-x-2">
      <Select 
        value={parseTimeString(operatingTime.OTStartTime).hour.toString()}
        onValueChange={(value) => handleHourChange(machineIndex, otIndex, 'OTStartTime', parseInt(value))}
      >
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {validHours.map(hour => (
              <SelectItem key={`start-hour-${hour}`} value={hour.toString()}>
                {formatHour(hour)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <Select 
        value={parseTimeString(operatingTime.OTStartTime).minute.toString()}
        onValueChange={(value) => handleMinuteChange(machineIndex, otIndex, 'OTStartTime', parseInt(value))}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Minute" />
        </SelectTrigger>
        <SelectContent className="h-[200px] overflow-y-auto">
          <SelectGroup>
            {allMinutes.map(minute => (
              <SelectItem key={`start-min-${minute}`} value={minute.toString()}>
                {formatMinute(minute)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  </div>
  
  <div>
    <label className="block text-xs font-medium mb-1">End Time</label>
    <div className="flex space-x-2">
      <Select 
        value={parseTimeString(operatingTime.OTEndTime).hour.toString()}
        onValueChange={(value) => handleHourChange(machineIndex, otIndex, 'OTEndTime', parseInt(value))}
      >
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {validHours.map(hour => (
              <SelectItem key={`end-hour-${hour}`} value={hour.toString()}>
                {formatHour(hour)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <Select 
        value={parseTimeString(operatingTime.OTEndTime).minute.toString()}
        onValueChange={(value) => handleMinuteChange(machineIndex, otIndex, 'OTEndTime', parseInt(value))}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Minute" />
        </SelectTrigger>
        <SelectContent className="h-[200px] overflow-y-auto">
          <SelectGroup>
            {allMinutes.map(minute => (
              <SelectItem key={`end-min-${minute}`} value={minute.toString()}>
                {formatMinute(minute)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
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
                                    min="08:00" 
                                    max="17:00"
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
                                    min="08:00" 
                                    max="17:00"
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
                                    min="08:00" 
                                    max="17:00"
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