// src/components/admin/cost-breakdown.tsx
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

// Create an interface for the extended UserService
interface AdjustedUserService extends UserService {
  downtimeMinutes: number | null;
  operationMinutes: number | null;
  adjustedCost: number | null;
  originalCost: number | null;
  adjustedMins: number | null;
  originalMins: number | null;
  bookedMinutes: number | null;
  ratePerMinute?: number | null;
  pricingUnit?: string | null;
}

interface CostBreakdownProps {
  userServices: UserService[];
  totalAmountDue: number | string | null;
  machineUtilizations?: MachineUtilization[];
  reservationId?: number;
  allowFix?: boolean;
  reservationStatus?: string;
  servicePricing?: ServicePricing[]; // Add the services pricing information
  defaultPricePerMin?: number;
  defaultPricingUnit?: string;
  minutesPerHour?: number;
  minutesPerDay?: number;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  userServices,
  totalAmountDue,
  machineUtilizations = [],
  reservationId,
  allowFix = false,
  reservationStatus = '',
  servicePricing = [],
  defaultPricePerMin = 0,
  defaultPricingUnit = 'hour',
  minutesPerHour = 60,
  minutesPerDay = 1440
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [adjustedUserServices, setAdjustedUserServices] = useState<AdjustedUserService[]>([]);

  useEffect(() => {
    if (reservationStatus === 'Ongoing') {
      calculateOperationTimeCosts();
    } else if (reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') {
      calculateBookedCosts();
    }
  }, [userServices, machineUtilizations, reservationStatus, servicePricing]);

  const formatPrice = (price: number | string | null): string => {
    // Handle null/undefined cases first
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

  const calculateDurationMinutes = (startTimeStr: string, endTimeStr: string): number => {
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
        durationMinutes += minutesPerDay; // Add 24 hours
      }
      
      console.log(`Calculated duration: ${durationMinutes} minutes (${durationMinutes/minutesPerHour} hours)`);
      return durationMinutes;
    } catch (e) {
      console.error("Error calculating time duration:", e);
      return 0;
    }
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

    // Implementation of booked costs calculation - use pricing from Service model
    const calculatedServices = userServices.map(service => {
      // Use the exact MinsAvail from the database with no modification
      const bookedMinutes = service.MinsAvail || 0;
      console.log(`Service: ${service.ServiceAvail}, Using database MinsAvail: ${bookedMinutes}`);
      
      // Find matching service pricing
      const pricing = servicePricing.find(p => 
        p.Service === service.ServiceAvail
      );
      
      // Get base cost from service pricing if available
      const baseCostPerUnit = pricing ? 
        (typeof pricing.Costs === 'string' ? parseFloat(pricing.Costs) : (pricing.Costs || defaultPricePerMin)) : 
        (typeof service.CostsAvail === 'string' ? parseFloat(service.CostsAvail) : (service.CostsAvail || defaultPricePerMin));
      
      // Get pricing unit (use default if not specified)
      const pricingUnit = pricing?.Per || defaultPricingUnit;
      
      // Calculate cost based on pricing unit and booked minutes - simple conversion
      let adjustedCost;
      if (pricingUnit.toLowerCase() === 'min') {
        // If rate is per minute, just multiply
        adjustedCost = baseCostPerUnit * Number(bookedMinutes);
      } else if (pricingUnit.toLowerCase() === 'day') {
        // If rate is per day, convert minutes to days
        adjustedCost = baseCostPerUnit * (Number(bookedMinutes) / minutesPerDay);
      } else {
        // Default is per hour, convert minutes to hours
        adjustedCost = baseCostPerUnit * (Number(bookedMinutes) / minutesPerHour);
      }

      return {
        ...service,
        bookedMinutes: Number(bookedMinutes), // Store exactly what's in MinsAvail
        originalCost: baseCostPerUnit,
        adjustedCost,
        downtimeMinutes: null,
        operationMinutes: null,
        adjustedMins: null,
        originalMins: null,
        pricingUnit
      } as AdjustedUserService;
    });

    setAdjustedUserServices(calculatedServices);
  };
  
  const extractMinutesFromServiceDisplay = (serviceName: string | null, equipmentName: string | null): number => {
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

  const calculateOperationTimeCosts = () => {
    console.log("DEBUGGING: Calculating operation time costs");
    
    // For debugging: log all machine utilizations first
    console.log("All machine utilizations:");
    machineUtilizations.forEach(util => {
      console.log(`Machine: ${util.Machine}, Service: ${util.ServiceName}, ID: ${util.id}`);
      console.log(`Operating Times: ${util.OperatingTimes.length}`);
      
      // Log each operating time
      util.OperatingTimes.forEach((time, idx) => {
        console.log(`  Time ${idx+1}: ${time.OTStartTime} → ${time.OTEndTime}`);
      });
    });
    
    // Process each user service
    const adjustedServices = userServices.map(service => {
      console.log(`\nProcessing service: ${service.ServiceAvail}, Equipment: ${service.EquipmentAvail}`);
      
      // Find matching machine utilization for this service
      const matchingUtilization = machineUtilizations.find(util => 
        (util.Machine && service.EquipmentAvail && 
         util.Machine.toLowerCase().includes(service.EquipmentAvail.toLowerCase())) || 
        (util.ServiceName && service.ServiceAvail && 
         util.ServiceName.toLowerCase().includes(service.ServiceAvail.toLowerCase()))
      );
      
      console.log(`Found matching utilization: ${matchingUtilization ? 'Yes' : 'No'}`);
      
      // Calculate operation minutes from operating times
      let operationMinutes = 0;
      
      if (matchingUtilization && matchingUtilization.OperatingTimes && 
          matchingUtilization.OperatingTimes.length > 0) {
        
        // Get unique operating times to avoid duplicates
        const uniqueOpTimes = getUniqueOperatingTimes(matchingUtilization.OperatingTimes);
        console.log(`Found ${uniqueOpTimes.length} unique operating times`);
        
        // Sum up the duration of all operating times
        operationMinutes = uniqueOpTimes.reduce((total, opTime) => {
          if (!opTime.OTStartTime || !opTime.OTEndTime) {
            console.warn("Missing start or end time for operation time:", opTime);
            return total;
          }
          
          // Parse the start and end times
          const startTime = parseMachineUtilizationTime(opTime.OTStartTime);
          const endTime = parseMachineUtilizationTime(opTime.OTEndTime);
          console.log(`Parsed times: ${startTime} to ${endTime}`);
          
          // Calculate the duration in minutes
          const duration = calculateDurationMinutes(startTime, endTime);
          return total + duration;
        }, 0);
        
        console.log(`Total operation minutes calculated: ${operationMinutes}`);
      } else {
        // Fallback: try to extract minutes from service/equipment description
        const extractedMinutes = extractMinutesFromServiceDisplay(
          service.ServiceAvail, 
          service.EquipmentAvail
        );
        
        if (extractedMinutes > 0) {
          console.log(`Using extracted minutes from description: ${extractedMinutes}`);
          operationMinutes = extractedMinutes;
        } else {
          // If no operation times or extracted minutes, use booked minutes as fallback
          console.log(`No operation times found, using booked minutes fallback: ${service.MinsAvail || 0}`);
          operationMinutes = service.MinsAvail || 0;
        }
      }
      
      // Get pricing info for the service (use default if not found)
      const servicePricingInfo = servicePricing.find(s => 
        s.Service.toLowerCase() === service.ServiceAvail.toLowerCase()
      ) || { Costs: defaultPricePerMin, Per: defaultPricingUnit };
      
      // Get cost rate
      const ratePerUnit = Number(servicePricingInfo.Costs) || defaultPricePerMin;
      const pricingUnit = servicePricingInfo.Per || defaultPricingUnit;
      
      // Calculate cost - simple conversion only
      let adjustedCost;
      if (pricingUnit.toLowerCase() === 'min') {
        // If rate is per minute, just multiply
        adjustedCost = ratePerUnit * operationMinutes;
      } else if (pricingUnit.toLowerCase() === 'day') {
        // If rate is per day, convert minutes to days
        adjustedCost = ratePerUnit * (operationMinutes / minutesPerDay);
      } else {
        // Default is per hour, convert minutes to hours
        adjustedCost = ratePerUnit * (operationMinutes / minutesPerHour);
      }
      
      // Calculate rate per minute for display
      const ratePerMinute = pricingUnit.toLowerCase() === 'min' 
        ? ratePerUnit 
        : pricingUnit.toLowerCase() === 'day' 
          ? ratePerUnit / minutesPerDay 
          : ratePerUnit / minutesPerHour;
      
      return {
        ...service,
        operationMinutes: operationMinutes,
        adjustedCost: adjustedCost,
        ratePerMinute: ratePerMinute,
        originalCost: ratePerUnit,
        pricingUnit: pricingUnit,
        downtimeMinutes: null,
        adjustedMins: null,
        originalMins: null,
        bookedMinutes: null
      } as AdjustedUserService;
    });
    
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

  // Helper function for cost calculation - simple conversion only
  const calculateCostFromMinutes = (minutes: number, baseCost: number, unit?: string) => {
    const pricingUnit = unit?.toLowerCase() || defaultPricingUnit;
    switch(pricingUnit) {
      case 'min': return baseCost * minutes;
      case 'day': return baseCost * (minutes / minutesPerDay);
      default: return baseCost * (minutes / minutesPerHour); // hour
    }
  };

  const calculateCorrectTotalBookedMinutes = (): number => {
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
  const correctTotalBookedHours = (correctTotalBookedMinutes / minutesPerHour).toFixed(1);
  
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
  
  // Function to fix the total in the database
  const handleFixTotal = async () => {
    if (!reservationId) return;
    
    try {
      setIsFixing(true);
      setFixError(null);
      setFixSuccess(false);
      
      console.log(`Sending update request for reservation ${reservationId} with total: ${calculatedTotal}`);
      
      // Simple payload with just essential data
      const payload = {
        totalAmount: calculatedTotal,
        // Keep the service information minimal
        services: adjustedUserServices.map(service => ({
          id: service.id,
          minutes: reservationStatus === 'Ongoing' 
            ? service.operationMinutes 
            : service.bookedMinutes
        }))
      };
      
      console.log("Sending payload:", payload);
      
      // Call the API to update the total in the database
      const response = await fetch(`/api/admin/update-total/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      // Safely handle the response
      let result;
      try {
        const text = await response.text();
        console.log("Raw response:", text);
        
        // Try to parse the response as JSON if possible
        try {
          result = JSON.parse(text);
        } catch {
          // If it's not valid JSON, use the text as is
          result = { message: text };
        }
      } catch (readError) {
        console.error("Error reading response:", readError);
        // If reading fails, use a generic error message
        throw new Error(`Failed to read response: ${response.statusText}`);
      }
      
      if (!response.ok) {
        // Use result.error or result.message if available
        const errorMessage = result?.error || result?.message || response.statusText || 'Failed to update total amount';
        throw new Error(errorMessage);
      }
      
      console.log('Update successful:', result);
      setFixSuccess(true);
      toast.success('Total amount updated successfully');
      
      // Wait 1 second before reloading to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error fixing total:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setFixError(errorMsg);
      toast.error(`Failed to update: ${errorMsg}`);
    } finally {
      setIsFixing(false);
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Group services by name */}
          {Array.from(new Set(adjustedUserServices.map(s => s.ServiceAvail))).map((serviceName, index) => {
            const services = adjustedUserServices.filter(s => s.ServiceAvail === serviceName);
            const totalMinutes = services.reduce((sum, s) => sum + (s.operationMinutes || s.bookedMinutes || 0), 0);
            const totalCost = services.reduce((sum, s) => sum + (s.adjustedCost || 0), 0);
            const firstService = services[0];

            return (
              <div key={index} className="flex justify-between items-start py-2">
                <div className="flex-1">
                  <span className="font-medium">{serviceName}</span>
                  
                  {/* List all equipment for this service */}
                  <div className="space-y-1 mt-1">
                    {services.map((service, i) => (
                      <div key={i} className="text-sm text-gray-600">
                        <div className="flex items-center">
                          <span>Equipment: {service.EquipmentAvail}</span>
                          {reservationStatus === 'Ongoing' && service.operationMinutes && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {service.operationMinutes} mins
                            </Badge>
                          )}
                          {(reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') && service.bookedMinutes && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {service.bookedMinutes} mins
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="font-medium">{formatPrice(totalCost)}</span>
                </div>
              </div>
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
                    ({Math.round(totalOperationMinutes / minutesPerHour * 10) / 10} hrs)
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
                    ({Math.round(totalBookedMinutes / minutesPerHour * 10) / 10} hrs)
                  </span>
                </div>
              </div>
            </div>
          )}

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
                        Update Total with Recalculated Amounts
                      </>
                    )}
                  </Button>
                )}
                
                {fixError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {fixError}
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