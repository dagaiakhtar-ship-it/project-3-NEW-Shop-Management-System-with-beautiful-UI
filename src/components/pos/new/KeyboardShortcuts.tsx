import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, HelpCircle, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onEnter?: () => void;
  onEscape?: () => void;
  onPrint?: () => void;
  onPDF?: () => void;
  onWhatsApp?: () => void;
  onF5?: () => void;
  onF1?: () => void;
  onF2?: () => void;
  onF3?: () => void;
  onF4?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onEnter,
  onEscape,
  onPrint,
  onPDF,
  onWhatsApp,
  onF5,
  onF1,
  onF2,
  onF3,
  onF4,
}) => {
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Enter key: confirms active prompt if available
      if (e.key === 'Enter') {
        const isDialogActive = !!document.getElementById('checkout-confirm-dialog') || 
                               !!document.getElementById('loan-confirm-dialog') || 
                               !!document.getElementById('payment-success-dialog') || 
                               !!document.getElementById('checkout-error-dialog') || 
                               !!document.getElementById('receipt-preview-dialog');
        if (isDialogActive) {
          // If a modal input doesn't have focus, confirm!
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
            e.preventDefault();
            onEnter?.();
          }
        }
      }

      // 2. Escape: closes any active modal
      if (e.key === 'Escape') {
        onEscape?.();
      }

      // 3. Ctrl + P: triggers Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onPrint?.();
      }

      // 4. Ctrl + Shift + P: triggers PDF Download
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onPDF?.();
      }

      // 5. Ctrl + W: triggers WhatsApp (since standard Ctrl+W closes browser, we advise but we can block/intercept or bind)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        onWhatsApp?.();
      }

      // 6. F5: triggers complete checkout
      if (e.key === 'F5') {
        e.preventDefault();
        onF5?.();
      }

      // 7. F1 - F4
      if (e.key === 'F1') {
        e.preventDefault();
        onF1?.();
      } else if (e.key === 'F2') {
        e.preventDefault();
        onF2?.();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onF3?.();
      } else if (e.key === 'F4') {
        e.preventDefault();
        onF4?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEnter, onEscape, onPrint, onPDF, onWhatsApp, onF5, onF1, onF2, onF3, onF4]);

  const shortcutKeys = [
    { key: 'F1', desc: 'Focus Product Search' },
    { key: 'F2', desc: 'Focus Customer Selector' },
    { key: 'F3', desc: 'Open Order Modifiers' },
    { key: 'F4', desc: 'Focus Cash Received field' },
    { key: 'F5', desc: 'Complete Checkout dialog' },
    { key: 'Enter', desc: 'Confirm dialogue actions' },
    { key: 'Esc', desc: 'Close open dialogs / Clear sale' },
    { key: 'Ctrl + P', desc: 'Direct Receipt Printing' },
    { key: 'Ctrl + Shift + P', desc: 'Download Invoice PDF' },
    { key: 'Ctrl + W', desc: 'Share invoice via WhatsApp' },
  ];

  return (
    <>
      {/* Floating Pill helper trigger */}
      <div className="fixed bottom-5 left-5 z-40 select-none">
        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="h-9 px-3 bg-slate-900 text-white rounded-full hover:bg-slate-850 flex items-center gap-1.5 text-[11.5px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-slate-800"
          title="Terminal Hotkeys Guide"
        >
          <Command className="h-4 w-4 animate-pulse" />
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Shortcuts Guide drawer panel */}
      <AnimatePresence>
        {showHelper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelper(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-[380px] rounded-2xl shadow-2xl p-5 z-10 text-left flex flex-col gap-3.5"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[13.5px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1">
                  <Command className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Terminal Hotkeys</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelper(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-[11px] font-bold text-slate-900 dark:text-slate-100">
                {shortcutKeys.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-slate-550 dark:text-slate-400">{item.desc}</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[9px] font-black shadow-3xs uppercase text-slate-800 dark:text-slate-200">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-center text-slate-550 dark:text-slate-400 font-semibold mt-1">
                Tip: Press <kbd className="px-1 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded font-mono text-[8px] font-black uppercase text-slate-700 dark:text-slate-300">Tab</kbd> to jump focus between panel inputs.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(KeyboardShortcuts);
