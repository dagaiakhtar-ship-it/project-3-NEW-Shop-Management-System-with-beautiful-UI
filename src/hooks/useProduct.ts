import { useState, useCallback } from 'react';
import {
  getProductById,
  addProduct,
  updateProduct,
  duplicateProduct as dbDuplicateProduct,
} from '../database/productHelper';
import { type Product } from '../database/db';

export function useProduct() {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProductById(id);
      if (!data) {
        throw new Error('Product not found.');
      }
      setProduct(data);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to retrieve product.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newProd = await addProduct(productData);
      setProduct(newProd);
      return newProd;
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExistingProduct = async (id: number, productData: Partial<Product>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateProduct(id, productData);
      setProduct(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateExistingProduct = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const duplicated = await dbDuplicateProduct(id);
      setProduct(duplicated);
      return duplicated;
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate product.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    product,
    isLoading,
    error,
    fetchProduct,
    createNewProduct,
    updateExistingProduct,
    duplicateExistingProduct,
  };
}
