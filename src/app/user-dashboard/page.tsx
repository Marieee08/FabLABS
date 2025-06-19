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
import CostBreakdown from '@/components/admin/cost-breakdown';
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
  UserServices: UserService[];
  UserTools: UserTool[];
  UtilTimes: UtilTime[];
  MachineUtilizations: MachineUtilization[];
  accInfo: {
    Name: string;
    email: string;
  };
}

const DashboardUser = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [historyReservations, setHistoryReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [informationDropdownOpen, setInformationDropdownOpen] = useState(true);

  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Admin Approval':
        return 'bg-orange-100 text-orange-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ongoing':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueItems = (items: (string | null)[]): string => {
    const uniqueItems = Array.from(new Set(items.filter(Boolean) as string[]));
    return uniqueItems.join(', ');
  };

  useEffect(() => {
    const fetchReservations = async () => {
      setIsReservationsLoading(true);
      setIsHistoryLoading(true);
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
          
          // Filter into pending and history reservations
          const pendingReservations = processedDataWithDowntimes.filter((reservation: Reservation) => 
            reservation.Status.toLowerCase() !== 'completed' && 
            reservation.Status.toLowerCase() !== 'rejected' && 
            reservation.Status.toLowerCase() !== 'cancelled'
          );
          
          const completedReservations = processedDataWithDowntimes.filter((reservation: Reservation) => 
            reservation.Status.toLowerCase() === 'completed' || 
            reservation.Status.toLowerCase() === 'rejected' || 
            reservation.Status.toLowerCase() === 'cancelled'
          );
          
          setReservations(pendingReservations);
          setHistoryReservations(completedReservations);
        }
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      } finally {
        setIsReservationsLoading(false);
        setIsHistoryLoading(false);
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

  const ReservationSkeleton = () => (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-gray-200 rounded-xl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment/Machines</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 bg-yellow-100 rounded w-16"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-40"></div>
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

  const renderReservationTable = (reservationList: Reservation[], isLoadingState: boolean, emptyMessage: string, createNewLink?: string) => {
    if (isLoadingState) {
      return <ReservationSkeleton />;
    }

    if (reservationList.length === 0) {
      return (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <p className="text-blue-800">{emptyMessage}</p>
          {createNewLink && (
            <a 
              href={createNewLink}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(createNewLink);
              }}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create a New Order
            </a>
          )}
        </div>
      );
    }

    return (
      <table className="min-w-full divide-y divide-gray-200 rounded-xl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment/Machines</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reservationList.map((reservation) => (
            <tr key={reservation.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      {new Date(reservation.RequestDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.Status)}`}>
                  {reservation.Status}
                </span>
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {getUniqueItems(reservation.UserServices.map(service => service.ServiceAvail))}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {reservation.MachineUtilizations && reservation.MachineUtilizations.length > 0 ? (
                  <div className="text-sm font-medium text-gray-900">
                    {getUniqueItems(reservation.MachineUtilizations.map(machine => machine.Machine))}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {getUniqueItems(reservation.UserServices.map(service => service.EquipmentAvail))}
                  </div>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap font-medium text-sm text-gray-500">
                {reservation.accInfo.email}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleReviewClick(reservation);
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-900"
                >
                  Review
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <RoleGuard allowedRoles={['MSME']}>
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
                        href="/user-dashboard/history"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation('/user-dashboard/history');
                        }}
                        className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]"
                      >
                        History
                      </a>
                    </li>
                  </>
                )}
                <li>
                  <button
                    onClick={() => setInformationDropdownOpen(!informationDropdownOpen)}
                    className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]"
                  >
                    <span>Information</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-300 ${informationDropdownOpen ? 'rotate-180' : ''}`}
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
                {informationDropdownOpen && (
                  <div className="ml-6 mt-2 space-y-2">
                    <Link 
                      href="/user-dashboard/information" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation('/user-dashboard/information');
                      }}
                      className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]"
                    >
                      Personal Info
                    </Link>
                    <Link 
                      href="/user-dashboard/information/business" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation('/user-dashboard/information/business');
                      }}
                      className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]"
                    >
                      Business Info
                    </Link>
                  </div>
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
                <Link 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/');
                  }}
                  className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
                >
                  Home
                </Link>
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
              <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Dashboard</h2>
              <p className="text-sm text-[#143370] mb-4 font-poppins1">{formattedDate}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">
              </div>

              {/* Pending Reservations Section */}
              <div className="bg-white rounded-lg text-blue-800 px-4 py-4 shadow-md border border-[#5e86ca] mb-6">
                <p className="text-xl font-bold text-[#143370]">Pending Reservations</p>
                <p className="text-sm text-[#143370] mb-4">Here are your pending reservations!</p>
                <div className="overflow-x-auto rounded-lg bg-blue-100 shadow-ld">
                  {renderReservationTable(
                    reservations, 
                    isReservationsLoading, 
                    "You don't have any pending Reservations at the moment.",
                    "/services"
                  )}
                </div>
              </div>

              {/* History Section */}
              <div className="bg-white rounded-lg text-blue-800 px-4 py-4 shadow-md border border-[#5e86ca]">
                <p className="text-xl font-bold text-[#143370]">History</p>
                <p className="text-sm text-[#143370] mb-4">Here&apos;s a summary of your previous transactions!</p>
                <div className="overflow-x-auto rounded-lg bg-blue-100 shadow-ld">
                  {renderReservationTable(
                    historyReservations, 
                    isHistoryLoading, 
                    "You don't have any completed, rejected, or cancelled reservations yet."
                  )}
                </div>
              </div>

{/* Modal for reviewing reservations */}
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-semibold">Review Reservation</DialogTitle>
    </DialogHeader>
    
    {selectedReservation && (
      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900">Request Date</h3>
            <p>{new Date(selectedReservation.RequestDate).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Status</h3>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedReservation.Status)}`}>
              {selectedReservation.Status}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900">Services Information</h3>
          <div className="mt-2">
            <p>
              <span className="text-gray-600">Services:</span> 
              {getUniqueItems(selectedReservation.UserServices.map(service => service.ServiceAvail))}
            </p>
            <p>
              <span className="text-gray-600">Equipment:</span> 
              {getUniqueItems(selectedReservation.UserServices.map(service => service.EquipmentAvail))}
            </p>
            
            {selectedReservation.MachineUtilizations && selectedReservation.MachineUtilizations.length > 0 && (
              <p>
                <span className="text-gray-600">Machines:</span> 
                {getUniqueItems(selectedReservation.MachineUtilizations.map(machine => machine.Machine))}
              </p>
            )}
            
            <p><span className="text-gray-600">Bulk of Commodity:</span> {selectedReservation.BulkofCommodity || 'Not specified'}</p>
          </div>
        </div>

        {/* Cost Breakdown Component - Improved version */}
        <div>
          <h3 className="font-medium text-gray-900">Cost Breakdown</h3>
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Service Costs</h4>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes</th>
                      <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedReservation.UserServices.map((service, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{service.ServiceAvail}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{service.EquipmentAvail || 'N/A'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{service.MinsAvail || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₱{service.CostsAvail !== null ? 
                             (typeof service.CostsAvail === 'string' ? 
                               parseFloat(service.CostsAvail) : service.CostsAvail as number).toFixed(2) 
                             : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Machine Utilization & Downtime Adjustments */}
              {selectedReservation.MachineUtilizations && 
               selectedReservation.MachineUtilizations.some(m => m.DownTimes && m.DownTimes.length > 0) && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-2">Downtime Adjustments</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downtime (min)</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cause</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedReservation.MachineUtilizations
                          .filter(machine => machine.DownTimes && machine.DownTimes.length > 0)
                          .flatMap(machine => 
                            machine.DownTimes.map((downtime, dtIndex) => {
                              // Find the associated service for this machine
                              const relatedService = selectedReservation.UserServices.find(
                                service => service.ServiceAvail === machine.ServiceName || 
                                          service.EquipmentAvail === machine.Machine
                              );
                              
                              // Calculate cost per minute if we can find the service
                              let costPerMin = 0;
                              if (relatedService && relatedService.CostsAvail !== null && relatedService.MinsAvail) {
                                const cost = typeof relatedService.CostsAvail === 'string' ? 
                                  parseFloat(relatedService.CostsAvail) : 
                                  relatedService.CostsAvail as number;
                                costPerMin = cost / relatedService.MinsAvail;
                              }
                              
                              // Calculate the adjustment amount (negative value)
                              const adjustmentAmount = -(costPerMin * (downtime.DTTime || 0));
                              
                              return (
                                <tr key={`${machine.id}-${dtIndex}`}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{machine.Machine}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{downtime.DTDate || '—'}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{downtime.DTTime || 0}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{downtime.Cause || '—'}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right">
                                    ₱{adjustmentAmount.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                          )
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
               )
              }

              {/* Total Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Subtotal:</span>
                  <span className="text-gray-900">
                    ₱{selectedReservation.UserServices.reduce(
                      (total, service) => {
                        if (service.CostsAvail === null) return total;
                        const cost = typeof service.CostsAvail === 'string' ? 
                          parseFloat(service.CostsAvail) : 
                          service.CostsAvail as number;
                        return total + cost;
                      }, 
                      0
                    ).toFixed(2)}
                  </span>
                </div>
                
                {/* Calculate total downtime adjustments */}
                {selectedReservation.MachineUtilizations && 
                 selectedReservation.MachineUtilizations.some(m => m.DownTimes && m.DownTimes.length > 0) && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium text-gray-900">Downtime Adjustments:</span>
                    <span className="text-red-600">
                      {(() => {
                        let totalAdjustment = 0;
                        
                        selectedReservation.MachineUtilizations.forEach(machine => {
                          if (!machine.DownTimes || machine.DownTimes.length === 0) return;
                          
                          // Find the associated service for this machine
                          const relatedService = selectedReservation.UserServices.find(
                            service => service.ServiceAvail === machine.ServiceName || 
                                      service.EquipmentAvail === machine.Machine
                          );
                          
                          // Calculate cost per minute if we can find the service
                          let costPerMin = 0;
                          if (relatedService && relatedService.CostsAvail !== null && relatedService.MinsAvail) {
                            const cost = typeof relatedService.CostsAvail === 'string' ? 
                              parseFloat(relatedService.CostsAvail) : 
                              relatedService.CostsAvail as number;
                            costPerMin = cost / relatedService.MinsAvail;
                          }
                          
                          // Sum up all downtime adjustments for this machine
                          machine.DownTimes.forEach(downtime => {
                            totalAdjustment -= costPerMin * (downtime.DTTime || 0);
                          });
                        });
                        
                        return `₱${totalAdjustment.toFixed(2)}`;
                      })()}
                    </span>
                  </div>
                 )
                }
                
                <div className="flex justify-between items-center mt-4 text-lg font-bold">
                  <span>Total Amount Due:</span>
                  <span>
                    {(() => {
                      let subtotal = selectedReservation.UserServices.reduce(
                        (total, service) => {
                          if (service.CostsAvail === null) return total;
                          const cost = typeof service.CostsAvail === 'string' ? 
                            parseFloat(service.CostsAvail) : 
                            service.CostsAvail as number;
                          return total + cost;
                        }, 
                        0
                      );
                      
                      let downtimeAdjustments = 0;
                      
                      // Calculate downtime adjustments if they exist
                      if (selectedReservation.MachineUtilizations) {
                        selectedReservation.MachineUtilizations.forEach(machine => {
                          if (!machine.DownTimes || machine.DownTimes.length === 0) return;
                          
                          // Find the associated service
                          const relatedService = selectedReservation.UserServices.find(
                            service => service.ServiceAvail === machine.ServiceName || 
                                      service.EquipmentAvail === machine.Machine
                          );
                          
                          // Calculate cost per minute
                          let costPerMin = 0;
                          if (relatedService && relatedService.CostsAvail !== null && relatedService.MinsAvail) {
                            const cost = typeof relatedService.CostsAvail === 'string' ? 
                              parseFloat(relatedService.CostsAvail) : 
                              relatedService.CostsAvail as number;
                            costPerMin = cost / relatedService.MinsAvail;
                          }
                          
                          // Sum up all downtime adjustments
                          machine.DownTimes.forEach(downtime => {
                            downtimeAdjustments -= costPerMin * (downtime.DTTime || 0);
                          });
                        });
                      }
                      
                      const total = subtotal + downtimeAdjustments;
                      return `₱${total.toFixed(2)}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900">Schedule</h3>
          <div className="mt-2">
            {selectedReservation.UtilTimes.map((time, index) => (
              <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                <p><span className="text-gray-600">Day {time.DayNum}:</span></p>
                <p className="ml-4">Start: {time.StartTime ? new Date(time.StartTime).toLocaleString() : 'Not set'}</p>
                <p className="ml-4">End: {time.EndTime ? new Date(time.EndTime).toLocaleString() : 'Not set'}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900">Tools</h3>
          <div className="mt-2">
            {selectedReservation.UserTools.length > 0 ? (
              <div className="space-y-2">
                {selectedReservation.UserTools.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">{tool.ToolUser}</span>
                    <span className="font-medium">{tool.ToolQuantity} units</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tools specified</p>
            )}
          </div>
        </div>
        
        {selectedReservation.MachineUtilizations && selectedReservation.MachineUtilizations.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900">Machine Details</h3>
            <div className="mt-2">
              <div className="space-y-2">
                {selectedReservation.MachineUtilizations.map((machine, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
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
    )}
  </DialogContent>
</Dialog>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

export default DashboardUser;