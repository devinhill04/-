import { describe, expect, it } from 'vitest';
import { fmtDecimal, fmtPct } from '../src/shared/lib/exact-format';

const N = (s: string | null) => (s ?? 'null').replace(/\u00a0/g, ' ');

describe('точное форматирование чисел (как на сайте)', () => {
  it.each([
    ['19214', '19 214,00'], ['7.775', '7,775'], ['0.144', '0,144'], ['-0.10', '-0,10'], ['80133.97', '80 133,97'],
    ['-20.12', '-20,12'], ['80.5381', '80,5381'], ['0.00', '0,00'], ['-0.00', '0,00'], ['6329724892560', '6 329 724 892 560,00'],
  ])('цена/изменение %s → %s', (input, out) => expect(N(fmtDecimal(input))).toBe(out));

  it.each([
    ['1.7', '+1,7'], ['0', '0'], ['0.06484', '+0,06'], ['-0.025099', '-0,03'], ['0.125', '+0,13'], ['1.005', '+1,01'],
    ['-0.005', '-0,01'], ['99.995', '+100'], ['2.994999', '+2,99'], ['0.004', '0'], ['-0.004', '0'],
  ])('процент %s → %s', (input, out) => expect(N(fmtPct(input, { sign: true }))).toBe(out));

  it('округление честное, без двоичной погрешности (toFixed даёт 1,00)', () => {
    expect((1.005).toFixed(2)).toBe('1.00');
    expect(fmtPct('1.005')).toBe('1,01');
  });
  it('числа из запасных источников — кратчайшая запись', () => {
    expect(N(fmtDecimal(293.2))).toBe('293,20');
    expect(N(fmtDecimal(1e-7))).toBe('0,0000001');
    expect(fmtPct(4.2399999)).toBe('4,24');
  });
  it('без знака и мусор', () => {
    expect(fmtPct('-3.10', { abs: true })).toBe('3,1');
    expect(fmtDecimal('abc')).toBeNull();
    expect(fmtPct('')).toBeNull();
    expect(fmtDecimal(null)).toBeNull();
    expect(fmtPct(NaN)).toBeNull();
  });
});
