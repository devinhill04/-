export interface Quote {
  id: string; // USD, EUR, CNY, IMOEX, BRENT, URALS, GOLD, SILVER, BTC, ETH
  title: string; // "Доллар США"
  ticker: string; // "USD/RUB"
  badge: string; // символ в кружке: $, €, ¥ ... (запасной вариант, пока нет иконки)
  iconBox?: number; // диаметр области картинки внутри 40-пиксельного круга (по умолчанию 40); у флагов 28
  iconCover?: boolean; // картинка заполняет круг целиком с обрезкой (лого MOEX)
  iconSrc?: string; // иконка из макета Figma — /figma_assets/quotes/<id>.png, если файл есть
  price: number | null;
  changePercent: number | null;
  unit: string; // ₽ | $ | пт.
  decimals: number;
  source: string;
}
