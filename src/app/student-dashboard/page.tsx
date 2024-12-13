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
  RequestDate: Date;
  UtilReqApproval: boolean | null;
  ProductsManufactured: string;
  BulkofCommodity: string;
  accInfo: {
    name: string;
    email: string;
  };
  ProcessInfos: Array<{
    Equipment: string;
    Tools: string;
    ToolsQty: number;
  }>;
  UtilTimes: Array<{
    StartTime: Date;
    EndTime: Date;
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
  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

 // useEffect to fetch reservations
 useEffect(() => {
  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/fetchReservations');
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    }
  };

  fetchReservations();
}, []);

 // useEffect to user role
useEffect(() => {
  const checkUserRole = async () => {
    if (!user) {
      setUserRole("Not logged in");
      return;
    }
    try {
      const publicMetadata = user.publicMetadata;
      const role = publicMetadata.role;
      setUserRole(role as string);
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

const renderSection = (title: string, fields: { label: string, value: any }[]) => (
  <div className="mb-6">
    <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
    <div className="grid grid-cols-2 gap-4">
      {fields.map(({ label, value }) => (
        <div key={label} className={`${label.toLowerCase().includes('address') ? 'col-span-2' : ''}`}>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-1">{value?.toString() || 'Not provided'}</p>
        </div>
      ))}
    </div>
  </div>
);

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
              <li>
                <Link href="/student-dashboard/settings" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]">
                  Settings
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
                  <span className="block text-xs">Student</span>
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
              <div className="overflow-x-auto rounded-lg bg-blue-100 shadow-ld">
              <table className="min-w-full divide-y divide-gray-200 rounded-xl">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">

        {reservations.map((reservation) => (
          <tr key={reservation.id}>
            {/*Date*/}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {new Date(reservation.RequestDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </td>

            {/*Status*/}
            <td className="px-4 py-4 whitespace-nowrap">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                Pending
              </span>
            </td>

            {/*Product*/}
            <td className="px-4 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {reservation.ProductsManufactured}
              </div>
            </td>

            
            {/*Service*/}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  Machine
              </div>
            </td>


            {/*Email*/}
            <div className="px-6 py-4 whitespace-nowrap font-medium text-sm text-gray-500">
                {reservation.accInfo.email}
            </div>

            {/*Review*/}

            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <a href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleReviewClick(reservation);
                }} 
                className="ml-2 text-red-600 hover:text-red-900"
              >
                Review
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
            </div>
            </div>

       {/* Review Modal */}
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
                  <p>{selectedReservation.UtilReqApproval === true
                      ? 'Approved'
                      : selectedReservation.UtilReqApproval === false
                      ? 'Rejected'
                      : 'Pending'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Products Information</h3>
                <div className="mt-2">
                  <p><span className="text-gray-600">Products Manufactured:</span> {selectedReservation.ProductsManufactured}</p>
                  <p><span className="text-gray-600">Bulk of Commodity:</span> {selectedReservation.BulkofCommodity}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Schedule</h3>
                <div className="mt-2">
                  {selectedReservation.UtilTimes.map((time, index) => (
                    <div key={index}>
                      <p><span className="text-gray-600">Start:</span> {new Date(time.StartTime).toLocaleString()}</p>
                      <p><span className="text-gray-600">End:</span> {new Date(time.EndTime).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Process Information</h3>
                {selectedReservation.ProcessInfos.map((process, index) => (
                  <div key={index} className="mt-2 space-y-2">
                    <div>
                      <p className="text-gray-600">Equipment</p>
                      <p>{process.Equipment}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tools</p>
                      <p>{process.Tools}</p>
                    </div>
                  </div>
                ))}
              </div>
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

