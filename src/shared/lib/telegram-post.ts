export interface TelegramPostRef {
  channel: string;
  id: number;
}

// Только публичные каналы: у них есть имя. Встроенный просмотр Telegram работает только для публичных
// каналов и групп. Ссылки вида t.me/c/123/45 (закрытые) и t.me/+abc (приглашения) сюда не попадают —
// их открываем в самом Telegram, как раньше.
const POST_RE = /^https?:\/\/(?:www\.)?t\.me\/(?:s\/)?([A-Za-z][A-Za-z0-9_]{3,31})\/(\d+)\/?(?:[?#].*)?$/;

export function parseTelegramPost(url: string): TelegramPostRef | null {
  const m = POST_RE.exec((url || '').trim());
  if (!m) return null;
  return { channel: m[1], id: Number(m[2]) };
}

// Адрес встроенного просмотра — тот же, что строит официальный скрипт Telegram (telegram-widget.js)
export function embedUrl(post: TelegramPostRef, dark: boolean): string {
  return `https://t.me/${post.channel}/${post.id}?embed=1${dark ? '&dark=1' : ''}`;
}

// Встроенный просмотр сообщает родителю свою высоту: JSON {"event":"resize","height":N}
export function parseEmbedMessage(data: unknown): { height?: number } | null {
  if (typeof data !== 'string') return null;
  try {
    const d = JSON.parse(data);
    if (d && d.event === 'resize' && typeof d.height === 'number' && d.height > 0 && d.height < 20000) return { height: Math.ceil(d.height) };
    return {};
  } catch {
    return null;
  }
}

// Имя события из сообщения встроенного просмотра: resize, ready, visible_off ...
export function embedEventName(data: unknown): string | null {
  if (typeof data !== 'string') return null;
  try {
    const d = JSON.parse(data);
    return d && typeof d.event === 'string' ? d.event : null;
  } catch {
    return null;
  }
}

// Идентификатор рамки так же, как его строит официальный скрипт Telegram: telegram-post-<канал>-<номер>
export function embedFrameId(post: TelegramPostRef): string {
  return `telegram-post-${`${post.channel}/${post.id}`.replace(/[^a-z0-9_]/gi, '-')}`;
}
