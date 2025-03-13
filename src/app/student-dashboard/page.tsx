"use client";

import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from "@clerk/nextjs";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoleGuard from '@/components/auth/role-guard';

interface Reservation {
  id: number;
  Status: string;
  RequestDate: Date;
  TotalAmntDue: number | null;
  BulkofCommodity: string | null;
  DateofProcessing: Date | null;
  ProductsManufactured?: string;
  accInfo: {
    Name: string;
    email: string;
    Role: string;
  };
  UserServices: Array<{
    id: string;
    ServiceAvail: string;
    EquipmentAvail: string;
    CostsAvail: number | null;
    MinsAvail: number | null;
  }>;
  UserTools: Array<{
    id: string;
    ToolUser: string;
    ToolQuantity: number;
  }>;
  UtilTimes: Array<{
    id: number;
    DayNum: number | null;
    StartTime: Date | null;
    EndTime: Date | null;
  }>;
}

const DashboardUser = () => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

  // useEffect to fetch reservations for the current user
  useEffect(() => {
    const fetchUserReservations = async () => {
      if (!isLoaded || !user) return;
      
      setIsLoading(true);
      try {
        // Call the API route we just created
        const response = await fetch('/api/user/fetch-reservations');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${await response.text()}`);
        }
        
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error('Error fetching user reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (isLoaded && user) {
      fetchUserReservations();
    }
  }, [user, isLoaded]);

  // useEffect to get user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole("Not logged in");
        return;
      }
      try {
        const publicMetadata = user.publicMetadata;
        const role = publicMetadata.role;
        setUserRole(role as string || "User");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("Error fetching role");
      }
    };

    if (isLoaded) {
      checkUserRole();
    }
  }, [user, isLoaded]);

  const handleReviewClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  // Format the date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency with null check
  const formatCurrency = (amount: number | null) => {
    // Check for null first
    if (amount === null) return 'Pending';
    
    // Convert to number explicitly to handle potential string values or other types
    const numericAmount = Number(amount);
    
    // Check if conversion resulted in a valid number
    if (isNaN(numericAmount)) {
      console.error('Invalid amount value:', amount);
      return 'Error';
    }
    
    // Format the valid number
    return `₱${numericAmount.toFixed(2)}`;
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
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
                <Link href="/student-dashboard" className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] text-blue-800 bg-blue-100 border border-[#5e86ca]">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/student-dashboard/information" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]">
                  Information
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden shadow-sm">
        <header className="sticky top-0 z-999 flex w-full bg-white shadow-sm">
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
            <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Dashboard</h2>
            <p className="text-sm text-[#143370] mb-4 font-poppins1">{formattedDate}</p>

            <div className="bg-white rounded-lg text-blue-800 px-4 py-4 shadow-md border border-[#5e86ca]">
              <p className="text-xl font-bold text-[#143370]">Pending Orders</p>
              <p className="text-sm text-[#143370] mb-4">Here are your pending orders!</p>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading your orders...</p>
                </div>
              ) : reservations.length === 0 ? (
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <p className="text-blue-800">You don't have any pending orders at the moment.</p>
                  <Link href="/user-services" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Create a New Order
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg bg-blue-50 shadow-md">
                  <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                    <thead className="bg-blue-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Services</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reservations.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-blue-50 transition-colors">
                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(reservation.RequestDate)}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(reservation.Status)}`}>
                              {reservation.Status}
                            </span>
                          </td>

                          {/* Product */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {reservation.BulkofCommodity || 'Not specified'}
                            </div>
                          </td>

                          {/* Services */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {reservation.UserServices && reservation.UserServices.length > 0 
                                ? reservation.UserServices.map(s => s.ServiceAvail).join(', ')
                                : 'None'}
                            </div>
                          </td>

                          {/* Total Amount */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(reservation.TotalAmntDue)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <button
    onClick={() => handleReviewClick(reservation)}
    className="text-blue-600 hover:text-blue-900 transition"
  >
    Review
  </button>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Review Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-[#143370]">Order Details</DialogTitle>
                </DialogHeader>
                
                {selectedReservation && (
                  <div className="mt-4 space-y-6">
                    {/* Order Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Order ID</h3>
                        <p className="text-gray-700">#{selectedReservation.id}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Request Date</h3>
                        <p className="text-gray-700">{formatDate(selectedReservation.RequestDate)}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Status</h3>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedReservation.Status)}`}>
                          {selectedReservation.Status}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Processing Date</h3>
                        <p className="text-gray-700">{formatDate(selectedReservation.DateofProcessing) || 'Not scheduled'}</p>
                      </div>
                    </div>

                    {/* Product Information */}
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-gray-900 mb-2">Product Information</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-700"><span className="font-medium">Bulk of Commodity:</span> {selectedReservation.BulkofCommodity || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Schedule Information */}
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-gray-900 mb-2">Schedule Information</h3>
                      <div className="bg-gray-50 p-3 rounded space-y-2">
                        {selectedReservation.UtilTimes && selectedReservation.UtilTimes.length > 0 ? (
                          selectedReservation.UtilTimes.map((time, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium">Day:</span> {time.DayNum || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {time.StartTime ? new Date(time.StartTime).toLocaleTimeString() : 'N/A'} 
                                - {time.EndTime ? new Date(time.EndTime).toLocaleTimeString() : 'N/A'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No schedule information available</p>
                        )}
                      </div>
                    </div>

                    {/* Services Information */}
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-gray-900 mb-2">Services Requested</h3>
                      {selectedReservation.UserServices && selectedReservation.UserServices.length > 0 ? (
                        <div className="space-y-3">
                          {selectedReservation.UserServices.map((service, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <p className="font-medium">Service:</p> 
                                  <p className="text-gray-700">{service.ServiceAvail}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Equipment:</p> 
                                  <p className="text-gray-700">{service.EquipmentAvail}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Cost:</p> 
                                  <p className="text-gray-700">{service.CostsAvail ? `₱${service.CostsAvail}` : 'TBD'}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Minutes:</p> 
                                  <p className="text-gray-700">{service.MinsAvail || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 bg-gray-50 p-3 rounded">No services requested</p>
                      )}
                    </div>

                    {/* Tools Information */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Tools Requested</h3>
                      {selectedReservation.UserTools && selectedReservation.UserTools.length > 0 ? (
                        <div className="bg-gray-50 p-3 rounded">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Tool</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedReservation.UserTools.map((tool, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2 text-sm text-gray-700">{tool.ToolUser}</td>
                                  <td className="px-3 py-2 text-sm text-gray-700">{tool.ToolQuantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 bg-gray-50 p-3 rounded">No tools requested</p>
                      )}
                    </div>

                    {/* Total Amount */}
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="font-semibold text-xl text-gray-900">Total Amount Due:</span>
                      <span className="font-bold text-xl text-blue-800">
                        {formatCurrency(selectedReservation.TotalAmntDue)}
                      </span>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="bg-white rounded-lg text-blue-800 px-4 py-4 mt-4 shadow-md border border-[#5e86ca]">
              <p className="text-xl font-bold text-[#143370]">History</p>
              <p className="text-sm text-[#143370] mb-4">Here's a summary of your previous transactions!</p>
              
              {/* We can add the completed orders table here using similar structure as the pending orders table */}
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <p className="text-blue-800">History feature coming soon!</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </RoleGuard>
  );
};

export default DashboardUser;