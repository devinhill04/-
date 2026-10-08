import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { TelegramPostRef, embedUrl, parseEmbedMessage } from '../../shared/lib/telegram-post';
import { getTelegramWebApp, triggerHaptic } from '../../lib/telegram';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { AnalyticsService } from '../../shared/analytics/analytics';

export interface ReaderPost extends TelegramPostRef {
  url: string;
  title: string;
}

const HINT_AFTER_MS = 7000; // столько ждём, прежде чем подсказать «не загрузилось — откройте в Telegram»
const START_HEIGHT = 200;

function useIsDark() {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const o = new MutationObserver(check);
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => o.disconnect();
  }, []);
  return dark;
}

// Читалка: пост открывается поверх мини-аппа во встроенном просмотре Telegram (тот же, что на сайтах),
// закрыл — и человек остаётся на том же месте приложения, никуда не уходя.
export const PostReader: React.FC<{ post: ReaderPost | null; onClose: () => void }> = ({ post, onClose }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const loadedRef = useRef(false);
  const [height, setHeight] = useState(START_HEIGHT);
  const [hint, setHint] = useState(false);
  const dark = useIsDark();
  const key = post ? `${post.channel}/${post.id}` : '';

  // Высоту окна поста подгоняем под содержимое: встроенный просмотр сам сообщает её сообщениями «resize»
  useEffect(() => {
    if (!post) return;
    loadedRef.current = false;
    setHeight(START_HEIGHT);
    setHint(false);
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return; // чужие окна игнорируем
      const msg = parseEmbedMessage(e.data);
      if (msg?.height) {
        loadedRef.current = true;
        setHeight(msg.height);
        setHint(false);
      }
    };
    window.addEventListener('message', onMessage);
    const timer = window.setTimeout(() => {
      if (loadedRef.current) return;
      setHint(true);
      AnalyticsService.track('post_reader_timeout', { url: post.url });
    }, HINT_AFTER_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, [key]);

  // Пока открыта читалка: страница под ней не прокручивается, Esc и кнопка «назад» Telegram закрывают её
  useEffect(() => {
    if (!post) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const back = getTelegramWebApp()?.BackButton;
    back?.show?.();
    back?.onClick?.(onClose);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      back?.offClick?.(onClose);
      back?.hide?.();
    };
  }, [key]);

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Пост">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-[430px] bg-white dark:bg-[#1a1a1a] rounded-t-[20px] shadow-2xl flex flex-col"
        style={{ height: '88vh', maxHeight: '88dvh' }}
      >
        <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-black/5 dark:border-white/10">
          <span className="text-[#7D7C82] dark:text-neutral-400 text-[13px] font-medium truncate">@{post.channel}</span>
          <button onClick={onClose} aria-label="Закрыть пост" className="p-1 -mr-1 text-[#161616] dark:text-white active:opacity-60">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pt-2">
          <iframe
            key={key}
            ref={frameRef}
            src={embedUrl(post, dark)}
            title={post.title}
            width="100%"
            height={height}
            frameBorder={0}
            scrolling="no"
            style={{ border: 'none', width: '100%', height, display: 'block', colorScheme: dark ? 'dark' : 'light' }}
          />
          {hint && (
            <p className="text-[#7D7C82] dark:text-neutral-400 text-[13px] text-center py-4 px-6">
              Пост не загрузился. Его можно открыть в Telegram кнопкой ниже.
            </p>
          )}
        </div>

        <div className="shrink-0 p-3 border-t border-black/5 dark:border-white/10" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={() => {
              triggerHaptic('light');
              AnalyticsService.track('post_reader_telegram', { url: post.url });
              openPostLink(post.url, post.title, { silent: true });
            }}
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 text-[14px] font-medium bg-[#161616] text-white dark:bg-white dark:text-[#161616] active:opacity-80"
          >
            Открыть в Telegram
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
