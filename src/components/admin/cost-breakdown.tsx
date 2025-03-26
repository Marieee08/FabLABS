// src/components/admin/cost-breakdown.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { UserService } from '@/types/reservation'; // Adjust import path as needed

interface CostBreakdownProps {
  userServices: UserService[];
  totalAmountDue: number | string | null;
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
  
  // Calculate total from services to ensure accuracy
  const calculatedTotal = userServices.reduce((sum, service) => {
    const serviceCost = service.CostsAvail 
      ? typeof service.CostsAvail === 'string' 
        ? parseFloat(service.CostsAvail) 
        : service.CostsAvail 
      : 0;
    return sum + serviceCost;
  }, 0);

  // Check if there's a discrepancy between provided total and calculated total
  const storedTotal = totalAmountDue !== null ? 
    (typeof totalAmountDue === 'string' ? parseFloat(totalAmountDue) : totalAmountDue) : 
    0;
  
  const hasDiscrepancy = Math.abs(calculatedTotal - storedTotal) > 0.01 && totalAmountDue !== null;

  // Always use the calculated total to ensure it's correct
  const displayTotal = calculatedTotal;

  // Function to fix the total in the database
  const handleFixTotal = async () => {
    if (!reservationId) return;
    
    try {
      setIsFixing(true);
      setFixError(null);
      setFixSuccess(false);
      
      console.log(`Sending update request for reservation ${reservationId} with total: ${calculatedTotal}`);
      
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
              <span className="font-bold text-lg">{formatPrice(displayTotal)}</span>
              {hasDiscrepancy && (
                <div className="text-xs text-amber-600 mt-1">
                  Total recalculated (stored: {formatPrice(storedTotal)})
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