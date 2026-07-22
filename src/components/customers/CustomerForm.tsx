import React, { useState, useEffect, useRef } from 'react';
import { Save, X, RotateCcw, Upload, Image, Trash2 } from 'lucide-react';
import { type Customer } from '../../database/db';
import { generateNextCustomerCode, validateCustomer } from '../../database/customerHelper';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import showToast from '../../utils/toast';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'name' | 'balance'>) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    customerCode: '',
    customerType: 'Regular Customer' as Customer['customerType'],
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: '',
    gender: 'Other' as Customer['gender'],
    nationalId: '',
    profileImage: '',
    openingBalance: 0,
    creditLimit: 0,
    status: 'Active' as Customer['status'],
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  
  // States for confirmation dialog on edit
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [modifiedFieldsSummary, setModifiedFieldsSummary] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial configuration or code generation
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerCode: initialData.customerCode || '',
        customerType: initialData.customerType || 'Regular Customer',
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        postalCode: initialData.postalCode || '',
        dateOfBirth: initialData.dateOfBirth ? String(initialData.dateOfBirth).split('T')[0] : '',
        gender: (initialData.gender as any) || 'Other',
        nationalId: initialData.nationalId || '',
        profileImage: initialData.profileImage || '',
        openingBalance: initialData.openingBalance || 0,
        creditLimit: initialData.creditLimit || 0,
        status: initialData.status || 'Active',
        notes: initialData.notes || '',
      });
    } else {
      handleRegenerateCode();
    }
  }, [initialData]);

  const handleRegenerateCode = async () => {
    try {
      const code = await generateNextCustomerCode();
      setFormData((prev) => ({ ...prev, customerCode: code }));
    } catch (err) {
      console.error('Failed to generate customer code:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'openingBalance' || name === 'creditLimit') ? Math.max(0, Number(value)) : value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Image Upload Handlers
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast.error('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast.error('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profileImage: reader.result as string }));
      showToast.success('Image loaded successfully.');
    };
    reader.onerror = () => {
      showToast.error('Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast.info('Profile image removed.');
  };

  // Validation Logic
  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    }

    if (!formData.customerCode.trim()) {
      errors.customerCode = 'Customer Code is required.';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (formData.openingBalance < 0) {
      errors.openingBalance = 'Opening balance cannot be negative.';
    }

    if (formData.creditLimit < 0) {
      errors.creditLimit = 'Credit limit cannot be negative.';
    }

    // Check unique phone and code at database level
    const dbErr = await validateCustomer(
      formData as any,
      !!initialData,
      initialData?.id
    );
    if (dbErr) {
      if (dbErr.includes('code')) {
        errors.customerCode = dbErr;
      } else if (dbErr.includes('phone')) {
        errors.phone = dbErr;
      } else {
        errors.fullName = dbErr; // generic error
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) {
      showToast.error('Please resolve validation errors before saving.');
      return;
    }

    // If updating, track modified fields and ask for confirmation
    if (initialData) {
      const modified: string[] = [];
      const keys: (keyof typeof formData)[] = [
        'customerCode',
        'customerType',
        'fullName',
        'phone',
        'alternatePhone',
        'email',
        'address',
        'city',
        'postalCode',
        'dateOfBirth',
        'gender',
        'nationalId',
        'profileImage',
        'openingBalance',
        'creditLimit',
        'status',
        'notes',
      ];

      keys.forEach((key) => {
        let initialVal: any = initialData[key];
        let currentVal: any = formData[key];

        if (key === 'dateOfBirth') {
          initialVal = initialVal ? String(initialVal).split('T')[0] : '';
        }

        if (String(initialVal || '').trim() !== String(currentVal || '').trim()) {
          // Pretty name
          const label = String(key).replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          modified.push(label);
        }
      });

      if (modified.length > 0) {
        setModifiedFieldsSummary(modified);
        setShowConfirmSave(true);
      } else {
        // No fields modified, just cancel/submit directly
        handleConfirmedSubmit();
      }
    } else {
      // Add mode: save directly
      handleConfirmedSubmit();
    }
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmSave(false);
    try {
      await onSubmit({
        ...formData,
        fullName: formData.fullName.trim(),
        customerCode: formData.customerCode.trim(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        nationalId: formData.nationalId.trim(),
        notes: formData.notes.trim(),
      } as any);
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save customer.');
    }
  };

  return (
    <>
      <form onSubmit={handlePreSubmit} className="space-y-6 text-left">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Column 1: Profile Image Drag-and-Drop */}
          <div className="lg:col-span-1 space-y-4">
            <label className="block text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Profile Picture
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all min-h-[220px] ${
                isDragOver
                  ? 'border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/15'
                  : 'border-slate-200 hover:border-indigo-500 bg-slate-50/50 dark:border-slate-800 dark:hover:border-indigo-500 dark:bg-slate-950/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {formData.profileImage ? (
                <div className="flex flex-col items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 shadow-md">
                    <img
                      src={formData.profileImage}
                      alt="Profile Preview"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="xs" onClick={triggerFileInput}>
                      Replace Image
                    </Button>
                    <Button variant="danger" size="xs" onClick={removeImage}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2 text-slate-400 dark:text-slate-500">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-indigo-500">
                    <Upload className="h-6 w-6 animate-bounce" />
                  </div>
                  <p className="text-xs font-semibold mt-2 text-slate-700 dark:text-slate-300">
                    Drag and drop profile image here
                  </p>
                  <p className="text-[10px] text-slate-400">
                    or click to browse local files (max 2MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Fields */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Code */}
            <div className="relative">
              <Input
                label="Customer Code"
                name="customerCode"
                value={formData.customerCode}
                onChange={handleInputChange}
                error={formErrors.customerCode}
                placeholder="e.g. CUS-000001"
              />
              {!initialData && (
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="absolute right-3 top-8 text-[11px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Auto
                </button>
              )}
            </div>

            {/* Customer Type */}
            <Select
              label="Customer Type"
              name="customerType"
              value={formData.customerType}
              onChange={handleInputChange}
              error={formErrors.customerType}
              options={[
                { value: 'Walk-in Customer', label: 'Walk-in Customer' },
                { value: 'Regular Customer', label: 'Regular Customer' },
                { value: 'Permanent Credit Customer', label: 'Permanent Credit Customer' },
                { value: 'Wholesale Customer', label: 'Wholesale Customer' },
                { value: 'VIP Customer', label: 'VIP Customer' },
              ]}
            />

            {/* Full Name */}
            <Input
              label="Full Name *"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              error={formErrors.fullName}
              placeholder="Enter customer name"
            />

            {/* Phone */}
            <Input
              label="Primary Phone *"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              error={formErrors.phone}
              placeholder="e.g. +1 (555) 012-3456"
            />

            {/* Alternate Phone */}
            <Input
              label="Alternate Phone"
              name="alternatePhone"
              value={formData.alternatePhone}
              onChange={handleInputChange}
              placeholder="e.g. +1 (555) 019-8765"
            />

            {/* Email */}
            <Input
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              placeholder="customer@email.com"
            />

            {/* National ID */}
            <Input
              label="National ID / Tax ID"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleInputChange}
              placeholder="e.g. ID-9982180"
            />

            {/* Gender */}
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />

            {/* Date of Birth */}
            <Input
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
            />

            {/* Status */}
            <Select
              label="Account Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Blocked', label: 'Blocked' },
              ]}
            />

            {/* Opening Balance */}
            <Input
              label="Opening Balance ($)"
              name="openingBalance"
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={handleInputChange}
              error={formErrors.openingBalance}
              disabled={!!initialData} // Balance cannot be modified via opening balance once created
              placeholder="0.00"
            />

            {/* Credit Limit */}
            <Input
              label="Credit Limit ($)"
              name="creditLimit"
              type="number"
              step="0.01"
              value={formData.creditLimit}
              onChange={handleInputChange}
              error={formErrors.creditLimit}
              placeholder="e.g. 1000.00"
            />

            {/* Address */}
            <div className="md:col-span-2">
              <Input
                label="Billing Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address, Suite, Apartment"
              />
            </div>

            {/* City */}
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="e.g. Springfield"
            />

            {/* Postal Code */}
            <Input
              label="Postal / ZIP Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="e.g. 90210"
            />

            {/* Notes */}
            <div className="md:col-span-2">
              <TextArea
                label="Internal Admin Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Special notes about pricing, credit reliability, or schedules..."
                rows={3}
              />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            <Save className="h-4 w-4" />
            Save Customer
          </Button>
        </div>
      </form>

      {/* Track Modification Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        onConfirm={handleConfirmedSubmit}
        type="warning"
        title="Confirm Updates"
        confirmText="Save Changes"
        message={`You are updating an existing customer record. The following modifications will be made:\n\n${modifiedFieldsSummary.join(', ')}\n\nAre you sure you want to proceed?`}
      />
    </>
  );
};

export default CustomerForm;
