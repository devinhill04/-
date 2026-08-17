import React from 'react';
import { Post } from '../../entities/post/model/types';
import { CategoryConfig } from '../../shared/config/categories';
import { PostListItem } from '../post-list-item/post-list-item';
import { BookOpen, TrendingUp, ShieldCheck } from 'lucide-react';

interface CategorySectionProps {
  category: CategoryConfig;
  posts: Post[];
  onTagClick?: (tag: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-4 h-4 text-purple-400" />,
  TrendingUp: <TrendingUp className="w-4 h-4 text-emerald-400" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4 text-amber-400" />,
};

export const CategorySection: React.FC<CategorySectionProps> = ({ category, posts, onTagClick }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <section id={`category-${category.id}`} className="space-y-3 scroll-mt-28">
      {/* Category Header */}
      <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3 border shadow-xs">
        <div className="w-9 h-9 rounded-xl dark:bg-slate-800 dark:border-slate-700/60 bg-slate-100 border-slate-200 flex items-center justify-center shrink-0 border">
          {iconMap[category.iconName] || <BookOpen className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
        </div>
        <div>
          <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">{category.title}</h3>
          <p className="text-[11px] dark:text-slate-400 text-slate-500">{category.description}</p>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-2.5">
        {posts.map((post) => (
          <PostListItem key={post.id} post={post} onTagClick={onTagClick} />
        ))}
      </div>
    </section>
  );
};

