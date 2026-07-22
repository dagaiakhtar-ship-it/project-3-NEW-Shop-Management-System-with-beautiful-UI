import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

// =====================================================================
// 1. SettingsCard Component
// =====================================================================
interface SettingsCardProps {
  title?: string;
  description?: string;
  icon?: any;
  children: React.ReactNode;
  borderAccent?: boolean;
  accentColor?: 'primary' | 'danger' | 'warning' | 'success';
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  borderAccent = false,
  accentColor = 'primary'
}) => {
  let accentClass = '';
  if (borderAccent) {
    if (accentColor === 'primary') accentClass = 'border-t-4 border-t-indigo-600 dark:border-t-indigo-400';
    if (accentColor === 'danger') accentClass = 'border-t-4 border-t-red-500';
    if (accentColor === 'warning') accentClass = 'border-t-4 border-t-amber-500';
    if (accentColor === 'success') accentClass = 'border-t-4 border-t-emerald-500';
  }

  return (
    <div className={`w-full p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col gap-4 text-left select-none ${accentClass}`}>
      {(title || description) && (
        <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
            <h3 className="text-xs font-black uppercase tracking-tight text-slate-850 dark:text-slate-100">{title}</h3>
          </div>
          {description && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
};

// =====================================================================
// 2. SettingsGroup Component
// =====================================================================
interface SettingsGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="flex flex-col gap-3 py-1.5 border-b border-slate-100/60 dark:border-slate-850/60 last:border-b-0 pb-4 last:pb-0">
      <div className="flex flex-col text-left">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-450">
          {title}
        </h4>
        {description && (
          <p className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 leading-normal mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        {children}
      </div>
    </div>
  );
};

// =====================================================================
// 3. SettingsForm Component
// =====================================================================
interface SettingsFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  onCancel?: () => void;
  isSaving?: boolean;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  onSubmit,
  children,
  onCancel,
  isSaving = false
}) => {
  return (
    <form onSubmit={onSubmit} className="w-full flex flex-col gap-6">
      {children}
    </form>
  );
};
