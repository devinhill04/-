import { useEffect, useRef, useState } from 'react';
import { MoexStock } from './types';

const MOEX_URL =
  'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off';

const REFRESH_INTERVAL_MS = 30_000; // обновление раз в 30 секунд

// ISS отдаёт данные в "колоночном" формате: { columns: [...], data: [[...], [...]] }
// Разбираем это в обычный массив объектов, выбирая индекс каждой нужной колонки по имени.
// Названия некоторых полей на бирже менялись/дублировались в разных версиях API,
// поэтому для каждого значения перечисляем несколько вариантов имени на всякий случай.
function parseBlock(block: { columns: string[]; data: unknown[][] } | undefined, candidates: Record<string, string[]>) {
  if (!block) return [];
  const colIndex: Record<string, number> = {};
  for (const [key, names] of Object.entries(candidates)) {
    const idx = block.columns.findIndex((c) => names.includes(c));
    colIndex[key] = idx;
  }
  return block.data.map((row) => {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(colIndex)) {
      const idx = colIndex[key];
      result[key] = idx >= 0 ? row[idx] : null;
    }
    return result;
  });
}

export function useMoexHeatmap() {
  const [stocks, setStocks] = useState<MoexStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function fetchData() {
      try {
        const res = await fetch(MOEX_URL);
        if (!res.ok) throw new Error(`MOEX ISS API: ${res.status}`);
        const json = await res.json();

        const securities = parseBlock(json.securities, {
          secid: ['SECID'],
          shortname: ['SHORTNAME', 'SECNAME'],
        });

        const marketdata = parseBlock(json.marketdata, {
          secid: ['SECID'],
          last: ['LAST', 'LCURRENTPRICE'],
          changePercent: ['LASTTOPREVPRICE', 'LASTCHANGEPRCNT', 'CHANGE'],
          value: ['VALTODAY', 'VALTODAY_RUR', 'VOLTODAY'],
        });

        const marketBySecid = new Map(marketdata.map((m) => [m.secid, m]));

        const merged: MoexStock[] = securities
          .map((s) => {
            const m = marketBySecid.get(s.secid);
            return {
              secid: String(s.secid),
              shortname: String(s.shortname ?? s.secid),
              lastPrice: typeof m?.last === 'number' ? m.last : null,
              changePercent: typeof m?.changePercent === 'number' ? m.changePercent : null,
              marketValue: typeof m?.value === 'number' ? m.value : 0,
            };
          })
          // убираем бумаги без сделок сегодня и без данных об изменении цены — на карте от них толку нет
          .filter((s) => s.marketValue > 0 && s.changePercent !== null);

        if (isMountedRef.current) {
          setStocks(merged);
          setError(null);
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить котировки');
          setIsLoading(false);
        }
      }
    }

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return { stocks, isLoading, error, lastUpdated };
}
