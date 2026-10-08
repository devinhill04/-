import { BondsFilters, BondsPage, KeyRateEvent } from './types';
import { addDays, toIsoLocal } from './dates';
import { parseBondsPage, parseKeyRatePage } from './parse';

// Запросы идут через наш сервер (/api/if-calendar/…): у сайта нет заголовков CORS.
// Если сайт даст JSON-эндпоинт, достаточно заменить эти две функции.

export const SITE_URLS = {
  bonds: 'https://investfuture.ru/calendar/bonds',
  keyRate: 'https://investfuture.ru/calendar/key-rate',
  bond: (isin: string) => `https://investfuture.ru/tools/bonds/${encodeURIComponent(isin)}`,
};

export async function fetchBonds(filters: BondsFilters, page = 1, now: Date = new Date()): Promise<BondsPage> {
  const q = new URLSearchParams({ from: toIsoLocal(now), to: toIsoLocal(addDays(now, filters.period)) });
  if (filters.type !== 'all') q.set('type', filters.type);
  if (page > 1) q.set('page', String(page));
  const res = await fetch(`/api/if-calendar/bonds?${q.toString()}`);
  if (!res.ok) throw new Error(`календарь облигаций: HTTP ${res.status}`);
  const parsed = parseBondsPage(await res.text());
  console.log('[calendar/bonds] разобрано событий:', parsed.events.length, '| всего:', parsed.totalEvents, '| страница', parsed.page, 'из', parsed.totalPages);
  // Пусто и сайт не написал «0 событий» — значит, разобрать не получилось (изменилась вёрстка), а не «выплат нет»
  if (parsed.events.length === 0 && parsed.totalEvents !== 0) throw new Error('не удалось разобрать страницу календаря облигаций');
  return parsed;
}

export async function fetchKeyRate(): Promise<KeyRateEvent[]> {
  const res = await fetch('/api/if-calendar/key-rate');
  if (!res.ok) throw new Error(`календарь ключевой ставки: HTTP ${res.status}`);
  const events = parseKeyRatePage(await res.text());
  console.log('[calendar/key-rate] разобрано событий:', events.length);
  if (events.length === 0) throw new Error('не удалось разобрать страницу календаря ключевой ставки');
  return events;
}
