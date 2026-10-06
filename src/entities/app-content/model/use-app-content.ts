import { useEffect, useState } from 'react';
import { AppContent } from './types';

export function useAppContent(url: string | undefined) {
  const [content, setContent] = useState<AppContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setIsLoading(true);
    setError(false);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: AppContent) => {
        if (!alive) return;
        if (!Array.isArray(data?.categories)) throw new Error('неверный формат данных');
        setContent(data);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error('[app-content] не удалось загрузить', url, e);
        if (alive) { setError(true); setIsLoading(false); }
      });
    return () => { alive = false; };
  }, [url]);

  return { content, isLoading, error };
}
