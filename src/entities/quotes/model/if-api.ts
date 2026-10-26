import { EQUITY_CHANGE_BASIS, EquityChangeBasis } from '../../../shared/config/market';
import type { MoexStock } from '../../moex/model/types';

// API котировок InvestFuture (версия 1.1.0, метод /market-snapshot). Запрос идёт через наш сервер:
// токен подставляет nginx, в браузер он не попадает. Здесь — только разбор ответа в данные приложения.

export const IFQ_OVERVIEW_URL = '/api/ifq/overview';
export const IFQ_TOP40_URL = '/api/ifq/top40';

interface Ref { basis: string; value: string; tradeDate: string }
export interface SnapshotItem {
  instrumentId: string;
  status: 'available' | 'stale' | 'unavailable';
  snapshot: null | {
    name: string; kind: string; provider: string; currency: string; unit: string;
    price: string; priceAtUtc: string; effectiveDate: string;
    references: Ref[]; turnover: string | null; marketCap: string | null;
  };
  reference: Ref | null;
  change?: string | null;
  changePercent: string | null;
  freshness: null | { priceAgeSeconds: number; observationAgeSeconds: number; staleAfterSeconds: number };
}

// Деньги и цены в API — десятичные строки. Пустое и мусорное → null, а не 0 (так требует документация).
export const num = (s: unknown): number | null => {
  if (s === null || s === undefined || s === '') return null;
  const n = typeof s === 'number' ? s : Number(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const decimalsOf = (s: string) => (String(s).split('.')[1] ?? '').length;

export function parseSnapshot(json: unknown): SnapshotItem[] {
  const items = (json as any)?.items;
  if (!Array.isArray(items)) throw new Error('ответ API без поля items');
  return items.filter((x) => x && typeof x.instrumentId === 'string');
}

// Изменение за день. Для акций — по выбранной базе (основная или вечерняя сессия), если API её прислал;
// иначе — то, что посчитал сам API по базе по умолчанию.
export function changeFor(item: SnapshotItem, basis: EquityChangeBasis = EQUITY_CHANGE_BASIS): number | null {
  const s = item.snapshot;
  const price = num(s?.price);
  if (item.reference?.basis === basis || !s || s.kind !== 'equity') return num(item.changePercent); // API посчитал по той же базе
  if (s && s.kind === 'equity' && price !== null) {
    const ref = s.references?.find((r) => r.basis === basis);
    const v = num(ref?.value);
    if (v) return ((price - v) / v) * 100;
  }
  return num(item.changePercent);
}

const usable = (i: SnapshotItem) => i.status !== 'unavailable' && !!i.snapshot && num(i.snapshot.price) !== null;

const PROVIDER: Record<string, string> = { moex: 'Мосбиржа, с задержкой', cbr: 'ЦБ РФ', binance: 'Binance', yahoo: 'Yahoo, непрерывный фьючерс' };

function sourceLabel(i: SnapshotItem): string {
  const s = i.snapshot!;
  const when = s.provider === 'cbr' ? `, значение на ${s.effectiveDate.split('-').reverse().join('.')}`
    : s.priceAtUtc ? `, цена на ${new Date(s.priceAtUtc).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '';
  const stale = i.status === 'stale' && i.freshness ? ` (данные устарели: ${Math.round(i.freshness.priceAgeSeconds / 60)} мин)` : '';
  return `API InvestFuture: ${PROVIDER[s.provider] ?? s.provider}${when}${stale}`;
}

// Блок котировок: 9 инструментов universe=overview → наши id
export const OVERVIEW_MAP: Record<string, { id: string; ticker: string }> = {
  'currency-cb-840': { id: 'USD', ticker: 'USD/RUB · ЦБ' },
  'currency-cb-978': { id: 'EUR', ticker: 'EUR/RUB · ЦБ' },
  'currency-cb-156': { id: 'CNY', ticker: 'CNY/RUB · ЦБ' },
  'indices-moex-IMOEX': { id: 'IMOEX', ticker: 'IMOEX' },
  'BZ=F': { id: 'BRENT', ticker: 'BZ=F · фьючерс' },
  'cbr-metal-gold': { id: 'GOLD', ticker: 'ЦБ · за грамм' },
  'cbr-metal-silver': { id: 'SILVER', ticker: 'ЦБ · за грамм' },
  BTCUSDT: { id: 'BTC', ticker: 'BTC/USDT' },
  ETHUSDT: { id: 'ETH', ticker: 'ETH/USDT' },
};

export interface OverviewValue { price: number; changePercent: number | null; source: string; decimals: number; ticker: string; unit?: string; priceText: string; changeText?: string; changePercentText?: string }

export function overviewToValues(items: SnapshotItem[]): Record<string, OverviewValue> {
  const out: Record<string, OverviewValue> = {};
  for (const i of items) {
    const m = OVERVIEW_MAP[i.instrumentId];
    if (!m || !usable(i)) continue;
    out[m.id] = {
      price: num(i.snapshot!.price)!,
      changePercent: changeFor(i),
      source: sourceLabel(i),
      decimals: Math.min(Math.max(decimalsOf(i.snapshot!.price), 2), 4),
      ticker: m.ticker,
      // Строки ровно как в API — экран покажет их без пересчёта (как сайт)
      priceText: i.snapshot!.price,
      changeText: i.change ?? undefined,
      changePercentText: i.changePercent ?? undefined,
      // Криптовалюта у API и на сайте — в USDT (токен Tether), это не доллар
      ...(i.snapshot!.kind === 'crypto' ? { unit: 'USDT' } : {}),
    };
  }
  return out;
}

// «ПАО», «ао» и кавычки в списках не нужны; «ап» оставляем — иначе обычную и привилегированную бумагу не различить
// Граница слова \b в JavaScript работает только с латиницей, поэтому границы — явные пробелы
export function shortName(name: string): string {
  return (' ' + name.replace(/["«»]/g, ' ') + ' ')
    .replace(/\s(?:МКПАО|ПАО|ОАО|АО|PLC|МКАО)(?=\s)/g, ' ')
    .replace(/\sао(?=\s)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function top40ToStocks(items: SnapshotItem[]): MoexStock[] {
  return items.filter(usable).map((i) => ({
    secid: i.instrumentId.replace(/^stocks-/, ''),
    shortname: shortName(i.snapshot!.name),
    lastPrice: num(i.snapshot!.price),
    changePercent: changeFor(i),
    marketCap: num(i.snapshot!.marketCap) ?? 0,
    tradingValue: num(i.snapshot!.turnover) ?? 0,
    priceText: i.snapshot!.price,
    // Готовые строки API годятся, только если он считал по той же базе, что выбрана у нас
    ...(i.reference?.basis === EQUITY_CHANGE_BASIS ? { changeText: i.change ?? undefined, changePercentText: i.changePercent ?? undefined } : {}),
  }));
}

export const countStatus = (items: SnapshotItem[]) => ({
  available: items.filter((i) => i.status === 'available').length,
  stale: items.filter((i) => i.status === 'stale').length,
  total: items.length,
});
