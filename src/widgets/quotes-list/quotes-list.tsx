import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Quote } from '../../entities/quotes/model/types';
import { deriveAbsoluteChange, formatAbsChange, formatTrimmed } from '../../shared/lib/format';
import { triggerHaptic } from '../../lib/telegram';
import { AnalyticsService } from '../../shared/analytics/analytics';

interface QuotesListProps {
  main: Quote[];
  extra: Quote[];
  onSelect: (q: Quote) => void;
}

// Цвета ровно из макета (Figma: system/green #11ba2d, system/red #ba1111, system/zero #7d7c82)
const changeColor = (p: number | null) =>
  p === null || p === 0 ? 'text-[#7D7C82] dark:text-neutral-400' : p > 0 ? 'text-[#11BA2D]' : 'text-[#BA1111]';

// Иконка: круг 40px со светло-серой подложкой #F9F9F9, картинка лежит внутри с отступом (флаги — 28px, бочки — 37px и т.д.).
// Размеры замерены по скрину дизайнера. Исключение — лого MOEX: оно заполняет круг целиком.
// Если файла картинки нет — запасной вариант: символ в том же круге.
export const QuoteIcon: React.FC<{ q: Quote }> = ({ q }) => {
  const [failed, setFailed] = useState(false);
  const box = q.iconBox ?? 40;
  return (
    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-[#F9F9F9] dark:bg-neutral-800">
      {q.iconSrc && !failed ? (
        <img
          src={q.iconSrc}
          alt=""
          onError={() => setFailed(true)}
          style={q.iconCover ? { width: '100%', height: '100%', objectFit: 'cover' } : { width: box, height: box, objectFit: 'contain' }}
        />
      ) : (
        <span className="text-[#161616] dark:text-white text-[13px] font-bold">{q.badge}</span>
      )}
    </div>
  );
};

const QuoteRow: React.FC<{ q: Quote; onSelect: (q: Quote) => void }> = ({ q, onSelect }) => {
  const abs = q.price !== null && q.changePercent !== null ? deriveAbsoluteChange(q.price, q.changePercent) : null;
  const isZero = q.changePercent === 0;

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
            {q.price !== null ? `${formatTrimmed(q.price, q.decimals)} ${q.unit}` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-[1.5] truncate">{q.ticker}</span>
          {abs !== null && q.changePercent !== null && (
            <span className={`flex items-center text-[12px] leading-[1.5] shrink-0 ${changeColor(q.changePercent)}`}>
              {isZero ? '0' : `${abs > 0 ? '+' : ''}${formatAbsChange(abs, q.decimals)}`} {q.unit}
              {/* Icons/Point_S из макета: область 16×16, точка по центру */}
              <span className="w-4 h-4 inline-flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-current" />
              </span>
              {formatTrimmed(Math.abs(q.changePercent), 2)} %
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// Между строками: 12px, линия 1px #F9F9F9, 12px — шаг строк 65px, как в макете
const Divider: React.FC = () => <div className="h-px w-full shrink-0 bg-[#F9F9F9] dark:bg-neutral-800" />;

export const QuotesList: React.FC<QuotesListProps> = ({ main, extra, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const list = expanded ? [...main, ...extra] : main;

  return (
    <div className="w-full flex flex-col gap-3">
      {list.map((q, i) => (
        <React.Fragment key={q.id}>
          {i > 0 && <Divider />}
          <QuoteRow q={q} onSelect={onSelect} />
        </React.Fragment>
      ))}

      <button
        onClick={() => {
          triggerHaptic('light');
          if (!expanded) AnalyticsService.track('market_quotes_expand');
          setExpanded((v) => !v);
        }}
        className="w-full h-10 flex items-center justify-center gap-1 text-[#161616] dark:text-neutral-200 text-[14px] font-medium active:opacity-70"
      >
        {expanded ? 'Скрыть' : `Показать ещё ${extra.length}`}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );
};
