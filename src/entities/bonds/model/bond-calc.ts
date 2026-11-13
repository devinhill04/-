// Калькулятор выплат по облигации — по методу сайта investfuture.ru/tools/bond-calculator:
//   Затраты = количество × (текущий номинал × цена / 100 + НКД) + комиссия
//   Денежная разница = будущие выплаты − затраты на покупку
// В выплаты входят будущие купоны (только если дата фиксации владельцев ещё не наступила), частичные возвраты
// номинала (амортизация) и погашение. Купоны — из графика выпуска, а не по старому номиналу.
// Полного итога нет, если неизвестна сумма хотя бы одного будущего купона, график возврата номинала неполон или
// есть будущая оферта — события при этом показываются. Налоги и реинвестирование не учитываются.

export type BondEventType = 'coupon' | 'amortization' | 'redemption';

export interface BondEvent {
  type: BondEventType;
  date: string; // YYYY-MM-DD, дата выплаты
  recordDate?: string | null; // дата фиксации владельцев (для купонов)
  amount: number | null; // на одну бумагу, ₽; null — сумма ещё не известна
}

export interface BondCalcInput {
  nominal: number; // текущий номинал одной бумаги, ₽ (после прошлых амортизаций)
  pricePct: number; // цена в % от текущего номинала
  accrued: number; // НКД на одну бумагу, ₽
  qty: number;
  commission: number; // ₽ на всю покупку
  calcDate: string; // YYYY-MM-DD — дата расчёта (покупки)
  events: BondEvent[];
  offerDate?: string | null; // ближайшая будущая оферта
}

export interface BondCalcRow extends BondEvent {
  total: number | null; // на всё количество
  nominalLeft: number | null; // остаток номинала после выплаты номинала
}

export interface BondCalcResult {
  pricePerBond: number; // номинал × цена / 100
  costPerBond: number; // + НКД
  costs: number; // × количество + комиссия
  rows: BondCalcRow[];
  coupons: number | null; // сумма будущих купонов на всё количество (null, если есть неизвестные)
  principal: number; // возврат номинала на всё количество
  payments: number | null; // купоны + номинал
  difference: number | null; // payments − costs (только при полном расчёте)
  differencePct: number | null; // от затрат, за весь оставшийся срок — не годовая доходность
  complete: boolean;
  reasons: string[]; // почему полного итога нет
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const fmtD = (iso: string) => iso.split('-').reverse().join('.');

export function calcBond(i: BondCalcInput): BondCalcResult {
  const reasons: string[] = [];
  const pricePerBond = r2((i.nominal * i.pricePct) / 100);
  const costPerBond = r2(pricePerBond + i.accrued);
  const costs = r2(i.qty * costPerBond + i.commission);

  // Будущие события по дате; купон — только если дата фиксации владельцев позже даты расчёта
  const future = i.events
    .filter((e) => (e.type === 'coupon' ? (e.recordDate ?? e.date) > i.calcDate : e.date > i.calcDate))
    .sort((a, b) => (a.date === b.date ? (a.type === 'coupon' ? -1 : 1) : a.date < b.date ? -1 : 1));

  let left = i.nominal;
  let couponSum = 0;
  let couponsKnown = true;
  let principalSum = 0;
  const rows: BondCalcRow[] = future.map((e) => {
    if (e.type === 'coupon') {
      if (e.amount === null) couponsKnown = false;
      else couponSum += e.amount;
      return { ...e, total: e.amount === null ? null : r2(e.amount * i.qty), nominalLeft: null };
    }
    const amount = e.amount ?? (e.type === 'redemption' ? left : null);
    if (amount !== null) { left = r2(left - amount); principalSum += amount; }
    return { ...e, amount, total: amount === null ? null : r2(amount * i.qty), nominalLeft: amount === null ? null : Math.max(0, left) };
  });

  if (!couponsKnown) reasons.push('Суммы части будущих купонов ещё не объявлены (например, у плавающего купона).');
  if (Math.abs(left) > 0.01) reasons.push('График возврата номинала неполон: по известным выплатам номинал возвращается не целиком.');
  if (i.offerDate && i.offerDate > i.calcDate) reasons.push(`Есть оферта ${fmtD(i.offerDate)}: условия после неё могут измениться.`);
  const complete = reasons.length === 0;

  const coupons = couponsKnown ? r2(couponSum * i.qty) : null;
  const principal = r2(principalSum * i.qty);
  const payments = coupons === null ? null : r2(coupons + principal);
  const difference = complete && payments !== null ? r2(payments - costs) : null;
  const differencePct = difference !== null && costs > 0 ? r2((difference / costs) * 100) : null;
  return { pricePerBond, costPerBond, costs, rows, coupons, principal, payments, difference, differencePct, complete, reasons };
}
