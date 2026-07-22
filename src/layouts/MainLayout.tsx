import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAppStore from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, KeyRound } from 'lucide-react';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { motion, AnimatePresence } from 'motion/react';
import AIAssistantPanel from '../components/ai/AIAssistantPanel';
import { useNotificationRunner } from '../hooks/useNotificationRunner';

export const MainLayout: React.FC = () => {
  const { isSidebarOpen } = useAppStore();
  const { isFirstLoginNotice } = useAuth();
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const location = useLocation();
  const isPOSRoute = location.pathname === '/sales';

  // Invoke background notification checks
  useNotificationRunner();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      {/* Toast Notification stack configuration */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Persistent navigation menu sidebar panels */}
      <Sidebar />

      {/* Full layout flex columns */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Header bar controls */}
        {!isPOSRoute && <Header />}

        {/* Security alert banner for default credentials */}
        <AnimatePresence>
          {isFirstLoginNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 text-slate-950 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 font-bold text-xs select-none shadow-md border-b border-amber-600/20"
              id="security-alert-banner"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 animate-bounce shrink-0" />
                <span>
                  SECURITY ALERT: You are signed in with the default Administrator password. For maximum security, change your password immediately.
                </span>
              </div>
              <button
                onClick={() => setShowPasswordChangeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-900 font-extrabold uppercase tracking-wider text-[10px] cursor-pointer transition-colors shrink-0"
              >
                <KeyRound className="h-3 w-3" />
                <span>Change Password</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main nested route viewport */}
        <main
          id={isPOSRoute ? "brand-new-pos-root" : undefined}
          className={
            isPOSRoute
              ? "pos-terminal-module flex-1 overflow-hidden w-full h-full p-0 max-w-none bg-[#F8FAFC] dark:bg-slate-950 text-[#111827] dark:text-slate-100 font-sans flex flex-col gap-0 select-none"
              : "flex-1 overflow-y-auto px-6 py-6 md:px-8 max-w-7xl w-full mx-auto"
          }
          style={isPOSRoute ? { height: '100%', width: '100%', zoom: 0.95, fontSize: '0.95rem' } : { zoom: 0.95, fontSize: '0.95rem' }}
        >
          <Outlet />
        </main>

        {/* Footnotes brand versioning footer bar */}
        {!isPOSRoute && <Footer />}
      </div>

      {/* Global Change Password modal triggerable from warning banner */}
      <ChangePasswordModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
      />

      {/* Floating Global AI Business Assistant widget */}
      <AIAssistantPanel />
    </div>
  );
};

export default MainLayout;
