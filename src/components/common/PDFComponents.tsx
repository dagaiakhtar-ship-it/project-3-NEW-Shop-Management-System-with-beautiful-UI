import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Printer, Download, Eye, X, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface PDFPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
}

export function PDFPreviewDialog({ isOpen, onClose, pdfUrl, title }: PDFPreviewDialogProps) {
  const [zoom, setZoom] = useState<number>(100);

  // Auto-scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !pdfUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col w-full h-[90vh] max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{title || 'PDF Document'}</h3>
                <p className="text-xs text-slate-500">Secure Offline Document Preview</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = `${title || 'Document'}.pdf`;
                  link.click();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const printWindow = window.open(pdfUrl);
                  printWindow?.focus();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                id="close-pdf-preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Frame */}
          <div className="flex-1 bg-slate-100 p-4 relative overflow-auto flex justify-center items-center">
            <iframe
              src={`${pdfUrl}#view=FitH`}
              title={title}
              className="w-full h-full border-0 bg-white rounded shadow-sm"
              style={{ minHeight: '100%', maxWidth: '100%' }}
            />
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-mono">
            <span>Powered by ShopCraft PDF Service v9</span>
            <span>Generated locally &amp; securely offline</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface PDFButtonProps {
  onClick: (mode: 'download' | 'preview' | 'print') => Promise<any>;
  label: string;
  isGenerating?: boolean;
  className?: string;
}

export function PDFButton({ onClick, label, isGenerating = false, className = '' }: PDFButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAction = async (mode: 'download' | 'preview' | 'print') => {
    setDropdownOpen(false);
    await onClick(mode);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center rounded-lg shadow-sm border border-slate-200 bg-white overflow-hidden divide-x divide-slate-200 hover:border-slate-300">
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => handleAction('download')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-70"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          ) : (
            <FileText className="w-4 h-4 text-slate-400" />
          )}
          {isGenerating ? 'Generating...' : label}
        </button>
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2 hover:bg-slate-50 transition-colors text-slate-400"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-20 text-xs font-medium text-slate-700 divide-y divide-slate-100"
            >
              <div className="py-1">
                <button
                  onClick={() => handleAction('download')}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleAction('preview')}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  Preview Document
                </button>
                <button
                  onClick={() => handleAction('print')}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Direct Print
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExportDropdownProps {
  onExport: (mode: 'download' | 'preview' | 'print') => void;
  isGenerating?: boolean;
  className?: string;
}

export function ExportDropdown({ onExport, isGenerating = false, className = '' }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={isGenerating}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold"
      >
        {isGenerating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        Export Report
        <ChevronDown className="w-3 h-3" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute right-0 mt-1 w-44 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-20 text-xs font-medium text-slate-700 divide-y divide-slate-100"
            >
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); onExport('download'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  Download PDF
                </button>
                <button
                  onClick={() => { setOpen(false); onExport('preview'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  Preview Report
                </button>
                <button
                  onClick={() => { setOpen(false); onExport('print'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Print Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
