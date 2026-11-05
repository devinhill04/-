import { describe, expect, it } from 'vitest';
import { plural, PUBLICATIONS } from '../src/shared/lib/plural';
import { tagToPosts, untitledFor } from '../src/entities/app-content/model/to-posts';

describe('мелочи интерфейса', () => {
  it.each([[1, 'публикацию'], [2, 'публикации'], [5, 'публикаций'], [11, 'публикаций'], [21, 'публикацию'], [101, 'публикацию'], [111, 'публикаций']])('склонение: %i %s', (n, w) => {
    expect(plural(n, PUBLICATIONS)).toBe(w);
  });
  it('пост из тега без подписи — «Комикс» / «Пост из канала»', () => {
    const posts = tagToPosts({ tag: 'Комиксы', posts: [{ url: 'https://t.me/if_jobs/1331', title: null }, { url: 'https://t.me/if_jobs/1500', title: 'Сериал' }] }, 'if_jobs');
    expect(posts.map((p) => p.title)).toEqual(['Комикс', 'Сериал']);
    expect(untitledFor('Юмор')).toBe('Пост из канала');
  });
});

describe('файл средней цены Urals', () => {
  it('заполнен правильно: числа, даты, периоды', async () => {
    const fs = await import('node:fs');
    const d = JSON.parse(fs.readFileSync('public/data/urals-monthly.json', 'utf8'));
    expect(d.price).toBeGreaterThan(0);
    expect(d.previousPrice).toBeGreaterThan(0);
    expect(d.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(d.period).toMatch(/^[а-я]+ \d{4}$/);
    expect(d.previousPeriod).toMatch(/^[а-я]+ \d{4}$/);
    expect(d.period).not.toBe(d.previousPeriod);
  });
});
