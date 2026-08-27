import React, { useState } from 'react';
import { Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { FIGMA_TAGS } from '../../shared/config/figma-data';
import { triggerHaptic } from '../../lib/telegram';

interface FigmaTagSearchProps {
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
  availableTags?: string[];
}

export const FigmaTagSearch: React.FC<FigmaTagSearchProps> = ({
  selectedTag,
  onSelectTag,
  availableTags,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine predefined tags with any extra dynamic tags
  const tagsList = availableTags && availableTags.length > 0 
    ? Array.from(new Set([...FIGMA_TAGS.map(t => t.name), ...availableTags.map(t => t.startsWith('#') ? t : `#${t}`)]))
    : FIGMA_TAGS.map(t => t.name);

  // Initial visible items in Figma is about 10-12
  const visibleTags = isExpanded ? tagsList : tagsList.slice(0, 10);
  const hiddenCount = tagsList.length - 10;

  return (
    <div className="w-full px-3 py-3 flex flex-col gap-4">
      {/* Header + Icon */}
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-[#161616] dark:text-neutral-300 stroke-[2]" />
        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: '25px',
          }}
          className="text-[#161616] dark:text-white"
        >
          Поиск постов по тегам
        </h2>
      </div>

      {/* Tags Grid / Wrap container */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {visibleTags.map((tag) => {
          const isSelected = selectedTag === tag;

          return (
            <button
              key={tag}
              onClick={() => {
                triggerHaptic('light');
                onSelectTag(tag);
              }}
              style={{
                borderRadius: '999px',
                padding: '8px 12px',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '15px',
                height: '31px',
              }}
              className={`inline-flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-[#5737FA] text-white shadow-xs'
                  : 'bg-[#F9F9F9] text-[#161616] dark:bg-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tag}
            </button>
          );
        })}

        {/* Search_Tag_Btn: "Еще N" button from Figma */}
        {hiddenCount > 0 && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsExpanded(!isExpanded);
            }}
            style={{
              borderRadius: '999px',
              padding: '8px 12px 8px 16px',
              background: '#161616',
              height: '31px',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '15px',
              color: '#FFFFFF',
            }}
            className="inline-flex items-center justify-center gap-1 cursor-pointer hover:bg-black active:scale-95 transition-all dark:bg-white dark:text-[#161616]"
          >
            <span>{isExpanded ? 'Свернуть' : `Еще ${hiddenCount}`}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
