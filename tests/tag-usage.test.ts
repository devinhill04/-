import { beforeEach, describe, expect, it } from 'vitest';
import { applyDecay, loadTagUsage, orderTags, recordTagClick } from '../src/shared/lib/tag-usage';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) };
});
const NOW = Date.UTC(2026, 9, 14);
const TAGS = ['#Инвестидея', '#Общее', '#Налоги', '#Ипотека', '#Депозиты', '#Валюта', '#Пенсия', '#ИИС'];
const U = (counts: Record<string, number>) => ({ counts, halvedAt: NOW });

describe('личная автосортировка тегов', () => {
  it('#Инвестидея первая, затем до трёх личных (от 2 кликов), затем общая популярность', () => {
    expect(orderTags(TAGS, { priorityTag: '#Инвестидея', globalOrder: ['Пенсия', 'ИИС'], usage: U({ Налоги: 4, Валюта: 1 }) }))
      .toEqual(['#Инвестидея', '#Налоги', '#Пенсия', '#ИИС', '#Общее', '#Ипотека', '#Депозиты', '#Валюта']);
  });
  it('поднимается не больше трёх', () => {
    const r = orderTags(TAGS, { priorityTag: '#Инвестидея', globalOrder: [], usage: U({ Налоги: 9, Ипотека: 8, Депозиты: 7, Валюта: 6 }) });
    expect(r.slice(1, 4)).toEqual(['#Налоги', '#Ипотека', '#Депозиты']);
  });
  it('счётчики уполовиниваются раз в 30 дней', () => {
    expect(applyDecay({ counts: { Налоги: 9, Ипотека: 1 }, halvedAt: NOW - 31 * 864e5 }, NOW)).toEqual({ counts: { Налоги: 4 }, halvedAt: NOW });
  });
  it('клики записываются без «#», испорченная память не ломает', () => {
    recordTagClick('#Налоги', NOW); recordTagClick('Налоги', NOW);
    expect(loadTagUsage(NOW).counts.Налоги).toBe(2);
    store.set('if_tag_usage_v1', '{{{');
    expect(loadTagUsage(NOW).counts).toEqual({});
  });
});
