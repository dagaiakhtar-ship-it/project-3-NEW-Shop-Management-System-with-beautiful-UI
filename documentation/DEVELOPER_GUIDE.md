# Developer Guide, API Doc, Database Schema & Troubleshooting Manual

This guide is designed for frontend developers, software maintainers, and security auditors looking to extend, debug, or deploy the **Single Shop Retail Management System**.

---

## 1. Directory Structure

```bash
/
├── .env.example              # Sample environment variables template
├── index.html                # Vite SPA template entry point
├── package.json              # App dependencies, scripts and build metadata
├── server.ts                 # Full-Stack Express Server (handles Vite in Dev, static build in Prod)
├── tsconfig.json             # TypeScript rules configuration
├── vite.config.ts            # Vite compiler configuration
│
└── src/
    ├── main.tsx              # Main React hydration mountpoint
    ├── App.tsx               # Primary layout router and state initializer
    ├── index.css             # Global Tailwind CSS imports
    ├── types.ts              # Global TypeScript types and domain entities
    │
    ├── components/           # Extracted UI components
    │   ├── layout/           # Sidebar, Navbar, and Outer Wrappers
    │   └── settings/         # SystemAuditPanel & configuration drawers
    │
    ├── database/
    │   └── db.ts             # Dexie.js core database definition & Sync/Audit Hooks
    │
    ├── hooks/                # Business calculation Hooks
    │   ├── useDashboard.ts   # Core analytics calculations
    │   └── useSaleCalculations.ts # POS checkout ledger math
    │
    ├── pages/                # Route level panels (Sales, Products, Expenses, Settings, etc.)
    │
    └── utils/                # Standard utility formatters
        ├── helpers.ts        # Currency formatters, date builders, SKU generators
        └── testSuite.ts      # Interactive Automated QA testing suite code
```

---

## 2. Database Schema Documentation (IndexedDB / Dexie)

The system uses `Dexie.js` to structure the client-side IndexedDB collections. Below are the primary entity schemas:

### Products Table (`db.products`)
- **Key Path**: `++id` (Auto-increment)
- **Indexes**: `sku`, `barcode`, `categoryId`, `supplierId`, `status`
- **Fields**:
  - `name`: `string`
  - `sku`: `string`
  - `barcode`: `string`
  - `categoryId`: `number` (Foreign Key referencing categories)
  - `purchasePrice`: `number`
  - `sellingPrice`: `number`
  - `currentStock`: `number`
  - `minimumStock`: `number`
  - `status`: `'Active' | 'Inactive'`
  - `createdAt`: `Date`
  - `updatedAt`: `Date`

### Categories Table (`db.categories`)
- **Key Path**: `++id`
- **Indexes**: `name`, `status`
- **Fields**:
  - `name`: `string`
  - `status`: `'Active' | 'Inactive'`
  - `createdAt`: `Date`

### Customers Table (`db.customers`)
- **Key Path**: `++id`
- **Indexes**: `customerCode`, `phone`, `status`, `isDeleted`
- **Fields**:
  - `fullName`: `string`
  - `customerCode`: `string`
  - `phone`: `string`
  - `balance`: `number` (outstanding credits)
  - `status`: `'Active' | 'Inactive' | 'Blocked'`
  - `isDeleted`: `boolean` (soft delete indicator)

### Sales Table (`db.sales`)
- **Key Path**: `++id`
- **Indexes**: `invoiceNo`, `customerId`, `saleDate`
- **Fields**:
  - `invoiceNo`: `string`
  - `customerId`: `number`
  - `subtotal`: `number`
  - `discount`: `number`
  - `tax`: `number`
  - `grandTotal`: `number`
  - `paidAmount`: `number`
  - `paymentMethod`: `string`
  - `createdAt`: `Date`

### Sync Queue Table (`db.syncQueue`)
- **Key Path**: `++id`
- **Indexes**: `table`, `recordId`, `action`, `status`
- **Fields**:
  - `table`: `string` (e.g., `'products'`)
  - `recordId`: `number | string`
  - `action`: `'CREATE' | 'UPDATE' | 'DELETE'`
  - `recordData`: `string` (JSON stringified object properties for backup transmission)
  - `status`: `'Pending' | 'Success' | 'Failed'`

---

## 3. Database Event Interceptors (Hooks)

To ensure sync telemetry and tamper-evident audit logs, `db.ts` registers Dexie collection hooks. Here is a description of their technical implementation:

- **Creating Hook**: Triggered whenever `.add()` is called. Injects `createdAt` and `updatedAt` dates, generates `syncStatus: 'Pending'` metadata, and inserts a `CREATE` event block into `syncQueue`.
- **Updating Hook**: Injects updated `updatedAt` timestamps and registers `UPDATE` queue blocks.
- **Deleting Hook**: Triggered upon physical record deletion. Saves the full stringified object copy inside `syncQueue` as a `'DELETE'` event so the record can be deleted from the Google Sheets cloud backup.

---

## 4. Troubleshooting Guide

### Issue 1: "Dev Server appears stale or CSS is broken"
- **Cause**: Port 3000 conflicts or stale cache.
- **Fix**: Restart the container dev server using the dev tools or run a compilation check to ensure typescript is happy:
  ```bash
  npm run build
  ```

### Issue 2: "Synchronizations are showing failed or red"
- **Cause**: The Google Sheets Apps Script Web App was deployed with incorrect access permissions.
- **Fix**: Open the Google Apps Script project. Click **Deploy** -> **Manage deployments**. Ensure that **Who has access** is set to **Anyone**. This is crucial, as setting it to "Only Myself" will result in CORS failures inside browser transactions.

### Issue 3: "Disk quota exceeded or database has slow lookups"
- **Cause**: Large base64 thumbnails or oversized audit logs.
- **Fix**: Go to **Settings** -> **System Audit Panel**, click **Prune Logs Older than 30 days**. This purges diagnostic trails while maintaining catalog and transaction totals.

### Issue 4: "Sales calculation mismatch on line-items vs invoices"
- **Cause**: Javascript floating-point math rounding.
- **Fix**: All core POS calculations in `useSaleCalculations.ts` leverage safe formatting helpers that round monetary values to 2 decimal places before totals are finalized. Always ensure values pass the automated Test Suite.
