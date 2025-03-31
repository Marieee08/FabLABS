// src/components/student-forms/enhanced-lab-reservation.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from "@clerk/nextjs";
import { CheckCircle, AlertCircle } from 'lucide-react';

// Service and machine interfaces
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

interface SelectedMachine {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

// Material interface definition
interface Material {
  id: string;
  Item: string;
  ItemQty: number;
  Description: string;
}

// Student interface definition
interface Student {
  id: number;
  name: string;
}

interface FormData {
  days: any[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // UtilizationInfo fields
  ProductsManufactured: string | string[];
  BulkofCommodity: string;
  Equipment: string[] | string;
  Tools: string;
  serviceLinks?: {[service: string]: string};
  Remarks?: string;

  ControlNo?: number;
  LvlSec: string;
  NoofStudents: number;
  Subject: string;
  Teacher: string;
  TeacherEmail: string; 
  Topic: string;
  SchoolYear: number;
  
  // Needed Materials array - we'll populate this from selected machines
  NeededMaterials: Material[];
  Students: Student[];
}

interface FormErrors {
  LvlSec?: string;
  Subject?: string;
  Teacher?: string;
  TeacherEmail?: string; 
  Topic?: string;
  SchoolYear?: string;
  Students?: Record<number, string>;
  NeededMaterials?: Record<string, Record<string, string>>;
  service?: string;
  machines?: string;
}

interface LabReservationProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// Helper function
const generateId = (): string => Math.random().toString(36).substring(2, 15);

export function EnhancedLabReservation({ formData, updateFormData, nextStep, prevStep }: LabReservationProps) {
  const { user, isLoaded } = useUser();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [newStudentAdded, setNewStudentAdded] = useState(false);
  const newStudentInputRef = useRef<HTMLInputElement>(null);
  
  // Services and machines handling
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [availableMachines, setAvailableMachines] = useState<{[service: string]: any[]}>({});
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedMachines, setSelectedMachines] = useState<SelectedMachine[]>([]);
  
  // Initialize students state
  const [students, setStudents] = useState<Student[]>(formData.Students || []);
  const currentYear = new Date().getFullYear();
  
  // Display end year based on start year
  const getEndYear = (startYear: number) => startYear + 1;
  
  // Fetch services and process machine data
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      setServiceError(null);
      
      try {
        const response = await fetch('/api/services', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process machine data
        const machinesByService: {[service: string]: any[]} = {};
        
        data.forEach((service: Service) => {
          if (service.Machines && service.Machines.length > 0) {
            // Filter and map machines, keeping only available ones
            const availableMachinesForService = service.Machines
              .filter(m => m.machine.isAvailable !== false && (m.machine.Number || 0) > 0)
              .map(m => ({
                id: m.machine.id,
                name: m.machine.Machine,
                quantity: m.machine.Number || 0,
                description: m.machine.Desc || ''
              }));
            
            if (availableMachinesForService.length > 0) {
              machinesByService[service.Service] = availableMachinesForService;
            }
          }
        });
        
        setServices(data);
        setAvailableMachines(machinesByService);
        setIsLoadingServices(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setServiceError(err instanceof Error ? err.message : 'Failed to load services');
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Initialize data from formData if available
  useEffect(() => {
    // Initialize selected service from formData
    if (formData.ProductsManufactured) {
      const serviceValue = Array.isArray(formData.ProductsManufactured) 
        ? formData.ProductsManufactured[0] 
        : formData.ProductsManufactured;
        
      setSelectedService(serviceValue);
    }
    
    // Initialize selected machines from NeededMaterials
    if (formData.NeededMaterials && formData.NeededMaterials.length > 0) {
      const machines = formData.NeededMaterials.map(material => ({
        id: material.id || generateId(),
        name: material.Item,
        quantity: material.ItemQty,
        description: material.Description
      }));
      
      setSelectedMachines(machines);
    }
  }, [formData]);

  // Auto-fill user's name as first student when component loads
  useEffect(() => {
    if (isLoaded && user) {
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      
      // If we have a valid user name and no students exist yet
      if (userName && students.length === 0) {
        const newStudent: Student = { id: 1, name: userName };
        const updatedStudents = [newStudent];
        
        setStudents(updatedStudents);
        updateFormData('Students', updatedStudents);
      }
      // If students already exist but none have the user's name
      else if (userName && !students.some(student => student.name === userName)) {
        // Check if we should add a new student or update the first one if it's blank
        if (students.length > 0 && !students[0].name.trim()) {
          // Update the first student if it has no name
          const updatedStudents = [...students];
          updatedStudents[0].name = userName;
          
          setStudents(updatedStudents);
          updateFormData('Students', updatedStudents);
        } else {
          // Add user as a new student
          const highestId = students.length > 0 
            ? Math.max(...students.map(student => student.id))
            : 0;
          
          const newStudent: Student = { id: highestId + 1, name: userName };
          const updatedStudents = [...students, newStudent];
          
          setStudents(updatedStudents);
          updateFormData('Students', updatedStudents);
        }
      }
    } else if (students.length === 0) {
      // If no user is loaded yet but we need at least one student entry
      addStudent();
    }
  }, [isLoaded, user, students, updateFormData]);

  // Focus on new student input when a new student is added
  useEffect(() => {
    if (newStudentAdded && newStudentInputRef.current) {
      newStudentInputRef.current.focus();
      setNewStudentAdded(false);
    }
  }, [newStudentAdded]);

  // Handle service selection
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedServiceValue = e.target.value;
    setSelectedService(selectedServiceValue);
    
    // Clear selected machines when service changes
    setSelectedMachines([]);
    
    // Update form data
    updateFormData('ProductsManufactured', selectedServiceValue);
    updateFormData('NeededMaterials', []);
    
    // Clear validation errors if needed
    if (selectedServiceValue) {
      setErrors(prev => ({...prev, service: undefined}));
    }
  };

  // Handle machine selection
  const handleMachineSelection = (machineId: string, quantity: number) => {
    if (!selectedService) {
      setErrors(prev => ({...prev, service: "Please select a service first"}));
      return;
    }
    
    const serviceMachines = availableMachines[selectedService] || [];
    const machineDetails = serviceMachines.find(m => m.id === machineId);
    
    if (!machineDetails) return;
    
    // Find if machine already exists in selection
    const existingIndex = selectedMachines.findIndex(m => m.id === machineId);
    
    if (existingIndex !== -1) {
      // Update existing machine
      if (quantity <= 0) {
        // Remove if quantity is zero
        const updatedMachines = selectedMachines.filter(m => m.id !== machineId);
        setSelectedMachines(updatedMachines);
      } else {
        // Update quantity
        const updatedMachines = [...selectedMachines];
        updatedMachines[existingIndex].quantity = quantity;
        setSelectedMachines(updatedMachines);
      }
    } else if (quantity > 0) {
      // Add new machine
      setSelectedMachines(prev => [
        ...prev,
        {
          id: machineId,
          name: machineDetails.name,
          quantity,
          description: machineDetails.description
        }
      ]);
    }
    
    // Clear any machine selection error
    if (selectedMachines.length > 0 || quantity > 0) {
      setErrors(prev => ({...prev, machines: undefined}));
    }
  };

  // Convert selected machines to NeededMaterials format for the database
  const updateNeededMaterials = useCallback(() => {
    const materials = selectedMachines.map(machine => ({
      id: generateId(),
      Item: machine.name, // Machine name becomes item name
      ItemQty: machine.quantity,
      Description: machine.description // Machine description stays as description
    }));
    
    updateFormData('NeededMaterials', materials);
  }, [selectedMachines, updateFormData]);

  // Update NeededMaterials whenever selectedMachines changes
  useEffect(() => {
    updateNeededMaterials();
  }, [selectedMachines, updateNeededMaterials]);

  // Student handlers
  const addStudent = () => {
    const highestId = students.length > 0 
      ? Math.max(...students.map(student => student.id))
      : 0;
    
    const newStudent: Student = { id: highestId + 1, name: '' };
    const updatedStudents = [...students, newStudent];
    
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
    setNewStudentAdded(true); // Set flag to trigger focus
  };

  const updateStudentName = (index: number, name: string) => {
    const updatedStudents = students.map((student, i) => 
      i === index ? { ...student, name } : student
    );
    
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
  };

  const removeStudent = (index: number) => {
    if (students.length <= 1) return;
    
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
  };

  // Handle field change
  const handleFieldChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    updateFormData(field, value);
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Basic validation
    if (!formData.LvlSec.trim()) newErrors.LvlSec = "Level/Section is required";
    if (!formData.Subject.trim()) newErrors.Subject = "Subject is required";
    if (!formData.Teacher.trim()) newErrors.Teacher = "Teacher's name is required";
    if (!formData.TeacherEmail.trim()) newErrors.TeacherEmail = "Teacher's email is required";
    if (!formData.Topic.trim()) newErrors.Topic = "Topic is required";
    
    if (!formData.SchoolYear) {
      newErrors.SchoolYear = "School year is required";
    } else if (formData.SchoolYear < currentYear - 5 || formData.SchoolYear > currentYear + 5) {
      newErrors.SchoolYear = "Please enter a valid school year";
    }
    
    // Validate students
    const studentErrors: Record<number, string> = {};
    students.forEach((student, index) => {
      if (!student.name.trim()) studentErrors[index] = "Student name is required";
    });
    
    if (Object.keys(studentErrors).length > 0) {
      newErrors.Students = studentErrors;
    }
    
    // Validate service selection
    if (!selectedService) {
      newErrors.service = "Please select a service";
    }
    
    // Validate machine selection
    if (selectedMachines.length === 0) {
      newErrors.machines = "Please select at least one machine";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, students, currentYear, selectedService, selectedMachines]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    setIsSubmitting(true);
    
    if (validateForm()) {
      nextStep();
    } else {
      const firstErrorElement = document.querySelector('[aria-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    setIsSubmitting(false);
  };

  const inputStyles = `
    .no-spin-buttons::-webkit-inner-spin-button,
    .no-spin-buttons::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .no-spin-buttons {
      -moz-appearance: textfield;
    }
  `;

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <style>{inputStyles}</style>
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 pb-3 border-b border-gray-200">Laboratory Reservation</h2>
        
        <form onSubmit={handleSubmit} noValidate>
          {/* Service & Equipment Section - NEW */}
          <section className="mb-10">
            <div className="flex items-center mb-5">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Equipment & Materials</h3>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              {/* Service Selection */}
              <div className="mb-6">
                <label htmlFor="service" className="block text-sm font-medium mb-1 text-gray-700">
                  Select Service <span className="text-red-500">*</span>
                </label>
                {isLoadingServices ? (
                  <div className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : (
                  <select
                    id="service"
                    value={selectedService}
                    onChange={handleServiceChange}
                    className={`w-full border ${errors.service ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    aria-invalid={!!errors.service}
                  >
                    <option value="">-- Select a service --</option>
                    {services.map(service => (
                      <option key={service.id} value={service.Service}>
                        {service.Service}
                      </option>
                    ))}
                  </select>
                )}
                {errors.service && <p className="mt-1 text-sm text-red-500">{errors.service}</p>}
                {serviceError && <p className="mt-1 text-sm text-red-500">{serviceError}</p>}
              </div>

              {/* Machine Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  Available Equipment <span className="text-red-500">*</span>
                </label>
                
                {!selectedService ? (
                  <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                    Please select a service first to see available equipment
                  </div>
                ) : isLoadingServices ? (
                  <div className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(availableMachines[selectedService] || []).length === 0 ? (
                      <div className="p-4 bg-yellow-50 rounded-lg text-center text-yellow-700 col-span-full">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        No equipment currently available for the selected service
                      </div>
                    ) : (
                      availableMachines[selectedService].map((machine) => {
                        const selectedMachine = selectedMachines.find(m => m.id === machine.id);
                        const currentQuantity = selectedMachine ? selectedMachine.quantity : 0;
                        const maxQuantity = machine.quantity;

                        return (
                          <div 
                            key={machine.id}
                            className={`
                              border rounded-lg p-4 transition-all duration-200
                              ${currentQuantity > 0 
                                ? 'bg-blue-50 border-blue-300' 
                                : 'bg-white border-gray-300 hover:border-blue-300'}
                            `}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-gray-800">{machine.name}</h4>
                              <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {machine.quantity} available
                              </div>
                            </div>
                            
                            {machine.description && (
                              <p className="text-xs text-gray-600 mb-3">{machine.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => handleMachineSelection(machine.id, Math.max(0, currentQuantity - 1))}
                                disabled={currentQuantity <= 0}
                                className={`
                                  p-1.5 rounded border 
                                  ${currentQuantity > 0 
                                    ? 'bg-gray-200 hover:bg-gray-300' 
                                    : 'bg-gray-100 cursor-not-allowed'}
                                `}
                              >
                                -
                              </button>
                              
                              <span className="font-medium text-gray-800 w-8 text-center">
                                {currentQuantity}
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => handleMachineSelection(machine.id, Math.min(maxQuantity, currentQuantity + 1))}
                                disabled={currentQuantity >= maxQuantity}
                                className={`
                                  p-1.5 rounded border 
                                  ${currentQuantity < maxQuantity 
                                    ? 'bg-blue-200 hover:bg-blue-300' 
                                    : 'bg-gray-100 cursor-not-allowed'}
                                `}
                              >
                                +
                              </button>
                            </div>
                            
                            {currentQuantity > 0 && (
                              <div className="mt-2 text-green-600 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span className="text-sm">Selected: {currentQuantity}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                {errors.machines && (
                  <p className="mt-2 text-sm text-red-500">{errors.machines}</p>
                )}
              </div>

              {/* Selected Equipment Summary */}
              {selectedMachines.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Selected Equipment</h4>
                  <ul className="space-y-2">
                    {selectedMachines.map(machine => (
                      <li key={machine.id} className="flex items-center justify-between">
                        <span className="text-gray-800">
                          {machine.name} <span className="text-gray-500">×{machine.quantity}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMachineSelection(machine.id, 0)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove ${machine.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Class Details */}
          <section className="mb-10">
            <div className="flex items-center mb-5">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Class Information</h3>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level/Section */}
                <div>
                  <label htmlFor="lvlSec" className="block text-sm font-medium mb-1 text-gray-700">
                    Level/Section <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lvlSec"
                    type="text"
                    className={`w-full border ${errors.LvlSec ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    value={formData.LvlSec}
                    onChange={(e) => handleFieldChange('LvlSec', e.target.value)}
                    aria-invalid={!!errors.LvlSec}
                    placeholder="e.g. Grade 10-A"
                  />
                  {errors.LvlSec && <p className="mt-1 text-sm text-red-500">{errors.LvlSec}</p>}
                </div>
                
                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1 text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    className={`w-full border ${errors.Subject ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    value={formData.Subject}
                    onChange={(e) => handleFieldChange('Subject', e.target.value)}
                    aria-invalid={!!errors.Subject}
                    placeholder="e.g. Chemistry"
                  />
                  {errors.Subject && <p className="mt-1 text-sm text-red-500">{errors.Subject}</p>}
                </div>
                
                {/* Teacher */}
                <div>
                  <label htmlFor="teacher" className="block text-sm font-medium mb-1 text-gray-700">
                    Teacher <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="teacher"
                    type="text"
                    className={`w-full border ${errors.Teacher ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    value={formData.Teacher}
                    onChange={(e) => handleFieldChange('Teacher', e.target.value)}
                    aria-invalid={!!errors.Teacher}
                    placeholder="e.g. Dr. Jane Smith"
                  />
                  {errors.Teacher && <p className="mt-1 text-sm text-red-500">{errors.Teacher}</p>}
                </div>
                
                {/* Teacher Email */}
                <div>
                  <label htmlFor="teacherEmail" className="block text-sm font-medium mb-1 text-gray-700">
                    Teacher Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="teacherEmail"
                    type="email"
                    className={`w-full border ${errors.TeacherEmail ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    value={formData.TeacherEmail}
                    onChange={(e) => handleFieldChange('TeacherEmail', e.target.value)}
                    aria-invalid={!!errors.TeacherEmail}
                    placeholder="e.g. teacher@school.edu"
                  />
                  {errors.TeacherEmail && <p className="mt-1 text-sm text-red-500">{errors.TeacherEmail}</p>}
                </div>
                
                {/* Topic */}
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium mb-1 text-gray-700">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="topic"
                    type="text"
                    className={`w-full border ${errors.Topic ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                    value={formData.Topic}
                    onChange={(e) => handleFieldChange('Topic', e.target.value)}
                    aria-invalid={!!errors.Topic}
                    placeholder="e.g. Acid-Base Reactions"
                  />
                  {errors.Topic && <p className="mt-1 text-sm text-red-500">{errors.Topic}</p>}
                </div>
                
                {/* School Year */}
                <div>
                  <label htmlFor="schoolYear" className="block text-sm font-medium mb-1 text-gray-700">
                    School Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="schoolYear"
                      type="number"
                      className={`w-full border ${errors.SchoolYear ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition no-spin-buttons`}
                      value={formData.SchoolYear || ''}
                      onChange={(e) => handleFieldChange('SchoolYear', parseInt(e.target.value) || 0)}
                      min={currentYear - 5}
                      max={currentYear + 5}
                      aria-invalid={!!errors.SchoolYear}
                      placeholder={`${currentYear}`}
                    />
                    {formData.SchoolYear > 0 && (
                      <div className="absolute right-0 top-0 h-full flex items-center mr-4 pointer-events-none">
                        <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium">to {getEndYear(formData.SchoolYear)}</span>
                      </div>
                    )}
                  </div>
                  {errors.SchoolYear && <p className="mt-1 text-sm text-red-500">{errors.SchoolYear}</p>}
                </div>
              </div>
            </div>
          </section>
          
          {/* Students List */}
          <section className="mb-10">
            <div className="flex items-center mb-5">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Student Names <span className="text-red-500">*</span></h3>
              <button
                type="button"
                onClick={addStudent}
                className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 text-sm font-medium flex items-center transition"
                aria-label="Add new student"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Student
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              {students.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto rounded-md">
                  {students.map((student, index) => (
                    <div key={index} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <span className="text-sm font-bold w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">{index + 1}</span>
                      <div className="flex-1 mx-3">
                      <input
                          type="text"
                          placeholder={`Student ${index + 1} name`}
                          className={`w-full border ${errors.Students && errors.Students[index] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition`}
                          value={student.name}
                          onChange={(e) => updateStudentName(index, e.target.value)}
                          aria-invalid={!!(errors.Students && errors.Students[index])}
                          disabled={index === 0 && user && student.name === `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                          ref={index === students.length - 1 && newStudentAdded ? newStudentInputRef : null}
                        />
                        {errors.Students && errors.Students[index] && (
                          <p className="mt-1 text-sm text-red-500">{errors.Students[index]}</p>
                        )}
                      </div>
                      {students.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStudent(index)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                          aria-label={`Remove student ${index + 1}`}
                          disabled={index === 0 && user && student.name === `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No students added yet. Click "Add Student" to begin.</p>
                </div>
              )}
            </div>
          </section>

          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium transition flex items-center"
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EnhancedLabReservation;