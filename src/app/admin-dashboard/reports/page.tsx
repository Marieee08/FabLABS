// src/app/admin-dashboard/reports/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUser, UserButton } from "@clerk/nextjs";
import { DateRange } from 'react-day-picker';
import { FileIcon, RefreshCw, Download } from "lucide-react";

import { DateRangeSelector } from '@/components/admin-reports/date-range-selector';
import { useDashboardData } from '@/components/admin-reports/use-dashboard-data';
import { TimeInterval } from '@/components/admin-reports/time-interval-selector';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import RoleGuard from '@/components/auth/role-guard';
import { EnhancedChartCarousel } from '@/components/admin-reports/chart-carousel';

const ReportsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [generatingReport, setGeneratingReport] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('month');

  // Use the custom hook to fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refreshData, 
    lastUpdated,
  } = useDashboardData();

  // useEffect to fetch user role
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
    refreshData(range);
  };

  // Handle time interval change
  const handleTimeIntervalChange = (interval: TimeInterval) => {
    setTimeInterval(interval);
  };

  // Handle Generate Report
  const handleGenerateReport = () => {
    setGeneratingReport(true);
    // Placeholder for PDF generation - will be implemented later
    setTimeout(() => {
      setGeneratingReport(false);
    }, 1500);
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
                    <span>Reservations</span>
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
                <Link href="/services" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
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
                  <UserButton />
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
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Button 
                    onClick={() => refreshData()}
                    className="bg-[#143370] hover:bg-[#0d2555] text-white"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button 
                    onClick={handleGenerateReport}
                    className="bg-[#5e86ca] hover:bg-[#4b71b5] text-white"
                    disabled={generatingReport || isLoading}
                  >
                    {generatingReport ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileIcon className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Date Range Selector */}
              <DateRangeSelector onRangeChange={handleDateRangeChange} />
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                <MetricCard 
                  title="Pending Requests" 
                  value={dashboardData?.pendingRequests || 0} 
                  description="Awaiting Approval"
                  color="#143370"
                  isLoading={isLoading}
                />

                <MetricCard 
                  title="Completed Requests" 
                  value={dashboardData?.completedRequestsLastMonth || 0} 
                  description="in the last 30 Days"
                  color="#143370"
                  isLoading={isLoading}
                />

                <MetricCard 
                  title="Active EVC Reservations" 
                  value={dashboardData?.activeEVCReservations || 0} 
                  description="Currently Scheduled"
                  color="#143370"
                  isLoading={isLoading}
                />
              </div>
              
              {/* Chart Carousel - Using the enhanced version */}
              <EnhancedChartCarousel 
                dashboardData={dashboardData || {}} 
                isLoading={isLoading} 
                error={error} 
                timeInterval={timeInterval}
                onTimeIntervalChange={handleTimeIntervalChange}
              />
              
              {/* Last updated information */}
              <div className="text-right text-sm text-gray-500 mt-4">
                {lastUpdated && (
                  <p>Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}</p>
                )}
              </div>

              {/* Download section */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-[#5e86ca]">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-[#143370] mb-2">Report Downloads</h3>
                    <p className="text-sm text-gray-600">Export data for your records or presentations</p>
                  </div>
                  <Button 
                    onClick={handleGenerateReport}
                    className="bg-[#143370] hover:bg-[#0d2555] text-white"
                    disabled={generatingReport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {generatingReport ? 'Processing...' : 'Download PDF Report'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card className="bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-full mr-4">
                          <FileIcon className="h-6 w-6 text-[#143370]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Usage Statistics</h4>
                          <p className="text-xs text-gray-500">CSV, Excel</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full mr-4">
                          <FileIcon className="h-6 w-6 text-[#143370]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Machine Report</h4>
                          <p className="text-xs text-gray-500">PDF, Excel</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full mr-4">
                          <FileIcon className="h-6 w-6 text-[#143370]" />
                        </div>
                        <div>
                          <h4 className="font-medium">User Activity</h4>
                          <p className="text-xs text-gray-500">PDF, CSV</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  color: string;
  isLoading: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, color, isLoading }) => {
  return (
    <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca] overflow-hidden">
      <div className="h-1 bg-[#5e86ca]"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-md"></div>
        ) : (
          <h2 className="text-4xl font-bold" style={{ color }}>{value}</h2>
        )}
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
};

export default ReportsPage;