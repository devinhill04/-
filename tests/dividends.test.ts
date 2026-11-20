import { describe, expect, it } from 'vitest';
import { calcDividends, decisionLabel, defaultDecision, parseDecisions, parsePrice, parseShares, searchShares } from '../src/entities/dividends/model/dividends';

describe('калькулятор дивидендов', () => {
  it('сверка со скриншотом сайта: 100 акций SBER × 37,64 ₽ = 3 764,00 ₽', () => {
    expect(calcDividends(37.64, 100)).toBe(3764);
    expect(calcDividends(0.0365, 7)).toBe(0.26); // округление для всей позиции, а не на акцию
  });
  it('строка решения как на сайте; без данных API — без года, статуса и срока', () => {
    expect(decisionLabel({ recordDate: '2026-07-20', amount: 37.64, currency: 'RUB', period: '2025 год', status: 'approved' }).replace(/\u00a0/g, ' ')).toBe('2025 год · 37,64 ₽ · реестр 20.07.2026 · Утверждён');
    expect(decisionLabel({ recordDate: '2026-07-20', amount: 37.64, currency: 'RUB' }).replace(/\u00a0/g, ' ')).toBe('37,64 ₽ · реестр 20.07.2026');
  });
  it('решения с биржи: только с суммой, новые сверху; по умолчанию — ближайший будущий реестр', () => {
    const list = parseDecisions({ dividends: { columns: ['secid', 'isin', 'registryclosedate', 'value', 'currencyid'], data: [
      ['SBER', 'RU', '2024-07-11', 33.3, 'RUB'], ['SBER', 'RU', '2026-07-20', 37.64, 'RUB'], ['SBER', 'RU', '2025-07-18', 34.84, 'RUB'], ['SBER', 'RU', '2023-05-11', null, 'RUB']] } });
    expect(list.map((d) => d.recordDate)).toEqual(['2026-07-20', '2025-07-18', '2024-07-11']);
    expect(defaultDecision(list, '2026-11-13')!.recordDate).toBe('2026-07-20'); // будущих нет — последнее
    expect(defaultDecision(list, '2025-01-01')!.recordDate).toBe('2025-07-18'); // ближайшее будущее
  });
  it('цена: последняя сделка, изменение к предыдущему закрытию, время котировки', () => {
    const p = parsePrice({ securities: { columns: ['SECID', 'PREVPRICE'], data: [['SBER', 298.59]] }, marketdata: { columns: ['SECID', 'LAST', 'LASTTOPREVPRICE', 'TIME', 'TRADEDATE'], data: [['SBER', 300.5, 0.64, '09:44:31', '2026-11-13']] } });
    expect(p).toEqual({ price: 300.5, changePct: 0.64, at: '2026-11-13T09:44' });
  });
  it('список акций: краткие названия, без повторов, по алфавиту', () => {
    expect(parseShares({ securities: { columns: ['SECID', 'SHORTNAME'], data: [['SBER', 'Сбербанк'], ['AFLT', 'Аэрофлот'], ['SBER', 'Сбербанк']] } })).toEqual([{ secid: 'AFLT', name: 'Аэрофлот' }, { secid: 'SBER', name: 'Сбербанк' }]);
  });
  it('поиск по тикеру, началу слов, частям слова и нескольким словам', () => {
    const list = [
      { secid: 'SBER', name: 'Сбербанк' },
      { secid: 'SBERP', name: 'Сбербанк-п' },
      { secid: 'GAZP', name: 'Газпром' },
      { secid: 'AFLT', name: 'Аэрофлот' },
      { secid: 'XYZ', name: 'Большая Компания' },
    ];
    expect(searchShares(list, 'SBER').map((s) => s.secid)).toEqual(['SBER', 'SBERP']);
    expect(searchShares(list, 'сб').map((s) => s.secid)).toEqual(['SBER', 'SBERP']);
    expect(searchShares(list, 'газ').map((s) => s.secid)).toEqual(['GAZP']);
    expect(searchShares(list, 'сбер п').map((s) => s.secid)).toEqual(['SBERP']);
    expect(searchShares(list, 'пания').map((s) => s.secid)).toEqual(['XYZ']);
    expect(searchShares(list, '  ').length).toBe(0);
  });
  it('поиск игнорирует регистр и ё, сортирует точные тикеры первыми и ограничивает подсказки', () => {
    const list = [
      { secid: 'ABCP', name: 'Ёлочная корпорация' },
      { secid: 'ELKA', name: 'Елочная фабрика' },
      { secid: 'ABC', name: 'Компания ABC' },
      { secid: 'ABCX', name: 'ABC сервис' },
    ];
    expect(searchShares(list, 'ЕЛОЧНАЯ').map((s) => s.secid)).toEqual(['ABCP', 'ELKA']);
    expect(searchShares(list, 'abc').map((s) => s.secid)).toEqual(['ABC', 'ABCX']);
    expect(searchShares(list, 'abc', 1).map((s) => s.secid)).toEqual(['ABC']);
  });

});
