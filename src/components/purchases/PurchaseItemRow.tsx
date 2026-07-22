import React from 'react';
import { type CartItem } from '../../hooks/usePurchaseCart';
import { Trash2 } from 'lucide-react';
import Input from '../ui/Input';

interface PurchaseItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onUpdatePurchasePrice: (price: number) => void;
  onUpdateSellingPrice: (price: number) => void;
  onUpdateItemDiscount: (discount: number) => void;
  onUpdateItemTax: (tax: number) => void;
  onRemove: () => void;
}

export const PurchaseItemRow: React.FC<PurchaseItemRowProps> = ({
  item,
  onUpdateQuantity,
  onUpdatePurchasePrice,
  onUpdateSellingPrice,
  onUpdateItemDiscount,
  onUpdateItemTax,
  onRemove,
}) => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
      {/* Product Details Column */}
      <td className="p-3 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            {item.productName}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
            {item.barcode || 'No Barcode'}
          </span>
        </div>
      </td>

      {/* Quantity Column */}
      <td className="p-3 w-24">
        <Input
          type="number"
          min="1"
          className="text-center font-mono text-xs p-1"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(Number(e.target.value))}
        />
      </td>

      {/* Purchase Cost Price Column */}
      <td className="p-3 w-28">
        <div className="relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            className="pl-5 font-mono text-xs p-1"
            value={item.purchasePrice}
            onChange={(e) => onUpdatePurchasePrice(Number(e.target.value))}
          />
        </div>
      </td>

      {/* Selling Price Column */}
      <td className="p-3 w-28">
        <div className="relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            className="pl-5 font-mono text-xs p-1"
            value={item.sellingPrice}
            onChange={(e) => onUpdateSellingPrice(Number(e.target.value))}
          />
        </div>
      </td>

      {/* Discount Column */}
      <td className="p-3 w-24">
        <div className="relative">
          <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">$</span>
          <Input
            type="number"
            min="0"
            className="pl-5 font-mono text-xs p-1"
            value={item.discount}
            onChange={(e) => onUpdateItemDiscount(Number(e.target.value))}
          />
        </div>
      </td>

      {/* Tax % Column */}
      <td className="p-3 w-20">
        <div className="relative">
          <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">%</span>
          <Input
            type="number"
            min="0"
            className="pr-5 font-mono text-xs p-1"
            value={item.tax}
            onChange={(e) => onUpdateItemTax(Number(e.target.value))}
          />
        </div>
      </td>

      {/* Item Total Column */}
      <td className="p-3 text-right font-mono text-xs font-black text-slate-800 dark:text-slate-200">
        ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Remove Action Button Column */}
      <td className="p-3 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

export default PurchaseItemRow;
