import type { BondEvent } from '../../bonds/model/bond-calc';
import type { Decision } from '../../dividends/model/dividends';

// Выплаты портфеля на 12 месяцев — по методологии сайта (investfuture.ru/tools/portfolio-income):
// - период: от сегодняшней даты на 12 месяцев, конечная дата не включена;
// - дивиденд: утверждённый, рублёвый, с известными суммой, датой реестра и сроком выплаты; право — если дата владения
//   не позже даты реестра; в календарь — по сроку выплаты. Без срока — среди исключённых;
// - купон: с известной суммой и датой фиксации владельцев (без неё — исключается), право — если владение не позже фиксации;
// - амортизация и погашение: владение до даты выплаты; при будущей оферте выплаты начиная с её даты не включаются;
// - доход = только дивиденды и купоны; возврат номинала — отдельно; всё до налогов, округлено до копеек.

export type PaymentKind = 'dividend' | 'coupon' | 'amortization' | 'redemption';
export interface Position {
  kind: 'share' | 'bond';
  id: string; // SECID
  name: string;
  qty: number;
  decisions?: Decision[]; // для акций
  events?: BondEvent[]; // для облигаций
  offerDate?: string | null;
  currency?: string;
}
export interface PaymentRow { date: string; id: string; name: string; kind: PaymentKind; perUnit: number; total: number }
export interface PortfolioResult {
  periodFrom: string; periodTo: string; ownFrom: string;
  rows: PaymentRow[];
  income: number; // дивиденды + купоны
  principal: number; // возврат номинала
  excluded: { id: string; name: string; reason: string }[];
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const dmy = (iso: string) => iso.split('-').reverse().join('.');
const money = (x: number) => `${x.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
export const addYear = (iso: string) => `${Number(iso.slice(0, 4)) + 1}${iso.slice(4)}`;

export function calcPortfolio(positions: Position[], ownFrom: string, today: string): PortfolioResult {
  const from = today, to = addYear(today);
  const inPeriod = (d: string) => d >= from && d < to;
  const rows: PaymentRow[] = [];
  const excluded: PortfolioResult['excluded'] = [];

  for (const p of positions) {
    const before = rows.length;
    const reasons: string[] = [];
    if (p.kind === 'share') {
      const list = (p.decisions ?? []).filter((d) => d.currency === 'RUB');
      if (list.length === 0) reasons.push('Опубликованных рублёвых дивидендных решений с известной суммой нет.');
      for (const d of list) {
        if (d.status && d.status !== 'approved') continue; // рекомендации — отдельно, в доход не входят
        if (ownFrom > d.recordDate) continue;
        if (!d.paymentDeadline) { reasons.push(`Срок выплаты по решению ${money(d.amount)} на акцию (реестр ${dmy(d.recordDate)}) не опубликован в доступных данных. Такое решение не распределяется по месяцам и не входит в сумму.`); continue; }
        if (!inPeriod(d.paymentDeadline)) continue;
        rows.push({ date: d.paymentDeadline, id: p.id, name: p.name, kind: 'dividend', perUnit: d.amount, total: r2(d.amount * p.qty) });
      }
      if (rows.length === before && reasons.length === 0) {
        const last = [...list].sort((a, b) => (a.recordDate < b.recordDate ? 1 : -1))[0];
        if (last && ownFrom > last.recordDate) reasons.push(`Дата реестра ${dmy(last.recordDate)} раньше указанной даты владения ${dmy(ownFrom)}. Эта выплата не входит в расчёт.`);
        else reasons.push('Подходящих выплат на ближайшие 12 месяцев в данных нет.');
      }
    } else {
      if (p.currency && p.currency !== 'RUB') reasons.push(`Номинал в ${p.currency}: в расчёт входят только рублёвые выплаты.`);
      else {
        let noRecord = 0, afterOffer = 0, unknown = 0;
        for (const e of p.events ?? []) {
          if (!inPeriod(e.date)) continue;
          if (p.offerDate && e.date >= p.offerDate) { afterOffer++; continue; }
          if (e.type === 'coupon') {
            if (!e.recordDate) { noRecord++; continue; }
            if (ownFrom > e.recordDate) continue;
            if (e.amount === null) { unknown++; continue; }
          } else if (ownFrom > e.date) continue;
          if (e.amount === null) { unknown++; continue; }
          rows.push({ date: e.date, id: p.id, name: p.name, kind: e.type, perUnit: e.amount, total: r2(e.amount * p.qty) });
        }
        if (afterOffer) reasons.push(`Будущая оферта ${dmy(p.offerDate!)}: выплаты начиная с её даты не включены.`);
        if (noRecord) reasons.push('Купоны без известной даты фиксации владельцев исключены.');
        if (unknown) reasons.push('Суммы части будущих купонов ещё не объявлены — они не учитываются.');
        if (rows.length === before && reasons.length === 0) reasons.push('Подходящих выплат на ближайшие 12 месяцев в графике нет.');
      }
    }
    for (const reason of reasons) excluded.push({ id: p.id, name: p.name, reason });
  }
  rows.sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name, 'ru') : a.date < b.date ? -1 : 1));
  const income = r2(rows.filter((r) => r.kind === 'dividend' || r.kind === 'coupon').reduce((a, r) => a + r.total, 0));
  const principal = r2(rows.filter((r) => r.kind === 'amortization' || r.kind === 'redemption').reduce((a, r) => a + r.total, 0));
  return { periodFrom: from, periodTo: to, ownFrom, rows, income, principal, excluded };
}

// Поиск бумаги для позиции: акции и облигации Мосбиржи
export interface Security { secid: string; isin: string; name: string; kind: 'share' | 'bond'; board: string | null }
export function parseSecurities(json: any): Security[] {
  const b = json?.securities;
  if (!b?.columns || !b.data) return [];
  return b.data
    .map((r: unknown[]) => Object.fromEntries(b.columns.map((c: string, i: number) => [c.toLowerCase(), r[i]])))
    .filter((r: any) => r.secid && (r.group === 'stock_shares' || r.group === 'stock_bonds'))
    .map((r: any) => ({ secid: String(r.secid), isin: String(r.isin ?? r.secid), name: String(r.shortname ?? r.secid), kind: r.group === 'stock_bonds' ? 'bond' : 'share', board: r.primary_boardid ? String(r.primary_boardid) : null }));
}
export async function searchSecurities(q: string): Promise<Security[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const r = await fetch(`https://iss.moex.com/iss/securities.json?q=${encodeURIComponent(query)}&is_trading=1&limit=30&iss.meta=off`);
  if (!r.ok) throw new Error(`Мосбиржа ответила ${r.status}`);
  return parseSecurities(await r.json()).slice(0, 12);
}
