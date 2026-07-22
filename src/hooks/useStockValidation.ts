import { useCallback } from 'react';
import { db } from '../database/db';

export interface StockValidationError {
  productId: number;
  productName: string;
  requestedQty: number;
  availableStock: number;
  message: string;
}

/**
 * Custom hook to validate stock levels for items during cart additions or checkout.
 */
export function useStockValidation() {
  const validateStock = useCallback(async (
    cartItems: Array<{ productId: number; quantity: number; productName?: string }>
  ): Promise<{ isValid: boolean; errors: StockValidationError[] }> => {
    const errors: StockValidationError[] = [];

    for (const item of cartItems) {
      const product = await db.products.get(item.productId);
      if (!product) {
        errors.push({
          productId: item.productId,
          productName: item.productName || 'Unknown Product',
          requestedQty: item.quantity,
          availableStock: 0,
          message: `Product (ID: ${item.productId}) no longer exists in database.`
        });
        continue;
      }

      const available = product.currentStock ?? product.stock ?? 0;
      if (item.quantity > available) {
        errors.push({
          productId: item.productId,
          productName: product.name,
          requestedQty: item.quantity,
          availableStock: available,
          message: `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${available}.`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    validateStock,
  };
}
