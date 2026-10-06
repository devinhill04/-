// «Приложения» внутри одного мини-аппа Telegram. Переключаются через меню по клику на логотип в шапке.
// Новое приложение = ещё одна запись здесь + JSON с контентом (его делает scripts/xlsx-to-app-content.py).
export interface MiniApp {
  id: string;
  title: string;
  subtitle: string;
  iconSrc: string;
  // 'main'    — основное приложение (теги, готовые решения, рынок)
  // 'catalog' — карточки «Готовых решений» из JSON (contentUrl)
  kind: 'main' | 'catalog';
  contentUrl?: string;
  gridTitle?: string; // заголовок над карточками, по умолчанию «Навигатор по вашим задачам»
  gridSubtitle?: string;
}

export const DEFAULT_APP_ID = 'navigation';

export const MINI_APPS: MiniApp[] = [
  {
    id: 'navigation',
    title: 'InvestFuture',
    subtitle: 'Каталог полезных материалов',
    iconSrc: '/figma_assets/fill_ad6b082b617a802b8358b6de4c2b025b81969cdc.png',
    kind: 'main',
  },
  {
    id: 'jobs',
    title: 'Работа не рабство',
    subtitle: 'Работа и заработок',
    iconSrc: '/figma_assets/fill_57395bbcb316c014e24a2ed38a60c9d5f8ebe118.png',
    kind: 'catalog',
    contentUrl: '/data/apps/jobs.json',
  },
];

// Если в памяти устройства остался id приложения, которого уже нет — возвращаем основное
export function resolveAppId(id: string | null | undefined, apps: MiniApp[] = MINI_APPS): string {
  return apps.some((a) => a.id === id) ? (id as string) : DEFAULT_APP_ID;
}

const KEY = 'if_miniapp_current_app_v1';

export function loadCurrentAppId(apps: MiniApp[] = MINI_APPS): string {
  try {
    return resolveAppId(localStorage.getItem(KEY), apps);
  } catch {
    return DEFAULT_APP_ID;
  }
}

export function saveCurrentAppId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // память недоступна — не критично
  }
}
