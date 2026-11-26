import type { BondEvent, BondsPage, KeyRateEvent } from './types';

const validDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const toAmount = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

export function parseBondsApi(data: unknown): BondsPage {
  if (!isRecord(data) || !Array.isArray(data.events) || !(data.nextCursor === null || typeof data.nextCursor === 'string')) {
    throw new Error('Некорректный ответ календаря облигаций');
  }
  const events: BondEvent[] = data.events.map((item: unknown) => {
    if (!isRecord(item) || !validDate(item.date) || !['coupon', 'amortization', 'redemption'].includes(String(item.type))
      || typeof item.isin !== 'string' || typeof item.secid !== 'string' || typeof item.name !== 'string'
      || !['RUB', 'SUR'].includes(String(item.currency))) throw new Error('Некорректное событие облигации');
    const amount = toAmount(item.amount);
    if (amount === null || amount <= 0) throw new Error('Некорректная сумма купона или погашения');
    return { type: item.type as BondEvent['type'], isin: item.isin, name: item.name,
      amount, payDate: item.date, recordDate: validDate(item.recordDate) ? item.recordDate : null };
  });
  return { events, totalEvents: null, page: null, totalPages: null, nextCursor: data.nextCursor };
}

export function parseKeyRateApi(data: unknown): KeyRateEvent[] {
  if (!isRecord(data) || !Array.isArray(data.events)) throw new Error('Некорректный ответ календаря ставки');
  return data.events.map((item: unknown) => {
    if (!isRecord(item) || !validDate(item.date) || !['meeting', 'summary'].includes(String(item.kind))
      || typeof item.title !== 'string') throw new Error('Некорректное событие ключевой ставки');
    const isMeeting = item.kind === 'meeting';
    const time = isMeeting && isRecord(data.nextMeeting) && data.nextMeeting.date === item.date
      && typeof data.nextMeeting.decisionTime === 'string' ? ` · решение около ${data.nextMeeting.decisionTime} МСК` : '';
    return { date: item.date, title: item.title,
      label: isMeeting ? 'Заседание ЦБ' : 'Резюме обсуждения',
      description: `${isMeeting ? 'Ожидается решение по ключевой ставке' : 'Публикация резюме обсуждения'}${time}` };
  });
}

export type DividendStatus = 'confirmed' | 'recommended' | 'forecast' | 'canceled' | 'unknown';
export interface DividendCalendarEvent {
  eventKey: string;
  date: string;
  ticker: string;
  name: string;
  amount: number | null;
  recordDate: string | null;
  buyBeforeDate: string | null;
  paymentDeadline: string | null;
  period: string;
  status: DividendStatus;
  forecast: Record<'amount' | 'recordDate' | 'buyBeforeDate' | 'paymentDeadline', boolean>;
  sourceUrl: string;
}
export function parseDividendsApi(data: unknown): { events: DividendCalendarEvent[]; nextCursor: string | null } {
  if (!isRecord(data) || !Array.isArray(data.events)
      || !(data.nextCursor === null || typeof data.nextCursor === 'string')) {
    throw new Error('Некорректный ответ календаря дивидендов');
  }
  const events: DividendCalendarEvent[] = data.events.map((item: unknown) => {
    if (!isRecord(item) || !validDate(item.date) || typeof item.eventKey !== 'string'
        || typeof item.ticker !== 'string' || typeof item.name !== 'string'
        || !['confirmed', 'recommended', 'forecast', 'canceled', 'unknown'].includes(String(item.status))) {
      throw new Error('Некорректное дивидендное событие');
    }
    const v = isRecord(item.forecast) ? item.forecast : {};
    return {
      eventKey: item.eventKey, date: item.date, ticker: item.ticker, name: item.name,
      amount: item.amount == null ? null : toAmount(item.amount),
      recordDate: validDate(item.recordDate) ? item.recordDate : null,
      buyBeforeDate: validDate(item.buyBeforeDate) ? item.buyBeforeDate : null,
      paymentDeadline: validDate(item.paymentDeadline) ? item.paymentDeadline : null,
      period: typeof item.period === 'string' ? item.period : '',
      status: item.status as DividendStatus,
      forecast: {
        amount: v.amount === true, recordDate: v.recordDate === true,
        buyBeforeDate: v.buyBeforeDate === true, paymentDeadline: v.paymentDeadline === true,
      },
      sourceUrl: typeof item.sourceUrl === 'string' && /^https:\/\//.test(item.sourceUrl) ? item.sourceUrl : 'https://investfuture.ru/calendar/dividends',
    };
  });
  return { events, nextCursor: data.nextCursor };
}
