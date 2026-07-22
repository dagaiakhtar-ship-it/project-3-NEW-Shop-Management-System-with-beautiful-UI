import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 8,
  viewMode = 'grid',
}) => {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-[16px] overflow-hidden shadow-xs divide-y divide-[#E5E7EB] animate-pulse">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 px-5 py-4 items-center">
            <div className="col-span-1 h-5 w-5 bg-gray-200 rounded" />
            <div className="col-span-6 flex flex-col gap-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
            <div className="col-span-2 h-4 w-24 bg-gray-200 rounded" />
            <div className="col-span-1.5 h-4 w-12 bg-gray-200 rounded ml-auto" />
            <div className="col-span-1.5 h-4 w-16 bg-gray-200 rounded ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[18px] w-full animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-[250px] bg-white border border-[#E5E7EB] rounded-[16px] p-4 flex flex-col justify-between"
        >
          {/* Top row */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-12 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
          </div>

          {/* Center Image */}
          <div className="h-[110px] w-full bg-gray-100 rounded-[12px] my-2 flex items-center justify-center">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
          </div>

          {/* Bottom section */}
          <div className="flex items-end justify-between mt-1">
            <div className="flex flex-col gap-1.5">
              <div className="h-4.5 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-[42px] w-[72px] bg-gray-200 rounded-[10px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(LoadingSkeleton);
