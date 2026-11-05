import { Post } from '../../post/model/types';
import { AppCategory, AppTag } from './types';

// Превращает посты категории в тот же формат Post, что и в основном приложении,
// чтобы переиспользовать готовые карточки постов и открытие ссылок.
export function categoryToPosts(category: AppCategory, channel: string): Post[] {
  return category.posts.map((p, i) => ({
    id: `${category.slug}-${i}-${p.url.split('/').pop()}`,
    title: p.title,
    description: p.title,
    category: category.slug,
    url: p.url,
    tags: [],
    channel,
  }));
}

// Пост без подписи (комикс-картинка) — понятная замена вместо пустой карточки
export const untitledFor = (tag: string) => (/комикс/i.test(tag) ? 'Комикс' : 'Пост из канала');

export function tagToPosts(tag: AppTag, channel: string): Post[] {
  return tag.posts.map((p, i) => ({
    id: `tag-${tag.tag}-${i}-${p.url.split('/').pop()}`,
    title: p.title ?? untitledFor(tag.tag),
    description: p.title ?? untitledFor(tag.tag),
    category: `tag:${tag.tag}`,
    url: p.url,
    tags: [`#${tag.tag}`],
    channel,
  }));
}
