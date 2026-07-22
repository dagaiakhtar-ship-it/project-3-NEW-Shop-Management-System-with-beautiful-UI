<!-- =====================================================================
     🎨  SHOP MANAGEMENT SYSTEM & POS TERMINAL — GitHub README (v2)
     ---------------------------------------------------------------------
     ✅ ZERO-CONFIG: every image below loads from Shields.io / placehold.co
        or is a native GitHub Mermaid diagram. Nothing to upload.

     🖼️  TO USE YOUR REAL SCREENSHOTS LATER (optional, 30 sec each):
        1. Create folder  assets/  and add your PNGs.
        2. Find & replace the matching placehold.co URL with the asset path.

        CARD                 ->  REPLACE ITS placehold.co URL WITH
        ─────────────────────────────────────────────────────────────
        Hero banner          ->  assets/pos-terminal.png
        "POS Terminal" card  ->  assets/pos-terminal.png
        "BI Dashboard" card  ->  assets/dashboard.png
        "Inventory" card     ->  assets/inventory.png
        "Customers" card     ->  assets/customers.png
        "Cloud Sync" card    ->  assets/cloud-sync.png
        "Secure Auth" card   ->  assets/login.png
===================================================================== -->

<div align="center">

# 🛒 Shop Management System & POS Terminal

### Offline‑First · AI‑Powered · Blazing Fast

An ultra‑speed, **offline‑first** Point of Sale terminal and full **Business Intelligence** suite — built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Dexie.js (IndexedDB)** and **Google Gemini AI**.

<!-- status row (Shields.io — always renders) -->
![Status](https://img.shields.io/badge/Status-Production_Ready-22C55E?style=flat-square)
![Offline](https://img.shields.io/badge/Offline--First-100%25-8B5CF6?style=flat-square)
![AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?style=flat-square&logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-111827?style=flat-square)

</div>

---

<!-- ============================  HERO  ============================ -->
<div align="center">

<img src="https://placehold.co/1200x520/0F172A/38BDF8?text=POS+TERMINAL+%C2%B7+LIVE+CART+%C2%B7+MULTI-PAY+CHECKOUT&font=roboto" alt="POS Terminal hero" width="92%" />

<sub>A tactile, keyboard‑driven cashier experience — live cart, multi‑payment checkout, instant product search. <i>(placeholder — swap with <code>assets/pos-terminal.png</code>)</i></sub>

</div>

---

<!-- ======================  TECH BADGES  ====================== -->
<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

<br/>

![Zustand](https://img.shields.io/badge/State-Zustand-F59E0B?style=flat-square&logo=react&logoColor=white)
![Dexie](https://img.shields.io/badge/DB-Dexie.js_/_IndexedDB-EF4444?style=flat-square)
![Recharts](https://img.shields.io/badge/Charts-Recharts-10B981?style=flat-square)
![jsPDF](https://img.shields.io/badge/Export-jsPDF_/_XLSX_/_CSV-7C3AED?style=flat-square)
![Framer](https://img.shields.io/badge/Motion-Framer_Motion-EC4899?style=flat-square)
![Router](https://img.shields.io/badge/Routing-React_Router_v7-CA4245?style=flat-square)

</div>

---

## 📖 Overview

> Run an entire shop from a single browser tab. Sell, track inventory, manage credit, and generate **AI‑written financial reports** — *even with the internet unplugged.* When you reconnect, everything syncs.

<table>
<tr>
<td width="50%">

### ⚡ Why it's different
- 🚀 **Sub‑second** UI on commodity hardware
- 📴 **100 % offline** — IndexedDB is the source of truth
- 🤖 **Gemini‑powered** BI assistant & report writer
- ⌨️ **Hotkey‑first** cashier workflow (F1–F9)
- 🧾 **Pixel‑perfect** thermal receipt printing

</td>
<td width="50%">

### 🎯 Built for
- 🏪 Retail & grocery shops
- ☕ Cafés & quick‑service counters
- 📦 Wholesale & credit‑based trade
- 📊 Owners who want **real** analytics
- 🌍 Regions with **unreliable internet**

</td>
</tr>
</table>

---

## 🧭 Table of Contents

- [🖼️ Screenshots](#-screenshots)
- [✨ Core Features](#-core-features)
- [🏗️ Architecture](#-architecture)
- [⚡ Data Flow & Persistence](#-data-flow--persistence)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [📦 Production Build](#-production-build)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [📄 License](#-license)

---

## 🖼️ Screenshots

> *Styled placeholders — replace each with your own PNG via the mapping at the top of this file.*

<div align="center">
<table>
<tr>
<td align="center" width="50%"><img src="https://placehold.co/600x360/1E3A8A/FFFFFF?text=POS+TERMINAL&font=roboto" alt="POS"/><br/><sub><b>🛒 POS Terminal</b><br/>Grid · cart · multi‑pay</sub></td>
<td align="center" width="50%"><img src="https://placehold.co/600x360/4338CA/FFFFFF?text=BI+%26+AI+ANALYTICS&font=roboto" alt="BI"/><br/><sub><b>📊 BI & AI Analytics</b><br/>KPIs · charts · Gemini</sub></td>
</tr>
<tr>
<td align="center"><img src="https://placehold.co/600x360/0E7490/FFFFFF?text=INVENTORY+%26+CATALOG&font=roboto" alt="Inventory"/><br/><sub><b>📦 Inventory & Catalog</b><br/>SKU · stock · reorder</sub></td>
<td align="center"><img src="https://placehold.co/600x360/047857/FFFFFF?text=CUSTOMERS+%26+CREDIT&font=roboto" alt="Customers"/><br/><sub><b>👥 Customers & Credit</b><br/>ledger · limits · loyalty</sub></td>
</tr>
<tr>
<td align="center"><img src="https://placehold.co/600x360/B45309/FFFFFF?text=CLOUD+SYNC+%26+BACKUP&font=roboto" alt="Sync"/><br/><sub><b>☁️ Cloud Sync & Backup</b><br/>queue · export · restore</sub></td>
<td align="center"><img src="https://placehold.co/600x360/BE123C/FFFFFF?text=ROLE-BASED+AUTH&font=roboto" alt="Auth"/><br/><sub><b>🔐 Role‑Based Auth</b><br/>login · guards · roles</sub></td>
</tr>
</table>
</div>

---

## ✨ Core Features

<table>
<tr>
<td width="33%" valign="top">

### 🛒 POS Cashier
Live product grid, instant search, barcode scanner, favorites, dynamic tax & discount engine, multi‑payment settlement (Cash · Card · Wallet · Credit).

</td>
<td width="33%" valign="top">

### 📊 BI & AI Analytics
Ask your business questions in plain English. Gemini 2.5 Flash returns insights, stock alerts, projections & **auto‑generated PDF reports**.

</td>
<td width="33%" valign="top">

### 📦 Inventory
SKU & barcode generation, cost vs. sell price, reorder thresholds, low‑stock warnings, atomic stock deduction on checkout.

</td>
</tr>
<tr>
<td valign="top">

### 👥 Customers & Credit
Lifetime spend tracking, loyalty history, full credit ledger, payment logs, **automatic credit‑limit enforcement**.

</td>
<td valign="top">

### 🚚 Suppliers & Purchases
Supplier profiles, purchase orders, inventory intake, accounts‑payable records — all linked to stock movements.

</td>
<td valign="top">

### 💰 Expenses & ☁️ Sync
Categorized & recurring expenses with attachments. Offline queue, JSON/CSV backup, restore wizard, integrity checks.

</td>
</tr>
</table>

---

## 🏗️ Architecture

A **hybrid, client‑centric, offline‑first** design. The browser owns the data; the Express server only serves files, proxies AI calls, and guards secrets.

```mermaid
flowchart TB
    subgraph Client["🌐 BROWSER CLIENT"]
        UI["<b>React 19 + TypeScript UI</b><br/>POS · BI · Inventory · Customers"]
        State["Zustand Stores & Hooks<br/><i>useAppStore · usePOS · useCart · useSales · authStore</i>"]
        DB[("🗄️ Dexie.js<br/>IndexedDB")]
        Sync["🔄 Sync Queue /<br/>Backup Engine"]
        UI --> State
        State --> DB
        State --> Sync
    end

    subgraph Server["⚙️ EXPRESS.JS BACKEND  (server.ts / Node)"]
        Vite["Vite Dev Middleware /<br/>Production Static Server"]
        AI["🤖 /api/ai Routes<br/>(Google GenAI)"]
        Health["❤️ Health / Sync Services"]
        Vite --> AI
        Vite --> Health
    end

    Client <-->|HTTP / REST| Server
    AI -->|GEMINI_API_KEY| Gemini(("✨ Google<br/>Gemini API"))

    classDef client fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E;
    classDef server fill:#EEF2FF,stroke:#4F46E5,color:#312E81;
    classDef ai     fill:#FEF3C7,stroke:#D97706,color:#78350F;
    class Client client;
    class Server server;
    class Gemini ai;
```

---

## ⚡ Data Flow & Persistence

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Cashier
    participant UI as React UI
    participant H as Hooks / Helpers
    participant DB as Dexie (IndexedDB)
    participant S as Express Server
    participant G as Gemini API

    U->>UI: Add item / Checkout
    UI->>H: dispatch action
    H->>DB: atomic transaction<br/>(deduct stock, update ledger)
    DB-->>UI: useLiveQuery() pushes update
    Note over UI,DB: ✅ Works fully OFFLINE

    U->>UI: "Ask AI" question
    UI->>S: POST /api/ai/*
    S->>G: GEMINI_API_KEY (server-side)
    G-->>S: insights
    S-->>UI: JSON answer
```

- **Offline‑first:** Products, Sales, Customers, Expenses & Purchases live in IndexedDB — **100 % functional** without internet.
- **Reactive reads:** components subscribe via `useLiveQuery`.
- **Atomic writes:** helpers (e.g. `salesHelper.ts`) deduct stock and update credit ledgers in one transaction.
- **Secure AI:** keys never touch the client — the browser calls `/api/ai/*`, the server injects `GEMINI_API_KEY`.

---

## 📁 Project Structure

```text
shop-management-system/
 ├── server.ts                 # Express backend + Vite dev middleware
 ├── index.html                # Web entry template
 ├── metadata.json             # Applet config & metadata
 ├── package.json              # Dependencies & scripts
 ├── vite.config.ts            # Vite build config
 ├── tsconfig.json             # TS compiler config
 ├── .env.example              # Env variable docs
 │
 └── src/
     ├── main.tsx              # React bootstrap & DOM mount
     ├── App.tsx               # Router & Providers
     ├── assets/               # Fonts, audio, images, icons
     ├── config/               # Branding & theme
     ├── constants/            # Enums & system constants
     ├── contexts/             # AppearanceContext, PrintContext
     ├── database/             # Dexie schema + helpers
     │   ├── db.ts             # DB instance & tables
     │   ├── dbSeeder.ts       # Default data seeder
     │   ├── salesHelper.ts    # POS transactions
     │   ├── productHelper.ts  # Product & stock
     │   └── customerHelper.ts # Customer & credit
     ├── hooks/                # usePOS · useCart · useSales · useAuth · usePDF · usePrint …
     ├── layouts/              # Main · Dashboard · Auth layouts
     ├── pages/                # Sales · Products · Customers · Purchases · Expenses · CloudSync · Dashboard
     ├── components/
     │   ├── ai/               # AI assistant drawer & reports
     │   ├── auth/             # Login · ProtectedRoute · RoleGuard
     │   ├── common/           # MotionComponents · Toast · Breadcrumb
     │   ├── dashboard/        # BiAnalyticsHub · KpiGrid · Charts
     │   ├── pos/new/          # ProductGrid · PaymentPanel · BillSummary · CartCard · POSHeader
     │   └── ui/               # Buttons · Modals · Inputs · Badges
     ├── routes/router.tsx     # React Router definitions
     ├── services/             # AIReportService · PDFService · SyncService
     ├── store/                # useAppStore · authStore · uiStore
     ├── styles/               # Tailwind import + print overrides
     └── utils/                # Formatters · currency · audit logger · math
```

---

## 🚀 Getting Started

### ✅ Prerequisites
- **Node.js** ≥ `v18.x`
- **npm** ≥ `v9.x`

### 1️⃣ Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### 2️⃣ Configure environment
```bash
cp .env.example .env
```
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

### 3️⃣ Run the dev server
```bash
npm run dev
```
🌐 Open **http://localhost:3000**

---

## 📦 Production Build

```bash
npm run build      # vite build  +  esbuild server.ts → dist/server.cjs
npm start          # node dist/server.cjs  (serves on :3000)
```

| Step | Command | Output |
|------|---------|--------|
| Client bundle | `vite build` | `dist/` (static assets) |
| Server bundle | `esbuild server.ts` | `dist/server.cjs` (CommonJS) |
| Launch | `npm start` | `node dist/server.cjs` |

---

## ⌨️ Keyboard Shortcuts

The POS terminal is built for **hands‑on‑keyboard** speed.

| Key | Action |   | Key | Action |
|:---:|--------|---|:---:|--------|
| `F1` | Quick product search |   | `F8` | Open checkout modal |
| `F2` | Focus barcode scanner |   | `F9` | Quick **cash** sale |
| `F3` | Select / add customer |   | `Esc` | Close dialog / clear |
| `F4` | Apply order discount |   |     |     |

---

## 📄 License

> This project is **proprietary** and built for enterprise shop management, cashier POS operations, and data analytics. **All rights reserved.**

---

<div align="center">

### 💙 Built with caffeine, TypeScript & a love for offline‑first design

**Shop Management System & POS Terminal**

</div>

<!-- =====================================================================
     OPTIONAL: Star History chart.
     NOT rendered by default (a placeholder repo would show a broken image).
     When your repo is public, paste this block OUTSIDE the comment and
     replace YOUR_USERNAME / YOUR_REPO:

<a href="https://star-history.com/#YOUR_USERNAME/YOUR_REPO&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=YOUR_USERNAME/YOUR_REPO&type=Date&theme=dark" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=YOUR_USERNAME/YOUR_REPO&type=Date" width="70%"/>
 </picture>
</a>
===================================================================== -->