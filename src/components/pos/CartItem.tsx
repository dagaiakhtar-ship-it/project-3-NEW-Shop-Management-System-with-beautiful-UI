import React, { useState } from 'react';
import { Minus, Plus, Trash2, Tag, Percent, ShoppingBag, FileText } from 'lucide-react';
import { type CartItem as ICartItem } from '../../hooks/useCart';

interface CartItemProps {
  item: ICartItem;
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
}) => {
  const [qtyInput, setQtyInput] = useState(item.quantity.toString());
  const [discountInput, setDiscountInput] = useState(item.discount.toString());
  const [taxInput, setTaxInput] = useState(item.tax.toString());
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  
  // Local notes state for visual cashier annotations
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [itemNote, setItemNote] = useState('');

  const handleQtyBlur = () => {
    const parsed = parseInt(qtyInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      onUpdateQuantity(item.productId, 1);
      setQtyInput('1');
    } else {
      onUpdateQuantity(item.productId, parsed);
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQtyBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleDiscountBlur = () => {
    const parsed = parseFloat(discountInput);
    if (isNaN(parsed) || parsed < 0) {
      onUpdateDiscount(item.productId, 0);
      setDiscountInput('0');
    } else {
      onUpdateDiscount(item.productId, parsed);
    }
    setIsEditingDiscount(false);
  };

  const handleTaxBlur = () => {
    const parsed = parseFloat(taxInput);
    if (isNaN(parsed) || parsed < 0) {
      onUpdateTax(item.productId, 0);
      setTaxInput('0');
    } else {
      onUpdateTax(item.productId, parsed);
    }
    setIsEditingTax(false);
  };

  // Sync inputs with outer item updates
  React.useEffect(() => {
    setQtyInput(item.quantity.toString());
  }, [item.quantity]);

  React.useEffect(() => {
    setDiscountInput(item.discount.toString());
  }, [item.discount]);

  React.useEffect(() => {
    setTaxInput(item.tax.toString());
  }, [item.tax]);

  const rowTotal = (item.sellingPrice * item.quantity) - (item.discount * item.quantity) + (item.tax * item.quantity);

  return (
    <div className="pos-cart-row pos-card-padding flex flex-col p-3 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 last:border-0 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5 transition duration-150 gap-2.5">
      
      {/* Upper row: Details & Controls */}
      <div className="flex items-center justify-between gap-3">
        
        {/* 1. Item Visual & details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
          <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
            {item.image ? (
              <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-4.5 w-4.5 text-slate-400 stroke-[1.5]" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <h5 className="pos-normal-text text-[13px] font-bold text-slate-850 dark:text-slate-200 truncate leading-snug">
              {item.productName}
            </h5>
            <p className="pos-small-text text-[11px] font-semibold font-mono text-slate-450 dark:text-slate-500 mt-0.5">
              ${item.sellingPrice.toFixed(2)} | Qty: {item.availableStock}
              {item.quantity > item.availableStock && (
                <span className="text-rose-550 font-bold ml-1 animate-pulse">
                  (Exceeds!)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 2. Quantity, discounts, taxes */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quantity Controls (+ / -) */}
          <div className="flex items-center rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-55/60 dark:bg-slate-950 p-0.5 h-8">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="p-1 h-6 w-6 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-all duration-150 flex items-center justify-center cursor-pointer"
              title="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="text"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onBlur={handleQtyBlur}
              onKeyDown={handleQtyKeyDown}
              className="w-8 text-center pos-small-text text-[11.5px] font-black font-mono bg-transparent outline-none border-none text-slate-855 dark:text-slate-100 p-0 focus:ring-0"
            />
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="p-1 h-6 w-6 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-all duration-150 flex items-center justify-center cursor-pointer"
              title="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line discount button/field */}
          <div className="flex items-center h-8 shrink-0">
            {isEditingDiscount ? (
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                onBlur={handleDiscountBlur}
                autoFocus
                className="w-12 h-7 text-center text-[11px] font-bold font-mono border border-indigo-500 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none p-0 focus:ring-1 focus:ring-indigo-500/10"
              />
            ) : (
              <button
                onClick={() => setIsEditingDiscount(true)}
                className="flex items-center gap-1 pos-small-text text-[11px] font-extrabold text-slate-500 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-50/60 dark:bg-slate-950 px-2 py-1 rounded border border-slate-250 dark:border-slate-800 h-full transition hover:bg-slate-100/60 duration-150 cursor-pointer shadow-2xs"
                title="Edit item discount"
              >
                <Tag className="h-3 w-3 text-indigo-400" />
                <span className="font-mono">-${item.discount}</span>
              </button>
            )}
          </div>

          {/* Line tax button/field */}
          <div className="flex items-center h-8 shrink-0">
            {isEditingTax ? (
              <input
                type="text"
                value={taxInput}
                onChange={(e) => setTaxInput(e.target.value)}
                onBlur={handleTaxBlur}
                autoFocus
                className="w-12 h-7 text-center text-[11px] font-bold font-mono border border-indigo-500 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none p-0 focus:ring-1 focus:ring-indigo-500/10"
              />
            ) : (
              <button
                onClick={() => setIsEditingTax(true)}
                className="flex items-center gap-1 pos-small-text text-[11px] font-extrabold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 bg-slate-50/60 dark:bg-slate-950 px-2 py-1 rounded border border-slate-250 dark:border-slate-800 h-full transition hover:bg-slate-100/60 duration-150 cursor-pointer shadow-2xs"
                title="Edit item tax"
              >
                <Percent className="h-3 w-3 text-teal-500" />
                <span className="font-mono">+${item.tax}</span>
              </button>
            )}
          </div>

          {/* Line total */}
          <div className="w-16 text-right font-mono pos-price text-[13.5px] font-black text-slate-850 dark:text-white shrink-0">
            ${rowTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Action buttons & item notes footer area */}
      <div className="flex items-center justify-between gap-3 mt-1 pt-1.5 border-t border-dashed border-slate-150 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotesInput(!showNotesInput)}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition duration-150 cursor-pointer shadow-2xs ${
              itemNote
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-450 border border-amber-200'
                : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:text-slate-300 border border-slate-200/65'
            }`}
          >
            <FileText className="h-3 w-3" />
            {itemNote ? 'Notes Added' : 'Add Note'}
          </button>
          
          {itemNote && (
            <span className="text-[10.5px] italic text-slate-400 truncate max-w-[140px]">
              "{itemNote}"
            </span>
          )}
        </div>

        <button
          onClick={() => onRemove(item.productId)}
          className="p-1 rounded hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-350 transition duration-150 cursor-pointer shrink-0"
          title="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Collapsible Notes text box */}
      {showNotesInput && (
        <div className="mt-1 animate-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            placeholder="Cashier note..."
            value={itemNote}
            onChange={(e) => setItemNote(e.target.value)}
            className="w-full h-8 text-[11.5px] px-2.5 rounded border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );
};

export default CartItem;
