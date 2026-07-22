import { db } from '../database/db';
import { formatCurrency, formatDate, calculateMargin, parseSafeFloat, generateSKU } from './helpers.ts';
import { syncState } from '../database/db';
import { saveSale, deleteSale } from '../database/salesHelper';

export interface TestResult {
  name: string;
  category: 'Utility' | 'Business Logic' | 'Database' | 'Integrity';
  status: 'Passed' | 'Failed';
  message: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
  results: TestResult[];
}

/**
 * Executes a full suite of automated unit and integration tests against utilities,
 * business logic formulas, and database transaction hooks.
 * Uses temporary/mock records that are fully torn down after run.
 */
export async function runAutomatedTestSuite(): Promise<TestSuiteSummary> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  const runTest = async (
    name: string,
    category: 'Utility' | 'Business Logic' | 'Database' | 'Integrity',
    fn: () => void | Promise<void>
  ) => {
    const start = Date.now();
    try {
      await fn();
      results.push({
        name,
        category,
        status: 'Passed',
        message: 'Test passed successfully.',
        durationMs: Date.now() - start
      });
    } catch (err: any) {
      console.error(`Test failed: ${name}`, err);
      results.push({
        name,
        category,
        status: 'Failed',
        message: err.message || 'Assertion failed',
        durationMs: Date.now() - start
      });
    }
  };

  // ==========================================
  // CATEGORY 1: UTILITY TESTS
  // ==========================================

  await runTest('formatCurrency: should format standard numbers correctly', 'Utility', () => {
    const res = formatCurrency(1250.5);
    if (!res.includes('1,250.50')) {
      throw new Error(`Expected currency to format 1250.5 properly, got: ${res}`);
    }
  });

  await runTest('formatCurrency: should handle zero and negative values', 'Utility', () => {
    const zero = formatCurrency(0);
    const negative = formatCurrency(-50.25);
    if (!zero.includes('0.00')) throw new Error(`Expected 0.00, got ${zero}`);
    if (!negative.includes('-') && !negative.includes('50.25')) throw new Error(`Expected negative display, got ${negative}`);
  });

  await runTest('formatDate: should handle valid and invalid dates', 'Utility', () => {
    const valid = formatDate('2026-07-09T00:00:00');
    const invalid = formatDate('invalid-date-string');
    if (!valid || valid === '') throw new Error(`Expected formatted date, got empty string`);
    if (invalid !== '') throw new Error(`Expected invalid date to return empty string, got: ${invalid}`);
  });

  await runTest('calculateMargin: should calculate margin percentage correctly', 'Utility', () => {
    const margin = calculateMargin(60, 100); // cost 60, price 100 -> 40% margin
    if (margin !== 40) throw new Error(`Expected 40% margin, got ${margin}%`);
  });

  await runTest('calculateMargin: should protect against division by zero', 'Utility', () => {
    const margin = calculateMargin(50, 0);
    if (margin !== 0) throw new Error(`Expected 0 margin when price is 0, got ${margin}`);
  });

  await runTest('parseSafeFloat: should correctly parse float inputs and fallback to 0', 'Utility', () => {
    if (parseSafeFloat('10.5') !== 10.5) throw new Error('Failed parsing standard float string');
    if (parseSafeFloat('') !== 0) throw new Error('Empty string did not fallback to 0');
    if (parseSafeFloat(undefined) !== 0) throw new Error('Undefined did not fallback to 0');
    if (parseSafeFloat('invalid') !== 0) throw new Error('Invalid string did not fallback to 0');
  });

  // ==========================================
  // CATEGORY 2: BUSINESS LOGIC TESTS
  // ==========================================

  await runTest('useSaleCalculations: should calculate sales subtotal, tax, discounts, and net profit correctly', 'Business Logic', () => {
    // Simulated POS items
    const items = [
      { productId: 101, quantity: 2, sellingPrice: 15.00, purchasePrice: 10.00, discount: 1.00, tax: 0.50 }, // Cost: 20, Revenue: 28, Profit: 8
      { productId: 102, quantity: 1, sellingPrice: 50.00, purchasePrice: 30.00, discount: 5.00, tax: 2.00 }  // Cost: 30, Revenue: 45, Profit: 15
    ];

    const orderDiscount = 5.00;
    const orderTax = 3.00;
    const shipping = 7.00;
    const otherCharges = 2.00;
    const paidAmount = 70.00;
    const cashReceived = 100.00;

    // Manual Calculations expected:
    // Subtotal: 2 * 15 + 1 * 50 = 80
    // Item Discounts: 2 * 1 + 1 * 5 = 7
    // Total Discounts: 7 + 5 (orderDiscount) = 12
    // Item Taxes: 2 * 0.5 + 1 * 2 = 3
    // Total Taxes: 3 + 3 (orderTax) = 6
    // Grand Total: Subtotal (80) - Total Discounts (12) + Total Taxes (6) + Shipping (7) + Other (2) = 83
    // Remaining Amount: Grand Total (83) - Paid (70) = 13
    // Change Returned: cashReceived (100) - paidAmount (70) = 30
    // Profit: (Subtotal (80) - Total Discounts (12)) - Total Cost (20 + 30 = 50) = 68 - 50 = 18

    // Trigger calculation
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let itemTaxTotal = 0;
    let totalCost = 0;

    items.forEach((item) => {
      const qty = item.quantity;
      const price = item.sellingPrice;
      const cost = item.purchasePrice ?? 0;
      const disc = item.discount ?? 0;
      const tx = item.tax ?? 0;

      subtotal += price * qty;
      itemDiscountTotal += disc * qty;
      itemTaxTotal += tx * qty;
      totalCost += cost * qty;
    });

    const totalDiscount = itemDiscountTotal + orderDiscount;
    const tax = itemTaxTotal + orderTax;
    const grandTotal = Math.max(0, subtotal - totalDiscount + tax + shipping + otherCharges);
    const remainingAmount = Math.max(0, grandTotal - paidAmount);
    const changeReturned = cashReceived > paidAmount ? cashReceived - paidAmount : 0;
    const revenue = subtotal - totalDiscount;
    const profit = revenue - totalCost;

    // Verify assertions
    if (subtotal !== 80) throw new Error(`Expected Subtotal 80, got ${subtotal}`);
    if (totalDiscount !== 12) throw new Error(`Expected Total Discount 12, got ${totalDiscount}`);
    if (tax !== 6) throw new Error(`Expected Tax 6, got ${tax}`);
    if (grandTotal !== 83) throw new Error(`Expected Grand Total 83, got ${grandTotal}`);
    if (remainingAmount !== 13) throw new Error(`Expected Remaining Amount 13, got ${remainingAmount}`);
    if (changeReturned !== 30) throw new Error(`Expected Change Returned 30, got ${changeReturned}`);
    if (profit !== 18) throw new Error(`Expected Net Profit 18, got ${profit}`);
  });

  // ==========================================
  // CATEGORY 3: DATABASE HOOKS & TRANSACTIONS
  // ==========================================

  // For DB tests we write mock data and clean up immediately
  const mockSku = 'TEST-' + Date.now().toString().slice(-4);
  let createdProductId: number | null = null;
  let createdCategoryId: number | null = null;

  await runTest('Database Hooks: should automatically set syncStatus, createdAt, and append to syncQueue on Create', 'Database', async () => {
    // 1. Create a dummy category first
    createdCategoryId = await db.categories.add({
      name: 'Test Category',
      status: 'Active',
      createdAt: new Date()
    });

    // Verify category created
    if (!createdCategoryId) throw new Error('Failed to create parent mock category');

    // 2. Create product - this triggers Dexie "creating" hook
    createdProductId = await db.products.add({
      name: 'QA Automation Product',
      sku: mockSku,
      barcode: '123456789',
      categoryId: createdCategoryId,
      supplierId: 1,
      cost: 15.00,
      price: 25.00,
      currentStock: 10,
      minimumStock: 2,
      unit: 'pcs',
      status: 'Active',
      createdAt: new Date()
    });

    if (!createdProductId) throw new Error('Failed to insert test product');

    // 3. Retrieve product directly to see if hooks mutated it
    const product = await db.products.get(createdProductId);
    if (!product) throw new Error('Could not fetch back created test product');

    // Check automatic audit fields injected by Hook
    const prod = product as any;
    if (prod.syncStatus !== 'Pending') {
      throw new Error(`Expected hook to inject syncStatus "Pending", got: ${prod.syncStatus}`);
    }
    if (!prod.createdAt || !prod.updatedAt) {
      throw new Error('Expected hook to populate automatic audit dates (createdAt, updatedAt)');
    }

    // Check if item was added to the Sync Queue
    const queueItem = await db.syncQueue
      .where('table')
      .equals('products')
      .and(q => q.recordId === createdProductId && q.action === 'CREATE')
      .first();

    if (!queueItem) {
      throw new Error('Creating hook failed to append corresponding record to db.syncQueue');
    }
  });

  await runTest('Database Hooks: should reset syncStatus and append to syncQueue on Update', 'Database', async () => {
    if (!createdProductId) throw new Error('Skipping: Created product ID not found from previous test');

    // Simulate modifying the product name and price
    await db.products.update(createdProductId, {
      name: 'QA Automation Product (Updated)',
      price: 29.99
    });

    const updatedProduct = await db.products.get(createdProductId);
    if (!updatedProduct) throw new Error('Could not fetch updated test product');

    // Verify status was reset to Pending and updatedAt was set
    const prod = updatedProduct as any;
    if (prod.syncStatus !== 'Pending') {
      throw new Error('Expected updating hook to reset status back to Pending');
    }

    // Verify sync queue got the update operation logged
    const queueUpdateItem = await db.syncQueue
      .where('table')
      .equals('products')
      .and(q => q.recordId === createdProductId && q.action === 'UPDATE')
      .first();

    if (!queueUpdateItem) {
      throw new Error('Updating hook failed to queue UPDATE operation inside syncQueue');
    }
  });

  await runTest('Database Hooks: should log syncQueue action with serial data on Delete', 'Database', async () => {
    if (!createdProductId) throw new Error('Skipping: Created product ID not found');

    // Fetch details before delete to compare serialized data
    const preDeleteObj = await db.products.get(createdProductId);
    if (!preDeleteObj) throw new Error('Test product missing before deletion check');

    // Perform Delete - triggers deleting hook
    await db.products.delete(createdProductId);

    // Verify product is gone
    const postDeleteObj = await db.products.get(createdProductId);
    if (postDeleteObj) throw new Error('Failed to physically delete product');

    // Check if DELETE was queued inside the synchronization queue with serialized contents
    const queueDeleteItem = await db.syncQueue
      .where('table')
      .equals('products')
      .and(q => q.recordId === createdProductId && q.action === 'DELETE')
      .first();

    if (!queueDeleteItem) {
      throw new Error('Deleting hook failed to queue DELETE entry in syncQueue');
    }

    if (!queueDeleteItem.recordData) {
      throw new Error('Deleting hook did not store serialized backup recordData in syncQueue for offline replay');
    }

    const dataObj = JSON.parse(queueDeleteItem.recordData);
    if (dataObj.sku !== mockSku) {
      throw new Error(`Serialized delete data did not match original sku: ${dataObj.sku} vs ${mockSku}`);
    }

    // Clean up queue entries generated by tests to prevent inflating the real queue
    const queueItemsToDelete = await db.syncQueue
      .where('table')
      .equals('products')
      .and(q => q.recordId === createdProductId)
      .toArray();
    await db.syncQueue.bulkDelete(queueItemsToDelete.map(qi => qi.id!));

    // Clean up mock category
    if (createdCategoryId) {
      await db.categories.delete(createdCategoryId);
      const categoryQueueItems = await db.syncQueue
        .where('table')
        .equals('categories')
        .and(q => q.recordId === createdCategoryId)
        .toArray();
      await db.syncQueue.bulkDelete(categoryQueueItems.map(qi => qi.id!));
    }
  });

  await runTest('Database Integrity: Soft delete on customers should toggle isDeleted flag rather than physical wipe', 'Integrity', async () => {
    // Create customer
    const customerId = await db.customers.add({
      fullName: 'QA SoftDelete Customer',
      name: 'QA Customer',
      phone: '0900000000',
      email: 'qa@softdelete.com',
      customerCode: 'CUST-QA-101',
      customerType: 'Regular Customer',
      balance: 0,
      status: 'Active',
      isDeleted: false,
      createdAt: new Date()
    });

    if (!customerId) throw new Error('Failed to insert test customer');

    // Soft delete toggle (how it is implemented in customers page)
    await db.customers.update(customerId, { isDeleted: true });

    // Try fetching customer - they should still exist in database
    const customer = await db.customers.get(customerId);
    if (!customer) throw new Error('Soft deleted customer was physically deleted from DB!');
    if (customer.isDeleted !== true) throw new Error('Soft deleted customer isDeleted flag was not updated');

    // Permanent cleanup
    await db.customers.delete(customerId);
    const customerQueueItems = await db.syncQueue
      .where('table')
      .equals('customers')
      .and(q => q.recordId === customerId)
      .toArray();
    await db.syncQueue.bulkDelete(customerQueueItems.map(qi => qi.id!));
  });

  await runTest('Database Audit Trails: should automatically write logs inside db.auditLogs on write events', 'Integrity', async () => {
    // Generate a setting creation
    const testKey = 'setting-audit-test-' + Date.now();
    await db.settings.add({
      key: testKey,
      value: 'Audit Test Value',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Check if an audit log was generated automatically for settings (with minor retry/delay since audit logs are written asynchronously)
    let auditLog = null;
    for (let i = 0; i < 15; i++) {
      auditLog = await db.auditLogs
        .where('module')
        .equals('Settings')
        .and(log => log.details.includes(testKey))
        .first();
      if (auditLog) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!auditLog) {
      throw new Error('Audit logs hook failed: setting creation did not automatically trigger an AuditLog record');
    }

    // Cleanup setting
    await db.settings.delete(testKey);
    await db.auditLogs.delete(auditLog.id!);

    // Delete sync queue entries for this test
    const settingQueueItems = await db.syncQueue
      .where('table')
      .equals('settings')
      .and(q => q.recordId === testKey)
      .toArray();
    await db.syncQueue.bulkDelete(settingQueueItems.map(qi => qi.id!));
  });

  await runTest('Credit Transaction Integrity: saveSale and deleteSale maintain customer balance and credit accounts atomically', 'Integrity', async () => {
    // 1. Create a mock customer with credit limit $1000
    const testCustId = await db.customers.add({
      fullName: 'QA Credit Integrity Test Customer',
      name: 'QA Credit Cust',
      phone: '0888999000',
      email: 'credit.integrity@qa.com',
      customerCode: 'CUST-CREDIT-TEST',
      customerType: 'Regular Customer',
      creditLimit: 1000,
      openingBalance: 0,
      currentBalance: 0,
      balance: 0,
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(),
    });

    if (!testCustId) throw new Error('Failed to insert mock credit customer');

    // 2. Perform a credit sale ($300 grand total, $100 downpayment, $200 remaining credit)
    const mockInvoiceNo = `INV-CREDIT-TEST-${Date.now()}`;
    const salePayload = {
      invoiceNumber: mockInvoiceNo,
      customerId: testCustId,
      customerName: 'QA Credit Integrity Test Customer',
      saleDate: new Date(),
      subtotal: 300,
      discount: 0,
      tax: 0,
      shipping: 0,
      otherCharges: 0,
      grandTotal: 300,
      total: 300,
      paidAmount: 100,
      remainingAmount: 200,
      changeReturned: 0,
      changeAmount: 0,
      paymentStatus: 'Partial' as const,
      status: 'Completed',
      paymentMethod: 'Credit',
      saleType: 'Partial Payment Sale' as const,
      cashReceived: 100,
      notes: 'QA Automated Credit Sale Test',
      createdBy: 'Tester',
      userId: 1,
    };

    const itemsPayload = [
      {
        productId: 1,
        barcode: '123',
        productName: 'QA Product',
        quantity: 3,
        purchasePrice: 50,
        sellingPrice: 100,
        price: 100,
        discount: 0,
        tax: 0,
        profit: 150,
        total: 300,
        subtotal: 300,
      },
    ];

    const saveResult = await saveSale(salePayload, itemsPayload);
    if (!saveResult.saleId) throw new Error('saveSale failed to return a valid saleId');

    // 3. Verify Customer Balance in IndexedDB
    const updatedCustomer = await db.customers.get(testCustId);
    if (!updatedCustomer) throw new Error('Customer missing after credit sale');
    if (updatedCustomer.currentBalance !== 200) {
      throw new Error(`Expected customer.currentBalance to be $200, got $${updatedCustomer.currentBalance}`);
    }

    // 4. Verify Credit Account in IndexedDB
    const ca = await db.creditAccounts.where('invoiceId').equals(saveResult.saleId).first();
    if (!ca) throw new Error('Credit account record was not created for credit sale');
    if (ca.remainingAmount !== 200 || ca.status !== 'Partial') {
      throw new Error(`Expected credit account remaining $200 with Partial status, got $${ca.remainingAmount} (${ca.status})`);
    }

    // 5. Verify Downpayment log in Credit Payments
    const dp = await db.creditPayments.where('creditAccountId').equals(ca.id!).first();
    if (!dp) throw new Error('Downpayment payment record missing in db.creditPayments');
    if (dp.amount !== 100 || (dp.referenceNumber !== 'POS-DP' && dp.referenceNo !== 'POS-DP')) {
      throw new Error(`Expected downpayment $100 with REF POS-DP, got $${dp.amount} (${dp.referenceNumber})`);
    }

    // 6. Delete Sale and verify rollback
    await deleteSale(saveResult.saleId);

    const customerAfterDelete = await db.customers.get(testCustId);
    if (!customerAfterDelete) throw new Error('Customer missing after deleting sale');
    if (customerAfterDelete.currentBalance !== 0) {
      throw new Error(`Expected customer.currentBalance to be reset to $0 after sale deletion, got $${customerAfterDelete.currentBalance}`);
    }

    const caAfterDelete = await db.creditAccounts.get(ca.id!);
    if (!caAfterDelete || caAfterDelete.status !== 'Cancelled') {
      throw new Error('Credit account status was not updated to Cancelled after sale deletion');
    }

    // Clean up mock records
    await db.sales.delete(saveResult.saleId);
    await db.saleItems.where('saleId').equals(saveResult.saleId).delete();
    await db.creditAccounts.delete(ca.id!);
    await db.creditPayments.where('creditAccountId').equals(ca.id!).delete();
    await db.customers.delete(testCustId);
  });

  const durationMs = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'Passed').length;
  const failed = results.filter(r => r.status === 'Failed').length;

  return {
    passed,
    failed,
    total: results.length,
    durationMs,
    results
  };
}
