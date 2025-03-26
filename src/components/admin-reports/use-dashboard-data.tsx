// Enhanced useDashboardData hook to ensure correct handling of satisfaction data
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface SatisfactionScore {
  category: string;
  score: number;
  responseCount?: number; // Optional count of responses for this category
}

export interface DashboardData {
  serviceStats: { name: string; value: number }[];
  utilizationTrends: { month: string; requests: number }[];
  machineAvailability: { available: number; unavailable: number; percentageAvailable: string };
  userRoleDistribution: { name: string; value: number }[];
  pendingRequests: number;
  completedRequestsLastMonth: number;
  activeEVCReservations: number;
  satisfactionScores: SatisfactionScore[];
  machineDowntime: { machine: string; downtime: number }[];
  repairsByType: { type: string; count: number }[];
  // Add any other data structures needed for your dashboard
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(getDefaultData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const fetchData = useCallback(async (dateRange?: DateRange) => {
    setIsLoading(true);
    setError(null);

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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log("Received dashboard data:", jsonData);
      
      // Validate satisfaction scores data
      if (jsonData.satisfactionScores) {
        console.log("Raw satisfaction scores:", jsonData.satisfactionScores);
        
        // Ensure the data is in the correct format
        const validatedSatisfactionScores = jsonData.satisfactionScores.map((item: any) => ({
          category: item.category || "Unknown",
          score: typeof item.score === 'number' ? item.score : 0,
          responseCount: item.responseCount || 0
        }));
        
        console.log("Validated satisfaction scores:", validatedSatisfactionScores);
        jsonData.satisfactionScores = validatedSatisfactionScores;
      }
      
      setData({
        ...getDefaultData(),
        ...jsonData
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [currentDateRange]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to refresh data
  const refreshData = useCallback((dateRange?: DateRange) => {
    fetchData(dateRange);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refreshData,
    lastUpdated,
    currentDateRange
  };
}

// Default data structure with realistic placeholders
function getDefaultData(): DashboardData {
  return {
    serviceStats: [{ name: 'Loading...', value: 0 }],
    utilizationTrends: [],
    machineAvailability: { available: 0, unavailable: 0, percentageAvailable: "0" },
    userRoleDistribution: [{ name: 'Loading...', value: 0 }],
    pendingRequests: 0,
    completedRequestsLastMonth: 0,
    activeEVCReservations: 0,
    satisfactionScores: [
      { category: 'Service Quality', score: 0 },
      { category: 'Staff Knowledge', score: 0 },
      { category: 'Responsiveness', score: 0 },
      { category: 'Timeliness', score: 0 },
      { category: 'Equipment Quality', score: 0 },
      { category: 'Process Efficiency', score: 0 },
      { category: 'Communication', score: 0 },
      { category: 'Value for Money', score: 0 },
      { category: 'Overall Experience', score: 0 }
    ],
    machineDowntime: [],
    repairsByType: []
  };
}