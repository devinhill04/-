// Свежесть данных биржи для подписи под тепловой картой. Раньше там было «Обновлено: 15:56:45» — время, когда
// приложение ЗАПРОСИЛО данные, хотя сами цены Мосбиржи приходят с задержкой. Теперь — время самих цен по Москве.
export interface DataFreshness {
  source: 'api' | 'iss';
  dataAtUtc: string | null; // время самой свежей цены (из API), ISO
}

const MSK = 'Europe/Moscow';
const timeMsk = (d: Date) => d.toLocaleTimeString('ru-RU', { timeZone: MSK, hour: '2-digit', minute: '2-digit' });
const dateMsk = (d: Date) => d.toLocaleDateString('ru-RU', { timeZone: MSK, day: '2-digit', month: '2-digit' });

// Самая свежая цена в ответе API — по ней и подпись
export function latestPriceAt(items: { snapshot?: { priceAtUtc?: string } | null; status?: string }[]): string | null {
  let best: number | null = null;
  for (const i of items) {
    if (!i.snapshot?.priceAtUtc || i.status === 'unavailable') continue;
    const t = Date.parse(i.snapshot.priceAtUtc);
    if (!Number.isNaN(t) && (best === null || t > best)) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

export function freshnessLabel(f: DataFreshness | null | undefined, now: Date = new Date()): string | null {
  if (!f) return null;
  if (f.source === 'iss' || !f.dataAtUtc) return 'Данные Мосбиржи с задержкой около 15 минут';
  const at = new Date(f.dataAtUtc);
  if (Number.isNaN(at.getTime())) return 'Данные Мосбиржи с задержкой';
  // Не сегодня (по Москве) — значит, торги не идут: показываем дату, чтобы не выдавать старые цены за текущие
  if (dateMsk(at) !== dateMsk(now)) return `Последние данные Мосбиржи: ${dateMsk(at)}, ${timeMsk(at)} МСК`;
  return `Данные Мосбиржи на ${timeMsk(at)} МСК, с задержкой`;
}
