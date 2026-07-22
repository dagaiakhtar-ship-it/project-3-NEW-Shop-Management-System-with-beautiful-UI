import React from 'react';
import ShoppingCartPanel from './ShoppingCartPanel';
import CustomerCard from './CustomerCard';
import PaymentPanel from './PaymentPanel';
import BillSummary from './BillSummary';
import CheckoutActions from './CheckoutActions';
import { type CartItem } from '../../../hooks/useCart';
import { type Customer } from '../../../database/db';

interface RightSidebarProps {
  // Cart
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;

  // Customer
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  allCustomers: Customer[];

  // Payment
  saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
  setSaleType: (type: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale') => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  cashReceived: number;
  setCashReceived: (cash: number) => void;
  paidAmount: number;
  changeReturned: number;
  remainingAmount: number;
  notes: string;
  setNotes: (notes: string) => void;

  // Bill totals summary
  totals: {
    subtotal: number;
    totalDiscount: number;
    tax: number;
    shipping: number;
    otherCharges: number;
    grandTotal: number;
  };
  orderDiscount: number;
  setOrderDiscount: (val: number) => void;
  orderTax: number;
  setOrderTax: (val: number) => void;
  shippingCharge: number;
  setShipping: (val: number) => void;
  otherChargesCharge: number;
  setOtherCharges: (val: number) => void;

  // Checkout Actions
  onSubmitCheckout: () => void;
  isProcessing?: boolean;
  isCheckoutDisabled?: boolean;
  printFormat: 'thermal' | 'a4' | 'none';
  setPrintFormat: (format: 'thermal' | 'a4' | 'none') => void;
  onQuickPrint?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  cartItems,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
  onClear,

  selectedCustomer,
  onSelectCustomer,
  allCustomers,

  saleType,
  setSaleType,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  paidAmount,
  changeReturned,
  remainingAmount,
  notes,
  setNotes,

  totals,
  orderDiscount,
  setOrderDiscount,
  orderTax,
  setOrderTax,
  shippingCharge,
  setShipping,
  otherChargesCharge,
  setOtherCharges,

  onSubmitCheckout,
  isProcessing = false,
  isCheckoutDisabled = false,
  printFormat,
  setPrintFormat,
  onQuickPrint,
}) => {
  // Derive CRM-related outstanding balance metrics to pass into BillSummary
  const previousLoan = selectedCustomer
    ? selectedCustomer.currentBalance ?? selectedCustomer.balance ?? 0
    : 0;

  // Final total balance after this checkout's outstanding loans are added
  const outstandingBalance = previousLoan + remainingAmount;

  return (
    <aside
      className="w-full h-full bg-white dark:bg-slate-900 border-l border-[#E5E7EB] dark:border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto scrollbar-none"
      id="pos-right-sidebar"
    >
      {/* 1. Shopping Cart Panel (with Header, Cart List, Loading & Empty views integrated) */}
      <ShoppingCartPanel
        cartItems={cartItems}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateDiscount={onUpdateDiscount}
        onUpdateTax={onUpdateTax}
        onRemove={onRemove}
        onClear={onClear}
        isLoading={isProcessing}
      />

      {/* 2. Customer Assignment CRM Card */}
      <CustomerCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={onSelectCustomer}
        allCustomers={allCustomers}
      />

      {/* 3. Payment Panel (including Sale Type, Payment Method, Cash Input, Discount & Tax modifiers) */}
      <PaymentPanel
        saleType={saleType}
        setSaleType={setSaleType}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        paidAmount={paidAmount}
        changeReturned={changeReturned}
        remainingAmount={remainingAmount}
        grandTotal={totals.grandTotal}
        notes={notes}
        setNotes={setNotes}
        orderDiscount={orderDiscount}
        setOrderDiscount={setOrderDiscount}
        orderTax={orderTax}
        setOrderTax={setOrderTax}
      />

      {/* 4. Order Bill Summary Card (Subtotal, Tax, modifier breakdowns & grand totals) */}
      <BillSummary
        subtotal={totals.subtotal}
        discount={totals.totalDiscount}
        tax={totals.tax}
        shipping={totals.shipping}
        otherCharges={totals.otherCharges}
        grandTotal={totals.grandTotal}
        orderDiscount={orderDiscount}
        setOrderDiscount={setOrderDiscount}
        orderTax={orderTax}
        setOrderTax={setOrderTax}
        shippingCharge={shippingCharge}
        setShipping={setShipping}
        otherChargesCharge={otherChargesCharge}
        setOtherCharges={setOtherCharges}
        previousLoan={previousLoan}
        cashPaid={paidAmount}
        remainingLoan={remainingAmount}
        outstandingBalance={outstandingBalance}
      />

      {/* 5. Checkout & Utility Action triggers */}
      <CheckoutActions
        onSubmit={onSubmitCheckout}
        onCancel={() => {
          onClear();
          onSelectCustomer(null);
        }}
        isProcessing={isProcessing}
        isDisabled={isCheckoutDisabled}
        printFormat={printFormat}
        setPrintFormat={setPrintFormat}
        onQuickPrint={onQuickPrint}
      />
    </aside>
  );
};

export default React.memo(RightSidebar);
