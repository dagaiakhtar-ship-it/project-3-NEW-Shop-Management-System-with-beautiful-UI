import { type Product, type Category, type Customer, type Supplier, type Sale, type SaleItem, type Purchase, type Expense, type CreditPayment, type ExpenseCategory } from '../database/db';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SlicerFilters {
  paymentMethod: string;
  categoryId: string; // 'All' or string id
  customerId: string; // 'All' or string id
  supplierId: string; // 'All' or string id
}

export interface KpiCardData {
  title: string;
  value: string;
  numericValue: number;
  change: number; // percentage change vs previous period
  changeLabel: string;
}

export interface BiDashboardData {
  // Slicer metadata lists
  paymentMethods: string[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];

  // 15 top KPI cards
  kpis: {
    todaySales: KpiCardData;
    todayProfit: KpiCardData;
    todayPurchases: KpiCardData;
    todayExpenses: KpiCardData;
    cashInHand: KpiCardData;
    outstandingCredit: KpiCardData;
    creditRecovered: KpiCardData;
    netProfit: KpiCardData;
    inventoryValue: KpiCardData;
    totalCustomers: KpiCardData;
    totalSuppliers: KpiCardData;
    productsInStock: KpiCardData;
    lowStockProducts: KpiCardData;
    outOfStockProducts: KpiCardData;
    todayInvoices: KpiCardData;
  };

  // 13 chart datasets
  charts: {
    dailySalesTrend: any[];
    weeklySales: any[];
    monthlySales: any[];
    yearlySales: any[];
    salesVsPurchases: any[];
    profitTrend: any[];
    expenseTrend: any[];
    cashFlow: any[];
    creditRecoveryTrend: any[];
    purchaseTrend: any[];
    topCategories: any[];
    topBrands: any[];
    paymentMethodDistribution: any[];
  };

  // 8 small business insights
  insights: {
    highestSellingProduct: string;
    highestProfitProduct: string;
    highestExpenseCategory: string;
    averageSaleValue: string;
    averageDailyProfit: string;
    bestSalesDay: string;
    bestCustomer: string;
    mostUsedPaymentMethod: string;
  };

  // Advanced Deep Dives
  inventoryAnalytics: {
    inventoryValue: number;
    fastMoving: any[];
    slowMoving: any[];
    deadStock: any[];
    lowStock: any[];
    outOfStock: any[];
    stockMovement: any[];
  };

  customerAnalytics: {
    topCustomers: any[];
    newCustomersCount: number;
    repeatCustomersCount: number;
    outstandingCustomers: any[];
    recentPayments: any[];
  };

  supplierAnalytics: {
    topSuppliers: any[];
    recentPurchases: any[];
    outstandingSuppliers: any[];
  };

  // Filtered lists for the universal ledger tables
  salesLedger: any[];
  purchasesLedger: any[];
  expensesLedger: any[];
  creditPaymentsLedger: any[];
}

/**
 * Computes date boundaries based on preset filters
 */
export function getDateBoundaries(preset: string, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  // Reset times
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
      break;
    case 'week': // Last 7 Days
      start.setDate(now.getDate() - 6);
      break;
    case 'month': // This Month
      start.setDate(1);
      break;
    case 'last_month': // Last Month
      start.setMonth(now.getMonth() - 1, 1);
      end.setMonth(now.getMonth(), 0); // last day of previous month
      break;
    case 'year': // This Year
      start.setMonth(0, 1);
      break;
    case 'custom':
      if (customStart) {
        const parts = customStart.split('-');
        const cs = parts.length === 3 
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          : new Date(customStart);
        cs.setHours(0, 0, 0, 0);
        start.setTime(cs.getTime());
      }
      if (customEnd) {
        const parts = customEnd.split('-');
        const ce = parts.length === 3 
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          : new Date(customEnd);
        ce.setHours(23, 59, 59, 999);
        end.setTime(ce.getTime());
      }
      break;
    default: // fallback to month
      start.setDate(now.getDate() - 29);
      break;
  }

  return { start, end };
}

/**
 * Gets previous period date range for trend comparisons
 */
export function getPreviousPeriodRange(start: Date, end: Date): DateRange {
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(start.getTime() - duration - 1);
  return { start: prevStart, end: prevEnd };
}

/**
 * Dynamic business intelligence calculations
 */
export function calculateBiDashboard({
  allProducts,
  allCategories,
  allCustomers,
  allSuppliers,
  allSales,
  allSaleItems,
  allPurchases,
  allExpenses,
  allCreditPayments,
  allExpenseCategories,
  filterPreset,
  customStartDate,
  customEndDate,
  slicers
}: {
  allProducts: Product[];
  allCategories: Category[];
  allCustomers: Customer[];
  allSuppliers: Supplier[];
  allSales: Sale[];
  allSaleItems: SaleItem[];
  allPurchases: Purchase[];
  allExpenses: Expense[];
  allCreditPayments: CreditPayment[];
  allExpenseCategories: ExpenseCategory[];
  filterPreset: string;
  customStartDate?: string;
  customEndDate?: string;
  slicers: SlicerFilters;
}): BiDashboardData {
  
  // 1. Determine Date Ranges (Current vs Previous)
  const currentRange = getDateBoundaries(filterPreset, customStartDate, customEndDate);
  const previousRange = getPreviousPeriodRange(currentRange.start, currentRange.end);

  // Helper lists for name mappings
  const productMap = new Map<number, Product>();
  allProducts.forEach(p => { if (p.id) productMap.set(p.id, p); });

  const categoryMap = new Map<number, string>();
  allCategories.forEach(c => { if (c.id) categoryMap.set(c.id, c.name); });

  const customerMap = new Map<number, Customer>();
  allCustomers.forEach(c => { if (c.id) customerMap.set(c.id, c); });

  const supplierMap = new Map<number, Supplier>();
  allSuppliers.forEach(s => { if (s.id) supplierMap.set(s.id, s); });

  const expenseCategoryMap = new Map<number, string>();
  allExpenseCategories.forEach(ec => { if (ec.id) expenseCategoryMap.set(ec.id, ec.name); });

  // 2. Extract Dynamic Slicer Filters lists
  const paymentMethods = Array.from(new Set([
    ...allSales.map(s => s.paymentMethod),
    ...allPurchases.map(p => p.paymentMethod),
    ...allExpenses.map(e => e.paymentMethod),
    ...allCreditPayments.map(cp => cp.paymentMethod)
  ])).filter(Boolean);

  // 3. Helper function to check if record falls within date range
  const inRange = (date: Date | string, range: DateRange) => {
    const d = new Date(date);
    return d >= range.start && d <= range.end;
  };

  // Helper to apply Slicer filters to core arrays
  const applySlicersToSales = (salesList: Sale[]) => {
    return salesList.filter(s => {
      // Status Completed
      if (s.status !== 'Completed' && s.paymentStatus !== 'Paid' && s.paymentStatus !== 'Partial') return false;
      // Payment Method
      if (slicers.paymentMethod !== 'All' && s.paymentMethod !== slicers.paymentMethod) return false;
      // Customer
      if (slicers.customerId !== 'All' && String(s.customerId) !== slicers.customerId) return false;
      
      // Category (if category selected, must contain a product in that category)
      if (slicers.categoryId !== 'All') {
        const catId = Number(slicers.categoryId);
        const saleItems = allSaleItems.filter(si => si.saleId === s.id);
        const hasProductInCat = saleItems.some(si => {
          const prod = productMap.get(si.productId);
          return prod?.categoryId === catId;
        });
        if (!hasProductInCat) return false;
      }
      // Supplier (if supplier selected, must contain product from that supplier)
      if (slicers.supplierId !== 'All') {
        const supId = Number(slicers.supplierId);
        const saleItems = allSaleItems.filter(si => si.saleId === s.id);
        const hasProductFromSup = saleItems.some(si => {
          const prod = productMap.get(si.productId);
          return prod?.supplierId === supId;
        });
        if (!hasProductFromSup) return false;
      }
      return true;
    });
  };

  const applySlicersToPurchases = (purchasesList: Purchase[]) => {
    return purchasesList.filter(p => {
      // Status Received
      if (p.status !== 'Received' && p.status !== 'Completed') return false;
      // Payment Method
      if (slicers.paymentMethod !== 'All' && p.paymentMethod !== slicers.paymentMethod) return false;
      // Supplier
      if (slicers.supplierId !== 'All' && String(p.supplierId) !== slicers.supplierId) return false;
      return true;
    });
  };

  const applySlicersToExpenses = (expensesList: Expense[]) => {
    return expensesList.filter(e => {
      if (e.isDeleted) return false;
      if (slicers.paymentMethod !== 'All' && e.paymentMethod !== slicers.paymentMethod) return false;
      // Category
      if (slicers.categoryId !== 'All' && String(e.categoryId) !== slicers.categoryId) return false;
      return true;
    });
  };

  const applySlicersToCreditPayments = (paymentsList: CreditPayment[]) => {
    return paymentsList.filter(cp => {
      if (slicers.paymentMethod !== 'All' && cp.paymentMethod !== slicers.paymentMethod) return false;
      if (slicers.customerId !== 'All' && String(cp.customerId) !== slicers.customerId) return false;
      return true;
    });
  };

  // Filter core records for CURRENT period
  const rawCurrentSales = allSales.filter(s => inRange(s.createdAt || s.saleDate || new Date(), currentRange));
  const rawCurrentPurchases = allPurchases.filter(p => inRange(p.createdAt || p.purchaseDate || new Date(), currentRange));
  const rawCurrentExpenses = allExpenses.filter(e => inRange(e.expenseDate, currentRange));
  const rawCurrentCreditPayments = allCreditPayments.filter(cp => inRange(cp.createdAt || cp.paymentDate || new Date(), currentRange));

  const currentSales = applySlicersToSales(rawCurrentSales);
  const currentPurchases = applySlicersToPurchases(rawCurrentPurchases);
  const currentExpenses = applySlicersToExpenses(rawCurrentExpenses);
  const currentCreditPayments = applySlicersToCreditPayments(rawCurrentCreditPayments);

  // Filter core records for PREVIOUS period
  const rawPreviousSales = allSales.filter(s => inRange(s.createdAt || s.saleDate || new Date(), previousRange));
  const rawPreviousPurchases = allPurchases.filter(p => inRange(p.createdAt || p.purchaseDate || new Date(), previousRange));
  const rawPreviousExpenses = allExpenses.filter(e => inRange(e.expenseDate, previousRange));
  const rawPreviousCreditPayments = allCreditPayments.filter(cp => inRange(cp.createdAt || cp.paymentDate || new Date(), previousRange));

  const previousSales = applySlicersToSales(rawPreviousSales);
  const previousPurchases = applySlicersToPurchases(rawPreviousPurchases);
  const previousExpenses = applySlicersToExpenses(rawPreviousExpenses);
  const previousCreditPayments = applySlicersToCreditPayments(rawPreviousCreditPayments);

  // Profit calculation helper
  const calculateSalesProfit = (salesList: Sale[]) => {
    let profitTotal = 0;
    salesList.forEach(sale => {
      const saleItems = allSaleItems.filter(si => si.saleId === sale.id);
      let cogs = 0;
      saleItems.forEach(item => {
        const prod = productMap.get(item.productId);
        const cost = prod?.cost ?? prod?.purchasePrice ?? item.purchasePrice ?? 0;
        cogs += cost * item.quantity;
      });
      profitTotal += (sale.total ?? sale.grandTotal ?? 0) - cogs;
    });
    return profitTotal;
  };

  // Current Metrics
  const curSalesVal = currentSales.reduce((acc, s) => acc + (s.total ?? s.grandTotal ?? 0), 0);
  const curProfitVal = calculateSalesProfit(currentSales);
  const curPurchasesVal = currentPurchases.reduce((acc, p) => acc + (p.total ?? p.grandTotal ?? 0), 0);
  const curExpensesVal = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
  const curCreditRecoveredVal = currentCreditPayments.reduce((acc, cp) => acc + cp.amount, 0);

  // Previous Metrics
  const prevSalesVal = previousSales.reduce((acc, s) => acc + (s.total ?? s.grandTotal ?? 0), 0);
  const prevProfitVal = calculateSalesProfit(previousSales);
  const prevPurchasesVal = previousPurchases.reduce((acc, p) => acc + (p.total ?? p.grandTotal ?? 0), 0);
  const prevExpensesVal = previousExpenses.reduce((acc, e) => acc + e.amount, 0);
  const prevCreditRecoveredVal = previousCreditPayments.reduce((acc, cp) => acc + cp.amount, 0);

  // Helper for percentage change
  const getPctChange = (cur: number, prev: number) => {
    if (prev <= 0) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };

  // Cumulative constants (always current, not bound by range, except for filters)
  const filteredProducts = allProducts.filter(p => {
    if (p.status === 'Archived') return false;
    if (slicers.categoryId !== 'All' && String(p.categoryId) !== slicers.categoryId) return false;
    if (slicers.supplierId !== 'All' && String(p.supplierId) !== slicers.supplierId) return false;
    return true;
  });

  const filteredCustomers = allCustomers.filter(c => {
    if (c.isDeleted) return false;
    if (slicers.customerId !== 'All' && String(c.id) !== slicers.customerId) return false;
    return true;
  });

  const filteredSuppliers = allSuppliers.filter(s => {
    if (slicers.supplierId !== 'All' && String(s.id) !== slicers.supplierId) return false;
    return true;
  });

  const totalOutstandingCreditVal = filteredCustomers.reduce((acc, c) => acc + (c.currentBalance ?? c.balance ?? 0), 0);

  const inventoryValueVal = filteredProducts.reduce((acc, p) => {
    const stock = p.stock ?? p.currentStock ?? 0;
    const cost = p.cost ?? p.purchasePrice ?? 0;
    return acc + (stock * cost);
  }, 0);

  const lowStockProductsCount = filteredProducts.filter(p => {
    const stock = p.stock ?? p.currentStock ?? 0;
    const alertQty = p.alertQuantity ?? p.minimumStock ?? 5;
    return stock <= alertQty && stock > 0;
  }).length;

  const outOfStockProductsCount = filteredProducts.filter(p => (p.stock ?? p.currentStock ?? 0) <= 0).length;

  // Formatting helpers
  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Today-only invoices and parameters
  const todayInvoicesCount = currentSales.length;

  // Net Profit: Net Profit = Revenue (Gross Sales) - COGS - Expenses.
  // Actually, gross margin profit is calculated above (curProfitVal = sales - cogs).
  // Net Profit is curProfitVal - curExpensesVal.
  const curNetProfitVal = curProfitVal - curExpensesVal;
  const prevNetProfitVal = prevProfitVal - prevExpensesVal;

  // Cash in Hand: Cash Sales + Recovered Credit - Paid Purchases - Expenses
  const currentCashSalesVal = currentSales
    .filter(s => s.paymentMethod === 'Cash')
    .reduce((acc, s) => acc + s.paidAmount, 0);
  const cashInHandVal = currentCashSalesVal + curCreditRecoveredVal;
  const prevCashSalesVal = previousSales
    .filter(s => s.paymentMethod === 'Cash')
    .reduce((acc, s) => acc + s.paidAmount, 0);
  const prevCashInHandVal = prevCashSalesVal + prevCreditRecoveredVal;

  // Dynamic titles and labels mapping helper based on date preset
  const getDynamicTitle = (base: string) => {
    switch (filterPreset) {
      case 'today':
        return `Today's ${base}`;
      case 'yesterday':
        return `Yesterday's ${base}`;
      case 'week':
        return `Weekly ${base}`;
      case 'month':
        return `Monthly ${base}`;
      case 'last_month':
        return `Last Month's ${base}`;
      case 'year':
        return `Yearly ${base}`;
      case 'custom':
        return `Period ${base}`;
      default:
        return `Today's ${base}`;
    }
  };

  let changeLabelPreset = "";
  if (filterPreset === 'today') {
    changeLabelPreset = "vs previous yesterday";
  } else if (filterPreset === 'yesterday') {
    changeLabelPreset = "vs previous day";
  } else if (filterPreset === 'week') {
    changeLabelPreset = "vs previous week";
  } else if (filterPreset === 'month' || filterPreset === 'last_month') {
    changeLabelPreset = "vs previous month";
  } else if (filterPreset === 'year') {
    changeLabelPreset = "vs previous year";
  } else {
    changeLabelPreset = "vs previous period";
  }

  let invoiceLabel = "Completed today";
  if (filterPreset === 'yesterday') invoiceLabel = "Completed yesterday";
  else if (filterPreset === 'week') invoiceLabel = "Completed in last 7 days";
  else if (filterPreset === 'month') invoiceLabel = "Completed this month";
  else if (filterPreset === 'last_month') invoiceLabel = "Completed last month";
  else if (filterPreset === 'year') invoiceLabel = "Completed this year";
  else if (filterPreset === 'custom') invoiceLabel = "Completed in custom period";

  // 15 TOP KPI CARDS OBJECT
  const kpis = {
    todaySales: {
      title: getDynamicTitle("Sales"),
      value: fmt(curSalesVal),
      numericValue: curSalesVal,
      change: getPctChange(curSalesVal, prevSalesVal),
      changeLabel: changeLabelPreset
    },
    todayProfit: {
      title: getDynamicTitle("Profit"),
      value: fmt(curProfitVal),
      numericValue: curProfitVal,
      change: getPctChange(curProfitVal, prevProfitVal),
      changeLabel: changeLabelPreset
    },
    todayPurchases: {
      title: getDynamicTitle("Purchases"),
      value: fmt(curPurchasesVal),
      numericValue: curPurchasesVal,
      change: getPctChange(curPurchasesVal, prevPurchasesVal),
      changeLabel: changeLabelPreset
    },
    todayExpenses: {
      title: getDynamicTitle("Expenses"),
      value: fmt(curExpensesVal),
      numericValue: curExpensesVal,
      change: getPctChange(curExpensesVal, prevExpensesVal),
      changeLabel: changeLabelPreset
    },
    cashInHand: {
      title: "Cash in Hand",
      value: fmt(cashInHandVal),
      numericValue: cashInHandVal,
      change: getPctChange(cashInHandVal, prevCashInHandVal),
      changeLabel: changeLabelPreset
    },
    outstandingCredit: {
      title: "Outstanding Credit",
      value: fmt(totalOutstandingCreditVal),
      numericValue: totalOutstandingCreditVal,
      change: 0, // static cumulative
      changeLabel: "Store outstanding accounts"
    },
    creditRecovered: {
      title: "Credit Recovered",
      value: fmt(curCreditRecoveredVal),
      numericValue: curCreditRecoveredVal,
      change: getPctChange(curCreditRecoveredVal, prevCreditRecoveredVal),
      changeLabel: changeLabelPreset
    },
    netProfit: {
      title: "Net Profit",
      value: fmt(curNetProfitVal),
      numericValue: curNetProfitVal,
      change: getPctChange(curNetProfitVal, prevNetProfitVal),
      changeLabel: changeLabelPreset
    },
    inventoryValue: {
      title: "Inventory Value",
      value: fmt(inventoryValueVal),
      numericValue: inventoryValueVal,
      change: 0,
      changeLabel: "Assets in register shelves"
    },
    totalCustomers: {
      title: "Total Customers",
      value: String(filteredCustomers.length),
      numericValue: filteredCustomers.length,
      change: 0,
      changeLabel: "Registered buyers count"
    },
    totalSuppliers: {
      title: "Total Suppliers",
      value: String(filteredSuppliers.length),
      numericValue: filteredSuppliers.length,
      change: 0,
      changeLabel: "Registered suppliers count"
    },
    productsInStock: {
      title: "Products in Stock",
      value: `${filteredProducts.reduce((sum, p) => sum + (p.stock ?? p.currentStock ?? 0), 0)} units`,
      numericValue: filteredProducts.reduce((sum, p) => sum + (p.stock ?? p.currentStock ?? 0), 0),
      change: 0,
      changeLabel: `${filteredProducts.length} unique catalog SKUs`
    },
    lowStockProducts: {
      title: "Low Stock Products",
      value: `${lowStockProductsCount} SKUs`,
      numericValue: lowStockProductsCount,
      change: 0,
      changeLabel: "Require prompt restock"
    },
    outOfStockProducts: {
      title: "Out of Stock Products",
      value: `${outOfStockProductsCount} SKUs`,
      numericValue: outOfStockProductsCount,
      change: 0,
      changeLabel: "Empty shelf count"
    },
    todayInvoices: {
      title: getDynamicTitle("Invoices"),
      value: `${todayInvoicesCount} sales`,
      numericValue: todayInvoicesCount,
      change: 0,
      changeLabel: invoiceLabel
    }
  };

  // 4. Generate 13 Chart Datasets based on Date Preset
  const dailySalesTrend: any[] = [];
  const weeklySalesMap = new Map<string, number>();
  const monthlySalesMap = new Map<string, number>();
  const yearlySalesMap = new Map<string, number>();
  const salesVsPurchases: any[] = [];
  const profitTrend: any[] = [];
  const expenseTrend: any[] = [];
  const cashFlow: any[] = [];
  const creditRecoveryTrend: any[] = [];
  const purchaseTrend: any[] = [];

  // Seed baseline structures
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  daysOfWeek.forEach(day => weeklySalesMap.set(day, 0));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  monthNames.forEach(name => monthlySalesMap.set(name, 0));

  // Determine granularity for trends (Daily or Monthly)
  const totalDaysDiff = Math.ceil((currentRange.end.getTime() - currentRange.start.getTime()) / (24 * 60 * 60 * 1000));
  
  if (totalDaysDiff <= 31) {
    // Generate daily points
    for (let d = new Date(currentRange.start); d <= currentRange.end; d.setDate(d.getDate() + 1)) {
      const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      const daySales = currentSales.filter(s => {
        const sd = new Date(s.createdAt || s.saleDate || new Date());
        return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      const dayPurchases = currentPurchases.filter(p => {
        const pd = new Date(p.createdAt || p.purchaseDate || new Date());
        return pd.getDate() === d.getDate() && pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      });
      const dayExpenses = currentExpenses.filter(e => {
        const ed = new Date(e.expenseDate);
        return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
      });
      const dayCredits = currentCreditPayments.filter(cp => {
        const cpd = new Date(cp.createdAt || cp.paymentDate || new Date());
        return cpd.getDate() === d.getDate() && cpd.getMonth() === d.getMonth() && cpd.getFullYear() === d.getFullYear();
      });

      const salesSum = daySales.reduce((sum, s) => sum + (s.total ?? s.grandTotal ?? 0), 0);
      const profitSum = calculateSalesProfit(daySales);
      const purchaseSum = dayPurchases.reduce((sum, p) => sum + (p.total ?? p.grandTotal ?? 0), 0);
      const expenseSum = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      const creditSum = dayCredits.reduce((sum, cp) => sum + cp.amount, 0);

      const cashInflow = daySales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.paidAmount, 0) + creditSum;
      const cashOutflow = dayPurchases.reduce((sum, p) => sum + p.paidAmount, 0) + expenseSum;

      dailySalesTrend.push({ label: dateLabel, sales: salesSum, profit: profitSum });
      salesVsPurchases.push({ label: dateLabel, sales: salesSum, purchases: purchaseSum });
      profitTrend.push({ label: dateLabel, profit: profitSum - expenseSum });
      expenseTrend.push({ label: dateLabel, amount: expenseSum });
      cashFlow.push({ label: dateLabel, inflow: cashInflow, outflow: cashOutflow });
      creditRecoveryTrend.push({ label: dateLabel, amount: creditSum });
      purchaseTrend.push({ label: dateLabel, amount: purchaseSum });
    }
  } else {
    // Generate monthly points
    const monthsIncluded: { year: number, month: number, key: string }[] = [];
    const tempDate = new Date(currentRange.start);
    while (tempDate <= currentRange.end) {
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth();
      const key = `${monthNames[month]} ${String(year).slice(-2)}`;
      if (!monthsIncluded.some(m => m.key === key)) {
        monthsIncluded.push({ year, month, key });
      }
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    monthsIncluded.forEach(m => {
      const monthSales = currentSales.filter(s => {
        const sd = new Date(s.createdAt || s.saleDate || new Date());
        return sd.getMonth() === m.month && sd.getFullYear() === m.year;
      });
      const monthPurchases = currentPurchases.filter(p => {
        const pd = new Date(p.createdAt || p.purchaseDate || new Date());
        return pd.getMonth() === m.month && pd.getFullYear() === m.year;
      });
      const monthExpenses = currentExpenses.filter(e => {
        const ed = new Date(e.expenseDate);
        return ed.getMonth() === m.month && ed.getFullYear() === m.year;
      });
      const monthCredits = currentCreditPayments.filter(cp => {
        const cpd = new Date(cp.createdAt || cp.paymentDate || new Date());
        return cpd.getMonth() === m.month && cpd.getFullYear() === m.year;
      });

      const salesSum = monthSales.reduce((sum, s) => sum + (s.total ?? s.grandTotal ?? 0), 0);
      const profitSum = calculateSalesProfit(monthSales);
      const purchaseSum = monthPurchases.reduce((sum, p) => sum + (p.total ?? p.grandTotal ?? 0), 0);
      const expenseSum = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const creditSum = monthCredits.reduce((sum, cp) => sum + cp.amount, 0);

      const cashInflow = monthSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.paidAmount, 0) + creditSum;
      const cashOutflow = monthPurchases.reduce((sum, p) => sum + p.paidAmount, 0) + expenseSum;

      dailySalesTrend.push({ label: m.key, sales: salesSum, profit: profitSum });
      salesVsPurchases.push({ label: m.key, sales: salesSum, purchases: purchaseSum });
      profitTrend.push({ label: m.key, profit: profitSum - expenseSum });
      expenseTrend.push({ label: m.key, amount: expenseSum });
      cashFlow.push({ label: m.key, inflow: cashInflow, outflow: cashOutflow });
      creditRecoveryTrend.push({ label: m.key, amount: creditSum });
      purchaseTrend.push({ label: m.key, amount: purchaseSum });
    });
  }

  // Grouping for Weekly and Yearly Aggregates
  currentSales.forEach(s => {
    const sDate = new Date(s.createdAt || s.saleDate || new Date());
    const dayName = daysOfWeek[sDate.getDay()];
    weeklySalesMap.set(dayName, (weeklySalesMap.get(dayName) || 0) + (s.total ?? s.grandTotal ?? 0));

    const monthName = monthNames[sDate.getMonth()];
    monthlySalesMap.set(monthName, (monthlySalesMap.get(monthName) || 0) + (s.total ?? s.grandTotal ?? 0));

    const yearKey = String(sDate.getFullYear());
    yearlySalesMap.set(yearKey, (yearlySalesMap.get(yearKey) || 0) + (s.total ?? s.grandTotal ?? 0));
  });

  const weeklySales = Array.from(weeklySalesMap.entries()).map(([day, sales]) => ({ label: day, sales }));
  const monthlySales = Array.from(monthlySalesMap.entries()).map(([month, sales]) => ({ label: month, sales }));
  const yearlySales = Array.from(yearlySalesMap.entries()).map(([year, sales]) => ({ label: year, sales }));

  // Slicer contributions for Categories & Brands
  const catSalesVal = new Map<number, number>();
  const brandSalesVal = new Map<string, number>();
  const payMethodSalesVal = new Map<string, number>();

  currentSales.forEach(sale => {
    // Payment method distribution
    payMethodSalesVal.set(sale.paymentMethod, (payMethodSalesVal.get(sale.paymentMethod) || 0) + (sale.total ?? sale.grandTotal ?? 0));

    // Category and Brand breakdown
    const saleItems = allSaleItems.filter(si => si.saleId === sale.id);
    saleItems.forEach(item => {
      const prod = productMap.get(item.productId);
      if (prod) {
        catSalesVal.set(prod.categoryId, (catSalesVal.get(prod.categoryId) || 0) + (item.price ?? item.sellingPrice ?? 0) * item.quantity);
        const brand = prod.brand || 'No Brand';
        brandSalesVal.set(brand, (brandSalesVal.get(brand) || 0) + (item.price ?? item.sellingPrice ?? 0) * item.quantity);
      }
    });
  });

  const topCategories = Array.from(catSalesVal.entries()).map(([catId, sales]) => ({
    name: categoryMap.get(catId) || 'Uncategorized',
    value: sales
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const topBrands = Array.from(brandSalesVal.entries()).map(([brand, sales]) => ({
    name: brand,
    sales: sales
  })).sort((a, b) => b.sales - a.sales).slice(0, 6);

  const paymentMethodDistribution = Array.from(payMethodSalesVal.entries()).map(([method, sales]) => ({
    name: method,
    value: sales
  }));

  // 5. Compute Small Business Insights
  const productQuantities = new Map<number, number>();
  const productProfits = new Map<number, number>();
  const expenseCatSums = new Map<number, number>();

  currentSales.forEach(sale => {
    const saleItems = allSaleItems.filter(si => si.saleId === sale.id);
    saleItems.forEach(item => {
      productQuantities.set(item.productId, (productQuantities.get(item.productId) || 0) + item.quantity);
      
      const prod = productMap.get(item.productId);
      const cost = prod?.cost ?? prod?.purchasePrice ?? 0;
      const profit = ((item.price ?? item.sellingPrice ?? 0) - cost) * item.quantity;
      productProfits.set(item.productId, (productProfits.get(item.productId) || 0) + profit);
    });
  });

  currentExpenses.forEach(e => {
    expenseCatSums.set(e.categoryId, (expenseCatSums.get(e.categoryId) || 0) + e.amount);
  });

  // Calculations for Insights
  let maxQty = 0; let bestSellProdId = 0;
  productQuantities.forEach((qty, pid) => { if (qty > maxQty) { maxQty = qty; bestSellProdId = pid; } });
  const highestSellingProduct = bestSellProdId ? `${productMap.get(bestSellProdId)?.name || 'Product'} (${maxQty} sold)` : 'N/A';

  let maxProf = 0; let bestProfProdId = 0;
  productProfits.forEach((prof, pid) => { if (prof > maxProf) { maxProf = prof; bestProfProdId = pid; } });
  const highestProfitProduct = bestProfProdId ? `${productMap.get(bestProfProdId)?.name || 'Product'} (${fmt(maxProf)} profit)` : 'N/A';

  let maxExp = 0; let bestExpCatId = 0;
  expenseCatSums.forEach((amount, cid) => { if (amount > maxExp) { maxExp = amount; bestExpCatId = cid; } });
  const highestExpenseCategory = bestExpCatId ? `${expenseCategoryMap.get(bestExpCatId) || 'Category'} (${fmt(maxExp)})` : 'N/A';

  const averageSaleValue = currentSales.length > 0 ? fmt(curSalesVal / currentSales.length) : '$0.00';
  const averageDailyProfit = totalDaysDiff > 0 ? fmt(curProfitVal / totalDaysDiff) : fmt(curProfitVal);

  const dayOfWeekSales = new Map<string, number>();
  currentSales.forEach(s => {
    const d = new Date(s.createdAt || s.saleDate || new Date());
    const day = daysOfWeek[d.getDay()];
    dayOfWeekSales.set(day, (dayOfWeekSales.get(day) || 0) + (s.total ?? s.grandTotal ?? 0));
  });
  let maxDayVal = 0; let bestSalesDay = 'N/A';
  dayOfWeekSales.forEach((v, d) => { if (v > maxDayVal) { maxDayVal = v; bestSalesDay = d; } });

  const customerSpending = new Map<number, number>();
  currentSales.forEach(s => {
    if (s.customerId) customerSpending.set(s.customerId, (customerSpending.get(s.customerId) || 0) + (s.total ?? s.grandTotal ?? 0));
  });
  let maxSpent = 0; let bestCustId = 0;
  customerSpending.forEach((v, cid) => { if (v > maxSpent) { maxSpent = v; bestCustId = cid; } });
  const bestCustomer = bestCustId ? `${customerMap.get(bestCustId)?.fullName || 'Guest'} (${fmt(maxSpent)})` : 'N/A';

  const payCounts = new Map<string, number>();
  currentSales.forEach(s => payCounts.set(s.paymentMethod, (payCounts.get(s.paymentMethod) || 0) + 1));
  let maxCount = 0; let mostUsedPaymentMethod = 'N/A';
  payCounts.forEach((v, m) => { if (v > maxCount) { maxCount = v; mostUsedPaymentMethod = m; } });

  // 6. Advanced Deep Dives calculations
  // Inventory Analytics
  const fastMoving = Array.from(productQuantities.entries()).map(([pid, qty]) => {
    const prod = productMap.get(pid);
    return { name: prod?.name || 'Unknown', sku: prod?.sku || 'SKU', qty, quantity: qty };
  }).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const slowMoving = filteredProducts
    .filter(p => !productQuantities.has(p.id!) && (p.stock ?? p.currentStock ?? 0) > 0)
    .slice(0, 5)
    .map(p => ({ name: p.name, sku: p.sku, stock: p.stock ?? p.currentStock ?? 0 }));

  const deadStock = filteredProducts
    .filter(p => !productQuantities.has(p.id!) && (p.stock ?? p.currentStock ?? 0) > 0)
    .slice(0, 5)
    .map(p => ({ name: p.name, sku: p.sku, value: (p.stock ?? p.currentStock ?? 0) * (p.cost ?? p.purchasePrice ?? 0) }));

  const lowStockList = filteredProducts
    .filter(p => {
      const stock = p.stock ?? p.currentStock ?? 0;
      const minStock = p.alertQuantity ?? p.minimumStock ?? 5;
      return stock <= minStock && stock > 0;
    })
    .map(p => ({ name: p.name, sku: p.sku, stock: p.stock ?? p.currentStock ?? 0 }));

  const outOfStockList = filteredProducts
    .filter(p => (p.stock ?? p.currentStock ?? 0) <= 0)
    .map(p => ({ name: p.name, sku: p.sku }));

  // Customer Analytics
  const topCustomers = Array.from(customerSpending.entries()).map(([cid, spending]) => {
    const cust = customerMap.get(cid);
    return { name: cust?.fullName || 'Guest', phone: cust?.phone || 'N/A', total: spending };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  const newCustomersCount = allCustomers.filter(c => {
    if (c.isDeleted) return false;
    return inRange(c.createdAt || new Date(), currentRange);
  }).length;

  const repeatCustomersCount = allCustomers.filter(c => {
    if (c.isDeleted) return false;
    const count = allSales.filter(s => s.customerId === c.id && s.status === 'Completed').length;
    return count > 1;
  }).length;

  const outstandingCustomers = allCustomers
    .filter(c => !c.isDeleted && (c.currentBalance ?? c.balance ?? 0) > 0)
    .sort((a, b) => (b.currentBalance ?? b.balance ?? 0) - (a.currentBalance ?? a.balance ?? 0))
    .slice(0, 5)
    .map(c => ({ name: c.fullName, phone: c.phone, balance: c.currentBalance ?? c.balance ?? 0 }));

  const recentPayments = currentCreditPayments.slice(0, 5).map(cp => {
    const cust = customerMap.get(cp.customerId);
    return {
      customerName: cust?.fullName || 'Debtor',
      amount: cp.amount,
      method: cp.paymentMethod,
      date: cp.createdAt || cp.paymentDate
    };
  });

  // Supplier Analytics
  const supplierPurchaseVolume = new Map<number, number>();
  currentPurchases.forEach(p => {
    if (p.supplierId) {
      supplierPurchaseVolume.set(p.supplierId, (supplierPurchaseVolume.get(p.supplierId) || 0) + (p.total ?? p.grandTotal ?? 0));
    }
  });

  const topSuppliers = Array.from(supplierPurchaseVolume.entries()).map(([sid, volume]) => {
    const sup = supplierMap.get(sid);
    return { name: sup?.companyName || sup?.name || 'Supplier', volume };
  }).sort((a, b) => b.volume - a.volume).slice(0, 5);

  const outstandingSuppliers = allSuppliers
    .filter(s => (s.currentBalance ?? 0) > 0)
    .sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0))
    .slice(0, 5)
    .map(s => ({ name: s.companyName, balance: s.currentBalance ?? 0 }));

  // Ledger records construction (with proper string/number mappings for columns)
  const salesLedger = currentSales.map(s => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    customerName: customerMap.get(s.customerId!)?.fullName || 'Guest Customer',
    itemCount: allSaleItems.filter(si => si.saleId === s.id).length,
    total: s.total ?? s.grandTotal ?? 0,
    paidAmount: s.paidAmount,
    outstanding: Math.max(0, (s.total ?? s.grandTotal ?? 0) - s.paidAmount),
    paymentMethod: s.paymentMethod,
    createdAt: s.createdAt || s.saleDate,
    status: s.status || 'Completed'
  }));

  const purchasesLedger = currentPurchases.map(p => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber || p.referenceNo,
    supplierName: supplierMap.get(p.supplierId!)?.companyName || 'Sourcing Vendor',
    referenceNo: p.referenceNo,
    total: p.total ?? p.grandTotal ?? 0,
    paidAmount: p.paidAmount,
    outstanding: Math.max(0, (p.total ?? p.grandTotal ?? 0) - p.paidAmount),
    paymentMethod: p.paymentMethod,
    createdAt: p.createdAt || p.purchaseDate,
    status: p.status || 'Received'
  }));

  const expensesLedger = currentExpenses.map(e => ({
    id: e.id,
    expenseNumber: e.expenseNumber || `EXP-${e.id}`,
    title: e.title,
    categoryName: expenseCategoryMap.get(e.categoryId) || e.category || 'Operating Expense',
    amount: e.amount,
    expenseDate: e.expenseDate,
    paymentMethod: e.paymentMethod,
    status: e.status || 'Paid'
  }));

  const creditPaymentsLedger = currentCreditPayments.map(cp => ({
    id: cp.id,
    paymentDate: cp.createdAt || cp.paymentDate,
    customerName: customerMap.get(cp.customerId)?.fullName || 'Store Customer',
    amount: cp.amount,
    referenceNo: cp.referenceNo || cp.referenceNumber || 'None',
    paymentMethod: cp.paymentMethod
  }));

  return {
    paymentMethods,
    categories: allCategories,
    customers: allCustomers.filter(c => !c.isDeleted),
    suppliers: allSuppliers,
    kpis,
    charts: {
      dailySalesTrend,
      weeklySales,
      monthlySales,
      yearlySales,
      salesVsPurchases,
      profitTrend,
      expenseTrend,
      cashFlow,
      creditRecoveryTrend,
      purchaseTrend,
      topCategories,
      topBrands,
      paymentMethodDistribution
    },
    insights: {
      highestSellingProduct,
      highestProfitProduct,
      highestExpenseCategory,
      averageSaleValue,
      averageDailyProfit,
      bestSalesDay,
      bestCustomer,
      mostUsedPaymentMethod
    },
    inventoryAnalytics: {
      inventoryValue: inventoryValueVal,
      fastMoving,
      slowMoving,
      deadStock,
      lowStock: lowStockList,
      outOfStock: outOfStockList,
      stockMovement: [] // will query live if needed, or placeholder
    },
    customerAnalytics: {
      topCustomers,
      newCustomersCount,
      repeatCustomersCount,
      outstandingCustomers,
      recentPayments
    },
    supplierAnalytics: {
      topSuppliers,
      recentPurchases: currentPurchases.slice(0, 5).map(p => ({
        supplierName: supplierMap.get(p.supplierId!)?.companyName || 'Vendor',
        total: p.total ?? p.grandTotal ?? 0,
        date: p.createdAt || p.purchaseDate
      })),
      outstandingSuppliers
    },
    salesLedger,
    purchasesLedger,
    expensesLedger,
    creditPaymentsLedger
  };
}
