// /user-dashboard/information/components/InfoEditModal.tsx

import React, { useState, useEffect } from 'react';

interface ClientInfo {
  ContactNum: string;
  Address: string | null;
  City: string | null;
  Province: string | null;
  Zipcode: number | null;
}

interface BusinessInfo {
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

interface InfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInfo: ClientInfo | BusinessInfo | null | undefined;
  isBusinessView: boolean;
  userId: string;
  isNotBusinessOwner?: boolean;
}

const InfoEditModal = ({ 
  isOpen, 
  onClose, 
  currentInfo, 
  isBusinessView,
  userId,
  isNotBusinessOwner = false 
}: InfoEditModalProps) => {
  const [formData, setFormData] = useState<any>(currentInfo || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(currentInfo || null);
  }, [currentInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev!,
      [name]: value === '' ? "Not applicable" : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = isBusinessView && isNotBusinessOwner
        ? { isNotBusinessOwner: true }
        : formData;

      const response = await fetch('/api/user/update-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: isBusinessView ? 'business' : 'personal',
          data: dataToSubmit
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

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Edit {isBusinessView ? 'Business' : 'Personal'} Information
        </h2>
  
        <form onSubmit={handleSubmit} className="space-y-8">
          {isBusinessView ? (
            <>
              {isNotBusinessOwner ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-600">Business information not applicable</p>
                </div>
              ) : (
                <>
                  {/* Company Identity Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Company Identity</h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Company Name *</label>
                        <input
                          required
                          type="text"
                          name="CompanyName"
                          value={formData?.['CompanyName'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Business Owner *</label>
                        <input
                          required
                          type="text"
                          name="BusinessOwner"
                          value={formData?.['BusinessOwner'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Company ID Number</label>
                        <input
                          type="text"
                          name="CompanyIDNum"
                          value={formData?.['CompanyIDNum'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
    
                  {/* Legal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Legal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Business Permit Number *</label>
                        <input
                          required
                          type="text"
                          name="BusinessPermitNum"
                          value={formData?.['BusinessPermitNum'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">TIN Number *</label>
                        <input
                          required
                          type="text"
                          name="TINNum"
                          value={formData?.['TINNum'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
    
                  {/* Address Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Company Address</h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Street Address</label>
                        <input
                          type="text"
                          name="CompanyAddress"
                          value={formData?.['CompanyAddress'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">City</label>
                          <input
                            type="text"
                            name="CompanyCity"
                            value={formData?.['CompanyCity'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Province</label>
                          <input
                            type="text"
                            name="CompanyProvince"
                            value={formData?.['CompanyProvince'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Zipcode</label>
                          <input
                            type="number"
                            name="CompanyZipcode"
                            value={formData?.['CompanyZipcode'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
    
                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
                    <div className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact Person *</label>
                          <input
                            required
                            type="text"
                            name="ContactPerson"
                            value={formData?.['ContactPerson'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Designation</label>
                          <input
                            type="text"
                            name="Designation"
                            value={formData?.['Designation'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Company Email</label>
                        <input
                          type="email"
                          name="CompanyEmail"
                          value={formData?.['CompanyEmail'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone Number</label>
                          <input
                            type="text"
                            name="CompanyPhoneNum"
                            value={formData?.['CompanyPhoneNum'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Mobile Number</label>
                          <input
                            type="text"
                            name="CompanyMobileNum"
                            value={formData?.['CompanyMobileNum'] || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-[#5e86ca] rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
    
                  {/* Production Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Production Information</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Products Manufactured</label>
                        <input
                          type="text"
                          name="Manufactured"
                          value={formData?.['Manufactured'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Production Frequency</label>
                        <input
                          type="text"
                          name="ProductionFrequency"
                          value={formData?.['ProductionFrequency'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Bulk</label>
                        <input
                          type="text"
                          name="Bulk"
                          value={formData?.['Bulk'] || ''}
                          onChange={handleChange}
                          className="w-full p-2 border border-[#5e86ca] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            // Personal Information Form
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Contact Details</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number *</label>
                <input
                  required
                  type="text"
                  name="ContactNum"
                  value={formData?.['ContactNum'] || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#5e86ca] rounded-lg"
                />
              </div>
  
              <h3 className="text-lg font-semibold text-gray-700 pt-4">Address Information</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    name="Address"
                    value={formData?.['Address'] || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City/Municipality</label>
                    <input
                      type="text"
                      name="City"
                      value={formData?.['City'] || ''}
                      onChange={handleChange}
                      className="w-full p-2 border border-[#5e86ca] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Province</label>
                    <input
                      type="text"
                      name="Province"
                      value={formData?.['Province'] || ''}
                      onChange={handleChange}
                      className="w-full p-2 border border-[#5e86ca] rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <input
                    type="number"
                    name="Zipcode"
                    value={formData?.['Zipcode'] || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#5e86ca] rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
  
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

export default InfoEditModal;