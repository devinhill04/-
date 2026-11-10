import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

// Проверка данных «Работа не рабство» после каждой загрузки наполнения: ловит ошибки разбора текста от редакции
const d = JSON.parse(fs.readFileSync('public/data/apps/jobs.json', 'utf8'));
const allPosts = [...d.categories.flatMap((c: any) => c.posts), ...d.tags.flatMap((t: any) => t.posts)];

describe('данные «Работа не рабство»', () => {
  it('карточки с постами, значками и ID', () => {
    expect(d.categories.length).toBe(9);
    for (const c of d.categories) {
      expect(c.posts.length).toBeGreaterThan(0);
      expect(c.slug).toMatch(/^[a-z0-9_]+$/);
      expect(c.emoji).toBeTruthy();
    }
  });
  it('заголовки без хвостов от разбора (« -», пробелы)', () => {
    for (const p of allPosts) if (p.title) expect(p.title).toBe(p.title.trim().replace(/\s+-$/, ''));
  });
  it('ссылки чистые: https://t.me/<канал>/<номер>, без ?utm_source и прочих хвостов', () => {
    for (const p of allPosts) expect(p.url).toMatch(/^https:\/\/t\.me\/[A-Za-z0-9_]+\/\d+$/);
  });
  it('внутри карточки и тега посты не повторяются', () => {
    for (const g of [...d.categories, ...d.tags]) expect(new Set(g.posts.map((p: any) => p.url)).size).toBe(g.posts.length);
  });
});
