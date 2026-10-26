import { IFQ_TOP40_URL, countStatus, parseSnapshot, top40ToStocks } from '../../quotes/model/if-api';
import { setTop40Snapshot } from '../../../shared/diagnostics/broker-check';
import { reportMarketError } from '../../../shared/analytics/market-errors';
import { reportSource } from '../../../shared/diagnostics/source-status';
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

    // Прежний источник — открытый API Мосбиржи (ISS). Теперь он запасной: на случай, если API InvestFuture не ответил.
    async function fetchFromIss(): Promise<MoexStock[]> {
        const res = await fetch(MOEX_URL);
        if (!res.ok) throw new Error(`MOEX ISS API: ${res.status}`);
        const json = await res.json();

        const securities = parseBlock(json.securities, {
          secid: ['SECID'],
          shortname: ['SHORTNAME', 'SECNAME'],
          issueSize: ['ISSUESIZE'], // количество акций в обращении — нужно для капитализации
          prevPrice: ['PREVPRICE'], // цена закрытия предыдущего торгового дня — нужна для честного % изменения
        });

        const marketdata = parseBlock(json.marketdata, {
          secid: ['SECID'],
          last: ['LAST', 'LCURRENTPRICE'],
          value: ['VALTODAY', 'VALTODAY_RUR', 'VOLTODAY'],
        });

        // Диагностика на случай, если реальные имена колонок отличаются от ожидаемых —
        // смотри в консоли браузера (F12), какие колонки реально пришли от биржи.
        console.log('[MOEX heatmap] securities columns:', json.securities?.columns);
        console.log('[MOEX heatmap] marketdata columns:', json.marketdata?.columns);
        console.log('[MOEX heatmap] marketdata sample row:', json.marketdata?.data?.[0]);

        const marketBySecid = new Map(marketdata.map((m) => [m.secid, m]));

        return securities
          .map((s) => {
            const m = marketBySecid.get(s.secid);
            const lastPrice = typeof m?.last === 'number' ? m.last : null;
            const issueSize = typeof s.issueSize === 'number' ? s.issueSize : null;
            const prevPrice = typeof s.prevPrice === 'number' ? s.prevPrice : null;
            const marketCap = issueSize !== null && lastPrice !== null ? issueSize * lastPrice : 0;
            const tradingValue = typeof m?.value === 'number' ? m.value : 0;
            // Честное изменение за день: (текущая цена - цена вчерашнего закрытия) / цена закрытия.
            // Раньше брали готовое поле от биржи по угаданному имени — оно оказалось "изменение
            // к прошлой сделке" (тик-в-тик, доли процента), а не "изменение за день" — из-за
            // этого почти все плитки на карте были серыми (изменение казалось около нуля).
            const changePercent =
              lastPrice !== null && prevPrice !== null && prevPrice !== 0
                ? ((lastPrice - prevPrice) / prevPrice) * 100
                : null;
            return {
              secid: String(s.secid),
              shortname: String(s.shortname ?? s.secid),
              lastPrice,
              changePercent,
              marketCap,
              tradingValue,
            };
          })
          // отбор компаний в список идёт по капитализации (см. ниже, в компоненте) —
          // здесь просто убираем бумаги без цены изменения, толку от них всё равно нет
          .filter((s) => s.marketCap > 0 && s.changePercent !== null);
    }

    // Основной источник — API котировок InvestFuture (метод /market-snapshot, universe=moex-top40) через наш сервер:
    // цена, изменение за день по выбранной базе, оборот и капитализация уже посчитаны.
    async function fetchFromApi(): Promise<MoexStock[]> {
      const res = await fetch(IFQ_TOP40_URL);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API InvestFuture: HTTP ${res.status}${/token_not_configured/.test(body) ? ' (на сервере не задан токен QUOTES_API_TOKEN)' : ''}`);
      }
      const items = parseSnapshot(await res.json());
      setTop40Snapshot(items); // для сверки с брокером в экране диагностики
      const stocks = top40ToStocks(items);
      if (stocks.length < 10) throw new Error(`API InvestFuture: в ответе только ${stocks.length} бумаг с ценой`);
      const c = countStatus(items);
      reportSource('ifapi-top40', true, `бумаг: ${stocks.length} из ${c.total} (устарело ${c.stale})`);
      return stocks;
    }

    async function fetchData() {
      let merged: MoexStock[];
      try {
        try {
          merged = await fetchFromApi();
        } catch (apiErr) {
          console.warn('[heatmap] API InvestFuture недоступен, беру данные Мосбиржи:', apiErr);
          reportSource('ifapi-top40', false, apiErr);
          reportMarketError('ifapi-top40');
          merged = await fetchFromIss();
          reportSource('moex', true, `бумаг: ${merged.length} (запасной источник)`);
        }
        if (isMountedRef.current) {
          setStocks(merged);
          if (merged.length === 0) {
            setError('Биржа ответила, но данные не распознаны (возможно, изменились названия полей — см. консоль F12 для диагностики).');
          } else {
            setError(null);
          }
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[MOEX heatmap] Ошибка запроса (возможно, CORS — см. вкладку Network):', err);
        reportMarketError('moex');
        reportSource('moex', false, err);
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
