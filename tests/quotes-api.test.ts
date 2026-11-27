import { describe, it, expect } from 'vitest';
import { parseBondsApi, parseDividendsApi, parseKeyRateApi } from '../src/entities/calendar/model/quotes-api';
import { parseIfqShares, parseIfqPrice, parseIfqDecisions } from '../src/entities/dividends/model/dividends';

describe('Quotes API 1.2.0 — calendar JSON adapter', () => {
  it('parses bond coupon, cash amount and opaque nextCursor', () => {
    const result = parseBondsApi({
      events: [
        { date: '2026-11-25', type: 'coupon', secid: 'SU26224RMFS4', isin: 'RU000A0ZYUA9',
          name: 'ОФЗ 26224', amount: '34.41', currency: 'RUB', recordDate: '2026-11-24' },
        { date: '2026-12-01', type: 'redemption', secid: 'SU26241RMFS8', isin: 'RU000A105FZ9',
          name: 'ОФЗ 26241', amount: '1000', currency: 'SUR', recordDate: null },
      ],
      nextCursor: 'opaque',
    });
    expect(result.events[0]).toEqual({
      type: 'coupon', isin: 'RU000A0ZYUA9', name: 'ОФЗ 26224', amount: 34.41,
      payDate: '2026-11-25', recordDate: '2026-11-24',
    });
    expect(result.events[1].recordDate).toBeNull();
    expect(result.nextCursor).toBe('opaque');
  });
  it('rejects malformed JSON and avoids displaying missing money as zero', () => {
    expect(() => parseBondsApi({ events: [{}], nextCursor: null })).toThrow();
    expect(() => parseBondsApi({ events: [] })).toThrow();
  });
  it('parses meetings and separate summaries, not guessed rate changes', () => {
    const result = parseKeyRateApi({
      nextMeeting: { date: '2026-12-18', decisionTime: '13:30' },
      events: [
        { date: '2026-12-18', kind: 'meeting', title: 'Заседание Банка России по ключевой ставке' },
        { date: '2026-12-30', kind: 'summary', title: 'Резюме обсуждения ключевой ставки' },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].description).toContain('13:30');
    expect(result[1].label).toBe('Резюме обсуждения');
  });
  it('parses dividends with null amounts and independent forecast flags', () => {
    const result = parseDividendsApi({
      events: [{
        date: '2026-11-30', eventKey: 'ev1', ticker: 'CNRU', name: 'Циан', period: '3кв 2026',
        amount: null, currency: 'RUB', recordDate: '2026-11-30', buyBeforeDate: '2026-11-27',
        paymentDeadline: null, status: 'recommended',
        forecast: { amount: true, recordDate: false, buyBeforeDate: false, paymentDeadline: true },
        sourceUrl: 'https://smart-lab.ru/dividends/',
      }],
      nextCursor: null,
    });
    expect(result.events[0].amount).toBeNull();
    expect(result.events[0].forecast.amount).toBe(true);
    expect(result.events[0].forecast.paymentDeadline).toBe(true);
    expect(result.events[0].recordDate).toBe('2026-11-30');
  });
});
describe('Quotes API 1.2.0 — dividend calculator adapters', () => {
  it('parses stock catalog by case-sensitive instrument ID', () => {
    const result = parseIfqShares({ instruments: [
      { instrumentId: 'stocks-SBER', ticker: 'SBER', name: 'Сбербанк' },
      { instrumentId: 'stocks-GAZP', ticker: 'GAZP', name: 'Газпром' },
      { instrumentId: 'stocks-sber', ticker: 'lower', name: 'wrong id' },
    ] });
    expect(result.map((x) => x.secid).sort()).toEqual(['GAZP', 'SBER']);
  });
  it('parses quote date as provided (Moscow time, not UTC)', () => {
    expect(parseIfqPrice({ quotes: [{
      instrumentId: 'stocks-SBER', value: 287.5,
      priceDate: '2026-11-26T12:45:00', observedAtUtc: '2026-11-26T10:01:24',
    }] }, 'SBER')).toEqual({
      price: 287.5, changePct: null, at: '2026-11-26T12:45:00',
    });
    expect(parseIfqPrice({ quotes: [] }, 'SBER').price).toBeNull();
  });
  it('maps confirmed/recommended statuses and excludes canceled dividends', () => {
    const result = parseIfqDecisions({ events: [
      { ticker: 'SBER', status: 'confirmed', recordDate: '2026-12-01', amount: '35.4',
        currency: 'RUB', period: '2026', paymentDeadline: '2026-12-10' },
      { ticker: 'SBER', status: 'recommended', recordDate: '2026-11-30', amount: '20',
        currency: 'RUB' },
      { ticker: 'SBER', status: 'canceled', recordDate: '2026-11-29', amount: '10',
        currency: 'RUB' },
    ] });
    expect(result.map((x) => x.status)).toEqual(['approved', 'recommended']);
    expect(result[0].paymentDeadline).toBe('2026-12-10');
  });
});
