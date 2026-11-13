import React, { useEffect, useState } from 'react';
import { Decision, QTY_MAX, Share, SharePrice, calcDividends, decisionLabel, defaultDecision, loadDecisions, loadPrice, loadShares } from '../../entities/dividends/model/dividends';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { reportSource } from '../../shared/diagnostics/source-status';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

// Калькулятор дивидендов по акциям — повторяет страницу сайта investfuture.ru (вид, тексты, метод расчёта).
const todayIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
const dmy = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
const money = (x: number, cur = 'RUB') => `${x.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur === 'RUB' ? '₽' : cur}`;
const nowMsk = (d: Date) => `${d.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}, ${d.toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })}`;
const SITE = { dividends: 'https://investfuture.ru/dividends', calendar: 'https://investfuture.ru/calendar/dividends', stocks: 'https://investfuture.ru/quotes/stocks' };
const DEFAULT_SECID = 'SBER';

const Card: React.FC<{ children: React.ReactNode; data?: string }> = ({ children, data }) => (
  <div className="rounded-[16px] bg-white dark:bg-[#161616] border border-black/5 dark:border-white/10 p-4" data-card={data}>{children}</div>
);
const H: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-[19px] leading-[24px] font-bold">{children}</h3>;
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-[13px] font-semibold mb-1.5">{children}</p>;
const LinkBtn: React.FC<{ url: string; title: string; children: React.ReactNode }> = ({ url, title, children }) => (
  <button onClick={() => openPostLink(url, title, { silent: true })} className="text-left text-[14px] text-[var(--accent)] underline underline-offset-4 decoration-[var(--accent)]/40 active:opacity-60">
    {children}{'\u00a0'}→
  </button>
);
const selectCls = 'w-full h-12 px-3 rounded-[10px] bg-white dark:bg-neutral-900 border border-[#E3E1EA] dark:border-white/15 text-[15px] text-[#161616] dark:text-white outline-none focus:border-[var(--accent)]';
const btnCls = 'h-11 px-5 rounded-[10px] bg-[var(--accent)] text-white text-[14px] font-semibold active:opacity-80 disabled:opacity-50';

export const DividendCalculator: React.FC<{ source: string }> = ({ source }) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [choice, setChoice] = useState(DEFAULT_SECID); // в списке; применяется кнопкой «Выбрать акцию», как на сайте
  const [secid, setSecid] = useState<string | null>(null);
  const [price, setPrice] = useState<SharePrice | null>(null);
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [decisionIdx, setDecisionIdx] = useState(0);
  const [qty, setQty] = useState('100');
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [result, setResult] = useState<{ d: Decision; total: number } | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const name = (id: string | null) => shares.find((s) => s.secid === id)?.name ?? id ?? '';

  useEffect(() => {
    AnalyticsService.track('calc_open', { source });
    loadShares().then((list) => { setShares(list); select(DEFAULT_SECID); }).catch((e) => { setError('Не удалось загрузить список акций с Мосбиржи. Проверьте интернет и попробуйте ещё раз.'); reportSource('dividends', false, e); });
  }, []);

  const select = async (id: string) => {
    triggerHaptic('light');
    setSecid(id); setPrice(null); setDecisions(null); setResult(null); setError(null); setLoading(true);
    AnalyticsService.track('calc_dividend_select', { secid: id });
    try {
      const [p, d] = await Promise.all([loadPrice(id), loadDecisions(id)]);
      setPrice(p); setDecisions(d); setLoadedAt(new Date());
      const def = defaultDecision(d, todayIso());
      setDecisionIdx(def ? d.indexOf(def) : 0);
      reportSource('dividends', true, `${id}: решений ${d.length}`);
    } catch (e) {
      setError('Не удалось загрузить данные по акции. Попробуйте ещё раз.');
      reportSource('dividends', false, e);
    } finally { setLoading(false); }
  };

  const calculate = () => {
    const d = decisions?.[decisionIdx];
    if (!d || !secid) return;
    const q = Number(qty.replace(/\s/g, ''));
    if (!Number.isInteger(q) || q < 1 || q > QTY_MAX) return setQtyError('Укажите от 1 до 1 000 000 000 акций, целое число.');
    setQtyError(null);
    triggerHaptic('light');
    setResult({ d, total: calcDividends(d.amount, q) });
    AnalyticsService.track('calc_dividend_result', { secid });
  };

  return (
    <div className="flex flex-col gap-4 text-[#161616] dark:text-white" data-calculator="dividends">
      <Card>
        <H>Калькулятор дивидендов по акциям</H>
        <p className="text-[14px] leading-[20px] text-[#55545A] dark:text-neutral-400 mt-2">Рассчитайте сумму дивидендов по количеству акций. Выберите компанию и опубликованное решение: сумма на акцию, статус, дата реестра и срок выплаты.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          <button onClick={() => openPostLink(SITE.dividends, 'Дивиденды компаний', { silent: true })} className="text-[13px] text-[var(--accent)] underline underline-offset-4">Дивиденды компаний</button>
          <button onClick={() => openPostLink(SITE.calendar, 'Календарь дивидендов', { silent: true })} className="text-[13px] text-[var(--accent)] underline underline-offset-4">Календарь</button>
        </div>
      </Card>

      <Card data="choose">
        <H>Выберите акцию для расчёта</H>
        <div className="mt-3">
          <Label>Компания и класс акций</Label>
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className={selectCls} data-share-select>
            {shares.length === 0 && <option value={DEFAULT_SECID}>Сбербанк (SBER)</option>}
            {shares.map((s) => <option key={s.secid} value={s.secid}>{s.name} ({s.secid})</option>)}
          </select>
          <button onClick={() => select(choice)} disabled={loading} className={`${btnCls} mt-3`} data-choose-button>Выбрать акцию</button>
        </div>
        {secid && <div className="mt-3"><LinkBtn url={SITE.dividends} title={`Дивиденды ${name(secid)}`}>Все дивиденды {name(secid)} ({secid}) и история решений</LinkBtn></div>}
        {error && <p className="text-[13px] text-[#BA1111] mt-3">{error}</p>}
        {loading && <p className="text-[13px] text-[#7D7C82] mt-3">Загружаю цену и решения…</p>}
      </Card>

      {secid && price && (
        <Card data="price">
          <H>Цена акции {secid}</H>
          <p className="text-[15px] mt-2"><span className="font-bold">{price.price !== null ? money(price.price) : '—'}</span>{price.changePct !== null && <> · {price.changePct > 0 ? '+' : ''}{price.changePct.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}% к предыдущему закрытию</>}</p>
          <p className="text-[12px] leading-[17px] text-[#55545A] dark:text-neutral-400 mt-2">
            {price.at ? `Последняя доступная котировка: ${price.at.slice(11, 16)} ${dmy(price.at)} (МСК). ` : ''}Цена покупки может отличаться. Опубликованная доходность дивидендного решения показана отдельно и не пересчитывается по этой цене.
          </p>
          <div className="mt-3"><LinkBtn url={SITE.stocks} title={`Цена ${secid}`}>Цена, график и динамика {secid}</LinkBtn></div>
        </Card>
      )}

      {secid && decisions && (
        <Card data="calc">
          <H>Сколько дивидендов принесут акции {secid}</H>
          {decisions.length === 0 ? (
            <p className="text-[13px] leading-[18px] text-[#55545A] dark:text-neutral-400 mt-3">По этой акции нет опубликованных дивидендных решений с известной суммой.</p>
          ) : (
            <>
              <div className="mt-3">
                <Label>Дивидендное решение</Label>
                <select value={decisionIdx} onChange={(e) => { setDecisionIdx(Number(e.target.value)); setResult(null); }} className={selectCls} data-decision-select>
                  {decisions.slice(0, 12).map((d, i) => <option key={`${d.recordDate}-${i}`} value={i}>{decisionLabel(d)}</option>)}
                </select>
              </div>
              <div className="mt-3">
                <Label>Количество акций</Label>
                <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} className={selectCls} data-qty />
                <p className={`text-[12px] leading-[16px] mt-1.5 ${qtyError ? 'text-[#BA1111]' : 'text-[var(--accent)]'}`}>{qtyError ?? 'От 1 до 1 000 000 000 акций, целое число.'}</p>
              </div>
              <button onClick={calculate} className={`${btnCls} mt-3`} data-dividend-button>Рассчитать дивиденды</button>
              {result && (
                <div className="mt-4" data-dividend-result>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="rounded-[12px] bg-[#F8F6FF] dark:bg-neutral-900 border border-[#E9E3FF] dark:border-white/10 px-3 py-3"><p className="text-[12px] text-[#55545A] dark:text-neutral-400">Дивиденд на одну акцию</p><p className="text-[22px] font-bold text-[var(--accent)] mt-1">{money(result.d.amount, result.d.currency)}</p></div>
                    <div className="rounded-[12px] bg-[#F8F6FF] dark:bg-neutral-900 border border-[#E9E3FF] dark:border-white/10 px-3 py-3"><p className="text-[12px] text-[#55545A] dark:text-neutral-400">Сумма до налогов и комиссий</p><p className="text-[22px] font-bold text-[var(--accent)] mt-1">{money(result.total, result.d.currency)}</p></div>
                  </div>
                  <p className="text-[12px] leading-[17px] text-[#55545A] dark:text-neutral-400 mt-3">Расчёт: количество акций × дивиденд на акцию. Результат округлён до двух знаков после запятой для всей позиции. Налоги, комиссии и право на получение выплаты этот расчёт не определяет.</p>
                  <p className="text-[12px] leading-[17px] text-[#55545A] dark:text-neutral-400 mt-2">Дата реестра: {dmy(result.d.recordDate)}.{result.d.paymentDeadline ? ` Срок выплаты: ${dmy(result.d.paymentDeadline)}. Срок выплаты не является датой поступления денег на брокерский счёт.` : ''}</p>
                  {loadedAt && <p className="text-[12px] text-[#55545A] dark:text-neutral-400 mt-2">Данные обновлены {nowMsk(loadedAt)}</p>}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <Card>
        <H>Как рассчитать дивиденды по акциям</H>
        <p className="text-[14px] leading-[21px] mt-2">Выберите акцию и дивидендное решение, затем укажите количество акций. Например, при дивиденде 10 ₽ на акцию для 100 акций расчётная сумма до налогов и комиссий составит 1 000 ₽.</p>
        <p className="text-[15px] font-bold mt-4">Какие решения доступны</p>
        <p className="text-[14px] leading-[21px] mt-1.5">Калькулятор использует опубликованные утверждения и рекомендации с известной суммой. Отмены и прогнозные суммы исключены. Рекомендация помечена отдельно и даёт расчёт сценария до окончательного утверждения.</p>
        <p className="text-[15px] font-bold mt-4">Когда придут деньги</p>
        <p className="text-[14px] leading-[21px] mt-1.5">Дата реестра и опубликованный срок выплаты показаны для выбранного решения. Сервис не определяет фактическую дату зачисления, налоги, комиссии или право конкретного владельца на дивиденд.</p>
      </Card>
    </div>
  );
};
