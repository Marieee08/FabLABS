'use client';

import React, { useState } from 'react';

// Interface definitions
interface Material {
  Item: string;
  ItemQty: number;
  Description: string;
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
  NoofStudents: number;
  Subject: string;
  Teacher: string;
  Topic: string;
  SchoolYear: number;
  
  // Materials
  NeededMaterials: Material[];
}

interface LabReservationProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function LabReservation({ formData, updateFormData, nextStep, prevStep }: LabReservationProps) {
  // State for materials
  const [materials, setMaterials] = useState<Material[]>(formData.NeededMaterials || []);

  // Material handlers
  const addMaterial = () => {
    const newMaterial: Material = { Item: '', ItemQty: 0, Description: '' };
    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    updateFormData('NeededMaterials', updatedMaterials);
  };

  const updateMaterial = (index: number, field: keyof Material, value: string | number) => {
    const updatedMaterials = materials.map((material, i) => {
      if (i === index) {
        return { ...material, [field]: value };
      }
      return material;
    });
    setMaterials(updatedMaterials);
    updateFormData('NeededMaterials', updatedMaterials);
  };

  // Form sections
  const renderClassDetails = () => (
    <section className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Class Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Level/Section</label>
          <input
            type="text"
            className="w-full border rounded-md p-2"
            value={formData.LvlSec}
            onChange={(e) => updateFormData('LvlSec', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Number of Students</label>
          <input
            type="number"
            className="w-full border rounded-md p-2"
            value={formData.NoofStudents}
            onChange={(e) => updateFormData('NoofStudents', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            className="w-full border rounded-md p-2"
            value={formData.Subject}
            onChange={(e) => updateFormData('Subject', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teacher</label>
          <input
            type="text"
            className="w-full border rounded-md p-2"
            value={formData.Teacher}
            onChange={(e) => updateFormData('Teacher', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic</label>
          <input
            type="text"
            className="w-full border rounded-md p-2"
            value={formData.Topic}
            onChange={(e) => updateFormData('Topic', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">School Year</label>
          <input
            type="number"
            className="w-full border rounded-md p-2"
            value={formData.SchoolYear}
            onChange={(e) => updateFormData('SchoolYear', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </section>
  );

  const renderMaterialsSection = () => (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Equipment and Materials</h3>
        <button
          type="button"
          onClick={addMaterial}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
        >
          Add Material
        </button>
      </div>
      
      {materials.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-4">
          <div className="text-sm font-medium text-gray-700">Item</div>
          <div className="text-sm font-medium text-gray-700">Quantity</div>
          <div className="text-sm font-medium text-gray-700">Description</div>
        </div>
      )}
      
      {materials.map((material, index) => (
        <div key={index} className="grid grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Item"
            className="border rounded-md p-2"
            value={material.Item}
            onChange={(e) => updateMaterial(index, 'Item', e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity"
            className="border rounded-md p-2"
            value={material.ItemQty}
            onChange={(e) => updateMaterial(index, 'ItemQty', parseInt(e.target.value) || 0)}
          />
          <input
            type="text"
            placeholder="Description"
            className="border rounded-md p-2"
            value={material.Description}
            onChange={(e) => updateMaterial(index, 'Description', e.target.value)}
          />
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
        onClick={prevStep}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Previous
      </button>
      <button
        onClick={nextStep}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b">Laboratory Reservation Details</h2>
        
        {renderClassDetails()}
        {renderMaterialsSection()}
        {renderNavigationButtons()}
      </div>
    </div>
  );
}

export default LabReservation;