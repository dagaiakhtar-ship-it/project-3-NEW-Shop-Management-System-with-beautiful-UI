import { useState, useCallback } from 'react';
import { useInvoiceGenerator } from './useInvoiceGenerator';
import { useStockValidation } from './useStockValidation';
import { useReceiptPrinter } from './useReceiptPrinter';
import { saveSale } from '../database/salesHelper';
import { type Sale, type SaleItem, type Customer } from '../database/db';
import showToast from '../utils/toast';

export interface CheckoutDetails {
  customerId?: number;
  customerName?: string;
  subtotal: number;
  discount: number; // order level discount
  tax: number; // order level tax
  shipping: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  cashReceived: number;
  changeReturned: number;
  paymentMethod: string;
  saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
  notes?: string;
  createdBy?: string;
}

/**
 * Custom hook coordinating the complete POS checkout terminal transaction pipeline.
 */
export function usePOS() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateInvoiceNumber } = useInvoiceGenerator();
  const { validateStock } = useStockValidation();
  const { printReceipt } = useReceiptPrinter();

  const checkout = useCallback(async (
    cartItems: Array<{
      productId: number;
      productName: string;
      barcode?: string;
      sku: string;
      quantity: number;
      sellingPrice: number;
      purchasePrice: number;
      discount: number;
      tax: number;
      availableStock: number;
    }>,
    billing: CheckoutDetails,
    customer: Customer | null,
    printFormat: 'thermal' | 'a4' | 'none' = 'none'
  ): Promise<{ success: boolean; sale?: Sale }> => {
    
    if (cartItems.length === 0) {
      showToast.error('Validation Error: Point of Sale cart is currently empty.');
      return { success: false };
    }

    // 1. Verify Stock levels
    setIsProcessing(true);
    try {
      const stockCheck = await validateStock(
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName,
        }))
      );

      if (!stockCheck.isValid) {
        showToast.error(stockCheck.errors[0]?.message || 'Insufficient stock to complete purchase.');
        setIsProcessing(false);
        return { success: false };
      }

      // 2. Validate Paid amount vs Grand Total
      if (billing.paidAmount > billing.grandTotal) {
        showToast.error('Validation Error: Paid amount cannot exceed grand total.');
        setIsProcessing(false);
        return { success: false };
      }

      // 3. Validate Credit customer requirement
      if ((billing.saleType === 'Credit Sale' || billing.saleType === 'Partial Payment Sale') && !billing.customerId) {
        showToast.error('Validation Error: A registered customer is required for Credit and Partial Sales.');
        setIsProcessing(false);
        return { success: false };
      }

      // 4. Generate Invoice Number
      const invoiceNumber = await generateInvoiceNumber();

      // 5. Structure payload for sales database helper
      const salePayload: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNo'> = {
        invoiceNumber,
        customerId: billing.customerId,
        customerName: customer ? customer.fullName : (billing.customerName || 'Walk-in Customer'),
        saleDate: new Date(),
        subtotal: billing.subtotal,
        discount: billing.discount,
        tax: billing.tax,
        shipping: billing.shipping,
        otherCharges: billing.otherCharges,
        grandTotal: billing.grandTotal,
        total: billing.grandTotal, // compatibility
        paidAmount: billing.paidAmount,
        remainingAmount: billing.remainingAmount,
        changeReturned: billing.changeReturned,
        changeAmount: billing.changeReturned, // compatibility
        paymentStatus: billing.remainingAmount === 0 
          ? 'Paid' 
          : billing.paidAmount > 0 ? 'Partial' : 'Unpaid',
        status: 'Completed', // compatibility
        paymentMethod: billing.paymentMethod,
        saleType: billing.saleType,
        cashReceived: billing.cashReceived,
        notes: billing.notes,
        createdBy: billing.createdBy || 'Cashier',
        userId: 1, // compatibility default
      };

      const itemsPayload: Array<Omit<SaleItem, 'id' | 'saleId'>> = cartItems.map((item) => {
        const itemSubtotal = item.sellingPrice * item.quantity;
        const itemDiscountTotal = item.discount * item.quantity;
        const itemTaxTotal = item.tax * item.quantity;
        const itemTotal = itemSubtotal - itemDiscountTotal + itemTaxTotal;
        const profit = itemTotal - (item.purchasePrice * item.quantity);

        return {
          productId: item.productId,
          barcode: item.barcode,
          productName: item.productName,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          price: item.sellingPrice, // compatibility
          discount: item.discount,
          tax: item.tax,
          profit,
          total: itemTotal,
          subtotal: itemTotal, // compatibility
        };
      });

      // 6. Persist to database inside transaction
      const saveResult = await saveSale(salePayload, itemsPayload);

      // Check for low stock warnings on products purchased to show toast warnings
      cartItems.forEach((item) => {
        const remainingStock = item.availableStock - item.quantity;
        // Supposing 5 is general warning or let's use product's minimumStock
        if (remainingStock <= 2) {
          showToast.warning(`Low Stock Alert: "${item.productName}" is down to ${remainingStock} unit(s).`);
        }
      });

      showToast.success(`Checkout Complete! Generated Invoice: ${invoiceNumber}`);

      // 7. Trigger Receipt print if requested
      if (printFormat !== 'none') {
        try {
          const loadedItems = itemsPayload.map((item) => ({
            ...item,
            saleId: saveResult.saleId,
          } as SaleItem));
          printReceipt(saveResult.sale, loadedItems, customer, printFormat);
        } catch (printErr) {
          console.error('Failed to trigger receipt print window:', printErr);
          showToast.info('Checkout saved successfully, but receipt printing skipped/failed.');
        }
      }

      // 8. Trigger Google Sheets Sync Placeholder
      console.log('[Google Sheets Sync Placeholder] Queueing POS transaction details sync:', invoiceNumber);

      setIsProcessing(false);
      return { success: true, sale: saveResult.sale };
    } catch (err: any) {
      console.error('POS Checkout failed:', err);
      showToast.error(err.message || 'Database Error: POS Checkout failed.');
      setIsProcessing(false);
      return { success: false };
    }
  }, [validateStock, generateInvoiceNumber, printReceipt]);

  return {
    checkout,
    isProcessing,
  };
}

export default usePOS;
