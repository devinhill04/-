import React, { useState } from 'react';
import { Post } from '../../entities/post/model/types';
import { CategoryConfig } from '../../shared/config/categories';
import { PostListItem } from '../post-list-item/post-list-item';
import { BookOpen, TrendingUp, Bookmark } from 'lucide-react';
import { triggerHaptic } from '../../lib/telegram';

interface CategorySectionProps {
  category: CategoryConfig;
  posts: Post[];
  onTagClick?: (tag: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5 text-[#5542F6] dark:text-purple-400" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-[#5542F6] dark:text-purple-400" />,
  Bookmark: <Bookmark className="w-5 h-5 text-[#5542F6] dark:text-purple-400" />,
};

export const CategorySection: React.FC<CategorySectionProps> = ({ category, posts, onTagClick }) => {
  const [displayCount, setDisplayCount] = useState(3);

  if (!posts || posts.length === 0) return null;

  const visiblePosts = posts.slice(0, displayCount);
  const hasMore = posts.length > displayCount;

  const handleShowMore = () => {
    triggerHaptic('light');
    setDisplayCount((prev) => prev + 10);
  };

  return (
    <section id={`category-${category.id}`} className="space-y-3 scroll-mt-32">
      {/* Category Section Header with Purple Icon matching Figma */}
      <div className="flex items-center gap-2 pt-2">
        <div className="shrink-0">
          {iconMap[category.iconName] || <BookOpen className="w-5 h-5 text-[#5542F6] dark:text-purple-400" />}
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {category.title}
        </h3>
      </div>

      {/* Posts List */}
      <div className="space-y-2.5">
        {visiblePosts.map((post) => (
          <PostListItem key={post.id} post={post} onTagClick={onTagClick} />
        ))}
      </div>

      {/* "Показать еще 10 публикаций" Button */}
      {hasMore && (
        <button
          onClick={handleShowMore}
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs transition-all active:scale-[0.99] shadow-2xs cursor-pointer text-center"
        >
          Показать еще 10 публикаций
        </button>
      )}
    </section>
  );
};

