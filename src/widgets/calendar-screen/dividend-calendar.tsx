import React, { useEffect, useState } from 'react';
import { fetchDividends, SITE_URLS } from '../../entities/calendar/model/api';
import type { DividendCalendarEvent, DividendStatus } from '../../entities/calendar/model/quotes-api';
import { isoToRu } from '../../entities/calendar/model/dates';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { AnalyticsService } from '../../shared/analytics/analytics';

const STATUS: Record<DividendStatus, string> = {
  confirmed: 'Утверждён', recommended: 'Рекомендован', forecast: 'Прогноз',
  canceled: 'Отменён', unknown: 'Статус не указан',
};
const money = (n: number | null) => n === null ? 'Сумма не указана' : `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽/акция`;
const info = 'text-[12px] leading-[17px] text-[#7D7C82] dark:text-neutral-400';
const key = (e: DividendCalendarEvent) => e.eventKey;
export const DividendCalendar: React.FC = () => {
  const [events, setEvents] = useState<DividendCalendarEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    AnalyticsService.track('calendar_dividends_open');
    fetchDividends()
      .then((result) => { if (active) { setEvents(result.events); setCursor(result.nextCursor); setLoading(false); } })
      .catch((err) => { console.error('[calendar/dividends]', err); if (active) { setLoading(false); setError(true); } });
    return () => { active = false; };
  }, []);
  const loadMore = async () => {
    if (!cursor || more) return;
    setMore(true);
    try {
      const next = await fetchDividends(cursor);
      setEvents((prev) => {
        const seen = new Set(prev.map(key));
        return [...prev, ...next.events.filter((e) => !seen.has(key(e)))];
      });
      setCursor(next.nextCursor);
    } catch (e) { console.error('[calendar/dividends] ещё', e); setError(true); }
    finally { setMore(false); }
  };
  return (
    <div className="flex flex-col gap-3" data-calendar="dividends">
      <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400">
        Дивидендные отсечки на ближайшие 90 дней. Отдельно отмечаем рекомендации и прогнозы; даты и суммы могут изменяться.
      </p>
      {loading && <p className="py-6 text-center text-[14px] text-[#7D7C82]">Загружаю дивиденды…</p>}
      {error && <p className="py-4 text-center text-[13px] text-[#BA1111]">Не удалось получить данные API. Проверьте настройку серверного токена и повторите позже.</p>}
      {!loading && !error && events.length === 0 && <p className="py-6 text-center text-[14px] text-[#7D7C82]">На выбранный период событий нет.</p>}
      {events.map((e) => (
        <div key={e.eventKey} className="rounded-[12px] bg-[#F9F9F9] p-3 dark:bg-neutral-800/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#161616] dark:text-white">{e.name} ({e.ticker})</p>
              <p className={info}>{e.period} · {STATUS[e.status]}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[14px] font-semibold text-[#161616] dark:text-white">{money(e.amount)}</p>
              {e.forecast.amount && <p className={info}>прогноз</p>}
            </div>
          </div>
          <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 ${info}`}>
            <span>Реестр: {e.recordDate ? isoToRu(e.recordDate) : '—'}{e.forecast.recordDate ? ' · прогноз' : ''}</span>
            <span>Купить до: {e.buyBeforeDate ? isoToRu(e.buyBeforeDate) : '—'}{e.forecast.buyBeforeDate ? ' · прогноз' : ''}</span>
            <span>Выплата до: {e.paymentDeadline ? isoToRu(e.paymentDeadline) : '—'}{e.forecast.paymentDeadline ? ' · прогноз' : ''}</span>
          </div>
          <button type="button" onClick={() => openPostLink(e.sourceUrl, e.name, { silent: true })}
            className="mt-2 text-[12px] font-medium text-[var(--accent)]">Источник →</button>
        </div>
      ))}
      {!loading && cursor && <button type="button" disabled={more} onClick={loadMore}
        className="h-10 rounded-[8px] bg-[#F5F5F5] text-[14px] dark:bg-neutral-800 disabled:opacity-50">
        {more ? 'Загружаю…' : 'Показать ещё'}
      </button>}
      <p className={info}>Это информационный календарь. Наличие события не гарантирует право на дивиденды.</p>
      <button type="button" onClick={() => openPostLink(SITE_URLS.dividends, 'Календарь дивидендов', { silent: true })}
        className="text-center text-[13px] font-medium text-[var(--accent)]">Календарь на investfuture.ru →</button>
    </div>
  );
};
