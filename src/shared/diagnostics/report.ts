import { SourceStatus } from './source-status';
import { ProbeResult } from './probes';

export interface ReportInput {
  buildTime: string; // ISO
  commit: string; // может быть пустым
  now: number;
  env: Record<string, string>;
  flags: Record<string, boolean>;
  sources: SourceStatus[];
  probes: ProbeResult[];
}

export function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'только что';
  if (s < 60) return `${s} с назад`;
  if (s < 3600) return `${Math.round(s / 60)} мин назад`;
  return `${Math.round(s / 3600)} ч назад`;
}

const fmtDate = (iso: string | number) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'неизвестно';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
};

// Текст, который человек присылает разработчику одним сообщением. Личных данных в нём нет:
// ни имени, ни идентификатора Telegram, ни данных запуска.
export function buildReport(i: ReportInput): string {
  const L: string[] = [];
  L.push('ДИАГНОСТИКА InvestFuture mini-app');
  L.push(`Сборка: ${fmtDate(i.buildTime)} · коммит: ${i.commit || 'не передан'}`);
  L.push(`Сейчас: ${fmtDate(i.now)}`);
  L.push('', 'УСТРОЙСТВО');
  for (const [k, v] of Object.entries(i.env)) L.push(`${k}: ${v}`);
  L.push('', 'ФУНКЦИИ');
  for (const [k, v] of Object.entries(i.flags)) L.push(`${k}: ${v ? 'включено' : 'выключено'}`);
  L.push('', 'ИСТОЧНИКИ ДАННЫХ (последняя попытка в этом запуске)');
  if (i.sources.length === 0) L.push('пока ни один источник не запрашивался');
  for (const s of [...i.sources].sort((a, b) => a.name.localeCompare(b.name))) L.push(`${s.ok ? '✓' : '✗'} ${s.name} — ${s.detail ?? (s.ok ? 'ок' : 'ошибка')} (${ago(i.now - s.at)})`);
  L.push('', 'ПРОВЕРКА СВЯЗИ (запросы с этого устройства)');
  if (i.probes.length === 0) L.push('не запускалась');
  for (const p of i.probes) {
    const code = p.status !== undefined ? `HTTP ${p.status}` : 'нет ответа';
    const size = p.bytes !== undefined ? `, ${Math.max(1, Math.round(p.bytes / 1024))} КБ` : '';
    L.push(`${p.ok ? '✓' : '✗'} ${p.url} — ${code}, ${p.ms} мс${size}${p.note ? ` · ${p.note}` : ''}`);
  }
  return L.join('\n');
}
