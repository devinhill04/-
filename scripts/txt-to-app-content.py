#!/usr/bin/env python3
"""
Текст с наполнением приложения из каталога → public/data/apps/<app>.json.

Формат текста (как присылает редакция):
  Название карточки
  Заголовок поста - https://t.me/канал/номер
  ...
  Тег<TAB><TAB>https://t.me/канал/номер     ← строка с табуляцией начинает тег
  <TAB><TAB>https://t.me/канал/номер        ← следующие посты этого тега

Что делает:
- убирает из ссылок всё после «?» и «#» (например, ?utm_source=chatgpt.com)
- сохраняет у карточек значок, описание и цитату «Боль» из текущего JSON; внутренний ID (slug) карточки не меняется,
  даже если её переименовали (см. RENAMES) — чтобы не сломать аналитику и сохранённое у людей состояние
- заголовки постов в тегах берёт из текущего JSON (если уже есть), иначе из KNOWN_TAG_TITLES; остальные — null,
  их можно добрать скриптом scripts/fetch-tg-titles.mjs (подписи берутся из самих постов)

Запуск: python3 scripts/txt-to-app-content.py content/jobs/source.txt public/data/apps/jobs.json
"""
import json, re, sys
from urllib.parse import urlsplit, urlunsplit

# Переименования карточек: новое название → прежний внутренний ID
RENAMES = {
    'Мне недоплачивают': 'malo_deneg',
    'Хочу уволиться': 'hochu_uyti',
    'Не могу найти работу': 'ischu_rabotu',
    'Работодатель нарушает закон': 'narushayut_moi_prava',
    'Я больше не вывожу': 'ya_vygorel',
    'Начальник достал': 'nenavizhu_nachalnika',
    'Меня обошли': 'so_mnoy_nespravedlivy',
    'ИИ отнимет мою работу?': 'boyus_ii',
    'Хочу начать заново': 'hochu_smenit_professiyu',
}

# Заголовки постов из тегов, взятые из самих постов (у комиксов-картинок подписи может не быть)
KNOWN_TAG_TITLES = {
    'https://t.me/if_jobs/1500': 'Сериал «Офис. Терпеть нельзя уйти»',
    'https://t.me/if_jobs/1408': 'Кто ты из этой великолепной троицы?',
    'https://t.me/if_jobs/1439': 'Как токсичный босс определяет, что сотрудник хорошо работает',
    'https://t.me/if_jobs/1394': 'Жиза?',
    'https://t.me/if_jobs/1494': 'Есть жизнь после работы?',
}

POST_RE = re.compile(r'^(.*\S)\s+-\s+(https?://\S+)\s*$')
TAG_START_RE = re.compile(r'^([^\t]+?)\t+(https?://\S+)\s*$')
TAG_MORE_RE = re.compile(r'^\t+(https?://\S+)\s*$')

def clean_url(u: str) -> str:
    p = urlsplit(u.strip())
    return urlunsplit((p.scheme, p.netloc, p.path.rstrip('/'), '', ''))

def translit_slug(s: str) -> str:
    t = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}
    return re.sub(r'_+', '_', re.sub(r'[^a-z0-9]', '_', ''.join(t.get(c, c) for c in s.lower()))).strip('_')

def parse(text: str):
    cats, tags, cur_cat, cur_tag, problems = [], [], None, None, []
    for raw in text.replace('\r\n', '\n').split('\n'):
        line = raw.rstrip()
        if not line.strip() or line.strip() in ('"', '“', '”'):
            continue
        line = line.strip('"“”') if line.strip().startswith(('"', '“')) or line.strip().endswith(('"', '”')) else line
        if m := TAG_MORE_RE.match(line):
            if cur_tag is None: problems.append(f'ссылка без тега: {line.strip()}'); continue
            cur_tag['posts'].append(clean_url(m.group(1))); continue
        if m := TAG_START_RE.match(line):
            cur_tag = {'tag': m.group(1).strip(), 'posts': [clean_url(m.group(2))]}; tags.append(cur_tag); cur_cat = None; continue
        if m := POST_RE.match(line.strip()):
            if cur_cat is None: problems.append(f'пост без карточки: {line.strip()}'); continue
            cur_cat['posts'].append({'title': m.group(1).strip(), 'url': clean_url(m.group(2))}); continue
        if 'http' in line:
            problems.append(f'не разобрал строку: {line.strip()}'); continue
        cur_cat = {'title': line.strip(), 'posts': []}; cats.append(cur_cat); cur_tag = None
    return cats, tags, problems

def main(src, dst):
    text = open(src, encoding='utf-8').read()
    old = json.load(open(dst, encoding='utf-8'))
    old_by_slug = {c['slug']: c for c in old.get('categories', [])}
    old_titles = {p['url']: p.get('title') for t in old.get('tags', []) for p in t.get('posts', [])}
    cats, tags, problems = parse(text)
    out_cats = []
    for c in cats:
        slug = RENAMES.get(c['title']) or translit_slug(c['title'])
        prev = old_by_slug.get(slug)
        if prev is None: problems.append(f'новая карточка без значка и цитаты: «{c["title"]}» (slug {slug})')
        seen, posts = set(), []
        for p in c['posts']:
            if p['url'] in seen: problems.append(f'повтор в «{c["title"]}»: {p["url"]}'); continue
            seen.add(p['url']); posts.append(p)
        out_cats.append({'id': slug, 'slug': slug, 'emoji': (prev or {}).get('emoji', '📌'), 'title': c['title'],
                         'subtitle': (prev or {}).get('subtitle', ''), 'pain': (prev or {}).get('pain'), 'posts': posts})
    out_tags = [{'tag': t['tag'], 'posts': [{'url': u, 'title': old_titles.get(u) or KNOWN_TAG_TITLES.get(u)} for u in dict.fromkeys(t['posts'])]} for t in tags]
    result = {'appId': old.get('appId'), 'channel': old.get('channel'), 'categories': out_cats, 'tags': out_tags}
    json.dump(result, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(dst, 'a', encoding='utf-8').write('\n')
    print(f'карточек: {len(out_cats)}, постов в карточках: {sum(len(c["posts"]) for c in out_cats)}')
    for c in out_cats: print(f'  {c["emoji"]} {c["title"]:30s} {len(c["posts"]):3d}  (id {c["slug"]})')
    print(f'тегов: {len(out_tags)}: ' + ', '.join(f'#{t["tag"]} — {len(t["posts"])} постов, с заголовком {sum(1 for p in t["posts"] if p["title"])}' for t in out_tags))
    print('замечания:' if problems else 'замечаний нет'); [print('  - ' + p) for p in problems]

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
