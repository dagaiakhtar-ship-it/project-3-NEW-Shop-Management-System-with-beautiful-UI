import { useState } from 'react';

export function useProductFilter() {
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Archived' | 'All'>('All');
  const [stockStatus, setStockStatus] = useState<'In Stock' | 'Low Stock' | 'Out Of Stock' | 'All'>('All');
  const [brand, setBrand] = useState<string>('all');

  const resetFilters = () => {
    setCategoryId('all');
    setStatus('All');
    setStockStatus('All');
    setBrand('all');
  };

  return {
    categoryId,
    setCategoryId,
    status,
    setStatus,
    stockStatus,
    setStockStatus,
    brand,
    setBrand,
    resetFilters,
  };
}
