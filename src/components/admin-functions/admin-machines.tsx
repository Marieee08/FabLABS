import { Plus, Edit, Trash2, X, Info, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import React, { useState, useEffect } from 'react';
import { MultiSelect } from "@/components/ui/multi-select";
import Image from 'next/image';

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
  Number?: number;
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
  const [isDeletingMap, setIsDeletingMap] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<Machine>>({
    Machine: '',
    Image: '',
    Desc: '',
    Number: 1,
    Instructions: '',
    Link: '',
    isAvailable: true,
    Services: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Enhanced loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});
  // Simplified loading state
  // Removed actionInProgress state as it's no longer needed
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsDataLoading(true);
    setError(null);
    
    try {
      // Use Promise.all to fetch both machines and services in parallel
      const [machinesResponse, servicesResponse] = await Promise.all([
        fetch('/api/machines?includeServices=true'),
        fetch('/api/services')
      ]);
      
      if (!machinesResponse.ok) throw new Error('Failed to fetch machines');
      if (!servicesResponse.ok) throw new Error('Failed to fetch services');
      
      const machinesData = await machinesResponse.json();
      const servicesData = await servicesResponse.json();
      
      setMachines(machinesData);
      setAllServices(servicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchMachines = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch('/api/machines?includeServices=true');
      if (!response.ok) throw new Error('Failed to fetch machines');
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch machines');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Error state for form validation and API errors
  const [error, setError] = useState<string | null>(null);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    // Set toggling state for this specific machine
    setIsToggling(prev => ({ ...prev, [id]: true }));
    
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

      const updatedMachine = await response.json();
      setMachines(prevMachines =>
        prevMachines.map(machine =>
          machine.id === id ? updatedMachine : machine
        )
      );
      
      // Success handled by UI update
    } catch (error) {
      console.error('Toggle error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update machine availability');
    } finally {
      // Add a small delay to avoid UI flicker
      setTimeout(() => {
        setIsToggling(prev => ({ ...prev, [id]: false }));
      }, 300);
    }
  };

  const deleteImageFile = async (imagePath: string) => {
    if (!imagePath) return;
    
    try {
      const response = await fetch(`/api/machines/upload?imagePath=${encodeURIComponent(imagePath)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Image deletion warning:', errorData);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
  
  const deleteMachine = async (id: string) => {
    const machineToDelete = machines.find(machine => machine.id === id);
    if (!machineToDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete "${machineToDelete.Machine}"? This action cannot be undone.`)) return;
    
    setIsDeletingMap(prev => ({ ...prev, [id]: true }));
    
    try {
      // Delete the machine first
      const response = await fetch(`/api/machines/${id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete machine');
      }
      
      // Then delete the associated image file if it exists
      if (machineToDelete.Image && machineToDelete.Image.startsWith('/uploads/')) {
        await deleteImageFile(machineToDelete.Image);
      }
      
      setMachines(prevMachines => prevMachines.filter(machine => machine.id !== id));
      // Success handled by UI update
      
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete machine');
    } finally {
      // Add a small delay to avoid UI flicker
      setTimeout(() => {
        setIsDeletingMap(prev => ({ ...prev, [id]: false }));
      }, 300);
    }
  };

  const openModal = (machine: Machine | null = null) => {
    setEditingMachine(machine);
    if (machine) {
      setFormData({
        Machine: machine.Machine,
        Image: machine.Image,
        Desc: machine.Desc,
        Number: machine.Number ?? 1,
        Instructions: machine.Instructions || '',
        Link: machine.Link || '',
        isAvailable: machine.isAvailable,
        Services: machine.Services
      });
      setSelectedServices(machine.Services.map(service => service.id));
      setImagePreview(machine.Image);
    } else {
      setFormData({
        Machine: '',
        Image: '',
        Desc: '',
        Number: 1,
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
    // If form is being submitted, don't allow closing
    if (isLoading) return;
    
    setIsModalOpen(false);
    
    // Small delay to allow modal close animation
    setTimeout(() => {
      setEditingMachine(null);
      setFormData({
        Machine: '',
        Image: '',
        Desc: '',
        Number: 1,
        Instructions: '',
        Link: '',
        isAvailable: true,
        Services: []
      });
      setSelectedServices([]);
    }, 300);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' || parseInt(value) < 1 ? 1 : parseInt(value, 10);
    setFormData(prev => ({ ...prev, Number: numValue }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
  
    setImageUploading(true);
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
      setError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size exceeds 5MB limit');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({ ...prev, Image: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      let imageUrl = formData.Image;
      if (imageFile) {
        const uploadedImagePath = await handleImageUpload();
        if (!uploadedImagePath) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadedImagePath;
      }
  
      const payload = {
        Machine: formData.Machine,
        Image: imageUrl,
        Desc: formData.Desc,
        Number: formData.Number ?? 1,
        Instructions: formData.Instructions || null,
        Link: formData.Link || null,
        isAvailable: formData.isAvailable ?? true,
        serviceIds: selectedServices
      };
  
      const endpoint = editingMachine 
        ? `/api/machines/${editingMachine.id}` 
        : '/api/machines';
      
      const method = editingMachine ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let responseData;
      const responseText = await response.text();
      
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(`Failed to parse response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(
          responseData?.error || 
          (responseData?.errors && Array.isArray(responseData.errors) 
            ? responseData.errors.join(', ') 
            : responseData?.errors) || 
          'Failed to save machine'
        );
      }

      await fetchMachines();
      closeModal();
      // Success handled by UI update
      
    } catch (error) {
      console.error('Detailed error information:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
      
      setError(error instanceof Error ? error.message : 'Failed to save machine');
    } finally {
      // Small delay to show completion animation
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  // Loading skeleton components
  const MachinesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 animate-pulse">
          <div className="p-4 border-b border-gray-100 flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="h-56 bg-gray-200"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
          <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading is now handled by a simple spinner like in AdminTools

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#143370]">Machines</h2>
          <Button
            onClick={() => openModal()}
            className="bg-[#143370] hover:bg-[#0d2451] text-white"
            disabled={isDataLoading}
          >
            <Plus size={18} className="mr-2" /> Add New Machine
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        {isDataLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#143370]"></div>
          </div>
        ) : machines.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">No machines found</p>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center mx-auto transition-colors"
            >
              <Plus size={18} className="mr-2" /> Add Your First Machine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map(machine => (
              <div 
                key={machine.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                {/* Machine Header */}
                <div className="flex justify-between items-start p-4 border-b border-gray-100">
                  <div className="flex flex-col max-w-[60%]">
                    <h2 className="text-lg font-semibold text-gray-800 truncate" title={machine.Machine}>
                      {machine.Machine}
                    </h2>
                    {machine.Number !== null && machine.Number !== undefined && (
                      <span className="text-xs text-gray-500">
                        Quantity: {machine.Number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      machine.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {machine.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <div className="relative">
                      {isToggling[machine.id] ? (
                        <div className="h-5 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <Switch
                          checked={machine.isAvailable}
                          onCheckedChange={() => toggleAvailability(machine.id, machine.isAvailable)}
                          className="data-[state=checked]:bg-green-600 transition-colors duration-200"
                          disabled={isToggling[machine.id]}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Machine Image */}
                <div className="relative h-56 overflow-hidden">
                  <Image 
                    src={machine.Image} 
                    alt={machine.Machine} 
                    fill
                    className="object-cover transform hover:scale-105 transition-transform duration-300" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      
                      target.style.display = 'none';
                      
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-500';
                      placeholder.textContent = 'No image available';
                      
                      if (parent) {
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                  {machine.Link && (
                    <a 
                      href={machine.Link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all duration-200 transform hover:scale-110"
                      title="Watch Video"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </a>
                  )}
                </div>
                
                {/* Machine Info */}
                <div className="p-4">
                  <p className="text-gray-600 mb-4 line-clamp-2" title={machine.Desc}>
                    {machine.Desc}
                  </p>
                  
                  {machine.Instructions && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-line line-clamp-3" title={machine.Instructions}>
                        {machine.Instructions}
                      </p>
                    </div>
                  )}
                  
                  {/* Services Section */}
                  {machine.Services && machine.Services.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Services:</h3>
                      <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        <ul className="divide-y divide-gray-100">
                          {machine.Services.map((service, index) => (
                            <li key={service.id || index} className="flex justify-between items-center py-2">
                              <span className="text-gray-800 text-sm">{service.Service}</span>
                              <span className="text-green-600 font-medium text-sm">
                                ₱{service.Costs ? parseFloat(service.Costs.toString()).toFixed(2) : '0.00'}
                                {service.Per && <span className="text-xs text-gray-500 ml-1">/{service.Per}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end space-x-2">
                  <button
                    onClick={() => openModal(machine)}
                    className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 rounded-md transition-colors"
                    title="Edit"
                    disabled={isDeletingMap[machine.id]}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteMachine(machine.id)}
                    disabled={isDeletingMap[machine.id]}
                    className={`${
                      isDeletingMap[machine.id] 
                        ? 'bg-gray-200 text-gray-400' 
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    } p-2 rounded-md transition-colors`}
                    title="Delete"
                  >
                    {isDeletingMap[machine.id] ? (
                      <div className="w-4.5 h-4.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    
        {/* Modal for Add/Edit Machine */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div 
              className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
            >
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-5 border-b">
                <h2 className="text-xl font-bold text-gray-800">{editingMachine ? 'Edit' : 'Add'} Machine</h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  disabled={isLoading}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto">
                <form id="machineForm" onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="Machine" className="block text-sm font-medium text-gray-700 mb-1">
                      Machine Name
                    </label>
                    <input
                      type="text"
                      id="Machine"
                      name="Machine"
                      value={formData.Machine || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Number Input */}
                  <div className="space-y-2">
                    <label htmlFor="Number" className="block text-sm font-medium text-gray-700">
                      Number of Machines
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const currentValue = formData.Number || 1;
                          if (currentValue > 1) {
                            setFormData(prev => ({ ...prev, Number: currentValue - 1 }));
                          }
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="Number"
                        name="Number"
                        type="number"
                        value={formData.Number === undefined ? 1 : formData.Number}
                        onChange={handleNumberChange}
                        className="w-20 text-center"
                        min="1"
                        required
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const currentValue = formData.Number || 1;
                          setFormData(prev => ({ ...prev, Number: currentValue + 1 }));
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Description Input */}
                  <div>
                    <label htmlFor="Desc" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="Desc"
                      name="Desc"
                      value={formData.Desc || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  
                  {/* Instructions Input */}
                  <div>
                    <label htmlFor="Instructions" className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions (Optional)
                    </label>
                    <textarea
                      id="Instructions"
                      name="Instructions"
                      value={formData.Instructions || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Machine Image
                    </label>
                    {editingMachine && imagePreview && (
                      <div className="text-sm text-gray-600 mb-2">
                        Current image: {editingMachine.Image.split('/').pop()}
                      </div>
                    )}
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {imagePreview && (
                      <div className="mt-2 relative h-40 bg-gray-100 rounded-md overflow-hidden">
                        <Image 
                          src={imagePreview} 
                          alt="Preview" 
                          fill
                          className="object-contain" 
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Services Input */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="text-sm font-medium text-gray-700">Services</label>
                      <div className="relative ml-2 group">
                        <Info size={16} className="text-gray-500 cursor-help" />
                        <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                          If no service is associated with the machine, the {"\"Bulk of Commodity per Production\""} field in MSME forms will automatically be marked as {"\"None.\""}
                        </div>
                      </div>
                    </div>
                    <MultiSelect
                      options={allServices.map(service => ({
                        value: service.id,
                        label: `${service.Service} ${typeof service.Costs === 'number' ? `- ₱${service.Costs.toFixed(2)}` : ''}`
                      }))}
                      selected={selectedServices}
                      onChange={setSelectedServices}
                      className="w-full"
                      placeholder="Select services..."
                    />
                  </div>
                  
                  {/* Video URL Input */}
                  <div>
                    <label htmlFor="Link" className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      id="Link"
                      name="Link"
                      value={formData.Link || ''}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </div>
              
              {/* Form Actions */}
              <div className="border-t border-gray-200 p-5 bg-gray-50 flex justify-end items-center space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="machineForm"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>{editingMachine ? 'Update' : 'Add'} Machine</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}