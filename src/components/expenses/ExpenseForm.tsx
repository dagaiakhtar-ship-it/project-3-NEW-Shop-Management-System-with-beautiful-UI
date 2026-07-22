import React, { useState, useEffect } from 'react';
import { type Expense } from '../../database/db';
import ExpenseCategoryDropdown from './ExpenseCategoryDropdown';
import AttachmentUploader from './AttachmentUploader';
import RecurringSettings from './RecurringSettings';
import { FileText, DollarSign, Calendar, Landmark, CreditCard, User, Tag } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Expense | null;
  onSubmit: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'expenseNumber' | 'category'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  id?: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  id = 'expense-form',
}) => {
  // Field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [expenseDate, setExpenseDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [nextRecurringDate, setNextRecurringDate] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Voided'>('Paid');

  // Validation Error states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize fields on mount / change
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategoryId(initialData.categoryId);
      
      // Format Date to YYYY-MM-DD
      const rawDate = new Date(initialData.expenseDate);
      const formattedDate = !isNaN(rawDate.getTime())
        ? rawDate.toISOString().split('T')[0]
        : '';
      setExpenseDate(formattedDate);
      
      setPaymentMethod(initialData.paymentMethod || 'Cash');
      setReferenceNumber(initialData.referenceNumber || '');
      setVendorName(initialData.vendorName || '');
      setAttachment(initialData.attachment);
      setIsRecurring(!!initialData.isRecurring);
      setRecurringType(initialData.recurringType || 'Monthly');
      
      const rawNextDate = initialData.nextRecurringDate ? new Date(initialData.nextRecurringDate) : null;
      setNextRecurringDate(rawNextDate && !isNaN(rawNextDate.getTime()) ? rawNextDate.toISOString().split('T')[0] : '');
      
      setStatus(initialData.status || 'Paid');
    } else {
      // Defaults for creation
      setTitle('');
      setDescription('');
      setAmount('');
      setCategoryId(undefined);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Cash');
      setReferenceNumber('');
      setVendorName('');
      setAttachment(undefined);
      setIsRecurring(false);
      setRecurringType('Monthly');
      setNextRecurringDate('');
      setStatus('Paid');
    }
    setErrors({});
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Expense Title is required.';
    }
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required.';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = 'Amount must be a positive number greater than zero.';
      }
    }
    if (!categoryId) {
      newErrors.categoryId = 'Please select a valid expense category.';
    }
    if (!expenseDate) {
      newErrors.expenseDate = 'Expense date is required.';
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method.';
    }
    if (isRecurring && !nextRecurringDate) {
      newErrors.nextRecurringDate = 'Next billing/recurring date is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        categoryId: categoryId!,
        expenseDate: new Date(expenseDate),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        vendorName: vendorName.trim() || undefined,
        attachment,
        isRecurring,
        recurringType: isRecurring ? recurringType : undefined,
        nextRecurringDate: isRecurring ? new Date(nextRecurringDate) : undefined,
        status,
      };

      await onSubmit(payload);
    } catch (err: any) {
      console.error('Error submitting expense form:', err);
      setErrors(prev => ({ ...prev, form: err.message || 'Operation failed.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id={id}>
      {errors.form && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/15 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400">
          {errors.form}
        </div>
      )}

      {/* Title & Amount Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Expense Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity Bill, Stationery Purchase..."
              className={`w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border ${
                errors.title
                  ? 'border-rose-500 ring-2 ring-rose-500/10'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600'
              } rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15`}
              id={`${id}-title`}
              required
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          {errors.title && <p className="text-xs font-semibold text-rose-500 mt-1.5">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Amount (USD) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border ${
                errors.amount
                  ? 'border-rose-500 ring-2 ring-rose-500/10'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600'
              } rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15`}
              id={`${id}-amount`}
              required
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          {errors.amount && <p className="text-xs font-semibold text-rose-500 mt-1.5">{errors.amount}</p>}
        </div>
      </div>

      {/* Category & Date Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpenseCategoryDropdown
          selectedId={categoryId}
          onChange={(id) => setCategoryId(id)}
          error={errors.categoryId}
          id={`${id}-category`}
        />

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Expense Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className={`w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border ${
                errors.expenseDate
                  ? 'border-rose-500 ring-2 ring-rose-500/10'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600'
              } rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15`}
              id={`${id}-date`}
              required
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          {errors.expenseDate && <p className="text-xs font-semibold text-rose-500 mt-1.5">{errors.expenseDate}</p>}
        </div>
      </div>

      {/* Payment Details & Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Payment Method <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 appearance-none cursor-pointer"
              id={`${id}-payment-method`}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Mobile Pay">Mobile Pay</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Reference / Receipt No.
          </label>
          <div className="relative">
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-102930, Check No..."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              id={`${id}-ref-no`}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Vendor / Payee Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Office Depot, Power Co."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              id={`${id}-vendor`}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Expense Notes / Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details regarding this expenditure..."
          rows={3}
          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 resize-none"
          id={`${id}-desc`}
        />
      </div>

      {/* Status Field (Paid / Pending / Voided) */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Expense Status
        </label>
        <div className="flex gap-4">
          {['Paid', 'Pending', 'Voided'].map((statusOption) => (
            <label
              key={statusOption}
              className={`flex-1 flex items-center justify-center h-11 border rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                status === statusOption
                  ? statusOption === 'Paid'
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/15'
                    : statusOption === 'Pending'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/15'
                    : 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
              }`}
              id={`${id}-status-${statusOption.toLowerCase()}`}
            >
              <input
                type="radio"
                name="status"
                value={statusOption}
                checked={status === statusOption}
                onChange={() => setStatus(statusOption as any)}
                className="sr-only"
              />
              {statusOption}
            </label>
          ))}
        </div>
      </div>

      {/* Recurring Settings Component */}
      <RecurringSettings
        isRecurring={isRecurring}
        recurringType={recurringType}
        nextRecurringDate={nextRecurringDate}
        onChangeRecurring={setIsRecurring}
        onChangeType={setRecurringType}
        onChangeDate={setNextRecurringDate}
        id={`${id}-recurring`}
      />

      {/* Attachment Uploader */}
      <AttachmentUploader value={attachment} onChange={setAttachment} id={`${id}-uploader`} />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-11 px-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-500/15 disabled:opacity-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-8 bg-indigo-600 dark:bg-indigo-500 text-sm font-bold text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50 transition-all shadow-sm shadow-indigo-500/10 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Expense' : 'Record Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
