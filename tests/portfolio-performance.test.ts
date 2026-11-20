import { describe, expect, it } from 'vitest';
import { calculatePerformance, computeXirr, type PerformanceOperation } from '../src/entities/portfolio/model/portfolio-performance';

const op = (kind: PerformanceOperation['kind'], date: string, quantity = 0, price = 0, fee = 0, amount = 0): PerformanceOperation => ({
  id: kind + date, kind, date, secid: 'SBER', quantity, price, fee, amount,
});
describe('калькулятор результата портфеля акций', () => {
  it('учитывает покупки и продажи с комиссиями, доход после удержаний и остаток по рыночной цене', () => {
    const result = calculatePerformance([
      op('buy', '2025-11-20', 10, 100, 10),
      op('sell', '2026-06-01', 4, 120, 2),
      op('income', '2026-07-01', 0, 0, 0, 20),
    ], [{ secid: 'SBER', price: 110, date: '2026-11-20' }], '2026-11-20');
    expect(result.purchases).toBe(1010);
    expect(result.sales).toBe(478);
    expect(result.income).toBe(20);
    expect(result.positions[0].quantity).toBe(6);
    expect(result.positions[0].avgCost).toBe(101);
    expect(result.valuation).toBe(660);
    expect(result.profit).toBe(148);
  });
  it('преобразование количества сохраняет общую себестоимость', () => {
    const result = calculatePerformance([
      op('buy', '2026-01-01', 10, 100),
      op('split', '2026-06-01', 20),
    ], [{ secid: 'SBER', price: 60, date: '2026-11-19' }], '2026-11-20');
    expect(result.positions[0].avgCost).toBe(50);
    expect(result.profit).toBe(200);
  });
  it('котировки старше семи дней не используются', () => {
    const result = calculatePerformance([op('buy', '2026-01-01', 10, 100)],
      [{ secid: 'SBER', price: 120, date: '2026-11-12' }], '2026-11-20');
    expect(result.valuation).toBeNull();
    expect(result.profit).toBeNull();
    expect(result.xirr).toBeNull();
  });
  it('продажа сверх остатка отмечается ошибкой и блокирует итог', () => {
    const result = calculatePerformance([op('buy', '2026-01-01', 2, 100), op('sell', '2026-02-01', 3, 110)],
      [{ secid: 'SBER', price: 130, date: '2026-11-20' }], '2026-11-20');
    expect(result.problems.some((p) => p.includes('продажа превышает'))).toBe(true);
    expect(result.profit).toBeNull();
  });
  it('XIRR ACT/365 — 10 процентов ровно за 365 дней', () => {
    expect(computeXirr([{ date: '2025-11-20', value: -1000 }, { date: '2026-11-20', value: 1100 }])).toBeCloseTo(0.1, 7);
  });
  it('не показывает XIRR при нескольких сменах знака денежных потоков', () => {
    expect(computeXirr([
      { date: '2025-01-01', value: -100 },
      { date: '2025-05-01', value: 150 },
      { date: '2025-08-01', value: -100 },
      { date: '2026-01-01', value: 120 },
    ])).toBeNull();
  });
});
