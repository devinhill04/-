import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
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
    <div className="flex items-center h-11 px-3 rounded-[10px] bg-[#F5F5F5] dark:bg-neutral-800">
      <input inputMode={type === 'date' ? undefined : 'decimal'} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#161616] dark:text-white" />
      {suffix && <span className="text-[13px] text-[#7D7C82] dark:text-neutral-400 ml-2">{suffix}</span>}
    </div>
    {hint && <span className="text-[11px] text-[#7D7C82] dark:text-neutral-500">{hint}</span>}
  </label>
);

// Калькулятор выплат по облигации — тот же метод, что на сайте (см. entities/bonds/model/bond-calc.ts)
export const BondCalculator: React.FC<{ initialCode?: string | null; source: string; onClose: () => void }> = ({ initialCode, source, onClose }) => {
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
  return (
    <div className="fixed inset-0 z-[85] bg-white dark:bg-[#111111] text-[#161616] dark:text-white flex flex-col" role="dialog" aria-label="Калькулятор облигаций">
      <div className="flex items-center gap-2 px-3 h-12 shrink-0 border-b border-black/5 dark:border-white/10">
        <button onClick={() => (picked ? (setPicked(null), setMarket(null), setSchedule(null), setQuery('')) : onClose())} aria-label="Назад" className="p-1 active:opacity-60"><ArrowLeft className="w-6 h-6" /></button>
        <span className="text-[16px] font-semibold flex-1">Калькулятор облигаций</span>
        <button onClick={onClose} aria-label="Закрыть калькулятор" className="p-1 active:opacity-60"><X className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        {!picked && (
          <>
            <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400 mt-3">Узнайте стоимость покупки и каждый будущий купон и возврат номинала. Расчёт по подтверждённому графику выпуска.</p>
            <div className="mt-3 flex items-center h-11 px-3 rounded-[10px] bg-[#F5F5F5] dark:bg-neutral-800">
              <Search className="w-4 h-4 text-[#7D7C82] mr-2 shrink-0" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название, SECID или ISIN" className="flex-1 min-w-0 bg-transparent outline-none text-[15px]" />
            </div>
            {searching && <p className="text-[13px] text-[#7D7C82] mt-3">Ищу…</p>}
            {error && <p className="text-[13px] text-[#BA1111] mt-3">{error}</p>}
            <div className="mt-2 flex flex-col">
              {found.map((b) => (
                <button key={b.secid} onClick={() => pick(b)} className="text-left py-3 border-b border-black/5 dark:border-white/10 active:opacity-60" data-bond={b.secid}>
                  <p className="text-[15px] font-semibold">{b.shortname}</p>
                  <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400">{b.isin}{b.emitent ? ` · ${b.emitent}` : ''}</p>
                </button>
              ))}
              {!searching && query.trim().length >= 2 && found.length === 0 && !error && <p className="text-[13px] text-[#7D7C82] mt-3">Ничего не нашлось. Попробуйте другое название или код.</p>}
            </div>
          </>
        )}

        {picked && (
          <>
            <div className="mt-3">
              <p className="text-[18px] font-semibold">{picked.shortname}</p>
              <p className="text-[12px] text-[#7D7C82] dark:text-neutral-400">{picked.isin}{market ? ` · номинал ${rub(market.nominal, cur)}` : ''}{market?.matDate ? ` · погашение ${dmy(market.matDate)}` : ''}</p>
            </div>
            {loading && <p className="text-[13px] text-[#7D7C82] mt-4">Загружаю цену и график выплат…</p>}
            {error && <p className="text-[13px] text-[#BA1111] mt-4">{error}</p>}
            {market && schedule && (
              <>
                {cur !== 'RUB' && <p className="text-[12px] text-[#7D7C82] mt-2">Номинал в {cur}: суммы показаны в валюте номинала.</p>}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Field label="Количество" value={qty} onChange={setQty} suffix="шт." />
                  <Field label="Цена" value={price} onChange={setPrice} suffix="% номинала" hint={market.pricePct === null ? 'Цены сегодня нет — укажите свою' : 'Цена с биржи, можно изменить'} />
                  <Field label="НКД на 1 бумагу" value={accrued} onChange={setAccrued} suffix={cur === 'RUB' ? '₽' : cur} />
                  <Field label="Комиссия" value={commission} onChange={setCommission} suffix="₽" />
                  <div className="col-span-2"><Field label="Дата расчёта" value={calcDate} onChange={setCalcDate} type="date" /></div>
                </div>

                {result && (
                  <div className="mt-5 rounded-[12px] bg-[#F9F9F9] dark:bg-neutral-900 p-4" data-result>
                    <Row k="Заплатить сейчас" v={rub(result.costs, cur)} strong />
                    <Row k="Будущие купоны" v={rub(result.coupons, cur)} />
                    <Row k="Возврат номинала" v={rub(result.principal, cur)} />
                    {result.complete ? (
                      <Row k="Разница" v={`${result.difference! > 0 ? '+' : ''}${rub(result.difference, cur)} (${result.differencePct!.toLocaleString('ru-RU')}% за весь срок)`} strong color={result.difference! >= 0 ? 'text-[#11BA2D]' : 'text-[#BA1111]'} />
                    ) : (
                      <div className="mt-2 text-[13px] leading-[18px]">
                        <p className="font-semibold">Полный итог не выводится</p>
                        {result.reasons.map((r) => <p key={r} className="text-[#7D7C82] dark:text-neutral-400">{r}</p>)}
                      </div>
                    )}
                  </div>
                )}

                {result && result.rows.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[15px] font-semibold mb-2">Выплаты</p>
                    <div className="flex flex-col">
                      {result.rows.map((r, i) => (
                        <div key={`${r.type}-${r.date}-${i}`} className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/10 text-[13px]" data-row>
                          <div>
                            <p className="font-medium">{dmy(r.date)} · {TYPE[r.type]}</p>
                            <p className="text-[11px] text-[#7D7C82] dark:text-neutral-500">{r.amount === null ? 'сумма ещё не объявлена' : `${rub(r.amount, cur)} на 1 бумагу`}{r.nominalLeft !== null && r.type !== 'coupon' ? ` · остаток номинала ${rub(r.nominalLeft, cur)}` : ''}</p>
                          </div>
                          <p className="font-semibold shrink-0 ml-2">{rub(r.total, cur)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[11px] leading-[15px] text-[#7D7C82] dark:text-neutral-500 mt-5">
                  Купон учитывается, если дата фиксации владельцев ещё не наступила; право на выплату зависит от даты расчётов по сделке — проверьте у брокера. Налоги, реинвестирование, риск изменения условий и дефолта не учитываются. Это не инвестиционная рекомендация. Данные Мосбиржи.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: string; strong?: boolean; color?: string }> = ({ k, v, strong, color }) => (
  <div className="flex items-baseline justify-between py-1 gap-3">
    <span className="text-[13px] text-[#7D7C82] dark:text-neutral-400">{k}</span>
    <span className={`text-right ${strong ? 'text-[16px] font-semibold' : 'text-[14px]'} ${color ?? ''}`}>{v}</span>
  </div>
);
