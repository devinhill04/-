import React, { useMemo } from 'react';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface BannersCarouselProps {
  onOpenResources: () => void;
}

type BannerId = 'resources' | 'if-plus' | 'gift';

// Фиксируем порядок один раз на сессию пользователя (sessionStorage),
// чтобы порядок не менялся при каждом ре-рендере/переходе между экранами,
// но был случайным между разными визитами/пользователями.
function getSessionBannerOrder(): BannerId[] {
  const STORAGE_KEY = 'banners_order_v1';
  const defaultOrder: BannerId[] = ['resources', 'if-plus', 'gift'];

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BannerId[];
      if (Array.isArray(parsed) && parsed.length === defaultOrder.length) {
        return parsed;
      }
    }
  } catch {
    // sessionStorage недоступен (например, приватный режим) — просто используем порядок по умолчанию без сохранения
  }

  const shuffled = [...defaultOrder];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(shuffled));
  } catch {
    // игнорируем ошибку сохранения
  }

  return shuffled;
}

export const BannersCarousel: React.FC<BannersCarouselProps> = ({
  onOpenResources,
}) => {
  const order = useMemo(() => getSessionBannerOrder(), []);

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

  const banners: Record<BannerId, React.ReactNode> = {
    resources: (
      <div
        key="resources"
        id="banner-all-resources"
        onClick={handleOpenResources}
        style={{ width: '320px', minWidth: '320px', height: '140px', borderRadius: '12px' }}
        className="snap-start shrink-0 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-[#F9F9F7] dark:bg-neutral-800 shadow-2xs"
      >
        <img
          src="/figma_assets/exact_banner_all_resources.png"
          alt="Все наши ресурсы и площадки"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    ),
    'if-plus': (
      <div
        key="if-plus"
        id="banner-if-plus"
        onClick={handleOpenIfPlus}
        style={{ width: '320px', minWidth: '320px', height: '140px', borderRadius: '12px' }}
        className="snap-start shrink-0 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-black shadow-2xs"
      >
        <img
          src="/figma_assets/exact_banner_if_plus.png"
          alt="Подписка IF+"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    ),
    gift: (
      <div
        key="gift"
        id="banner-gift-guide"
        onClick={handleOpenGiftGuide}
        style={{ width: '320px', minWidth: '320px', height: '140px', borderRadius: '12px' }}
        className="snap-start shrink-0 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-white shadow-2xs"
      >
        <img
          src="/figma_assets/exact_banner_gift.png"
          alt="Гайд по ИИС-3 и дивидендам"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    ),
  };

  return (
    <div className="w-full overflow-hidden select-none">
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 px-3 items-stretch"
        style={{ scrollPaddingLeft: '12px', scrollPaddingRight: '12px' }}
      >
        {order.map((id) => banners[id])}
      </div>
    </div>
  );
};

