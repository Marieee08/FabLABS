"use client";

import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from "@clerk/nextjs";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EVCReservation {
  id: number;
  EVCStatus: string;
  ControlNo?: number;
  LvlSec?: string;
  NoofStudents?: number;
  Subject?: string;
  Teacher?: string;
  Topic?: string;
  DateRequested: Date;
  SchoolYear?: number;
  ApprovedBy?: string;
  ReceivedBy?: string;
  ReceivedDate?: Date;
  InspectedBy?: string;
  InspectedDate?: Date;
  accInfo: {
    Name: string;
    email: string;
    Role: string;
  };
  UtilTimes: Array<{
    id: number;
    DayNum: number | null;
    StartTime: Date | null;
    EndTime: Date | null;
  }>;
  EVCStudents: Array<{
    id: number;
    Students?: string;
  }>;
  NeededMaterials: Array<{
    id: number;
    Item?: string;
    ItemQty?: number;
    Description?: string;
    Issued?: string;
    Returned?: string;
  }>;
}

const DashboardUser = () => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [evcReservations, setEvcReservations] = useState<EVCReservation[]>([]);
  const [historyReservations, setHistoryReservations] = useState<EVCReservation[]>([]);
  const [selectedEVCReservation, setSelectedEVCReservation] = useState<EVCReservation | null>(null);
  const [isEVCModalOpen, setIsEVCModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

  // useEffect to fetch EVC reservations for the current user
  useEffect(() => {
    const fetchReservations = async () => {
      if (!isLoaded || !user) return;
      
      setIsLoading(true);
      setIsHistoryLoading(true);
      
      try {
        // Fetch EVC reservations
        const evcResponse = await fetch('/api/user/fetch-evc-reservations');
        
        if (!evcResponse.ok) {
          throw new Error(`Error: ${evcResponse.status} - ${await evcResponse.text()}`);
        }
        
        const evcData = await evcResponse.json();
        
        // Filter into pending/active and history (completed or rejected)
        const pendingReservations = evcData.filter((reservation: EVCReservation) => 
          reservation.EVCStatus.toLowerCase() !== 'completed' && 
          reservation.EVCStatus.toLowerCase() !== 'rejected'
        );
        
        const completedReservations = evcData.filter((reservation: EVCReservation) => 
          reservation.EVCStatus.toLowerCase() === 'completed' || 
          reservation.EVCStatus.toLowerCase() === 'rejected'
        );
        
        setEvcReservations(pendingReservations);
        setHistoryReservations(completedReservations);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setIsLoading(false);
        setIsHistoryLoading(false);
      }
    };
  
    if (isLoaded && user) {
      fetchReservations();
    }
  }, [user, isLoaded]);

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

  const handleEVCReviewClick = (reservation: EVCReservation) => {
    setSelectedEVCReservation(reservation);
    setIsEVCModalOpen(true);
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-999 flex w-full bg-white shadow-sm">
          <div className="flex flex-grow items-center justify-between py-4 px-6 shadow-2 md:px-8">
            <div className="flex items-center">
              <Link href="/" className="text-[#143370] text-2xl font-bold font-qanelas4">FABLAB</Link>
            </div>
            <div className="flex space-x-6 lg:space-x-10">
              <Link href="/" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Home
              </Link>
              <Link href="/user-services" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Services
              </Link>
              <Link href="/student-dashboard/information" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Information
              </Link>
              <Link href="/contact" className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300">
                Contact
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4">
                <span className="text-right">
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
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 lg:px-12 xl:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Dashboard</h2>
                <p className="text-sm text-[#143370] font-poppins1">{formattedDate}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center gap-4 md:justify-end">
                  {user?.imageUrl && (
                    <img 
                      src={user.imageUrl} 
                      alt="Profile" 
                      className="h-14 w-14 rounded-full object-cover md:hidden"
                    />
                  )}
                  <span className="text-right md:hidden">
                    <span className="block text-sm font-medium text-black">
                      {user?.firstName} {user?.lastName || ''}
                    </span>
                    <span className="block text-xs">{userRole}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg text-blue-800 px-6 py-6 shadow-md border border-[#5e86ca] mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xl font-bold text-[#143370]">Pending Orders</p>
                  <p className="text-sm text-[#143370]">Here are your Pending Orders!</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading your reservations...</p>
                </div>
              ) : (
                // EVC Reservations Table
                evcReservations.length === 0 ? (
                  <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <p className="text-blue-800">You don't have any pending EVC reservations at the moment.</p>
                    <Link href="/user-services/student-schedule" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Create a New Reservation
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg bg-blue-50 shadow-md">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                      <thead className="bg-blue-100">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Topic</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Level/Section</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {evcReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-blue-50 transition-colors">
                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(reservation.DateRequested)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(reservation.EVCStatus)}`}>
                                {reservation.EVCStatus}
                              </span>
                            </td>

                            {/* Subject */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.Subject || 'Not specified'}
                              </div>
                            </td>

                            {/* Topic */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.Topic || 'Not specified'}
                              </div>
                            </td>

                            {/* Level/Section */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.LvlSec || 'Not specified'}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEVCReviewClick(reservation)}
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
                )
              )}
            </div>

            <div className="bg-white rounded-lg text-blue-800 px-6 py-6 shadow-md border border-[#5e86ca]">
              <p className="text-xl font-bold text-[#143370]">History</p>
              <p className="text-sm text-[#143370] mb-4">Here's a summary of your previous transactions!</p>
              
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading your history...</p>
                </div>
              ) : (
                historyReservations.length === 0 ? (
                  <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <p className="text-blue-800">You don't have any completed or rejected reservations yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg bg-blue-50 shadow-md">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                      <thead className="bg-blue-100">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Topic</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Level/Section</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historyReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-blue-50 transition-colors">
                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(reservation.DateRequested)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(reservation.EVCStatus)}`}>
                                {reservation.EVCStatus}
                              </span>
                            </td>

                            {/* Subject */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.Subject || 'Not specified'}
                              </div>
                            </td>

                            {/* Topic */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.Topic || 'Not specified'}
                              </div>
                            </td>

                            {/* Level/Section */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.LvlSec || 'Not specified'}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEVCReviewClick(reservation)}
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
                )
              )}
            </div>
          </div>
        </main>
      </div>

      {/* EVC Reservation Review Modal */}
      <Dialog open={isEVCModalOpen} onOpenChange={setIsEVCModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#143370]">EVC Reservation Details</DialogTitle>
          </DialogHeader>
          
          {selectedEVCReservation && (
            <div className="mt-4 space-y-6">
              {/* Reservation Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h3 className="font-medium text-gray-900">Reservation ID</h3>
                  <p className="text-gray-700">#{selectedEVCReservation.id}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Date Requested</h3>
                  <p className="text-gray-700">{formatDate(selectedEVCReservation.DateRequested)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedEVCReservation.EVCStatus)}`}>
                    {selectedEVCReservation.EVCStatus}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Control Number</h3>
                  <p className="text-gray-700">{selectedEVCReservation.ControlNo || 'Not assigned'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">School Year</h3>
                  <p className="text-gray-700">{selectedEVCReservation.SchoolYear || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Level/Section</h3>
                  <p className="text-gray-700">{selectedEVCReservation.LvlSec || 'Not specified'}</p>
                </div>
              </div>

              {/* Class Information */}
              <div className="border-b pb-4">
                <h3 className="font-medium text-gray-900 mb-2">Class Information</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Subject:</p>
                      <p className="text-gray-700">{selectedEVCReservation.Subject || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Teacher:</p>
                      <p className="text-gray-700">{selectedEVCReservation.Teacher || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Topic:</p>
                      <p className="text-gray-700">{selectedEVCReservation.Topic || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Number of Students:</p>
                      <p className="text-gray-700">{selectedEVCReservation.NoofStudents || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="border-b pb-4">
                <h3 className="font-medium text-gray-900 mb-2">Schedule Information</h3>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  {selectedEVCReservation.UtilTimes && selectedEVCReservation.UtilTimes.length > 0 ? (
                    selectedEVCReservation.UtilTimes.map((time, index) => (
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

              {/* Students Information */}
              <div className="border-b pb-4">
                <h3 className="font-medium text-gray-900 mb-2">Students</h3>
                {selectedEVCReservation.EVCStudents && selectedEVCReservation.EVCStudents.length > 0 ? (
                  <div className="bg-gray-50 p-3 rounded">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedEVCReservation.EVCStudents.map((student, index) => (
                        <li key={index} className="text-gray-700">{student.Students || 'Unnamed student'}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded">No student information available</p>
                )}
              </div>

              {/* Materials Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Needed Materials</h3>
                {selectedEVCReservation.NeededMaterials && selectedEVCReservation.NeededMaterials.length > 0 ? (
                  <div className="bg-gray-50 p-3 rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedEVCReservation.NeededMaterials.map((material, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-700">{material.Item || 'Not specified'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{material.ItemQty || 'N/A'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{material.Description || 'No description'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {material.Issued ? 'Issued' : 'Not issued'}{material.Returned ? ', Returned' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-3 rounded">No materials requested</p>
                )}
              </div>

              {/* Approval Information */}
              {selectedEVCReservation.EVCStatus !== 'Pending' && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Processing Information</h3>
                  <div className="bg-gray-50 p-3 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Approved By:</p>
                      <p className="text-gray-700">{selectedEVCReservation.ApprovedBy || 'Not yet approved'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Received By:</p>
                      <p className="text-gray-700">{selectedEVCReservation.ReceivedBy || 'Not yet received'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Received Date:</p>
                      <p className="text-gray-700">{formatDate(selectedEVCReservation.ReceivedDate) || 'Not yet received'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Inspected By:</p>
                      <p className="text-gray-700">{selectedEVCReservation.InspectedBy || 'Not yet inspected'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardUser;