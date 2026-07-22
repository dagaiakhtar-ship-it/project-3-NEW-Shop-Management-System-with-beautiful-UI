import React from 'react';
import PageLayout from './PageLayout';

interface DashboardLayoutProps {
  title?: string;
  description?: string;
  statsGrid?: React.ReactNode;
  chartsGrid?: React.ReactNode;
  recentActivity?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * DashboardLayout Component
 * A layout template tailored for dashboards, presenting stats,
 * charts, and list items in an organized modern bento grid.
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title = 'Business Dashboard',
  description = 'Overview of your single-shop retail metrics',
  statsGrid,
  chartsGrid,
  recentActivity,
  actions,
  children,
}) => {
  return (
    <PageLayout title={title} description={description} actions={actions}>
      <div className="flex flex-col gap-6 w-full">
        {/* KPI stats layer */}
        {statsGrid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statsGrid}
          </div>
        )}

        {/* Dynamic charts bento layer */}
        {chartsGrid && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {chartsGrid}
          </div>
        )}

        {/* Recent activity & custom layouts */}
        {recentActivity && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {recentActivity}
          </div>
        )}

        {/* Default catch-all body wrapper */}
        {children && (
          <div className="w-full">
            {children}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DashboardLayout;
