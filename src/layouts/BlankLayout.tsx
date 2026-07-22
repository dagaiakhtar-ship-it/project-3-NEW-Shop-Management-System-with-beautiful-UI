import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * BlankLayout Component
 * Serves as an unadorned structural fallback viewport for fullscreen errors,
 * coming soon pages, or standalone presentation panels.
 */
export const BlankLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
      <Outlet />
    </div>
  );
};

export default BlankLayout;
