import React from 'react';
import { usePermissions } from '../../hooks/useAuth';
import type { UserRole } from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  /**
   * The name of the module/action to check access permissions for.
   * Uses the centralized RBAC mapping.
   */
  module?: string;
  /**
   * Directly list the user roles authorized to view this component.
   * Alternative to module checks.
   */
  allowedRoles?: UserRole[];
  /**
   * Custom fallback UI to show when access is denied.
   * Defaults to rendering nothing (null) if not specified.
   */
  fallback?: React.ReactNode;
  /**
   * If true, shows a full Access Denied card UI as a default fallback instead of null.
   */
  showDefaultFallbackCard?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  module,
  allowedRoles,
  fallback,
  showDefaultFallbackCard = false,
}) => {
  const { role, canAccess } = usePermissions();

  let hasAccess = false;

  if (module) {
    hasAccess = canAccess(module);
  } else if (allowedRoles && role) {
    hasAccess = allowedRoles.includes(role);
  } else {
    // If no permission parameters are specified, default to allowing access
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle unauthorized state
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDefaultFallbackCard) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto my-6 animate-fade-in">
        <div className="p-3 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-xl mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
          Access Restricted
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          You do not have the necessary permissions to access this feature. Please contact your system administrator.
        </p>
      </div>
    );
  }

  return null;
};

export default RoleGuard;
