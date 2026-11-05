#!/usr/bin/env node
// Список прямых ссылок на разделы мини-аппа для редакторов: docs/deeplinks.md
//   node scripts/deeplinks.mjs --bot if_miniapp_bot --app <короткое_имя_приложения>
// Короткое имя задаётся в BotFather (/newapp или /myapps → приложение → ссылка вида t.me/<бот>/<имя>).
// Метку источника можно дописать к любой ссылке: …?startapp=market__rassylka_nov
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BOT = arg('--bot', 'if_miniapp_bot');
const APP = arg('--app', '<короткое_имя>');
const base = `https://t.me/${BOT}/${APP}?startapp=`;

// Те же правила, что в src/shared/lib/deep-link.ts (tagSlug) — проверяется тестом
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
export const tagSlug = (t) => [...t.replace(/^#/, '').toLowerCase()].map((c) => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

export function buildRows(posts, figmaDataSource) {
  const tags = [...new Set(posts.flatMap((p) => p.tags || []))].sort((a, b) => a.localeCompare(b, 'ru'));
  const block = figmaDataSource.slice(figmaDataSource.indexOf('FIGMA_PAIN_CARDS'));
  const pains = [...block.matchAll(/slug:\s*'([a-z0-9_]+)'[\s\S]*?title:\s*'([^']+)'/g)].map((m) => ({ slug: m[1], title: m[2] }));
  return [
    { what: 'Вкладка «Рынок»', param: 'market' },
    { what: 'Поиск по тегам', param: 'tags' },
    { what: 'Готовые решения', param: 'solutions' },
    ...pains.map((p) => ({ what: `Карточка «${p.title}»`, param: `pain-${p.slug}` })),
    ...tags.map((t) => ({ what: `Тег ${t}`, param: `tag-${tagSlug(t)}` })),
  ];
}

if ((process.argv[1] ?? '').endsWith('deeplinks.mjs')) {
  const posts = JSON.parse(fs.readFileSync('public/data/posts.json', 'utf8'));
  const rows = buildRows(posts, fs.readFileSync('src/shared/config/figma-data.ts', 'utf8'));
  const md = [
    '# Прямые ссылки на разделы мини-аппа',
    '',
    `Ссылка открывает мини-апп сразу в нужном месте. Чтобы видеть в Метрике, откуда пришли, допишите метку через два подчёркивания: \`${base}market__rassylka_nov\` (латиница, цифры, «_» и «-», всего до 64 знаков). В Метрике это цель «Открыли по прямой ссылке», параметры route и source.`,
    '',
    '| Куда ведёт | Ссылка |',
    '| --- | --- |',
    ...rows.map((r) => `| ${r.what} | \`${base}${r.param}\` |`),
    '',
  ].join('\n');
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/deeplinks.md', md);
  console.log(`docs/deeplinks.md: ${rows.length} ссылок (${APP === '<короткое_имя>' ? 'короткое имя приложения не указано — подставьте --app' : 'приложение ' + APP})`);
}
