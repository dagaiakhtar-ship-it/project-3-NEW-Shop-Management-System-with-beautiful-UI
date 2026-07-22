import { useState } from 'react';

export function useSupplierFilter() {
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Archived' | 'All'>('All');
  const [city, setCity] = useState<string>('all');
  const [country, setCountry] = useState<string>('all');
  const [paymentTerms, setPaymentTerms] = useState<string>('all');

  const resetFilters = () => {
    setStatus('All');
    setCity('all');
    setCountry('all');
    setPaymentTerms('all');
  };

  return {
    status,
    setStatus,
    city,
    setCity,
    country,
    setCountry,
    paymentTerms,
    setPaymentTerms,
    resetFilters,
  };
}
export default useSupplierFilter;
