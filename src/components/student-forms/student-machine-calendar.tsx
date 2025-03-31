// src/components/student-forms/student-machine-calendar.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Filter, CheckCircle, Calendar as CalendarIcon, X, Clock } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface Machine {
  id: string;
  Machine: string;
  isAvailable: boolean;
  Number?: number;
  description?: string;
}

interface Service {
  id: string;
  Service: string;
  Machines?: { 
    machine: {
      id: string;
      Machine: string;
      Number?: number;
      isAvailable?: boolean;
      Desc?: string;
    } 
  }[];
}

interface StudentMachineCalendarProps {
  formData: {
    days: Day[];
    selectedService?: string;
    selectedMachines?: { id: string, name: string, quantity: number }[];
  };
  updateFormData: (field: string, value: any) => void;
  maxDates?: number;
}

const StudentMachineCalendar: React.FC<StudentMachineCalendarProps> = ({ 
  formData, 
  updateFormData,
  maxDates = 5
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedService, setSelectedService] = useState<string>(formData.selectedService || '');
  const [availableMachinesForService, setAvailableMachinesForService] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [machineAvailabilityMap, setMachineAvailabilityMap] = useState<Record<string, number>>({});

  // Fetch all the data we need
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch services
        const servicesRes = await fetch('/api/services');
        const servicesData = await servicesRes.json();
        setServices(servicesData);

        // Fetch machines
        const machinesRes = await fetch('/api/machines');
        const machinesData = await machinesRes.json();
        setMachines(machinesData);

        // Fetch calendar reservations
        const reservationsRes = await fetch('/api/user/calendar-reservations');
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData);

        // Fetch blocked dates
        const blockedDatesRes = await fetch('/api/blocked-dates');
        const blockedDatesData = await blockedDatesRes.json();
        setBlockedDates(blockedDatesData.map((item: any) => new Date(item.date)));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update available machines when selected service changes
  useEffect(() => {
    if (selectedService && services.length > 0) {
      const serviceData = services.find(s => s.Service === selectedService);
      
      if (serviceData && serviceData.Machines) {
        // Filter only available machines
        const availableMachines = serviceData.Machines
          .filter(m => m.machine.isAvailable !== false)
          .map(m => ({
            id: m.machine.id,
            Machine: m.machine.Machine,
            isAvailable: m.machine.isAvailable !== false,
            Number: m.machine.Number || 1,
            description: m.machine.Desc || ''
          }));
        
        setAvailableMachinesForService(availableMachines);
        
        // Auto-select the first machine if none is selected
        if (availableMachines.length > 0 && !selectedMachineId) {
          setSelectedMachineId(availableMachines[0].id);
        }
      } else {
        setAvailableMachinesForService([]);
      }
    } else {
      setAvailableMachinesForService([]);
    }
  }, [selectedService, services, selectedMachineId]);

  // Calculate machine availability based on reservations
  useEffect(() => {
    if (!selectedMachineId || !availableMachinesForService.length) {
      setMachineAvailabilityMap({});
      return;
    }

    // Find the selected machine
    const machine = availableMachinesForService.find(m => m.id === selectedMachineId);
    if (!machine) return;

    // Calculate how many machines are available for each date
    const totalMachinesForThisId = machine.Number || 1;
    const dateUsageMap: Record<string, number> = {};
    
    // Process each reservation to determine machine usage by date
    reservations.forEach(reservation => {
      // Check if this reservation involves our selected machine
      const reservedMachines = reservation.machines.filter((m: string) => 
        m === selectedMachineId || m === machine.Machine
      );
      
      if (reservedMachines.length > 0) {
        // Get date from reservation
        let dateStr = '';
        if (reservation.timeSlots && reservation.timeSlots.length > 0 && reservation.timeSlots[0].startTime) {
          dateStr = new Date(reservation.timeSlots[0].startTime).toDateString();
        } else if (reservation.date) {
          dateStr = new Date(reservation.date).toDateString();
        }
        
        if (dateStr) {
          // Count each machine separately
          dateUsageMap[dateStr] = (dateUsageMap[dateStr] || 0) + reservedMachines.length;
        }
      }
    });
    
    // Create the availability map (total - used = available)
    const availabilityMap: Record<string, number> = {};
    
    // Pre-populate with a 3-month range
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    for (let date = new Date(today); date <= threeMonthsLater; date.setDate(date.getDate() + 1)) {
      const dateStr = new Date(date).toDateString();
      availabilityMap[dateStr] = totalMachinesForThisId - (dateUsageMap[dateStr] || 0);
    }
    
    setMachineAvailabilityMap(availabilityMap);
  }, [selectedMachineId, availableMachinesForService, reservations]);

  // Handle service selection
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newService = e.target.value;
    setSelectedService(newService);
    updateFormData('selectedService', newService);
    // Reset machine selection when service changes
    setSelectedMachineId('');
  };

  // Handle machine selection
  const handleMachineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const machineId = e.target.value;
    setSelectedMachineId(machineId);
    
    if (machineId) {
      const machine = availableMachinesForService.find(m => m.id === machineId);
      if (machine) {
        // Update selected machines in form data
        updateFormData('selectedMachines', [{
          id: machine.id,
          name: machine.Machine,
          quantity: 1 // Students typically select 1 machine
        }]);
      }
    } else {
      updateFormData('selectedMachines', []);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Check if date is selectable
    if (isDateDisabled(date)) {
      return;
    }

    // Check if date is already selected
    const dateStr = date.toDateString();
    const isAlreadySelected = formData.days.some(d => new Date(d.date).toDateString() === dateStr);
    
    let newDays;
    
    if (isAlreadySelected) {
      // Remove the date if already selected
      newDays = formData.days.filter(d => new Date(d.date).toDateString() !== dateStr);
    } else {
      // Add the date if under max limit
      if (formData.days.length >= maxDates) {
        toast({
          title: "Maximum dates reached",
          description: `You can only select up to ${maxDates} dates`,
          variant: "destructive",
        });
        return;
      }
      // Add new day with null time values
      newDays = [...formData.days, { date, startTime: null, endTime: null }];
    }
    
    // Update form data
    updateFormData('days', newDays);
  };

  // Determine if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isPastDate = new Date(date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
    const isBlocked = blockedDates.some(d => d.toDateString() === dateStr);
    
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const isTooFarInFuture = date > oneMonthLater;
    
    // Machine-specific availability check
    const isNoMachineAvailable = selectedMachineId && 
                               machineAvailabilityMap[dateStr] !== undefined && 
                               machineAvailabilityMap[dateStr] <= 0;
    
    return isWeekend || isPastDate || isBlocked || isNoMachineAvailable || isTooFarInFuture;
  };

  // Helper to compute CSS class for each date cell
  const getDayClass = (date: Date) => {
    const dateStr = date.toDateString();
    const isSelected = formData.days.some(d => new Date(d.date).toDateString() === dateStr);
    const isDisabled = isDateDisabled(date);
    
    if (isSelected) return 'bg-blue-100 text-blue-800 font-semibold';
    if (isDisabled) return 'text-gray-300 line-through cursor-not-allowed';
    return '';
  };

  return (
    <Card className="mt-6 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-blue-700">Select Machine & Dates</h2>
        </div>
        
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Service Selection */}
            <div className="mb-6">
              <label htmlFor="service" className="block text-sm font-medium mb-2 text-gray-700">
                Select Service <span className="text-red-500">*</span>
              </label>
              <select
                id="service"
                value={selectedService}
                onChange={handleServiceChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
              >
                <option value="">-- Select a service --</option>
                {services.map(service => (
                  <option key={service.id} value={service.Service}>
                    {service.Service}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Machine Selection */}
            {selectedService && (
              <div className="mb-6">
                <label htmlFor="machine" className="block text-sm font-medium mb-2 text-gray-700">
                  Select Machine <span className="text-red-500">*</span>
                </label>
                <select
                  id="machine"
                  value={selectedMachineId}
                  onChange={handleMachineChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                >
                  <option value="">-- Select a machine --</option>
                  {availableMachinesForService.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.Machine} ({machineAvailabilityMap[new Date().toDateString()] || 0} available)
                    </option>
                  ))}
                </select>
                
                {selectedMachineId && availableMachinesForService.find(m => m.id === selectedMachineId)?.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {availableMachinesForService.find(m => m.id === selectedMachineId)?.description}
                  </p>
                )}
              </div>
            )}
            
            {/* Show calendar only when a machine is selected */}
            {selectedMachineId && (
              <>
                <div className="bg-blue-50 p-4 mb-6 rounded-lg border border-blue-100">
                  <div className="flex gap-2">
                    <Info className="text-blue-500 h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800 text-sm">Machine Availability</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Select up to {maxDates} dates for your reservation. Unavailable dates are disabled.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden p-4 bg-white">
                  <Calendar
                    mode="multiple"
                    selected={formData.days.map(day => new Date(day.date))}
                    onSelect={(_, date) => date && handleDateSelect(date)}
                    disabled={isDateDisabled}
                    className="w-full"
                    styles={{
                      day_selected: { backgroundColor: '#93c5fd', color: '#1e40af' },
                      day_disabled: { color: '#d1d5db', textDecoration: 'line-through' }
                    }}
                    modifiersStyles={{
                      selected: { backgroundColor: '#93c5fd', color: '#1e40af', fontWeight: 'bold' }
                    }}
                  />
                </div>
                
                {/* Selected dates display */}
                {formData.days.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" /> Selected Dates
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[...formData.days]
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((day, index) => (
                          <div 
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm flex items-center"
                          >
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric'
                            })}
                            <button
                              onClick={() => handleDateSelect(new Date(day.date))}
                              className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-0.5 rounded-full transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Machine availability legend */}
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 mr-2"></div>
                      <span>Selected dates ({formData.days.length}/{maxDates})</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
                      <span>Unavailable (weekends, past dates, blocked, or fully booked)</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentMachineCalendar;