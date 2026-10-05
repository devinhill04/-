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
  // URALS сознательно не указан — его физически нет ни на одной бирже (см. urals-discount.json),
  // значит и у TradingView символа для него нет. Виджет туда не встраиваем — сразу уходим на запасную ссылку.
};

export function tvSymbolForQuote(id: string): string | null {
  return QUOTE_TV_SYMBOLS[id] ?? null;
}

export function tvSymbolForStock(secid: string): string {
  return `MOEX:${secid}`;
}

// ---------- Ссылки на графики на сайте InvestFuture ----------
// Заполняются по мере получения: пока для инструмента ссылки нет, ведём на главную сайта.
// id котировок: USD, EUR, CNY, IMOEX, BRENT, URALS, GOLD, SILVER, BTC, ETH.
export const INVESTFUTURE_QUOTE_URLS: Record<string, string> = {
  USD: '',
  EUR: '',
  CNY: '',
  IMOEX: '',
  BRENT: '',
  URALS: '',
  GOLD: '',
  SILVER: '',
  BTC: '',
  ETH: '',
};

// Шаблон ссылки для акций, {ticker} заменится на тикер Мосбиржи (SBER, GAZP...).
// null — пока шаблона нет. Пример: 'https://investfuture.ru/quotes/{ticker}'
export const INVESTFUTURE_STOCK_URL_TEMPLATE: string | null = null;

const INVESTFUTURE_HOME = 'https://investfuture.ru/';

const generalUrl = (label: string) =>
  `${INVESTFUTURE_HOME}?utm_source=miniapp&utm_content=${encodeURIComponent(label)}`;

export function investfutureUrlForQuote(
  id: string,
  label: string,
  map: Record<string, string> = INVESTFUTURE_QUOTE_URLS
): string {
  return map[id] || generalUrl(label);
}

export function investfutureUrlForStock(
  secid: string,
  label: string,
  template: string | null = INVESTFUTURE_STOCK_URL_TEMPLATE
): string {
  return template ? template.split('{ticker}').join(encodeURIComponent(secid)) : generalUrl(label);
}
