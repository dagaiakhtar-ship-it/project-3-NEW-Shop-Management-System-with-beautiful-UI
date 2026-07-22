import React from 'react';
import ShoppingCartHeader from './ShoppingCartHeader';
import CartItemCard from './CartItemCard';
import EmptyCart from './EmptyCart';
import LoadingCart from './LoadingCart';
import { type CartItem } from '../../../hooks/useCart';

interface ShoppingCartPanelProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const ShoppingCartPanel: React.FC<ShoppingCartPanelProps> = ({
  cartItems,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
  onClear,
  isLoading = false,
}) => {
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      className="w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[16px] p-3.5 shadow-xs text-left flex flex-col h-[320px]"
      id="pos-shopping-cart-panel"
    >
      {/* 1. Header component */}
      <ShoppingCartHeader
        totalItemCount={totalItemCount}
        onClear={onClear}
        onRefresh={() => {}}
        isLoading={isLoading}
      />

      {/* 2. Cart Body items or loaders/placeholder empty state */}
      <div className="flex-1 overflow-hidden flex flex-col mt-2.5 min-h-0">
        {isLoading ? (
          <div className="flex-1 overflow-y-auto pr-1">
            <LoadingCart />
          </div>
        ) : cartItems.length === 0 ? (
          <EmptyCart onBrowse={() => {}} />
        ) : (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1 scrollbar-none"
            id="pos-shopping-cart-scroll-container"
          >
            {cartItems.map((item) => (
              <CartItemCard
                key={item.productId}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateDiscount={onUpdateDiscount}
                onUpdateTax={onUpdateTax}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ShoppingCartPanel);
