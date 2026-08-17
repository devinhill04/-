import React, { useState } from 'react';
import { HeartPulse, CheckCircle, ExternalLink, ArrowRight, Send, HelpCircle } from 'lucide-react';
import { Pain, PainSolution } from '../../entities/pain/model/types';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { track } from '../../shared/lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface PainSelectorProps {
  pains: Pain[];
  solutions: PainSolution[];
}

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
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="bg-gradient-to-r dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 from-rose-50 via-slate-100 to-slate-100 border dark:border-rose-500/30 border-rose-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center">
            <HeartPulse className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold dark:text-slate-100 text-slate-900">Навигатор по Вашим задачам</h2>
            <p className="text-[11px] dark:text-slate-400 text-slate-500">Выберите проблему — получите готовую подборку постов</p>
          </div>
        </div>
      </div>

      {/* Pains Grid */}
      <div className="grid grid-cols-1 gap-2">
        {pains.map((pain) => {
          const isSelected = pain.slug === selectedPainSlug;
          return (
            <button
              key={pain.slug}
              onClick={() => handleSelectPain(pain.slug)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 active:scale-98 ${
                isSelected
                  ? 'dark:bg-rose-950/30 dark:border-rose-500/60 bg-rose-50 border-rose-300 shadow-xs'
                  : 'dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:border-slate-800 bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold dark:text-slate-100 text-slate-900">
                  <HelpCircle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span>{pain.title}</span>
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-500 pl-5">{pain.description}</p>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-rose-500 border-rose-400 text-white dark:text-slate-950'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-transparent'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Solutions Cards */}
      {activePain && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs font-bold dark:text-slate-200 text-slate-800 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Решения для: <span className="text-rose-500 dark:text-rose-400">{activePain.title}</span>
            </span>
            <span className="text-[11px] dark:text-slate-400 text-slate-500">({activeSolutions.length})</span>
          </div>

          {activeSolutions.length === 0 ? (
            <div className="p-4 text-center text-xs dark:text-slate-400 text-slate-500 dark:bg-slate-900/60 bg-white rounded-xl border dark:border-slate-800 border-slate-200">
              Посты по данной теме подбираются ассистентом...
            </div>
          ) : (
            activeSolutions.map((sol) => (
              <div
                key={sol.id}
                onClick={() => {
                  track('pain_solution_open', { id: sol.id, title: sol.title });
                  openPostLink(sol.url, sol.title);
                }}
                className="dark:bg-slate-900/90 dark:hover:bg-slate-800/90 dark:border-slate-800 dark:hover:border-purple-500/40 bg-white hover:bg-slate-50 border-slate-200/80 hover:border-purple-400 rounded-2xl p-3.5 transition-all cursor-pointer group active:scale-98 shadow-sm border flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20">
                    <Send className="w-2.5 h-2.5" />
                    @{sol.channel}
                  </div>
                  <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                    {sol.title}
                  </h4>
                </div>

                <div className="w-8 h-8 rounded-xl dark:bg-slate-800 bg-slate-100 text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:bg-purple-500/20 flex items-center justify-center shrink-0 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

