import { describe, expect, it } from 'vitest';
import { calcPortfolio } from '../src/entities/portfolio/model/portfolio-income';

const T = '2026-11-13';
describe('выплаты портфеля — методология сайта', () => {
  it('как на скриншоте сайта: АФК Система с реестром 2017 года — «Дата реестра 13.07.2017 раньше указанной даты владения 13.11.2026»', () => {
    const r = calcPortfolio([{ kind: 'share', id: 'AFKS', name: 'АФК Система', qty: 7, decisions: [{ recordDate: '2017-07-13', amount: 0.81, currency: 'RUB' }] }], T, T);
    expect(r.rows).toEqual([]);
    expect(r.excluded[0].reason).toBe('Дата реестра 13.07.2017 раньше указанной даты владения 13.11.2026. Эта выплата не входит в расчёт.');
    expect([r.periodFrom, r.periodTo]).toEqual(['2026-11-13', '2027-11-13']);
  });
  it('дивиденд со сроком выплаты в периоде — в календарь по сроку; без срока — в исключённые; рекомендация не входит в доход', () => {
    const r = calcPortfolio([
      { kind: 'share', id: 'SBER', name: 'Сбербанк', qty: 100, decisions: [{ recordDate: '2027-07-20', amount: 37.64, currency: 'RUB', status: 'approved', paymentDeadline: '2027-07-30' }] },
      { kind: 'share', id: 'LKOH', name: 'ЛУКОЙЛ', qty: 2, decisions: [{ recordDate: '2027-01-12', amount: 397, currency: 'RUB' }] },
      { kind: 'share', id: 'GAZP', name: 'Газпром', qty: 10, decisions: [{ recordDate: '2027-07-17', amount: 20, currency: 'RUB', status: 'recommended', paymentDeadline: '2027-07-30' }] },
    ], T, T);
    expect(r.rows).toEqual([{ date: '2027-07-30', id: 'SBER', name: 'Сбербанк', kind: 'dividend', perUnit: 37.64, total: 3764 }]);
    expect(r.income).toBe(3764);
    expect(r.excluded.find((e) => e.id === 'LKOH')!.reason).toMatch(/Срок выплаты .* не опубликован/);
  });
  it('облигация: купоны с правом по дате фиксации, погашение — отдельно от дохода, оферта отсекает выплаты с её даты', () => {
    const r = calcPortfolio([
      { kind: 'bond', id: 'SU26207RMFS9', name: 'ОФЗ 26207', qty: 10, currency: 'RUB', events: [
        { type: 'coupon', date: '2026-11-20', recordDate: '2026-11-12', amount: 40 }, // фиксация до даты владения — нет права
        { type: 'coupon', date: '2027-02-03', recordDate: '2027-02-02', amount: 40.64 },
        { type: 'redemption', date: '2027-02-03', amount: 1000 },
        { type: 'coupon', date: '2028-02-03', recordDate: '2028-02-02', amount: 40.64 }, // за пределами 12 месяцев
      ] },
      { kind: 'bond', id: 'X', name: 'Офертная', qty: 1, currency: 'RUB', offerDate: '2027-03-01', events: [
        { type: 'coupon', date: '2027-01-10', recordDate: '2027-01-09', amount: 20 }, { type: 'coupon', date: '2027-04-10', recordDate: '2027-04-09', amount: 20 }] },
    ], T, T);
    expect(r.rows.map((x) => [x.date, x.id, x.kind, x.total])).toEqual([['2027-01-10', 'X', 'coupon', 20], ['2027-02-03', 'SU26207RMFS9', 'coupon', 406.4], ['2027-02-03', 'SU26207RMFS9', 'redemption', 10000]]);
    expect(r.income).toBe(426.4);
    expect(r.principal).toBe(10000);
    expect(r.excluded.find((e) => e.id === 'X')!.reason).toMatch(/оферта 01\.03\.2027/);
  });
  it('купон без даты фиксации исключается; валютная облигация не входит', () => {
    const r = calcPortfolio([
      { kind: 'bond', id: 'A', name: 'A', qty: 1, currency: 'RUB', events: [{ type: 'coupon', date: '2027-01-10', recordDate: null, amount: 10 }] },
      { kind: 'bond', id: 'B', name: 'B', qty: 1, currency: 'USD', events: [{ type: 'coupon', date: '2027-01-10', recordDate: '2027-01-09', amount: 10 }] },
    ], T, T);
    expect(r.rows).toEqual([]);
    expect(r.excluded.map((e) => e.reason.slice(0, 24))).toEqual(['Купоны без известной дат', 'Номинал в USD: в расчёт ']);
  });
});

describe('поиск бумаги для позиции', () => {
  it('только акции и облигации, с видом бумаги', async () => {
    const { parseSecurities } = await import('../src/entities/portfolio/model/portfolio-income');
    expect(parseSecurities({ securities: { columns: ['secid', 'shortname', 'isin', 'group', 'primary_boardid'], data: [
      ['SBER', 'Сбербанк', 'RU0009029540', 'stock_shares', 'TQBR'], ['SU26207RMFS9', 'ОФЗ 26207', 'RU000A0JS3W6', 'stock_bonds', 'TQOB'], ['SBERF', 'Фьючерс', 'X', 'futures_forts', null]] } }).map((s) => [s.secid, s.kind])).toEqual([['SBER', 'share'], ['SU26207RMFS9', 'bond']]);
  });
});
