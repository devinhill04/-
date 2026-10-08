import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { copyText } from '../../shared/lib/copy-text';
import { MoexStock } from '../../entities/moex/model/types';
import { formatBigRub, formatNumber, formatPercent } from '../../shared/lib/format';
import { triggerHaptic } from '../../lib/telegram';
import { AnalyticsService } from '../../shared/analytics/analytics';

// ---------- Отбор данных (чистые функции) ----------

// Топ по обороту: самые торгуемые бумаги за день
export function pickTopByTurnover(stocks: MoexStock[], n: number): MoexStock[] {
  return [...stocks].sort((a, b) => b.tradingValue - a.tradingValue).slice(0, n);
}

// Лидеры роста и падения. Берём только 60 самых торгуемых бумаг: иначе в лидеры попадают
// малоликвидные акции, у которых +20% случается на паре сделок. Отбор по месту в рейтинге оборота,
// а не по сумме — так он не зависит от времени суток (утром оборот везде маленький).
export const LIQUID_UNIVERSE = 60;

export function pickMovers(stocks: MoexStock[], perSide = 5): { gainers: MoexStock[]; losers: MoexStock[] } {
  const liquid = pickTopByTurnover(stocks, LIQUID_UNIVERSE);
  return {
    gainers: liquid
      .filter((s) => (s.changePercent ?? 0) > 0)
      .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
      .slice(0, perSide),
    losers: liquid
      .filter((s) => (s.changePercent ?? 0) < 0)
      .sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))
      .slice(0, perSide),
  };
}

// ---------- Оформление ----------

const changeColor = (p: number | null) =>
  p === null || p === 0 ? 'text-[#7D7C82] dark:text-neutral-400' : p > 0 ? 'text-[#00C853]' : 'text-[#FF1744]';

// Логотипов компаний у нас нет — вместо них кружок с буквами тикера, цвет стабильно зависит от тикера
const hueOf = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
};

const priceDecimals = (p: number) => (p >= 1 ? 2 : 4);

// На аватарке — тикер целиком (SBER, а не SB). Круг 40px, поэтому шрифт уменьшается с длиной тикера:
// у полужирных заглавных ширина буквы ≈ 0,62 em, в круге остаётся ~34px по горизонтали.
export function tickerFontSize(len: number): number {
  return Math.max(7, Math.min(13, Math.floor((34 / (0.62 * Math.max(len, 1))) * 10) / 10));
}

const LONG_PRESS_MS = 450; // сколько держать палец на сером тикере
const MOVE_TOLERANCE = 8; // сдвинул палец дальше — это прокрутка, а не долгое нажатие

interface CopyMenu {
  x: number;
  y: number;
  status: 'ask' | 'done' | 'failed';
}

// Строка акции. Серый тикер можно зажать — появится кнопка «Скопировать» (выделение текста внутри кнопки-строки
// в мобильном WebView ненадёжно, поэтому меню своё). Обычное нажатие на строку по-прежнему открывает карточку.
const StockRow: React.FC<{ stock: MoexStock; subtitle: string; onSelect: (s: MoexStock) => void }> = ({ stock, subtitle, onSelect }) => {
  const [menu, setMenu] = useState<CopyMenu | null>(null);
  const tickerRef = useRef<HTMLParagraphElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const start = useRef({ x: 0, y: 0 });
  const suppressClick = useRef(false);

  const cancelTimer = () => {
    if (timer.current !== undefined) { window.clearTimeout(timer.current); timer.current = undefined; }
  };
  const closeMenu = () => setMenu(null);

  // Кнопка копирования висит над страницей в фиксированном месте — при прокрутке её надо убрать
  useEffect(() => {
    if (!menu) return;
    window.addEventListener('scroll', closeMenu, { passive: true });
    return () => window.removeEventListener('scroll', closeMenu);
  }, [menu !== null]);
  useEffect(() => cancelTimer, []);

  const openMenu = () => {
    const r = tickerRef.current?.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const x = r ? Math.min(Math.max(8, r.left), Math.max(8, vw - 200)) : 8;
    const y = r ? (r.top > 56 ? r.top - 44 : r.bottom + 8) : 8; // над тикером, а если сверху нет места — под ним
    triggerHaptic('medium');
    setMenu({ x, y, status: 'ask' });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    suppressClick.current = false; // новое касание: прошлый флаг больше не нужен
    cancelTimer();
    if (!tickerRef.current?.contains(e.target as Node)) return; // долгое нажатие работает только на сером тикере
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      suppressClick.current = true; // клик после отпускания пальца не должен открывать карточку
      openMenu();
    }, LONG_PRESS_MS);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (timer.current !== undefined && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE) cancelTimer();
  };

  const doCopy = async () => {
    const ok = await copyText(stock.secid);
    if (ok) AnalyticsService.track('market_ticker_copy', { id: stock.secid });
    setMenu((m) => (m ? { ...m, status: ok ? 'done' : 'failed' } : m));
    window.setTimeout(closeMenu, ok ? 1100 : 2400);
  };

  return (
    <button
      onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        triggerHaptic('light');
        onSelect(stock);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancelTimer}
      onPointerCancel={cancelTimer}
      onPointerLeave={cancelTimer}
      className="w-full flex items-center gap-3 px-3 py-3 text-left active:opacity-70 transition-opacity"
    >
      <div
        style={{ background: `hsl(${hueOf(stock.secid)} 55% 42%)` }}
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden text-white font-bold"
      >
        <span style={{ fontSize: tickerFontSize(stock.secid.length) }} className="leading-none tracking-tight">
          {stock.secid}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight truncate">{stock.shortname}</p>
        <p
          ref={tickerRef}
          onContextMenu={(e) => { e.preventDefault(); openMenu(); }} // на компьютере — правая кнопка
          style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
          className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-tight mt-0.5 truncate"
        >
          {subtitle}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight">
          {stock.lastPrice !== null ? `${formatNumber(stock.lastPrice, priceDecimals(stock.lastPrice))} ₽` : '—'}
        </p>
        <p className={`text-[12px] font-medium leading-tight mt-0.5 ${changeColor(stock.changePercent)}`}>
          {stock.changePercent !== null ? formatPercent(stock.changePercent) : ''}
        </p>
      </div>

      {menu &&
        createPortal(
          // Портал, чтобы карточка с overflow-hidden не обрезала кнопку. События из портала всплывают к строке
          // по дереву React, поэтому клики гасим — иначе нажатие на «Скопировать» открыло бы карточку акции.
          <>
            <div
              className="fixed inset-0 z-[70]"
              onClick={(e) => { e.stopPropagation(); closeMenu(); }}
              onPointerDown={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div
              role="button"
              onClick={(e) => { e.stopPropagation(); if (menu.status === 'ask') void doCopy(); }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ left: menu.x, top: menu.y }}
              className="fixed z-[71] h-9 px-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-medium shadow-xl bg-[#161616] text-white dark:bg-white dark:text-[#161616] active:opacity-80"
            >
              {menu.status === 'done' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {menu.status === 'ask' && `Скопировать ${stock.secid}`}
              {menu.status === 'done' && 'Скопировано'}
              {menu.status === 'failed' && `Не вышло. Тикер: ${stock.secid}`}
            </div>
          </>,
          document.body
        )}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ borderRadius: '12px' }} className="bg-[#F9F9F9] dark:bg-neutral-800/80 divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
    {children}
  </div>
);

interface ListProps {
  stocks: MoexStock[];
  onSelect: (s: MoexStock) => void;
}

// ---------- Единый блок под картой: вкладки «Рост / Падение / По обороту» ----------

type Tab = 'up' | 'down' | 'turnover';

export const StocksTabs: React.FC<ListProps> = ({ stocks, onSelect }) => {
  const [tab, setTab] = useState<Tab>('up');
  const [turnoverExpanded, setTurnoverExpanded] = useState(false);

  const { gainers, losers } = useMemo(() => pickMovers(stocks), [stocks]);
  const turnoverTop = useMemo(() => pickTopByTurnover(stocks, 10), [stocks]);

  const tabBtn = (id: Tab, label: string) => (
    <button
      onClick={() => {
        triggerHaptic('light');
        if (id !== tab) AnalyticsService.track('market_stocks_tab', { tab: id });
        setTab(id);
      }}
      style={{ borderRadius: '8px', height: '36px' }}
      className={`flex-1 text-[13px] font-medium transition-colors ${
        tab === id ? 'bg-[#161616] text-white dark:bg-white dark:text-[#161616]' : 'text-[#161616] dark:text-neutral-300'
      }`}
    >
      {label}
    </button>
  );

  let rows: MoexStock[];
  let getSubtitle: (s: MoexStock) => string;
  if (tab === 'turnover') {
    rows = turnoverExpanded ? turnoverTop : turnoverTop.slice(0, 5);
    getSubtitle = (s) => `${s.secid} · оборот ${formatBigRub(s.tradingValue)}`;
  } else {
    rows = tab === 'up' ? gainers : losers;
    getSubtitle = (s) => s.secid;
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex gap-1">
        {tabBtn('up', 'Рост')}
        {tabBtn('down', 'Падение')}
        {tabBtn('turnover', 'По обороту')}
      </div>

      {rows.length === 0 ? (
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-4 text-center">Пока нет данных</p>
      ) : (
        <Card>
          {rows.map((s) => (
            <StockRow key={s.secid} stock={s} subtitle={getSubtitle(s)} onSelect={onSelect} />
          ))}
        </Card>
      )}

      {tab === 'turnover' && turnoverTop.length > 5 && (
        <button
          onClick={() => { triggerHaptic('light'); setTurnoverExpanded((v) => !v); }}
          className="w-full h-10 flex items-center justify-center gap-1 text-[#161616] dark:text-neutral-200 text-[14px] font-medium active:opacity-70"
        >
          {turnoverExpanded ? 'Скрыть' : `Показать ещё ${turnoverTop.length - 5}`}
          {turnoverExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};
