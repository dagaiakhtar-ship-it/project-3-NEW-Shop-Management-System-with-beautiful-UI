import React, { useState, useMemo } from 'react';
import { ShoppingCart as CartIcon, Trash2, Tag, Percent, Truck, PlusCircle, Sparkles } from 'lucide-react';
import { type CartItem as ICartItem } from '../../hooks/useCart';
import CartItem from './CartItem';

interface ShoppingCartProps {
  cartItems: ICartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  
  // Order levels
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
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'adjustments'>('items');

  // Calculate item count
  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Calculate estimated transaction profit for cashier's business visibility (Lightspeed/Square feature)
  const estimatedProfit = useMemo(() => {
    let profit = 0;
    cartItems.forEach((item) => {
      const cost = item.purchasePrice ?? 0;
      const sell = item.sellingPrice;
      const qty = item.quantity;
      const disc = item.discount; // per item discount
      profit += (sell - cost - disc) * qty;
    });
    // subtract order-level adjustments
    profit -= orderDiscount;
    return Math.max(0, profit);
  }, [cartItems, orderDiscount]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/85 rounded-xl shadow-xs text-left overflow-hidden transition-all">
      
      {/* 1. Header with items counter badge */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <h3 className="text-xs font-bold text-slate-855 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <CartIcon className="h-4 w-4 text-indigo-500" />
          Active Cart
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-450 font-mono">
            {totalItemCount}
          </span>
        </h3>
        
        {cartItems.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50/50 dark:bg-rose-955/20 px-2 py-0.5 rounded transition-all duration-150 cursor-pointer border border-rose-200/50 dark:border-rose-900/20"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* 2. Visual Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 bg-slate-50/15 p-1 gap-1">
        <button
          id="cart-items-tab-btn"
          onClick={() => setActiveTab('items')}
          className={`flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition duration-150 cursor-pointer ${
            activeTab === 'items'
              ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50'
          }`}
        >
          Cart Items ({cartItems.length})
        </button>
        <button
          id="cart-adjustments-tab-btn"
          onClick={() => setActiveTab('adjustments')}
          className={`flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition duration-150 cursor-pointer ${
            activeTab === 'adjustments'
              ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50'
          }`}
        >
          Adjustments
        </button>
      </div>

      {/* 3. Tab Contents with Scrollable Window */}
      <div className="flex-1 overflow-y-auto max-h-[280px] scrollbar-thin scrollbar-track-transparent">
        {activeTab === 'items' ? (
          cartItems.length === 0 ? (
            /* Premium Empty Cart State Illustration */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-400">
              <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-2">
                <CartIcon className="h-4 w-4 text-slate-400 dark:text-slate-700" />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Your cart is empty</p>
              <p className="text-[10px] text-slate-450 mt-1 max-w-[190px] leading-normal font-medium">
                Scan barcodes or tap products to begin a transaction.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-850/60">
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
          )
        ) : (
          /* Adjustments parameters panel */
          <div className="p-3 flex flex-col gap-2">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Order Adjustments</h4>

            {/* Discount */}
            <div className="flex items-center justify-between gap-2 bg-slate-50/40 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-indigo-450" />
                <span className="text-[11px] font-bold text-slate-750 dark:text-slate-350">Order Discount ($)</span>
              </div>
              <input
                id="order-discount-input"
                type="number"
                value={orderDiscount || ''}
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                className="w-20 h-7 text-right text-xs font-black font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-850 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between gap-2 bg-slate-50/40 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Percent className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-[11px] font-bold text-slate-750 dark:text-slate-350">Sales Tax ($)</span>
              </div>
              <input
                id="order-tax-input"
                type="number"
                value={orderTax || ''}
                onChange={(e) => setOrderTax(Math.max(0, Number(e.target.value)))}
                className="w-20 h-7 text-right text-xs font-black font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-850 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between gap-2 bg-slate-50/40 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-sky-555" />
                <span className="text-[11px] font-bold text-slate-750 dark:text-slate-350">Shipping charges ($)</span>
              </div>
              <input
                type="number"
                value={shipping || ''}
                onChange={(e) => setShipping(Math.max(0, Number(e.target.value)))}
                className="w-20 h-7 text-right text-xs font-black font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-850 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            {/* Other Charges */}
            <div className="flex items-center justify-between gap-2 bg-slate-50/40 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-750 dark:text-slate-350">Other Charges ($)</span>
              </div>
              <input
                type="number"
                value={otherCharges || ''}
                onChange={(e) => setOtherCharges(Math.max(0, Number(e.target.value)))}
                className="w-20 h-7 text-right text-xs font-black font-mono rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-850 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Financial Calculation Summary Footer */}
      <div className="border-t border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/15 p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-450 dark:text-slate-500">
          <span>Subtotal</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">${totals.subtotal.toFixed(2)}</span>
        </div>

        {totals.totalDiscount > 0 && (
          <div className="flex justify-between items-center text-[11px] font-bold text-rose-555">
            <span>Discounts</span>
            <span className="font-mono">-${totals.totalDiscount.toFixed(2)}</span>
          </div>
        )}

        {totals.tax > 0 && (
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-450 dark:text-slate-500">
            <span>Taxes & VAT</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">+${totals.tax.toFixed(2)}</span>
          </div>
        )}

        {(totals.shipping > 0 || totals.otherCharges > 0) && (
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-450 dark:text-slate-500">
            <span>Shipping / Other</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">+${(totals.shipping + totals.otherCharges).toFixed(2)}</span>
          </div>
        )}

        {/* Estimated profit display for cashiers */}
        {cartItems.length > 0 && (
          <div className="flex justify-between items-center text-[10px] font-bold text-emerald-600 bg-emerald-500/5 dark:text-emerald-400 px-2 py-1 rounded-lg border border-emerald-55/15 mt-0.5">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
              Est. Profit
            </span>
            <span className="font-mono font-black">${estimatedProfit.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-slate-205 dark:border-slate-800/80 pt-2.5 mt-1">
          <span className="text-[11px] font-bold text-slate-855 dark:text-slate-150 uppercase tracking-wider">Grand Total</span>
          <span className="text-[17px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
            ${totals.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
