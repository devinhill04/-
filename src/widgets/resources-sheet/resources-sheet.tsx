import React, { useState, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Send,
  Tv,
  Sparkles,
  Share2,
  PlayCircle,
  Search,
  Grid
} from 'lucide-react';
import {
  EXTERNAL_RESOURCES,
  PLATFORMS_CONFIG,
  PlatformType,
  ExternalResource
} from '../../shared/config/external-resources';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { track } from '../../shared/lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface ResourcesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourcesSheet: React.FC<ResourcesSheetProps> = ({ isOpen, onClose }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = useMemo(() => {
    return EXTERNAL_RESOURCES.filter((res) => {
      const matchPlatform = selectedPlatform === 'all' || res.platform === selectedPlatform;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchPlatform;

      const matchQuery =
        res.name.toLowerCase().includes(query) ||
        res.description.toLowerCase().includes(query) ||
        res.category.toLowerCase().includes(query) ||
        (res.handle && res.handle.toLowerCase().includes(query));

      return matchPlatform && matchQuery;
    });
  }, [selectedPlatform, searchQuery]);

  if (!isOpen) return null;

  const renderPlatformBadge = (platform: ExternalResource['platform']) => {
    switch (platform) {
      case 'telegram':
        return {
          icon: <Send className="w-4 h-4 text-sky-400" />,
          boxClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          label: 'Telegram'
        };
      case 'youtube':
        return {
          icon: <Tv className="w-4 h-4 text-rose-500" />,
          boxClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          label: 'YouTube'
        };
      case 'max':
        return {
          icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
          boxClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          label: 'MAX'
        };
      case 'vk':
        return {
          icon: <Share2 className="w-4 h-4 text-blue-400" />,
          boxClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          label: 'ВКонтакте'
        };
      case 'rutube':
        return {
          icon: <PlayCircle className="w-4 h-4 text-red-500" />,
          boxClass: 'bg-red-500/10 border-red-500/30 text-red-400',
          label: 'RuTube'
        };
      default:
        return {
          icon: <ExternalLink className="w-4 h-4 text-slate-400" />,
          boxClass: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          label: platform
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="dark:bg-slate-900 bg-white border-t sm:border dark:border-slate-700/80 border-slate-200 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b dark:border-slate-800 border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold dark:text-slate-100 text-slate-900 text-base">
                Экосистема InvestFuture
              </h3>
              <p className="text-[11px] dark:text-slate-400 text-slate-500">
                Все официальные каналы и соцсети ({EXTERNAL_RESOURCES.length})
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                track('resources_sheet_close');
                onClose();
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim().length >= 2) {
                  track('resources_search', { query: val.trim() });
                }
              }}
              placeholder="Поиск канала, платформы или тематики..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl dark:bg-slate-800/80 bg-slate-100 border dark:border-slate-700/60 border-slate-200 dark:text-slate-100 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Platform Filters Chips */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
            {PLATFORMS_CONFIG.map((plat) => {
              const count =
                plat.id === 'all'
                  ? EXTERNAL_RESOURCES.length
                  : EXTERNAL_RESOURCES.filter((r) => r.platform === plat.id).length;
              const isSelected = selectedPlatform === plat.id;

              return (
                <button
                  key={plat.id}
                  onClick={() => {
                    triggerHaptic('light');
                    track('resources_platform_filter', { platform: plat.id });
                    setSelectedPlatform(plat.id as PlatformType);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {plat.id === 'all' && <Grid className="w-3 h-3" />}
                  {plat.id === 'telegram' && <Send className="w-3 h-3" />}
                  {plat.id === 'max' && <Sparkles className="w-3 h-3" />}
                  {plat.id === 'vk' && <Share2 className="w-3 h-3" />}
                  {plat.id === 'youtube' && <Tv className="w-3 h-3" />}
                  {plat.id === 'rutube' && <PlayCircle className="w-3 h-3" />}
                  <span>{plat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isSelected
                        ? 'bg-purple-800/60 text-purple-100'
                        : 'dark:bg-slate-700 bg-slate-200 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resources List */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[60vh]">
          {filteredResources.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium dark:text-slate-400 text-slate-500">
                Ничего не найдено по вашему запросу
              </p>
              <button
                onClick={() => {
                  setSelectedPlatform('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-purple-400 hover:underline font-semibold"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            filteredResources.map((res) => {
              const platformInfo = renderPlatformBadge(res.platform);

              return (
                <div
                  key={res.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    track('external_channel_click', {
                      id: res.id,
                      name: res.name,
                      platform: res.platform,
                      url: res.url
                    });
                    openPostLink(res.url, res.name);
                  }}
                  className="dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:border-slate-700/60 bg-slate-50 hover:bg-slate-100/90 border-slate-200 border rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer group active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Platform Icon Block */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform ${platformInfo.boxClass}`}
                    >
                      {platformInfo.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate">
                          {res.name}
                        </h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded dark:bg-slate-700/60 dark:text-slate-300 bg-slate-200 text-slate-700">
                          {platformInfo.label}
                        </span>
                      </div>

                      <p className="text-[11px] dark:text-slate-400 text-slate-500 line-clamp-1 mt-0.5">
                        {res.description}
                      </p>

                      {res.handle && (
                        <span className="text-[10px] text-purple-400/90 font-medium">
                          {res.handle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {res.badge && (
                      <span className="text-[10px] font-bold dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/50 bg-purple-100 text-purple-700 border-purple-200 px-2 py-0.5 rounded-full border">
                        {res.badge}
                      </span>
                    )}
                    <div className="w-8 h-8 rounded-full dark:bg-slate-700/60 bg-slate-200/80 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
