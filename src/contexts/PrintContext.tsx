import React, { createContext, useContext } from 'react';
import { usePrintPreview } from '../hooks/usePrint';
import { PrintPreviewDialog } from '../components/common/PrintComponents';
import { PaperSize } from '../utils/printUtils';

interface PrintContextType {
  openPrintPreview: (
    title: string,
    templateType: 'invoice' | 'receipt' | 'statement' | 'report' | 'labels',
    data: any,
    items: any[],
    defaultSize?: PaperSize
  ) => void;
  closePrintPreview: () => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isOpen,
    title,
    templateType,
    paperSize,
    zoom,
    data,
    items,
    branding,
    printedBy,
    openPreview,
    closePreview,
    setPaperSize,
    setZoom,
  } = usePrintPreview();

  return (
    <PrintContext.Provider value={{ openPrintPreview: openPreview, closePrintPreview: closePreview }}>
      {children}
      <PrintPreviewDialog
        isOpen={isOpen}
        onClose={closePreview}
        title={title}
        templateType={templateType}
        paperSize={paperSize}
        onPaperSizeChange={setPaperSize}
        zoom={zoom}
        onZoomChange={setZoom}
        data={data}
        items={items}
        branding={branding}
        printedBy={printedBy}
      />
    </PrintContext.Provider>
  );
};

export const usePrintSystem = () => {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('usePrintSystem must be used within a PrintProvider');
  }
  return context;
};
