import { db } from './db';
import { generateInvoiceNo, generatePurchaseRefNo } from '../utils/helpers.ts';

/**
 * Seeds IndexedDB with a comprehensive, professional set of sample data
 * if and only if the database is currently empty (e.g., no products).
 */
export async function seedDemoData(force = false): Promise<boolean> {
  try {
    const productCount = await db.products.count();
    if (productCount > 0 && !force) {
      console.log('Database already contains data. Skipping demo seed.');
      return false;
    }

    console.log('Starting demo database seed...');

    // Clear tables first if forced
    if (force) {
      await db.products.clear();
      await db.categories.clear();
      await db.customers.clear();
      await db.suppliers.clear();
      await db.sales.clear();
      await db.saleItems.clear();
      await db.purchases.clear();
      await db.purchaseItems.clear();
      await db.expenses.clear();
      await db.expenseCategories.clear();
      await db.creditAccounts.clear();
      await db.creditPayments.clear();
    }

    // 1. Seed Categories
    const categories = [
      { id: 1, name: 'Electronics', description: 'Gadgets, accessories, computer parts', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { id: 2, name: 'Groceries', description: 'Daily foodstuffs, drinks, shelf-stable goods', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { id: 3, name: 'Apparel', description: 'Clothing, shirts, jeans, activewear', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { id: 4, name: 'Beverages', description: 'Juices, energy drinks, soda, mineral water', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    ];
    await db.categories.bulkAdd(categories);

    // 2. Seed Suppliers
    const suppliers = [
      { id: 1, supplierCode: 'SUP-000001', name: 'Alex Rivera', companyName: 'Alpha Tech Wholesalers', contactPerson: 'Alex Rivera', phone: '+1 (555) 019-2831', email: 'sales@alphatech.com', address: '404 Tech Boulevard, San Jose, CA', city: 'San Jose', country: 'USA', openingBalance: 0, paymentTerms: 'Net 30', status: 'Active' as const, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { id: 2, supplierCode: 'SUP-000002', name: 'Sarah Jenkins', companyName: 'Global Harvest Foods', contactPerson: 'Sarah Jenkins', phone: '+1 (555) 014-9921', email: 'orders@globalharvest.com', address: '12 Organic Way, Portland, OR', city: 'Portland', country: 'USA', openingBalance: 150, paymentTerms: 'Net 15', status: 'Active' as const, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { id: 3, supplierCode: 'SUP-000003', name: 'Marcus Sterling', companyName: 'Sterling Apparel Corp', contactPerson: 'Marcus Sterling', phone: '+1 (555) 018-4493', email: 'billing@sterlingapparel.com', address: '78 Fashion District, New York, NY', city: 'New York', country: 'USA', openingBalance: 0, paymentTerms: 'Due on Receipt', status: 'Active' as const, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    ];
    await db.suppliers.bulkAdd(suppliers);

    // 3. Seed Customers
    const customers = [
      {
        id: 1,
        customerCode: 'CUS-000001',
        customerType: 'Regular Customer' as const,
        fullName: 'John Doe',
        name: 'John Doe',
        phone: '+1 (555) 012-3456',
        email: 'johndoe@gmail.com',
        address: '123 Maple Street',
        city: 'Springfield',
        openingBalance: 0,
        currentBalance: 0,
        balance: 0,
        creditLimit: 1000.00,
        status: 'Active' as const,
        isDeleted: false,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: 2,
        customerCode: 'CUS-000002',
        customerType: 'Permanent Credit Customer' as const,
        fullName: 'Jane Smith',
        name: 'Jane Smith',
        phone: '+1 (555) 017-8910',
        email: 'janesmith@yahoo.com',
        address: '456 Oak Avenue',
        city: 'Metropolis',
        openingBalance: 0,
        currentBalance: 350.00,
        balance: 350.00,
        creditLimit: 1000.00,
        status: 'Active' as const,
        isDeleted: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 3,
        customerCode: 'CUS-000003',
        customerType: 'Walk-in Customer' as const,
        fullName: 'Robert Johnson',
        name: 'Robert Johnson',
        phone: '+1 (555) 015-6789',
        email: 'robertj@outlook.com',
        address: '789 Pine Lane',
        city: 'Riverdale',
        openingBalance: 0,
        currentBalance: 0,
        balance: 0,
        creditLimit: 0,
        status: 'Active' as const,
        isDeleted: false,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        id: 4,
        customerCode: 'CUS-000004',
        customerType: 'Permanent Credit Customer' as const,
        fullName: 'Emily Davis',
        name: 'Emily Davis',
        phone: '+1 (555) 011-1213',
        email: 'emily.davis@gmail.com',
        address: '321 Elm Drive',
        city: 'Hillvalley',
        openingBalance: 0,
        currentBalance: 120.00,
        balance: 120.00,
        creditLimit: 500.00,
        status: 'Active' as const,
        isDeleted: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ];
    await db.customers.bulkAdd(customers);

    // 4. Seed Products
    const products = [
      { id: 1, name: 'Wireless Ergonomic Mouse', sku: 'ELC-10029-012', categoryId: 1, price: 25.00, cost: 10.00, stock: 45, alertQuantity: 10, supplierId: 1, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
      { id: 2, name: 'Mechanical Backlit Keyboard', sku: 'ELC-29310-449', categoryId: 1, price: 85.00, cost: 35.00, stock: 8, alertQuantity: 10, supplierId: 1, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) }, // Low stock!
      { id: 3, name: 'Premium Arabica Coffee Beans (1kg)', sku: 'GRO-39102-112', categoryId: 2, price: 18.50, cost: 8.00, stock: 22, alertQuantity: 5, supplierId: 2, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
      { id: 4, name: 'Organic Fresh Whole Milk (1L)', sku: 'GRO-11029-382', categoryId: 2, price: 3.50, cost: 1.50, stock: 3, alertQuantity: 10, supplierId: 2, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) }, // Low stock!
      { id: 5, name: 'Classic Fit Indigo Blue Jeans', sku: 'APP-99210-993', categoryId: 3, price: 45.00, cost: 15.00, stock: 35, alertQuantity: 8, supplierId: 3, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
      { id: 6, name: 'Cotton Crewneck Plain T-Shirt', sku: 'APP-10293-884', categoryId: 3, price: 18.00, cost: 6.00, stock: 55, alertQuantity: 15, supplierId: 3, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
      { id: 7, name: 'Hyper-Charge Citrus Energy Drink (250ml)', sku: 'BEV-48192-332', categoryId: 4, price: 2.50, cost: 0.90, stock: 140, alertQuantity: 20, supplierId: 2, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
      { id: 8, name: 'Ultra-Wide HD Monitor 34"', sku: 'ELC-78391-550', categoryId: 1, price: 299.00, cost: 120.00, stock: 2, alertQuantity: 3, supplierId: 1, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) }, // Low stock!
    ];
    await db.products.bulkAdd(products);

    // Helper to generate Dates relative to today
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    const hoursAgo = (n: number) => {
      const d = new Date();
      d.setHours(d.getHours() - n);
      return d;
    };

    // 5. Seed Credit Accounts
    const creditAccounts = [
      {
        id: 1,
        customerId: 2,
        invoiceNumber: 'INV-000002',
        invoiceDate: daysAgo(10),
        invoiceAmount: 500.00,
        paidAmount: 150.00,
        remainingAmount: 350.00,
        status: 'Partial' as const,
        dueDate: daysAgo(-20),
        notes: 'Initial partial seed',
        createdAt: daysAgo(10),
        updatedAt: daysAgo(1),
        creditLimit: 1000.00,
        currentBalance: 350.00,
      },
      {
        id: 2,
        customerId: 4,
        invoiceNumber: 'INV-000004',
        invoiceDate: daysAgo(15),
        invoiceAmount: 270.00,
        paidAmount: 150.00,
        remainingAmount: 120.00,
        status: 'Partial' as const,
        dueDate: daysAgo(-15),
        notes: 'Initial partial seed 2',
        createdAt: daysAgo(15),
        updatedAt: daysAgo(5),
        creditLimit: 500.00,
        currentBalance: 120.00,
      },
    ];
    await db.creditAccounts.bulkAdd(creditAccounts);

    // 6. Seed Credit Payments
    const creditPayments = [
      {
        id: 1,
        creditAccountId: 2,
        customerId: 4,
        paymentDate: daysAgo(15),
        amount: 100.00,
        paymentMethod: 'Cash',
        referenceNumber: 'CR-PAY-882190',
        referenceNo: 'CR-PAY-882190',
        notes: 'Seed payment 1',
        receivedBy: 'Cashier',
        createdAt: daysAgo(15),
      },
      {
        id: 2,
        creditAccountId: 2,
        customerId: 4,
        paymentDate: daysAgo(5),
        amount: 50.00,
        paymentMethod: 'Card',
        referenceNumber: 'CR-PAY-991023',
        referenceNo: 'CR-PAY-991023',
        notes: 'Seed payment 2',
        receivedBy: 'Cashier',
        createdAt: daysAgo(5),
      },
      {
        id: 3,
        creditAccountId: 1,
        customerId: 2,
        paymentDate: daysAgo(12),
        amount: 80.00,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'CR-PAY-110293',
        referenceNo: 'CR-PAY-110293',
        notes: 'Seed payment 3',
        receivedBy: 'Cashier',
        createdAt: daysAgo(12),
      },
    ];
    await db.creditPayments.bulkAdd(creditPayments);

    // 7. Seed Expense Categories
    const expenseCategories = [
      { id: 1, name: 'Shop Rent', description: 'Store Rental and Lease Costs', color: 'rose', icon: 'Home', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 2, name: 'Electricity', description: 'Power grid electricity consumption charges', color: 'amber', icon: 'Zap', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 3, name: 'Gas', description: 'Gas heating/cooking utilities', color: 'orange', icon: 'Flame', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 4, name: 'Water', description: 'Water supply & sewage utilities', color: 'blue', icon: 'Droplet', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 5, name: 'Internet', description: 'High speed fiber broadband and ISP subscriptions', color: 'indigo', icon: 'Wifi', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 6, name: 'Salary', description: 'Employee wages, bonuses, and salaries', color: 'green', icon: 'UserCheck', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 7, name: 'Transportation', description: 'Fuel, logistics, deliveries, and taxi charges', color: 'purple', icon: 'Truck', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 8, name: 'Maintenance', description: 'Shop repairs, cleaning, and upkeep service costs', color: 'teal', icon: 'Wrench', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 9, name: 'Marketing', description: 'Ads, brochures, signs, and promotion costs', color: 'pink', icon: 'Megaphone', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 10, name: 'Office Supplies', description: 'Paper, pens, receipts, and stationery items', color: 'yellow', icon: 'FileText', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 11, name: 'Food', description: 'Staff meals, tea, coffee, and entertainment expenses', color: 'emerald', icon: 'Coffee', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 12, name: 'Taxes', description: 'Income, sales, and property tax filings', color: 'red', icon: 'Percent', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
      { id: 13, name: 'Miscellaneous', description: 'Other miscellaneous unclassified expenditures', color: 'gray', icon: 'HelpCircle', status: 'Active' as const, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
    ];
    await db.expenseCategories.bulkAdd(expenseCategories);

    // Seed Expenses
    const expenses = [
      // Current Month Expenses
      {
        id: 1,
        expenseNumber: 'EXP-000001',
        categoryId: 2, // Electricity
        title: 'May Electricity Bill',
        description: 'Main commercial meter power bill',
        amount: 185.00,
        expenseDate: daysAgo(2),
        paymentMethod: 'Bank',
        referenceNumber: 'TXN-902102',
        vendorName: 'Power Distribution Co.',
        isRecurring: true,
        recurringType: 'Monthly' as const,
        nextRecurringDate: daysAgo(-28),
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
        category: 'Electricity',
        isDeleted: false,
      },
      {
        id: 2,
        expenseNumber: 'EXP-000002',
        categoryId: 1, // Shop Rent
        title: 'June Shop Lease',
        description: 'Store Rental Main Street',
        amount: 1200.00,
        expenseDate: daysAgo(6),
        paymentMethod: 'Bank',
        referenceNumber: 'TXN-382910',
        vendorName: 'Realty Holdings Ltd.',
        isRecurring: true,
        recurringType: 'Monthly' as const,
        nextRecurringDate: daysAgo(-24),
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(6),
        updatedAt: daysAgo(6),
        category: 'Shop Rent',
        isDeleted: false,
      },
      {
        id: 3,
        expenseNumber: 'EXP-000003',
        categoryId: 6, // Salary
        title: 'Staff Salary May',
        description: 'Cashier Wages',
        amount: 2500.00,
        expenseDate: daysAgo(15),
        paymentMethod: 'Cheque',
        referenceNumber: 'CHQ-001923',
        vendorName: 'Jane Smith (Cashier)',
        isRecurring: true,
        recurringType: 'Monthly' as const,
        nextRecurringDate: daysAgo(-15),
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(15),
        updatedAt: daysAgo(15),
        category: 'Salary',
        isDeleted: false,
      },
      {
        id: 4,
        expenseNumber: 'EXP-000004',
        categoryId: 9, // Marketing
        title: 'Social Media Promotion',
        description: 'Facebook Local Ads Campaign',
        amount: 150.00,
        expenseDate: daysAgo(12),
        paymentMethod: 'Card',
        referenceNumber: 'TXN-882012',
        vendorName: 'Meta Ads Manager',
        isRecurring: false,
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(12),
        updatedAt: daysAgo(12),
        category: 'Marketing',
        isDeleted: false,
      },
      {
        id: 5,
        expenseNumber: 'EXP-000005',
        categoryId: 10, // Office Supplies
        title: 'Thermal Printer Paper',
        description: 'Thermal Paper Rolls for POS Receipt Printer',
        amount: 45.00,
        expenseDate: daysAgo(1),
        paymentMethod: 'Cash',
        vendorName: 'Stationery World',
        isRecurring: false,
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
        category: 'Office Supplies',
        isDeleted: false,
      },
      // Previous Month Expenses
      {
        id: 6,
        expenseNumber: 'EXP-000006',
        categoryId: 2, // Electricity
        title: 'April Electricity Bill',
        description: 'Electricity Bill',
        amount: 178.00,
        expenseDate: daysAgo(32),
        paymentMethod: 'Cash',
        vendorName: 'Power Distribution Co.',
        isRecurring: true,
        recurringType: 'Monthly' as const,
        nextRecurringDate: daysAgo(2),
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(32),
        updatedAt: daysAgo(32),
        category: 'Electricity',
        isDeleted: false,
      },
      {
        id: 7,
        expenseNumber: 'EXP-000007',
        categoryId: 1, // Shop Rent
        title: 'May Shop Lease',
        description: 'Store Rental Main Street',
        amount: 1200.00,
        expenseDate: daysAgo(36),
        paymentMethod: 'Bank',
        referenceNumber: 'TXN-112039',
        vendorName: 'Realty Holdings Ltd.',
        isRecurring: true,
        recurringType: 'Monthly' as const,
        nextRecurringDate: daysAgo(6),
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(36),
        updatedAt: daysAgo(36),
        category: 'Shop Rent',
        isDeleted: false,
      },
      {
        id: 8,
        expenseNumber: 'EXP-000008',
        categoryId: 6, // Salary
        title: 'Staff Salary April',
        description: 'Cashier Wages',
        amount: 2500.00,
        expenseDate: daysAgo(45),
        paymentMethod: 'Cheque',
        referenceNumber: 'CHQ-001882',
        vendorName: 'Jane Smith (Cashier)',
        isRecurring: true,
        recurringType: 'Monthly' as const,
        nextRecurringDate: daysAgo(15),
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(45),
        updatedAt: daysAgo(45),
        category: 'Salary',
        isDeleted: false,
      },
      {
        id: 9,
        expenseNumber: 'EXP-000009',
        categoryId: 10, // Office Supplies
        title: 'Packaging Bags',
        description: 'Packaging Bags & Receipt Rolls',
        amount: 62.00,
        expenseDate: daysAgo(31),
        paymentMethod: 'Cash',
        vendorName: 'Stationery World',
        isRecurring: false,
        status: 'Paid' as const,
        createdBy: 'Admin',
        createdAt: daysAgo(31),
        updatedAt: daysAgo(31),
        category: 'Office Supplies',
        isDeleted: false,
      },
    ];
    await db.expenses.bulkAdd(expenses);

    // 8. Seed Purchases
    const purchases = [
      { id: 1, referenceNo: generatePurchaseRefNo(), supplierId: 1, subtotal: 620.00, discount: 20.00, tax: 30.00, total: 630.00, paidAmount: 630.00, paymentMethod: 'Bank Transfer', status: 'Received', createdAt: daysAgo(25) },
      { id: 2, referenceNo: generatePurchaseRefNo(), supplierId: 2, subtotal: 180.00, discount: 10.00, tax: 5.00, total: 175.00, paidAmount: 175.00, paymentMethod: 'Cash', status: 'Received', createdAt: daysAgo(14) },
      { id: 3, referenceNo: generatePurchaseRefNo(), supplierId: 3, subtotal: 450.00, discount: 0, tax: 22.50, total: 472.50, paidAmount: 472.50, paymentMethod: 'Card', status: 'Received', createdAt: daysAgo(3) },
      { id: 4, referenceNo: generatePurchaseRefNo(), supplierId: 1, subtotal: 350.00, discount: 15.00, tax: 16.75, total: 351.75, paidAmount: 351.75, paymentMethod: 'Bank Transfer', status: 'Received', createdAt: hoursAgo(4) }, // Today
    ];
    await db.purchases.bulkAdd(purchases);

    // Seed Purchase Items
    const purchaseItems = [
      // Purchase 1 Items
      { purchaseId: 1, productId: 1, quantity: 20, cost: 10.00, subtotal: 200.00 },
      { purchaseId: 1, productId: 2, quantity: 12, cost: 35.00, subtotal: 420.00 },
      // Purchase 2 Items
      { purchaseId: 2, productId: 3, quantity: 15, cost: 8.00, subtotal: 120.00 },
      { purchaseId: 2, productId: 4, quantity: 40, cost: 1.50, subtotal: 60.00 },
      // Purchase 3 Items
      { purchaseId: 3, productId: 5, quantity: 20, cost: 15.00, subtotal: 300.00 },
      { purchaseId: 3, productId: 6, quantity: 25, cost: 6.00, subtotal: 150.00 },
      // Purchase 4 Items
      { purchaseId: 4, productId: 1, quantity: 11, cost: 10.00, subtotal: 110.00 },
      { purchaseId: 4, productId: 8, quantity: 2, cost: 120.00, subtotal: 240.00 },
    ];
    await db.purchaseItems.bulkAdd(purchaseItems);

    // 9. Seed Sales and Sale Items (Distributed across history to make charts gorgeous)
    // Create sales spanning today (multiple), yesterday, last 7 days, last 30 days
    const sales = [
      // TODAY
      { id: 1, invoiceNo: generateInvoiceNo(), customerId: 1, subtotal: 110.00, discount: 5.00, tax: 5.00, total: 110.00, paidAmount: 110.00, changeAmount: 0, paymentMethod: 'Cash', status: 'Completed', userId: 1, createdAt: hoursAgo(1) },
      { id: 2, invoiceNo: generateInvoiceNo(), customerId: 2, subtotal: 349.00, discount: 15.00, tax: 16.00, total: 350.00, paidAmount: 0.00, changeAmount: 0, paymentMethod: 'Credit', status: 'Completed', userId: 1, createdAt: hoursAgo(3) }, // Outstanding Credit Sale
      { id: 3, invoiceNo: generateInvoiceNo(), customerId: 3, subtotal: 43.50, discount: 0.00, tax: 2.18, total: 45.68, paidAmount: 50.00, changeAmount: 4.32, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: hoursAgo(6) },
      
      // YESTERDAY
      { id: 4, invoiceNo: generateInvoiceNo(), customerId: 1, subtotal: 155.00, discount: 10.00, tax: 7.75, total: 152.75, paidAmount: 160.00, changeAmount: 7.25, paymentMethod: 'Cash', status: 'Completed', userId: 1, createdAt: daysAgo(1) },
      { id: 5, invoiceNo: generateInvoiceNo(), customerId: 4, subtotal: 120.00, discount: 0, tax: 6.00, total: 126.00, paidAmount: 126.00, changeAmount: 0, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: daysAgo(1) },
      
      // PAST 7 DAYS (Weekly)
      { id: 6, invoiceNo: generateInvoiceNo(), customerId: 3, subtotal: 210.00, discount: 10.00, tax: 10.00, total: 210.00, paidAmount: 210.00, changeAmount: 0, paymentMethod: 'Bank Transfer', status: 'Completed', userId: 1, createdAt: daysAgo(3) },
      { id: 7, invoiceNo: generateInvoiceNo(), customerId: 2, subtotal: 95.00, discount: 5.00, tax: 4.50, total: 94.50, paidAmount: 94.50, changeAmount: 0, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: daysAgo(4) },
      { id: 8, invoiceNo: generateInvoiceNo(), customerId: 1, subtotal: 18.50, discount: 0, tax: 0.90, total: 19.40, paidAmount: 20.00, changeAmount: 0.60, paymentMethod: 'Cash', status: 'Completed', userId: 1, createdAt: daysAgo(5) },
      { id: 9, invoiceNo: generateInvoiceNo(), customerId: 4, subtotal: 350.00, discount: 20.00, tax: 16.50, total: 346.50, paidAmount: 226.50, changeAmount: 0, paymentMethod: 'Credit', status: 'Completed', userId: 1, createdAt: daysAgo(6) }, // Outstanding Credit Sale
      { id: 10, invoiceNo: generateInvoiceNo(), customerId: 3, subtotal: 85.00, discount: 5.00, tax: 4.00, total: 84.00, paidAmount: 84.00, changeAmount: 0, paymentMethod: 'Cash', status: 'Completed', userId: 1, createdAt: daysAgo(7) },

      // LAST 30 DAYS (Monthly)
      { id: 11, invoiceNo: generateInvoiceNo(), customerId: 1, subtotal: 420.00, discount: 20.00, tax: 20.00, total: 420.00, paidAmount: 420.00, changeAmount: 0, paymentMethod: 'Bank Transfer', status: 'Completed', userId: 1, createdAt: daysAgo(12) },
      { id: 12, invoiceNo: generateInvoiceNo(), customerId: 2, subtotal: 185.00, discount: 5.00, tax: 9.00, total: 189.00, paidAmount: 189.00, changeAmount: 0, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: daysAgo(18) },
      { id: 13, invoiceNo: generateInvoiceNo(), customerId: 3, subtotal: 15.00, discount: 0, tax: 0.75, total: 15.75, paidAmount: 20.00, changeAmount: 4.25, paymentMethod: 'Cash', status: 'Completed', userId: 1, createdAt: daysAgo(22) },
      { id: 14, invoiceNo: generateInvoiceNo(), customerId: 4, subtotal: 280.00, discount: 15.00, tax: 13.25, total: 278.25, paidAmount: 278.25, changeAmount: 0, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: daysAgo(28) },
      
      // DEEPER HISTORY (Yearly summary)
      { id: 15, invoiceNo: generateInvoiceNo(), customerId: 1, subtotal: 1200.00, discount: 50.00, tax: 57.50, total: 1207.50, paidAmount: 1207.50, changeAmount: 0, paymentMethod: 'Bank Transfer', status: 'Completed', userId: 1, createdAt: daysAgo(45) },
      { id: 16, invoiceNo: generateInvoiceNo(), customerId: 2, subtotal: 890.00, discount: 40.00, tax: 42.50, total: 892.50, paidAmount: 892.50, changeAmount: 0, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: daysAgo(70) },
      { id: 17, invoiceNo: generateInvoiceNo(), customerId: 3, subtotal: 1350.00, discount: 50.00, tax: 65.00, total: 1365.00, paidAmount: 1365.00, changeAmount: 0, paymentMethod: 'Bank Transfer', status: 'Completed', userId: 1, createdAt: daysAgo(110) },
      { id: 18, invoiceNo: generateInvoiceNo(), customerId: 1, subtotal: 1600.00, discount: 80.00, tax: 76.00, total: 1596.00, paidAmount: 1596.00, changeAmount: 0, paymentMethod: 'Bank Transfer', status: 'Completed', userId: 1, createdAt: daysAgo(160) },
      { id: 19, invoiceNo: generateInvoiceNo(), customerId: 4, subtotal: 950.00, discount: 30.00, tax: 46.00, total: 966.00, paidAmount: 966.00, changeAmount: 0, paymentMethod: 'Card', status: 'Completed', userId: 1, createdAt: daysAgo(220) },
    ];
    await db.sales.bulkAdd(sales);

    // Seed Sale Items
    const saleItems = [
      // Sale 1 items
      { saleId: 1, productId: 2, quantity: 1, price: 85.00, subtotal: 85.00 },
      { saleId: 1, productId: 1, quantity: 1, price: 25.00, subtotal: 25.00 },
      // Sale 2 items
      { saleId: 2, productId: 8, quantity: 1, price: 299.00, subtotal: 299.00 },
      { saleId: 2, productId: 1, quantity: 2, price: 25.00, subtotal: 50.00 },
      // Sale 3 items
      { saleId: 3, productId: 3, quantity: 2, price: 18.50, subtotal: 37.00 },
      { saleId: 3, productId: 4, quantity: 1, price: 3.50, subtotal: 3.50 },
      { saleId: 3, productId: 7, quantity: 1, price: 2.50, subtotal: 2.50 },
      // Sale 4 items
      { saleId: 4, productId: 2, quantity: 1, price: 85.00, subtotal: 85.00 },
      { saleId: 4, productId: 5, quantity: 1, price: 45.00, subtotal: 45.00 },
      { saleId: 4, productId: 7, quantity: 10, price: 2.50, subtotal: 25.00 },
      // Sale 5 items
      { saleId: 5, productId: 6, quantity: 5, price: 18.00, subtotal: 90.00 },
      { saleId: 5, productId: 3, quantity: 1, price: 18.50, subtotal: 18.50 },
      { saleId: 5, productId: 1, quantity: 4, price: 25.00, subtotal: 100.00 },
      // Sale 6 items
      { saleId: 6, productId: 8, quantity: 1, price: 299.00, subtotal: 299.00 },
      // Sale 7 items
      { saleId: 7, productId: 5, quantity: 2, price: 45.00, subtotal: 90.00 },
      // Sale 9 items
      { saleId: 9, productId: 8, quantity: 1, price: 299.00, subtotal: 299.00 },
    ];
    await db.saleItems.bulkAdd(saleItems);

    console.log('Demo database seeded successfully with complete records!');
    return true;
  } catch (error) {
    console.error('Error seeding demo database:', error);
    throw error;
  }
}
