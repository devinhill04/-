import React from 'react';
import {
  ExternalLink,
  Tag,
  Video,
  FileText,
  Headphones,
  BookOpen,
  Crown,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Send,
} from 'lucide-react';
import { FeedEntity, PostFeedEntity, MaterialFeedEntity, BannerFeedEntity } from '../../entities/feed/model/types';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { AnalyticsService } from '../../shared/analytics/analytics';

interface FeedEntityCardProps {
  entity: FeedEntity;
  onTagClick?: (tag: string) => void;
}

export const FeedEntityCard: React.FC<FeedEntityCardProps> = ({ entity, onTagClick }) => {
  if (entity.type === 'post') {
    return <PostCard post={entity} onTagClick={onTagClick} />;
  }

  if (entity.type === 'material') {
    return <MaterialCard material={entity} onTagClick={onTagClick} />;
  }

  if (entity.type === 'banner') {
    return <BannerCard banner={entity} />;
  }

  return null;
};

// 1. Post Entity Component
const PostCard: React.FC<{ post: PostFeedEntity; onTagClick?: (tag: string) => void }> = ({
  post,
  onTagClick,
}) => {
  const handleClick = () => {
    AnalyticsService.trackPostOpen(post);
    openPostLink(post.url, post.title);
  };

  return (
    <article
      onClick={handleClick}
      className="dark:bg-slate-900/80 dark:hover:bg-slate-800/90 dark:border-slate-800/90 bg-white hover:bg-slate-50 border-slate-200/80 rounded-2xl p-3.5 transition-all cursor-pointer group active:scale-98 shadow-xs flex flex-col justify-between border"
    >
      <div className="flex gap-3 items-start">
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-20 h-20 rounded-xl object-cover shrink-0 border dark:border-slate-800 border-slate-200 group-hover:scale-105 transition-transform duration-300"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            <Send className="w-3 h-3" />
            <span className="truncate">{post.channel || 'InvestFuture'}</span>
          </div>

          <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h4>

          <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-1 line-clamp-2 leading-tight">
            {post.description}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Tag className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />
          {post.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                if (onTagClick) {
                  e.stopPropagation();
                  AnalyticsService.trackTagClick(tag, 'post_card');
                  onTagClick(tag);
                }
              }}
              className="dark:bg-slate-800/80 dark:text-slate-300 bg-slate-100 text-slate-700 hover:text-purple-600 dark:hover:text-purple-300 px-1.5 py-0.5 rounded whitespace-nowrap font-medium transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>

        <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-semibold group-hover:underline">
          Читать
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </span>
      </div>
    </article>
  );
};

// 2. Material Entity Component (Educational format badges, duration)
const MaterialCard: React.FC<{ material: MaterialFeedEntity; onTagClick?: (tag: string) => void }> = ({
  material,
  onTagClick,
}) => {
  const handleClick = () => {
    AnalyticsService.trackMaterialOpen(material);
    openPostLink(material.url, material.title);
  };

  const getFormatIcon = () => {
    switch (material.format) {
      case 'video':
        return <Video className="w-3 h-3 text-red-500" />;
      case 'podcast':
        return <Headphones className="w-3 h-3 text-amber-500" />;
      case 'guide':
        return <BookOpen className="w-3 h-3 text-emerald-500" />;
      case 'article':
      default:
        return <FileText className="w-3 h-3 text-blue-500" />;
    }
  };

  const getFormatLabel = () => {
    switch (material.format) {
      case 'video':
        return 'Видео';
      case 'podcast':
        return 'Подкаст';
      case 'guide':
        return 'Гайд';
      case 'article':
      default:
        return 'Статья';
    }
  };

  return (
    <article
      onClick={handleClick}
      className="dark:bg-slate-900/80 dark:hover:bg-slate-800/90 dark:border-slate-800 bg-white hover:bg-slate-50 border-slate-200/80 rounded-2xl p-3.5 transition-all cursor-pointer group active:scale-98 shadow-xs border flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold dark:bg-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border dark:border-slate-700/60 border-slate-200 text-slate-700 dark:text-slate-300">
              {getFormatIcon()}
              <span>{getFormatLabel()}</span>
            </span>

            {material.duration && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-2.5 h-2.5" />
                <span>{material.duration}</span>
              </span>
            )}
          </div>

          {material.badge && (
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
              {material.badge}
            </span>
          )}
        </div>

        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
          {material.title}
        </h4>

        <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-1 line-clamp-2 leading-tight">
          {material.description}
        </p>
      </div>

      <div className="mt-3 pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {material.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                if (onTagClick) {
                  e.stopPropagation();
                  AnalyticsService.trackTagClick(tag, 'material_card');
                  onTagClick(tag);
                }
              }}
              className="dark:bg-slate-800/80 dark:text-slate-300 bg-slate-100 text-slate-700 hover:text-purple-600 dark:hover:text-purple-300 px-1.5 py-0.5 rounded whitespace-nowrap font-medium transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>

        <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-bold group-hover:underline">
          Изучить
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </span>
      </div>
    </article>
  );
};

// 3. IF+ Club Banner Entity Component
const BannerCard: React.FC<{ banner: BannerFeedEntity }> = ({ banner }) => {
  const handleClick = () => {
    AnalyticsService.trackIfPlusConversion('feed_entity_banner');
    openPostLink(banner.url, banner.title);
  };

  return (
    <aside
      onClick={handleClick}
      className="relative rounded-2xl overflow-hidden shadow-xl border border-amber-500/40 bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-900 cursor-pointer group active:scale-98 transition-all p-4 text-white"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-xs">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{banner.badge}</span>
            </span>

            {banner.discountBadge && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {banner.discountBadge}
              </span>
            )}
          </div>

          <span className="w-7 h-7 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        <div>
          <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
            {banner.title}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 leading-snug">{banner.subtitle}</p>
        </div>

        {banner.benefits && banner.benefits.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {banner.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
          <button className="py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all">
            <span>{banner.buttonText}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {banner.price && (
            <span className="text-xs font-extrabold text-amber-300">{banner.price}</span>
          )}
        </div>
      </div>
    </aside>
  );
};
