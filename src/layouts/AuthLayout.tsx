import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AuthLayout Component
 * Renders a centered layout wrapper specialized for login, registration, and onboarding.
 */
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors">
      {/* Background radial accent flare */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />

      {/* Main branded container */}
      <div className="w-full max-w-md flex flex-col gap-6 z-10">
        <Outlet />

        {/* Footer info */}
        <div className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest select-none">
          Offline First • Powered by DexieJS • v1.0.0
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
