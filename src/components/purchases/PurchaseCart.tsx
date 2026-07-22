import React from 'react';
import { type CartItem } from '../../hooks/usePurchaseCart';
import PurchaseItemRow from './PurchaseItemRow';
import Button from '../ui/Button';
import { ShoppingBag, X } from 'lucide-react';

interface PurchaseCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdatePurchasePrice: (productId: number, price: number) => void;
  onUpdateSellingPrice: (productId: number, price: number) => void;
  onUpdateItemDiscount: (productId: number, discount: number) => void;
  onUpdateItemTax: (productId: number, tax: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

export const PurchaseCart: React.FC<PurchaseCartProps> = ({
  cart,
  onUpdateQuantity,
  onUpdatePurchasePrice,
  onUpdateSellingPrice,
  onUpdateItemDiscount,
  onUpdateItemTax,
  onRemoveItem,
  onClearCart,
}) => {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/5 text-center">
        <ShoppingBag className="h-10 w-10 text-slate-350 dark:text-slate-650 mb-3 animate-bounce" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Your purchase cart is empty.
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Scan a product or search above to add items to this purchase order.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-2">
          <span>Purchase Cart Items</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
            {cart.length}
          </span>
        </h3>
        <Button
          variant="outline"
          size="xs"
          onClick={onClearCart}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 font-bold border-red-150"
        >
          <X className="h-3 w-3 mr-1" />
          Clear Cart
        </Button>
      </div>

      <div className="border border-slate-150/75 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-3 text-left">Product Name</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-left">Unit Cost</th>
                <th className="p-3 text-left">Selling Price</th>
                <th className="p-3 text-left">Discount</th>
                <th className="p-3 text-center">Tax %</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <PurchaseItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={(qty) => onUpdateQuantity(item.productId, qty)}
                  onUpdatePurchasePrice={(price) => onUpdatePurchasePrice(item.productId, price)}
                  onUpdateSellingPrice={(price) => onUpdateSellingPrice(item.productId, price)}
                  onUpdateItemDiscount={(disc) => onUpdateItemDiscount(item.productId, disc)}
                  onUpdateItemTax={(tax) => onUpdateItemTax(item.productId, tax)}
                  onRemove={() => onRemoveItem(item.productId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCart;
