import { useState, useEffect, useCallback } from 'react';
import { db } from '../database/db';
import { recalculateSupplierBalance } from '../database/purchaseHelper';

export function useSupplierBalance(supplierId?: number) {
  const [balance, setBalance] = useState<number>(0);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!supplierId) return;
    setIsLoading(true);
    try {
      const supplier = await db.suppliers.get(supplierId);
      if (supplier) {
        setBalance(supplier.currentBalance ?? 0);
        setOpeningBalance(supplier.openingBalance ?? 0);
      }
    } catch (err) {
      console.error('Error fetching supplier balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const triggerRecalculate = async () => {
    if (!supplierId) return;
    setIsLoading(true);
    try {
      await recalculateSupplierBalance(supplierId);
      await fetchBalance();
    } catch (err) {
      console.error('Error recalculating balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    balance,
    openingBalance,
    isLoading,
    refetch: fetchBalance,
    recalculate: triggerRecalculate,
  };
}

export default useSupplierBalance;
