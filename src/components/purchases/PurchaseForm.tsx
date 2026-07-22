import React, { useState, useEffect } from 'react';
import { type Purchase, type PurchaseItem, db } from '../../database/db';
import { usePurchase } from '../../hooks/usePurchase';
import { usePurchaseCart, type CartItem } from '../../hooks/usePurchaseCart';
import { usePurchaseCalculations } from '../../hooks/usePurchaseCalculations';
import SupplierSelector from './SupplierSelector';
import ProductSelector from './ProductSelector';
import PurchaseCart from './PurchaseCart';
import PurchaseSummary from './PurchaseSummary';
import PaymentSummary from './PaymentSummary';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import showToast from '../../utils/toast';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

interface PurchaseFormProps {
  purchaseId?: number; // Optional ID for edit mode
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({
  purchaseId,
  onSaveSuccess,
  onCancel,
}) => {
  const isEditMode = !!purchaseId;

  // Form Field States
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderTaxPercentage, setOrderTaxPercentage] = useState<number>(0);
  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');

  // Validation States
  const [supplierError, setSupplierError] = useState<string | undefined>(undefined);
  const [invoiceWarning, setInvoiceWarning] = useState<string | undefined>(undefined);

  // Hook integrations
  const { loadPurchaseWithItems, createNewPurchase, updateExistingPurchase, isLoading } = usePurchase();
  const {
    cart,
    addItem,
    updateQuantity,
    updatePurchasePrice,
    updateSellingPrice,
    updateItemDiscount,
    updateItemTax,
    removeItem,
    clearCart,
    loadCartItems,
  } = usePurchaseCart([]);

  // Live calculations hook
  const { subtotal, taxAmount, grandTotal, remainingAmount, paymentStatus } = usePurchaseCalculations({
    cart,
    orderDiscount,
    orderTaxPercentage,
    shippingCharges,
    otherCharges,
    paidAmount,
  });

  // Load purchase details if in EDIT MODE
  useEffect(() => {
    if (isEditMode && purchaseId) {
      loadPurchaseWithItems(purchaseId)
        .then(({ purchase: p, items: rawItems }) => {
          setSupplierId(p.supplierId);
          setPurchaseDate(
            typeof p.purchaseDate === 'string'
              ? p.purchaseDate.substring(0, 10)
              : p.purchaseDate.toISOString().substring(0, 10)
          );
          setInvoiceNumber(p.invoiceNumber || '');
          setOrderDiscount(p.discount || 0);
          setOrderTaxPercentage(p.tax > 0 && p.subtotal > 0 ? parseFloat(((p.tax / p.subtotal) * 100).toFixed(2)) : 0);
          setShippingCharges(p.shipping || 0);
          setOtherCharges(p.otherCharges || 0);
          setPaidAmount(p.paidAmount || 0);
          setPaymentMethod(p.paymentMethod || 'Cash');
          setNotes(p.notes || '');

          // Map raw purchaseItems to cartItems format
          const mappedCart: CartItem[] = rawItems.map((item) => ({
            productId: item.productId,
            barcode: item.barcode,
            productName: item.productName,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice ?? item.cost ?? 0,
            sellingPrice: item.sellingPrice || 0,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: item.total || 0,
          }));

          loadCartItems(mappedCart);
        })
        .catch((err) => {
          console.error(err);
          showToast.error('Failed to load purchase details for editing.');
          onCancel();
        });
    }
  }, [isEditMode, purchaseId, loadPurchaseWithItems, loadCartItems, onCancel]);

  // Check for duplicate invoice warning in real time
  useEffect(() => {
    const checkInvoiceNo = async () => {
      if (!invoiceNumber.trim()) {
        setInvoiceWarning(undefined);
        return;
      }
      const existing = await db.purchases
        .filter((p) => p.invoiceNumber?.toLowerCase() === invoiceNumber.trim().toLowerCase() && (!isEditMode || p.id !== purchaseId))
        .first();

      if (existing) {
        setInvoiceWarning(`Supplier Invoice No "${invoiceNumber}" is already registered on another PO (${existing.purchaseNumber}).`);
      } else {
        setInvoiceWarning(undefined);
      }
    };
    checkInvoiceNo();
  }, [invoiceNumber, isEditMode, purchaseId]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation
    if (!supplierId) {
      setSupplierError('Please select a supplier.');
      showToast.error('Please select a supplier.');
      return;
    }
    setSupplierError(undefined);

    if (cart.length === 0) {
      showToast.error('Please add at least one product to the purchase cart.');
      return;
    }

    // Check quantities and costs
    for (const item of cart) {
      if (item.quantity <= 0) {
        showToast.error(`Quantity for "${item.productName}" must be greater than zero.`);
        return;
      }
      if (item.purchasePrice <= 0) {
        showToast.error(`Purchase wholesale cost for "${item.productName}" must be greater than zero.`);
        return;
      }
    }

    if (paidAmount > grandTotal) {
      showToast.error('Paid Amount cannot exceed Grand Total.');
      return;
    }

    // 2. Prepare Data Packages
    const purchaseData = {
      supplierId,
      purchaseDate: new Date(purchaseDate),
      invoiceNumber: invoiceNumber.trim() || undefined,
      subtotal,
      discount: orderDiscount,
      tax: taxAmount,
      shipping: shippingCharges,
      otherCharges,
      grandTotal,
      total: grandTotal, // Compatibility
      paidAmount,
      remainingAmount,
      paymentStatus,
      paymentMethod,
      notes: notes.trim() || undefined,
      createdBy: 'Administrator', // hardcoded placeholder since login module details are mocked
    };

    const itemsData = cart.map((item) => ({
      productId: item.productId,
      barcode: item.barcode,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      discount: item.discount,
      tax: item.tax,
      total: item.total,
    }));

    // 3. Fire Save Database Action
    try {
      if (isEditMode && purchaseId) {
        await updateExistingPurchase(purchaseId, purchaseData, itemsData);
        showToast.success('Purchase order updated successfully.');
      } else {
        await createNewPurchase(purchaseData, itemsData);
        showToast.success('Purchase order created successfully.');
      }
      clearCart();
      onSaveSuccess();
    } catch (err: any) {
      showToast.error(err.message || 'Database error: failed to save purchase.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
      {/* Header and Back Bar */}
      <div className="flex items-center justify-between border-b border-slate-150/65 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {isEditMode ? 'Edit Purchase Order' : 'Record New Purchase Order'}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isEditMode ? 'Modify and re-evaluate PO stocks and invoices' : 'Log a wholesale bill from vendor'}
            </p>
          </div>
        </div>
        <Button type="submit" variant="primary" size="sm" className="shadow-sm flex items-center gap-1.5" isLoading={isLoading}>
          <Save className="h-4 w-4" />
          {isEditMode ? 'Save Changes' : 'Save Purchase'}
        </Button>
      </div>

      {invoiceWarning && (
        <div className="flex items-center gap-2.5 bg-amber-50/70 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs font-semibold dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
          <span>{invoiceWarning}</span>
        </div>
      )}

      {/* Top Form Grid: Supplier Selection & Invoice Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Supplier Selector Column (takes 2 grids) */}
        <div className="lg:col-span-2">
          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 border-b border-slate-50 pb-2 mb-1">
              Supplier Selection
            </h3>
            <SupplierSelector
              selectedSupplierId={supplierId}
              onChange={(id) => {
                setSupplierId(id);
                setSupplierError(undefined);
              }}
              error={supplierError}
            />
          </Card>
        </div>

        {/* Invoice Metadata Column (takes 1 grid) */}
        <div>
          <Card className="p-5 flex flex-col gap-4 h-full">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 border-b border-slate-50 pb-2 mb-1">
              Invoice Reference Details
            </h3>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                className="font-mono text-xs"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Supplier Invoice Number
              </label>
              <Input
                type="text"
                placeholder="e.g. INV-10298"
                className="text-xs"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Product Search & fast barcode scanner block */}
      <Card className="p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 border-b border-slate-50 pb-2 mb-4">
          Product Selection & Quick Add
        </h3>
        <ProductSelector onSelectProduct={(p) => addItem(p)} />
      </Card>

      {/* Purchase Cart Table list */}
      <PurchaseCart
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onUpdatePurchasePrice={updatePurchasePrice}
        onUpdateSellingPrice={updateSellingPrice}
        onUpdateItemDiscount={updateItemDiscount}
        onUpdateItemTax={updateItemTax}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />

      {/* Financial Adjustment summary and Payment Method side-by-side */}
      {cart.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PurchaseSummary
            subtotal={subtotal}
            orderDiscount={orderDiscount}
            onUpdateDiscount={setOrderDiscount}
            orderTaxPercentage={orderTaxPercentage}
            onUpdateTaxPercentage={setOrderTaxPercentage}
            shippingCharges={shippingCharges}
            onUpdateShippingCharges={setShippingCharges}
            otherCharges={otherCharges}
            onUpdateOtherCharges={setOtherCharges}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
          />

          <PaymentSummary
            paidAmount={paidAmount}
            onUpdatePaidAmount={setPaidAmount}
            remainingAmount={remainingAmount}
            paymentMethod={paymentMethod}
            onUpdatePaymentMethod={setPaymentMethod}
            paymentStatus={paymentStatus}
            notes={notes}
            onUpdateNotes={setNotes}
            grandTotal={grandTotal}
          />
        </div>
      )}

      {/* Form Action save strip */}
      <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" className="shadow-sm" isLoading={isLoading}>
          <Save className="h-4.5 w-4.5 mr-1" />
          {isEditMode ? 'Update Purchase Order' : 'Save Purchase Order'}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;
