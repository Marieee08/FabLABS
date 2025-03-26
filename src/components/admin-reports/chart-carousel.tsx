// src/components/admin-reports/enhanced-chart-carousel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimeInterval, TimeIntervalSelector } from '@/components/admin-reports/time-interval-selector';
import { ChevronLeft, ChevronRight, BarChart3, LineChart, PieChart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Chart Types
type ChartType = 'utilization' | 'requests' | 'services' | 'reservations';

// Props Interface
interface EnhancedChartCarouselProps {
  dashboardData: any;
  isLoading: boolean;
  error: Error | null;
  timeInterval: TimeInterval;
  onTimeIntervalChange: (interval: TimeInterval) => void;
}

export const EnhancedChartCarousel: React.FC<EnhancedChartCarouselProps> = ({
  dashboardData,
  isLoading,
  error,
  timeInterval,
  onTimeIntervalChange,
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>('utilization');

  // To prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Chart Mapping
  const chartComponents: Record<ChartType, React.ReactNode> = {
    utilization: <MachineUtilizationChart data={dashboardData?.machineUtilization || []} isLoading={isLoading} timeInterval={timeInterval} />,
    requests: <RequestsChart data={dashboardData?.requests || []} isLoading={isLoading} timeInterval={timeInterval} />,
    services: <ServicesChart data={dashboardData?.services || []} isLoading={isLoading} />,
    reservations: <ReservationsChart data={dashboardData?.reservations || []} isLoading={isLoading} timeInterval={timeInterval} />,
  };

  const chartTitles: Record<ChartType, string> = {
    utilization: 'Machine Utilization',
    requests: 'Request Trends',
    services: 'Service Distribution',
    reservations: 'Reservation Schedule',
  };

  const chartIcons: Record<ChartType, React.ReactNode> = {
    utilization: <BarChart3 className="h-5 w-5" />,
    requests: <LineChart className="h-5 w-5" />,
    services: <PieChart className="h-5 w-5" />,
    reservations: <Activity className="h-5 w-5" />,
  };

  // Navigate charts
  const navigateChart = (direction: 'prev' | 'next') => {
    const charts: ChartType[] = ['utilization', 'requests', 'services', 'reservations'];
    const currentIndex = charts.indexOf(activeChart);
    
    if (direction === 'prev') {
      const prevIndex = currentIndex === 0 ? charts.length - 1 : currentIndex - 1;
      setActiveChart(charts[prevIndex]);
    } else {
      const nextIndex = currentIndex === charts.length - 1 ? 0 : currentIndex + 1;
      setActiveChart(charts[nextIndex]);
    }
  };

  if (error) {
    return (
      <Card className="bg-white shadow-sm p-6 mb-6">
        <div className="text-center text-red-500 py-8">
          <p>Error loading chart data: {error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-6">
      {/* Chart Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {chartIcons[activeChart]}
          <h3 className="text-lg font-semibold ml-2 text-[#143370]">{chartTitles[activeChart]}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <TimeIntervalSelector 
            selectedInterval={timeInterval} 
            onIntervalChange={onTimeIntervalChange} 
          />
          
          <div className="flex space-x-1 ml-4">
            <Button 
              onClick={() => navigateChart('prev')}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => navigateChart('next')}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Chart Cards */}
      <Card className="bg-white shadow-sm overflow-hidden">
        <CardContent className="p-6">
          {chartComponents[activeChart]}
        </CardContent>
      </Card>
      
      {/* Chart Selection Pills */}
      <div className="flex justify-center mt-4 space-x-2">
        {(['utilization', 'requests', 'services', 'reservations'] as ChartType[]).map((chart) => (
          <button
            key={chart}
            onClick={() => setActiveChart(chart)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              activeChart === chart 
                ? 'bg-[#143370] text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {chartTitles[chart]}
          </button>
        ))}
      </div>
    </div>
  );
};

// Chart Components - Each optimized for performance
interface ChartComponentProps {
  data: any[];
  isLoading: boolean;
  timeInterval?: TimeInterval;
}

// Machine Utilization Chart
const MachineUtilizationChart: React.FC<ChartComponentProps> = ({ data, isLoading, timeInterval }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Implemented with efficient rendering strategy
  return (
    <div className="h-80 w-full">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Overall Utilization</span>
            <span className="text-2xl font-bold text-[#143370]">63%</span>
          </div>
          <div className="space-x-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#4b71b5]"></span>
            <span className="text-xs text-gray-500">Current Period</span>
            <span className="inline-block h-3 w-3 rounded-full bg-[#a3b9e2]"></span>
            <span className="text-xs text-gray-500">Previous Period</span>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative flex flex-col">
            <div className="h-8 flex items-center">
              <span className="text-sm font-medium text-gray-600">Laser Cutter</span>
              <span className="ml-auto text-sm font-medium text-[#143370]">74%</span>
            </div>
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#4b71b5] rounded-full" style={{ width: '74%' }}></div>
            </div>
            <div className="h-8 flex items-center mt-2">
              <span className="text-sm font-medium text-gray-600">3D Printer</span>
              <span className="ml-auto text-sm font-medium text-[#143370]">68%</span>
            </div>
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#4b71b5] rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="h-8 flex items-center mt-2">
              <span className="text-sm font-medium text-gray-600">CNC Machine</span>
              <span className="ml-auto text-sm font-medium text-[#143370]">52%</span>
            </div>
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#4b71b5] rounded-full" style={{ width: '52%' }}></div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center items-center">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#4b71b5"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - 0.63)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#143370]">63%</span>
                <span className="text-sm text-gray-500">Average</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Requests Chart
const RequestsChart: React.FC<ChartComponentProps> = ({ data, isLoading, timeInterval }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Sample data - you'll replace with actual data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const values = [28, 42, 35, 47, 52, 43, 55, 47, 60];
  const prevValues = [20, 32, 30, 40, 45, 40, 48, 42, 50];
  
  // Max value for scaling
  const maxValue = Math.max(...values, ...prevValues);

  return (
    <div className="h-80">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm font-medium text-gray-500">Total Requests</span>
          <div className="text-2xl font-bold text-[#143370]">409</div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-[#4b71b5] mr-1"></span>
            <span className="text-xs text-gray-500">Current</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-[#a3b9e2] mr-1"></span>
            <span className="text-xs text-gray-500">Previous</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-56">
        {/* Chart Grid */}
        <div className="absolute inset-0 grid grid-cols-9 gap-0.5">
          {months.map((month, i) => (
            <div key={month} className="flex flex-col h-full">
              <div className="flex-1 border-t border-gray-200"></div>
            </div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          <div>{maxValue}</div>
          <div>{Math.floor(maxValue/2)}</div>
          <div>0</div>
        </div>
        
        {/* Chart Values */}
        <div className="absolute inset-0 pt-4 pb-6 pl-6 flex items-end">
          <div className="flex w-full h-full gap-0.5">
            {months.map((month, i) => (
              <div key={`col-${month}`} className="flex-1 flex flex-col justify-end items-center gap-1">
                {/* Previous period bar */}
                <div 
                  className="w-6 bg-[#a3b9e2] rounded-t-sm"
                  style={{ height: `${(prevValues[i] / maxValue) * 100}%` }}
                ></div>
                
                {/* Current period bar */}
                <div 
                  className="w-6 bg-[#4b71b5] rounded-t-sm"
                  style={{ height: `${(values[i] / maxValue) * 100}%` }}
                ></div>
                
                {/* X-axis label */}
                <div className="text-xs text-gray-500 mt-2">{month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Services Chart
const ServicesChart: React.FC<ChartComponentProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }
  
  // Sample data
  const services = [
    { name: '3D Printing', value: 35, color: '#4b71b5' },
    { name: 'Laser Cutting', value: 25, color: '#143370' },
    { name: 'CNC Milling', value: 20, color: '#5e86ca' },
    { name: 'Other Services', value: 20, color: '#a3b9e2' },
  ];
  
  // Calculate total for percentages
  const total = services.reduce((sum, service) => sum + service.value, 0);
  
  // Calculate stroke dasharray and dashoffset
  const calculateStroke = (percentage: number, index: number) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate previous percentages
    const previousPercentages = services
      .slice(0, index)
      .reduce((sum, service) => sum + (service.value / total) * 100, 0);
    
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage / 100);
    const rotation = (previousPercentages * 3.6) - 90; // Convert percentage to degrees, -90 to start at top
    
    return {
      strokeDasharray,
      strokeDashoffset,
      rotation
    };
  };

  return (
    <div className="h-80">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Services Distribution</span>
            <div className="text-2xl font-bold text-[#143370]">{total} Services</div>
          </div>
        </div>
        
        <div className="flex flex-1">
          {/* Pie Chart */}
          <div className="w-1/2 flex items-center justify-center">
            <div className="relative h-48 w-48">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {services.map((service, index) => {
                  const percentage = (service.value / total) * 100;
                  const { strokeDasharray, strokeDashoffset, rotation } = calculateStroke(percentage, index);
                  
                  return (
                    <circle
                      key={service.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={service.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
                    />
                  );
                })}
                <circle cx="50" cy="50" r="30" fill="white" />
              </svg>
            </div>
          </div>
          
          {/* Legend */}
          <div className="w-1/2 flex flex-col justify-center">
            {services.map(service => (
              <div key={service.name} className="flex items-center mb-3">
                <div 
                  className="h-4 w-4 rounded-sm mr-2"
                  style={{ backgroundColor: service.color }}
                ></div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  <span className="text-sm font-bold text-[#143370]">
                    {Math.round((service.value / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reservations Chart
const ReservationsChart: React.FC<ChartComponentProps> = ({ data, isLoading, timeInterval }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }
  
  // Sample data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9am to 5pm
  
  // Random availability data - replace with real data
  const availability = days.map(() => 
    hours.map(() => Math.random() > 0.3)
  );

  return (
    <div className="h-80 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-medium text-gray-500">Reservation Schedule</span>
          <div className="text-2xl font-bold text-[#143370]">Weekly View</div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-[#4b71b5] mr-1"></span>
            <span className="text-xs text-gray-500">Available</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-[#e5e7eb] mr-1"></span>
            <span className="text-xs text-gray-500">Booked</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-px bg-gray-200">
        {/* Time labels */}
        <div className="bg-white p-2">
          <div className="h-8"></div> {/* Empty cell for alignment */}
          {hours.map(hour => (
            <div key={hour} className="h-8 flex items-center">
              <span className="text-xs text-gray-500">{hour}:00</span>
            </div>
          ))}
        </div>
        
        {/* Days */}
        {days.map((day, dayIndex) => (
          <div key={day} className="bg-white">
            {/* Day label */}
            <div className="h-8 p-2 flex items-center justify-center border-b">
              <span className="text-sm font-medium text-gray-700">{day}</span>
            </div>
            
            {/* Hours */}
            {hours.map((hour, hourIndex) => (
              <div 
                key={`${day}-${hour}`} 
                className={`h-8 p-1 ${hourIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div 
                  className={`h-full rounded ${availability[dayIndex][hourIndex] ? 'bg-[#4b71b5] bg-opacity-20 border border-[#4b71b5]' : 'bg-gray-200'}`}
                ></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Skeleton
const ChartSkeleton: React.FC = () => {
  return (
    <div className="h-80 flex flex-col">
      <div className="h-10 flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="flex-1 bg-gray-100 rounded animate-pulse"></div>
    </div>
  );
};

export default EnhancedChartCarousel;