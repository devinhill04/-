import { describe, expect, it } from 'vitest';
import { parseBondization, parseMarket, parseSearch } from '../src/entities/bonds/model/iss-bonds';
import { calcBond } from '../src/entities/bonds/model/bond-calc';

// Ответы в формате ISS Мосбиржи (столбцы как в API; порядок столбцов нарочно перемешан)
const SEARCH = { securities: { columns: ['shortname', 'secid', 'isin', 'name', 'emitent_title', 'group', 'primary_boardid'], data: [
  ['ОФЗ 26238', 'SU26238RMFS4', 'SU26238RMFS4', 'ОФЗ-ПД 26238', 'Минфин России', 'stock_bonds', 'TQOB'],
  ['Сбербанк', 'SBER', 'RU0009029540', 'Сбербанк', 'Сбербанк', 'stock_shares', 'TQBR'],
] } };
const BONDIZATION = {
  coupons: { columns: ['isin', 'coupondate', 'recorddate', 'value', 'value_rub', 'valueprc', 'facevalue'], data: [
    ['X', '2026-06-01', '2026-05-29', 35.4, 35.4, 7.1, 1000], ['X', '2027-06-01', '2027-05-31', 35.4, 35.4, 7.1, 1000], ['X', '2027-12-01', '2027-11-30', null, null, null, 1000],
  ] },
  amortizations: { columns: ['amortdate', 'value', 'value_rub', 'data_source', 'facevalue'], data: [['2027-12-01', 1000, 1000, 'maturity', 1000]] },
  offers: { columns: ['offerdate', 'offertype'], data: [['2025-01-01', 'past'], ['2027-03-01', 'put']] },
};
const MARKET = {
  securities: { columns: ['SECID', 'BOARDID', 'SHORTNAME', 'ISIN', 'FACEVALUE', 'ACCRUEDINT', 'PREVPRICE', 'FACEUNIT', 'MATDATE', 'OFFERDATE'], data: [
    ['SU26238RMFS4', 'PSOB', 'ОФЗ 26238', 'SU26238RMFS4', 1000, 12.5, null, 'SUR', '2041-05-15', '0000-00-00'],
    ['SU26238RMFS4', 'TQOB', 'ОФЗ 26238', 'SU26238RMFS4', 1000, 12.5, 61.2, 'SUR', '2041-05-15', '0000-00-00'],
  ] },
  marketdata: { columns: ['BOARDID', 'SECID', 'LAST', 'LCURRENTPRICE'], data: [['PSOB', 'SU26238RMFS4', null, null], ['TQOB', 'SU26238RMFS4', 61.45, 61.4]] },
};

describe('данные облигаций с Мосбиржи', () => {
  it('поиск: только облигации, с ISIN и режимом торгов', () => {
    expect(parseSearch(SEARCH)).toEqual([{ secid: 'SU26238RMFS4', isin: 'SU26238RMFS4', shortname: 'ОФЗ 26238', name: 'ОФЗ-ПД 26238', emitent: 'Минфин России', board: 'TQOB' }]);
  });
  it('график: купоны с датой фиксации, неизвестный купон = null, погашение, ближайшая будущая оферта', () => {
    const s = parseBondization(BONDIZATION, '2026-11-12');
    expect(s.events.filter((e) => e.type === 'coupon').map((e) => e.amount)).toEqual([35.4, 35.4, null]);
    expect(s.events.find((e) => e.type === 'redemption')).toMatchObject({ date: '2027-12-01', amount: 1000 });
    expect(s.offerDate).toBe('2027-03-01');
  });
  it('рыночные данные: режим с ценой, НКД, номинал, рубли; «0000-00-00» — не дата', () => {
    expect(parseMarket(MARKET)).toMatchObject({ pricePct: 61.45, accrued: 12.5, nominal: 1000, currency: 'RUB', offerDate: null, matDate: '2041-05-15' });
    expect(parseMarket(MARKET, 'TQOB')!.pricePct).toBe(61.45);
    expect(parseMarket({ securities: { columns: ['SECID'], data: [] } })).toBeNull();
  });
  it('сквозной расчёт по данным Мосбиржи: прошлый купон отброшен, неизвестный и оферта — без итога', () => {
    const s = parseBondization(BONDIZATION, '2026-11-12');
    const m = parseMarket(MARKET)!;
    const r = calcBond({ nominal: m.nominal, pricePct: m.pricePct!, accrued: m.accrued, qty: 2, commission: 0, calcDate: '2026-11-12', events: s.events, offerDate: s.offerDate });
    expect(r.costs).toBe(1254); // 2 × (614,50 + 12,50) = 2 × 627
    expect(r.rows.map((x) => x.date)).toEqual(['2027-06-01', '2027-12-01', '2027-12-01']);
    expect(r.complete).toBe(false);
    expect(r.reasons.length).toBe(2); // неизвестный купон + оферта
  });
});
