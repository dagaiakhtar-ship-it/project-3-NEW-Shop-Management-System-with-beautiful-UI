import { db, type Category } from './db';

/**
 * Validates a category before insertion or update.
 * Returns an error message string if invalid, or null if valid.
 */
export async function validateCategory(
  category: Partial<Category>,
  isUpdate = false,
  id?: number
): Promise<string | null> {
  const name = category.name?.trim();

  // 1. Category Name Required & Prevent Empty Values
  if (!name) {
    return 'Category Name is required.';
  }

  // 2. Minimum Length
  if (name.length < 2) {
    return 'Category Name must be at least 2 characters long.';
  }

  // 3. Maximum Length
  if (name.length > 50) {
    return 'Category Name must not exceed 50 characters.';
  }

  // 4. No Duplicate Category Names (Case-Insensitive, excluding archived if you wish, but standard is non-archived duplicates)
  const existing = await db.categories
    .filter(
      (c) =>
        c.name.trim().toLowerCase() === name.toLowerCase() &&
        c.status !== 'Archived' &&
        (!isUpdate || c.id !== id)
    )
    .first();

  if (existing) {
    return `A category with the name "${name}" already exists.`;
  }

  return null;
}

/**
 * Gets all categories with options.
 */
export async function getAllCategories(includeArchived = false): Promise<Category[]> {
  try {
    let query = db.categories.toCollection();
    let list = await query.toArray();
    
    if (!includeArchived) {
      list = list.filter((c) => c.status !== 'Archived');
    }
    
    // Default sort by displayOrder, then name
    return list.sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Database error in getAllCategories:', error);
    throw new Error('Database Error: Unable to fetch categories.');
  }
}

/**
 * Gets a single category by ID.
 */
export async function getCategoryById(id: number): Promise<Category | undefined> {
  try {
    return await db.categories.get(id);
  } catch (error) {
    console.error('Database error in getCategoryById:', error);
    throw new Error('Database Error: Unable to fetch category details.');
  }
}

/**
 * Adds a new category to IndexedDB.
 */
export async function addCategory(
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> {
  const validationError = await validateCategory(categoryData);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const name = categoryData.name.trim();
    const description = categoryData.description?.trim() || '';
    const newCategory: Category = {
      name,
      description,
      parentCategory: categoryData.parentCategory || null,
      categoryImage: categoryData.categoryImage || '',
      status: categoryData.status || 'Active',
      displayOrder: Number(categoryData.displayOrder) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.categories.add(newCategory);
    return { ...newCategory, id };
  } catch (error: any) {
    console.error('Database error in addCategory:', error);
    throw new Error(error.message || 'Database Error: Unable to save category.');
  }
}

/**
 * Updates an existing category in IndexedDB.
 */
export async function updateCategory(
  id: number,
  categoryData: Partial<Category>
): Promise<Category> {
  const existing = await getCategoryById(id);
  if (!existing) {
    throw new Error('Category not found.');
  }

  const validationError = await validateCategory(categoryData, true, id);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const name = categoryData.name ? categoryData.name.trim() : existing.name;
    const description = categoryData.description !== undefined ? categoryData.description.trim() : existing.description;
    const parentCategory = categoryData.parentCategory !== undefined ? categoryData.parentCategory : existing.parentCategory;
    const categoryImage = categoryData.categoryImage !== undefined ? categoryData.categoryImage : existing.categoryImage;
    const status = categoryData.status || existing.status;
    const displayOrder = categoryData.displayOrder !== undefined ? Number(categoryData.displayOrder) : existing.displayOrder;

    const updatedCategory: Category = {
      ...existing,
      name,
      description,
      parentCategory,
      categoryImage,
      status,
      displayOrder,
      updatedAt: new Date(),
    };

    await db.categories.put(updatedCategory);
    return updatedCategory;
  } catch (error: any) {
    console.error('Database error in updateCategory:', error);
    throw new Error(error.message || 'Database Error: Unable to update category.');
  }
}

/**
 * Soft deletes a category (sets status to Archived).
 */
export async function deleteCategory(id: number): Promise<void> {
  try {
    const existing = await db.categories.get(id);
    if (!existing) {
      throw new Error('Category not found.');
    }

    await db.categories.update(id, {
      status: 'Archived',
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Database error in deleteCategory:', error);
    throw new Error(error.message || 'Database Error: Unable to archive category.');
  }
}

/**
 * Restores a soft-deleted category (sets status to Active).
 */
export async function restoreCategory(id: number): Promise<void> {
  try {
    const existing = await db.categories.get(id);
    if (!existing) {
      throw new Error('Category not found.');
    }

    await db.categories.update(id, {
      status: 'Active',
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Database error in restoreCategory:', error);
    throw new Error(error.message || 'Database Error: Unable to restore category.');
  }
}

/**
 * Performs search, sort, filter and pagination over categories.
 */
export async function queryCategories(params: {
  searchQuery?: string;
  status?: 'Active' | 'Inactive' | 'Archived' | 'All';
  parentCategory?: string | number | null;
  sortBy?: 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'display_order';
  page?: number;
  pageSize?: number;
}): Promise<{
  data: (Category & { productCount: number })[];
  total: number;
  totalPages: number;
}> {
  try {
    let list = await db.categories.toArray();

    // 1. Filter by Status
    const filterStatus = params.status || 'All';
    if (filterStatus !== 'All') {
      list = list.filter((c) => c.status === filterStatus);
    } else {
      // By default, exclude soft-deleted Archived items in 'All' unless they explicitly ask
      // But standard is to show soft-deleted items under an 'Archived' status filter
      list = list.filter((c) => c.status !== 'Archived');
    }

    // 2. Filter by Parent Category
    if (params.parentCategory !== undefined) {
      if (params.parentCategory === null || params.parentCategory === 'none' || params.parentCategory === '') {
        list = list.filter((c) => c.parentCategory === null || c.parentCategory === undefined || c.parentCategory === '');
      } else {
        const pId = Number(params.parentCategory);
        list = list.filter((c) => Number(c.parentCategory) === pId);
      }
    }

    // 3. Search (Instant Search)
    const search = params.searchQuery?.trim().toLowerCase();
    if (search) {
      list = list.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(search);
        const descMatch = c.description?.toLowerCase().includes(search) || false;
        const statusMatch = c.status?.toLowerCase().includes(search) || false;
        return nameMatch || descMatch || statusMatch;
      });
    }

    // 4. Sort
    const sortBy = params.sortBy || 'display_order';
    list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // display_order
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    // 5. Compute real-time product count for each category
    const itemsWithCount = await Promise.all(
      list.map(async (c) => {
        let productCount = 0;
        if (c.id) {
          productCount = await db.products.where('categoryId').equals(c.id).count();
        }
        return {
          ...c,
          productCount,
        };
      })
    );

    // 6. Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = itemsWithCount.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginatedData = itemsWithCount.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Database error in queryCategories:', error);
    throw new Error('Database Error: Query operation failed.');
  }
}

/**
 * Bulk updates the status of multiple categories.
 */
export async function bulkUpdateCategoryStatus(ids: number[], status: 'Active' | 'Inactive' | 'Archived'): Promise<void> {
  try {
    await db.transaction('rw', db.categories, async () => {
      for (const id of ids) {
        await db.categories.update(id, {
          status,
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.error('Database error in bulkUpdateCategoryStatus:', error);
    throw new Error('Database Error: Bulk status update failed.');
  }
}

/**
 * Bulk deletes (soft deletes) multiple categories.
 */
export async function bulkDeleteCategories(ids: number[]): Promise<void> {
  try {
    await db.transaction('rw', db.categories, async () => {
      for (const id of ids) {
        await db.categories.update(id, {
          status: 'Archived',
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.error('Database error in bulkDeleteCategories:', error);
    throw new Error('Database Error: Bulk delete failed.');
  }
}

/* ==========================================================================
   GOOGLE SHEETS SYNC PLACEHOLDERS
   ========================================================================== */

/**
 * Prepares category object for Google Sheets integration.
 */
export function prepareCategoryForSheetsSync(category: Category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description || '',
    parentCategory: category.parentCategory || '',
    categoryImage: category.categoryImage ? '[IMAGE_DATA]' : '',
    status: category.status || 'Active',
    displayOrder: category.displayOrder || 0,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

/**
 * Simulates syncing categories database to Google Sheets.
 * Ready for future backend connectivity.
 */
export async function syncCategoriesToGoogleSheets(): Promise<boolean> {
  console.log('Google Sheets Category Synchronization triggered (placeholder).');
  // In the future:
  // 1. Fetch all categories
  // 2. Format using prepareCategoryForSheetsSync
  // 3. Post to google-sheets API route /api/sync/categories
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Categories synchronization completed successfully.');
      resolve(true);
    }, 1200);
  });
}
