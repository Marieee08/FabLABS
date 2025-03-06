"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, UserButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  Cell
} from 'recharts';
import { format } from 'date-fns';
import RoleGuard from '@/components/auth/role-guard';


const DashboardAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState("Loading...");

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

  const reservationTrendsData = [
    { month: 'Jan', reservations: 40 },
    { month: 'Feb', reservations: 30 },
    { month: 'Mar', reservations: 50 },
    { month: 'Apr', reservations: 45 },
    { month: 'May', reservations: 60 },
    { month: 'Jun', reservations: 70 }
  ];


  const serviceBreakdownData = [
    { name: 'Laser Cutter', value: 400 },
    { name: '3D Printer', value: 300 },
    { name: 'Heat Press', value: 200 }
  ];


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];


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
                    {/* Dropdown arrow */}
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
          <header className="sticky top-0 z-999 flex w-full bg-white shadow-md">
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
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Analytics Overview</h2>
            <p className="text-sm text-[#143370] mb-4 font-poppins1">{formattedDate}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">
              
              <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca]">
                <CardHeader>
                  <CardTitle>Something</CardTitle>
                </CardHeader>
                <CardContent>
                  <h2 className="text-4xl font-bold text-[#143370]">2</h2>
                  <p className="text-sm text-[#143370]">Next 7 Days</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca]">
                <CardHeader>
                  <CardTitle>Past Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <h2 className="text-4xl font-bold text-[#143370]">24</h2>
                  <p className="text-sm text-[#143370]">Last 30 Days</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm transform hover:scale-105 transition-all duration-300 border border-[#5e86ca]">
                <CardHeader>
                  <CardTitle>Something</CardTitle>
                </CardHeader>
                <CardContent>
                  <h2 className="text-4xl font-bold text-[#143370]">3</h2>
                  <p className="text-sm text-[#143370]">Last 30 Days</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Reservation Trends Line Chart */}
              <Card className="p-4 border border-[#5e86ca]">
                <CardHeader>
                  <CardTitle className="text-[#143370]">Reservation Trends</CardTitle>
                  <p className="text-sm text-[#143370]">A summary of the number of reservations per month</p>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reservationTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="reservations"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>


              {/* Service Breakdown Pie Chart */}
              <Card className="p-4 border border-[#5e86ca]">
                <CardHeader>
                  <CardTitle className="text-[#143370]">Machine Usage</CardTitle>
                  <p className="text-sm text-[#143370]">A chart of the most commonly availed services</p>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceBreakdownData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};


export default DashboardAdmin;