import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface CategoryImageUploaderProps {
  value?: string; // Base64 representation of the image
  onChange: (base64: string) => void;
  onRemove: () => void;
}

export const CategoryImageUploader: React.FC<CategoryImageUploaderProps> = ({
  value,
  onChange,
  onRemove,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setUploadError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }

    // Validate size (limit to 1MB for smooth Base64 storage in IndexedDB)
    if (file.size > 1024 * 1024 * 1.5) {
      setUploadError('Image size must be smaller than 1.5MB.');
      return;
    }

    setIsReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      } else {
        setUploadError('Failed to convert image to data format.');
      }
      setIsReading(false);
    };
    reader.onerror = () => {
      setUploadError('An error occurred while reading the file.');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 text-left">
      <label className="text-xs font-black text-slate-700 dark:text-slate-350 tracking-tight block">
        Category Image
      </label>

      {value ? (
        // Preview State
        <div className="relative group rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 h-40 flex items-center justify-center">
          <img
            src={value}
            alt="Category preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={triggerFileInput}
              className="p-2 bg-white/15 backdrop-blur hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 bg-rose-500/80 backdrop-blur hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        // Upload Dropzone State
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-40 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {isReading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
              <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
                Processing file...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-xl border border-slate-100 dark:border-slate-850">
                <Upload className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Click to upload
                </span>{' '}
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                  or drag & drop
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
                PNG, JPG or WEBP (Max 1.5MB)
              </p>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold rounded-xl border border-rose-100 dark:border-rose-950/40">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};

export default CategoryImageUploader;
