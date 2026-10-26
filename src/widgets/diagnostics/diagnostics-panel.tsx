import React, { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { getSources, subscribeSources } from '../../shared/diagnostics/source-status';
import { ProbeResult, runAllProbes } from '../../shared/diagnostics/probes';
import { ago, buildReport } from '../../shared/diagnostics/report';
import { getTelegramWebApp } from '../../lib/telegram';
import { copyText } from '../../shared/lib/copy-text';
import { brokerReportLines, brokerRows, currentBasisLabel, fmtPct } from '../../shared/diagnostics/broker-check';
import { CALENDAR_TAB_ENABLED, POST_READER_ENABLED, SECOND_APP_ENABLED } from '../../shared/config/features';

const FLAGS = {
  'читалка постов': POST_READER_ENABLED,
  'второе приложение': SECOND_APP_ENABLED,
  'календари': CALENDAR_TAB_ENABLED,
};

function collectEnv(): Record<string, string> {
  const tg: any = getTelegramWebApp();
  return {
    Telegram: tg ? `${tg.platform ?? '?'} · версия ${tg.version ?? '?'} · тема ${tg.colorScheme ?? '?'}` : 'не обнаружен (обычный браузер)',
    'Данные запуска': tg ? (tg.initData ? 'есть' : 'нет') : 'нет',
    Экран: `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x · тема приложения: ${document.documentElement.classList.contains('dark') ? 'тёмная' : 'светлая'}`,
    Язык: navigator.language || '?',
    Сеть: navigator.onLine ? 'онлайн' : 'офлайн',
    Браузер: (navigator.userAgent || '').slice(0, 110),
  };
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-5">
    <h3 className="text-[#7D7C82] dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wide mb-2">{title}</h3>
    {children}
  </section>
);

// Скрытый экран для разработчика: что работает, а что нет — прямо на телефоне, где нет консоли.
export const DiagnosticsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [, force] = useState(0);
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState<null | 'ok' | 'fail'>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => subscribeSources(() => force((n) => n + 1)), []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);

  const sources = getSources().sort((a, b) => a.name.localeCompare(b.name));
  const broker = brokerRows();
  const env = collectEnv();

  const run = async () => {
    setRunning(true);
    setProbes([]);
    await runAllProbes((r) => setProbes((prev) => [...prev, r]));
    setRunning(false);
  };

  const copy = async () => {
    const ok = await copyText(buildReport({ buildTime: __BUILD_TIME__, commit: __COMMIT__, now: Date.now(), env, flags: FLAGS, sources: getSources(), probes, broker: brokerReportLines(brokerRows()) }));
    setCopied(ok ? 'ok' : 'fail');
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-white dark:bg-[#111111] text-[#161616] dark:text-neutral-100 flex flex-col" role="dialog" aria-label="Диагностика">
      <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-black/5 dark:border-white/10">
        <span className="text-[15px] font-semibold">Диагностика</span>
        <button onClick={onClose} aria-label="Закрыть диагностику" className="p-1 -mr-1 active:opacity-60"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-[16px] mt-3">Технический экран. Личных данных в отчёте нет: ни имени, ни идентификатора Telegram.</p>

        <Section title="Версия">
          <p className="text-[13px]">Сборка: {new Date(__BUILD_TIME__).toLocaleString('ru-RU')}</p>
          <p className="text-[13px]">Коммит: {__COMMIT__ || 'не передан при сборке'}</p>
        </Section>

        <Section title="Устройство">
          {Object.entries(env).map(([k, v]) => <p key={k} className="text-[13px] break-words"><span className="text-[#7D7C82] dark:text-neutral-400">{k}: </span>{v}</p>)}
        </Section>

        <Section title="Функции">
          {Object.entries(FLAGS).map(([k, v]) => <p key={k} className="text-[13px]"><span className="text-[#7D7C82] dark:text-neutral-400">{k}: </span>{v ? 'включено' : 'выключено'}</p>)}
        </Section>

        <Section title="Источники данных">
          {sources.length === 0 && <p className="text-[13px] text-[#7D7C82] dark:text-neutral-400">Пока ни один источник не запрашивался. Откройте вкладку «Рынок» и вернитесь.</p>}
          {sources.map((s) => (
            <p key={s.name} className="text-[13px] break-words mb-1" data-source={s.name}>
              <span className={s.ok ? 'text-[#11BA2D]' : 'text-[#BA1111]'}>{s.ok ? '✓' : '✗'}</span> <b>{s.name}</b> — {s.detail ?? (s.ok ? 'ок' : 'ошибка')} <span className="text-[#7D7C82] dark:text-neutral-400">({ago(now - s.at)})</span>
            </p>
          ))}
        </Section>

        <Section title="Сверка акций с брокером">
          {broker.length === 0 ? (
            <p className="text-[13px] text-[#7D7C82] dark:text-neutral-400">Откройте вкладку «Рынок» и вернитесь — здесь появятся крупнейшие бумаги.</p>
          ) : (
            <>
              <p className="text-[12px] leading-[16px] text-[#7D7C82] dark:text-neutral-400 mb-2">
                Сравните в тот же момент с брокером. Совпадает столбец «от вечерней» — нужно переключить базу (сейчас: {currentBasisLabel()}). Разница то есть, то нет — это задержка данных Мосбиржи, смотрите «время цены».
              </p>
              <div className="overflow-x-auto">
                <table className="text-[12px] w-full" data-broker>
                  <thead><tr className="text-[#7D7C82] dark:text-neutral-400 text-left"><th className="pr-2 font-medium">Бумага</th><th className="pr-2 font-medium">Цена</th><th className="pr-2 font-medium">Время</th><th className="pr-2 font-medium">От основной</th><th className="font-medium">От вечерней</th></tr></thead>
                  <tbody>
                    {broker.map((r) => (
                      <tr key={r.ticker}><td className="pr-2 font-semibold">{r.ticker}</td><td className="pr-2">{r.price}</td><td className="pr-2">{r.priceTimeMsk}{r.ageMin !== null ? ` (${r.ageMin} мин)` : ''}</td><td className="pr-2">{fmtPct(r.pctRegular)}</td><td>{fmtPct(r.pctEvening)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Section>

        <Section title="Проверка связи с этого устройства">
          <button onClick={run} disabled={running} className="h-10 px-4 rounded-[10px] text-[14px] font-medium bg-[#F5F5F5] dark:bg-neutral-800 active:opacity-70 disabled:opacity-60">
            {running ? 'Проверяю…' : probes.length ? 'Проверить ещё раз' : 'Проверить связь'}
          </button>
          <div className="mt-3">
            {probes.map((p) => (
              <p key={p.id} className="text-[13px] break-words mb-1.5" data-probe={p.id}>
                <span className={p.ok ? 'text-[#11BA2D]' : 'text-[#BA1111]'}>{p.ok ? '✓' : '✗'}</span> {p.label}
                <br /><span className="text-[#7D7C82] dark:text-neutral-400">{p.status !== undefined ? `HTTP ${p.status}` : 'нет ответа'}, {p.ms} мс{p.note ? ` · ${p.note}` : ''}</span>
              </p>
            ))}
          </div>
        </Section>
      </div>

      <div className="shrink-0 p-3 border-t border-black/5 dark:border-white/10" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={copy} className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 text-[14px] font-medium bg-[#161616] text-white dark:bg-white dark:text-[#161616] active:opacity-80">
          {copied === 'ok' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === 'ok' ? 'Отчёт скопирован' : copied === 'fail' ? 'Не удалось скопировать' : 'Скопировать отчёт'}
        </button>
      </div>
    </div>
  );
};
