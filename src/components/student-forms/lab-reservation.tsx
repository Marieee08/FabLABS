'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Interface definitions
interface Material {
  id: string; // Added unique ID for better list management
  Item: string;
  ItemQty: number;
  Description: string;
}

interface Student {
  id: number;
  name: string;
}

interface Day {
  date: Date;
  startTime: string | null;
  endTime: string | null;
}

interface FormData {
  // Schedule related fields
  days: Day[];
  syncTimes: boolean;
  unifiedStartTime: string | null;
  unifiedEndTime: string | null;

  // Laboratory utilization info
  ProductsManufactured: string;
  BulkofCommodity: string;
  Equipment: string;
  Tools: string;
  ToolsQty: number;

  // Class details
  ControlNo?: number;
  LvlSec: string;
  Subject: string;
  Teacher: string;
  Topic: string;
  SchoolYear: number;
  
  // Materials
  NeededMaterials: Material[];
  
  // Students
  Students: Student[];
}

interface FormErrors {
  LvlSec?: string;
  Subject?: string;
  Teacher?: string;
  Topic?: string;
  SchoolYear?: string;
  Students?: Record<number, string>;
  NeededMaterials?: Record<string, Record<string, string>>;
}

interface LabReservationProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export function LabReservation({ formData, updateFormData, nextStep, prevStep }: LabReservationProps) {
  // Add state for form validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // State for materials - ensure each has a unique ID
  const [materials, setMaterials] = useState<Material[]>(() => 
    (formData.NeededMaterials || []).map(material => ({
      ...material,
      id: material.id || generateId(),
    }))
  );
  
  // State for students
  const [students, setStudents] = useState<Student[]>(formData.Students || []);
  
  // Current year for SchoolYear validation
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  
  // Ensure we have at least one student initially if none exist
  useEffect(() => {
    if (students.length === 0) {
      addStudent();
    }
  }, []);

  // Validate the form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate class details
    if (!formData.LvlSec.trim()) {
      newErrors.LvlSec = "Level/Section is required";
    }
    
    if (!formData.Subject.trim()) {
      newErrors.Subject = "Subject is required";
    }
    
    if (!formData.Teacher.trim()) {
      newErrors.Teacher = "Teacher's name is required";
    }
    
    if (!formData.Topic.trim()) {
      newErrors.Topic = "Topic is required";
    }
    
    if (!formData.SchoolYear) {
      newErrors.SchoolYear = "School year is required";
    } else if (formData.SchoolYear < currentYear - 5 || formData.SchoolYear > currentYear + 5) {
      newErrors.SchoolYear = "Please enter a valid school year";
    }
    
    // Validate students
    const studentErrors: Record<number, string> = {};
    let hasStudentError = false;
    
    students.forEach((student, index) => {
      if (!student.name.trim()) {
        studentErrors[index] = "Student name is required";
        hasStudentError = true;
      }
    });
    
    if (hasStudentError) {
      newErrors.Students = studentErrors;
    }
    
    // Validate materials
    const materialErrors: Record<string, Record<string, string>> = {};
    let hasMaterialError = false;
    
    materials.forEach((material) => {
      const itemErrors: Record<string, string> = {};
      
      if (!material.Item.trim()) {
        itemErrors.Item = "Item name is required";
        hasMaterialError = true;
      }
      
      if (material.ItemQty <= 0) {
        itemErrors.ItemQty = "Quantity must be greater than 0";
        hasMaterialError = true;
      }
      
      if (Object.keys(itemErrors).length > 0) {
        materialErrors[material.id] = itemErrors;
      }
    });
    
    if (hasMaterialError) {
      newErrors.NeededMaterials = materialErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, students, materials, currentYear]);

  // Material handlers
  const addMaterial = () => {
    const newMaterial: Material = { id: generateId(), Item: '', ItemQty: 1, Description: '' };
    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    updateFormData('NeededMaterials', updatedMaterials);
  };

  const updateMaterial = (id: string, field: keyof Material, value: string | number) => {
    const updatedMaterials = materials.map((material) => {
      if (material.id === id) {
        return { ...material, [field]: value };
      }
      return material;
    });
    setMaterials(updatedMaterials);
    updateFormData('NeededMaterials', updatedMaterials);
    
    // Clear the error for this field if it exists
    if (errors.NeededMaterials && errors.NeededMaterials[id] && field in errors.NeededMaterials[id]) {
      const newErrors = { ...errors };
      delete newErrors.NeededMaterials![id][field];
      
      // Remove the material entirely if no more errors
      if (Object.keys(newErrors.NeededMaterials![id]).length === 0) {
        delete newErrors.NeededMaterials![id];
      }
      
      // Remove the NeededMaterials key if no more material errors
      if (newErrors.NeededMaterials && Object.keys(newErrors.NeededMaterials).length === 0) {
        delete newErrors.NeededMaterials;
      }
      
      setErrors(newErrors);
    }
  };

  const removeMaterial = (id: string) => {
    const updatedMaterials = materials.filter(material => material.id !== id);
    setMaterials(updatedMaterials);
    updateFormData('NeededMaterials', updatedMaterials);
    
    // Clear any errors for this material
    if (errors.NeededMaterials && errors.NeededMaterials[id]) {
      const newErrors = { ...errors };
      delete newErrors.NeededMaterials![id];
      
      if (Object.keys(newErrors.NeededMaterials!).length === 0) {
        delete newErrors.NeededMaterials;
      }
      
      setErrors(newErrors);
    }
  };

  // Student handlers
  const addStudent = () => {
    // Create a new student with ID equal to the highest ID + 1
    const highestId = students.length > 0 
      ? Math.max(...students.map(student => student.id))
      : 0;
    
    const newStudent: Student = { id: highestId + 1, name: '' };
    const updatedStudents = [...students, newStudent];
    
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
  };

  const updateStudentName = (index: number, name: string) => {
    const updatedStudents = students.map((student, i) => {
      if (i === index) {
        return { ...student, name };
      }
      return student;
    });
    
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
    
    // Clear error for this student if it exists
    if (errors.Students && errors.Students[index]) {
      const newErrors = { ...errors };
      delete newErrors.Students![index];
      
      if (Object.keys(newErrors.Students!).length === 0) {
        delete newErrors.Students;
      }
      
      setErrors(newErrors);
    }
  };

  const removeStudent = (index: number) => {
    // Don't allow removing the last student
    if (students.length <= 1) {
      return;
    }
    
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
    updateFormData('Students', updatedStudents);
    
    // Clear any errors for this student
    if (errors.Students && errors.Students[index]) {
      const newErrors = { ...errors };
      delete newErrors.Students![index];
      
      // Adjust indices for errors after the removed student
      const newStudentErrors: Record<number, string> = {};
      Object.entries(newErrors.Students || {}).forEach(([idx, error]) => {
        const numIdx = parseInt(idx);
        if (numIdx > index) {
          newStudentErrors[numIdx - 1] = error;
        } else {
          newStudentErrors[numIdx] = error;
        }
      });
      
      if (Object.keys(newStudentErrors).length === 0) {
        delete newErrors.Students;
      } else {
        newErrors.Students = newStudentErrors;
      }
      
      setErrors(newErrors);
    }
  };

  // Handle field change with validation clearing
  const handleFieldChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    updateFormData(field, value);
    
    // Clear error for this field if it exists
    if (field in errors) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof FormErrors];
      setErrors(newErrors);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    setIsSubmitting(true);
    
    if (validateForm()) {
      // Proceed to next step
      nextStep();
    }
    
    setIsSubmitting(false);
  };

  // Form sections
  const renderClassDetails = () => (
    <section className="mb-8" aria-labelledby="class-details-heading">
      <h3 id="class-details-heading" className="text-lg font-semibold mb-4">Class Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="lvlSec" className="block text-sm font-medium mb-1">
            Level/Section <span className="text-red-500">*</span>
          </label>
          <input
            id="lvlSec"
            type="text"
            className={`w-full border ${errors.LvlSec ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={formData.LvlSec}
            onChange={(e) => handleFieldChange('LvlSec', e.target.value)}
            aria-invalid={!!errors.LvlSec}
            aria-describedby={errors.LvlSec ? "lvlSec-error" : undefined}
          />
          {errors.LvlSec && (
            <p id="lvlSec-error" className="mt-1 text-sm text-red-500">{errors.LvlSec}</p>
          )}
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            className={`w-full border ${errors.Subject ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={formData.Subject}
            onChange={(e) => handleFieldChange('Subject', e.target.value)}
            aria-invalid={!!errors.Subject}
            aria-describedby={errors.Subject ? "subject-error" : undefined}
          />
          {errors.Subject && (
            <p id="subject-error" className="mt-1 text-sm text-red-500">{errors.Subject}</p>
          )}
        </div>
        <div>
          <label htmlFor="teacher" className="block text-sm font-medium mb-1">
            Teacher <span className="text-red-500">*</span>
          </label>
          <input
            id="teacher"
            type="text"
            className={`w-full border ${errors.Teacher ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={formData.Teacher}
            onChange={(e) => handleFieldChange('Teacher', e.target.value)}
            aria-invalid={!!errors.Teacher}
            aria-describedby={errors.Teacher ? "teacher-error" : undefined}
          />
          {errors.Teacher && (
            <p id="teacher-error" className="mt-1 text-sm text-red-500">{errors.Teacher}</p>
          )}
        </div>
        <div>
          <label htmlFor="topic" className="block text-sm font-medium mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            id="topic"
            type="text"
            className={`w-full border ${errors.Topic ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={formData.Topic}
            onChange={(e) => handleFieldChange('Topic', e.target.value)}
            aria-invalid={!!errors.Topic}
            aria-describedby={errors.Topic ? "topic-error" : undefined}
          />
          {errors.Topic && (
            <p id="topic-error" className="mt-1 text-sm text-red-500">{errors.Topic}</p>
          )}
        </div>
        <div>
          <label htmlFor="schoolYear" className="block text-sm font-medium mb-1">
            School Year <span className="text-red-500">*</span>
          </label>
          <input
            id="schoolYear"
            type="number"
            className={`w-full border ${errors.SchoolYear ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            value={formData.SchoolYear || ''}
            onChange={(e) => handleFieldChange('SchoolYear', parseInt(e.target.value) || 0)}
            min={currentYear - 5}
            max={currentYear + 5}
            aria-invalid={!!errors.SchoolYear}
            aria-describedby={errors.SchoolYear ? "schoolYear-error" : undefined}
          />
          {errors.SchoolYear && (
            <p id="schoolYear-error" className="mt-1 text-sm text-red-500">{errors.SchoolYear}</p>
          )}
        </div>
      </div>
    </section>
  );

  const renderStudentsList = () => (
    <section className="mb-8" aria-labelledby="students-heading">
      <div className="flex justify-between items-center mb-4">
        <h3 id="students-heading" className="text-lg font-semibold">
          Student Names <span className="text-red-500">*</span>
        </h3>
        <button
          type="button"
          onClick={addStudent}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Add new student"
        >
          Add Student
        </button>
      </div>
      
      {students.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto p-2 border rounded-md">
          {students.map((student, index) => (
            <div key={index} className="flex items-center">
              <span className="text-sm font-medium w-8">{index + 1}.</span>
              <div className="flex-1">
                <input
                  type="text"
                  id={`student-${index}`}
                  placeholder={`Student ${index + 1} name`}
                  className={`w-full border ${errors.Students && errors.Students[index] ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={student.name}
                  onChange={(e) => updateStudentName(index, e.target.value)}
                  aria-invalid={!!(errors.Students && errors.Students[index])}
                  aria-describedby={errors.Students && errors.Students[index] ? `student-${index}-error` : undefined}
                />
                {errors.Students && errors.Students[index] && (
                  <p id={`student-${index}-error`} className="mt-1 text-sm text-red-500">{errors.Students[index]}</p>
                )}
              </div>
              {students.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStudent(index)}
                  className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label={`Remove student ${index + 1}`}
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
        <div className="text-center py-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No students added yet. Click "Add Student" to begin.</p>
        </div>
      )}
    </section>
  );

  const renderMaterialsSection = () => (
    <section className="mb-8" aria-labelledby="materials-heading">
      <div className="flex justify-between items-center mb-4">
        <h3 id="materials-heading" className="text-lg font-semibold">Equipment and Materials</h3>
        <button
          type="button"
          onClick={addMaterial}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Add new material"
        >
          Add Material
        </button>
      </div>
      
      {materials.length > 0 && (
        <div className="mb-2 grid grid-cols-12 gap-4">
          <div className="col-span-5 text-sm font-medium text-gray-700">Item</div>
          <div className="col-span-2 text-sm font-medium text-gray-700">Quantity</div>
          <div className="col-span-4 text-sm font-medium text-gray-700">Description</div>
          <div className="col-span-1 text-sm font-medium text-gray-700"></div>
        </div>
      )}
      
      {materials.map((material) => (
        <div key={material.id} className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-5">
            <input
              type="text"
              id={`item-${material.id}`}
              placeholder="Item"
              className={`w-full border ${errors.NeededMaterials && errors.NeededMaterials[material.id]?.Item ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              value={material.Item}
              onChange={(e) => updateMaterial(material.id, 'Item', e.target.value)}
              aria-invalid={!!(errors.NeededMaterials && errors.NeededMaterials[material.id]?.Item)}
              aria-describedby={errors.NeededMaterials && errors.NeededMaterials[material.id]?.Item ? `item-${material.id}-error` : undefined}
            />
            {errors.NeededMaterials && errors.NeededMaterials[material.id]?.Item && (
              <p id={`item-${material.id}-error`} className="mt-1 text-sm text-red-500">{errors.NeededMaterials[material.id].Item}</p>
            )}
          </div>
          <div className="col-span-2">
            <input
              type="number"
              id={`qty-${material.id}`}
              placeholder="Quantity"
              className={`w-full border ${errors.NeededMaterials && errors.NeededMaterials[material.id]?.ItemQty ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              value={material.ItemQty}
              onChange={(e) => updateMaterial(material.id, 'ItemQty', parseInt(e.target.value) || 0)}
              min="1"
              aria-invalid={!!(errors.NeededMaterials && errors.NeededMaterials[material.id]?.ItemQty)}
              aria-describedby={errors.NeededMaterials && errors.NeededMaterials[material.id]?.ItemQty ? `qty-${material.id}-error` : undefined}
            />
            {errors.NeededMaterials && errors.NeededMaterials[material.id]?.ItemQty && (
              <p id={`qty-${material.id}-error`} className="mt-1 text-sm text-red-500">{errors.NeededMaterials[material.id].ItemQty}</p>
            )}
          </div>
          <div className="col-span-4">
            <input
              type="text"
              id={`desc-${material.id}`}
              placeholder="Description"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={material.Description}
              onChange={(e) => updateMaterial(material.id, 'Description', e.target.value)}
            />
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => removeMaterial(material.id)}
              className="text-red-500 hover:text-red-700 focus:outline-none"
              aria-label={`Remove ${material.Item || 'material'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      {materials.length === 0 && (
        <div className="text-center py-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No materials added yet. Click "Add Material" to begin.</p>
        </div>
      )}
    </section>
  );

  const renderNavigationButtons = () => (
    <div className="mt-8 flex justify-between">
      <button
        type="button"
        onClick={prevStep}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
        disabled={isSubmitting}
      >
        Previous
      </button>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : "Next"}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b">Laboratory Reservation Details</h2>
        
        <form onSubmit={handleSubmit} noValidate>
          {renderClassDetails()}
          {renderStudentsList()}
          {renderMaterialsSection()}
          {renderNavigationButtons()}
          
          {/* Summary of errors if form submission was attempted */}
          {showValidation && Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
              <p className="text-red-700 font-medium">Please correct the following errors:</p>
              <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                {errors.LvlSec && <li>Level/Section is required</li>}
                {errors.Subject && <li>Subject is required</li>}
                {errors.Teacher && <li>Teacher's name is required</li>}
                {errors.Topic && <li>Topic is required</li>}
                {errors.SchoolYear && <li>Valid school year is required</li>}
                {errors.Students && <li>All student names are required</li>}
                {errors.NeededMaterials && <li>Material items require a name and quantity greater than 0</li>}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default LabReservation;