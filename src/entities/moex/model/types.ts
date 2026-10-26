export interface MoexStock {
  secid: string; // тикер, например SBER
  shortname: string; // короткое название, например "Сбербанк"
  lastPrice: number | null;
  changePercent: number | null; // изменение за сегодня, %
  marketCap: number; // капитализация (кол-во акций × цена) — используется для отбора топ-N компаний
  tradingValue: number; // объём торгов сегодня — используется для размера плитки
  // Точные строки из API (как на сайте); у запасного источника (ISS) их нет
  priceText?: string;
  changeText?: string;
  changePercentText?: string;
}

export interface MoexHeatmapState {
  stocks: MoexStock[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}
