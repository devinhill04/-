import React, { useState } from 'react';
import { Tag, Search, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { triggerHaptic } from '../../lib/telegram';

interface TagCloudProps {
  allTags: string[];
  onSearchByTags?: (tags: string[]) => void;
  selectedTags?: string[];
}

export const TagCloud: React.FC<TagCloudProps> = ({
  allTags,
  onSearchByTags,
  selectedTags: initialSelectedTags = [],
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!allTags || allTags.length === 0) return null;

  const visibleTags = isExpanded ? allTags : allTags.slice(0, 8);
  const hiddenCount = allTags.length - 8;

  const toggleTag = (tag: string) => {
    triggerHaptic('light');
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleExecuteSearch = () => {
    if (selectedTags.length === 0) return;
    triggerHaptic('medium');
    if (onSearchByTags) {
      onSearchByTags(selectedTags);
    }
  };

  const buttonText =
    selectedTags.length === 1
      ? `Найти по хэштегу #${selectedTags[0]}`
      : `Найти по ${selectedTags.length} хэштегам`;

  return (
    <div className="dark:bg-slate-900/80 dark:border-slate-800 bg-white border-slate-200/80 rounded-2xl p-3.5 space-y-3 border shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          <h3 className="text-xs font-bold dark:text-slate-200 text-slate-800">Облако ключевых тегов</h3>
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            Сбросить ({selectedTags.length})
          </button>
        )}
      </div>

      {/* Tags Chips */}
      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 active:scale-95 ${
                isSelected
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/50 shadow-xs'
                  : 'dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50 dark:hover:bg-slate-800 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
            >
              <span>#{tag}</span>
              {isSelected && <Check className="w-3 h-3 text-purple-500 dark:text-purple-400" />}
            </button>
          );
        })}

        {!isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsExpanded(true);
            }}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold dark:bg-slate-800/80 dark:text-purple-400 dark:border-slate-700/60 dark:hover:bg-slate-800 bg-slate-100 text-purple-600 border-slate-200 hover:bg-slate-200 flex items-center gap-1"
          >
            <span>Ещё {hiddenCount}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}

        {isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/60 dark:hover:bg-slate-800 bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 flex items-center gap-1"
          >
            <span>Свернуть</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Button */}
      {selectedTags.length > 0 && (
        <button
          onClick={handleExecuteSearch}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-98 transition-all animate-fade-in"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{buttonText}</span>
        </button>
      )}
    </div>
  );
};
