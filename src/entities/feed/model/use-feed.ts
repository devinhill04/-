import { useMemo } from 'react';
import { usePosts } from '../../post/model/use-posts';
import { FeedEntity, MaterialFeedEntity, BannerFeedEntity } from './types';

// Стандартные обучающие материалы экосистемы InvestFuture
const FEATURED_MATERIALS: MaterialFeedEntity[] = [
  {
    id: 'mat-guide-crypto-safety',
    type: 'material',
    title: 'Полный гайд по безопасности криптокошельков и P2P сделок',
    description: 'Как защитить активы от фишинга, правильно настроить 2FA, холодные кошельки и не потерять депозит.',
    url: 'https://t.me/if_crypto_ru',
    format: 'guide',
    duration: '15 мин чтения',
    category: 'crypto',
    badge: 'База знаний',
    tags: ['крипта', 'безопасность', 'гайд'],
  },
  {
    id: 'mat-video-portfolio-diversification',
    type: 'material',
    title: 'Стратегия диверсификации портфеля в условиях высокой ключевой ставки',
    description: 'Разбор баланса между флоатерами, ОФЗ, дивидендными акциями и фондами денежного рынка.',
    url: 'https://youtube.com/@investfutureru',
    format: 'video',
    duration: '24 мин видео',
    category: 'investing',
    badge: 'Видеоразбор',
    tags: ['инвестиции', 'чтовпортфеле', 'акции', 'облигации'],
  },
  {
    id: 'mat-article-tax-deductions',
    type: 'material',
    title: 'Налоговые вычеты для инвестора: ИИС-3, сальдирование и ЛДВ',
    description: 'Пошаговая инструкция по возврату до 60 000 ₽ в год от государства без сложных деклараций.',
    url: 'https://t.me/investfuture',
    format: 'article',
    duration: '8 мин',
    category: 'personal-finance',
    badge: 'Инструкция',
    tags: ['налоги', 'иис', 'личныефинансы'],
  },
  {
    id: 'mat-podcast-estate-mortgage',
    type: 'material',
    title: 'Рынок недвижимости 2026: брать ли рассрочку или ждать снижения цен?',
    description: 'Анализ спроса на новостройки, альтернативы льготной ипотеке и тренды аренды.',
    url: 'https://t.me/if_estate',
    format: 'podcast',
    duration: '32 мин аудио',
    category: 'real-estate',
    badge: 'Аудиоподкаст',
    tags: ['недвижимость', 'ипотека', 'подкаст'],
  },
];

// Конверсионный блок подписки InvestFuture+
const IF_PLUS_BANNER: BannerFeedEntity = {
  id: 'banner-if-plus-club',
  type: 'banner',
  title: 'InvestFuture+ Клуб разумных инвесторов',
  subtitle: 'Закрытое сообщество с готовыми сделками, портфелями аналитиков и прямыми эфирами',
  badge: 'IF+ ПРЕМИУМ',
  discountBadge: 'Скидка до -30%',
  benefits: [
    'Готовые портфели и сделки топ-аналитиков в реальном времени',
    'Еженедельные стримы с ответами на вопросы по рынку',
    'Закрытый чат резидентов и база эксклюзивных отчетов',
  ],
  buttonText: 'Оформить подписку IF+',
  url: 'https://t.me/plus_investfuture',
  price: 'от 990 ₽/мес',
  category: 'all',
  tags: ['if_plus', 'клуб', 'инвестиции'],
};

export function useFeed() {
  const { posts, isLoading, error } = usePosts();

  const feedEntities = useMemo<FeedEntity[]>(() => {
    const postEntities: FeedEntity[] = posts.map((p) => ({
      id: p.id,
      type: 'post' as const,
      title: p.title,
      description: p.description,
      image: p.image,
      category: p.category,
      url: p.url,
      tags: p.tags || [],
      publishedAt: p.publishedAt,
      channel: p.channel,
    }));

    // Интегрируем материалы и IF+ баннер в ленту
    const combined: FeedEntity[] = [];

    // Вставляем IF+ баннер в начало/топ ленты
    combined.push(IF_PLUS_BANNER);

    // Добавляем посты и периодически вставляем материалы
    let materialIndex = 0;
    postEntities.forEach((post, index) => {
      combined.push(post);

      // Вставляем обучающий материал через каждые 4 поста
      if ((index + 1) % 4 === 0 && materialIndex < FEATURED_MATERIALS.length) {
        combined.push(FEATURED_MATERIALS[materialIndex]);
        materialIndex++;
      }
    });

    return combined;
  }, [posts]);

  return {
    feedEntities,
    posts,
    isLoading,
    error,
  };
}
