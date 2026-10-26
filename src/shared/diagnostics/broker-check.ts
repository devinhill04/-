import type { SnapshotItem } from '../../entities/quotes/model/if-api';
import { num } from '../../entities/quotes/model/if-api';
import { EQUITY_CHANGE_BASIS } from '../config/market';

// Сверка с брокером: последний снимок акций из API, чтобы в экране диагностики показать по каждой бумаге
// цену, ВРЕМЯ этой цены и изменение сразу по обеим базам. Сравнив с брокером в тот же момент, видно причину
// расхождения: постоянная разница — другая база процента; плавающая — задержка данных Мосбиржи.

let last: SnapshotItem[] = [];
export const setTop40Snapshot = (items: SnapshotItem[]) => { last = items; };

export interface BrokerRow {
  ticker: string;
  price: number;
  priceTimeMsk: string; // ЧЧ:ММ по Москве
  ageMin: number | null; // сколько минут цене на момент снимка
  pctRegular: number | null; // от закрытия основной сессии прошлого дня
  pctEvening: number | null; // от закрытия вечерней сессии прошлого дня
}

const pct = (price: number, ref: string | undefined) => {
  const v = num(ref);
  return v ? ((price - v) / v) * 100 : null;
};

export function brokerRows(items: SnapshotItem[] = last, n = 10): BrokerRow[] {
  return items
    .filter((i) => i.snapshot && i.snapshot.kind === 'equity' && num(i.snapshot.price) !== null)
    .sort((a, b) => (num(b.snapshot!.marketCap) ?? 0) - (num(a.snapshot!.marketCap) ?? 0))
    .slice(0, n)
    .map((i) => {
      const s = i.snapshot!;
      const price = num(s.price)!;
      const ref = (basis: string) => s.references?.find((r) => r.basis === basis)?.value;
      const t = new Date(s.priceAtUtc);
      return {
        ticker: i.instrumentId.replace(/^stocks-/, ''),
        price,
        priceTimeMsk: Number.isNaN(t.getTime()) ? '—' : t.toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' }),
        ageMin: i.freshness ? Math.round(i.freshness.priceAgeSeconds / 60) : null,
        pctRegular: pct(price, ref('previous_regular_session_close')),
        pctEvening: pct(price, ref('previous_evening_session_close')),
      };
    });
}

export const currentBasisLabel = () => (EQUITY_CHANGE_BASIS === 'previous_evening_session_close' ? 'вечерняя' : 'основная');

const f = (x: number | null) => (x === null ? '—' : `${x > 0 ? '+' : ''}${x.toFixed(2)}%`);

export function brokerReportLines(rows: BrokerRow[]): string[] {
  if (rows.length === 0) return ['нет данных (откройте вкладку «Рынок»)'];
  return [`сейчас в приложении база: ${currentBasisLabel()}`, ...rows.map((r) => `${r.ticker}: ${r.price} в ${r.priceTimeMsk} МСК${r.ageMin !== null ? ` (цене ${r.ageMin} мин)` : ''} · от основной ${f(r.pctRegular)} · от вечерней ${f(r.pctEvening)}`)];
}
export const fmtPct = f;
