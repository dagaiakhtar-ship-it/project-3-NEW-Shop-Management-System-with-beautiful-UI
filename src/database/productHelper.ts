import { db, type Product, type Category } from './db';

/**
 * Auto-generates a unique random 12-digit barcode looking like a real EAN/UPC barcode.
 */
export async function generateUniqueBarcode(): Promise<string> {
  let isUnique = false;
  let barcode = '';

  while (!isUnique) {
    // Generate an EAN-like 12-digit string starting with 880 (e.g. 880123456789)
    const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
    barcode = `880${randomPart}`;

    // Verify uniqueness against non-archived products
    const existing = await db.products
      .filter((p) => p.barcode === barcode && p.status !== 'Archived')
      .first();

    if (!existing) {
      isUnique = true;
    }
  }

  return barcode;
}

/**
 * Auto-generates a unique SKU with prefix and randomized digits.
 */
export async function generateUniqueSKU(categoryName?: string): Promise<string> {
  let isUnique = false;
  let sku = '';

  const prefix = categoryName
    ? categoryName.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
    : 'PRD';

  while (!isUnique) {
    const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    sku = `${prefix}-${randomPart}`;

    const existing = await db.products
      .filter((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.status !== 'Archived')
      .first();

    if (!existing) {
      isUnique = true;
    }
  }

  return sku;
}

/**
 * Validates product details. Returns an error message string if invalid, or null if valid.
 */
export async function validateProduct(
  product: Partial<Product>,
  isUpdate = false,
  id?: number
): Promise<string | null> {
  const name = product.name?.trim();
  const sku = product.sku?.trim();
  const barcode = product.barcode?.trim();
  const categoryId = product.categoryId;
  const purchasePrice = product.purchasePrice;
  const sellingPrice = product.sellingPrice;
  const currentStock = product.currentStock;
  const minimumStock = product.minimumStock;

  // 1. Name validation
  if (!name) {
    return 'Product Name is required.';
  }
  if (name.length < 2) {
    return 'Product Name must be at least 2 characters long.';
  }

  // 2. Category validation
  if (!categoryId || isNaN(Number(categoryId))) {
    return 'Category selection is required.';
  }
  const categoryExists = await db.categories.get(Number(categoryId));
  if (!categoryExists) {
    return 'Selected category does not exist.';
  }

  // 3. Purchase price validation
  if (purchasePrice === undefined || purchasePrice === null || isNaN(Number(purchasePrice))) {
    return 'Purchase Price is required.';
  }
  if (Number(purchasePrice) < 0) {
    return 'Purchase Price cannot be negative.';
  }

  // 4. Selling price validation
  if (sellingPrice === undefined || sellingPrice === null || isNaN(Number(sellingPrice))) {
    return 'Selling Price is required.';
  }
  if (Number(sellingPrice) < 0) {
    return 'Selling Price cannot be negative.';
  }

  // 5. Stock numbers validation
  if (currentStock !== undefined && Number(currentStock) < 0) {
    return 'Current Stock cannot be negative.';
  }
  if (minimumStock !== undefined && Number(minimumStock) < 0) {
    return 'Minimum Stock cannot be negative.';
  }

  // 6. Barcode unique validation
  if (barcode) {
    const existingBarcode = await db.products
      .filter(
        (p) =>
          p.barcode?.trim().toLowerCase() === barcode.toLowerCase() &&
          p.status !== 'Archived' &&
          (!isUpdate || p.id !== id)
      )
      .first();
    if (existingBarcode) {
      return `A product with barcode "${barcode}" already exists.`;
    }
  }

  // 7. SKU unique validation
  if (!sku) {
    return 'SKU is required.';
  }
  const existingSKU = await db.products
    .filter(
      (p) =>
        p.sku.trim().toLowerCase() === sku.toLowerCase() &&
        p.status !== 'Archived' &&
        (!isUpdate || p.id !== id)
    )
    .first();
  if (existingSKU) {
    return `A product with SKU "${sku}" already exists.`;
  }

  return null;
}

/**
 * Gets a single product by ID.
 */
export async function getProductById(id: number): Promise<Product | undefined> {
  try {
    return await db.products.get(id);
  } catch (error) {
    console.error('Database error in getProductById:', error);
    throw new Error('Database Error: Unable to fetch product.');
  }
}

/**
 * Adds a new product to IndexedDB.
 */
export async function addProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const name = productData.name.trim();
  const categoryId = Number(productData.categoryId);
  const purchasePrice = Number(productData.purchasePrice) || 0;
  const sellingPrice = Number(productData.sellingPrice) || 0;
  const currentStock = Number(productData.currentStock) || 0;
  const minimumStock = Number(productData.minimumStock) || 0;
  const brand = productData.brand?.trim() || '';
  const unit = productData.unit?.trim() || 'Pcs';
  const description = productData.description?.trim() || '';
  const image = productData.image || '';
  const status = productData.status || 'Active';

  // Retrieve category name to generate a meaningful SKU if SKU is not provided
  let sku = productData.sku?.trim() || '';
  if (!sku) {
    const category = await db.categories.get(categoryId);
    sku = await generateUniqueSKU(category?.name);
  }

  let barcode = productData.barcode?.trim() || '';
  if (!barcode) {
    barcode = await generateUniqueBarcode();
  }

  const profit = parseFloat((sellingPrice - purchasePrice).toFixed(2));

  const draft: Partial<Product> = {
    name,
    sku,
    barcode,
    categoryId,
    description,
    purchasePrice,
    sellingPrice,
    profit,
    currentStock,
    minimumStock,
    unit,
    brand,
    image,
    status,
  };

  const validationError = await validateProduct(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const newProduct: Product = {
      name,
      sku,
      barcode,
      categoryId,
      description,
      purchasePrice,
      sellingPrice,
      profit,
      currentStock,
      minimumStock,
      unit,
      brand,
      image,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),

      // Support old compatibility fields for safe operations in sales/purchases modules
      price: sellingPrice,
      cost: purchasePrice,
      stock: currentStock,
      alertQuantity: minimumStock,
    };

    const id = await db.products.add(newProduct);
    return { ...newProduct, id };
  } catch (error: any) {
    console.error('Database error in addProduct:', error);
    throw new Error(error.message || 'Database Error: Unable to create product.');
  }
}

/**
 * Updates an existing product.
 */
export async function updateProduct(
  id: number,
  productData: Partial<Product>
): Promise<Product> {
  const existing = await getProductById(id);
  if (!existing) {
    throw new Error('Product not found.');
  }

  const name = productData.name !== undefined ? productData.name.trim() : existing.name;
  const categoryId = productData.categoryId !== undefined ? Number(productData.categoryId) : existing.categoryId;
  const purchasePrice = productData.purchasePrice !== undefined ? Number(productData.purchasePrice) : (existing.purchasePrice ?? existing.cost ?? 0);
  const sellingPrice = productData.sellingPrice !== undefined ? Number(productData.sellingPrice) : (existing.sellingPrice ?? existing.price ?? 0);
  const currentStock = productData.currentStock !== undefined ? Number(productData.currentStock) : (existing.currentStock ?? existing.stock ?? 0);
  const minimumStock = productData.minimumStock !== undefined ? Number(productData.minimumStock) : (existing.minimumStock ?? existing.alertQuantity ?? 0);
  const brand = productData.brand !== undefined ? productData.brand.trim() : (existing.brand || '');
  const unit = productData.unit !== undefined ? productData.unit.trim() : (existing.unit || 'Pcs');
  const description = productData.description !== undefined ? productData.description.trim() : (existing.description || '');
  const image = productData.image !== undefined ? productData.image : (existing.image || '');
  const status = productData.status || existing.status || 'Active';
  const sku = productData.sku !== undefined ? productData.sku.trim() : existing.sku;
  const barcode = productData.barcode !== undefined ? productData.barcode.trim() : existing.barcode;

  const profit = parseFloat((sellingPrice - purchasePrice).toFixed(2));

  const draft: Partial<Product> = {
    name,
    sku,
    barcode,
    categoryId,
    description,
    purchasePrice,
    sellingPrice,
    profit,
    currentStock,
    minimumStock,
    unit,
    brand,
    image,
    status,
  };

  const validationError = await validateProduct(draft, true, id);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const updatedProduct: Product = {
      ...existing,
      name,
      sku,
      barcode,
      categoryId,
      description,
      purchasePrice,
      sellingPrice,
      profit,
      currentStock,
      minimumStock,
      unit,
      brand,
      image,
      status,
      updatedAt: new Date(),

      // Support old compatibility fields
      price: sellingPrice,
      cost: purchasePrice,
      stock: currentStock,
      alertQuantity: minimumStock,
    };

    await db.products.put(updatedProduct);
    return updatedProduct;
  } catch (error: any) {
    console.error('Database error in updateProduct:', error);
    throw new Error(error.message || 'Database Error: Unable to update product.');
  }
}

/**
 * Soft deletes a product (sets status to Archived).
 */
export async function deleteProduct(id: number): Promise<void> {
  try {
    const existing = await getProductById(id);
    if (!existing) {
      throw new Error('Product not found.');
    }

    await db.products.update(id, {
      status: 'Archived',
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Database error in deleteProduct:', error);
    throw new Error(error.message || 'Database Error: Unable to archive product.');
  }
}

/**
 * Restores a soft-deleted product (sets status to Active).
 */
export async function restoreProduct(id: number): Promise<void> {
  try {
    const existing = await getProductById(id);
    if (!existing) {
      throw new Error('Product not found.');
    }

    await db.products.update(id, {
      status: 'Active',
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Database error in restoreProduct:', error);
    throw new Error(error.message || 'Database Error: Unable to restore product.');
  }
}

/**
 * Duplicates a product. Appends ' - Copy' to the name, generates a new unique SKU and Barcode,
 * and resets stock levels or copies them (resets is typically cleaner, but standard duplication can keep values).
 */
export async function duplicateProduct(id: number): Promise<Product> {
  const existing = await getProductById(id);
  if (!existing) {
    throw new Error('Product to duplicate not found.');
  }

  try {
    const category = await db.categories.get(existing.categoryId);
    const duplicatedName = `${existing.name} - Copy`;
    const sku = await generateUniqueSKU(category?.name);
    const barcode = await generateUniqueBarcode();

    const newProduct: Product = {
      ...existing,
      id: undefined, // Let Dexie auto-generate new ID
      name: duplicatedName,
      sku,
      barcode,
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newId = await db.products.add(newProduct);
    return { ...newProduct, id: newId };
  } catch (error: any) {
    console.error('Database error in duplicateProduct:', error);
    throw new Error(error.message || 'Database Error: Duplication failed.');
  }
}

/**
 * Queries, searches, filters, sorts and paginates products in real-time.
 */
export async function queryProducts(params: {
  searchQuery?: string;
  categoryId?: number | string | null;
  status?: 'Active' | 'Inactive' | 'Archived' | 'All';
  stockStatus?: 'In Stock' | 'Low Stock' | 'Out Of Stock' | 'All';
  brand?: string;
  sortBy?: 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'purchase_price_asc' | 'purchase_price_desc' | 'selling_price_asc' | 'selling_price_desc' | 'profit_asc' | 'profit_desc' | 'stock_asc' | 'stock_desc';
  page?: number;
  pageSize?: number;
}): Promise<{
  data: (Product & { categoryName: string; stockStatus: 'In Stock' | 'Low Stock' | 'Out Of Stock' })[];
  total: number;
  totalPages: number;
  brands: string[];
}> {
  try {
    // 1. Fetch products and categories for joining
    const allProducts = await db.products.toArray();
    const allCategories = await db.categories.toArray();

    const categoryMap = new Map<number, string>();
    allCategories.forEach((c) => {
      if (c.id) categoryMap.set(c.id, c.name);
    });

    // Extract all unique brands for the filter sidebar dropdown
    const uniqueBrands = Array.from(
      new Set(
        allProducts
          .map((p) => p.brand?.trim())
          .filter((b): b is string => !!b && b.length > 0)
      )
    ).sort();

    let list = allProducts.map((p) => {
      // Map standard/legacy fields to ensure consistent reading
      const purchasePrice = Number(p.purchasePrice !== undefined ? p.purchasePrice : (p.cost ?? 0));
      const sellingPrice = Number(p.sellingPrice !== undefined ? p.sellingPrice : (p.price ?? 0));
      const currentStock = Number(p.currentStock !== undefined ? p.currentStock : (p.stock ?? 0));
      const minimumStock = Number(p.minimumStock !== undefined ? p.minimumStock : (p.alertQuantity ?? 0));
      const profit = p.profit !== undefined ? p.profit : parseFloat((sellingPrice - purchasePrice).toFixed(2));
      const status = p.status || 'Active';

      let sStatus: 'In Stock' | 'Low Stock' | 'Out Of Stock' = 'In Stock';
      if (currentStock <= 0) {
        sStatus = 'Out Of Stock';
      } else if (currentStock <= minimumStock) {
        sStatus = 'Low Stock';
      }

      return {
        ...p,
        purchasePrice,
        sellingPrice,
        currentStock,
        minimumStock,
        profit,
        status,
        categoryName: categoryMap.get(p.categoryId) || 'Unknown Category',
        stockStatus: sStatus,
      };
    });

    // 2. Filter: Status
    const statusFilter = params.status || 'All';
    if (statusFilter !== 'All') {
      list = list.filter((p) => p.status === statusFilter);
    } else {
      // Default 'All' excludes 'Archived' (soft deleted)
      list = list.filter((p) => p.status !== 'Archived');
    }

    // 3. Filter: Category
    if (params.categoryId && params.categoryId !== 'all') {
      const catId = Number(params.categoryId);
      list = list.filter((p) => p.categoryId === catId);
    }

    // 4. Filter: Stock Status
    if (params.stockStatus && params.stockStatus !== 'All') {
      list = list.filter((p) => p.stockStatus === params.stockStatus);
    }

    // 5. Filter: Brand
    if (params.brand && params.brand !== 'all') {
      list = list.filter((p) => p.brand?.toLowerCase() === params.brand?.toLowerCase());
    }

    // 6. Search (Instant Search across Name, Barcode, SKU, Category, Brand)
    const search = params.searchQuery?.trim().toLowerCase();
    if (search) {
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(search);
        const barcodeMatch = p.barcode?.toLowerCase().includes(search) || false;
        const skuMatch = p.sku.toLowerCase().includes(search);
        const categoryMatch = p.categoryName.toLowerCase().includes(search);
        const brandMatch = p.brand?.toLowerCase().includes(search) || false;
        return nameMatch || barcodeMatch || skuMatch || categoryMatch || brandMatch;
      });
    }

    // 7. Sort
    const sortBy = params.sortBy || 'newest';
    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'purchase_price_asc') return a.purchasePrice - b.purchasePrice;
      if (sortBy === 'purchase_price_desc') return b.purchasePrice - a.purchasePrice;
      if (sortBy === 'selling_price_asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'selling_price_desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'profit_asc') return a.profit - b.profit;
      if (sortBy === 'profit_desc') return b.profit - a.profit;
      if (sortBy === 'stock_asc') return a.currentStock - b.currentStock;
      if (sortBy === 'stock_desc') return b.currentStock - a.currentStock;
      return 0;
    });

    // 8. Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = list.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginatedData = list.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      totalPages,
      brands: uniqueBrands,
    };
  } catch (error) {
    console.error('Database error in queryProducts:', error);
    throw new Error('Database Error: Unable to query products.');
  }
}

/**
 * Bulk updates the status of multiple products.
 */
export async function bulkUpdateProductStatus(ids: number[], status: 'Active' | 'Inactive'): Promise<void> {
  try {
    await db.transaction('rw', db.products, async () => {
      for (const id of ids) {
        await db.products.update(id, {
          status,
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.error('Database error in bulkUpdateProductStatus:', error);
    throw new Error('Database Error: Bulk status update failed.');
  }
}

/**
 * Bulk soft-deletes (archives) multiple products.
 */
export async function bulkDeleteProducts(ids: number[]): Promise<void> {
  try {
    await db.transaction('rw', db.products, async () => {
      for (const id of ids) {
        await db.products.update(id, {
          status: 'Archived',
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.error('Database error in bulkDeleteProducts:', error);
    throw new Error('Database Error: Bulk delete failed.');
  }
}

/* ==========================================================================
   GOOGLE SHEETS SYNC PLACEHOLDERS
   ========================================================================== */

/**
 * Formats a product for Future Google Sheets Sync.
 */
export function prepareProductForSheetsSync(product: Product) {
  return {
    id: product.id,
    barcode: product.barcode || '',
    sku: product.sku,
    name: product.name,
    categoryId: product.categoryId,
    description: product.description || '',
    purchasePrice: product.purchasePrice || product.cost || 0,
    sellingPrice: product.sellingPrice || product.price || 0,
    profit: product.profit || 0,
    currentStock: product.currentStock || product.stock || 0,
    minimumStock: product.minimumStock || product.alertQuantity || 0,
    unit: product.unit || 'Pcs',
    brand: product.brand || '',
    image: product.image ? '[IMAGE_DATA]' : '',
    status: product.status || 'Active',
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt ? product.updatedAt.toISOString() : '',
  };
}

/**
 * Simulates syncing the products catalog to Google Sheets.
 * Placeholders are prepared for future API connectivity.
 */
export async function syncProductsToGoogleSheets(): Promise<boolean> {
  console.log('Google Sheets Product Synchronization triggered (placeholder).');
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Products synchronization completed successfully.');
      resolve(true);
    }, 1200);
  });
}
