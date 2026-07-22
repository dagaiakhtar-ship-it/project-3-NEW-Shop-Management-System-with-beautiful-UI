import { useState, useCallback } from 'react';
import { db } from '../database/db';

/**
 * Custom hook to automatically generate unique, sequential invoice numbers.
 * Format: INV-000001
 */
export function useInvoiceGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    setIsGenerating(true);
    try {
      // Fetch sales in descending order of id to find the most recent transaction
      const latestSale = await db.sales.orderBy('id').last();
      
      let nextNum = 1;
      
      if (latestSale) {
        // Supposing latestSale.invoiceNumber is in the format 'INV-XXXXXX'
        const invStr = latestSale.invoiceNumber || latestSale.invoiceNo || '';
        const match = invStr.match(/INV-(\d+)/);
        if (match && match[1]) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }

      // Loop to ensure absolute uniqueness (no duplicates)
      let invoiceNo = `INV-${String(nextNum).padStart(6, '0')}`;
      let exists = await db.sales.where('invoiceNo').equals(invoiceNo).first();
      
      while (exists) {
        nextNum += 1;
        invoiceNo = `INV-${String(nextNum).padStart(6, '0')}`;
        exists = await db.sales.where('invoiceNo').equals(invoiceNo).first();
      }

      return invoiceNo;
    } catch (err) {
      console.error('Failed to generate unique invoice number:', err);
      // Fallback to timestamp to avoid failing
      return `INV-${Date.now().toString().slice(-6)}`;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateInvoiceNumber,
    isGenerating,
  };
}
