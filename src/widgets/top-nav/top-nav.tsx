import React from 'react';
import { Send, Sparkles, BookOpen, HeartPulse } from 'lucide-react';
import { ThemeToggle } from '../../shared/ui/theme-toggle';
import { TELEGRAM_CHANNEL } from '../../shared/config/channel';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

interface TopNavProps {
  activeScreen: 'catalog' | 'pains';
  onSelectScreen: (screen: 'catalog' | 'pains') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeScreen, onSelectScreen }) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl dark:bg-slate-950/90 dark:border-slate-800/80 bg-white/95 border-slate-200/80 border-b px-4 py-2.5 shadow-xs transition-colors duration-200">
      <div className="max-w-md mx-auto space-y-2.5">
        {/* Upper Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openPostLink(TELEGRAM_CHANNEL.url, 'Канал InvestFuture')}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 active:scale-95 transition-transform"
            >
              <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold dark:text-slate-100 text-slate-900 text-sm tracking-tight leading-none">
                  {TELEGRAM_CHANNEL.name}
                </h1>
                <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Mini App
                </span>
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">Каталог полезных материалов</p>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* Screen Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 dark:bg-slate-900/90 dark:border-slate-800/80 bg-slate-100 border-slate-200 rounded-xl border">
          <button
            onClick={() => {
              triggerHaptic('light');
              onSelectScreen('catalog');
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeScreen === 'catalog'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 dark:hover:text-slate-200 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Каталог постов</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onSelectScreen('pains');
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeScreen === 'pains'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 dark:hover:text-slate-200 hover:text-slate-800'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Боли → Решения</span>
          </button>
        </div>
      </div>
    </header>
  );
};


