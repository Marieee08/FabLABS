import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface ServiceCost {
  Service: string;
  Costs: number | string;
  Per: string;
}

interface DateInfo {
  day: Day;
  duration: number;
  billableHours: number;
  cost: number;
}

interface GroupedServiceData {
  [serviceName: string]: {
    service: ServiceCost;
    dates: DateInfo[];
    totalServiceCost: number;
    machineQuantity: number;
  }
}

interface CostReviewProps {
  selectedServices: string[];
  days: Day[];
  serviceMachineNumbers?: {[service: string]: number};
  onCostCalculated?: (cost: number) => void;
  onServiceCostsCalculated?: (serviceData: GroupedServiceData) => void;
}

export const CostReviewTable: React.FC<CostReviewProps> = ({ 
  selectedServices, 
  days, 
  serviceMachineNumbers = {}, 
  onCostCalculated = () => {},
  onServiceCostsCalculated = () => {} 
}) => {
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedData, setGroupedData] = useState<GroupedServiceData>({});

  const getNumericCost = useCallback((cost: number | string): number => {
    if (typeof cost === 'number') return cost;
    const cleanedCost = cost.replace(/[₱,]/g, '');
    const parsedCost = parseFloat(cleanedCost);
    return isNaN(parsedCost) ? 0 : parsedCost;
  }, []);

  const calculateDuration = useCallback((startTime: string | null, endTime: string | null): number => {
    if (!startTime || !endTime) return 0;
    
    const convertTo24Hour = (time: string): string => {
      const [timePart, meridiem] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (meridiem?.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (meridiem?.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const start24 = startTime.toLowerCase().includes('m') ? convertTo24Hour(startTime) : startTime;
    const end24 = endTime.toLowerCase().includes('m') ? convertTo24Hour(endTime) : endTime;
    
    const [startHour, startMinute] = start24.split(':').map(Number);
    const [endHour, endMinute] = end24.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const durationInHours = (endTotalMinutes - startTotalMinutes) / 60;
    return durationInHours > 0 ? durationInHours : 0;
  }, []);

  const calculateBillableHours = useCallback((duration: number): number => {
    return Math.ceil(duration);
  }, []);

  useEffect(() => {
    const fetchServiceCosts = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch service costs');
        const data = await response.json();
        setServiceCosts(data);
      } catch (err) {
        setError('Failed to load service costs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceCosts();
  }, []);

  useEffect(() => {
    if (!serviceCosts.length || !selectedServices.length || !days.length) {
      setGroupedData({});
      return;
    }
    
    // Group data by service for clearer organization
    const calculatedGroupedData: GroupedServiceData = selectedServices.reduce<GroupedServiceData>((acc, serviceName) => {
      const service = serviceCosts.find(s => s.Service === serviceName);
      if (!service || !service.Costs) return acc;
      
      // Get machine quantity for this service (default to 1 if not specified)
      const machineQuantity = serviceMachineNumbers[serviceName] || 1;
      
      if (!acc[serviceName]) {
        acc[serviceName] = { 
          service, 
          dates: [], 
          totalServiceCost: 0,
          machineQuantity
        };
      }
      
      return acc;
    }, {});

    // Fill the grouped data with dates and costs
    Object.keys(calculatedGroupedData).forEach(serviceName => {
      const { service, machineQuantity } = calculatedGroupedData[serviceName];
      let serviceTotalCost = 0;
      
      days.forEach(day => {
        const duration = calculateDuration(day.startTime, day.endTime);
        const billableHours = calculateBillableHours(duration);
        const numericCost = getNumericCost(service.Costs);
        
        // Multiply cost by machine quantity
        const cost = billableHours * numericCost * machineQuantity;
        
        calculatedGroupedData[serviceName].dates.push({
          day,
          duration,
          billableHours,
          cost
        });
        
        serviceTotalCost += cost;
      });
      
      calculatedGroupedData[serviceName].totalServiceCost = serviceTotalCost;
    });

    setGroupedData(calculatedGroupedData);
    
    // Call the callback with the calculated data
    onServiceCostsCalculated(calculatedGroupedData);
    
    // Calculate and report the total cost
    let totalCost = 0;
    Object.values(calculatedGroupedData).forEach(data => {
      totalCost += data.totalServiceCost;
    });
    onCostCalculated(totalCost);
    
  }, [serviceCosts, selectedServices, days, serviceMachineNumbers, getNumericCost, calculateDuration, calculateBillableHours, onCostCalculated, onServiceCostsCalculated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="p-3 text-left border text-gray-700 font-semibold">Service</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Date</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Duration</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Rate</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Machines</th>
            <th className="p-3 text-left border text-gray-700 font-semibold">Cost</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([serviceName, data], serviceIndex) => (
            <React.Fragment key={serviceName}>
              {data.dates.map((dateInfo, dateIndex) => (
                <tr 
                  key={`${serviceName}-${dateIndex}`} 
                  className={`
                    ${dateIndex === data.dates.length - 1 && serviceIndex !== Object.keys(groupedData).length - 1 ? 'border-b-2 border-gray-200' : 'border-b'} 
                    hover:bg-gray-50
                  `}
                >
                  {dateIndex === 0 ? (
                    <td className="p-3 border font-medium" rowSpan={data.dates.length}>
                      {serviceName}
                    </td>
                  ) : null}
                  <td className="p-3 border">
                    {new Date(dateInfo.day.date).toLocaleDateString('en-US', {
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </td>
                  <td className="p-3 border">
                    {dateInfo.duration.toFixed(2)} hours
                    {dateInfo.duration !== dateInfo.billableHours && (
                      <div className="text-xs text-gray-500">
                        (Billed as {dateInfo.billableHours} {dateInfo.billableHours === 1 ? 'hour' : 'hours'})
                      </div>
                    )}
                  </td>
                  <td className="p-3 border">
                    ₱{getNumericCost(data.service.Costs).toFixed(2)} per {data.service.Per}
                  </td>
                  <td className="p-3 border">
                    {data.machineQuantity} {data.machineQuantity === 1 ? 'machine' : 'machines'}
                  </td>
                  <td className="p-3 border">₱{dateInfo.cost.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-b hover:bg-blue-100">
                <td colSpan={5} className="p-3 border text-right font-medium">
                  Subtotal for {serviceName}
                </td>
                <td className="p-3 border text-blue-700 font-medium">
                  ₱{data.totalServiceCost.toFixed(2)}
                </td>
              </tr>
            </React.Fragment>
          ))}
          <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
            <td colSpan={5} className="p-3 border text-right">Total Cost</td>
            <td className="p-3 border text-blue-800">
              ₱{Object.values(groupedData).reduce((total, data) => total + data.totalServiceCost, 0).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};