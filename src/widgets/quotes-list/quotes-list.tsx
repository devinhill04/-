import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Quote } from '../../entities/quotes/model/types';
import { deriveAbsoluteChange, formatNumber } from '../../shared/lib/format';
import { triggerHaptic } from '../../lib/telegram';

interface QuotesListProps {
  main: Quote[];
  extra: Quote[];
  onSelect: (q: Quote) => void;
}

// Цвета ровно из макета (Figma: system/green #11ba2d, system/red #ba1111, system/zero #7d7c82)
const changeColor = (p: number | null) =>
  p === null || p === 0 ? 'text-[#7D7C82] dark:text-neutral-400' : p > 0 ? 'text-[#11BA2D]' : 'text-[#BA1111]';

// Иконка из макета, если файл уже загружен в /public/figma_assets/quotes/ — иначе кружок с буквами как запасной вариант
const QuoteIcon: React.FC<{ q: Quote }> = ({ q }) => {
  const [failed, setFailed] = useState(false);
  if (q.iconSrc && !failed) {
    return (
      <img
        src={q.iconSrc}
        alt=""
        onError={() => setFailed(true)}
        className="w-10 h-10 rounded-full shrink-0 object-cover"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-[#F9F9F9] dark:bg-neutral-700 text-[#161616] dark:text-white text-[13px] font-bold">
      {q.badge}
    </div>
  );
};

const QuoteRow: React.FC<{ q: Quote; onSelect: (q: Quote) => void }> = ({ q, onSelect }) => {
  const abs = q.price !== null && q.changePercent !== null ? deriveAbsoluteChange(q.price, q.changePercent) : null;

  return (
    <button
      onClick={() => { triggerHaptic('light'); onSelect(q); }}
      className="w-full flex items-center gap-3 text-left active:opacity-70 transition-opacity"
    >
      <QuoteIcon q={q} />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#161616] dark:text-white text-[14px] font-medium leading-[1.25] truncate">{q.title}</span>
          <span className="text-[#161616] dark:text-white text-[14px] font-medium leading-[1.25] shrink-0">
            {q.price !== null ? `${formatNumber(q.price, q.decimals)} ${q.unit}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-[1.5] truncate">{q.ticker}</span>
          {abs !== null && q.changePercent !== null && (
            <span className={`flex items-center gap-1 text-[12px] leading-[1.5] shrink-0 ${changeColor(q.changePercent)}`}>
              {abs > 0 ? '+' : ''}
              {formatNumber(abs, q.decimals)} {q.unit}
              <span className="w-1 h-1 rounded-full bg-current inline-block" />
              {Math.abs(q.changePercent).toFixed(2).replace('.', ',')} %
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export const QuotesList: React.FC<QuotesListProps> = ({ main, extra, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full flex flex-col gap-3">
      {main.map((q) => <QuoteRow key={q.id} q={q} onSelect={onSelect} />)}
      {expanded && extra.map((q) => <QuoteRow key={q.id} q={q} onSelect={onSelect} />)}

      <button
        onClick={() => { triggerHaptic('light'); setExpanded((v) => !v); }}
        className="w-full h-10 flex items-center justify-center gap-1 text-[#161616] dark:text-neutral-200 text-[14px] font-medium active:opacity-70"
      >
        {expanded ? 'Скрыть' : `Показать ещё ${extra.length}`}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );
};
