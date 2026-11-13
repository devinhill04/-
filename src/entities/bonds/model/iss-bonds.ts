import type { BondEvent } from './bond-calc';

// Данные облигаций из открытого API Мосбиржи (ISS). Ответы разбираются по названиям столбцов, а не по позициям.
// Потом источник можно заменить на API InvestFuture — расчёт (bond-calc.ts) от этого не зависит.
const ISS = 'https://iss.moex.com/iss';

type Block = { columns: string[]; data: unknown[][] } | undefined;
const rows = (b: Block): Record<string, any>[] => (b?.columns && b.data ? b.data.map((r) => Object.fromEntries(b.columns.map((c, i) => [c.toLowerCase(), r[i]]))) : []);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x)) ? Number(x) : null);
const date = (x: unknown): string | null => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x) && !x.startsWith('0000') ? x.slice(0, 10) : null);

export interface BondSearchItem { secid: string; isin: string; shortname: string; name: string; emitent: string; board: string | null }

export function parseSearch(json: any): BondSearchItem[] {
  return rows(json?.securities)
    .filter((r) => r.secid && (!r.group || String(r.group).includes('bond')))
    .map((r) => ({ secid: String(r.secid), isin: String(r.isin ?? r.secid), shortname: String(r.shortname ?? r.secid), name: String(r.name ?? r.shortname ?? ''), emitent: String(r.emitent_title ?? ''), board: r.primary_boardid ? String(r.primary_boardid) : null }));
}

export interface BondSchedule { events: BondEvent[]; offerDate: string | null; complete: boolean }

export function parseBondization(json: any, today: string): BondSchedule {
  const events: BondEvent[] = [];
  for (const c of rows(json?.coupons)) {
    const d = date(c.coupondate);
    if (d) events.push({ type: 'coupon', date: d, recordDate: date(c.recorddate), amount: num(c.value_rub) ?? num(c.value) });
  }
  for (const a of rows(json?.amortizations)) {
    const d = date(a.amortdate);
    if (d) events.push({ type: a.data_source === 'maturity' ? 'redemption' : 'amortization', date: d, amount: num(a.value_rub) ?? num(a.value) });
  }
  const offers = rows(json?.offers).map((o) => date(o.offerdate)).filter((d): d is string => !!d && d > today).sort();
  return { events, offerDate: offers[0] ?? null, complete: true };
}

export interface BondMarket { secid: string; isin: string; shortname: string; nominal: number; pricePct: number | null; accrued: number; currency: string; matDate: string | null; offerDate: string | null }

export function parseMarket(json: any, preferredBoard?: string | null): BondMarket | null {
  const sec = rows(json?.securities);
  const md = rows(json?.marketdata);
  if (sec.length === 0) return null;
  const priceOf = (board: string) => {
    const m = md.find((x) => x.boardid === board) ?? {};
    const s = sec.find((x) => x.boardid === board) ?? {};
    return num(m.last) ?? num(m.lcurrentprice) ?? num(m.waprice) ?? num(s.prevprice) ?? num(s.prevwaprice);
  };
  const s = (preferredBoard && sec.find((x) => x.boardid === preferredBoard)) || sec.find((x) => priceOf(x.boardid) !== null) || sec[0];
  const nominal = num(s.facevalue);
  if (nominal === null) return null;
  return {
    secid: String(s.secid), isin: String(s.isin ?? s.secid), shortname: String(s.shortname ?? s.secid), nominal,
    pricePct: priceOf(s.boardid), accrued: num(s.accruedint) ?? 0,
    currency: s.faceunit === 'SUR' || s.faceunit === 'RUB' || !s.faceunit ? 'RUB' : String(s.faceunit),
    matDate: date(s.matdate), offerDate: date(s.offerdate),
  };
}

const get = async (url: string) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`Мосбиржа ответила ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
};

export async function searchBonds(q: string): Promise<BondSearchItem[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  return parseSearch(await get(`${ISS}/securities.json?q=${encodeURIComponent(query)}&group_by=group&group_by_filter=stock_bonds&is_trading=1&limit=20&iss.meta=off`));
}

// График выплат постранично: по умолчанию Мосбиржа отдаёт не все строки
export async function loadSchedule(secid: string, today: string): Promise<BondSchedule> {
  const all: any = { coupons: { columns: [], data: [] }, amortizations: { columns: [], data: [] }, offers: { columns: [], data: [] } };
  const LIMIT = 100;
  for (let start = 0, page = 0; page < 10; page++, start += LIMIT) {
    const j = await get(`${ISS}/securities/${encodeURIComponent(secid)}/bondization.json?iss.meta=off&iss.only=coupons,amortizations,offers&limit=${LIMIT}&start=${start}`);
    let more = false;
    for (const k of ['coupons', 'amortizations', 'offers']) {
      if (!j?.[k]) continue;
      all[k].columns = j[k].columns;
      all[k].data.push(...j[k].data);
      if (j[k].data.length === LIMIT) more = true;
    }
    if (!more) break;
  }
  return parseBondization(all, today);
}

export async function loadMarket(secid: string, board?: string | null): Promise<BondMarket | null> {
  return parseMarket(await get(`${ISS}/engines/stock/markets/bonds/securities/${encodeURIComponent(secid)}.json?iss.meta=off&iss.only=securities,marketdata`), board);
}
