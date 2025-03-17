import { Plus, Edit, Trash2, X, Info } from 'lucide-react';
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
  const [isDeletingMap, setIsDeletingMap] = useState<Record<string, boolean>>({});
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
  const [isLoading, setIsLoading] = useState(false);

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

      const updatedMachine = await response.json();
      setMachines(prevMachines =>
        prevMachines.map(machine =>
          machine.id === id ? updatedMachine : machine
        )
      );
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to update machine availability.');
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
        // We don't throw here as we don't want to block machine deletion if image deletion fails
      } else {
        console.log('Image deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Again, we don't rethrow as the machine deletion should proceed
    }
  };
  
  const deleteMachine = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this machine? This action cannot be undone.')) return;
    
    setIsDeletingMap(prev => ({ ...prev, [id]: true }));
    
    try {
      // Find the machine to get its image path
      const machineToDelete = machines.find(machine => machine.id === id);
      if (!machineToDelete) throw new Error('Machine not found');
      
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
      
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete machine');
    } finally {
      setIsDeletingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const openModal = (machine: Machine | null = null) => {
    setEditingMachine(machine);
    if (machine) {
      setFormData({
        Machine: machine.Machine,
        Image: machine.Image,
        Desc: machine.Desc,
        Instructions: machine.Instructions || '',
        Link: machine.Link || '',
        isAvailable: machine.isAvailable,
        Services: machine.Services
      });
      // Update selected services based on the machine's current services
      setSelectedServices(machine.Services.map(service => service.id));
      setImagePreview(machine.Image);
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
      Services: []
    });
    setSelectedServices([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        Instructions: formData.Instructions || null,
        Link: formData.Link || null,
        isAvailable: formData.isAvailable ?? true,
        serviceIds: selectedServices
      };
  
      const endpoint = editingMachine 
        ? `/api/machines/${editingMachine.id}` 
        : '/api/machines';
      
      const method = editingMachine ? 'PUT' : 'POST';
  
      // Detailed logging of the request
      console.log('Making request:', {
        endpoint,
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload, null, 2)
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      // Log the response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
        console.log('Parsed response data:', responseData);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(`Failed to parse response: ${responseText}`);
      }

      if (!response.ok) {
        // Log more details about the error
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });

        throw new Error(
          responseData?.error || 
          (responseData?.errors && Array.isArray(responseData.errors) 
            ? responseData.errors.join(', ') 
            : responseData?.errors) || 
          'Failed to save machine'
        );
      }

      console.log('Successfully saved machine:', responseData);
      await fetchMachines();
      closeModal();
      
    } catch (error) {
      console.error('Detailed error information:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
      
      alert(error instanceof Error ? error.message : 'Failed to save machine');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#143370]">Machines</h2>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center transition-colors"
          >
            <Plus size={18} className="mr-2" /> Add New Machine
          </button>
        </div>
        
        {machines.length === 0 ? (
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
              <div key={machine.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* Machine Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 truncate" title={machine.Machine}>
                    {machine.Machine}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      machine.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {machine.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <Switch
                      checked={machine.isAvailable}
                      onCheckedChange={() => toggleAvailability(machine.id, machine.isAvailable)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
                
                {/* Machine Image */}
                <div className="relative h-56">
                  <img 
                    src={machine.Image} 
                    alt={machine.Machine} 
                    className="w-full h-full object-cover" 
                  />
                  {machine.Link && (
                    <a 
                      href={machine.Link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90"
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
                      <div className="max-h-40 overflow-y-auto pr-1">
                        <ul className="divide-y divide-gray-100">
                          {machine.Services.map((service, index) => (
                            <li key={service.id || index} className="flex justify-between items-center py-2">
                              <span className="text-gray-800 text-sm">{service.Service}</span>
                              <span className="text-green-600 font-medium text-sm">
                                ₱{service.Costs ? parseFloat(service.Costs).toFixed(2) : '0.00'}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-5 border-b">
                <h2 className="text-xl font-bold text-gray-800">{editingMachine ? 'Edit' : 'Add'} Machine</h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
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
      <img 
        src={imagePreview} 
        alt="Preview" 
        className="w-full h-full object-contain" 
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
                          If no service is associated with the machine, the "Bulk of Commodity per Production" field in MSME forms will automatically be marked as "None."
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