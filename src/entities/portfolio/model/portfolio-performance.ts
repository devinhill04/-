// Результат портфеля акций: методология investfuture.ru/tools/portfolio-performance.
// Средняя стоимость приобретения; денежный результат; XIRR ACT/365.
// Свободные деньги брокерского счёта, налоги с продажи и неучтённые операции не включаются.
export type OperationKind = 'buy' | 'sell' | 'income' | 'split';
export interface PerformanceOperation {
  id: string;
  date: string; // YYYY-MM-DD
  kind: OperationKind;
  secid: string;
  quantity: number; // покупки и продажи: штук; дробление: итоговое количество
  price: number; // за штуку, ₽
  fee: number; // комиссия за всю сделку, ₽
  amount: number; // фактически поступивший доход после удержаний, ₽
}
export interface PerformanceQuote { secid: string; price: number | null; date: string | null }
export interface PerformancePosition { secid: string; quantity: number; cost: number; avgCost: number; marketPrice: number | null; marketValue: number | null; quoteDate: string | null }
export interface PerformanceResult {
  purchases: number;
  sales: number;
  income: number;
  valuation: number | null;
  profit: number | null;
  xirr: number | null; // в долях, не процентах
  positions: PerformancePosition[];
  problems: string[];
}

const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const day = (s: string) => Date.parse(s + 'T00:00:00Z') / 86400000;

interface Flow { date: string; value: number }
export function computeXirr(flows: Flow[]): number | null {
  const sorted = flows.filter((f) => Number.isFinite(f.value) && validDate(f.date)).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2 || !sorted.some((f) => f.value < 0) || !sorted.some((f) => f.value > 0)) return null;
  const first = day(sorted[0].date);
  if (day(sorted[sorted.length - 1].date) === first) return null;
  // Схлопываем потоки за день, затем выявляем потенциальную неоднозначность.
  const byDate = new Map<string, number>();
  for (const f of sorted) byDate.set(f.date, (byDate.get(f.date) ?? 0) + f.value);
  const net = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value })).filter((f) => Math.abs(f.value) > 1e-8);
  if (net.length < 2) return null;
  let signChanges = 0;
  for (let i = 1; i < net.length; i++) if (Math.sign(net[i - 1].value) !== Math.sign(net[i].value)) signChanges++;
  // Для портфеля с покупками после поступлений XIRR потенциально неоднозначен.
  if (signChanges !== 1 || net[0].value >= 0) return null;

  const npv = (rate: number) => net.reduce((acc, f) => acc + f.value / Math.pow(1 + rate, (day(f.date) - first) / 365), 0);
  let low = -0.9999, high = 1;
  let lo = npv(low), hi = npv(high);
  while (Number.isFinite(hi) && lo * hi > 0 && high < 100000) { high = high * 2 + 1; hi = npv(high); }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo * hi > 0) return null;
  for (let i = 0; i < 180; i++) {
    const mid = (low + high) / 2;
    const v = npv(mid);
    if (!Number.isFinite(v)) return null;
    if (Math.abs(v) < 1e-8) return mid;
    if (v * lo > 0) { low = mid; lo = v; } else { high = mid; hi = v; }
  }
  return (low + high) / 2;
}

export function calculatePerformance(operations: PerformanceOperation[], quotes: PerformanceQuote[], today: string): PerformanceResult {
  const problems: string[] = [];
  const holdings = new Map<string, { quantity: number; cost: number }>();
  const flows: Flow[] = [];
  let purchases = 0, sales = 0, income = 0;
  if (!validDate(today)) throw new Error('Некорректная дата оценки.');
  const list = operations.map((op, i) => ({ ...op, order: i })).sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  for (const op of list) {
    const id = op.secid.trim().toUpperCase();
    const nonneg = (n: number) => Number.isFinite(n) && n >= 0;
    if (!id || !validDate(op.date) || op.date > today) { problems.push('Операция: нужна корректная дата не позднее даты оценки и тикер.'); continue; }
    const holding = holdings.get(id) ?? { quantity: 0, cost: 0 };
    if (op.kind === 'buy' || op.kind === 'sell') {
      if (!(op.quantity > 0) || !nonneg(op.price) || !nonneg(op.fee)) { problems.push(id + ': неверное количество, цена или комиссия.'); continue; }
      if (op.kind === 'buy') {
        const spent = round2(op.quantity * op.price + op.fee);
        holding.quantity += op.quantity; holding.cost += spent; purchases += spent;
        flows.push({ date: op.date, value: -spent });
      } else {
        if (op.quantity > holding.quantity + 1e-8) { problems.push(id + ': продажа превышает остаток акций.'); continue; }
        const received = round2(op.quantity * op.price - op.fee);
        if (received < 0) { problems.push(id + ': комиссия превышает сумму продажи.'); continue; }
        const removedCost = holding.cost * (op.quantity / holding.quantity);
        holding.quantity = Math.max(0, holding.quantity - op.quantity);
        holding.cost = holding.quantity < 1e-8 ? 0 : Math.max(0, holding.cost - removedCost);
        sales += received; flows.push({ date: op.date, value: received });
      }
    } else if (op.kind === 'income') {
      if (!nonneg(op.amount)) { problems.push(id + ': доход должен быть неотрицательной суммой после удержаний.'); continue; }
      income += op.amount; flows.push({ date: op.date, value: op.amount });
    } else if (op.kind === 'split') {
      if (!(op.quantity > 0) || holding.quantity <= 0) { problems.push(id + ': для преобразования нужен существующий остаток и итоговое количество акций.'); continue; }
      holding.quantity = op.quantity; // общая себестоимость не меняется
    }
    holdings.set(id, holding);
  }
  const quoteMap = new Map(quotes.map((q) => [q.secid.toUpperCase(), q]));
  let valuation = 0;
  let hasUnknownPrice = false;
  const positions: PerformancePosition[] = [];
  for (const [secid, h] of holdings) {
    if (h.quantity < 1e-8) continue;
    const q = quoteMap.get(secid);
    const age = q?.date && validDate(q.date) ? day(today) - day(q.date) : Infinity;
    const price = q && q.price !== null && q.price > 0 && age >= 0 && age <= 7 ? q.price : null;
    const value = price !== null ? round2(price * h.quantity) : null;
    if (value === null) { hasUnknownPrice = true; problems.push(secid + ': нет актуальной котировки (не старше 7 дней); общая оценка недоступна.'); }
    else valuation += value;
    positions.push({ secid, quantity: h.quantity, cost: round2(h.cost), avgCost: round2(h.cost / h.quantity), marketPrice: price, marketValue: value, quoteDate: q?.date ?? null });
  }
  if (problems.some((p) => !p.includes('котировки'))) hasUnknownPrice = true;
  const totalValuation = hasUnknownPrice ? null : round2(valuation);
  if (totalValuation !== null && totalValuation > 0) flows.push({ date: today, value: totalValuation });
  const profit = totalValuation === null ? null : round2(sales + income + totalValuation - purchases);
  return { purchases: round2(purchases), sales: round2(sales), income: round2(income), valuation: totalValuation, profit, xirr: totalValuation === null ? null : computeXirr(flows), positions, problems };
}
