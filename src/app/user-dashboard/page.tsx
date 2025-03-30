
// src\app\user-dashboard\page.tsx
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

interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null; // Time in minutes
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
}

interface AdjustedUserService extends UserService {
  downtimeMinutes?: number;
  adjustedCost?: number;
  originalCost?: number;
}


const DashboardUser = () => {
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
  const [informationDropdownOpen, setInformationDropdownOpen] = useState(true);

  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Admin Approval':
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

  // Helper function to get unique items from arrays
  const getUniqueItems = (items: (string | null)[]): string => {
    // Filter out null values and create a Set to remove duplicates
    const uniqueItems = Array.from(new Set(items.filter(Boolean) as string[]));
    return uniqueItems.join(', ');
  };

  // useEffect to fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      setIsReservationsLoading(true);
      try {
        const response = await fetch('/api/user/fetch-reservations');
        if (response.ok) {
          const data = await response.json();
          
          // Process the reservations to consolidate services and machines with same names
          const processedData = data.map((reservation: Reservation) => {
            // Process UserServices to consolidate duplicates
            if (reservation.UserServices && Array.isArray(reservation.UserServices)) {
              const serviceMap = new Map();
              
              reservation.UserServices.forEach((service: UserService) => {
                // Create a composite key that combines service name and equipment name
                const key = `${service.ServiceAvail}___${service.EquipmentAvail}`;
                
                if (!serviceMap.has(key)) {
                  serviceMap.set(key, service);
                }
              });
              
              // Update UserServices with consolidated list
              reservation.UserServices = Array.from(serviceMap.values());
            }
            
            // Process MachineUtilizations to consolidate duplicate machines
            if (reservation.MachineUtilizations && Array.isArray(reservation.MachineUtilizations)) {
              const machineMap = new Map();
              
              reservation.MachineUtilizations.forEach((machine: MachineUtilization) => {
                // Skip null machine names
                if (!machine.Machine) return;
                
                // Create a key from the machine name
                const key = machine.Machine;
                
                if (!machineMap.has(key)) {
                  machineMap.set(key, machine);
                }
              });
              
              // Update MachineUtilizations with consolidated list
              reservation.MachineUtilizations = Array.from(machineMap.values());
            }
            
            // Process UserTools to consolidate duplicates and sum quantities
            if (reservation.UserTools && Array.isArray(reservation.UserTools)) {
              const toolMap = new Map();
              
              reservation.UserTools.forEach((tool: UserTool) => {
                const key = tool.ToolUser;
                
                if (!toolMap.has(key)) {
                  toolMap.set(key, { ...tool });
                } else {
                  // For tools, sum the quantities if they're the same tool
                  const existingTool = toolMap.get(key);
                  existingTool.ToolQuantity += tool.ToolQuantity;
                  toolMap.set(key, existingTool);
                }
              });
              
              // Update UserTools with consolidated list
              reservation.UserTools = Array.from(toolMap.values());
            }
            
            return reservation;
          });
          
          setReservations(processedData);
        }
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      } finally {
        setIsReservationsLoading(false);
      }
    };

    fetchReservations();
  }, []);

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

  const handleReviewClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  // Navigation handler with loading state
  const handleNavigation = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

  // Reservation Loading Skeleton
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

  return (
    <RoleGuard allowedRoles={['MSME']}>
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
              <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Dashboard</h2>
              <p className="text-sm text-[#143370] mb-4 font-poppins1">{formattedDate}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">

              </div>

              <div className="bg-white rounded-lg text-blue-800 px-4 py-4 shadow-md border border-[#5e86ca]">
                <p className="text-xl font-bold text-[#143370]">Pending Reservations</p>
                <p className="text-sm text-[#143370] mb-4">Here are your pending reservations!</p>
                <div className="overflow-x-auto rounded-lg bg-blue-100 shadow-ld">
                  
                {isReservationsLoading ? (
                  <ReservationSkeleton />
                ) : (
                  reservations.length === 0 ? (
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <p className="text-blue-800">You don't have any pending Reservations at the moment.</p>
                      <a 
                        href="/services"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation('/services');
                        }}
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Create a New Order
                      </a>
                    </div>
                  ) : (
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
                        {reservations.map((reservation) => (
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
                                {/* Display unique service names */}
                                {getUniqueItems(reservation.UserServices.map(service => service.ServiceAvail))}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {reservation.MachineUtilizations && reservation.MachineUtilizations.length > 0 ? (
                                <div className="text-sm font-medium text-gray-900">
                                  {/* Display unique machine names */}
                                  {getUniqueItems(reservation.MachineUtilizations.map(machine => machine.Machine))}
                                </div>
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {/* Display unique equipment names */}
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
                  )
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
            
            {/* Display machine utilizations if available */}
            {selectedReservation.MachineUtilizations && selectedReservation.MachineUtilizations.length > 0 && (
              <p>
                <span className="text-gray-600">Machines:</span> 
                {getUniqueItems(selectedReservation.MachineUtilizations.map(machine => machine.Machine))}
              </p>
            )}
            
            <p><span className="text-gray-600">Bulk of Commodity:</span> {selectedReservation.BulkofCommodity || 'Not specified'}</p>
          </div>
        </div>

{/* Cost Breakdown Section */}
        <div>
            <h3 className="font-medium text-gray-900">Estimated Cost Breakdown</h3>
            <div className="mt-2">
              {selectedReservation.UserServices.length > 0 ? (
                <div className="space-y-2">
                  {selectedReservation.UserServices.map((service, index) => {
                    // Convert CostsAvail to number if it's not null
                    const cost = service.CostsAvail !== null ? Number(service.CostsAvail) : 0;
                    const duration = service.MinsAvail !== null ? service.MinsAvail : 0;
          
          return (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div>
                <p className="font-medium">{service.ServiceAvail}</p>
                {service.EquipmentAvail && (
                  <p className="text-sm text-gray-600">Equipment: {service.EquipmentAvail}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">₱{cost.toFixed(2)}</p>
                {duration > 0 && (
                  <p className="text-sm text-gray-600">{duration} minutes</p>
                )}
              </div>
            </div>
          );
        })}
        {/* Total Cost */}
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded border border-blue-100 mt-4">
          <p className="font-bold text-gray-900">Total Estimated Cost</p>
          <p className="font-bold text-blue-800">
            ₱{selectedReservation.UserServices.reduce((total, service) => 
              total + (service.CostsAvail !== null ? Number(service.CostsAvail) : 0), 0).toFixed(2)}
          </p>
        </div>
      </div>
    ) : (
      <p className="text-gray-500 italic">No cost information available</p>
    )}
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
        
        {/* Machine Utilization Details */}
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

              <div className="bg-white rounded-lg text-blue-800 pl-4 py-4 mt-4 shadow-md border border-[#5e86ca]">
                <p className="text-xl font-bold text-[#143370]">History</p>
                <p className="text-sm text-[#143370] mb-4">Here's a summary of your previous transactions!</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

export default DashboardUser;