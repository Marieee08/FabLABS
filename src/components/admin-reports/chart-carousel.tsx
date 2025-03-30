// src/components/admin-reports/chart-carousel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimeInterval, TimeIntervalSelector } from '@/components/admin-reports/time-interval-selector';
import { ChevronLeft, ChevronRight, BarChart3, LineChart, PieChart, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateServicesPdf } from '@/components/admin-reports/services-report-pdf';

// Chart Types
type ChartType = 'userRoles' | 'services';

// Props Interface
interface EnhancedChartCarouselProps {
  dashboardData: any;
  isLoading: boolean;
  error: Error | null;
  timeInterval: TimeInterval;
  onTimeIntervalChange: (interval: TimeInterval) => void;
}

// Chart Component Props
interface ChartComponentProps {
  data: any;
  isLoading: boolean;
  timeInterval?: TimeInterval;
}

export const EnhancedChartCarousel: React.FC<EnhancedChartCarouselProps> = ({
  dashboardData,
  isLoading,
  error,
  timeInterval,
  onTimeIntervalChange,
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>('userRoles');

  // To prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Chart Mapping
  const chartComponents: Record<ChartType, React.ReactNode> = {
    userRoles: <UserRolesChart data={dashboardData} isLoading={isLoading} timeInterval={timeInterval} />,
    services: <ServicesChart data={dashboardData} isLoading={isLoading} />,
  };

  const chartTitles: Record<ChartType, string> = {
    userRoles: 'User Role Distribution',
    services: 'Service Distribution',
  };

  const chartIcons: Record<ChartType, React.ReactNode> = {
    userRoles: <BarChart3 className="h-5 w-5" />,
    services: <PieChart className="h-5 w-5" />,
  };

  // Navigate charts
  const navigateChart = (direction: 'prev' | 'next') => {
    const charts: ChartType[] = ['userRoles',, 'services'];
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
            value={timeInterval}
            onChange={onTimeIntervalChange} 
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
        {(['userRoles', 'services'] as ChartType[]).map((chart) => (
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

// User Role Distribution Chart
const UserRolesChart: React.FC<ChartComponentProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Get user role distribution data from API
  const userRoles = data.userRoleDistribution || [];
  
  // For debugging - log what we're getting from the API
  console.log('User role distribution data:', userRoles);
  
  // If no data is available, show a message
  if (userRoles.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No user role data available</p>
      </div>
    );
  }

  // Define colors for different roles
  const roleColors: Record<string, string> = {
    'ADMIN': '#143370',    // Dark blue for admins
    'MSME': '#4b71b5',     // Medium blue for MSMEs
    'STUDENT': '#5e86ca',  // Light blue for students
    'CASHIER': '#a3b9e2',  // Pale blue for cashiers
    'USER': '#7ea0d4',     // Another blue for regular users
    'TEACHER': '#2c5282',  // Another blue variant for teachers
  };

  // Sort roles by count (most to least)
  const sortedRoles = [...userRoles].sort((a, b) => (b.value || 0) - (a.value || 0));
  
  // Calculate total users
  const totalUsers = sortedRoles.reduce((total, role) => total + (role.value || 0), 0);

  return (
    <div className="h-80 w-full">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">User Distribution</span>
            <span className="text-2xl font-bold text-[#143370]">{totalUsers} Total Users</span>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Distribution Bars */}
          <div className="relative flex flex-col">
            {sortedRoles.map((role, index) => {
              const percentage = Math.round((role.value / totalUsers) * 100);
              const roleColor = roleColors[role.name] || '#4b71b5'; // Default color if role not found
              
              return (
                <React.Fragment key={role.name}>
                  <div className="h-8 flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-sm mr-2"
                        style={{ backgroundColor: roleColor }}
                      ></div>
                      <span className="text-sm font-medium text-gray-600">{role.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-2">{role.value}</span>
                      <span className="text-sm font-medium text-[#143370] w-[40px] text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: roleColor 
                      }}
                    ></div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          
          {/* Pie Chart */}
          <div className="flex flex-col justify-center items-center">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {sortedRoles.map((role, index) => {
                  // Calculate start and end angles for this slice
                  const roleColor = roleColors[role.name] || '#4b71b5'; // Default color
                  const percentage = (role.value / totalUsers) * 100;
                  
                  // Calculate the total percentage of all previous slices
                  const previousTotal = sortedRoles
                    .slice(0, index)
                    .reduce((sum, r) => sum + ((r.value / totalUsers) * 100), 0);
                  
                  // Convert percentages to radians
                  const startAngle = (previousTotal / 100) * Math.PI * 2 - Math.PI / 2;
                  const endAngle = ((previousTotal + percentage) / 100) * Math.PI * 2 - Math.PI / 2;
                  
                  // Calculate points for the path
                  const startX = 50 + 40 * Math.cos(startAngle);
                  const startY = 50 + 40 * Math.sin(startAngle);
                  const endX = 50 + 40 * Math.cos(endAngle);
                  const endY = 50 + 40 * Math.sin(endAngle);
                  
                  // Determine if the arc should be drawn as a large arc (more than 180 degrees)
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  // Create the path for this slice
                  const path = [
                    `M 50 50`, // Move to center
                    `L ${startX} ${startY}`, // Line to start point
                    `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc to end point
                    `Z` // Close path back to center
                  ].join(' ');
                  
                  return (
                    <path
                      key={role.name}
                      d={path}
                      fill={roleColor}
                      stroke="white"
                      strokeWidth="1"
                    />
                  );
                })}
                <circle cx="50" cy="50" r="20" fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#143370]">{totalUsers}</span>
                <span className="text-sm text-gray-500">Users</span>
              </div>
            </div>
            
            {/* Add additional stats if available */}
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                {sortedRoles.length} different user roles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Improved RequestsChart Component

// Improved ServicesChart Component
const ServicesChart: React.FC<ChartComponentProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }
  
  // Get service stats from API
  const serviceStats = data.serviceStats || [];
  
  // For debugging - log what we're getting from the API
  console.log('Service stats data:', serviceStats);
  
  // If no data is available, show a message
  if (serviceStats.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No service data available for the selected period</p>
      </div>
    );
  }
  
  // Define colors for the services
  const colors = ['#4b71b5', '#143370', '#5e86ca', '#a3b9e2', '#2c5282', '#7ea0d4', '#3b5998', '#8da9e1'];
  
  // Sort services by usage (most used first) and add colors
  const servicesWithColors = [...serviceStats]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .map((service, index) => ({
      ...service,
      color: colors[index % colors.length]
    }));
  
  // Calculate total for percentages
  const total = servicesWithColors.reduce((sum, service) => sum + (service.value || 0), 0)

  const handleGeneratePdf = () => {
    generateServicesPdf({
      title: 'Services Distribution Report',
      totalUsages: total,
      services: servicesWithColors
    });
  };
  
  // Calculate stroke dasharray and dashoffset for pie chart
  const calculateStroke = (percentage: number, index: number) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate previous percentages to determine rotation
    const previousPercentages = servicesWithColors
      .slice(0, index)
      .reduce((sum, service) => sum + ((service.value / total) * 100), 0);
    
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
            <div className="text-2xl font-bold text-[#143370]">{total} Total Usages</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">
              {servicesWithColors.length > 0 && `${Math.min(servicesWithColors.length, 8)} services shown`}
            </div>
            <Button 
              onClick={handleGeneratePdf}
              size="sm"
              className="bg-[#143370] hover:bg-[#1a4496] text-white"
            >
              Generate PDF
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1">
          {/* Pie Chart */}
          <div className="w-1/2 flex items-center justify-center">
            <div className="relative h-48 w-48">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {servicesWithColors.map((service, index) => {
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
              {/* Total in the middle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-[#143370]">{total}</span>
                <span className="text-xs text-gray-500">Total Usages</span>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="w-1/2 flex flex-col justify-center max-h-full overflow-y-auto">
            {servicesWithColors.map(service => {
              // Calculate percentage
              const percentage = Math.round((service.value / total) * 100);
              
              return (
                <div key={service.name} className="flex items-center mb-3">
                  <div 
                    className="h-4 w-4 rounded-sm mr-2 flex-shrink-0"
                    style={{ backgroundColor: service.color }}
                  ></div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]" title={service.name}>
                      {service.name}
                    </span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">
                        {service.value}
                      </span>
                      <span className="text-sm font-bold text-[#143370] w-[40px] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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