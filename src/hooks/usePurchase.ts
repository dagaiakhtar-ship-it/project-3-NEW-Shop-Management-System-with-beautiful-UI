import { useState, useCallback } from 'react';
import { db, type Purchase, type PurchaseItem } from '../database/db';
import { createPurchase, updatePurchase, duplicatePurchase } from '../database/purchaseHelper';

export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load a single purchase along with its items
  const loadPurchaseWithItems = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const purchase = await db.purchases.get(id);
      if (!purchase) {
        throw new Error('Purchase order not found.');
      }

      const items = await db.purchaseItems.filter((pi) => pi.purchaseId === id).toArray();
      return { purchase, items };
    } catch (err: any) {
      console.error('Error loading purchase with items:', err);
      setError(err.message || 'Failed to load purchase details.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new purchase
  const createNewPurchase = async (
    purchaseData: Omit<Purchase, 'id' | 'purchaseNumber' | 'referenceNo' | 'createdAt' | 'updatedAt' | 'status'>,
    itemsData: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createPurchase(purchaseData, itemsData);
      return result;
    } catch (err: any) {
      console.error('Error creating purchase:', err);
      setError(err.message || 'Failed to record purchase.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing purchase
  const updateExistingPurchase = async (
    id: number,
    purchaseData: Partial<Purchase>,
    itemsData: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updatePurchase(id, purchaseData, itemsData);
      return result;
    } catch (err: any) {
      console.error('Error updating purchase:', err);
      setError(err.message || 'Failed to update purchase.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Duplicate a purchase
  const duplicateExistingPurchase = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await duplicatePurchase(id);
      return result;
    } catch (err: any) {
      console.error('Error duplicating purchase:', err);
      setError(err.message || 'Failed to duplicate purchase.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loadPurchaseWithItems,
    createNewPurchase,
    updateExistingPurchase,
    duplicateExistingPurchase,
    isLoading,
    error,
  };
}

export default usePurchase;
