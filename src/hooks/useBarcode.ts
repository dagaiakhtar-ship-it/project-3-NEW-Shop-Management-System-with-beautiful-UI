import { useState, useCallback } from 'react';
import { db } from '../database/db';
import { generateUniqueBarcode } from '../database/productHelper';

export function useBarcode() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBarcode = useCallback(async () => {
    setIsGenerating(true);
    try {
      const code = await generateUniqueBarcode();
      return code;
    } catch (err) {
      console.error('Error generating barcode:', err);
      throw new Error('Barcode generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const validateBarcodeUniqueness = useCallback(async (barcode: string, currentProductId?: number): Promise<boolean> => {
    const trimmed = barcode.trim();
    if (!trimmed) return true; // Empty manual is fine if auto-gen is used upon submission

    try {
      const match = await db.products
        .filter((p) => p.barcode?.toLowerCase() === trimmed.toLowerCase() && p.status !== 'Archived')
        .first();

      if (match && match.id !== currentProductId) {
        return false; // Not unique
      }
      return true; // Unique
    } catch (err) {
      console.error('Error validating barcode:', err);
      return false;
    }
  }, []);

  const searchProductByBarcode = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return null;
    try {
      return await db.products
        .filter((p) => p.barcode?.toLowerCase() === trimmed.toLowerCase() && p.status !== 'Archived')
        .first();
    } catch (err) {
      console.error('Error searching product by barcode:', err);
      return null;
    }
  }, []);

  return {
    isGenerating,
    generateBarcode,
    validateBarcodeUniqueness,
    searchProductByBarcode,
  };
}
