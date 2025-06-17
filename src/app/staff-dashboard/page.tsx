// src/app/user-dashboard/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserButton, useUser } from "@clerk/nextjs";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoleGuard from '@/components/auth/role-guard';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import Image from 'next/image';

// Interface for DownTime
interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null;
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
}

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

interface MachineUtilization {
  id: number;
  Machine: string | null;
  MachineApproval: boolean | null;
  DateReviewed: Date | null;
  ServiceName: string | null;
  DownTimes: DownTime[];
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
  MachineUtilizations: MachineUtilization[];
  accInfo: {
    Name: string;
    email: string;
  };
}

const DashboardTeacher = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

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
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Ongoing':
        return 'bg-indigo-100 text-indigo-800';
      case 'Survey':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    const fetchReservations = async () => {
      setIsReservationsLoading(true);
      try {
        const response = await fetch('/api/user/fetch-reservations');
        if (response.ok) {
          const data = await response.json();
          
          const processedData = data.map((reservation: Reservation) => {
            if (reservation.UserServices && Array.isArray(reservation.UserServices)) {
              const serviceMap = new Map();
              
              reservation.UserServices.forEach((service: UserService) => {
                const key = `${service.ServiceAvail}___${service.EquipmentAvail}`;
                
                if (!serviceMap.has(key)) {
                  serviceMap.set(key, service);
                }
              });
              
              reservation.UserServices = Array.from(serviceMap.values());
            }
            
            if (reservation.MachineUtilizations && Array.isArray(reservation.MachineUtilizations)) {
              const machineMap = new Map();
              
              reservation.MachineUtilizations.forEach((machine: MachineUtilization) => {
                if (!machine.Machine) return;
                
                const key = machine.Machine;
                
                if (!machineMap.has(key)) {
                  machineMap.set(key, {
                    ...machine,
                    DownTimes: machine.DownTimes || []
                  });
                }
              });
              
              reservation.MachineUtilizations = Array.from(machineMap.values());
            }
            
            if (reservation.UserTools && Array.isArray(reservation.UserTools)) {
              const toolMap = new Map();
              
              reservation.UserTools.forEach((tool: UserTool) => {
                const key = tool.ToolUser;
                
                if (!toolMap.has(key)) {
                  toolMap.set(key, { ...tool });
                } else {
                  const existingTool = toolMap.get(key);
                  existingTool.ToolQuantity += tool.ToolQuantity;
                  toolMap.set(key, existingTool);
                }
              });
              
              reservation.UserTools = Array.from(toolMap.values());
            }
            
            return reservation;
          });
          
          const processedDataWithDowntimes = processedData.map((reservation: Reservation) => {
            if (reservation.MachineUtilizations) {
              reservation.MachineUtilizations = reservation.MachineUtilizations.map(machine => ({
                ...machine,
                DownTimes: machine.DownTimes || []
              }));
            }
            return reservation;
          });
          
          setReservations(processedDataWithDowntimes);
        }
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      } finally {
        setIsReservationsLoading(false);
      }
    };

    fetchReservations();
  }, []);

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

  const handleReviewClick = async (reservation: Reservation) => {
    try {
      setIsLoading(true);
      
      // Fetch the latest reservation data including machine utilizations
      const response = await fetch(`/api/user/fetch-reservation/${reservation.id}?includeMachineUtilizations=true`);
      
      if (response.ok) {
        const updatedReservation = await response.json();
        
        // Ensure DownTimes array exists for each machine utilization
        if (updatedReservation.MachineUtilizations) {
          updatedReservation.MachineUtilizations = updatedReservation.MachineUtilizations.map((machine: any) => ({
            ...machine,
            DownTimes: machine.DownTimes || [] // Ensure DownTimes exists
          }));
        }
        
        setSelectedReservation(updatedReservation);
      } else {
        // Fallback to the original reservation if fetch fails
        console.warn('Using fallback reservation data');
        setSelectedReservation({
          ...reservation,
          MachineUtilizations: reservation.MachineUtilizations?.map(m => ({
            ...m,
            DownTimes: m.DownTimes || []
          })) || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch updated reservation:', error);
      setSelectedReservation({
        ...reservation,
        MachineUtilizations: reservation.MachineUtilizations?.map(m => ({
          ...m,
          DownTimes: m.DownTimes || []
        })) || []
      });
    } finally {
      setIsLoading(false);
      setIsModalOpen(true);
    }
  };

  const handleNavigation = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

  const handleNewReservationClick = () => {
    setIsNavigating(true);
    setTimeout(() => {
      window.location.href = '/services';
    }, 300);
  };

  const ReservationSkeleton = () => (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-gray-200 rounded-xl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-yellow-100 rounded w-16"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-blue-100 rounded w-16"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
      <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
        {isLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-sm font-medium text-blue-600">Loading...</p>
            </div>
          </div>
        )}

        <aside className={`absolute left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-white duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
            <Link href="/" className="mt-5" onClick={(e) => {
              e.preventDefault();
              handleNavigation('/');
            }}>
              <span className="text-[#143370] text-2xl font-bold font-qanelas4 pl-4">FABLAB</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="block text-[#0d172c] lg:hidden">
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
                    className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-blue-800 bg-blue-100 border border-[#5e86ca]"
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
                      <a 
                        href="/user-dashboard" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation('/user-dashboard');
                        }}
                        className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-blue-800 bg-blue-100 hover:text-[#0d172c]"
                      >
                        General
                      </a>
                    </li>
                    <li className="ml-6">
                      <a 
                        href="/staff-dashboard/history"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation('/staff-dashboard/history');
                        }}
                        className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]"
                      >
                        History
                      </a>
                    </li>
                  </>
                )}
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
                <a 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/');
                  }}
                  className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                >
                  Home
                </a>
                <a 
                  href="/services"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/services');
                  }}
                  className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                >
                  Services
                </a>
                <a 
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/contact');
                  }}
                  className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                >
                  Contact
                </a>
              </div>
              <UserButton showName />
            </div>
          </header>

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Dashboard</h2>
                  <p className="text-sm text-[#143370] font-poppins1">{formattedDate}</p>
                </div>
                <button 
                  onClick={handleNewReservationClick}
                  disabled={isNavigating}
                  className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 text-blue-800 bg-blue-100 border border-[#5e86ca] hover:bg-blue-200 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isNavigating ? 'Loading...' : 'New Reservation'}
                </button>
              </div>

              <Card className="border border-[#5e86ca]">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#143370]">Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  {isReservationsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#143370]"></div>
                    </div>
                  ) : reservations.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No reservations found.</p>
                      <button 
                        onClick={handleNewReservationClick}
                        disabled={isNavigating}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isNavigating ? 'Loading...' : 'Create a New Reservation'}
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg bg-blue-100 shadow-lg">
                      <table className="min-w-full divide-y divide-gray-200 rounded-xl">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reservations.map((reservation) => (
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
                    <DialogTitle className="text-2xl font-semibold">Reservation Details</DialogTitle>
                  </DialogHeader>
                  
                  {selectedReservation && (
                    <div className="mt-4 space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Reservation #{selectedReservation.id}</h3>
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
                                    ` - ₱${service.CostsAvail} for ${service.MinsAvail} mins` : ''}
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

                        {selectedReservation.MachineUtilizations && selectedReservation.MachineUtilizations.length > 0 && (
                          <div className="col-span-1 md:col-span-2">
                            <h3 className="font-medium text-gray-900 mb-2">Machine Details</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="space-y-2">
                                {selectedReservation.MachineUtilizations.map((machine, index) => (
                                  <div key={index} className="p-2 bg-white rounded border">
                                    <p><span className="text-gray-600">Machine:</span> {machine.Machine}</p>
                                    {machine.ServiceName && (
                                      <p><span className="text-gray-600">For Service:</span> {machine.ServiceName}</p>
                                    )}
                                    <p><span className="text-gray-600">Approval Status:</span> {
                                      machine.MachineApproval ? 
                                        <span className="text-green-600">Approved</span> : 
                                        <span className="text-yellow-600">Pending Approval</span>
                                    }</p>
                                    {machine.DateReviewed && (
                                      <p><span className="text-gray-600">Reviewed On:</span> {new Date(machine.DateReviewed).toLocaleDateString()}</p>
                                    )}
                                    
                                    {machine.DownTimes && machine.DownTimes.length > 0 && (
                                      <div className="mt-2 border-t border-gray-200 pt-2">
                                        <p className="text-amber-600 font-medium">Reported Downtime:</p>
                                        {machine.DownTimes.map((downtime, dtIndex) => (
                                          <div key={dtIndex} className="ml-4 mt-1 text-sm">
                                            <p>Date: {downtime.DTDate || 'Not recorded'}</p>
                                            <p>Duration: {downtime.DTTime || 0} minutes</p>
                                            {downtime.Cause && <p>Cause: {downtime.Cause}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        {selectedReservation.Status === 'Pending' && (
                          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
  );
};

export default DashboardTeacher;