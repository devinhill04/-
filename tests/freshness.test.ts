import { describe, expect, it } from 'vitest';
import { freshnessLabel, latestPriceAt } from '../src/shared/lib/freshness';

describe('подпись свежести данных Мосбиржи', () => {
  it('берётся самая свежая цена, недоступные игнорируются', () => {
    expect(latestPriceAt([
      { status: 'available', snapshot: { priceAtUtc: '2026-11-05T11:20:00Z' } },
      { status: 'available', snapshot: { priceAtUtc: '2026-11-05T11:35:00Z' } },
      { status: 'unavailable', snapshot: { priceAtUtc: '2026-11-05T12:00:00Z' } },
      { status: 'available', snapshot: null },
    ])).toBe('2026-11-05T11:35:00.000Z');
    expect(latestPriceAt([])).toBeNull();
  });
  it('торговый день: время цены по Москве и пометка о задержке', () => {
    expect(freshnessLabel({ source: 'api', dataAtUtc: '2026-11-05T11:35:00Z' }, new Date('2026-11-05T11:52:00Z'))).toBe('Данные Мосбиржи на 14:35 МСК, с задержкой');
  });
  it('выходные или ночь: видна дата, старые цены не выдаются за текущие', () => {
    expect(freshnessLabel({ source: 'api', dataAtUtc: '2026-10-30T20:49:00Z' }, new Date('2026-10-31T10:00:00Z'))).toBe('Последние данные Мосбиржи: 30.10, 23:49 МСК');
  });
  it('граница суток по Москве, а не по устройству: 23:30 МСК 05.11 и 00:10 МСК 06.11 — разные дни', () => {
    expect(freshnessLabel({ source: 'api', dataAtUtc: '2026-11-05T20:30:00Z' }, new Date('2026-11-05T21:10:00Z'))).toBe('Последние данные Мосбиржи: 05.11, 23:30 МСК');
  });
  it('запасной источник и пустые данные', () => {
    expect(freshnessLabel({ source: 'iss', dataAtUtc: null })).toBe('Данные Мосбиржи с задержкой около 15 минут');
    expect(freshnessLabel(null)).toBeNull();
  });
});
