import { useEffect, useRef, useState } from 'react';
import { Quote } from './types';

const ISS = 'https://iss.moex.com/iss';
const REFRESH_MS = 60_000;

type Block = { columns: string[]; data: unknown[][] } | undefined;
type Values = Record<string, { price: number | null; changePercent: number | null; source?: string; estimate?: boolean; decimals?: number }>;

// decimals = максимум знаков после запятой (лишние нули не показываем, как в макете)
// iconBox/iconCover — как картинка лежит в круге: размеры замерены по макету дизайнера
export const MAIN: Quote[] = [
  { id: 'USD', title: 'Доллар США', ticker: 'USD/RUB', badge: '$', iconSrc: '/figma_assets/quotes/USD.png', iconBox: 28, price: null, changePercent: null, unit: '₽', decimals: 4, source: 'Мосбиржа' },
  { id: 'EUR', title: 'Евро', ticker: 'EUR/RUB', badge: '€', iconSrc: '/figma_assets/quotes/EUR.png', iconBox: 28, price: null, changePercent: null, unit: '₽', decimals: 4, source: 'Мосбиржа' },
  { id: 'CNY', title: 'Китайский юань', ticker: 'CNY/RUB', badge: '¥', iconSrc: '/figma_assets/quotes/CNY.png', iconBox: 28, price: null, changePercent: null, unit: '₽', decimals: 4, source: 'Мосбиржа' },
  { id: 'IMOEX', title: 'Индекс Мосбиржи', ticker: 'IMOEX', badge: 'M', iconSrc: '/figma_assets/quotes/IMOEX.png', iconCover: true, price: null, changePercent: null, unit: 'пт.', decimals: 2, source: 'Мосбиржа' },
];

export const EXTRA: Quote[] = [
  { id: 'BRENT', title: 'Нефть Brent', ticker: 'BR · фьючерс', badge: 'BR', iconSrc: '/figma_assets/quotes/BRENT.png', iconBox: 37, price: null, changePercent: null, unit: '$', decimals: 2, source: 'Мосбиржа (ближайший фьючерс)' },
  { id: 'URALS', title: 'Нефть Urals', ticker: 'Urals · средняя за месяц', badge: 'UR', iconSrc: '/figma_assets/quotes/URALS.png', iconBox: 37, price: null, changePercent: null, unit: '$', decimals: 2, source: 'Минэкономразвития РФ: средняя цена за месяц' },
  { id: 'GOLD', title: 'Золото', ticker: 'GLDRUB · за грамм', badge: 'Au', iconSrc: '/figma_assets/quotes/GOLD.png', iconBox: 36, price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа (спот, ₽ за грамм)' },
  // иконки серебра в макете пока нет: когда появится файл, добавить iconSrc: '/figma_assets/quotes/SILVER.png'
  { id: 'SILVER', title: 'Серебро', ticker: 'SLVRUB · за грамм', badge: 'Ag', price: null, changePercent: null, unit: '₽', decimals: 2, source: 'Мосбиржа (спот, ₽ за грамм)' },
  { id: 'BTC', title: 'Bitcoin', ticker: 'BTC/USD', badge: '₿', iconSrc: '/figma_assets/quotes/BTC.png', iconBox: 28, price: null, changePercent: null, unit: '$', decimals: 2, source: 'CoinGecko' },
  { id: 'ETH', title: 'Ethereum', ticker: 'ETH/USD', badge: 'Ξ', iconSrc: '/figma_assets/quotes/ETH.png', iconBox: 40, price: null, changePercent: null, unit: '$', decimals: 2, source: 'CoinGecko' },
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

// ---------- Данные с сайта InvestFuture ----------
// Цены шести котировок (USD, EUR, CNY — курс ЦБ; IMOEX; BTC; ETH) берём с самого сайта, чтобы цифры в мини-аппе
// совпадали с сайтом. На каждой странице котировок внизу есть блок «Популярные» с ценами всех шести,
// поэтому хватает одного запроса. Запрос идёт через наш сервер (/api/if-quotes): у сайта нет заголовков CORS.
// Если вёрстка блока изменится и разобрать его не получится — остаются прежние источники (биржа, ЦБ, CoinGecko).
export const IF_SLUGS: Record<string, string> = {
  'currency-cb-usd': 'USD',
  'currency-cb-eur': 'EUR',
  'currency-cb-cny': 'CNY',
  'indices-moex-imoex': 'IMOEX',
  'crypto-btcusd': 'BTC',
  'crypto-ethusd': 'ETH',
};

export interface IfItem {
  id: string;
  price: number;
  changePercent: number;
  decimals: number;
  stamp: string;
}

const toNumber = (str: string): number | null => {
  const n = Number(str.replace(/[\s\u00a0\u202f\u2009]/g, '').replace(/[\u2212\u2013]/g, '-').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export function parseIfStrip(html: string): IfItem[] {
  const out: IfItem[] = [];
  const seen = new Set<string>();
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = /href="([^"]*)"/i.exec(m[1])?.[1] ?? '';
    const slug = /\/quotes\/([a-z0-9-]+)\/?(?:[?#].*)?$/i.exec(href)?.[1];
    const id = slug ? IF_SLUGS[slug] : undefined;
    if (!id || seen.has(id)) continue;
    // Теги заменяем на пробел, чтобы цена и процент не слиплись: «2 326,990.23» нельзя разобрать однозначно
    const text = m[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
    const mm = /(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₽|\$|руб\.?)?\s*([-\u2212\u2013+]?\d+(?:[.,]\d+)?)\s*%/.exec(text);
    if (!mm) continue; // ссылка на ту же котировку без цифр (меню, «Другие курсы») — пропускаем
    const price = toNumber(mm[1]);
    const change = toNumber(mm[2]);
    if (price === null || change === null) continue;
    const stamp = (/title="([^"]*)"/i.exec(m[1])?.[1] ?? '').trim();
    out.push({ id, price, changePercent: change, decimals: (mm[1].split(/[.,]/)[1] ?? '').length, stamp });
    seen.add(id);
  }
  return out;
}

function ifSourceLabel(id: string, stamp: string): string {
  const cb = id === 'USD' || id === 'EUR' || id === 'CNY';
  const date = /(\d{2}\.\d{2}\.\d{4})/.exec(stamp)?.[1];
  if (cb) return `InvestFuture: официальный курс ЦБ РФ${date ? ` на ${date}` : ''}`;
  return `InvestFuture${stamp ? `: данные на ${stamp}` : ''}`;
}

export async function fetchInvestfuture(): Promise<Values> {
  const res = await fetch('/api/if-quotes');
  if (!res.ok) throw new Error(`/api/if-quotes: ${res.status}`);
  const items = parseIfStrip(await res.text());
  console.log('[quotes/if] разобрано с сайта:', items);
  if (items.length === 0) throw new Error('блок «Популярные» не найден на странице — возможно, изменилась вёрстка сайта');
  const out: Values = {};
  items.forEach((it) => {
    out[it.id] = {
      price: it.price,
      changePercent: it.changePercent,
      decimals: Math.min(Math.max(it.decimals, 2), 4),
      source: ifSourceLabel(it.id, it.stamp),
    };
  });
  const missing = Object.values(IF_SLUGS).filter((id) => !out[id]);
  if (missing.length) console.warn('[quotes/if] на странице не нашлись:', missing, '— для них остаются прежние источники');
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

// ---------- Нефть Urals: средняя цена за месяц ----------
// У Urals нет биржевой котировки (старые фьючерсы UR торговались до 2012 г.). Официальную среднюю цену за истекший месяц
// публикует Минэкономразвития РФ в начале следующего (она нужна для расчёта НДПИ), СМИ повторяют её сразу.
// Число лежит в public/data/urals-monthly.json и обновляется правкой этого файла раз в месяц, без изменения кода.
export interface UralsMonthly {
  price: number; // $ за баррель
  previousPrice?: number; // за предыдущий месяц — для расчёта изменения
  period: string; // «сентябрь 2026»
  previousPeriod?: string; // «август 2026»
  publishedAt: string; // дата публикации ГГГГ-ММ-ДД — по ней считаем, не протухли ли данные
  source: string;
}

const MONTHLY_STALE_DAYS = 40; // публикация приходит в начале месяца, 10 дней запаса на обновление файла

const ruDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
};

export function uralsFromMonthly(m: UralsMonthly | null, now: Date = new Date()): Values[string] | null {
  if (!m || typeof m.price !== 'number' || !Number.isFinite(m.price)) return null;
  const change = typeof m.previousPrice === 'number' && m.previousPrice > 0 ? pct(m.price, m.previousPrice) : null;
  const ageDays = (now.getTime() - new Date(m.publishedAt).getTime()) / 864e5;
  const stale = Number.isFinite(ageDays) && ageDays > MONTHLY_STALE_DAYS;
  const source =
    `Средняя цена за ${m.period} — ${m.source}` +
    (change !== null && m.previousPeriod ? `. Изменение — к ${m.previousPeriod}` : '') +
    `. Публикуется раз в месяц (последняя — ${ruDate(m.publishedAt)}), это не котировка в реальном времени` +
    (stale ? `. ВНИМАНИЕ: данные не обновлялись более ${MONTHLY_STALE_DAYS} дней, новая цена уже должна быть опубликована` : '');
  return { price: m.price, changePercent: change, decimals: 2, source };
}

async function fetchUralsMonthly(): Promise<Values> {
  const res = await fetch('/data/urals-monthly.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`/data/urals-monthly.json: ${res.status}`);
  const v = uralsFromMonthly(await res.json());
  if (!v) throw new Error('urals-monthly.json: неверный формат (нужно число price)');
  return { URALS: v };
}

// Склеивает результаты источников с прошлыми значениями; чистая функция (тестируется отдельно)
export function combineValues(prev: Values, results: PromiseSettledResult<Values>[]): Values {
  // 1) свежие значения этого опроса: более поздний источник перекрывает ранний, но только если у него есть цена
  const fresh: Values = {};
  results.forEach((r) => {
    if (r.status !== 'fulfilled') return;
    Object.entries(r.value).forEach(([id, v]) => { if (v.price !== null || !fresh[id]) fresh[id] = v; });
  });
  // 2) если источник в этот раз ничего не дал — оставляем прошлое значение, а не затираем прочерком
  const next = { ...prev };
  Object.entries(fresh).forEach(([id, v]) => { if (v.price !== null || !next[id]) next[id] = v; });
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

  useEffect(() => {
    mounted.current = true;
    async function refresh() {
      // ЦБ первым: биржевые значения ниже перекрывают его; сайт InvestFuture последним: его цены перекрывают остальные
      const sources = [fetchCbr, fetchFx, fetchMetals, fetchIndex, fetchFutures, fetchCrypto, fetchUralsMonthly, fetchInvestfuture];
      const results = await Promise.allSettled(sources.map((f) => f()));
      results.forEach((r, i) => { if (r.status === 'rejected') console.error(`[quotes] источник ${sources[i].name} упал:`, r.reason); });
      if (!mounted.current) return;
      setValues((prev) => combineValues(prev, results));
      setIsLoading(false);
    }
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => { mounted.current = false; clearInterval(t); };
  }, []);

  return { main: mergeQuotes(MAIN, values), extra: mergeQuotes(EXTRA, values), isLoading };
}
