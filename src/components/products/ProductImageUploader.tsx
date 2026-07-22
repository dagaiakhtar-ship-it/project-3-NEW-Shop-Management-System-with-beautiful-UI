import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import showToast from '../../utils/toast';

interface ProductImageUploaderProps {
  image: string;
  onChange: (base64Image: string) => void;
  onClear: () => void;
}

const PRESET_IMAGES = [
  { name: 'Tech', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&auto=format&fit=crop&q=60' },
  { name: 'Groceries', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=60' },
  { name: 'Beverage', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&auto=format&fit=crop&q=60' },
  { name: 'Apparel', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&auto=format&fit=crop&q=60' },
];

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  image,
  onChange,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast.error('Image size must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onChange(base64String);
      showToast.success('Product image uploaded successfully.');
    };
    reader.onerror = () => {
      showToast.error('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="product-image-uploader" className="flex flex-col gap-3 text-left">
      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Product Image
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left side: Drag & Drop Area / Active Image Preview */}
        <div className="md:col-span-2">
          {image ? (
            <div className="relative group rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden aspect-video flex items-center justify-center">
              <img
                src={image}
                alt="Product Preview"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="px-3.5 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition aspect-video ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/60">
                <Upload className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Upload an image
                </span>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-1">
                  Drag & drop PNG, JPG, or WEBP (Max 2MB)
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Right side: Quick Presets */}
        <div className="flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-150/60 dark:border-slate-800/40">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" /> Quick Presets
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {PRESET_IMAGES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  showToast.info(`Applied ${preset.name} preset image.`);
                }}
                className="group relative h-14 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-indigo-500 hover:shadow-sm transition"
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-350"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-center">
                  <span className="text-[9px] font-black text-white">{preset.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImageUploader;
