// Личная автосортировка тегов: теги, которые человек открывает чаще всего, поднимаются в начало ЕГО списка.
// Не зависит от Метрики и от сервера — всё хранится на устройстве. Общая (для всех) сортировка из
// public/data/tag-popularity.json остаётся основой: личные теги ставятся перед ней, остальное — по ней.

const KEY = 'if_tag_usage_v1';
const DAY = 864e5;
const HALVE_AFTER_DAYS = 30; // раз в месяц счётчики уполовиниваются, чтобы список подстраивался под новые интересы
const PERSONAL_TOP = 3; // сколько личных тегов поднимаем: больше — и список перестанет быть узнаваемым
const PERSONAL_MIN_CLICKS = 2; // один случайный клик тег не поднимает

export interface TagUsage {
  counts: Record<string, number>; // ключ — тег без «#»
  halvedAt: number;
}

const clean = (tag: string) => tag.replace(/^#/, '');

const empty = (now: number): TagUsage => ({ counts: {}, halvedAt: now });

export function loadTagUsage(now: number = Date.now()): TagUsage {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object' || typeof raw.counts !== 'object' || raw.counts === null) return empty(now);
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw.counts)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) counts[k] = v;
    const halvedAt = typeof raw.halvedAt === 'number' ? raw.halvedAt : now;
    return applyDecay({ counts, halvedAt }, now);
  } catch {
    return empty(now);
  }
}

export function applyDecay(u: TagUsage, now: number): TagUsage {
  if (now - u.halvedAt < HALVE_AFTER_DAYS * DAY) return u;
  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(u.counts)) {
    const half = Math.floor(v / 2);
    if (half > 0) counts[k] = half;
  }
  return { counts, halvedAt: now };
}

// Записывает клик. В порядок ТЕКУЩЕЙ сессии он не вмешивается (список не должен прыгать под пальцем) —
// учтётся при следующем открытии приложения.
export function recordTagClick(tag: string, now: number = Date.now()) {
  try {
    const u = loadTagUsage(now);
    const k = clean(tag);
    u.counts[k] = (u.counts[k] ?? 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(u));
  } catch {
    // хранилище недоступно или переполнено — не критично
  }
}

interface OrderOptions {
  priorityTag: string; // всегда первый (#Инвестидея)
  globalOrder: string[]; // общая популярность (без «#»), может быть пустой
  usage: TagUsage;
}

export function orderTags(tags: string[], { priorityTag, globalOrder, usage }: OrderOptions): string[] {
  const original = new Map(tags.map((t, i) => [t, i]));
  const globalIdx = (t: string) => {
    const i = globalOrder.indexOf(clean(t));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const personal = tags
    .filter((t) => t !== priorityTag && (usage.counts[clean(t)] ?? 0) >= PERSONAL_MIN_CLICKS)
    .sort((a, b) => usage.counts[clean(b)] - usage.counts[clean(a)] || (original.get(a)! - original.get(b)!))
    .slice(0, PERSONAL_TOP);
  const personalSet = new Set(personal);
  const rest = tags
    .filter((t) => t !== priorityTag && !personalSet.has(t))
    .sort((a, b) => globalIdx(a) - globalIdx(b) || (original.get(a)! - original.get(b)!));
  return [...(tags.includes(priorityTag) ? [priorityTag] : []), ...personal, ...rest];
}
