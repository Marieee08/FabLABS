import React, { useState, useEffect } from 'react';

interface ClientInfo {
  ContactNum: string;
  Address: string | null;
  City: string | null;
  Province: string | null;
  Zipcode: number | null;
}

interface PersonalInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInfo: ClientInfo | null | undefined;
  userId: string;
}

const PersonalInfoEditModal = ({ 
  isOpen, 
  onClose, 
  currentInfo,
  userId
}: PersonalInfoEditModalProps) => {
  const [formData, setFormData] = useState<any>(currentInfo || {});
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setFormData(currentInfo || {});
  }, [currentInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  // Track drag state to prevent modal closing during text selection
  const handleMouseDown = () => {
    setIsDragging(false);
  };

  const handleMouseMove = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    // Reset drag state after a brief delay to ensure click events are handled properly
    setTimeout(() => setIsDragging(false), 50);
  };

  // Better backdrop click handler that respects drag operations
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't close if we're in the middle of a drag operation
    if (isDragging) {
      return;
    }
    
    // Only close if the click target is the backdrop itself, not a child element
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/update-personal-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update information');
      }

      window.location.reload();
      onClose();
    } catch (error) {
      console.error('Error updating information:', error);
      alert('Failed to update information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Edit Personal Information
          </h2>
          {/* Add X button for explicit close */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Contact Details</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number *</label>
              <input
                required
                type="text"
                name="ContactNum"
                value={formData.ContactNum || ''}
                onChange={handleChange}
                className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your contact number"
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-700 pt-4">Address Information</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  name="Address"
                  value={formData.Address || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your street address"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City/Municipality</label>
                  <input
                    type="text"
                    name="City"
                    value={formData.City || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Province</label>
                  <input
                    type="text"
                    name="Province"
                    value={formData.Province || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your province"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zip Code</label>
                <input
                  type="number"
                  name="Zipcode"
                  value={formData.Zipcode || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your zip code"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoEditModal;