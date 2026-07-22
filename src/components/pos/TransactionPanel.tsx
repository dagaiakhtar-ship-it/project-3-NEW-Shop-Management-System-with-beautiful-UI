import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, UserPlus, ShoppingCart as CartIcon, Trash2, Tag, Percent, 
  Truck, DollarSign, CreditCard, Check, Printer, AlertTriangle, 
  ArrowRight, Phone, MessageSquare, Plus, Minus, X
} from 'lucide-react';
import { db, type Customer } from '../../database/db';
import { type CartItem as ICartItem } from '../../hooks/useCart';
import { useReceivePayment } from '../../hooks/useCredit';
import CartItem from './CartItem';
import QuickCustomerModal from './QuickCustomerModal';
import Button from '../ui/Button';
import showToast from '../../utils/toast';

interface TransactionPanelProps {
  // Customer Selector
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;

  // Shopping Cart
  cartItems: ICartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;

  // Order adjustments
  orderDiscount: number;
  setOrderDiscount: (val: number) => void;
  orderTax: number;
  setOrderTax: (val: number) => void;
  shipping: number;
  setShipping: (val: number) => void;
  otherCharges: number;
  setOtherCharges: (val: number) => void;
  totals: {
    subtotal: number;
    totalDiscount: number;
    tax: number;
    shipping: number;
    otherCharges: number;
    grandTotal: number;
  };

  // Checkout actions
  onCheckout: (billing: {
    paidAmount: number;
    remainingAmount: number;
    cashReceived: number;
    changeReturned: number;
    paymentMethod: string;
    saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
    notes?: string;
    printFormat: 'thermal' | 'a4' | 'none';
  }) => void;
  isProcessing: boolean;
}

export const TransactionPanel: React.FC<TransactionPanelProps> = ({
  selectedCustomer,
  onSelectCustomer,
  cartItems,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
  onClear,
  orderDiscount,
  setOrderDiscount,
  orderTax,
  setOrderTax,
  shipping,
  setShipping,
  otherCharges,
  setOtherCharges,
  totals,
  onCheckout,
  isProcessing,
}) => {
  // Customer selection states
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Adjustment accordion toggle
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Payment states
  const [saleType, setSaleType] = useState<'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale'>('Cash Sale');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4' | 'none'>('thermal');

  // Direct Loan/Credit Payment states
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanPayAmount, setLoanPayAmount] = useState<number>(0);
  const [loanPayMethod, setLoanPayMethod] = useState<string>('Cash');
  const [isPayingLoan, setIsPayingLoan] = useState(false);
  
  // High-fidelity loan confirmation modal state
  const [showLoanConfirm, setShowLoanConfirm] = useState(false);

  const { submitPayment } = useReceivePayment();

  const handlePostLoanPayment = async () => {
    if (!selectedCustomer) return;
    if (loanPayAmount <= 0) {
      showToast.error('Please enter a valid loan payment amount.');
      return;
    }
    const currentOutstanding = (selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0);
    if (loanPayAmount > currentOutstanding) {
      showToast.error(`Payment amount cannot exceed outstanding balance of $${currentOutstanding.toFixed(2)}.`);
      return;
    }

    setIsPayingLoan(true);
    try {
      const res = await submitPayment({
        customerId: selectedCustomer.id!,
        totalAmount: loanPayAmount,
        paymentMethod: loanPayMethod,
        notes: 'POS direct loan payment',
        allocationType: 'auto',
      });

      if (res.success) {
        // Refresh customer details to show updated balance
        const updatedCustomer = await db.customers.get(selectedCustomer.id!);
        if (updatedCustomer) {
          onSelectCustomer(updatedCustomer);
        }
        setLoanPayAmount(0);
        setShowLoanForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPayingLoan(false);
    }
  };

  // Load all customers for select list
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

  // Sync payment amounts when saleType, grandTotal, or cashReceived changes
  useEffect(() => {
    if (saleType === 'Cash Sale') {
      setPaidAmount(totals.grandTotal);
      if (cashReceived < totals.grandTotal) {
        setCashReceived(totals.grandTotal);
      }
    } else if (saleType === 'Credit Sale') {
      setPaidAmount(0);
      setCashReceived(0);
    } else if (saleType === 'Partial Payment Sale') {
      const applied = Math.min(cashReceived, totals.grandTotal);
      setPaidAmount(applied);
    }
  }, [saleType, totals.grandTotal, cashReceived]);

  const remainingAmount = Math.max(0, totals.grandTotal - paidAmount);
  const changeReturned = cashReceived > paidAmount ? cashReceived - paidAmount : 0;

  // Cart counting
  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const triggerCheckout = () => {
    onCheckout({
      paidAmount,
      remainingAmount,
      cashReceived,
      changeReturned,
      paymentMethod,
      saleType,
      notes,
      printFormat,
    });
  };

  const handleCheckoutSubmit = () => {
    if ((saleType === 'Credit Sale' || saleType === 'Partial Payment Sale') && selectedCustomer) {
      setShowLoanConfirm(true);
    } else {
      triggerCheckout();
    }
  };

  const isCheckoutDisabled =
    isProcessing ||
    totals.grandTotal <= 0 ||
    ((saleType === 'Credit Sale' || saleType === 'Partial Payment Sale') && !selectedCustomer) ||
    (saleType === 'Credit Sale' && selectedCustomer && (selectedCustomer.creditLimit ?? 0) > 0 && remainingAmount > (selectedCustomer.creditLimit ?? 0));

  return (
    <div id="unified-transaction-panel" className="flex flex-col gap-7.5 bg-slate-50/20 dark:bg-slate-950/40 p-7.5 border border-slate-200 dark:border-slate-850 rounded-3xl shadow-md text-left transition-all">
      
      {/* SECTION 1: CUSTOMER SELECTION */}
      <div className="flex flex-col gap-4 pb-5 border-b border-slate-200 dark:border-slate-850">
        <div className="flex items-center justify-between">
          <span className="pos-section-title text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <User className="pos-icon-normal h-5 w-5 text-indigo-500" />
            Customer assignment
          </span>
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="text-[14px] font-extrabold text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 flex items-center gap-1.5 cursor-pointer transition-all duration-150"
          >
            <UserPlus className="h-4 w-4" />
            Quick Add
          </button>
        </div>

        {selectedCustomer ? (
          /* Selected Customer Profile Card with Immediate Outstanding and Credit Limit Display */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-100/40 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 text-sm font-black border border-indigo-100 dark:border-indigo-900/40">
                    {getInitials(selectedCustomer.fullName)}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="pos-normal-text text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">
                      {selectedCustomer.fullName}
                    </p>
                    <p className="pos-small-text text-[12.5px] font-medium text-slate-450 dark:text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Phone className="h-3.5 w-3.5 inline shrink-0 text-slate-400" />
                      {selectedCustomer.phone || 'No Phone'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomer(null);
                    setShowLoanForm(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer transition-all duration-150"
                  title="Clear selected customer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[12.5px] font-bold">
                <div className="text-left">
                  <span className="pos-small-text text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Outstanding Credit</span>
                  <span className={`font-mono font-extrabold pos-price text-[15.5px] ${(selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-slate-500'}`}>
                    ${(selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="pos-small-text text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Credit Limit</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-extrabold pos-price text-[15.5px]">
                    {selectedCustomer.creditLimit ? `$${selectedCustomer.creditLimit.toFixed(2)}` : 'Unlimited'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Loan/Credit Payment option */}
            {(selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) > 0 && (
              <div className="rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/10 dark:bg-indigo-950/10 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-indigo-500" />
                    Receive Loan Payment
                  </span>
                  {!showLoanForm && (
                    <button
                      type="button"
                      onClick={() => setShowLoanForm(true)}
                      className="text-[12.5px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Pay Now
                    </button>
                  )}
                </div>

                {showLoanForm && (
                  <div className="flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex flex-col gap-1.5 text-left">
                        <span className="text-[12px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Amount ($)</span>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={loanPayAmount || ''}
                          onChange={(e) => setLoanPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="0.00"
                          className="w-full h-[46px] px-3.5 pos-input pos-input-text bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 text-left">
                        <span className="text-[12px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Method</span>
                        <select
                          value={loanPayMethod}
                          onChange={(e) => setLoanPayMethod(e.target.value)}
                          className="w-full h-[46px] px-3.5 pos-input pos-input-text bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        >
                          <option value="Cash">💵 Cash</option>
                          <option value="Card">💳 Card</option>
                          <option value="EasyPaisa">📱 EasyPaisa</option>
                          <option value="JazzCash">📲 JazzCash</option>
                          <option value="Bank">🏦 Bank</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLoanForm(false);
                          setLoanPayAmount(0);
                        }}
                        className="text-[13px] font-extrabold text-slate-450 hover:text-slate-650 cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePostLoanPayment}
                        disabled={isPayingLoan || loanPayAmount <= 0}
                        className="px-4.5 py-2.5 text-[12px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                      >
                        {isPayingLoan ? 'Posting...' : 'Post Payment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Dropdown Customer Selector */
          <select
            id="customer-search-input"
            value=""
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
            className="w-full h-[52px] px-4 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl text-[15px] font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer transition-all shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
          >
            <option value="">👤 -- Walk-In Customer (Default) --</option>
            {allCustomers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.fullName} {cust.phone ? `(${cust.phone})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* SECTION 2: ACTIVE CART */}
      <div className="flex flex-col gap-4.5 pb-5 border-b border-slate-200 dark:border-slate-850">
        <div className="flex items-center justify-between">
          <span className="pos-section-title text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <CartIcon className="pos-icon-normal h-5 w-5 text-indigo-500" />
            Shopping Cart
            <span className="ml-2 px-3.5 py-1 rounded-full text-[13px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-350 font-mono border border-indigo-100 dark:border-indigo-900">
              {totalItemCount} items
            </span>
          </span>
          {cartItems.length > 0 && (
            <button
              onClick={onClear}
              className="text-[14px] font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="h-4.5 w-4.5" />
              Clear All
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/20">
            <p className="text-[15px] font-bold text-slate-750 dark:text-slate-300">No products added yet.</p>
            <p className="text-[13px] text-slate-450 dark:text-slate-500 mt-2">Search or scan a product to begin billing.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-850/40 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850 scrollbar-track-transparent">
            {cartItems.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateDiscount={onUpdateDiscount}
                onUpdateTax={onUpdateTax}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}

        {/* Accordion / Toggle-able adjustments */}
        <div className="mt-1">
          <button
            type="button"
            id="cart-adjustments-tab-btn"
            onClick={() => setShowAdjustments(!showAdjustments)}
            className="w-full flex items-center justify-between py-2.5 text-[13.5px] font-extrabold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <span>{showAdjustments ? '▼ Hide Adjustments' : '▶ Order Adjustments & Charges'}</span>
            </span>
            { (orderDiscount > 0 || orderTax > 0 || shipping > 0 || otherCharges > 0) && (
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
            )}
          </button>

          {showAdjustments && (
            <div className="grid grid-cols-2 gap-4 mt-2.5 p-4.5 bg-slate-100/40 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-1.5 text-left">
                <span className="pos-small-text text-[12.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  id="order-discount-input"
                  value={orderDiscount || ''}
                  onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-[46px] px-3.5 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-850 dark:text-slate-100 shadow-sm"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="pos-small-text text-[12.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tax (%)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={orderTax || ''}
                  onChange={(e) => setOrderTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-[46px] px-3.5 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-850 dark:text-slate-100 shadow-sm"
                  placeholder="0%"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="pos-small-text text-[12.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shipping ($)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={shipping || ''}
                  onChange={(e) => setShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-[46px] px-3.5 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-850 dark:text-slate-100 shadow-sm"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="pos-small-text text-[12.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Other Charges</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={otherCharges || ''}
                  onChange={(e) => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-[46px] px-3.5 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-850 dark:text-slate-100 shadow-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: CHECKOUT & PAYMENT */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="pos-section-title text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <DollarSign className="pos-icon-normal h-5 w-5 text-indigo-500" />
            Payment & Summary
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4.5">
          {/* Term picker */}
          <div className="flex flex-col gap-1.5 text-left">
            <span className="pos-small-text text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payment Term</span>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as any)}
              className="w-full h-[50px] px-4 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl text-[15px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
            >
              <option value="Cash Sale">💵 Cash Full</option>
              <option value="Credit Sale">💳 Credit Full</option>
              <option value="Partial Payment Sale">📝 Partial</option>
            </select>
          </div>

          {/* Payment Method picker */}
          {saleType !== 'Credit Sale' && (
            <div className="flex flex-col gap-1.5 text-left">
              <span className="pos-small-text text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payment Method</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-[50px] px-4 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl text-[15px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
              >
                <option value="Cash">💵 Cash</option>
                <option value="Card">💳 Card</option>
                <option value="EasyPaisa">📱 EasyPaisa</option>
                <option value="JazzCash">📲 JazzCash</option>
                <option value="Bank">🏦 Bank</option>
                <option value="Other">⚙️ Other</option>
              </select>
            </div>
          )}
        </div>

        {/* Registered customer warning for credit sales */}
        {(saleType === 'Credit Sale' || saleType === 'Partial Payment Sale') && !selectedCustomer && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/45 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-[13.5px] font-bold text-rose-700 dark:text-rose-350 leading-normal text-left shadow-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
            <span>Customer assignment is required for credit/partial billing transactions.</span>
          </div>
        )}

        {/* Subtotal & Adjustment displays */}
        <div className="bg-slate-50/60 dark:bg-slate-900/40 p-5.5 rounded-2xl border border-slate-200/80 dark:border-slate-850 space-y-3 text-left shadow-sm">
          <div className="flex justify-between text-[15px] font-medium text-slate-600 dark:text-slate-300">
            <span>Subtotal</span>
            <span className="font-mono font-bold text-[16px]">${totals.subtotal.toFixed(2)}</span>
          </div>
          { (totals.totalDiscount > 0 || orderDiscount > 0) && (
            <div className="flex justify-between text-[15px] font-bold text-amber-600 dark:text-amber-400">
              <span>Discount</span>
              <span className="font-mono font-bold text-[16px]">-${(totals.totalDiscount + orderDiscount).toFixed(2)}</span>
            </div>
          )}
          { (totals.tax > 0 || orderTax > 0) && (
            <div className="flex justify-between text-[15px] font-bold text-indigo-650 dark:text-indigo-400">
              <span>Tax</span>
              <span className="font-mono font-bold text-[16px]">+${totals.tax.toFixed(2)}</span>
            </div>
          )}
          { (totals.shipping > 0) && (
            <div className="flex justify-between text-[15px] font-medium text-slate-600 dark:text-slate-300">
              <span>Shipping</span>
              <span className="font-mono font-bold text-[16px]">+${totals.shipping.toFixed(2)}</span>
            </div>
          )}
          { (totals.otherCharges > 0) && (
            <div className="flex justify-between text-[15px] font-medium text-slate-600 dark:text-slate-300">
              <span>Other Charges</span>
              <span className="font-mono font-bold text-[16px]">+${totals.otherCharges.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[18px] font-black text-slate-900 dark:text-white pt-3.5 border-t border-dashed border-slate-250 dark:border-slate-800">
            <span className="pos-normal-text text-[18px] font-black text-slate-900 dark:text-white">Grand Total</span>
            <span className="text-[34px] font-black text-indigo-600 dark:text-indigo-450 font-mono tracking-tight pos-grand-total">${totals.grandTotal.toFixed(2)}</span>
          </div>

          {/* Cash Paid / Change / Credit Summary inside total section for extreme financial transparency */}
          {saleType !== 'Credit Sale' && (
            <div className="flex justify-between text-[13.5px] font-semibold text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Cash Paid</span>
              <span className="font-mono font-bold">${paidAmount.toFixed(2)}</span>
            </div>
          )}
          {saleType !== 'Credit Sale' && changeReturned > 0 && (
            <div className="flex justify-between text-[13.5px] font-bold text-emerald-650 dark:text-emerald-400">
              <span>Change</span>
              <span className="font-mono font-bold">${changeReturned.toFixed(2)}</span>
            </div>
          )}

          {selectedCustomer && (
            <div className="flex flex-col gap-2 mt-2.5 pt-2.5 border-t border-dashed border-slate-250 dark:border-slate-800 text-[13.5px] font-semibold text-slate-600 dark:text-slate-350">
              <div className="flex justify-between">
                <span>Previous Outstanding:</span>
                <span className="font-mono font-bold">${(selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0).toFixed(2)}</span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>This Bill Credit Added:</span>
                  <span className="font-mono font-bold">+${remainingAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-150 dark:border-slate-800 pt-2 text-slate-800 dark:text-slate-150 font-black">
                <span>Total Outstanding After Sale:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 text-[14.5px]">
                  ${((selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) + remainingAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Paid and received fields if Partial Sale */}
        {saleType === 'Partial Payment Sale' && (
          <div className="flex flex-col gap-1.5 text-left">
            <span className="pos-small-text text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cash Received ($)</span>
            <input
              type="number"
              min="0"
              step="any"
              id="paid-amount-input"
              value={cashReceived || ''}
              onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-[54px] px-4 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl text-[18px] font-black text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 shadow-inner"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Single cash field if Cash Sale */}
        {saleType === 'Cash Sale' && (
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex justify-between items-center mb-0.5">
              <span className="pos-small-text text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cash Received ($)</span>
              <div className="flex gap-3 text-[13px] font-bold text-indigo-650 dark:text-indigo-400">
                <button type="button" onClick={() => setCashReceived(totals.grandTotal)} className="hover:underline cursor-pointer">Exact</button>
                <span>|</span>
                <button type="button" onClick={() => setCashReceived(0)} className="hover:underline cursor-pointer">Clear</button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              id="paid-amount-input"
              value={cashReceived || ''}
              onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-[54px] px-4 pos-input pos-input-text bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl text-[18px] font-black text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 shadow-inner"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Change returned / balance details with High-contrast status colors */}
        {saleType !== 'Credit Sale' && (
          <div className={`flex items-center justify-between px-4.5 py-3.5 rounded-2xl border ${
            changeReturned > 0 
              ? 'bg-emerald-550/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
              : 'bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-850'
          }`}>
            <span className="text-[14px] font-bold">Change Returned:</span>
            <span className="text-[18px] font-extrabold font-mono">${changeReturned.toFixed(2)}</span>
          </div>
        )}

        {saleType === 'Partial Payment Sale' && (
          <div className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl bg-rose-550/10 border border-rose-500/15 text-rose-600 dark:text-rose-400">
            <span className="text-[14px] font-bold">Remaining Balance (Loan Outstanding):</span>
            <span className="text-[18px] font-extrabold font-mono">${remainingAmount.toFixed(2)}</span>
          </div>
        )}

        {saleType === 'Credit Sale' && (
          <div className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl bg-rose-550/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse">
            <span className="text-[14px] font-bold">Remaining Balance (Loan Outstanding):</span>
            <span className="text-[18px] font-extrabold font-mono">${remainingAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Hidden tracker for cart compatibility with legacy shortcuts */}
        <div id="cart-items-tab-btn" className="hidden" />

        {/* Receipt format & complete checkout button */}
        <div className="flex flex-col gap-3.5 mt-2">
          <div className="flex items-center justify-between text-left">
            <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Receipt Format</span>
            <select
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value as any)}
              className="h-[42px] px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-350 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="thermal">🖨️ Thermal 80mm</option>
              <option value="a4">📄 Standard A4</option>
              <option value="none">🚫 Skip Receipt</option>
            </select>
          </div>

          <Button
            type="button"
            variant="primary"
            id="checkout-submit-btn"
            disabled={isCheckoutDisabled}
            onClick={handleCheckoutSubmit}
            className="w-full justify-center font-black tracking-wide text-[16px] h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md cursor-pointer transition-all flex items-center gap-2 transform active:scale-98 transition-transform"
          >
            <Check className="h-5.5 w-5.5" />
            {isProcessing ? 'Processing...' : 'Complete Checkout'}
          </Button>
        </div>
      </div>

      {/* LOAN CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showLoanConfirm && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoanConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-2xl border border-slate-150 dark:border-slate-800/80 z-10 text-left relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3.5 mb-4">
                <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  Loan Confirmation Dialog
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLoanConfirm(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  You are saving this transaction on credit. Please confirm the loan adjustments for the customer below:
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-2.5">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Customer Name</span>
                    <span className="text-slate-900 dark:text-white">{selectedCustomer.fullName}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Bill:</span>
                    <span className="font-mono font-semibold">${totals.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Payment:</span>
                    <span className="font-mono font-semibold text-emerald-600">-${paidAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                    <span className="text-slate-500">Remaining Current Bill:</span>
                    <span className="font-mono font-bold text-rose-500">+${remainingAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Previous Outstanding:</span>
                    <span className="font-mono font-semibold">${(selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 text-[13px] font-black">
                    <span className="text-slate-800 dark:text-white">New Total Outstanding:</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      ${((selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) + remainingAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-450">
                    <span>Customer Credit Limit:</span>
                    <span className="font-mono font-bold text-slate-650 dark:text-slate-350">
                      {selectedCustomer.creditLimit ? `$${selectedCustomer.creditLimit.toFixed(2)}` : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* Over credit limit warning */}
                {selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && ((selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) + remainingAmount) > selectedCustomer.creditLimit && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-955/20 border border-rose-150 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-450 text-[11px] font-bold leading-normal text-left">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-extrabold uppercase tracking-wide text-[10px] text-rose-700 dark:text-rose-450 mb-0.5 font-sans">Credit Limit Exceeded!</span>
                      The customer's new total balance of <span className="font-mono">${((selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0) + remainingAmount).toFixed(2)}</span> will exceed their credit limit of <span className="font-mono">${selectedCustomer.creditLimit.toFixed(2)}</span>.
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-900 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoanConfirm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowLoanConfirm(false);
                      triggerCheckout();
                    }}
                    className="px-5 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Save as Credit
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Customer Add Modal */}
      {showQuickAdd && (
        <QuickCustomerModal
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onCustomerAdded={(newCust) => {
            onSelectCustomer(newCust);
            setShowQuickAdd(false);
          }}
        />
      )}
    </div>
  );
};

export default TransactionPanel;
