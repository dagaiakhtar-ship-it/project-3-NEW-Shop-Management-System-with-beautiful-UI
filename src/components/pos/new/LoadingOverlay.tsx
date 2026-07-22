import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldCheck, Printer } from 'lucide-react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Processing Payment...',
  subMessage = 'Please wait while we finalize the transaction record...',
}) => {
  const [progress, setProgress] = useState(10);

  // Smoothly increment a mock progress bar to enrich the visual feedback
  useEffect(() => {
    if (!isOpen) {
      setProgress(10);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        // Stagger increments
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Semi-opaque backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs select-none"
        />

        {/* Floating loading panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white w-full max-w-[440px] rounded-[24px] shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col z-10 text-center p-8 select-none"
          id="checkout-loading-overlay"
        >
          {/* Centered spinner logo */}
          <div className="relative mx-auto h-20 w-20 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-50" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#2563EB] animate-spin" />
            <Loader2 className="h-8 w-8 text-[#2563EB] animate-pulse" />
          </div>

          <h3 className="text-[18px] font-black text-[#111827] tracking-tight">{message}</h3>
          <p className="text-[13px] font-bold text-[#6B7280] mt-1 mb-6 leading-relaxed">{subMessage}</p>

          {/* Core Visual Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-[#E5E7EB] mb-8">
            <motion.div
              initial={{ width: '10%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.15 }}
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8]"
            />
          </div>

          {/* Skeleton Receipt component pulsing beneath */}
          <div className="border border-[#E5E7EB] border-dashed rounded-xl p-4 bg-slate-50/50 space-y-3.5 animate-pulse text-left">
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#E5E7EB]/80">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
              <div className="h-3.5 w-16 bg-slate-200 rounded" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-10 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-10 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-10 bg-slate-200 rounded" />
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-200" />

            <div className="flex justify-between pt-1">
              <div className="h-4.5 w-20 bg-slate-300 rounded" />
              <div className="h-4.5 w-16 bg-slate-300 rounded" />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(LoadingOverlay);
