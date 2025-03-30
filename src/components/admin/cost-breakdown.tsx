<<<<<<< Updated upstream
// src/components/admin/cost-breakdown.tsx
=======
>>>>>>> Stashed changes
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Clock, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from 'sonner';

// Interface for OperatingTime
interface OperatingTime {
  id?: number;
  OTDate: string | null;
  OTTypeofProducts: string | null;
  OTStartTime: string | null;
  OTEndTime: string | null;
  OTMachineOp: string | null;
}

// Interface for DownTime
interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null; // Time in minutes
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
}

// Interface for MachineUtilization
interface MachineUtilization {
  id?: number;
  Machine: string | null;
  ServiceName: string | null;
  DownTimes: DownTime[];
  OperatingTimes: OperatingTime[];
}

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null; // This should match Costs from Service model
  MinsAvail: number | null; // This is the booked duration, not related to pricing unit
}

interface ServicePricing {
  id: string;
  Service: string;
  Costs: number | string | null;
  Per?: string | null; // Unit of pricing (hour, day, etc.)
}

interface CostBreakdownProps {
  userServices: UserService[];
  totalAmountDue: number | string | null;
  machineUtilizations?: MachineUtilization[];
  reservationId?: number;
  allowFix?: boolean;
  reservationStatus?: string;
  servicePricing?: ServicePricing[]; // Add the services pricing information
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  userServices,
  totalAmountDue,
  machineUtilizations = [],
  reservationId,
  allowFix = false,
  reservationStatus = '',
  servicePricing = [] 
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [adjustedUserServices, setAdjustedUserServices] = useState<Array<UserService & {
    downtimeMinutes?: number,
    operationMinutes?: number,
    adjustedCost?: number,
    originalCost?: number,
<<<<<<< Updated upstream
    adjustedMins?: number,
    originalMins?: number
=======
    bookedMinutes?: number
>>>>>>> Stashed changes
  }>>([]);

  useEffect(() => {
    if (reservationStatus === 'Ongoing') {
      calculateOperationTimeCosts();
    } else if (reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') {
      calculateBookedCosts();
    }
  }, [userServices, machineUtilizations, reservationStatus, servicePricing]);  // Add closing bracket here

  const formatPrice = (price: number | string | null): string => {
<<<<<<< Updated upstream
=======
    // Handle null/undefined cases first
>>>>>>> Stashed changes
    if (price === null || price === undefined) return '₱0.00';
    
    // Handle empty string case
    if (typeof price === 'string' && price.trim() === '') return '₱0.00';
    
    // Convert to number safely
    const numericPrice = typeof price === 'string' ? 
      parseFloat(price.replace(/[^0-9.-]/g, '')) || 0 : 
      Number(price) || 0;
    
    // Format with 2 decimal places
    return `₱${numericPrice.toFixed(2)}`;
  };

<<<<<<< Updated upstream
  // Calculate downtime adjustments for each service
  const calculateDowntimeAdjustments = () => {
    const adjustedServices = userServices.map(service => {
      // Find machine utilization for this service and equipment
      const matchingMachineUtils = machineUtilizations.filter(util => 
        util.ServiceName === service.ServiceAvail && 
        (service.EquipmentAvail && util.Machine ? 
          service.EquipmentAvail.includes(util.Machine) : false)
      );

      // Sum all downtime minutes for this service
      const totalDowntimeMinutes = matchingMachineUtils.reduce((total, util) => {
        return total + util.DownTimes.reduce((minutes, downtime) => 
          minutes + (downtime.DTTime || 0), 0);
      }, 0);

      // Get original cost and minutes
      const originalCost = service.CostsAvail 
        ? (typeof service.CostsAvail === 'string' 
            ? parseFloat(service.CostsAvail) 
            : service.CostsAvail)
        : 0;
      
      const originalMins = service.MinsAvail || 60; // Default to 60 if not specified
      
      // Calculate adjusted minutes (never go below zero)
      const adjustedMins = Math.max(0, originalMins - totalDowntimeMinutes);
      
      // Calculate cost based on the ratio of adjusted minutes to original minutes
      const adjustedCost = originalMins > 0 
        ? (originalCost * (adjustedMins / originalMins)) 
        : 0;

      return {
        ...service,
        downtimeMinutes: totalDowntimeMinutes,
        originalCost,
        adjustedCost,
        originalMins,
        adjustedMins
      };
    });

    setAdjustedUserServices(adjustedServices);
=======
  // Add this with your other utility functions
const parseMachineUtilizationTime = (timeString: string | null): string => {
  if (!timeString) return "00:00"; // Default fallback
  
  // Case 1: Already in HH:MM format (e.g., "09:30")
  if (typeof timeString === 'string' && /^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // Case 2: ISO format (e.g., "2023-05-15T09:30:00.000Z")
  if (typeof timeString === 'string' && timeString.includes('T')) {
    try {
      const date = new Date(timeString);
      // Ensure valid date
      if (isNaN(date.getTime())) return "00:00"; 
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error("Error parsing ISO time:", e);
      return "00:00";
    }
  }
  
  // Case 3: Unknown format - try to extract time
  if (typeof timeString === 'string' && timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
    if (hours && minutes) {
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
  }
  
  return "00:00"; // Final fallback
};

  const calculateDurationMinutes = (startTimeStr, endTimeStr) => {
    try {
      console.log(`Calculating duration from ${startTimeStr} to ${endTimeStr}`);
      
      // Parse the time strings (expected format is "HH:MM")
      const startParts = startTimeStr.split(':');
      const endParts = endTimeStr.split(':');
      
      if (startParts.length < 2 || endParts.length < 2) {
        console.warn(`Invalid time format: start=${startTimeStr}, end=${endTimeStr}`);
        return 0;
      }
      
      const startHour = parseInt(startParts[0], 10);
      const startMinute = parseInt(startParts[1], 10);
      const endHour = parseInt(endParts[0], 10);
      const endMinute = parseInt(endParts[1], 10);
      
      // Validate the parsed values
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        console.warn(`Invalid time values after parsing: start=${startHour}:${startMinute}, end=${endHour}:${endMinute}`);
        return 0;
      }
      
      // Calculate total minutes for start and end times
      const startTotalMinutes = (startHour * 60) + startMinute;
      const endTotalMinutes = (endHour * 60) + endMinute;
      
      // Calculate duration in minutes
      let durationMinutes = endTotalMinutes - startTotalMinutes;
      
      // Handle overnight operations (end time is earlier than start time)
      if (durationMinutes < 0) {
        durationMinutes += 1440; // Add 24 hours (1440 minutes)
      }
      
      console.log(`Calculated duration: ${durationMinutes} minutes (${durationMinutes/60} hours)`);
      return durationMinutes;
    } catch (e) {
      console.error("Error calculating time duration:", e);
      return 0;
    }
>>>>>>> Stashed changes
  };

  // Calculate cost based on booked hours for pending and approved reservations
  const calculateBookedCosts = () => {
    console.log(`Calculating costs based on booked hours for ${reservationStatus} reservation`);
    
    // Safety check for userServices
    if (!userServices || !Array.isArray(userServices) || userServices.length === 0) {
      console.warn("No user services available for cost calculation");
      setAdjustedUserServices([]);
      return;
    }
  };
  
const extractMinutesFromServiceDisplay = (serviceName, equipmentName) => {
  try {
    // This pattern looks for common duration formats in the service or equipment name
    // e.g., "Operation: 240 mins (4.0 hrs)" or "480 mins (8.0 hrs)"
    const durationPattern = /(\d+)\s*mins\s*\((\d+\.\d+)\s*hrs\)/i;
    
    // Try to find the pattern in the service name first
    let match = serviceName ? serviceName.match(durationPattern) : null;
    
    // If not found in service name, try equipment name
    if (!match && equipmentName) {
      match = equipmentName.match(durationPattern);
    }
    
    if (match && match[1]) {
      const minutes = parseInt(match[1]);
      console.log(`Extracted ${minutes} minutes from display string: "${match[0]}"`);
      return minutes;
    }
    
    // Alternative pattern that looks for just minutes
    const minsPattern = /Operation:\s*(\d+)\s*mins/i;
    match = serviceName ? serviceName.match(minsPattern) : null;
    if (!match && equipmentName) {
      match = equipmentName.match(minsPattern);
    }
    
    if (match && match[1]) {
      const minutes = parseInt(match[1]);
      console.log(`Extracted ${minutes} minutes from mins pattern: "${match[0]}"`);
      return minutes;
    }
    
    return 0;
  } catch (e) {
    console.error("Error extracting minutes from display:", e);
    return 0;
  }
};

  const calculateCorrectTotalBookedMinutes = () => {
    if (!adjustedUserServices || !Array.isArray(adjustedUserServices)) {
      return 0;
    }
    
    return adjustedUserServices.reduce((sum, service) => {
      const minutes = service.bookedMinutes || 0;
      // Only add if it's a reasonable number
      return sum + (Number.isFinite(minutes) ? minutes : 0);
    }, 0);
  };

  
const correctTotalBookedMinutes = calculateCorrectTotalBookedMinutes();
const correctTotalBookedHours = (correctTotalBookedMinutes / 60).toFixed(1);
  
  // Calculate total from adjusted services
  const calculatedTotal = adjustedUserServices.reduce((sum, service) => {
    return sum + (service.adjustedCost || 0);
  }, 0);

  // Check if there's a discrepancy between provided total and calculated total
  const storedTotal = totalAmountDue !== null && totalAmountDue !== undefined ? 
    (typeof totalAmountDue === 'string' ? parseFloat(totalAmountDue) : totalAmountDue) : 
    0;
  
  // Round to 2 decimal places for more accurate comparison
  const calculatedTotalRounded = Math.round(calculatedTotal * 100) / 100;
  const storedTotalRounded = Math.round(storedTotal * 100) / 100;
  const hasDiscrepancy = Math.abs(calculatedTotalRounded - storedTotalRounded) > 0.01 && totalAmountDue !== null;

  const totalOperationMinutes = adjustedUserServices.reduce((sum, service) => 
    sum + (service.operationMinutes || 0), 0);
    
  // Calculate total booked minutes for pending/approved reservations
  const totalBookedMinutes = adjustedUserServices.reduce((sum, service) => 
    sum + (service.bookedMinutes || 0), 0);
    
  // Function to fix the total in the database
  const handleFixTotal = async () => {
    if (!reservationId) return;
    
    try {
      setIsFixing(true);
      setFixError(null);
      setFixSuccess(false);
      
      console.log(`Sending update request for reservation ${reservationId} with total: ${calculatedTotal}`);
      
      // Call the API to update the total in the database
      const response = await fetch(`/api/admin/update-total/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: calculatedTotal,
          // Include adjusted service details
          adjustedServices: adjustedUserServices.map(service => ({
            id: service.id,
            originalCost: service.originalCost,
            adjustedCost: service.adjustedCost,
            downtimeMinutes: service.downtimeMinutes
          })),
          // Include downtime summary
          downtimeDetails: {
            totalDowntimeMinutes,
            totalDeduction: totalDowntimeDeduction
          }
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update total amount');
      }
      
      console.log('Update successful:', result);
      setFixSuccess(true);
      toast.success('Total amount updated successfully with downtime deductions');
      
      // Wait 1 second before reloading to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error fixing total:', error);
      setFixError(error instanceof Error ? error.message : 'Unknown error');
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

<<<<<<< Updated upstream
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>Cost Breakdown</span>
          {totalDowntimeMinutes > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700">
              <Clock className="h-3 w-3" />
              Total Downtime: {totalDowntimeMinutes} mins
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {adjustedUserServices.map((service, index) => (
            <div key={index} className="flex justify-between items-start py-1">
              <div className="flex-1">
                <span className="font-medium">{service.ServiceAvail}</span>
                {service.EquipmentAvail && (
                  <div className="text-sm text-gray-600 mt-1">
                    Equipment: {service.EquipmentAvail}
                  </div>
                )}
                
                {/* Display both original and adjusted duration */}
                <div className="text-sm mt-1">
                  {(service.downtimeMinutes || 0) > 0 ? (
                    <div className="flex items-center">
                      <span className="text-gray-500 line-through mr-2">
                        Duration: {service.originalMins} mins
                      </span>
                      <span className="text-amber-600 font-medium">
                        Effective: {service.adjustedMins} mins
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      Duration: {service.originalMins} mins
                    </div>
                  )}
                </div>
=======
  // Add this special debug function to help diagnose the issue
const debugMachineUtilizations = () => {
  console.log("=== DEBUG MACHINE UTILIZATIONS ===");
  console.log("Total machine utilizations:", machineUtilizations.length);
  
  machineUtilizations.forEach((util, index) => {
    console.log(`\nMachine #${index + 1}: ${util.Machine} (Service: ${util.ServiceName})`);
    console.log(`Operating Times: ${util.OperatingTimes.length}`);
    
    util.OperatingTimes.forEach((ot, otIndex) => {
      console.log(`  Time #${otIndex + 1}: ${ot.OTStartTime} to ${ot.OTEndTime} (${ot.OTDate})`);
    });
  });
  
  console.log("\n=== DEBUG USER SERVICES ===");
  userServices.forEach((service, index) => {
    console.log(`Service #${index + 1}: ${service.ServiceAvail} (Equipment: ${service.EquipmentAvail})`);
  });
};

const calculateOperationTimeCosts = () => {
  // Track total minutes per machine-service combination
  const machineMinutes = new Map<string, number>();

  machineUtilizations.forEach(util => {
    if (!util.Machine || !util.ServiceName) return;

    const machineKey = `${util.Machine}|${util.ServiceName}`;
    
    // Always process each machine-service combo
    let machineTotal = 0;
    
    util.OperatingTimes.forEach(op => {
      if (!op.OTStartTime || !op.OTEndTime) return;
      
      // Use the parsed time method to calculate duration
      const startTime = parseMachineUtilizationTime(op.OTStartTime);
      const endTime = parseMachineUtilizationTime(op.OTEndTime);
      
      const minutes = calculateDurationMinutes(startTime, endTime);
      
      machineTotal += minutes;
      console.log(`Added ${minutes} mins for ${util.Machine} from ${startTime} to ${endTime}`);
    });

    machineMinutes.set(machineKey, machineTotal);
  });

  // Calculate grand total minutes only once
  const grandTotalMinutes = Array.from(machineMinutes.values()).reduce((sum, mins) => sum + mins, 0);

  // Get pricing info for the service
  const servicePricingInfo = servicePricing.find(s => 
    s.Service.toLowerCase() === '3d printing'
  ) || { Costs: 0.07, Per: 'min' };

  // Calculate costs
  const ratePerMin = Number(servicePricingInfo.Costs) || 0.07;
  const baseRatePerHour = 4.50; // ₱4.50/hour
  const baseRatePerMin = baseRatePerHour / 60;

  const adjustedServices = userServices.map(service => {
    // Calculate service-specific totals 
    const serviceMinutes = Array.from(machineMinutes.entries())
      .filter(([key]) => key.includes(service.ServiceAvail))
      .reduce((sum, [, mins]) => sum + mins, 0);

    return {
      ...service,
      operationMinutes: serviceMinutes,
      adjustedCost: (ratePerMin + baseRatePerMin) * serviceMinutes,
      ratePerMinute: ratePerMin + baseRatePerMin,
      originalCost: servicePricingInfo.Costs,
      pricingUnit: servicePricingInfo.Per || 'min'
    };
  });

  console.log('Grand total minutes:', grandTotalMinutes);
  console.log('Adjusted Services:', adjustedServices);
  setAdjustedUserServices(adjustedServices);
};

const getUniqueOperatingTimes = (operatingTimes: OperatingTime[]) => {
  const seen = new Set();
  return operatingTimes.filter(op => {
    const key = `${op.OTDate}-${op.OTStartTime}-${op.OTEndTime}-${op.OTMachineOp}`;
    if (seen.has(key)) {
      console.warn("Removing duplicate operating time:", key);
      return false;
    }
    seen.add(key);
    return true;
  });
};

// Helper function for cost calculation
const calculateCostFromMinutes = (minutes: number, baseCost: number, unit?: string) => {
  const pricingUnit = unit?.toLowerCase() || 'hour';
  switch(pricingUnit) {
    case 'min': return baseCost * minutes;
    case 'day': return baseCost * (minutes / 1440);
    default: return baseCost * (minutes / 60); // hour
  }
};

// Updated recalculateOperationTimes to include alert feedback
const recalculateOperationTimes = () => {
  console.log('Manual recalculation triggered');
  
  if (reservationStatus === 'Ongoing') {
    calculateOperationTimeCosts();
    // Show feedback to user that recalculation is complete
    alert('Operation times have been recalculated. If values didn\'t change, check console for details.');
  } else if (reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') {
    calculateBookedCosts();
    alert('Booked times have been recalculated.');
  }
};

return (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium">
        Cost Breakdown
        {reservationStatus === 'Ongoing' && (
          <Badge variant="outline" className="ml-2 text-blue-600 border-blue-300 bg-blue-50">
            Based on actual operation times
          </Badge>
        )}
        {(reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') && (
          <Badge variant="outline" className="ml-2 text-green-600 border-green-300 bg-green-50">
            Based on booked hours
          </Badge>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {/* Group services by name */}
        {Array.from(new Set(adjustedUserServices.map(s => s.ServiceAvail))).map((serviceName, index) => {
          const services = adjustedUserServices.filter(s => s.ServiceAvail === serviceName);
          const totalMinutes = services.reduce((sum, s) => sum + (s.operationMinutes || 0), 0);
          const totalCost = services.reduce((sum, s) => sum + (s.adjustedCost || 0), 0);
          const firstService = services[0];

          return (
            <div key={index} className="flex justify-between items-start py-2">
              <div className="flex-1">
                <span className="font-medium">{serviceName}</span>
>>>>>>> Stashed changes
                
                {/* List all equipment for this service */}
                <div className="space-y-1 mt-1">
                  {services.map((service, i) => (
                    <div key={i} className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <span>Equipment: {service.EquipmentAvail}</span>
                        {reservationStatus === 'Ongoing' && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {service.operationMinutes} mins
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rate: {formatPrice(service.ratePerMinute)}/min
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show rate information */}
                <div className="mt-2 text-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
<<<<<<< Updated upstream
                        <Badge variant="destructive" className="mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Downtime: {service.downtimeMinutes} mins
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="p-2 max-w-xs bg-white shadow-lg rounded-md">
                        <div className="text-xs">
                          <p className="font-medium">Downtime Adjustment</p>
                          <p>Original Duration: {service.originalMins} mins</p>
                          <p>Downtime: {service.downtimeMinutes} mins</p>
                          <p>Adjusted Duration: {service.adjustedMins} mins</p>
                          <p className="mt-1">Original Cost: {formatPrice(service.originalCost)}</p>
                          <p>Deduction: {formatPrice((service.originalCost || 0) - (service.adjustedCost || 0))}</p>
=======
                        <span className="border-b border-dotted border-gray-400 cursor-help">
                          Base rate: {formatPrice(firstService.originalCost)}/{firstService.pricingUnit}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="p-2 max-w-xs bg-white shadow-lg rounded-md">
                        <div className="text-xs">
                          <p className="font-medium">Service Pricing Details</p>
                          <p>Rate per minute: {formatPrice(firstService.ratePerMinute)}</p>
>>>>>>> Stashed changes
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="text-right">
                <span className="font-medium">{formatPrice(totalCost)}</span>
                {reservationStatus === 'Ongoing' && (
                  <div className="text-xs text-gray-500">
                    {totalMinutes} mins total
                  </div>
                )}
              </div>
            </div>
<<<<<<< Updated upstream
          ))}
          
          <Separator className="my-3" />
          
          {/* Show total downtime deduction summary if any */}
          {totalDowntimeMinutes > 0 && (
            <div className="bg-amber-50 p-2 rounded-md mb-2">
              <div className="text-sm text-amber-700 flex justify-between">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Downtime Deduction
                </span>
                <span className="font-medium">
                  {formatPrice(totalDowntimeDeduction)}
=======
          );
        })}

        <Separator className="my-3" />

        {/* Summary section */}
        {reservationStatus === 'Ongoing' ? (
          <div className="bg-blue-50 p-2 rounded-md mb-2">
            <div className="text-sm text-blue-700">
              <div className="flex justify-between mb-1">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Operation Time:
                </span>
                <span>
                  {totalOperationMinutes} mins 
                  ({Math.round(totalOperationMinutes / 60 * 10) / 10} hrs)
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 text-blue-600 border-blue-300 hover:bg-blue-100"
                onClick={recalculateOperationTimes}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Times
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 p-2 rounded-md mb-2">
            <div className="text-sm text-green-700">
              <div className="flex justify-between font-medium">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Booked:
                </span>
                <span>
                  {totalBookedMinutes} mins 
                  ({Math.round(totalBookedMinutes / 60 * 10) / 10} hrs)
>>>>>>> Stashed changes
                </span>
              </div>
            </div>
          </div>
        )}

<<<<<<< Updated upstream
          {/* Show fix button if there's a discrepancy */}
          {hasDiscrepancy && allowFix && reservationId && (
            <div className="mt-3 p-2 rounded bg-amber-50 space-y-2">
              <div className="text-sm text-amber-600 flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  The displayed total has been recalculated based on service times and downtime deductions. 
                  It differs from the value stored in the database.
                </span>
=======
        {/* Total amount */}
        <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-lg">Total</span>
          <div className="text-right">
            <span className="font-bold text-lg">{formatPrice(calculatedTotal)}</span>
            {hasDiscrepancy && (
              <div className="text-xs text-amber-600 mt-1">
                Total recalculated (stored: {formatPrice(storedTotal)})
              </div>
            )}
          </div>
        </div>

        {/* Fix discrepancy UI */}
        {hasDiscrepancy && allowFix && reservationId && (
            <div className="mt-3 p-2 rounded bg-amber-50 space-y-2">
              <div className="text-sm text-amber-600">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                {reservationStatus === 'Ongoing' ?
                  "The total has been recalculated based on actual operation times and differs from the stored value." :
                  reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved' ?
                  "The total has been recalculated based on booked hours and differs from the stored value." :
                  "The displayed total has been recalculated from the services and differs from the database value."
                }
>>>>>>> Stashed changes
              </div>
              
              {fixSuccess ? (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  Database total updated successfully! Refreshing...
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-amber-600 border-amber-300 hover:bg-amber-100"
                  onClick={handleFixTotal}
                  disabled={isFixing}
                >
                  {isFixing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Update Total with Downtime Adjustments
                    </>
                  )}
                </Button>
              )}
              
              {fixError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Error: {fixError}
                </div>
              )}

{reservationStatus === 'Ongoing' && (
  <div className="mt-4 p-3 bg-gray-100 rounded">
    <h4 className="font-bold mb-2">Time Data Debug</h4>
    {machineUtilizations.map((util, i) => (
      <div key={`debug-${i}`} className="mb-4">
        <p><strong>Machine:</strong> {util.Machine}</p>
        <p><strong>Service:</strong> {util.ServiceName}</p>
        <div className="ml-4">
          {util.OperatingTimes.map((op, j) => (
            <div key={`debug-op-${j}`} className="text-sm">
              <p>
                Time {j+1}: {op.OTStartTime} → {op.OTEndTime} 
                (Parsed: {parseMachineUtilizationTime(op.OTStartTime)} to {parseMachineUtilizationTime(op.OTEndTime)})
              </p>
              <p className="ml-4">
                Calculated: {calculateDurationMinutes(
                  parseMachineUtilizationTime(op.OTStartTime),
                  parseMachineUtilizationTime(op.OTEndTime)
                )} minutes
              </p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)}
            </div>
          )}
      </div>
    </CardContent>
  </Card>
);
}

export default CostBreakdown;