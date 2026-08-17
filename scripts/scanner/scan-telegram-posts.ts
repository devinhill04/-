/**
 * Скрипт автоматического сканирования постов из каналов экосистемы InvestFuture
 * с автоматическим разбором хэштегов и категоризацией.
 *
 * Запуск: npm run scan:posts
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { SCAN_CHANNELS, HASHTAG_CATEGORY_MAP } from '../../src/shared/config/scanner-rules.js';

interface RawScannedPost {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  url: string;
  tags: string[];
  publishedAt: string;
  channel: string;
}

const POSTS_DB_PATH = path.resolve(process.cwd(), 'public/data/posts.json');

// Извлечение хэштегов из текста
function extractHashtags(text: string): string[] {
  const matches = text.match(/#([a-zA-Zа-яА-ЯёЁ0-9_]+)/g);
  if (!matches) return [];
  return Array.from(
    new Set(
      matches
        .map((t) => t.replace('#', '').toLowerCase().trim())
        .filter((t) => t.length >= 2 && !/^\d+$/.test(t))
    )
  );
}

// Определение категории по хэштегам
function detectCategory(tags: string[], fallbackCategory: string): string {
  for (const tag of tags) {
    if (HASHTAG_CATEGORY_MAP[tag]) {
      return HASHTAG_CATEGORY_MAP[tag];
    }
  }
  return fallbackCategory;
}

// Очистка и формирование заголовка / описания
function parseTextToTitleAndDesc(text: string): { title: string; description: string } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { title: 'Пост из Telegram', description: 'Смотрите подробнее в публикации.' };
  }

  // Заголовок - первая содержательная строка (очищаем от эмодзи в начале, если нужно)
  let title = lines[0].replace(/^[^\wа-яА-ЯёЁ]+/, '').trim();
  if (title.length > 85) {
    title = title.substring(0, 82) + '...';
  }
  if (!title) title = 'Инвестиционный разбор';

  // Описание - следующие 1-3 строки без хэштегов
  const remaining = lines
    .slice(1)
    .filter((l) => !l.startsWith('#'))
    .join(' ');

  let description = remaining || lines[0];
  if (description.length > 180) {
    description = description.substring(0, 175) + '...';
  }

  return { title, description };
}

async function scanChannel(channel: typeof SCAN_CHANNELS[0]): Promise<RawScannedPost[]> {
  const previewUrl = `https://t.me/s/${channel.username}`;
  console.log(`🔍 [Scanner] Сканирование канала @${channel.username} (${channel.name})...`);

  try {
    const res = await fetch(previewUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.warn(`⚠️ Не удалось получить данные канала @${channel.username} (HTTP ${res.status})`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const scannedPosts: RawScannedPost[] = [];

    $('.tgme_widget_message').each((_, elem) => {
      const $msg = $(elem);
      const postRawUrl = $msg.attr('data-post'); // e.g. "investfuture/14202"
      if (!postRawUrl) return;

      const postUrl = `https://t.me/${postRawUrl}`;
      const msgId = postRawUrl.replace('/', '-');

      // Текст сообщения
      const textElem = $msg.find('.tgme_widget_message_text');
      const fullText = textElem.text().trim();
      if (!fullText) return;

      // Извлечение хэштегов
      const tags = extractHashtags(fullText);

      // Картинка (если прикреплена)
      let photoUrl: string | undefined;
      const photoElem = $msg.find('.tgme_widget_message_photo_wrap');
      if (photoElem.length) {
        const style = photoElem.attr('style') || '';
        const bgMatch = style.match(/background-image:url\('([^']+)'\)/);
        if (bgMatch && bgMatch[1]) {
          photoUrl = bgMatch[1];
        }
      }

      // Дата публикации
      const timeElem = $msg.find('time');
      const datetime = timeElem.attr('datetime') || new Date().toISOString();

      // Категория по хэштегам
      const category = detectCategory(tags, channel.defaultCategory || 'evergreen');

      // Форматирование заголовка и краткого описания
      const { title, description } = parseTextToTitleAndDesc(fullText);

      scannedPosts.push({
        id: `scan-${msgId}`,
        title,
        description,
        image: photoUrl,
        category,
        url: postUrl,
        tags: tags.length > 0 ? tags : [channel.defaultCategory || 'инвестиции'],
        publishedAt: `Telegram @${channel.username}`,
        channel: channel.name
      });
    });

    console.log(`✅ @${channel.username}: Найдено ${scannedPosts.length} постов.`);
    return scannedPosts;
  } catch (error) {
    console.error(`❌ Ошибка сканирования @${channel.username}:`, error);
    return [];
  }
}

async function runAutoScan() {
  console.log('🚀 Запуск автосканирования постов по хэштегам...');

  // Читаем текущую базу постов
  let existingPosts: RawScannedPost[] = [];
  if (fs.existsSync(POSTS_DB_PATH)) {
    try {
      const content = fs.readFileSync(POSTS_DB_PATH, 'utf-8');
      existingPosts = JSON.parse(content);
    } catch {
      existingPosts = [];
    }
  }

  const existingUrls = new Set(existingPosts.map((p) => p.url));
  const activeChannels = SCAN_CHANNELS.filter((c) => c.active);
  let totalNewAdded = 0;

  for (const channel of activeChannels) {
    const channelPosts = await scanChannel(channel);

    for (const post of channelPosts) {
      if (!existingUrls.has(post.url)) {
        existingPosts.unshift(post); // Добавляем свежие посты в начало
        existingUrls.add(post.url);
        totalNewAdded++;
      }
    }

    // Небольшая пауза между запросами
    await new Promise((r) => setTimeout(r, 400));
  }

  // Сохраняем обновленную базу
  fs.writeFileSync(POSTS_DB_PATH, JSON.stringify(existingPosts, null, 2), 'utf-8');

  console.log('\n📊 ИТОГИ АВТОСКАНА:');
  console.log(`✨ Добавлено новых постов по хэштегам: ${totalNewAdded}`);
  console.log(`📚 Всего постов в базе: ${existingPosts.length}`);
  console.log(`📁 Файл базы обновлен: ${POSTS_DB_PATH}\n`);
}

runAutoScan();
