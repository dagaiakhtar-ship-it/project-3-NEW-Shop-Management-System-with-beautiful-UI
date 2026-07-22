import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  User,
  Phone,
  DollarSign,
  X,
  UserPlus,
  Search,
  Check,
  Loader2,
  Calendar,
  ShieldCheck,
  Tag,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { type Customer } from '../../../database/db';
import QuickCustomerModal from '../QuickCustomerModal';
import { useReceivePayment } from '../../../hooks/useCredit';
import showToast from '../../../utils/toast';
import { db } from '../../../database/db';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerCardProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  allCustomers: Customer[];
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  selectedCustomer,
  onSelectCustomer,
  allCustomers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Direct loan payments states
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanMethod, setLoanMethod] = useState<string>('Cash');
  const [isPayingLoan, setIsPayingLoan] = useState(false);

  const { submitPayment } = useReceivePayment();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter customers for dropdown list
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return allCustomers.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(q))
    );
  }, [allCustomers, searchQuery]);

  // Handle direct loan payment submission
  const handleLoanPaymentSubmit = async () => {
    if (!selectedCustomer) return;
    if (loanAmount <= 0) {
      showToast.error('Please enter a valid loan payment amount.');
      return;
    }
    const currentOutstanding = selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0;
    if (loanAmount > currentOutstanding) {
      showToast.error(`Payment amount cannot exceed outstanding balance of $${currentOutstanding.toFixed(2)}.`);
      return;
    }

    setIsPayingLoan(true);
    try {
      const res = await submitPayment({
        customerId: selectedCustomer.id!,
        totalAmount: loanAmount,
        paymentMethod: loanMethod,
        notes: 'POS direct loan payment',
        allocationType: 'auto',
      });

      if (res.success) {
        // Refresh customer details to show updated balance
        const updatedCustomer = await db.customers.get(selectedCustomer.id!);
        if (updatedCustomer) {
          onSelectCustomer(updatedCustomer);
        }
        setLoanAmount(0);
        setShowLoanForm(false);
        showToast.success('Direct loan payment recorded successfully!');
      }
    } catch (err) {
      console.error('Direct loan payment failed:', err);
      showToast.error('Failed to post direct loan payment.');
    } finally {
      setIsPayingLoan(false);
    }
  };

  // Helper to resolve name initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const outstandingBalance = selectedCustomer
    ? selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0
    : 0;

  // WhatsApp helper URL builder
  const whatsappUrl = selectedCustomer?.phone
    ? `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`
    : undefined;

  // Format date helper
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] p-3.5 shadow-xs text-left flex flex-col gap-3 relative select-none"
      id="pos-customer-card"
    >
      {/* 1. Top Section - CRM customer banner */}
      <div className="flex justify-between items-center shrink-0">
        <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Customer CRM Assignment</span>
        </h3>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2">
          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="h-[32px] px-3 bg-indigo-600/10 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/15 dark:hover:bg-indigo-900/40 transition-colors font-extrabold text-[12px] rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs"
            id="customer-quick-add-btn"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Customer Content Body (Autocomplete Search OR Active Premium CRM Card) */}
      {!selectedCustomer ? (
        <div className="relative w-full text-left" ref={dropdownRef} id="customer-select-autocomplete">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              id="customer-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search or Link Customer account..."
              className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13.5px] text-slate-900 dark:text-slate-100 placeholder-slate-455 font-medium outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Elegant Dropdown Autocomplete menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] shadow-lg z-50 overflow-hidden max-h-[220px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 text-[13px] font-medium"
              >
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(c);
                        setDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer flex justify-between items-center gap-3 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{c.fullName}</p>
                        <p className="text-[11.5px] text-slate-550 dark:text-slate-400 truncate mt-0.5">{c.phone || 'No Phone Number'}</p>
                      </div>
                      {(c.currentBalance ?? c.balance ?? 0) > 0 ? (
                        <span className="text-[11px] font-extrabold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/15 px-2.5 py-0.5 rounded-full font-mono">
                          ${(c.currentBalance ?? c.balance ?? 0).toFixed(2)} loan
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/15 px-2.5 py-0.5 rounded-full">
                          clean
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-center text-slate-500 dark:text-slate-400 font-bold flex flex-col items-center justify-center gap-1">
                    <span>No registered customer found</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setQuickAddOpen(true);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 text-[12px] hover:underline cursor-pointer font-extrabold mt-1"
                    >
                      Click here to add one
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Redesigned Premium Active Customer CRM Card */
        <div className="flex flex-col gap-4 animate-in fade-in zoom-in-98 duration-150">
          <div
            className="flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-850/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-200"
            id="pos-customer-profile-info"
          >
            {/* Customer Avatar & Membership Initials */}
            <div className="h-10 w-10 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-black text-[14px] shrink-0 shadow-3xs border border-indigo-500/20">
              {getInitials(selectedCustomer.fullName)}
            </div>

            {/* Profile Info & WhatsApp Direct trigger icon */}
            <div className="flex flex-col justify-center min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 truncate leading-none">
                  {selectedCustomer.fullName}
                </span>

                {/* Membership Badge */}
                <span className="px-1.5 py-0.5 bg-indigo-600/10 dark:bg-indigo-950/40 border border-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[9.5px] font-extrabold rounded-full uppercase leading-none tracking-wide select-none">
                  {selectedCustomer.customerType?.split(' ')[0] || 'Regular'}
                </span>
              </div>

              {/* Phone, WhatsApp Icon link */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 truncate">
                  <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <span>{selectedCustomer.phone || 'No Phone'}</span>
                </span>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/15 transition-all shadow-3xs flex items-center justify-center"
                    title="WhatsApp Chat"
                  >
                    <svg
                      className="h-3.5 w-3.5 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.114.957 11.5.954c-5.442 0-9.863 4.372-9.867 9.802-.001 1.714.463 3.39 1.339 4.869l-.93 3.394 3.483-.903c1.47.801 2.977 1.238 4.562 1.238zm10.902-7.462c-.29-.145-1.716-.838-1.983-.935-.266-.096-.46-.145-.653.145-.193.29-.747.935-.916 1.129-.168.193-.338.217-.627.072-1.353-.615-2.28-1.082-3.182-2.617-.24-.41.24-.38.687-1.263.072-.145.036-.27-.018-.38-.054-.108-.46-1.12-.63-1.527-.165-.399-.333-.344-.46-.35-.119-.006-.256-.007-.393-.007-.137 0-.36.051-.55.256-.188.205-.72.696-.72 1.697 0 1.002.74 1.972.84 2.107.1.137 1.456 2.202 3.527 3.085.493.21 1.014.35 1.393.47.498.15.952.129 1.312.077.4-.058 1.716-.696 1.956-1.37.24-.675.24-1.253.168-1.37-.071-.116-.265-.213-.556-.358z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Un-assign / Change customer Button */}
            <button
              type="button"
              onClick={() => {
                onSelectCustomer(null);
                setShowLoanForm(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              title="De-assign customer"
            >
              <X className="h-4.5 w-4.5 stroke-[2.2]" />
            </button>
          </div>

          {/* CRM Account Notes Display (Only if note exists) */}
          {selectedCustomer.notes && (
            <div className="text-[12.5px] bg-slate-50 dark:bg-slate-850 border-l-4 border-indigo-600 dark:border-l-indigo-400 px-3.5 py-2 rounded-r-lg font-medium text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wider mb-0.5">Customer Notes</span>
              <p className="italic leading-relaxed">"{selectedCustomer.notes}"</p>
            </div>
          )}

          {/* Outstanding Loan Metric Blocks - RED if due, GREEN if clean */}
          <div className="grid grid-cols-2 gap-3 text-[12.5px] font-bold">
            {/* Outstanding Loan Block */}
            <div
              className={`text-left px-3.5 py-2.5 rounded-xl border ${
                outstandingBalance > 0
                  ? 'bg-rose-500/5 border-rose-500/10 text-[#DC2626]'
                  : 'bg-[#22C55E]/5 border-[#22C55E]/10 text-[#16A34A]'
              }`}
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                Outstanding Loan
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {outstandingBalance > 0 ? (
                  <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-[#16A34A] shrink-0" />
                )}
                <span className="font-mono font-black text-[15.5px]">
                  ${outstandingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Credit Limit Limit */}
            <div className="text-left bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                Max Credit Limit
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-[15.5px] block mt-1.5">
                {selectedCustomer.creditLimit ? `$${selectedCustomer.creditLimit.toFixed(2)}` : 'No Limit'}
              </span>
            </div>
          </div>

          {/* Membership Date Block */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
            <span className="flex items-center gap-1 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Account Created
            </span>
            <span className="font-mono text-slate-900 dark:text-slate-100">
              {formatDate(selectedCustomer.createdAt)}
            </span>
          </div>

          {/* Quick Pay Outstanding loan pay counter (if has outstanding credit balance) */}
          {outstandingBalance > 0 && (
            <div className="rounded-xl border border-dashed border-indigo-500/35 bg-indigo-500/5 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <DollarSign className="h-3.5 w-3.5 stroke-[2.5]" />
                  Receive Credit Loan Pay
                </span>
                {!showLoanForm && (
                  <button
                    type="button"
                    onClick={() => setShowLoanForm(true)}
                    className="text-[12px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Post Payment
                  </button>
                )}
              </div>

              {showLoanForm && (
                <div className="flex flex-col gap-3 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Amount ($)</span>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={loanAmount || ''}
                        onChange={(e) => setLoanAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                        className="w-full h-9 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[13px] font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Method</span>
                      <select
                        value={loanMethod}
                        onChange={(e) => setLoanMethod(e.target.value)}
                        className="w-full h-9 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[12px] font-bold text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
                      >
                        <option value="Cash">💵 Cash</option>
                        <option value="Card">💳 Card</option>
                        <option value="EasyPaisa">📱 EasyPaisa</option>
                        <option value="JazzCash">📲 JazzCash</option>
                        <option value="Bank">🏦 Bank</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoanForm(false);
                        setLoanAmount(0);
                      }}
                      className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLoanPaymentSubmit}
                      disabled={isPayingLoan || loanAmount <= 0}
                      className="h-8.5 px-4 text-[11.5px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-3xs dark:bg-indigo-600 dark:hover:bg-indigo-700"
                    >
                      {isPayingLoan ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Post</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Customer Registration Modal Popup */}
      <QuickCustomerModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCustomerAdded={(newCust) => {
          onSelectCustomer(newCust);
          showToast.success(`Assigned quick-add customer: "${newCust.fullName}"`);
        }}
      />
    </div>
  );
};

export default React.memo(CustomerCard);
