import React, { useEffect, useRef } from 'react';
import { CATEGORIES } from '../../shared/config/categories';
import { triggerHaptic } from '../../lib/telegram';

interface QuickNavProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const QuickNav: React.FC<QuickNavProps> = ({ activeCategory, onSelectCategory }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the active category button into center view horizontally
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      const container = containerRef.current;
      const btn = activeBtnRef.current;
      const containerWidth = container.offsetWidth;
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const scrollTarget = btnLeft - containerWidth / 2 + btnWidth / 2;

      container.scrollTo({
        left: scrollTarget,
        behavior: 'smooth',
      });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-[61px] z-30 dark:bg-slate-950/95 bg-[#F4F5F7]/95 backdrop-blur-xl py-2 -mx-4 px-4 transition-all">
      <div
        ref={containerRef}
        className="flex items-center gap-2 max-w-[430px] mx-auto overflow-x-auto no-scrollbar scroll-smooth"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeBtnRef : null}
              onClick={() => {
                triggerHaptic('light');
                onSelectCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              }`}
            >
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


