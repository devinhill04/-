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
  status?: 'approved' | 'recommended' | null; // с API
  paymentDeadline?: string | null; // срок выплаты — с API
}

export function parseShares(json: any): Share[] {
  const seen = new Set<string>();
  return rows(json?.securities)
    .filter((r) => r.secid && !seen.has(r.secid) && seen.add(r.secid))
    .map((r) => ({ secid: String(r.secid), name: String(r.shortname ?? r.secid) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
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
const STATUS = { approved: 'Утверждён', recommended: 'Рекомендация' } as const;

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
export const loadShares = async () => parseShares(await get(`${TQBR}.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME`));
export const loadPrice = async (secid: string) => parsePrice(await get(`${TQBR}/${encodeURIComponent(secid)}.json?iss.meta=off&iss.only=securities,marketdata`));
export const loadDecisions = async (secid: string) => parseDecisions(await get(`${ISS}/securities/${encodeURIComponent(secid)}/dividends.json?iss.meta=off`));
