import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileJson, Printer, Layers, Cloud, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import showToast from '../../utils/toast';
import { usePrintSystem } from '../../contexts/PrintContext';

interface ExportMenuProps {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][]; // array of arrays or array of objects mapped to headers
  summaryData?: Record<string, string | number>;
  fileName: string;
  onPrint?: () => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  title,
  subtitle = 'Shop Management System Report',
  headers,
  data,
  summaryData,
  fileName,
  onPrint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openPrintPreview } = usePrintSystem();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerCSVExport = () => {
    try {
      if (data.length === 0) {
        showToast.error('No report data available to export.');
        return;
      }

      // Headers row
      const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
      
      // Data rows
      const valueRows = data.map(row => 
        row.map(val => {
          const stringVal = val === null || val === undefined ? '' : String(val);
          return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(',')
      );

      // Summary lines (if any)
      const summaryLines: string[] = [];
      if (summaryData) {
        summaryLines.push('');
        summaryLines.push('"Report Summary metrics"');
        Object.entries(summaryData).forEach(([key, val]) => {
          summaryLines.push(`"${key}","${String(val).replace(/"/g, '""')}"`);
        });
      }

      const csvContent = [headerRow, ...valueRows, ...summaryLines].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast.success('CSV spreadsheet exported successfully.');
      setIsOpen(false);
    } catch (err) {
      console.error('CSV Export Error:', err);
      showToast.error('Failed to generate CSV export.');
    }
  };

  const triggerExcelExport = () => {
    try {
      if (data.length === 0) {
        showToast.error('No report data available to export.');
        return;
      }

      // Create a worksheet
      const rows = data.map(row => {
        const rowObj: Record<string, any> = {};
        headers.forEach((h, index) => {
          rowObj[h] = row[index];
        });
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      
      // If summary metrics exist, append them
      if (summaryData) {
        const summaryRows = [
          [],
          ['Report Summary Metrics', 'Value'],
          ...Object.entries(summaryData)
        ];
        XLSX.utils.sheet_add_aoa(worksheet, summaryRows, { origin: -1 });
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Output');
      
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      showToast.success('Excel Workbook (.xlsx) exported successfully.');
      setIsOpen(false);
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast.error('Failed to generate Excel export.');
    }
  };

  const triggerPDFExport = () => {
    try {
      if (data.length === 0) {
        showToast.error('No report data available to export.');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const docWidth = doc.internal.pageSize.getWidth();

      // Company header decoration
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 0, docWidth, 18, 'F');

      // Title & Subtitle inside header
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, 14, 12);

      doc.setTextColor(224, 231, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(subtitle, docWidth - 14, 11, { align: 'right' });

      // Reset text colors
      doc.setTextColor(30, 41, 59);

      // Metadata section
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPORT DATE:', 14, 27);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleString(), 42, 27);

      doc.setFont('helvetica', 'bold');
      doc.text('SYSTEM ENVIRONMENT:', docWidth - 55, 27);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFLINE RETAIL SECURE', docWidth - 14, 27, { align: 'right' });

      let currentY = 32;

      // Summary block
      if (summaryData) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(14, 32, docWidth - 28, 16, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.rect(14, 32, docWidth - 28, 16, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400

        const keys = Object.keys(summaryData);
        const colWidth = (docWidth - 32) / Math.max(keys.length, 1);

        keys.forEach((key, index) => {
          doc.text(key.toUpperCase(), 16 + (index * colWidth), 37);
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42); // slate-900

        Object.values(summaryData).forEach((val, index) => {
          doc.text(String(val), 16 + (index * colWidth), 44);
        });

        currentY = 54;
      }

      // Add auto-table
      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: data,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      // Add footer
      const pages = doc.internal.pages;
      const totalPages = pages.length - 1;
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Page ${i} of ${totalPages}  |  Shop Management System Audit Platform`,
          docWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`${fileName}.pdf`);
      showToast.success('PDF Auditor document downloaded.');
      setIsOpen(false);
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast.error('Failed to generate PDF document.');
    }
  };

  const handleSheetsPlaceholder = () => {
    showToast.info('Google Sheets auto-sync is scheduled for future deployment. Offline local backups are active.');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        id="export-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-all cursor-pointer border border-indigo-200/20"
      >
        <Download className="h-4 w-4" />
        <span>Export Statement</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="p-1.5 flex flex-col gap-1">
            <button
              type="button"
              id="export-btn-csv"
              onClick={triggerCSVExport}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FileJson className="h-4 w-4 text-slate-500" />
              <span>Comma Separated (.csv)</span>
            </button>
            
            <button
              type="button"
              id="export-btn-excel"
              onClick={triggerExcelExport}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span>Excel Spreadsheet (.xlsx)</span>
            </button>

            <button
              type="button"
              id="export-btn-pdf"
              onClick={triggerPDFExport}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Layers className="h-4 w-4 text-rose-500" />
              <span>PDF Audit Statement (.pdf)</span>
            </button>

            <button
              type="button"
              id="export-btn-print"
              onClick={() => {
                onPrint?.();
                const summaryCards = summaryData
                  ? Object.entries(summaryData).map(([label, value]) => ({
                      label: label,
                      value: String(value),
                    }))
                  : [];

                const reportData = {
                  title: title,
                  summaryCards: summaryCards,
                  headers: headers,
                  filters: [
                    { label: 'Export Category', value: subtitle },
                    { label: 'Secure Mode', value: 'Local Offline A4' }
                  ]
                };

                openPrintPreview(title, 'report', reportData, data, 'A4_Portrait');
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-indigo-500" />
              <span>Send to Printer</span>
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1" />

            <button
              type="button"
              id="export-btn-sheets"
              onClick={handleSheetsPlaceholder}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <Cloud className="h-4 w-4" />
              <span className="flex flex-col">
                <span>Google Sheets Sync</span>
                <span className="text-[9px] text-slate-400">Scheduled Update</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
