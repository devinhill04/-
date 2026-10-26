import { MoexStock } from './types';
import { shortName } from '../../quotes/model/if-api';

// Все акции основного режима торгов Мосбиржи (TQBR) из открытого API биржи (ISS, с задержкой ~15 минут).
// Нужен для «Лидеров роста и падения» по ВСЕМ бумагам (как на сайте), а также как запасной источник карты.
export const ISS_TQBR_URL =
  'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off';

// ISS отдаёт данные в "колоночном" формате: { columns: [...], data: [[...], [...]] }
// Разбираем это в обычный массив объектов, выбирая индекс каждой нужной колонки по имени.
// Названия некоторых полей на бирже менялись/дублировались в разных версиях API,
// поэтому для каждого значения перечисляем несколько вариантов имени на всякий случай.
export function parseBlock(block: { columns: string[]; data: unknown[][] } | undefined, candidates: Record<string, string[]>) {
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


// PREVPRICE — цена последней сделки прошлого торгового дня, то есть закрытие вечерней сессии: та же база, что у сайта
export async function fetchIssAllStocks(): Promise<MoexStock[]> {
  const res = await fetch(ISS_TQBR_URL);
  if (!res.ok) throw new Error(`MOEX ISS API: ${res.status}`);
  const json = await res.json();
  const securities = parseBlock(json.securities, {
    secid: ['SECID'],
    shortname: ['SHORTNAME'],
    secname: ['SECNAME'],
    issueSize: ['ISSUESIZE'],
    prevPrice: ['PREVPRICE'],
  });
  const marketdata = parseBlock(json.marketdata, {
    secid: ['SECID'],
    last: ['LAST', 'LCURRENTPRICE'],
    value: ['VALTODAY', 'VALTODAY_RUR'],
  });
  const bySecid = new Map(marketdata.map((m) => [m.secid, m]));
  return securities
    .map((s) => {
      const m = bySecid.get(s.secid);
      const lastPrice = typeof m?.last === 'number' ? m.last : null;
      const prevPrice = typeof s.prevPrice === 'number' ? s.prevPrice : null;
      const issueSize = typeof s.issueSize === 'number' ? s.issueSize : null;
      return {
        secid: String(s.secid),
        // полное имя бумаги, как на сайте («Южный Кузбасс»), а не сокращённое биржевое
        shortname: typeof s.secname === 'string' && s.secname ? shortName(s.secname) : String(s.shortname ?? s.secid),
        lastPrice,
        changePercent: lastPrice !== null && prevPrice ? ((lastPrice - prevPrice) / prevPrice) * 100 : null,
        marketCap: issueSize !== null && lastPrice !== null ? issueSize * lastPrice : 0,
        tradingValue: typeof m?.value === 'number' ? m.value : 0,
      };
    })
    .filter((s) => s.changePercent !== null);
}

// Лидеры роста и падения по всем бумагам, по которым сегодня были сделки
export function pickMoversAll(stocks: MoexStock[], perSide = 5): { gainers: MoexStock[]; losers: MoexStock[] } {
  const traded = stocks.filter((s) => s.tradingValue > 0 && s.lastPrice !== null && s.changePercent !== null);
  return {
    gainers: traded.filter((s) => s.changePercent! > 0).sort((a, b) => b.changePercent! - a.changePercent!).slice(0, perSide),
    losers: traded.filter((s) => s.changePercent! < 0).sort((a, b) => a.changePercent! - b.changePercent!).slice(0, perSide),
  };
}
