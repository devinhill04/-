import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PortfolioResult, Position, Security, calcPortfolio, searchSecurities } from '../../entities/portfolio/model/portfolio-income';
import { loadDecisions } from '../../entities/dividends/model/dividends';
import { loadMarket, loadSchedule } from '../../entities/bonds/model/iss-bonds';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { reportSource } from '../../shared/diagnostics/source-status';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

// Калькулятор дивидендов и купонов портфеля — повторяет investfuture.ru/tools/portfolio-income (вид, тексты, методология).
const MAX = 10;
const todayIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
const dmy = (iso: string) => iso.split('-').reverse().join('.');
const money = (x: number) => `${x.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
const KIND = { dividend: 'Дивиденд', coupon: 'Купон', amortization: 'Амортизация', redemption: 'Погашение' } as const;
const L = { dividends: 'https://investfuture.ru/dividends', calendar: 'https://investfuture.ru/calendar/dividends', bonds: 'https://investfuture.ru/bonds', method: 'https://investfuture.ru/methodology/financial-data#portfolio', moex: 'https://www.moex.com/ru/bonds', fns: 'https://www.nalog.gov.ru/rn21/promo/new2025/' };
const inputCls = 'w-full h-12 px-3 rounded-[10px] bg-white dark:bg-neutral-900 border border-[#E3E1EA] dark:border-white/15 text-[15px] text-[#161616] dark:text-white outline-none focus:border-[var(--accent)]';
const A: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => <button onClick={() => openPostLink(url, String(children), { silent: true })} className="text-[var(--accent)] underline underline-offset-4 text-left">{children}</button>;
const Card: React.FC<{ children: React.ReactNode; data?: string }> = ({ children, data }) => <div className="rounded-[16px] bg-white dark:bg-[#161616] border border-black/5 dark:border-white/10 p-4" data-card={data}>{children}</div>;
const H: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-[19px] leading-[24px] font-bold">{children}</h3>;

interface Row { key: number; sec: Security | null; query: string; found: Security[]; qty: string }
let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, sec: null, query: '', found: [], qty: '1' });

export const PortfolioCalculator: React.FC<{ onOpenDividends?: () => void }> = ({ onOpenDividends }) => {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [ownFrom, setOwnFrom] = useState(todayIso());
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // поиск по каждой позиции с паузой
  const [typing, setTyping] = useState<{ key: number; q: string } | null>(null);
  useEffect(() => {
    if (!typing || typing.q.trim().length < 2) return;
    const t = setTimeout(async () => {
      try { set(typing.key, { found: await searchSecurities(typing.q) }); } catch (e) { reportSource('portfolio', false, e); }
    }, 350);
    return () => clearTimeout(t);
  }, [typing]);

  const calculate = async () => {
    const chosen = rows.filter((r) => r.sec);
    if (chosen.length === 0) return setError('Выберите хотя бы одну бумагу.');
    const bad = chosen.find((r) => !(Number.isInteger(Number(r.qty)) && Number(r.qty) >= 1));
    if (bad) return setError(`Укажите количество для «${bad.sec!.name}» — целое число от 1.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ownFrom)) return setError('Укажите дату владения.');
    setError(null); setBusy(true); triggerHaptic('light');
    try {
      const positions: Position[] = await Promise.all(chosen.map(async (r) => {
        const s = r.sec!;
        if (s.kind === 'share') return { kind: 'share' as const, id: s.secid, name: s.name, qty: Number(r.qty), decisions: await loadDecisions(s.secid) };
        const [sch, m] = await Promise.all([loadSchedule(s.secid, todayIso()), loadMarket(s.secid, s.board)]);
        return { kind: 'bond' as const, id: s.secid, name: s.name, qty: Number(r.qty), events: sch.events, offerDate: sch.offerDate ?? m?.offerDate ?? null, currency: m?.currency ?? 'RUB' };
      }));
      const res = calcPortfolio(positions, ownFrom, todayIso());
      setResult(res);
      AnalyticsService.track('calc_portfolio_result', { positions: String(positions.length), payments: String(res.rows.length) });
      reportSource('portfolio', true, `позиций ${positions.length}, выплат ${res.rows.length}`);
    } catch (e) {
      setError('Не удалось загрузить данные с Мосбиржи. Проверьте интернет и попробуйте ещё раз.');
      reportSource('portfolio', false, e);
    } finally { setBusy(false); }
  };

  const months = result ? Object.entries(result.rows.reduce<Record<string, typeof result.rows>>((acc, r) => ((acc[r.date.slice(0, 7)] ??= []).push(r), acc), {})) : [];
  const monthName = (ym: string) => { const s = new Date(`${ym}-15T12:00:00Z`).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', ''); return s[0].toUpperCase() + s.slice(1); };

  return (
    <div className="flex flex-col gap-4 text-[#161616] dark:text-white" data-calculator="portfolio">
      <Card>
        <H>Калькулятор дивидендов и купонов портфеля</H>
        <p className="text-[14px] leading-[20px] text-[#55545A] dark:text-neutral-400 mt-2">Укажите акции, облигации и количество бумаг. Получите календарь опубликованных выплат на ближайшие 12 месяцев: дивиденды, купоны и отдельно возврат номинала. Рекомендации и прогнозы показаны с пометками, отдельно от утверждённых выплат.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[13px]"><A url={L.dividends}>Дивиденды акций</A><A url={L.calendar}>Дивидендный календарь</A><A url={L.bonds}>Каталог облигаций</A></div>
      </Card>

      <Card data="positions">
        <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#55545A] dark:text-neutral-400">Состав портфеля</p>
        <H>Ваши позиции</H>
        <p className="text-[14px] leading-[20px] mt-2">Расчёт до налогов и комиссий. Утверждённое решение или опубликованный график не гарантирует фактическое зачисление; выплаты зависят от исполнения обязательств эмитентом.</p>
        <p className="text-[12px] leading-[17px] text-[var(--accent)] mt-2">Найдите бумагу по названию или коду и укажите количество в штуках. Можно добавить до 10 позиций.</p>
        <div className="flex flex-col gap-3 mt-3">
          {rows.map((r, i) => (
            <fieldset key={r.key} className="rounded-[12px] border border-[#E3E1EA] dark:border-white/15 px-3 pb-3 pt-1" data-position>
              <legend className="px-1.5 text-[14px] font-bold">Позиция {i + 1}</legend>
              <p className="text-[13px] font-semibold mb-1.5">Бумага {i + 1}</p>
              <div className="relative">
                <div className="flex items-center h-12 pl-3 pr-2 rounded-[10px] bg-white dark:bg-neutral-900 border border-[#E3E1EA] dark:border-white/15">
                  <Search className="w-4 h-4 text-[var(--accent)] mr-2 shrink-0" />
                  <input value={r.sec ? `${r.sec.name} · ${r.sec.kind === 'bond' ? r.sec.isin : r.sec.secid}` : r.query} placeholder="Название или код"
                    onChange={(e) => { set(r.key, { sec: null, query: e.target.value, found: [] }); setTyping({ key: r.key, q: e.target.value }); }} className="flex-1 min-w-0 bg-transparent outline-none text-[15px]" data-position-search />
                  {(r.sec || r.query) && <button onClick={() => set(r.key, { sec: null, query: '', found: [] })} aria-label="Очистить" className="w-7 h-7 rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center"><X className="w-4 h-4" /></button>}
                </div>
                {!r.sec && r.found.length > 0 && (
                  <div className="mt-1 rounded-[10px] border border-[#E3E1EA] dark:border-white/15 overflow-hidden">
                    {r.found.map((s) => (
                      <button key={s.secid} onClick={() => { triggerHaptic('light'); set(r.key, { sec: s, found: [], query: '' }); }} className="w-full text-left px-3 py-2 border-b border-[#EFEDF4] dark:border-white/10 last:border-0 active:bg-[var(--accent-soft)]" data-security={s.secid}>
                        <span className="text-[14px] font-semibold">{s.name}</span> <span className="text-[12px] text-[#7D7C82]">· {s.kind === 'bond' ? s.isin : s.secid} · {s.kind === 'bond' ? 'облигация' : 'акция'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-end gap-3 mt-3">
                <label className="flex-1"><p className="text-[13px] font-semibold mb-1.5">Количество, шт.</p><input inputMode="numeric" value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} className={inputCls} data-position-qty /></label>
                <button onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [emptyRow()]))} className="h-12 px-2 text-[14px] text-[var(--accent)] active:opacity-60">Удалить</button>
              </div>
            </fieldset>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => rows.length < MAX && setRows((rs) => [...rs, emptyRow()])} disabled={rows.length >= MAX} className="h-11 px-4 rounded-[10px] border border-[#D9D3F5] dark:border-white/20 text-[14px] text-[var(--accent)] disabled:opacity-40" data-add-position>Добавить бумагу</button>
          <span className="text-[13px] text-[#55545A] dark:text-neutral-400">{rows.length} из {MAX} позиций</span>
        </div>
        <div className="mt-4">
          <p className="flex items-center justify-between text-[13px] font-semibold mb-1.5">Владею указанными бумагами с даты
            <button onClick={() => setHint((v) => !v)} aria-label="Подсказка" className="w-[18px] h-[18px] rounded-full border border-[#7D7C82] text-[#7D7C82] text-[11px] leading-[16px]">i</button></p>
          {hint && <p className="text-[12px] text-[#55545A] dark:text-neutral-400 mb-1.5">Предполагается, что вы владеете всем указанным количеством бумаг с этой даты и сохраняете их до выплаты.</p>}
          <input type="date" value={ownFrom} onChange={(e) => setOwnFrom(e.target.value)} className={inputCls} data-own-from />
          <p className="text-[12px] leading-[17px] text-[var(--accent)] mt-1.5">Дата нужна для проверки права на выплаты. Если бумаги куплены в разное время, выберите самую позднюю дату.</p>
        </div>
        {error && <p className="text-[13px] text-[#BA1111] mt-3">{error}</p>}
        <div className="flex items-center gap-4 mt-3">
          <button onClick={calculate} disabled={busy} className="h-11 px-5 rounded-[10px] bg-[var(--accent)] text-white text-[14px] font-semibold active:opacity-80 disabled:opacity-60" data-portfolio-button>{busy ? 'Считаю…' : 'Рассчитать выплаты'}</button>
          <button onClick={() => { setRows([emptyRow()]); setResult(null); setError(null); setOwnFrom(todayIso()); }} className="text-[14px] text-[var(--accent)] underline underline-offset-4">Очистить портфель</button>
        </div>
      </Card>

      {result && (
        <Card data="result">
          <H>{result.rows.length === 0 ? 'Пока нет выплат для расчёта' : 'Выплаты на ближайшие 12 месяцев'}</H>
          <p className="text-[14px] leading-[20px] mt-2">Период: с {dmy(result.periodFrom)} до {dmy(result.periodTo)} (конечная дата не включена). Дата начала владения: {dmy(result.ownFrom)}.</p>
          {result.rows.length === 0 ? (
            <p className="text-[14px] leading-[20px] mt-3">По выбранным бумагам нет выплат, которые можно включить в ближайшие 12 месяцев с указанной датой владения. Это не означает, что доход составит 0 ₽: новые дивиденды могут быть объявлены позже. Причины по каждой бумаге приведены ниже. Сумму по отдельному решению можно узнать в{' '}
              <button onClick={onOpenDividends} className="text-[var(--accent)] underline underline-offset-4">калькуляторе дивидендов</button>.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-[12px] bg-[var(--accent)] text-white px-3 py-3"><p className="text-[12px] font-semibold opacity-90">Дивиденды и купоны</p><p className="text-[18px] font-bold mt-2">{money(result.income)}</p></div>
                <div className="rounded-[12px] bg-[#F8F6FF] dark:bg-neutral-900 border border-[#E9E3FF] dark:border-white/10 px-3 py-3"><p className="text-[12px] font-semibold">Возврат номинала</p><p className="text-[18px] font-bold mt-2">{money(result.principal)}</p></div>
              </div>
              <p className="text-[12px] text-[#55545A] dark:text-neutral-400 mt-2">Доход — только дивиденды и купоны до налогов. Возврат номинала и амортизация показаны отдельно.</p>
              <div className="mt-3 flex flex-col gap-3">
                {months.map(([ym, list]) => (
                  <div key={ym} data-month>
                    <p className="text-[14px] font-bold">{monthName(ym)}</p>
                    <div className="mt-1 rounded-[12px] border border-[#E9E3FF] dark:border-white/10 overflow-hidden">
                      {list.map((x, i) => (
                        <div key={`${x.id}-${x.date}-${x.kind}-${i}`} className={`px-3 py-2 flex items-start justify-between gap-3 ${i ? 'border-t border-[#EFEDF4] dark:border-white/10' : ''}`} data-payment>
                          <div className="min-w-0"><p className="text-[13px] font-semibold truncate">{x.name}</p><p className="text-[11px] text-[#7D7C82] dark:text-neutral-400">{dmy(x.date)} · {KIND[x.kind]} · {money(x.perUnit)} за шт.</p></div>
                          <p className="text-[13px] font-semibold shrink-0">{money(x.total)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {result && result.excluded.length > 0 && (
        <Card data="excluded">
          <H>Почему другие выплаты не вошли в расчёт</H>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
            {result.excluded.map((e, i) => <li key={`${e.id}-${i}`} className="text-[14px] leading-[20px]"><b>{e.name} ({e.id}):</b> {e.reason}</li>)}
          </ul>
          <p className="text-[14px] leading-[20px] mt-3">Неизвестные суммы и сроки не заменяются прогнозом. Общая сумма может описывать только часть будущих выплат портфеля.</p>
        </Card>
      )}

      <Card>
        <H>Как рассчитываются выплаты портфеля</H>
        <div className="mt-2 text-[13px]"><A url={L.method}>Методология финансовых данных и расчётов</A></div>
        {[
          'В расчёт входят утверждённые рублёвые дивиденды с известными суммой, датой реестра и сроком выплаты; подтверждённые рублёвые купоны, амортизация и погашение облигаций. Дата реестра определяет право на дивиденды, но не заменяет дату выплаты. Рекомендованные и прогнозные дивиденды показаны отдельно с пометками и не увеличивают подтверждённый доход. Их ожидаемая сумма считается только по известным рублёвым значениям; выплаты без срока не распределяются по месяцам и не входят в ожидаемую сумму на 12 месяцев.',
          'Предполагается, что вы уже владеете всем указанным количеством бумаг с выбранной даты и сохраняете их до выплаты. Дата владения должна быть не позже даты фиксации владельцев. Это проверка заданного сценария, а не расчёт сроков биржевых расчётов при покупке. Для возврата номинала без отдельного реестра предполагается владение до даты погашения или амортизации.',
          'Дивидендный срок — крайняя опубликованная дата, а не дата поступления на брокерский счёт. При неизвестном сроке утверждённое решение показывается среди исключённых данных. Купоны без известной даты фиксации владельцев исключаются. При будущей оферте выплаты начиная с её даты не включаются.',
          'Возврат номинала и амортизация не относятся к инвестиционному доходу. Общий доход здесь — только дивиденды и купоны до налогов. Стоимость покупки, НКД при покупке, комиссии, переоценка и индивидуальное налогообложение не учитываются; доходность портфеля не рассчитывается. Для точного результата после налогов нужны отдельные данные о налоговых базах и статусе инвестора.',
          'Выплаты рассчитаны для указанного количества бумаг и округлены до копеек. Если график облигаций не обновлялся более семи дней, его суммы не включаются в итог. Неизвестные будущие выплаты не учитываются.',
        ].map((t) => <p key={t.slice(0, 20)} className="text-[13px] leading-[19px] mt-3">{t}</p>)}
        <p className="text-[13px] leading-[19px] mt-3">Подробнее о выплатах и видах облигаций: <A url={L.moex}>Московская биржа</A>. Налоговые параметры проверяйте по <A url={L.fns}>разъяснениям ФНС</A>.</p>
      </Card>
    </div>
  );
};
