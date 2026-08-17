import { TELEGRAM_CHANNEL } from '../config/channel';
import { track } from './analytics';
import { openPostLink } from './open-telegram-link';

export function openTelegramTagSearch(tags: string[], channelUsername: string = TELEGRAM_CHANNEL.username) {
  if (!tags || tags.length === 0) return;

  track('tag_search_telegram', { tags, channelUsername });

  // Format: t.me/ChannelUsername?q=#tag1@ChannelUsername%20#tag2@ChannelUsername
  const formattedTags = tags.map((t) => {
    const cleanTag = t.startsWith('#') ? t.slice(1) : t;
    return `#${cleanTag}@${channelUsername}`;
  });

  const queryStr = encodeURIComponent(formattedTags.join(' '));
  const searchUrl = `https://t.me/${channelUsername}?q=${queryStr}`;

  openPostLink(searchUrl, `Поиск по тегам: ${tags.join(', ')}`);
}
