// Символы TradingView для наших котировок — лучшее предположение по открытым источникам,
// живым доступом к TradingView для проверки я не располагаю. Если какой-то график не грузится
// (виджет TradingView сам покажет "Invalid symbol" внутри себя, снаружи это не отследить),
// поправь строку ниже на верный символ — эффект увидишь сразу после сохранения.
export const QUOTE_TV_SYMBOLS: Record<string, string> = {
  USD: 'FX_IDC:USDRUB',
  EUR: 'FX_IDC:EURRUB',
  CNY: 'FX_IDC:CNYRUB',
  IMOEX: 'MOEX:IMOEX2',
  BRENT: 'TVC:UKOIL',
  GOLD: 'MOEX:GLDRUB_TOM',
  SILVER: 'MOEX:SLVRUB_TOM',
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  // URALS сознательно не указан — его физически нет ни на одной бирже (цену берём из public/data/urals-monthly.json),
  // значит и у TradingView символа для него нет. Виджет туда не встраиваем — сразу уходим на запасную ссылку.
};

export function tvSymbolForQuote(id: string): string | null {
  return QUOTE_TV_SYMBOLS[id] ?? null;
}

export function tvSymbolForStock(secid: string): string {
  return `MOEX:${secid}`;
}

// ---------- Ссылки на графики на сайте InvestFuture ----------
// id котировок: USD, EUR, CNY, IMOEX, BRENT, URALS, GOLD, SILVER, BTC, ETH.
// Пустая строка = на сайте такой страницы нет; ссылку тогда не показываем (общую главную вместо неё не ставим).
export const INVESTFUTURE_QUOTE_URLS: Record<string, string> = {
  USD: 'https://investfuture.ru/quotes/currency-cb-usd',
  EUR: 'https://investfuture.ru/quotes/currency-cb-eur',
  CNY: 'https://investfuture.ru/quotes/currency-cb-cny',
  IMOEX: 'https://investfuture.ru/quotes/indices-moex-imoex',
  BRENT: '',
  URALS: '',
  GOLD: '',
  SILVER: '',
  BTC: 'https://investfuture.ru/quotes/crypto-btcusd',
  ETH: 'https://investfuture.ru/quotes/crypto-ethusd',
};

// Шаблон ссылки для акций, {ticker} заменится на тикер Мосбиржи (SBER, GAZP...).
// null — пока шаблона нет, и ссылку для акций не показываем. Пример: 'https://investfuture.ru/quotes/stocks-{ticker}'
export const INVESTFUTURE_STOCK_URL_TEMPLATE: string | null = null;

export function investfutureUrlForQuote(id: string, map: Record<string, string> = INVESTFUTURE_QUOTE_URLS): string | null {
  return map[id] || null;
}

export function investfutureUrlForStock(secid: string, template: string | null = INVESTFUTURE_STOCK_URL_TEMPLATE): string | null {
  return template ? template.split('{ticker}').join(encodeURIComponent(secid)) : null;
}
