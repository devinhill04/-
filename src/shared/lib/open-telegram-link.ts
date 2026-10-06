import { triggerHaptic, getTelegramWebApp, isTelegramEnvironment } from '../../lib/telegram';
import { track } from './analytics';

// silent: true — не считать переход как открытие поста. Для новостей и графиков на вкладке «Рынок» у нас свои события,
// иначе они попадали бы в post_open и искажали воронки «тег → пост».
export function openPostLink(url: string, title?: string, opts?: { silent?: boolean }) {
  triggerHaptic('medium');
  if (!opts?.silent) track('post_open', { url, title });

  // 1. Inside Telegram Mini App client
  if (isTelegramEnvironment()) {
    const tg = getTelegramWebApp();
    if (tg) {
      if ((url.startsWith('https://t.me/') || url.startsWith('http://t.me/')) && tg.openTelegramLink) {
        tg.openTelegramLink(url);
        // Сворачиваем мини-апп после перехода. Раньше это ломало возврат "назад в мини-апп",
        // но мы выяснили: этот возврат и так не работает при реальном пути входа пользователя
        // (закреп в канале → чат с ботом → мини-апп) — любой вход через ссылку "портит" историю
        // навигации Telegram независимо от close(). Терять уже нечего, а close() хотя бы чётко
        // показывает, что клик сработал.
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
