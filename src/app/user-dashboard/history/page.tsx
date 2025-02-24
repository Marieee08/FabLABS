"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/auth/role-guard';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Interfaces for the orders
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
  StartTime: Date | null;
  EndTime: Date | null;
}

interface Reservation {
  id: number;
  Status: string;
  RequestDate: Date;
  BulkofCommodity: string | null;
  TotalAmntDue: number | null;
  ReceiptNumber: string | null;
  PaymentDate: Date | null;
  UserServices: UserService[];
  UserTools: UserTool[];
  UtilTimes: UtilTime[];
  accInfo: {
    Name: string;
    email: string;
  };
}

const HistoryPage = () => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(true); // Open by default since we're on the history page
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

  // Order history states and functionality
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/fetch-reservations?history=true');
        if (response.ok) {
          const data = await response.json();
          setReservations(data);
        } else {
          console.error('Failed to fetch reservation history');
        }
      } catch (error) {
        console.error('Error fetching reservation history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Function to get the appropriate color for status badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending payment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Format currency for display
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    
    // Convert to number first to ensure toFixed works
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number after conversion
    if (isNaN(numAmount)) return 'N/A';
    
    return `₱${numAmount.toFixed(2)}`;
  };

  // Filter reservations based on selected status
  const filteredReservations = filterStatus === 'all' 
    ? reservations 
    : reservations.filter(res => res.Status.toLowerCase() === filterStatus.toLowerCase());

  // Handle clicking on a reservation to view details
  const handleReviewClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  return (
    <RoleGuard allowedRoles={['MSME']}>
      <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
        <aside className={`absolute left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-white duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
            <Link href="/" className="mt-5">
              <span className="text-[#143370] text-2xl font-bold font-qanelas4 pl-4">FABLAB</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="block text-[#0d172c] lg:hidden">
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
              <h2 className="text-[#0d172c] text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-[#1c62b5]">{userRole}</p>
            </div>
            <div>
              <h3 className="mb-4 ml-4 text-sm font-semibold text-gray-600">MENU</h3>
              <ul className="mb-6 flex flex-col gap-1.5">
                <li>
                  <button
                    onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                    className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] text-blue-800 bg-blue-100 border border-[#5e86ca]"
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
                      <Link href="/user-dashboard" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]">
                        General
                      </Link>
                    </li>
                    <li className="ml-6">
                      <Link href="/user-dashboard/history" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-blue-800 bg-blue-100 hover:text-[#0d172c]">
                        History
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link href="/user-dashboard/information" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]">
                    Information
                  </Link>
                </li>
                <li>
                  <Link href="/user-dashboard/settings" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]">
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
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
                  <span className="hidden text-right lg:block">
                    <span className="block text-sm font-medium text-black">
                      {user?.firstName} {user?.lastName || ''}
                    </span>
                    <span className="block text-xs">{userRole}</span>
                  </span>
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt="Profile" 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="h-12 w-12 rounded-full bg-gray-300"></span>
                  )}
                </Link>
              </div>
            </div>
          </header>

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Order History</h2>
                  <p className="text-sm text-[#143370] font-poppins1">{formattedDate}</p>
                </div>
                <Link href="/user-services" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                  New Order
                </Link>
              </div>
              
              {/* Order History Content - Integrated from UserOrderHistory component */}
              <div className="container mx-auto p-4">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-[#143370]">Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Status:
                      </label>
                      <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Orders</option>
                        <option value="completed">Completed</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="pending payment">Pending Payment</option>
                      </select>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#143370]"></div>
                      </div>
                    ) : filteredReservations.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No orders found with the selected filter.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReservations.map((reservation) => (
                              <tr key={reservation.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{reservation.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(reservation.RequestDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.Status)}`}>
                                    {reservation.Status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {reservation.UserServices.map(service => service.ServiceAvail).join(', ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(reservation.TotalAmntDue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {reservation.ReceiptNumber || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleReviewClick(reservation)}
                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Details Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold">Order Details</DialogTitle>
                    </DialogHeader>
                    
                    {selectedReservation && (
                      <div className="mt-4 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Order #{selectedReservation.id}</h3>
                            <p className="text-sm text-gray-500">Requested on {formatDate(selectedReservation.RequestDate)}</p>
                          </div>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedReservation.Status)}`}>
                            {selectedReservation.Status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Services Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold mb-2">Selected Services:</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {selectedReservation.UserServices.map((service, idx) => (
                                  <li key={idx} className="text-gray-700">
                                    {service.ServiceAvail} ({service.EquipmentAvail})
                                    {service.CostsAvail && service.MinsAvail ? 
                                      ` - ${formatCurrency(service.CostsAvail)} for ${service.MinsAvail} mins` : ''}
                                  </li>
                                ))}
                              </ul>
                              
                              {selectedReservation.BulkofCommodity && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-semibold mb-1">Bulk of Commodity:</h4>
                                  <p className="text-gray-700">{selectedReservation.BulkofCommodity}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Schedule Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              {selectedReservation.UtilTimes.length > 0 ? (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Reserved Time Slots:</h4>
                                  <ul className="space-y-2">
                                    {selectedReservation.UtilTimes.map((time, idx) => (
                                      <li key={idx} className="text-gray-700">
                                        <strong>Day {time.DayNum}:</strong>
                                        <div className="ml-4">
                                          <div>Start: {time.StartTime ? new Date(time.StartTime).toLocaleString() : 'Not set'}</div>
                                          <div>End: {time.EndTime ? new Date(time.EndTime).toLocaleString() : 'Not set'}</div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No schedule information available</p>
                              )}
                            </div>
                          </div>

                          {selectedReservation.UserTools.length > 0 && (
                            <div className="col-span-1 md:col-span-2">
                              <h3 className="font-medium text-gray-900 mb-2">Tool Requirements</h3>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedReservation.UserTools.map((tool, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 border-b border-gray-200 last:border-0">
                                      <span className="font-medium">{tool.ToolUser}</span>
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                        {tool.ToolQuantity} units
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="col-span-1 md:col-span-2">
                            <h3 className="font-medium text-gray-900 mb-2">Payment Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">Total Amount:</h4>
                                  <p className="text-xl font-bold text-[#143370]">
                                    {formatCurrency(selectedReservation.TotalAmntDue)}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">Receipt Number:</h4>
                                  <p className="text-gray-700">{selectedReservation.ReceiptNumber || 'Not issued'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-1">Payment Date:</h4>
                                  <p className="text-gray-700">{selectedReservation.PaymentDate ? formatDate(selectedReservation.PaymentDate) : 'Not paid'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                          {selectedReservation.Status === 'Completed' && (
                            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                              Download Receipt
                            </button>
                          )}
                          {selectedReservation.Status === 'Pending' && (
                            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

export default HistoryPage;