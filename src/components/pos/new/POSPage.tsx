import React, { useState, useEffect, useMemo, useCallback } from 'react';
import POSHeader from './POSHeader';
import CategoryBar from './CategoryBar';
import ProductSearchBar from './ProductSearchBar';
import ProductGrid from './ProductGrid';
import RightSidebar from './RightSidebar';
import { type CartItem } from '../../../hooks/useCart';
import { type Customer } from '../../../database/db';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

// Premium Checkout Step Components
import CheckoutDialog from './CheckoutDialog';
import LoanConfirmationDialog from './LoanConfirmationDialog';
import ReceiptPreview from './ReceiptPreview';
import PaymentSuccessDialog from './PaymentSuccessDialog';
import ErrorDialog from './ErrorDialog';
import LoadingOverlay from './LoadingOverlay';
import KeyboardShortcuts from './KeyboardShortcuts';
import showToast from '../../../utils/toast';
import { usePrintSystem } from '../../../contexts/PrintContext';

interface POSPageProps {
  // Mode & Totals
  activeMode: 'pos' | 'ledger';
  onModeChange: (mode: 'pos' | 'ledger') => void;
  ledgerTotal: number;

  // Cart operations
  cartItems: CartItem[];
  addItem: (product: any, qty: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  updateItemDiscount: (productId: number, discount: number) => void;
  updateItemTax: (productId: number, tax: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;

  // Customer state
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  registeredCustomers: Customer[];

  // Order adjustments
  orderDiscount: number;
  setOrderDiscount: (val: number) => void;
  orderTax: number;
  setOrderTax: (val: number) => void;
  shipping: number;
  setShipping: (val: number) => void;
  otherCharges: number;
  setOtherCharges: (val: number) => void;

  // Calculations
  totals: {
    subtotal: number;
    totalDiscount: number;
    tax: number;
    shipping: number;
    otherCharges: number;
    grandTotal: number;
  };

  // Filters and dynamic DB data
  sidebarCategories: any[];
  sidebarBrands: string[];
  currentTime: Date;
  refreshTrigger: number;

  // Checkout submitting & processing indicators
  handleCheckoutSubmit: (billingDetails: {
    paidAmount: number;
    remainingAmount: number;
    cashReceived: number;
    changeReturned: number;
    paymentMethod: string;
    saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
    notes?: string;
    printFormat: 'thermal' | 'a4' | 'none';
  }) => Promise<{ success: boolean; sale?: any }>;
  isProcessing: boolean;
  handleBarcodeScan: (barcode: string) => Promise<void>;

  // PDF and Past print actions (from parent Sales.tsx controller)
  onPrintPastReceipt?: (sale: any, items: any[], customer: any, format: 'thermal' | 'a4') => Promise<void>;
  onPDFDownload?: (sale: any, items: any[], format: 'thermal' | 'a4') => Promise<void>;
}

export const POSPage: React.FC<POSPageProps> = ({
  activeMode = 'pos',
  onModeChange,
  ledgerTotal = 0,

  cartItems,
  addItem,
  updateQuantity,
  updateItemDiscount,
  updateItemTax,
  removeItem,
  clearCart,

  selectedCustomer,
  onSelectCustomer,
  registeredCustomers,

  orderDiscount,
  setOrderDiscount,
  orderTax,
  setOrderTax,
  shipping,
  setShipping,
  otherCharges,
  setOtherCharges,

  totals,
  sidebarCategories = [],
  sidebarBrands = [],
  currentTime,
  refreshTrigger = 0,

  handleCheckoutSubmit,
  isProcessing = false,
  handleBarcodeScan,

  onPrintPastReceipt,
  onPDFDownload,
}) => {
  const { openPrintPreview } = usePrintSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | number>('All');
  const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Local billing input states
  const [saleType, setSaleType] = useState<'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale'>('Cash Sale');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [cashReceivedState, setCashReceivedState] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4' | 'none'>('thermal');

  // Derived state for cash received
  const cashReceived = useMemo(() => {
    if (cashReceivedState !== null) {
      return cashReceivedState;
    }
    if (saleType === 'Cash Sale') {
      return totals.grandTotal;
    }
    return 0;
  }, [cashReceivedState, saleType, totals.grandTotal]);

  // Handle changing cash received manually
  const handleCashReceivedChange = useCallback((val: number) => {
    setCashReceivedState(val);
  }, []);

  // Handle changing sale type
  const handleSaleTypeChange = useCallback((type: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale') => {
    setSaleType(type);
    setCashReceivedState(null); // Reset manual override to default behavior for new sale type
  }, []);

  // Premium Checkout Step Wizard State Machine
  const [checkoutStage, setCheckoutStage] = useState<'idle' | 'confirm_checkout' | 'confirm_loan' | 'processing' | 'success' | 'error'>('idle');
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [completedCustomer, setCompletedCustomer] = useState<Customer | null>(null);
  const [completedTotals, setCompletedTotals] = useState<any | null>(null);
  const [completedPaymentDetails, setCompletedPaymentDetails] = useState<any | null>(null);
  const [checkoutErrorMsg, setCheckoutErrorMsg] = useState('');
  const [checkoutTechnicalDetails, setCheckoutTechnicalDetails] = useState('');

  // Derived math values
  const paidAmount = useMemo(() => {
    if (saleType === 'Cash Sale') {
      return totals.grandTotal;
    } else if (saleType === 'Credit Sale') {
      return 0;
    } else { // Partial Payment Sale
      return Math.min(cashReceived, totals.grandTotal);
    }
  }, [saleType, totals.grandTotal, cashReceived]);

  const remainingAmount = Math.max(0, totals.grandTotal - paidAmount);
  const changeReturned = cashReceived > paidAmount ? cashReceived - paidAmount : 0;

  // Intercept checkout submit to trigger premium wizard step review
  const handleSubmitCheckout = () => {
    if (isCheckoutDisabled) {
      showToast.error('Checkout is disabled. Check cart items or customer balances.');
      return;
    }

    // Capture frozen data snapshots to display in dialogs even if terminal is reset
    const itemsSnapshot = cartItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      discount: item.discount,
      tax: item.tax,
    }));

    setCompletedItems(itemsSnapshot);
    setCompletedCustomer(selectedCustomer ? { ...selectedCustomer } : null);
    setCompletedTotals({ ...totals });
    setCompletedPaymentDetails({
      cashReceived,
      paidAmount,
      changeReturned,
      paymentMethod,
      saleType,
      notes,
    });

    setCheckoutStage('confirm_checkout');
  };

  // Intercept clearCart to also reset billing forms cleanly without useEffect
  const handleClearCart = useCallback(() => {
    clearCart();
    setSaleType('Cash Sale');
    setPaymentMethod('Cash');
    setCashReceivedState(null);
    setNotes('');
  }, [clearCart]);

  // Unified Checkout validation
  const isCheckoutDisabled = useMemo(() => {
    const isEmpty = cartItems.length === 0;
    const isCreditRequired = saleType === 'Credit Sale' || saleType === 'Partial Payment Sale';
    const noCustomer = !selectedCustomer;
    
    // Credit Limit breaches
    let creditBreached = false;
    if (saleType === 'Credit Sale' && selectedCustomer && (selectedCustomer.creditLimit ?? 0) > 0) {
      creditBreached = remainingAmount > (selectedCustomer.creditLimit ?? 0);
    }

    return isEmpty || (isCreditRequired && noCustomer) || creditBreached;
  }, [cartItems, saleType, selectedCustomer, remainingAmount]);

  // Direct database confirmation transaction logic
  const handleProceedWithCheckout = async () => {
    // If loan is required, double confirm saving credit/loan first
    if (saleType !== 'Cash Sale' && remainingAmount > 0 && selectedCustomer && checkoutStage !== 'confirm_loan') {
      setCheckoutStage('confirm_loan');
      return;
    }

    // Move to active transaction locking loading state
    setCheckoutStage('processing');

    try {
      // Execute parent's real IndexedDB transaction helper
      const res = await handleCheckoutSubmit({
        paidAmount,
        remainingAmount,
        cashReceived,
        changeReturned,
        paymentMethod,
        saleType,
        notes,
        printFormat: 'none', // We manage high-fidelity custom printing directly from Success dialogs!
      });

      if (res && res.success) {
        setCompletedSale(res.sale);
        setCheckoutStage('success');
        showToast.success('Transaction booked and finalized in database.');

        // Automatically trigger beautiful, structured thermal receipt layout using PrintContext
        const formattedItems = completedItems.map((item: any) => ({
          name: item.productName || item.name || 'Product',
          quantity: item.quantity,
          price: item.sellingPrice ?? item.price ?? 0,
          subtotal: item.total ?? item.subtotal ?? (item.quantity * (item.sellingPrice ?? item.price ?? 0)),
          discount: item.discount ?? 0,
        }));

        const formattedSale = {
          invoiceNo: res.sale.invoiceNo || res.sale.invoiceNumber || 'INV-0000',
          paymentMethod: res.sale.paymentMethod || 'Cash',
          invoiceDate: res.sale.saleDate || res.sale.createdAt || new Date(),
          subtotal: res.sale.subtotal || 0,
          discount: res.sale.discount || 0,
          tax: res.sale.tax || 0,
          grandTotal: res.sale.grandTotal || res.sale.total || 0,
          amountPaid: res.sale.paidAmount ?? res.sale.amountPaid ?? 0,
          balanceDue: res.sale.remainingAmount ?? res.sale.balanceDue ?? 0,
        };

        openPrintPreview(`Receipt #${formattedSale.invoiceNo}`, 'receipt', formattedSale, formattedItems, 'Thermal_80mm');
      } else {
        setCheckoutErrorMsg('Database transaction aborted or failed verification checks.');
        setCheckoutTechnicalDetails('Aborted during IndexedDB sales saving routine.');
        setCheckoutStage('error');
      }
    } catch (err: any) {
      console.error('POS Checkout execution error:', err);
      setCheckoutErrorMsg(err?.message || 'An unexpected terminal pipeline error occurred.');
      setCheckoutTechnicalDetails(err?.stack || String(err));
      setCheckoutStage('error');
    }
  };

  // Quick utility helpers for the Receipt actions
  const handlePrintReceiptAction = () => {
    if (completedSale) {
      const formattedItems = completedItems.map((item: any) => ({
        name: item.productName || item.name || 'Product',
        quantity: item.quantity,
        price: item.sellingPrice ?? item.price ?? 0,
        subtotal: item.total ?? item.subtotal ?? (item.quantity * (item.sellingPrice ?? item.price ?? 0)),
        discount: item.discount ?? 0,
      }));

      const formattedSale = {
        invoiceNo: completedSale.invoiceNo || completedSale.invoiceNumber || 'INV-0000',
        paymentMethod: completedSale.paymentMethod || 'Cash',
        invoiceDate: completedSale.saleDate || completedSale.createdAt || new Date(),
        subtotal: completedSale.subtotal || 0,
        discount: completedSale.discount || 0,
        tax: completedSale.tax || 0,
        grandTotal: completedSale.grandTotal || completedSale.total || 0,
        amountPaid: completedSale.paidAmount ?? completedSale.amountPaid ?? 0,
        balanceDue: completedSale.remainingAmount ?? completedSale.balanceDue ?? 0,
      };

      openPrintPreview(`Receipt #${formattedSale.invoiceNo}`, 'receipt', formattedSale, formattedItems, 'Thermal_80mm');
    } else {
      window.print();
    }
  };

  const handleDownloadPDFAction = () => {
    if (onPDFDownload && completedSale) {
      onPDFDownload(completedSale, completedItems, 'a4');
    } else {
      showToast.info('Direct PDF download trigger initiated.');
    }
  };

  const handleWhatsAppShareAction = () => {
    const phone = completedCustomer?.phone || '';
    if (phone) {
      showToast.success(`Forwarding invoice receipt link to: ${phone}`);
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const textMsg = `Dear customer, thank you for shopping with us! Here is your invoice link for order ${completedSale?.invoiceNumber || 'INV-000'}: https://wa.me/${cleanPhone}`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`, '_blank');
    } else {
      showToast.success('Opening WhatsApp Share client...');
      window.open('https://web.whatsapp.com', '_blank');
    }
  };

  const handleStartNewSale = () => {
    setCheckoutStage('idle');
    setCompletedSale(null);
    setCompletedItems([]);
    setCompletedCustomer(null);
    setCompletedTotals(null);
    setCompletedPaymentDetails(null);
    setNotes('');
    setCashReceivedState(null);
    setSaleType('Cash Sale');
    setPaymentMethod('Cash');
  };

  // Keyboard action routing
  const handleShortcutF1 = () => document.getElementById('product-search-input')?.focus();
  const handleShortcutF2 = () => document.getElementById('customer-search-input')?.focus();
  const handleShortcutF3 = () => {
    document.getElementById('cart-adjustments-tab-btn')?.click();
    setTimeout(() => document.getElementById('order-discount-input')?.focus(), 60);
  };
  const handleShortcutF4 = () => {
    document.getElementById('cart-items-tab-btn')?.click();
    setTimeout(() => document.getElementById('paid-amount-input')?.focus(), 60);
  };

  const handleShortcutEnter = () => {
    if (checkoutStage === 'confirm_checkout') {
      handleProceedWithCheckout();
    } else if (checkoutStage === 'confirm_loan') {
      handleProceedWithCheckout();
    } else if (checkoutStage === 'success') {
      handleStartNewSale();
    } else if (checkoutStage === 'error') {
      setCheckoutStage('idle');
    }
  };

  const handleShortcutEscape = () => {
    if (checkoutStage !== 'processing') {
      setCheckoutStage('idle');
    }
  };

  // Manual Scan Dialog Prompt
  const handleManualScanPrompt = () => {
    const code = prompt('Scan or enter product barcode / SKU manually:');
    if (code) {
      handleBarcodeScan(code);
    }
  };

  // Category listing prepender
  const categoriesList = useMemo(() => {
    const list = sidebarCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
    }));
    return [{ id: 'All', name: 'All' }, ...list];
  }, [sidebarCategories]);

  // Calculate total item quantity in the cart
  const cartItemsCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  return (
    <>
      {/* 1. Dynamic Sticky Header */}
      <POSHeader
        currentTime={currentTime}
        value={searchQuery}
        onChange={setSearchQuery}
        activeMode={activeMode}
        onModeChange={onModeChange}
        ledgerTotal={ledgerTotal}
        onScan={handleManualScanPrompt}
      />

      {/* Mobile/Tablet Segmented View Switcher (Visible only below lg) */}
      <div className="flex lg:hidden bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 p-2.5 shrink-0 select-none" id="pos-mobile-tab-bar">
        <div className="flex w-full bg-[#F5F7FA] dark:bg-slate-950 p-1 rounded-xl border border-[#E5E7EB] dark:border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setActiveMobileTab('catalog')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 ${
              activeMobileTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('cart')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 relative ${
              activeMobileTab === 'cart'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Cart ({cartItemsCount})</span>
            {cartItemsCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none ${
                activeMobileTab === 'cart' ? 'bg-white text-indigo-600 dark:text-indigo-400' : 'bg-[#EF4444] text-white animate-pulse'
              }`}>
                ${totals.grandTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Workspace Layout (Left Grid Catalog, Right Sidebar Form) */}
      <div
        className="flex-1 flex flex-col lg:flex-row gap-0 w-full min-h-0 overflow-hidden"
        id="pos-main-workspace"
      >
        {/* Left Section: All Product Browsing Catalog */}
        <div
          className={`w-full lg:w-[60%] xl:w-[62%] h-full overflow-hidden flex-col gap-3 p-3 sm:p-3.5 lg:p-4 min-h-0 lg:h-full lg:overflow-hidden ${
            activeMobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
          }`}
          id="pos-left-panel"
        >
          {/* Top Search Experience */}
          <ProductSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onScan={handleManualScanPrompt}
          />

          {/* Top Categories Row */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-2.5 shadow-xs shrink-0">
            <CategoryBar
              categories={categoriesList}
              activeCategoryId={activeCategoryId}
              onChange={setActiveCategoryId}
            />
          </div>

          {/* Dynamic Scrollable Product Cards Catalog */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-y-auto pr-1">
            <ProductGrid
              searchQuery={searchQuery}
              activeCategoryId={activeCategoryId}
              onAddProduct={(p) => addItem(p, 1)}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

        {/* Right Section: Transaction Panels Checkout Sidebar */}
        <div
          className={`w-full lg:w-[40%] xl:w-[38%] h-full overflow-hidden ${
            activeMobileTab === 'cart' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
          id="pos-right-panel"
        >
          <RightSidebar
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateItemDiscount}
            onUpdateTax={updateItemTax}
            onRemove={removeItem}
            onClear={handleClearCart}

            selectedCustomer={selectedCustomer}
            onSelectCustomer={onSelectCustomer}
            allCustomers={registeredCustomers}

            saleType={saleType}
            setSaleType={handleSaleTypeChange}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cashReceived={cashReceived}
            setCashReceived={handleCashReceivedChange}
            paidAmount={paidAmount}
            changeReturned={changeReturned}
            remainingAmount={remainingAmount}
            notes={notes}
            setNotes={setNotes}

            totals={totals}
            orderDiscount={orderDiscount}
            setOrderDiscount={setOrderDiscount}
            orderTax={orderTax}
            setOrderTax={setOrderTax}
            shippingCharge={shipping}
            setShipping={setShipping}
            otherChargesCharge={otherCharges}
            setOtherCharges={setOtherCharges}

            onSubmitCheckout={handleSubmitCheckout}
            isProcessing={isProcessing}
            isCheckoutDisabled={isCheckoutDisabled}
            printFormat={printFormat}
            setPrintFormat={setPrintFormat}
            onQuickPrint={() => window.print()}
          />
        </div>
      </div>

      {/* Mobile/Tablet Floating View Cart & Pay Button */}
      {activeMobileTab === 'catalog' && cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setActiveMobileTab('cart')}
            className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[13px] px-5 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 border border-white/20 uppercase tracking-wider"
          >
            <ShoppingCart className="h-4.5 w-4.5 animate-bounce" />
            <span>Pay ${totals.grandTotal.toFixed(2)} ({cartItemsCount})</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CORE TRANSACTION DIALOG STATIONS                     */}
      {/* ======================================================== */}
      
      {/* Checkout Confirmation Dialog */}
      <CheckoutDialog
        isOpen={checkoutStage === 'confirm_checkout'}
        onClose={() => setCheckoutStage('idle')}
        onConfirm={handleProceedWithCheckout}
        customer={completedCustomer}
        cartItems={completedItems}
        totals={completedTotals || totals}
        paymentDetails={completedPaymentDetails || {
          cashReceived,
          paidAmount,
          changeReturned,
          paymentMethod,
          saleType,
          notes,
        }}
        isProcessing={isProcessing}
      />

      {/* Loan Double Confirmation Dialog */}
      <LoanConfirmationDialog
        isOpen={checkoutStage === 'confirm_loan'}
        onClose={() => setCheckoutStage('confirm_checkout')}
        onConfirm={handleProceedWithCheckout}
        customer={completedCustomer}
        totals={completedTotals || totals}
        paidAmount={completedPaymentDetails?.paidAmount ?? paidAmount}
        remainingAmount={completedTotals ? Math.max(0, completedTotals.grandTotal - completedPaymentDetails.paidAmount) : remainingAmount}
        isProcessing={isProcessing}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        isOpen={checkoutStage === 'processing'}
      />

      {/* Payment Success Dialog */}
      <PaymentSuccessDialog
        isOpen={checkoutStage === 'success'}
        onClose={handleStartNewSale}
        sale={completedSale}
        customer={completedCustomer}
        onPrint={handlePrintReceiptAction}
        onPDF={handleDownloadPDFAction}
        onWhatsApp={handleWhatsAppShareAction}
        onNewSale={handleStartNewSale}
      />

      {/* Error Exception Dialog */}
      <ErrorDialog
        isOpen={checkoutStage === 'error'}
        onClose={() => setCheckoutStage('idle')}
        title="Payment Interrupted"
        description={checkoutErrorMsg}
        technicalDetails={checkoutTechnicalDetails}
        onRetry={handleProceedWithCheckout}
      />

      {/* Receipt Preview Trigger (from sidebar Quick Print / Actions) */}
      <ReceiptPreview
        isOpen={checkoutStage === 'receipt_preview'}
        onClose={() => setCheckoutStage('idle')}
        sale={completedSale}
        customer={completedCustomer}
        items={completedItems}
        onPrint={handlePrintReceiptAction}
        onPDF={handleDownloadPDFAction}
        onWhatsApp={handleWhatsAppShareAction}
        onEmail={() => showToast.success('Receipt queued in email server.')}
        onNewSale={handleStartNewSale}
      />

      {/* Centralized Hotkeys event routing */}
      <KeyboardShortcuts
        onEnter={handleShortcutEnter}
        onEscape={handleShortcutEscape}
        onPrint={handlePrintReceiptAction}
        onPDF={handleDownloadPDFAction}
        onWhatsApp={handleWhatsAppShareAction}
        onF1={handleShortcutF1}
        onF2={handleShortcutF2}
        onF3={handleShortcutF3}
        onF4={handleShortcutF4}
        onF5={handleSubmitCheckout}
      />
    </>
  );
};

export default POSPage;
