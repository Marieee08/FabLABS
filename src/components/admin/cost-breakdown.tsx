import React, { useState, useEffect, useRef } from 'react';
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
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface ServicePricing {
  id: string;
  Service: string;
  Costs: number | string | null;
  Per?: string | null;
}

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
  servicePricing?: ServicePricing[];
  defaultPricePerMin?: number;
  defaultPricingUnit?: string;
  minutesPerHour?: number;
  minutesPerDay?: number;
  onRefresh?: () => void; // Add this prop for parent component refresh
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
  minutesPerDay = 1440,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [adjustedUserServices, setAdjustedUserServices] = useState<AdjustedUserService[]>([]);
  // This will help us track and force UI updates
  const [updateCounter, setUpdateCounter] = useState(0);
  // Reference to the latest adjusted services for immediate access
  const latestServicesRef = useRef<AdjustedUserService[]>([]);

  useEffect(() => {
    if (reservationStatus === 'Ongoing') {
      calculateOperationTimeCosts();
    } else if (reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') {
      calculateBookedCosts();
    }
  }, [userServices, machineUtilizations, reservationStatus, servicePricing, updateCounter]);

  const formatPrice = (price: number | string | null): string => {
    if (price === null || price === undefined) return '₱0.00';
    if (typeof price === 'string' && price.trim() === '') return '₱0.00';
    
    const numericPrice = typeof price === 'string' ? 
      parseFloat(price.replace(/[^0-9.-]/g, '')) || 0 : 
      Number(price) || 0;
    
    return `₱${numericPrice.toFixed(2)}`;
  };

  function parseMachineUtilizationTime(timeString: string | null): string {
    if (!timeString) return "00:00";
    
    if (timeString.includes('T')) {
      try {
        const date = new Date(timeString);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        console.error("Failed to parse ISO time:", e);
        return "00:00";
      }
    }
    
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    
    return "00:00";
  }

  const calculateDurationMinutes = (start: string, end: string, date?: string): number => {
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        
        startDate.setHours(startH, startM, 0, 0);
        endDate.setHours(endH, endM, 0, 0);
        
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        return (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      }
      
      let duration = (endH * 60 + endM) - (startH * 60 + startM);
      
      if (duration < 0) {
        duration += 24 * 60;
      }
      
      return duration;
    } catch (e) {
      console.error("Error calculating duration:", e);
      return 0;
    }
  };

  const calculateBookedCosts = () => {
    console.log(`Calculating costs based on booked hours for ${reservationStatus} reservation`);
    
    if (!userServices || !Array.isArray(userServices) || userServices.length === 0) {
      console.warn("No user services available for cost calculation");
      setAdjustedUserServices([]);
      return;
    }

    const calculatedServices = userServices.map(service => {
      const bookedMinutes = service.MinsAvail || 0;
      console.log(`Service: ${service.ServiceAvail}, Using database MinsAvail: ${bookedMinutes}`);
      
      const pricing = servicePricing.find(p => 
        p.Service === service.ServiceAvail
      );
      
      const baseCostPerUnit = pricing ? 
        (typeof pricing.Costs === 'string' ? parseFloat(pricing.Costs) : (pricing.Costs || defaultPricePerMin)) : 
        (typeof service.CostsAvail === 'string' ? parseFloat(service.CostsAvail) : (service.CostsAvail || defaultPricePerMin));
      
      const pricingUnit = pricing?.Per || defaultPricingUnit;
      
      let adjustedCost;
      if (pricingUnit.toLowerCase() === 'min') {
        adjustedCost = baseCostPerUnit * Number(bookedMinutes);
      } else if (pricingUnit.toLowerCase() === 'day') {
        adjustedCost = baseCostPerUnit * (Number(bookedMinutes) / minutesPerDay);
      } else {
        adjustedCost = baseCostPerUnit * (Number(bookedMinutes) / minutesPerHour);
      }

      return {
        ...service,
        bookedMinutes: Number(bookedMinutes),
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
      const durationPattern = /(\d+)\s*mins\s*\((\d+\.\d+)\s*hrs\)/i;
      let match = serviceName ? serviceName.match(durationPattern) : null;
      
      if (!match && equipmentName) {
        match = equipmentName.match(durationPattern);
      }
      
      if (match && match[1]) {
        const minutes = parseInt(match[1]);
        console.log(`Extracted ${minutes} minutes from display string: "${match[0]}"`);
        return minutes;
      }
      
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
    
    console.log("All machine utilizations:");
    machineUtilizations.forEach(util => {
      console.log(`Machine: ${util.Machine}, Service: ${util.ServiceName}, ID: ${util.id}`);
      console.log(`Operating Times: ${util.OperatingTimes.length}`);
      
      util.OperatingTimes.forEach((time, idx) => {
        console.log(`  Time ${idx+1}: ${time.OTStartTime} → ${time.OTEndTime}`);
      });
    });
    
    const usedMachineUtilIds = new Set();
  
    const adjustedServices = userServices.map((service, serviceIndex) => {
      console.log(`\nProcessing service ${serviceIndex+1}: ${service.ServiceAvail}, Equipment: ${service.EquipmentAvail}, ID: ${service.id}`);
      
      let matchingUtilization = null;
      
      if (!matchingUtilization) {
        const exactMatch = machineUtilizations.find(util => {
          const serviceIdString = service.id;
          const machineContainsId = util.Machine?.includes(serviceIdString);
          const serviceNameContainsId = util.ServiceName?.includes(serviceIdString);
          return (machineContainsId || serviceNameContainsId) && !usedMachineUtilIds.has(util.id);
        });
        
        if (exactMatch) {
          console.log(`Found exact match by ID embedding: ${exactMatch.id}`);
          matchingUtilization = exactMatch;
        }
      }
      
      if (!matchingUtilization) {
        const exactNameMatch = machineUtilizations.find(util => 
          util.Machine === service.EquipmentAvail && 
          util.ServiceName === service.ServiceAvail &&
          !usedMachineUtilIds.has(util.id)
        );
        
        if (exactNameMatch) {
          console.log(`Found exact match by both names: ${exactNameMatch.id}`);
          matchingUtilization = exactNameMatch;
        }
      }
      
      if (!matchingUtilization) {
        const matchingMachines = machineUtilizations
          .filter(util => util.Machine === service.EquipmentAvail && !usedMachineUtilIds.has(util.id));
        
        if (matchingMachines.length > 0) {
          const serviceMatches = matchingMachines.filter(m => 
            m.ServiceName === service.ServiceAvail);
          
          if (serviceMatches.length > 0) {
            matchingUtilization = serviceMatches[0];
            console.log(`Found match with same machine and service name: ${matchingUtilization.id}`);
          } else {
            matchingUtilization = matchingMachines[0];
            console.log(`Found match with same machine name: ${matchingUtilization.id}`);
          }
        }
      }
      
      if (!matchingUtilization) {
        const partialMatches = machineUtilizations
          .filter(util => !usedMachineUtilIds.has(util.id))
          .filter(util => {
            const machineMatch = util.Machine && service.EquipmentAvail && 
              (service.EquipmentAvail.toLowerCase().includes(util.Machine.toLowerCase()) || 
               util.Machine.toLowerCase().includes(service.EquipmentAvail.toLowerCase()));
            
            const serviceMatch = util.ServiceName && service.ServiceAvail && 
              (service.ServiceAvail.toLowerCase().includes(util.ServiceName.toLowerCase()) || 
               util.ServiceName.toLowerCase().includes(service.ServiceAvail.toLowerCase()));
            
            return machineMatch || serviceMatch;
          });
          
        if (partialMatches.length > 0) {
          const bestMatches = partialMatches.filter(m => 
            (m.Machine && service.EquipmentAvail && 
              m.Machine.toLowerCase().includes(service.EquipmentAvail.toLowerCase())) &&
            (m.ServiceName && service.ServiceAvail && 
              m.ServiceName.toLowerCase().includes(service.ServiceAvail.toLowerCase()))
          );
          
          matchingUtilization = bestMatches.length > 0 ? bestMatches[0] : partialMatches[0];
          console.log(`Found partial match: ${matchingUtilization.id}`);
        }
      }
      
      if (matchingUtilization?.id) {
        usedMachineUtilIds.add(matchingUtilization.id);
        console.log(`Marked machine util ID ${matchingUtilization.id} as used`);
      }
      
      console.log(`Final match result: ${matchingUtilization ? `ID=${matchingUtilization.id}, Machine=${matchingUtilization.Machine}` : 'No match found'}`);
      
      let operationMinutes = 0;
      
      if (matchingUtilization && matchingUtilization.OperatingTimes && 
          matchingUtilization.OperatingTimes.length > 0) {
        
        const uniqueOpTimes = getUniqueOperatingTimes(matchingUtilization.OperatingTimes);
        console.log(`Found ${uniqueOpTimes.length} unique operating times`);
        
        operationMinutes = uniqueOpTimes.reduce((total, opTime) => {
          const startTime = parseMachineUtilizationTime(opTime.OTStartTime);
          const endTime = parseMachineUtilizationTime(opTime.OTEndTime);
          const duration = calculateDurationMinutes(startTime, endTime, opTime.OTDate?.split('T')[0] || '');
          console.log(`Duration calculated: ${duration} minutes for ${startTime} to ${endTime}`);
          return total + duration;
        }, 0);
        
        console.log(`Total operation minutes calculated: ${operationMinutes}`);
      } else {
        const extractedMinutes = extractMinutesFromServiceDisplay(
          service.ServiceAvail, 
          service.EquipmentAvail
        );
        
        if (extractedMinutes > 0) {
          console.log(`Using extracted minutes from description: ${extractedMinutes}`);
          operationMinutes = extractedMinutes;
        } else {
          console.log(`No operation times found, using booked minutes fallback: ${service.MinsAvail || 0}`);
          operationMinutes = service.MinsAvail || 0;
        }
      }
      
      const servicePricingInfo = servicePricing.find(s => 
        s.Service.toLowerCase() === service.ServiceAvail.toLowerCase()
      ) || { Costs: defaultPricePerMin, Per: defaultPricingUnit };
      
      const ratePerUnit = Number(servicePricingInfo.Costs) || defaultPricePerMin;
      const pricingUnit = servicePricingInfo.Per || defaultPricingUnit;
      
      let adjustedCost;
      if (pricingUnit.toLowerCase() === 'min') {
        adjustedCost = ratePerUnit * operationMinutes;
      } else if (pricingUnit.toLowerCase() === 'day') {
        adjustedCost = ratePerUnit * (operationMinutes / minutesPerDay);
      } else {
        adjustedCost = ratePerUnit * (operationMinutes / minutesPerHour);
      }
      
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

  const calculateCostFromMinutes = (minutes: number, baseCost: number, unit?: string) => {
    const pricingUnit = unit?.toLowerCase() || defaultPricingUnit;
    switch(pricingUnit) {
      case 'min': return baseCost * minutes;
      case 'day': return baseCost * (minutes / minutesPerDay);
      default: return baseCost * (minutes / minutesPerHour);
    }
  };

  const calculateCorrectTotalBookedMinutes = (): number => {
    if (!adjustedUserServices || !Array.isArray(adjustedUserServices)) {
      return 0;
    }
    
    return adjustedUserServices.reduce((sum, service) => {
      const minutes = service.bookedMinutes || 0;
      return sum + (Number.isFinite(minutes) ? minutes : 0);
    }, 0);
  };

  useEffect(() => {
    latestServicesRef.current = adjustedUserServices;
  }, [adjustedUserServices]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(false);
    
    try {
      // Step 1: Recalculate costs based on reservation status
      console.log('Refresh triggered - recalculating costs');
      
      // Force immediate calculation
      if (reservationStatus === 'Ongoing') {
        calculateOperationTimeCosts();
      } else if (reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') {
        calculateBookedCosts();
      }
      
      // Step 2: If there's a discrepancy, update the database
      if (hasDiscrepancy && allowFix && reservationId) {
        try {
          console.log(`Updating database with recalculated total: ${calculatedTotal}`);
          
          // Format data properly for SQLite
          const totalAmountString = calculatedTotal.toFixed(2);
          
          // Immediately update the UI with the new calculations before API call
          // This gives instant feedback to the user
          const currentServices = latestServicesRef.current;
          
          const payload = {
            totalAmount: totalAmountString,
            services: currentServices.map(service => ({
              id: service.id,
              minutes: reservationStatus === 'Ongoing' 
                ? service.operationMinutes?.toString()
                : service.bookedMinutes?.toString()
            }))
          };
          
          console.log("Formatted payload:", payload);
          
          // Trigger a UI update even before the API response comes back
          setUpdateCounter(prev => prev + 1);
          
          const response = await fetch(`/api/admin/update-total/${reservationId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          let responseData = null;
          
          try {
            const text = await response.text();
            try {
              responseData = JSON.parse(text);
            } catch {
              responseData = { message: text };
            }
          } catch {
            responseData = { message: response.statusText || 'Unknown response' };
          }
          
          if (!response.ok) {
            const errorMessage = responseData?.error || responseData?.message || 'Failed to update total amount';
            setRefreshError(errorMessage);
            toast.error(`Database update failed: ${errorMessage}`);
          } else {
            setRefreshSuccess(true);
            toast.success('Calculations updated and database refreshed successfully');
            
            // Force another update after successful API call
            setUpdateCounter(prev => prev + 1);
            
            // Call parent refresh if provided
            if (typeof onRefresh === 'function') {
              onRefresh();
            }
          }
        } catch (updateError) {
          const errorMsg = updateError instanceof Error ? updateError.message : 'Unknown error during update';
          setRefreshError(errorMsg);
          toast.error(`Database update failed: ${errorMsg}`);
        }
      } else {
        // No database update needed, just show success for recalculation
        setRefreshSuccess(true);
        toast.success('Calculations refreshed successfully');
        
        // Force UI update even without API call
        setUpdateCounter(prev => prev + 1);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setRefreshError(errorMsg);
      toast.error(`Failed to refresh calculations: ${errorMsg}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const correctTotalBookedMinutes = adjustedUserServices.reduce((sum, service) => {
    const minutes = service.bookedMinutes || 0;
    return sum + (Number.isFinite(minutes) ? minutes : 0);
  }, 0);

  const correctTotalBookedHours = (correctTotalBookedMinutes / minutesPerHour).toFixed(1);
  
  const calculatedTotal = adjustedUserServices.reduce((sum, service) => {
    return sum + (service.adjustedCost || 0);
  }, 0);


  const storedTotal = totalAmountDue !== null && totalAmountDue !== undefined ? 
    (typeof totalAmountDue === 'string' ? parseFloat(totalAmountDue) : totalAmountDue) : 
    0;
  
    const calculatedTotalRounded = Math.round(calculatedTotal * 100) / 100;
    const storedTotalRounded = Math.round(storedTotal * 100) / 100;
    const hasDiscrepancy = Math.abs(calculatedTotalRounded - storedTotalRounded) > 0.01 && totalAmountDue !== null;

    const totalOperationMinutes = adjustedUserServices.reduce((sum, service) => 
      sum + (service.operationMinutes || 0), 0);
    
    const totalBookedMinutes = adjustedUserServices.reduce((sum, service) => 
      sum + (service.bookedMinutes || 0), 0);

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
          {Array.from(new Set(adjustedUserServices.map(s => s.ServiceAvail))).map((serviceName, index) => {
            const services = adjustedUserServices.filter(s => s.ServiceAvail === serviceName);
            const totalCost = services.reduce((sum, s) => sum + (s.adjustedCost || 0), 0);

            return (
              <div key={`${serviceName}-${index}-${updateCounter}`} className="flex justify-between items-start py-2">
                <div className="flex-1">
                  <span className="font-medium">{serviceName}</span>
                  
                  <div className="space-y-1 mt-1">
                    {services.map((service, i) => (
                      <div key={`${service.id}-${i}-${updateCounter}`} className="text-sm text-gray-600">
                        <div className="flex items-center">
                          <span>Equipment: {service.EquipmentAvail}</span>
                          {reservationStatus === 'Ongoing' && service.operationMinutes !== null && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {service.operationMinutes} mins
                            </Badge>
                          )}
                          {(reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved') && service.bookedMinutes !== null && (
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

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 text-blue-600 border-blue-300 hover:bg-blue-100"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Calculations
              </>
            )}
          </Button>

          <Separator className="my-3" />
          
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

          {hasDiscrepancy && (
            <div className="mt-3 p-2 rounded bg-amber-50">
              <div className="text-sm text-amber-600">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                {reservationStatus === 'Ongoing' ?
                  "The total has been recalculated based on actual operation times and differs from the stored value." :
                  reservationStatus === 'Pending Admin Approval' || reservationStatus === 'Approved' ?
                  "The total has been recalculated based on booked hours and differs from the stored value." :
                  "The displayed total has been recalculated from the services and differs from the database value."
                }
              </div>
            </div>
          )}
          
          {refreshError && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              Error: {refreshError}
            </div>
          )}
          
          {refreshSuccess && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              Database updated successfully!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CostBreakdown;