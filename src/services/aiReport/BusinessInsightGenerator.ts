import dayjs from 'dayjs';
import { type Product, type Category, type Customer, type Supplier, type Sale, type SaleItem, type Purchase, type Expense, type CreditPayment, type ExpenseCategory, type AuditLog, type StockHistory, type CreditAccount } from '../../database/db';

export interface AIReportInsights {
  metadata: {
    shopName: string;
    generatedDate: string;
    reportPeriod: string;
    preparedBy: string;
    healthScore: number;
    healthStatus: string;
    executiveSummary: string;
  };
  kpis: {
    todaySales: number;
    monthlySales: number;
    profit: number;
    expenses: number;
    purchases: number;
    cashInHand: number;
    inventoryValue: number;
    outstandingCredit: number;
    recoveredCredit: number;
    netProfit: number;
  };
  salesAnalysis: {
    dailySales: { date: string; amount: number }[];
    weeklySales: { week: string; amount: number }[];
    monthlySales: { month: string; amount: number }[];
    yearlySales: { year: string; amount: number }[];
    topProducts: { name: string; sku: string; quantity: number; revenue: number }[];
    topCategories: { name: string; revenue: number }[];
    averageSale: number;
    largestSale: number;
    smallestSale: number;
    totalInvoices: number;
  };
  purchasesAnalysis: {
    totalValue: number;
    trend: { date: string; amount: number }[];
    topSuppliers: { name: string; code: string; amount: number }[];
  };
  inventoryAnalysis: {
    currentStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    deadStockCount: number;
    fastMovingProducts: { name: string; sku: string; stock: number; sold: number }[];
    slowMovingProducts: { name: string; sku: string; stock: number; sold: number }[];
  };
  customerAnalysis: {
    topCustomers: { name: string; code: string; totalSpent: number; frequency: number }[];
    customerLoan: number;
    recoveredLoan: number;
    outstandingLoan: number;
    creditRecoveryRate: number;
    purchaseFrequency: { customer: string; count: number }[];
  };
  expenseAnalysis: {
    expensesByCategory: { category: string; amount: number; color?: string }[];
    monthlyExpenses: { month: string; amount: number }[];
    highestExpense: { title: string; amount: number; date: string };
    averageExpense: number;
    totalExpense: number;
  };
  biMetrics: {
    highestSellingProduct: string;
    highestProfitProduct: string;
    mostProfitableCategory: string;
    slowMovingInventoryCount: number;
    customerHighestOutstanding: { name: string; balance: number };
    supplierHighestPurchases: { name: string; amount: number };
    mostUsedPaymentMethod: string;
    highestSalesDay: { date: string; amount: number };
    lowestSalesDay: { date: string; amount: number };
    averageDailySales: number;
    averageMonthlyProfit: number;
    creditRecoveryPercentage: number;
    inventoryTurnover: number;
  };
  recommendations: {
    id: number;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    category: string;
  }[];
}

export class BusinessInsightGenerator {
  static generate(params: {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    suppliers: Supplier[];
    sales: Sale[];
    saleItems: SaleItem[];
    purchases: Purchase[];
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
    creditPayments: CreditPayment[];
    creditAccounts: CreditAccount[];
    auditLogs: AuditLog[];
    stockHistory: StockHistory[];
    shopName: string;
    operatorUser: string;
  }): AIReportInsights {
    const {
      products = [],
      categories = [],
      customers = [],
      suppliers = [],
      sales = [],
      saleItems = [],
      purchases = [],
      expenses = [],
      expenseCategories = [],
      creditPayments = [],
      creditAccounts = [],
      auditLogs = [],
      stockHistory = [],
      shopName = 'Retail Shop',
      operatorUser = 'Administrator'
    } = params;

    // Helper maps
    const productMap = new Map<number, Product>();
    products.forEach(p => { if (p.id) productMap.set(p.id, p); });

    const categoryMap = new Map<number, string>();
    categories.forEach(c => { if (c.id) categoryMap.set(c.id, c.name); });

    const customerMap = new Map<number, Customer>();
    customers.forEach(c => { if (c.id) customerMap.set(c.id, c); });

    const supplierMap = new Map<number, Supplier>();
    suppliers.forEach(s => { if (s.id) supplierMap.set(s.id, s); });

    const expenseCategoryMap = new Map<number, string>();
    expenseCategories.forEach(ec => { if (ec.id) expenseCategoryMap.set(ec.id, ec.name); });

    const activeSales = sales.filter(s => !s.isDeleted && s.status !== 'Cancelled');
    const activeExpenses = expenses.filter(e => !e.isDeleted && e.status !== 'Voided');

    // Dates
    const todayStr = dayjs().format('YYYY-MM-DD');
    const startOfMonth = dayjs().startOf('month');

    // === KPIs Calculations ===
    const todaySales = activeSales
      .filter(s => dayjs(s.createdAt).format('YYYY-MM-DD') === todayStr)
      .reduce((sum, s) => sum + (s.grandTotal || s.total || 0), 0);

    const monthlySales = activeSales
      .filter(s => dayjs(s.createdAt).isAfter(startOfMonth) || dayjs(s.createdAt).isSame(startOfMonth))
      .reduce((sum, s) => sum + (s.grandTotal || s.total || 0), 0);

    // Profit = Revenue - Product Cost (or sales items purchase price)
    const totalRevenue = activeSales.reduce((sum, s) => sum + (s.grandTotal || s.total || 0), 0);
    
    // Profit Calculation based on sale items
    let totalSalesCost = 0;
    activeSales.forEach(s => {
      const items = saleItems.filter(si => si.saleId === s.id);
      items.forEach(item => {
        const qty = item.quantity || 0;
        const cost = item.purchasePrice || 0;
        totalSalesCost += qty * cost;
      });
    });
    const grossProfit = totalRevenue - totalSalesCost;

    const totalExpenses = activeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = grossProfit - totalExpenses;

    const totalPurchases = purchases
      .filter(p => p.status !== 'Cancelled')
      .reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);

    // Cash in Hand = Initial settings or (Paid sales + Credit recovered - Purchases Paid - Expenses Paid)
    const paidSalesTotal = activeSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const recoveredCreditTotal = creditPayments.reduce((sum, cp) => sum + (cp.amount || 0), 0);
    const purchasesPaidTotal = purchases.filter(p => p.status !== 'Cancelled').reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const cashInHand = Math.max(0, paidSalesTotal + recoveredCreditTotal - purchasesPaidTotal - totalExpenses);

    // Inventory Value = Sum (Product Quantity * Purchase Price)
    const inventoryValue = products.reduce((sum, p) => {
      const price = p.purchasePrice || p.cost || 0;
      const qty = p.currentStock || p.stock || 0;
      return sum + (qty * price);
    }, 0);

    // Customer Outstanding Credit
    const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.currentBalance || c.balance || 0), 0);

    // === Sales Analysis ===
    // Daily Sales
    const dailyMap = new Map<string, number>();
    activeSales.forEach(s => {
      const day = dayjs(s.createdAt).format('YYYY-MM-DD');
      dailyMap.set(day, (dailyMap.get(day) || 0) + (s.grandTotal || s.total || 0));
    });
    const dailySales = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    // Weekly Sales
    const getWeekNumber = (dateInput: Date | string) => {
      const date = new Date(dateInput);
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const weeklyMap = new Map<string, number>();
    activeSales.forEach(s => {
      const weekNum = getWeekNumber(s.createdAt);
      const week = `Wk ${weekNum}`;
      weeklyMap.set(week, (weeklyMap.get(week) || 0) + (s.grandTotal || s.total || 0));
    });
    const weeklySales = Array.from(weeklyMap.entries())
      .map(([week, amount]) => ({ week, amount }))
      .slice(-8); // Last 8 weeks

    // Monthly Sales
    const monthlyMap = new Map<string, number>();
    activeSales.forEach(s => {
      const month = dayjs(s.createdAt).format('MMM YYYY');
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (s.grandTotal || s.total || 0));
    });
    const monthlySalesTrend = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .slice(-12);

    // Yearly Sales
    const yearlyMap = new Map<string, number>();
    activeSales.forEach(s => {
      const year = dayjs(s.createdAt).format('YYYY');
      yearlyMap.set(year, (yearlyMap.get(year) || 0) + (s.grandTotal || s.total || 0));
    });
    const yearlySales = Array.from(yearlyMap.entries())
      .map(([year, amount]) => ({ year, amount }));

    // Top Products
    const prodSalesMap = new Map<number, { qty: number; rev: number }>();
    activeSales.forEach(s => {
      const items = saleItems.filter(si => si.saleId === s.id);
      items.forEach(si => {
        const current = prodSalesMap.get(si.productId) || { qty: 0, rev: 0 };
        prodSalesMap.set(si.productId, {
          qty: current.qty + (si.quantity || 0),
          rev: current.rev + ((si.quantity || 0) * (si.sellingPrice || si.price || 0))
        });
      });
    });
    const topProducts = Array.from(prodSalesMap.entries())
      .map(([prodId, stats]) => {
        const prod = productMap.get(prodId);
        return {
          name: prod?.name || `Product ID ${prodId}`,
          sku: prod?.sku || 'N/A',
          quantity: stats.qty,
          revenue: stats.rev
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top Categories
    const catSalesMap = new Map<number, number>();
    activeSales.forEach(s => {
      const items = saleItems.filter(si => si.saleId === s.id);
      items.forEach(si => {
        const prod = productMap.get(si.productId);
        if (prod && prod.categoryId) {
          catSalesMap.set(prod.categoryId, (catSalesMap.get(prod.categoryId) || 0) + ((si.quantity || 0) * (si.sellingPrice || si.price || 0)));
        }
      });
    });
    const topCategories = Array.from(catSalesMap.entries())
      .map(([catId, revenue]) => ({
        name: categoryMap.get(catId) || `Category ID ${catId}`,
        revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Average, Largest, Smallest sale
    const saleTotals = activeSales.map(s => s.grandTotal || s.total || 0);
    const averageSale = saleTotals.length > 0 ? saleTotals.reduce((a, b) => a + b, 0) / saleTotals.length : 0;
    const largestSale = saleTotals.length > 0 ? Math.max(...saleTotals) : 0;
    const smallestSale = saleTotals.length > 0 ? Math.min(...saleTotals) : 0;

    // === Purchases Analysis ===
    const purchaseTrendMap = new Map<string, number>();
    purchases.filter(p => p.status !== 'Cancelled').forEach(p => {
      const date = dayjs(p.createdAt || p.purchaseDate).format('YYYY-MM-DD');
      purchaseTrendMap.set(date, (purchaseTrendMap.get(date) || 0) + (p.grandTotal || p.total || 0));
    });
    const purchasesTrend = Array.from(purchaseTrendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    const supPurchasesMap = new Map<number, number>();
    purchases.filter(p => p.status !== 'Cancelled').forEach(p => {
      if (p.supplierId) {
        supPurchasesMap.set(p.supplierId, (supPurchasesMap.get(p.supplierId) || 0) + (p.grandTotal || p.total || 0));
      }
    });
    const topSuppliers = Array.from(supPurchasesMap.entries())
      .map(([supId, amount]) => {
        const sup = supplierMap.get(supId);
        return {
          name: sup?.companyName || `Supplier ID ${supId}`,
          code: sup?.supplierCode || 'N/A',
          amount
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // === Inventory Analysis ===
    const lowStockCount = products.filter(p => (p.currentStock || 0) <= (p.minimumStock || 5) && (p.currentStock || 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.currentStock || 0) === 0).length;

    // Dead Stock: stock > 0 but sold quantity in sales is 0
    const soldProductIds = new Set<number>();
    saleItems.forEach(si => soldProductIds.add(si.productId));
    const deadStockCount = products.filter(p => (p.currentStock || 0) > 0 && !soldProductIds.has(p.id || -1)).length;

    // Fast vs Slow Moving (based on sales velocity)
    const productSalesCount = new Map<number, number>();
    saleItems.forEach(si => {
      productSalesCount.set(si.productId, (productSalesCount.get(si.productId) || 0) + si.quantity);
    });

    const productsWithVelocity = products.map(p => {
      const sold = productSalesCount.get(p.id || -1) || 0;
      return {
        name: p.name,
        sku: p.sku,
        stock: p.currentStock || 0,
        sold
      };
    });

    const fastMovingProducts = [...productsWithVelocity]
      .sort((a, b) => b.sold - a.sold)
      .filter(p => p.sold > 0)
      .slice(0, 5);

    const slowMovingProducts = [...productsWithVelocity]
      .sort((a, b) => a.sold - b.sold)
      .filter(p => p.sold >= 0 && p.stock > 0)
      .slice(0, 5);

    // === Customer Analysis ===
    const custSpentMap = new Map<number, { spent: number; frequency: number }>();
    activeSales.forEach(s => {
      if (s.customerId) {
        const current = custSpentMap.get(s.customerId) || { spent: 0, frequency: 0 };
        custSpentMap.set(s.customerId, {
          spent: current.spent + (s.grandTotal || s.total || 0),
          frequency: current.frequency + 1
        });
      }
    });

    const topCustomers = Array.from(custSpentMap.entries())
      .map(([custId, stats]) => {
        const cust = customerMap.get(custId);
        return {
          name: cust?.fullName || cust?.name || `Customer ID ${custId}`,
          code: cust?.customerCode || 'N/A',
          totalSpent: stats.spent,
          frequency: stats.frequency
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Credit / Loans
    const totalLoanSales = activeSales
      .filter(s => s.saleType === 'Credit Sale' || s.paymentStatus === 'Unpaid' || s.paymentStatus === 'Partial')
      .reduce((sum, s) => sum + ((s.grandTotal || s.total || 0) - (s.paidAmount || 0)), 0);

    const customerOutstandingLoan = totalOutstandingCredit;
    const creditRecoveryRate = totalLoanSales > 0 ? (recoveredCreditTotal / totalLoanSales) * 100 : 100;

    const purchaseFrequency = topCustomers.map(tc => ({
      customer: tc.name,
      count: tc.frequency
    }));

    // === Expense Analysis ===
    const expCatMap = new Map<number, number>();
    activeExpenses.forEach(e => {
      if (e.categoryId) {
        expCatMap.set(e.categoryId, (expCatMap.get(e.categoryId) || 0) + e.amount);
      }
    });
    const expensesByCategory = Array.from(expCatMap.entries())
      .map(([catId, amount]) => ({
        category: expenseCategoryMap.get(catId) || `Category ID ${catId}`,
        amount
      }))
      .sort((a, b) => b.amount - a.amount);

    const expMonthlyMap = new Map<string, number>();
    activeExpenses.forEach(e => {
      const month = dayjs(e.expenseDate).format('MMM YYYY');
      expMonthlyMap.set(month, (expMonthlyMap.get(month) || 0) + e.amount);
    });
    const monthlyExpenses = Array.from(expMonthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }));

    const highestExpenseObj = activeExpenses.reduce((max, e) => (e.amount > max.amount ? e : max), { title: 'N/A', amount: 0, expenseDate: new Date() });
    const highestExpense = {
      title: highestExpenseObj.title,
      amount: highestExpenseObj.amount,
      date: dayjs(highestExpenseObj.expenseDate).format('YYYY-MM-DD')
    };
    const averageExpense = activeExpenses.length > 0 ? totalExpenses / activeExpenses.length : 0;

    // === Advanced Business Intelligence ===
    const highestSellingProduct = topProducts.length > 0 ? `${topProducts[0].name} (${topProducts[0].quantity} units)` : 'N/A';
    
    // Highest profit product
    const prodProfitMap = new Map<number, number>();
    activeSales.forEach(s => {
      const items = saleItems.filter(si => si.saleId === s.id);
      items.forEach(si => {
        const cost = si.purchasePrice || 0;
        const sell = si.sellingPrice || si.price || 0;
        const profit = (sell - cost) * si.quantity;
        prodProfitMap.set(si.productId, (prodProfitMap.get(si.productId) || 0) + profit);
      });
    });
    const highestProfitProductEntry = Array.from(prodProfitMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)[0];
    const highestProfitProduct = highestProfitProductEntry 
      ? `${productMap.get(highestProfitProductEntry[0])?.name || 'N/A'} ($${highestProfitProductEntry[1].toFixed(2)} profit)` 
      : 'N/A';

    const mostProfitableCategory = topCategories.length > 0 ? topCategories[0].name : 'N/A';
    const slowMovingInventoryCount = slowMovingProducts.length;

    // Highest Debtor
    const customerOutstandingBalances = customers
      .map(c => ({
        name: c.fullName || c.name,
        balance: c.currentBalance || c.balance || 0
      }))
      .sort((a, b) => b.balance - a.balance);
    const customerHighestOutstanding = customerOutstandingBalances.length > 0 ? customerOutstandingBalances[0] : { name: 'N/A', balance: 0 };

    const supplierHighestPurchases = topSuppliers.length > 0 ? { name: topSuppliers[0].name, amount: topSuppliers[0].amount } : { name: 'N/A', amount: 0 };

    // Most used payment method
    const paymentFreqMap = new Map<string, number>();
    activeSales.forEach(s => {
      paymentFreqMap.set(s.paymentMethod, (paymentFreqMap.get(s.paymentMethod) || 0) + 1);
    });
    const mostUsedPaymentMethod = Array.from(paymentFreqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([method]) => method)[0] || 'N/A';

    // Best and Worst Sales Day
    const sortedDays = Array.from(dailyMap.entries())
      .sort((a, b) => b[1] - a[1]);
    const highestSalesDay = sortedDays.length > 0 ? { date: sortedDays[0][0], amount: sortedDays[0][1] } : { date: 'N/A', amount: 0 };
    const lowestSalesDay = sortedDays.length > 0 ? { date: sortedDays[sortedDays.length - 1][0], amount: sortedDays[sortedDays.length - 1][1] } : { date: 'N/A', amount: 0 };

    const averageDailySales = dailyMap.size > 0 ? totalRevenue / dailyMap.size : 0;
    const averageMonthlyProfit = monthlyMap.size > 0 ? netProfit / monthlyMap.size : netProfit;

    // Inventory turnover: COGS / Avg Inventory Value (approximated)
    const cogs = totalSalesCost;
    const inventoryTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;

    // === Overall Business Health Score ===
    // Weighted combination of stock health, credit recovery, operating margin, and sales velocity
    const stockHealthWeight = 0.25;
    const creditRecoveryWeight = 0.25;
    const profitabilityWeight = 0.3;
    const salesVelocityWeight = 0.2;

    const stockHealthScore = products.length > 0 ? ((products.length - outOfStockCount - lowStockCount) / products.length) * 100 : 100;
    const creditScoreVal = creditRecoveryRate;
    
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    // Normalized profit score: 30% margin is perfect 100
    const profitScoreVal = Math.min(100, Math.max(0, (profitMargin / 30) * 100));

    // Sales velocity score based on transaction count vs. days active (e.g. 5 transactions per day is high 100)
    const totalTransactions = activeSales.length;
    const activeDays = Math.max(1, dailyMap.size);
    const txnPerDay = totalTransactions / activeDays;
    const velocityScoreVal = Math.min(100, (txnPerDay / 5) * 100);

    const calculatedHealthScore = Math.round(
      (stockHealthScore * stockHealthWeight) +
      (creditScoreVal * creditRecoveryWeight) +
      (profitScoreVal * profitabilityWeight) +
      (velocityScoreVal * salesVelocityWeight)
    );
    const healthScore = isNaN(calculatedHealthScore) ? 80 : Math.min(100, Math.max(15, calculatedHealthScore));

    let healthStatus = 'STABLE';
    if (healthScore >= 85) healthStatus = 'EXCELLENT';
    else if (healthScore >= 70) healthStatus = 'GOOD';
    else if (healthScore >= 50) healthStatus = 'MARGINAL';
    else healthStatus = 'CRITICAL';

    // === AI Executive Summary narrative ===
    const executiveSummary = `This executive report evaluates operational results for ${shopName}. The shop currently exhibits an Overall Business Health Score of ${healthScore}%, reflecting a status of '${healthStatus}'. Total registered revenue is $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, deriving a Net Profit of $${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} after accounting for $${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in operating expenses. Inventory management systems value the stock assets at $${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, with ${lowStockCount} items flagged as low stock and ${outOfStockCount} completely exhausted. Debt collections maintain a ${creditRecoveryRate.toFixed(1)}% recovery rate on an outstanding loan total of $${totalOutstandingCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

    // === AI Recommendations ===
    const recommendations: AIReportInsights['recommendations'] = [];
    let recId = 1;

    // 1. Stock warning
    if (lowStockCount > 0 || outOfStockCount > 0) {
      const topLowStockProds = products
        .filter(p => (p.currentStock || 0) <= (p.minimumStock || 5))
        .slice(0, 3)
        .map(p => p.name)
        .join(', ');
      
      recommendations.push({
        id: recId++,
        title: 'Restock Urgent Inventory Items',
        description: `There are currently ${lowStockCount} low stock and ${outOfStockCount} out of stock products. Prioritize purchasing replenishment stocks for: ${topLowStockProds || 'critical catalog lines'}.`,
        priority: outOfStockCount > 2 ? 'High' : 'Medium',
        category: 'Inventory'
      });
    }

    // 2. Overdue Credit
    if (customerHighestOutstanding.balance > 0) {
      const topDebtors = customerOutstandingBalances.slice(0, 3).map(c => `${c.name} ($${c.balance.toFixed(2)})`).join(', ');
      recommendations.push({
        id: recId++,
        title: 'Recover Overdue Customer Credit balances',
        description: `Outstanding customer receivables stand at $${totalOutstandingCredit.toFixed(2)}. Initiate credit collection outreach campaigns targeting principal accounts: ${topDebtors}.`,
        priority: totalOutstandingCredit > 1000 ? 'High' : 'Medium',
        category: 'Credit & Accounts'
      });
    }

    // 3. High Expense categories
    if (expensesByCategory.length > 0) {
      const topCat = expensesByCategory[0];
      recommendations.push({
        id: recId++,
        title: `Optimize ${topCat.category} Spending`,
        description: `Operating expenses in category "${topCat.category}" represent the highest cost sector at $${topCat.amount.toFixed(2)}. Audit vendor agreements and discretionary spending in this segment to improve profit margin.`,
        priority: topCat.amount > (totalExpenses * 0.4) ? 'High' : 'Medium',
        category: 'Expenses'
      });
    }

    // 4. Fast-moving stocks promotion
    if (fastMovingProducts.length > 0) {
      const topFast = fastMovingProducts.slice(0, 2).map(p => p.name).join(', ');
      recommendations.push({
        id: recId++,
        title: 'Increase Sourcing for High-Velocity Products',
        description: `Product velocity metrics indicate "${topFast}" are fast-moving items. Negotiate bulk purchase discounts with key suppliers to safeguard against stockouts and scale profit margins.`,
        priority: 'Medium',
        category: 'Sales / Supply Chain'
      });
    }

    // 5. Dead Stock / Slow-moving
    if (deadStockCount > 0) {
      const topDead = slowMovingProducts.slice(0, 2).map(p => p.name).join(', ');
      recommendations.push({
        id: recId++,
        title: 'Liquidate Dead and Slow-Moving Stock assets',
        description: `Identified ${deadStockCount} dead stock assets holding idle working capital. Introduce bundled promotional discounts or tactical clearance events to liquidate items like: ${topDead || 'inactive assets'}.`,
        priority: 'Medium',
        category: 'Inventory / Sales'
      });
    }

    // 6. Customer loyalty
    if (topCustomers.length > 0) {
      recommendations.push({
        id: recId++,
        title: 'Implement VIP Customer Loyalty Programs',
        description: `Your top customers represent a vital portion of recurring monthly sales. Launch customized loyalty reward programs or volume-based discounts to increase customer purchase frequency and retention.`,
        priority: 'Low',
        category: 'Customer Retention'
      });
    }

    // Default recommendations if list is empty
    if (recommendations.length === 0) {
      recommendations.push({
        id: recId++,
        title: 'Initiate Digital Marketing Campaign',
        description: 'Establish standard local advertising and seasonal sales campaigns to increase transactional frequency and general sales volume.',
        priority: 'Medium',
        category: 'Sales'
      });
    }

    const reportPeriod = activeSales.length > 0 
      ? `${dayjs(activeSales[activeSales.length - 1].createdAt).format('MMM YYYY')} - ${dayjs(activeSales[0].createdAt).format('MMM YYYY')}`
      : dayjs().format('MMMM YYYY');

    return {
      metadata: {
        shopName,
        generatedDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reportPeriod,
        preparedBy: operatorUser,
        healthScore,
        healthStatus,
        executiveSummary
      },
      kpis: {
        todaySales,
        monthlySales,
        profit: grossProfit,
        expenses: totalExpenses,
        purchases: totalPurchases,
        cashInHand,
        inventoryValue,
        outstandingCredit: totalOutstandingCredit,
        recoveredCredit: recoveredCreditTotal,
        netProfit
      },
      salesAnalysis: {
        dailySales,
        weeklySales,
        monthlySales: monthlySalesTrend,
        yearlySales,
        topProducts,
        topCategories,
        averageSale,
        largestSale,
        smallestSale,
        totalInvoices: activeSales.length
      },
      purchasesAnalysis: {
        totalValue: totalPurchases,
        trend: purchasesTrend,
        topSuppliers
      },
      inventoryAnalysis: {
        currentStockValue: inventoryValue,
        lowStockCount,
        outOfStockCount,
        deadStockCount,
        fastMovingProducts,
        slowMovingProducts
      },
      customerAnalysis: {
        topCustomers,
        customerLoan: totalLoanSales,
        recoveredLoan: recoveredCreditTotal,
        outstandingLoan: totalOutstandingCredit,
        creditRecoveryRate,
        purchaseFrequency
      },
      expenseAnalysis: {
        expensesByCategory,
        monthlyExpenses,
        highestExpense,
        averageExpense,
        totalExpense: totalExpenses
      },
      biMetrics: {
        highestSellingProduct,
        highestProfitProduct,
        mostProfitableCategory,
        slowMovingInventoryCount,
        customerHighestOutstanding,
        supplierHighestPurchases,
        mostUsedPaymentMethod,
        highestSalesDay,
        lowestSalesDay,
        averageDailySales,
        averageMonthlyProfit,
        creditRecoveryPercentage: creditRecoveryRate,
        inventoryTurnover
      },
      recommendations
    };
  }
}
