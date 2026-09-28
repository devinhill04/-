import { useEffect, useRef, useState } from 'react';

export interface NewsItem {
  id: string;
  text: string;
  url: string;
  date: string | null; // ISO
}

// Same-origin: в dev проксируется Vite'ом, в проде — nginx (см. vite.config.ts и Dockerfile).
// Оба перенаправляют на https://t.me/s/if_market_news — публичное превью канала IF News.
const NEWS_ENDPOINT = '/api/news';
const REFRESH_MS = 25 * 60 * 1000; // проверяем канал раз в 25 минут
const CACHE_KEY = 'if_news_cache_v1';

function parseNews(html: string): NewsItem[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const items: NewsItem[] = [];
  doc.querySelectorAll('.tgme_widget_message_wrap').forEach((wrap) => {
    const textEl = wrap.querySelector('.tgme_widget_message_text');
    const link = wrap.querySelector('a.tgme_widget_message_date');
    const time = wrap.querySelector('time');
    if (!textEl || !link) return;
    textEl.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    const text = (textEl.textContent ?? '').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
    const url = link.getAttribute('href') ?? '';
    if (!text || !url) return;
    items.push({ id: url, text, url, date: time?.getAttribute('datetime') ?? null });
  });
  // на странице посты идут от старых к новым — берём две последние, новые сверху
  return items.slice(-2).reverse();
}

function readCache(): { ts: number; items: NewsItem[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useNews() {
  const cached = useRef(readCache());
  const [items, setItems] = useState<NewsItem[]>(cached.current?.items ?? []);
  const [isLoading, setIsLoading] = useState(items.length === 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(NEWS_ENDPOINT);
        if (!res.ok) throw new Error(String(res.status));
        const parsed = parseNews(await res.text());
        if (parsed.length === 0) throw new Error('не удалось разобрать страницу канала');
        if (!alive) return;
        setItems(parsed);
        setError(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: parsed })); } catch { /* не критично */ }
      } catch (e) {
        console.error('[news] не удалось загрузить новости:', e);
        if (alive && items.length === 0) setError(true);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    const fresh = cached.current && Date.now() - cached.current.ts < REFRESH_MS;
    if (!fresh) load();
    const t = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, isLoading, error };
}
