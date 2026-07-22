import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Calendar, Clock, Sparkles, Store, ShieldAlert } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { APP_INFO } from '../../constants/constants';

export const DashboardHeader: React.FC = () => {
  const { currentUser } = useAppStore();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Keep date and clock in sync in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute dynamic greeting based on hour of the day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl relative overflow-hidden text-left"
    >
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
        
        {/* Left Side: Welcome and user profiles details */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
            {currentUser?.name ? (
              <span className="font-black text-2xl text-indigo-300">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Sparkles className="h-6 w-6 text-indigo-300" />
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                {currentUser?.role || 'Staff Member'}
              </span>
              <span className="text-[10px] font-bold text-indigo-200/85 flex items-center gap-1">
                <Store className="h-3 w-3" />
                {APP_INFO.name}
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-100 to-white">{currentUser?.name || 'Guest Operator'}</span>!
            </h2>
            
            <p className="text-xs text-indigo-200/70 font-semibold leading-relaxed mt-0.5">
              Welcome back to your checkout terminal. Let's manage your shop inventory and POS sales.
            </p>
          </div>
        </div>

        {/* Right Side: Quick search (connected later) and digital clock panel */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center md:flex-col md:items-end md:gap-3 shrink-0">
          
          {/* Ticking clock panel */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold w-fit select-none">
            <div className="flex items-center gap-1.5 text-indigo-200">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="h-3 w-px bg-white/15" />
            <div className="flex items-center gap-1.5 font-mono text-white">
              <Clock className="h-4 w-4 text-indigo-300 animate-pulse" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Quick Search Panel Placeholder (linked later) */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Global index search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-bold bg-white/5 hover:bg-white/10 focus:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 placeholder-white/35"
            />
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default DashboardHeader;
