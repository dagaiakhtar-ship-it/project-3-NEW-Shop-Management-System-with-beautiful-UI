import React from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  description?: string;
}

const PRESETS = [
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#ef4444', name: 'Rose' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#ec4899', name: 'Pink' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  description
}) => {
  return (
    <div className="flex flex-col gap-2 text-left">
      {label && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          {description && (
            <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-0.5 leading-normal">
              {description}
            </span>
          )}
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-2.5 mt-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            onClick={() => onChange(preset.hex)}
            className="group relative h-7 w-7 rounded-full border border-slate-200/50 dark:border-slate-800 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            style={{ backgroundColor: preset.hex }}
            title={preset.name}
          >
            {value.toLowerCase() === preset.hex.toLowerCase() && (
              <Check className="h-3.5 w-3.5 text-white drop-shadow-sm font-black" />
            )}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-1">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-8 p-0 border border-slate-200 dark:border-slate-800 rounded cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-center uppercase focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
