import React from 'react';
import { type Expense } from '../../database/db';
import ExpenseStatusBadge from './ExpenseStatusBadge';
import { Calendar, Tag, Landmark, User, CreditCard, Clock, Printer, X, Download, FileText, CheckCircle } from 'lucide-react';
import { usePDF } from '../../hooks/usePDF';
import { PDFButton, PDFPreviewDialog } from '../common/PDFComponents';

interface ExpenseDetailsProps {
  expense: Expense & { categoryName: string; categoryColor: string; categoryIcon: string };
  onClose: () => void;
  onEdit?: () => void;
  id?: string;
}

export const ExpenseDetails: React.FC<ExpenseDetailsProps> = ({
  expense,
  onClose,
  onEdit,
  id = 'expense-details',
}) => {
  const { isGenerating, previewUrl, closePreview, generateExpense } = usePDF();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    // Open a beautifully styled print window for the Voucher
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const categoryText = expense.categoryName;
    const amountText = formatCurrency(expense.amount);
    const dateText = formatDate(expense.expenseDate);

    printWindow.document.write(`
      <html>
        <head>
          <title>Expense Voucher - ${expense.expenseNumber}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #1e293b;
              padding: 40px;
              line-height: 1.5;
            }
            .voucher-container {
              max-width: 650px;
              margin: 0 auto;
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .company-title {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: -0.025em;
              text-transform: uppercase;
              color: #4f46e5;
            }
            .voucher-title {
              font-size: 14px;
              font-weight: 700;
              background: #f1f5f9;
              padding: 6px 14px;
              border-radius: 20px;
              color: #475569;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            .grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 16px;
              margin-bottom: 28px;
            }
            .label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .value {
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
            }
            .amount-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              margin-bottom: 28px;
            }
            .amount-val {
              font-size: 32px;
              font-weight: 900;
              color: #ef4444;
              margin: 4px 0 0 0;
            }
            .notes {
              background: #f8fafc;
              padding: 16px;
              border-radius: 12px;
              font-size: 13px;
              color: #475569;
              margin-bottom: 36px;
              border-left: 4px solid #cbd5e1;
            }
            .signature-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 40px;
              margin-top: 48px;
            }
            .signature-line {
              border-top: 1px dashed #cbd5e1;
              text-align: center;
              padding-top: 8px;
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="voucher-container">
            <div class="header">
              <div>
                <div class="company-title">Retail Shop Management</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Official Expense Disbursement Document</div>
              </div>
              <div class="voucher-title">Voucher</div>
            </div>

            <div class="grid">
              <div>
                <div class="label">Voucher Number</div>
                <div class="value">${expense.expenseNumber}</div>
              </div>
              <div>
                <div class="label">Disbursement Date</div>
                <div class="value">${dateText}</div>
              </div>
              <div>
                <div class="label">Disbursed Category</div>
                <div class="value">${categoryText}</div>
              </div>
              <div>
                <div class="label">Payment Method</div>
                <div class="value">${expense.paymentMethod} ${expense.referenceNumber ? `(${expense.referenceNumber})` : ''}</div>
              </div>
              <div>
                <div class="label">Payee / Vendor</div>
                <div class="value">${expense.vendorName || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Recorded By</div>
                <div class="value">${expense.createdBy || 'Authorized Representative'}</div>
              </div>
            </div>

            <div class="amount-box">
              <div class="label">Total Disbursed Amount</div>
              <div class="amount-val">${amountText}</div>
            </div>

            ${expense.description ? `
              <div>
                <div class="label">Particulars / Explanation</div>
                <div class="notes">${expense.description}</div>
              </div>
            ` : ''}

            <div class="signature-grid">
              <div class="signature-line">Prepared & Disbursed By</div>
              <div class="signature-line">Receiver Signature</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getCategoryColorClass = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      case 'amber': return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'orange': return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
      case 'blue': return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'indigo': return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400';
      case 'green': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'purple': return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'teal': return 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400';
      case 'pink': return 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400';
      case 'yellow': return 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'red': return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const isPdf = expense.attachment?.startsWith('data:application/pdf');

  return (
    <div className="space-y-6" id={id}>
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
            {expense.expenseNumber}
          </span>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">
            {expense.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <ExpenseStatusBadge status={expense.status} />
          
          <button
            onClick={handlePrint}
            className="h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            id={`${id}-btn-print`}
          >
            <Printer className="w-4 h-4 stroke-[2.2]" />
            Print Voucher
          </button>
          
          <PDFButton
            onClick={(mode) => generateExpense(expense, mode)}
            label="Download Voucher"
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Amount Display Card */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl text-center">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Disbursed Amount
        </p>
        <p className="text-3xl font-black text-rose-500 tracking-tight mt-2">
          {formatCurrency(expense.amount)}
        </p>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl ${getCategoryColorClass(expense.categoryColor)}`}>
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Category Name
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {expense.categoryName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Disbursed Date
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {formatDate(expense.expenseDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Method
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {expense.paymentMethod} {expense.referenceNumber ? `(${expense.referenceNumber})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payee / Vendor Name
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {expense.vendorName || 'Not Specified'}
            </p>
          </div>
        </div>

        {expense.isRecurring && (
          <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-500 animate-spin-slow" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Recurring: {expense.recurringType}
                </p>
                <p className="text-[10px] text-slate-400">
                  Automatic schedule alerts active for this expenditure
                </p>
              </div>
            </div>
            {expense.nextRecurringDate && (
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                Next billing: {new Date(expense.nextRecurringDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {expense.description && (
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Expense Particulars / Description
          </label>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            {expense.description}
          </div>
        </div>
      )}

      {/* Attachment Section */}
      {expense.attachment && (
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Verification Receipt
          </label>
          {isPdf ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Receipt Document (PDF)
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    File contains PDF report parameters
                  </p>
                </div>
              </div>
              <a
                href={expense.attachment}
                download={`Receipt-${expense.expenseNumber}.pdf`}
                className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.2]" />
                Download PDF
              </a>
            </div>
          ) : (
            <div className="relative border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/80 p-4 flex flex-col items-center">
              <div className="max-w-md w-full border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden bg-white shadow-sm">
                <img
                  src={expense.attachment}
                  alt={`Receipt for ${expense.expenseNumber}`}
                  className="w-full object-contain max-h-96"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mt-3 flex items-center gap-3 w-full justify-center">
                <a
                  href={expense.attachment}
                  download={`Receipt-${expense.expenseNumber}`}
                  className="h-9 px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Image
                </a>
              </div>
            </div>
          )}
        </div>
      )}
      <PDFPreviewDialog
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={`Expense Voucher ${expense.expenseNumber}`}
      />
    </div>
  );
};

export default ExpenseDetails;
