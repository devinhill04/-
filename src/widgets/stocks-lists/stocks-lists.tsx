import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MoexStock } from '../../entities/moex/model/types';
import { formatBigRub, formatNumber, formatPercent } from '../../shared/lib/format';
import { triggerHaptic } from '../../lib/telegram';

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

const StockRow: React.FC<{ stock: MoexStock; subtitle: string; onSelect: (s: MoexStock) => void }> = ({ stock, subtitle, onSelect }) => (
  <button
    onClick={() => { triggerHaptic('light'); onSelect(stock); }}
    className="w-full flex items-center gap-3 px-3 py-3 text-left active:opacity-70 transition-opacity"
  >
    <div
      style={{ background: `hsl(${hueOf(stock.secid)} 55% 42%)` }}
      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
    >
      {stock.secid.slice(0, 2)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight truncate">{stock.shortname}</p>
      <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-tight mt-0.5 truncate">{subtitle}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight">
        {stock.lastPrice !== null ? `${formatNumber(stock.lastPrice, priceDecimals(stock.lastPrice))} ₽` : '—'}
      </p>
      <p className={`text-[12px] font-medium leading-tight mt-0.5 ${changeColor(stock.changePercent)}`}>
        {stock.changePercent !== null ? formatPercent(stock.changePercent) : ''}
      </p>
    </div>
  </button>
);

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
      onClick={() => { triggerHaptic('light'); setTab(id); }}
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
