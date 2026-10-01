export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(n: number): string {
  return `${n > 0 ? '+' : ''}${formatNumber(n, 2)}%`;
}

// 1 234 567 890 → "1,23 млрд ₽"
export function formatBigRub(n: number): string {
  if (n >= 1e12) return `${formatNumber(n / 1e12, 2)} трлн ₽`;
  if (n >= 1e9) return `${formatNumber(n / 1e9, 1)} млрд ₽`;
  if (n >= 1e6) return `${formatNumber(n / 1e6, 1)} млн ₽`;
  return `${formatNumber(n, 0)} ₽`;
}

export function formatNewsDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? `Сегодня, ${time}`
    : `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`;
}

// Абсолютное изменение цены, если известны только текущая цена и % изменения
// (у части источников нет готового значения в валюте, только проценты)
export function deriveAbsoluteChange(price: number, changePercent: number): number {
  return (price * changePercent) / (100 + changePercent);
}
