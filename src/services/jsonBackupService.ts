import { db, type Customer, type Product, type Category, type Sale, type SaleItem, type CreditAccount, type CreditPayment, type Expense, type ExpenseCategory, type Supplier, type Purchase, type PurchaseItem, type StockHistory, type Setting } from '../database/db';
import { SYNCABLE_TABLES } from './syncService';
import { updateCustomerBalance } from '../database/creditHelper';
import { logAction } from '../utils/auditLogger';

export interface JSONDatabaseMetadata {
  schemaVersion: number;
  databaseVersion: number;
  exportedAt: string;
  applicationVersion: string;
  totalRecords: number;
  recordCounts: Record<string, number>;
}

export interface JSONDatabaseBackup {
  metadata: JSONDatabaseMetadata;
  customers: Customer[];
  products: Product[];
  categories: Category[];
  sales: Sale[];
  saleItems: SaleItem[];
  creditAccounts: CreditAccount[];
  creditPayments: CreditPayment[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  suppliers: Supplier[];
  purchases: Purchase[];
  purchaseItems: PurchaseItem[];
  stockHistory: StockHistory[];
  syncQueue: any[];
  auditLogs: any[];
  settings: Setting[];
  users: any[];
  [key: string]: any;
}

export interface JSONValidationReport {
  valid: boolean;
  schemaVersion: number;
  databaseVersion: number;
  exportedAt?: string;
  totalRecords: number;
  counts: Record<string, number>;
  errors: string[];
  warnings: string[];
  orphanedRecordsCount: number;
  duplicateIdsCount: number;
}

export class JSONBackupService {
  /**
   * Export database as a centralized, structured JSON-compatible object.
   */
  public async exportDatabaseAsJSON(): Promise<JSONDatabaseBackup> {
    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};
    let totalRecords = 0;

    for (const table of SYNCABLE_TABLES) {
      try {
        const records = await (db as any)[table].toArray();
        backupData[table] = records.map((rec: any) => {
          const cleaned = { ...rec };
          // Convert date objects to ISO strings for strict JSON compliance
          Object.keys(cleaned).forEach((key) => {
            if (cleaned[key] instanceof Date) {
              cleaned[key] = cleaned[key].toISOString();
            }
          });
          return cleaned;
        });
        const count = records.length;
        recordCounts[table] = count;
        totalRecords += count;
      } catch (err) {
        console.warn(`Failed reading table ${table} for JSON export:`, err);
        backupData[table] = [];
        recordCounts[table] = 0;
      }
    }

    const metadata: JSONDatabaseMetadata = {
      schemaVersion: 1,
      databaseVersion: db.verno || 1,
      exportedAt: new Date().toISOString(),
      applicationVersion: '2.0.0',
      totalRecords,
      recordCounts,
    };

    return {
      metadata,
      ...backupData,
    } as JSONDatabaseBackup;
  }

  /**
   * Export formatted JSON string ready for file download.
   */
  public async exportDatabaseToJSONString(): Promise<string> {
    const backup = await this.exportDatabaseAsJSON();
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Pre-import validation for a JSON backup payload.
   */
  public validateJSONBackup(input: string | object): JSONValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const counts: Record<string, number> = {};
    let totalRecords = 0;
    let orphanedRecordsCount = 0;
    let duplicateIdsCount = 0;
    let parsed: any = null;

    // 1. JSON Parse
    if (typeof input === 'string') {
      try {
        parsed = JSON.parse(input);
      } catch (err: any) {
        return {
          valid: false,
          schemaVersion: 0,
          databaseVersion: 0,
          totalRecords: 0,
          counts: {},
          errors: [`JSON Syntax Error: Invalid JSON file format. ${err.message}`],
          warnings: [],
          orphanedRecordsCount: 0,
          duplicateIdsCount: 0,
        };
      }
    } else {
      parsed = input;
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        schemaVersion: 0,
        databaseVersion: 0,
        totalRecords: 0,
        counts: {},
        errors: ['Database backup must be a valid JSON object.'],
        warnings: [],
        orphanedRecordsCount: 0,
        duplicateIdsCount: 0,
      };
    }

    const schemaVersion = parsed.metadata?.schemaVersion || 1;
    const databaseVersion = parsed.metadata?.databaseVersion || 1;
    const exportedAt = parsed.metadata?.exportedAt;

    // 2. Validate table arrays
    for (const table of SYNCABLE_TABLES) {
      const records = parsed[table];
      if (records !== undefined && !Array.isArray(records)) {
        errors.push(`Table "${table}" must be an array.`);
      } else if (Array.isArray(records)) {
        counts[table] = records.length;
        totalRecords += records.length;
      } else {
        counts[table] = 0;
        warnings.push(`Table "${table}" is missing from backup. An empty array will be assumed.`);
      }
    }

    // Return early if basic array structure is broken
    if (errors.length > 0) {
      return {
        valid: false,
        schemaVersion,
        databaseVersion,
        exportedAt,
        totalRecords,
        counts,
        errors,
        warnings,
        orphanedRecordsCount: 0,
        duplicateIdsCount: 0,
      };
    }

    // 3. ID Duplicate and Integrity Checks
    const customerIds = new Set<number>();
    const productIds = new Set<number>();
    const supplierIds = new Set<number>();
    const saleIds = new Set<number>();
    const creditAccountIds = new Set<number>();
    const expenseCategoryIds = new Set<number>();

    // Customers
    if (Array.isArray(parsed.customers)) {
      const seenCust = new Set<number>();
      parsed.customers.forEach((c: any, i: number) => {
        if (c.id !== undefined && c.id !== null) {
          if (seenCust.has(c.id)) {
            duplicateIdsCount++;
            errors.push(`Duplicate Customer ID ${c.id} found at index ${i}.`);
          } else {
            seenCust.add(c.id);
            customerIds.add(c.id);
          }
        } else {
          warnings.push(`Customer at index ${i} has no primary key ID.`);
        }
      });
    }

    // Products
    if (Array.isArray(parsed.products)) {
      const seenProd = new Set<number>();
      parsed.products.forEach((p: any, i: number) => {
        if (p.id !== undefined && p.id !== null) {
          if (seenProd.has(p.id)) {
            duplicateIdsCount++;
            errors.push(`Duplicate Product ID ${p.id} found at index ${i}.`);
          } else {
            seenProd.add(p.id);
            productIds.add(p.id);
          }
        }
        if ((p.price ?? 0) < 0 || (p.cost ?? 0) < 0) {
          warnings.push(`Product "${p.name || p.id}" has negative pricing or cost.`);
        }
      });
    }

    // Suppliers
    if (Array.isArray(parsed.suppliers)) {
      parsed.suppliers.forEach((s: any) => {
        if (s.id !== undefined) supplierIds.add(s.id);
      });
    }

    // Sales
    if (Array.isArray(parsed.sales)) {
      const seenSale = new Set<number>();
      parsed.sales.forEach((s: any, i: number) => {
        if (s.id !== undefined) {
          if (seenSale.has(s.id)) {
            duplicateIdsCount++;
            errors.push(`Duplicate Sale ID ${s.id} found at index ${i}.`);
          } else {
            seenSale.add(s.id);
            saleIds.add(s.id);
          }
        }
        if (s.customerId && s.customerId > 0 && !customerIds.has(s.customerId)) {
          orphanedRecordsCount++;
          warnings.push(`Sale #${s.invoiceNumber || s.id} references non-existent Customer ID ${s.customerId}.`);
        }
      });
    }

    // Sale Items
    if (Array.isArray(parsed.saleItems)) {
      parsed.saleItems.forEach((si: any) => {
        if (si.saleId && !saleIds.has(si.saleId)) {
          orphanedRecordsCount++;
          warnings.push(`Sale item ID ${si.id || 'unnamed'} refers to non-existent Sale ID ${si.saleId}.`);
        }
        if (si.productId && !productIds.has(si.productId)) {
          orphanedRecordsCount++;
          warnings.push(`Sale item refers to non-existent Product ID ${si.productId}.`);
        }
      });
    }

    // Credit Accounts
    if (Array.isArray(parsed.creditAccounts)) {
      parsed.creditAccounts.forEach((ca: any) => {
        if (ca.id !== undefined) creditAccountIds.add(ca.id);
        if (ca.customerId && !customerIds.has(ca.customerId)) {
          orphanedRecordsCount++;
          warnings.push(`Credit Account ID ${ca.id} refers to non-existent Customer ID ${ca.customerId}.`);
        }
        if (ca.invoiceId && !saleIds.has(ca.invoiceId)) {
          orphanedRecordsCount++;
          warnings.push(`Credit Account ID ${ca.id} refers to non-existent Sale ID ${ca.invoiceId}.`);
        }
      });
    }

    // Credit Payments
    if (Array.isArray(parsed.creditPayments)) {
      parsed.creditPayments.forEach((cp: any) => {
        if (cp.creditAccountId && !creditAccountIds.has(cp.creditAccountId)) {
          orphanedRecordsCount++;
          warnings.push(`Credit Payment ID ${cp.id} refers to non-existent Credit Account ID ${cp.creditAccountId}.`);
        }
      });
    }

    // Expense Categories
    if (Array.isArray(parsed.expenseCategories)) {
      parsed.expenseCategories.forEach((ec: any) => {
        if (ec.id !== undefined) expenseCategoryIds.add(ec.id);
      });
    }

    // Expenses
    if (Array.isArray(parsed.expenses)) {
      parsed.expenses.forEach((e: any) => {
        if (e.categoryId && !expenseCategoryIds.has(e.categoryId)) {
          warnings.push(`Expense ID ${e.id} refers to non-existent Expense Category ID ${e.categoryId}.`);
        }
        if ((e.amount ?? 0) < 0) {
          warnings.push(`Expense "${e.title || e.id}" has a negative amount.`);
        }
      });
    }

    // Purchases
    if (Array.isArray(parsed.purchases)) {
      parsed.purchases.forEach((p: any) => {
        if (p.supplierId && !supplierIds.has(p.supplierId)) {
          orphanedRecordsCount++;
          warnings.push(`Purchase #${p.purchaseNumber || p.id} refers to non-existent Supplier ID ${p.supplierId}.`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      schemaVersion,
      databaseVersion,
      exportedAt,
      totalRecords,
      counts,
      errors,
      warnings,
      orphanedRecordsCount,
      duplicateIdsCount,
    };
  }

  /**
   * Import database from JSON payload in an atomic Dexie transaction.
   */
  public async importDatabaseFromJSON(
    input: string | object,
    policy: 'overwrite' | 'merge' = 'merge'
  ): Promise<{ success: boolean; recordCount: number; report: JSONValidationReport }> {
    const report = this.validateJSONBackup(input);

    if (!report.valid) {
      throw new Error(`JSON Database Restore Failed validation: ${report.errors.join('; ')}`);
    }

    const parsed: any = typeof input === 'string' ? JSON.parse(input) : input;
    let importedRecordCount = 0;
    const affectedCustomerIds = new Set<number>();

    await db.transaction('rw', SYNCABLE_TABLES as any, async () => {
      for (const table of SYNCABLE_TABLES) {
        const records = parsed[table];
        if (Array.isArray(records)) {
          if (policy === 'overwrite') {
            await (db as any)[table].clear();
          }

          for (const rawRec of records) {
            const rec = { ...rawRec };

            // Normalize Date properties to Javascript Date objects
            if (rec.createdAt) rec.createdAt = new Date(rec.createdAt);
            if (rec.updatedAt) rec.updatedAt = new Date(rec.updatedAt);
            if (rec.saleDate) rec.saleDate = new Date(rec.saleDate);
            if (rec.purchaseDate) rec.purchaseDate = new Date(rec.purchaseDate);
            if (rec.expenseDate) rec.expenseDate = new Date(rec.expenseDate);
            if (rec.paymentDate) rec.paymentDate = new Date(rec.paymentDate);
            if (rec.dueDate) rec.dueDate = new Date(rec.dueDate);
            if (rec.invoiceDate) rec.invoiceDate = new Date(rec.invoiceDate);

            // Track affected customer IDs to recalculate balances after restore
            if (table === 'customers' && rec.id) {
              affectedCustomerIds.add(rec.id);
            } else if (table === 'creditAccounts' && rec.customerId) {
              affectedCustomerIds.add(rec.customerId);
            } else if (table === 'sales' && rec.customerId) {
              affectedCustomerIds.add(rec.customerId);
            }

            await (db as any)[table].put(rec);
            importedRecordCount++;
          }
        }
      }

      // Recalculate customer balances for all affected customers
      for (const customerId of affectedCustomerIds) {
        try {
          await updateCustomerBalance(customerId);
        } catch (err) {
          console.warn(`Failed recalculating customer balance for ID ${customerId} after import:`, err);
        }
      }
    });

    await logAction(
      'Restore',
      'System',
      `Restored JSON database backup (${policy} mode) - ${importedRecordCount} records imported across ${Object.keys(report.counts).length} tables.`
    );

    return {
      success: true,
      recordCount: importedRecordCount,
      report,
    };
  }
}

export const jsonBackupService = new JSONBackupService();
export default jsonBackupService;
