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

interface ValidationErrors {
  ContactNum?: string;
  Address?: string;
  City?: string;
  Province?: string;
  Zipcode?: string;
}

const PersonalInfoEditModal = ({ 
  isOpen, 
  onClose, 
  currentInfo,
  userId
}: PersonalInfoEditModalProps) => {
  // Create a default ClientInfo object
  const getDefaultFormData = (): ClientInfo => ({
    ContactNum: '',
    Address: null,
    City: null,
    Province: null,
    Zipcode: null
  });

  const [formData, setFormData] = useState<ClientInfo>(currentInfo || getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setFormData(currentInfo || getDefaultFormData());
    setErrors({});
    setHasUnsavedChanges(false);
  }, [currentInfo]);

  // Check if form has changes compared to original data
  const checkForChanges = (newFormData: ClientInfo) => {
    const original = currentInfo || getDefaultFormData();
    const hasChanges = 
      (newFormData.ContactNum || '') !== (original.ContactNum || '') ||
      (newFormData.Address || '') !== (original.Address || '') ||
      (newFormData.City || '') !== (original.City || '') ||
      (newFormData.Province || '') !== (original.Province || '') ||
      (newFormData.Zipcode || '') !== (original.Zipcode || '');
    
    setHasUnsavedChanges(hasChanges);
  };

  // Validation functions
  const validateContactNumber = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Contact number is required';
    }
    
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length === 11 && digitsOnly.startsWith('09')) {
      return null;
    }
    
    if (digitsOnly.length >= 7 && digitsOnly.length <= 10) {
      return null;
    }
    
    return 'Please enter a valid Philippine phone number (e.g., 09123456789)';
  };

  const validateZipcode = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return null;
    }
    
    const zipcode = parseInt(value);
    
    if (isNaN(zipcode)) {
      return 'Zip code must be a number';
    }
    
    if (zipcode < 1000 || zipcode > 9999) {
      return 'Please enter a valid 4-digit Philippine zip code';
    }
    
    return null;
  };

  const validateTextField = (value: string, fieldName: string): string | null => {
    if (!value || value.trim() === '') {
      return null;
    }
    
    if (value.trim().length < 2) {
      return `${fieldName} must be at least 2 characters long`;
    }
    
    if (value.trim().length > 100) {
      return `${fieldName} must be less than 100 characters`;
    }
    
    const validPattern = /^[a-zA-Z0-9\s\-\.\,\#]+$/;
    if (!validPattern.test(value.trim())) {
      return `${fieldName} contains invalid characters`;
    }
    
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const contactError = validateContactNumber(formData.ContactNum || '');
    if (contactError) newErrors.ContactNum = contactError;
    
    const addressError = validateTextField(formData.Address || '', 'Address');
    if (addressError) newErrors.Address = addressError;
    
    const cityError = validateTextField(formData.City || '', 'City');
    if (cityError) newErrors.City = cityError;
    
    const provinceError = validateTextField(formData.Province || '', 'Province');
    if (provinceError) newErrors.Province = provinceError;
    
    const zipcodeError = validateZipcode(formData.Zipcode?.toString() || '');
    if (zipcodeError) newErrors.Zipcode = zipcodeError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number | null = value;
    if (name === 'ContactNum') {
      processedValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
    } else if (name === 'Zipcode') {
      processedValue = value === '' ? null : parseInt(value) || null;
    } else {
      processedValue = value === '' ? null : value;
    }
    
    const newFormData: ClientInfo = {
      ...formData,
      [name]: processedValue
    };
    
    setFormData(newFormData);
    checkForChanges(newFormData);

    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle close attempts
  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowConfirmExit(true);
    } else {
      onClose();
    }
  };

  const handleConfirmExit = () => {
    setShowConfirmExit(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancelExit = () => {
    setShowConfirmExit(false);
  };

  // Track drag state to prevent modal closing during text selection
  const handleMouseDown = () => {
    setIsDragging(false);
  };

  const handleMouseMove = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      return;
    }
    
    if (e.target === e.currentTarget) {
      handleCloseAttempt();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update information');
      }

      setHasUnsavedChanges(false); // Reset changes flag on successful save
      window.location.reload();
      onClose();
    } catch (error) {
      console.error('Error updating information:', error);
      alert(`Failed to update information: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
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
            <button
              onClick={handleCloseAttempt}
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
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ContactNum ? 'border-red-500' : 'border-[#5e86ca]'
                  }`}
                  placeholder="e.g., 09123456789 or 032-1234567"
                />
                {errors.ContactNum && (
                  <p className="text-red-500 text-sm mt-1">{errors.ContactNum}</p>
                )}
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
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.Address ? 'border-red-500' : 'border-[#5e86ca]'
                    }`}
                    placeholder="Enter your street address"
                  />
                  {errors.Address && (
                    <p className="text-red-500 text-sm mt-1">{errors.Address}</p>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City/Municipality</label>
                    <input
                      type="text"
                      name="City"
                      value={formData.City || ''}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.City ? 'border-red-500' : 'border-[#5e86ca]'
                      }`}
                      placeholder="Enter your city"
                    />
                    {errors.City && (
                      <p className="text-red-500 text-sm mt-1">{errors.City}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Province</label>
                    <input
                      type="text"
                      name="Province"
                      value={formData.Province || ''}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.Province ? 'border-red-500' : 'border-[#5e86ca]'
                      }`}
                      placeholder="Enter your province"
                    />
                    {errors.Province && (
                      <p className="text-red-500 text-sm mt-1">{errors.Province}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <input
                    type="number"
                    name="Zipcode"
                    value={formData.Zipcode || ''}
                    onChange={handleChange}
                    min="1000"
                    max="9999"
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.Zipcode ? 'border-red-500' : 'border-[#5e86ca]'
                    }`}
                    placeholder="Enter 4-digit zip code"
                  />
                  {errors.Zipcode && (
                    <p className="text-red-500 text-sm mt-1">{errors.Zipcode}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={handleCloseAttempt}
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

      {/* Confirmation Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Discard Changes?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit? All your unsaved changes will be lost and cannot be recovered.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelExit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmExit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalInfoEditModal;