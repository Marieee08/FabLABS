"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import PricingTable from '@/components/admin-functions/price-table';
import Navbar from '@/components/custom/navbar';
import { AlertCircle, Clock, BadgeX, X } from 'lucide-react';

interface Machine {
  id: string;
  Machine: string;
  Image: string;
  Desc: string;
  Instructions?: string;
  Link?: string;
  isAvailable: boolean;
  createdAt: string;
}

export default function Services() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const pricingRef = useRef<HTMLElement>(null);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    // Fetch machines
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        const data = await response.json();
        
        const customSort = (a: Machine, b: Machine) => {
          if (a.isAvailable && !b.isAvailable) return -1;
          if (!a.isAvailable && b.isAvailable) return 1;
          
          if (a.isAvailable && b.isAvailable) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        };
        
        const sortedMachines = [...data].sort(customSort);
        setMachines(sortedMachines);
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };
  
    // Fetch user info to get role
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user/info');
        const data = await response.json();
        if (data && data.Role) {
          setUserRole(data.Role);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Default to MSME if there's an error
        setUserRole("MSME");
      }
    };

    fetchMachines();
    fetchUserRole();
  }, []);

  const handleScheduleClick = () => {
    if (userRole === "STUDENT") {
      router.push('/user-services/student-schedule');
    } else {
      router.push('/user-services/msme-schedule');
    }
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openModal = (machine: Machine) => {
    setSelectedMachine(machine);
  };

  const closeModal = () => {
    setSelectedMachine(null);
  };

  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <div className="relative h-[300px]">
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-b-[50px] z-10"
          style={{
            backgroundImage: `url('/images/machines/services.png')`,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
        </div>
        
        <div className="relative z-20">
          <Navbar />
        </div>

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-white rounded-3xl shadow-xl p-8 w-11/12 max-w-4xl z-10">
          <h2 className="mb-4 text-center block text-3xl md:text-2xl font-qanelas2">Avail a service now!</h2>
          <p className="text-gray-700 mb-8 text-center text-md font-poppins1 mb-5">Check out the latest updates on machine availability and maintenance.</p>
          <div className="text-center">
            <button 
              onClick={handleScheduleClick} 
              className="inline-block transition duration-700 
                animate-[bounce_4s_infinite] hover:animate-none hover:scale-105
                bg-[#193d83] text-white font-qanelas1 text-lg py-1 px-6 rounded-md hover:bg-[#2f61c2]"
            >
              Schedule Service
            </button>
          </div>
        </div>
      </div>

      <div className="pt-40">
        <section className="container mx-auto px-10 pb-10 pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-qanelas2">Machines</h2>
              <button
                onClick={handleButtonClick}
                className="font-semibold text-ms bg-blue-100 border border-[#5e86ca] rounded-full text-blue-800 ml-4 px-4 py-1 hover:bg-[#154c8f] hover:text-white transition duration-300"
              >
                See Prices
              </button>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-[150vh] w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold mr-4 font-qanelas2">Pricing Details</h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-500 hover:text-gray-700 transition duration-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <PricingTable />
                </div>
              </div>
            )}
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-opacity duration-1000 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {machines.map((machine) => (
              <div 
                key={machine.id} 
                className="bg-white p-6 rounded-2xl shadow-lg relative overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
              >
                {!machine.isAvailable && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-10">
                    <p className="text-white text-lg font-bold font-qanelas2">{machine.Machine}</p>
                    <BadgeX size={48} className="text-white" />
                    <span className="text-white text-lg font-bold">Currently Unavailable</span>
                    <Clock size={24} className="text-white animate-pulse" />
                    <span className="text-white text-sm font-poppins1">Come back later!</span>
                  </div>
                )}
                <div className="relative">
                  <img 
                    src={machine.Image} 
                    alt={machine.Machine} 
                    className="h-80 w-full object-cover rounded-lg mb-4" 
                  />
                  {machine.isAvailable && (
                    <div className="absolute top-2 right-2 mt-2 mr-1 bg-[#1c62b5] text-white px-3 py-1 rounded-full text-sm font-poppins1 shadow-lg ">
                      Available
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-qanelas2">{machine.Machine}</h3>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3 font-poppins1 text-md">
                  {machine.Desc}
                </p>
                <button
                  onClick={() => openModal(machine)}
                  className={`w-full py-3 px-6 rounded-full transition duration-300 flex items-center justify-center gap-2 font-poppins1 ${
                    !machine.isAvailable 
                      ? 'bg-gray-400 text-white opacity-50 cursor-not-allowed' 
                      : 'bg-[#1c62b5] text-white hover:bg-[#154c8f] hover:shadow-lg'
                  }`}
                  disabled={!machine.isAvailable}
                >
                  {machine.isAvailable ? (
                    <>Learn More</>
                  ) : (
                    <><AlertCircle size={20} /> Unavailable</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {selectedMachine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={closeModal}>
            <div 
              className="bg-white rounded-lg shadow-lg w-full max-w-4xl relative flex flex-col md:flex-row overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left column - Image */}
              <div className="w-full md:w-1/2 p-8 flex items-center justify-center bg-gray-50">
                <img 
                  src={selectedMachine.Image} 
                  alt={selectedMachine.Machine} 
                  className="h-80 w-full object-cover rounded-lg"
                />
              </div>

              {/* Right column - Content */}
              <div className="w-full md:w-1/2 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-qanelas2">{selectedMachine.Machine}</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 transition duration-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2 font-qanelas2">Description</h3>
                    <p className="text-gray-700 font-poppins1">{selectedMachine.Desc}</p>
                  </div>

                  {/* Instructions */}
                  {selectedMachine.Instructions && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 font-qanelas2">Instructions</h3>
                      <p className="text-gray-700 font-poppins1">{selectedMachine.Instructions}</p>
                    </div>
                  )}

                  {/* Video Link */}
                  {selectedMachine.Link && (
                    <div className="mt-4">
                      <a
                        href={selectedMachine.Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1c62b5] hover:text-[#154c8f] font-poppins1 hover:underline"
                      >
                        Watch Tutorial Video
                      </a>
                    </div>
                  )}

                  {/* Schedule Button */}
                  <div className="mt-6">
                    <button 
                      onClick={handleScheduleClick}
                      className="w-full bg-[#1c62b5] text-white py-3 px-6 rounded-full transition duration-300 hover:bg-[#154c8f] flex items-center justify-center font-poppins1"
                    >
                      Schedule Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}