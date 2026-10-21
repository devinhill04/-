import { parseIfStrip } from '../../entities/quotes/model/use-quotes';
import { parseNews } from '../../entities/news/model/use-news';

// «Проверка связи»: живые запросы с самого устройства к тем же адресам, что использует приложение.
// Показывает то, что видит пользователь: код ответа, время, и разобралось ли содержимое.

export interface ProbeResult {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  status?: number;
  ms: number;
  bytes?: number;
  note?: string; // что удалось разобрать, либо причина сбоя
}

interface Probe {
  id: string;
  label: string;
  url: string;
  analyze?: (text: string) => string;
}

const ifq = (t: string) => { try { const items = JSON.parse(t).items; return Array.isArray(items) ? `доступно: ${items.filter((i: any) => i.status === 'available').length}, устарело: ${items.filter((i: any) => i.status === 'stale').length}, всего: ${items.length}` : 'в ответе нет items'; } catch { return 'ответ не JSON'; } };

export const PROBES: Probe[] = [
  { id: 'ifq-overview', label: 'API InvestFuture: котировки (через наш сервер)', url: '/api/ifq/overview', analyze: ifq },
  { id: 'ifq-top40', label: 'API InvestFuture: акции для карты (через наш сервер)', url: '/api/ifq/top40', analyze: ifq },
  { id: 'news', label: 'Новости IF News (наш сервер → туннель → t.me)', url: '/api/news', analyze: (t) => `постов в ответе: ${parseNews(t).length}` },
  { id: 'site', label: 'Цены с сайта (через наш сервер → investfuture.ru)', url: '/api/if-quotes', analyze: (t) => `цен разобрано: ${parseIfStrip(t).length} из 6${/Загрузка котировок/.test(t) ? ' (на странице заглушка «Загрузка котировок…»)' : ''}` },
  { id: 'posts', label: 'Каталог постов', url: '/data/posts.json' },
  { id: 'urals', label: 'Urals: средняя цена', url: '/data/urals-monthly.json' },
  { id: 'moex', label: 'Мосбиржа (ISS) с этого устройства', url: 'https://iss.moex.com/iss/engines.json?iss.meta=off' },
  { id: 'cbr', label: 'Курсы ЦБ с этого устройства', url: 'https://www.cbr-xml-daily.ru/daily_json.js' },
  { id: 'gecko', label: 'CoinGecko (биткоин, эфир) с этого устройства', url: 'https://api.coingecko.com/api/v3/ping' },
];

export async function runProbe(p: Probe, fetchImpl: typeof fetch = fetch, timeoutMs = 8000): Promise<ProbeResult> {
  const t0 = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(p.url, { cache: 'no-store', signal: ctl.signal });
    const text = await res.text().catch(() => '');
    let note = '';
    if (res.ok && p.analyze) {
      try { note = p.analyze(text); } catch (e) { note = `не разобрать: ${(e as Error).message}`; }
    }
    return { id: p.id, label: p.label, url: p.url, ok: res.ok, status: res.status, ms: Date.now() - t0, bytes: text.length, note };
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    return { id: p.id, label: p.label, url: p.url, ok: false, ms: Date.now() - t0, note: aborted ? `нет ответа за ${timeoutMs / 1000} с` : `не удалось: ${(e as Error)?.message ?? e}` };
  } finally {
    clearTimeout(timer);
  }
}

export async function runAllProbes(onResult: (r: ProbeResult) => void, fetchImpl: typeof fetch = fetch, timeoutMs = 8000): Promise<ProbeResult[]> {
  return Promise.all(PROBES.map(async (p) => { const r = await runProbe(p, fetchImpl, timeoutMs); onResult(r); return r; }));
}
