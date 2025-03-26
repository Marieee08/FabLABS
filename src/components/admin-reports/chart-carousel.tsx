// src/components/admin-reports/chart-carousel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimeInterval, TimeIntervalSelector } from '@/components/admin-reports/time-interval-selector';
import { ChevronLeft, ChevronRight, BarChart3, LineChart, PieChart, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Chart Types
type ChartType = 'userRoles' | 'requests' | 'services' | 'satisfaction';

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
    requests: <RequestsChart data={dashboardData} isLoading={isLoading} timeInterval={timeInterval} />,
    services: <ServicesChart data={dashboardData} isLoading={isLoading} />,
    satisfaction: <SatisfactionChart data={dashboardData} isLoading={isLoading} />,
  };

  const chartTitles: Record<ChartType, string> = {
    userRoles: 'User Role Distribution',
    requests: 'Request Trends',
    services: 'Service Distribution',
    satisfaction: 'Customer Satisfaction',
  };

  const chartIcons: Record<ChartType, React.ReactNode> = {
    userRoles: <BarChart3 className="h-5 w-5" />,
    requests: <LineChart className="h-5 w-5" />,
    services: <PieChart className="h-5 w-5" />,
    satisfaction: <SmilePlus className="h-5 w-5" />,
  };

  // Navigate charts
  const navigateChart = (direction: 'prev' | 'next') => {
    const charts: ChartType[] = ['userRoles', 'requests', 'services', 'satisfaction'];
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
        {(['userRoles', 'requests', 'services', 'satisfaction'] as ChartType[]).map((chart) => (
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
const RequestsChart: React.FC<ChartComponentProps> = ({ data, isLoading, timeInterval }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Get utilization trends data from API
  const trendsData = data.utilizationTrends || [];
  
  // For debugging - log what we're getting from the API
  console.log('Utilization trends data:', trendsData);
  console.log('Current time interval:', timeInterval);
  
  // If no data is available, show a message
  if (trendsData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No request data available for the selected period</p>
      </div>
    );
  }

  // Extract periods (months/weeks/days) and request counts
  const periods = trendsData.map((item: { period: any; month: any; }) => item.period || item.month || '');
  const requestCounts = trendsData.map((item: { requests: any; }) => item.requests || 0);
  
  // Calculate total requests
  const totalRequests = requestCounts.reduce((sum: any, val: any) => sum + val, 0);
  
  // Calculate trend indicators
  const isIncreasing = requestCounts.length >= 2 && 
    requestCounts[requestCounts.length - 1] > requestCounts[requestCounts.length - 2];
  
  // Calculate average requests per period
  const avgRequests = totalRequests / requestCounts.length;
  
  // Find the maximum value for scaling the chart
  const maxValue = Math.max(...requestCounts, 1); // Ensure at least 1 to avoid division by zero

  // Calculate growth rate if we have enough data
  let growthRate = 0;
  if (requestCounts.length >= 2) {
    const firstValue = requestCounts[0];
    const lastValue = requestCounts[requestCounts.length - 1];
    
    if (firstValue > 0) {
      growthRate = ((lastValue - firstValue) / firstValue) * 100;
    }
  }

  return (
    <div className="h-80">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm font-medium text-gray-500">Total Requests</span>
          <div className="text-2xl font-bold text-[#143370]">{totalRequests}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">Avg. per {timeInterval}:</span>
            <span className="font-medium text-[#143370]">{Math.round(avgRequests)}</span>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500 mr-2">Trend:</span>
            <span className={`font-medium ${
              growthRate > 0 ? 'text-green-600' : 
              growthRate < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {growthRate > 0 ? '+' : ''}{Math.round(growthRate)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative h-56">
        {/* Chart Grid */}
        <div className="absolute inset-0 grid grid-cols-1" 
             style={{ gridTemplateColumns: `repeat(${periods.length}, 1fr)` }}>
          {periods.map((period: any, i: any) => (
            <div key={`grid-${period}-${i}`} className="flex flex-col h-full">
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
          <div className="flex w-full h-full gap-2">
            {periods.map((period: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined, i: string | number) => {
              // Determine bar color based on comparison to average
              const barColor = requestCounts[i] >= avgRequests ? '#4b71b5' : '#a3b9e2';
              
              return (
                <div key={`col-${period}-${i}`} className="flex-1 flex flex-col justify-end items-center">
                  {/* Request count bar */}
                  <div 
                    className={`w-full max-w-[30px] rounded-t-sm transition-all duration-300`}
                    style={{ 
                      height: `${maxValue > 0 ? (requestCounts[i] / maxValue) * 100 : 0}%`,
                      backgroundColor: barColor
                    }}
                  ></div>
                  
                  {/* Actual count number */}
                  <div className="text-xs font-medium text-[#143370] mt-1">
                    {requestCounts[i]}
                  </div>
                  
                  {/* X-axis label */}
                  <div className="text-xs text-gray-500 mt-1 truncate w-full text-center" 
                       style={{ maxWidth: '100%' }}>
                    {period}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-[#4b71b5] rounded-sm mr-1"></div>
          <span>Above Average</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-[#a3b9e2] rounded-sm mr-1"></div>
          <span>Below Average</span>
        </div>
      </div>
    </div>
  );
};

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
  
  // Define colors for the services (you can extend this array for more services)
  const colors = ['#4b71b5', '#143370', '#5e86ca', '#a3b9e2', '#2c5282', '#7ea0d4', '#3b5998', '#8da9e1'];
  
  // Sort services by usage (most used first) and add colors
  const servicesWithColors = [...serviceStats]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .map((service, index) => ({
      ...service,
      color: colors[index % colors.length]
    }));
  
  // Calculate total for percentages
  const total = servicesWithColors.reduce((sum, service) => sum + (service.value || 0), 0);
  
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
          <div className="text-xs text-gray-500">
            {servicesWithColors.length > 0 && `${Math.min(servicesWithColors.length, 8)} services shown`}
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

// Customer Satisfaction Chart
// Updated SatisfactionChart component for improved visualization and data handling
const SatisfactionChart: React.FC<ChartComponentProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Get satisfaction data from API
  const satisfactionScores = data.satisfactionScores || [];
  
  // For debugging - log what we're getting from the API
  console.log('Satisfaction data:', satisfactionScores);
  
  // If no data is available, show a message
  if (satisfactionScores.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No satisfaction data available for the selected period</p>
      </div>
    );
  }

  // Map for full category descriptions to provide better context
  const categoryDescriptions: Record<string, string> = {
    'Service Quality': 'I am satisfied with the services that I availed.',
    'Staff Knowledge': 'I spent reasonable amount of time for my transaction.',
    'Responsiveness': 'The office followed the transaction\'s requirements and steps based on the information provided.',
    'Timeliness': 'The steps (including payment) I needed to do for my transaction were easy and simple.',
    'Equipment Quality': 'I easily found information about my transaction from the office\'s website.',
    'Process Efficiency': 'I paid a reasonable amount of fees for my transaction.',
    'Communication': 'I am confident my transaction was secure.',
    'Value for Money': 'The office\'s support was available, and (if asked questions) support was quick to respond.',
    'Overall Experience': 'I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.'
  };

  // Calculate overall average satisfaction
  const overallScore = satisfactionScores.reduce((sum: any, item: { score: any; }) => sum + (item.score || 0), 0) / 
                      satisfactionScores.length;
  
  // Find min and max category scores for highlighting
  const scores = satisfactionScores.map((item: { score: any; }) => item.score || 0);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  // Determine which categories have max/min scores
  const maxCategory = satisfactionScores.find((item: { score: number; }) => item.score === maxScore)?.category || '';
  const minCategory = satisfactionScores.find((item: { score: number; }) => item.score === minScore)?.category || '';

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return '#10b981'; // Green for excellent scores
    if (score >= 4) return '#4ade80'; // Light green for very good scores
    if (score >= 3.5) return '#4b71b5'; // Blue for good scores
    if (score >= 3) return '#60a5fa'; // Light blue for average scores
    if (score >= 2) return '#f59e0b'; // Yellow for below average scores
    return '#ef4444';  // Red for poor scores
  };

  // Helper function to get score label
  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4) return 'Very Good';
    if (score >= 3.5) return 'Good';
    if (score >= 3) return 'Average';
    if (score >= 2) return 'Fair';
    return 'Poor';
  };

  // Radar chart settings
  const centerX = 150; // Center X coordinate
  const centerY = 150; // Center Y coordinate
  const maxRadius = 100; // Maximum radius of the chart
  const categories = satisfactionScores.length;
  
  // Calculate points for each category on the radar
  const calculatePoint = (index: number, value: number) => {
    // Calculate angle for this category (in radians)
    const angleStep = (Math.PI * 2) / categories;
    const angle = index * angleStep - Math.PI / 2; // Start from top
    
    // Calculate distance from center (scale the value)
    const scaledValue = (value / 5) * maxRadius; // Assuming max score is 5
    
    // Calculate x,y coordinates
    const x = centerX + scaledValue * Math.cos(angle);
    const y = centerY + scaledValue * Math.sin(angle);
    
    return { x, y };
  };
  
  // Generate radar polygon points
  const radarPoints = satisfactionScores.map((item: { score: any; }, index: number) => 
    calculatePoint(index, item.score || 0)
  );
  
  // Create SVG path for the radar polygon
  const radarPath = radarPoints.map((point: { x: any; y: any; }, index: number) => 
    index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
  ).join(' ') + ' Z'; // Z to close the path

  // Create background grid lines (5 levels)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const radius = ((i + 1) / 5) * maxRadius;
    const gridPoints = Array.from({ length: categories }, (_, j) => 
      calculatePoint(j, (i + 1))
    );
    
    const gridPath = gridPoints.map((point, index) => 
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    ).join(' ') + ' Z';
    
    return gridPath;
  });

  // Create axis lines (from center to each category)
  const axisLines = satisfactionScores.map((_: any, index: number) => {
    const point = calculatePoint(index, 5); // Full length to max score of 5
    return `M ${centerX} ${centerY} L ${point.x} ${point.y}`;
  });

  return (
    <div className="h-80 w-full">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">Customer Satisfaction</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold" style={{ color: getScoreColor(overallScore) }}>
                {overallScore.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 ml-2">/ 5.0 Overall Score</span>
              <span className="ml-3 px-2 py-0.5 text-xs rounded-full" 
                    style={{ 
                      backgroundColor: `${getScoreColor(overallScore)}20`, 
                      color: getScoreColor(overallScore) 
                    }}>
                {getScoreLabel(overallScore)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Highest:</span>
              <span className="font-medium text-green-600">{maxCategory} ({maxScore.toFixed(1)})</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 mr-2">Lowest:</span>
              <span className="font-medium text-amber-600">{minCategory} ({minScore.toFixed(1)})</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Radar Chart */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* Background grid */}
                {gridLines.map((path, i) => (
                  <path 
                    key={`grid-${i}`} 
                    d={path} 
                    fill="none" 
                    stroke="#e5e7eb" 
                    strokeWidth="1"
                  />
                ))}
                
                {/* Score labels on grid lines */}
                {[1, 2, 3, 4, 5].map((score) => (
                  <text
                    key={`score-${score}`}
                    x={centerX + 5}
                    y={centerY - (score / 5) * maxRadius + 5}
                    fontSize="8"
                    fill="#9ca3af"
                  >
                    {score}
                  </text>
                ))}
                
                {/* Axis lines */}
                {axisLines.map((path: string | undefined, i: any) => (
                  <path 
                    key={`axis-${i}`} 
                    d={path} 
                    fill="none" 
                    stroke="#e5e7eb" 
                    strokeWidth="1"
                  />
                ))}
                
                {/* Category labels */}
                {satisfactionScores.map((item: { score: number; category: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }, index: number) => {
                  const point = calculatePoint(index, 5.5); // Slightly beyond max radius
                  return (
                    <text 
                      key={`label-${index}`} 
                      x={point.x} 
                      y={point.y} 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="#4b5563"
                      style={{
                        fontWeight: item.score === maxScore || item.score === minScore ? 'bold' : 'normal'
                      }}
                    >
                      {item.category}
                    </text>
                  );
                })}
                
                {/* Radar polygon */}
                <path 
                  d={radarPath} 
                  fill="url(#gradientFill)" 
                  fillOpacity="0.4" 
                  stroke="#4b71b5" 
                  strokeWidth="2"
                />
                
                {/* Define gradient for radar fill */}
                <defs>
                  <linearGradient id="gradientFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4b71b5" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                
                {/* Data points */}
                {radarPoints.map((point, index) => {
                  const score = satisfactionScores[index].score || 0;
                  const scoreColor = getScoreColor(score);
                  
                  return (
                    <g key={`point-${index}`}>
                      {/* Highlight the point area */}
                      <circle 
                        cx={point.x} 
                        cy={point.y} 
                        r="4" 
                        fill={scoreColor}
                        stroke="white"
                        strokeWidth="1"
                      />
                      {/* Add score label near point */}
                      <text
                        x={point.x + (point.x > centerX ? 10 : -10)}
                        y={point.y}
                        textAnchor={point.x > centerX ? "start" : "end"}
                        fontSize="9"
                        fontWeight="bold"
                        fill={scoreColor}
                      >
                        {score.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
                
                {/* Center circle */}
                <circle cx={centerX} cy={centerY} r="3" fill="#e5e7eb" />
              </svg>
            </div>
          </div>
          
          {/* Scores List */}
          <div className="flex flex-col justify-center">
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {satisfactionScores.map((item: { score: number; category: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<React.AwaitedReactNode> | null | undefined; }, index: any) => {
                const score = item.score || 0;
                const scoreColor = getScoreColor(score);
                const tooltip = categoryDescriptions[item.category] || '';
                
                return (
                  <div key={`score-${index}`} 
                       className="flex items-center group relative"
                       title={tooltip}>
                    <div className="w-7/12 pr-2">
                      <div className="text-sm font-medium text-gray-700 truncate group-hover:underline">
                        {item.category}
                      </div>
                    </div>
                    <div className="w-5/12">
                      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(score / 5) * 100}%`,
                            backgroundColor: scoreColor
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-xs font-medium text-gray-800">
                            {score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
                      <div>{tooltip}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: "Poor", color: "#ef4444", range: "< 2.0" },
                  { label: "Fair", color: "#f59e0b", range: "2.0-3.0" },
                  { label: "Average", color: "#60a5fa", range: "3.0-3.5" },
                  { label: "Good", color: "#4b71b5", range: "3.5-4.0" },
                  { label: "Very Good", color: "#4ade80", range: "4.0-4.5" },
                  { label: "Excellent", color: "#10b981", range: "4.5+" },
                ].map((legend, i) => (
                  <div key={`legend-${i}`} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-sm mr-1"
                      style={{ backgroundColor: legend.color }}
                    ></div>
                    <span className="text-xs text-gray-600">{legend.label}</span>
                  </div>
                ))}
              </div>
            </div>
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