import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FadeIn Animation Wrapper
 */
export const FadeIn = ({ children, duration = 0.3, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideIn Animation Wrapper
 * Animates elements sliding from top, bottom, left, or right directions.
 */
export const SlideIn = ({
  children,
  direction = 'bottom',
  distance = 30,
  duration = 0.4,
  delay = 0,
  className = '',
}) => {
  const directions = {
    top: { y: -distance },
    bottom: { y: distance },
    left: { x: -distance },
    right: { x: distance },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directions[direction] }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn Animation Wrapper
 */
export const ScaleIn = ({ children, duration = 0.3, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ModalAnimation Wrapper
 * Delivers professional overlay backdrop fade and modal card zoom-in effects.
 */
export const ModalAnimation = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden z-10"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * PageTransition Wrapper
 * Standard page-to-page route animation template.
 */
export const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * HoverAnimation Wrapper
 * Micro-interactions feedback container (lifts/scales on active focus).
 */
export const HoverAnimation = ({ children, scale = 1.02, y = -2, className = '' }) => {
  return (
    <motion.div
      whileHover={{ scale, y }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
};
