import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TradingViewMiniChart } from '../tradingview-mini-chart/tradingview-mini-chart';
import {
  tvSymbolForQuote,
  tvSymbolForStock,
  investfutureUrlForQuote,
  investfutureUrlForStock,
} from '../../entities/quotes/model/tradingview-symbols';
import { Quote } from '../../entities/quotes/model/types';
import { MoexStock } from '../../entities/moex/model/types';
import { formatBigRub, formatNumber, formatPercent } from '../../shared/lib/format';

export type PopupData =
  | { kind: 'quote'; quote: Quote }
  | { kind: 'stock'; stock: MoexStock }
  | null;

const changeColor = (p: number | null) =>
  p === null || p === 0 ? 'text-[#7D7C82] dark:text-neutral-400' : p > 0 ? 'text-[#00C853]' : 'text-[#FF1744]';

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) =>
  value.length > 45 ? (
    <div className="py-2.5">
      <p className="text-[#7D7C82] dark:text-neutral-400 text-[13px]">{label}</p>
      <p className="text-[#161616] dark:text-white text-[13px] font-medium leading-snug mt-1">{value}</p>
    </div>
  ) : (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[#7D7C82] dark:text-neutral-400 text-[13px]">{label}</span>
      <span className="text-[#161616] dark:text-white text-[13px] font-medium">{value}</span>
    </div>
  );

export const QuotePopup: React.FC<{ data: PopupData; onClose: () => void }> = ({ data, onClose }) => {
  // Та же тема, что у остального приложения (определяется классом на html, см. moex-heatmap.tsx)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!data) return null;

  let title = '';
  let subtitle = '';
  let price = '—';
  let change: number | null = null;
  let rows: { label: string; value: string }[] = [];
  let tvSymbol: string | null = null;
  let chartLabel = '';
  let fallbackUrl = '';

  if (data.kind === 'quote') {
    const q = data.quote;
    title = q.title;
    subtitle = q.ticker;
    price = q.price !== null ? `${formatNumber(q.price, q.decimals)} ${q.unit}` : '—';
    change = q.changePercent;
    rows = [{ label: 'Источник', value: q.source }];
    tvSymbol = tvSymbolForQuote(q.id);
    chartLabel = q.title;
    fallbackUrl = investfutureUrlForQuote(q.id, q.title);
  } else {
    const s = data.stock;
    title = s.shortname;
    subtitle = s.secid;
    price = s.lastPrice !== null ? `${formatNumber(s.lastPrice, 2)} ₽` : '—';
    change = s.changePercent;
    rows = [
      { label: 'Капитализация', value: formatBigRub(s.marketCap) },
      { label: 'Оборот за день', value: formatBigRub(s.tradingValue) },
      { label: 'Источник', value: 'Мосбиржа' },
    ];
    tvSymbol = tvSymbolForStock(s.secid);
    chartLabel = s.shortname;
    fallbackUrl = investfutureUrlForStock(s.secid, s.shortname);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[350px] bg-white dark:bg-[#1a1a1a] rounded-[20px] p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[#161616] dark:text-white text-[18px] font-bold leading-tight truncate">{title}</p>
            <p className="text-[#7D7C82] dark:text-neutral-400 text-[13px] mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Закрыть" className="p-1 -mr-1 text-[#161616] dark:text-white active:opacity-60">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Цена и так видна на графике TradingView, поэтому сверху её не дублируем.
            Исключение — инструмент без графика (Urals): иначе в окне не было бы ни одной цифры. */}
        {tvSymbol === null && (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[#161616] dark:text-white text-[26px] font-bold leading-none">{price}</span>
            {change !== null && <span className={`text-[14px] font-semibold ${changeColor(change)}`}>{formatPercent(change)}</span>}
          </div>
        )}

        <div className="mt-4">
          <TradingViewMiniChart key={tvSymbol ?? chartLabel} symbol={tvSymbol} label={chartLabel} fallbackUrl={fallbackUrl} isDark={isDark} />
        </div>

        <div className="mt-1 divide-y divide-black/5 dark:divide-white/10">
          {rows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
        </div>
      </div>
    </div>
  );
};
