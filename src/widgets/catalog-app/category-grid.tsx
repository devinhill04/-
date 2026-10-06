import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AppCategory } from '../../entities/app-content/model/types';
import { triggerHaptic } from '../../lib/telegram';

interface Props {
  title: string;
  subtitle: string;
  categories: AppCategory[];
  onSelect: (c: AppCategory) => void;
}

// Карточки «Готовых решений»: белые, акцент — цвет приложения (--accent). Если карточек нечётное число,
// последняя растягивается на всю ширину, чтобы внизу не оставалось «дырки».
export const CategoryGrid: React.FC<Props> = ({ title, subtitle, categories, onSelect }) => (
  <div className="w-full max-w-[390px] mx-auto px-3 py-3 flex flex-col gap-6 select-none">
    <div className="flex flex-col gap-2 items-center text-center">
      <h2
        style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: '24px', lineHeight: '30px' }}
        className="text-[#161616] dark:text-white"
      >
        {title}
      </h2>
      <p
        style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '18px' }}
        className="text-[#161616]/80 dark:text-neutral-300"
      >
        {subtitle}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {categories.map((c, i) => {
        const isLastOdd = categories.length % 2 === 1 && i === categories.length - 1;
        return (
          <button
            key={c.id}
            onClick={() => { triggerHaptic('light'); onSelect(c); }}
            style={{ borderRadius: '12px' }}
            className={`relative text-left p-4 flex flex-col gap-3 bg-white dark:bg-neutral-800/80 border border-[#EAEAEA] dark:border-white/10 active:scale-[0.98] transition-transform ${
              isLastOdd ? 'col-span-2' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-[24px] leading-none bg-[var(--accent-soft)]">
                {c.emoji}
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p
                style={{ fontFamily: "'Manrope', sans-serif" }}
                className="text-[#161616] dark:text-white text-[15px] font-semibold leading-tight"
              >
                {c.title}
              </p>
              <p
                style={{ fontFamily: "'Manrope', sans-serif" }}
                className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-[16px] line-clamp-3"
              >
                {c.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
