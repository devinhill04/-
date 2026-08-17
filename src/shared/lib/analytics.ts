export type AnalyticsEvent =
  // Жизненный цикл сессии
  | 'app_init'
  | 'session_start'
  | 'session_heartbeat'
  | 'session_end'
  
  // Навигация и экраны
  | 'screen_view'
  | 'category_select'
  | 'theme_toggle'
  
  // Поиск и фильтры
  | 'search_input'
  | 'search_clear'
  | 'search_empty_results'
  | 'tag_click'
  | 'tag_search_telegram'
  | 'tag_filter_clear'
  
  // Посты и карточки
  | 'post_card_view'
  | 'post_open'
  | 'post_tag_click'
  
  // Промо, Баннеры и Лид-магнит
  | 'banner_click'
  | 'lead_magnet_open'
  | 'lead_magnet_submit'
  | 'ad_banner_click'
  
  // Экосистема ресурсов
  | 'resources_sheet_open'
  | 'resources_sheet_close'
  | 'resources_platform_filter'
  | 'resources_search'
  | 'external_channel_click'
  
  // Проблемы и решения (Интерактивный помощник)
  | 'pain_selected'
  | 'pain_solution_open'
  | 'pain_solution_dismiss';

export interface AnalyticsPayload {
  [key: string]: any;
}

export interface AnalyticsEventRecord {
  id: string;
  event: AnalyticsEvent;
  timestamp: number;
  timeSpentMs?: number;
  userId?: string | number;
  username?: string;
  platform?: string;
  payload?: AnalyticsPayload;
}

const STORAGE_KEY = 'if_miniapp_analytics_events';
const SESSION_STORAGE_KEY = 'if_miniapp_session_id';

// Генерируем или получаем ID сессии
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

// Получаем Telegram данные пользователя
export function getTelegramUserInfo() {
  if (typeof window === 'undefined') return {};
  const tg = (window as any).Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  return {
    userId: user?.id || 'guest',
    username: user?.username || 'anonymous',
    firstName: user?.first_name || '',
    languageCode: user?.language_code || 'ru',
    platform: tg?.platform || 'web',
    colorScheme: tg?.colorScheme || 'dark'
  };
}

// Сохраняем локальный лог событий (для передачи в БД, Google Sheets, DataLens или Webhook)
function persistEvent(eventRecord: AnalyticsEventRecord) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: AnalyticsEventRecord[] = raw ? JSON.parse(raw) : [];
    list.push(eventRecord);
    // Держим последние 300 событий в буфере
    if (list.length > 300) list.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore localstorage quota limits
  }
}

// Главная функция трекинга
export function track(event: AnalyticsEvent, payload?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;

  const userInfo = getTelegramUserInfo();
  const sessionId = getSessionId();

  const record: AnalyticsEventRecord = {
    id: 'evt_' + Math.random().toString(36).substring(2, 9),
    event,
    timestamp: Date.now(),
    userId: userInfo.userId,
    username: userInfo.username,
    platform: userInfo.platform,
    payload: {
      sessionId,
      ...payload
    }
  };

  // 1. Консольный дебаг
  console.debug(`📊 [Analytics] ${event}`, record);

  // 2. Локальный буфер (можно выгружать или слать на бэкенд)
  persistEvent(record);

  // 3. Интеграция с Яндекс.Метрикой (если подключен счетчик)
  if ((window as any).ym) {
    (window as any).ym(12345678, 'reachGoal', event, payload);
  }

  // 4. Интеграция с Google Analytics 4 (gtag)
  if ((window as any).gtag) {
    (window as any).gtag('event', event, payload);
  }

  // 5. Отправка в собственный Webhook / Collector (если задан эндпоинт)
  const webhookUrl = (import.meta as any).env?.VITE_ANALYTICS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        mode: 'cors',
        keepalive: true
      }).catch(() => {});
    } catch (e) {
      // silent
    }
  }
}

// Экспорт накопленных аналитических данных (для выгрузки в CSV, Google Sheets или DataLens)
export function getStoredAnalytics(): AnalyticsEventRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
