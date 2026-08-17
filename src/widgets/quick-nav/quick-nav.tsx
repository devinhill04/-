import React, { useEffect, useRef } from 'react';
import { CATEGORIES } from '../../shared/config/categories';
import { triggerHaptic } from '../../lib/telegram';
import { BookOpen, TrendingUp, ShieldCheck, Layers } from 'lucide-react';

interface QuickNavProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  all: <Layers className="w-3.5 h-3.5" />,
  evergreen: <BookOpen className="w-3.5 h-3.5" />,
  invest: <TrendingUp className="w-3.5 h-3.5" />,
  useful: <ShieldCheck className="w-3.5 h-3.5" />,
};

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

  const allCategories = [
    { id: 'all', title: 'Все разделы' },
    ...CATEGORIES,
  ];

  return (
    <div className="sticky top-[101px] z-30 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl py-2.5 -mx-4 px-4 border-y dark:border-slate-800/80 border-slate-200/80 transition-all shadow-xs">
      <div
        ref={containerRef}
        className="flex items-center gap-2 max-w-md mx-auto overflow-x-auto no-scrollbar scroll-smooth"
      >
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeBtnRef : null}
              onClick={() => {
                triggerHaptic('light');
                onSelectCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                  : 'dark:bg-slate-900/80 dark:text-slate-300 dark:border-slate-800/80 dark:hover:bg-slate-800 bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {categoryIcons[cat.id] || <Layers className="w-3.5 h-3.5" />}
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


