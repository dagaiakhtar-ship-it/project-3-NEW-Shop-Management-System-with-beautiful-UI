import { db, type Product, type Category, type Customer, type Supplier, type Sale, type SaleItem, type Purchase, type PurchaseItem, type Expense, type CreditAccount, type CreditPayment, type StockHistory } from '../../database/db';
import { logAction } from '../../utils/auditLogger';
import { updateCustomerBalance } from '../../database/creditHelper';

export interface DataInconsistency {
  id: string;
  category: 'Products' | 'Customers' | 'Suppliers' | 'Sales' | 'Purchases' | 'Expenses' | 'Credit' | 'Inventory';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recordId: string | number;
  description: string;
  status: 'Pending Repair' | 'Repaired' | 'Ignored';
  repairedValue?: string;
}

export interface DataIntegrityReport {
  timestamp: Date;
  totalRecordsChecked: number;
  inconsistenciesFound: number;
  inconsistenciesRepaired: number;
  healthScore: number; // 0 - 100
  isProductionReady: boolean;
  issues: DataInconsistency[];
}

class DataIntegrityService {
  /**
   * Run a read-only audit scan of the entire database to discover any data integrity issues.
   */
  public async scanDatabase(): Promise<DataIntegrityReport> {
    const issues: DataInconsistency[] = [];
    let totalChecked = 0;

    try {
      // Fetch all database tables
      const products = await db.products.toArray();
      const categories = await db.categories.toArray();
      const customers = await db.customers.toArray();
      const suppliers = await db.suppliers.toArray();
      const sales = await db.sales.toArray();
      const saleItems = await db.saleItems.toArray();
      const purchases = await db.purchases.toArray();
      const purchaseItems = await db.purchaseItems.toArray();
      const expenses = await db.expenses.toArray();
      const expenseCategories = await db.expenseCategories.toArray();
      const creditAccounts = await db.creditAccounts.toArray();
      const creditPayments = await db.creditPayments.toArray();
      const stockHistory = await db.stockHistory.toArray();

      const categoryIds = new Set(categories.map((c) => c.id));
      const customerIds = new Set(customers.map((c) => c.id));
      const supplierIds = new Set(suppliers.map((s) => s.id));
      const expenseCategoryIds = new Set(expenseCategories.map((ec) => ec.id));
      const saleIds = new Set(sales.map((s) => s.id));
      const purchaseIds = new Set(purchases.map((p) => p.id));
      const creditAccountIds = new Set(creditAccounts.map((ca) => ca.id));

      // 1. PRODUCTS INTEGRITY
      for (const p of products) {
        totalChecked++;
        // Check legacy field compatibility
        if (p.price !== p.sellingPrice || p.cost !== p.purchasePrice || p.stock !== p.currentStock || p.alertQuantity !== p.minimumStock) {
          issues.push({
            id: `prod-fields-mismatch-${p.id}`,
            category: 'Products',
            severity: 'Low',
            recordId: p.id!,
            description: `Product "${p.name}" has legacy/modern field discrepancy (price: ${p.price} vs sellingPrice: ${p.sellingPrice}, cost: ${p.cost} vs purchasePrice: ${p.purchasePrice}, stock: ${p.stock} vs currentStock: ${p.currentStock}).`,
            status: 'Pending Repair',
          });
        }

        // Check for orphan category
        if (p.categoryId && !categoryIds.has(p.categoryId)) {
          issues.push({
            id: `prod-orphan-category-${p.id}`,
            category: 'Products',
            severity: 'Medium',
            recordId: p.id!,
            description: `Product "${p.name}" references non-existent Category ID ${p.categoryId}.`,
            status: 'Pending Repair',
          });
        }

        // Check for orphan supplier
        if (p.supplierId && !supplierIds.has(p.supplierId)) {
          issues.push({
            id: `prod-orphan-supplier-${p.id}`,
            category: 'Products',
            severity: 'Medium',
            recordId: p.id!,
            description: `Product "${p.name}" references non-existent Supplier ID ${p.supplierId}.`,
            status: 'Pending Repair',
          });
        }

        // Check negative or invalid prices
        if ((p.price ?? 0) < 0 || (p.sellingPrice ?? 0) < 0 || (p.cost ?? 0) < 0 || (p.purchasePrice ?? 0) < 0) {
          issues.push({
            id: `prod-negative-financials-${p.id}`,
            category: 'Products',
            severity: 'High',
            recordId: p.id!,
            description: `Product "${p.name}" has invalid negative pricing or cost fields.`,
            status: 'Pending Repair',
          });
        }
      }

      // Check for duplicate SKUs or Barcodes
      const skuMap = new Map<string, Product[]>();
      const barcodeMap = new Map<string, Product[]>();
      products.forEach((p) => {
        if (p.sku) {
          const list = skuMap.get(p.sku) || [];
          list.push(p);
          skuMap.set(p.sku, list);
        }
        if (p.barcode) {
          const list = barcodeMap.get(p.barcode) || [];
          list.push(p);
          barcodeMap.set(p.barcode, list);
        }
      });

      skuMap.forEach((prods, sku) => {
        if (prods.length > 1) {
          prods.forEach((p) => {
            issues.push({
              id: `prod-duplicate-sku-${p.id}`,
              category: 'Products',
              severity: 'High',
              recordId: p.id!,
              description: `Duplicate SKU "${sku}" found on product "${p.name}".`,
              status: 'Pending Repair',
            });
          });
        }
      });

      barcodeMap.forEach((prods, bc) => {
        if (prods.length > 1) {
          prods.forEach((p) => {
            issues.push({
              id: `prod-duplicate-barcode-${p.id}`,
              category: 'Products',
              severity: 'Medium',
              recordId: p.id!,
              description: `Duplicate Barcode "${bc}" found on product "${p.name}".`,
              status: 'Pending Repair',
            });
          });
        }
      });


      // 2. CUSTOMER BALANCE INTEGRITY
      for (const c of customers) {
        totalChecked++;
        if (c.isDeleted) continue;

        // Check legacy field compatibility
        if (c.balance !== c.currentBalance) {
          issues.push({
            id: `cust-fields-mismatch-${c.id}`,
            category: 'Customers',
            severity: 'Low',
            recordId: c.id!,
            description: `Customer "${c.fullName || c.name}" has balance/currentBalance discrepancy (${c.balance} vs ${c.currentBalance}).`,
            status: 'Pending Repair',
          });
        }

        // Calculate customer outstanding credit balance from active credit accounts
        const customerCreditAccounts = creditAccounts.filter((ca) => ca.customerId === c.id && ca.status !== 'Cancelled');
        const calculatedOutstanding = customerCreditAccounts.reduce((sum, ca) => sum + (ca.remainingAmount ?? 0), 0);
        const actualBalance = c.currentBalance ?? c.balance ?? 0;

        if (Math.abs(actualBalance - calculatedOutstanding) > 0.01) {
          issues.push({
            id: `cust-balance-out-of-sync-${c.id}`,
            category: 'Customers',
            severity: 'High',
            recordId: c.id!,
            description: `Customer "${c.fullName || c.name}" balance is $${actualBalance.toFixed(2)}, but active ledger credit sums to $${calculatedOutstanding.toFixed(2)}. Difference of $${Math.abs(actualBalance - calculatedOutstanding).toFixed(2)}.`,
            status: 'Pending Repair',
          });
        }
      }


      // 3. SUPPLIER BALANCE INTEGRITY
      for (const s of suppliers) {
        totalChecked++;
        // Calculate outstanding purchases balance from active/unpaid purchases
        const supplierPurchases = purchases.filter((p) => p.supplierId === s.id && p.status !== 'Deleted' && p.status !== 'Cancelled');
        const calculatedOutstanding = supplierPurchases.reduce((sum, p) => {
          const grandTotal = p.grandTotal ?? p.total ?? 0;
          const paid = p.paidAmount ?? 0;
          const remaining = p.remainingAmount ?? (grandTotal - paid);
          return sum + remaining;
        }, 0);
        const actualBalance = s.currentBalance ?? 0;

        if (Math.abs(actualBalance - calculatedOutstanding) > 0.01) {
          issues.push({
            id: `sup-balance-out-of-sync-${s.id}`,
            category: 'Suppliers',
            severity: 'High',
            recordId: s.id!,
            description: `Supplier "${s.companyName || s.name}" outstanding balance is $${actualBalance.toFixed(2)}, but unpaid purchases sum to $${calculatedOutstanding.toFixed(2)}.`,
            status: 'Pending Repair',
          });
        }
      }


      // 4. SALES & INVOICES INTEGRITY
      for (const sale of sales) {
        totalChecked++;
        if (sale.isDeleted) continue;

        // Check for orphan customer
        if (sale.customerId && !customerIds.has(sale.customerId)) {
          issues.push({
            id: `sale-orphan-customer-${sale.id}`,
            category: 'Sales',
            severity: 'High',
            recordId: sale.id!,
            description: `Sale invoice #${sale.invoiceNumber || sale.invoiceNo} references non-existent Customer ID ${sale.customerId}.`,
            status: 'Pending Repair',
          });
        }

        // Calculate sale items total
        const items = saleItems.filter((si) => si.saleId === sale.id);
        const itemsSubtotal = items.reduce((sum, item) => sum + (item.total ?? item.subtotal ?? ((item.sellingPrice ?? item.price ?? 0) * item.quantity)), 0);
        
        // Grand Total verification: Subtotal - discount + tax + shipping + otherCharges
        const calcDiscount = sale.discount || 0;
        const calcTax = sale.tax || 0;
        const calcShipping = sale.shipping ?? 0;
        const calcOther = sale.otherCharges || 0;
        const expectedGrandTotal = Math.max(0, itemsSubtotal - calcDiscount + calcTax + calcShipping + calcOther);
        const actualGrandTotal = sale.grandTotal ?? sale.total ?? 0;

        if (Math.abs(actualGrandTotal - expectedGrandTotal) > 0.01) {
          issues.push({
            id: `sale-grandtotal-mismatch-${sale.id}`,
            category: 'Sales',
            severity: 'High',
            recordId: sale.id!,
            description: `Sale invoice #${sale.invoiceNumber || sale.invoiceNo} total is $${actualGrandTotal.toFixed(2)}, but expected is $${expectedGrandTotal.toFixed(2)} based on items & charges.`,
            status: 'Pending Repair',
          });
        }

        // Check remainingAmount / paidAmount alignment
        const expectedRemaining = Math.max(0, actualGrandTotal - (sale.paidAmount ?? 0));
        const actualRemaining = sale.remainingAmount ?? 0;

        if (Math.abs(actualRemaining - expectedRemaining) > 0.01) {
          issues.push({
            id: `sale-remaining-mismatch-${sale.id}`,
            category: 'Sales',
            severity: 'Medium',
            recordId: sale.id!,
            description: `Sale invoice #${sale.invoiceNumber || sale.invoiceNo} remaining balance is $${actualRemaining.toFixed(2)}, but calculation (GrandTotal - Paid) is $${expectedRemaining.toFixed(2)}.`,
            status: 'Pending Repair',
          });
        }

        // Check payment status consistency
        const expectedStatus = (sale.paidAmount ?? 0) >= actualGrandTotal 
          ? 'Paid' 
          : ((sale.paidAmount ?? 0) > 0 ? 'Partial' : 'Unpaid');

        if (sale.paymentStatus !== expectedStatus) {
          issues.push({
            id: `sale-status-mismatch-${sale.id}`,
            category: 'Sales',
            severity: 'Medium',
            recordId: sale.id!,
            description: `Sale invoice #${sale.invoiceNumber || sale.invoiceNo} payment status is "${sale.paymentStatus}" but amounts indicate it should be "${expectedStatus}".`,
            status: 'Pending Repair',
          });
        }

        // Check if credit or loan sale has missing credit account or missing downpayment
        const isCreditSale =
          sale.saleType === 'Credit Sale' ||
          sale.saleType === 'Partial Payment Sale' ||
          (sale.remainingAmount ?? 0) > 0 ||
          sale.paymentMethod === 'Credit' ||
          sale.paymentMethod === 'Loan';

        if (isCreditSale && sale.customerId && sale.customerId > 0) {
          const ca = creditAccounts.find((a) => a.invoiceId === sale.id && a.status !== 'Cancelled');
          if (!ca) {
            issues.push({
              id: `sale-missing-credit-account-${sale.id}`,
              category: 'Credit',
              severity: 'High',
              recordId: sale.id!,
              description: `Credit sale invoice #${sale.invoiceNumber || sale.invoiceNo} for customer ID ${sale.customerId} is missing a corresponding credit account record.`,
              status: 'Pending Repair',
            });
          } else if ((sale.paidAmount ?? 0) > 0) {
            const hasDpPayment = creditPayments.some(
              (cp) => cp.creditAccountId === ca.id || (cp.invoiceId === sale.id && (cp.referenceNumber === 'POS-DP' || cp.referenceNo === 'POS-DP'))
            );
            if (!hasDpPayment) {
              issues.push({
                id: `sale-missing-downpayment-payment-${sale.id}`,
                category: 'Credit',
                severity: 'Medium',
                recordId: sale.id!,
                description: `Credit sale invoice #${sale.invoiceNumber || sale.invoiceNo} has downpayment $${sale.paidAmount} but is missing a downpayment payment entry in creditPayments.`,
                status: 'Pending Repair',
              });
            }
          }
        }
      }


      // 5. PURCHASES INTEGRITY
      for (const pur of purchases) {
        totalChecked++;
        if (pur.status === 'Deleted') continue;

        // Check for orphan supplier
        if (pur.supplierId && !supplierIds.has(pur.supplierId)) {
          issues.push({
            id: `purchase-orphan-supplier-${pur.id}`,
            category: 'Purchases',
            severity: 'High',
            recordId: pur.id!,
            description: `Purchase #${pur.purchaseNumber || pur.referenceNo} references non-existent Supplier ID ${pur.supplierId}.`,
            status: 'Pending Repair',
          });
        }

        // Calculate totals
        const items = purchaseItems.filter((pi) => pi.purchaseId === pur.id);
        const calculatedTotal = items.reduce((sum, item) => sum + ((item.purchasePrice ?? item.cost ?? 0) * item.quantity), 0);
        const actualTotal = pur.grandTotal ?? pur.total ?? 0;

        if (Math.abs(actualTotal - calculatedTotal) > 0.01 && calculatedTotal > 0) {
          issues.push({
            id: `purchase-total-mismatch-${pur.id}`,
            category: 'Purchases',
            severity: 'Medium',
            recordId: pur.id!,
            description: `Purchase #${pur.purchaseNumber || pur.referenceNo} total is $${actualTotal.toFixed(2)}, but line items sum is $${calculatedTotal.toFixed(2)}.`,
            status: 'Pending Repair',
          });
        }

        // Check remaining amount alignment
        const expectedRemaining = Math.max(0, actualTotal - (pur.paidAmount ?? 0));
        const actualRemaining = pur.remainingAmount ?? 0;

        if (Math.abs(actualRemaining - expectedRemaining) > 0.01) {
          issues.push({
            id: `purchase-remaining-mismatch-${pur.id}`,
            category: 'Purchases',
            severity: 'Medium',
            recordId: pur.id!,
            description: `Purchase #${pur.purchaseNumber || pur.referenceNo} remaining balance is $${actualRemaining.toFixed(2)}, but calculation is $${expectedRemaining.toFixed(2)}.`,
            status: 'Pending Repair',
          });
        }
      }


      // 6. EXPENSES INTEGRITY
      for (const exp of expenses) {
        totalChecked++;
        if (exp.isDeleted) continue;

        // Check orphan category
        if (exp.categoryId && !expenseCategoryIds.has(exp.categoryId)) {
          issues.push({
            id: `exp-orphan-category-${exp.id}`,
            category: 'Expenses',
            severity: 'Medium',
            recordId: exp.id!,
            description: `Expense "${exp.title}" references non-existent category ID ${exp.categoryId}.`,
            status: 'Pending Repair',
          });
        }

        // Check negative or invalid amounts
        if ((exp.amount ?? 0) < 0) {
          issues.push({
            id: `exp-negative-amount-${exp.id}`,
            category: 'Expenses',
            severity: 'High',
            recordId: exp.id!,
            description: `Expense "${exp.title}" has invalid negative amount ($${exp.amount}).`,
            status: 'Pending Repair',
          });
        }
      }


      // 7. CREDIT ACCOUNTS & CREDIT PAYMENTS
      for (const ca of creditAccounts) {
        totalChecked++;
        if (ca.status === 'Cancelled') continue;

        // Check orphan invoice
        if (ca.invoiceId && !saleIds.has(ca.invoiceId)) {
          issues.push({
            id: `credit-orphan-invoice-${ca.id}`,
            category: 'Credit',
            severity: 'High',
            recordId: ca.id!,
            description: `Credit account for invoice #${ca.invoiceNumber} references non-existent sale ID ${ca.invoiceId}.`,
            status: 'Pending Repair',
          });
        }

        // Verify remaining amount matches credit payments sum
        const payments = creditPayments.filter((cp) => cp.creditAccountId === ca.id);
        const totalPaymentsAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Wait, downpayment inside sale is added as credit payment too duringPOS checkout.
        // Let's verify remaining amount is: invoiceAmount - sum(payments).
        const calculatedRemaining = Math.max(0, ca.invoiceAmount - totalPaymentsAmount);
        const actualRemaining = ca.remainingAmount ?? 0;

        if (Math.abs(actualRemaining - calculatedRemaining) > 0.01) {
          issues.push({
            id: `credit-balance-mismatch-${ca.id}`,
            category: 'Credit',
            severity: 'High',
            recordId: ca.id!,
            description: `Credit account #${ca.id} (Invoice: ${ca.invoiceNumber}) shows remaining $${actualRemaining.toFixed(2)}, but calculations (InvoiceAmount $${ca.invoiceAmount.toFixed(2)} - Payments $${totalPaymentsAmount.toFixed(2)}) indicate it should be $${calculatedRemaining.toFixed(2)}.`,
            status: 'Pending Repair',
          });
        }
      }

      // Check orphan credit payments
      for (const cp of creditPayments) {
        totalChecked++;
        if (cp.creditAccountId && !creditAccountIds.has(cp.creditAccountId)) {
          issues.push({
            id: `payment-orphan-creditacc-${cp.id}`,
            category: 'Credit',
            severity: 'Medium',
            recordId: cp.id!,
            description: `Credit payment of $${cp.amount} references non-existent credit account ID ${cp.creditAccountId}.`,
            status: 'Pending Repair',
          });
        }
      }


      // 8. STOCK HISTORY & INVENTORY RECONCILIATION
      // Let's cross-reference the aggregate sum of stockHistory against product currentStock
      for (const p of products) {
        if (p.status === 'Archived') continue;
        const pHistory = stockHistory.filter((sh) => sh.productId === p.id);
        
        // Rebuild stock history calculation
        const historySum = pHistory.reduce((sum, sh) => sum + sh.quantity, 0);
        const currentStockVal = p.currentStock ?? p.stock ?? 0;

        // Since some systems initialize stock without a stock history record,
        // we check if they are equal. If not, we log a mismatch.
        // Wait! Let's only raise an issue if there is a stock history but the final stock is mismatch,
        // or if stock is completely different from the transaction records.
        // Let's flag a warning so that a correcting 'Adjustment' history entry is generated,
        // or currentStock is aligned correctly.
        if (historySum !== currentStockVal) {
          issues.push({
            id: `inv-stock-mismatch-${p.id}`,
            category: 'Inventory',
            severity: 'Medium',
            recordId: p.id!,
            description: `Product "${p.name}" has currentStock = ${currentStockVal}, but aggregated transaction history sum is ${historySum}. (Mismatch of ${currentStockVal - historySum}).`,
            status: 'Pending Repair',
          });
        }
      }

    } catch (err: any) {
      console.error('Error scanning database for integrity checks:', err);
      issues.push({
        id: `scan-system-error`,
        category: 'Inventory',
        severity: 'Critical',
        recordId: 'System',
        description: `Audit failed to complete: ${err.message || 'Unknown database read error'}`,
        status: 'Ignored',
      });
    }

    // Compute Health Score
    // We deduct penalties based on severity of unresolved issues
    let penalty = 0;
    issues.forEach((issue) => {
      if (issue.severity === 'Critical') penalty += 30;
      else if (issue.severity === 'High') penalty += 15;
      else if (issue.severity === 'Medium') penalty += 5;
      else penalty += 1;
    });

    const healthScore = Math.max(0, 100 - penalty);
    const isProductionReady = healthScore >= 95;

    return {
      timestamp: new Date(),
      totalRecordsChecked: totalChecked,
      inconsistenciesFound: issues.length,
      inconsistenciesRepaired: 0,
      healthScore,
      isProductionReady,
      issues,
    };
  }

  /**
   * Run auto-repair routines to automatically repair all detected database inconsistencies in a safe transaction.
   */
  public async repairDatabase(): Promise<DataIntegrityReport> {
    const scanReport = await this.scanDatabase();
    if (scanReport.issues.length === 0) {
      return {
        ...scanReport,
        inconsistenciesRepaired: 0,
      };
    }

    let repairedCount = 0;
    const repairedIssues: DataInconsistency[] = [];

    // Group issues by table/category to optimize transaction blocks
    try {
      await db.transaction('rw', [
        db.products,
        db.customers,
        db.suppliers,
        db.sales,
        db.saleItems,
        db.purchases,
        db.purchaseItems,
        db.expenses,
        db.creditAccounts,
        db.creditPayments,
        db.stockHistory,
      ], async () => {
        
        for (const issue of scanReport.issues) {
          let repaired = false;
          let repairedValue = '';

          try {
            // PRODUCTS REPAIRS
            if (issue.category === 'Products') {
              const prod = await db.products.get(issue.recordId as number);
              if (prod) {
                if (issue.id.startsWith('prod-fields-mismatch-')) {
                  const maxPrice = Math.max(prod.price ?? 0, prod.sellingPrice ?? 0);
                  const maxCost = Math.max(prod.cost ?? 0, prod.purchasePrice ?? 0);
                  const resolvedStock = prod.currentStock !== undefined ? prod.currentStock : (prod.stock ?? 0);
                  const resolvedMinStock = prod.alertQuantity !== undefined ? prod.alertQuantity : (prod.minimumStock ?? 5);

                  await db.products.update(prod.id!, {
                    price: maxPrice,
                    sellingPrice: maxPrice,
                    cost: maxCost,
                    purchasePrice: maxCost,
                    currentStock: resolvedStock,
                    stock: resolvedStock,
                    alertQuantity: resolvedMinStock,
                    minimumStock: resolvedMinStock,
                    updatedAt: new Date(),
                  });
                  repaired = true;
                  repairedValue = `Aligned dual fields (Price: ${maxPrice}, Cost: ${maxCost}, Stock: ${resolvedStock})`;
                } 
                else if (issue.id.startsWith('prod-orphan-category-')) {
                  // Link to first available category or 1 (default)
                  const firstCategory = await db.categories.toCollection().first();
                  const targetCatId = firstCategory?.id || 1;
                  await db.products.update(prod.id!, { categoryId: targetCatId, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Linked to default category ID ${targetCatId}`;
                }
                else if (issue.id.startsWith('prod-orphan-supplier-')) {
                  // Link to first available supplier or 1 (default)
                  const firstSupplier = await db.suppliers.toCollection().first();
                  const targetSupId = firstSupplier?.id || 1;
                  await db.products.update(prod.id!, { supplierId: targetSupId, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Linked to default supplier ID ${targetSupId}`;
                }
                else if (issue.id.startsWith('prod-negative-financials-')) {
                  const safePrice = Math.max(0, prod.sellingPrice ?? prod.price ?? 0);
                  const safeCost = Math.max(0, prod.purchasePrice ?? prod.cost ?? 0);
                  await db.products.update(prod.id!, {
                    price: safePrice,
                    sellingPrice: safePrice,
                    cost: safeCost,
                    purchasePrice: safeCost,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Sanitized negative finances to $0.00`;
                }
                else if (issue.id.startsWith('prod-duplicate-sku-')) {
                  const uniqSku = `${prod.sku}-${Math.floor(1000 + Math.random() * 9000)}`;
                  await db.products.update(prod.id!, { sku: uniqSku, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Reassigned SKU to: ${uniqSku}`;
                }
                else if (issue.id.startsWith('prod-duplicate-barcode-')) {
                  const uniqBarcode = `${prod.barcode || 'BC'}${Date.now().toString().slice(-4)}`;
                  await db.products.update(prod.id!, { barcode: uniqBarcode, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Reassigned barcode to: ${uniqBarcode}`;
                }
              }
            }

            // CUSTOMER REPAIRS
            else if (issue.category === 'Customers') {
              const cust = await db.customers.get(issue.recordId as number);
              if (cust) {
                if (issue.id.startsWith('cust-fields-mismatch-')) {
                  const resolvedBalance = cust.currentBalance !== undefined ? cust.currentBalance : (cust.balance ?? 0);
                  await db.customers.update(cust.id!, {
                    balance: resolvedBalance,
                    currentBalance: resolvedBalance,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Synced legacy balance fields to $${resolvedBalance.toFixed(2)}`;
                }
                else if (issue.id.startsWith('cust-balance-out-of-sync-')) {
                  // Recalculate based on active credit accounts
                  const accounts = await db.creditAccounts.where('customerId').equals(cust.id!).toArray();
                  const calcBal = accounts.filter(a => a.status !== 'Cancelled').reduce((sum, a) => sum + (a.remainingAmount ?? 0), 0);
                  await db.customers.update(cust.id!, {
                    balance: calcBal,
                    currentBalance: calcBal,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Recalculated from ledger accounts: $${calcBal.toFixed(2)}`;
                }
              }
            }

            // SUPPLIER REPAIRS
            else if (issue.category === 'Suppliers') {
              const sup = await db.suppliers.get(issue.recordId as number);
              if (sup) {
                if (issue.id.startsWith('sup-balance-out-of-sync-')) {
                  const supplierPurchases = await db.purchases.where('supplierId').equals(sup.id!).toArray();
                  const calcBal = supplierPurchases.filter(p => p.status !== 'Deleted' && p.status !== 'Cancelled').reduce((sum, p) => {
                    const gt = p.grandTotal ?? p.total ?? 0;
                    return sum + (p.remainingAmount ?? (gt - (p.paidAmount ?? 0)));
                  }, 0);
                  await db.suppliers.update(sup.id!, {
                    currentBalance: calcBal,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Recalculated outstanding supplier balance: $${calcBal.toFixed(2)}`;
                }
              }
            }

            // SALES REPAIRS
            else if (issue.category === 'Sales') {
              const sale = await db.sales.get(issue.recordId as number);
              if (sale) {
                if (issue.id.startsWith('sale-orphan-customer-')) {
                  // Clear or re-assign to first customer or default customer (0 for walk-in)
                  await db.sales.update(sale.id!, { customerId: 0, customerName: 'Walk-in Customer', updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Linked to default Customer ID 0 (Walk-in)`;
                }
                else if (issue.id.startsWith('sale-grandtotal-mismatch-')) {
                  const items = await db.saleItems.where('saleId').equals(sale.id!).toArray();
                  const subTotal = items.reduce((sum, it) => sum + (it.total ?? it.subtotal ?? ((it.sellingPrice ?? it.price ?? 0) * it.quantity)), 0);
                  const disc = sale.discount || 0;
                  const tx = sale.tax || 0;
                  const ship = sale.shipping ?? 0;
                  const oth = sale.otherCharges || 0;
                  const calcGT = Math.max(0, subTotal - disc + tx + ship + oth);

                  const rem = Math.max(0, calcGT - (sale.paidAmount ?? 0));
                  const status = (sale.paidAmount ?? 0) >= calcGT ? 'Paid' : ((sale.paidAmount ?? 0) > 0 ? 'Partial' : 'Unpaid');

                  await db.sales.update(sale.id!, {
                    total: calcGT,
                    grandTotal: calcGT,
                    remainingAmount: rem,
                    paymentStatus: status,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Corrected grand total to $${calcGT.toFixed(2)}, remaining $${rem.toFixed(2)}`;
                }
                else if (issue.id.startsWith('sale-remaining-mismatch-') || issue.id.startsWith('sale-status-mismatch-')) {
                  const gt = sale.grandTotal ?? sale.total ?? 0;
                  const rem = Math.max(0, gt - (sale.paidAmount ?? 0));
                  const status = (sale.paidAmount ?? 0) >= gt ? 'Paid' : ((sale.paidAmount ?? 0) > 0 ? 'Partial' : 'Unpaid');

                  await db.sales.update(sale.id!, {
                    remainingAmount: rem,
                    paymentStatus: status,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Synced remainingAmount to $${rem.toFixed(2)} and paymentStatus to "${status}"`;
                }
              }
            }

            // PURCHASES REPAIRS
            else if (issue.category === 'Purchases') {
              const pur = await db.purchases.get(issue.recordId as number);
              if (pur) {
                if (issue.id.startsWith('purchase-orphan-supplier-')) {
                  const firstSup = await db.suppliers.toCollection().first();
                  const targetSupId = firstSup?.id || 1;
                  await db.purchases.update(pur.id!, { supplierId: targetSupId, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Linked to default Supplier ID ${targetSupId}`;
                }
                else if (issue.id.startsWith('purchase-total-mismatch-')) {
                  const items = await db.purchaseItems.where('purchaseId').equals(pur.id!).toArray();
                  const calcTotal = items.reduce((sum, it) => sum + ((it.purchasePrice ?? it.cost ?? 0) * it.quantity), 0);
                  const rem = Math.max(0, calcTotal - (pur.paidAmount ?? 0));
                  await db.purchases.update(pur.id!, {
                    total: calcTotal,
                    grandTotal: calcTotal,
                    remainingAmount: rem,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Corrected total to line items sum ($${calcTotal.toFixed(2)})`;
                }
                else if (issue.id.startsWith('purchase-remaining-mismatch-')) {
                  const gt = pur.grandTotal ?? pur.total ?? 0;
                  const rem = Math.max(0, gt - (pur.paidAmount ?? 0));
                  await db.purchases.update(pur.id!, {
                    remainingAmount: rem,
                    updatedAt: new Date()
                  });
                  repaired = true;
                  repairedValue = `Aligned remainingAmount to $${rem.toFixed(2)}`;
                }
              }
            }

            // EXPENSES REPAIRS
            else if (issue.category === 'Expenses') {
              const exp = await db.expenses.get(issue.recordId as number);
              if (exp) {
                if (issue.id.startsWith('exp-orphan-category-')) {
                  const firstEC = await db.expenseCategories.toCollection().first();
                  const targetEC = firstEC?.id || 1;
                  await db.expenses.update(exp.id!, { categoryId: targetEC, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Linked to default Expense Category ID ${targetEC}`;
                }
                else if (issue.id.startsWith('exp-negative-amount-')) {
                  const cleanAmt = Math.max(0, exp.amount);
                  await db.expenses.update(exp.id!, { amount: cleanAmt, updatedAt: new Date() });
                  repaired = true;
                  repairedValue = `Sanitized amount to $${cleanAmt.toFixed(2)}`;
                }
              }
            }

            // CREDIT REPAIRS
            else if (issue.category === 'Credit') {
              if (issue.id.startsWith('sale-missing-credit-account-')) {
                const sale = await db.sales.get(issue.recordId as number);
                if (sale && sale.customerId) {
                  const grandTotal = sale.grandTotal ?? sale.total ?? 0;
                  const paid = sale.paidAmount ?? 0;
                  const rem = Math.max(0, sale.remainingAmount ?? (grandTotal - paid));
                  const status = rem <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

                  const caId = await db.creditAccounts.add({
                    customerId: sale.customerId,
                    invoiceId: sale.id!,
                    invoiceNumber: sale.invoiceNumber || sale.invoiceNo || `INV-${sale.id}`,
                    invoiceDate: sale.saleDate || sale.createdAt || new Date(),
                    invoiceAmount: grandTotal,
                    paidAmount: paid,
                    remainingAmount: rem,
                    status,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    notes: sale.notes || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });

                  if (paid > 0) {
                    await db.creditPayments.add({
                      creditAccountId: caId,
                      customerId: sale.customerId,
                      invoiceId: sale.id!,
                      paymentDate: sale.saleDate || sale.createdAt || new Date(),
                      paymentMethod: sale.paymentMethod || 'Cash',
                      amount: paid,
                      referenceNumber: 'POS-DP',
                      referenceNo: 'POS-DP',
                      notes: 'Downpayment received at Point Of Sale checkout',
                      receivedBy: String(sale.createdBy || 'Cashier'),
                      createdAt: new Date(),
                    });
                  }

                  await updateCustomerBalance(sale.customerId);
                  repaired = true;
                  repairedValue = `Generated missing credit account #${caId} and downpayment log for customer ID ${sale.customerId}`;
                }
              }
              else if (issue.id.startsWith('sale-missing-downpayment-payment-')) {
                const sale = await db.sales.get(issue.recordId as number);
                if (sale && sale.customerId && (sale.paidAmount ?? 0) > 0) {
                  let ca = await db.creditAccounts.where('invoiceId').equals(sale.id!).first();
                  if (!ca) {
                    const grandTotal = sale.grandTotal ?? sale.total ?? 0;
                    const paid = sale.paidAmount ?? 0;
                    const rem = Math.max(0, sale.remainingAmount ?? (grandTotal - paid));
                    const status = rem <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

                    const caId = await db.creditAccounts.add({
                      customerId: sale.customerId,
                      invoiceId: sale.id!,
                      invoiceNumber: sale.invoiceNumber || sale.invoiceNo || `INV-${sale.id}`,
                      invoiceDate: sale.saleDate || sale.createdAt || new Date(),
                      invoiceAmount: grandTotal,
                      paidAmount: paid,
                      remainingAmount: rem,
                      status,
                      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                      notes: sale.notes || '',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    });
                    ca = await db.creditAccounts.get(caId);
                  }

                  if (ca) {
                    await db.creditPayments.add({
                      creditAccountId: ca.id!,
                      customerId: sale.customerId,
                      invoiceId: sale.id!,
                      paymentDate: sale.saleDate || sale.createdAt || new Date(),
                      paymentMethod: sale.paymentMethod || 'Cash',
                      amount: sale.paidAmount,
                      referenceNumber: 'POS-DP',
                      referenceNo: 'POS-DP',
                      notes: 'Downpayment received at Point Of Sale checkout',
                      receivedBy: String(sale.createdBy || 'Cashier'),
                      createdAt: new Date(),
                    });

                    await updateCustomerBalance(sale.customerId);
                    repaired = true;
                    repairedValue = `Added missing downpayment payment record for credit account #${ca.id}`;
                  }
                }
              }
              else if (issue.id.startsWith('credit-orphan-invoice-')) {
                // Delete orphan credit account
                await db.creditAccounts.delete(issue.recordId as number);
                await db.creditPayments.where('creditAccountId').equals(issue.recordId as number).delete();
                repaired = true;
                repairedValue = `Deleted orphan credit account and associated payments`;
              }
              else if (issue.id.startsWith('credit-balance-mismatch-')) {
                const ca = await db.creditAccounts.get(issue.recordId as number);
                if (ca) {
                  const payments = await db.creditPayments.where('creditAccountId').equals(ca.id!).toArray();
                  const paySum = payments.reduce((sum, p) => sum + p.amount, 0);
                  const rem = Math.max(0, ca.invoiceAmount - paySum);
                  const status = rem <= 0 ? 'Paid' : (paySum > 0 ? 'Partial' : 'Unpaid');

                  await db.creditAccounts.update(ca.id!, {
                    remainingAmount: rem,
                    status,
                    updatedAt: new Date()
                  });

                  if (ca.customerId) {
                    await updateCustomerBalance(ca.customerId);
                  }

                  repaired = true;
                  repairedValue = `Corrected credit remaining balance: $${rem.toFixed(2)} ("${status}")`;
                }
              }
              else if (issue.id.startsWith('payment-orphan-creditacc-')) {
                const cp = await db.creditPayments.get(issue.recordId as number);
                if (cp && cp.customerId) {
                  await db.creditPayments.delete(cp.id!);
                  await updateCustomerBalance(cp.customerId);
                } else {
                  await db.creditPayments.delete(issue.recordId as number);
                }
                repaired = true;
                repairedValue = `Deleted orphan payment record`;
              }
            }

            // INVENTORY STOCK REPAIRS
            else if (issue.category === 'Inventory') {
              if (issue.id.startsWith('inv-stock-mismatch-')) {
                const prod = await db.products.get(issue.recordId as number);
                if (prod) {
                  const pHistory = await db.stockHistory.where('productId').equals(prod.id!).toArray();
                  const historySum = pHistory.reduce((sum, sh) => sum + sh.quantity, 0);
                  const currentStockVal = prod.currentStock ?? prod.stock ?? 0;
                  const discrepancy = currentStockVal - historySum;

                  if (discrepancy !== 0) {
                    // Inject correcting Adjustment Stock History record to synchronize history with actual current stock
                    const correctionHistory: StockHistory = {
                      productId: prod.id!,
                      type: 'Adjustment',
                      quantity: discrepancy,
                      currentStock: currentStockVal,
                      referenceNo: `REC-${Date.now().toString().slice(-4)}`,
                      notes: `System-generated Stock History reconciliation correction.`,
                      createdAt: new Date(),
                    };
                    await db.stockHistory.add(correctionHistory);
                    repaired = true;
                    repairedValue = `Generated stock history adjustment record for ${discrepancy > 0 ? '+' : ''}${discrepancy} units to reconcile history with current stock (${currentStockVal} units)`;
                  }
                }
              }
            }

          } catch (itemErr: any) {
            console.error(`Failed to repair issue ${issue.id}:`, itemErr);
          }

          if (repaired) {
            repairedCount++;
            repairedIssues.push({
              ...issue,
              status: 'Repaired',
              repairedValue,
            });
            // Record in audit log
            await logAction('Repair', issue.category, `Resolved integrity issue: ${issue.description}. Resolution: ${repairedValue}`);
          } else {
            repairedIssues.push({
              ...issue,
              status: 'Pending Repair',
            });
          }
        }
      });
    } catch (err: any) {
      console.error('Failed executing batch auto-repair transaction:', err);
    }

    // Return the fresh final report indicating resolution
    const finalReport = await this.scanDatabase();
    return {
      ...finalReport,
      inconsistenciesRepaired: repairedCount,
      issues: [
        ...repairedIssues.filter(ri => ri.status === 'Repaired'),
        ...finalReport.issues
      ]
    };
  }

  /**
   * Run validation scan and automatically perform repairs. Returns the repaired report.
   * Convenient helper for transactional operations to keep things consistent.
   */
  public async runValidationAndTriggerRepair(): Promise<DataIntegrityReport> {
    console.log('[DataIntegrity] Initializing database validation scan & auto-repair...');
    const report = await this.repairDatabase();
    console.log(`[DataIntegrity] Completed database scan. Found: ${report.issues.filter(i => i.status !== 'Repaired').length} issues, Repaired: ${report.inconsistenciesRepaired}. Health Score: ${report.healthScore}%`);
    return report;
  }
}

export const dataIntegrityService = new DataIntegrityService();
export default dataIntegrityService;
