import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';

interface ModulePermission {
  module: string;
  description: string;
  adminAccess: 'full' | 'none';
  cashierAccess: 'full' | 'none' | 'view_only';
}

const PERMISSIONS_LIST: ModulePermission[] = [
  { module: 'Dashboard', description: 'View general statistics, revenue charts, and transaction totals.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'POS / Checkout Counter', description: 'Scan barcodes, create invoice sales, and collect payments.', adminAccess: 'full', cashierAccess: 'full' },
  { module: 'Products Catalog', description: 'Add, edit, archive, and view stock inventory records.', adminAccess: 'full', cashierAccess: 'full' },
  { module: 'Category Management', description: 'Configure product collections, display structures, and order values.', adminAccess: 'full', cashierAccess: 'full' },
  { module: 'Customer Ledger', description: 'Register customer profiles, track contact lines, and modify balances.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'Customer Credit & Debt', description: 'Monitor credit lines, log credit payments, and check due warnings.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'Suppliers Inventory', description: 'Add, edit, and record wholesale bulk supply transactions.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'Purchases Intake logs', description: 'Log stock procurement, supplier invoice references, and pricing indices.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'Expense Ledger', description: 'Track store operating costs, rent, utilities, and daily payments.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'Reports & Audits', description: 'Generate high-level sales trends, profit charts, and CSV data files.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'Cloud Synchronization & Backup', description: 'Synchronize Dexie data to Google Sheets spreadsheet rows manually.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'System Settings & Profile', description: 'Control shop profile header text, receipts widths, and defaults.', adminAccess: 'full', cashierAccess: 'none' },
  { module: 'System Users Control', description: 'Create, deactivate, and reset passwords for system operators.', adminAccess: 'full', cashierAccess: 'none' },
];

export const PermissionTable: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 text-left select-none">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Access Control Matrix</h3>
        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 leading-normal">
          Check module clearance levels and operations based on user security roles (Administrator vs Cashier).
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-850">
        <table className="w-full text-left border-collapse bg-white dark:bg-slate-950">
          <thead>
            <tr className="bg-slate-50/60 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-850 text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500 tracking-wider">
              <th className="px-4 py-2.5">System Module</th>
              <th className="px-4 py-2.5">Module Description</th>
              <th className="px-4 py-2.5 text-center">Administrator</th>
              <th className="px-4 py-2.5 text-center">Cashier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-350">
            {PERMISSIONS_LIST.map((row) => (
              <tr key={row.module} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white shrink-0">
                  {row.module}
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-450 dark:text-slate-500 font-semibold leading-relaxed max-w-xs md:max-w-md">
                  {row.description}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.adminAccess === 'full' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold tracking-wide uppercase mx-auto">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Full Access</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[9px] font-extrabold tracking-wide uppercase mx-auto">
                      <ShieldAlert className="h-3 w-3" />
                      <span>No Access</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.cashierAccess === 'full' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold tracking-wide uppercase mx-auto">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Full Access</span>
                    </span>
                  ) : row.cashierAccess === 'view_only' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold tracking-wide uppercase mx-auto">
                      <HelpCircle className="h-3 w-3" />
                      <span>View Only</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[9px] font-extrabold tracking-wide uppercase mx-auto">
                      <ShieldAlert className="h-3 w-3" />
                      <span>No Access</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionTable;
