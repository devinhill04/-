import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Post } from '../../entities/post/model/types';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

interface FigmaPostCardProps {
  post: Post;
  onTagClick?: (tag: string) => void;
  showTags?: boolean;
}

export const FigmaPostCard: React.FC<FigmaPostCardProps> = ({ post, onTagClick, showTags = true }) => {
  const handleClick = () => {
    triggerHaptic('light');
    openPostLink(post.url, post.title);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        borderRadius: '12px',
        padding: '16px',
        gap: '8px',
      }}
      className="w-full flex items-start justify-between cursor-pointer group active:scale-[0.99] transition-all border border-transparent bg-[#F9F9F9] dark:bg-neutral-800/80 dark:hover:bg-neutral-800"
    >
      {/* Content */}
      <div className="flex flex-col gap-4 flex-1 min-w-0 pr-2">
        {/* Title */}
        <h4
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '17.5px',
          }}
          className="text-[#161616] dark:text-neutral-100 group-hover:text-[#5737FA] transition-colors"
        >
          {post.title}
        </h4>

        {/* Info Tags */}
        {showTags && post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            {post.tags.map((tag, idx) => {
              const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
              return (
                <span
                  key={idx}
                  onClick={(e) => {
                    if (onTagClick) {
                      e.stopPropagation();
                      triggerHaptic('light');
                      onTagClick(formattedTag);
                    }
                  }}
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '12.5px',
                    borderRadius: '4px',
                    padding: '6px 8px',
                  }}
                  className="text-[#161616] dark:bg-neutral-700 dark:text-neutral-200 border border-black/5 bg-[#F9F9F9] dark:border-white/5 cursor-pointer hover:bg-neutral-100"
                >
                  {formattedTag}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* External Link Icon (15x15) */}
      <div className="shrink-0 pt-0.5 text-[#161616] dark:text-neutral-400 group-hover:text-[#5737FA] transition-colors">
        <img src="/figma_assets/External_Link.png" alt="" className="w-[24px] h-[24px] -mt-1" />
      </div>
    </div>
  );
};
