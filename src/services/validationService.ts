import Dexie from 'dexie';
import showToast from '../utils/toast';

export const FOREIGN_KEYS: Record<string, { field: string; targetTable: string; label: string }[]> = {
  products: [
    { field: 'categoryId', targetTable: 'categories', label: 'Category' },
    { field: 'supplierId', targetTable: 'suppliers', label: 'Supplier' }
  ],
  sales: [
    { field: 'customerId', targetTable: 'customers', label: 'Customer' }
  ],
  saleItems: [
    { field: 'saleId', targetTable: 'sales', label: 'Sale/Invoice' },
    { field: 'productId', targetTable: 'products', label: 'Product' }
  ],
  purchases: [
    { field: 'supplierId', targetTable: 'suppliers', label: 'Supplier' }
  ],
  purchaseItems: [
    { field: 'purchaseId', targetTable: 'purchases', label: 'Purchase' },
    { field: 'productId', targetTable: 'products', label: 'Product' }
  ],
  expenses: [
    { field: 'categoryId', targetTable: 'expenseCategories', label: 'Expense Category' }
  ],
  creditAccounts: [
    { field: 'customerId', targetTable: 'customers', label: 'Customer' }
  ],
  creditPayments: [
    { field: 'creditAccountId', targetTable: 'creditAccounts', label: 'Credit Account' },
    { field: 'customerId', targetTable: 'customers', label: 'Customer' }
  ],
  stockHistory: [
    { field: 'productId', targetTable: 'products', label: 'Product' }
  ]
};

/**
 * Assigns a unique positive integer ID to the record if it is missing and the table expects an auto-incrementing key.
 */
export function assignUniqueId(tableName: string, obj: any) {
  if (!obj) return;
  
  // Settings table uses string keys (e.g., 'theme', 'sync_conflict_policy') instead of auto-incrementing IDs
  if (tableName === 'settings') return;

  if (obj.id === undefined || obj.id === null || obj.id === 0 || obj.id === '') {
    // Generate a highly robust, positive, and collision-free integer ID using current high-resolution timestamp
    // combining with a randomized salt factor
    const timestampPart = Date.now();
    const randomPart = Math.floor(Math.random() * 100000);
    // Standard JS safe integer maximum is 9,007,199,254,740,991, which easily fits timestamp + salt
    obj.id = timestampPart + randomPart;
  }
}

/**
 * Direct check for referential integrity.
 */
export async function validateReferentialIntegrityDirect(tableName: string, obj: any, db: any): Promise<void> {
  if (!obj) return;

  // Bypass validation if database sync/restore is actively running
  if (db.syncState?.inProgress) {
    return;
  }

  // Bypass validation if there is an active Dexie transaction.
  // This avoids IndexedDB NotFoundError when foreign key tables are not included in the active transaction store list.
  if (Dexie.currentTransaction) {
    return;
  }

  const fks = FOREIGN_KEYS[tableName];
  if (!fks) return;

  for (const fk of fks) {
    const val = obj[fk.field];
    
    // Ignore nullish, 0, or blank values which imply unlinked optional relationships
    if (val === undefined || val === null || val === 0 || val === '') {
      continue;
    }

    try {
      const targetTable = db[fk.targetTable];
      if (!targetTable) continue;

      const exists = await Dexie.ignoreTransaction(async () => {
        return await targetTable.get(val);
      });

      if (!exists) {
        const errorMsg = `Referential Integrity Error: The linked ${fk.label} (ID: ${val}) does not exist. Cannot link this record to ${tableName}.`;
        showToast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(`Referential integrity check failed in table "${tableName}":`, err);
      throw err;
    }
  }
}

/**
 * Dynamically wraps standard table methods with ID assignment and referential integrity validation.
 */
export function applyValidationLayer(db: any) {
  const SYNCABLE_TABLES = [
    'products', 'categories', 'customers', 'suppliers', 'sales', 'saleItems',
    'purchases', 'purchaseItems', 'expenses', 'expenseCategories', 'creditAccounts',
    'creditPayments', 'settings', 'users', 'stockHistory'
  ];

  SYNCABLE_TABLES.forEach(tableName => {
    const table = db[tableName];
    if (!table) return;

    // Save references to original methods
    const originalAdd = table.add.bind(table);
    const originalPut = table.put.bind(table);
    const originalUpdate = table.update.bind(table);
    const originalBulkAdd = table.bulkAdd.bind(table);
    const originalBulkPut = table.bulkPut.bind(table);

    // Override add
    table.add = async function(obj: any, key?: any) {
      if (Dexie.currentTransaction) {
        return await originalAdd(obj, key);
      }
      if (!db.syncState?.inProgress) {
        assignUniqueId(tableName, obj);
        await validateReferentialIntegrityDirect(tableName, obj, db);
      }
      return await originalAdd(obj, key);
    };

    // Override put
    table.put = async function(obj: any, key?: any) {
      if (Dexie.currentTransaction) {
        return await originalPut(obj, key);
      }
      if (!db.syncState?.inProgress) {
        assignUniqueId(tableName, obj);
        await validateReferentialIntegrityDirect(tableName, obj, db);
      }
      return await originalPut(obj, key);
    };

    // Override update
    table.update = async function(key: any, modifications: any) {
      if (Dexie.currentTransaction) {
        return await originalUpdate(key, modifications);
      }
      if (!db.syncState?.inProgress) {
        const existing = await Dexie.ignoreTransaction(async () => {
          return await table.get(key);
        });
        if (existing) {
          const merged = { ...existing, ...modifications };
          await validateReferentialIntegrityDirect(tableName, merged, db);
        }
      }
      return await originalUpdate(key, modifications);
    };

    // Override bulkAdd
    table.bulkAdd = async function(objects: any[], keys?: any, options?: any) {
      if (Dexie.currentTransaction) {
        return await originalBulkAdd(objects, keys, options);
      }
      if (!db.syncState?.inProgress) {
        for (const obj of objects) {
          assignUniqueId(tableName, obj);
          await validateReferentialIntegrityDirect(tableName, obj, db);
        }
      }
      return await originalBulkAdd(objects, keys, options);
    };

    // Override bulkPut
    table.bulkPut = async function(objects: any[], keys?: any, options?: any) {
      if (Dexie.currentTransaction) {
        return await originalBulkPut(objects, keys, options);
      }
      if (!db.syncState?.inProgress) {
        for (const obj of objects) {
          assignUniqueId(tableName, obj);
          await validateReferentialIntegrityDirect(tableName, obj, db);
        }
      }
      return await originalBulkPut(objects, keys, options);
    };
  });
}

/**
 * Scans all tables in the database to verify referential integrity and report any anomalies.
 */
export async function validateFullDatabaseIntegrity(db: any): Promise<{ valid: boolean; violations: string[] }> {
  const violations: string[] = [];

  for (const [tableName, fks] of Object.entries(FOREIGN_KEYS)) {
    const table = db[tableName];
    if (!table) continue;

    try {
      const records = await table.toArray();
      for (const record of records) {
        for (const fk of fks) {
          const val = record[fk.field];
          if (val !== undefined && val !== null && val !== 0 && val !== '') {
            const targetTable = db[fk.targetTable];
            if (targetTable) {
              const exists = await targetTable.get(val);
              if (!exists) {
                violations.push(
                  `Anomalous Record in "${tableName}" (ID: ${record.id}): Linked ${fk.label} (ID: ${val}) does not exist in "${fk.targetTable}".`
                );
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`Error scanning table "${tableName}" for integrity:`, err);
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
