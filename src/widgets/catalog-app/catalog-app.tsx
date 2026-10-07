import React, { useEffect, useMemo, useState } from 'react';
import { FigmaHeader } from '../top-nav/figma-header';
import { FigmaPainDetailScreen } from '../pain-detail/figma-pain-detail';
import { FigmaTagSearch } from '../tag-search/figma-tag-search';
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
const loadState = (appId: string, defaultTab: Tab): { tab: Tab; slug: string | null } => {
  try {
    const s = JSON.parse(localStorage.getItem(STATE_KEY) || '{}')[appId];
    return { tab: s?.tab === 'catalog' || s?.tab === 'solutions' ? s.tab : defaultTab, slug: typeof s?.slug === 'string' ? s.slug : null };
  } catch {
    return { tab: defaultTab, slug: null };
  }
};
const saveState = (appId: string, tab: Tab, slug: string | null) => {
  try {
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    all[appId] = { tab, slug };
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  } catch { /* память недоступна — не критично */ }
};

// Приложение из каталога по тому же образцу, что и основное: шапка с вкладками «Поиск по тегам» / «Готовые решения».
// Где контента нет — пусто: у «Работа не рабство» нет тегов и баннеров, поэтому вкладка тегов без чипов, баннеров нет.
export const CatalogApp: React.FC<{ app: MiniApp }> = ({ app }) => {
  const { content, isLoading, error } = useAppContent(app.contentUrl);
  const [{ tab, slug }, setState] = useState(() => loadState(app.id, app.defaultTab ?? 'solutions'));

  const setTab = (t: Tab) => setState({ tab: t, slug: null });
  const setSlug = (sl: string | null) => setState((s) => ({ ...s, slug: sl }));

  useEffect(() => { saveState(app.id, tab, slug); }, [app.id, tab, slug]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, slug]);

  const active: AppCategory | null = useMemo(
    () => (tab === 'solutions' ? content?.categories.find((c) => c.slug === slug) ?? null : null),
    [content, slug, tab]
  );
  const posts = useMemo(() => (active && content ? categoryToPosts(active, content.channel) : []), [active, content]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#161616] dark:text-neutral-100 flex flex-col font-['Manrope',sans-serif] selection:bg-[var(--accent)] selection:text-white">
      <FigmaHeader activeScreen={tab} onSelectScreen={setTab} showNavTabs={!active} />

      <main className="w-full max-w-[390px] mx-auto flex-1 flex flex-col pb-12">
        {/* Поиск по тегам: тегов нет — виден только заголовок, как в основном приложении без чипов */}
        {tab === 'catalog' && <FigmaTagSearch selectedTag={null} onSelectTag={() => {}} availableTags={[]} />}

        {tab === 'solutions' && (
          <>
            {isLoading && <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-10 text-center">Загружаю...</p>}
            {!isLoading && (error || !content) && (
              <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-10 px-6 text-center">
                Не удалось загрузить материалы. Попробуйте открыть приложение позже.
              </p>
            )}

            {!isLoading && content && !active && (
              <CategoryGrid
                title={app.gridTitle ?? 'Навигатор по вашим задачам'}
                subtitle={app.gridSubtitle ?? 'Выберите проблему — получите готовую подборку постов'}
                categories={content.categories}
                onSelect={(c) => {
                  AnalyticsService.track('pain_selected', { painSlug: c.slug, app: app.id });
                  setSlug(c.slug);
                }}
              />
            )}

            {!isLoading && content && active && (
              <FigmaPainDetailScreen
                pain={{ title: active.title }}
                intro={active.pain ?? undefined}
                posts={posts}
                onBack={() => setSlug(null)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
