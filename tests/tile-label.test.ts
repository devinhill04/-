import { describe, expect, it } from 'vitest';
import { textWidthEm, tileLabelSizes } from '../src/widgets/moex-heatmap/tile-label';

// Ширины символов Manrope 600, замеренные в браузере (без запаса)
const W: Record<string, number> = { A: .658, B: .625, C: .73, D: .69, E: .58, F: .516, G: .723, H: .709, I: .264, J: .488, K: .629, L: .525, M: .85, N: .706, O: .74, P: .627, Q: .74, R: .65, S: .643, T: .603, U: .714, V: .628, W: .962, X: .639, Y: .593, Z: .647 };
const real = (t: string) => [...t].reduce((a, c) => a + (W[c] ?? 0.6), 0);
const TICKERS = ['T', 'SBER', 'GAZP', 'MGNT', 'MTSS', 'CBOM', 'TRNFP', 'SNGSP', 'WUSH', 'X5'];

describe('подписи на плитках тепловой карты', () => {
  it('SBER 100×105: 26/20 px вместо прежних 12/10', () => {
    expect(tileLabelSizes(100, 105, 'SBER', '+4,24%')).toEqual({ tickerPx: 26, percentPx: 20 });
  });
  it('тикер помещается по реальной ширине Manrope на плитках от 40 px (CBOM не обрезается)', () => {
    for (let w = 40; w <= 220; w += 5) for (const t of TICKERS) expect(real(t) * tileLabelSizes(w, 120, t, '+10,25%').tickerPx).toBeLessThanOrEqual(w - 6);
  });
  it('правила: потолок 26, минимум 7, процент не крупнее тикера, узкая плитка — без процента', () => {
    for (let w = 20; w <= 220; w += 13) for (let h = 20; h <= 220; h += 17) for (const t of TICKERS) {
      const r = tileLabelSizes(w, h, t, '-15,80%');
      expect(r.tickerPx).toBeGreaterThanOrEqual(7);
      expect(r.tickerPx).toBeLessThanOrEqual(26);
      if (r.percentPx !== null) expect(r.percentPx).toBeLessThanOrEqual(r.tickerPx);
    }
    expect(tileLabelSizes(34, 120, 'CBOM', '+0,73%').percentPx).toBeNull();
  });
  it('ширина считается по таблице символов, а не средним', () => {
    expect(textWidthEm('CBOM', W)).toBeCloseTo((0.73 + 0.625 + 0.74 + 0.85) * 1.08, 9);
  });
});
