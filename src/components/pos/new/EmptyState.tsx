import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Products Found',
  description = "We couldn't find any items matching your filters or search query.",
  icon,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-[#E5E7EB] rounded-[16px] text-center w-full shadow-xs shrink-0"
      id="pos-catalog-empty-state"
    >
      <div className="h-16 w-16 bg-[#F5F7FA] rounded-full flex items-center justify-center border border-[#E5E7EB] text-[#6B7280] mb-4 shadow-3xs">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-[16px] font-bold text-[#111827] tracking-tight">
        {title}
      </h3>
      <p className="text-[13px] text-[#6B7280] font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default React.memo(EmptyState);
