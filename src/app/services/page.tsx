"use client";

import React, { useState } from 'react';
import Link from "next/link";

export default function Offerings() {
  const [isAnimating, setIsAnimating] = useState(false);

  const machines = [
    {
      name: '3D Printer',
      image: 'path/to/3d-printer-image.jpg',
      description: 'Create precise and intricate 3D models with our advanced 3D printers.',
    },
    {
      name: 'Laser Cutter',
      image: 'path/to/laser-cutter-image.jpg',
      description: 'Cut and engrave materials with high precision using our laser cutters.',
    },
    {
      name: 'CNC Machine',
      image: 'path/to/cnc-machine-image.jpg',
      description: 'Produce complex parts with our computer-controlled CNC machines.',
    },
    {
      name: 'Vinyl Cutter',
      image: 'path/to/vinyl-cutter-image.jpg',
      description: 'Cut vinyl and other materials to create custom designs and decals.',
    },
    {
      name: 'PCB Mill',
      image: 'path/to/pcb-mill-image.jpg',
      description: 'Mill custom printed circuit boards for your electronic projects.',
    },
    {
      name: 'Precision Miller',
      image: 'path/to/precision-miller-image.jpg',
      description: 'Assemble and repair electronic components with our soldering stations.',
    },
  ];

  return (
    <main className="min-h-screen bg-[#f1f1f8] pt-24">
      <nav className="bg-[#0d4a8d] p-4 fixed w-full top-0 z-10">
        <div className="container mx-auto flex items-center justify-between relative">
          <div className="flex items-center space-x-4">
            <img src="/images" alt="DOST Logo" className="w-10 h-10" />
            <img src="SSF-logo.png" alt="SSF Logo" className="w-10 h-10" />
            <Link href="/.." className="text-white text-lg">RESOLAB</Link>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-10">
              <Link href="/dashboard" className="text-white px-4 py-2 rounded hover:bg-[#5394cf] transition duration-300">Dashboard</Link>
              <Link href="/services" className="text-white px-4 py-2 rounded hover:bg-[#5394cf] transition duration-300">Services</Link>
              <Link href="/contact" className="text-white px-4 py-2 rounded hover:bg-[#5394cf] transition duration-300">Contact</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="text-white px-4 py-2 rounded hover:bg-blue-500 transition duration-300 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405C18.79 14.79 18 13.42 18 12V8a6 6 0 10-12 0v4c0 1.42-.79 2.79-2.595 3.595L3 17h5m4 0v1a3 3 0 11-6 0v-1m6 0a3 3 0 01-6 0"></path>
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
                <ul className="divide-y divide-gray-300">
                  <li className="px-4 py-2 text-gray-800 hover:bg-gray-100">Order Notification 1</li>
                  <li className="px-4 py-2 text-gray-800 hover:bg-gray-100">Announcement 1</li>
                  <li className="px-4 py-2 text-gray-800 hover:bg-gray-100">Message Notification 1</li>
                  <li className="px-4 py-2 text-gray-800 hover:bg-gray-100">Order Notification 2</li>
                  <li className="px-4 py-2 text-gray-800 hover:bg-gray-100">Announcement 2</li>
                  <li className="px-4 py-2 text-gray-800 hover:bg-gray-100">Message Notification 2</li>
                </ul>
              </div>
            </div>

            <img src="path/to/profile-picture.jpg" alt="Profile" className="w-10 h-10 rounded-full" />
          </div>
        </div>
      </nav>

      {/* Information Section with Schedule Service Button */}
      <section className="bg-white py-8">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-center">Avail a service now!</h2>
          <p className="text-gray-700 mb-6">Check out the latest updates on machine availability and maintenance.</p>
          <button className="bg-[#145da0] text-white py-2 px-4 rounded-full hover:bg-[#0d4a8d] transition duration-300">
            Schedule Service
          </button>
        </div>
      </section>

      {/* Machines Section */}
      <section className="container mx-auto p-10">
        <h2 className="text-3xl font-semibold mb-4">Available Machines</h2>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-opacity duration-1000 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {machines.map((machine, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <img src={machine.image} alt={machine.name} className="h-48 w-full object-cover rounded-t-lg mb-4" />
              <h3 className="text-2xl font-bold mb-2">{machine.name}</h3>
              <p className="text-gray-700 mb-4">{machine.description}</p>
              <button className="bg-[#145da0] text-white py-2 px-4 rounded-full hover:bg-[#0d4a8d] transition duration-300">
                About Machine
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
