// src\components\admin-reports\chart-carousel.tsx
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
  Radar,
  AreaChart,
  Area
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
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
  
  // Define all the charts you want to include in the carousel
  const charts = [
    {
      id: 'machinesUsed',
      title: 'Machines Used',
      description: 'Most frequently used machines',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.machinesUsed && dashboardData.machinesUsed.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dashboardData.machinesUsed || [
                  { machine: 'CNC Machine', count: 25 },
                  { machine: '3D Printer', count: 18 },
                  { machine: 'Laser Cutter', count: 15 },
                  { machine: 'Milling Machine', count: 12 },
                  { machine: 'Waterjet Cutter', count: 8 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="machine" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} uses`]} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="count" name="Number of Uses" fill="#8884d8" />
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
      id: 'servicesAvailed',
      title: 'Services Availed',
      description: 'Most popular services',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.serviceStats && dashboardData.serviceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={dashboardData.serviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
      id: 'salesData',
      title: 'Sales Data',
      description: 'Monthly sales revenue',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.salesData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={dashboardData.salesData || [
                  { month: 'Jan', revenue: 4500 },
                  { month: 'Feb', revenue: 5200 },
                  { month: 'Mar', revenue: 4800 },
                  { month: 'Apr', revenue: 6000 },
                  { month: 'May', revenue: 5700 },
                  { month: 'Jun', revenue: 6200 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`]} />
                <Legend verticalAlign="top" height={36} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
              </AreaChart>
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
      id: 'reservationsByType',
      title: 'Reservations',
      description: 'Number of reservations by type',
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
                  name="Reservations"
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
      id: 'userSatisfaction',
      title: 'User Satisfaction',
      description: 'User feedback ratings across categories',
      component: () => (
        <CardContent className="h-[400px]">
          {dashboardData.satisfactionScores && dashboardData.satisfactionScores.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                cx="50%" 
                cy="50%" 
                outerRadius="70%" 
                data={dashboardData.satisfactionScores || [
                  { category: 'Service Quality', score: 4.2 },
                  { category: 'Staff Helpfulness', score: 4.5 },
                  { category: 'Equipment Quality', score: 4.0 },
                  { category: 'Timeliness', score: 3.8 },
                  { category: 'Value for Money', score: 4.3 },
                  { category: 'Overall Experience', score: 4.4 }
                ]}
              >
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#143370', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar 
                  name="Satisfaction Score (out of 5)" 
                  dataKey="score" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <Tooltip formatter={(value) => [`${value} / 5`]} />
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