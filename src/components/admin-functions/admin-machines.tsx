import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import React, { useState, useEffect } from 'react';

interface Service {
  id?: string;
  Service: string;
  Costs?: number;
}

interface Machine {
  id: string;
  Machine: string;
  Image: string;
  Desc: string;
  Link?: string;
  isAvailable: boolean;
  Services: Service[];
}

export default function AdminServices() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<Partial<Machine>>({
    isAvailable: true,
    Services: [{ Service: '', Costs: 0 }]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ... (keep existing fetchMachines, toggleAvailability, deleteMachine functions)

  const openModal = (machine: Machine | null = null) => {
    setEditingMachine(machine);
    if (machine) {
      setFormData({
        name: machine.Machine || '',
        image: machine.Image || '',
        description: machine.Desc || '',
        videoUrl: machine.Link || '',
        isAvailable: machine.isAvailable,
        Services: machine.Services?.length 
          ? machine.Services 
          : [{ Service: '', Costs: 0 }]
      });
      setImagePreview(machine.Image || null);
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        image: '',
        description: '',
        videoUrl: '',
        isAvailable: true,
        Services: [{ Service: '', Costs: 0 }]
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleServiceChange = (index: number, field: 'Service' | 'Costs', value: string | number) => {
    const updatedServices = [...(formData.Services || [])];
    updatedServices[index] = { 
      ...updatedServices[index],
      [field]: field === 'Costs' ? parseFloat(value as string) || 0 : value 
    };
    setFormData({ ...formData, Services: updatedServices });
  };

  // ... (keep existing image handling functions)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      let imageUrl = imagePreview;
      
      if (imageFile) {
        imageUrl = await handleImageUpload();
        if (!imageUrl) {
          alert('Image upload failed. Please try again.');
          return;
        }
      }
  
      if (editingMachine && editingMachine.Image !== imageUrl) {
        try {
          await fetch(`/api/machines/upload?imagePath=${encodeURIComponent(editingMachine.Image)}`, {
            method: 'DELETE'
          });
        } catch (deleteError) {
          console.warn('Failed to delete old image:', deleteError);
        }
      }
  
      const machinePayload = {
        Machine: formData.name,
        Image: imageUrl || '', 
        Desc: formData.description,
        Link: formData.videoUrl || null,
        isAvailable: formData.isAvailable ?? true,
      };
  
      let response;
      try {
        if (editingMachine) {
          response = await fetch(`/api/machines/${editingMachine.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...machinePayload,
              id: editingMachine.id
            })
          });
        } else {
          response = await fetch('/api/machines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(machinePayload)
          });
        }
  
        if (!response.ok) {
          throw new Error(`Failed to save machine: ${await response.text()}`);
        }
  
        const result = await response.json();
        const machineId = result.id;
  
        const filteredServices = formData.Services?.filter(
          service => service.Service && service.Service.trim() !== ''
        ) || [];
  
        await fetch(`/api/services?machineId=${machineId}`, {
          method: 'DELETE'
        });
  
        for (const service of filteredServices) {
          const serviceResponse = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Service: service.Service.trim(),
              Costs: service.Costs,
              machineId: machineId
            })
          });
  
          if (!serviceResponse.ok) {
            throw new Error(`Failed to save service: ${await serviceResponse.text()}`);
          }
        }
  
        setMachines(prevMachines => {
          if (editingMachine) {
            return prevMachines.map(m => 
              m.id === result.id 
                ? { ...result, Services: filteredServices }
                : m
            );
          } else {
            return [...prevMachines, {
              ...result,
              Services: filteredServices
            }];
          }
        });
  
        closeModal();
      } catch (saveError) {
        console.error('Machine save process error:', saveError);
        alert(`Error saving machine: ${saveError.message}`);
      }
    } catch (mainError) {
      console.error('Main submission error:', mainError);
      alert(`An unexpected error occurred: ${mainError.message}`);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto">
        {/* ... (keep existing header and grid container) */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map(machine => (
            <div key={machine.id} className="bg-white rounded-lg shadow-md p-6">
              {/* ... (keep existing machine header and image) */}
              
              <p className="text-gray-600 mb-4">
                {machine.Desc.length > 100 ? `${machine.Desc.substring(0, 100)}...` : machine.Desc}
              </p>
              
              {/* Updated Services Display */}
              {machine.Services && machine.Services.length > 0 && (
                <div className="mb-4">
                  <strong className="text-gray-700 block mb-2">Services:</strong>
                  <ul className="space-y-2">
                    {machine.Services.map((service, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{service.Service}</span>
                        <span className="text-green-600">
                          PHP {Number(service.Costs).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* ... (keep existing buttons) */}
            </div>
          ))}
        </div>
        
        {/* Updated Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
              {/* ... (keep existing modal header) */}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... (keep existing name, description, image inputs) */}

                {/* Updated Services Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services
                  </label>
                  {formData.Services?.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <div className="flex-grow space-y-2">
                        <input
                          type="text"
                          value={service.Service}
                          onChange={(e) => handleServiceChange(index, 'Service', e.target.value)}
                          placeholder="Enter service"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <input
                          type="number"
                          value={service.Costs || ''}
                          onChange={(e) => handleServiceChange(index, 'Costs', e.target.value)}
                          placeholder="Enter cost"
                          step="0.01"
                          min="0"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeServiceField(index)}
                          className="bg-red-500 text-white p-2 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addServiceField}
                    className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <Plus size={16} className="mr-2" /> Add Service
                  </button>
                </div>

                {/* ... (keep existing video URL input and submit button) */}
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}