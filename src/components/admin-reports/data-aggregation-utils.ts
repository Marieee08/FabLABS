// components/admin-reports/data-aggregation-utils.ts
import {
    startOfDay,
    startOfWeek,
    startOfMonth,
    startOfYear,
    endOfWeek,
    endOfMonth,
    endOfYear,
    format,
    parseISO,
    isValid
  } from 'date-fns';
  import { TimeInterval } from './time-interval-selector';
  
  /**
   * Get the period key for a date based on the time interval
   */
  export function getPeriodKey(date: Date | string, timeInterval: TimeInterval): string {
    const parsedDate = typeof date === 'string' ? 
      (isValid(new Date(date)) ? new Date(date) : parseISO(date)) : 
      date;
    
    switch (timeInterval) {
      case 'day':
        return format(parsedDate, 'yyyy-MM-dd');
      case 'week':
        const weekStart = startOfWeek(parsedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(parsedDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
      case 'month':
        return format(parsedDate, 'MMM yyyy');
      case 'year':
        return format(parsedDate, 'yyyy');
      default:
        return format(parsedDate, 'yyyy-MM-dd');
    }
  }
  
  /**
   * Get the normalized date for grouping based on time interval
   */
  export function getNormalizedDate(date: Date | string, timeInterval: TimeInterval): Date {
    const parsedDate = typeof date === 'string' ? 
      (isValid(new Date(date)) ? new Date(date) : parseISO(date)) : 
      date;
    
    switch (timeInterval) {
      case 'day':
        return startOfDay(parsedDate);
      case 'week':
        return startOfWeek(parsedDate, { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(parsedDate);
      case 'year':
        return startOfYear(parsedDate);
      default:
        return startOfDay(parsedDate);
    }
  }
  
  /**
   * Aggregate time series data by the specified interval
   * @param data Array of objects with date fields
   * @param timeInterval The time granularity (day, week, month, year)
   * @param dateField The name of the date field in each object
   * @param valueFields The fields to aggregate (sum)
   */
  export function aggregateTimeSeriesData<T extends Record<string, any>>(
    data: T[],
    timeInterval: TimeInterval,
    dateField: string = 'date',
    valueFields: string[] = []
  ): any[] {
    if (!data || data.length === 0) return [];
  
    // Group data by time period
    const groupedData: Record<string, { 
      periodKey: string, 
      date: Date, 
      count: number, 
      values: Record<string, number> 
    }> = {};
  
    data.forEach(item => {
      // Handle the date field
      const itemDate = item[dateField];
      if (!itemDate) return;
  
      const parsedDate = typeof itemDate === 'string' ? 
        (isValid(new Date(itemDate)) ? new Date(itemDate) : parseISO(itemDate)) : 
        itemDate;
      
      const periodDate = getNormalizedDate(parsedDate, timeInterval);
      const periodKey = getPeriodKey(parsedDate, timeInterval);
      
      // Initialize group if it doesn't exist
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          periodKey,
          date: periodDate,
          count: 0,
          values: {}
        };
        
        // Initialize value fields with 0
        valueFields.forEach(field => {
          groupedData[periodKey].values[field] = 0;
        });
      }
      
      // Increment count and sum values
      groupedData[periodKey].count += 1;
      
      // Sum numeric values for value fields
      valueFields.forEach(field => {
        const value = Number(item[field]) || 0;
        groupedData[periodKey].values[field] = (groupedData[periodKey].values[field] || 0) + value;
      });
    });
  
    // Convert to array and format for charts
    const result = Object.values(groupedData).map(group => {
      const resultItem: Record<string, any> = {
        period: group.periodKey,
        date: group.date,
        count: group.count
      };
      
      // Add aggregated values
      valueFields.forEach(field => {
        resultItem[field] = group.values[field];
      });
      
      return resultItem;
    });
  
    // Sort by date
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  /**
   * Aggregates utilization trends data by time interval
   */
  export function aggregateUtilizationTrends(
    data: { month: string; requests: number }[],
    timeInterval: TimeInterval
  ): { period: string; requests: number }[] {
    // For utilization trends, we need to parse the month string
    if (!data || data.length === 0) return [];
    
    try {
      // Convert the month string to a date for proper grouping
      const dataWithDates = data.map(item => {
        // If month is just a month name like "Jan", we need to add a year
        const monthStr = item.month.length <= 3 ? `${item.month} 2023` : item.month;
        return {
          ...item,
          date: new Date(monthStr),
          requests: item.requests || 0
        };
      });
      
      // Use the general function for aggregation
      return aggregateTimeSeriesData(
        dataWithDates,
        timeInterval,
        'date',
        ['requests']
      );
    } catch (error) {
      console.error("Error aggregating utilization trends:", error);
      return data.map(item => ({ period: item.month, requests: item.requests }));
    }
  }
  
  /**
   * Generate x-axis ticks based on time interval
   */
  export function generateTimeIntervalTicks(
    startDate: Date, 
    endDate: Date, 
    interval: TimeInterval,
    maxTicks: number = 12
  ): Date[] {
    const ticks: Date[] = [];
    let currentDate = new Date(startDate);
    
    // Define the step function based on interval
    let stepFunction: (date: Date) => Date;
    
    switch(interval) {
      case 'day':
        stepFunction = d => {
          const newDate = new Date(d);
          newDate.setDate(d.getDate() + 1);
          return newDate;
        };
        break;
      case 'week':
        stepFunction = d => {
          const newDate = new Date(d);
          newDate.setDate(d.getDate() + 7);
          return newDate;
        };
        break;
      case 'month':
        stepFunction = d => {
          const newDate = new Date(d);
          newDate.setMonth(d.getMonth() + 1);
          return newDate;
        };
        break;
      case 'year':
        stepFunction = d => {
          const newDate = new Date(d);
          newDate.setFullYear(d.getFullYear() + 1);
          return newDate;
        };
        break;
      default:
        stepFunction = d => {
          const newDate = new Date(d);
          newDate.setDate(d.getDate() + 1);
          return newDate;
        };
    }
    
    // Generate ticks
    while (currentDate <= endDate) {
      ticks.push(new Date(currentDate));
      currentDate = stepFunction(currentDate);
    }
    
    // If we have too many ticks, reduce them
    if (ticks.length > maxTicks) {
      const step = Math.ceil(ticks.length / maxTicks);
      return ticks.filter((_, i) => i % step === 0);
    }
    
    return ticks;
  }