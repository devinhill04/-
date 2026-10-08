import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useBonds, useKeyRate, groupByDate } from '../../entities/calendar/model/use-calendar';
import { BondEvent, BondsFilters, BondsPeriod, BondsTypeFilter, BondEventType, KeyRateEvent } from '../../entities/calendar/model/types';
import { SITE_URLS } from '../../entities/calendar/model/api';
import { countdownLabel, daysUntil, formatDayMonth, isoToRu, monthShort, weekdayShort } from '../../entities/calendar/model/dates';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';
import { AnalyticsService } from '../../shared/analytics/analytics';

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: '25px' }} className="text-[#161616] dark:text-white">
    {children}
  </h2>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-6 text-center">{children}</p>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ borderRadius: '12px' }} className="bg-[#F9F9F9] dark:bg-neutral-800/80 divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
    {children}
  </div>
);

const SiteLink: React.FC<{ url: string; label: string; tab: string }> = ({ url, label, tab }) => (
  <button
    onClick={() => {
      triggerHaptic('light');
      AnalyticsService.track('calendar_site_link', { tab });
      openPostLink(url, label, { silent: true });
    }}
    className="w-full flex items-center justify-center gap-1.5 py-2 text-[#5737FA] text-[13px] font-medium active:opacity-70"
  >
    {label}
    <ExternalLink className="w-3.5 h-3.5" />
  </button>
);

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; wide?: boolean }> = ({ active, onClick, children, wide }) => (
  <button
    onClick={onClick}
    className={`${wide ? 'flex-1 h-9 rounded-[8px] text-[13px]' : 'h-8 px-3 rounded-full text-[12px] shrink-0'} font-medium transition-colors ${
      active ? 'bg-[#161616] text-white dark:bg-white dark:text-[#161616]' : 'bg-[#F5F5F5] dark:bg-neutral-800 text-[#161616] dark:text-neutral-300'
    }`}
  >
    {children}
  </button>
);

// ---------------- Ключевая ставка ----------------

const KEY_RATE_VISIBLE = 6;

export const KeyRateList: React.FC<{ events: KeyRateEvent[]; now?: Date }> = ({ events, now }) => {
  const [all, setAll] = useState(false);
  const shown = all ? events : events.slice(0, KEY_RATE_VISIBLE);

  return (
    <div className="flex flex-col gap-2">
      <Card>
        {shown.map((e, i) => {
          const days = daysUntil(e.date, now);
          const isDecision = /решени/i.test(e.label);
          return (
            <div key={`${e.date}-${e.title}`} className="flex gap-3 px-3 py-3">
              <div className="w-11 shrink-0 text-center">
                <p className="text-[#161616] dark:text-white text-[20px] font-semibold leading-none">{e.date.slice(8)}</p>
                <p className="text-[#7D7C82] dark:text-neutral-400 text-[11px] mt-1 uppercase">{monthShort(e.date)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isDecision ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-black/5 dark:bg-white/10 text-[#7D7C82] dark:text-neutral-300'}`}>
                    {e.label}
                  </span>
                  {i === 0 && days >= 0 && <span className="text-[var(--accent)] text-[11px] font-semibold">{countdownLabel(days)}</span>}
                </div>
                <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight mt-1">{e.title}</p>
                <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-[16px] mt-1">{e.description}</p>
              </div>
            </div>
          );
        })}
      </Card>
      {events.length > KEY_RATE_VISIBLE && (
        <button
          onClick={() => { triggerHaptic('light'); setAll((v) => !v); }}
          className="w-full h-9 text-[#161616] dark:text-neutral-200 text-[14px] font-medium active:opacity-70"
        >
          {all ? 'Скрыть' : `Показать все ${events.length}`}
        </button>
      )}
    </div>
  );
};

const KeyRateTab: React.FC = () => {
  const { events, isLoading, error } = useKeyRate();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#7D7C82] dark:text-neutral-400 text-[13px] leading-[18px]">
        Заседания Совета директоров Банка России и даты публикации резюме обсуждений. Даты и время могут измениться на стороне источника.
      </p>
      {isLoading && <Note>Загружаю календарь...</Note>}
      {error && <Note>Не удалось загрузить календарь ключевой ставки.</Note>}
      {!isLoading && !error && <KeyRateList events={events} />}
      <SiteLink url={SITE_URLS.keyRate} label="Календарь на investfuture.ru" tab="keyrate" />
    </div>
  );
};

// ---------------- Облигации ----------------

const TYPE_LABEL: Record<BondEventType, string> = { coupon: 'Купон', amortization: 'Амортизация', redemption: 'Погашение' };
const TYPE_STYLE: Record<BondEventType, string> = {
  coupon: 'bg-[#E8F7EC] text-[#11BA2D] dark:bg-[#11BA2D]/15',
  amortization: 'bg-[#FFF3DC] text-[#A86400] dark:bg-[#FFB020]/15 dark:text-[#FFB020]',
  redemption: 'bg-[#FDE8E8] text-[#BA1111] dark:bg-[#BA1111]/20 dark:text-[#FF6B6B]',
};

const amountFmt = (n: number) => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BondRow: React.FC<{ e: BondEvent; onOpen: (e: BondEvent) => void }> = ({ e, onOpen }) => (
  <button onClick={() => onOpen(e)} className="w-full flex items-start gap-3 px-3 py-3 text-left active:opacity-70 transition-opacity">
    <span className={`mt-0.5 shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_STYLE[e.type]}`}>{TYPE_LABEL[e.type]}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight truncate">{e.name}</p>
      <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-tight mt-0.5 truncate">
        {e.isin}
        {e.recordDate && ` · фиксация ${isoToRu(e.recordDate)}`}
      </p>
    </div>
    <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight shrink-0">{amountFmt(e.amount)} ₽</p>
  </button>
);

const PERIODS: { id: BondsPeriod; label: string }[] = [
  { id: 30, label: '30 дней' },
  { id: 90, label: '90 дней' },
  { id: 365, label: 'Год' },
];
const TYPES: { id: BondsTypeFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'coupon', label: 'Купоны' },
  { id: 'amortization', label: 'Амортизация' },
  { id: 'redemption', label: 'Погашения' },
];

const BondsTab: React.FC = () => {
  const [filters, setFilters] = useState<BondsFilters>({ period: 30, type: 'all' });
  const { events, totalEvents, hasMore, isLoading, isLoadingMore, error, loadMore } = useBonds(filters);

  const change = (next: BondsFilters) => {
    if (next.period === filters.period && next.type === filters.type) return;
    triggerHaptic('light');
    AnalyticsService.track('calendar_bonds_filter', { period: next.period, type: next.type });
    setFilters(next);
  };
  const openBond = (e: BondEvent) => {
    triggerHaptic('light');
    AnalyticsService.track('calendar_bond_click', { isin: e.isin });
    openPostLink(SITE_URLS.bond(e.isin), e.name, { silent: true });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto -mx-3 px-3 pb-0.5">
        {PERIODS.map((p) => <Pill key={p.id} active={filters.period === p.id} onClick={() => change({ ...filters, period: p.id })}>{p.label}</Pill>)}
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-3 px-3 pb-0.5">
        {TYPES.map((t) => <Pill key={t.id} active={filters.type === t.id} onClick={() => change({ ...filters, type: t.id })}>{t.label}</Pill>)}
      </div>

      {isLoading && <Note>Загружаю календарь...</Note>}
      {error && <Note>Не удалось загрузить календарь облигаций.</Note>}
      {!isLoading && !error && events.length === 0 && <Note>За выбранный период выплат нет.</Note>}

      {!isLoading && !error && events.length > 0 && (
        <>
          {totalEvents !== null && (
            <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px]">Найдено выплат: {totalEvents.toLocaleString('ru-RU')}</p>
          )}
          {groupByDate(events).map((g) => (
            <div key={g.date} className="flex flex-col gap-1.5">
              <p className="text-[#161616] dark:text-white text-[14px] font-semibold px-1">
                {formatDayMonth(g.date)}, {weekdayShort(g.date)}
              </p>
              <Card>{g.items.map((e) => <BondRow key={`${e.type}-${e.isin}-${e.amount}`} e={e} onOpen={openBond} />)}</Card>
            </div>
          ))}
          {hasMore && (
            <button
              disabled={isLoadingMore}
              onClick={() => { triggerHaptic('light'); AnalyticsService.track('calendar_bonds_more'); loadMore(); }}
              className="w-full h-10 rounded-[8px] bg-[#F5F5F5] dark:bg-neutral-800 text-[#161616] dark:text-neutral-200 text-[14px] font-medium active:opacity-70 disabled:opacity-60"
            >
              {isLoadingMore ? 'Загружаю…' : 'Показать ещё'}
            </button>
          )}
          <p className="text-[#7D7C82] dark:text-neutral-400 text-[11px] leading-[15px]">
            Дата выплаты и дата фиксации владельцев — разные даты. Календарь не подтверждает владение бумагой и не гарантирует поступление выплат.
          </p>
        </>
      )}
      <SiteLink url={SITE_URLS.bonds} label="Календарь на investfuture.ru" tab="bonds" />
    </div>
  );
};

// ---------------- Экран ----------------

type Tab = 'bonds' | 'keyrate';

export const CalendarScreen: React.FC = () => {
  const [tab, setTab] = useState<Tab>('bonds');
  const select = (t: Tab) => {
    if (t === tab) return;
    triggerHaptic('light');
    AnalyticsService.track('calendar_tab', { tab: t });
    setTab(t);
  };

  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col gap-4 px-3 pt-3 pb-6">
      <Title>Календари</Title>
      <div className="flex gap-1">
        <Pill wide active={tab === 'bonds'} onClick={() => select('bonds')}>Облигации</Pill>
        <Pill wide active={tab === 'keyrate'} onClick={() => select('keyrate')}>Ключевая ставка</Pill>
      </div>
      {tab === 'bonds' ? <BondsTab /> : <KeyRateTab />}
    </div>
  );
};
