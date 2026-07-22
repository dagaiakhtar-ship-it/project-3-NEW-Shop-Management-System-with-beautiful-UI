import React from 'react';
import { Barcode, Loader2 } from 'lucide-react';

interface BarcodeButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export const BarcodeButton: React.FC<BarcodeButtonProps> = ({
  onClick,
  isLoading = false,
  isDisabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className="h-10 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-[14px] rounded-[10px] flex items-center gap-2 transition-all duration-200 hover:scale-101 hover:shadow-md cursor-pointer shrink-0"
      id="pos-barcode-scan-btn-reusable"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Barcode className="h-5 w-5" />
      )}
      <span className="hidden md:inline">Scan Barcode</span>
    </button>
  );
};

export default React.memo(BarcodeButton);
