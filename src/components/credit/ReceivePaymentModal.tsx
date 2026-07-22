import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Tag, FileText, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { db, type Customer, type CreditAccount } from '../../database/db';
import { usePaymentAllocation, useReceivePayment } from '../../hooks/useCredit';
import Button from '../ui/Button';
import showToast from '../../utils/toast';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: number | null; // Optional pre-selected customer
  onSuccess: () => void;
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  isOpen,
  onClose,
  customerId = null,
  onSuccess,
}) => {
  const { submitPayment, isProcessing } = useReceivePayment();

  // Selected customer
  const [selectedCustId, setSelectedCustId] = useState<number>(0);
  const [customersList, setCustomersList] = useState<Customer[]>([]);

  // Payment Form fields
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Allocation Mode: 'auto' (oldest first) or 'manual'
  const [allocationMode, setAllocationMode] = useState<'auto' | 'manual'>('auto');

  // Load customers
  useEffect(() => {
    db.customers
      .filter((c) => !c.isDeleted && c.status === 'Active')
      .toArray()
      .then((list) => setCustomersList(list));
  }, []);

  // Update selected customer ID when prop changes
  useEffect(() => {
    if (customerId) {
      setSelectedCustId(customerId);
    } else {
      setSelectedCustId(0);
    }
  }, [customerId]);

  // Load outstanding invoices and allocations via custom hook
  const {
    outstandingInvoices,
    autoAllocations,
    autoUnallocated,
    allocations,
    setAllocations,
  } = usePaymentAllocation(selectedCustId || null, amount) as {
    outstandingInvoices: CreditAccount[];
    autoAllocations: Record<number, number>;
    autoUnallocated: number;
    allocations: Record<number, number>;
    setAllocations: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  };

  // Initialize manual allocations state when outstandingInvoices is fetched or mode changes
  useEffect(() => {
    if (allocationMode === 'manual') {
      const initial: Record<number, number> = {};
      outstandingInvoices.forEach((inv) => {
        initial[inv.id!] = 0;
      });
      setAllocations(initial);
    }
  }, [outstandingInvoices, allocationMode, setAllocations]);

  // Handle setting individual manual allocation amounts
  const handleManualAllocChange = (invoiceId: number, val: string) => {
    const num = parseFloat(val) || 0;
    const inv = outstandingInvoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const maxRem = inv.remainingAmount ?? 0;
    const finalAlloc = Math.min(num, maxRem);

    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: finalAlloc,
    }));
  };

  // Compute manual total allocated in real-time
  const manualTotalAllocated = Object.values(allocations).reduce((sum: number, v: number) => sum + v, 0);

  // Total customer outstanding
  const customerOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.remainingAmount ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustId) {
      showToast.error('Validation Error: A registered customer is required.');
      return;
    }

    if (amount <= 0) {
      showToast.error('Validation Error: Payment amount must be greater than zero.');
      return;
    }

    if (outstandingInvoices.length === 0) {
      showToast.error('Validation Error: Selected customer has no active outstanding invoices.');
      return;
    }

    let finalParams: any = {
      customerId: selectedCustId,
      totalAmount: amount,
      paymentMethod,
      referenceNumber,
      notes,
      receivedBy: 'Cashier',
      allocationType: allocationMode,
    };

    if (allocationMode === 'manual') {
      // Validate that total manually allocated matches inputted amount
      if (Math.abs(manualTotalAllocated - amount) > 0.01) {
        showToast.error(`Validation Error: The manual allocation sum ($${manualTotalAllocated.toFixed(2)}) must exactly match the total payment amount ($${amount.toFixed(2)}).`);
        return;
      }

      finalParams.manualAllocations = Object.entries(allocations).map(([k, v]) => ({
        creditAccountId: Number(k),
        amount: v,
      }));
    }

    const res = await submitPayment(finalParams);
    if (res.success) {
      // Clear forms
      setAmount(0);
      setReferenceNumber('');
      setNotes('');
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 text-left shadow-2xl dark:bg-slate-900 border border-slate-150 dark:border-slate-800 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4.5 w-4.5 text-indigo-500" />
              Receive Credit / Loan Payment
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Log payments and automatically or manually distribute them against customer invoices.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <X className="h-4.5 w-4.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Top block: Customer details + basic payment attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer select (disabled if pre-selected) */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Customer *</span>
              <select
                value={selectedCustId}
                onChange={(e) => {
                  setSelectedCustId(Number(e.target.value));
                  setAmount(0);
                }}
                disabled={customerId !== null && customerId !== undefined && customerId !== 0}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer disabled:opacity-65"
              >
                <option value={0}>Choose Registered Customer...</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone})
                  </option>
                ))}
              </select>

              {selectedCustId > 0 && (
                <p className="text-[9px] font-black text-indigo-500 mt-1 uppercase tracking-wider">
                  Total Outstanding Balance: ${customerOutstanding.toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment Amount */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Amount ($) *</span>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-black font-mono pl-9 pr-4 py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Payment Method */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Method *</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Deposit</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ref Number (Optional)</span>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cheque / Transaction ID"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Remarks / Notes</span>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Installment payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Allocation Toggle panel */}
          {selectedCustId > 0 && (
            <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-semibold">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Invoice Allocation Distribution
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Choose how you want to allocate the payment amount among outstanding bills.
                  </p>
                </div>

                {/* Switcher tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAllocationMode('auto')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                      allocationMode === 'auto'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Auto Oldest First
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationMode('manual')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                      allocationMode === 'manual'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Manual Allocation
                  </button>
                </div>
              </div>

              {outstandingInvoices.length === 0 ? (
                <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <AlertCircle className="h-5 w-5 mx-auto text-slate-350 dark:text-slate-800 mb-1" />
                  <p className="text-[10px] font-black uppercase tracking-wider">No Outstanding Debt Invoices</p>
                  <p className="text-[9px] text-slate-400">All invoices are settled for this customer.</p>
                </div>
              ) : (
                <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
                        <th className="py-2.5 px-4">Invoice No</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4 text-right">Total Invoice</th>
                        <th className="py-2.5 px-4 text-right">Remaining Bal</th>
                        <th className="py-2.5 px-4 text-right w-[150px]">Allocated Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                      {outstandingInvoices.map((inv) => {
                        const isAuto = allocationMode === 'auto';
                        const allocatedVal = isAuto ? autoAllocations[inv.id!] || 0 : allocations[inv.id!] || 0;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-950 dark:text-white">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-4 text-[10px]">
                              {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono">
                              ${(inv.invoiceAmount ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-rose-500 font-bold">
                              ${(inv.remainingAmount ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-4 text-right">
                              {isAuto ? (
                                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg">
                                  ${allocatedVal.toFixed(2)}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={inv.remainingAmount}
                                  placeholder="0.00"
                                  value={allocatedVal || ''}
                                  onChange={(e) => handleManualAllocChange(inv.id!, e.target.value)}
                                  className="w-full text-right text-xs font-black font-mono px-2 py-1 rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-600"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Summary row */}
                  <div className="bg-slate-50/55 dark:bg-slate-900/40 p-3 border-t border-slate-150 dark:border-slate-800 text-[10px] flex items-center justify-between font-black uppercase tracking-wider text-slate-500">
                    <div>
                      {allocationMode === 'auto' ? (
                        <span>Advance Account credit (unallocated): <span className="text-emerald-500 font-mono font-bold text-[11px]">${autoUnallocated.toFixed(2)}</span></span>
                      ) : (
                        <span>Total Manual Allocated: <span className="text-indigo-600 font-mono font-bold text-[11px]">${manualTotalAllocated.toFixed(2)}</span></span>
                      )}
                    </div>
                    {allocationMode === 'manual' && (
                      <div>
                        {Math.abs(manualTotalAllocated - amount) > 0.01 ? (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            Diff: ${(amount - manualTotalAllocated).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <Check className="h-3 w-3 shrink-0" />
                            Allocations Balanced
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 mt-3 pt-4">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isProcessing || selectedCustId === 0 || amount <= 0 || (allocationMode === 'manual' && Math.abs(manualTotalAllocated - amount) > 0.01)}
              className="flex items-center gap-1.5"
            >
              {isProcessing ? 'Saving Transaction...' : 'Receive Payment'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReceivePaymentModal;
