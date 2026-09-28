import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Quote } from '../../entities/quotes/model/types';
import { formatNumber, formatPercent } from '../../shared/lib/format';
import { triggerHaptic } from '../../lib/telegram';

interface QuotesListProps {
  main: Quote[];
  extra: Quote[];
  onSelect: (q: Quote) => void;
}

const changeColor = (p: number | null) =>
  p === null || p === 0 ? 'text-[#7D7C82] dark:text-neutral-400' : p > 0 ? 'text-[#00C853]' : 'text-[#FF1744]';

const QuoteRow: React.FC<{ q: Quote; onSelect: (q: Quote) => void }> = ({ q, onSelect }) => (
  <button
    onClick={() => { triggerHaptic('light'); onSelect(q); }}
    className="w-full flex items-center gap-3 px-3 py-3 text-left active:opacity-70 transition-opacity"
  >
    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-white dark:bg-neutral-700 text-[#161616] dark:text-white text-[13px] font-bold">
      {q.badge}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight truncate">{q.title}</p>
      <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-tight mt-0.5">{q.ticker}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight">
        {q.price !== null ? `${formatNumber(q.price, q.decimals)} ${q.unit}` : '—'}
      </p>
      <p className={`text-[12px] font-medium leading-tight mt-0.5 ${changeColor(q.changePercent)}`}>
        {q.changePercent !== null ? formatPercent(q.changePercent) : ''}
      </p>
    </div>
  </button>
);

export const QuotesList: React.FC<QuotesListProps> = ({ main, extra, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full flex flex-col">
      <div style={{ borderRadius: '12px' }} className="bg-[#F9F9F9] dark:bg-neutral-800/80 divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
        {main.map((q) => <QuoteRow key={q.id} q={q} onSelect={onSelect} />)}
        {expanded && extra.map((q) => <QuoteRow key={q.id} q={q} onSelect={onSelect} />)}
      </div>

      <button
        onClick={() => { triggerHaptic('light'); setExpanded((v) => !v); }}
        className="w-full h-10 mt-1 flex items-center justify-center gap-1 text-[#161616] dark:text-neutral-200 text-[14px] font-medium active:opacity-70"
      >
        {expanded ? 'Скрыть' : `Показать ещё ${extra.length}`}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );
};
