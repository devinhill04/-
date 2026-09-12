// Раз в неделю (по расписанию в GitLab CI) забирает из API Яндекс.Метрики
// статистику кликов по тегам (параметр 'tag' у события tag_click) и
// сохраняет отсортированный по популярности список в public/data/tag-popularity.json.
//
// Требует переменные окружения:
//   METRIKA_OAUTH_TOKEN — OAuth-токен с правом metrika:read
//   METRIKA_COUNTER_ID  — номер счётчика (112456720)

const COUNTER_ID = process.env.METRIKA_COUNTER_ID;
const TOKEN = process.env.METRIKA_OAUTH_TOKEN;
const OUTPUT_PATH = new URL('../public/data/tag-popularity.json', import.meta.url);

if (!COUNTER_ID || !TOKEN) {
  console.error('METRIKA_COUNTER_ID и METRIKA_OAUTH_TOKEN должны быть заданы в переменных окружения.');
  process.exit(1);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

const params = new URLSearchParams({
  ids: COUNTER_ID,
  metrics: 'ym:s:visits',
  dimensions: 'ym:s:paramsLevel1,ym:s:paramsLevel2',
  filters: "ym:s:paramsLevel1=='tag'",
  date1: formatDate(weekAgo),
  date2: formatDate(today),
  limit: '100',
});

const url = `https://api-metrika.yandex.net/stat/v1/data?${params.toString()}`;

async function main() {
  console.log('Запрашиваю статистику кликов по тегам за неделю...');

  const res = await fetch(url, {
    headers: { Authorization: `OAuth ${TOKEN}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Ошибка API Метрики: ${res.status} ${res.statusText}`);
    console.error(text);
    // Не падаем с ошибкой пайплайна — просто оставляем текущий порядок как есть.
    process.exit(0);
  }

  const data = await res.json();
  const rows = data.data ?? [];

  if (rows.length === 0) {
    console.log('Нет данных по кликам за неделю — файл не трогаю, оставляю прежний порядок.');
    process.exit(0);
  }

  // rows[i].dimensions = [{name: 'tag'}, {name: 'Инвестидея'}], rows[i].metrics = [123]
  const counts = rows
    .map((row) => ({
      tag: row.dimensions?.[1]?.name,
      clicks: row.metrics?.[0] ?? 0,
    }))
    .filter((r) => r.tag);

  counts.sort((a, b) => b.clicks - a.clicks);

  const orderedTags = counts.map((r) => r.tag);

  const fs = await import('node:fs/promises');
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify({ updatedAt: new Date().toISOString(), order: orderedTags }, null, 2) + '\n',
    'utf-8'
  );

  console.log(`Готово. Порядок тегов по популярности (${orderedTags.length}):`, orderedTags);
}

main().catch((err) => {
  console.error('Не удалось обновить популярность тегов:', err);
  // Тоже не валим пайплайн — это некритичная фоновая задача.
  process.exit(0);
});
