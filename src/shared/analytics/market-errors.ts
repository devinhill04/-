import { AnalyticsService } from './analytics';

// Сообщает в Метрику, что источник данных вкладки «Рынок» не отвечает (news, site, moex, cbr, fx, ...).
// Раз за сессию на источник: данные обновляются каждую минуту, и без этого один сбой превратился бы в сотни событий.
// По этому событию видно, как часто у реальных пользователей не грузятся новости или цены.
const reported = new Set<string>();

export function reportMarketError(source: string) {
  if (reported.has(source)) return;
  reported.add(source);
  AnalyticsService.track('market_data_error', { source });
}

// Только для тестов
export function _resetMarketErrors() {
  reported.clear();
}
