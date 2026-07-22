import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Printer, SlidersHorizontal, AlertCircle, FileQuestion } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { usePrint } from '../../hooks/usePrint';

interface ChartContainerProps {
  id: string;
  title: string;
  description?: string;
  children: (isZoomed: boolean) => React.ReactNode;
  allowZoom?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  id,
  title,
  description,
  children,
  allowZoom = true,
  isLoading = false,
  isEmpty = false,
  isError = false,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Helper: Export to PNG
  const handleExportPng = () => {
    const cardEl = document.getElementById(id);
    if (!cardEl) return;
    const svgEl = cardEl.querySelector('svg');
    if (!svgEl) return;

    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgEl);
      svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=');

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // high-res
        canvas.width = svgEl.clientWidth * scale;
        canvas.height = svgEl.clientHeight * scale;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.scale(scale, scale);
          context.drawImage(image, 0, 0, svgEl.clientWidth, svgEl.clientHeight);
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = png;
          downloadLink.download = `${id}_visual.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        window.URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Error exporting chart to PNG', err);
    }
  };

  // Helper: Export to PDF
  const handleExportPdf = () => {
    const cardEl = document.getElementById(id);
    if (!cardEl) return;
    const svgEl = cardEl.querySelector('svg');
    if (!svgEl) return;

    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgEl);
      svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=');

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = svgEl.clientWidth * scale;
        canvas.height = svgEl.clientHeight * scale;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.scale(scale, scale);
          context.drawImage(image, 0, 0, svgEl.clientWidth, svgEl.clientHeight);
          const imgData = canvas.toDataURL('image/png');

          const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width / scale + 40, canvas.height / scale + 90]
          });

          // Elegant business report header styles
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(title, 20, 30);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(`Shop BI Dashboard Visual: ${description || 'Interactive Ledger'}`, 20, 42);
          doc.text(`Exported on ${new Date().toLocaleString()}`, 20, 52);

          doc.setDrawColor(241, 245, 249); // slate-100 border line
          doc.line(20, 60, canvas.width / scale + 20, 60);

          doc.addImage(imgData, 'PNG', 20, 70, canvas.width / scale, canvas.height / scale);

          doc.save(`${id}_visual.pdf`);
        }
        window.URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Error exporting chart to PDF', err);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerPrint } = usePrint(containerRef, 'A4_Landscape');

  // Helper: Print Visual
  const handlePrint = () => {
    triggerPrint();
  };

  return (
    <div
      ref={containerRef}
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full relative group hover:shadow-md transition-all duration-300 print:bg-white print:text-slate-900 print:border-none print:shadow-none"
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Header Panel */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-left flex-1 min-w-0 pr-4">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-150 tracking-tight uppercase truncate">
            {title}
          </h3>
          {description && (
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Option action menu buttons */}
        <div className={`flex items-center gap-1 shrink-0 transition-opacity duration-200 no-print print:hidden ${showOptions ? 'opacity-100' : 'opacity-100 sm:opacity-0'}`}>
          {allowZoom && (
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? "Disable Zoom Brush" : "Enable Zoom Brush Slider"}
              className={`p-1.5 rounded-lg border text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${isZoomed ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20' : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850'}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleExportPng}
            title="Download visual as PNG Image"
            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleExportPdf}
            title="Download visual as PDF Document"
            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handlePrint}
            title="Print this single visual report"
            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Center Wrapper */}
      <div className="flex-1 relative min-h-[220px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Calculating Visual...
            </span>
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-250 block">Aggregator Fail</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 max-w-xs block leading-normal">
                Failed to aggregate IndexedDB transaction blocks. Please refresh page.
              </span>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="p-2 bg-slate-50 dark:bg-slate-850/50 text-slate-400 dark:text-slate-500 rounded-xl">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-350 block">No Active Slices</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 max-w-xs block leading-normal">
                This reporting slice has no matching transaction entries logged in the DB.
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {children(isZoomed)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
