import { useState } from 'react';
import { validateCustomer } from '../database/customerHelper';
import { type Customer } from '../database/db';

export function useCustomerValidation() {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = async (
    customerData: Partial<Customer>,
    isUpdate = false,
    id?: number
  ): Promise<boolean> => {
    try {
      const error = await validateCustomer(customerData, isUpdate, id);
      setValidationError(error);
      return error === null;
    } catch (err: any) {
      setValidationError(err.message || 'Validation error occurred.');
      return false;
    }
  };

  const clearValidationError = () => {
    setValidationError(null);
  };

  return {
    validationError,
    setValidationError,
    validate,
    clearValidationError,
  };
}

export default useCustomerValidation;
