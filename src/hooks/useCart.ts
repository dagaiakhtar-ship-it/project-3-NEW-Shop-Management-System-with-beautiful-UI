import { useState, useCallback } from 'react';
import { type Product } from '../database/db';
import showToast from '../utils/toast';

export interface CartItem {
  productId: number;
  productName: string;
  barcode?: string;
  sku: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  discount: number; // per-item discount
  tax: number; // per-item tax
  availableStock: number;
  image?: string;
}

/**
 * Custom hook to manage POS Shopping Cart state.
 */
export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add item to cart
  const addItem = useCallback((product: Product, quantity = 1) => {
    if (!product.id) return;
    
    const stock = product.currentStock ?? product.stock ?? 0;
    if (stock <= 0) {
      showToast.error(`"${product.name}" is out of stock!`);
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.productId === product.id);
      
      if (existingIndex > -1) {
        // Product already in cart
        const existingItem = prevItems[existingIndex];
        const newQty = existingItem.quantity + quantity;
        
        if (newQty > stock) {
          showToast.warning(`Cannot exceed available stock (${stock}) for "${product.name}".`);
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existingItem,
          quantity: newQty,
        };
        showToast.success(`Incremented "${product.name}" quantity to ${newQty}.`);
        return updated;
      } else {
        // New item in cart
        if (quantity > stock) {
          showToast.warning(`Cannot exceed available stock (${stock}) for "${product.name}".`);
          return prevItems;
        }

        const newItem: CartItem = {
          productId: product.id!,
          productName: product.name,
          barcode: product.barcode,
          sku: product.sku,
          quantity: quantity,
          sellingPrice: product.sellingPrice ?? product.price ?? 0,
          purchasePrice: product.purchasePrice ?? product.cost ?? 0,
          discount: 0,
          tax: 0,
          availableStock: stock,
          image: product.image,
        };
        showToast.success(`Added "${product.name}" to the shopping cart.`);
        return [...prevItems, newItem];
      }
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      // Remove item if quantity is set to less than 1
      removeItem(productId);
      return;
    }

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.productId === productId);
      if (!existing) return prevItems;

      if (quantity > existing.availableStock) {
        showToast.warning(`Requested quantity exceeds available stock of ${existing.availableStock}.`);
        return prevItems;
      }

      return prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  // Set individual item discount
  const updateItemDiscount = useCallback((productId: number, discount: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, discount: Math.max(0, discount) } : item
      )
    );
  }, []);

  // Set individual item tax
  const updateItemTax = useCallback((productId: number, tax: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, tax: Math.max(0, tax) } : item
      )
    );
  }, []);

  // Remove item from cart
  const removeItem = useCallback((productId: number) => {
    setCartItems((prevItems) => {
      const removed = prevItems.filter((item) => item.productId !== productId);
      showToast.info('Item removed from cart.');
      return removed;
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    showToast.info('Shopping cart cleared.');
  }, []);

  return {
    cartItems,
    addItem,
    updateQuantity,
    updateItemDiscount,
    updateItemTax,
    removeItem,
    clearCart,
    setCartItems,
  };
}
