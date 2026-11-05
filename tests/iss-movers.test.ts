import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchIssAllStocks, pickMoversAll } from '../src/entities/moex/model/iss-stocks';

// Данные со скриншотов сайта за 26.10.2026: PREVPRICE = цена − изменение с сайта
const rows = [['UKUZ', 'Южный Кузбасс ПАО ао', 874, 960, 5e6], ['SVETP', 'Светофор Групп ап', 14.8, 15.55, 2e6], ['LPSB', 'Липецкая энергосбыт.ком.ОАО ао', 49.15, 47.5, 4e5],
  ['FESH', 'ДВ морское пароходство ПАО ао', 72.51, 71.15, 9e8], ['DEAD', 'Без сделок ПАО ао', 10, 15, 0], ['SBER', 'Сбербанк России ПАО ао', 292.32, 292.17, 5e9]] as const;

afterEach(() => vi.unstubAllGlobals());

describe('лидеры роста и падения по всем бумагам биржи (как на сайте)', () => {
  it('порядок как на сайте, бумаги без сделок не попадают, названия полные', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({
      securities: { columns: ['SECID', 'SECNAME', 'SHORTNAME', 'PREVPRICE', 'ISSUESIZE'], data: rows.map((r) => [r[0], r[1], r[0], r[2], 1e6]) },
      marketdata: { columns: ['SECID', 'LAST', 'VALTODAY'], data: rows.map((r) => [r[0], r[3], r[4]]) },
    }) }));
    const all = await fetchIssAllStocks();
    const m = pickMoversAll(all);
    expect(m.gainers.map((s) => s.secid)).toEqual(['UKUZ', 'SVETP']);
    expect(m.losers.map((s) => s.secid)).toEqual(['LPSB', 'FESH', 'SBER']);
    expect(m.gainers[0].changePercent!).toBeCloseTo(9.84, 2);
    expect(m.losers[1].changePercent!).toBeCloseTo(-1.88, 2);
    expect(all.find((s) => s.secid === 'UKUZ')!.shortname).toBe('Южный Кузбасс');
  });
  it('ошибка биржи — исключение (экран покажет лидеров среди бумаг карты)', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchIssAllStocks()).rejects.toThrow(/503/);
  });
});
