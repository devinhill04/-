import React, { useEffect, useMemo, useState } from 'react';
import { plural, PUBLICATIONS } from '../../shared/lib/plural';
import { FigmaHeader } from '../top-nav/figma-header';
import { FigmaPainDetailScreen } from '../pain-detail/figma-pain-detail';
import { FigmaTagSearch } from '../tag-search/figma-tag-search';
import { FigmaPostCard } from '../post-card/figma-post-card';
import { triggerHaptic } from '../../lib/telegram';
import { BannersCarousel } from '../banners-carousel/banners-carousel';
import { FigmaEcosystemScreen } from '../ecosystem/figma-ecosystem-screen';
import { CategoryGrid } from './category-grid';
import { MiniApp } from '../../shared/config/mini-apps';
import { AppCategory } from '../../entities/app-content/model/types';
import { categoryToPosts, tagToPosts } from '../../entities/app-content/model/to-posts';
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

  // Поиск по тегам: теги из данных приложения; выбран первый, пока человек не выберет другой
  const tags = content?.tags ?? [];
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagLimit, setTagLimit] = useState(10);
  const currentTag = tags.find((t) => `#${t.tag}` === selectedTag) ?? tags[0] ?? null;
  const tagPosts = useMemo(() => (currentTag && content ? tagToPosts(currentTag, content.channel) : []), [currentTag, content]);
  const selectTag = (t: string) => {
    triggerHaptic('light');
    setSelectedTag(t);
    setTagLimit(10);
    AnalyticsService.track('tag_click', { tag: t, app: app.id });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#161616] dark:text-neutral-100 flex flex-col font-['Manrope',sans-serif] selection:bg-[var(--accent)] selection:text-white">
      <FigmaHeader activeScreen={tab} onSelectScreen={setTab} showNavTabs={!active && !eco} />

      <main className="w-full max-w-[390px] mx-auto flex-1 flex flex-col pb-12">
        {eco ? (
          // «Все наши ресурсы» — тот же экран, что в основном приложении
          <FigmaEcosystemScreen onBack={() => setEco(false)} />
        ) : active ? (
          <FigmaPainDetailScreen
            pain={{ title: active.title, slug: active.slug }}
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

            {/* Поиск по тегам — как в основном приложении: чипы тегов и посты по выбранному */}
            {tab === 'catalog' && (
              <>
                <FigmaTagSearch selectedTag={currentTag ? `#${currentTag.tag}` : null} onSelectTag={selectTag} availableTags={tags.map((t) => `#${t.tag}`)} />
                {currentTag && (
                  <div className="w-full px-3 flex flex-col gap-3 pt-2">
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: '20px', lineHeight: '25px' }} className="text-[#161616] dark:text-white flex flex-col text-left">
                      <span>Результаты поиска по тегу</span>
                      <span className="text-[var(--accent)]">#{currentTag.tag}</span>
                    </h3>
                    <div className="flex flex-col gap-2 pt-1">
                      {tagPosts.slice(0, tagLimit).map((post) => (
                        <FigmaPostCard key={post.id} post={post} showTags={false} />
                      ))}
                      {tagPosts.length > tagLimit && (
                        <button
                          onClick={() => { triggerHaptic('light'); setTagLimit((v) => v + 10); }}
                          style={{ height: '40px', borderRadius: '8px', fontFamily: "'Manrope', sans-serif", fontWeight: 500, fontSize: '12px', lineHeight: '15px' }}
                          className="w-full flex items-center justify-center text-[#161616] bg-[#F9F9F9] dark:bg-neutral-800 dark:text-white mt-2 cursor-pointer"
                        >
                          {`Показать ещё ${Math.min(10, tagPosts.length - tagLimit)} ${plural(Math.min(10, tagPosts.length - tagLimit), PUBLICATIONS)}`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

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
