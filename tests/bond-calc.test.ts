import { describe, expect, it } from 'vitest';
import { calcBond } from '../src/entities/bonds/model/bond-calc';

const base = { nominal: 1000, pricePct: 95, accrued: 20, qty: 1, commission: 5, calcDate: '2026-11-12' };

describe('калькулятор облигаций — метод сайта', () => {
  it('пример со страницы сайта: 95% → 950 ₽, + НКД 20 и комиссия 5 = 975; купоны 160, номинал 1000, разница 185', () => {
    const r = calcBond({ ...base, events: [
      { type: 'coupon', date: '2027-05-12', recordDate: '2027-05-11', amount: 80 },
      { type: 'coupon', date: '2027-11-12', recordDate: '2027-11-11', amount: 80 },
      { type: 'redemption', date: '2027-11-12', amount: 1000 },
    ] });
    expect(r).toMatchObject({ pricePerBond: 950, costPerBond: 970, costs: 975, coupons: 160, principal: 1000, payments: 1160, difference: 185, complete: true });
    expect(r.differencePct).toBeCloseTo(18.97, 2);
  });
  it('количество умножает всё, кроме комиссии', () => {
    const r = calcBond({ ...base, qty: 10, events: [{ type: 'coupon', date: '2027-05-12', recordDate: '2027-05-11', amount: 80 }, { type: 'redemption', date: '2027-05-12', amount: 1000 }] });
    expect(r.costs).toBe(9705); // 10 × 970 + 5
    expect(r.payments).toBe(10800);
    expect(r.difference).toBe(1095);
  });
  it('купон с наступившей датой фиксации не учитывается, даже если выплата ещё впереди', () => {
    const r = calcBond({ ...base, events: [
      { type: 'coupon', date: '2026-11-14', recordDate: '2026-11-12', amount: 80 }, // фиксация = дата расчёта — уже наступила
      { type: 'coupon', date: '2027-05-12', recordDate: '2027-05-11', amount: 80 },
      { type: 'redemption', date: '2027-05-12', amount: 1000 },
    ] });
    expect(r.coupons).toBe(80);
    expect(r.rows.map((x) => x.date)).toEqual(['2027-05-12', '2027-05-12']);
  });
  it('амортизация: цена от уменьшенного номинала, остаток после каждой выплаты, купоны из графика', () => {
    const r = calcBond({ nominal: 500, pricePct: 100, accrued: 0, qty: 1, commission: 0, calcDate: '2026-11-12', events: [
      { type: 'coupon', date: '2027-02-01', recordDate: '2027-01-31', amount: 20 },
      { type: 'amortization', date: '2027-02-01', amount: 250 },
      { type: 'coupon', date: '2027-05-01', recordDate: '2027-04-30', amount: 10 },
      { type: 'redemption', date: '2027-05-01', amount: 250 },
    ] });
    expect(r.pricePerBond).toBe(500);
    expect(r.rows.filter((x) => x.type !== 'coupon').map((x) => x.nominalLeft)).toEqual([250, 0]);
    expect(r).toMatchObject({ coupons: 30, principal: 500, difference: 30, complete: true });
  });
  it('неизвестный купон, неполный график и оферта — без итога, но с объяснением; события показываются', () => {
    const floating = calcBond({ ...base, events: [{ type: 'coupon', date: '2027-05-12', recordDate: '2027-05-11', amount: null }, { type: 'redemption', date: '2027-05-12', amount: 1000 }] });
    expect(floating).toMatchObject({ complete: false, difference: null, coupons: null });
    expect(floating.reasons[0]).toMatch(/не объявлены/);
    expect(floating.rows).toHaveLength(2);
    const partial = calcBond({ ...base, events: [{ type: 'amortization', date: '2027-05-12', amount: 500 }] });
    expect(partial.reasons[0]).toMatch(/неполон/);
    const offer = calcBond({ ...base, offerDate: '2027-03-01', events: [{ type: 'redemption', date: '2028-05-12', amount: 1000 }] });
    expect(offer.reasons[0]).toMatch(/оферта 01\.03\.2027/);
    expect(offer.difference).toBeNull();
  });
  it('погашение без суммы — возвращается остаток номинала', () => {
    const r = calcBond({ ...base, events: [{ type: 'redemption', date: '2027-05-12', amount: null }] });
    expect(r.principal).toBe(1000);
    expect(r.complete).toBe(true);
  });
});

describe('сверка со скриншотом сайта (ОФЗ 26207, расчёт на 13.11.2026)', () => {
  const events = [
    { type: 'coupon' as const, date: '2027-02-03', recordDate: '2027-02-02', amount: 40.64 },
    { type: 'redemption' as const, date: '2027-02-03', amount: 1000 },
  ];
  it('заплатить 1 012,32; купоны 40,64; номинал 1 000; разница 28,32; доходность за срок 2,8%', () => {
    const r = calcBond({ nominal: 1000, pricePct: 98.932, accrued: 23, qty: 1, commission: 0, calcDate: '2026-11-13', events });
    expect(r).toMatchObject({ pricePerBond: 989.32, costs: 1012.32, coupons: 40.64, principal: 1000, difference: 28.32, complete: true });
    expect(r.differencePct!.toLocaleString('ru-RU', { maximumFractionDigits: 1 })).toBe('2,8');
    expect(r.rows.map((x) => [x.date, x.type, x.amount, x.nominalLeft])).toEqual([['2027-02-03', 'coupon', 40.64, null], ['2027-02-03', 'redemption', 1000, 0]]);
  });
  it('шаг 2: тип выпуска, ближайший купон, число будущих событий', async () => {
    const { bondTypeLabel, nearestCoupon } = await import('../src/entities/bonds/model/bond-calc');
    expect(bondTypeLabel(events, '2026-11-13')).toBe('Облигация с фиксированным (известным) купоном');
    expect(nearestCoupon(events, '2026-11-13')).toMatchObject({ amount: 40.64, date: '2027-02-03' });
    expect(bondTypeLabel([{ type: 'coupon', date: '2027-01-01', amount: null }], '2026-11-13')).toBe('Облигация с переменным (неизвестным) купоном');
    expect(bondTypeLabel([{ type: 'amortization', date: '2027-01-01', amount: 500 }, { type: 'redemption', date: '2028-01-01', amount: 500 }], '2026-11-13')).toBe('Облигация без купона (дисконтная), с амортизацией');
  });
});
