import { TelegramUser, TelegramWebAppTheme } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const mockUser: TelegramUser = {
  id: 87654321,
  first_name: 'Алексей',
  last_name: 'Смирнов',
  username: 'alex_dev',
  language_code: 'ru',
  is_premium: true,
  photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
};

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isTelegramEnvironment(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData && tg.initData !== '');
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.enableClosingConfirmation();
    } catch {
      // Ignored if unsupported on older clients
    }
  }
}

export function getTelegramUser(): TelegramUser {
  const tg = getTelegramWebApp();
  if (tg && tg.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return mockUser;
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error' = 'medium') {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    if (['success', 'warning', 'error'].includes(type)) {
      tg.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error');
    } else {
      tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
    }
  } else {
    // Web fallback notification console/vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }
}

export function openTelegramLink(url: string) {
  const tg = getTelegramWebApp();
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

export function closeTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg?.close) {
    tg.close();
  } else {
    alert('Приложение закрылось бы в Telegram!');
  }
}
