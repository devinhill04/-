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

        const secBlock = json.securities;
        const mktBlock = json.marketdata;
        if (!secBlock || !mktBlock) throw new Error('Нет блоков securities/marketdata в ответе');

        console.log('[MOEX currency] securities columns:', secBlock.columns);
        console.log('[MOEX currency] marketdata columns:', mktBlock.columns);
        console.log(
          '[MOEX currency] все тикеры в ответе:',
          secBlock.data.map((row: any[]) => row[secBlock.columns.indexOf('SECID')])
        );

        const secIdxSecId = secBlock.columns.indexOf('SECID');
        const secIdxPrev = secBlock.columns.indexOf('PREVPRICE');
        const mktIdxSecId = mktBlock.columns.indexOf('SECID');
        const mktIdxLast = mktBlock.columns.findIndex((c: string) => ['LAST', 'LCURRENTPRICE'].includes(c));

        const prevBySecId = new Map<string, number>(
          secBlock.data.map((row: any[]) => [row[secIdxSecId], row[secIdxPrev]])
        );
        const lastBySecId = new Map<string, number>(
          mktBlock.data.map((row: any[]) => [row[mktIdxSecId], row[mktIdxLast]])
        );

        const result: CurrencyRate[] = TICKERS.map(({ ticker, code, label }) => {
          const last = lastBySecId.get(ticker) ?? null;
          const prev = prevBySecId.get(ticker) ?? null;

          if (last === undefined || !lastBySecId.has(ticker)) {
            console.warn(`[MOEX currency] тикер ${ticker} не найден в marketdata`);
          }

          const changePercent =
            typeof last === 'number' && typeof prev === 'number' && prev !== 0
              ? ((last - prev) / prev) * 100
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
