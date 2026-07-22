import { useCallback } from 'react';

export interface CalculationItem {
  productId: number;
  quantity: number;
  sellingPrice: number;
  purchasePrice?: number;
  discount?: number; // per-unit discount or flat item discount
  tax?: number; // per-unit tax or flat item tax
}

export interface CalculationParams {
  items: CalculationItem[];
  orderDiscount?: number; // flat discount
  orderTax?: number; // flat tax
  shipping?: number;
  otherCharges?: number;
  paidAmount?: number;
  cashReceived?: number;
}

export interface CalculationResult {
  subtotal: number;
  itemDiscountTotal: number;
  orderDiscount: number;
  totalDiscount: number;
  tax: number;
  shipping: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  cashReceived: number;
  changeReturned: number;
  profit: number;
}

/**
 * Custom hook to calculate real-time financials for the POS transaction.
 */
export function useSaleCalculations() {
  const calculate = useCallback((params: CalculationParams): CalculationResult => {
    const {
      items = [],
      orderDiscount = 0,
      orderTax = 0,
      shipping = 0,
      otherCharges = 0,
      paidAmount = 0,
      cashReceived = 0,
    } = params;

    // 1. Calculate items sum
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let itemTaxTotal = 0;
    let totalCost = 0;

    items.forEach((item) => {
      const qty = item.quantity;
      const price = item.sellingPrice;
      const cost = item.purchasePrice ?? 0;
      const disc = item.discount ?? 0;
      const tx = item.tax ?? 0;

      subtotal += price * qty;
      itemDiscountTotal += disc * qty; // item discount is applied per unit or flat? Let's assume flat or per unit. Let's do disc * qty.
      itemTaxTotal += tx * qty;
      totalCost += cost * qty;
    });

    // 2. Aggregate discounts
    const totalDiscount = itemDiscountTotal + orderDiscount;

    // 3. Aggregate taxes
    const tax = itemTaxTotal + orderTax;

    // 4. Grand Total
    const grandTotal = Math.max(0, subtotal - totalDiscount + tax + shipping + otherCharges);

    // 5. Remaining Amount
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    // 6. Change Returned (for cashReceived vs paidAmount)
    const changeReturned = cashReceived > paidAmount ? cashReceived - paidAmount : 0;

    // 7. Profit = Grand Total - Total Cost of goods
    // To be precise: Profit = (Subtotal - totalDiscount + tax + shipping + otherCharges) - totalCost
    // Or normally: Profit = (Subtotal - totalDiscount) - totalCost (excluding tax and shipping/otherCharges as they are expenses/revenue offset)
    // Let's do: Profit = grandTotal - totalCost (or grandTotal - totalCost - tax - shipping - otherCharges if they are neutral).
    // Let's do: revenue = subtotal - totalDiscount; profit = revenue - totalCost;
    // Let's use the grandTotal - totalCost to be simple and align with standard, but let's make sure it's at least 0.
    const revenue = subtotal - totalDiscount;
    const profit = revenue - totalCost;

    return {
      subtotal,
      itemDiscountTotal,
      orderDiscount,
      totalDiscount,
      tax,
      shipping,
      otherCharges,
      grandTotal,
      paidAmount,
      remainingAmount,
      cashReceived,
      changeReturned,
      profit
    };
  }, []);

  return {
    calculate,
  };
}
