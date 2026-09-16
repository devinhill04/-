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
        //
        // Небольшая задержка перед close() — без неё клиент Telegram иногда не
        // успевает обработать сам переход по ссылке (особенно когда мини-апп
        // запущен через прямую ссылку из канала, а не из чата с ботом), и
        // команда "закрыть" будто отменяет ещё не начавшуюся навигацию.
        setTimeout(() => tg.close?.(), 300);
        return;
      }
      if (tg.openLink) {
        tg.openLink(url);
        setTimeout(() => tg.close?.(), 300);
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
