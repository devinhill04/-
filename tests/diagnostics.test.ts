import { describe, expect, it } from 'vitest';
import { buildReport, ago } from '../src/shared/diagnostics/report';
import { createTapCounter } from '../src/shared/diagnostics/use-secret-taps';
import { runProbe, PROBES } from '../src/shared/diagnostics/probes';
import { _resetSources, getSources, reportSource, reportSourceIfStale } from '../src/shared/diagnostics/source-status';
import { brokerReportLines, brokerRows } from '../src/shared/diagnostics/broker-check';

describe('экран диагностики', () => {
  it('скрытый жест: 7 нажатий за 4 секунды открывают, нажатия раз в секунду — никогда', () => {
    let opened = 0, t = 0;
    const tap = createTapCounter(7, 4000, () => opened++, () => t);
    for (let i = 0; i < 7; i++) { t += 500; tap(); }
    expect(opened).toBe(1);
    const slow = createTapCounter(7, 4000, () => opened++, () => t);
    for (let i = 0; i < 12; i++) { t += 1000; slow(); }
    expect(opened).toBe(1);
  });
  it('журнал источников: точная запись в текущем цикле не затирается общей', () => {
    _resetSources();
    reportSource('site', true, 'цен разобрано: 6 из 6', 2000);
    reportSourceIfStale('site', true, undefined, 1900);
    expect(getSources()[0].detail).toBe('цен разобрано: 6 из 6');
  });
  it('проверка связи: код, разбор, таймаут', async () => {
    const api = PROBES.find((p) => p.id === 'ifq-overview')!;
    const ok = await runProbe(api, (async () => ({ ok: true, status: 200, text: async () => '{"items":[{"status":"available"},{"status":"stale"}]}' })) as any);
    expect(ok.note).toBe('доступно: 1, устарело: 1, всего: 2');
    const hang = ((_u: string, init: any) => new Promise((_r, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('x'), { name: 'AbortError' }))))) as any;
    const r = await runProbe(api, hang, 200);
    expect(r.ok).toBe(false);
    expect(r.note).toMatch(/нет ответа/);
  });
  it('отчёт без личных данных, с давностью', () => {
    const rep = buildReport({ buildTime: '2026-11-05T09:00:00Z', commit: '', now: Date.UTC(2026, 10, 5, 9, 5), env: {}, flags: { календари: false }, sources: [{ name: 'news', ok: false, at: Date.UTC(2026, 10, 5, 9, 3), detail: 'HTTP 504' }], probes: [] });
    expect(rep).toMatch(/✗ news — HTTP 504 \(2 мин назад\)/);
    expect(rep).not.toMatch(/initData|username/);
    expect(ago(30_000)).toBe('30 с назад');
  });
  it('сверка с брокером: обе базы и время цены по Москве', () => {
    const rows = brokerRows([{ instrumentId: 'stocks-SBER', status: 'available', snapshot: { kind: 'equity', price: '293.22', priceAtUtc: '2026-10-21T07:33:58Z', marketCap: '1', references: [{ basis: 'previous_regular_session_close', value: '293.03' }, { basis: 'previous_evening_session_close', value: '293.45' }] }, freshness: { priceAgeSeconds: 913 } } as any]);
    expect(rows[0]).toMatchObject({ ticker: 'SBER', priceTimeMsk: '10:33', ageMin: 15 });
    expect(brokerReportLines(rows)[1]).toBe('SBER: 293.22 в 10:33 МСК (цене 15 мин) · от основной +0.06% · от вечерней -0.08%');
  });
});
