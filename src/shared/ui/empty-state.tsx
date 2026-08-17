import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Материалы не найдены",
  description = "Попробуйте изменить параметры поиска или сбросить фильтры.",
  actionText,
  onAction
}) => {
  return (
    <div className="py-10 px-4 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
