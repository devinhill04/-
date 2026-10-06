import React, { useEffect, useMemo, useState } from 'react';
import { FigmaHeader } from '../top-nav/figma-header';
import { FigmaPainDetailScreen } from '../pain-detail/figma-pain-detail';
import { CategoryGrid } from './category-grid';
import { MiniApp } from '../../shared/config/mini-apps';
import { AppCategory } from '../../entities/app-content/model/types';
import { categoryToPosts } from '../../entities/app-content/model/to-posts';
import { useAppContent } from '../../entities/app-content/model/use-app-content';
import { AnalyticsService } from '../../shared/analytics/analytics';

const STATE_KEY = 'if_catalog_state_v1';

// Запоминаем открытую категорию: когда человек жмёт на пост, Telegram закрывает мини-апп,
// а при повторном открытии он должен вернуться туда же, где был
const loadSlug = (appId: string): string | null => {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}')[appId] ?? null; } catch { return null; }
};
const saveSlug = (appId: string, slug: string | null) => {
  try {
    const all = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    all[appId] = slug;
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  } catch { /* не критично */ }
};

export const CatalogApp: React.FC<{ app: MiniApp }> = ({ app }) => {
  const { content, isLoading, error } = useAppContent(app.contentUrl);
  const [activeSlug, setActiveSlug] = useState<string | null>(() => loadSlug(app.id));

  useEffect(() => { saveSlug(app.id, activeSlug); }, [app.id, activeSlug]);
  useEffect(() => { window.scrollTo(0, 0); }, [activeSlug]);

  const active: AppCategory | null = useMemo(
    () => content?.categories.find((c) => c.slug === activeSlug) ?? null,
    [content, activeSlug]
  );
  const posts = useMemo(() => (active && content ? categoryToPosts(active, content.channel) : []), [active, content]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#161616] dark:text-neutral-100 flex flex-col font-['Manrope',sans-serif] selection:bg-[var(--accent)] selection:text-white">
      <FigmaHeader showNavTabs={false} />

      <main className="flex-1">
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
              setActiveSlug(c.slug);
            }}
          />
        )}

        {!isLoading && content && active && (
          <FigmaPainDetailScreen
            pain={{ title: active.title }}
            intro={active.pain ?? undefined}
            posts={posts}
            onBack={() => setActiveSlug(null)}
          />
        )}
      </main>
    </div>
  );
};
