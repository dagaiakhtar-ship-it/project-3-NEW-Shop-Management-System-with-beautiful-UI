import { useMemo } from 'react';
import { type CartItem } from './usePurchaseCart';

interface UsePurchaseCalculationsParams {
  cart: CartItem[];
  orderDiscount: number;
  orderTaxPercentage: number;
  shippingCharges: number;
  otherCharges: number;
  paidAmount: number;
}

export function usePurchaseCalculations({
  cart,
  orderDiscount = 0,
  orderTaxPercentage = 0,
  shippingCharges = 0,
  otherCharges = 0,
  paidAmount = 0,
}: UsePurchaseCalculationsParams) {
  return useMemo(() => {
    // 1. Calculate subtotal (sum of item totals)
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);

    // 2. Apply order-level discount
    const afterDiscount = Math.max(0, subtotal - orderDiscount);

    // 3. Apply order-level tax percentage
    const taxAmount = parseFloat((afterDiscount * (orderTaxPercentage / 100)).toFixed(2));

    // 4. Grand Total calculation
    const grandTotal = parseFloat(
      (afterDiscount + taxAmount + shippingCharges + otherCharges).toFixed(2)
    );

    // 5. Remaining balance (liability)
    const remainingAmount = parseFloat(Math.max(0, grandTotal - paidAmount).toFixed(2));

    // 6. Automatic Payment status determination
    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'Partial';
    }

    return {
      subtotal,
      taxAmount,
      grandTotal,
      remainingAmount,
      paymentStatus,
    };
  }, [cart, orderDiscount, orderTaxPercentage, shippingCharges, otherCharges, paidAmount]);
}

export default usePurchaseCalculations;
