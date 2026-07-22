import React from 'react';

interface BarcodeGeneratorProps {
  value: string;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ value }) => {
  const codeStr = value?.trim() || '000000000000';

  // Seed standard bar line thicknesses from the character codes to make it look realistic and dynamic
  const getLinePattern = () => {
    const bars: { width: number; isGap: boolean }[] = [];
    let isBar = true;

    // Standard starting marker
    bars.push({ width: 1.5, isGap: false });
    bars.push({ width: 1.5, isGap: true });
    bars.push({ width: 1.5, isGap: false });

    for (let i = 0; i < codeStr.length; i++) {
      const charCode = codeStr.charCodeAt(i);
      // Generate pseudo-pattern based on digit value
      const widths = [
        (charCode % 3) + 1,
        ((charCode >> 1) % 2) + 1,
        ((charCode >> 2) % 3) + 1,
        ((charCode + 1) % 2) + 1,
      ];

      widths.forEach((w) => {
        bars.push({ width: w * 0.9, isGap: !isBar });
        isBar = !isBar;
      });
    }

    // Standard ending marker
    bars.push({ width: 1.5, isGap: false });
    bars.push({ width: 1.5, isGap: true });
    bars.push({ width: 1.5, isGap: false });

    return bars;
  };

  const patterns = getLinePattern();

  return (
    <div
      id={`barcode-generator-${codeStr}`}
      className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200/80 max-w-[210px] mx-auto shadow-sm"
    >
      {/* Visual Barcode Bars Container */}
      <div className="flex items-stretch h-12 bg-white px-2.5 overflow-hidden">
        {patterns.map((item, index) => (
          <div
            key={index}
            style={{ width: `${item.width}px` }}
            className={`h-full ${item.isGap ? 'bg-transparent' : 'bg-slate-900'}`}
          />
        ))}
      </div>

      {/* Printed Numeric Label */}
      <span className="text-[10px] font-black font-mono tracking-[4px] text-slate-800 dark:text-slate-900 mt-1.5 select-all">
        {codeStr}
      </span>
    </div>
  );
};

export default BarcodeGenerator;
