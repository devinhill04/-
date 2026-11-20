import React, { useEffect, useState } from 'react';
import { loadPrice, loadShares, type Share } from '../../entities/dividends/model/dividends';
import { calculatePerformance, type PerformanceOperation, type PerformanceQuote, type PerformanceResult, type OperationKind } from '../../entities/portfolio/model/portfolio-performance';
import { AnalyticsService } from '../../shared/analytics/analytics';

const money = (n: number | null) => n === null ? '—' : `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
const todayMsk = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
const field = 'w-full min-w-0 h-11 rounded-[10px] border border-[#E3E1EA] bg-white px-3 text-[14px] text-[#161616] outline-none focus:border-[var(--accent)] dark:border-white/15 dark:bg-neutral-900 dark:text-white';
const btn = 'h-11 rounded-[10px] bg-[var(--accent)] px-4 text-[14px] font-semibold text-white disabled:opacity-50 active:opacity-70';
const kindLabel: Record<OperationKind, string> = { buy: 'Покупка', sell: 'Продажа', income: 'Полученный доход', split: 'Дробление / консолидация' };
const empty = (): PerformanceOperation => ({ id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: 'buy', date: todayMsk(), secid: 'SBER', quantity: 1, price: 0, fee: 0, amount: 0 });
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <section className="rounded-[16px] border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#161616]">{children}</section>;
const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-[19px] font-bold leading-6">{children}</h3>;
const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="mb-1 text-[12px] font-semibold text-[#55545A] dark:text-neutral-300">{children}</p>;

export const PortfolioPerformanceCalculator: React.FC = () => {
  const [ops, setOps] = useState<PerformanceOperation[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [result, setResult] = useState<PerformanceResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [calculatedOn, setCalculatedOn] = useState('');
  useEffect(() => {
    AnalyticsService.track('calc_open', { source: 'subtab_performance' });
    loadShares().then(setShares).catch(() => setWarning('Не удалось загрузить список акций. Тикеры можно вводить вручную.'));
  }, []);
  const update = (id: string, patch: Partial<PerformanceOperation>) => {
    setOps((previous) => previous.map((op) => op.id === id ? { ...op, ...patch } : op));
    setResult(null);
  };
  const add = () => { setOps((prev) => [...prev, empty()]); setResult(null); };
  const download = () => {
    const blob = new Blob([JSON.stringify({ version: 1, operations: ops }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'investfuture-portfolio-operations.json'; anchor.click();
    URL.revokeObjectURL(url);
  };
  const upload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Файл слишком большой (максимум 1 МБ).');
      const json = JSON.parse(await file.text());
      if (json?.version !== 1 || !Array.isArray(json.operations) || json.operations.length > 200) throw new Error('Неверный формат файла операций.');
      const allowed = ['buy', 'sell', 'income', 'split'];
      const entries: PerformanceOperation[] = json.operations.map((value: any, index: number) => {
        if (!value || !allowed.includes(value.kind) || !/^\d{4}-\d{2}-\d{2}$/.test(String(value.date)) || !/^[A-Z0-9_-]{1,24}$/i.test(String(value.secid))) throw new Error(`Некорректная операция №${index + 1}.`);
        const numbers = ['quantity', 'price', 'fee', 'amount'].map((key) => Number(value[key] ?? 0));
        if (!numbers.every((n) => Number.isFinite(n) && n >= 0)) throw new Error(`Некорректная сумма в операции №${index + 1}.`);
        return { id: `import-${index}-${Date.now()}`, kind: value.kind, date: String(value.date), secid: String(value.secid).toUpperCase(), quantity: numbers[0], price: numbers[1], fee: numbers[2], amount: numbers[3] };
      });
      setOps(entries); setResult(null); setWarning('Операции загружены. Проверьте их и рассчитайте результат заново.');
    } catch (e) { setWarning(e instanceof Error ? e.message : 'Не удалось прочитать файл.'); }
    finally { input.value = ''; }
  };
  const calculate = async () => {
    if (!ops.length) return setWarning('Добавьте хотя бы одну покупку акции.');
    setBusy(true); setWarning(''); setResult(null);
    const now = todayMsk();
    try {
      const tickerList = [...new Set(ops.map((op) => op.secid.trim().toUpperCase()))];
      const quotes: PerformanceQuote[] = await Promise.all(tickerList.map(async (secid) => {
        try {
          const p = await loadPrice(secid);
          return { secid, price: p.price, date: p.at?.slice(0, 10) ?? null };
        } catch { return { secid, price: null, date: null }; }
      }));
      const value = calculatePerformance(ops, quotes, now);
      setResult(value); setCalculatedOn(now);
      AnalyticsService.track('calc_result', { source: 'portfolio_performance', complete: value.profit !== null ? 'yes' : 'no' });
    } catch (e) { setWarning(e instanceof Error ? e.message : 'Ошибка расчёта.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-4 text-[#161616] dark:text-white" data-calculator="portfolio-performance">
      <Card>
        <Heading>Результат портфеля акций</Heading>
        <p className="mt-2 text-[14px] leading-5 text-[#55545A] dark:text-neutral-400">Добавьте покупки, продажи и фактически полученный доход в рублях. Калькулятор покажет стоимость оставшихся акций, результат с комиссиями и годовую доходность, когда её можно определить однозначно.</p>
      </Card>
      <Card>
        <Heading>Операции портфеля</Heading>
        <p className="mt-2 text-[12px] leading-[18px] text-[#55545A] dark:text-neutral-400">Операции обрабатываются только в этом браузере. Чтобы продолжить позже, скачайте файл и загрузите его при следующем посещении.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={add} data-add-operation>Добавить операцию</button>
          <button type="button" className="h-11 rounded-[10px] border border-black/10 px-3 text-[12px] font-semibold dark:border-white/20" onClick={download} disabled={!ops.length}>Скачать операции</button>
          <label className="flex h-11 cursor-pointer items-center rounded-[10px] border border-black/10 px-3 text-[12px] font-semibold dark:border-white/20">Загрузить операции<input aria-label="Загрузить операции" type="file" accept=".json,application/json" className="sr-only" onChange={upload}/></label>
        </div>
        {!ops.length && <p className="mt-4 rounded-[10px] bg-[#F8F6FF] p-3 text-[13px] leading-[19px] dark:bg-neutral-900">Начните с покупки акции. Если акции были куплены раньше, внесите первоначальную дату и цену покупки.</p>}
        <datalist id="performance-share-tickers">{shares.map((s) => <option key={s.secid} value={s.secid}>{s.name}</option>)}</datalist>
        <div className="mt-3 space-y-3">
          {ops.map((op, i) => (
            <div key={op.id} className="rounded-[12px] border border-[#E3E1EA] p-3 dark:border-white/15" data-operation={i + 1}>
              <div className="flex items-center justify-between gap-2"><h4 className="text-[14px] font-bold">Операция {i + 1}</h4><button type="button" className="text-[12px] text-[#BA1111]" onClick={() => { setOps((prev) => prev.filter((v) => v.id !== op.id)); setResult(null); }}>Удалить</button></div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="col-span-2"><Caption>Тип операции</Caption><select className={field} value={op.kind} onChange={(e) => update(op.id, { kind: e.target.value as OperationKind })}>{(Object.keys(kindLabel) as OperationKind[]).map((key) => <option key={key} value={key}>{kindLabel[key]}</option>)}</select></label>
                <label><Caption>Дата</Caption><input type="date" max={todayMsk()} className={field} value={op.date} onChange={(e) => update(op.id, { date: e.target.value })}/></label>
                <label><Caption>Тикер акции</Caption><input className={field} list="performance-share-tickers" value={op.secid} onChange={(e) => update(op.id, { secid: e.target.value.toUpperCase() })} placeholder="SBER"/></label>
                {op.kind !== 'income' && <label className="col-span-2"><Caption>{op.kind === 'split' ? 'Количество акций после преобразования, шт.' : 'Количество акций, шт. (не лотов)'}</Caption><input className={field} type="number" min="0.00000001" step="any" value={op.quantity} onChange={(e) => update(op.id, { quantity: Number(e.target.value) })}/></label>}
                {(op.kind === 'buy' || op.kind === 'sell') && <><label><Caption>Цена за акцию, ₽</Caption><input className={field} type="number" min="0" step="any" value={op.price} onChange={(e) => update(op.id, { price: Number(e.target.value) })}/></label><label><Caption>Комиссия, ₽</Caption><input className={field} type="number" min="0" step="any" value={op.fee} onChange={(e) => update(op.id, { fee: Number(e.target.value) })}/></label></>}
                {op.kind === 'income' && <label className="col-span-2"><Caption>Фактически полученный доход после удержаний, ₽</Caption><input className={field} type="number" min="0" step="any" value={op.amount} onChange={(e) => update(op.id, { amount: Number(e.target.value) })}/></label>}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={calculate} disabled={busy || !ops.length} className={`${btn} mt-4 w-full`} data-calculate-performance>{busy ? 'Загружаю котировки…' : 'Рассчитать результат'}</button>
        {warning && <p className="mt-3 text-[12px] text-[#BA1111]">{warning}</p>}
      </Card>
      {result && <Card>
        <Heading>Результат портфеля</Heading>
        <p className="mt-1 text-[12px] text-[#55545A] dark:text-neutral-400">Оценка на {calculatedOn}. Котировки не старше семи дней.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            ['Покупки с комиссиями', result.purchases],
            ['Продажи после комиссий', result.sales],
            ['Полученный доход', result.income],
            ['Остаток акций', result.valuation],
            ['Общий результат', result.profit],
          ].map(([label, value]) => <div key={String(label)} className="rounded-[10px] bg-[#F8F6FF] p-3 dark:bg-neutral-900"><p className="text-[11px] text-[#55545A] dark:text-neutral-400">{label}</p><p className="mt-1 text-[16px] font-bold">{money(value as number | null)}</p></div>)}
          <div className="rounded-[10px] bg-[#F8F6FF] p-3 dark:bg-neutral-900"><p className="text-[11px] text-[#55545A] dark:text-neutral-400">Годовая доходность (XIRR)</p><p className="mt-1 text-[16px] font-bold">{result.xirr === null ? 'Не определяется' : `${(result.xirr * 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%`}</p></div>
        </div>
        {result.positions.length > 0 && <div className="mt-4 space-y-2"><h4 className="text-[14px] font-bold">Оставшиеся акции</h4>{result.positions.map((p) => <div key={p.secid} className="rounded-[10px] border border-black/5 p-3 text-[12px] dark:border-white/10"><p className="font-bold">{p.secid} · {p.quantity} шт.</p><p className="mt-1">Средняя цена приобретения: {money(p.avgCost)}</p><p>Рыночная оценка: {money(p.marketValue)}{p.quoteDate ? ` · котировка ${p.quoteDate}` : ''}</p></div>)}</div>}
        {result.problems.length > 0 && <div className="mt-3 rounded-[10px] border border-[#E9BFBF] p-3 text-[12px] text-[#9C2525] dark:text-[#F7A0A0]">{result.problems.map((p, i) => <p key={i}>{p}</p>)}</div>}
      </Card>}
      <Card>
        <Heading>Как считается результат</Heading>
        <p className="mt-2 text-[13px] leading-[19px] text-[#55545A] dark:text-neutral-400">Общий результат = продажи после комиссий + фактически полученный доход + оценка оставшихся акций − покупки с комиссиями. Стоимость проданных акций учитывается по средней цене приобретения. Свободные деньги брокерского счёта в расчёт не входят.</p>
        <p className="mt-3 text-[13px] leading-[19px] text-[#55545A] dark:text-neutral-400">Годовая доходность XIRR рассчитывается по датам потоков ACT/365. При неоднозначном расчёте или отсутствии актуальных котировок показатель не показывается. Налоги с продажи и не введённые операции не учитываются. Дробления вносятся вручную с итоговым количеством бумаг.</p>
      </Card>
    </div>
  );
};
