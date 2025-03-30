// Updated CostBreakdown.tsx with downtime deduction
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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
    originalCost?: number 
  }>>([]);

  // Calculate downtime adjustments when component mounts or dependencies change
  useEffect(() => {
    calculateDowntimeAdjustments();
  }, [userServices, machineUtilizations]);

  // Format price to have 2 decimal places and currency symbol
  const formatPrice = (price: number | string | null): string => {
    if (price === null) return '₱0.00';
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₱${numericPrice.toFixed(2)}`;
  };

  // Calculate downtime adjustments for each service
  const calculateDowntimeAdjustments = () => {
    const adjustedServices = userServices.map(service => {
      // Find machine utilization for this service and equipment
      const matchingMachineUtils = machineUtilizations.filter(util => 
        util.ServiceName === service.ServiceAvail && 
        service.EquipmentAvail.includes(util.Machine || '')
      );

      // Sum all downtime minutes for this service
      const totalDowntimeMinutes = matchingMachineUtils.reduce((total, util) => {
        return total + util.DownTimes.reduce((minutes, downtime) => 
          minutes + (downtime.DTTime || 0), 0);
      }, 0);

      // Get original cost
      const originalCost = service.CostsAvail 
        ? (typeof service.CostsAvail === 'string' 
            ? parseFloat(service.CostsAvail) 
            : service.CostsAvail)
        : 0;

      // Get minutes for rate calculation (default to 60 if not specified)
      const minutes = service.MinsAvail || 60;
      
      // Calculate cost per minute
      const costPerMinute = minutes > 0 ? originalCost / minutes : 0;
      
      // Calculate deduction based on downtime minutes
      const downtimeDeduction = costPerMinute * totalDowntimeMinutes;
      
      // Calculate adjusted cost (never go below zero)
      const adjustedCost = Math.max(0, originalCost - downtimeDeduction);

      return {
        ...service,
        downtimeMinutes: totalDowntimeMinutes,
        originalCost,
        adjustedCost
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
      
      // Updated to use the App Router API path
      const response = await fetch(`/api/admin/update-total/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: calculatedTotal
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update total amount');
      }
      
      console.log('Update successful:', result);
      setFixSuccess(true);
      
      // Wait 1 second before reloading to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error fixing total:', error);
      setFixError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {adjustedUserServices.map((service, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <div className="flex-1">
                <span className="font-medium">{service.ServiceAvail}</span>
                {service.EquipmentAvail && (
                  <div className="text-sm text-gray-600 mt-1">
                    Equipment: {service.EquipmentAvail}
                  </div>
                )}
                {service.MinsAvail && (
                  <div className="text-sm text-gray-600">
                    Duration: {service.MinsAvail} mins
                  </div>
                )}
                
                {/* Show downtime badge if there are downtime minutes */}
                {(service.downtimeMinutes || 0) > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Down: {service.downtimeMinutes} mins
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="p-2 max-w-xs bg-white shadow-lg rounded-md">
                        <div className="text-xs">
                          <p className="font-medium">Downtime Adjustment</p>
                          <p>Original Cost: {formatPrice(service.originalCost)}</p>
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
          
          {/* Show total downtime if any */}
          {totalDowntimeMinutes > 0 && (
            <div className="bg-amber-50 p-2 rounded-md mb-2">
              <div className="text-sm text-amber-700 flex justify-between">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Downtime: {totalDowntimeMinutes} minutes
                </span>
                <span>
                  Deduction: {formatPrice(totalDowntimeDeduction)}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-lg">Total</span>
          <div className="text-right">
            <span className="font-bold text-lg">
              {formatPrice(calculatedTotal)}
            </span>
            {hasDiscrepancy && (
              <div className="text-xs text-amber-600 mt-1">
                {totalDowntimeMinutes > 0 ? "Adjusted for downtime" : "Recalculated from services"}
              </div>
            )}
          </div>
        </div>

          {hasDiscrepancy && allowFix && reservationId && (
            <div className="mt-3 p-2 rounded bg-amber-50 space-y-2">
              <div className="text-sm text-amber-600">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                The displayed total has been recalculated from the services and differs from the database value.
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
                      Update Database Total
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