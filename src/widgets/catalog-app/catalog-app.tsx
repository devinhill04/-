import React, { useEffect, useMemo, useState } from 'react';
import { FigmaHeader } from '../top-nav/figma-header';
import { FigmaPainDetailScreen } from '../pain-detail/figma-pain-detail';
import { FigmaTagSearch } from '../tag-search/figma-tag-search';
import { BannersCarousel } from '../banners-carousel/banners-carousel';
import { FigmaEcosystemScreen } from '../ecosystem/figma-ecosystem-screen';
import { CategoryGrid } from './category-grid';
import { MiniApp } from '../../shared/config/mini-apps';
import { AppCategory } from '../../entities/app-content/model/types';
import { categoryToPosts } from '../../entities/app-content/model/to-posts';
import { useAppContent } from '../../entities/app-content/model/use-app-content';
import { AnalyticsService } from '../../shared/analytics/analytics';

type Tab = 'catalog' | 'solutions';

const STATE_KEY = 'if_catalog_state_v2';

// Запоминаем вкладку и открытую карточку: когда человек жмёт на пост, Telegram закрывает мини-апп,
// а при повторном открытии он должен вернуться туда же, где был
interface State { tab: Tab; slug: string | null; eco: boolean }

const loadState = (appId: string, defaultTab: Tab): State => {
  try {
    const s = JSON.parse(localStorage.getItem(STATE_KEY) || '{}')[appId];
    return {
      tab: s?.tab === 'catalog' || s?.tab === 'solutions' ? s.tab : defaultTab,
      slug: typeof s?.slug === 'string' ? s.slug : null,
      eco: s?.eco === true,
    };
  } catch {
    return { tab: defaultTab, slug: null, eco: false };
  }
};
const saveState = (appId: string, st: State) => {
  try {
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    all[appId] = st;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  } catch { /* память недоступна — не критично */ }
};

// Приложение из каталога по тому же образцу, что и основное: шапка с вкладками «Поиск по тегам» / «Готовые решения».
// Где контента нет — пусто: у «Работа не рабство» нет тегов и баннеров, поэтому вкладка тегов без чипов, баннеров нет.
export const CatalogApp: React.FC<{ app: MiniApp }> = ({ app }) => {
  const { content, isLoading, error } = useAppContent(app.contentUrl);
  const [{ tab, slug, eco }, setState] = useState<State>(() => loadState(app.id, app.defaultTab ?? 'solutions'));

  const setTab = (t: Tab) => setState({ tab: t, slug: null, eco: false });
  const setSlug = (sl: string | null) => setState((s) => ({ ...s, slug: sl }));
  const setEco = (v: boolean) => setState((s) => ({ ...s, eco: v }));

  useEffect(() => { saveState(app.id, { tab, slug, eco }); }, [app.id, tab, slug, eco]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, slug, eco]);

  const active: AppCategory | null = useMemo(
    () => (tab === 'solutions' ? content?.categories.find((c) => c.slug === slug) ?? null : null),
    [content, slug, tab]
  );
  const posts = useMemo(() => (active && content ? categoryToPosts(active, content.channel) : []), [active, content]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#161616] dark:text-neutral-100 flex flex-col font-['Manrope',sans-serif] selection:bg-[var(--accent)] selection:text-white">
      <FigmaHeader activeScreen={tab} onSelectScreen={setTab} showNavTabs={!active && !eco} />

      <main className="w-full max-w-[390px] mx-auto flex-1 flex flex-col pb-12">
        {eco ? (
          // «Все наши ресурсы» — тот же экран, что в основном приложении
          <FigmaEcosystemScreen onBack={() => setEco(false)} />
        ) : active ? (
          <FigmaPainDetailScreen
            pain={{ title: active.title }}
            intro={active.pain ?? undefined}
            posts={posts}
            onBack={() => setSlug(null)}
          />
        ) : (
          <>
            {/* Те же баннеры, что и в основном приложении (Frame 390x140) */}
            <div className="py-2 mt-3">
              <BannersCarousel onOpenResources={() => setEco(true)} />
            </div>

            {/* Поиск по тегам: тегов нет — виден только заголовок раздела, как в основном приложении без чипов */}
            {tab === 'catalog' && <FigmaTagSearch selectedTag={null} onSelectTag={() => {}} availableTags={[]} />}

            {tab === 'solutions' && (
              <>
                {isLoading && <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-10 text-center">Загружаю...</p>}
                {!isLoading && (error || !content) && (
                  <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-10 px-6 text-center">
                    Не удалось загрузить материалы. Попробуйте открыть приложение позже.
                  </p>
                )}
                {!isLoading && content && (
                  <CategoryGrid
                    title={app.gridTitle ?? 'Навигатор по вашим\nзадачам'}
                    subtitle={app.gridSubtitle ?? 'Выберите проблему — получите\nготовую подборку постов'}
                    categories={content.categories}
                    onSelect={(c) => {
                      AnalyticsService.track('pain_selected', { painSlug: c.slug, app: app.id });
                      setSlug(c.slug);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};
