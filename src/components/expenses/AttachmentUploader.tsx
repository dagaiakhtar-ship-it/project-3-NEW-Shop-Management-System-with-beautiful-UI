import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, X, AlertCircle } from 'lucide-react';

interface AttachmentUploaderProps {
  value?: string; // base64 string
  onChange: (base64: string | undefined) => void;
  id?: string;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  value,
  onChange,
  id = 'attachment-uploader',
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    // Limit size to 2MB (IndexedDB space constraint for performance)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum size allowed is 2MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported format. Only JPG, PNG, WEBP, and PDF files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    onChange(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = value?.startsWith('data:application/pdf');

  return (
    <div className="w-full" id={`${id}-container`}>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        Receipt / Bill Attachment
      </label>

      {value ? (
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isPdf ? (
              <div className="p-3 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            ) : (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
                <img
                  src={value}
                  alt="Receipt attachment preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isPdf ? 'Receipt Document (PDF)' : 'Receipt Image (Uploaded)'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isPdf ? 'Interactive PDF' : 'Base64 image stored offline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={removeAttachment}
            className="p-2 bg-slate-200/50 hover:bg-rose-500/10 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 rounded-xl transition-all"
            title="Remove attachment"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/80 hover:border-slate-300'
          } rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center`}
          id={id}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
          />

          <div className="p-3 bg-slate-200/40 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl mb-3">
            <Upload className="w-5 h-5 stroke-[2.5]" />
          </div>

          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Drag & Drop Receipt file here
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            or <span className="text-indigo-500 font-bold hover:underline">browse your files</span>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            Supports JPG, PNG, WEBP, or PDF up to 2MB
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-500/5 border border-rose-500/15 p-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;
