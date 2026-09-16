export interface MoexStock {
  secid: string; // тикер, например SBER
  shortname: string; // короткое название, например "Сбербанк"
  lastPrice: number | null;
  changePercent: number | null; // изменение за сегодня, %
  marketValue: number; // объём торгов сегодня (используем как размер плитки)
}

export interface MoexHeatmapState {
  stocks: MoexStock[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}
