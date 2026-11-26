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
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const req = useRef(0);

  useEffect(() => {
    const id = ++req.current;
    setIsLoading(true); setIsLoadingMore(false); setError(false); setEvents([]); setCursor(null); setTotalEvents(null);
    fetchBonds(filters)
      .then((p) => {
        if (id !== req.current) return;
        setEvents(p.events); setCursor(p.nextCursor ?? null);
        setTotalEvents(p.totalEvents); setIsLoading(false);
      })
      .catch((err) => {
        console.error('[calendar/bonds]', err);
        if (id === req.current) { setError(true); setIsLoading(false); }
      });
  }, [filters.period, filters.type]);

  const hasMore = cursor !== null;
  const loadMore = () => {
    if (!cursor || isLoadingMore) return;
    const id = req.current;
    const nextCursor = cursor;
    setIsLoadingMore(true);
    fetchBonds(filters, nextCursor)
      .then((p) => {
        if (id !== req.current) return;
        setEvents((prev) => {
          const seen = new Set(prev.map(keyOf));
          return [...prev, ...p.events.filter((e) => !seen.has(keyOf(e)))];
        });
        setCursor(p.nextCursor ?? null);
      })
      .catch((err) => console.error('[calendar/bonds] следующая страница', err))
      .finally(() => { if (id === req.current) setIsLoadingMore(false); });
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
