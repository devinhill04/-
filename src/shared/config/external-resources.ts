export type PlatformType = "all" | "telegram" | "max" | "vk" | "youtube" | "rutube";

export interface ExternalResource {
  id: string;
  name: string;
  handle?: string;
  description: string;
  url: string;
  badge?: string;
  platform: Exclude<PlatformType, "all">;
  category: string;
}

export const PLATFORMS_CONFIG = [
  { id: "all", name: "Все", iconName: "Grid" },
  { id: "telegram", name: "Telegram", iconName: "Send" },
  { id: "max", name: "MAX", iconName: "Sparkles" },
  { id: "vk", name: "ВКонтакте", iconName: "Share2" },
  { id: "youtube", name: "YouTube", iconName: "Tv" },
  { id: "rutube", name: "RuTube", iconName: "PlayCircle" },
] as const;

export const EXTERNAL_RESOURCES: ExternalResource[] = [
  // --- TELEGRAM ---
  {
    id: "tg_investfuture",
    name: "InvestFuture",
    handle: "@investfuture",
    description: "Главный Telegram-канал об инвестициях, личных финансах и экономике",
    url: "https://t.me/investfuture",
    badge: "Главный",
    platform: "telegram",
    category: "Инвестиции и финансы"
  },
  {
    id: "tg_if_plus",
    name: "IF+ Подписка",
    handle: "@plus_investfuture",
    description: "Эксклюзивная аналитика, готовые инвест-идеи и приватные разборы",
    url: "https://t.me/plus_investfuture",
    badge: "IF+",
    platform: "telegram",
    category: "Премиум"
  },
  {
    id: "tg_if_news",
    name: "IF News",
    handle: "@if_market_news",
    description: "Оперативные новости рынков, макроэкономика и главные события дня",
    url: "https://t.me/if_market_news",
    badge: "Новости",
    platform: "telegram",
    category: "Новости рынков"
  },
  {
    id: "tg_if_stocks",
    name: "IF Stocks",
    handle: "@if_stocks",
    description: "Аналитика российских и зарубежных акций, мультипликаторы и отчеты",
    url: "https://t.me/if_stocks",
    badge: "Акции",
    platform: "telegram",
    category: "Фондовый рынок"
  },
  {
    id: "tg_if_bonds",
    name: "IF Bonds",
    handle: "@if_bonds",
    description: "Облигации, ОФЗ, корпоративные бонды, флоатеры и купонная доходность",
    url: "https://t.me/if_bonds",
    badge: "Облигации",
    platform: "telegram",
    category: "Долговой рынок"
  },
  {
    id: "tg_if_estate",
    name: "Деньги из бетона",
    handle: "@if_estate",
    description: "Инвестиции в недвижимость, ипотечные программы, рассрочки и новостройки",
    url: "https://t.me/if_estate",
    badge: "Недвижимость",
    platform: "telegram",
    category: "Недвижимость"
  },
  {
    id: "tg_if_crypto",
    name: "IF Crypto",
    handle: "@if_crypto_ru",
    description: "Криптовалюты, безопасность кошельков, P2P и тренды Web3",
    url: "https://t.me/if_crypto_ru",
    badge: "Крипта",
    platform: "telegram",
    category: "Криптовалюта"
  },
  {
    id: "tg_if_jobs",
    name: "Работа не рабство",
    handle: "@if_jobs",
    description: "Проверенные удаленные вакансии, карьерный рост и фриланс",
    url: "https://t.me/if_jobs",
    badge: "Карьера",
    platform: "telegram",
    category: "Работа и удаленка"
  },
  {
    id: "tg_kira_pronira",
    name: "Кира Юхтенко",
    handle: "@kira_pronira",
    description: "Личный канал основателя InvestFuture Киры Юхтенко: мысли, жизнь и опыт",
    url: "https://t.me/kira_pronira",
    badge: "Личный",
    platform: "telegram",
    category: "Личный блог"
  },

  // --- MAX ---
  {
    id: "max_investfuture",
    name: "InvestFuture в MAX",
    handle: "max.ru/investfuture",
    description: "Официальный канал InvestFuture на платформе MAX",
    url: "https://max.ru/investfuture",
    platform: "max",
    category: "Инвестиции"
  },
  {
    id: "max_if_market_news",
    name: "IF News в MAX",
    handle: "max.ru/if_market_news",
    description: "Главные новости экономики и рынков в MAX",
    url: "https://max.ru/if_market_news",
    platform: "max",
    category: "Новости"
  },
  {
    id: "max_if_stocks",
    name: "IF Stocks в MAX",
    handle: "max.ru/if_stocks",
    description: "Разборы акций и фондового рынка в MAX",
    url: "https://max.ru/if_stocks",
    platform: "max",
    category: "Акции"
  },
  {
    id: "max_if_bonds",
    name: "IF Bonds в MAX",
    handle: "max.ru/if_bonds",
    description: "Облигации, доходности и флоатеры в MAX",
    url: "https://max.ru/if_bonds",
    platform: "max",
    category: "Облигации"
  },
  {
    id: "max_if_estate",
    name: "Деньги из Бетона в MAX",
    handle: "max.ru/if_estate",
    description: "Недвижимость, ипотека и новостройки в MAX",
    url: "https://max.ru/if_estate",
    platform: "max",
    category: "Недвижимость"
  },
  {
    id: "max_if_jobs",
    name: "Работа не рабство в MAX",
    handle: "max.ru/if_jobs",
    description: "Вакансии и удаленная работа в MAX",
    url: "https://max.ru/if_jobs",
    platform: "max",
    category: "Карьера"
  },
  {
    id: "max_kira_pronira",
    name: "Кира Юхтенко в MAX",
    handle: "max.ru/kira_pronira",
    description: "Авторский блог Киры Юхтенко в MAX",
    url: "https://max.ru/kira_pronira",
    platform: "max",
    category: "Личный блог"
  },
  {
    id: "max_if_crypto",
    name: "IF Crypto в MAX",
    handle: "max.ru/if_crypto_ru",
    description: "Криптовалюта и блокчейн-тренды в MAX",
    url: "https://max.ru/if_crypto_ru",
    platform: "max",
    category: "Криптовалюта"
  },

  // --- ВКОНТАКТЕ ---
  {
    id: "vk_investfuture",
    name: "InvestFuture ВК",
    handle: "vk.com/investfuture",
    description: "Официальное сообщество InvestFuture ВКонтакте",
    url: "https://vk.com/investfuture",
    platform: "vk",
    category: "Инвестиции"
  },
  {
    id: "vk_if_estate",
    name: "Деньги из бетона ВК",
    handle: "vk.com/if_estate",
    description: "Сообщество по недвижимости, новостройкам и ипотеке",
    url: "https://vk.ru/if_estate",
    platform: "vk",
    category: "Недвижимость"
  },
  {
    id: "vk_if_stocks",
    name: "IF Stocks ВК",
    handle: "vk.com/if_stocks",
    description: "Сообщество по рынку акций и ценным бумагам",
    url: "https://vk.com/if_stocks",
    platform: "vk",
    category: "Акции"
  },
  {
    id: "vk_if_bonds",
    name: "IF Bonds ВК",
    handle: "vk.com/if_bonds",
    description: "Разборы облигаций и купонных стратегий",
    url: "https://vk.com/if_bonds",
    platform: "vk",
    category: "Облигации"
  },
  {
    id: "vk_if_crypto",
    name: "IF Crypto ВК",
    handle: "vk.com/if_crypto",
    description: "Сообщество по криптовалютам и цифровым активам",
    url: "https://vk.com/if_crypto",
    platform: "vk",
    category: "Криптовалюта"
  },
  {
    id: "vk_if_jobs",
    name: "Правильная Работа ВК",
    handle: "vk.com/if_jobs",
    description: "Вакансии, карьера и поиск работы на удаленке",
    url: "https://vk.com/if_jobs",
    platform: "vk",
    category: "Карьера"
  },

  // --- YOUTUBE ---
  {
    id: "yt_investfuture",
    name: "InvestFuture YouTube",
    handle: "@investfutureru",
    description: "Главный YouTube-канал: видеоразборы, интервью, аналитика и выпуски новостей",
    url: "https://youtube.com/@investfutureru?si=SVfhwN6Ca3qh3Cj-",
    badge: "1.2M+",
    platform: "youtube",
    category: "Видео"
  },
  {
    id: "yt_kira_yuchtenko",
    name: "Кира Юхтенко YouTube",
    handle: "Кира Юхтенко",
    description: "Прямые эфиры, авторские видео и стримы",
    url: "https://youtube.com/channel/UC_lfA-oU-3wV7YcghLEm9IA?si=oBaUvWR9cVMHnspR",
    badge: "YouTube",
    platform: "youtube",
    category: "Видео"
  },
  {
    id: "yt_money_from_concrete",
    name: "Деньги из Бетона YouTube",
    handle: "@if_estate",
    description: "Видеообзоры жилых комплексов, стратегии инвестирования в недвижимость",
    url: "https://youtube.com/@if_estate?si=fvHA-mW3oi4NppdM",
    badge: "Недвижка",
    platform: "youtube",
    category: "Видео"
  },

  // --- RUTUBE ---
  {
    id: "rt_investfuture",
    name: "InvestFuture RuTube",
    handle: "rutube.ru/u/investfuture",
    description: "Все видеовыпуски и эксклюзивные материалы InvestFuture на RuTube",
    url: "https://rutube.ru/u/investfuture/",
    badge: "RuTube",
    platform: "rutube",
    category: "Видео"
  }
];
