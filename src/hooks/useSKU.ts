import { useState, useCallback } from 'react';
import { db } from '../database/db';
import { generateUniqueSKU } from '../database/productHelper';

export function useSKU() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSKU = useCallback(async (categoryName?: string) => {
    setIsGenerating(true);
    try {
      return await generateUniqueSKU(categoryName);
    } catch (err) {
      console.error('Error generating SKU:', err);
      throw new Error('SKU generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const validateSKUUniqueness = useCallback(async (sku: string, currentProductId?: number): Promise<boolean> => {
    const trimmed = sku.trim();
    if (!trimmed) return false;

    try {
      const match = await db.products
        .filter((p) => p.sku.toLowerCase() === trimmed.toLowerCase() && p.status !== 'Archived')
        .first();

      if (match && match.id !== currentProductId) {
        return false; // Not unique
      }
      return true; // Unique
    } catch (err) {
      console.error('Error validating SKU:', err);
      return false;
    }
  }, []);

  return {
    isGenerating,
    generateSKU,
    validateSKUUniqueness,
  };
}
