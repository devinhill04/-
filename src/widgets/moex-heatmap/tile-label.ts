// Размер подписи на плитке тепловой карты: тикер и процент растут вместе с плиткой, пока помещаются целиком.
//
// Ширины символов — замер шрифта Manrope в браузере (доля кегля). Одно «среднее» число не годится:
// «M» шире «I» втрое, а «%» почти как «W» — на тикере CBOM средняя оценка давала обрезание.
const W600: Record<string, number> = { A: 0.658, B: 0.625, C: 0.73, D: 0.69, E: 0.58, F: 0.516, G: 0.723, H: 0.709, I: 0.264, J: 0.488, K: 0.629, L: 0.525, M: 0.85, N: 0.706, O: 0.74, P: 0.627, Q: 0.74, R: 0.65, S: 0.643, T: 0.603, U: 0.714, V: 0.628, W: 0.962, X: 0.639, Y: 0.593, Z: 0.647, '0': 0.642, '1': 0.422, '2': 0.587, '3': 0.572, '4': 0.602, '5': 0.583, '6': 0.621, '7': 0.523, '8': 0.601, '9': 0.621 };
const W500: Record<string, number> = { '0': 0.626, '1': 0.406, '2': 0.578, '3': 0.562, '4': 0.596, '5': 0.58, '6': 0.621, '7': 0.512, '8': 0.591, '9': 0.621, '+': 0.575, '-': 0.42, '−': 0.54, '.': 0.27, ',': 0.278, '%': 0.901, '—': 0.78 };
const UNKNOWN = 0.85; // незнакомый символ считаем широким
const MARGIN = 1.08; // запас: если на телефоне Manrope не успел загрузиться, системный шрифт немного шире

export const textWidthEm = (text: string, table: Record<string, number>) => [...text].reduce((a, ch) => a + (table[ch.toUpperCase()] ?? table[ch] ?? UNKNOWN), 0) * MARGIN;

const PERCENT_RATIO = 0.78; // процент чуть мельче тикера
const LINE = 1.15; // высота строки
const MAX_TICKER = 26; // потолок: на самой большой плитке буквы не должны становиться плакатными
const MIN_TWO_LINES = 9; // меньше — процент не показываем, только тикер
const PAD_X = 6; // отступы и рамка по ширине
const PAD_Y = 6;

export interface TileLabel {
  tickerPx: number;
  percentPx: number | null; // null — процент не помещается, показываем только тикер
}

export function tileLabelSizes(width: number, height: number, ticker: string, percent: string): TileLabel {
  const w = Math.max(0, width - PAD_X);
  const h = Math.max(0, height - PAD_Y);
  const byTickerWidth = w / Math.max(textWidthEm(ticker, W600), 0.1);
  const byPercentWidth = w / Math.max(textWidthEm(percent, W500) * PERCENT_RATIO, 0.1);
  const byTwoLines = h / ((1 + PERCENT_RATIO) * LINE);
  const two = Math.min(byTickerWidth, byPercentWidth, byTwoLines, MAX_TICKER);
  if (two >= MIN_TWO_LINES) {
    const t = Math.floor(two);
    const p = Math.floor(t * PERCENT_RATIO);
    // процент не меньше 8 px, но и не шире плитки
    return { tickerPx: t, percentPx: Math.min(Math.max(8, p), Math.floor(byPercentWidth * PERCENT_RATIO)) };
  }
  // Только тикер: не меньше 7 px, но и не крупнее того, что помещается
  const one = Math.min(byTickerWidth, h / LINE, 14);
  return { tickerPx: Math.max(7, Math.floor(one)), percentPx: null };
}
