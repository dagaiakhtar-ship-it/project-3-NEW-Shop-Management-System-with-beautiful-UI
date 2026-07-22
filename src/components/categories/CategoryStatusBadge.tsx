import React from 'react';
import Badge from '../ui/Badge';

interface CategoryStatusBadgeProps {
  status?: 'Active' | 'Inactive' | 'Archived';
  className?: string;
}

export const CategoryStatusBadge: React.FC<CategoryStatusBadgeProps> = ({
  status = 'Active',
  className = '',
}) => {
  const getVariant = () => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'warning';
      case 'Archived':
        return 'danger';
      default:
        return 'slate';
    }
  };

  return (
    <Badge variant={getVariant()} size="sm" className={className}>
      {status}
    </Badge>
  );
};

export default CategoryStatusBadge;
