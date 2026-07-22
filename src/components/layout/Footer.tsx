import React from 'react';
import { APP_INFO } from '../../constants/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-6 border-t border-slate-100 bg-white text-center transition-colors dark:border-slate-800/80 dark:bg-slate-950">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row max-w-7xl mx-auto">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {APP_INFO.copyright}
        </p>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <span>v{APP_INFO.version}</span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
          <a
            href={`mailto:${APP_INFO.supportEmail}`}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
