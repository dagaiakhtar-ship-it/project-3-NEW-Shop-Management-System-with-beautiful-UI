import db, { 
  type Sale, 
  type SaleItem, 
  type Purchase, 
  type PurchaseItem, 
  type Expense, 
  type Customer, 
  type Supplier, 
  type CreditAccount, 
  type CreditPayment, 
  type Product, 
  type Category, 
  type ExpenseCategory 
} from './db';
import dayjs from 'dayjs';

/**
 * Filter Interface for all Reports & Analytics
 */
export interface ReportFilters {
  dateFilter: 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'last_year' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  customerId?: number;
  supplierId?: number;
  productId?: number;
  categoryId?: number;
  paymentMethod?: string;
  saleType?: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
  expenseCategoryId?: number;
  status?: string;
}

/**
 * Resolves a date filter preset into actual Start and End Dates (inclusive boundaries).
 */
export function resolveDateRange(
  dateFilter: ReportFilters['dateFilter'],
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } {
  const now = dayjs();
  let start = now.startOf('day');
  let end = now.endOf('day');

  switch (dateFilter) {
    case 'today':
      start = now.startOf('day');
      end = now.endOf('day');
      break;
    case 'yesterday':
      start = now.subtract(1, 'day').startOf('day');
      end = now.subtract(1, 'day').endOf('day');
      break;
    case 'week':
      // local week start
      start = now.startOf('week');
      end = now.endOf('week');
      break;
    case 'last_week':
      start = now.subtract(1, 'week').startOf('week');
      end = now.subtract(1, 'week').endOf('week');
      break;
    case 'month':
      start = now.startOf('month');
      end = now.endOf('month');
      break;
    case 'last_month':
      start = now.subtract(1, 'month').startOf('month');
      end = now.subtract(1, 'month').endOf('month');
      break;
    case 'year':
      start = now.startOf('year');
      end = now.endOf('year');
      break;
    case 'last_year':
      start = now.subtract(1, 'year').startOf('year');
      end = now.subtract(1, 'year').endOf('year');
      break;
    case 'custom':
      if (customStart) {
        start = dayjs(customStart).startOf('day');
      } else {
        start = now.subtract(30, 'days').startOf('day');
      }
      if (customEnd) {
        end = dayjs(customEnd).endOf('day');
      } else {
        end = now.endOf('day');
      }
      break;
  }

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
}

/**
 * Checks if a record falls within a given date range.
 */
export function isWithinDateRange(date: Date | string | undefined, start: Date, end: Date): boolean {
  if (!date) return false;
  const d = new Date(date);
  return d >= start && d <= end;
}

/**
 * 1. Calculate Sales Report
 */
export async function calculateSalesReport(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);
  
  // Fetch from Dexie
  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const allProducts = await db.products.toArray();

  // Build product-to-category and profit lookup maps
  const productCategoryMap = new Map<number, number>();
  allProducts.forEach(p => {
    if (p.id) productCategoryMap.set(p.id, p.categoryId);
  });

  // Filter Sales
  const filteredSales = allSales.filter(sale => {
    // Exclude soft-deleted records
    if (sale.isDeleted) return false;

    // Date range filter
    const saleDate = sale.saleDate || sale.createdAt;
    if (!isWithinDateRange(saleDate, start, end)) return false;

    // Customer filter
    if (filters.customerId && sale.customerId !== filters.customerId) return false;

    // Payment method filter
    if (filters.paymentMethod && sale.paymentMethod !== filters.paymentMethod) return false;

    // Sale type filter
    if (filters.saleType && sale.saleType !== filters.saleType) return false;

    // Status filter (Paid, Partial, Unpaid)
    if (filters.status && sale.paymentStatus !== filters.status) return false;

    return true;
  });

  const saleIds = new Set(filteredSales.map(s => s.id));

  // Filter Sale Items
  const filteredSaleItems = allSaleItems.filter(item => {
    if (!saleIds.has(item.saleId)) return false;

    // Product filter
    if (filters.productId && item.productId !== filters.productId) return false;

    // Category filter
    if (filters.categoryId) {
      const catId = productCategoryMap.get(item.productId);
      if (catId !== filters.categoryId) return false;
    }

    return true;
  });

  // If product or category filter was applied, filter the sales list to only include sales that have matching items
  let finalSales = filteredSales;
  if (filters.productId || filters.categoryId) {
    const validSaleIds = new Set(filteredSaleItems.map(item => item.saleId));
    finalSales = filteredSales.filter(s => s.id && validSaleIds.has(s.id));
  }

  // Calculate Metrics
  let totalSales = 0;
  let cashSales = 0;
  let creditSales = 0;
  let partialSales = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalItemsSold = 0;
  let totalProfit = 0;

  finalSales.forEach(sale => {
    const gTotal = sale.grandTotal ?? sale.total;
    totalSales += gTotal;
    totalDiscount += sale.discount || 0;
    totalTax += sale.tax || 0;

    if (sale.saleType === 'Cash Sale') {
      cashSales += gTotal;
    } else if (sale.saleType === 'Credit Sale') {
      creditSales += gTotal;
    } else if (sale.saleType === 'Partial Payment Sale') {
      partialSales += gTotal;
    } else {
      // fallback based on paymentStatus/method
      if (sale.paymentStatus === 'Paid') {
        cashSales += gTotal;
      } else if (sale.paymentStatus === 'Unpaid') {
        creditSales += gTotal;
      } else {
        partialSales += gTotal;
      }
    }
  });

  // Calculate items sold and profit from filtered items
  filteredSaleItems.forEach(item => {
    totalItemsSold += item.quantity;
    
    // Profit Calculation: Quantity * (Selling Price - Purchase Price)
    const itemSellingPrice = item.sellingPrice ?? item.price ?? 0;
    const itemPurchasePrice = item.purchasePrice ?? 0;
    const itemDiscount = item.discount ?? 0;
    
    // Deduct direct item discount if any
    const itemRevenue = (itemSellingPrice * item.quantity) - itemDiscount;
    const itemCost = itemPurchasePrice * item.quantity;
    const itemProfit = itemRevenue - itemCost;
    
    totalProfit += itemProfit;
  });

  // Deduct proportional overall invoice discounts from profit
  const invoiceDiscountSum = finalSales.reduce((acc, s) => acc + (s.discount || 0), 0);
  // Subtract invoice level discount to get actual net profit from sales
  const actualSaleProfit = Math.max(0, totalProfit - invoiceDiscountSum);

  const averageSale = finalSales.length > 0 ? totalSales / finalSales.length : 0;

  return {
    sales: finalSales,
    items: filteredSaleItems,
    metrics: {
      totalSales,
      cashSales,
      creditSales,
      partialSales,
      invoiceCount: finalSales.length,
      itemsSold: totalItemsSold,
      discount: totalDiscount,
      tax: totalTax,
      profit: actualSaleProfit,
      averageSale,
    }
  };
}

/**
 * 2. Calculate Purchase Report
 */
export async function calculatePurchaseReport(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allPurchases = await db.purchases.toArray();
  const allPurchaseItems = await db.purchaseItems.toArray();
  const allProducts = await db.products.toArray();

  const productCategoryMap = new Map<number, number>();
  allProducts.forEach(p => {
    if (p.id) productCategoryMap.set(p.id, p.categoryId);
  });

  // Filter Purchases
  const filteredPurchases = allPurchases.filter(pur => {
    // Date filter
    const purDate = pur.purchaseDate || pur.createdAt;
    if (!isWithinDateRange(purDate, start, end)) return false;

    // Supplier filter
    if (filters.supplierId && pur.supplierId !== filters.supplierId) return false;

    // Payment method filter
    if (filters.paymentMethod && pur.paymentMethod !== filters.paymentMethod) return false;

    // Status filter
    if (filters.status && pur.paymentStatus !== filters.status) return false;

    return true;
  });

  const purchaseIds = new Set(filteredPurchases.map(p => p.id));

  // Filter Purchase Items
  const filteredPurchaseItems = allPurchaseItems.filter(item => {
    if (!purchaseIds.has(item.purchaseId)) return false;

    // Product filter
    if (filters.productId && item.productId !== filters.productId) return false;

    // Category filter
    if (filters.categoryId) {
      const catId = productCategoryMap.get(item.productId);
      if (catId !== filters.categoryId) return false;
    }

    return true;
  });

  // Filter purchase list if product or category filter was applied
  let finalPurchases = filteredPurchases;
  if (filters.productId || filters.categoryId) {
    const validPurchaseIds = new Set(filteredPurchaseItems.map(item => item.purchaseId));
    finalPurchases = filteredPurchases.filter(p => p.id && validPurchaseIds.has(p.id));
  }

  // Metrics
  let totalPurchases = 0;
  let paidAmount = 0;
  let remainingAmount = 0;

  finalPurchases.forEach(pur => {
    const grandT = pur.grandTotal ?? pur.total;
    totalPurchases += grandT;
    paidAmount += pur.paidAmount || 0;
    remainingAmount += pur.remainingAmount ?? (grandT - pur.paidAmount);
  });

  // Supplier Summary
  const supplierMap = new Map<number, { name: string; count: number; amount: number; remaining: number }>();
  const suppliers = await db.suppliers.toArray();
  const supplierLookup = new Map<number, string>();
  suppliers.forEach(s => {
    if (s.id) supplierLookup.set(s.id, s.companyName);
  });

  finalPurchases.forEach(pur => {
    if (pur.supplierId) {
      const supId = pur.supplierId;
      const supName = supplierLookup.get(supId) || `Supplier #${supId}`;
      const grandT = pur.grandTotal ?? pur.total;
      const current = supplierMap.get(supId) || { name: supName, count: 0, amount: 0, remaining: 0 };
      current.count += 1;
      current.amount += grandT;
      current.remaining += pur.remainingAmount ?? (grandT - pur.paidAmount);
      supplierMap.set(supId, current);
    }
  });

  return {
    purchases: finalPurchases,
    items: filteredPurchaseItems,
    metrics: {
      totalPurchases,
      paidAmount,
      remainingAmount,
      purchaseCount: finalPurchases.length,
    },
    suppliers: Array.from(supplierMap.values()),
  };
}

/**
 * 3. Calculate Expense Report
 */
export async function calculateExpenseReport(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allExpenses = await db.expenses.toArray();
  const allCategories = await db.expenseCategories.toArray();
  
  const categoryMap = new Map<number, { name: string; color: string }>();
  allCategories.forEach(c => {
    if (c.id) categoryMap.set(c.id, { name: c.name, color: c.color });
  });

  // Filter Expenses
  const filteredExpenses = allExpenses.filter(exp => {
    if (exp.isDeleted) return false;

    // Date filter
    if (!isWithinDateRange(exp.expenseDate || exp.createdAt, start, end)) return false;

    // Expense Category filter
    if (filters.expenseCategoryId && exp.categoryId !== filters.expenseCategoryId) return false;

    // Payment method filter
    if (filters.paymentMethod && exp.paymentMethod !== filters.paymentMethod) return false;

    // Status filter
    if (filters.status && exp.status !== filters.status) return false;

    return true;
  });

  // Calculations
  let totalExpenses = 0;
  let recurringExpensesSum = 0;

  // Category summary
  const catSummary = new Map<number, { id: number; name: string; color: string; amount: number; count: number }>();
  // Vendor summary
  const vendorSummary = new Map<string, { vendor: string; amount: number; count: number }>();

  filteredExpenses.forEach(exp => {
    const amt = exp.amount || 0;
    totalExpenses += amt;
    if (exp.isRecurring) {
      recurringExpensesSum += amt;
    }

    // Category accumulation
    const catInfo = categoryMap.get(exp.categoryId) || { name: exp.category || 'Other', color: '#64748b' };
    const catId = exp.categoryId || 999; // fallback
    const currentCat = catSummary.get(catId) || { id: catId, name: catInfo.name, color: catInfo.color, amount: 0, count: 0 };
    currentCat.amount += amt;
    currentCat.count += 1;
    catSummary.set(catId, currentCat);

    // Vendor accumulation
    const vendorName = exp.vendorName?.trim() || 'Direct Vendor / Misc';
    const currentVendor = vendorSummary.get(vendorName) || { vendor: vendorName, amount: 0, count: 0 };
    currentVendor.amount += amt;
    currentVendor.count += 1;
    vendorSummary.set(vendorName, currentVendor);
  });

  return {
    expenses: filteredExpenses,
    metrics: {
      totalExpenses,
      recurringExpenses: recurringExpensesSum,
      categoriesCount: catSummary.size,
    },
    categories: Array.from(catSummary.values()),
    vendors: Array.from(vendorSummary.values()),
  };
}

/**
 * 4. Calculate Profit & Loss Report
 */
export async function calculateProfitLoss(filters: ReportFilters) {
  const salesData = await calculateSalesReport(filters);
  const purchaseData = await calculatePurchaseReport(filters);
  const expenseData = await calculateExpenseReport(filters);

  const revenue = salesData.metrics.totalSales;
  
  // Cost of Goods Sold (COGS) is calculated based on items sold purchase price
  let cogs = 0;
  salesData.items.forEach(item => {
    cogs += (item.purchasePrice || 0) * item.quantity;
  });

  // Gross Profit = Revenue - COGS
  const grossProfit = revenue - cogs;

  const expenses = expenseData.metrics.totalExpenses;

  // Net Profit = Gross Profit - Expenses
  const netProfit = grossProfit - expenses;

  // Profit Margin = (Net Profit / Revenue) * 100
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    metrics: {
      sales: revenue,
      cogs,
      grossProfit,
      purchases: purchaseData.metrics.totalPurchases,
      expenses,
      netProfit,
      profitMargin,
    }
  };
}

/**
 * 5. Calculate Customer Report
 */
export async function calculateCustomerReport(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allCustomers = await db.customers.toArray();
  const allSales = await db.sales.toArray();

  const activeCustomerIds = new Set<number>();
  const customerSalesMap = new Map<number, { count: number; amount: number }>();

  // Exclude soft-deleted
  const activeCustomersList = allCustomers.filter(c => !c.isDeleted);

  // Parse new customers created in period
  const newCustomers = activeCustomersList.filter(c => isWithinDateRange(c.createdAt, start, end));

  // Match sales to customers in the period
  allSales.forEach(sale => {
    if (sale.isDeleted) return;
    const saleDate = sale.saleDate || sale.createdAt;
    
    if (isWithinDateRange(saleDate, start, end) && sale.customerId) {
      activeCustomerIds.add(sale.customerId);

      const current = customerSalesMap.get(sale.customerId) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += sale.grandTotal ?? sale.total;
      customerSalesMap.set(sale.customerId, current);
    }
  });

  // Calculate Outstanding Balance
  let totalOutstanding = 0;
  activeCustomersList.forEach(c => {
    totalOutstanding += c.balance || c.currentBalance || 0;
  });

  // Join data to get Top Customers list
  const topCustomers = activeCustomersList.map(c => {
    const saleStats = customerSalesMap.get(c.id!) || { count: 0, amount: 0 };
    return {
      id: c.id,
      fullName: c.fullName || c.name,
      phone: c.phone,
      type: c.customerType,
      salesCount: saleStats.count,
      totalSales: saleStats.amount,
      balance: c.balance || c.currentBalance || 0,
    };
  })
  .filter(tc => tc.salesCount > 0 || tc.balance > 0)
  .sort((a, b) => b.totalSales - a.totalSales);

  return {
    metrics: {
      totalCustomers: activeCustomersList.length,
      newCustomers: newCustomers.length,
      activeCustomers: activeCustomerIds.size,
      outstandingBalance: totalOutstanding,
    },
    topCustomers,
  };
}

/**
 * 6. Calculate Supplier Report
 */
export async function calculateSupplierReport(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allSuppliers = await db.suppliers.toArray();
  const allPurchases = await db.purchases.toArray();

  const activeSupplierIds = new Set<number>();
  const supplierPurchaseMap = new Map<number, { count: number; amount: number; remaining: number }>();

  // Filter suppliers in standard active status
  const activeSuppliers = allSuppliers.filter(s => s.status !== 'Archived');

  allPurchases.forEach(pur => {
    const purDate = pur.purchaseDate || pur.createdAt;
    if (isWithinDateRange(purDate, start, end) && pur.supplierId) {
      activeSupplierIds.add(pur.supplierId);

      const current = supplierPurchaseMap.get(pur.supplierId) || { count: 0, amount: 0, remaining: 0 };
      current.count += 1;
      const grandT = pur.grandTotal ?? pur.total;
      current.amount += grandT;
      current.remaining += pur.remainingAmount ?? (grandT - pur.paidAmount);
      supplierPurchaseMap.set(pur.supplierId, current);
    }
  });

  let totalOutstanding = 0;
  activeSuppliers.forEach(s => {
    totalOutstanding += s.currentBalance || s.openingBalance || 0;
  });

  const topSuppliers = activeSuppliers.map(s => {
    const purchaseStats = supplierPurchaseMap.get(s.id!) || { count: 0, amount: 0, remaining: 0 };
    return {
      id: s.id,
      companyName: s.companyName,
      contactPerson: s.contactPerson || '-',
      phone: s.phone,
      purchaseCount: purchaseStats.count,
      totalPurchased: purchaseStats.amount,
      balance: s.currentBalance || s.openingBalance || 0,
    };
  })
  .filter(ts => ts.purchaseCount > 0 || ts.balance > 0)
  .sort((a, b) => b.totalPurchased - a.totalPurchased);

  return {
    metrics: {
      totalSuppliers: activeSuppliers.length,
      activeSuppliers: activeSupplierIds.size,
      outstandingBalance: totalOutstanding,
    },
    topSuppliers,
  };
}

/**
 * 7. Calculate Customer Credit Report
 */
export async function calculateCreditReport(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allCreditAccounts = await db.creditAccounts.toArray();
  const allCreditPayments = await db.creditPayments.toArray();
  const allCustomers = await db.customers.toArray();

  const customerLookup = new Map<number, { name: string; phone: string }>();
  allCustomers.forEach(c => {
    if (c.id) customerLookup.set(c.id, { name: c.fullName || c.name, phone: c.phone });
  });

  // Calculate Outstanding Credit
  let totalOutstanding = 0;
  let overdueCredit = 0;

  const overdueAccountsList: any[] = [];

  allCreditAccounts.forEach(acc => {
    // Exclude cancelled accounts
    if (acc.status === 'Cancelled') return;

    const balance = acc.remainingAmount ?? 0;
    totalOutstanding += balance;

    // Check overdue
    const isOverdue = acc.status === 'Overdue' || (acc.dueDate && new Date(acc.dueDate) < new Date() && acc.status !== 'Paid');
    if (isOverdue && balance > 0) {
      overdueCredit += balance;
      const cust = customerLookup.get(acc.customerId) || { name: `Customer #${acc.customerId}`, phone: '-' };
      overdueAccountsList.push({
        id: acc.id,
        customerName: cust.name,
        phone: cust.phone,
        invoiceNumber: acc.invoiceNumber || '-',
        invoiceDate: acc.invoiceDate || acc.createdAt,
        dueDate: acc.dueDate,
        amount: acc.invoiceAmount,
        balance,
      });
    }
  });

  // Filter Credit Payments in selected range
  const filteredPayments = allCreditPayments.filter(payment => {
    return isWithinDateRange(payment.paymentDate, start, end);
  });

  const recoveredCredit = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  // Customer Ledger Summary (summarize outstanding credit and payment by customer)
  const ledgerMap = new Map<number, { name: string; phone: string; initialCredit: number; paid: number; remaining: number }>();

  // Process all credit accounts
  allCreditAccounts.forEach(acc => {
    if (acc.status === 'Cancelled') return;
    const custId = acc.customerId;
    const cust = customerLookup.get(custId) || { name: `Customer #${custId}`, phone: '-' };
    const current = ledgerMap.get(custId) || { name: cust.name, phone: cust.phone, initialCredit: 0, paid: 0, remaining: 0 };
    
    current.initialCredit += acc.invoiceAmount || 0;
    current.paid += acc.paidAmount || 0;
    current.remaining += acc.remainingAmount ?? 0;
    ledgerMap.set(custId, current);
  });

  // Overlay actual payments received in current range
  const rangePaymentsMap = new Map<number, number>();
  filteredPayments.forEach(p => {
    const current = rangePaymentsMap.get(p.customerId) || 0;
    rangePaymentsMap.set(p.customerId, current + p.amount);
  });

  const ledgerSummary = Array.from(ledgerMap.entries()).map(([id, stats]) => {
    return {
      customerId: id,
      ...stats,
      recoveredInRange: rangePaymentsMap.get(id) || 0,
    };
  }).filter(l => l.initialCredit > 0 || l.recoveredInRange > 0);

  return {
    metrics: {
      outstandingCredit: totalOutstanding,
      recoveredCredit,
      overdueAccounts: overdueAccountsList.length,
      overdueCredit,
    },
    overdueAccounts: overdueAccountsList,
    ledgerSummary,
  };
}

/**
 * 8. Calculate Stock & Inventory Report
 */
export async function calculateStockReport() {
  const allProducts = await db.products.toArray();
  const allCategories = await db.categories.toArray();
  const allStockHistory = await db.stockHistory.toArray();

  const categoryLookup = new Map<number, string>();
  allCategories.forEach(c => {
    if (c.id) categoryLookup.set(c.id, c.name);
  });

  let totalItemsCount = allProducts.length;
  let totalStockQty = 0;
  let stockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const lowStockProductsList: any[] = [];

  allProducts.forEach(p => {
    if (p.status === 'Archived') return;

    const qty = p.stock ?? p.currentStock ?? 0;
    const threshold = p.alertQuantity ?? p.minimumStock ?? 10;
    const costPrice = p.purchasePrice ?? p.cost ?? 0;

    totalStockQty += qty;
    stockValue += qty * costPrice;

    if (qty === 0) {
      outOfStockCount += 1;
      lowStockProductsList.push({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: categoryLookup.get(p.categoryId) || 'General',
        stock: qty,
        minStock: threshold,
        status: 'Out of Stock'
      });
    } else if (qty <= threshold) {
      lowStockCount += 1;
      lowStockProductsList.push({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: categoryLookup.get(p.categoryId) || 'General',
        stock: qty,
        minStock: threshold,
        status: 'Low Stock'
      });
    }
  });

  // Summarize Stock Movement (last 30 days)
  const last30Days = dayjs().subtract(30, 'days').toDate();
  const recentMovement = allStockHistory.filter(h => new Date(h.createdAt) >= last30Days);

  let purchasedQty = 0;
  let soldQty = 0;
  let adjustedQty = 0;

  recentMovement.forEach(h => {
    if (h.type === 'Purchase') {
      purchasedQty += h.quantity;
    } else if (h.type === 'Sale') {
      soldQty += Math.abs(h.quantity);
    } else if (h.type === 'Adjustment') {
      adjustedQty += h.quantity;
    }
  });

  // Group Stock Value by Category
  const categoryValueMap = new Map<string, { count: number; qty: number; value: number }>();
  allProducts.forEach(p => {
    if (p.status === 'Archived') return;
    const catName = categoryLookup.get(p.categoryId) || 'General';
    const qty = p.stock ?? p.currentStock ?? 0;
    const cost = p.purchasePrice ?? p.cost ?? 0;

    const current = categoryValueMap.get(catName) || { count: 0, qty: 0, value: 0 };
    current.count += 1;
    current.qty += qty;
    current.value += qty * cost;
    categoryValueMap.set(catName, current);
  });

  const categoryStockSummary = Array.from(categoryValueMap.entries()).map(([category, stats]) => ({
    category,
    ...stats,
  }));

  return {
    metrics: {
      totalProducts: totalItemsCount,
      totalStockQuantity: totalStockQty,
      stockValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    },
    lowStockList: lowStockProductsList,
    movement30Days: {
      purchased: purchasedQty,
      sold: soldQty,
      adjusted: adjustedQty,
    },
    categoryDistribution: categoryStockSummary,
  };
}

/**
 * 9. Top Products Analytics
 */
export async function calculateTopProducts(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const allProducts = await db.products.toArray();

  const productMap = new Map<number, { name: string; sku: string; stock: number; price: number }>();
  allProducts.forEach(p => {
    if (p.id) {
      productMap.set(p.id, {
        name: p.name,
        sku: p.sku,
        stock: p.stock ?? p.currentStock ?? 0,
        price: p.sellingPrice ?? p.price ?? 0,
      });
    }
  });

  // Filter Sales
  const filteredSales = allSales.filter(sale => {
    if (sale.isDeleted) return false;
    return isWithinDateRange(sale.saleDate || sale.createdAt, start, end);
  });

  const saleIds = new Set(filteredSales.map(s => s.id));

  // Accumulate sales by product
  const productSales = new Map<number, { id: number; name: string; sku: string; quantity: number; revenue: number; cost: number; profit: number }>();

  allSaleItems.forEach(item => {
    if (!saleIds.has(item.saleId)) return;

    const prodId = item.productId;
    const pInfo = productMap.get(prodId) || { name: item.productName || `Product #${prodId}`, sku: '-', stock: 0, price: 0 };
    
    const qty = item.quantity;
    const sellingPrice = item.sellingPrice ?? item.price ?? 0;
    const purchasePrice = item.purchasePrice ?? 0;
    const discount = item.discount ?? 0;

    const itemRevenue = (sellingPrice * qty) - discount;
    const itemCost = purchasePrice * qty;
    const itemProfit = itemRevenue - itemCost;

    const current = productSales.get(prodId) || {
      id: prodId,
      name: pInfo.name,
      sku: pInfo.sku,
      quantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };

    current.quantity += qty;
    current.revenue += itemRevenue;
    current.cost += itemCost;
    current.profit += itemProfit;

    productSales.set(prodId, current);
  });

  const productStatsList = Array.from(productSales.values());

  // Top Selling Products (by quantity)
  const topSelling = [...productStatsList].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Highest Profit Products (by absolute profit)
  const topProfitable = [...productStatsList].sort((a, b) => b.profit - a.profit).slice(0, 10);

  // Slow Moving Products (lowest quantity sold, but must have been sold at least once or are in stock but not sold)
  // Let's find products that are active but not sold, or have very low sales
  const soldProductIds = new Set(productStatsList.map(p => p.id));
  const unsoldProducts = allProducts
    .filter(p => p.status !== 'Archived' && !soldProductIds.has(p.id!))
    .map(p => ({
      id: p.id!,
      name: p.name,
      sku: p.sku,
      quantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    }));

  const slowMoving = [...productStatsList, ...unsoldProducts]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  return {
    topSelling,
    topProfitable,
    slowMoving,
  };
}

/**
 * 10. Cash Flow & Trends over Time (Analytics)
 */
export async function calculateTrendsAndFlows(filters: ReportFilters) {
  const { start, end } = resolveDateRange(filters.dateFilter, filters.startDate, filters.endDate);

  const allSales = await db.sales.toArray();
  const allPurchases = await db.purchases.toArray();
  const allExpenses = await db.expenses.toArray();
  const allCreditPayments = await db.creditPayments.toArray();

  // Filter inputs
  const salesInRange = allSales.filter(s => !s.isDeleted && isWithinDateRange(s.saleDate || s.createdAt, start, end));
  const purchasesInRange = allPurchases.filter(p => isWithinDateRange(p.purchaseDate || p.createdAt, start, end));
  const expensesInRange = allExpenses.filter(e => !e.isDeleted && isWithinDateRange(e.expenseDate || e.createdAt, start, end));
  const creditPaymentsInRange = allCreditPayments.filter(p => isWithinDateRange(p.paymentDate, start, end));

  // Group by Date for Trends
  const dailyStatsMap = new Map<string, { date: string; sales: number; purchases: number; expenses: number; creditRecoveries: number; netProfit: number }>();

  // Determine date grouping formatting (Daily vs Monthly)
  const dayDiff = dayjs(end).diff(dayjs(start), 'day');
  let formatString = 'YYYY-MM-DD';
  if (dayDiff > 60) {
    formatString = 'YYYY-MM'; // Group by month if range is long
  }

  // Helper to touch map
  const getDailyStat = (dateStr: string) => {
    const existing = dailyStatsMap.get(dateStr);
    if (existing) return existing;
    const fresh = { date: dateStr, sales: 0, purchases: 0, expenses: 0, creditRecoveries: 0, netProfit: 0 };
    dailyStatsMap.set(dateStr, fresh);
    return fresh;
  };

  salesInRange.forEach(s => {
    const dateStr = dayjs(s.saleDate || s.createdAt).format(formatString);
    const stat = getDailyStat(dateStr);
    stat.sales += s.grandTotal ?? s.total;
  });

  purchasesInRange.forEach(p => {
    const dateStr = dayjs(p.purchaseDate || p.createdAt).format(formatString);
    const stat = getDailyStat(dateStr);
    stat.purchases += p.grandTotal ?? p.total;
  });

  expensesInRange.forEach(e => {
    const dateStr = dayjs(e.expenseDate || e.createdAt).format(formatString);
    const stat = getDailyStat(dateStr);
    stat.expenses += e.amount;
  });

  creditPaymentsInRange.forEach(p => {
    const dateStr = dayjs(p.paymentDate).format(formatString);
    const stat = getDailyStat(dateStr);
    stat.creditRecoveries += p.amount;
  });

  // Compute profit for each day
  dailyStatsMap.forEach(stat => {
    stat.netProfit = stat.sales - stat.purchases - stat.expenses;
  });

  // Sort trend points by date ascending
  const trendPoints = Array.from(dailyStatsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Cash Flow Calculations:
  // Cash Sales + Credit Recoveries - Purchases Paid - Expenses Paid
  let immediateCashFromSales = 0;
  salesInRange.forEach(s => {
    immediateCashFromSales += s.paidAmount || 0;
  });

  let totalCreditRecoveries = creditPaymentsInRange.reduce((acc, p) => acc + p.amount, 0);

  let totalPurchasesPaid = purchasesInRange.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  // Expenses are cash outflow if Status is Paid
  let totalExpensesPaid = expensesInRange.filter(e => e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0);

  const cashInflow = immediateCashFromSales + totalCreditRecoveries;
  const cashOutflow = totalPurchasesPaid + totalExpensesPaid;
  const netCashFlow = cashInflow - cashOutflow;

  // Payment Method Breakdown
  const paymentMethodsMap = new Map<string, { method: string; count: number; salesAmount: number; purchaseAmount: number }>();
  
  const getPaymentMethodStat = (method: string) => {
    const name = method || 'Other';
    const existing = paymentMethodsMap.get(name);
    if (existing) return existing;
    const fresh = { method: name, count: 0, salesAmount: 0, purchaseAmount: 0 };
    paymentMethodsMap.set(name, fresh);
    return fresh;
  };

  salesInRange.forEach(s => {
    const stat = getPaymentMethodStat(s.paymentMethod);
    stat.count += 1;
    stat.salesAmount += s.grandTotal ?? s.total;
  });

  purchasesInRange.forEach(p => {
    const stat = getPaymentMethodStat(p.paymentMethod);
    stat.count += 1;
    stat.purchaseAmount += p.grandTotal ?? p.total;
  });

  return {
    trends: trendPoints,
    cashFlow: {
      cashSales: immediateCashFromSales,
      creditRecoveries: totalCreditRecoveries,
      purchasesPaid: totalPurchasesPaid,
      expensesPaid: totalExpensesPaid,
      totalInflow: cashInflow,
      totalOutflow: cashOutflow,
      netCashFlow,
    },
    paymentMethods: Array.from(paymentMethodsMap.values()),
  };
}
