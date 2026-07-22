# Single Shop Retail Management System - User Manual

Welcome to the **Single Shop Retail Management System**. This application is designed to help shop owners, managers, and cashiers handle day-to-day retail sales, stock inventory, supplier ordering, customer credit ledger tracking, and synchronized cloud backups in a seamless, offline-first interface.

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Point of Sale (POS) Terminal](#2-point-of-sale-pos-terminal)
3. [Inventory & Catalog Management](#3-inventory--catalog-management)
4. [Supplier Purchases & Cost Control](#4-supplier-purchases--cost-control)
5. [Customer Credit Ledger (Accounts Receivable)](#5-customer-credit-ledger-accounts-receivable)
6. [Expense Tracking](#6-expense-tracking)
7. [Reports & Business Analytics](#7-reports--business-analytics)
8. [Frequently Asked Questions](#8-frequently-asked-questions)

---

## 1. Getting Started

### The Offline-First Concept
This system is designed with an **offline-first architecture**. It stores all database information locally on your device's browser memory (using IndexedDB). This means:
- You **do not** need an active internet connection to run transactions, create invoices, register customers, or record expenses.
- If your shop's Wi-Fi drops, the system will continue to work perfectly.
- Once internet access is restored, your local operations will automatically sync with your Google Sheets cloud backup.

---

## 2. Point of Sale (POS) Terminal

The POS Terminal is the core engine where cashier transactions are processed.

### How to Conduct a Sale
1. **Navigate to Sales (POS)**: Click on the "Sales" or "POS" option in the main navigation menu.
2. **Add Products to Cart**:
   - **Barcode Scanner**: Scan the item's barcode. The item will instantly appear in the cart.
   - **Manual Search**: Type the product name or SKU in the search input box. Click the product to add it to the cart.
3. **Adjust Quantities & Discounts**:
   - Use the `+` and `-` buttons in the cart list to modify product counts.
   - Click the "Discount" button on individual items to apply line-item markdowns.
   - Apply a flat or percentage order-level discount at the bottom of the invoice if applicable.
4. **Identify Customer**:
   - By default, transactions are allocated to **Walk-in Customer**.
   - If the sale is for a regular client or a credit customer, search and select them in the customer dropdown.
5. **Select Payment Mode**:
   - **Cash**: Enter cash received to automatically calculate change to return.
   - **Credit**: If the selected customer has credit privileges, you can record this transaction as a credit sale, adding to their outstanding ledger balance.
   - **Bank Transfer / Mobile Money**: Record digital transactions for banking audit reconciliations.
6. **Checkout & Invoice Receipt**:
   - Click **Complete Sale**. A printable receipt will generate automatically. You can print it or save it as a PDF.

---

## 3. Inventory & Catalog Management

Keep your catalog up to date to prevent sales blockages and track product availability.

### Category Management
Organize products into hierarchical departments:
- Create categories (e.g., "Beverages", "Snacks", "Electronics").
- Toggle categories to 'Inactive' to temporarily hide their items from the POS catalog without losing records.

### Managing Products
- Go to the **Products** screen.
- Click **Add Product** and fill in:
  - **SKU / Barcode**: Enter manually or click "Generate automatic SKU".
  - **Purchase Price vs. Selling Price**: The system automatically computes your profit margin.
  - **Stock Threshold Alerts**: Set the "Minimum Stock level" value. The system will notify you on the dashboard when stock drops below this limit.

---

## 4. Supplier Purchases & Cost Control

When new stock arrives from suppliers, register a **Purchase** to increment inventory and update average purchase cost.

### Recording a Purchase Order
1. Go to **Purchases** and click **New Purchase**.
2. Select the corresponding **Supplier**.
3. Choose the items being received, specifying the quantity and the exact purchase unit price.
4. Submit the purchase. The system will:
  - Automatically increment the stock level of each item.
  - Update the item's weighted historical purchase cost for accurate profit reports.
  - Log a purchase invoice in the history trail.

---

## 5. Customer Credit Ledger (Accounts Receivable)

For trusted customers allowed to buy goods on account:

- Set a **Credit Limit** in the customer's profile to prevent over-extension.
- When checkout payment is set to "Credit", the sale total is added to their outstanding **Balance**.
- **Receiving Payments**: Go to the **Customer Credit** module, locate the customer, click **Record Payment**, enter the amount paid, and select the payment type. This instantly decrements their credit balance and generates a repayment receipt.

---

## 6. Expense Tracking

Proper cash management requires logging non-inventory expenses.

- Go to the **Expenses** screen.
- Log daily expenses (e.g., "Electricity Bill", "Rent", "Packaging Bags").
- Select an expense category and enter the exact cost.
- Non-inventory expenses are automatically deducted from revenue in the profit and loss report.

---

## 7. Reports & Business Analytics

Analyze your shop's performance via the **Reports** screen.

- **Sales Ledger**: Look at individual invoice breakdowns, filter by dates, or export cash registers.
- **Profit & Loss**: View Gross Revenue, cost of goods sold (COGS), operating expenses, and final Net Profit.
- **Fast-Moving Stock**: Identify which products are driving your revenue and which are slow-moving.

---

## 8. Frequently Asked Questions

#### Q: How do I backup my data?
A: Backups are automated. As long as your Google Sheets configuration is set up in Settings, the system pushes pending items to the cloud. You can also export the database as a JSON file at any time from the Settings tab.

#### Q: Can I run multiple registers at the same time?
A: Each browser stores its own local IndexedDB. For multi-register stores, sync each browser to the same Google Sheet to share catalog information and consolidate sales records.
