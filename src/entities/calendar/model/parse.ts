import { BondEvent, BondEventType, BondsPage, KeyRateEvent } from './types';
import { ruToIso } from './dates';

// Календари берутся с сайта InvestFuture: страницы приходят готовым HTML, поэтому разбираем текст страницы.
// Если вёрстка сайта изменится и разобрать не получится, экран покажет ссылку на сайт (см. calendar-screen).
// Надёжнее — отдельный JSON-эндпоинт от сайта: тогда достаточно заменить api.ts, остальное не меняется.
//
// Нарочно без возможностей, которых нет в старых WebView (например, lookbehind в регулярных выражениях):
// синтаксическая ошибка в одном таком выражении роняет весь бандл, а не только календарь.

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (!Number.isFinite(code)) return m;
      return code === 160 ? ' ' : String.fromCodePoint(code);
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// HTML → одна строка текста. Границы тегов превращаются в пробелы, чтобы соседние поля не слипались
// («137,94 ₽» и «на одну бумагу» из разных элементов). Комментарии React (<!-- -->) убираются без пробела.
export function htmlToText(html: string, markHeadings = false): string {
  let h = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
  if (markHeadings) h = h.replace(/<h[2-4]\b[^>]*>/gi, ' ⟦T⟧ ').replace(/<\/h[2-4]>/gi, ' ⟦/T⟧ ');
  h = h.replace(/<[^>]+>/g, ' ');
  return decodeEntities(h).replace(/\s+/g, ' ').trim();
}

const toNumber = (s: string): number | null => {
  const n = Number(s.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const TYPE_MAP: Record<string, BondEventType> = { Купон: 'coupon', Амортизация: 'amortization', Погашение: 'redemption' };

// Группы: «08.10.2026 14 выплат»
const GROUP_RE = /(\d{2}\.\d{2}\.\d{4})\s*(\d+)\s+выплат[а-я]*/g;

// Событие: «Купон SELGOLD002 RU000A106XD7 · RU000A106XD7 137,94 ₽ на одну бумагу Дата фиксации 07.10.2026».
// Название не может содержать слова-типы, иначе подписи фильтров («Амортизация Погашения …») склеились бы
// с первым событием в одно длинное название.
const EVENT_RE =
  /(^|[^А-Яа-яЁё])(Купон|Амортизация|Погашение)(?![А-Яа-яЁё])\s+((?:(?!Купон|Амортизаци|Погашени|выплат).){1,80}?)\s+([A-Z]{2}[0-9A-Z]{10})(?:\s*·\s*\S+)?\s+(\d[\d ]*[.,]\d{2})\s*₽\s*на одну бумагу\s*Дата фиксации\s*(\d{2}\.\d{2}\.\d{4}|—)/g;

export function parseBondsPage(html: string): BondsPage {
  const text = htmlToText(html);

  const groups: { index: number; iso: string }[] = [];
  for (const m of text.matchAll(GROUP_RE)) groups.push({ index: m.index ?? 0, iso: ruToIso(m[1]) });

  const events: BondEvent[] = [];
  for (const m of text.matchAll(EVENT_RE)) {
    const at = m.index ?? 0;
    let group: { index: number; iso: string } | undefined;
    for (const g of groups) if (g.index < at) group = g; // последняя группа перед событием
    const amount = toNumber(m[5]);
    if (!group || amount === null) continue;
    events.push({
      type: TYPE_MAP[m[2]],
      name: m[3].trim(),
      isin: m[4],
      amount,
      payDate: group.iso,
      recordDate: m[6] === '—' ? null : ruToIso(m[6]),
    });
  }

  const total = /(\d[\d ]*)\s+событ/.exec(text);
  const pg = /Страница\s+(\d+)\s+из\s+(\d+)/.exec(text);
  return {
    events,
    totalEvents: total ? toNumber(total[1]) : null,
    page: pg ? Number(pg[1]) : null,
    totalPages: pg ? Number(pg[2]) : null,
  };
}

// Календарь ключевой ставки: у каждого события дата, короткая подпись, заголовок (h3) и описание
export function parseKeyRatePage(html: string): KeyRateEvent[] {
  let text = htmlToText(html, true);
  const from = text.indexOf('Предстоящие события');
  if (from >= 0) text = text.slice(from);
  const to = text.indexOf('Источник:');
  if (to >= 0) text = text.slice(0, to);

  const re =
    /(\d{2}\.\d{2}\.\d{4})\s+([^⟦]{1,60}?)\s*⟦T⟧\s*(.*?)\s*⟦\/T⟧\s*([\s\S]*?)(?=\s+\d{2}\.\d{2}\.\d{4}\s+[^⟦]{1,60}?\s*⟦T⟧|$)/g;
  const out: KeyRateEvent[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(re)) {
    const ev: KeyRateEvent = { date: ruToIso(m[1]), label: m[2].trim(), title: m[3].trim(), description: m[4].trim() };
    const key = `${ev.date}|${ev.title}`;
    if (!ev.title || seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}
