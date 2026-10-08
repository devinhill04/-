#!/usr/bin/env node
/**
 * Заводит в Яндекс.Метрике цели типа «JavaScript-событие» под все события мини-аппа.
 * Уже существующие цели (по идентификатору) пропускаются — запускать повторно безопасно.
 *
 * Токен: переменная METRIKA_OAUTH_TOKEN — OAuth-токен с правом metrika:write (не read-only!).
 * Счётчик: METRIKA_COUNTER_ID (по умолчанию 112456720).
 *
 * PowerShell:
 *   $env:METRIKA_OAUTH_TOKEN = "<токен>"
 *   node scripts/metrika-setup-goals.mjs --dry-run     # только показать, что будет создано
 *   node scripts/metrika-setup-goals.mjs               # создать
 *
 * Токен не коммитьте и не отправляйте в чаты: он даёт доступ к вашей Метрике.
 */

const COUNTER_ID = process.env.METRIKA_COUNTER_ID || '112456720';
const API = (process.env.METRIKA_API_BASE || 'https://api-metrika.yandex.net').replace(/\/$/, '');
const TOKEN = process.env.METRIKA_OAUTH_TOKEN;
const DRY = process.argv.includes('--dry-run');

// Идентификатор события = первый аргумент track() в коде = значение в ym(..., 'reachGoal', <идентификатор>)
export const GOALS = [
  // Вкладка «Рынок»
  ['market_open', 'Рынок: открыли вкладку'],
  ['market_quote_click', 'Рынок: клик по котировке или акции'],
  ['market_quotes_expand', 'Рынок: «Показать ещё» у котировок'],
  ['market_stocks_tab', 'Рынок: вкладка акций (рост / падение / по обороту)'],
  ['market_chart_link', 'Рынок: переход на график InvestFuture'],
  ['market_news_click', 'Рынок: клик по новости'],
  ['market_news_all', 'Рынок: «Все новости»'],
  ['market_ticker_copy', 'Рынок: скопировали тикер'],
  // Вкладка «Календари»
  ['calendar_open', 'Календари: открыли вкладку'],
  ['calendar_tab', 'Календари: переключили (облигации / ключевая ставка)'],
  ['calendar_bonds_filter', 'Календари: фильтр календаря облигаций'],
  ['calendar_bonds_more', 'Календари: «Показать ещё» у облигаций'],
  ['calendar_bond_click', 'Календари: открыли облигацию на сайте'],
  ['calendar_site_link', 'Календари: «Календарь на investfuture.ru»'],
  // Меню приложений в шапке
  ['app_switcher_open', 'Меню приложений: открыли'],
  ['app_switcher_select', 'Меню приложений: выбрали приложение'],
  // Основное приложение (если цели уже заведены вручную — будут пропущены)
  ['tag_click', 'Клик по тегу'],
  ['post_open', 'Открытие поста'],
  ['banner_click', 'Клик по баннеру'],
  ['external_channel_click', 'Клик по каналу экосистемы'],
  ['if_plus_subscription_cta', 'Клик на подписку IF+'],
  ['pain_selected', 'Выбор карточки в «Готовых решениях»'],
  ['pain_solution_open', 'Открытие поста в карточке'],
  ['theme_toggle', 'Переключение темы'],
  ['lead_magnet_open', 'Открытие лид-магнита'],
  ['resources_sheet_open', 'Ресурсы: открыли «Все наши ресурсы»'],
  ['resources_sheet_close', 'Ресурсы: закрыли'],
  ['resources_platform_filter', 'Ресурсы: фильтр по площадке'],
  ['resources_search', 'Ресурсы: поиск'],
];

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `OAuth ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* не JSON */ }
  return { ok: res.ok, status: res.status, json, text };
}

function explain(status, json, text) {
  if (status === 401) return 'токен не принят (неверный или просрочен)';
  if (status === 403) return 'нет прав: токену нужен доступ metrika:write (и доступ к этому счётчику)';
  if (status === 404) return 'счётчик не найден — проверьте METRIKA_COUNTER_ID';
  return json?.message || json?.errors?.[0]?.message || text.slice(0, 200) || `HTTP ${status}`;
}

export async function main() {
  if (!TOKEN) {
    console.error('Не задан METRIKA_OAUTH_TOKEN. Пример (PowerShell): $env:METRIKA_OAUTH_TOKEN = "<токен>"');
    return 2;
  }
  console.log(`Счётчик ${COUNTER_ID}${DRY ? ' — пробный запуск, ничего не создаётся' : ''}`);

  const list = await api('GET', `/management/v1/counter/${COUNTER_ID}/goals`);
  if (!list.ok) {
    console.error(`Не удалось получить список целей: ${explain(list.status, list.json, list.text)}`);
    return 1;
  }
  const existing = new Set(
    (list.json?.goals ?? []).filter((g) => g.type === 'action').flatMap((g) => (g.conditions ?? []).map((c) => c.url))
  );
  console.log(`Уже заведено целей «JavaScript-событие»: ${existing.size}`);

  let created = 0, skipped = 0, failed = 0;
  for (const [id, name] of GOALS) {
    if (existing.has(id)) { console.log(`  = ${id} — уже есть, пропускаю`); skipped++; continue; }
    if (DRY) { console.log(`  + ${id} — создам «${name}»`); created++; continue; }
    const r = await api('POST', `/management/v1/counter/${COUNTER_ID}/goals`, {
      goal: { name, type: 'action', conditions: [{ type: 'exact', url: id }] },
    });
    if (r.ok) { console.log(`  + ${id} — создана «${name}»`); created++; }
    else { console.error(`  ! ${id} — ошибка: ${explain(r.status, r.json, r.text)}`); failed++; if (r.status === 401 || r.status === 403) break; }
  }
  console.log(`\nИтого: ${DRY ? 'будет создано' : 'создано'} ${created}, уже было ${skipped}, ошибок ${failed}`);
  return failed ? 1 : 0;
}

// Запуск только из командной строки (при импорте в тестах ничего не выполняется)
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('metrika-setup-goals.mjs')) {
  main().then((code) => process.exit(code));
}
