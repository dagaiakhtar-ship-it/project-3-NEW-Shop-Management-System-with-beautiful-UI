import Dexie, { type Table } from 'dexie';
import { logAction } from '../utils/auditLogger';
import { assignUniqueId, applyValidationLayer } from '../services/validationService';

// Define DB Interfaces for type safety
export interface Product {
  id?: number;
  barcode?: string;
  sku: string;
  name: string;
  categoryId: number;
  description?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  profit?: number;
  currentStock?: number;
  minimumStock?: number;
  unit?: string;
  brand?: string;
  image?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  createdAt: Date;
  updatedAt?: Date;

  // Compatibility fields for other modules
  price?: number;
  cost?: number;
  stock?: number;
  alertQuantity?: number;
  supplierId?: number;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  parentCategory?: number | string | null;
  categoryImage?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  displayOrder?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Customer {
  id?: number;
  customerCode?: string; // Automatically or manually set
  customerType: 'Walk-in Customer' | 'Regular Customer' | 'Permanent Credit Customer' | 'Wholesale Customer' | 'VIP Customer';
  fullName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  nationalId?: string;
  profileImage?: string; // Base64 or image URL
  openingBalance?: number;
  currentBalance?: number;
  creditLimit?: number;
  status: 'Active' | 'Inactive' | 'Blocked';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;

  // Soft delete flag
  isDeleted?: boolean;

  // Compatibility fields for other modules
  name: string; // fallback or same as fullName
  balance: number; // fallback or same as currentBalance
}

export interface Supplier {
  id?: number;
  supplierCode: string;
  companyName: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  taxNumber?: string;
  openingBalance?: number;
  currentBalance?: number;
  paymentTerms?: string;
  notes?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  createdAt: Date;
  updatedAt?: Date;

  // Compatibility field
  name?: string;
}

export interface Sale {
  id?: number;
  invoiceNo: string; // compatibility
  invoiceNumber?: string; // Step 12
  customerId?: number;
  customerName?: string;
  saleDate?: Date;
  subtotal: number;
  discount: number;
  tax: number;
  shipping?: number;
  otherCharges?: number;
  grandTotal?: number;
  total: number; // compatibility
  paidAmount: number;
  remainingAmount?: number;
  changeAmount?: number; // compatibility
  changeReturned?: number;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  status?: string; // compatibility
  paymentMethod: string;
  saleType?: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
  cashReceived?: number;
  notes?: string;
  createdBy?: string | number;
  userId?: number; // compatibility
  isDeleted?: boolean; // Step 12 soft delete
  createdAt: Date;
  updatedAt?: Date;
}

export interface SaleItem {
  id?: number;
  saleId: number;
  productId: number;
  barcode?: string;
  productName?: string;
  quantity: number;
  purchasePrice?: number;
  sellingPrice?: number;
  price?: number; // compatibility
  discount?: number;
  tax?: number;
  profit?: number;
  total?: number;
  subtotal?: number; // compatibility
}

export interface Purchase {
  id?: number;
  purchaseNumber?: string;
  referenceNo: string;
  supplierId?: number;
  purchaseDate?: Date | string;
  invoiceNumber?: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping?: number;
  otherCharges?: number;
  grandTotal?: number;
  total: number; // Compatibility
  paidAmount: number;
  remainingAmount?: number;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  paymentMethod: string;
  notes?: string;
  createdBy?: string | number;
  createdAt: Date;
  updatedAt?: Date;
  status: string; // Keeps received/cancelled/active/archived compatible
}

export interface PurchaseItem {
  id?: number;
  purchaseId: number;
  productId: number;
  barcode?: string;
  productName?: string;
  quantity: number;
  purchasePrice?: number;
  cost: number; // Compatibility
  sellingPrice?: number;
  discount?: number;
  tax?: number;
  subtotal: number; // Compatibility
  total?: number;
}

export interface StockHistory {
  id?: number;
  productId: number;
  type: 'Purchase' | 'Sale' | 'Adjustment' | 'Initial';
  quantity: number;
  currentStock: number;
  referenceNo: string;
  notes?: string;
  createdAt: Date;
}

export interface ExpenseCategory {
  id?: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id?: number;
  expenseNumber: string;
  categoryId: number;
  title: string;
  description?: string;
  amount: number;
  expenseDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
  vendorName?: string;
  attachment?: string; // Base64 string of Image or PDF
  isRecurring?: boolean;
  recurringType?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextRecurringDate?: Date | string;
  status: 'Paid' | 'Pending' | 'Voided';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;

  // Compatibility fields for old dashboard
  category?: string;
}

export interface CreditAccount {
  id?: number;
  customerId: number;
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: Date | string;
  invoiceAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  status?: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' | 'Cancelled';
  dueDate?: Date | string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;

  // Compatibility fields if any
  creditLimit?: number;
  currentBalance?: number;
}

export interface CreditPayment {
  id?: number;
  creditAccountId?: number; // can be null/optional for multiple invoice payments or advance payments
  customerId: number;
  invoiceId?: number; // optional, can be associated with a specific invoice payment
  paymentDate: Date | string;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string;
  referenceNo?: string; // compatibility
  notes?: string;
  receivedBy?: string;
  createdAt: Date;
}

export interface Setting {
  id?: string;
  key: string;
  value: any;
  category?: string;
  description?: string;
  isSystem?: boolean;
  createdAt?: Date;
  updatedAt: Date;
}

export interface User {
  id?: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'Administrator' | 'Cashier';
  profileImage?: string | null;
  status: 'active' | 'inactive';
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  recordId: number | string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  status: 'Pending' | 'Synced' | 'Failed' | 'Conflict';
  error?: string;
  recordData?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupHistoryItem {
  id?: number;
  backupDate: Date;
  recordsCount: number;
  durationMs: number;
  status: 'Success' | 'Failed';
  error?: string;
  type: 'Full' | 'Incremental';
  details?: string;
}

export interface AuditLog {
  id?: number;
  userId?: number;
  username: string;
  userRole: string;
  action: string; // 'Login' | 'Logout' | 'Create' | 'Update' | 'Delete' | 'Sync' | 'Backup' | 'Repair' | 'Reset'
  module: string; // 'Auth' | 'Products' | 'Sales' | 'Expenses' | 'Credit' | 'Settings' | 'Suppliers' | 'Customers'
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

class ShopDatabase extends Dexie {
  products!: Table<Product, number>;
  categories!: Table<Category, number>;
  customers!: Table<Customer, number>;
  suppliers!: Table<Supplier, number>;
  sales!: Table<Sale, number>;
  saleItems!: Table<SaleItem, number>;
  purchases!: Table<Purchase, number>;
  purchaseItems!: Table<PurchaseItem, number>;
  expenses!: Table<Expense, number>;
  expenseCategories!: Table<ExpenseCategory, number>;
  creditAccounts!: Table<CreditAccount, number>;
  creditPayments!: Table<CreditPayment, number>;
  settings!: Table<Setting, string>;
  users!: Table<User, number>;
  stockHistory!: Table<StockHistory, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  backupHistory!: Table<BackupHistoryItem, number>;
  auditLogs!: Table<AuditLog, number>;

  constructor() {
    super('ShopDatabase');
    this.version(1).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, name, phone',
      suppliers: '++id, name, companyName',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, category, expenseDate',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
    });
    this.version(2).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, name, phone',
      suppliers: '++id, name, companyName',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, category, expenseDate',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
    });
    this.version(3).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, name, phone',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, category, expenseDate',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
    });
    this.version(4).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, name, phone',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, category, expenseDate',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
    });
    this.version(5).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, fullName, name, phone, customerCode, status, isDeleted',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, category, expenseDate',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
    });
    this.version(6).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, fullName, name, phone, customerCode, status, isDeleted',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, expenseNumber, categoryId, title, isRecurring, status, isDeleted, expenseDate',
      expenseCategories: '++id, name, status',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
    });
    this.version(7).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, fullName, name, phone, customerCode, status, isDeleted',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, expenseNumber, categoryId, title, isRecurring, status, isDeleted, expenseDate',
      expenseCategories: '++id, name, status',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
      syncQueue: '++id, table, recordId, status, createdAt',
      backupHistory: '++id, backupDate, status',
    });
    this.version(8).stores({
      products: '++id, name, sku, categoryId, supplierId',
      categories: '++id, name',
      customers: '++id, fullName, name, phone, customerCode, status, isDeleted',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, expenseNumber, categoryId, title, isRecurring, status, isDeleted, expenseDate',
      expenseCategories: '++id, name, status',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
      syncQueue: '++id, table, recordId, status, createdAt',
      backupHistory: '++id, backupDate, status',
      auditLogs: '++id, action, module, username, timestamp',
    });
    this.version(9).stores({
      products: '++id, name, sku, categoryId, supplierId, status',
      categories: '++id, name, status',
      customers: '++id, fullName, name, phone, customerCode, status, isDeleted',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, expenseNumber, categoryId, title, isRecurring, status, isDeleted, expenseDate',
      expenseCategories: '++id, name, status',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
      syncQueue: '++id, table, recordId, status, createdAt',
      backupHistory: '++id, backupDate, status',
      auditLogs: '++id, action, module, username, timestamp',
    });
    this.version(10).stores({
      products: '++id, name, sku, categoryId, supplierId, status',
      categories: '++id, name, status',
      customers: '++id, fullName, name, phone, customerCode, status, isDeleted',
      suppliers: '++id, supplierCode, companyName, phone, email, status',
      sales: '++id, invoiceNo, customerId, status, createdAt',
      saleItems: '++id, saleId, productId',
      purchases: '++id, purchaseNumber, referenceNo, supplierId, status, createdAt',
      purchaseItems: '++id, purchaseId, productId',
      expenses: '++id, expenseNumber, categoryId, title, isRecurring, status, isDeleted, expenseDate',
      expenseCategories: '++id, name, status',
      creditAccounts: '++id, customerId',
      creditPayments: '++id, creditAccountId, customerId, createdAt',
      settings: 'key',
      users: '++id, &username, &email, role, status',
      stockHistory: '++id, productId, type, referenceNo, createdAt',
      syncQueue: '++id, table, recordId, status, createdAt',
      backupHistory: '++id, backupDate, status',
      auditLogs: '++id, action, module, username, timestamp',
    });
  }
}

export const db = new ShopDatabase();

// Hook Setup for synchronization queuing
export const syncState = { inProgress: false };
(db as any).syncState = syncState;

// Apply the asynchronous table-level validation layer
applyValidationLayer(db);

// Registered callbacks for change events
const changeListeners: (() => void)[] = [];

export function onDatabaseChange(cb: () => void) {
  changeListeners.push(cb);
  return () => {
    const idx = changeListeners.indexOf(cb);
    if (idx !== -1) {
      changeListeners.splice(idx, 1);
    }
  };
}

export function notifyDatabaseChange() {
  changeListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error('Error in database change listener:', e);
    }
  });
}

const SYNCABLE_TABLES = [
  'products', 'categories', 'customers', 'suppliers', 'sales', 'saleItems',
  'purchases', 'purchaseItems', 'expenses', 'expenseCategories', 'creditAccounts',
  'creditPayments', 'settings', 'users', 'stockHistory'
];

SYNCABLE_TABLES.forEach(tableName => {
  const table = (db as any)[tableName];
  if (!table) return;

  // Helper to format record details safely
  const getRecordDesc = (obj: any) => {
    return obj?.name || obj?.fullName || obj?.companyName || obj?.invoiceNo || obj?.purchaseNumber || obj?.expenseNumber || obj?.title || '';
  };

  // 1. Creating Hook
  table.hook('creating', function(this: any, primKey: any, obj: any, transaction: any) {
    if (syncState.inProgress) return;
    
    // Automatically assign unique ID to new records if missing
    assignUniqueId(tableName, obj);
    
    obj.syncStatus = 'Pending';
    obj.createdAt = obj.createdAt || new Date();
    obj.updatedAt = new Date();
    obj.syncVersion = 1;

    this.onsuccess = function(actualId: any) {
      const id = actualId || primKey || obj.id;
      setTimeout(() => {
        Dexie.ignoreTransaction(() => {
          db.syncQueue.add({
            table: tableName,
            recordId: id,
            action: 'CREATE',
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
          }).then(() => {
            notifyDatabaseChange();
          }).catch(err => console.error('Failed to queue create:', err));

          // Automated audit log
          if (tableName !== 'stockHistory') {
            const desc = getRecordDesc(obj);
            logAction(
              'Create',
              tableName.charAt(0).toUpperCase() + tableName.slice(1),
              `Created record ${desc ? `'${desc}'` : `ID ${id}`} in ${tableName}`
            ).catch(err => console.error('Failed to write audit:', err));
          }
        });
      }, 0);
    };
  });

  // 2. Updating Hook
  table.hook('updating', function(this: any, mods: any, primKey: any, obj: any, transaction: any) {
    if (syncState.inProgress) return;

    // Reset status to Pending and record new update time
    const updates: any = {
      ...mods,
      syncStatus: 'Pending',
      updatedAt: new Date()
    };

    this.onsuccess = function() {
      setTimeout(() => {
        Dexie.ignoreTransaction(() => {
          db.syncQueue.add({
            table: tableName,
            recordId: primKey,
            action: 'UPDATE',
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
          }).then(() => {
            notifyDatabaseChange();
          }).catch(err => console.error('Failed to queue update:', err));

          // Automated audit log
          if (tableName !== 'stockHistory') {
            const desc = getRecordDesc(obj);
            logAction(
              'Update',
              tableName.charAt(0).toUpperCase() + tableName.slice(1),
              `Updated record ${desc ? `'${desc}'` : `ID ${primKey}`} in ${tableName}`
            ).catch(err => console.error('Failed to write audit:', err));
          }
        });
      }, 0);
    };

    return updates;
  });

  // 3. Deleting Hook
  table.hook('deleting', function(this: any, primKey: any, obj: any, transaction: any) {
    if (syncState.inProgress) return;

    this.onsuccess = function() {
      setTimeout(() => {
        Dexie.ignoreTransaction(() => {
          db.syncQueue.add({
            table: tableName,
            recordId: primKey,
            action: 'DELETE',
            status: 'Pending',
            recordData: JSON.stringify(obj), // Keep data since the original record is being deleted
            createdAt: new Date(),
            updatedAt: new Date()
          }).then(() => {
            notifyDatabaseChange();
          }).catch(err => console.error('Failed to queue delete:', err));

          // Automated audit log
          if (tableName !== 'stockHistory') {
            const desc = getRecordDesc(obj);
            logAction(
              'Delete',
              tableName.charAt(0).toUpperCase() + tableName.slice(1),
              `Deleted record ${desc ? `'${desc}'` : `ID ${primKey}`} in ${tableName}`
            ).catch(err => console.error('Failed to write audit:', err));
          }
        });
      }, 0);
    };
  });
});

export default db;

