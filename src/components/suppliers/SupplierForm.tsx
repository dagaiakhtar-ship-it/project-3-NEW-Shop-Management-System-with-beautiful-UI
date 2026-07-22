import React, { useState, useEffect } from 'react';
import { Sparkles, Save, X, RotateCcw } from 'lucide-react';
import { type Supplier } from '../../database/db';
import { generateNextSupplierCode, validateSupplier } from '../../database/supplierHelper';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import showToast from '../../utils/toast';

interface SupplierFormProps {
  initialData?: Supplier | null;
  onSubmit: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    supplierCode: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    website: '',
    taxNumber: '',
    openingBalance: 0,
    paymentTerms: 'Net 30',
    notes: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Initialize or generate code
  useEffect(() => {
    if (initialData) {
      setFormData({
        supplierCode: initialData.supplierCode || '',
        companyName: initialData.companyName || '',
        contactPerson: initialData.contactPerson || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        country: initialData.country || '',
        postalCode: initialData.postalCode || '',
        website: initialData.website || '',
        taxNumber: initialData.taxNumber || '',
        openingBalance: initialData.openingBalance || 0,
        paymentTerms: initialData.paymentTerms || 'Net 30',
        notes: initialData.notes || '',
        status: (initialData.status as any) === 'Inactive' ? 'Inactive' : 'Active',
      });
    } else {
      // Add mode: auto-generate supplier code
      handleRegenerateCode();
    }
  }, [initialData]);

  const handleRegenerateCode = async () => {
    try {
      const code = await generateNextSupplierCode();
      setFormData((prev) => ({ ...prev, supplierCode: code }));
    } catch (err) {
      console.error('Failed to generate supplier code:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'openingBalance' ? Math.max(0, Number(value)) : value,
    }));

    // Clear specific error as user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    }
    if (!formData.supplierCode.trim()) {
      errors.supplierCode = 'Supplier code is required.';
    }
    if (formData.openingBalance < 0) {
      errors.openingBalance = 'Opening balance cannot be negative.';
    }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }
    if (formData.website.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
      if (!urlPattern.test(formData.website.trim())) {
        errors.website = 'Please enter a valid website URL.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast.error('Please resolve the form errors first.');
      return;
    }

    try {
      // Standard database check before submit to prevent unhandled Dexie unique indexing crash
      const validationErrorMsg = await validateSupplier(
        formData,
        !!initialData,
        initialData?.id
      );

      if (validationErrorMsg) {
        if (validationErrorMsg.includes('code')) {
          setFormErrors((prev) => ({ ...prev, supplierCode: validationErrorMsg }));
        } else if (validationErrorMsg.includes('phone')) {
          setFormErrors((prev) => ({ ...prev, phone: validationErrorMsg }));
        }
        showToast.error(validationErrorMsg);
        return;
      }

      await onSubmit(formData);
    } catch (err: any) {
      showToast.error(err.message || 'An error occurred while saving the supplier.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Core Identity & Contact */}
        <div className="space-y-6">
          {/* Card: Core Identity */}
          <div className="p-5 rounded-2xl border border-slate-150/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-left">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
              1. Supplier Identity
            </h3>
            
            <div className="space-y-4">
              {/* Supplier Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Supplier Code <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="supplierCode"
                      name="supplierCode"
                      value={formData.supplierCode}
                      onChange={handleInputChange}
                      placeholder="e.g. SUP-000001"
                      className={`pr-10 ${formErrors.supplierCode ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                    />
                  </div>
                  {!initialData && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerateCode}
                      title="Re-generate Sequential Code"
                      className="px-3"
                    >
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                    </Button>
                  )}
                </div>
                {formErrors.supplierCode && (
                  <span className="text-[10px] font-semibold text-rose-500">{formErrors.supplierCode}</span>
                )}
              </div>

              {/* Company Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Company / Vendor Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Wholesale Corp"
                  className={formErrors.companyName ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.companyName && (
                  <span className="text-[10px] font-semibold text-rose-500">{formErrors.companyName}</span>
                )}
              </div>

              {/* Contact Person */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Primary Contact Person
                </label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe (Procurement Manager)"
                />
              </div>

              {/* Tax / VAT / Business License Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Tax / VAT Registration Number
                </label>
                <Input
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. TAX-987654321"
                />
              </div>
            </div>
          </div>

          {/* Card: Primary Communications */}
          <div className="p-5 rounded-2xl border border-slate-150/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-left">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
              2. Communication Details
            </h3>

            <div className="space-y-4">
              {/* Phone & Alternate Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    Telephone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={formErrors.phone ? 'border-rose-500 focus:ring-rose-500' : ''}
                  />
                  {formErrors.phone && (
                    <span className="text-[10px] font-semibold text-rose-500">{formErrors.phone}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    Alt. Phone / Fax
                  </label>
                  <Input
                    id="alternatePhone"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1 (555) 019-2835"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Corporate Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. sales@acmewholesale.com"
                  className={formErrors.email ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.email && (
                  <span className="text-[10px] font-semibold text-rose-500">{formErrors.email}</span>
                )}
              </div>

              {/* Website URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Corporate Website
                </label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="e.g. www.acmewholesale.com"
                  className={formErrors.website ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.website && (
                  <span className="text-[10px] font-semibold text-rose-500">{formErrors.website}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Location & Financials */}
        <div className="space-y-6">
          {/* Card: Location Details */}
          <div className="p-5 rounded-2xl border border-slate-150/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-left">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
              3. Geographic & Address Details
            </h3>

            <div className="space-y-4">
              {/* Street Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Office Street Address
                </label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 123 Wholesale Blvd, Suite 400"
                />
              </div>

              {/* City & Country & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    City
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. New York"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    Country
                  </label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="e.g. USA"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    Postal Code
                  </label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="e.g. 10001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Financial Profile */}
          <div className="p-5 rounded-2xl border border-slate-150/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-left">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">
              4. Credit, Balances, & Terms
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opening Balance */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    Opening Balance (USD)
                  </label>
                  <Input
                    id="openingBalance"
                    name="openingBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.openingBalance}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={formErrors.openingBalance ? 'border-rose-500 focus:ring-rose-500' : ''}
                    disabled={!!initialData} // Usually Opening Balance is fixed upon entry
                  />
                  {formErrors.openingBalance && (
                    <span className="text-[10px] font-semibold text-rose-500">{formErrors.openingBalance}</span>
                  )}
                  {!!initialData && (
                    <span className="text-[9px] font-semibold text-slate-400">
                      Opening balance cannot be edited after creation.
                    </span>
                  )}
                </div>

                {/* Payment Terms */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    Payment Terms
                  </label>
                  <select
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer h-[38px]"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Vendor Activity Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer h-[38px]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Supplier Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Internal Procurement Notes
                </label>
                <TextArea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="e.g. Lead times are 4 days. Contact Sarah for emergency orders."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-5 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          <X className="h-4 w-4 mr-1.5" />
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
          className="shadow-md cursor-pointer"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isSubmitting ? 'Saving Vendor...' : 'Save Supplier Entry'}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
