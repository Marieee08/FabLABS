// src/components/admin/cost-breakdown.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Clock, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from 'sonner';

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
}

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface CostBreakdownProps {
  userServices: UserService[];
  totalAmountDue: number | string | null;
  machineUtilizations?: MachineUtilization[];
  reservationId?: number;
  allowFix?: boolean;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({ 
  userServices, 
  totalAmountDue,
  machineUtilizations = [],
  reservationId,
  allowFix = false
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [adjustedUserServices, setAdjustedUserServices] = useState<Array<UserService & { 
    downtimeMinutes?: number, 
    adjustedCost?: number,
    originalCost?: number,
    adjustedMins?: number,
    originalMins?: number
  }>>([]);

  // Calculate downtime adjustments when component mounts or dependencies change
  useEffect(() => {
    calculateDowntimeAdjustments();
  }, [userServices, machineUtilizations]);

  // Format price to have 2 decimal places and currency symbol
  const formatPrice = (price: number | string | null): string => {
    if (price === null || price === undefined) return '₱0.00';
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₱${numericPrice.toFixed(2)}`;
  };

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
  };
  
  // Calculate total from adjusted services
  const calculatedTotal = adjustedUserServices.reduce((sum, service) => {
    return sum + (service.adjustedCost || 0);
  }, 0);

  // Check if there's a discrepancy between provided total and calculated total
  const storedTotal = totalAmountDue !== null ? 
    (typeof totalAmountDue === 'string' ? parseFloat(totalAmountDue) : totalAmountDue) : 
    0;
  
  const hasDiscrepancy = Math.abs(calculatedTotal - storedTotal) > 0.01 && totalAmountDue !== null;

  // Calculate total downtime
  const totalDowntimeMinutes = adjustedUserServices.reduce((sum, service) => 
    sum + (service.downtimeMinutes || 0), 0);

  // Calculate total downtime deduction
  const totalDowntimeDeduction = adjustedUserServices.reduce((sum, service) => 
    sum + ((service.originalCost || 0) - (service.adjustedCost || 0)), 0);

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
                
                {/* Show downtime badge if there are downtime minutes */}
                {(service.downtimeMinutes || 0) > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="text-right">
                {/* Show original cost with strikethrough if there's a downtime deduction */}
                {(service.downtimeMinutes || 0) > 0 && (
                  <div className="text-sm text-gray-500 line-through mb-1">
                    {formatPrice(service.originalCost)}
                  </div>
                )}
                <span className={`font-medium ${(service.downtimeMinutes || 0) > 0 ? 'text-amber-600' : ''}`}>
                  {formatPrice(service.adjustedCost || service.CostsAvail)}
                </span>
              </div>
            </div>
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
                </span>
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

          {/* Show fix button if there's a discrepancy */}
          {hasDiscrepancy && allowFix && reservationId && (
            <div className="mt-3 p-2 rounded bg-amber-50 space-y-2">
              <div className="text-sm text-amber-600 flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  The displayed total has been recalculated based on service times and downtime deductions. 
                  It differs from the value stored in the database.
                </span>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdown;