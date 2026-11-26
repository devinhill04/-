import { BondsFilters, BondsPage, KeyRateEvent } from './types';
import { addDays, toIsoLocal } from './dates';
import { parseBondsPage, parseKeyRatePage } from './parse';
import { parseBondsApi, parseKeyRateApi, parseDividendsApi, type DividendCalendarEvent } from './quotes-api';

export const SITE_URLS = {
  bonds: 'https://investfuture.ru/calendar/bonds',
  dividends: 'https://investfuture.ru/calendar/dividends',
  keyRate: 'https://investfuture.ru/calendar/key-rate',
  bond: (isin: string) => `https://investfuture.ru/tools/bonds/${encodeURIComponent(isin)}`,
};

// Все новые методы защищены nginx/Vite proxy: токен остаётся на сервере.
// Резервный HTML-парсер задействуется только если секрет ещё не настроен (503).
const isoMoscow = (d = new Date()): string => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(d);
const plusDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
async function readJson(res: Response) {
  if (!res.ok) throw new Error(`Quotes API: HTTP ${res.status}`);
  return await res.json();
}

async function fallbackBonds(filters: BondsFilters, cursor: string | null, now: Date): Promise<BondsPage> {
  const page = cursor?.startsWith('legacy:') ? Number(cursor.slice(7)) : 1;
  if (!Number.isInteger(page) || page < 1) throw new Error('Некорректная страница календаря');
  const q = new URLSearchParams({ from: toIsoLocal(now), to: toIsoLocal(addDays(now, filters.period)) });
  if (filters.type !== 'all') q.set('type', filters.type);
  if (page > 1) q.set('page', String(page));
  const res = await fetch(`/api/if-calendar/bonds?${q}`);
  if (!res.ok) throw new Error(`HTML-календарь облигаций: HTTP ${res.status}`);
  const parsed = parseBondsPage(await res.text());
  if (!parsed.events.length && parsed.totalEvents !== 0) throw new Error('HTML-календарь: не удалось распознать события');
  return { ...parsed, nextCursor: parsed.totalPages !== null && page < parsed.totalPages ? `legacy:${page + 1}` : null };
}

export async function fetchBonds(filters: BondsFilters, cursor: string | null = null, now: Date = new Date()): Promise<BondsPage> {
  if (cursor?.startsWith('legacy:')) return fallbackBonds(filters, cursor, now);
  const from = isoMoscow(now);
  const q = new URLSearchParams({ from, to: plusDays(from, filters.period), limit: '200' });
  if (filters.type !== 'all') q.set('type', filters.type);
  if (cursor) q.set('cursor', cursor);
  const res = await fetch(`/api/ifq/calendar/bonds?${q}`);
  if (res.status === 503 && (await res.clone().json().catch(() => ({})))?.error === 'token_not_configured') {
    return fallbackBonds(filters, null, now);
  }
  return parseBondsApi(await readJson(res));
}

export async function fetchKeyRate(): Promise<KeyRateEvent[]> {
  const res = await fetch('/api/ifq/calendar/key-rate');
  if (res.status === 503 && (await res.clone().json().catch(() => ({})))?.error === 'token_not_configured') {
    const legacy = await fetch('/api/if-calendar/key-rate');
    if (!legacy.ok) throw new Error(`HTML-календарь ставки: HTTP ${legacy.status}`);
    const events = parseKeyRatePage(await legacy.text());
    if (!events.length) throw new Error('HTML-календарь: не удалось распознать события');
    return events;
  }
  return parseKeyRateApi(await readJson(res));
}

export async function fetchDividends(cursor: string | null = null, now: Date = new Date()): Promise<{ events: DividendCalendarEvent[]; nextCursor: string | null }> {
  const from = isoMoscow(now);
  const q = new URLSearchParams({ from, to: plusDays(from, 90), dateField: 'record',
    status: 'confirmed,recommended,forecast', limit: '200' });
  if (cursor) q.set('cursor', cursor);
  const res = await fetch(`/api/ifq/calendar/dividends?${q}`);
  return parseDividendsApi(await readJson(res));
}
