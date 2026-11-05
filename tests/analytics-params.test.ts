import { describe, expect, it } from 'vitest';
import { metrikaParams } from '../src/shared/analytics/analytics';

describe('параметры для Яндекс.Метрики', () => {
  it('кладутся под имя события — не смешиваются в общем дереве', () => {
    expect(metrikaParams('tag_click', { tag: '#Инвестидея' })).toEqual({ tag_click: { tag: '#Инвестидея' } });
    expect(metrikaParams('market_data_error', { source: 'news' })).toEqual({ market_data_error: { source: 'news' } });
  });
  it('пустые параметры не отправляются', () => {
    expect(metrikaParams('market_open')).toBeUndefined();
    expect(metrikaParams('x', {})).toBeUndefined();
  });
});
