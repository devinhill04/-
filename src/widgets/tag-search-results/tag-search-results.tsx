import React from 'react';
import { ArrowLeft, Tag, X, ExternalLink, Send, SearchX, AlertTriangle } from 'lucide-react';
import { Post } from '../../entities/post/model/types';
import { normalizeTag } from '../../entities/post/lib/filter-by-tags';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { CardSkeleton } from '../../shared/ui/card-skeleton';
import { triggerHaptic } from '../../lib/telegram';

interface TagSearchResultsProps {
  selectedTags: string[];
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onRemoveTag: (tag: string) => void;
  onClearTags: () => void;
  onSelectTag?: (tag: string) => void;
}

export const TagSearchResults: React.FC<TagSearchResultsProps> = ({
  selectedTags,
  posts,
  isLoading,
  error,
  onBack,
  onRemoveTag,
  onClearTags,
  onSelectTag,
}) => {
  const normalizedSelected = selectedTags.map(normalizeTag);

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Search Header Bar */}
      <div className="dark:bg-slate-900/90 dark:border-slate-800 bg-white border-slate-200/80 rounded-2xl p-4 border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться в каталог</span>
          </button>

          {selectedTags.length > 0 && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClearTags();
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Сбросить все
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-extrabold dark:text-slate-100 text-slate-900">
              Результаты поиска по хэштегам
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Показаны все материалы Telegram-канала с выбранными тегами.
          </p>
        </div>

        {/* Selected Tags Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30"
            >
              <span>#{tag}</span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onRemoveTag(tag);
                }}
                className="hover:bg-purple-500/20 rounded-md p-0.5 transition-colors"
                title="Удалить тег"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {!isLoading && !error && (
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t dark:border-slate-800/80 border-slate-100 pt-2 flex items-center justify-between">
            <span>Найдено постов: <strong className="text-purple-600 dark:text-purple-400">{posts.length}</strong></span>
          </div>
        )}
      </div>

      {/* States handling */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="dark:bg-slate-900/90 dark:border-slate-800 bg-white border-slate-200/80 rounded-2xl p-6 text-center border shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">
            Ошибка загрузки данных
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            Вернуться в каталог
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="dark:bg-slate-900/90 dark:border-slate-800 bg-white border-slate-200/80 rounded-2xl p-8 text-center border shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">
            Постов с этим хэштегом не найдено
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Попробуйте выбрать другой хэштег из облака тегов или вернитесь к полному каталогу.
          </p>
          <button
            onClick={() => {
              triggerHaptic('medium');
              onBack();
            }}
            className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            Вернуться в каталог
          </button>
        </div>
      ) : (
        /* Results List */
        <div className="space-y-3.5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="dark:bg-slate-900/90 dark:border-slate-800/90 bg-white border-slate-200/80 rounded-2xl p-4 border shadow-xs hover:border-purple-500/40 transition-all space-y-3 group"
            >
              {/* Optional Post Image */}
              {post.image && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-800">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  <Tag className="w-3 h-3 text-purple-500 shrink-0" />
                  {post.tags.map((t, idx) => {
                    const normT = normalizeTag(t);
                    const isMatched = normalizedSelected.includes(normT);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onSelectTag) {
                            triggerHaptic('light');
                            onSelectTag(t);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors whitespace-nowrap ${
                          isMatched
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40'
                            : 'dark:bg-slate-800 dark:text-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer Open Post Link Button */}
              <div className="pt-2 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Telegram канал
                </span>
                <button
                  onClick={() => openPostLink(post.url, post.title)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-purple-600/20 active:scale-95 transition-all"
                >
                  <Send className="w-3 h-3 -translate-x-0.5" />
                  <span>Открыть пост</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
