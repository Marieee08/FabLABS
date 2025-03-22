// components/admin-reports/use-time-aggregated-data.ts
import { useMemo } from 'react';
import { 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  format, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  isSameYear,
  parseISO,
  endOfWeek,
  endOfMonth,
  endOfYear
} from 'date-fns';
import { TimeInterval } from './time-interval-selector';

type TimeSeriesData = {
  date: Date | string;
  [key: string]: any;
}[];

export function useTimeAggregatedData<T extends TimeSeriesData>(
  data: T,
  timeInterval: TimeInterval,
  dateField: string = 'date'
) {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group data by the specified time interval
    const groupedData = data.reduce((acc, item) => {
      const itemDate = typeof item[dateField] === 'string' 
        ? parseISO(item[dateField] as string) 
        : item[dateField] as Date;
      
      let groupKey: string;
      let periodStart: Date;
      let periodEnd: Date;
      
      switch (timeInterval) {
        case 'day':
          periodStart = startOfDay(itemDate);
          groupKey = format(periodStart, 'yyyy-MM-dd');
          break;
        case 'week':
          periodStart = startOfWeek(itemDate, { weekStartsOn: 1 });
          periodEnd = endOfWeek(itemDate, { weekStartsOn: 1 });
          groupKey = `${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'MMM dd')}`;
          break;
        case 'month':
          periodStart = startOfMonth(itemDate);
          groupKey = format(periodStart, 'MMM yyyy');
          break;
        case 'year':
          periodStart = startOfYear(itemDate);
          groupKey = format(periodStart, 'yyyy');
          break;
        default:
          periodStart = startOfDay(itemDate);
          groupKey = format(periodStart, 'yyyy-MM-dd');
      }
      
      if (!acc[groupKey]) {
        acc[groupKey] = {
          period: groupKey,
          periodStart,
          items: [],
          aggregatedValues: {}
        };
      }
      
      acc[groupKey].items.push(item);
      
      return acc;
    }, {} as Record<string, { period: string; periodStart: Date; items: T; aggregatedValues: Record<string, number> }>);
    
    // Convert to array and sort by date
    const result = Object.values(groupedData)
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
    
    return result;
  }, [data, timeInterval, dateField]);
}

// Helper function for checking if a date belongs to a specific interval
export function isInSameInterval(date: Date, referenceDate: Date, interval: TimeInterval): boolean {
  switch (interval) {
    case 'day':
      return isSameDay(date, referenceDate);
    case 'week':
      return isSameWeek(date, referenceDate, { weekStartsOn: 1 });
    case 'month':
      return isSameMonth(date, referenceDate);
    case 'year':
      return isSameYear(date, referenceDate);
    default:
      return isSameDay(date, referenceDate);
  }
}

// Function to generate formatted dates for chart display
export function getFormattedDate(date: Date, interval: TimeInterval): string {
  switch (interval) {
    case 'day':
      return format(date, 'MMM dd');
    case 'week':
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`;
    case 'month':
      return format(date, 'MMM yyyy');
    case 'year':
      return format(date, 'yyyy');
    default:
      return format(date, 'MMM dd, yyyy');
  }
}

// Function to aggregate values based on interval
export function aggregateDataByTimeInterval<T extends TimeSeriesData>(
  data: T,
  timeInterval: TimeInterval,
  dateField: string = 'date',
  valueFields: string[] = []
) {
  const aggregatedData = useTimeAggregatedData(data, timeInterval, dateField);
  
  return aggregatedData.map(group => {
    const result: Record<string, any> = {
      period: group.period,
      date: group.periodStart
    };
    
    // Aggregate numeric values for specified fields
    if (valueFields.length > 0) {
      valueFields.forEach(field => {
        result[field] = group.items.reduce((sum, item) => {
          return sum + (Number(item[field]) || 0);
        }, 0);
      });
    } else {
      // If no specific fields are provided, aggregate all numeric fields
      const sampleItem = group.items[0];
      Object.keys(sampleItem).forEach(key => {
        if (key !== dateField && typeof sampleItem[key] === 'number') {
          result[key] = group.items.reduce((sum, item) => {
            return sum + (Number(item[key]) || 0);
          }, 0);
        }
      });
    }
    
    // Add count of items
    result.count = group.items.length;
    
    return result;
  });
}