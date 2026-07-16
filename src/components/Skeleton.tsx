import React from "react";

export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-neutral-200 dark:bg-slate-800 rounded-xl ${className}`} />
);

export const QuoteSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-orange-100 dark:border-slate-850 shadow-sm space-y-4">
    <div className="flex items-center gap-3">
      <SkeletonPulse className="w-8 h-8 rounded-full" />
      <SkeletonPulse className="w-24 h-4" />
    </div>
    <SkeletonPulse className="w-full h-16" />
    <SkeletonPulse className="w-20 h-4 mx-auto" />
  </div>
);

export const PanchangSkeleton: React.FC = () => (
  <div className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-md rounded-[28px] p-5 border border-orange-100 dark:border-slate-850 shadow-sm space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <SkeletonPulse className="w-20 h-2" />
          <SkeletonPulse className="w-32 h-4" />
        </div>
      </div>
      <SkeletonPulse className="w-24 h-6 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-3.5">
      <SkeletonPulse className="w-full h-14" />
      <SkeletonPulse className="w-full h-14" />
      <SkeletonPulse className="w-full h-14" />
      <SkeletonPulse className="w-full h-14" />
    </div>
  </div>
);

export const CategoryListSkeleton: React.FC = () => (
  <div className="grid grid-cols-4 gap-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex flex-col items-center space-y-2">
        <SkeletonPulse className="w-16 h-16 rounded-[22px]" />
        <SkeletonPulse className="w-12 h-3" />
      </div>
    ))}
  </div>
);

export const VideoListSkeleton: React.FC = () => (
  <div className="flex gap-4.5 overflow-x-auto pb-4 hide-scrollbar">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="min-w-[260px] max-w-[260px] space-y-3">
        <SkeletonPulse className="w-full aspect-video rounded-[22px]" />
        <SkeletonPulse className="w-5/6 h-4" />
        <SkeletonPulse className="w-2/3 h-3" />
      </div>
    ))}
  </div>
);

export const ProductGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-4">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-[24px] border border-orange-100 dark:border-slate-800 space-y-3">
        <SkeletonPulse className="w-full aspect-square rounded-2xl" />
        <SkeletonPulse className="w-3/4 h-3" />
        <div className="flex justify-between items-center">
          <SkeletonPulse className="w-1/3 h-4" />
          <SkeletonPulse className="w-1/2 h-8 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
