import { useState } from 'react';

/**
 * Заглушка проверки подписки пользователя на Telegram-канал.
 * При появлении бэкенда с ботом API getChatMember вызывается именно на сервере.
 */
export function useSubscriptionCheck() {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkSubscription = async (_userId?: number, _channelUsername?: string) => {
    setIsChecking(true);
    try {
      // Симуляция обращения к эндпоинту бэкенда
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSubscribed(true);
      return true;
    } catch {
      setIsSubscribed(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return { isSubscribed, isChecking, checkSubscription };
}
