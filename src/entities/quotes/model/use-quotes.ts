import { useEffect, useRef, useState } from 'react';
import { Quote } from './types';

const ISS = 'https://iss.moex.com/iss';
const REFRESH_MS = 60_000;

type Block = { columns: string[]; data: unknown[][] } | undefined;
type Values = Record<string, { price: number | null; changePercent: number | null; source?: string }>;

const MAIN: Quote[] = [
  { id: 'USD', title: 'Доллар США', ticker: 'USD/RUB', badge: '$', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа' },
  { id: 'EUR', title: 'Евро', ticker: 'EUR/RUB', badge: '€', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа' },
  { id: 'CNY', title: 'Юань', ticker: 'CNY/RUB', badge: '¥', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа' },
  { id: 'IMOEX', title: 'Индекс Мосбиржи', ticker: 'IMOEX', badge: 'M', price: null, changePercent: null, unit: 'пт.', decimals: 2, source: 'Мосбиржа' },
];

const EXTRA: Quote[] = [
  { id: 'BRENT', title: 'Нефть Brent', ticker: 'BR · фьючерс', badge: 'BR', price: null, changePercent: null, unit: '$', decimals: 2, source: 'Мосбиржа (ближайший фьючерс)' },
  { id: 'GAS', title: 'Природный газ', ticker: 'NG · фьючерс', badge: 'NG', price: null, changePercent: null, unit: '$', decimals: 3, source: 'Мосбиржа (ближайший фьючерс)' },
  { id: 'BTC', title: 'Биткоин', ticker: 'BTC/USD', badge: '₿', price: null, changePercent: null, unit: '$', decimals: 0, source: 'CoinGecko' },
  { id: 'ETH', title: 'Эфир', ticker: 'ETH/USD', badge: 'Ξ', price: null, changePercent: null, unit: '$', decimals: 0, source: 'CoinGecko' },
];

const col = (b: Block, names: string[]) => (b ? b.columns.findIndex((c) => names.includes(c)) : -1);
const num = (v: unknown): number | null => (typeof v === 'number' && isFinite(v) ? v : null);
const pct = (last: number | null, prev: number | null) =>
  last !== null && prev !== null && prev !== 0 ? ((last - prev) / prev) * 100 : null;

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// Валюты: основная площадка CETS, только три нужных тикера
async function fetchFx(): Promise<Values> {
  // у евро на бирже основной тикер EUR_RUB__TOM (два подчёркивания); EURRUB_TOM оставлен запасным вариантом
  const ids: Record<string, string> = { USD000UTSTOM: 'USD', EUR_RUB__TOM: 'EUR', EURRUB_TOM: 'EUR', CNYRUB_TOM: 'CNY' };
  const json = await getJson(
    `${ISS}/engines/currency/markets/selt/boards/CETS/securities.json?iss.meta=off&iss.only=securities,marketdata&securities=${Object.keys(ids).join(',')}`
  );
  const sec: Block = json.securities;
  const mkt: Block = json.marketdata;
  console.log('[quotes/fx] securities cols:', sec?.columns, '| marketdata cols:', mkt?.columns, '| rows:', mkt?.data);

  const sSec = col(sec, ['SECID']);
  const sPrev = col(sec, ['PREVPRICE', 'PREVLEGALCLOSEPRICE']);
  const mSec = col(mkt, ['SECID']);
  const mLast = col(mkt, ['LAST', 'LCURRENTPRICE']);
  const mClose = col(mkt, ['CLOSEPRICE']);
  const mChg = col(mkt, ['LASTCHANGEPRCNT', 'LASTCHANGEPRC']);

  const prevBySecid = new Map<string, number | null>();
  (sec?.data ?? []).forEach((r) => prevBySecid.set(String(r[sSec]), sPrev >= 0 ? num(r[sPrev]) : null));

  const out: Values = {};
  (mkt?.data ?? []).forEach((r) => {
    const id = ids[String(r[mSec])];
    if (!id) return;
    const last = mLast >= 0 ? num(r[mLast]) : null;
    const prev = prevBySecid.get(String(r[mSec])) ?? (mClose >= 0 ? num(r[mClose]) : null);
    if (out[id]?.price != null && last === null) return; // не затираем уже найденное значение пустым дублем
    out[id] = { price: last, changePercent: pct(last, prev) ?? (mChg >= 0 ? num(r[mChg]) : null) };
  });
  Object.values(ids).forEach((id) => {
    if (!out[id]) console.warn(`[quotes/fx] ${id} не найден в ответе биржи`);
    else if (out[id].price === null) console.info(`[quotes/fx] ${id}: строка есть, но цены нет (торги приостановлены) — берём курс ЦБ`);
  });
  return out;
}

// Официальные курсы ЦБ — запасной источник. Торги долларом и евро на Мосбирже приостановлены
// с 13.06.2024, поэтому живой биржевой цены у евро нет. Обновляется раз в день.
async function fetchCbr(): Promise<Values> {
  const json = await getJson('https://www.cbr-xml-daily.ru/daily_json.js');
  const out: Values = {};
  (['USD', 'EUR', 'CNY'] as const).forEach((code) => {
    const v = json?.Valute?.[code];
    const nominal = num(v?.Nominal) ?? 1;
    const value = num(v?.Value);
    if (value === null) { console.warn(`[quotes/cbr] нет курса ${code}`); return; }
    out[code] = {
      price: value / nominal,
      changePercent: pct(value, num(v?.Previous)),
      source: 'ЦБ РФ (официальный курс, раз в день)',
    };
  });
  return out;
}

// Индекс Мосбиржи
async function fetchIndex(): Promise<Values> {
  const json = await getJson(
    `${ISS}/engines/stock/markets/index/boards/SNDX/securities.json?iss.meta=off&iss.only=marketdata&securities=IMOEX`
  );
  const mkt: Block = json.marketdata;
  console.log('[quotes/index] marketdata cols:', mkt?.columns, '| rows:', mkt?.data);
  const row = mkt?.data?.[0];
  if (!row) return {};
  const iVal = col(mkt, ['CURRENTVALUE', 'LASTVALUE']);
  const iChg = col(mkt, ['LASTCHANGEPRC', 'LASTCHANGEPRCNT']);
  return { IMOEX: { price: iVal >= 0 ? num(row[iVal]) : null, changePercent: iChg >= 0 ? num(row[iChg]) : null } };
}

// Нефть и газ: ищем ближайший (не истёкший) фьючерс по коду базового актива
async function fetchFutures(): Promise<Values> {
  const json = await getJson(`${ISS}/engines/futures/markets/forts/securities.json?iss.meta=off&iss.only=securities,marketdata`);
  const sec: Block = json.securities;
  const mkt: Block = json.marketdata;
  console.log('[quotes/futures] securities cols:', sec?.columns, '| marketdata cols:', mkt?.columns);

  const sSec = col(sec, ['SECID']);
  const sAsset = col(sec, ['ASSETCODE']);
  const sExp = col(sec, ['LASTTRADEDATE']);
  const sPrev = col(sec, ['PREVSETTLEPRICE', 'PREVPRICE']);
  const mSec = col(mkt, ['SECID']);
  const mLast = col(mkt, ['LAST']);
  const mSettle = col(mkt, ['SETTLEPRICE']);

  const today = new Date().toISOString().slice(0, 10);
  const marketBySecid = new Map<string, unknown[]>((mkt?.data ?? []).map((r) => [String(r[mSec]), r]));

  const pick = (code: string, re: RegExp) => {
    const cands = (sec?.data ?? []).filter((r) => {
      const secid = String(r[sSec]);
      const assetOk = sAsset >= 0 ? String(r[sAsset]) === code : false;
      const expOk = sExp >= 0 ? String(r[sExp]) >= today : true;
      return (assetOk || re.test(secid)) && expOk;
    });
    cands.sort((a, b) => (sExp >= 0 ? String(a[sExp]).localeCompare(String(b[sExp])) : 0));
    return cands[0];
  };

  const out: Values = {};
  ([['BRENT', 'BR', /^BR[A-Z]\d$/], ['GAS', 'NG', /^NG[A-Z]\d$/]] as [string, string, RegExp][]).forEach(([id, code, re]) => {
    const s = pick(code, re);
    if (!s) { console.warn(`[quotes/futures] не нашёл контракт для ${code}`); return; }
    const m = marketBySecid.get(String(s[sSec]));
    const last = m ? num(m[mLast]) ?? (mSettle >= 0 ? num(m[mSettle]) : null) : null;
    out[id] = { price: last, changePercent: pct(last, sPrev >= 0 ? num(s[sPrev]) : null) };
    console.log(`[quotes/futures] ${id} → контракт ${String(s[sSec])}`);
  });
  return out;
}

// Биткоин и эфир
async function fetchCrypto(): Promise<Values> {
  const json = await getJson(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
  );
  return {
    BTC: { price: num(json?.bitcoin?.usd), changePercent: num(json?.bitcoin?.usd_24h_change) },
    ETH: { price: num(json?.ethereum?.usd), changePercent: num(json?.ethereum?.usd_24h_change) },
  };
}

export function useQuotes() {
  const [values, setValues] = useState<Values>({});
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    async function refresh() {
      // ЦБ первым: биржевые значения ниже перекрывают его, если у них есть цена
      const sources = [fetchCbr, fetchFx, fetchIndex, fetchFutures, fetchCrypto];
      const results = await Promise.allSettled(sources.map((f) => f()));
      results.forEach((r, i) => { if (r.status === 'rejected') console.error(`[quotes] источник ${sources[i].name} упал:`, r.reason); });
      if (!mounted.current) return;
      setValues((prev) => {
        // 1) собираем свежие значения этого опроса: более поздний источник перекрывает ранний,
        //    но только если у него реально есть цена
        const fresh: Values = {};
        results.forEach((r) => {
          if (r.status !== 'fulfilled') return;
          Object.entries(r.value).forEach(([id, v]) => { if (v.price !== null || !fresh[id]) fresh[id] = v; });
        });
        // 2) если источник в этот раз ничего не дал — оставляем прошлое значение, а не затираем прочерком
        const next = { ...prev };
        Object.entries(fresh).forEach(([id, v]) => { if (v.price !== null || !next[id]) next[id] = v; });
        return next;
      });
      setIsLoading(false);
    }
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => { mounted.current = false; clearInterval(t); };
  }, []);

  const merge = (list: Quote[]) => list.map((q) => ({ ...q, ...(values[q.id] ?? {}) }));
  return { main: merge(MAIN), extra: merge(EXTRA), isLoading };
}
