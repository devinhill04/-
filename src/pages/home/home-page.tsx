import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TopNav } from '../../widgets/top-nav/top-nav';
import { BannersCarousel } from '../../widgets/banners-carousel/banners-carousel';
import { TagCloud } from '../../widgets/tag-cloud/tag-cloud';
import { QuickNav } from '../../widgets/quick-nav/quick-nav';
import { CategorySection } from '../../widgets/category-section/category-section';
import { ResourcesSheet } from '../../widgets/resources-sheet/resources-sheet';
import { PainSelector } from '../../widgets/pain-selector/pain-selector';
import { TagSearchResults } from '../../widgets/tag-search-results/tag-search-results';

import { usePosts } from '../../entities/post/model/use-posts';
import { usePains } from '../../entities/pain/model/use-pains';
import { usePainSolutions } from '../../entities/pain/model/use-pain-solutions';
import { filterPostsByTags } from '../../entities/post/lib/filter-by-tags';

import { CATEGORIES } from '../../shared/config/categories';
import { CardSkeleton } from '../../shared/ui/card-skeleton';
import { EmptyState } from '../../shared/ui/empty-state';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { triggerHaptic } from '../../lib/telegram';

export const HomePage: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<'catalog' | 'pains'>('catalog');
  const [activeCategory, setActiveCategory] = useState<string>('basics');
  const [selectedSearchTags, setSelectedSearchTags] = useState<string[]>([]);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);

  const { posts, isLoading: postsLoading, error: postsError } = usePosts();
  const { pains } = usePains();
  const { solutions } = usePainSolutions();

  const sessionStartRef = useRef<number>(Date.now());

  // Analytics session lifecycle
  useEffect(() => {
    AnalyticsService.initSession();

    const heartbeatInterval = setInterval(() => {
      const timeSpentSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
      AnalyticsService.track('session_heartbeat', { timeSpentSec });
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      const totalTimeSpentSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
      AnalyticsService.track('session_end', { totalTimeSpentSec });
    };
  }, []);

  // Extract all unique tags across posts for tag cloud
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((p) => {
      p.tags?.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [posts]);

  // Filter posts by selected hashtags when in hashtag search mode
  const tagSearchResults = useMemo(() => {
    return filterPostsByTags(posts, selectedSearchTags);
  }, [posts, selectedSearchTags]);

  // Helper to categorize posts into the 3 Figma categories
  const getCategoryPosts = (catId: string) => {
    if (catId === 'basics') {
      return posts.filter(
        (p) =>
          p.category === 'basics' ||
          p.category === 'evergreen' ||
          p.category === 'mindset' ||
          p.category === 'jobs' ||
          p.tags?.some((t) => ['обучение', 'база', 'новичкам', 'mindset', 'книги', 'лайфхак'].includes(t.toLowerCase()))
      );
    }
    if (catId === 'invest') {
      return posts.filter(
        (p) =>
          p.category === 'invest' ||
          p.category === 'stocks' ||
          p.category === 'bonds' ||
          p.category === 'crypto' ||
          p.category === 'news' ||
          p.tags?.some((t) => ['инвестиции', 'акции', 'облигации', 'чтовпортфеле', 'разбор', 'дивиденды', 'крипта'].includes(t.toLowerCase()))
      );
    }
    if (catId === 'useful') {
      return posts.filter(
        (p) =>
          p.category === 'useful' ||
          p.category === 'estate' ||
          p.category === 'personal-finance' ||
          p.tags?.some((t) => ['налоги', 'иис', 'ипотека', 'недвижимость', 'вклады', 'личныефинансы'].includes(t.toLowerCase()))
      );
    }
    return posts.filter((p) => p.category === catId);
  };

  // Scroll observer to update active category when scrolling
  useEffect(() => {
    if (activeScreen !== 'catalog' || postsLoading || selectedSearchTags.length > 0) return;

    const handleScroll = () => {
      for (const cat of CATEGORIES) {
        const elem = document.getElementById(`category-${cat.id}`);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 100) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeScreen, postsLoading, selectedSearchTags]);

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    AnalyticsService.track('category_select', { categoryId: catId });

    const elem = document.getElementById(`category-${catId}`);
    if (elem) {
      const yOffset = -120;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSelectScreen = (screen: 'catalog' | 'pains') => {
    triggerHaptic('light');
    setActiveScreen(screen);
    AnalyticsService.trackScreenView(screen);
    if (screen === 'catalog') {
      setSelectedSearchTags([]);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#090D16] dark:text-slate-100 bg-[#F4F5F7] text-slate-900 flex flex-col font-sans selection:bg-[#5542F6] selection:text-white transition-colors duration-200 pt-[env(safe-area-inset-top,0px)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
      {/* 1. Top Header */}
      <TopNav
        onOpenResources={() => {
          AnalyticsService.track('resources_sheet_open');
          setIsResourcesOpen(true);
        }}
      />

      {/* Main Container - 390px base frame with 360-430px range */}
      <main className="max-w-[430px] mx-auto w-full px-4 pt-3 space-y-4 flex-1">
        {/* 2. Top Segmented Control (Каталог постов / Готовые решения) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSelectScreen('catalog')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeScreen === 'catalog'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            }`}
          >
            Каталог постов
          </button>

          <button
            onClick={() => handleSelectScreen('pains')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeScreen === 'pains'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            }`}
          >
            Готовые решения
          </button>
        </div>

        {/* 3. Dedicated Hashtag Search Results View */}
        {selectedSearchTags.length > 0 ? (
          <TagSearchResults
            selectedTags={selectedSearchTags}
            posts={tagSearchResults}
            isLoading={postsLoading}
            error={postsError}
            onBack={() => {
              AnalyticsService.track('tag_filter_clear');
              setSelectedSearchTags([]);
            }}
            onRemoveTag={(tag) =>
              setSelectedSearchTags((prev) => prev.filter((t) => t !== tag))
            }
            onClearTags={() => {
              AnalyticsService.track('tag_filter_clear');
              setSelectedSearchTags([]);
            }}
            onSelectTag={(tag) => {
              AnalyticsService.trackTagClick(tag, 'search_results');
              setSelectedSearchTags([tag]);
            }}
          />
        ) : activeScreen === 'catalog' ? (
          /* Catalog View matching Figma */
          <>
            {/* 4. Horizontal Banners Carousel */}
            <BannersCarousel
              onOpenResources={() => {
                AnalyticsService.track('resources_sheet_open');
                setIsResourcesOpen(true);
              }}
            />

            {/* 5. «Поиск постов по тегам» */}
            <TagCloud
              allTags={allTags}
              selectedTags={selectedSearchTags}
              onSearchByTags={(tags) => {
                setSelectedSearchTags(tags);
                if (tags.length > 0) {
                  AnalyticsService.track('tag_search_telegram', { tags, count: tags.length });
                }
              }}
            />

            {/* 6. Quick Sticky Navigation Pills */}
            <QuickNav
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
            />

            {/* 7. Category Sections */}
            {postsLoading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                title="Материалы загружаются..."
                description="Пожалуйста, подождите несколько секунд или обновите экран."
              />
            ) : (
              <div className="space-y-6 pt-1">
                {CATEGORIES.map((cat) => {
                  const catPosts = getCategoryPosts(cat.id);
                  return (
                    <CategorySection
                      key={cat.id}
                      category={cat}
                      posts={catPosts}
                      onTagClick={(tag) => {
                        AnalyticsService.trackTagClick(tag, 'category_post');
                        setSelectedSearchTags([tag]);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* "Готовые решения" (Pains & Solutions) */
          <PainSelector pains={pains} solutions={solutions} />
        )}
      </main>

      {/* Ecosystem Resources Sheet Modal */}
      <ResourcesSheet
        isOpen={isResourcesOpen}
        onClose={() => {
          AnalyticsService.track('resources_sheet_close');
          setIsResourcesOpen(false);
        }}
      />
    </div>
  );
};
