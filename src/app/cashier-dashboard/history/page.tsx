// app/cashier-dashboard/history/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import RoleGuard from '@/components/auth/role-guard';
import Image from 'next/image';

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | null;
  MinsAvail: number | null;
}

interface UserTool {
  id: string;
  ToolUser: string;
  ToolQuantity: number;
}

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  TotalAmntDue: number | null;
  BulkofCommodity: string | null;
  ReceiptNumber: string | null;
  PaymentDate: string | null;
  UserServices: UserService[];
  UserTools: UserTool[];
  UtilTimes: UtilTime[];
  accInfo: {
    Name: string;
    email: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Paid':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0.00';
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number after conversion
  if (typeof numericAmount !== 'number' || isNaN(numericAmount)) return '0.00';
  
  return numericAmount.toFixed(2);
};

const HistoryPage = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reservations, setReservations] = useState<DetailedReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<DetailedReservation | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Navigation handler with loading state
  const handleNavigation = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

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

  useEffect(() => {
    const fetchReservations = async () => {
      setIsDataLoading(true);
      try {
        const response = await fetch('/api/cashier/completed-payments');
        if (!response.ok) throw new Error('Failed to fetch reservations');
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleReviewClick = (reservation: DetailedReservation) => {
    setSelectedReservation(reservation);
    setIsReviewModalOpen(true);
  };

  return (
    <RoleGuard allowedRoles={['CASHIER']}>
      <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-sm font-medium text-blue-600">Loading...</p>
            </div>
          </div>
        )}
        
        {/* Sidebar */}
        <aside className={`absolute left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-white duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
            <Link 
              href="/" 
              className="mt-5"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/');
              }}
            >
              <span className="text-[#143370] text-2xl font-bold">FABLAB</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="block lg:hidden">
              X
            </button>
          </div>
          <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
            <div className="flex flex-col items-center py-8">
              {user?.imageUrl ? (
                <Image
                    src={user.imageUrl}
                    alt="Profile"
                    width={144}
                    height={144}
                    className="rounded-full object-cover mb-2"
                  />
              ) : (
                <span className="h-36 w-36 rounded-full bg-gray-300 mb-2"></span>
              )}
              <h2 className="text-[#0d172c] text-xl font-bold">
                {user?.firstName} {user?.lastName || ''}
              </h2>
              <p className="text-[#1c62b5]">{userRole}</p>
            </div>
            <div>
              <h3 className="mb-4 ml-4 text-sm font-semibold text-gray-600">MENU</h3>
              <ul className="mb-6 flex flex-col gap-1.5">
                <li>
                  <Link 
                    href="/cashier-dashboard" 
                    className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation('/cashier-dashboard');
                    }}
                  >
                    Pending Payments
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/cashier-dashboard/history" 
                    className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-blue-800 bg-blue-100 border border-[#5e86ca]"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation('/cashier-dashboard/history');
                    }}
                  >
                    History
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
                <Link 
                  href="/" 
                  className="font-medium text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/');
                  }}
                >
                  Home
                </Link>
                <Link 
                  href="/services" 
                  className="font-medium text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/services');
                  }}
                >
                  Services
                </Link>
                <Link 
                  href="/contact" 
                  className="font-medium text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/contact');
                  }}
                >
                  Contact
                </Link>
              </div>
              <div className="flex items-center gap-3 2xsm:gap-7">
                <div className="flex items-center gap-4">
                  <span className="hidden text-right lg:block">
                    <span className="block text-sm font-medium text-black">{user?.firstName} {user?.lastName || ''}</span>
                    <span className="block text-xs">{userRole}</span>
                  </span>
                  <UserButton />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <h2 className="text-[#143370] text-3xl font-bold mb-2">Payment History</h2>
            <p className="text-sm text-[#143370] mb-6">View all completed payments and transaction details</p>

            {/* Reservations Table */}
            <Card className="bg-white shadow-sm w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Completed Payments</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className={`overflow-x-auto ${isDataLoading ? 'filter blur-sm' : ''}`}>
                  <table className="w-full min-w-[1200px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {!isDataLoading && reservations.length > 0 ? (
                        reservations.map(reservation => (
                          <tr key={reservation.id}>
                            <td className="px-6 py-4">{new Date(reservation.PaymentDate!).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{reservation.accInfo.Name}</td>
                            <td className="px-6 py-4">{reservation.ReceiptNumber}</td>
                            <td className="px-6 py-4">₱{formatCurrency(reservation.TotalAmntDue)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.Status)}`}>
                                {reservation.Status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => handleReviewClick(reservation)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : !isDataLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-12 w-12 text-gray-400 mb-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={1.5} 
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                                />
                              </svg>
                              <p className="text-lg font-medium text-gray-500">No payment history found</p>
                              <p className="text-sm text-gray-400 mt-1">When payments are processed, they will appear here</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        // Show loading skeleton rows
                        Array(5).fill(0).map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Loading overlay */}
                {isDataLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-700 font-medium">Loading payment history...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Details Modal */}
            <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">Payment Details</DialogTitle>
                </DialogHeader>
                
                {selectedReservation && (
                  <Tabs defaultValue="payment" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="payment">Payment Info</TabsTrigger>
                      <TabsTrigger value="services">Services & Schedule</TabsTrigger>
                    </TabsList>

                    <TabsContent value="payment" className="mt-4 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900">Payment Date</h3>
                          <p>{new Date(selectedReservation.PaymentDate!).toLocaleString()}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Receipt Number</h3>
                          <p>{selectedReservation.ReceiptNumber}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium text-gray-900">Customer Information</h3>
                        <div className="mt-2">
                          <p><span className="text-gray-600">Name:</span> {selectedReservation.accInfo.Name}</p>
                          <p><span className="text-gray-600">Email:</span> {selectedReservation.accInfo.email}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium text-gray-900">Payment Summary</h3>
                        <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                          <p className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-medium">₱{formatCurrency(selectedReservation.TotalAmntDue)}</span>
                          </p>
                          {selectedReservation.BulkofCommodity && (
                            <p className="flex justify-between mt-2">
                              <span className="text-gray-600">Bulk of Commodity:</span>
                              <span>{selectedReservation.BulkofCommodity}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="services" className="mt-4 space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Services Information</h3>
                        <div className="space-y-2">
                          {selectedReservation.UserServices.map((service, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p><span className="text-gray-600">Service:</span> {service.ServiceAvail}</p>
                              <p><span className="text-gray-600">Equipment:</span> {service.EquipmentAvail}</p>
                              <p><span className="text-gray-600">Duration:</span> {service.MinsAvail} minutes</p>
                              <p><span className="text-gray-600">Cost:</span>₱{formatCurrency(service.CostsAvail)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedReservation.UserTools.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Tools Used</h3>
                            <div className="space-y-2">
                              {selectedReservation.UserTools.map((tool, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                  <p><span className="text-gray-600">Tool:</span> {tool.ToolUser}</p>
                                  <p><span className="text-gray-600">Quantity:</span> {tool.ToolQuantity}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                        <div className="space-y-2">
                          {selectedReservation.UtilTimes.map((time, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p><span className="text-gray-600">Day {time.DayNum}:</span></p>
                              <p className="ml-4">Start: {time.StartTime ? new Date(time.StartTime).toLocaleString() : 'Not set'}</p>
                              <p className="ml-4">End: {time.EndTime ? new Date(time.EndTime).toLocaleString() : 'Not set'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

export default HistoryPage;