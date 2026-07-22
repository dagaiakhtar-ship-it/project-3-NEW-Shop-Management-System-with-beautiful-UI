# Shop Management System & POS Terminal

An ultra-speed, offline-first Point of Sale (POS) terminal and comprehensive Business Intelligence (BI) suite engineered with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Dexie.js (IndexedDB)**, and **Google Gemini AI**.

---

## 📐 High-Level Architecture Overview

The system is built on a hybrid **Client-Centric, Offline-First Architecture** backed by an Express.js server for server-side AI processing and API proxies.

```
                  +-------------------------------------------------------+
                  |                      BROWSER CLIENT                   |
                  |                                                       |
                  |   +-----------------------------------------------+   |
                  |   |            React 19 + TypeScript UI           |   |
                  |   | (POS Terminal, BI Dashboard, Inventory, etc.) |   |
                  |   +-----------------------+-----------------------+   |
                  |                           |                           |
                  |         Zustand Stores & Custom React Hooks           |
                  |  (useAppStore, usePOS, useCart, useSales, authStore)  |
                  |                           |                           |
                  |            +--------------+--------------+            |
                  |            |                             |            |
                  |            v                             v            |
                  |   +-----------------+           +-----------------+   |
                  |   |    Dexie.js     |           |   Sync Queue /  |   |
                  |   |   (IndexedDB)   |           |  Backup Engine  |   |
                  |   |  Local Database |           |  (Local/Cloud)  |   |
                  |   +-----------------+           +-----------------+   |
                  +---------------------------+---------------------------+
                                              |
                                     HTTP / REST API Calls
                                              |
                  +---------------------------v---------------------------+
                  |                  EXPRESS.JS BACKEND                   |
                  |                   (server.ts / Node)                  |
                  |                                                       |
                  |   +-----------------------------------------------+   |
                  |   |          Vite Development Middleware          |   |
                  |   |         or Production Static File Server      |   |
                  |   +-----------------------+-----------------------+   |
                  |                           |                           |
                  |             +-------------+-------------+             |
                  |             |                           |             |
                  |             v                           v             |
                  |    +------------------+       +-------------------+   |
                  |    |  /api/ai Routes  |       |  Server Health /  |   |
                  |    |  (Google GenAI)  |       |    Sync Services  |   |
                  |    +--------+---------+       +-------------------+   |
                  +-------------|-----------------------------------------+
                                |
                        Google Gemini API
                        (GEMINI_API_KEY)
```

---

## 🛠️ Technology Stack

### **Frontend Framework & Tooling**
- **Core Library**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) with `@vitejs/plugin-react`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Animations**: [Framer Motion / Motion](https://www.framer.com/motion/) for fluid page transitions, tactile card lifts, and modal animations
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/) with role-based access control (`ProtectedRoute`, `RoleGuard`)

### **State Management & Offline Storage**
- **State Store**: [Zustand](https://github.com/pmndrs/zustand) (`useAppStore`, `authStore`, `uiStore`, `notificationStore`, `loadingStore`)
- **Offline Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper) with `dexie-react-hooks` for reactive database queries
- **Data Export & PDF**: [jsPDF](https://github.com/parallax/jsPDF) + `jspdf-autotable`, [PapaParse](https://www.papaparse.com/) (CSV), and [SheetJS XLSX](https://sheetjs.com/)
- **Receipt & Invoice Printing**: `react-to-print` with custom HTML/CSS thermal receipt print templates

### **Backend & AI Integrations**
- **Web Server**: Express.js running TypeScript directly in development via `tsx`, bundled into CommonJS (`dist/server.cjs`) via `esbuild` for production
- **AI SDK**: Google GenAI SDK (`@google/genai`) utilizing `gemini-2.5-flash` for server-side business intelligence analysis and natural language assistant queries

---

## 🔑 Core Features & Modules

### 1. 🛒 POS Cashier Terminal (`/sales`)
- **Grid & Quick Search**: Live product grid with instant search filtering, category pill selectors, barcode scanner input support, and quick favorites toggle.
- **Dynamic Cart & Calculations**: Real-time tax rate (`orderTax`), flat or percentage discounts (`orderDiscount`), subtotal calculation, unit price adjustments, and item quantity controls.
- **Multi-Payment Settlement**: Support for Cash, Card, Digital/Mobile Wallet, and Customer Credit/Loan settlements.
- **Automatic Credit Validation**: Checks customer credit limits before placing orders on credit/loan status.
- **Global Keyboard Hotkeys**:
  - `F1`: Quick Product Search
  - `F2`: Barcode Scanner Focus
  - `F3`: Select / Add Customer
  - `F4`: Apply Order Discount
  - `F8`: Checkout Modal
  - `F9`: Quick Cash Sale Completion
  - `Esc`: Close open dialogs or clear search filters
- **Thermal Receipt Printing**: High-fidelity thermal receipt templates with business header, itemized breakdown, tax/discount summaries, and printer selection.

### 2. 📊 Business Intelligence & AI Analytics (`/dashboard`)
- **AI Assistant Panel**: Natural language query interface powered by Gemini 2.5 Flash for asking sales questions, stock alerts, and financial projections.
- **BI Visualizations**: Dynamic revenue, expense, and profit margin graphs built with [Recharts](https://recharts.org/).
- **AI Report Generator**: Generates comprehensive PDF reports with business insights, executive summaries, and action plans.

### 3. 📦 Inventory & Product Catalog (`/products` & `/categories`)
- **Product Management**: SKU generation, barcode generation, cost vs. selling price, stock reorder thresholds, and category classification.
- **Stock Tracking**: Low stock warnings and real-time inventory level deductions on checkout.

### 4. 👥 Customer & Credit Management (`/customers` & `/credit`)
- **Customer Directory**: Contact records, order histories, total lifetime spending, and loyalty tracking.
- **Credit Ledger**: Detailed loan tracking, outstanding credit balances, payment history logs, and credit limit enforcement.

### 5. 🚚 Supplier & Purchase Orders (`/suppliers` & `/purchases`)
- Supplier profiles, purchase order management, inventory intake tracking, and account payable records.

### 6. 💰 Expense Tracking (`/expenses`)
- Categorized business expenses, recurring expense schedules, payment method tracking, and attachment uploads.

### 7. ☁️ Cloud Sync & Data Integrity (`/sync`)
- Offline transaction queuing, backup export (JSON/CSV), restore wizard, and data integrity verification.

---

## 📁 Project Directory Structure

```
shop-management-system/
├── server.ts                    # Express.js backend & Vite development middleware
├── index.html                   # Web application entry template
├── metadata.json                # Applet configuration & metadata
├── package.json                 # Dependencies & script definitions
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript compiler configuration
├── .env.example                 # Environment variables documentation
│
├── src/
│   ├── main.tsx                 # React app bootstrapping & DOM root mount
│   ├── App.tsx                  # Top-level Router & Provider setup
│   │
│   ├── assets/                  # Static fonts, audio, images, icons
│   ├── config/                  # App branding & theme configurations
│   ├── constants/               # System constants & enum mappings
│   ├── contexts/                # React Contexts (AppearanceContext, PrintContext)
│   ├── database/                # Dexie.js schema definition & database helper modules
│   │   ├── db.ts                # Dexie DB instance & table definitions
│   │   ├── dbSeeder.ts          # Default data seeder
│   │   ├── salesHelper.ts       # POS sale transactions helper
│   │   ├── productHelper.ts     # Product & stock DB helper
│   │   └── customerHelper.ts    # Customer & credit DB helper
│   │
│   ├── hooks/                   # Custom application hooks
│   │   ├── usePOS.ts            # POS cashier state engine
│   │   ├── useCart.ts           # Shopping cart manager
│   │   ├── useSales.ts          # Sales history & analytics query hook
│   │   ├── useSaleCalculations.ts# Tax, discount, and balance calculation logic
│   │   ├── useAuth.ts           # Authentication & role hook
│   │   ├── usePDF.ts            # PDF document builder hook
│   │   └── usePrint.ts          # Thermal receipt print trigger hook
│   │
│   ├── layouts/                 # Page Layouts (MainLayout, DashboardLayout, AuthLayout)
│   ├── pages/                   # Application Page Views
│   │   ├── Sales.tsx            # POS Terminal main page
│   │   ├── Products.tsx         # Inventory management
│   │   ├── Customers.tsx        # Customer directory & credit profiles
│   │   ├── Purchases.tsx        # Supplier purchase orders
│   │   ├── Expenses.tsx         # Expense manager
│   │   ├── CloudSync.tsx        # Backup, restore & sync manager
│   │   └── dashboard/
│   │       └── Dashboard.tsx    # Business Intelligence & analytics
│   │
│   ├── components/              # Modular UI Components
│   │   ├── ai/                  # AI Assistant drawer & report views
│   │   ├── auth/                # Login, ProtectedRoute, RoleGuard
│   │   ├── common/              # MotionComponents, Toast, Breadcrumb
│   │   ├── dashboard/           # BiAnalyticsHub, BiKpiGrid, Charts
│   │   ├── pos/                 # POS Terminal subcomponents
│   │   │   ├── new/             # Modular POS UI (ProductGrid, PaymentPanel, BillSummary, CartCard, POSHeader)
│   │   │   ├── SalesHistoryTable.tsx
│   │   │   └── SaleDetailsModal.tsx
│   │   └── ui/                  # Buttons, Modals, Inputs, Badges
│   │
│   ├── routes/                  # React Router definitions (`router.tsx`)
│   ├── services/                # Business services (AIReportService, PDFService, SyncService)
│   ├── store/                   # Zustand global stores (`useAppStore`, `authStore`, `uiStore`)
│   ├── styles/                  # Tailwind CSS import & print stylesheet overrides
│   └── utils/                   # Formatters, currency helpers, audit logger, math calculations
```

---

## ⚡ Data Flow & Persistence Architecture

1. **Offline-First Persistence**:
   All core transactional entities (Products, Categories, Sales, Customers, Expenses, Purchases) are stored locally in **IndexedDB** using **Dexie.js**. The application remains 100% operational even without an active internet connection.

2. **State Synchronization**:
   - Component state reads directly from Dexie live queries using `useLiveQuery` from `dexie-react-hooks`.
   - UI updates trigger atomic IndexedDB transactions via helper modules (e.g., `salesHelper.ts`), automatically deducting product stock levels and updating customer credit ledgers.

3. **Server Proxy & AI Integration**:
   - AI calls pass from the browser to `/api/ai/*` on the Express backend.
   - The backend accesses the `GEMINI_API_KEY` environment variable securely to invoke `@google/genai`, preventing any API keys from leaking to client-side assets.

---

## 🚀 Running the Application Locally

### **Prerequisites**
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### **1. Install Dependencies**
```bash
npm install
```

### **2. Environment Setup**
Create a `.env` file in the project root or copy from `.env.example`:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

### **3. Start Development Server**
```bash
npm run dev
```
The application will launch on **`http://localhost:3000`**.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

This executes a two-step build process:
1. `vite build`: Compiles client-side React assets into the `dist/` folder.
2. `esbuild server.ts`: Bundles the Express backend into a standalone CommonJS file (`dist/server.cjs`).

### **Start Production Server**
```bash
npm start
```
Runs `node dist/server.cjs` on port `3000`.

---

## 📄 License

This project is proprietary and built for enterprise shop management, cashier POS operations, and data analytics. All rights reserved.
