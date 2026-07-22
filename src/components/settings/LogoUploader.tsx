import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import showToast from '../../utils/toast';

interface LogoUploaderProps {
  value: string; // Base64 or URL
  onChange: (base64: string) => void;
  label?: string;
  description?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  value,
  onChange,
  label,
  description
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast.error('Please upload an image file (PNG, JPG, SVG).');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) { // Limit to 1.5MB for local indexedDB safety
      showToast.error('Logo image size must be less than 1.5MB to preserve local database limits.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
        showToast.success('Store logo uploaded successfully!');
      }
    };
    reader.onerror = () => {
      showToast.error('Failed to parse selected image.');
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const clearLogo = () => {
    onChange('');
    showToast.success('Logo cleared successfully.');
  };

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

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-1">
        {/* Logo Preview box */}
        <div className="relative h-20 w-20 shrink-0 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
          {value ? (
            <>
              <img src={value} alt="Shop logo" className="h-full w-full object-contain p-1" />
              <button
                type="button"
                onClick={clearLogo}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerSelect}
          className={`h-20 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
              : 'border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          <Upload className="h-4.5 w-4.5 text-slate-400 dark:text-slate-600 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 mt-1.5">
            Drag your logo here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
          </span>
          <span className="text-[8px] font-semibold text-slate-400 mt-0.5">Supports PNG, JPG, SVG up to 1.5MB</span>
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;
