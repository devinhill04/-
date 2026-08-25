import React from 'react';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { triggerHaptic } from '../../lib/telegram';

import bannerResourcesImg from '../../assets/images/banner_resources_1787647646503.jpg';
import bannerIfPlusImg from '../../assets/images/banner_if_plus_1787647622024.jpg';
import bannerGiftImg from '../../assets/images/banner_gift_1787647635544.jpg';

interface BannersCarouselProps {
  onOpenResources: () => void;
  onOpenLeadMagnet?: () => void;
}

export const BannersCarousel: React.FC<BannersCarouselProps> = ({
  onOpenResources,
}) => {
  const handleOpenResources = () => {
    triggerHaptic('medium');
    AnalyticsService.track('resources_sheet_open');
    onOpenResources();
  };

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

  return (
    <div className="relative -mx-4 px-4 overflow-hidden">
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1">
        {/* 1. Banner_All_Resources: "Все наши ресурсы и площадки" */}
        <div
          onClick={handleOpenResources}
          className="snap-start shrink-0 w-[344px] rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer group active:scale-[0.99] transition-all min-h-[120px]"
        >
          <div className="max-w-[190px] z-10">
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              Все наши ресурсы и площадки
            </h3>
          </div>

          <div className="z-10 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenResources();
              }}
              className="bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 dark:text-zinc-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition-transform active:scale-95 shadow-xs"
            >
              Открыть
            </button>
          </div>

          {/* 3D Illustration Graphic from Figma Export */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img
              src={bannerResourcesImg}
              alt="Все ресурсы"
              className="w-28 h-28 object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* 2. Banner_IF+_BASE: "Подписка IF+" (Exact Figma 344x100 Frame) */}
        <div
          onClick={handleOpenIfPlus}
          className="snap-start shrink-0 w-[344px] rounded-2xl p-4 bg-gradient-to-br from-[#061708] via-[#0D2A0E] to-[#040E05] border border-emerald-500/30 shadow-md relative overflow-hidden flex flex-col justify-between cursor-pointer group active:scale-[0.99] transition-all min-h-[120px]"
        >
          {/* Subtle Green Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/25 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-[200px] z-10 space-y-1">
            <h3 className="text-[15px] font-extrabold text-white leading-tight">
              Подписка IF+
            </h3>
            <p className="text-[11px] text-emerald-100/85 leading-snug font-normal">
              Эксклюзивная аналитика, инвестидеи, разборы рынка и готовые портфели
            </p>
          </div>

          {/* 3D Metallic Green Ring Graphic from Figma Export */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img
              src={bannerIfPlusImg}
              alt="IF+ Подписка"
              className="w-28 h-28 object-contain drop-shadow-xl"
            />
          </div>
        </div>

        {/* 3. Banner_Gift: "Гайд по ИИС-3 и дивидендам" */}
        <div
          onClick={handleOpenGiftGuide}
          className="snap-start shrink-0 w-[344px] rounded-2xl p-4 bg-gradient-to-r from-[#EFF4FF] via-[#F6F0FF] to-[#FFEBF2] dark:from-[#1E1730] dark:via-[#1B1B2A] dark:to-[#2B1728] border border-purple-200/70 dark:border-purple-800/40 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer group active:scale-[0.99] transition-all min-h-[120px]"
        >
          <div className="max-w-[200px] z-10 space-y-1">
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              Гайд по ИИС-3 и дивидендам
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-normal">
              Бесплатная PDF-инструкция и подборка из 10 топовых бумаг с ежемесячным купоном
            </p>
          </div>

          {/* 3D Gift Graphic from Figma Export */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img
              src={bannerGiftImg}
              alt="Гайд по ИИС-3"
              className="w-28 h-28 object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
