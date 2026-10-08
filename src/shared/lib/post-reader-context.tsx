import React, { createContext, useCallback, useContext, useState } from 'react';
import { PostReader, ReaderPost } from '../../widgets/post-reader/post-reader';
import { parseTelegramPost } from './telegram-post';
import { openPostLink } from './open-telegram-link';
import { POST_READER_ENABLED } from '../config/features';
import { AnalyticsService } from '../analytics/analytics';

interface OpenOptions {
  silent?: boolean; // не считать как post_open (у новостей и графиков свои события)
}

interface PostReaderContextValue {
  openPost: (url: string, title: string, opts?: OpenOptions) => void;
}

// Без провайдера (в тестах, в отдельных виджетах) — прежнее поведение: открыть пост в Telegram
const PostReaderContext = createContext<PostReaderContextValue>({
  openPost: (url, title, opts) => openPostLink(url, title, opts),
});

export const usePostReader = () => useContext(PostReaderContext);

export const PostReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState<ReaderPost | null>(null);

  const openPost = useCallback((url: string, title: string, opts?: OpenOptions) => {
    const ref = POST_READER_ENABLED ? parseTelegramPost(url) : null;
    if (!ref) {
      // Закрытый канал, чужой сайт или функция выключена — открываем во внешнем приложении, как раньше
      openPostLink(url, title, opts);
      return;
    }
    // Событие то же, что и раньше при открытии поста, чтобы воронки «тег → пост» не поменялись
    if (!opts?.silent) AnalyticsService.track('post_open', { url, title });
    setCurrent({ ...ref, url, title });
  }, []);

  return (
    <PostReaderContext.Provider value={{ openPost }}>
      {children}
      <PostReader post={current} onClose={() => setCurrent(null)} />
    </PostReaderContext.Provider>
  );
};
