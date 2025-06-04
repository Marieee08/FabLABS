// Updated CostBreakdown.tsx without downtime deduction functionality
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Interface for DownTime (kept for compatibility)
interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null; // Time in minutes
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
}

// Interface for MachineUtilization (kept for compatibility)
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
  reservationId,
  allowFix = false
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [fixSuccess, setFixSuccess] = useState(false);

  // Format price to have 2 decimal places and currency symbol
  const formatPrice = (price: number | string | null): string => {
    if (price === null) return '₱0.00';
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₱${numericPrice.toFixed(2)}`;
  };
  
  // Calculate total from original service costs
  const calculatedTotal = userServices.reduce((sum, service) => {
    const cost = service.CostsAvail 
      ? (typeof service.CostsAvail === 'string' 
          ? parseFloat(service.CostsAvail) 
          : service.CostsAvail)
      : 0;
    return sum + cost;
  }, 0);

  // Check if there's a discrepancy between provided total and calculated total
  const storedTotal = totalAmountDue !== null ? 
    (typeof totalAmountDue === 'string' ? parseFloat(totalAmountDue) : totalAmountDue) : 
    0;
  
  const hasDiscrepancy = Math.abs(calculatedTotal - storedTotal) > 0.01 && totalAmountDue !== null;

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
          {userServices.map((service, index) => (
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
              </div>
              <div className="text-right">
                <span className="font-medium">
                  {formatPrice(service.CostsAvail)}
                </span>
              </div>
            </div>
          ))}
          
          <Separator className="my-3" />
          
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-lg">Total</span>
            <div className="text-right">
              <span className="font-bold text-lg">
                {formatPrice(calculatedTotal)}
              </span>
              {hasDiscrepancy && (
                <div className="text-xs text-amber-600 mt-1">
                  Recalculated from services
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