// src/components/student-forms/lab-reservation.tsx - Modified to support staff mode

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from "@clerk/nextjs";
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import OptimizedMachineSelector from '../student-forms/machine-select';

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

// Renamed to avoid conflict with built-in FormData
interface LabReservationFormData {
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
  formData: LabReservationFormData;
  updateFormData: <K extends keyof LabReservationFormData>(field: K, value: LabReservationFormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  isStaffMode?: boolean; // NEW: Flag to indicate if this is for staff
}

// Helper function
const generateId = (): string => Math.random().toString(36).substring(2, 15);

export default function LabReservation({ 
  formData, 
  updateFormData, 
  nextStep, 
  prevStep,
  isStaffMode = false // NEW: Default to false for students
}: LabReservationProps) {
  const { user, isLoaded } = useUser();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [newStudentAdded, setNewStudentAdded] = useState(false);
  const newStudentInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  
  // Services and machines handling
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [availableMachines, setAvailableMachines] = useState<Record<string, any[]>>({});
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedMachines, setSelectedMachines] = useState<SelectedMachine[]>([]);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<'valid' | 'invalid' | 'pending' | null>(null);

  // Initialize students state
  const [students, setStudents] = useState<Student[]>(formData.Students || []);
  const currentYear = new Date().getFullYear();

  // NEW: Initialize staff defaults when in staff mode
  useEffect(() => {
    if (isStaffMode && !hasInitialized.current) {
      console.log('Initializing staff mode defaults');
      
      // Auto-fill staff defaults for educational fields
      if (!formData.LvlSec || formData.LvlSec === '') {
        updateFormData('LvlSec', 'N/A');
      }
      if (!formData.Subject || formData.Subject === '') {
        updateFormData('Subject', 'N/A');
      }
      if (!formData.Teacher || formData.Teacher === '') {
        updateFormData('Teacher', 'N/A');
      }
      if (!formData.TeacherEmail || formData.TeacherEmail === '') {
        updateFormData('TeacherEmail', 'N/A');
      }
      if (!formData.Topic || formData.Topic === '') {
        updateFormData('Topic', 'N/A');
      }
      if (!formData.SchoolYear || formData.SchoolYear === 0) {
        updateFormData('SchoolYear', currentYear);
      }
      if (!formData.NoofStudents || formData.NoofStudents === 0) {
        updateFormData('NoofStudents', 0);
      }
      
      // Clear students array for staff
      if (formData.Students && formData.Students.length > 0) {
        updateFormData('Students', []);
        setStudents([]);
      }
      
      hasInitialized.current = true;
    }
  }, [isStaffMode, formData, updateFormData, currentYear]);
  
  // Display end year based on start year
  const getEndYear = (startYear: number) => startYear + 1;
  
  // Student handlers - only for non-staff mode
  const addStudent = useCallback(() => {
    if (isStaffMode) return; // Don't allow adding students in staff mode
    
    const highestId = students.length > 0 
      ? Math.max(...students.map(student => student.id))
      : 0;
    
    const newStudent: Student = { id: highestId + 1, name: '' };
    const updatedStudents = [...students, newStudent];
    
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
    setNewStudentAdded(true);
  }, [students, updateFormData, isStaffMode]);
  
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
        const machinesByService: Record<string, any[]> = {};
        
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

  // Auto-fill user's name as first student when component loads (students only)
  useEffect(() => {
    if (isStaffMode) return; // Skip for staff mode
    
    if (isLoaded && user) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const userName = `${firstName} ${lastName}`.trim();
      
      // If we have a valid user name and no students exist yet
      if (userName && students.length === 0) {
        const newStudent: Student = { id: 1, name: userName };
        const updatedStudents = [newStudent];
        
        setStudents(updatedStudents);
        updateFormData('Students', updatedStudents);
      }
    } else if (students.length === 0 && !isStaffMode) {
      // If no user is loaded yet but we need at least one student entry (students only)
      addStudent();
    }
  }, [isLoaded, user, students, updateFormData, addStudent, isStaffMode]);

  // Rest of the component logic remains the same...
  // [Previous useEffect, handler functions, etc. - keeping the same logic]

  useEffect(() => {
    if (formData.ProductsManufactured && !selectedService) {
      const serviceValue = Array.isArray(formData.ProductsManufactured) 
        ? formData.ProductsManufactured[0] 
        : formData.ProductsManufactured;
        
      setSelectedService(serviceValue);
    }
  }, [formData.ProductsManufactured, selectedService]);

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

  // Convert selected machines to NeededMaterials format for the database
  const updateNeededMaterials = useCallback((updatedSelectedMachines: SelectedMachine[]) => {
    const materials = updatedSelectedMachines.map(machine => ({
      id: generateId(),
      Item: machine.name,
      ItemQty: machine.quantity,
      Description: machine.description
    }));
    
    updateFormData('NeededMaterials', materials);
  }, [updateFormData]);

  // Machine selection handler
  const handleMachineSelectionChange = useCallback((machines: SelectedMachine[]) => {
    console.log('Machine selection changed:', machines);
    
    setSelectedMachines(machines);
    updateNeededMaterials(machines);
    
    if (machines.length > 0) {
      setErrors(prev => ({...prev, machines: undefined}));
    }
  }, [updateNeededMaterials]);

  const updateStudentName = (index: number, name: string) => {
    if (isStaffMode) return; // Disable for staff mode
    
    const updatedStudents = students.map((student, i) => 
      i === index ? { ...student, name } : student
    );
    
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
  };

  const removeStudent = (index: number) => {
    if (isStaffMode || students.length <= 1) return; // Disable for staff mode
    
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
  };

  // Handle field change
  const handleFieldChange = <K extends keyof LabReservationFormData>(field: K, value: LabReservationFormData[K]) => {
    updateFormData(field, value);
  };

  // Validate form - modified for staff mode
  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: FormErrors = {};
    
    // Basic validation - skip educational fields for staff
    if (!isStaffMode) {
      if (!formData.LvlSec.trim()) newErrors.LvlSec = "Level/Section is required";
      if (!formData.Subject.trim()) newErrors.Subject = "Subject is required";
      if (!formData.Teacher.trim()) newErrors.Teacher = "Teacher's name is required";
      if (!formData.Topic.trim()) newErrors.Topic = "Topic is required";
      
      // Teacher email validation for students only
      if (!formData.TeacherEmail.trim()) {
        newErrors.TeacherEmail = "Teacher's email is required";
      } else {
        const isEmailValid = await verifyTeacherEmail(formData.TeacherEmail);
        if (!isEmailValid) {
          newErrors.TeacherEmail = errors.TeacherEmail || "Invalid teacher email";
        }
      }
      
      // Validate students for non-staff mode
      const studentErrors: Record<number, string> = {};
      students.forEach((student, index) => {
        if (!student.name.trim()) studentErrors[index] = "Student name is required";
      });
      
      if (Object.keys(studentErrors).length > 0) {
        newErrors.Students = studentErrors;
      }
    }
    
    // School year validation (both modes)
    if (!formData.SchoolYear) {
      newErrors.SchoolYear = "School year is required";
    } else if (formData.SchoolYear < currentYear - 5 || formData.SchoolYear > currentYear + 5) {
      newErrors.SchoolYear = "Please enter a valid school year";
    }
    
    // Validate service selection (both modes)
    if (!selectedService) {
      newErrors.service = "Please select a service";
    }
    
    // Validate machine selection (both modes)
    const currentService = selectedService;
    const hasMachinesForService = currentService && 
      availableMachines[currentService] && 
      availableMachines[currentService].length > 0;
      
    if (hasMachinesForService && selectedMachines.length === 0) {
      newErrors.machines = "Please select at least one machine";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, students, currentYear, selectedService, selectedMachines, availableMachines, errors.TeacherEmail, isStaffMode]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    setIsSubmitting(true);
    
    const isValid = await validateForm();
    
    if (isValid) {
      nextStep();
    } else {
      const firstErrorElement = document.querySelector('[aria-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    setIsSubmitting(false);
  };

  // Teacher email verification (skip for staff)
  const verifyTeacherEmail = async (email: string): Promise<boolean> => {
    if (isStaffMode) return true; // Skip verification for staff
    
    if (!email || !email.trim()) {
      setEmailVerificationStatus(null);
      return false;
    }
    
    setIsVerifyingEmail(true);
    setEmailVerificationStatus('pending');
    
    try {
      const response = await fetch('/api/verify-teacher-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const data = await response.json();
      
      if (data.verified) {
        setEmailVerificationStatus('valid');
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.TeacherEmail;
          return newErrors;
        });
        return true;
      } else {
        setEmailVerificationStatus('invalid');
        setErrors(prev => ({ 
          ...prev, 
          TeacherEmail: "This teacher's email is not registered in our system" 
        }));
        return false;
      }
    } catch (err) {
      console.error('Error verifying teacher email:', err);
      setEmailVerificationStatus('invalid');
      setErrors(prev => ({ 
        ...prev, 
        TeacherEmail: "Error verifying teacher email. Please try again." 
      }));
      return false;
    } finally {
      setIsVerifyingEmail(false);
    }
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
        <h2 className="text-2xl font-bold mb-6 text-blue-700 pb-3 border-b border-gray-200">
          {isStaffMode ? 'Lab Equipment Reservation' : 'Laboratory Reservation'}
        </h2>
        
        {/* Staff mode info banner */}
        {isStaffMode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium">Staff Reservation Mode</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Educational fields have been pre-filled with "N/A" as this is a staff equipment reservation.
                  Your request will go directly to admin approval without requiring teacher approval.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          {/* Service & Equipment Section */}
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
                
                <OptimizedMachineSelector 
                  key={`${selectedService}-machine-selector`}
                  selectedService={selectedService}
                  availableMachines={availableMachines}
                  initialSelectedMachines={selectedMachines}
                  onMachineSelectionChange={handleMachineSelectionChange}
                />
                
                {errors.machines && (
                  <p className="mt-2 text-sm text-red-500">{errors.machines}</p>
                )}
              </div>
            </div>
          </section>

          {/* Class Details - Modified for staff mode */}
          <section className="mb-10">
            <div className="flex items-center mb-5">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {isStaffMode ? 'Administrative Information' : 'Class Information'}
              </h3>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level/Section */}
                <div>
                  <label htmlFor="lvlSec" className="block text-sm font-medium mb-1 text-gray-700">
                    Level/Section {!isStaffMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="lvlSec"
                    type="text"
                    className={`w-full border ${errors.LvlSec ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${isStaffMode ? 'bg-gray-100' : ''}`}
                    value={formData.LvlSec}
                    onChange={(e) => handleFieldChange('LvlSec', e.target.value)}
                    aria-invalid={!!errors.LvlSec}
                    placeholder={isStaffMode ? "N/A (Staff)" : "e.g. Grade 10-A"}
                    readOnly={isStaffMode}
                  />
                  {errors.LvlSec && <p className="mt-1 text-sm text-red-500">{errors.LvlSec}</p>}
                </div>
                
                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1 text-gray-700">
                    Subject {!isStaffMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="subject"
                    type="text"
                    className={`w-full border ${errors.Subject ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${isStaffMode ? 'bg-gray-100' : ''}`}
                    value={formData.Subject}
                    onChange={(e) => handleFieldChange('Subject', e.target.value)}
                    aria-invalid={!!errors.Subject}
                    placeholder={isStaffMode ? "N/A (Staff)" : "e.g. Chemistry"}
                    readOnly={isStaffMode}
                  />
                  {errors.Subject && <p className="mt-1 text-sm text-red-500">{errors.Subject}</p>}
                </div>
                
                {/* Teacher */}
                <div>
                  <label htmlFor="teacher" className="block text-sm font-medium mb-1 text-gray-700">
                    Teacher {!isStaffMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="teacher"
                    type="text"
                    className={`w-full border ${errors.Teacher ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${isStaffMode ? 'bg-gray-100' : ''}`}
                    value={formData.Teacher}
                    onChange={(e) => handleFieldChange('Teacher', e.target.value)}
                    aria-invalid={!!errors.Teacher}
                    placeholder={isStaffMode ? "N/A (Staff)" : "e.g. Cyrill Tapales"}
                    readOnly={isStaffMode}
                  />
                  {errors.Teacher && <p className="mt-1 text-sm text-red-500">{errors.Teacher}</p>}
                </div>
                
                {/* Teacher Email */}
                <div>
                  <label htmlFor="teacherEmail" className="block text-sm font-medium mb-1 text-gray-700">
                    Teacher Email {!isStaffMode && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="teacherEmail"
                      type="email"
                      className={`w-full border ${errors.TeacherEmail ? 'border-red-500' : emailVerificationStatus === 'valid' ? 'border-green-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition pr-10 ${isStaffMode ? 'bg-gray-100' : ''}`}
                      value={formData.TeacherEmail}
                      onChange={(e) => {
                        handleFieldChange('TeacherEmail', e.target.value);
                        if (emailVerificationStatus) {
                          setEmailVerificationStatus(null);
                        }
                      }}
                      onBlur={(e) => !isStaffMode && verifyTeacherEmail(e.target.value)}
                      aria-invalid={!!errors.TeacherEmail}
                      placeholder={isStaffMode ? "N/A (Staff)" : "e.g. teacher@school.edu"}
                      readOnly={isStaffMode}
                    />
                    
                    {/* Verification status indicator - hide for staff */}
                    {!isStaffMode && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isVerifyingEmail && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {!isVerifyingEmail && emailVerificationStatus === 'valid' && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {!isVerifyingEmail && emailVerificationStatus === 'invalid' && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.TeacherEmail && <p className="mt-1 text-sm text-red-500">{errors.TeacherEmail}</p>}
                  {!isStaffMode && emailVerificationStatus === 'valid' && !errors.TeacherEmail && (
                    <p className="mt-1 text-sm text-green-600">✓ Teacher email verified</p>
                  )}
                </div>
                
                {/* Topic */}
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium mb-1 text-gray-700">
                    Topic {!isStaffMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="topic"
                    type="text"
                    className={`w-full border ${errors.Topic ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition ${isStaffMode ? 'bg-gray-100' : ''}`}
                    value={formData.Topic}
                    onChange={(e) => handleFieldChange('Topic', e.target.value)}
                    aria-invalid={!!errors.Topic}
                    placeholder={isStaffMode ? "N/A (Staff)" : "e.g. Acid-Base Reactions"}
                    readOnly={isStaffMode}
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
          
          {/* Students List - Hide for staff mode */}
          {!isStaffMode && (
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
                    {students.map((student, index) => {
                      const firstName = user?.firstName ?? '';
                      const lastName = user?.lastName ?? '';
                      const userFullName = `${firstName} ${lastName}`.trim();
                      const isUserEntry = Boolean(index === 0 && user && student.name === userFullName);

                      return (
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
                              disabled={isUserEntry}
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
                              disabled={isUserEntry}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
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
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between">
            <div></div>
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