import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { _resetDeepLink, parseStartParam, readStartParam, tagSlug, takeDeepLink, takePendingTag } from '../src/shared/lib/deep-link';
// @ts-ignore — скрипт для редакторов на чистом JS
import { buildRows, tagSlug as scriptTagSlug } from '../scripts/deeplinks.mjs';

afterEach(() => { vi.unstubAllGlobals(); _resetDeepLink(); });

describe('прямые ссылки на разделы (startapp)', () => {
  it('разделы и метка источника', () => {
    expect(parseStartParam('market')).toEqual({ route: 'market', source: null, intent: { kind: 'market' } });
    expect(parseStartParam('market__rassylka_nov')!.source).toBe('rassylka_nov');
    expect(parseStartParam('tag-investideya')!.intent).toEqual({ kind: 'feed', tab: 'catalog', tagSlug: 'investideya' });
    expect(parseStartParam('pain-personal_finance')!.intent).toEqual({ kind: 'feed', tab: 'solutions', painSlug: 'personal_finance' });
    expect(parseStartParam('solutions')!.intent).toEqual({ kind: 'feed', tab: 'solutions' });
  });
  it('неизвестное и недопустимое — мини-апп откроется как обычно', () => {
    expect(parseStartParam('blabla')!.intent).toBeNull();
    expect(parseStartParam('рынок')).toBeNull();
    expect(parseStartParam('a'.repeat(65))).toBeNull();
    expect(parseStartParam('')).toBeNull();
  });
  it('перевод тегов в латиницу', () => {
    expect(tagSlug('#Инвестидея')).toBe('investideya');
    expect(tagSlug('#Блокировкакартыперевода')).toBe('blokirovkakartyperevoda');
    expect(tagSlug('#ИИ отнимет мою работу?')).toBe('ii-otnimet-moyu-rabotu');
  });
  it('в приложении и в скрипте для редакторов перевод одинаковый — на всех тегах из постов', () => {
    const posts = JSON.parse(fs.readFileSync('public/data/posts.json', 'utf8'));
    const tags = [...new Set(posts.flatMap((p: any) => p.tags || []))] as string[];
    expect(tags.length).toBeGreaterThan(10);
    for (const t of tags) expect(scriptTagSlug(t)).toBe(tagSlug(t));
    const slugs = tags.map(tagSlug);
    expect(new Set(slugs).size).toBe(slugs.length); // разные теги не склеиваются в одну ссылку
  });
  it('скрипт собирает ссылки на все разделы, карточки и теги', () => {
    const rows = buildRows(JSON.parse(fs.readFileSync('public/data/posts.json', 'utf8')), fs.readFileSync('src/shared/config/figma-data.ts', 'utf8'));
    expect(rows.slice(0, 3).map((r: any) => r.param)).toEqual(['market', 'tags', 'solutions']);
    expect(rows.filter((r: any) => r.param.startsWith('pain-')).length).toBe(8);
    for (const r of rows) expect(parseStartParam(r.param)!.intent).not.toBeNull();
  });
  it('параметр берётся из Telegram, а в браузере — из адреса; применяется один раз', () => {
    vi.stubGlobal('window', { Telegram: { WebApp: { initDataUnsafe: { start_param: 'tag-nalogi__post1234' } } } });
    vi.stubGlobal('location', { search: '?startapp=market', hash: '' });
    expect(readStartParam()).toBe('tag-nalogi__post1234');
    const first = takeDeepLink();
    expect(first!.source).toBe('post1234');
    expect(takeDeepLink()).toBeNull();
    expect(takePendingTag(['#Инвестидея', '#Налоги'])).toBe('#Налоги');
    expect(takePendingTag(['#Налоги'])).toBeNull();
  });
});
