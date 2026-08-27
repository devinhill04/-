import React from 'react';
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

export const FigmaPainDetailScreen: React.FC<FigmaPainDetailScreenProps> = ({
  pain,
  posts,
  onBack,
  onSelectTag,
}) => {
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

      {/* Intro Banner for this Pain / Theme */}
      <div
        style={{
          borderRadius: '12px',
          background: pain.bgColor,
          padding: '16px',
        }}
        className="relative overflow-hidden flex items-center justify-between shadow-2xs"
      >
        <div className="z-10 max-w-[200px]">
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '18px',
            }}
            className="text-[#161616]"
          >
            {pain.body}
          </p>
        </div>

        <div className="w-[80px] h-[80px] shrink-0">
          <img
            src={pain.image}
            alt={pain.title}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between pb-1">
          <span
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '20px',
            }}
            className="text-[#161616] dark:text-white"
          >
            Подборка материалов
          </span>
          <span className="text-xs text-[#7D7C82] dark:text-neutral-400 font-medium">
            {posts.length} постов
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center bg-[#F9F9F9] dark:bg-neutral-800 rounded-xl text-neutral-500 text-sm">
            Скоро здесь появятся новые материалы по теме «{pain.title}»
          </div>
        ) : (
          posts.map((post) => (
            <FigmaPostCard
              key={post.id}
              post={post}
              onTagClick={onSelectTag}
            />
          ))
        )}
      </div>
    </div>
  );
};
