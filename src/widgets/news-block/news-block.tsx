import React from 'react';
import { useNews } from '../../entities/news/model/use-news';
import { formatNewsDate } from '../../shared/lib/format';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

const NEWS_CHANNEL_URL = 'https://t.me/if_market_news';

export const NewsBlock: React.FC = () => {
  const { items, isLoading, error } = useNews();

  return (
    <div className="w-full flex flex-col gap-2">
      {isLoading && items.length === 0 && (
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-4 text-center">Загружаю новости...</p>
      )}
      {error && items.length === 0 && (
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-2 text-center">Не удалось загрузить последние новости</p>
      )}

      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => { triggerHaptic('light'); openPostLink(n.url, 'IF News'); }}
          style={{ borderRadius: '12px' }}
          className="w-full text-left p-3 bg-[#F9F9F9] dark:bg-neutral-800/80 active:opacity-70 transition-opacity"
        >
          <p className="text-[#7D7C82] dark:text-neutral-400 text-[11px] mb-1">{formatNewsDate(n.date)}</p>
          <p className="text-[#161616] dark:text-white text-[14px] font-medium leading-[18px] line-clamp-3 whitespace-pre-line">{n.text}</p>
        </button>
      ))}

      <button
        onClick={() => { triggerHaptic('light'); openPostLink(NEWS_CHANNEL_URL, 'IF News'); }}
        style={{ borderRadius: '8px' }}
        className="w-full h-10 flex items-center justify-center text-[14px] font-medium bg-[#161616] text-white dark:bg-white dark:text-[#161616] active:opacity-80 transition-opacity"
      >
        Все новости
      </button>
    </div>
  );
};
