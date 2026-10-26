// Точное отображение чисел из API: работаем с десятичной СТРОКОЙ, как её прислал API, без перевода в число
// с плавающей точкой (иначе 0,125 превращается в 0,12 из-за двоичного представления). Стиль — как на сайте
// investfuture.ru: запятая, неразрывные пробелы между разрядами, проценты без лишних нулей («+1,7 %», «0 %»).

const NBSP = '\u00a0';

interface Dec { neg: boolean; int: string; frac: string }

function parse(s: string | number | null | undefined): Dec | null {
  if (s === null || s === undefined) return null;
  // Число из запасного источника: кратчайшая точная запись (293.2, а не 293.2000000000); экспоненту разворачиваем
  const str = typeof s === 'number'
    ? (!Number.isFinite(s) ? '' : /e/i.test(String(s)) ? s.toFixed(12).replace(/\.?0+$/, '') : String(s))
    : String(s);
  const m = /^\s*([+-]?)(\d*)(?:[.,](\d*))?\s*$/.exec(str);
  if (!m || (m[2] === '' && (m[3] ?? '') === '')) return null;
  return { neg: m[1] === '-', int: (m[2] || '0').replace(/^0+(?=\d)/, ''), frac: m[3] ?? '' };
}

const isZero = (d: Dec) => /^0*$/.test(d.int) && /^0*$/.test(d.frac);
const group = (int: string) => int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

// Округление «половина — от нуля» до digits знаков, на строке
function round(d: Dec, digits: number): Dec {
  const frac = d.frac.padEnd(digits + 1, '0');
  let kept = BigInt((d.int || '0') + frac.slice(0, digits));
  if (Number(frac[digits]) >= 5) kept += 1n;
  const s = kept.toString().padStart(digits + 1, '0');
  return { neg: d.neg, int: s.slice(0, s.length - digits) || '0', frac: digits ? s.slice(s.length - digits) : '' };
}

// Цена или изменение в деньгах: точность как у API, но не меньше minFrac знаков («19 214,00», «7,775», «−0,10»)
export function fmtDecimal(s: string | number | null | undefined, minFrac = 2): string | null {
  const d = parse(s);
  if (!d) return null;
  const frac = d.frac.length >= minFrac ? d.frac : d.frac.padEnd(minFrac, '0');
  const body = group(d.int) + (frac ? ',' + frac : '');
  return isZero(d) ? body : (d.neg ? '-' : '') + body;
}

// Процент: до 2 знаков, хвостовые нули убираются, ноль — «0»
// sign: ставить «+» у положительных; abs: без знака вообще (цвет и так показывает направление)
export function fmtPct(s: string | number | null | undefined, opts: { sign?: boolean; abs?: boolean } = {}): string | null {
  const d0 = parse(s);
  if (!d0) return null;
  const d = round(d0, 2);
  const frac = d.frac.replace(/0+$/, '');
  if (isZero(d)) return '0';
  const body = group(d.int) + (frac ? ',' + frac : '');
  if (opts.abs) return body;
  return (d.neg ? '-' : opts.sign ? '+' : '') + body;
}
