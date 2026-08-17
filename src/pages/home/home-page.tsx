import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TopNav } from '../../widgets/top-nav/top-nav';
import { PromoBanner } from '../../widgets/promo-banner/promo-banner';
import { AdBanner } from '../../widgets/ad-banner/ad-banner';
import { TagCloud } from '../../widgets/tag-cloud/tag-cloud';
import { QuickNav } from '../../widgets/quick-nav/quick-nav';
import { CategorySection } from '../../widgets/category-section/category-section';
import { ResourcesSheet } from '../../widgets/resources-sheet/resources-sheet';
import { PainSelector } from '../../widgets/pain-selector/pain-selector';
import { TagSearchResults } from '../../widgets/tag-search-results/tag-search-results';

import { usePosts } from '../../entities/post/model/use-posts';
import { useLeadMagnet } from '../../entities/lead-magnet/model/use-lead-magnet';
import { usePains } from '../../entities/pain/model/use-pains';
import { usePainSolutions } from '../../entities/pain/model/use-pain-solutions';
import { filterPostsByTags } from '../../entities/post/lib/filter-by-tags';

import { CATEGORIES } from '../../shared/config/categories';
import { CardSkeleton } from '../../shared/ui/card-skeleton';
import { EmptyState } from '../../shared/ui/empty-state';
import { Search } from 'lucide-react';
import { track } from '../../shared/lib/analytics';

export const HomePage: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<'catalog' | 'pains'>('catalog');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTags, setSelectedSearchTags] = useState<string[]>([]);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);

  const { posts, isLoading: postsLoading, error: postsError } = usePosts();
  const { leadMagnet } = useLeadMagnet();
  const { pains } = usePains();
  const { solutions } = usePainSolutions();

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  // Отслеживаем старт сессии при первом монтировании
  useEffect(() => {
    track('app_init');
    track('session_start', { timestamp: Date.now() });

    const heartbeatInterval = setInterval(() => {
      const timeSpentSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
      track('session_heartbeat', { timeSpentSec });
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      const totalTimeSpentSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
      track('session_end', { totalTimeSpentSec });
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

  // Filter posts by search query if any
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    const result = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
    return result;
  }, [posts, searchQuery]);

  // Трекинг поискового ввода с дебаунсом
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (val.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        track('search_input', { query: val.trim() });
      }, 700);
    }
  };

  // Filter posts by selected hashtags when in hashtag search mode
  const tagSearchResults = useMemo(() => {
    return filterPostsByTags(posts, selectedSearchTags);
  }, [posts, selectedSearchTags]);

  // Scroll observer to update active category when scrolling
  useEffect(() => {
    if (activeScreen !== 'catalog' || postsLoading || selectedSearchTags.length > 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 180) {
        setActiveCategory('all');
        return;
      }

      for (const cat of CATEGORIES) {
        const elem = document.getElementById(`category-${cat.id}`);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 120) {
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
    track('category_select', { categoryId: catId });

    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(`category-${catId}`);
    if (elem) {
      const yOffset = -155;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSelectScreen = (screen: 'catalog' | 'pains') => {
    setActiveScreen(screen);
    track('screen_view', { screenName: screen });
    if (screen === 'catalog') {
      setSelectedSearchTags([]);
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-slate-100 bg-slate-100 text-slate-900 flex flex-col font-sans pb-12 selection:bg-violet-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <TopNav
        activeScreen={activeScreen}
        onSelectScreen={handleSelectScreen}
      />

      {/* Main Content */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {activeScreen === 'catalog' ? (
          selectedSearchTags.length > 0 ? (
            /* Dedicated Hashtag Search Results View */
            <TagSearchResults
              selectedTags={selectedSearchTags}
              posts={tagSearchResults}
              isLoading={postsLoading}
              error={postsError}
              onBack={() => {
                track('tag_filter_clear');
                setSelectedSearchTags([]);
              }}
              onRemoveTag={(tag) =>
                setSelectedSearchTags((prev) => prev.filter((t) => t !== tag))
              }
              onClearTags={() => {
                track('tag_filter_clear');
                setSelectedSearchTags([]);
              }}
              onSelectTag={(tag) => {
                track('tag_click', { tag });
                setSelectedSearchTags([tag]);
              }}
            />
          ) : (
            /* Standard Catalog View */
            <>
              {/* Search Input Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Быстрый поиск по базе постов..."
                  className="w-full dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100 bg-white border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-violet-500/80 transition-colors placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Banners */}
              <PromoBanner
                leadMagnet={leadMagnet}
                onOpenResources={() => {
                  track('resources_sheet_open');
                  setIsResourcesOpen(true);
                }}
              />

              <AdBanner />

              {/* Tag Cloud */}
              <TagCloud
                allTags={allTags}
                onSearchByTags={(tags) => {
                  track('tag_search_telegram', { tags, count: tags.length });
                  setSelectedSearchTags(tags);
                }}
                selectedTags={selectedSearchTags}
              />

              {/* Quick Sticky Navigation Bar */}
              <QuickNav
                activeCategory={activeCategory}
                onSelectCategory={handleSelectCategory}
              />

              {/* Category Sections */}
              {postsLoading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filteredPosts.length === 0 ? (
                <EmptyState
                  title="По вашему запросу ничего не найдено"
                  description="Попробуйте изменить поисковый запрос или сбросить фильтры."
                  actionText="Сбросить поиск"
                  onAction={() => {
                    track('search_clear');
                    setSearchQuery('');
                  }}
                />
              ) : (
                <div className="space-y-6 pt-2">
                  {CATEGORIES.map((cat) => {
                    const catPosts = filteredPosts.filter((p) => p.category === cat.id);
                    return (
                      <CategorySection
                        key={cat.id}
                        category={cat}
                        posts={catPosts}
                        onTagClick={(tag) => {
                          track('post_tag_click', { tag });
                          setSelectedSearchTags([tag]);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )
        ) : (
          <PainSelector pains={pains} solutions={solutions} />
        )}
      </main>

      {/* Ecosystem Resources Sheet Modal */}
      <ResourcesSheet
        isOpen={isResourcesOpen}
        onClose={() => {
          track('resources_sheet_close');
          setIsResourcesOpen(false);
        }}
      />
    </div>
  );
};
