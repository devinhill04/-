// Exact Figma Data for Screens & Navigation

export interface FigmaBanner {
  id: string;
  type: 'if_plus' | 'gift' | 'resources';
  title: string;
  body: string;
  actionText?: string;
  bgFill: string;
  image: string;
  exactImage: string;
}

export const FIGMA_BANNERS: FigmaBanner[] = [
  {
    id: 'banner_if_plus',
    type: 'if_plus',
    title: 'Подписка IF+',
    body: 'Эксклюзивная аналитика, инвестидеи, разборы рынка и готовые портфели',
    bgFill: '#000000',
    image: '/figma_assets/banner_if_plus.png',
    exactImage: '/figma_assets/exact_banner_if_plus.png',
  },
  {
    id: 'banner_gift',
    type: 'gift',
    title: 'Гайд по ИИС-3  и дивидендам',
    body: 'Бесплатная PDF-инструкция и подборка из 10 топовых бумаг с ежемесячным купоном',
    bgFill: 'linear-gradient(278.32deg, #FFFFFF 20%, #FED5FF 40%, #E6F0FF 100%)',
    image: '/figma_assets/banner_gift.png',
    exactImage: '/figma_assets/exact_banner_gift.png',
  },
  {
    id: 'banner_all_resources',
    type: 'resources',
    title: 'Все наши ресурсы и площадки',
    body: '',
    actionText: 'Открыть',
    bgFill: '#F9F9F7',
    image: '/figma_assets/banner_all_resources.png',
    exactImage: '/figma_assets/exact_banner_all_resources.png',
  },
];

export interface FigmaSearchTag {
  id: string;
  name: string;
  postCount?: number;
}

export const FIGMA_TAGS: FigmaSearchTag[] = [
  { id: 'news', name: '#Новости' },
  { id: 'analytics', name: '#Аналитика' },
  { id: 'idea', name: '#Идея' },
  { id: 'market', name: '#Рынок' },
  { id: 'personal_finance', name: '#ЛичныеФинансы' },
  { id: 'portfolio', name: '#Портфель' },
  { id: 'regulation', name: '#Регулирование' },
  { id: 'lifehack', name: '#Лайфхак' },
  { id: 'deposits', name: '#Вклады' },
  { id: 'selection', name: '#Подборка' },
  { id: 'real_estate', name: '#Недвижимость' },
  { id: 'taxes', name: '#Налоги' },
  { id: 'pension', name: '#Пенсия' },
  { id: 'crypto', name: '#Крипта' },
  { id: 'education', name: '#Обучение' },
];

export interface FigmaPainCard {
  id: string;
  slug: string;
  title: string;
  body: string;
  cardType: 'small' | 'horizontal' | 'vertical';
  bgColor: string;
  image: string;
  categoryTag: string;
}

export const FIGMA_PAIN_CARDS: FigmaPainCard[] = [
  {
    id: 'pain_1',
    slug: 'learning',
    title: 'Обучение',
    body: 'Я новичок, с чего мне начать?',
    cardType: 'small',
    bgColor: '#D0EED4',
    image: '/figma_assets/card_learning.png',
    categoryTag: '#Обучение',
  },
  {
    id: 'pain_2',
    slug: 'personal_finance',
    title: 'Личные финансы',
    body: 'Не умею вести бюджет',
    cardType: 'small',
    bgColor: '#B3D5FA',
    image: '/figma_assets/card_personal_finance.png',
    categoryTag: '#ЛичныеФинансы',
  },
  {
    id: 'pain_3',
    slug: 'bank_lifehacks',
    title: 'Банковские лайфхаки',
    body: 'Хочу знать хитрые схемы с простыми банковскими продуктами (вклад, кредитка, дебетовые карты)',
    cardType: 'horizontal',
    bgColor: '#F9BACB',
    image: '/figma_assets/card_bank_lifehacks.png',
    categoryTag: '#Лайфхак',
  },
  {
    id: 'pain_4',
    slug: 'transfers',
    title: 'Переводы',
    body: 'Блокировки карт / переводов. Как этого не допустить?',
    cardType: 'small',
    bgColor: '#CED2FF',
    image: '/figma_assets/card_transfers.png',
    categoryTag: '#Регулирование',
  },
  {
    id: 'pain_5',
    slug: 'deductions',
    title: 'Вычеты',
    body: 'Хочу разобраться с налоговыми вычетами',
    cardType: 'small',
    bgColor: '#FFC6A9',
    image: '/figma_assets/card_deductions.png',
    categoryTag: '#Вычеты',
  },
  {
    id: 'pain_6',
    slug: 'taxes',
    title: 'Налоги',
    body: 'Как не потерять и сэкономить на налогах?',
    cardType: 'vertical',
    bgColor: '#A7E9B2',
    image: '/figma_assets/card_taxes.png',
    categoryTag: '#Налоги',
  },
  {
    id: 'pain_7',
    slug: 'pension',
    title: 'Пенсия и пассивный доход',
    body: 'Как обеспечить себе нормальную старость?',
    cardType: 'small',
    bgColor: '#FFE79F',
    image: '/figma_assets/card_pension.png',
    categoryTag: '#Пенсия',
  },
  {
    id: 'pain_8',
    slug: 'mortgage',
    title: 'Ипотека, кредиты, и долги',
    body: 'Как быстрее разобраться с долгами?',
    cardType: 'small',
    bgColor: '#AAE2EF',
    image: '/figma_assets/card_mortgage.png',
    categoryTag: '#Ипотека',
  },
];

export interface FigmaEcosystemChannel {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  links: {
    label: string;
    url: string;
  }[];
}

export const FIGMA_ECOSYSTEM: FigmaEcosystemChannel[] = [
  {
    id: 'if_kira',
    title: 'Кира Юхтенко',
    subtitle: 'Основатель InvestFuture',
    avatar: '/figma_assets/fill_57395bbcb316c014e24a2ed38a60c9d5f8ebe118.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/kira_pronira' },
      { label: 'Max', url: 'https://max.ru/kira_pronira' },
      { label: 'YouTube', url: 'https://youtube.com/channel/UC_lfA-oU-3wV7YcghLEm9IA?si=F1Q9w0DDQ7w46l1I' },
    ],
  },
  {
    id: 'if_main',
    title: 'InvestFuture',
    subtitle: 'Основной канал',
    avatar: '/figma_assets/fill_ad6b082b617a802b8358b6de4c2b025b81969cdc.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/investfuture' },
      { label: 'VK', url: 'https://vk.ru/investfuture' },
      { label: 'Max', url: 'https://max.ru/investfuture' },
      { label: 'YouTube', url: 'https://www.youtube.com/channel/UC-WK8QlQJpAROCrO7dRvqcw' },
      { label: 'RuTube', url: 'https://rutube.ru/u/InvestFuture/' },
    ],
  },
  {
    id: 'if_news',
    title: 'IF News',
    subtitle: 'Новости',
    avatar: '/figma_assets/fill_6abeac4161a12ed9b72c9691b4478cbc0f601fc0.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/if_market_news' },
      { label: 'VK', url: 'https://vk.ru/if_market_news' },
      { label: 'Max', url: 'https://max.ru/if_market_news?ysclid=mtismeam46381405746' },
    ],
  },
  {
    id: 'if_concrete',
    title: 'Деньги из бетона',
    subtitle: 'Недвижмость',
    avatar: '/figma_assets/fill_101903a8603a9867559d45c9adf4542551e28c33.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/if_estate' },
      { label: 'VK', url: 'https://vk.ru/if_estate' },
      { label: 'Max', url: 'https://max.ru/if_estate?ysclid=mtispx0cw935488868' },
      { label: 'YouTube', url: 'https://www.youtube.com/channel/UC3-Fc7pwgF9h7TXCr8JqdgQ' },
    ],
  },
  {
    id: 'if_stocks',
    title: 'IF Stocks',
    subtitle: 'Акции',
    avatar: '/figma_assets/fill_bf4fd4ecd904629ecd8419c05d68fa36610f6d7a.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/s/if_stocks' },
      { label: 'VK', url: 'https://vk.ru/if_stocks?ysclid=mtisrfu73b173535939' },
      { label: 'Max', url: 'https://max.ru/if_stocks?ysclid=mtisrs8u7y714867802' },
    ],
  },
  {
    id: 'if_bonds',
    title: 'IF Bonds',
    subtitle: 'Облигации',
    avatar: '/figma_assets/fill_11c4aa75fea962cf4acf4b47e5afac828143f68f.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/if_bonds?ysclid=mtissaj57o555554919' },
      { label: 'VK', url: 'https://vk.ru/if_bonds?ysclid=mtissi7xqn326876659' },
      { label: 'Max', url: 'https://max.ru/if_bonds?ysclid=mtissos1tk685876356' },
    ],
  },
  {
    id: 'if_jobs',
    title: 'Работа не рабство',
    subtitle: 'Работа и заработок',
    avatar: '/figma_assets/fill_7695818e5cb0ca02fff38b1f752cb9e906b763f4.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/s/if_jobs?ysclid=mtisv30ajq595220899' },
      { label: 'VK', url: 'https://vk.ru/if_jobs' },
      { label: 'Max', url: 'https://max.ru/if_jobs?ysclid=mtisvgmd6d591457877' },
    ],
  },
  {
    id: 'if_plus',
    title: 'IF+ Инвестиции в плюс',
    subtitle: 'Подписка для инвесторов',
    avatar: '/figma_assets/fill_522f975b11c1740b97d9cbfacf17366b1ee2b537.png',
    links: [
      { label: 'Telegram', url: 'https://t.me/plus_investfuture?ysclid=mtisw7tnqu36453424' },
      { label: 'Boosty', url: 'https://boosty.to/investfuture?ysclid=mtit27k4c9162223826' },
    ],
  },
  {
    id: 'if_site',
    title: 'Сайт InvestFuture',
    subtitle: 'Новости, разборы, статьи',
    avatar: '/figma_assets/fill_305d2cfdbca815876e5ae2bad6faadb28918fe31.png',
    links: [
      { label: 'Перейти на сайт', url: 'https://investfuture.ru/?ysclid=mtit3sjyy7709985070' },
    ],
  },
];
