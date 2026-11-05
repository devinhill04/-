import { describe, expect, it } from 'vitest';
import { changeFor, overviewToValues, parseSnapshot, shortName, top40ToStocks } from '../src/entities/quotes/model/if-api';

// Пример из документации API котировок 1.1.0 (production-ответ от 21.10.2026)
const SBER = {
  instrumentId: 'stocks-SBER', status: 'available', reason: null,
  snapshot: { instrumentId: 'stocks-SBER', name: 'Сбербанк России ПАО ао', kind: 'equity', provider: 'moex', currency: 'RUB', unit: 'share', price: '293.22', priceAtUtc: '2026-10-21T07:33:58.000Z', effectiveDate: '2026-10-21',
    references: [{ basis: 'previous_regular_session_close', value: '293.03', tradeDate: '2026-10-20' }, { basis: 'previous_evening_session_close', value: '293.45', tradeDate: '2026-10-20' }],
    turnover: '2510481915', marketCap: '6329724892560' },
  reference: { basis: 'previous_regular_session_close', value: '293.03', tradeDate: '2026-10-20' }, change: '0.19', changePercent: '0.06484',
  freshness: { priceAgeSeconds: 913, observationAgeSeconds: 10, staleAfterSeconds: 3600 },
};
const eq = (t: string, price: string, reg: string, eve: string) => ({ ...SBER, instrumentId: 'stocks-' + t, snapshot: { ...SBER.snapshot, name: t + ' ПАО ао', price, references: [{ basis: 'previous_regular_session_close', value: reg, tradeDate: 'x' }, { basis: 'previous_evening_session_close', value: eve, tradeDate: 'x' }] } });
const ov = (id: string, kind: string, provider: string, price: string, change: string | null, pct: string | null, status = 'available') =>
  ({ instrumentId: id, status, reason: null, snapshot: status === 'unavailable' ? null : { name: id, kind, provider, currency: 'X', unit: 'x', price, priceAtUtc: '2026-10-21T08:05:03Z', effectiveDate: '2026-10-21', references: [], turnover: null, marketCap: null }, reference: null, change, changePercent: pct, freshness: { priceAgeSeconds: 1800, observationAgeSeconds: 5, staleAfterSeconds: 300 } });

describe('разбор API котировок', () => {
  it('акция из примера документации: тикер, название, оборот и капитализация из API', () => {
    const [s] = top40ToStocks(parseSnapshot({ items: [SBER] }));
    expect(s).toMatchObject({ secid: 'SBER', shortname: 'Сбербанк России', lastPrice: 293.22, tradingValue: 2510481915, marketCap: 6329724892560, priceText: '293.22' });
  });
  it('изменение акций — от вечерней сессии, как на сайте (FESH 26.10: −1,88 %, а от основной было −1,71 %)', () => {
    const [fesh, gazp] = top40ToStocks(parseSnapshot({ items: [eq('FESH', '71.15', '72.40', '72.51'), eq('GAZP', '114.00', '113.82', '114.746')] }));
    expect(fesh.changePercent!).toBeCloseTo(-1.8756, 3);
    expect(gazp.changePercent!).toBeCloseTo(-0.65, 2);
    expect(fesh.changePercentText).toBeUndefined(); // API считал по основной — его готовую строку не подставляем
  });
  it('если нужной базы нет — берём то, что посчитал API', () => {
    const one = { ...SBER, snapshot: { ...SBER.snapshot, references: SBER.snapshot.references.slice(0, 1) } };
    expect(changeFor(one as any)).toBeCloseTo(0.06484, 5);
  });
  it('котировки: 9 инструментов, строки API как есть, USDT у крипты, недоступное пропущено', () => {
    const v = overviewToValues(parseSnapshot({ items: [
      ov('currency-cb-840', 'official_fx', 'cbr', '80.5381', '-0.5874', '-0.724059'), ov('BTCUSDT', 'crypto', 'binance', '80133.97', '-20.12', '-0.025099', 'stale'),
      ov('cbr-metal-silver', 'official_metal', 'cbr', '134.2', null, null, 'unavailable'), ov('BZ=F', 'commodity_future', 'yahoo', '62.11', '0.73', '1.18'),
    ] }));
    expect(Object.keys(v).sort()).toEqual(['BRENT', 'BTC', 'USD']);
    expect(v.USD).toMatchObject({ priceText: '80.5381', changeText: '-0.5874', decimals: 4 });
    expect(v.BTC.unit).toBe('USDT');
    expect(v.BTC.source).toMatch(/устарели: 30 мин/);
    expect(v.BRENT.ticker).toBe('BZ=F · фьючерс');
  });
  it('названия: кириллица без «ПАО ао», префы различимы (\\b в JS с кириллицей не работает — проверяем)', () => {
    expect(shortName('Сургутнефтегаз ПАО ап')).toBe('Сургутнефтегаз ап');
    expect(shortName('ПАО "Артген"')).toBe('Артген');
    expect(shortName('Яндекс МКПАО ао')).toBe('Яндекс');
    expect(shortName('ПАОСтрой ао')).toBe('ПАОСтрой');
  });
  it('ответ без items — ошибка (сработает запасной источник)', () => {
    expect(() => parseSnapshot({ error: 'unauthorized' })).toThrow();
  });
});
