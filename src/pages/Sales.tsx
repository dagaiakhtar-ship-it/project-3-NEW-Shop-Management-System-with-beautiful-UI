import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ShoppingCart as CartIcon, History, PlayCircle, Filter, Calendar, 
  Layers, Sparkles, TrendingUp, AlertTriangle, Star, Clock, 
  Zap, Bell, Settings, Barcode, Search, User, ChevronRight, X,
  Sun, Moon
} from 'lucide-react';
import { db, type Product, type Sale, type Customer } from '../database/db';
import useAppStore from '../store/useAppStore';

// Custom Hooks
import { useCart } from '../hooks/useCart';
import { useSaleCalculations } from '../hooks/useSaleCalculations';
import { usePOS } from '../hooks/usePOS';
import { useSales } from '../hooks/useSales';
import { useReceiptPrinter } from '../hooks/useReceiptPrinter';

// Components
import ProductSearch from '../components/pos/ProductSearch';
import ProductGrid from '../components/pos/ProductGrid';
import { TransactionPanel } from '../components/pos/TransactionPanel';
import SalesHistoryTable from '../components/pos/SalesHistoryTable';
import SaleDetailsModal from '../components/pos/SaleDetailsModal';
import POSPage from '../components/pos/new/POSPage';
import { PDFPreviewDialog } from '../components/common/PDFComponents';
import { usePDF } from '../hooks/usePDF';
import { usePrintSystem } from '../contexts/PrintContext';

import Button from '../components/ui/Button';
import showToast from '../utils/toast';

export const Sales: React.FC = () => {
  const { themeMode, toggleThemeMode } = useAppStore();
  // Modes: 'pos' (active terminal checkout) or 'ledger' (transaction logs history)
  const [activeMode, setActiveMode] = useState<'pos' | 'ledger'>('pos');
  // Mobile/Tablet views switcher for layout responsiveness
  const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'cart'>('catalog');
  
  // Refresh grids trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { isGenerating, previewUrl, currentTitle, closePreview, generateInvoice, generateThermalReceipt } = usePDF();
  const { openPrintPreview } = usePrintSystem();

  // --- POS TERMINAL STATE ---
  const {
    cartItems,
    addItem,
    updateQuantity,
    updateItemDiscount,
    updateItemTax,
    removeItem,
    clearCart,
  } = useCart();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Order adjustments
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderTax, setOrderTax] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);

  // Real-time calculations
  const { calculate } = useSaleCalculations();
  const totals = useMemo(() => {
    const itemsForCalc = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      purchasePrice: item.purchasePrice,
      discount: item.discount,
      tax: item.tax,
    }));

    return calculate({
      items: itemsForCalc,
      orderDiscount,
      orderTax,
      shipping,
      otherCharges,
    });
  }, [cartItems, orderDiscount, orderTax, shipping, otherCharges, calculate]);

  // Filters for product grid catalog
  const [catalogFilters, setCatalogFilters] = useState<{
    query: string;
    categoryId: number | 'All';
    brand: string | 'All';
    quickFilter: 'All' | 'Favorites' | 'Frequent' | 'Recent' | 'LowStock' | 'Offers';
  }>({
    query: '',
    categoryId: 'All',
    brand: 'All',
    quickFilter: 'All',
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCategories, setSidebarCategories] = useState<any[]>([]);
  const [sidebarBrands, setSidebarBrands] = useState<string[]>([]);

  // Update clock in real-time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch categories and brands dynamically
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const cats = await db.categories.where('status').equals('Active').toArray();
        setSidebarCategories(cats);

        const prods = await db.products.toArray();
        const uniqueBrands = Array.from(new Set(prods.map((p) => p.brand?.trim()).filter(Boolean))) as string[];
        setSidebarBrands(uniqueBrands.sort());
      } catch (err) {
        console.error('Failed to load categories/brands for sidebar:', err);
      }
    };
    loadFiltersData();
  }, []);

  const handleSearch = useCallback((filters: {
    query: string;
    categoryId: number | 'All';
    brand: string | 'All';
    quickFilter?: 'All' | 'Favorites' | 'Frequent' | 'Recent' | 'LowStock' | 'Offers';
  }) => {
    setCatalogFilters((prev) => ({
      ...prev,
      ...filters,
    }));
  }, []);

  // Checkout hook coordination
  const { checkout, isProcessing } = usePOS();

  // Handle checkout submit
  const handleCheckoutSubmit = async (billingDetails: {
    paidAmount: number;
    remainingAmount: number;
    cashReceived: number;
    changeReturned: number;
    paymentMethod: string;
    saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
    notes?: string;
    printFormat: 'thermal' | 'a4' | 'none';
  }) => {
    if (cartItems.length === 0) {
      showToast.error('Your POS shopping cart is empty.');
      return { success: false };
    }

    const checkoutDetails = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.fullName : 'Walk-in Customer',
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      tax: totals.tax,
      shipping: totals.shipping,
      otherCharges: totals.otherCharges,
      grandTotal: totals.grandTotal,
      paidAmount: billingDetails.paidAmount,
      remainingAmount: billingDetails.remainingAmount,
      cashReceived: billingDetails.cashReceived,
      changeReturned: billingDetails.changeReturned,
      paymentMethod: billingDetails.paymentMethod,
      saleType: billingDetails.saleType,
      notes: billingDetails.notes,
      createdBy: 'Cashier', // static/current cashier
    };

    const tempCartItems = [...cartItems];
    const tempCustomer = selectedCustomer ? { ...selectedCustomer } : null;

    const res = await checkout(
      cartItems,
      checkoutDetails,
      selectedCustomer,
      'none' // Bypass legacy iframe printing, we handle printing with high-fidelity React Print System!
    );

    if (res.success) {
      // Trigger our centralized print preview if requested
      if (billingDetails.printFormat !== 'none' && res.sale) {
        handlePrintPastReceipt(res.sale, tempCartItems, tempCustomer, billingDetails.printFormat);
      }
      
      // Clear terminal states
      clearCart();
      setSelectedCustomer(null);
      setOrderDiscount(0);
      setOrderTax(0);
      setShipping(0);
      setOtherCharges(0);
      // Trigger grid update
      setRefreshTrigger((prev) => prev + 1);
    }
    return res;
  };

  // Handle direct Barcode Scanner scanning input
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      const product = await db.products
        .where('barcode')
        .equals(barcode)
        .and((p) => p.status === 'Active')
        .first();

      if (product) {
        addItem(product, 1);
        showToast.success(`Added "${product.name}" via scanner`);
      } else {
        showToast.error(`No active product found matching barcode "${barcode}".`);
      }
    } catch (err) {
      console.error('Barcode lookup failed:', err);
      showToast.error('Failed to locate product by barcode.');
    }
  }, [addItem]);

  // --- LEDGER / HISTORY STATE ---
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCustomerFilter, setLedgerCustomerFilter] = useState<number>(0);
  const [ledgerPaymentStatus, setLedgerPaymentStatus] = useState<string>('All');
  const [ledgerSaleType, setLedgerSaleType] = useState<string>('All');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerSortBy] = useState('newest');
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledgerPageSize = 10;

  // Query hook
  const {
    sales: ledgerSales,
    total: ledgerTotal,
    totalPages: ledgerTotalPages,
    isLoading: isLedgerLoading,
    softDelete: voidLedgerSale,
    restore: restoreLedgerSale,
  } = useSales({
    searchQuery: ledgerSearch,
    customerId: ledgerCustomerFilter,
    paymentStatus: ledgerPaymentStatus,
    saleType: ledgerSaleType,
    startDate: ledgerStartDate,
    endDate: ledgerEndDate,
    sortBy: ledgerSortBy,
    page: ledgerPage,
    pageSize: ledgerPageSize,
  });

  // Unique list of customers for ledger filter
  const [registeredCustomers, setRegisteredCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    db.customers
      .filter((c) => !c.isDeleted)
      .toArray()
      .then((res) => setRegisteredCustomers(res));
  }, [activeMode]);

  // Selected Sale for Details Modal
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Printers hook
  const { printReceipt } = useReceiptPrinter();

  // Handles copying/duplicating an invoice back into the active shopping cart
  const handleDuplicateSale = async (items: any[]) => {
    clearCart();
    let countAdded = 0;

    for (const item of items) {
      const currentProduct = await db.products.get(item.productId);
      if (currentProduct && currentProduct.status === 'Active') {
        const available = currentProduct.currentStock ?? currentProduct.stock ?? 0;
        
        if (available > 0) {
          const qtyToAdd = Math.min(item.quantity, available);
          addItem(currentProduct, qtyToAdd);
          countAdded++;
        }
      }
    }

    if (countAdded > 0) {
      showToast.success(`Cart re-populated with ${countAdded} items from the copied invoice.`);
      setActiveMode('pos');
    } else {
      showToast.error('None of the items from this invoice are currently available/in stock.');
    }
  };

  const handlePrintPastReceipt = async (
    sale: Sale,
    items: any[],
    customer: any,
    format: 'thermal' | 'a4'
  ) => {
    try {
      if (format === 'thermal') {
        const formattedItems = items.map(item => ({
          name: item.productName || item.name || 'Product',
          quantity: item.quantity,
          price: item.sellingPrice ?? item.price ?? 0,
          subtotal: item.total ?? item.subtotal ?? (item.quantity * (item.sellingPrice ?? item.price ?? 0)),
          discount: item.discount ?? 0,
        }));

        const formattedSale = {
          invoiceNo: sale.invoiceNo || sale.invoiceNumber || 'INV-0000',
          paymentMethod: sale.paymentMethod || 'Cash',
          invoiceDate: sale.saleDate || sale.createdAt || new Date(),
          subtotal: sale.subtotal || 0,
          discount: sale.discount || 0,
          tax: sale.tax || 0,
          grandTotal: sale.grandTotal || sale.total || 0,
          amountPaid: sale.paidAmount ?? 0,
          balanceDue: sale.remainingAmount ?? 0,
        };

        openPrintPreview(`Receipt #${formattedSale.invoiceNo}`, 'receipt', formattedSale, formattedItems, 'Thermal_80mm');
      } else {
        const formattedItems = items.map(item => ({
          name: item.productName || item.name,
          sku: item.barcode || item.sku || '',
          quantity: item.quantity,
          price: item.sellingPrice || item.price,
          subtotal: item.total || item.subtotal || (item.quantity * (item.sellingPrice || item.price)),
          discount: item.discount || 0,
        }));

        const invoiceData = {
          invoiceNo: sale.invoiceNumber || sale.invoiceNo || 'INV-0000',
          invoiceDate: sale.saleDate || sale.createdAt || new Date(),
          paymentStatus: sale.paymentStatus || 'Paid',
          paymentMethod: sale.paymentMethod || 'Cash',
          subtotal: sale.subtotal,
          discount: sale.discount || 0,
          tax: sale.tax || 0,
          taxRate: sale.tax ? Math.round((sale.tax / (sale.subtotal - (sale.discount || 0))) * 100) : 0,
          grandTotal: sale.grandTotal || sale.total || 0,
          amountPaid: sale.paidAmount,
          balanceDue: sale.remainingAmount || 0,
          notes: sale.notes || '',
          customerCopyType: 'Original' as const,
          customer: {
            fullName: sale.customerName || 'Walk-in Customer',
            phone: customer?.phone || '',
            email: customer?.email || '',
            address: customer?.address || '',
          },
        };

        openPrintPreview(`Invoice #${invoiceData.invoiceNo}`, 'invoice', invoiceData, formattedItems, 'A4_Portrait');
      }
    } catch (err) {
      console.error('Failed to trigger high-fidelity React print, falling back to legacy pdf...', err);
      try {
        if (format === 'thermal') {
          await generateThermalReceipt(sale, items, 'preview');
        } else {
          await generateInvoice(sale, items, 'preview');
        }
      } catch (pdfErr) {
        console.error('PDF print backup failed:', pdfErr);
        printReceipt(sale, items, customer, format);
      }
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F1 to F6
      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('product-search-input')?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('customer-search-input')?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        document.getElementById('cart-adjustments-tab-btn')?.click();
        setTimeout(() => {
          document.getElementById('order-discount-input')?.focus();
        }, 60);
      } else if (e.key === 'F4') {
        e.preventDefault();
        document.getElementById('cart-items-tab-btn')?.click();
        setTimeout(() => {
          document.getElementById('paid-amount-input')?.focus();
        }, 60);
      } else if (e.key === 'F5') {
        e.preventDefault();
        const submitBtn = document.getElementById('checkout-submit-btn');
        if (submitBtn && !(submitBtn as HTMLButtonElement).disabled) {
          submitBtn.click();
        } else {
          showToast.error('Checkout is currently disabled. Check cart items or customer credit limits.');
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        showToast.success('Triggering receipt printing...');
        window.print();
      } else if (e.key === 'Escape') {
        // ESC clear sale
        if (activeMode === 'pos' && cartItems.length > 0) {
          e.preventDefault();
          clearCart();
          setSelectedCustomer(null);
          setOrderDiscount(0);
          setOrderTax(0);
          setShipping(0);
          setOtherCharges(0);
          showToast.success('Active transaction canceled and cleared.');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [activeMode, cartItems, clearCart]);

  if (activeMode === 'pos') {
    return (
      <POSPage
        activeMode={activeMode}
        onModeChange={setActiveMode}
        ledgerTotal={ledgerTotal}
        cartItems={cartItems}
        addItem={addItem}
        updateQuantity={updateQuantity}
        updateItemDiscount={updateItemDiscount}
        updateItemTax={updateItemTax}
        removeItem={removeItem}
        clearCart={clearCart}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        registeredCustomers={registeredCustomers}
        orderDiscount={orderDiscount}
        setOrderDiscount={setOrderDiscount}
        orderTax={orderTax}
        setOrderTax={setOrderTax}
        shipping={shipping}
        setShipping={setShipping}
        otherCharges={otherCharges}
        setOtherCharges={setOtherCharges}
        totals={totals}
        sidebarCategories={sidebarCategories}
        sidebarBrands={sidebarBrands}
        currentTime={currentTime}
        refreshTrigger={refreshTrigger}
        handleCheckoutSubmit={handleCheckoutSubmit}
        isProcessing={isProcessing}
        handleBarcodeScan={handleBarcodeScan}
        onPrintPastReceipt={handlePrintPastReceipt}
        onPDFDownload={async (sale, items, format) => {
          try {
            if (format === 'thermal') {
              await generateThermalReceipt(sale, items, 'download');
            } else {
              await generateInvoice(sale, items, 'download');
            }
            showToast.success('PDF invoice generated and downloaded.');
          } catch (err) {
            console.error('Failed to download PDF:', err);
            showToast.error('PDF generation failed.');
          }
        }}
      />
    );
  }

  return (
    <div className="pos-terminal-module pos-container flex flex-col gap-5 text-left relative min-h-screen lg:h-screen lg:overflow-hidden pb-24 lg:pb-6 bg-slate-50/50 dark:bg-slate-950" id="pos-terminal-module">
      
      {/* 1. Redesigned Premium Top Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-slate-850 pb-5 bg-white dark:bg-slate-900/60 p-4 rounded-3xl shadow-xs backdrop-blur-md">
        {/* Logo & App Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center border border-indigo-150 dark:border-indigo-900/50 shadow-2xs">
            <Zap className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/20" />
          </div>
          <div>
            <h1 className="pos-page-title text-[20px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 animate-pulse">
              Vertex POS
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">Live</span>
            </h1>
            <p className="pos-small-text text-[11.5px] font-bold text-slate-400 dark:text-slate-500">
              Station #01 | Terminal active
            </p>
          </div>
        </div>

        {/* Dynamic Live Search inside the top header */}
        {activeMode === 'pos' && (
          <div className="flex-1 max-w-lg mx-0 lg:mx-6 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="product-search-input"
              type="text"
              className="w-full h-11 pos-input pos-input-text pl-10 pr-20 text-[13px] font-bold rounded-2xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 placeholder-slate-400 transition-all shadow-2xs"
              placeholder="Search product name, brand or SKU (F1)..."
              value={catalogFilters.query}
              onChange={(e) => setCatalogFilters((prev) => ({ ...prev, query: e.target.value }))}
            />
            
            <div className="absolute right-2.5 inset-y-0 flex items-center gap-1.5">
              {catalogFilters.query && (
                <button
                  onClick={() => setCatalogFilters((prev) => ({ ...prev, query: '' }))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded font-mono select-none">
                F1
              </span>
            </div>
          </div>
        )}

        {/* Right Info: Live clock, cashier profile, active toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Live Date & Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-[11.5px] font-bold text-slate-600 dark:text-slate-450 font-mono shadow-2xs select-none">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{currentTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-slate-900 dark:text-white font-extrabold">{currentTime.toLocaleTimeString()}</span>
          </div>

          {/* Cashier avatar */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xs select-none text-left">
            <div className="h-6 w-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">
              C1
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-none font-sans">John Doe</p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-none font-sans">Cashier / Mgr</p>
            </div>
          </div>

          {/* Settings & Alerts */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleThemeMode}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer shadow-2xs"
              title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {themeMode === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
            <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer shadow-2xs">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer shadow-2xs">
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-850">
            <button
              onClick={() => setActiveMode('pos')}
              className={`px-4.5 py-1.5 text-xs font-black rounded-xl cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                activeMode === 'pos'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Terminal
            </button>
            <button
              onClick={() => setActiveMode('ledger')}
              className={`px-4.5 py-1.5 text-xs font-black rounded-xl cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                activeMode === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Ledger ({ledgerTotal})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive views */}
      {activeMode === 'ledger' && (
        /* --- VIEW 2: SALES HISTORY / LEDGER VIEW --- */
        <div className="flex flex-col gap-5">
          {/* Filters card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl shadow-xs p-4 flex flex-col gap-3.5">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-2">
              <Filter className="h-4 w-4 text-indigo-500" />
              Filter Transaction Records
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
              {/* Keyword text search */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search invoice</span>
                <input
                  type="text"
                  placeholder="e.g. INV-000001..."
                  value={ledgerSearch}
                  onChange={(e) => { setLedgerSearch(e.target.value); setLedgerPage(1); }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                />
              </div>

              {/* Customer Selector */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Customer</span>
                <select
                  value={ledgerCustomerFilter}
                  onChange={(e) => { setLedgerCustomerFilter(Number(e.target.value)); setLedgerPage(1); }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer"
                >
                  <option value={0}>All Customers</option>
                  {registeredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment status */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Status</span>
                <select
                  value={ledgerPaymentStatus}
                  onChange={(e) => { setLedgerPaymentStatus(e.target.value); setLedgerPage(1); }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer"
                >
                  <option value="All">All Payments</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Partial">Partial Only</option>
                  <option value="Unpaid">Unpaid Only</option>
                  <option value="Deleted">Voided Transactions</option>
                </select>
              </div>

              {/* Sale Type / Term */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sale Term Type</span>
                <select
                  value={ledgerSaleType}
                  onChange={(e) => { setLedgerSaleType(e.target.value); setLedgerPage(1); }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer"
                >
                  <option value="All">All Sale Terms</option>
                  <option value="Cash Sale">Cash Sale</option>
                  <option value="Credit Sale">Credit Sale</option>
                  <option value="Partial Payment Sale">Partial Payment</option>
                </select>
              </div>

              {/* Date pickers */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Start Date</span>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => { setLedgerStartDate(e.target.value); setLedgerPage(1); }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer font-mono"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">End Date</span>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => { setLedgerEndDate(e.target.value); setLedgerPage(1); }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 cursor-pointer font-mono"
                />
              </div>
            </div>

            {/* Clear filters toolbar */}
            {(ledgerSearch || ledgerCustomerFilter !== 0 || ledgerPaymentStatus !== 'All' || ledgerSaleType !== 'All' || ledgerStartDate || ledgerEndDate) && (
              <div className="flex justify-end mt-1 pt-1 border-t border-slate-100 dark:border-slate-900">
                <button
                  onClick={() => {
                    setLedgerSearch('');
                    setLedgerCustomerFilter(0);
                    setLedgerPaymentStatus('All');
                    setLedgerSaleType('All');
                    setLedgerStartDate('');
                    setLedgerEndDate('');
                  }}
                  className="text-[10px] font-extrabold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Past transactions list */}
          <SalesHistoryTable
            sales={ledgerSales}
            onViewDetails={(s) => setViewingSale(s)}
            onPrintReceipt={handlePrintPastReceipt}
            onDuplicateSale={handleDuplicateSale}
            onSoftDelete={(id) => {
              voidLedgerSale(id)
                .then(() => {
                  showToast.success('Sale voided successfully. Inventory stock levels restored.');
                  setRefreshTrigger((prev) => prev + 1);
                })
                .catch((e) => showToast.error(e.message));
            }}
            onRestore={(id) => {
              restoreLedgerSale(id)
                .then(() => {
                  showToast.success('Voided transaction restored. Inventory stock levels re-deducted.');
                  setRefreshTrigger((prev) => prev + 1);
                })
                .catch((e) => showToast.error(e.message));
            }}
            isLoading={isLedgerLoading}
          />

          {/* Ledger Pagination */}
          {ledgerTotalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-xs text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Showing {(ledgerPage - 1) * ledgerPageSize + 1}-{Math.min(ledgerPage * ledgerPageSize, ledgerTotal)} of {ledgerTotal} sales
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={ledgerPage === 1}
                  onClick={() => setLedgerPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs font-black font-mono text-slate-650 px-2">
                  {ledgerPage} / {ledgerTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={ledgerPage === ledgerTotalPages}
                  onClick={() => setLedgerPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sale Details Modal */}
      <SaleDetailsModal
        sale={viewingSale}
        onClose={() => setViewingSale(null)}
        onPrintReceipt={handlePrintPastReceipt}
      />

      <PDFPreviewDialog
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={currentTitle}
      />
    </div>
  );
};

export default Sales;
