import React, { useState, useEffect } from 'react';

interface BusinessInfo {
  id?: number;
  CompanyName: string | null;
  BusinessOwner: string | null;
  BusinessPermitNum: string | null;
  TINNum: string | null;
  CompanyIDNum: string | null;
  CompanyEmail: string | null;
  ContactPerson: string | null;
  Designation: string | null;
  CompanyAddress: string | null;
  CompanyCity: string | null;
  CompanyProvince: string | null;
  CompanyZipcode: number | null;
  CompanyPhoneNum: string | null;
  CompanyMobileNum: string | null;
  Manufactured: string | null;
  ProductionFrequency: string | null;
  Bulk: string | null;
  isNotBusinessOwner?: boolean;
}

interface BusinessInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInfo: BusinessInfo | null | undefined;
  userId: string;
  isNotBusinessOwner: boolean;
}

const BusinessInfoEditModal = ({ 
  isOpen, 
  onClose, 
  currentInfo,
  userId,
  isNotBusinessOwner
}: BusinessInfoEditModalProps) => {
  const [formData, setFormData] = useState<any>(currentInfo || {});
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setFormData(currentInfo || {});
    setHasUnsavedChanges(false);
    setErrors({});
  }, [currentInfo]);

  // Check for changes (simplified)
  const checkForChanges = (newFormData: any) => {
    const original = currentInfo || {};
    const hasChanges = JSON.stringify(newFormData) !== JSON.stringify(original);
    setHasUnsavedChanges(hasChanges);
  };

  // Lightweight validation for key fields only
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate email if provided
    if (formData.CompanyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.CompanyEmail)) {
      newErrors.CompanyEmail = 'Please enter a valid email address';
    }
    
    // Validate zipcode if provided
    if (formData.CompanyZipcode) {
      const zip = parseInt(formData.CompanyZipcode.toString());
      if (isNaN(zip) || zip < 1000 || zip > 9999) {
        newErrors.CompanyZipcode = 'Please enter a valid 4-digit zip code';
      }
    }
    
    // Validate phone numbers if provided (simplified)
    if (formData.CompanyPhoneNum) {
      const phone = formData.CompanyPhoneNum.replace(/\D/g, '');
      if (phone.length < 7 || phone.length > 11) {
        newErrors.CompanyPhoneNum = 'Please enter a valid phone number';
      }
    }
    
    if (formData.CompanyMobileNum) {
      const mobile = formData.CompanyMobileNum.replace(/\D/g, '');
      if (mobile.length < 7 || mobile.length > 11) {
        newErrors.CompanyMobileNum = 'Please enter a valid mobile number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Basic input filtering for phone numbers
    let processedValue = value;
    if (name === 'CompanyPhoneNum' || name === 'CompanyMobileNum') {
      processedValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
    }
    
    const newFormData = {
      ...formData,
      [name]: processedValue === '' ? null : processedValue
    };
    
    setFormData(newFormData);
    checkForChanges(newFormData);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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

  // Drag handling (simplified)
  const handleMouseDown = () => setIsDragging(false);
  const handleMouseMove = () => setIsDragging(true);
  const handleMouseUp = () => setTimeout(() => setIsDragging(false), 50);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || e.target !== e.currentTarget) return;
    handleCloseAttempt();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const response = await fetch('/api/user/update-business-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isNotBusinessOwner }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update information');
      }

      setHasUnsavedChanges(false);
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

  // Non-business owner view
  if (isNotBusinessOwner) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Business Information</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-gray-600">
              You have indicated that you do not own or operate a business. 
              All business information fields have been set to {"\"Not applicable\""}.
            </p>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Edit Business Information</h2>
            <button onClick={handleCloseAttempt} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Identity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Company Identity</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  name="CompanyName"
                  value={formData.CompanyName || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Owner</label>
                  <input
                    type="text"
                    name="BusinessOwner"
                    value={formData.BusinessOwner || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business owner name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company ID Number</label>
                  <input
                    type="text"
                    name="CompanyIDNum"
                    value={formData.CompanyIDNum || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company ID number"
                  />
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Legal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Permit No.</label>
                  <input
                    type="text"
                    name="BusinessPermitNum"
                    value={formData.BusinessPermitNum || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business permit number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TIN No.</label>
                  <input
                    type="text"
                    name="TINNum"
                    value={formData.TINNum || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter TIN number"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Company Address</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  name="CompanyAddress"
                  value={formData.CompanyAddress || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company street address"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    name="CompanyCity"
                    value={formData.CompanyCity || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Province</label>
                  <input
                    type="text"
                    name="CompanyProvince"
                    value={formData.CompanyProvince || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <input
                    type="number"
                    name="CompanyZipcode"
                    value={formData.CompanyZipcode || ''}
                    onChange={handleChange}
                    min="1000" max="9999"
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.CompanyZipcode ? 'border-red-500' : 'border-[#5e86ca]'
                    }`}
                    placeholder="4-digit zip"
                  />
                  {errors.CompanyZipcode && <p className="text-red-500 text-sm mt-1">{errors.CompanyZipcode}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="ContactPerson"
                    value={formData.ContactPerson || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position/Designation</label>
                  <input
                    type="text"
                    name="Designation"
                    value={formData.Designation || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter position"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Email</label>
                <input
                  type="email"
                  name="CompanyEmail"
                  value={formData.CompanyEmail || ''}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.CompanyEmail ? 'border-red-500' : 'border-[#5e86ca]'
                  }`}
                  placeholder="Enter company email"
                />
                {errors.CompanyEmail && <p className="text-red-500 text-sm mt-1">{errors.CompanyEmail}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="CompanyPhoneNum"
                    value={formData.CompanyPhoneNum || ''}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.CompanyPhoneNum ? 'border-red-500' : 'border-[#5e86ca]'
                    }`}
                    placeholder="e.g., 032-1234567"
                  />
                  {errors.CompanyPhoneNum && <p className="text-red-500 text-sm mt-1">{errors.CompanyPhoneNum}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="CompanyMobileNum"
                    value={formData.CompanyMobileNum || ''}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.CompanyMobileNum ? 'border-red-500' : 'border-[#5e86ca]'
                    }`}
                    placeholder="e.g., 09123456789"
                  />
                  {errors.CompanyMobileNum && <p className="text-red-500 text-sm mt-1">{errors.CompanyMobileNum}</p>}
                </div>
              </div>
            </div>

            {/* Production Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Production Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Products Manufactured</label>
                  <input
                    type="text"
                    name="Manufactured"
                    value={formData.Manufactured || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter products"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Production Frequency</label>
                  <input
                    type="text"
                    name="ProductionFrequency"
                    value={formData.ProductionFrequency || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Daily, Weekly"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bulk</label>
                  <input
                    type="text"
                    name="Bulk"
                    value={formData.Bulk || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bulk info"
                  />
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
                onClick={() => setShowConfirmExit(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmExit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default BusinessInfoEditModal;