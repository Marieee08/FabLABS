// app/admin-dashboard/reports/page.tsx

"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, UserButton } from "@clerk/nextjs";
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
import { format } from 'date-fns';
import RoleGuard from '@/components/auth/role-guard';
import { DateRangeSelector } from '@/components/admin-reports/date-range-selector';
import { useDashboardData } from '@/components/admin-reports/use-dashboard-data';
import { DateRange } from 'react-day-picker';

const DashboardAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState("Loading...");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  // Use our custom hook for dashboard data
  const { data: dashboardData, isLoading, error, refreshData, lastUpdated } = useDashboardData();

  // useEffect to get user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isLoaded || !user) {
        setUserRole("Not logged in");
        return;
      }
  
      try {
        const response = await fetch('/api/auth/check-roles');
        if (!response.ok) {
          throw new Error('Failed to fetch role');
        }
        const data = await response.json();
        setUserRole(data.role || "No role assigned");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("Error fetching role");
      }
    };
  
    fetchUserRole();
  }, [user, isLoaded]);

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Pass the date range to the refreshData function
    refreshData(range);
  };

  // Color constants
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const RADIAN = Math.PI / 180;

  // Improved custom label for pie charts that handles position better
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    // Only show labels for segments that are big enough (more than 5%)
    if (percent < 0.05) return null;
    
    // Move labels further out from the pie
    const radius = innerRadius + (outerRadius - innerRadius) * 1.5; // Increase this multiplier
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#143370"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
        {/* Sidebar */}
        <aside className={`absolute left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-[#0d172c] duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
            <Link href="/" className="mt-5">
              <span className="text-white text-2xl font-bold font-qanelas4">FABLAB</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="block text-white lg:hidden">
              X
            </button>
          </div>
          <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          <div className="flex flex-col items-center py-8">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt="Profile" 
                  className="h-36 w-36 rounded-full object-cover mb-2"
                />
              ) : (
                <span className="h-36 w-36 rounded-full bg-gray-600 mb-2"></span>
              )}
              <h2 className="text-white text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-[#5e86ca]">{userRole}</p>
          </div>
            <div>
              <h3 className="mb-4 ml-4 text-sm font-semibold text-gray-400">MENU</h3>
              <ul className="mb-6 flex flex-col gap-1.5">
                <li>
                  <button
                    onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                    className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-white border border-transparent hover:bg-[#1c2a52] hover:border-[#5e86ca]"
                  >
                    <span>Orders</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-300 ${orderDropdownOpen ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </li>
                {orderDropdownOpen && (
                  <>
                    <li className="ml-6">
                      <Link href="/admin-dashboard" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-400 hover:text-white">
                        General
                      </Link>
                    </li>
                    <li className="ml-6">
                      <Link href="/admin-dashboard/history" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-400 hover:text-white">
                        History
                      </Link>
                    </li>
                    <li className="ml-6">
                      <Link href="/admin-dashboard/machines" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-400 hover:text-white">
                        Machines
                      </Link>
                    </li>
                    <li className="ml-6">
                      <Link href="/admin-dashboard/users" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-400 hover:text-white">
                        Users
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link href="/admin-dashboard/reports" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-white border bg-[#1c2a52] border-[#5e86ca]">
                    Reports
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <header className="sticky top-0 z-[999] flex w-full bg-white shadow-md">
            <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
              <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="block rounded-sm border border-stroke bg-white p-1.5 shadow-sm lg:hidden"
                >
                  Menu
                </button>
              </div>
              <div className="flex space-x-6 lg:space-x-10">
              <Link href="/" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Home
              </Link>
              <Link href="/user-services" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Services
              </Link>
              <Link href="/contact" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Contact
              </Link>
              </div>
              <div className="hidden sm:block">
                <form action="#" method="POST">
                  <input
                    type="text"
                    placeholder="Type to search..."
                    className="w-full bg-transparent pr-4 pl-9 focus:outline-none"
                  />
                </form>
              </div>
              <div className="flex items-center gap-3 2xsm:gap-7">
                <Link href="#" className="flex items-center gap-4">
                  <UserButton showName> </UserButton>
                </Link>
              </div>
            </div>
          </header>

          {/* Main */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 z-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Analytics Overview</h2>
                  <p className="text-sm text-[#143370] font-poppins1">{formattedDate}</p>
                </div>
                
                <div className="mt-4 sm:mt-0">
                  <Button 
                    onClick={() => refreshData()}
                    className="bg-[#143370] hover:bg-[#0d2555] text-white"
                  >
                    Refresh Data
                  </Button>
                </div>
              </div>

              {/* Date Range Selector */}
              <DateRangeSelector onRangeChange={handleDateRangeChange} />
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading dashboard data...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                    <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle>Pending Requests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <h2 className="text-4xl font-bold text-[#143370]">{dashboardData.pendingRequests}</h2>
                        <p className="text-sm text-[#143370]">Awaiting Approval</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle>Completed Requests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <h2 className="text-4xl font-bold text-[#143370]">{dashboardData.completedRequestsLastMonth}</h2>
                        <p className="text-sm text-[#143370]">Last 30 Days</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle>Active EVC Reservations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <h2 className="text-4xl font-bold text-[#143370]">{dashboardData.activeEVCReservations}</h2>
                        <p className="text-sm text-[#143370]">Currently Scheduled</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Machine Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">Machine Availability</CardTitle>
                        <p className="text-sm text-[#143370]">Current status of all machines</p>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {dashboardData.machineAvailability && 
                         (dashboardData.machineAvailability.available > 0 || dashboardData.machineAvailability.unavailable > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie
  data={dashboardData.serviceStats}
  cx="50%"
  cy="50%"
  labelLine={false} // Remove label lines
  label={false} // Remove direct labels
  outerRadius={80}
  fill="#8884d8"
  dataKey="value"
  nameKey="name"
>
  {/* Cells remain the same */}
</Pie>
<Tooltip formatter={(value, name) => [`${value} requests`, name]} />
<Legend verticalAlign="bottom" height={36} />
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
                    </Card>

                    {/* Request Trends */}
                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">Request Trends</CardTitle>
                        <p className="text-sm text-[#143370]">Monthly request volume over time</p>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {dashboardData.utilizationTrends && dashboardData.utilizationTrends.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={dashboardData.utilizationTrends}
                              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
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
                    </Card>
                  </div>
                  
                  {/* Service Breakdown and User Role Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">Service Popularity</CardTitle>
                        <p className="text-sm text-[#143370]">Most frequently used services</p>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {dashboardData.serviceStats && dashboardData.serviceStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <Pie
                                data={dashboardData.serviceStats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label
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
                    </Card>

                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">User Role Distribution</CardTitle>
                        <p className="text-sm text-[#143370]">Breakdown of users by role</p>
                      </CardHeader>
                      <CardContent className="h-[300px]">
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
                    </Card>
                  </div>
                  
                  {/* Machine Downtime and Repair Types */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">Machine Downtime</CardTitle>
                        <p className="text-sm text-[#143370]">Total downtime by machine (minutes)</p>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {dashboardData.machineDowntime && dashboardData.machineDowntime.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={dashboardData.machineDowntime}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                dataKey="machine" 
                                type="category" 
                                tick={{ fontSize: 12 }}
                                width={75}
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
                    </Card>

                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">Repair Types</CardTitle>
                        <p className="text-sm text-[#143370]">Frequency of repair types</p>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {dashboardData.repairsByType && dashboardData.repairsByType.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <Pie
                                data={dashboardData.repairsByType}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="type"
                                label={(props) => {
                                  const { type, percent } = props;
                                  return `${type}: ${(percent * 100).toFixed(0)}%`;
                                }}
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
                    </Card>
                  </div>

                  {/* User Satisfaction Radar Chart */}
                  <div className="mb-6">
                    <Card className="p-4 border border-[#5e86ca]">
                      <CardHeader>
                        <CardTitle className="text-[#143370]">User Satisfaction Metrics</CardTitle>
                        <p className="text-sm text-[#143370]">Average scores across different satisfaction categories (1-5 scale)</p>
                      </CardHeader>
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
                    </Card>
                  </div>

                  {/* Last updated information */}
                  <div className="text-right text-sm text-gray-500 mt-4">
                    {lastUpdated && (
                      <p>Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

export default DashboardAdmin;