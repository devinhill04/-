import { triggerHaptic } from '../../lib/telegram';

export type AnalyticsEventType =
  // Сессия и жизненный цикл
  | 'app_init'
  | 'session_start'
  | 'session_heartbeat'
  | 'session_end'
  // Экраны и вкладки
  | 'screen_view'
  | 'category_select'
  | 'theme_toggle'
  // Теги и фильтры
  | 'tag_click'
  | 'tag_search_telegram'
  | 'tag_filter_clear'
  // Сущности ленты (Post, Material, Banner)
  | 'post_card_view'
  | 'post_open'
  | 'post_tag_click'
  | 'material_open'
  | 'banner_click'
  | 'ad_banner_click'
  | 'lead_magnet_open'
  | 'lead_magnet_submit'
  | 'if_plus_subscription_cta'
  // Ресурсы экосистемы InvestFuture
  | 'resources_sheet_open'
  | 'resources_sheet_close'
  | 'resources_platform_filter'
  | 'resources_search'
  | 'external_channel_click'
  // Боли и Решения
  | 'pain_selected'
  | 'pain_solution_open'
  | 'pain_solution_dismiss'
  | 'search_clear'
  | 'search_input'
  | 'search_empty_results';

export interface AnalyticsPayload {
  [key: string]: any;
}

export interface AnalyticsEventRecord {
  id: string;
  event: AnalyticsEventType;
  timestamp: number;
  timeSpentMs?: number;
  userId?: string | number;
  username?: string;
  firstName?: string;
  platform?: string;
  colorScheme?: string;
  payload?: AnalyticsPayload;
}

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error';

class AnalyticsServiceImpl {
  private storageKey = 'if_miniapp_analytics_events';
  private sessionStorageKey = 'if_miniapp_session_id';
  private sessionStart = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSession();
    }
  }

  public getSessionId(): string {
    if (typeof window === 'undefined') return 'server_session';
    let sid = sessionStorage.getItem(this.sessionStorageKey);
    if (!sid) {
      sid = 'if_sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem(this.sessionStorageKey, sid);
    }
    return sid;
  }

  public getTelegramUser() {
    if (typeof window === 'undefined') return {};
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    return {
      userId: user?.id || 'guest',
      username: user?.username || 'anonymous',
      firstName: user?.first_name || '',
      languageCode: user?.language_code || 'ru',
      platform: tg?.platform || 'browser',
      colorScheme: tg?.colorScheme || 'dark',
    };
  }

  public initSession() {
    this.sessionStart = Date.now();
    this.track('app_init');
    this.track('session_start', { timestamp: this.sessionStart });
  }

  public track(
    event: AnalyticsEventType,
    payload?: AnalyticsPayload,
    options?: { haptic?: HapticFeedbackType }
  ) {
    if (typeof window === 'undefined') return;

    if (options?.haptic) {
      triggerHaptic(options.haptic);
    }

    const user = this.getTelegramUser();
    const sessionId = this.getSessionId();

    const record: AnalyticsEventRecord = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      event,
      timestamp: Date.now(),
      timeSpentMs: Date.now() - this.sessionStart,
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      platform: user.platform,
      colorScheme: user.colorScheme,
      payload: {
        sessionId,
        ...payload,
      },
    };

    console.debug(`📊 [InvestFuture Analytics] ${event}`, record);
    this.persistEvent(record);

    // Поддержка Google Analytics / Яндекс Метрики
    if ((window as any).ym) {
      (window as any).ym(12345678, 'reachGoal', event, payload);
    }
    if ((window as any).gtag) {
      (window as any).gtag('event', event, payload);
    }
  }

  public trackTagClick(tag: string, source: string = 'tag_cloud') {
    this.track('tag_click', { tag, source }, { haptic: 'light' });
  }

  public trackPostOpen(post: { id: string; title: string; url: string; channel?: string }) {
    this.track('post_open', { postId: post.id, title: post.title, url: post.url, channel: post.channel }, { haptic: 'light' });
  }

  public trackMaterialOpen(material: { id: string; title: string; format: string; url: string }) {
    this.track('material_open', { materialId: material.id, title: material.title, format: material.format, url: material.url }, { haptic: 'medium' });
  }

  public trackBannerClick(banner: { id: string; title: string; url: string }) {
    this.track('banner_click', { bannerId: banner.id, title: banner.title, url: banner.url }, { haptic: 'medium' });
  }

  public trackIfPlusConversion(source: string = 'feed_banner') {
    this.track('if_plus_subscription_cta', { source, product: 'IF+ Subscription' }, { haptic: 'heavy' });
  }

  public trackChannelClick(channel: { name: string; url: string; platform: string }) {
    this.track('external_channel_click', { name: channel.name, url: channel.url, platform: channel.platform }, { haptic: 'light' });
  }

  public trackScreenView(screenName: string) {
    this.track('screen_view', { screenName }, { haptic: 'light' });
  }

  private persistEvent(record: AnalyticsEventRecord) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const list: AnalyticsEventRecord[] = raw ? JSON.parse(raw) : [];
      list.push(record);
      if (list.length > 300) list.shift();
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch {
      // quota or private mode safe
    }
  }

  public getStoredEvents(): AnalyticsEventRecord[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const AnalyticsService = new AnalyticsServiceImpl();
export const track = (event: AnalyticsEventType, payload?: AnalyticsPayload) => AnalyticsService.track(event, payload);
export const getStoredAnalytics = () => AnalyticsService.getStoredEvents();
