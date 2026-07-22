import { useState } from 'react';

export function useCustomerFilter() {
  const [customerType, setCustomerType] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [city, setCity] = useState<string>('all');

  const resetFilters = () => {
    setCustomerType('All');
    setStatus('All');
    setCity('all');
  };

  return {
    customerType,
    setCustomerType,
    status,
    setStatus,
    city,
    setCity,
    resetFilters,
  };
}

export default useCustomerFilter;
