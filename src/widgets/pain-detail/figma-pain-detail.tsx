import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FigmaPainCard } from '../../shared/config/figma-data';
import { FigmaPostCard } from '../post-card/figma-post-card';
import { Post } from '../../entities/post/model/types';
import { triggerHaptic } from '../../lib/telegram';

interface FigmaPainDetailScreenProps {
  pain: FigmaPainCard;
  posts: Post[];
  onBack: () => void;
  onSelectTag?: (tag: string) => void;
}

const PAGE_SIZE = 10;

export const FigmaPainDetailScreen: React.FC<FigmaPainDetailScreenProps> = ({
  pain,
  posts,
  onBack,
  onSelectTag,
}) => {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const visiblePosts = posts.slice(0, displayCount);
  const remaining = posts.length - displayCount;

  const handleShowMore = () => {
    triggerHaptic('light');
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="w-full max-w-[390px] mx-auto px-3 py-2 flex flex-col gap-4">
      {/* Navigation / Section + Back (w:390, h:30, gap:12) */}
      <div className="flex items-center gap-3 py-2 border-b border-black/5 dark:border-white/10">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="p-1 -ml-1 text-[#161616] dark:text-white hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: '24px',
            lineHeight: '30px',
          }}
          className="text-[#161616] dark:text-white truncate"
        >
          {pain.title}
        </h2>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-2 pt-2">
        {posts.length === 0 ? (
          <div className="p-8 text-center bg-[#F9F9F9] dark:bg-neutral-800 rounded-xl text-neutral-500 text-sm">
            Скоро здесь появятся новые материалы по теме «{pain.title}»
          </div>
        ) : (
          <>
            {visiblePosts.map((post) => (
              <FigmaPostCard
                key={post.id}
                post={post}
                onTagClick={onSelectTag}
                showTags={false}
              />
            ))}

            {remaining > 0 && (
              <button
                onClick={handleShowMore}
                style={{ borderRadius: '8px', background: '#F9F9F9' }}
                className="w-full h-10 flex items-center justify-center text-[#161616] dark:bg-neutral-800 dark:text-neutral-200 font-manrope text-[14px] font-medium transition-all active:scale-[0.99] cursor-pointer"
              >
                {`Показать ещё ${Math.min(PAGE_SIZE, remaining)} публикаций`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
