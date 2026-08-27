import React from 'react';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface BannersCarouselProps {
  onOpenResources: () => void;
}

export const BannersCarousel: React.FC<BannersCarouselProps> = ({
  onOpenResources,
}) => {
  const handleOpenIfPlus = () => {
    triggerHaptic('heavy');
    AnalyticsService.trackIfPlusConversion('carousel_if_plus_banner');
    openPostLink('https://t.me/plus_investfuture', 'Клуб InvestFuture+');
  };

  const handleOpenGiftGuide = () => {
    triggerHaptic('medium');
    AnalyticsService.track('lead_magnet_open', { source: 'carousel_gift_banner' });
    openPostLink('https://t.me/investfuture', 'Гайд по ИИС-3 и дивидендам');
  };

  const handleOpenResources = () => {
    triggerHaptic('medium');
    AnalyticsService.track('resources_sheet_open');
    onOpenResources();
  };

  return (
    <div className="w-full overflow-hidden select-none">
      <div 
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 px-3 items-stretch"
        style={{ scrollPaddingLeft: '12px', scrollPaddingRight: '12px' }}
      >
        {/* 1. Banner_All_Resourses (id: 99:1915 / 37:1799) */}
        <div
          id="banner-all-resources"
          onClick={handleOpenResources}
          style={{
            width: '320px',
            minWidth: '320px',
            height: '140px',
            borderRadius: '12px',
          }}
          className="snap-start shrink-0 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-[#F9F9F7] dark:bg-neutral-800 shadow-2xs"
        >
          <img
            src="/figma_assets/exact_banner_all_resources.png"
            alt="Все наши ресурсы и площадки"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* 2. Banner_IF+_BASE (id: 99:1919 / 37:1770) */}
        <div
          id="banner-if-plus"
          onClick={handleOpenIfPlus}
          style={{
            width: '320px',
            minWidth: '320px',
            height: '140px',
            borderRadius: '12px',
          }}
          className="snap-start shrink-0 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-black shadow-2xs"
        >
          <img
            src="/figma_assets/exact_banner_if_plus.png"
            alt="Подписка IF+"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* 3. Banner_Gift (id: 99:1924 / 37:1789) */}
        <div
          id="banner-gift-guide"
          onClick={handleOpenGiftGuide}
          style={{
            width: '320px',
            minWidth: '320px',
            height: '140px',
            borderRadius: '12px',
          }}
          className="snap-start shrink-0 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-white shadow-2xs"
        >
          <img
            src="/figma_assets/exact_banner_gift.png"
            alt="Гайд по ИИС-3 и дивидендам"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

