import React from 'react';
import { ThemeToggle } from '../../shared/ui/theme-toggle';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';
import { TELEGRAM_CHANNEL } from '../../shared/config/channel';
import ifLogo from '../../assets/images/if-logo.png';

interface TopNavProps {
  onOpenResources?: () => void;
}

export const TopNav: React.FC<TopNavProps> = () => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl dark:bg-slate-950/95 bg-white/95 dark:border-slate-800/80 border-slate-200/80 border-b transition-colors duration-200">
      {/* Header: padding: 12px; justify-content: space-between; align-items: center */}
      <div className="max-w-[430px] mx-auto flex items-center justify-between p-3">
        {/* Avatar + Title + Subtitle: gap: 12px; flex: 1 0 0 */}
        <div
          onClick={() => {
            triggerHaptic('light');
            openPostLink(TELEGRAM_CHANNEL.url, 'Канал InvestFuture');
          }}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none group active:scale-98 transition-transform"
        >
          {/* Avatar: 56x56, radius 12px, cover bg image */}
          <div
            className="w-[56px] h-[56px] aspect-square rounded-[12px] bg-gray-300 bg-cover bg-center shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundImage: `url(${ifLogo})` }}
          />

          {/* Title + Subtitle: gap: 4px */}
          <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
            <h1 className="self-stretch truncate text-[var(--Content-Dark)] dark:text-slate-100 font-manrope text-[20px] font-semibold leading-[125%]">
              InvestFuture
            </h1>
            <p className="self-stretch truncate text-[var(--Content-Dark_Gray)] dark:text-slate-400 font-manrope text-[12px] font-medium leading-[125%]">
              Каталог полезных материалов
            </p>
          </div>
        </div>

        {/* Right: Theme Toggle (Moon / Sun), Btn/Mode_Switch: padding 8px, radius 8px, bg #F9F9F9 */}
        <div className="flex items-center shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Divider: height 1px, bg #F9F9F9 */}
      <div className="h-px w-full bg-[var(--Content-Light_Gray)] dark:bg-slate-800/80" />
    </header>
  );
};
