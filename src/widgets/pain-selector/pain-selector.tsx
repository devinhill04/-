import React, { useState } from 'react';
import { Sparkles, ExternalLink, ChevronRight } from 'lucide-react';
import { Pain, PainSolution } from '../../entities/pain/model/types';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { track } from '../../shared/lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface PainSelectorProps {
  pains: Pain[];
  solutions: PainSolution[];
}

// Accent styles for cards from Figma
const CARD_ACCENTS = [
  { bg: 'bg-[#D6F5E3] dark:bg-emerald-950/60', text: 'text-emerald-900 dark:text-emerald-200' },
  { bg: 'bg-[#FFE2EC] dark:bg-pink-950/60', text: 'text-pink-900 dark:text-pink-200' },
  { bg: 'bg-[#E3E8FF] dark:bg-indigo-950/60', text: 'text-indigo-900 dark:text-indigo-200' },
  { bg: 'bg-[#FFF2D6] dark:bg-amber-950/60', text: 'text-amber-900 dark:text-amber-200' },
];

export const PainSelector: React.FC<PainSelectorProps> = ({ pains, solutions }) => {
  const [selectedPainSlug, setSelectedPainSlug] = useState<string | null>(pains[0]?.slug || null);

  const activePain = pains.find((p) => p.slug === selectedPainSlug);
  const activeSolutions = solutions.filter((s) => s.painSlug === selectedPainSlug);

  const handleSelectPain = (slug: string) => {
    triggerHaptic('light');
    setSelectedPainSlug(slug);
    track('pain_selected', { slug });
  };

  return (
    <div className="space-y-4 pt-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#5542F6] dark:text-purple-400" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Готовые решения под задачи
        </h2>
      </div>

      {/* Pains Grid (Figma Cards with Color Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pains.map((pain, index) => {
          const isSelected = pain.slug === selectedPainSlug;
          const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

          return (
            <div
              key={pain.slug}
              onClick={() => handleSelectPain(pain.slug)}
              className={`rounded-2xl border transition-all cursor-pointer overflow-hidden relative flex flex-col justify-between p-4 active:scale-[0.99] shadow-2xs ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-purple-500 ring-2 ring-[#5542F6]/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Left Accent Strip / Box */}
              <div className="flex items-start gap-3">
                <div className={`w-3 h-10 rounded-full shrink-0 ${accent.bg}`} />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {pain.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {pain.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold">
                <span className={isSelected ? 'text-[#5542F6] dark:text-purple-400' : 'text-slate-400'}>
                  {isSelected ? 'Выбрано' : 'Смотреть подборку'}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#5542F6] dark:text-purple-400 translate-x-0.5' : 'text-slate-400'} transition-transform`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Solutions Section */}
      {activePain && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 px-1">
            <span>Материалы по теме: <span className="text-[#5542F6] dark:text-purple-400">{activePain.title}</span></span>
            <span className="text-slate-400">({activeSolutions.length})</span>
          </div>

          {activeSolutions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              Посты по данной теме подбираются ассистентом...
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeSolutions.map((sol) => (
                <div
                  key={sol.id}
                  onClick={() => {
                    track('pain_solution_open', { id: sol.id, title: sol.title });
                    openPostLink(sol.url, sol.title);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group active:scale-[0.99] shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="inline-flex items-center text-[10px] font-semibold bg-[#F5F6F8] dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      @{sol.channel}
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#5542F6] dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
                      {sol.title}
                    </h4>
                  </div>

                  <div className="shrink-0 p-1 text-slate-400 dark:text-slate-500 group-hover:text-[#5542F6] dark:group-hover:text-purple-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

