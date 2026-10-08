const pad = (n: number) => String(n).padStart(2, '0');

// «23.10.2026» → «2026-10-23»
export function ruToIso(s: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

// «2026-10-23» → «23.10.2026»
export function isoToRu(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

const parts = (iso: string): [number, number, number] => {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
};

export const toIsoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// Сколько календарных дней от сегодня до даты (по местному календарю, без влияния часов и перехода на летнее время)
export function daysUntil(iso: string, now: Date = new Date()): number {
  const [y, m, d] = parts(iso);
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 864e5);
}

export function countdownLabel(days: number): string {
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  if (days > 1) return `через ${days} дн.`;
  return 'уже прошло';
}

export function formatDayMonth(iso: string): string {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function monthShort(iso: string): string {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
}

export function weekdayShort(iso: string): string {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { weekday: 'short' });
}
