export interface ChannelScanConfig {
  username: string;
  name: string;
  defaultCategory?: string;
  active: boolean;
}

export const SCAN_CHANNELS: ChannelScanConfig[] = [
  { username: 'investfuture', name: 'InvestFuture', defaultCategory: 'evergreen', active: true },
  { username: 'if_stocks', name: 'IF Stocks', defaultCategory: 'stocks', active: true },
  { username: 'if_bonds', name: 'IF Bonds', defaultCategory: 'bonds', active: true },
  { username: 'if_estate', name: 'Деньги из бетона', defaultCategory: 'estate', active: true },
  { username: 'if_crypto_ru', name: 'IF Crypto', defaultCategory: 'crypto', active: true },
  { username: 'if_market_news', name: 'IF News', defaultCategory: 'news', active: true },
  { username: 'if_jobs', name: 'Работа не рабство', defaultCategory: 'jobs', active: true },
  { username: 'kira_pronira', name: 'Кира Юхтенко', defaultCategory: 'mindset', active: true }
];

export const HASHTAG_CATEGORY_MAP: Record<string, string> = {
  // База / Обучение / Вечнозеленый контент
  'обучение': 'evergreen',
  'новички': 'evergreen',
  'база': 'evergreen',
  'старт': 'evergreen',
  'инструкция': 'evergreen',
  'ликбез': 'evergreen',
  'гайд': 'evergreen',
  'термины': 'evergreen',

  // Акции
  'акции': 'stocks',
  'рынок': 'stocks',
  'мосбиржа': 'stocks',
  'дивиденды': 'stocks',
  'отчетность': 'stocks',
  'портфель': 'stocks',
  'разбор': 'stocks',
  'теханализ': 'stocks',

  // Облигации
  'облигации': 'bonds',
  'офз': 'bonds',
  'купоны': 'bonds',
  'доходность': 'bonds',
  'флоатеры': 'bonds',
  'бонды': 'bonds',
  'вдо': 'bonds',

  // Недвижимость
  'недвижимость': 'estate',
  'ипотека': 'estate',
  'новостройки': 'estate',
  'аренда': 'estate',
  'бетон': 'estate',
  'застройщики': 'estate',
  'ппи': 'estate',

  // Криптовалюты
  'крипта': 'crypto',
  'биткоин': 'crypto',
  'криптовалюта': 'crypto',
  'p2p': 'crypto',
  'ethereum': 'crypto',
  'web3': 'crypto',
  'ton': 'crypto',

  // Новости / Макроэкономика
  'новости': 'news',
  'макро': 'news',
  'инфляция': 'news',
  'ставка': 'news',
  'цб': 'news',
  'рубль': 'news',
  'доллар': 'news',
  'нефть': 'news',

  // Финансовое мышление
  'мышление': 'mindset',
  'психология': 'mindset',
  'ошибки': 'mindset',
  'советы': 'mindset',
  'книги': 'mindset',
  'привычки': 'mindset',
  'цели': 'mindset',

  // Карьера и работа
  'работа': 'jobs',
  'вакансии': 'jobs',
  'удаленка': 'jobs',
  'карьера': 'jobs',
  'фриланс': 'jobs',
  'резюме': 'jobs'
};
