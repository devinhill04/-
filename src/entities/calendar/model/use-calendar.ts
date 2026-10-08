import { useEffect, useRef, useState } from 'react';
import { BondEvent, BondsFilters, KeyRateEvent } from './types';
import { fetchBonds, fetchKeyRate } from './api';

export function useKeyRate() {
  const [events, setEvents] = useState<KeyRateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchKeyRate()
      .then((e) => { if (alive) { setEvents(e); setIsLoading(false); } })
      .catch((err) => { console.error('[calendar/key-rate]', err); if (alive) { setError(true); setIsLoading(false); } });
    return () => { alive = false; };
  }, []);

  return { events, isLoading, error };
}

const keyOf = (e: BondEvent) => `${e.payDate}|${e.type}|${e.isin}|${e.amount}`;

export function useBonds(filters: BondsFilters) {
  const [events, setEvents] = useState<BondEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const req = useRef(0); // номер запроса: ответ на устаревший запрос (фильтр уже сменили) игнорируется

  useEffect(() => {
    const id = ++req.current;
    setIsLoading(true); setError(false); setEvents([]); setPage(1); setTotalPages(null); setTotalEvents(null);
    fetchBonds(filters, 1)
      .then((p) => {
        if (id !== req.current) return;
        setEvents(p.events); setPage(p.page ?? 1); setTotalPages(p.totalPages); setTotalEvents(p.totalEvents); setIsLoading(false);
      })
      .catch((err) => { console.error('[calendar/bonds]', err); if (id === req.current) { setError(true); setIsLoading(false); } });
  }, [filters.period, filters.type]);

  const hasMore = totalPages !== null && page < totalPages;

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return;
    const id = req.current;
    const next = page + 1;
    setIsLoadingMore(true);
    fetchBonds(filters, next)
      .then((p) => {
        if (id !== req.current) return;
        // граница страниц может разрезать один день пополам — повторы убираем
        setEvents((prev) => { const seen = new Set(prev.map(keyOf)); return [...prev, ...p.events.filter((e) => !seen.has(keyOf(e)))]; });
        setPage(next);
      })
      .catch((err) => console.error('[calendar/bonds] ещё', err))
      .finally(() => setIsLoadingMore(false));
  };

  return { events, totalEvents, hasMore, isLoading, isLoadingMore, error, loadMore };
}

// События по дням, в порядке появления
export function groupByDate(events: BondEvent[]): { date: string; items: BondEvent[] }[] {
  const map = new Map<string, BondEvent[]>();
  for (const e of events) {
    const list = map.get(e.payDate);
    if (list) list.push(e); else map.set(e.payDate, [e]);
  }
  return Array.from(map, ([date, items]) => ({ date, items }));
}
