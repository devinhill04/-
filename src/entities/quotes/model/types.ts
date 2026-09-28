export interface Quote {
  id: string; // USD, EUR, CNY, IMOEX, BRENT, URALS, GOLD, SILVER, BTC, ETH
  title: string; // "Доллар США"
  ticker: string; // "USD/RUB"
  badge: string; // символ в кружке: $, €, ¥ ...
  price: number | null;
  changePercent: number | null;
  unit: string; // ₽ | $ | пт.
  decimals: number;
  source: string;
  unavailable?: boolean; // биржа этим инструментом не торгует — строку не показываем (появится сама, если контракт вернётся)
}
