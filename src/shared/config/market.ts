// От какой цены считать «изменение за день» у акций.
// API отдаёт обе базы: закрытие основной сессии прошлого дня и закрытие вечерней. Чтобы цифры сходились
// с конкретным брокером (например, Т-Инвестиции), выбирается та же база, что у него. Меняется одной строкой.
export type EquityChangeBasis = 'previous_regular_session_close' | 'previous_evening_session_close';
export const EQUITY_CHANGE_BASIS: EquityChangeBasis = 'previous_regular_session_close';
