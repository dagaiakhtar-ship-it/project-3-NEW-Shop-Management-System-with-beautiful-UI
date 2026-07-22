import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Eye, ChevronDown, ZoomIn, ZoomOut, X, Loader2, FileText, Settings, Download, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';
import { usePrint } from '../../hooks/usePrint';
import { PaperSize, PAPER_SIZE_CONFIGS, injectPrintStyle } from '../../utils/printUtils';
import { CompanyBranding } from '../../constants/companyBranding';
import { WhatsAppService } from '../../services/whatsappService';
import showToast from '../../utils/toast';
import {
  InvoiceTemplate,
  ReceiptTemplate,
  StatementTemplate,
  ReportTemplate,
  BarcodeLabelsTemplate,
} from '../../services/printTemplates';

// ==========================================
// 1. PRINT BUTTON COMPONENT
// ==========================================

interface PrintButtonProps {
  onPrintDirect: () => void;
  onOpenPreview: () => void;
  label?: string;
  isGenerating?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  onPrintDirect,
  onOpenPreview,
  label = 'Print',
  isGenerating = false,
  className = '',
  disabled = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={`relative inline-block text-left no-print ${className}`}>
      <div className="flex items-center rounded-lg shadow-sm border border-slate-200 bg-white overflow-hidden divide-x divide-slate-200 hover:border-slate-300">
        <button
          type="button"
          disabled={disabled || isGenerating}
          onClick={onOpenPreview}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          ) : (
            <Printer className="w-4 h-4 text-slate-400" />
          )}
          {isGenerating ? 'Preparing...' : label}
        </button>
        <button
          type="button"
          disabled={disabled || isGenerating}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2 hover:bg-slate-50 transition-colors text-slate-400 disabled:opacity-50"
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
                  onClick={() => { setDropdownOpen(false); onOpenPreview(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors font-semibold"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  Print Preview
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onPrintDirect(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left transition-colors font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Direct Print (Quick)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// 2. PRINT TOOLBAR COMPONENT
// ==========================================

interface PrintToolbarProps {
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPrint: () => void;
  onClose: () => void;
  title: string;
  isLandscapeSupported?: boolean;
  templateType?: string;
  data?: any;
}

export const PrintToolbar: React.FC<PrintToolbarProps> = ({
  paperSize,
  onPaperSizeChange,
  zoom,
  onZoomChange,
  onPrint,
  onClose,
  title,
  templateType,
  data,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 gap-4 no-print select-none">
      {/* Title / Description */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-mono">Universal Printing System v1.2</p>
        </div>
      </div>

      {/* Printing Tools */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {/* Paper Size dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase font-mono">Size:</span>
          <select
            value={paperSize}
            onChange={(e) => onPaperSizeChange(e.target.value as PaperSize)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 shadow-sm focus:border-indigo-500 outline-none cursor-pointer"
          >
            {Object.values(PAPER_SIZE_CONFIGS).map((cfg) => (
              <option key={cfg.id} value={cfg.id}>
                {cfg.name} ({cfg.dimensions})
              </option>
            ))}
          </select>
        </div>

        {/* Zoom adjustment */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
          <button
            onClick={() => onZoomChange(zoom - 10)}
            disabled={zoom <= 50}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold font-mono text-slate-600 min-w-12 text-center select-none">
            {zoom}%
          </span>
          <button
            onClick={() => onZoomChange(zoom + 10)}
            disabled={zoom >= 150}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 md:pl-4">
          {(templateType === 'receipt' || templateType === 'invoice') && data && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (data.invoiceNo) {
                  WhatsAppService.sendWhatsAppByInvoiceNo(data.invoiceNo);
                } else {
                  showToast.error("Invoice number not found.");
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/40 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              Send WhatsApp
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onPrint}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 uppercase shadow-md shadow-indigo-100"
          >
            <Printer className="w-4 h-4" />
            Send to Printer
          </Button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors border border-slate-200 bg-white"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. COMPLETE PRINT PREVIEW DIALOG
// ==========================================

interface PrintPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateType: 'invoice' | 'receipt' | 'statement' | 'report' | 'labels';
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  data: any;
  items: any[];
  branding: CompanyBranding | null;
  printedBy?: string;
}

export const PrintPreviewDialog: React.FC<PrintPreviewDialogProps> = (props) => {
  if (!props.isOpen || !props.branding) return null;
  return <PrintPreviewDialogContent {...props} />;
};

const PrintPreviewDialogContent: React.FC<PrintPreviewDialogProps> = ({
  isOpen,
  onClose,
  title,
  templateType,
  paperSize,
  onPaperSizeChange,
  zoom,
  onZoomChange,
  data,
  items,
  branding,
  printedBy = 'System',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { isPrinting, triggerPrint } = usePrint(printRef, paperSize);

  // Esc keyboard shortcut to close preview, Ctrl+P to trigger print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        triggerPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerPrint]);

  // Lock scrolling when preview modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const currentSizeConfig = PAPER_SIZE_CONFIGS[paperSize];
  const isThermal = paperSize.startsWith('Thermal');

  // Dynamically map and render the corresponding template inside our physical page simulation
  const renderTemplate = () => {
    switch (templateType) {
      case 'invoice':
        return (
          <InvoiceTemplate
            branding={branding}
            invoice={data}
            items={items}
            printedBy={printedBy}
          />
        );
      case 'receipt':
        return (
          <ReceiptTemplate
            branding={branding}
            sale={data}
            items={items}
            width={paperSize === 'Thermal_58mm' ? '58mm' : '80mm'}
            cashierName={printedBy}
            isDuplicate={data?.isDuplicate}
          />
        );
      case 'statement':
        return (
          <StatementTemplate
            branding={branding}
            title={title}
            clientName={data?.clientName || 'Account Ledger'}
            clientType={data?.clientType || 'Customer'}
            clientCode={data?.clientCode}
            clientPhone={data?.clientPhone}
            meta={{
              openingBalance: data?.openingBalance || 0,
              closingBalance: data?.closingBalance || 0,
              outstanding: data?.outstanding || 0,
              totalDebits: data?.totalDebits,
              totalCredits: data?.totalCredits,
            }}
            transactions={items}
            printedBy={printedBy}
          />
        );
      case 'report':
        return (
          <ReportTemplate
            branding={branding}
            title={title}
            summaryCards={data?.summaryCards || []}
            headers={data?.headers || []}
            rows={items || []}
            filters={data?.filters || []}
            totalsRow={data?.totalsRow}
            printedBy={printedBy}
          />
        );
      case 'labels':
        return (
          <BarcodeLabelsTemplate
            branding={branding}
            productsList={items}
            quantityPerProduct={data?.quantity || 1}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-red-500 font-bold">
            No printing template found for type: {templateType}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs overflow-hidden no-print print:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="flex flex-col w-full h-full bg-slate-100 overflow-hidden"
        >
          {/* Header Actions Panel */}
          <PrintToolbar
            title={title}
            paperSize={paperSize}
            onPaperSizeChange={onPaperSizeChange}
            zoom={zoom}
            onZoomChange={onZoomChange}
            onPrint={triggerPrint}
            onClose={onClose}
            templateType={templateType}
            data={data}
          />

          {/* Core Interactive Preview Area */}
          <div className="flex-1 overflow-auto p-6 md:p-12 flex justify-center bg-slate-200/60 select-text">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.1s ease',
                width: currentSizeConfig.style.width,
              }}
              className="flex-shrink-0"
            >
              {/* This is the element cloned by react-to-print */}
              <div
                ref={printRef}
                className={`paper-preview-shadow bg-white rounded-lg transition-shadow duration-300 relative select-text ${currentSizeConfig.paddingClass}`}
                style={{
                  width: currentSizeConfig.style.width,
                  minHeight: currentSizeConfig.style.minHeight,
                  boxSizing: 'border-box',
                }}
              >
                {/* Print watermark/guide on screen but invisible when printed */}
                <div className="absolute top-1.5 right-3 text-[8px] text-slate-300 font-mono font-bold no-print select-none select-none">
                  PRINT PREVIEW SHEET • {currentSizeConfig.name.toUpperCase()}
                </div>

                {renderTemplate()}
              </div>
            </div>
          </div>

          {/* Status Bar footer */}
          <div className="px-6 py-2 bg-slate-800 text-white flex justify-between items-center text-[10px] font-mono select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Printer Driver Online</span>
            </div>
            <div className="text-slate-400">
              <span>Paper Size: <strong>{currentSizeConfig.name}</strong></span>
              <span className="mx-2">|</span>
              <span>Zoom Scale: <strong>{zoom}%</strong></span>
              <span className="mx-2">|</span>
              <span>Shortcuts: <strong className="text-slate-300">Ctrl+P (Print), Esc (Close)</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
