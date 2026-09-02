import React, { useState, useMemo, useEffect } from 'react';
import { FigmaHeader } from '../../widgets/top-nav/figma-header';
import { BannersCarousel } from '../../widgets/banners-carousel/banners-carousel';
import { FigmaTagSearch } from '../../widgets/tag-search/figma-tag-search';
import { FigmaSolutionsGrid } from '../../widgets/solutions-grid/figma-solutions-grid';
import { FigmaPainDetailScreen } from '../../widgets/pain-detail/figma-pain-detail';
import { FigmaEcosystemScreen } from '../../widgets/ecosystem/figma-ecosystem-screen';
import { FigmaPostCard } from '../../widgets/post-card/figma-post-card';

import { usePosts } from '../../entities/post/model/use-posts';
import { FigmaPainCard } from '../../shared/config/figma-data';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { triggerHaptic } from '../../lib/telegram';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'solutions'>('catalog');
  const [selectedTag, setSelectedTag] = useState<string>('#Новости');
  const [activePain, setActivePain] = useState<FigmaPainCard | null>(null);
  const [isEcosystemOpen, setIsEcosystemOpen] = useState(false);
  const [postsLimit, setPostsLimit] = useState(10);

  const { posts, isLoading } = usePosts();

  // Scroll to top on tab or screen switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activePain, isEcosystemOpen]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((p) => {
      p.tags?.forEach((t) => {
        tagsSet.add(t.startsWith('#') ? t : `#${t}`);
      });
    });
    return Array.from(tagsSet);
  }, [posts]);

  // Filter posts by active selected tag
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    const cleanTag = selectedTag.replace(/^#/, '').toLowerCase();
    return posts.filter((p) => {
      return p.tags?.some((t) => t.replace(/^#/, '').toLowerCase() === cleanTag);
    });
  }, [posts, selectedTag]);

  // Filter posts for active pain detail screen
  const painPosts = useMemo(() => {
    if (!activePain) return [];
    const cleanTag = activePain.categoryTag.replace(/^#/, '').toLowerCase();
    const matches = posts.filter((p) => {
      const matchTag = p.tags?.some((t) => t.replace(/^#/, '').toLowerCase().includes(cleanTag));
      const matchCat = p.category?.toLowerCase() === activePain.slug.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(cleanTag);
      return matchTag || matchCat || matchTitle;
    });
    return matches.length > 0 ? matches : posts.slice(0, 8);
  }, [posts, activePain]);

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setPostsLimit(10);
    AnalyticsService.track('tag_click', { tag });
  };

  const handleSelectPain = (pain: FigmaPainCard) => {
    setActivePain(pain);
    AnalyticsService.track('pain_selected', { painSlug: pain.slug });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#161616] dark:text-neutral-100 flex flex-col font-['Manrope',sans-serif] selection:bg-[#5737FA] selection:text-white transition-colors duration-200">
      
      {/* 1. Header (Figma 1:1) */}
      <FigmaHeader
        activeScreen={activeTab}
        onSelectScreen={(screen) => {
          setActiveTab(screen);
          setActivePain(null);
          setIsEcosystemOpen(false);
        }}
        showNavTabs={!activePain && !isEcosystemOpen}
      />

      {/* Main Container - Exact 390px Figma Layout Container */}
      <main className="w-full max-w-[390px] mx-auto flex-1 flex flex-col pb-12">
        
        {/* VIEW 1: Ecosystem Screen (when opened via banner "Все наши ресурсы") */}
        {isEcosystemOpen ? (
          <FigmaEcosystemScreen
            onBack={() => setIsEcosystemOpen(false)}
          />
        ) : activePain ? (
          /* VIEW 2: Pain Detail Screen (when clicked on any pain card) */
          <FigmaPainDetailScreen
            pain={activePain}
            posts={painPosts}
            onBack={() => setActivePain(null)}
            onSelectTag={(t) => {
              setActivePain(null);
              setActiveTab('catalog');
              setSelectedTag(t);
            }}
          />
        ) : (
          /* VIEW 3: Main Screens with Banners Carousel */
          <>
            {/* Banners Slider (Frame 390x140) */}
            <div className="py-2">
              <BannersCarousel
                onOpenResources={() => setIsEcosystemOpen(true)}
              />
            </div>

            {/* TAB CONTENT: "Поиск по тегам" (Catalog Screen 79:1905) */}
            {activeTab === 'catalog' && (
              <div className="flex flex-col gap-4">
                {/* Tags + Header Section */}
                <FigmaTagSearch
                  selectedTag={selectedTag}
                  onSelectTag={handleSelectTag}
                  availableTags={allTags}
                />

                {/* Section: Результаты поиска по тегу (id: 79:1905 Section) */}
                <div className="w-full px-3 flex flex-col gap-3 pt-2">
                  <h3
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 700,
                      fontSize: '20px',
                      lineHeight: '25px',
                    }}
                    className="text-[#161616] dark:text-white flex flex-col text-left"
                  >
                    <span>Результаты поиска по тегу</span>
                    <span className="text-[#5737FA]">{selectedTag}</span>
                  </h3>

                  {/* Posts List */}
                  <div className="flex flex-col gap-2 pt-1">
                    {isLoading ? (
                      <div className="p-8 text-center text-neutral-400 text-sm">
                        Загрузка материалов...
                      </div>
                    ) : filteredPosts.length === 0 ? (
                      <div className="p-8 text-center bg-[#F9F9F9] dark:bg-neutral-800 rounded-xl text-neutral-500 text-sm">
                        По тегу {selectedTag} пока нет постов
                      </div>
                    ) : (
                      filteredPosts.slice(0, postsLimit).map((post) => (
                        <FigmaPostCard
                          key={post.id}
                          post={post}
                          onTagClick={handleSelectTag}
                          showTags={false}
                        />
                      ))
                    )}

                    {/* Button "Показать еще N публикаций" (Btn/Text_Btn/M: w:366, h:40, r:8, fill:#F9F9F9) */}
                    {filteredPosts.length > postsLimit && (
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setPostsLimit((prev) => prev + 10);
                        }}
                        style={{
                          height: '40px',
                          borderRadius: '8px',
                          background: '#F9F9F9',
                          fontFamily: "'Manrope', sans-serif",
                          fontWeight: 500,
                          fontSize: '12px',
                          lineHeight: '15px',
                        }}
                        className="w-full flex items-center justify-center text-[#161616] dark:bg-neutral-800 dark:text-white hover:bg-neutral-200 transition-colors mt-2 cursor-pointer"
                      >
                        {`Показать еще ${Math.min(10, filteredPosts.length - postsLimit)} публикаций`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: "Готовые решения" (Solutions Screen 78:1462) */}
            {activeTab === 'solutions' && (
              <FigmaSolutionsGrid
                onSelectPain={handleSelectPain}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
