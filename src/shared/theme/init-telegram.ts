import { getTelegramWebApp } from '../../lib/telegram';

export function initTelegramTheme() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) {
      tg.setHeaderColor('secondary_bg_color');
    }
  }
}
