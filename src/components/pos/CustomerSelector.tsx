import React, { useState, useEffect, useRef } from 'react';
import { Search, User, UserPlus, X, CreditCard, ShieldCheck, Phone, MessageSquare } from 'lucide-react';
import { db, type Customer } from '../../database/db';
import QuickCustomerModal from './QuickCustomerModal';
import Button from '../ui/Button';
import showToast from '../../utils/toast';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      const results = await db.customers
        .filter((c) => !c.isDeleted && c.status === 'Active')
        .toArray();
      results.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setAllCustomers(results);
    };
    fetchAllCustomers();
  }, [showQuickAdd, selectedCustomer]);

  useEffect(() => {
    // Click outside to close dropdown suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search in database
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchCustomers = async () => {
      const results = await db.customers
        .filter((c) => {
          return (
            !c.isDeleted &&
            c.status === 'Active' &&
            (c.fullName.toLowerCase().includes(search.toLowerCase()) ||
              c.phone.includes(search))
          );
        })
        .limit(5)
        .toArray();
      setSuggestions(results);
    };

    fetchCustomers();
  }, [search]);

  const handleSelect = (cust: Customer) => {
    onSelectCustomer(cust);
    setSearch('');
    setIsOpen(false);
    showToast.success(`Selected customer: "${cust.fullName}"`);
  };

  const handleClear = () => {
    onSelectCustomer(null);
  };

  // Helper to extract initials for customer avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Quick Action triggers
  const handleWhatsApp = (phoneNum: string, name: string) => {
    const message = `Hello ${name}, this is a message regarding your purchase at our shop.`;
    const encoded = encodeURIComponent(message);
    const cleaned = phoneNum.replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${cleaned}?text=${encoded}`, '_blank');
  };

  const handlePhoneCall = (phoneNum: string) => {
    const cleaned = phoneNum.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleaned}`;
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-left relative transition-all">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-855 pb-2.5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-4.5 w-4.5 text-indigo-500" />
          Customer Panel
        </h3>
        
        {!selectedCustomer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-extrabold hover:bg-indigo-50/50 hover:text-indigo-700 duration-150 h-8 px-2 rounded-lg text-[11px]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Quick Add
          </Button>
        )}
      </div>

      {selectedCustomer ? (
        /* Selected customer info badge */
        <div className="flex flex-col gap-3 bg-gradient-to-br from-indigo-50/10 to-indigo-100/5 dark:from-indigo-950/15 dark:to-indigo-900/5 border border-indigo-100 dark:border-indigo-900/40 p-3.5 rounded-xl relative overflow-hidden transition-all">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Initials Avatar */}
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                {getInitials(selectedCustomer.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 truncate leading-tight flex items-center gap-1">
                  {selectedCustomer.fullName}
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                </p>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  ID: {selectedCustomer.customerCode} | {selectedCustomer.phone}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-400 hover:text-rose-500 transition duration-150 shrink-0 cursor-pointer"
              title="Remove customer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Quick WhatsApp & Phone Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleWhatsApp(selectedCustomer.phone, selectedCustomer.fullName)}
              className="flex-1 h-9 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/30 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/20 transition duration-150 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Message customer on WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              onClick={() => handlePhoneCall(selectedCustomer.phone)}
              className="flex-1 h-9 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/30 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/20 transition duration-150 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Call customer"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </button>
          </div>

          {/* Outstanding Balance vs Credit Limits */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-indigo-100/50 dark:border-indigo-900/20">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-indigo-50/50 dark:border-indigo-900/25">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balance</span>
              <span className={`text-xs font-extrabold font-mono block mt-0.5 ${
                (selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                ${(selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0).toFixed(2)}
              </span>
            </div>

            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-indigo-50/50 dark:border-indigo-900/25">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit limit</span>
              <span className="text-xs font-extrabold font-mono block mt-0.5 text-indigo-600 dark:text-indigo-400">
                ${(selectedCustomer.creditLimit ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Walk-in default and search */
        <div className="flex flex-col gap-2.5">
          {/* Top-down dropdown select list */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Select Registered Customer</label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const found = allCustomers.find(c => String(c.id) === val);
                  if (found) {
                    onSelectCustomer(found);
                    showToast.success(`Selected customer: "${found.fullName}"`);
                  }
                } else {
                  onSelectCustomer(null);
                }
              }}
              className="w-full h-8.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 cursor-pointer transition-all shadow-2xs"
            >
              <option value="">👤 Walk-In Customer</option>
              {allCustomers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.fullName} ({cust.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="customer-search-input"
              type="text"
              className="w-full h-8.5 pl-9 pr-3 text-xs font-bold rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 placeholder-slate-400 transition-all shadow-2xs"
              placeholder="Search or barcode input..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />

            {/* Suggestions Dropdown relative to input wrapper */}
            {isOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-25 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {suggestions.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => handleSelect(cust)}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/80 transition flex items-center justify-between gap-3 border-b border-slate-50 last:border-0 dark:border-slate-850"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                        {cust.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        Phone: {cust.phone} | Type: {cust.customerType}
                      </p>
                    </div>
                    {(cust.currentBalance ?? cust.balance ?? 0) > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                        ${(cust.currentBalance ?? cust.balance ?? 0).toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Walk-in Customer fallback */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Assigned: Walk-In Customer
            </p>
          </div>
        </div>
      )}

      {/* Quick registration modal */}
      <QuickCustomerModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCustomerAdded={(c) => onSelectCustomer(c)}
      />
    </div>
  );
};

export default CustomerSelector;
