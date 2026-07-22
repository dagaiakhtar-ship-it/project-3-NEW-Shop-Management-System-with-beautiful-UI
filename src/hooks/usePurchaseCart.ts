import { useState, useCallback } from 'react';
import { type Product } from '../database/db';

export interface CartItem {
  productId: number;
  barcode?: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  discount: number; // Item-level discount (percentage or flat amount)
  tax: number; // Item-level tax percentage
  total: number; // Calculated item total
}

export function usePurchaseCart(initialItems: CartItem[] = []) {
  const [cart, setCart] = useState<CartItem[]>(initialItems);

  // Recalculates total for a single cart item
  const calculateItemTotal = useCallback((item: Omit<CartItem, 'total'>): number => {
    const baseTotal = item.quantity * item.purchasePrice;
    const discountAmount = item.discount; // assume flat discount for now, or percentage if desired
    const afterDiscount = Math.max(0, baseTotal - discountAmount);
    const taxAmount = afterDiscount * (item.tax / 100);
    return parseFloat((afterDiscount + taxAmount).toFixed(2));
  }, []);

  // Adds a product to the cart
  const addItem = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      
      const purchasePrice = product.purchasePrice ?? product.cost ?? 0;
      const sellingPrice = product.sellingPrice ?? product.price ?? 0;

      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        const updatedQty = existing.quantity + quantity;
        const updatedItem = {
          ...existing,
          quantity: updatedQty,
        };
        updatedItem.total = calculateItemTotal(updatedItem);

        const newCart = [...prev];
        newCart[existingIdx] = updatedItem;
        return newCart;
      } else {
        const newItem: CartItem = {
          productId: product.id!,
          barcode: product.barcode,
          productName: product.name,
          quantity,
          purchasePrice,
          sellingPrice,
          discount: 0,
          tax: 0,
          total: 0,
        };
        newItem.total = calculateItemTotal(newItem);
        return [...prev, newItem];
      }
    });
  }, [calculateItemTotal]);

  // Updates quantity of a cart item
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, quantity: Math.max(1, quantity) };
          updated.total = calculateItemTotal(updated);
          return updated;
        }
        return item;
      })
    );
  }, [calculateItemTotal]);

  // Updates purchase price of a cart item
  const updatePurchasePrice = useCallback((productId: number, price: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, purchasePrice: Math.max(0, price) };
          updated.total = calculateItemTotal(updated);
          return updated;
        }
        return item;
      })
    );
  }, [calculateItemTotal]);

  // Updates selling price of a cart item
  const updateSellingPrice = useCallback((productId: number, price: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, sellingPrice: Math.max(0, price) };
        }
        return item;
      })
    );
  }, []);

  // Updates item level discount
  const updateItemDiscount = useCallback((productId: number, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, discount: Math.max(0, discount) };
          updated.total = calculateItemTotal(updated);
          return updated;
        }
        return item;
      })
    );
  }, [calculateItemTotal]);

  // Updates item level tax percentage
  const updateItemTax = useCallback((productId: number, tax: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, tax: Math.max(0, tax) };
          updated.total = calculateItemTotal(updated);
          return updated;
        }
        return item;
      })
    );
  }, [calculateItemTotal]);

  // Removes an item from the cart
  const removeItem = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  // Clears the cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Manual setter (useful when loading items of an existing purchase order)
  const loadCartItems = useCallback((items: CartItem[]) => {
    setCart(items);
  }, []);

  return {
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
  };
}

export default usePurchaseCart;
