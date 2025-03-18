// components/admin-reports/use-dashboard-data.tsx - Updated with date range
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface DashboardData {
  serviceStats: { name: string; value: number }[];
  utilizationTrends: { month: string; requests: number }[];
  machineAvailability: { available: number; unavailable: number };
  userRoleDistribution: { name: string; value: number }[];
  pendingRequests: number;
  completedRequestsLastMonth: number;
  activeEVCReservations: number;
  satisfactionScores: { category: string; score: number }[];
  machineDowntime: { machine: string; downtime: number }[];
  repairsByType: { type: string; count: number }[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(getDefaultData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [responseDetails, setResponseDetails] = useState<any>(null);
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const fetchData = async (dateRange?: DateRange) => {
    setIsLoading(true);
    setError(null);
    setResponseDetails(null);

    if (dateRange) {
      setCurrentDateRange(dateRange);
    }

    try {
      console.log("Fetching dashboard data with date range:", dateRange || currentDateRange);
      
      // Build URL with date range parameters
      let url = '/api/admin/reports';
      const params = new URLSearchParams();
      
      if ((dateRange || currentDateRange)?.from) {
        params.append('from', (dateRange || currentDateRange)!.from!.toISOString());
      }
      
      if ((dateRange || currentDateRange)?.to) {
        params.append('to', (dateRange || currentDateRange)!.to!.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log("API URL with parameters:", url);
      
      const response = await fetch(url);
      
      console.log("Response status:", response.status, response.statusText);
      setResponseDetails({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch data: ${response.status} ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          console.error("Error response data:", errorData);
          errorDetails = errorData;
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch (parseErr) {
          console.error("Could not parse error response:", parseErr);
          try {
            const textContent = await response.text();
            console.error("Error response text:", textContent.substring(0, 500));
            errorDetails = { text: textContent.substring(0, 1000) };
          } catch (textErr) {
            console.error("Could not get error text:", textErr);
          }
        }
        
        setResponseDetails(prev => ({ ...prev, errorDetails }));
        throw new Error(errorMessage);
      }

      const jsonData = await response.json();
      console.log("Received data from API (keys):", Object.keys(jsonData));
      
      setData({
        ...getDefaultData(),
        ...jsonData
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = (dateRange?: DateRange) => {
    fetchData(dateRange);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData,
    lastUpdated,
    responseDetails,
    currentDateRange
  };
}

function getDefaultData(): DashboardData {
  return {
    serviceStats: [{ name: 'No Data', value: 1 }],
    utilizationTrends: [
      { month: 'Jan', requests: 0 },
      { month: 'Feb', requests: 0 },
      { month: 'Mar', requests: 0 }
    ],
    machineAvailability: { available: 1, unavailable: 0 },
    userRoleDistribution: [{ name: 'No Users', value: 0 }],
    pendingRequests: 0,
    completedRequestsLastMonth: 0,
    activeEVCReservations: 0,
    satisfactionScores: Array(9).fill(0).map((_, i) => ({ category: `SQD${i}`, score: 0 })),
    machineDowntime: [{ machine: 'No Data', downtime: 0 }],
    repairsByType: [{ type: 'No Data', count: 1 }]
  };
}