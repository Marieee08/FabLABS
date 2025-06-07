// /user-dashboard/information/page.tsx

"use client";

import Link from "next/link";
import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from "@clerk/nextjs";
import { format } from 'date-fns';
import PersonalInfoEditModal from '@/components/user/personal-info-edit-modal';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ClientInfo {
  ContactNum: string;
  Address: string | null;
  City: string | null;
  Province: string | null;
  Zipcode: number | null;
}

interface AccInfo {
  id: number;
  clerkId: string;
  Name: string;
  email: string;
  Role: string;
  ClientInfo: ClientInfo | null;
}

const PersonalInformationPage = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [accInfo, setAccInfo] = useState<AccInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

  // Navigation handler with loading state
  const handleNavigation = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

  // Fetch user role and account info
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/account/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch account data');
        }
        const data = await response.json();
        setAccInfo(data);

        const roleResponse = await fetch('/api/auth/check-roles');
        if (!roleResponse.ok) {
          throw new Error('Failed to fetch role');
        }
        const roleData = await roleResponse.json();
        setUserRole(roleData.role || "No role assigned");
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchAllData();
    }
  }, [user, isLoaded]);

  return (
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
                  className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]"
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
                    <Link 
                      href="/staff-dashboard" 
                      className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]"
                    >
                      General
                    </Link>
                  </li>
                  <li className="ml-6">
                    <Link 
                      href="/staff-dashboard/history" 
                      className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-gray-600 hover:text-[#0d172c]"
                    >
                      History
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link 
                  href="/staff-dashboard/information" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/staff-dashboard/information');
                  }}
                  className="group relative flex w-full items-center justify-between gap-2.5 rounded-full py-2 px-4 font-medium text-blue-800 bg-blue-100 border border-[#5e86ca]"
                >
                  <span>Personal Info</span>
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
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/');
                }}
                className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
              >
                Home
              </Link>
              <Link 
                href="/services" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/services');
                }}
                className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
              >
                Services
              </Link>
              <Link 
                href="/contact" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/contact');
                }}
                className="font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
              >
                Contact
              </Link>
            </div>
      
            <div className="flex items-center gap-3 2xsm:gap-7">
              <UserButton showName />
            </div>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Personal Information</h2>
            <p className="text-sm text-[#143370] mb-4 font-poppins1">{formattedDate}</p>
         
            <section className="flex-1">
              <div className="py-4 border-b border-gray-200">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 text-blue-800 bg-blue-100 border border-[#5e86ca]"
                >
                  {!accInfo?.ClientInfo || !accInfo.ClientInfo.ContactNum 
                    ? "Add Information" 
                    : "Edit Information"}
                </button>
              </div>

              {/* Personal Information Display */}
              <div className="pt-8 space-y-8">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                        <h3 className="text-sm text-gray-500 mb-1">Full Name</h3>
                        <div className="text-lg font-qanelas1 text-gray-800">
                          {user?.firstName} {user?.lastName}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                      <h3 className="text-sm text-gray-500 mb-1">Contact Number</h3>
                      <div className="text-lg font-qanelas1 text-gray-800">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-7 w-3/4 rounded"/>
                        ) : (
                          accInfo?.ClientInfo?.ContactNum || "Not provided"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Address Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                        <h3 className="text-sm text-gray-500 mb-1">Street Address</h3>
                        <div className="text-lg font-qanelas1 text-gray-800">
                          {loading ? (
                            <div className="animate-pulse bg-gray-200 h-7 w-3/4 rounded"/>
                          ) : (
                            accInfo?.ClientInfo?.Address || "Not provided"
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                      <h3 className="text-sm text-gray-500 mb-1">City/Municipality</h3>
                      <div className="text-lg font-qanelas1 text-gray-800">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-7 w-3/4 rounded"/>
                        ) : (
                          accInfo?.ClientInfo?.City || "Not provided"
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                      <h3 className="text-sm text-gray-500 mb-1">Province</h3>
                      <div className="text-lg font-qanelas1 text-gray-800">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-7 w-3/4 rounded"/>
                        ) : (
                          accInfo?.ClientInfo?.Province || "Not provided"
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                      <h3 className="text-sm text-gray-500 mb-1">Zip Code</h3>
                      <div className="text-lg font-qanelas1 text-gray-800">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-7 w-3/4 rounded"/>
                        ) : (
                          accInfo?.ClientInfo?.Zipcode || "Not provided"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <PersonalInfoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentInfo={accInfo?.ClientInfo}
          userId={user?.id ?? ''}
        />
      </div>
    </div>
  );
};

export default PersonalInformationPage;