import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

interface Props {
  symbol: string | null; // null — символа для этого инструмента нет вообще, график не пытаемся встроить
  label: string; // для подписи
  fallbackUrl: string; // ссылка на график на сайте InvestFuture
  isDark: boolean;
}

// Мини-график TradingView встраивается не как обычный React-компонент, а через их собственный
// скрипт: он сам создаёт iframe внутри переданного контейнера. React этим iframe не управляет,
// поэтому при смене символа/темы контейнер нужно очищать и пересоздавать скрипt заново.
export const TradingViewMiniChart: React.FC<Props> = ({ symbol, label, fallbackUrl, isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = containerRef.current;
    if (!el || !symbol) return;
    el.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    el.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height: 140,
      locale: 'ru',
      dateRange: '1M',
      colorTheme: isDark ? 'dark' : 'light',
      isTransparent: true,
      autosize: true,
      noTimeScale: false,
    });
    // Если скрипт не загрузится (сеть/блокировка) — покажем запасную ссылку явно, а не пустой блок
    script.onerror = () => setFailed(true);
    el.appendChild(script);

    return () => { el.innerHTML = ''; };
  }, [symbol, isDark]);

  const fallbackLink = (
    <button
      onClick={() => { triggerHaptic('light'); openPostLink(fallbackUrl, label); }}
      className="w-full flex items-center justify-center gap-1.5 py-2 text-[#5737FA] text-[13px] font-medium active:opacity-70"
    >
      График на investfuture.ru
      <ExternalLink className="w-3.5 h-3.5" />
    </button>
  );

  if (!symbol) return fallbackLink; // для этого инструмента символа нет в принципе (см. комментарий в tradingview-symbols.ts)

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full min-h-[140px]" />
      {failed && <p className="text-[#7D7C82] dark:text-neutral-400 text-xs text-center py-2">Не удалось загрузить график</p>}
      {fallbackLink}
    </div>
  );
};
