import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PaperSize, injectPrintStyle } from '../utils/printUtils';
import { CompanyBranding, getCompanyBranding } from '../constants/companyBranding';
import { useAuthStore } from '../store/authStore';
import showToast from '../utils/toast';

export interface PrintPreviewState {
  isOpen: boolean;
  title: string;
  templateType: 'invoice' | 'receipt' | 'statement' | 'report' | 'labels';
  paperSize: PaperSize;
  zoom: number;
  data: any;
  items: any[];
}

/**
 * High-performance browser printing hook wrapping react-to-print.
 */
export function usePrint(contentRef: React.RefObject<HTMLDivElement | null>, paperSize: PaperSize = 'A4_Portrait') {
  const [isPrinting, setIsPrinting] = useState(false);

  // Auto-inject styles before calling browser print dialog
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: 'ShopCraft_Document',
    onBeforePrint: async () => {
      setIsPrinting(true);
      injectPrintStyle(paperSize);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  const triggerPrint = useCallback(() => {
    try {
      handlePrint();
    } catch (err: any) {
      console.error('Browser print failed:', err);
      showToast.error(`Print Failed: ${err.message || 'Printer not available.'}`);
    }
  }, [handlePrint]);

  return {
    isPrinting,
    triggerPrint,
  };
}

/**
 * State manager and controller for the centralized Print Preview interface.
 */
export function usePrintPreview() {
  const [previewState, setPreviewState] = useState<PrintPreviewState>({
    isOpen: false,
    title: 'Print Preview',
    templateType: 'report',
    paperSize: 'A4_Portrait',
    zoom: 100,
    data: null,
    items: [],
  });

  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const { currentUser } = useAuthStore();

  // Load shop settings reactively when preview starts
  const loadBranding = useCallback(async () => {
    const activeBranding = await getCompanyBranding();
    setBranding(activeBranding);
  }, []);

  const openPreview = useCallback((
    title: string,
    templateType: 'invoice' | 'receipt' | 'statement' | 'report' | 'labels',
    data: any,
    items: any[] = [],
    defaultSize?: PaperSize
  ) => {
    // Pick standard sizes depending on document classification
    let pickedSize: PaperSize = 'A4_Portrait';
    if (defaultSize) {
      pickedSize = defaultSize;
    } else if (templateType === 'receipt') {
      pickedSize = 'Thermal_80mm';
    } else if (templateType === 'labels') {
      pickedSize = 'A4_Portrait'; // Labels are A4 sheet default
    }

    setPreviewState({
      isOpen: true,
      title,
      templateType,
      paperSize: pickedSize,
      zoom: 100,
      data,
      items,
    });

    loadBranding();
  }, [loadBranding]);

  const closePreview = useCallback(() => {
    setPreviewState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const setPaperSize = useCallback((size: PaperSize) => {
    setPreviewState(prev => ({ ...prev, paperSize: size }));
  }, []);

  const setZoom = useCallback((zoomVal: number) => {
    setPreviewState(prev => ({ ...prev, zoom: Math.max(50, Math.min(150, zoomVal)) }));
  }, []);

  return {
    isOpen: previewState.isOpen,
    title: previewState.title,
    templateType: previewState.templateType,
    paperSize: previewState.paperSize,
    zoom: previewState.zoom,
    data: previewState.data,
    items: previewState.items,
    branding,
    printedBy: currentUser?.fullName || currentUser?.username || 'Cashier',
    openPreview,
    closePreview,
    setPaperSize,
    setZoom,
  };
}

/**
 * Specialized hook for fast thermal receipt role printing.
 */
export function useThermalPrint(contentRef: React.RefObject<HTMLDivElement | null>, width: '80mm' | '58mm' = '80mm') {
  const paperSize: PaperSize = width === '80mm' ? 'Thermal_80mm' : 'Thermal_58mm';
  const { isPrinting, triggerPrint } = usePrint(contentRef, paperSize);

  return {
    isPrinting,
    triggerReceiptPrint: triggerPrint,
  };
}
