import { triggerHaptic, getTelegramWebApp, isTelegramEnvironment } from '../../lib/telegram';
import { track } from './analytics';

export function openPostLink(url: string, title?: string) {
  triggerHaptic('medium');
  track('post_open', { url, title });

  // 1. Inside Telegram Mini App client
  if (isTelegramEnvironment()) {
    const tg = getTelegramWebApp();
    if (tg) {
      if ((url.startsWith('https://t.me/') || url.startsWith('http://t.me/')) && tg.openTelegramLink) {
        tg.openTelegramLink(url);
        // Сворачиваем мини-апп сразу после перехода — иначе, если зашли из канала
        // (не из диалога с ботом), приложение остаётся поверх экрана и выглядит
        // как будто "зависло", пока пользователь не свернёт его вручную свайпом.
        tg.close?.();
        return;
      }
      if (tg.openLink) {
        tg.openLink(url);
        tg.close?.();
        return;
      }
    }
  }

  // 2. Standard Web Browser / AI Studio preview iframe fallback
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
