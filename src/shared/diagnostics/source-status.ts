// Журнал состояния источников данных: каждый источник (новости, цены, карта...) записывает сюда результат
// последней попытки. Экран диагностики показывает его на устройстве, где консоли нет.

export interface SourceStatus {
  name: string;
  ok: boolean;
  at: number; // когда обновлено, мс
  detail?: string; // «постов: 2» или текст ошибки
}

const state = new Map<string, SourceStatus>();
const listeners = new Set<() => void>();

const short = (s: unknown) => String(s instanceof Error ? s.message : s).replace(/\s+/g, ' ').slice(0, 160);

export function reportSource(name: string, ok: boolean, detail?: unknown, at: number = Date.now()) {
  state.set(name, { name, ok, at, detail: detail === undefined || detail === '' ? undefined : short(detail) });
  listeners.forEach((l) => l());
}

// Записать только если в текущем цикле обновления источник сам ничего не записал (у него может быть более точное «detail»)
export function reportSourceIfStale(name: string, ok: boolean, detail: unknown, cycleStart: number) {
  const prev = state.get(name);
  if (prev && prev.at >= cycleStart) return;
  reportSource(name, ok, detail);
}

export const getSources = (): SourceStatus[] => Array.from(state.values());

export function subscribeSources(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function _resetSources() {
  state.clear();
  listeners.forEach((l) => l());
}
