import { IFQ_TOP40_URL, countStatus, parseSnapshot, top40ToStocks } from '../../quotes/model/if-api';
import { setTop40Snapshot } from '../../../shared/diagnostics/broker-check';
import { reportMarketError } from '../../../shared/analytics/market-errors';
import { reportSource } from '../../../shared/diagnostics/source-status';
import { useEffect, useRef, useState } from 'react';
import { MoexStock } from './types';
import { fetchIssAllStocks } from './iss-stocks';

const REFRESH_INTERVAL_MS = 30_000; // обновление раз в 30 секунд

export function useMoexHeatmap() {
  const [stocks, setStocks] = useState<MoexStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Прежний источник — открытый API Мосбиржи (ISS), теперь запасной: на случай, если API InvestFuture не ответил
    async function fetchFromIss(): Promise<MoexStock[]> {
      return (await fetchIssAllStocks()).filter((s) => s.marketCap > 0);
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
