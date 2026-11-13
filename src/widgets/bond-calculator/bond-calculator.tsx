import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, Search, X } from 'lucide-react';
import { BondCalcResult, bondTypeLabel, calcBond, nearestCoupon } from '../../entities/bonds/model/bond-calc';
import { BondMarket, BondSchedule, BondSearchItem, loadMarket, loadSchedule, searchBonds } from '../../entities/bonds/model/iss-bonds';
import { SITE_URLS } from '../../entities/calendar/model/api';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { reportSource } from '../../shared/diagnostics/source-status';
import { copyText } from '../../shared/lib/copy-text';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { plural } from '../../shared/lib/plural';
import { triggerHaptic } from '../../lib/telegram';

// Калькулятор выплат по облигации — повторяет investfuture.ru/tools/bond-calculator (вид и метод, см. bond-calc.ts).
// На телефоне поля идут в один столбец, плитки — сеткой 2 × 2; ширина ограничена экраном вкладки.

const todayIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' }); // YYYY-MM-DD по Москве
const money = (x: number | null, cur = 'RUB') => (x === null ? '—' : `${x.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur === 'RUB' ? '₽' : cur}`);
const dmy = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
const dmyhm = (d: Date) => `${d.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}, ${d.toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })}`;
const TYPE = { coupon: 'Купон', amortization: 'Амортизация', redemption: 'Погашение' } as const;
const toNum = (s: string) => { const n = Number(s.replace(',', '.').replace(/\s/g, '')); return Number.isFinite(n) ? n : NaN; };
const PAPERS: [string, string, string] = ['бумагу', 'бумаги', 'бумаг'];
const BONDS_CATALOG = 'https://investfuture.ru/bonds';

const StepLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--accent)]">{children}</p>;
const Hint: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Подсказка" className="w-[18px] h-[18px] shrink-0 rounded-full border border-[#7D7C82] text-[#7D7C82] text-[11px] leading-[16px] font-semibold active:opacity-60">i</button>
      {open && <span className="basis-full text-[12px] leading-[16px] text-[#7D7C82] dark:text-neutral-400 mt-1">{text}</span>}
    </>
  );
};
const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string; note?: string }> = ({ label, value, onChange, hint, note }) => (
  <label className="flex flex-col gap-1.5">
    <span className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold text-[#161616] dark:text-white">{label}{hint && <Hint text={hint} />}</span>
    <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 px-3 rounded-[10px] bg-white dark:bg-neutral-900 border border-[#E3E1EA] dark:border-white/15 outline-none text-[15px] text-[#161616] dark:text-white focus:border-[var(--accent)]" />
    {note && <span className="text-[12px] leading-[16px] text-[#7D7C82] dark:text-neutral-400">{note}</span>}
  </label>
);
const Tile: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="rounded-[10px] bg-white dark:bg-neutral-900 border border-[#E9E3FF] dark:border-white/10 px-3 py-2.5">
    <p className="text-[11px] text-[#7D7C82] dark:text-neutral-400">{k}</p>
    <p className="text-[14px] font-semibold mt-0.5">{v}</p>
  </div>
);
const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-white dark:bg-neutral-900 border border-[#E3E1EA] dark:border-white/15">{children}</span>;

export const BondCalculator: React.FC<{ initialCode?: string | null; source: string }> = ({ initialCode, source }) => {
  const [query, setQuery] = useState(initialCode ?? '');
  const [found, setFound] = useState<BondSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<BondSearchItem | null>(null);
  const [market, setMarket] = useState<BondMarket | null>(null);
  const [schedule, setSchedule] = useState<BondSchedule | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [accrued, setAccrued] = useState('');
  const [commission, setCommission] = useState('0');
  const [result, setResult] = useState<{ r: BondCalcResult; qty: number } | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const calcDate = todayIso();

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
        if (initialCode && r.length > 0) { const exact = r.find((x) => x.secid === initialCode || x.isin === initialCode); if (exact) pick(exact); }
      } catch (e) { if (alive) setError('Не удалось связаться с Мосбиржей. Проверьте интернет и попробуйте ещё раз.'); reportSource('bonds', false, e); }
      finally { if (alive) setSearching(false); }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [query, picked]);

  const pick = async (b: BondSearchItem) => {
    triggerHaptic('light');
    setPicked(b); setQuery(b.shortname); setFound([]); setLoading(true); setError(null); setMarket(null); setSchedule(null); setResult(null);
    AnalyticsService.track('calc_bond_select', { secid: b.secid });
    try {
      const [m, s] = await Promise.all([loadMarket(b.secid, b.board), loadSchedule(b.secid, todayIso())]);
      if (!m) throw new Error('нет рыночных данных по бумаге');
      setMarket(m); setSchedule(s); setLoadedAt(new Date());
      setPrice(m.pricePct !== null ? String(m.pricePct).replace('.', ',') : '');
      setAccrued(String(m.accrued).replace('.', ','));
      reportSource('bonds', true, `${b.shortname}: событий в графике ${s.events.length}`);
    } catch (e) {
      setError('Не удалось загрузить данные по облигации. Попробуйте ещё раз или выберите другую.');
      reportSource('bonds', false, e);
    } finally { setLoading(false); }
  };

  const clear = () => { setPicked(null); setMarket(null); setSchedule(null); setResult(null); setQuery(''); setError(null); };

  const calculate = () => {
    if (!market || !schedule) return;
    const q = Math.floor(toNum(qty)), p = toNum(price), a = toNum(accrued), c = toNum(commission);
    if (!(q > 0)) return setInputError('Укажите количество бумаг.');
    if (!(p > 0)) return setInputError('Укажите цену в процентах от текущего номинала.');
    if (!(a >= 0) || !(c >= 0)) return setInputError('НКД и комиссия не могут быть отрицательными.');
    setInputError(null);
    triggerHaptic('light');
    const r = calcBond({ nominal: market.nominal, pricePct: p, accrued: a, qty: q, commission: c, calcDate, events: schedule.events, offerDate: schedule.offerDate ?? market.offerDate });
    setResult({ r, qty: q });
    AnalyticsService.track('calc_result', { secid: market.secid, complete: r.complete ? 'yes' : 'no' });
  };

  const cur = market?.currency ?? 'RUB';
  const nc = schedule ? nearestCoupon(schedule.events, calcDate) : null;
  const futureCount = schedule ? schedule.events.filter((e) => (e.type === 'coupon' ? (e.recordDate ?? e.date) > calcDate : e.date > calcDate)).length : 0;
  const priceNum = toNum(price);
  const bondUrl = picked ? SITE_URLS.bond(picked.isin) : '';

  return (
    <div className="flex flex-col gap-4 text-[#161616] dark:text-white" data-calculator="bond">
      <div className="rounded-[16px] bg-white dark:bg-[#161616] border border-black/5 dark:border-white/10 p-4 flex flex-col gap-4">
        {/* Шаг 1 · Выбор выпуска */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <StepLabel>Шаг 1 · Выбор выпуска</StepLabel>
              <h3 className="text-[20px] leading-[25px] font-bold mt-1">Найдите облигацию</h3>
            </div>
            <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] text-[14px] font-bold flex items-center justify-center">01</span>
          </div>
          <p className="text-[13px] leading-[18px] text-[#55545A] dark:text-neutral-400 mt-1.5">Введите название облигации или её биржевой код и выберите выпуск с подтверждённым графиком выплат.</p>
          <p className="text-[13px] font-semibold mt-4">Облигация</p>
          <div className="mt-1.5 flex items-center h-12 pl-3 pr-2 rounded-[10px] bg-white dark:bg-neutral-900 border border-[#E3E1EA] dark:border-white/15">
            <Search className="w-[18px] h-[18px] text-[var(--accent)] mr-2 shrink-0" />
            <input value={query} onChange={(e) => { if (picked) clear(); setQuery(e.target.value); }} placeholder="Название, SECID или ISIN" className="flex-1 min-w-0 bg-transparent outline-none text-[15px]" />
            {query && <button onClick={clear} aria-label="Очистить" className="w-7 h-7 rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center active:opacity-60"><X className="w-4 h-4" /></button>}
          </div>
          {searching && <p className="text-[13px] text-[#7D7C82] mt-2">Ищу…</p>}
          {!picked && error && <p className="text-[13px] text-[#BA1111] mt-2">{error}</p>}
          {found.length > 0 && (
            <div className="mt-1 flex flex-col rounded-[10px] border border-[#E3E1EA] dark:border-white/15 overflow-hidden">
              {found.map((b) => (
                <button key={b.secid} onClick={() => pick(b)} className="text-left px-3 py-2.5 border-b border-[#EFEDF4] dark:border-white/10 last:border-0 active:bg-[var(--accent-soft)]" data-bond={b.secid}>
                  <p className="text-[14px] font-semibold">{b.shortname}</p>
                  <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400 truncate">{b.isin}{b.emitent ? ` · ${b.emitent}` : ''}</p>
                </button>
              ))}
            </div>
          )}
          {!picked && !searching && query.trim().length >= 2 && found.length === 0 && !error && <p className="text-[13px] text-[#7D7C82] mt-2">Ничего не нашлось. Попробуйте другое название или код.</p>}
          <p className="text-[12px] leading-[16px] text-[var(--accent)] mt-2">
            Полный расчёт доступен для выпусков с известными будущими выплатами.{' '}
            <button onClick={() => openPostLink(BONDS_CATALOG, 'Каталог облигаций', { silent: true })} className="underline">Выбрать облигацию в каталоге</button>.
          </p>
        </div>

        {picked && loading && <p className="text-[13px] text-[#7D7C82]">Загружаю цену и график выплат…</p>}
        {picked && error && <p className="text-[13px] text-[#BA1111]">{error}</p>}

        {picked && market && schedule && (
          <>
            {/* Шаг 2 · Параметры сделки */}
            <div className="rounded-[14px] bg-[#F8F6FF] dark:bg-neutral-900 border border-[#E9E3FF] dark:border-white/10 p-3.5" data-step2>
              <div className="flex items-start justify-between gap-2">
                <StepLabel>Шаг 2 · Параметры сделки</StepLabel>
                <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F7EA] text-[#11873A]">График актуален</span>
              </div>
              <h4 className="text-[20px] font-bold mt-1.5">{market.shortname}</h4>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Chip>{market.secid}</Chip>
                {market.isin !== market.secid && <Chip>{market.isin}</Chip>}
                {market.matDate && <Chip>Погашение {dmy(market.matDate)}</Chip>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="col-span-2"><Tile k="Тип выпуска" v={bondTypeLabel(schedule.events, calcDate)} /></div>
                <Tile k="Текущий номинал" v={money(market.nominal, cur)} />
                <Tile k="Ближайший доступный купон" v={nc ? `${nc.amount === null ? 'не объявлен' : money(nc.amount, cur)} · ${dmy(nc.date)}` : 'нет'} />
                <div className="col-span-2"><Tile k="Будущие события графика" v={String(futureCount)} /></div>
              </div>
              <button onClick={() => openPostLink(bondUrl, market.shortname, { silent: true })} className="mt-3 text-[14px] font-semibold text-[var(--accent)] underline underline-offset-4 inline-flex items-center gap-1 active:opacity-60">
                Все параметры и график выпуска <ArrowUpRight className="w-4 h-4" />
              </button>
              <p className="text-[12px] leading-[17px] text-[#55545A] dark:text-neutral-400 mt-2">
                Расчёт на {dmy(calcDate)}. {loadedAt && `Данные выпуска загружены ${dmyhm(loadedAt)}.`}{market.lastTradeAt ? ` Цена последней сделки: ${dmy(market.lastTradeAt)}, ${market.lastTradeAt.slice(11, 16)}.` : ''}
              </p>
              <p className="text-[12px] leading-[17px] text-[#55545A] dark:text-neutral-400 mt-1.5">Текущий номинал одной бумаги: {money(market.nominal, cur)}. Цена указана в процентах именно от него.</p>
              {cur !== 'RUB' && <p className="text-[12px] text-[#55545A] mt-1.5">Номинал в {cur}: суммы показаны в валюте номинала.</p>}
            </div>

            {/* Условия покупки */}
            <div>
              <h4 className="text-[17px] font-bold">Условия покупки</h4>
              <p className="text-[13px] leading-[18px] text-[#55545A] dark:text-neutral-400 mt-1">Проверьте биржевые значения и измените их под свою сделку.</p>
              <div className="flex flex-col gap-4 mt-3">
                <Field label="Количество бумаг" value={qty} onChange={setQty} />
                <Field label="Цена, % текущего номинала" value={price} onChange={setPrice} hint="Биржевая цена облигации указывается в процентах от её текущего номинала."
                  note={priceNum > 0 ? `Денежная цена одной бумаги без НКД: ${money(Math.round(market.nominal * priceNum) / 100, cur)}` : market.pricePct === null ? 'Сегодня сделок не было — укажите цену своей сделки.' : undefined} />
                <Field label={`НКД на одну бумагу, ${cur === 'RUB' ? '₽' : cur}`} value={accrued} onChange={setAccrued} hint="Накопленный купонный доход входит в сумму, которую покупатель платит за облигацию." />
                <Field label="Комиссия покупки, ₽" value={commission} onChange={setCommission} note="Общая комиссия за всю сделку." />
              </div>
              <p className="text-[12px] leading-[16px] text-[var(--accent)] mt-3">Цена и НКД предзаполнены биржевыми данными, если доступны. Их можно изменить под условия своей сделки.</p>
              {inputError && <p className="text-[13px] text-[#BA1111] mt-2">{inputError}</p>}
              <button onClick={calculate} className="mt-3 h-11 px-5 rounded-[10px] bg-[var(--accent)] text-white text-[14px] font-semibold shadow-[0_4px_12px_rgba(87,55,250,0.25)] active:opacity-80" data-calc-button>
                Рассчитать выплаты
              </button>
            </div>
          </>
        )}
      </div>

      {result && market && (
        <div className="rounded-[16px] bg-white dark:bg-[#161616] border border-black/5 dark:border-white/10 p-4" data-result>
          <h3 className="text-[20px] leading-[25px] font-bold">Результат при удержании до погашения</h3>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-[12px] bg-[var(--accent)] text-white px-3 py-3"><p className="text-[12px] font-semibold opacity-90">Заплатить сейчас</p><p className="text-[18px] font-bold mt-3">{money(result.r.costs, cur)}</p></div>
            <ResTile k="Получить купоны" v={money(result.r.coupons, cur)} />
            <ResTile k="Вернётся номинал" v={money(result.r.principal, cur)} />
            <ResTile k="Разница" v={result.r.difference === null ? '—' : money(result.r.difference, cur)} />
          </div>
          {result.r.complete && result.r.differencePct !== null ? (
            <p className="text-[14px] leading-[19px] mt-3" data-yield>Доходность за весь оставшийся срок: {result.r.differencePct.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%. Это не годовая эффективная доходность.</p>
          ) : (
            <div className="mt-3 text-[13px] leading-[18px]">
              <p className="font-semibold">Полный итог не выводится</p>
              {result.r.reasons.map((r) => <p key={r} className="text-[#55545A] dark:text-neutral-400">{r}</p>)}
            </div>
          )}

          {result.r.rows.length > 0 && (
            <>
              <h4 className="text-[17px] font-bold mt-5">График будущих выплат</h4>
              <div className="mt-2 rounded-[12px] border border-[#E9E3FF] dark:border-white/10 overflow-hidden" data-schedule>
                {result.r.rows.map((r, i) => (
                  <div key={`${r.type}-${r.date}-${i}`} className={`px-3 py-2.5 ${i ? 'border-t border-[#EFEDF4] dark:border-white/10' : ''}`} data-row>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-semibold">{dmy(r.date)}</span>
                      <span className="text-[13px]">{TYPE[r.type]}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <Cell k="На одну бумагу" v={r.amount === null ? 'не объявлен' : money(r.amount, cur)} />
                      <Cell k={`На ${result.qty} ${plural(result.qty, PAPERS)}`} v={money(r.total, cur)} />
                      <Cell k="Остаток номинала" v={r.type === 'coupon' ? '–' : money(r.nominalLeft, cur)} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="text-[12px] leading-[16px] text-[#55545A] dark:text-neutral-400 mt-3">Расчёт до налогов, без реинвестирования и риска изменения условий выпуска. Комиссия покупки учтена. Цена будущей продажи не рассчитывается.</p>
          <button onClick={async () => { const ok = await copyText(bondUrl); setCopied(ok); setTimeout(() => setCopied(false), 2000); }} className="mt-3 h-10 px-4 rounded-[10px] border border-[#D9D3F5] dark:border-white/20 text-[14px] text-[var(--accent)] active:opacity-60">
            {copied ? 'Ссылка скопирована' : 'Скопировать ссылку на выпуск'}
          </button>
          <div className="mt-3">
            <button onClick={() => openPostLink(BONDS_CATALOG, 'Материалы об облигациях', { silent: true })} className="text-[14px] font-semibold text-[var(--accent)] underline underline-offset-4 active:opacity-60">Читать материалы об облигациях</button>
          </div>
        </div>
      )}

      <Method />
    </div>
  );
};

const Cell: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="min-w-0"><p className="text-[10px] leading-[13px] text-[#7D7C82] dark:text-neutral-400">{k}</p><p className="text-[12px] font-medium mt-0.5">{v}</p></div>
);
const ResTile: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="rounded-[12px] bg-[#F8F6FF] dark:bg-neutral-900 border border-[#E9E3FF] dark:border-white/10 px-3 py-3"><p className="text-[12px] font-semibold">{k}</p><p className="text-[18px] font-bold mt-3">{v}</p></div>
);
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="rounded-[12px] bg-[#F9F9F9] dark:bg-neutral-900 p-4">{children}</div>;

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

const Row: React.FC<{ k: string; v: string; strong?: boolean }> = ({ k, v, strong }) => (
  <div className="flex items-baseline justify-between py-1 gap-3">
    <span className="text-[13px] text-[#7D7C82] dark:text-neutral-400">{k}</span>
    <span className={`text-right ${strong ? 'text-[16px] font-semibold' : 'text-[14px]'}`}>{v}</span>
  </div>
);
