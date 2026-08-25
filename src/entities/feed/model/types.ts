export type FeedEntityType = 'post' | 'material' | 'banner';

export interface BaseFeedEntity {
  id: string;
  type: FeedEntityType;
  title: string;
  category: string;
  tags: string[];
}

export interface PostFeedEntity extends BaseFeedEntity {
  type: 'post';
  description: string;
  url: string;
  image?: string;
  publishedAt?: string;
  channel?: string;
  channelAvatar?: string;
}

export type MaterialFormat = 'guide' | 'video' | 'article' | 'podcast';

export interface MaterialFeedEntity extends BaseFeedEntity {
  type: 'material';
  description: string;
  url: string;
  format: MaterialFormat;
  duration: string; // e.g. "12 мин", "25 мин видео", "Гайд PDF"
  badge?: string;
  level?: 'junior' | 'middle' | 'pro';
  image?: string;
  author?: string;
}

export interface BannerFeedEntity extends BaseFeedEntity {
  type: 'banner';
  subtitle: string;
  badge: string; // e.g. "IF+ CLUB"
  discountBadge?: string; // e.g. "-30% сегодня"
  benefits: string[];
  buttonText: string;
  url: string;
  price?: string;
  bgImageUrl?: string;
}

export type FeedEntity = PostFeedEntity | MaterialFeedEntity | BannerFeedEntity;
