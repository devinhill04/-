import { useEffect, useRef, useState } from 'react';
import { Quote } from './types';

const ISS = 'https://iss.moex.com/iss';
const REFRESH_MS = 60_000;

type Block = { columns: string[]; data: unknown[][] } | undefined;
type Values = Record<string, { price: number | null; changePercent: number | null; source?: string; estimate?: boolean }>;

const MAIN: Quote[] = [
  { id: 'USD', title: 'Доллар США', ticker: 'USD/RUB', badge: '$', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа' },
  { id: 'EUR', title: 'Евро', ticker: 'EUR/RUB', badge: '€', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа' },
  { id: 'CNY', title: 'Юань', ticker: 'CNY/RUB', badge: '¥', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа' },
  { id: 'IMOEX', title: 'Индекс Мосбиржи', ticker: 'IMOEX', badge: 'M', price: null, changePercent: null, unit: 'пт.', decimals: 2, source: 'Мосбиржа' },
];

const EXTRA: Quote[] = [
  { id: 'BRENT', title: 'Нефть Brent', ticker: 'BR · фьючерс', badge: 'BR', price: null, changePercent: null, unit: '$', decimals: 2, source: 'Мосбиржа (ближайший фьючерс)' },
  { id: 'URALS', title: 'Нефть Urals', ticker: 'Urals · оценка', badge: 'UR', price: null, changePercent: null, unit: '$', decimals: 2, source: 'Оценка: Brent минус дисконт Urals' },
  { id: 'GOLD', title: 'Золото', ticker: 'GLDRUB · за грамм', badge: 'Au', price: null, changePercent: null, unit: '₽', decimals: 1, source: 'Мосбиржа (спот, ₽ за грамм)' },
  { id: 'SILVER', title: 'Серебро', ticker: 'SLVRUB · за грамм', badge: 'Ag', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа (спот, ₽ за грамм)' },
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

// Нефть: ближайший не истёкший фьючерс Мосбиржи. Контракт ищем тремя способами (код базового актива,
// шаблон тикера, шаблон названия), потому что точные имена у биржи могут отличаться от ожидаемых.
export async function fetchFutures(): Promise<Values> {
  const json = await getJson(`${ISS}/engines/futures/markets/forts/securities.json?iss.meta=off&iss.only=securities,marketdata`);
  const sec: Block = json.securities;
  const mkt: Block = json.marketdata;
  console.log('[quotes/futures] securities cols:', sec?.columns, '| marketdata cols:', mkt?.columns);

  const sSec = col(sec, ['SECID']);
  const sName = col(sec, ['SHORTNAME']);
  const sAsset = col(sec, ['ASSETCODE']);
  const sExp = col(sec, ['LASTTRADEDATE']);
  const sPrev = col(sec, ['PREVSETTLEPRICE', 'PREVPRICE']);
  const mSec = col(mkt, ['SECID']);
  const mLast = col(mkt, ['LAST']);
  const mSettle = col(mkt, ['SETTLEPRICE']);

  const today = new Date().toISOString().slice(0, 10);
  const marketBySecid = new Map<string, unknown[]>((mkt?.data ?? []).map((r) => [String(r[mSec]), r]));

  const targets = [
    { id: 'BRENT', code: 'BR', secidRe: /^BR[A-Z]\d$/, nameRe: /^BR-/i },
    { id: 'URALS', code: 'UR', secidRe: /^UR[A-Z]\d$/, nameRe: /^UR(ALS)?-/i },
  ];

  const out: Values = {};
  targets.forEach(({ id, code, secidRe, nameRe }) => {
    const cands = (sec?.data ?? []).filter((r) => {
      const matches =
        (sAsset >= 0 && String(r[sAsset]) === code) || secidRe.test(String(r[sSec])) || (sName >= 0 && nameRe.test(String(r[sName])));
      const alive = sExp >= 0 ? String(r[sExp]) >= today : true;
      return matches && alive;
    });
    cands.sort((a, b) => (sExp >= 0 ? String(a[sExp]).localeCompare(String(b[sExp])) : 0));
    const s = cands[0];

    if (!s) {
      const like = (sec?.data ?? [])
        .filter((r) => [r[sSec], sName >= 0 ? r[sName] : '', sAsset >= 0 ? r[sAsset] : ''].some((v) => String(v).toUpperCase().includes(code)))
        .map((r) => String(r[sSec]))
        .slice(0, 15);
      console.warn(`[quotes/futures] ${id}: живой контракт не найден. Похожие тикеры в списке биржи:`, like);
      out[id] = {
        price: null,
        changePercent: null,
        source: `Мосбиржа: фьючерс ${code} не найден в списке торгуемых контрактов`,
      };
      return;
    }

    const secid = String(s[sSec]);
    const m = marketBySecid.get(secid);
    const prev = sPrev >= 0 ? num(s[sPrev]) : null;
    const traded = m ? num(m[mLast]) : null;
    const settle = m && mSettle >= 0 ? num(m[mSettle]) : null;
    console.log(`[quotes/futures] ${id} → контракт ${secid}: сделка=${traded}, расчётная=${settle}, вчерашняя расчётная=${prev}`);

    if (traded !== null) out[id] = { price: traded, changePercent: pct(traded, prev) };
    else if (settle !== null) out[id] = { price: settle, changePercent: pct(settle, prev), source: `Мосбиржа: расчётная цена контракта ${secid} (сделок сегодня не было)` };
    else if (prev !== null) out[id] = { price: prev, changePercent: null, source: `Мосбиржа: вчерашняя расчётная цена контракта ${secid} (сегодня торгов нет)` };
    else out[id] = { price: null, changePercent: null, source: `Мосбиржа: у контракта ${secid} нет ни сделок, ни расчётной цены` };
  });
  return out;
}

// Золото и серебро — спот Мосбиржи в рублях за грамм (GLDRUB_TOM / SLVRUB_TOM).
// Запрашиваем на уровне рынка, а не конкретной площадки: в ответе берём строку, где есть цена.
export async function fetchMetals(): Promise<Values> {
  const ids: Record<string, string> = { GLDRUB_TOM: 'GOLD', SLVRUB_TOM: 'SILVER' };
  const json = await getJson(
    `${ISS}/engines/currency/markets/selt/securities.json?iss.meta=off&iss.only=securities,marketdata&securities=${Object.keys(ids).join(',')}`
  );
  const sec: Block = json.securities;
  const mkt: Block = json.marketdata;
  console.log('[quotes/metals] marketdata cols:', mkt?.columns, '| rows:', mkt?.data);

  const sSec = col(sec, ['SECID']);
  const sBoard = col(sec, ['BOARDID']);
  const sPrev = col(sec, ['PREVPRICE', 'PREVLEGALCLOSEPRICE']);
  const mSec = col(mkt, ['SECID']);
  const mBoard = col(mkt, ['BOARDID']);
  const mLast = col(mkt, ['LAST', 'LCURRENTPRICE']);
  const mClose = col(mkt, ['CLOSEPRICE']);

  const prevByKey = new Map<string, number | null>();
  (sec?.data ?? []).forEach((r) =>
    prevByKey.set(`${r[sSec]}|${sBoard >= 0 ? r[sBoard] : ''}`, sPrev >= 0 ? num(r[sPrev]) : null)
  );

  const out: Values = {};
  (mkt?.data ?? []).forEach((r) => {
    const id = ids[String(r[mSec])];
    if (!id) return;
    const last = mLast >= 0 ? num(r[mLast]) : null;
    const prev = prevByKey.get(`${r[mSec]}|${mBoard >= 0 ? r[mBoard] : ''}`) ?? (mClose >= 0 ? num(r[mClose]) : null);
    if (last !== null && out[id]?.price == null) out[id] = { price: last, changePercent: pct(last, prev) };
    else if (!out[id]) out[id] = { price: null, changePercent: null };
  });
  Object.entries(ids).forEach(([secid, id]) => {
    if (!out[id]) {
      console.warn(`[quotes/metals] ${secid} не найден в ответе биржи`);
      out[id] = { price: null, changePercent: null, source: `Мосбиржа: инструмент ${secid} не найден` };
    }
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

// ---------- Нефть Urals: оценка ----------
// Живой котировки Urals на Мосбирже нет (старые фьючерсы UR торговались до 2012 г.), поэтому показываем ОЦЕНКУ:
// живой Brent (фьючерс Мосбиржи) минус дисконт Urals к Brent. Дисконт раз в месяц публикуют Argus/Интерфакс;
// он лежит в public/data/urals-discount.json и обновляется правкой этого файла, без изменения кода.
// Если у Мосбиржи когда-нибудь появится настоящий контракт с ценой — он автоматически вытеснит оценку.
export interface UralsDiscount {
  discountUsd: number; // $ за баррель
  basis: string; // к чему дисконт: «Urals FOB Приморск к Dated Brent»
  period: string; // «август 2026»
  asOf: string; // дата публикации, ГГГГ-ММ-ДД — по ней считаем, не протухли ли данные
  source: string;
}

const DISCOUNT_STALE_DAYS = 45;

export function estimateUrals(
  brent: Values[string] | undefined,
  d: UralsDiscount | null,
  now: Date = new Date()
): Values[string] | null {
  if (!d || !brent || brent.price === null) return null;
  const price = brent.price - d.discountUsd;

  // Изменение за день: дисконт считаем постоянным, поэтому доллары движутся как у Brent, а проценты — от меньшей базы
  let change: number | null = null;
  if (brent.changePercent !== null && 1 + brent.changePercent / 100 !== 0) {
    const prevBrent = brent.price / (1 + brent.changePercent / 100);
    change = pct(price, prevBrent - d.discountUsd);
  }

  const ageDays = (now.getTime() - new Date(d.asOf).getTime()) / 864e5;
  const stale = Number.isFinite(ageDays) && ageDays > DISCOUNT_STALE_DAYS;
  const disc = d.discountUsd.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  return {
    price,
    changePercent: change,
    estimate: true,
    source:
      `Оценка, не биржевая котировка: Brent (фьючерс Мосбиржи) минус дисконт ${d.basis} ${disc} $/барр. (${d.source}, ${d.period})` +
      (stale ? `. ВНИМАНИЕ: дисконт не обновлялся более ${DISCOUNT_STALE_DAYS} дней, цифра может быть неточной` : ''),
  };
}

async function fetchUralsDiscount(): Promise<UralsDiscount | null> {
  try {
    const res = await fetch('/data/urals-discount.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    return typeof j?.discountUsd === 'number' && Number.isFinite(j.discountUsd) ? (j as UralsDiscount) : null;
  } catch (e) {
    console.warn('[quotes/urals] не удалось прочитать urals-discount.json:', e);
    return null;
  }
}

// Склеивает результаты источников с прошлыми значениями; чистая функция (тестируется отдельно)
export function combineValues(prev: Values, results: PromiseSettledResult<Values>[], discount: UralsDiscount | null): Values {
  // 1) свежие значения этого опроса: более поздний источник перекрывает ранний, но только если у него есть цена
  const fresh: Values = {};
  results.forEach((r) => {
    if (r.status !== 'fulfilled') return;
    Object.entries(r.value).forEach(([id, v]) => { if (v.price !== null || !fresh[id]) fresh[id] = v; });
  });
  // 2) если источник в этот раз ничего не дал — оставляем прошлое значение, а не затираем прочерком
  const next = { ...prev };
  Object.entries(fresh).forEach(([id, v]) => { if (v.price !== null || !next[id]) next[id] = v; });
  // 3) Urals: настоящего контракта с ценой нет — считаем оценку от Brent
  const urals = next.URALS;
  if (!urals || urals.price === null || urals.estimate) {
    const est = estimateUrals(next.BRENT, discount);
    if (est) next.URALS = est;
  }
  return next;
}

// Накладывает полученные значения на шаблон
export function mergeQuotes(template: Quote[], values: Values): Quote[] {
  return template.map((q) => ({ ...q, ...(values[q.id] ?? {}) }));
}

export function useQuotes() {
  const [values, setValues] = useState<Values>({});
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);
  const discountRef = useRef<UralsDiscount | null>(null);

  useEffect(() => {
    mounted.current = true;
    async function refresh() {
      // ЦБ первым: биржевые значения ниже перекрывают его, если у них есть цена
      const sources = [fetchCbr, fetchFx, fetchMetals, fetchIndex, fetchFutures, fetchCrypto];
      const discountPromise = discountRef.current ? Promise.resolve(discountRef.current) : fetchUralsDiscount();
      const results = await Promise.allSettled(sources.map((f) => f()));
      discountRef.current = await discountPromise;
      results.forEach((r, i) => { if (r.status === 'rejected') console.error(`[quotes] источник ${sources[i].name} упал:`, r.reason); });
      if (!mounted.current) return;
      setValues((prev) => combineValues(prev, results, discountRef.current));
      setIsLoading(false);
    }
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => { mounted.current = false; clearInterval(t); };
  }, []);

  return { main: mergeQuotes(MAIN, values), extra: mergeQuotes(EXTRA, values), isLoading };
}
