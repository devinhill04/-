import React, { useEffect, useState } from 'react';
import { CalendarDays, LayoutGrid, TrendingUp } from 'lucide-react';
import { HomePage } from '../pages/home/home-page';
import { MarketScreen } from '../widgets/market-screen/market-screen';
import { CalendarScreen } from '../widgets/calendar-screen/calendar-screen';
import { initTelegramTheme } from '../shared/theme/init-telegram';
import { triggerHaptic } from '../lib/telegram';
import { AnalyticsService } from '../shared/analytics/analytics';
import { CatalogApp } from '../widgets/catalog-app/catalog-app';
import { MiniAppsProvider } from '../shared/lib/mini-app-context';
import { MINI_APPS, loadCurrentAppId, saveCurrentAppId } from '../shared/config/mini-apps';

type Section = 'feed' | 'market' | 'calendar';

// Вкладки нижней навигации; event — событие аналитики при открытии вкладки
const NAV: { id: Section; label: string; Icon: React.ComponentType<{ className?: string }>; event?: 'market_open' | 'calendar_open' }[] = [
  { id: 'feed', label: 'Материалы', Icon: LayoutGrid },
  { id: 'market', label: 'Рынок', Icon: TrendingUp, event: 'market_open' },
  { id: 'calendar', label: 'Календари', Icon: CalendarDays, event: 'calendar_open' },
];

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('feed');
  const [appId, setAppId] = useState(() => loadCurrentAppId());
  const currentApp = MINI_APPS.find((a) => a.id === appId) ?? MINI_APPS[0];

  const selectApp = (id: string) => {
    saveCurrentAppId(id);
    setAppId(id);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    initTelegramTheme();
  }, []);

  // Отдельное приложение из каталога (например «Работа не рабство») — без нижней навигации и вкладки «Рынок»
  if (currentApp.kind === 'catalog') {
    return (
      <MiniAppsProvider value={{ apps: MINI_APPS, currentApp, selectApp }}>
        <div data-app={currentApp.id}>
          <CatalogApp key={currentApp.id} app={currentApp} />
        </div>
      </MiniAppsProvider>
    );
  }

  return (
    <MiniAppsProvider value={{ apps: MINI_APPS, currentApp, selectApp }}>
    <div data-app={currentApp.id} className="min-h-screen flex flex-col bg-white dark:bg-[#111111]">
      <div className="flex-1 pb-16">
        {activeSection === 'feed' ? <HomePage /> : activeSection === 'market' ? <MarketScreen /> : <CalendarScreen />}
      </div>

      {/* Нижняя навигация */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111111] border-t border-black/5 dark:border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-[430px] mx-auto flex items-stretch">
          {NAV.map(({ id, label, Icon, event }) => {
            const active = activeSection === id;
            const color = active ? 'text-[var(--accent)]' : 'text-[#7D7C82] dark:text-neutral-500';
            return (
              <button
                key={id}
                onClick={() => {
                  triggerHaptic('light');
                  if (!active && event) AnalyticsService.track(event);
                  setActiveSection(id);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className={`text-[11px] font-medium ${color}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
    </MiniAppsProvider>
  );
};
