import React, { useEffect, useState } from 'react';
import { LayoutGrid, TrendingUp } from 'lucide-react';
import { HomePage } from '../pages/home/home-page';
import { MarketScreen } from '../widgets/market-screen/market-screen';
import { initTelegramTheme } from '../shared/theme/init-telegram';
import { triggerHaptic } from '../lib/telegram';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'feed' | 'market'>('feed');

  useEffect(() => {
    initTelegramTheme();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111111]">
      <div className="flex-1 pb-16">
        {activeSection === 'feed' ? <HomePage /> : <MarketScreen />}
      </div>

      {/* Нижняя навигация */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111111] border-t border-black/5 dark:border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-[430px] mx-auto flex items-stretch">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveSection('feed');
            }}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
          >
            <LayoutGrid
              className={`w-5 h-5 ${
                activeSection === 'feed' ? 'text-[#5737FA]' : 'text-[#7D7C82] dark:text-neutral-500'
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                activeSection === 'feed' ? 'text-[#5737FA]' : 'text-[#7D7C82] dark:text-neutral-500'
              }`}
            >
              Материалы
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveSection('market');
            }}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
          >
            <TrendingUp
              className={`w-5 h-5 ${
                activeSection === 'market' ? 'text-[#5737FA]' : 'text-[#7D7C82] dark:text-neutral-500'
              }`}
            />
            <span
              className={`text-[11px] font-medium ${
                activeSection === 'market' ? 'text-[#5737FA]' : 'text-[#7D7C82] dark:text-neutral-500'
              }`}
            >
              Рынок
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
