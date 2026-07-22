import React from 'react';
import Badge from '../ui/Badge';

interface CustomerStatusBadgeProps {
  status: 'Active' | 'Inactive' | 'Blocked' | string;
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status }) => {
  let variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';

  switch (status) {
    case 'Active':
      variant = 'success';
      break;
    case 'Inactive':
      variant = 'warning';
      break;
    case 'Blocked':
      variant = 'danger';
      break;
    default:
      variant = 'neutral';
  }

  return (
    <Badge
      variant={variant}
      size="sm"
      className="font-semibold uppercase tracking-wider text-[10px] rounded-full px-2.5 py-0.5"
    >
      {status}
    </Badge>
  );
};

export default CustomerStatusBadge;
