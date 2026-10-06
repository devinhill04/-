// Список мини-аппов InvestFuture для меню в шапке (клик по логотипу слева сверху).
// Чтобы добавить новое приложение — допишите объект в MINI_APPS: название, подпись, иконка и ссылка t.me/<бот>/<короткое_имя>.
export interface MiniApp {
  id: string;
  title: string;
  subtitle: string;
  iconSrc: string;
  url: string; // прямая ссылка на мини-апп в Telegram; у текущего приложения не нужна
  current?: boolean; // это приложение, в котором пользователь сейчас
  demo?: boolean; // пример для разработки: показывается только в npm run dev
}

export const MINI_APPS: MiniApp[] = [
  {
    id: 'navigation',
    title: 'InvestFuture',
    subtitle: 'Каталог полезных материалов',
    iconSrc: '/figma_assets/fill_ad6b082b617a802b8358b6de4c2b025b81969cdc.png',
    url: '',
    current: true,
  },
  // Сюда добавляются новые мини-аппы, например:
  // { id: 'market', title: 'Рынок', subtitle: 'Котировки и карта рынка', iconSrc: '/figma_assets/apps/market.png', url: 'https://t.me/if_miniapp_bot/market' },
];

// Примеры для просмотра меню при разработке — в боевой сборке их нет
export const DEMO_MINI_APPS: MiniApp[] = [
  { id: 'demo-1', title: 'Пример: новое приложение', subtitle: 'Так будет выглядеть строка', iconSrc: MINI_APPS[0].iconSrc, url: '', demo: true },
  { id: 'demo-2', title: 'Пример: ещё одно', subtitle: 'Длинную подпись обрезаем до одной строки, чтобы меню не разъезжалось', iconSrc: MINI_APPS[0].iconSrc, url: '', demo: true },
  { id: 'demo-3', title: 'Пример: третье', subtitle: 'Список можно листать', iconSrc: MINI_APPS[0].iconSrc, url: '', demo: true },
  { id: 'demo-4', title: 'Пример: четвёртое', subtitle: 'Проверка прокрутки', iconSrc: MINI_APPS[0].iconSrc, url: '', demo: true },
  { id: 'demo-5', title: 'Пример: пятое', subtitle: 'Проверка прокрутки', iconSrc: MINI_APPS[0].iconSrc, url: '', demo: true },
];

// Что показывать в меню. Если приложение всего одно (боевой режим, пока нет второго) —
// возвращает его одно, и шапка работает по-старому: клик по логотипу ведёт на главный экран.
export function visibleMiniApps(apps: MiniApp[], demoApps: MiniApp[], isDev: boolean): MiniApp[] {
  return isDev ? [...apps, ...demoApps] : apps;
}
