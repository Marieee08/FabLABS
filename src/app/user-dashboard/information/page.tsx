// /user-dashboard/information/page.tsx

"use client";

import Link from "next/link";
import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from "@clerk/nextjs";
import { format } from 'date-fns';
import InfoEditModal from './components/InfoEditModal';

interface ClientInfo {
  ContactNum: string;
  Address: string | null;
  City: string | null;
  Province: string | null;
  Zipcode: number | null;
}

interface BusinessInfo {
  id: number;
  CompanyName: string | null;
  BusinessOwner: string | null;
  BusinessPermitNum: string | null;
  TINNum: string | null;
  CompanyIDNum: string | null;
  CompanyEmail: string | null;
  ContactPerson: string | null;
  Designation: string | null;
  CompanyAddress: string | null;
  CompanyCity: string | null;
  CompanyProvince: string | null;
  CompanyZipcode: number | null;
  CompanyPhoneNum: string | null;
  CompanyMobileNum: string | null;
  Manufactured: string | null;
  ProductionFrequency: string | null;
  Bulk: string | null;
  isNotBusinessOwner?: boolean;
}

interface AccInfo {
  id: number;
  clerkId: string;
  Name: string;
  email: string;
  Role: string;
  ClientInfo: ClientInfo | null;
  BusinessInfo: BusinessInfo | null;
}


const DashboardUser = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBusinessView, setIsBusinessView] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string>("Loading...");
  const [accInfo, setAccInfo] = useState<AccInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isNotBusinessOwner, setIsNotBusinessOwner] = useState(false);
  useEffect(() => {
    if (accInfo?.BusinessInfo?.isNotBusinessOwner !== undefined) {
      setIsNotBusinessOwner(accInfo.BusinessInfo.isNotBusinessOwner);
    }
  }, [accInfo]);

  

  const today = new Date();
  const formattedDate = format(today, 'EEEE, dd MMMM yyyy');

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


  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsNotBusinessOwner(newValue);
    
    try {
      const response = await fetch('/api/user/update-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          type: 'business',
          data: {
            isNotBusinessOwner: newValue,
            // If checked, set all business fields to "Not applicable"
            ...(newValue ? {
              CompanyName: "Not applicable",
              BusinessOwner: "Not applicable",
              BusinessPermitNum: "Not applicable",
              TINNum: "Not applicable",
              CompanyIDNum: "Not applicable",
              CompanyEmail: "Not applicable",
              ContactPerson: "Not applicable",
              Designation: "Not applicable",
              CompanyAddress: "Not applicable",
              CompanyCity: "Not applicable",
              CompanyProvince: "Not applicable",
              CompanyZipcode: null,
              CompanyPhoneNum: "Not applicable",
              CompanyMobileNum: "Not applicable",
              Manufactured: "Not applicable",
              ProductionFrequency: "Not applicable",
              Bulk: "Not applicable"
            } : {})
          }
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update business owner status');
      }
  
      // After successful update, fetch fresh data
      const refreshResponse = await fetch(`/api/account/${user?.id}`);
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh data');
      }
      const refreshedData = await refreshResponse.json();
      setAccInfo(refreshedData);
  
    } catch (error) {
      console.error('Error updating business owner status:', error);
      setIsNotBusinessOwner(!newValue); // Revert on error
    }
  };


  return (
  <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
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
            <Link href="/user-dashboard" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-[#0d172c] border border-transparent hover:text-blue-800 hover:bg-blue-100 hover:border-[#5e86ca]">
              Orders
            </Link>
          </li>
          <li>
            <Link href="/user-dashboard/information" className="group relative flex items-center gap-2.5 rounded-full py-2 px-4 font-medium text-blue-800 bg-blue-100 border border-[#5e86ca]">
              Information
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
      
            <div className="flex items-center gap-3 2xsm:gap-7">
              <UserButton showName />
            </div>
          </div>
        </header>


      <main>
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          <h2 className="text-[#143370] text-3xl font-bold font-qanelas3">Account Information</h2>
          <p className="text-sm text-[#143370] mb-4 font-poppins1">{formattedDate}</p>
         
          <section className="flex-1">
            <div className="py-4 border-b border-gray-200">
              <div className="flex justify-left">
                <div className="inline-flex bg-white rounded-full p-1 border border-[#5e86ca]">
                  <button
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!isBusinessView ? 'text-blue-800 bg-blue-100 border border-[#5e86ca]' : 'text-gray-600 hover:bg-gray-300'}`}
                    onClick={() => setIsBusinessView(false)}
                  >
                    Personal Info
                  </button>
                  <button
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isBusinessView ? 'text-blue-800 bg-blue-100 border border-[#5e86ca]' : 'text-gray-600 hover:bg-gray-300'}`}
                    onClick={() => setIsBusinessView(true)}
                  >
                    Business Info
                  </button>
                </div>
                {isBusinessView && (
                  <label className="flex items-center ml-4 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={isNotBusinessOwner}
                          onChange={handleCheckboxChange}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                    <span className="ml-2">I do not own/operate a business</span>
                  </label>
               )}

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="ml-4 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 text-blue-800 bg-blue-100 border border-[#5e86ca]">
                {(!isBusinessView && (!accInfo?.ClientInfo || !accInfo.ClientInfo.ContactNum)) || 
                (isBusinessView && (!accInfo?.BusinessInfo || 
                  (!accInfo.BusinessInfo.CompanyName && !accInfo.BusinessInfo.isNotBusinessOwner))) 
                  ? "Add Information" 
                  : "Edit Information"}
              </button>
              </div>


{/* Information Display */}
<div className="pt-8">
    {!isBusinessView ? (
      <div className="space-y-8">
        {/* Personal Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h3>
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
    ) : (
      <div className="space-y-8">
        {/* Company Identity Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Company Identity</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                <h3 className="text-sm text-gray-500 mb-1">Company Name</h3>
                <p className="text-lg font-qanelas1 text-gray-800">
                  {accInfo?.BusinessInfo?.CompanyName || "Not provided"}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Business Owner</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.BusinessOwner || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Company ID Number</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyIDNum || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Legal Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Legal Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Business Permit No.</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.BusinessPermitNum || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">TIN No.</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.TINNum || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Company Address</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
                <h3 className="text-sm text-gray-500 mb-1">Street Address</h3>
                <p className="text-lg font-qanelas1 text-gray-800">
                  {accInfo?.BusinessInfo?.CompanyAddress || "Not provided"}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">City</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyCity || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Province</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyProvince || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Zipcode</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyZipcode || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Contact Person</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.ContactPerson || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Position/Designation</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.Designation || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Company Email</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyEmail || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Company Phone Number</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyPhoneNum || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Company Mobile Number</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.CompanyMobileNum || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Production Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Production Information</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Products Manufactured</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.Manufactured || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Production Frequency</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.ProductionFrequency || "Not provided"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#5e86ca]">
              <h3 className="text-sm text-gray-500 mb-1">Bulk</h3>
              <p className="text-lg font-qanelas1 text-gray-800">
                {accInfo?.BusinessInfo?.Bulk || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

        </div>
      </div>
          </section>
          </div>
        </main>


        <InfoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentInfo={isBusinessView ? accInfo?.BusinessInfo : accInfo?.ClientInfo}
          isBusinessView={isBusinessView}
          userId={user?.id ?? ''}
          isNotBusinessOwner={isNotBusinessOwner} 
        />

      </div>
    </div>
  );
};


export default DashboardUser;
