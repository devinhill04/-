import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Post } from '../../entities/post/model/types';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { track } from '../../shared/lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface PostListItemProps {
  post: Post;
  onTagClick?: (tag: string) => void;
}

export const PostListItem: React.FC<PostListItemProps> = ({ post, onTagClick }) => {
  const handlePostClick = () => {
    triggerHaptic('light');
    track('post_open', {
      id: post.id,
      title: post.title,
      category: post.category,
      channel: post.channel,
      tagsCount: post.tags?.length || 0,
    });
    openPostLink(post.url, post.title);
  };

  return (
    <div
      onClick={handlePostClick}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group active:scale-[0.99] shadow-2xs flex flex-col justify-between gap-3 min-h-[92px]"
    >
      {/* Top Part: Title + External Link Icon */}
      <div className="flex items-start justify-between gap-2.5">
        <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#5542F6] dark:group-hover:text-purple-400 transition-colors leading-snug line-clamp-2">
          {post.title}
        </h4>

        <div className="shrink-0 p-0.5 text-slate-400 dark:text-slate-500 group-hover:text-[#5542F6] dark:group-hover:text-purple-400 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>

      {/* Bottom Part: Clean Tag Badges */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {post.tags.slice(0, 3).map((tag, i) => (
            <button
              key={i}
              onClick={(e) => {
                if (onTagClick) {
                  e.stopPropagation();
                  triggerHaptic('light');
                  track('tag_click', { tag, source: 'post_card', postId: post.id });
                  onTagClick(tag);
                }
              }}
              className="bg-[#F5F6F8] dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
