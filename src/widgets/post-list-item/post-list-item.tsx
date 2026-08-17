import React from 'react';
import { ExternalLink, Tag } from 'lucide-react';
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
      tagsCount: post.tags?.length || 0
    });
    openPostLink(post.url, post.title);
  };

  return (
    <div
      onClick={handlePostClick}
      className="dark:bg-slate-900/80 dark:hover:bg-slate-800/90 dark:border-slate-800 dark:hover:border-slate-700/80 bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 rounded-2xl p-3.5 transition-all cursor-pointer group active:scale-98 shadow-sm flex flex-col justify-between border"
    >
      <div className="flex gap-3 items-start">
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-20 h-20 rounded-xl object-cover shrink-0 border dark:border-slate-700/50 border-slate-200 group-hover:scale-105 transition-transform duration-300"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h4>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 shrink-0 mt-0.5" />
          </div>

          <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-1 line-clamp-2 leading-tight">
            {post.description}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Tag className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />
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
              className="dark:bg-slate-800/80 dark:text-slate-300 bg-slate-100 text-slate-700 hover:text-purple-600 dark:hover:text-purple-300 px-1.5 py-0.5 rounded whitespace-nowrap font-medium transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
