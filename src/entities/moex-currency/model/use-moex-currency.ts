import { useEffect, useRef, useState } from 'react';

export interface CurrencyRate {
  code: string; // USD, EUR, CNY
  label: string; // Доллар США
  rate: number | null;
  changePercent: number | null;
}

const CURRENCY_URL =
  'https://iss.moex.com/iss/engines/currency/markets/selt/securities.json?iss.meta=off';

const REFRESH_INTERVAL_MS = 30_000;

const TICKERS: { ticker: string; code: string; label: string }[] = [
  { ticker: 'USD000UTSTOM', code: 'USD', label: 'Доллар США' },
  { ticker: 'EURRUB_TOM', code: 'EUR', label: 'Евро' },
  { ticker: 'CNYRUB_TOM', code: 'CNY', label: 'Юань' },
];

export function useMoexCurrency() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function fetchData() {
      try {
        const res = await fetch(CURRENCY_URL);
        if (!res.ok) throw new Error(`MOEX ISS API: ${res.status}`);
        const json = await res.json();

        const block = json.marketdata;
        if (!block) throw new Error('Нет блока marketdata в ответе');

        const idxSecId = block.columns.indexOf('SECID');
        const idxLast = block.columns.findIndex((c: string) => ['LAST', 'LCURRENTPRICE'].includes(c));
        const idxClose = block.columns.findIndex((c: string) => ['CLOSEPRICE', 'LASTTOPREVPRICE'].includes(c));

        console.log('[MOEX currency] columns:', block.columns);

        const bySecId = new Map<string, any[]>(block.data.map((row: any[]) => [row[idxSecId], row]));

        const result: CurrencyRate[] = TICKERS.map(({ ticker, code, label }) => {
          const row = bySecId.get(ticker);
          const last = row && idxLast >= 0 ? row[idxLast] : null;
          const close = row && idxClose >= 0 ? row[idxClose] : null;
          const changePercent =
            typeof last === 'number' && typeof close === 'number' && close !== 0
              ? ((last - close) / close) * 100
              : null;
          return {
            code,
            label,
            rate: typeof last === 'number' ? last : null,
            changePercent,
          };
        });

        if (isMountedRef.current) {
          setRates(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[MOEX currency] Ошибка запроса:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить курсы валют');
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

  return { rates, isLoading, error };
}
