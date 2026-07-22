import { formatCurrency, formatDate } from './helpers';

export interface PowerBiCalculatedData {
  // Gauges
  salesProgress: number;
  profitGoalProgress: number;
  creditRecoveryProgress: number;
  inventoryHealthProgress: number;

  // Extra computed datasets
  profitVsExpenses: any[];
  creditVsRecovered: any[];
  categoryInventoryStatus: any[];
  categoryStockVal: any[];
  expensesByCategory: any[];
  salesByHour: any[];
  top10Customers: any[];
  loanAging: any[];
  cashFlowWaterfall: any[];
  monthlyProfitTrend: any[];

  // Tables
  lowStockTable: any[];
  customerCreditTable: any[];
  recentActivities: any[];
}

export function calculatePowerBiMetrics(
  products: any[],
  categories: any[],
  customers: any[],
  suppliers: any[],
  sales: any[],
  purchases: any[],
  expenses: any[],
  creditPayments: any[],
  expenseCategories: any[],
  biData: any // This is the result of the standard calculateBiDashboard
): PowerBiCalculatedData {
  const now = new Date();

  // 1. GAUGE CALCULATIONS
  // A. Sales Target (Target of 15,000 or custom)
  const salesValue = biData.kpis.todaySales?.numericValue || 0;
  const salesProgress = Math.min((salesValue / 15000) * 100, 100);

  // B. Monthly Profit Goal (Target of 5,000)
  const profitValue = biData.kpis.todayProfit?.numericValue || 0;
  const profitGoalProgress = Math.min((profitValue / 5000) * 100, 100);

  // C. Credit Recovery %
  const creditRecoveredVal = biData.kpis.creditRecovered?.numericValue || 0;
  const totalOutstandingCreditVal = biData.kpis.outstandingCredit?.numericValue || 0;
  const totalCreditIssued = totalOutstandingCreditVal + creditRecoveredVal;
  const creditRecoveryProgress = totalCreditIssued > 0 
    ? Math.min((creditRecoveredVal / totalCreditIssued) * 100, 100)
    : 100;

  // D. Inventory Health %
  const totalProductsCount = products.length;
  const productsInStockCount = products.filter(p => (p.stock ?? p.currentStock ?? 0) > 0).length;
  const inventoryHealthProgress = totalProductsCount > 0
    ? (productsInStockCount / totalProductsCount) * 100
    : 100;

  // 2. EXTRA COMPUTED DATASETS
  // Chart 5: Profit vs Expenses Combo Chart (Bar: Expenses, Line: Gross Profit)
  const profitVsExpenses = biData.charts.dailySalesTrend.map((point: any) => {
    const expPoint = biData.charts.expenseTrend.find((e: any) => e.label === point.label);
    return {
      label: point.label,
      profit: point.profit,
      expenses: expPoint ? expPoint.amount : 0
    };
  });

  // Chart 6: Customer Credit vs Credit Recovered Clustered Chart
  const creditVsRecovered = customers.slice(0, 8).map(c => {
    const customerPayments = creditPayments.filter(cp => cp.customerId === c.id);
    const recovered = customerPayments.reduce((sum, cp) => sum + cp.amount, 0);
    const outstanding = c.currentBalance ?? c.balance ?? 0;
    return {
      name: c.fullName || c.name || 'Customer',
      issued: outstanding + recovered,
      recovered: recovered
    };
  }).filter(c => c.issued > 0);

  // Chart 11: Inventory Status by Category Stacked Bar (In Stock vs Low Stock vs Out of Stock)
  const categoryInventoryStatus = categories.map(cat => {
    const catProducts = products.filter(p => p.categoryId === cat.id);
    const inStock = catProducts.filter(p => {
      const stock = p.stock ?? p.currentStock ?? 0;
      const alertQty = p.alertQuantity ?? p.minimumStock ?? 5;
      return stock > alertQty;
    }).length;
    const lowStock = catProducts.filter(p => {
      const stock = p.stock ?? p.currentStock ?? 0;
      const alertQty = p.alertQuantity ?? p.minimumStock ?? 5;
      return stock <= alertQty && stock > 0;
    }).length;
    const outOfStock = catProducts.filter(p => (p.stock ?? p.currentStock ?? 0) <= 0).length;
    return {
      category: cat.name,
      'In Stock': inStock,
      'Low Stock': lowStock,
      'Out of Stock': outOfStock
    };
  });

  // Chart 12: Stock Value by Category (Treemap / Column Bar representation)
  const categoryStockVal = categories.map(cat => {
    const catProducts = products.filter(p => p.categoryId === cat.id);
    const value = catProducts.reduce((sum, p) => {
      const stock = p.stock ?? p.currentStock ?? 0;
      const cost = p.cost ?? p.purchasePrice ?? 0;
      return sum + (stock * cost);
    }, 0);
    return {
      name: cat.name,
      value: value
    };
  }).filter(c => c.value > 0);

  // Chart 14: Monthly Expenses by Category (Donut Chart)
  const expensesByCategory = expenseCategories.map(ec => {
    const catExpenses = expenses.filter(e => e.categoryId === ec.id);
    const amount = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      name: ec.name,
      value: amount
    };
  }).filter(e => e.value > 0);

  // Chart 15: Sales by Hour Line Chart
  const salesByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    sales: 0
  }));
  sales.forEach(s => {
    const sDate = new Date(s.createdAt || s.saleDate || new Date());
    const hour = sDate.getHours();
    salesByHour[hour].sales += s.total ?? s.grandTotal ?? 0;
  });

  // Chart 16: Top 10 High Spender Customers Horizontal Bar Chart
  const top10Customers = customers
    .map(cust => {
      const spending = sales
        .filter(s => s.customerId === cust.id && s.status === 'Completed')
        .reduce((sum, s) => sum + (s.total ?? s.grandTotal ?? 0), 0);
      return {
        name: cust.fullName || cust.name || 'Guest',
        spending
      };
    })
    .sort((a, b) => b.spending - a.spending)
    .slice(0, 10)
    .filter(c => c.spending > 0);

  // Chart 17: Customer Loan Aging (Stacked Column Chart: 0-30, 31-60, 61-90, 90+ Days)
  const loanAging = customers
    .filter(c => (c.currentBalance ?? c.balance ?? 0) > 0)
    .slice(0, 6)
    .map(c => {
      const customerSales = sales.filter(s => s.customerId === c.id && s.status === 'Completed');
      const aging = {
        name: c.fullName || c.name || 'Debtor',
        '0-30 Days': 0,
        '31-60 Days': 0,
        '61-90 Days': 0,
        '90+ Days': 0
      };
      customerSales.forEach(s => {
        const unpaid = (s.total ?? s.grandTotal ?? 0) - s.paidAmount;
        if (unpaid > 0) {
          const sDate = new Date(s.createdAt || s.saleDate || new Date());
          const diffTime = Math.abs(now.getTime() - sDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) aging['0-30 Days'] += unpaid;
          else if (diffDays <= 60) aging['31-60 Days'] += unpaid;
          else if (diffDays <= 90) aging['61-90 Days'] += unpaid;
          else aging['90+ Days'] += unpaid;
        }
      });
      return aging;
    });

  // Chart 19: Cash Flow Waterfall (Base Register, Sales Cash Inflow, Credit Recovered, Purchases Cost, Expenses Outflow, Closing Cash)
  const cashInflowSales = sales
    .filter(s => s.paymentMethod === 'Cash')
    .reduce((sum, s) => sum + s.paidAmount, 0);
  const cashInflowCredit = creditRecoveredVal;
  const cashOutflowPurchases = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const cashOutflowExpenses = biData.kpis.todayExpenses?.numericValue || 0;

  const baseCash = 12000; // Baseline business working vault
  const finalCash = baseCash + cashInflowSales + cashInflowCredit - cashOutflowPurchases - cashOutflowExpenses;

  const cashFlowWaterfall = [
    { name: 'Working Vault', value: baseCash, fill: '#4f46e5' },
    { name: 'Sales Cash', value: cashInflowSales, fill: '#10b981' },
    { name: 'Credit Recovered', value: cashInflowCredit, fill: '#10b981' },
    { name: 'Purchases Cost', value: -cashOutflowPurchases, fill: '#ef4444' },
    { name: 'Expenses Paid', value: -cashOutflowExpenses, fill: '#ef4444' },
    { name: 'Closing vault', value: finalCash, fill: '#0ea5e9' }
  ];

  // Chart 20: Monthly Profit Trend (Area Chart representation)
  const monthlyProfitTrend = biData.charts.monthlySales.map((m: any) => ({
    label: m.label,
    profit: m.sales * 0.38 // Average standard retail profitability margin ratio (38%)
  }));

  // 3. TABLES
  // Low Stock Table Product list
  const lowStockTable = products
    .filter(p => {
      const stock = p.stock ?? p.currentStock ?? 0;
      const alertQty = p.alertQuantity ?? p.minimumStock ?? 5;
      return stock <= alertQty && stock > 0;
    })
    .map(p => ({
      name: p.name,
      stock: p.stock ?? p.currentStock ?? 0,
      alertQuantity: p.alertQuantity ?? p.minimumStock ?? 5
    }));

  // Customer Credit Debtors list
  const customerCreditTable = customers.map(c => {
    const payments = creditPayments.filter(cp => cp.customerId === c.id);
    const recovered = payments.reduce((sum, cp) => sum + cp.amount, 0);
    const remaining = c.currentBalance ?? c.balance ?? 0;
    const outstanding = remaining + recovered;
    return {
      name: c.fullName || c.name || 'Customer',
      phone: c.phone || 'N/A',
      outstanding: outstanding,
      recovered: recovered,
      remaining: remaining
    };
  }).filter(c => c.remaining > 0);

  // 4. TIMELINE ACTIVITIES
  // Merge, sort, and slice the latest activities
  const recentActivities: any[] = [];
  sales.forEach(s => {
    recentActivities.push({
      id: `sale-${s.id}`,
      type: 'sale',
      title: `Checkout Invoice #${s.invoiceNo}`,
      description: `Sold ${s.itemCount || 1} units to ${s.customerName} via ${s.paymentMethod}`,
      value: s.total ?? s.grandTotal ?? 0,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-100',
      date: new Date(s.createdAt || s.saleDate || new Date())
    });
  });

  purchases.forEach(p => {
    recentActivities.push({
      id: `pur-${p.id}`,
      type: 'purchase',
      title: `Stock Acquired #${p.purchaseNumber}`,
      description: `Purchased goods from ${p.supplierName} using ${p.paymentMethod}`,
      value: p.total ?? 0,
      color: 'text-blue-500 bg-blue-500/10 border-blue-100',
      date: new Date(p.createdAt || p.purchaseDate || new Date())
    });
  });

  expenses.forEach(e => {
    recentActivities.push({
      id: `exp-${e.id}`,
      type: 'expense',
      title: `Operating Expense #${e.expenseNumber}`,
      description: `${e.title} in category ${e.categoryName}`,
      value: e.amount,
      color: 'text-rose-500 bg-rose-500/10 border-rose-100',
      date: new Date(e.expenseDate || e.createdAt || new Date())
    });
  });

  creditPayments.forEach(cp => {
    recentActivities.push({
      id: `cred-${cp.id}`,
      type: 'credit',
      title: `Debt Recovered: ${cp.customerName}`,
      description: `Credit payment received with reference ${cp.referenceNo || 'N/A'}`,
      value: cp.amount,
      color: 'text-violet-500 bg-violet-500/10 border-violet-100',
      date: new Date(cp.paymentDate || new Date())
    });
  });

  // Sort descending by date
  recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    salesProgress,
    profitGoalProgress,
    creditRecoveryProgress,
    inventoryHealthProgress,
    profitVsExpenses,
    creditVsRecovered,
    categoryInventoryStatus,
    categoryStockVal,
    expensesByCategory,
    salesByHour,
    top10Customers,
    loanAging,
    cashFlowWaterfall,
    monthlyProfitTrend,
    lowStockTable,
    customerCreditTable,
    recentActivities: recentActivities.slice(0, 8)
  };
}
