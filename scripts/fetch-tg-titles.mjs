#!/usr/bin/env node
// Дописывает заголовки постам из тегов, у которых их нет (title: null), — по подписи самого поста в Telegram.
// Подпись берётся из превью поста (og:description): первая фраза, до 80 знаков. У комиксов-картинок подписи
// часто нет — тогда заголовок остаётся пустым, а приложение покажет «Комикс». Уже заполненные заголовки не трогает.
//
// Запуск (нужен доступ к t.me — с обычного компьютера он есть):
//   node scripts/fetch-tg-titles.mjs public/data/apps/jobs.json            — заполнить
//   node scripts/fetch-tg-titles.mjs public/data/apps/jobs.json --dry      — только показать, что будет
import fs from 'node:fs';

const file = process.argv[2];
const DRY = process.argv.includes('--dry');
const BASE = (process.env.TG_BASE || 'https://t.me').replace(/\/$/, '');
if (!file) { console.error('Укажите файл: node scripts/fetch-tg-titles.mjs public/data/apps/jobs.json'); process.exit(2); }

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');

export function titleFromDescription(desc) {
  let t = decode(desc || '')
    .replace(/Telegram\s*\|\s*Max\s*\|\s*VK/gi, '')
    .replace(/Сохраняй!?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}«"„(]+/u, ''); // смайлики и значки в начале
  if (!t) return null;
  const m = /^(.+?[.!?…])(\s|$)/.exec(t);
  t = (m ? m[1] : t).trim();
  if (t.length > 80) t = t.slice(0, 79).replace(/\s+\S*$/, '') + '…';
  return t.length >= 3 ? t : null;
}

async function fetchDescription(url) {
  const path = new URL(url).pathname;
  const res = await fetch(`${BASE}${path}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m = /<meta\s+property="og:description"\s+content="([^"]*)"/i.exec(html) || /<meta\s+name="twitter:description"\s+content="([^"]*)"/i.exec(html);
  return m ? m[1] : '';
}

export async function main() {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let filled = 0, empty = 0, failed = 0;
  for (const tag of data.tags ?? []) {
    for (const p of tag.posts) {
      if (p.title) continue;
      try {
        const title = titleFromDescription(await fetchDescription(p.url));
        if (title) { p.title = title; filled++; console.log(`  ✓ #${tag.tag} ${p.url} → ${title}`); }
        else { empty++; console.log(`  · #${tag.tag} ${p.url} — подписи нет, в приложении будет «${/комикс/i.test(tag.tag) ? 'Комикс' : 'Пост из канала'}»`); }
      } catch (e) { failed++; console.log(`  ✗ #${tag.tag} ${p.url} — не удалось: ${e.message}`); }
      await new Promise((r) => setTimeout(r, 300)); // не спешим, чтобы Telegram не ограничил запросы
    }
  }
  if (!DRY) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nИтого: заполнено ${filled}, без подписи ${empty}, ошибок ${failed}${DRY ? ' (пробный запуск, файл не изменён)' : ''}`);
  return failed ? 1 : 0;
}

if ((process.argv[1] ?? '').endsWith('fetch-tg-titles.mjs')) main().then((c) => process.exit(c));
