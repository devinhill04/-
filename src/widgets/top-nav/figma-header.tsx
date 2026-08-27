import React from 'react';
import { ThemeToggle } from '../../shared/ui/theme-toggle';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

interface FigmaHeaderProps {
  activeScreen?: 'catalog' | 'solutions' | 'ecosystem' | 'pain_detail';
  onSelectScreen?: (screen: 'catalog' | 'solutions') => void;
  title?: string;
  showNavTabs?: boolean;
}

export const FigmaHeader: React.FC<FigmaHeaderProps> = ({
  activeScreen = 'catalog',
  onSelectScreen,
  showNavTabs = true,
}) => {
  return (
    <header className="w-full bg-white dark:bg-[#111111] transition-colors border-b border-[#F4F4F4] dark:border-neutral-800">
      {/* 1. Top Header Row: Frame 390x80 (pad: 12 12 12 12) */}
      <div className="w-full max-w-[390px] mx-auto px-3 py-3 flex items-center justify-between">
        {/* Avatar + Title + Subtitle */}
        <div
          onClick={() => {
            triggerHaptic('light');
            openPostLink('https://t.me/investfuture', 'Канал InvestFuture');
          }}
          className="flex items-center gap-3 cursor-pointer group active:opacity-80 transition-opacity"
        >
          {/* Avatar (56x56, cornerRadius: 12) */}
          <div
            style={{ width: '56px', height: '56px', borderRadius: '12px' }}
            className="overflow-hidden shrink-0 bg-[#F5F5F5] border border-black/5 dark:border-white/10"
          >
            <img
              src="/figma_assets/fill_ad6b082b617a802b8358b6de4c2b025b81969cdc.png"
              alt="InvestFuture"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title + Subtitle */}
          <div className="flex flex-col justify-center">
            <h1
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '25px',
              }}
              className="text-[#161616] dark:text-white"
            >
              InvestFuture
            </h1>
            <p
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '15px',
              }}
              className="text-[#7D7C82] dark:text-neutral-400"
            >
              Каталог полезных материалов
            </p>
          </div>
        </div>

        {/* Mode Switch (40x40, r: 8, pad: 8) */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* 2. Nav_Btns: Frame 390x60 (pad: T8 R12 B12 L12 gap:4) */}
      {showNavTabs && onSelectScreen && (
        <div className="w-full max-w-[390px] mx-auto px-3 pt-2 pb-3">
          <div className="flex gap-1 items-center">
            {/* Tab 1: Поиск по тегам */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onSelectScreen('catalog');
              }}
              style={{
                height: '40px',
                borderRadius: '8px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '17.5px',
              }}
              className={`flex-1 flex items-center justify-center transition-all cursor-pointer ${
                activeScreen === 'catalog'
                  ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616]'
                  : 'bg-white dark:bg-neutral-800 text-[#161616] dark:text-white border border-[#E5E5E5] dark:border-neutral-700'
              }`}
            >
              Поиск по тегам
            </button>

            {/* Tab 2: Готовые решения */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onSelectScreen('solutions');
              }}
              style={{
                height: '40px',
                borderRadius: '8px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '17.5px',
              }}
              className={`flex-1 flex items-center justify-center transition-all cursor-pointer ${
                activeScreen === 'solutions'
                  ? 'bg-[#161616] dark:bg-white text-white dark:text-[#161616]'
                  : 'bg-white dark:bg-neutral-800 text-[#161616] dark:text-white border border-[#E5E5E5] dark:border-neutral-700'
              }`}
            >
              Готовые решения
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
