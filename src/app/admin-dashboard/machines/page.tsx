"use client";
  import React, { useState, useEffect } from 'react';
  import Link from 'next/link';
  import AdminMachines from '@/components/admin-functions/admin-machines';
  import AdminServices from '@/components/admin-functions/admin-services';
  import AdminTools from '@/components/admin-functions/admin-tools';
  import { format } from 'date-fns';
  import { useUser, UserButton } from "@clerk/nextjs";
  import { MoreVertical, Edit, Trash2, Mail } from 'lucide-react';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import RoleGuard from '@/components/auth/role-guard';

  type User = {
    id: string;
    name: string;
    email: string;
    type: 'msme' | 'student' | 'admin' | 'cashier';
    permissions: string[];
  };


  const users: User[] = [
    // Add your user data here
  ];

  const getPermissionColor = (permission: string): string => {
    switch (permission) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'WRITE':
        return 'bg-blue-100 text-blue-800';
      case 'READ':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const DashboardAdmin = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
    const today = new Date();
    const { user, isLoaded } = useUser();
    const [userRole, setUserRole] = useState<string>("Loading...");
    const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

      // useEffect to user role
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

    const handleEditPermissions = (userId: string) => {
      console.log(`Editing permissions for user ${userId}`);
      // Implement actual permission editing logic
    };

    const UserTable = ({ users }: { users: User[] }) => (
      <Table>
        <TableBody>
        </TableBody>
      </Table>
    );

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
                <p className="text-[#5e86ca]">ADMIN</p>
            </div>
              <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-gray-400">MENU</h3>
                <ul className="mb-6 flex flex-col gap-1.5">
                  <li>
                    <button
                      onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                      className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-white border bg-[#1c2a52] border-[#5e86ca]"
                    >
                      <span>Reservations</span>
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
                        <Link href="/admin-dashboard/machines" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-white">
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
                  <Link href="/admin-dashboard/staff" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-white border bg-[#1c2a52] border-[#5e86ca]">
                    Staff
                  </Link>
                  <li>
                   <Link href="/admin-dashboard/reports" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-white border border-transparent hover:bg-[#1c2a52] hover:border-[#5e86ca]">
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

            <main>
  <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Machine Management</h2>
    <p className="text-sm text-[#143370] font-poppins1">{formattedDate}</p>
  </div>
  
  {/* Main content box with added bottom margin */}
  <div className="p-4 bg-white rounded-lg shadow-sm mx-auto max-w-[1200px] w-[95%] mb-8">
    <Tabs defaultValue="machines" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="machines">Machines</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="tools">Tools</TabsTrigger>
      </TabsList>

      <TabsContent value="machines">
        <AdminMachines/>
      </TabsContent>
      <TabsContent value="services">
        <AdminServices/>
      </TabsContent>
      <TabsContent value="tools">
        <AdminTools/>
      </TabsContent>
    </Tabs>
  </div>
</main>
          </div>
        </div>
      </RoleGuard>
    );
  };


  export default DashboardAdmin;

