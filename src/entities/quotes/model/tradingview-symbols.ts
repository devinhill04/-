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

// Ссылка-заглушка на InvestFuture — без доступа к сайту я не знаю точный шаблон страницы
// конкретного инструмента, подставьте реальный при наличии (например, через параметр ?ticker=).
export function investfutureFallbackUrl(label: string): string {
  return `https://investfuture.ru/?utm_source=miniapp&utm_content=${encodeURIComponent(label)}`;
}
