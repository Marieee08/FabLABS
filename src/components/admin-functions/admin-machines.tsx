import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import React, { useState, useEffect } from 'react';
import { MultiSelect } from "@/components/ui/multi-select";

interface Service {
  id: string;
  Service: string;
  Costs?: number;
  Icon?: string;
  Info?: string;
  Per?: string;
}

interface Machine {
  id: string;
  Machine: string;
  Image: string;
  Desc: string;
  Instructions?: string;
  Link?: string;
  isAvailable: boolean;
  Services: Service[];
}

export default function AdminServices() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<Partial<Machine>>({
    Machine: '',
    Image: '',
    Desc: '',
    Instructions: '',
    Link: '',
    isAvailable: true,
    Services: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    fetchMachines();
    fetchServices();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines?includeServices=true');
      if (!response.ok) throw new Error('Failed to fetch machines');
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
      alert('Failed to load machines. Please try again later.');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setAllServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to load services. Please try again later.');
    }
  };


  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/machines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update availability');
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
      alert('Failed to update machine availability.');
    }
  };



  const deleteMachine = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/machines/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMachines(prevMachines => prevMachines.filter(machine => machine.id !== id));
    } catch (error) {
      console.error('Error deleting machine:', error);
      alert('Failed to delete machine. Please try again.');
    }
  };

  const openModal = (machine: Machine | null = null) => {
    setEditingMachine(machine);
    if (machine) {
      setFormData({
        Machine: machine.Machine || '',
        Image: machine.Image || '',
        Desc: machine.Desc || '',
        Instructions: machine.Instructions || '',
        Link: machine.Link || '',
        isAvailable: machine.isAvailable,
        Services: machine.Services || []
      });
      setSelectedServices(machine.Services.map(service => service.id));
      setImagePreview(machine.Image || null);
    } else {
      setFormData({
        Machine: '',
        Image: '',
        Desc: '',
        Instructions: '',
        Link: '',
        isAvailable: true,
        Services: []
      });
      setSelectedServices([]);
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMachine(null);
    setFormData({
      Machine: '',
      Image: '',
      Desc: '',
      Instructions: '',
      Link: '',
      isAvailable: true,
      Services: [{ Service: '', Costs: 0 }]
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index: number, field: 'Service' | 'Costs', value: string | number) => {
    setFormData(prev => {
      const updatedServices = [...(prev.Services || [])];
      if (field === 'Costs') {
        const numValue = value === '' ? 0 : parseFloat(value as string);
        updatedServices[index] = {
          ...updatedServices[index],
          [field]: !isNaN(numValue) ? numValue : 0
        };
      } else {
        updatedServices[index] = {
          ...updatedServices[index],
          [field]: value
        };
      }
      return { ...prev, Services: updatedServices };
    });
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
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
  
      const data = await response.json();
      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        setFormData(prev => ({ ...prev, Image: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      let imageUrl = formData.Image;
      if (imageFile) {
        const uploadedImageUrl = await handleImageUpload();
        if (!uploadedImageUrl) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadedImageUrl;
      }
  
      const machinePayload = {
        Machine: formData.Machine?.trim(),
        Image: imageUrl,
        Desc: formData.Desc?.trim(),
        Instructions: formData.Instructions?.trim() || null,
        Link: formData.Link?.trim() || null,
        isAvailable: formData.isAvailable ?? true,
        serviceIds: selectedServices
      };
  
      const response = await fetch(
        editingMachine 
          ? `/api/machines/${editingMachine.id}`
          : '/api/machines',
        {
          method: editingMachine ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(machinePayload)
        }
      );
  
      // Try to parse the response as JSON regardless of content-type
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Response parsing error:', error);
        throw new Error('Failed to parse server response');
      }
  
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save machine');
      }
  
      setMachines(prevMachines => {
        if (editingMachine) {
          return prevMachines.map(m => m.id === data.id ? data : m);
        }
        return [...prevMachines, data];
      });
  
      closeModal();
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save machine');
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
              
              {/* Services with Costs Display */}
              {machine.Services && machine.Services.length > 0 && (
  <div className="mb-4">
    <strong className="text-gray-700 block mb-2">Services:</strong>
    <ul className="space-y-2">
      {machine.Services.map((service, index) => (
        <li key={service.id || index} className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-800">{service.Service}</span>
          <span className="text-green-600 font-medium">
            {service.Costs || 0}
          </span>
        </li>
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
      <div className="sticky top-0 bg-white z-10 flex justify-between items-center mb-4 pb-2 border-b">
        <h2 className="text-2xl font-bold">{editingMachine ? 'Edit' : 'Add'} Machine</h2>
        <button 
          onClick={closeModal} 
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
  type="text"
  id="Machine"  // Changed from "name"
  name="Machine"  // Changed from "name"
  value={formData.Machine || ''}  // Changed from formData.name
  onChange={handleInputChange}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
  required
/>
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
  id="Desc"  // Changed from "description"
  name="Desc"  // Changed from "description"
  value={formData.Desc || ''}  // Changed from formData.description
  onChange={handleInputChange}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
  rows={3}
  required
/>
        </div>

        {/* Image Upload */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            {imageFile ? 'Change Image' : 'Upload Image'}
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {imagePreview && (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="mt-2 w-full h-48 object-cover rounded-md" 
            />
          )}
        </div>

        {/* Services Input */}
        <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Services
      </label>
      <MultiSelect
  options={allServices.map(service => ({
    value: service.id,
    label: `${service.Service} ${service.Costs ? `- ${service.Costs} PHP` : ''}`
  }))}
  selected={selectedServices}  // Changed from value to selected
  onChange={setSelectedServices}
  className="w-full"
  placeholder="Select services..."
/>
    </div>

        {/* Video URL Input */}
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
            YouTube Video URL
          </label>
          <input
  type="url"
  id="Link"  // Changed from "videoUrl"
  name="Link"  // Changed from "videoUrl"
  value={formData.Link || ''}  // Changed from formData.videoUrl
  onChange={handleInputChange}
  placeholder="https://youtube.com/..."
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
/>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
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