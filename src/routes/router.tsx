import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import BlankLayout from '../layouts/BlankLayout';

// Full-screen loading spinner fallback for lazy suspense
const SuspenseLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse uppercase tracking-wider">
        Loading module, please wait...
      </p>
    </div>
  </div>
);

// Wrapper component fallback for lazy pages inside layout
interface LazyPageProps {
  Component: React.ComponentType<any>;
}

const LazyPage: React.FC<LazyPageProps> = ({ Component }) => (
  <Suspense
    fallback={
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
      </div>
    }
  >
    <Component />
  </Suspense>
);

import { useAuth, usePermissions } from '../hooks/useAuth';
import RoleGuard from '../components/auth/RoleGuard';

/**
 * Root/Home Redirect component
 * Redirects cashiers who don't have access to the Dashboard to /sales
 */
export const HomeRedirect: React.FC = () => {
  const { isCashier } = usePermissions();
  if (isCashier) {
    return <Navigate to="/sales" replace />;
  }
  return <LazyPage Component={Dashboard} />;
};

/**
 * Authentic Protected Route Guard
 * This guard ensures that the current session is valid and re-evaluates session state.
 */
interface RouteGuardProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  
  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return <SuspenseLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

/**
 * Authentic Public Route Guard (e.g. for Login page)
 * Prevents logged-in users from accessing the login screen.
 */
export const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  
  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return <SuspenseLoader />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Lazy loaded page components
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Categories = lazy(() => import('../pages/Categories'));
const Products = lazy(() => import('../pages/Products'));
const Suppliers = lazy(() => import('../pages/Suppliers'));
const Purchases = lazy(() => import('../pages/Purchases'));
const Customers = lazy(() => import('../pages/Customers'));
const Sales = lazy(() => import('../pages/Sales'));
const CreditPage = lazy(() => import('../pages/credit/CreditPage'));
const Expenses = lazy(() => import('../pages/Expenses'));
const Reports = lazy(() => import('../pages/Reports'));
const Settings = lazy(() => import('../pages/Settings'));
const CloudSync = lazy(() => import('../pages/CloudSync'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Error & Fallback pages
const ServerFailurePage = lazy(() => import('../pages/ServerFailurePage'));
const ComingSoon = lazy(() => import('../pages/ComingSoon'));
const UnderMaintenance = lazy(() => import('../pages/UnderMaintenance'));

// Auth pages
const Login = lazy(() => import('../pages/auth/Login'));

/**
 * Declares the application route hierarchy.
 * Core shop paths are protected and nested under MainLayout.
 */
export const router = createBrowserRouter([
  // 1. Private Dashboard Core Routes (MainLayout)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: (
      <Suspense fallback={<SuspenseLoader />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      {
        path: 'categories',
        element: (
          <RoleGuard module="categories" showDefaultFallbackCard>
            <LazyPage Component={Categories} />
          </RoleGuard>
        ),
      },
      {
        path: 'products',
        element: (
          <RoleGuard module="products" showDefaultFallbackCard>
            <LazyPage Component={Products} />
          </RoleGuard>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <RoleGuard module="suppliers" showDefaultFallbackCard>
            <LazyPage Component={Suppliers} />
          </RoleGuard>
        ),
      },
      {
        path: 'purchases',
        element: (
          <RoleGuard module="purchases" showDefaultFallbackCard>
            <LazyPage Component={Purchases} />
          </RoleGuard>
        ),
      },
      {
        path: 'customers',
        element: (
          <RoleGuard module="customers" showDefaultFallbackCard>
            <LazyPage Component={Customers} />
          </RoleGuard>
        ),
      },
      {
        path: 'sales',
        element: (
          <RoleGuard module="sales" showDefaultFallbackCard>
            <LazyPage Component={Sales} />
          </RoleGuard>
        ),
      },
      {
        path: 'credit',
        element: (
          <RoleGuard module="credit_payments" showDefaultFallbackCard>
            <LazyPage Component={CreditPage} />
          </RoleGuard>
        ),
      },
      {
        path: 'expenses',
        element: (
          <RoleGuard module="expenses" showDefaultFallbackCard>
            <LazyPage Component={Expenses} />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard module="reports" showDefaultFallbackCard>
            <LazyPage Component={Reports} />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard module="settings" showDefaultFallbackCard>
            <LazyPage Component={Settings} />
          </RoleGuard>
        ),
      },
      {
        path: 'sync',
        element: (
          <RoleGuard module="settings" showDefaultFallbackCard>
            <LazyPage Component={CloudSync} />
          </RoleGuard>
        ),
      },
      {
        path: 'coming-soon',
        element: <LazyPage Component={ComingSoon} />,
      },
      {
        path: '*',
        element: <LazyPage Component={NotFound} />,
      },
    ],
  },
  // 2. Public Auth Routes (AuthLayout)
  {
    path: '/login',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <LazyPage Component={Login} />,
      },
    ],
  },
  // 3. Fallback & Server Maintenance Views (BlankLayout)
  {
    path: '/error',
    element: <BlankLayout />,
    children: [
      {
        path: '500',
        element: <LazyPage Component={ServerFailurePage} />,
      },
      {
        path: 'maintenance',
        element: <LazyPage Component={UnderMaintenance} />,
      },
    ],
  },
]);

export default router;
