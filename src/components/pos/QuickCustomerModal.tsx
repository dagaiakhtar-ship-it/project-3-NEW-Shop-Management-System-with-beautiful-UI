import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, ShieldCheck, Mail, Phone, CreditCard, User } from 'lucide-react';
import { addCustomer, generateNextCustomerCode } from '../../database/customerHelper';
import { type Customer } from '../../database/db';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import showToast from '../../utils/toast';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<'Walk-in Customer' | 'Regular Customer' | 'Permanent Credit Customer' | 'VIP Customer'>('Regular Customer');
  const [creditLimit, setCreditLimit] = useState(1000);
  const [customerCode, setCustomerCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateNextCustomerCode().then((code) => setCustomerCode(code));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast.error('Customer Full Name is required.');
      return;
    }
    if (!phone.trim()) {
      showToast.error('Customer Phone Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addCustomer({
        customerCode,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        customerType,
        openingBalance: 0,
        currentBalance: 0,
        creditLimit: Number(creditLimit) || 0,
        status: 'Active',
      });
      showToast.success(`Successfully registered: "${result.fullName}"`);
      onCustomerAdded(result);
      onClose();
    } catch (err: any) {
      showToast.error(err.message || 'Failed to quickly register customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Animated Card Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-full max-w-md pos-modal-container rounded-2xl bg-white dark:bg-slate-950 p-6 text-left shadow-2xl border border-slate-150 dark:border-slate-800 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3.5 mb-4">
              <h2 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <UserPlus className="h-4.5 w-4.5 text-indigo-500" />
                Quick Customer registration
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Customer Code</span>
                  <div className="w-full py-2.5 px-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-550 dark:text-slate-400 font-mono text-xs font-semibold">
                    {customerCode}
                  </div>
                </div>

                <Select
                  label="Customer Type"
                  value={customerType}
                  onChange={(e: any) => setCustomerType(e.target.value)}
                  options={[
                    { value: 'Regular Customer', label: 'Regular Customer' },
                    { value: 'VIP Customer', label: 'VIP Customer' },
                    { value: 'Permanent Credit Customer', label: 'Permanent Credit' },
                  ]}
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Full Name *</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Hammad Khan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 pos-input pos-input-text text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-150 transition-all placeholder-slate-440"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Phone Number *</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="+92 (300) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 pos-input pos-input-text text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-150 transition-all placeholder-slate-440"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="hammad@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 pos-input pos-input-text text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-800 dark:text-slate-150 transition-all placeholder-slate-440"
                  />
                </div>
              </div>

              {/* Permanent limit input */}
              {customerType === 'Permanent Credit Customer' && (
                <div className="flex flex-col gap-1 animate-in slide-in-from-top-1 duration-200">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Credit Limit Max ($)</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      placeholder="1000"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 pos-input pos-input-text text-xs font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-850 dark:text-slate-150 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-850">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                  Register Customer
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickCustomerModal;
