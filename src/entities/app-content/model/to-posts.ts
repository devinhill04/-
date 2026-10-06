import { Post } from '../../post/model/types';
import { AppCategory } from './types';

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
