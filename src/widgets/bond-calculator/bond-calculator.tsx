import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { calcBond } from '../../entities/bonds/model/bond-calc';
import { BondMarket, BondSchedule, BondSearchItem, loadMarket, loadSchedule, searchBonds } from '../../entities/bonds/model/iss-bonds';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { reportSource } from '../../shared/diagnostics/source-status';
import { triggerHaptic } from '../../lib/telegram';

const todayIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' }); // YYYY-MM-DD по Москве
const rub = (x: number | null, cur = 'RUB') => (x === null ? '—' : `${x.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur === 'RUB' ? '₽' : cur}`);
const dmy = (iso: string) => iso.split('-').reverse().join('.');
const TYPE = { coupon: 'Купон', amortization: 'Амортизация', redemption: 'Погашение' } as const;
const toNum = (s: string) => { const n = Number(s.replace(',', '.').replace(/\s/g, '')); return Number.isFinite(n) ? n : NaN; };

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; suffix?: string; type?: string; hint?: string }> = ({ label, value, onChange, suffix, type = 'text', hint }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[12px] text-[#7D7C82] dark:text-neutral-400">{label}</span>
    <div className="flex items-center h-11 px-3 rounded-[10px] bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10">
      <input inputMode={type === 'date' ? undefined : 'decimal'} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#161616] dark:text-white" />
      {suffix && <span className="text-[13px] text-[#7D7C82] dark:text-neutral-400 ml-2">{suffix}</span>}
    </div>
    {hint && <span className="text-[11px] text-[#7D7C82] dark:text-neutral-500">{hint}</span>}
  </label>
);

// Калькулятор выплат по облигации — тот же метод, что на сайте (см. entities/bonds/model/bond-calc.ts)
export const BondCalculator: React.FC<{ initialCode?: string | null; source: string }> = ({ initialCode, source }) => {
  const [query, setQuery] = useState(initialCode ?? '');
  const [found, setFound] = useState<BondSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<BondSearchItem | null>(null);
  const [market, setMarket] = useState<BondMarket | null>(null);
  const [schedule, setSchedule] = useState<BondSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [accrued, setAccrued] = useState('');
  const [commission, setCommission] = useState('0');
  const [calcDate, setCalcDate] = useState(todayIso());

  useEffect(() => { AnalyticsService.track('calc_open', { source }); }, []);

  // Поиск с паузой, чтобы не дёргать биржу на каждую букву
  useEffect(() => {
    if (picked) return;
    const q = query.trim();
    if (q.length < 2) { setFound([]); return; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchBonds(q);
        if (!alive) return;
        setFound(r);
        setError(null);
        // пришли по ссылке с кодом — сразу выбираем точное совпадение
        if (initialCode && r.length > 0) { const exact = r.find((x) => x.secid === initialCode || x.isin === initialCode); if (exact) pick(exact); }
      } catch (e) { if (alive) setError('Не удалось связаться с Мосбиржей. Проверьте интернет и попробуйте ещё раз.'); reportSource('bonds', false, e); }
      finally { if (alive) setSearching(false); }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [query, picked]);

  const pick = async (b: BondSearchItem) => {
    triggerHaptic('light');
    setPicked(b); setFound([]); setLoading(true); setError(null); setMarket(null); setSchedule(null);
    AnalyticsService.track('calc_bond_select', { secid: b.secid });
    try {
      const [m, s] = await Promise.all([loadMarket(b.secid, b.board), loadSchedule(b.secid, todayIso())]);
      if (!m) throw new Error('нет рыночных данных по бумаге');
      setMarket(m); setSchedule(s);
      setPrice(m.pricePct !== null ? String(m.pricePct).replace('.', ',') : '');
      setAccrued(String(m.accrued).replace('.', ','));
      reportSource('bonds', true, `${b.shortname}: событий в графике ${s.events.length}`);
    } catch (e) {
      setError('Не удалось загрузить данные по облигации. Попробуйте ещё раз или выберите другую.');
      reportSource('bonds', false, e);
    } finally { setLoading(false); }
  };

  const result = useMemo(() => {
    if (!market || !schedule) return null;
    const q = toNum(qty), p = toNum(price), a = toNum(accrued), c = toNum(commission);
    if (!(q > 0) || !(p > 0) || !(a >= 0) || !(c >= 0)) return null;
    return calcBond({ nominal: market.nominal, pricePct: p, accrued: a, qty: Math.floor(q), commission: c, calcDate, events: schedule.events, offerDate: schedule.offerDate ?? market.offerDate });
  }, [market, schedule, qty, price, accrued, commission, calcDate]);

  useEffect(() => {
    if (result && market) AnalyticsService.track('calc_result', { secid: market.secid, complete: result.complete ? 'yes' : 'no' });
  }, [result?.complete, market?.secid]);

  const cur = market?.currency ?? 'RUB';
  const reset = () => { setPicked(null); setMarket(null); setSchedule(null); setQuery(''); setError(null); };
  return (
    <div className="flex flex-col gap-4 text-[#161616] dark:text-white" data-calculator="bond">
      {/* Шапка — как на странице сайта */}
      <div>
        <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400">Инструмент InvestFuture</p>
        <h3 className="text-[20px] leading-[25px] font-bold mt-1">Калькулятор выплат по облигации</h3>
        <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400 mt-2">Узнайте стоимость покупки и посмотрите каждый будущий купон и возврат номинала. Расчёт строится по подтверждённому графику выпуска.</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['Стоимость покупки', 'Купоны и амортизация', 'Денежный итог'].map((t) => (
            <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">{t}</span>
          ))}
        </div>
      </div>

      {/* Шаг 1 · Выбор выпуска */}
      <Card>
        <StepLabel>Шаг 1 · Выбор выпуска</StepLabel>
        <h4 className="text-[17px] font-semibold mt-1">Найдите облигацию</h4>
        <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400 mt-1">Введите название облигации или её биржевой код и выберите выпуск с подтверждённым графиком выплат.</p>
        {!picked ? (
          <>
            <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400 mt-3"><span className="font-semibold text-[var(--accent)] mr-1.5">01</span>Облигация</p>
            <div className="mt-1.5 flex items-center h-11 px-3 rounded-[10px] bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10">
              <Search className="w-4 h-4 text-[#7D7C82] mr-2 shrink-0" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название, SECID или ISIN" className="flex-1 min-w-0 bg-transparent outline-none text-[15px]" />
            </div>
            {searching && <p className="text-[13px] text-[#7D7C82] mt-2">Ищу…</p>}
            {error && <p className="text-[13px] text-[#BA1111] mt-2">{error}</p>}
            {found.length > 0 && (
              <div className="mt-1 flex flex-col">
                {found.map((b) => (
                  <button key={b.secid} onClick={() => pick(b)} className="text-left py-2.5 border-b border-black/5 dark:border-white/10 last:border-0 active:opacity-60" data-bond={b.secid}>
                    <p className="text-[14px] font-semibold">{b.shortname}</p>
                    <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400 truncate">{b.isin}{b.emitent ? ` · ${b.emitent}` : ''}</p>
                  </button>
                ))}
              </div>
            )}
            {!searching && query.trim().length >= 2 && found.length === 0 && !error && <p className="text-[13px] text-[#7D7C82] mt-2">Ничего не нашлось. Попробуйте другое название или код.</p>}
            <p className="text-[12px] leading-[16px] text-[#7D7C82] dark:text-neutral-400 mt-3">Полный расчёт доступен для выпусков с известными будущими выплатами.</p>
          </>
        ) : (
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{picked.shortname}</p>
              <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400 truncate">{picked.isin}{market ? ` · номинал ${rub(market.nominal, cur)}` : ''}{market?.matDate ? ` · погашение ${dmy(market.matDate)}` : ''}</p>
            </div>
            <button onClick={reset} className="text-[12px] font-medium text-[var(--accent)] shrink-0 active:opacity-60">Другая облигация</button>
          </div>
        )}
        {picked && loading && <p className="text-[13px] text-[#7D7C82] mt-3">Загружаю цену и график выплат…</p>}
        {picked && error && <p className="text-[13px] text-[#BA1111] mt-3">{error}</p>}
      </Card>

      {market && schedule && (
        <>
          {/* Шаг 2 · Покупка */}
          <Card>
            <StepLabel>Шаг 2 · Стоимость покупки</StepLabel>
            {cur !== 'RUB' && <p className="text-[12px] text-[#7D7C82] mt-1">Номинал в {cur}: суммы показаны в валюте номинала.</p>}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Количество" value={qty} onChange={setQty} suffix="шт." />
              <Field label="Цена" value={price} onChange={setPrice} suffix="%" hint={market.pricePct === null ? 'Цены сегодня нет — укажите' : 'С биржи, можно изменить'} />
              <Field label="НКД на 1 бумагу" value={accrued} onChange={setAccrued} suffix={cur === 'RUB' ? '₽' : cur} />
              <Field label="Комиссия" value={commission} onChange={setCommission} suffix="₽" />
              <div className="col-span-2"><Field label="Дата расчёта" value={calcDate} onChange={setCalcDate} type="date" /></div>
            </div>
          </Card>

          {/* Шаг 3 · Денежный итог */}
          {result && (
            <Card>
              <StepLabel>Шаг 3 · Денежный итог</StepLabel>
              <div className="mt-2" data-result>
                <Row k="Заплатить сейчас" v={rub(result.costs, cur)} strong />
                <Row k="Будущие купоны" v={rub(result.coupons, cur)} />
                <Row k="Возврат номинала" v={rub(result.principal, cur)} />
                {result.complete ? (
                  <Row k="Разница" v={`${result.difference! > 0 ? '+' : ''}${rub(result.difference, cur)} (${result.differencePct!.toLocaleString('ru-RU')}%)`} strong color={result.difference! >= 0 ? 'text-[#11BA2D]' : 'text-[#BA1111]'} />
                ) : (
                  <div className="mt-2 text-[13px] leading-[18px]">
                    <p className="font-semibold">Полный итог не выводится</p>
                    {result.reasons.map((r) => <p key={r} className="text-[#7D7C82] dark:text-neutral-400">{r}</p>)}
                  </div>
                )}
              </div>
              {result.rows.length > 0 && (
                <div className="mt-4">
                  <p className="text-[14px] font-semibold mb-1">График купонов и возврата номинала</p>
                  {result.rows.map((r, i) => (
                    <div key={`${r.type}-${r.date}-${i}`} className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/10 last:border-0 text-[13px]" data-row>
                      <div className="min-w-0">
                        <p className="font-medium">{dmy(r.date)} · {TYPE[r.type]}</p>
                        <p className="text-[11px] text-[#7D7C82] dark:text-neutral-500">{r.amount === null ? 'сумма ещё не объявлена' : `${rub(r.amount, cur)} на 1 бумагу`}{r.nominalLeft !== null && r.type !== 'coupon' ? ` · остаток ${rub(r.nominalLeft, cur)}` : ''}</p>
                      </div>
                      <p className="font-semibold shrink-0 ml-2">{rub(r.total, cur)}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] leading-[15px] text-[#7D7C82] dark:text-neutral-500 mt-3">Налоги, реинвестирование выплат, риск изменения условий и дефолта в расчёт не входят. Фактическое право на купон зависит от даты расчётов по сделке; проверьте её у брокера перед покупкой.</p>
            </Card>
          )}
        </>
      )}

      <Method />
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="rounded-[12px] bg-[#F9F9F9] dark:bg-neutral-900 p-4">{children}</div>;
const StepLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-[12px] font-medium text-[var(--accent)]">{children}</p>;

// «Метод расчёта», условный пример и вопросы — тексты со страницы сайта investfuture.ru/tools/bond-calculator
const FAQ: [string, string][] = [
  ['Как считается стоимость покупки облигации?', 'Денежную цену одной бумаги получают, умножая текущий номинал на цену в процентах и деля на 100. К ней прибавляют НКД, затем умножают на количество облигаций и добавляют комиссию покупки.'],
  ['Зачем в расчёте нужен НКД?', 'Накопленный купонный доход входит в сумму, которую покупатель платит за облигацию. Будущий купон показывается отдельно в графике выплат. НКД не вычитается из купона повторно.'],
  ['Как учитывается амортизация облигации?', 'Каждая частичная выплата номинала включается в график. После неё показан остаток номинала. Будущие купоны берутся из известного графика выпуска, а не рассчитываются по прежнему номиналу.'],
  ['Можно ли получить купон, если купить облигацию перед выплатой?', 'Право на купон определяется датой фиксации владельцев, а не только датой выплаты. Калькулятор исключает купон, если дата фиксации уже наступила. При покупке незадолго до этой даты проверьте срок расчётов по сделке у брокера.'],
  ['Показывает ли калькулятор доходность к погашению?', 'Нет. Калькулятор показывает денежную разницу между будущими выплатами и затратами на покупку, а также процент за весь оставшийся срок. Это не годовая эффективная доходность к погашению: время отдельных выплат и реинвестирование не учитываются.'],
  ['Почему для некоторых облигаций нет итогового расчёта?', 'Полный денежный итог не выводится, если будущие купоны неизвестны, график возврата номинала неполон, есть оферта или данные выпуска устарели. Подтверждённые события можно посмотреть без подстановки предполагаемых сумм.'],
];

const Method: React.FC = () => (
  <div className="flex flex-col gap-3 mt-2" data-method>
    <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400">Метод расчёта</p>
    <h4 className="text-[17px] leading-[22px] font-semibold -mt-2">Как рассчитать выплаты и денежный результат по облигации</h4>
    <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400">Калькулятор сравнивает сумму покупки с купонами и возвратом номинала, которые ещё предстоят после выбранной даты расчёта. Для полного итога нужен подтверждённый график выплат до погашения.</p>
    {[
      ['01', 'Стоимость покупки: цена, НКД и комиссия', 'Биржевая цена облигации указывается в процентах от её текущего номинала. Если часть номинала уже вернулась через амортизацию, для денежной цены используется уменьшенный остаток. НКД добавляется к цене покупки, а комиссия — к общим затратам.', 'Затраты = количество × (текущий номинал × цена / 100 + НКД) + комиссия'],
      ['02', 'График купонов и возврата номинала', 'В таблицу попадают будущие купоны, частичные выплаты номинала и его окончательное погашение. При амортизации возврат номинала — отдельное денежное поступление; после него остаток долга уменьшается. Суммы следующих купонов берутся из графика выпуска, а не повторяются по старому номиналу. Купон учитывается, только если дата фиксации владельцев ещё не наступила.', null],
      ['03', 'Денежный итог при удержании до погашения', 'Сумма известных будущих купонов и возврата номинала сравнивается с затратами на покупку. Положительная разница означает, что по этому сценарию поступления больше затрат; отрицательная — меньше. Налоги, реинвестирование выплат, риск изменения условий и дефолта в расчёт не входят.', 'Денежная разница = будущие выплаты − затраты на покупку'],
    ].map(([n, h, t, f]) => (
      <Card key={n as string}>
        <p className="text-[12px] font-semibold text-[var(--accent)]">{n}</p>
        <p className="text-[14px] font-semibold mt-0.5">{h}</p>
        <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400 mt-1">{t}</p>
        {f && <p className="text-[12px] leading-[16px] font-medium mt-2 px-3 py-2 rounded-[8px] bg-white dark:bg-neutral-800">{f}</p>}
      </Card>
    ))}
    <Card>
      <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400">Условный пример · 1 облигация</p>
      <p className="text-[14px] font-semibold mt-0.5">От 95% цены к сумме в рублях</p>
      <div className="mt-2" data-example>
        {[['Текущий номинал', '1 000 ₽'], ['Цена 95% номинала', '950 ₽'], ['НКД и комиссия', '20 ₽ + 5 ₽'], ['Заплатить сейчас', '975 ₽'], ['Будущие купоны', '160 ₽'], ['Возврат номинала', '1 000 ₽'], ['Разница', '185 ₽']].map(([k, v]) => <Row key={k} k={k} v={v} strong={k === 'Заплатить сейчас' || k === 'Разница'} />)}
      </div>
      <p className="text-[11px] text-[#7D7C82] dark:text-neutral-500 mt-2">Цифры иллюстрируют формулу, а не выплаты конкретного выпуска.</p>
    </Card>
    <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400 mt-1">Ответы на вопросы</p>
    <h4 className="text-[17px] leading-[22px] font-semibold -mt-2">Что важно знать перед расчётом облигации</h4>
    <div className="flex flex-col">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group border-b border-black/5 dark:border-white/10 py-2.5">
          <summary className="list-none flex items-center justify-between gap-3 cursor-pointer text-[14px] font-medium">
            {q}
            <ChevronDown className="w-4 h-4 shrink-0 text-[#7D7C82] transition-transform group-open:rotate-180" />
          </summary>
          <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400 mt-2">{a}</p>
        </details>
      ))}
    </div>
  </div>
);

const Row: React.FC<{ k: string; v: string; strong?: boolean; color?: string }> = ({ k, v, strong, color }) => (
  <div className="flex items-baseline justify-between py-1 gap-3">
    <span className="text-[13px] text-[#7D7C82] dark:text-neutral-400">{k}</span>
    <span className={`text-right ${strong ? 'text-[16px] font-semibold' : 'text-[14px]'} ${color ?? ''}`}>{v}</span>
  </div>
);
