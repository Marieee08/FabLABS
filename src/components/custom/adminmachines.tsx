import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import React, { useState, useEffect } from 'react';

interface Service {
  id?: string;
  Service: string;
}

interface Machine {
  id: string;
  Machine: string;
  Image: string;
  Desc: string;
  Link?: string;
  isAvailable: boolean;
  Costs?: number;
  Services: Service[];
}

export default function AdminServices() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<Partial<Machine>>({
    isAvailable: true,
    Costs: 0,
    Services: [{ Service: '' }]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines');
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      } else {
        console.error('Failed to fetch machines');
        // Optionally, show an error message to the user
        alert('Failed to load machines. Please refresh or contact support.');
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      // Optionally, show an error message to the user
      alert('An error occurred while fetching machines. Please try again later.');
    }
  };


  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      console.log('Sending request:', { id, newStatus: !currentStatus });
 
      const response = await fetch(`/api/machines/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: !currentStatus
        })
      });
 
      console.log('Response status:', response.status);
 
      const text = await response.text();
      console.log('Response text:', text);
 
      const data = text ? JSON.parse(text) : null;
 
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update availability');
      }
 
      setMachines(prevMachines =>
        prevMachines.map(machine =>
          machine.id === id
            ? { ...machine, isAvailable: !currentStatus }
            : machine
        )
      );
 
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };


  const deleteMachine = async (id: string) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to delete this machine? This action cannot be undone.');
    
    // Only proceed if user confirms
    if (!isConfirmed) return;
  
    try {
      const response = await fetch(`/api/machines/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMachines(machines.filter((machine) => machine.id !== id));
        console.log('Machine deleted successfully');
      } else {
        console.error('Failed to delete machine:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting machine:', error);
    }
  };

  const openModal = (machine: Machine | null = null) => {
    setEditingMachine(machine);
    if (machine) {
      setFormData({
        name: machine.Machine || '',
        image: machine.Image || '',
        description: machine.Desc || '',
        videoUrl: machine.Link || '',
        isAvailable: machine.isAvailable,
        Costs: machine.Costs || 0,
        Services: machine.Services?.length 
          ? machine.Services 
          : [{ Service: '' }]
      });
      
      // Set the image preview to the current machine's image
      setImagePreview(machine.Image || null);
      
      // Reset the image file to null since we're using the existing image
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        image: '',
        description: '',
        videoUrl: '',
        isAvailable: true,
        Costs: 0,
        Services: [{ Service: '' }]
      });
      
      // Reset image preview and file for a new machine
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMachine(null);
    setFormData({
      isAvailable: true // Reset with default availability
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleServiceChange = (index: number, value: string) => {
    const updatedServices = [...(formData.Services || [])];
    updatedServices[index] = { Service: value };
    setFormData({ ...formData, Services: updatedServices });
  };

  const addServiceField = () => {
    setFormData(prev => ({
      ...prev, 
      Services: [...(prev.Services || []), { Service: '' }]
    }));
  };

  const removeServiceField = (index: number) => {
    const updatedServices = formData.Services?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, Services: updatedServices });
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
  
    const formData = new FormData();
    formData.append('file', imageFile);
  
    try {
      const response = await fetch('/api/machines/upload', {
        method: 'POST',
        body: formData
      });
  
      // Log the entire response for debugging
      console.log('Full response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
      // Try to parse the response text
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
  
      // Try to parse the response as JSON
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error(`Invalid server response: ${responseText}`);
      }
  
      // Check if the response was successful
      if (response.ok) {
        if (parsedData.path) {
          return parsedData.path;
        }
        throw new Error(parsedData.error || 'Upload failed');
      } else {
        throw new Error(parsedData.error || 'Upload unsuccessful');
      }
    } catch (error) {
      console.error('Complete upload error:', error);
      alert(`Failed to upload image: ${error.message}`);
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Update formData with the file name or temporary path
        setFormData(prev => ({
          ...prev, 
          image: file.name // or you could use a temporary path
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      let imageUrl = formData.Image;
      
      // Upload image if a new file is selected
      if (imageFile) {
        imageUrl = await handleImageUpload();
        if (!imageUrl) {
          alert('Failed to upload image');
          return;
        }
      } else if (editingMachine) {
        // If no new file is uploaded and we're editing, keep the existing image
        imageUrl = editingMachine.Image;
      }
  
      // Filter out empty services
      const filteredServices = formData.Services?.filter(
        service => service.Service.trim() !== ''
      ).map(service => ({
        Service: service.Service
      })) || [];
  
      const machinePayload = {
        ...(editingMachine ? { id: editingMachine.id } : {}), // Include ID for updates
        Machine: formData.name,
        Image: imageUrl,
        Desc: formData.description,
        Link: formData.videoUrl || null,
        isAvailable: formData.isAvailable ?? true,
        Costs: formData.Costs || null,
      };
  
      let response;
      if (editingMachine) {
        response = await fetch(`/api/machines`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(machinePayload)
        });
      } else {
        response = await fetch('/api/machines', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(machinePayload)
        });
      }
  
      // Parse response
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save machine');
      }
  
      // If services exist, we'll handle them separately
      if (filteredServices.length > 0) {
        // If editing a machine, delete existing services first
        if (editingMachine) {
          await fetch(`/api/services?machineId=${result.id}`, {
            method: 'DELETE'
          });
        }
  
        // Add new services
        for (const service of filteredServices) {
          await fetch('/api/services', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              Service: service.Service,
              machineId: result.id
            })
          });
        }
      }
  
      // Update local state
      if (editingMachine) {
        setMachines(machines.map(m => 
          m.id === result.id ? result : m
        ));
      } else {
        setMachines([...machines, result]);
      }
  
      closeModal();
    } catch (error) {
      console.error('Submission ERROR:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => openModal()}
            className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center"
          >
            <Plus size={20} className="mr-2" /> Add New Machine
          </button>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map(machine => (
            <div key={machine.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{machine.Machine}</h2>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${machine.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {machine.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <Switch
                    checked={machine.isAvailable}
                    onCheckedChange={() => toggleAvailability(machine.id, machine.isAvailable)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
              <img 
                src={machine.Image} 
                alt={machine.Machine} 
                className="w-full h-48 object-cover rounded-md mb-4" 
              />
              <p className="text-gray-600 mb-4">
                {machine.Desc.length > 100 ? `${machine.Desc.substring(0, 100)}...` : machine.Desc}
              </p>
              
              {/* Display Costs */}
              {machine.Costs && (
                <div className="mb-4">
                  <strong className="text-gray-700">Cost: </strong>
                  <span className="text-green-600">${machine.Costs.toFixed(2)}</span>
                </div>
              )}
              
              {/* Display Services */}
              {machine.Services && machine.Services.length > 0 && (
                <div className="mb-4">
                  <strong className="text-gray-700 block mb-2">Services:</strong>
                  <ul className="list-disc list-inside text-gray-600">
                    {machine.Services.map((service, index) => (
                      <li key={index}>{service.Service}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {machine.Link && (
                <a 
                  href={machine.Link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline mb-4 block"
                >
                  Watch Video
                </a>
              )}
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openModal(machine)}
                  className="bg-blue-500 text-white p-2 rounded-full"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => deleteMachine(machine.id)}
                  className="bg-red-500 text-white p-2 rounded-full"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
  
        {/* Modal for Add/Edit Machine */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{editingMachine ? 'Edit' : 'Add'} Machine</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Name Input */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>
  
                {/* Description Input */}
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    rows={3}
                    required
                  ></textarea>
                </div>
  
                {/* Image Upload */}
                <div className="mb-4">
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    {imageFile ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full"
                  />
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mt-2 w-full h-48 object-cover rounded-md" 
                    />
                  )}
                </div>
  
                {/* Costs Input */}
                <div className="mb-4">
                  <label htmlFor="Costs" className="block text-sm font-medium text-gray-700">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    id="Costs"
                    name="Costs"
                    step="0.01"
                    min="0"
                    value={formData.Costs || 0}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
  
                {/* Services Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services
                  </label>
                  {formData.Services?.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={service.Service}
                        onChange={(e) => handleServiceChange(index, e.target.value)}
                        placeholder="Enter service"
                        className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
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
  
                {/* Video URL Input */}
                <div className="mb-4">
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
                    YouTube Video URL
                  </label>
                  <input
                    type="text"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
  
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {editingMachine ? 'Update' : 'Add'} Machine
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
  );
}
