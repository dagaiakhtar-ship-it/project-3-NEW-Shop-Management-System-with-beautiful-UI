import React from 'react';

export const LoadingCart: React.FC = () => {
  return (
    <div
      className="w-full flex flex-col gap-5 animate-pulse select-none text-left"
      id="pos-shopping-cart-loading-skeleton"
    >
      {/* 1. Cart Items Skeletons */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-[92px] rounded-[14px] bg-white border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3 shadow-3xs"
          >
            {/* Image Placeholder */}
            <div className="h-[60px] w-[60px] rounded-[12px] bg-gray-100 shrink-0" />

            {/* Middle Section */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3.5 w-1/2 bg-gray-150 rounded" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="h-8 w-20 bg-gray-200 rounded-lg" />
              <div className="h-4 w-12 bg-gray-150 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Customer Card Skeleton */}
      <div className="rounded-[16px] border border-[#E5E7EB] p-[18px] bg-white flex flex-col gap-3.5 shadow-3xs">
        <div className="flex justify-between items-center">
          <div className="h-5 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-150">
          <div className="h-10 w-10 rounded-xl bg-gray-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* 3. Summary Skeleton */}
      <div className="rounded-[16px] border border-[#E5E7EB] p-5 bg-white flex flex-col gap-3 shadow-3xs">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="flex flex-col gap-2 pt-2 border-b border-gray-100 pb-3">
          <div className="flex justify-between">
            <div className="h-3.5 w-16 bg-gray-150 rounded" />
            <div className="h-3.5 w-12 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-3.5 w-14 bg-gray-150 rounded" />
            <div className="h-3.5 w-10 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 w-20 bg-gray-150 rounded" />
          <div className="h-7 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoadingCart);
