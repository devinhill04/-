export type BondEventType = 'coupon' | 'amortization' | 'redemption';

export interface BondEvent {
  type: BondEventType;
  name: string;
  isin: string;
  amount: number; // ₽ на одну бумагу
  payDate: string; // ГГГГ-ММ-ДД — дата выплаты
  recordDate: string | null; // ГГГГ-ММ-ДД — дата фиксации владельцев; у погашений и амортизаций её нет
}

export interface BondsPage {
  events: BondEvent[];
  totalEvents: number | null;
  page: number | null;
  totalPages: number | null;
}

export interface KeyRateEvent {
  date: string; // ГГГГ-ММ-ДД
  label: string; // «Решение по ставке», «После заседания»
  title: string;
  description: string;
}

export type BondsPeriod = 30 | 90 | 365;
export type BondsTypeFilter = 'all' | BondEventType;

export interface BondsFilters {
  period: BondsPeriod;
  type: BondsTypeFilter;
}
