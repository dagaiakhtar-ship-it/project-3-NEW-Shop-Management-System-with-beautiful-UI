# Single Shop Retail Management System - Administrator Manual & Backup Guide

This guide is written for administrators, system operators, and IT support technicians responsible for maintaining the database integrity, system configurations, and data recovery strategies.

---

## Table of Contents
1. [System Diagnostics & Health Audits](#1-system-diagnostics--health-audits)
2. [Data Repair & Field Synchronization](#2-data-repair--field-synchronization)
3. [Database Backups & Disaster Recovery](#3-database-backups--disaster-recovery)
4. [Security & Access Logs](#4-security--access-logs)
5. [Storage Maintenance](#5-storage-maintenance)

---

## 1. System Diagnostics & Health Audits

The system contains an integrated **System Diagnostics and Database Audit Panel** accessible via the Settings module. This panel monitors:

- **Connectivity Status**: Confirms whether the current environment is connected to the Internet or working offline.
- **IndexedDB Storage Metrics**: Monitors the browser storage allocation quota. Displays current disk space consumed and percentage of browser space remaining.
- **Table Registry Health**: Confirms the number of active rows across all system collections (Categories, Products, Customers, Sales, Expenses, and Sync Queue).
- **Google Sheets Sync Bond**: Validates whether the active terminal is bonded to the Google Apps Script endpoint.

---

## 2. Data Repair & Field Synchronization

If any operational metrics appear corrupted (e.g., a product stock showing `NaN` due to manual imports, or interrupted server backups):

### Verification & Self-Repair
1. Go to **Settings** -> **System Audit Panel**.
2. Locate the **Operator Diagnostics & Self-Repair Toolbar**.
3. Click **Verify Integrity & Repaired Fields**.
4. The system will perform a non-destructive scan of all tables, search for missing timestamp properties, replace `NaN` quantities with `0`, verify key relationships, and log a permanent repair receipt.

### Retry Stuck Backup Syncs
If a browser was offline for a long period, or the Google Sheets API server suffered a transient downtime:
1. Identify the number of failed backups displayed in the repair button: `Process Sync Queue (X failed)`.
2. Click **Process Sync Queue**.
3. The system will sequentially retry replaying each failed write transaction to the cloud sheets.

---

## 3. Database Backups & Disaster Recovery

Since this is an offline-first application, maintaining reliable backups is crucial to prevent loss of local ledger entries.

### Method A: Automated Cloud Mirror (Google Sheets)
- **Concept**: Every write transaction (Create, Update, Delete) is intercepted by database hooks. Successful operations append to a `syncQueue` which sends a mirroring request to the configured Google Apps Script Web App.
- **Recovery**: In the event of device failure, configure the newly deployed app with the identical Sheets Web App URL, and click "Restore from Google Sheets".

### Method B: Manual JSON Database Export
To create a cold-offline backup on physical media:
1. Navigate to **Settings**.
2. Click **Export Local Database (JSON)**.
3. This downloads a single, comprehensive file containing all tables, complete with relational IDs and date formats preserved.
4. **Restoring**: To restore a JSON backup:
   - Click **Import Local Database (JSON)**.
   - Select your saved JSON file.
   - *Warning*: This will replace the local IndexedDB instance entirely with the backup state.

---

## 4. Security & Access Logs

To prevent internal fraud and audit operational ledger anomalies, the system records **Cashier & Database Audit Trails** for every write transaction.

### Reading Audit Trails
- Displays the executing operator, their role (e.g. Administrator, Cashier), action, target module, description, and high-precision UTC timestamp.
- **Filtering**: Filter logs by module (e.g. "Sales", "Inventory") or action type ("CREATE", "UPDATE", "DELETE", "Repair").
- **Purging**: Historical log files can grow large over time. To prune old records, click **Prune Logs Older than 30 days**. This safely deletes past log items without affecting actual sales, inventory, or customers.

---

## 5. Storage Maintenance

Browsers enforce dynamic storage quotas on IndexedDB (usually based on available hard disk space). To ensure the terminal never hits a storage threshold:
- Avoid importing high-resolution images in base64 format for product thumbnails.
- Run the log pruning procedure monthly.
- Frequently verify that the sync queue has zero pending items.
