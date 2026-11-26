// Калькулятор дивидендов по акциям — как на сайте investfuture.ru: сумма = количество акций × дивиденд на акцию,
// округление до копеек для всей позиции. Налоги, комиссии и право на выплату не определяются.
// Данные сейчас — открытый API Мосбиржи: список акций, цена, суммы дивидендов и даты реестра. Год (период),
// статус решения (утверждён / рекомендация) и срок выплаты у биржи не публикуются — они придут с API InvestFuture
// (метод дивидендов из ТЗ по календарям); до этого экран их не показывает, а не выдумывает.
const ISS = 'https://iss.moex.com/iss';

type Block = { columns: string[]; data: unknown[][] } | undefined;
const rows = (b: Block): Record<string, any>[] => (b?.columns && b.data ? b.data.map((r) => Object.fromEntries(b.columns.map((c, i) => [c.toLowerCase(), r[i]]))) : []);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x)) ? Number(x) : null);
const date = (x: unknown): string | null => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x) && !x.startsWith('0000') ? x.slice(0, 10) : null);

export interface Share { secid: string; name: string } // name — краткое биржевое («Сбербанк»), как на сайте
export interface SharePrice { price: number | null; changePct: number | null; at: string | null } // at: YYYY-MM-DDTHH:MM (МСК)
export interface Decision {
  recordDate: string; // дата реестра
  amount: number; // на одну акцию
  currency: string;
  period?: string | null; // «2025 год» — с API
  status?: 'approved' | 'recommended' | 'forecast' | null; // с API
  paymentDeadline?: string | null; // срок выплаты — с API
}

export function parseShares(json: any): Share[] {
  const seen = new Set<string>();
  return rows(json?.securities)
    .filter((r) => r.secid && !seen.has(r.secid) && seen.add(r.secid))
    .map((r) => ({ secid: String(r.secid), name: String(r.shortname ?? r.secid) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

// Поиск по тикеру и словам названия; ввод без учёта регистра, пробелов и ё/е.
const normalizeShareQuery = (value: string) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
const isOrderedMatch = (word: string, term: string): boolean => {
  if (!word.startsWith(term[0])) return false;
  let at = 0;
  for (const letter of term) {
    at = word.indexOf(letter, at);
    if (at < 0) return false;
    at += 1;
  }
  return true;
};
export function searchShares(shares: Share[], query: string, limit = 12): Share[] {
  const terms = normalizeShareQuery(query).split(/\s+/).filter(Boolean);
  if (!terms.length || limit <= 0) return [];
  const rank = (share: Share): number | null => {
    const ticker = normalizeShareQuery(share.secid);
    const name = normalizeShareQuery(share.name);
    const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (!terms.every((t) => ticker.includes(t) || name.includes(t) || (t.length >= 2 && words.some((w) => isOrderedMatch(w, t))))) return null;
    if (terms.length === 1 && ticker === terms[0]) return 0;
    if (terms.every((t) => ticker.startsWith(t))) return 1;
    if (terms.every((t) => name.startsWith(t))) return 2;
    if (terms.every((t) => words.some((w) => w.startsWith(t)))) return 3;
    if (terms.every((t) => ticker.includes(t) || name.includes(t))) return 4;
    return 5;
  };
  return shares
    .map((share) => ({ share, score: rank(share) }))
    .filter((entry): entry is { share: Share; score: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score || a.share.name.localeCompare(b.share.name, 'ru'))
    .slice(0, limit)
    .map((entry) => entry.share);
}

export function parsePrice(json: any): SharePrice {
  const m = rows(json?.marketdata)[0] ?? {};
  const s = rows(json?.securities)[0] ?? {};
  const last = num(m.last) ?? num(m.lcurrentprice);
  const prev = num(s.prevprice);
  const changePct = num(m.lasttoprevprice) ?? (last !== null && prev ? ((last - prev) / prev) * 100 : null);
  const t = typeof m.time === 'string' && /^\d{2}:\d{2}/.test(m.time) ? m.time.slice(0, 5) : null;
  const d = date(m.tradedate) ?? date(typeof m.systime === 'string' ? m.systime : null);
  return { price: last ?? prev, changePct, at: t && d ? `${d}T${t}` : null };
}

// Решения: только с известной суммой; новые сверху. Сколько показывать — решает экран.
export function parseDecisions(json: any): Decision[] {
  return rows(json?.dividends)
    .map((r) => ({ recordDate: date(r.registryclosedate), amount: num(r.value), currency: String(r.currencyid ?? 'RUB') }))
    .filter((r): r is Decision => !!r.recordDate && r.amount !== null && r.amount > 0)
    .map((r) => ({ ...r, currency: r.currency === 'SUR' ? 'RUB' : r.currency }))
    .sort((a, b) => (a.recordDate < b.recordDate ? 1 : -1));
}

// Решение по умолчанию: ближайшее будущее по дате реестра, иначе последнее
export function defaultDecision(list: Decision[], today: string): Decision | null {
  const future = list.filter((d) => d.recordDate >= today).sort((a, b) => (a.recordDate < b.recordDate ? -1 : 1));
  return future[0] ?? list[0] ?? null;
}

const dmy = (iso: string) => iso.split('-').reverse().join('.');
const money = (x: number, cur = 'RUB') => `${x.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur === 'RUB' ? '₽' : cur}`;
const STATUS = { approved: 'Утверждён', recommended: 'Рекомендация', forecast: 'Прогноз' } as const;

// «2025 год · 37,64 ₽ · реестр 20.07.2026 · Утверждён» — части без данных опускаются
export function decisionLabel(d: Decision): string {
  return [d.period, money(d.amount, d.currency), `реестр ${dmy(d.recordDate)}`, d.status ? STATUS[d.status] : null].filter(Boolean).join(' · ');
}

export const QTY_MAX = 1_000_000_000;
export function calcDividends(amount: number, qty: number): number {
  return Math.round(amount * qty * 100) / 100;
}

const get = async (url: string) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(`Мосбиржа ответила ${r.status}`); return await r.json(); }
  finally { clearTimeout(t); }
};
const TQBR = `${ISS}/engines/stock/markets/shares/boards/TQBR/securities`;
// Quotes API 1.2.0 — основной источник, доступный только через серверный proxy.
// При отсутствии серверного токена или сбое сохраняем предыдущую интеграцию MOEX.
const ifqGet = async (endpoint: string, query: URLSearchParams) => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const res = await fetch(`/api/ifq/${endpoint}?${query}`, { signal: ctl.signal });
    if (!res.ok) throw new Error(`Quotes API: HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
};
export function parseIfqShares(json: any): Share[] {
  if (!Array.isArray(json?.instruments)) throw new Error('Неверный справочник Quotes API');
  const seen = new Set<string>();
  return json.instruments
    .filter((x: any) => typeof x?.ticker === 'string' && typeof x?.name === 'string'
      && /^stocks-[A-Z0-9-]+$/.test(x?.instrumentId) && !seen.has(x.ticker) && seen.add(x.ticker))
    .map((x: any) => ({ secid: x.ticker as string, name: x.name as string }))
    .sort((a: Share, b: Share) => a.name.localeCompare(b.name, 'ru'));
}
export function parseIfqPrice(json: any, secid: string): SharePrice {
  if (!Array.isArray(json?.quotes)) throw new Error('Неверный ответ котировок Quotes API');
  const q = json.quotes.find((x: any) => x?.instrumentId === `stocks-${secid}`);
  if (!q) return { price: null, changePct: null, at: null };
  return { price: num(q.value), changePct: null,
    // Для MOEX priceDate — московское локальное время, не UTC.
    at: typeof q.priceDate === 'string' ? q.priceDate : null };
}
export function parseIfqDecisions(json: any): Decision[] {
  if (!Array.isArray(json?.events)) throw new Error('Неверный ответ дивидендов Quotes API');
  return json.events
    .filter((x: any) => ['confirmed', 'recommended', 'forecast'].includes(x?.status)
      && date(x?.recordDate) && num(x?.amount) !== null && num(x.amount)! > 0)
    .map((x: any) => ({
      recordDate: date(x.recordDate)!,
      amount: num(x.amount)!,
      currency: x.currency === 'SUR' ? 'RUB' : String(x.currency ?? 'RUB'),
      period: typeof x.period === 'string' ? x.period : null,
      status: x.status === 'confirmed' ? 'approved' as const : x.status === 'recommended' ? 'recommended' as const : 'forecast' as const,
      paymentDeadline: date(x.paymentDeadline),
    }))
    .sort((a: Decision, b: Decision) => b.recordDate.localeCompare(a.recordDate));
}
const moscowDate = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const addCalendarDays = (dateIso: string, days: number) => {
  const value = new Date(`${dateIso}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export const loadShares = async (): Promise<Share[]> => {
  try {
    const q = new URLSearchParams({ source: '4', type: '1', withQuotes: 'true', limit: '1000' });
    const all: Share[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    for (let i = 0; i < 3; i++) {
      if (cursor) q.set('cursor', cursor);
      const json = await ifqGet('instruments', q);
      for (const share of parseIfqShares(json)) if (!seen.has(share.secid)) { seen.add(share.secid); all.push(share); }
      cursor = typeof json.nextCursor === 'string' ? json.nextCursor : null;
      if (!cursor) break;
    }
    if (all.length > 0) return all.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  } catch (error) { console.warn('[quotes/instruments] используем MOEX', error); }
  return parseShares(await get(`${TQBR}.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME`));
};
export const loadPrice = async (secid: string): Promise<SharePrice> => {
  try {
    const result = parseIfqPrice(await ifqGet('quotes/current',
      new URLSearchParams({ ids: `stocks-${secid}` })), secid);
    if (result.price !== null) return result;
  } catch (error) { console.warn('[quotes/current] используем MOEX', error); }
  return parsePrice(await get(`${TQBR}/${encodeURIComponent(secid)}.json?iss.meta=off&iss.only=securities,marketdata`));
};
export const loadDecisions = async (secid: string): Promise<Decision[]> => {
  try {
    const day = moscowDate();
    const q = new URLSearchParams({ ticker: secid, status: 'confirmed,recommended,forecast',
      dateField: 'record', from: addCalendarDays(day, -180), to: addCalendarDays(day, 185) });
    const events: Decision[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 3; i++) {
      if (cursor) q.set('cursor', cursor);
      const json = await ifqGet('calendar/dividends', q);
      events.push(...parseIfqDecisions(json));
      cursor = typeof json.nextCursor === 'string' ? json.nextCursor : null;
      if (!cursor) break;
    }
    return events.sort((a, b) => b.recordDate.localeCompare(a.recordDate));
  } catch (error) { console.warn('[quotes/dividends] используем MOEX', error); }
  return parseDecisions(await get(`${ISS}/securities/${encodeURIComponent(secid)}/dividends.json?iss.meta=off`));
};
