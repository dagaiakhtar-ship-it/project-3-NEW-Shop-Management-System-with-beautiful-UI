import React from 'react';
import PageHeader from '../components/common/layout/PageHeader';
import Breadcrumb, { BreadcrumbItem } from '../components/common/layout/Breadcrumb';

interface PageLayoutProps {
  title: string;
  description?: string;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * PageLayout Component
 * Standard shell wrapping for inner application views.
 * Handles automatic headers, breadcrumbs, and content spacing.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  breadcrumbItems,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full animate-fade-in ${className}`}>
      {/* Breadcrumb row */}
      {breadcrumbItems && (
        <Breadcrumb items={breadcrumbItems} className="mb-4" />
      )}

      {/* Header bar section */}
      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />

      {/* Main page body viewport */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
