// Прямые ссылки на разделы мини-аппа: https://t.me/<бот>/<приложение>?startapp=<раздел>__<источник>
// Telegram передаёт значение startapp в Telegram.WebApp.initDataUnsafe.start_param. Разрешены только
// латиница, цифры, «_» и «-» (до 64 знаков), поэтому русские теги и названия переводятся в латиницу (tagSlug).
//   market                    — вкладка «Рынок»
//   tags / solutions          — «Поиск по тегам» / «Готовые решения»
//   tag-<тег>                 — сразу выбранный тег: tag-investideya для #Инвестидея
//   pain-<карточка>           — сразу открытая карточка «Готовых решений»: pain-personal_finance
//   …__<источник>             — метка, откуда пришли (пост, рассылка): market__rassylka_nov
// Неизвестный раздел — мини-апп открывается как обычно.

const TRANSLIT: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };

// «#Инвестидея» → «investideya»; одинаковые правила в приложении и в скрипте ссылок для редакторов
export function tagSlug(tag: string): string {
  return [...tag.replace(/^#/, '').toLowerCase()].map((c) => TRANSLIT[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

export type DeepLinkIntent =
  | { kind: 'market' }
  | { kind: 'feed'; tab: 'catalog' | 'solutions'; tagSlug?: string; painSlug?: string };

export interface DeepLink {
  route: string;
  source: string | null;
  intent: DeepLinkIntent | null;
}

const VALID = /^[A-Za-z0-9_-]{1,64}$/;

export function parseStartParam(param: string | null | undefined): DeepLink | null {
  if (!param || !VALID.test(param)) return null;
  const [route, ...rest] = param.split('__');
  const source = rest.join('__') || null;
  let intent: DeepLinkIntent | null = null;
  if (route === 'market') intent = { kind: 'market' };
  else if (route === 'tags') intent = { kind: 'feed', tab: 'catalog' };
  else if (route === 'solutions') intent = { kind: 'feed', tab: 'solutions' };
  else if (route.startsWith('tag-') && route.length > 4) intent = { kind: 'feed', tab: 'catalog', tagSlug: route.slice(4) };
  else if (route.startsWith('pain-') && route.length > 5) intent = { kind: 'feed', tab: 'solutions', painSlug: route.slice(5) };
  return { route, source, intent };
}

// Откуда взять параметр: из Telegram, а в обычном браузере (для проверки) — из адреса ?startapp=… или ?tgWebAppStartParam=…
export function readStartParam(): string | null {
  const tg = (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null) as any;
  if (tg?.initDataUnsafe?.start_param) return String(tg.initDataUnsafe.start_param);
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  return q.get('tgWebAppStartParam') || q.get('startapp') || h.get('tgWebAppStartParam');
}

// Прямую ссылку применяем один раз за запуск: дальше человек ходит по приложению сам
let consumed = false;
let pendingTagSlug: string | null = null;

export function takeDeepLink(): DeepLink | null {
  if (consumed) return null;
  consumed = true;
  const link = parseStartParam(readStartParam());
  if (link?.intent?.kind === 'feed' && link.intent.tagSlug) pendingTagSlug = link.intent.tagSlug;
  return link;
}

// Тег из ссылки выбирается, когда загрузится список тегов (он строится из постов)
export function takePendingTag(availableTags: string[]): string | null {
  if (!pendingTagSlug || availableTags.length === 0) return null;
  const found = availableTags.find((t) => tagSlug(t) === pendingTagSlug) ?? null;
  pendingTagSlug = null;
  return found;
}

export function _resetDeepLink() {
  consumed = false;
  pendingTagSlug = null;
}
