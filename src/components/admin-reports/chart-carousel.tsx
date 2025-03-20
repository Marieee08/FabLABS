// ChartCarousel.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Define the chart data interface based on your dashboard data
interface ChartCarouselProps {
  dashboardData: any;
  isLoading: boolean;
  error: string | null;
}

const ChartCarousel: React.FC<ChartCarouselProps> = ({ dashboardData, isLoading, error }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Define the COLORS array
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Define all the charts you want to include in the carousel
  const charts = [
    {
      id: 'machineAvailability',
      title: 'Machine Availability',
      description: 'Current status of all machines',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.machineAvailability && 
           (dashboardData.machineAvailability.available > 0 || dashboardData.machineAvailability.unavailable > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Available', value: dashboardData.machineAvailability.available },
                    { name: 'Unavailable', value: dashboardData.machineAvailability.unavailable }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#FF8042" />
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} machines`, name]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    },
    {
      id: 'requestTrends',
      title: 'Request Trends',
      description: 'Monthly request volume over time',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.utilizationTrends && dashboardData.utilizationTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={dashboardData.utilizationTrends}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line
                  name="Request Volume"
                  type="monotone"
                  dataKey="requests"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    },
    {
      id: 'servicePopularity',
      title: 'Service Popularity',
      description: 'Most frequently used services',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.serviceStats && dashboardData.serviceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={dashboardData.serviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {dashboardData.serviceStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} requests`, name]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    },
    {
      id: 'userRoleDistribution',
      title: 'User Role Distribution',
      description: 'Breakdown of users by role',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.userRoleDistribution && dashboardData.userRoleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dashboardData.userRoleDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} users`]} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="value" name="Number of Users" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    },
    {
      id: 'machineDowntime',
      title: 'Machine Downtime',
      description: 'Total downtime by machine (minutes)',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.machineDowntime && dashboardData.machineDowntime.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dashboardData.machineDowntime}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="machine" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={90}
                />
                <Tooltip formatter={(value) => [`${value} minutes`]} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="downtime" name="Downtime (minutes)" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    },
    {
      id: 'repairTypes',
      title: 'Repair Types',
      description: 'Frequency of repair types',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.repairsByType && dashboardData.repairsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={dashboardData.repairsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                >
                  {dashboardData.repairsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} repairs`, name]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    },
    {
      id: 'userSatisfaction',
      title: 'User Satisfaction Metrics',
      description: 'Average scores across different satisfaction categories (1-5 scale)',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.satisfactionScores && dashboardData.satisfactionScores.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                cx="50%" 
                cy="50%" 
                outerRadius="70%" 
                data={dashboardData.satisfactionScores}
              >
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#143370', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar 
                  name="Satisfaction Score" 
                  dataKey="score" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      )
    }
  ];

  // Navigate to the next chart
  const nextChart = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % charts.length);
  };

  // Navigate to the previous chart
  const prevChart = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + charts.length) % charts.length);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="border border-[#5e86ca]">
        <CardHeader>
          <CardTitle className="text-[#143370]">{charts[currentIndex].title}</CardTitle>
          <p className="text-sm text-[#143370]">{charts[currentIndex].description}</p>
        </CardHeader>
        
        {charts[currentIndex].component()}
        
        <div className="flex justify-between items-center px-6 py-4">
          <Button 
            onClick={prevChart}
            className="bg-[#143370] hover:bg-[#0d2555] text-white"
          >
            Previous
          </Button>
          <div className="flex space-x-2">
            {charts.map((chart, index) => (
              <button
                key={chart.id}
                className={`w-3 h-3 rounded-full ${
                  index === currentIndex ? 'bg-[#143370]' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`View ${chart.title}`}
              />
            ))}
          </div>
          <Button 
            onClick={nextChart}
            className="bg-[#143370] hover:bg-[#0d2555] text-white"
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChartCarousel;