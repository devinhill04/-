import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-slate-800 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 bg-slate-800 rounded w-3/4" />
          <div className="h-2.5 bg-slate-800/80 rounded w-full" />
          <div className="h-2.5 bg-slate-800/80 rounded w-2/3" />
        </div>
      </div>
      <div className="flex gap-1.5 pt-1">
        <div className="h-4 w-12 bg-slate-800 rounded-md" />
        <div className="h-4 w-16 bg-slate-800 rounded-md" />
      </div>
    </div>
  );
};
