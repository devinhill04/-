import React, { useState } from 'react';
import { Tag, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { triggerHaptic } from '../../lib/telegram';
import { AnalyticsService } from '../../shared/analytics/analytics';

interface TagCloudProps {
  allTags: string[];
  onSearchByTags?: (tags: string[]) => void;
  selectedTags?: string[];
}

const POPULAR_DISPLAY_TAGS = [
  'Новости',
  'Аналитика',
  'Идея',
  'Рынок',
  'Обучение',
  'Лайфхак',
  'ЛичныеФинансы',
  'Портфель',
  'Регулирование',
  'mindset',
  'чтовпортфеле',
  'инвестиции',
  'акции',
  'крипта',
  'облигации',
  'недвижимость',
  'новичкам',
  'иис',
];

export const TagCloud: React.FC<TagCloudProps> = ({
  allTags,
  onSearchByTags,
  selectedTags: initialSelectedTags = [],
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [isExpanded, setIsExpanded] = useState(false);

  // Merge unique tags with popular tags
  const combinedTags = React.useMemo(() => {
    const set = new Set<string>();
    POPULAR_DISPLAY_TAGS.forEach((t) => set.add(t));
    allTags.forEach((t) => set.add(t));
    return Array.from(set);
  }, [allTags]);

  const visibleTags = isExpanded ? combinedTags : combinedTags.slice(0, 9);
  const hiddenCount = combinedTags.length - 9;

  const handleTagClick = (tag: string) => {
    triggerHaptic('light');
    AnalyticsService.trackTagClick(tag, 'tag_cloud');

    let updated: string[];
    if (selectedTags.includes(tag)) {
      updated = selectedTags.filter((t) => t !== tag);
    } else {
      updated = [...selectedTags, tag];
    }
    setSelectedTags(updated);

    if (onSearchByTags) {
      onSearchByTags(updated);
    }
  };

  const handleClear = () => {
    triggerHaptic('light');
    setSelectedTags([]);
    if (onSearchByTags) {
      onSearchByTags([]);
    }
  };

  return (
    <section className="space-y-2.5 pt-1">
      {/* Header with Purple Tag Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#5542F6] dark:text-purple-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Поиск постов по тегам
          </h2>
        </div>

        {selectedTags.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-[#5542F6] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Сбросить ({selectedTags.length})</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tags Chips */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {visibleTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-[#5542F6] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              }`}
            >
              <span>#{tag}</span>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </button>
          );
        })}

        {/* Expand / Collapse Button matching Figma "Еще 65 ∨" */}
        {!isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsExpanded(true);
            }}
            className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-zinc-950 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <span>Еще {hiddenCount > 0 ? hiddenCount : 65}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}

        {isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            className="bg-zinc-800 hover:bg-zinc-900 dark:bg-slate-800 dark:text-slate-200 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <span>Свернуть</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};
