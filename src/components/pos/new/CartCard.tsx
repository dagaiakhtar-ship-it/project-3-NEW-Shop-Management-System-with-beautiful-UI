import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Tag, Percent, Settings2 } from 'lucide-react';
import { type CartItem } from '../../../hooks/useCart';

interface CartCardProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
}

export const CartCard: React.FC<CartCardProps> = ({
  cartItems,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
  onClear,
}) => {
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 shadow-sm text-left flex flex-col h-[350px]"
      id="pos-cart-card"
    >
      {/* 1. Header with Title and Cart Badge & Clear Button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
            Active Order
          </h3>
          <span
            className="bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-450 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-500/15"
            id="pos-cart-badge"
          >
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[12px] font-bold text-rose-600 dark:text-rose-455 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {/* 2. Cart Body - List of Items vs Empty Placeholder */}
      {cartItems.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center p-4 text-center mt-2"
          id="pos-cart-empty-body"
        >
          <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-[20px] mb-2">
            🛒
          </div>
          <p className="text-[14px] font-medium text-slate-900 dark:text-slate-100">Order is Empty</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] leading-relaxed mx-auto">
            Click on products in the catalog to add them to this sale.
          </p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 pr-1 mt-1 scrollbar-none"
          id="pos-cart-active-items"
        >
          {cartItems.map((item) => {
            const isEditing = editingItemId === item.productId;
            const itemSubtotal = item.quantity * item.sellingPrice;

            return (
              <div key={item.productId} className="py-3 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  {/* Item Description info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100 truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                      ${item.sellingPrice.toFixed(2)} x {item.quantity}
                    </span>
                  </div>

                  {/* Item Price and delete button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[14px] font-bold text-slate-900 dark:text-slate-100 font-mono">
                      ${itemSubtotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(item.productId)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Controls and Expandable adjustments row */}
                <div className="flex items-center justify-between gap-4 mt-1">
                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="h-7 w-7 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 w-8 text-center font-mono select-none">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="h-7 w-7 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Settings toggle button for item discount and tax */}
                  <div className="flex items-center gap-1.5">
                    {item.discount > 0 && (
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-455 bg-rose-600/10 border border-rose-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                        <Tag className="h-2.5 w-2.5" />
                        -${item.discount}
                      </span>
                    )}
                    {item.tax > 0 && (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-600/10 dark:bg-indigo-950/35 border border-indigo-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                        <Percent className="h-2.5 w-2.5" />
                        +{item.tax}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingItemId(isEditing ? null : item.productId)}
                      className={`p-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                        isEditing
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-455 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                      title="Adjust Item Discount/Tax"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline item adjustments editor */}
                {isEditing && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 mt-1 text-[11px] animate-in slide-in-from-top-1 duration-150">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-0.5">
                        <Tag className="h-3 w-3" />
                        Discount ($)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.discount || ''}
                        onChange={(e) => onUpdateDiscount(item.productId, Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                        className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-md text-[12px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <span className="font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-0.5">
                        <Percent className="h-3 w-3" />
                        Tax Rate (%)
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.tax || ''}
                        onChange={(e) => onUpdateTax(item.productId, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        placeholder="0%"
                        className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-md text-[12px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(CartCard);
