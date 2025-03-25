// /components/user/business-info-edit-modal.tsx

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

  useEffect(() => {
    setFormData(currentInfo || {});
  }, [currentInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/update-business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isNotBusinessOwner: isNotBusinessOwner
        }),
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

  // If user is not a business owner, don't show the form
  if (isNotBusinessOwner) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4">
            Business Information
          </h2>
          
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-gray-600">
              You have indicated that you do not own or operate a business. 
              All business information fields have been set to "Not applicable".
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">
          Edit Business Information
        </h2>
  
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Identity Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Company Identity</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                name="CompanyName"
                value={formData.CompanyName || ''}
                onChange={handleChange}
                className="w-full p-2 border border-[#5e86ca] rounded-lg"
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Business Owner</label>
              <input
                type="text"
                name="BusinessOwner"
                value={formData.BusinessOwner || ''}
                onChange={handleChange}
                className="w-full p-2 border border-[#5e86ca] rounded-lg"
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
                className="w-full p-2 border border-[#5e86ca] rounded-lg"
                placeholder="Enter company ID number"
              />
            </div>
          </div>
          
          {/* Legal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 pt-4">Legal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Permit No.</label>
                <input
                  type="text"
                  name="BusinessPermitNum"
                  value={formData.BusinessPermitNum || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
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
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter TIN number"
                />
              </div>
            </div>
          </div>
          
          {/* Address Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 pt-4">Company Address</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                type="text"
                name="CompanyAddress"
                value={formData.CompanyAddress || ''}
                onChange={handleChange}
                className="w-full p-2 border border-[#5e86ca] rounded-lg"
                placeholder="Enter company street address"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="CompanyCity"
                  value={formData.CompanyCity || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
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
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter province"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zipcode</label>
              <input
                type="number"
                name="CompanyZipcode"
                value={formData.CompanyZipcode || ''}
                onChange={handleChange}
                className="w-full p-2 border border-[#5e86ca] rounded-lg"
                placeholder="Enter zipcode"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 pt-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  name="ContactPerson"
                  value={formData.ContactPerson || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
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
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter position or designation"
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
                className="w-full p-2 border border-[#5e86ca] rounded-lg"
                placeholder="Enter company email"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Phone Number</label>
                <input
                  type="text"
                  name="CompanyPhoneNum"
                  value={formData.CompanyPhoneNum || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter company phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Mobile Number</label>
                <input
                  type="text"
                  name="CompanyMobileNum"
                  value={formData.CompanyMobileNum || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter company mobile number"
                />
              </div>
            </div>
          </div>

          {/* Production Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 pt-4">Production Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Products Manufactured</label>
                <input
                  type="text"
                  name="Manufactured"
                  value={formData.Manufactured || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter products manufactured"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Production Frequency</label>
                <input
                  type="text"
                  name="ProductionFrequency"
                  value={formData.ProductionFrequency || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter production frequency"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bulk</label>
                <input
                  type="text"
                  name="Bulk"
                  value={formData.Bulk || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  placeholder="Enter bulk information"
                />
              </div>
            </div>
          </div>
  
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessInfoEditModal;