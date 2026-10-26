import { useEffect, useState } from 'react';
import { MoexStock } from './types';
import { fetchIssAllStocks, pickMoversAll } from './iss-stocks';
import { reportSource } from '../../../shared/diagnostics/source-status';
import { reportMarketError } from '../../../shared/analytics/market-errors';

const REFRESH_MS = 60_000;

// «Лидеры роста и падения» по всем акциям биржи, как на сайте. Если не загрузились — null,
// и списки берут лидеров среди крупнейших бумаг карты (как раньше).
export function useMoexMovers(): { gainers: MoexStock[]; losers: MoexStock[] } | null {
  const [movers, setMovers] = useState<{ gainers: MoexStock[]; losers: MoexStock[] } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const all = await fetchIssAllStocks();
        const m = pickMoversAll(all);
        if (!alive) return;
        setMovers(m);
        reportSource('moex-movers', true, `бумаг с сделками сегодня: ${all.filter((s) => s.tradingValue > 0).length}`);
      } catch (e) {
        reportSource('moex-movers', false, e);
        reportMarketError('moex-movers');
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return movers;
}
