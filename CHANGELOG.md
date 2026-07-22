# Changelog - Single Shop Retail Management System

All notable changes to this project are documented in this file. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-09 (Stable Production Release)

### Added
- **Automated QA Test Suite & Diagnostic Runner**: Introduced an in-browser test runner in the **System Audit Panel** capable of running live integration, calculation, database transaction, and soft-delete assertion tests with clean database isolation and teardown.
- **System Audit & Self-Repair Panel**: Created a robust diagnostics center to monitor device connectivity, IndexedDB disk space quotas, database row registries, and Sheets sync status.
- **Enterprise-Grade Documentation Suite**:
  - `USER_MANUAL.md`: Cashier and POS operations guide.
  - `ADMINISTRATOR_MANUAL.md`: Data repair and cold-backup procedures.
  - `GOOGLE_SHEETS_SETUP.md`: Comprehensive step-by-step Apps Script integration and deployment tutorial.
  - `DEVELOPER_GUIDE.md`: Full architecture, schema definitions, and Dexie transaction hook details.
  - `INSTALLATION_AND_DEPLOYMENT.md`: Command-line setup, multi-stage production bundling, and dockerization guides.

### Fixed
- **Dexie.js Table Typing**: Resolved key-path mapping errors where timestamps were missing on schema insertion during repair scripts.
- **Linter Failures**: Patched incorrect typed arrays casting and undefined property access during dynamic audit log filtering.
- **Rounding Math**: Hardened monetary logic in checkout models to guard against floating-point errors by sanitizing and rounding decimal values.

### Optimized
- **Production Asset Packaging**: Bundled backend server components into a single, static-linked `dist/server.cjs` via `esbuild` for immediate container startups and zero relative path resolution overhead.
- **Audit Trails**: Added a 30-day historical pruning script to keep IndexedDB database overhead light and prevent memory leaks on large datasets.
- **Offline Reliability**: Restructured the synchronization queue with automatic retry support and serialized delete preservation.
