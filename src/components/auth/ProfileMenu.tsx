import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useCurrentUser } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { ChangePasswordModal } from './ChangePasswordModal';
import { LogoutConfirmationDialog } from './LogoutConfirmationDialog';
import { Drawer } from '../ui/Drawer';
import { ChevronDown, User as UserIcon, KeyRound, LogOut, Shield, Info, Calendar, Phone, Mail, Activity, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProfileMenu: React.FC = () => {
  const { user } = useCurrentUser();
  const { logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sub-modal toggle states
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    logout();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="profile-menu-container">
      {/* Interactive Profile Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group text-left select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Avatar name={user.fullName} src={user.profileImage} size="sm" shape="circle" />
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors">
            {user.fullName}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {user.role}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {/* Profile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-150 bg-white dark:border-slate-800/85 dark:bg-slate-950 shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/40"
            role="menu"
            id="profile-dropdown-menu"
          >
            {/* User details header segment */}
            <div className="px-4.5 py-4 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex gap-3 items-center">
                <Avatar name={user.fullName} src={user.profileImage} size="md" shape="circle" />
                <div className="flex flex-col text-left leading-snug">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 truncate max-w-[140px]">
                    @{user.username}
                  </span>
                  <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/10 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 w-fit uppercase tracking-wider">
                    <Shield className="h-2.5 w-2.5" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              {/* My Profile */}
              <button
                onClick={() => {
                  setShowProfileDrawer(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4.5 py-2.5 text-xs font-bold transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-left"
                role="menuitem"
              >
                <UserIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>My Profile</span>
              </button>

              {/* Change Password */}
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4.5 py-2.5 text-xs font-bold transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-left"
                role="menuitem"
              >
                <KeyRound className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>Change Password</span>
              </button>
            </div>

            {/* Logout Action Segment */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowLogoutDialog(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4.5 py-2.5 text-xs font-bold transition-colors text-rose-600 dark:text-rose-450 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 cursor-pointer text-left"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Reusable My Profile Drawer (The interactive placeholder) */}
      <Drawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title="My Profile Information"
        size="sm"
      >
        <div className="flex flex-col gap-6" id="profile-drawer-content">
          {/* Top Banner Avatar */}
          <div className="flex flex-col items-center text-center p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100/40 dark:border-slate-800/30">
            <Avatar name={user.fullName} src={user.profileImage} size="xl" shape="circle" className="ring-4 ring-indigo-100 dark:ring-indigo-950/40" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3.5">
              {user.fullName}
            </h3>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              @{user.username}
            </span>
          </div>

          {/* Account properties list */}
          <div className="space-y-4 text-left">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Profile Summary
            </h4>

            {/* Email Address */}
            <div className="flex items-start gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</span>
                <span className="text-xs font-bold text-slate-950 dark:text-slate-200">{user.email || 'N/A'}</span>
              </div>
            </div>

            {/* Contact Phone */}
            <div className="flex items-start gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Phone</span>
                <span className="text-xs font-bold text-slate-950 dark:text-slate-200">{user.phone || 'N/A'}</span>
              </div>
            </div>

            {/* System Role */}
            <div className="flex items-start gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <Shield className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System Role</span>
                <span className="text-xs font-bold text-slate-950 dark:text-slate-200">{user.role}</span>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-start gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <Activity className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {user.status}
                </span>
              </div>
            </div>

            {/* Last Sign In */}
            <div className="flex items-start gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Login Session</span>
                <span className="text-xs font-bold text-slate-950 dark:text-slate-200">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'First Session'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/35 dark:border-indigo-900/10 rounded-xl mt-4 text-[10px] text-slate-450 dark:text-slate-500 leading-normal font-semibold text-left">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>Profile details are managed offline on your device inside an IndexedDB vault. To update information, contact your administrator.</span>
          </div>
        </div>
      </Drawer>

      {/* 2. Reusable Change Password Modal */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

      {/* 3. Reusable Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default ProfileMenu;
