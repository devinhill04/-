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
          issueSize: ['ISSUESIZE'], // количество акций в обращении — нужно для капитализации
        });

        const marketdata = parseBlock(json.marketdata, {
          secid: ['SECID'],
          last: ['LAST', 'LCURRENTPRICE'],
          changePercent: ['LASTTOPREVPRICE', 'LASTCHANGEPRCNT', 'CHANGE'],
          value: ['VALTODAY', 'VALTODAY_RUR', 'VOLTODAY'],
        });

        // Диагностика на случай, если реальные имена колонок отличаются от ожидаемых —
        // смотри в консоли браузера (F12), какие колонки реально пришли от биржи.
        console.log('[MOEX heatmap] securities columns:', json.securities?.columns);
        console.log('[MOEX heatmap] marketdata columns:', json.marketdata?.columns);
        console.log('[MOEX heatmap] marketdata sample row:', json.marketdata?.data?.[0]);

        const marketBySecid = new Map(marketdata.map((m) => [m.secid, m]));

        const merged: MoexStock[] = securities
          .map((s) => {
            const m = marketBySecid.get(s.secid);
            const lastPrice = typeof m?.last === 'number' ? m.last : null;
            const issueSize = typeof s.issueSize === 'number' ? s.issueSize : null;
            // Размер плитки — капитализация (кол-во акций × цена), а не объём торгов за день.
            // Объём торгов слишком "дёрганый": у малоликвидных бумаг случайный всплеск
            // сделок может визуально "съесть" всю карту, хотя по факту это не крупная компания.
            const marketCap = issueSize !== null && lastPrice !== null ? issueSize * lastPrice : 0;
            return {
              secid: String(s.secid),
              shortname: String(s.shortname ?? s.secid),
              lastPrice,
              changePercent: typeof m?.changePercent === 'number' ? m.changePercent : null,
              marketValue: marketCap,
            };
          })
          // убираем бумаги без капитализации и без данных об изменении цены — на карте от них толку нет
          .filter((s) => s.marketValue > 0 && s.changePercent !== null);

        if (isMountedRef.current) {
          setStocks(merged);
          if (merged.length === 0) {
            setError(
              'Биржа ответила, но данные не распознаны (возможно, изменились названия полей — см. консоль F12 для диагностики).'
            );
          } else {
            setError(null);
          }
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[MOEX heatmap] Ошибка запроса (возможно, CORS — см. вкладку Network):', err);
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
