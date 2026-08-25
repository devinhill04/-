import React from 'react';
import { ThemeToggle } from '../../shared/ui/theme-toggle';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';
import { TELEGRAM_CHANNEL } from '../../shared/config/channel';

interface TopNavProps {
  onOpenResources?: () => void;
}

export const TopNav: React.FC<TopNavProps> = () => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl dark:bg-slate-950/95 bg-white/95 dark:border-slate-800/80 border-slate-200/80 border-b px-4 py-3 transition-colors duration-200">
      <div className="max-w-[430px] mx-auto flex items-center justify-between gap-3">
        {/* Left: InvestFuture Logo Badge + Title */}
        <div
          onClick={() => {
            triggerHaptic('light');
            openPostLink(TELEGRAM_CHANNEL.url, 'Канал InvestFuture');
          }}
          className="flex items-center gap-3 min-w-0 cursor-pointer select-none group active:scale-98 transition-transform"
        >
          {/* IF Rounded Squircle Logo */}
          <div className="w-10 h-10 rounded-2xl bg-[#EEF0FF] dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center text-[#5542F6] dark:text-purple-300 font-black text-base tracking-tight shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            IF
          </div>

          <div className="min-w-0">
            <h1 className="font-extrabold dark:text-slate-100 text-slate-900 text-base tracking-tight leading-tight truncate">
              InvestFuture
            </h1>
            <p className="text-xs dark:text-slate-400 text-slate-500 font-normal leading-none mt-0.5 truncate">
              Каталог полезных материалов
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle (Moon / Sun) */}
        <div className="flex items-center shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
