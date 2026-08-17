import React from 'react';
import { ExternalLink, Crown, ArrowUpRight } from 'lucide-react';
import { AD_BANNER } from '../../shared/config/ad-banner';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { track } from '../../shared/lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

export const AdBanner: React.FC = () => {
  return (
    <div
      onClick={() => {
        triggerHaptic('medium');
        track('banner_click', { title: AD_BANNER.title });
        openPostLink(AD_BANNER.url, AD_BANNER.title);
      }}
      className="relative rounded-2xl overflow-hidden shadow-xl border border-amber-500/40 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 cursor-pointer group active:scale-98 transition-transform"
    >
      {/* Background Image with Gradient Overlay */}
      <img
        src={AD_BANNER.bgImageUrl}
        alt={AD_BANNER.title}
        className="w-full h-36 object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

      {/* Decorative Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Content Layer */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm shadow-amber-500/20">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{AD_BANNER.badge}</span>
            </span>
          </div>
          <span className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-700 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <span>{AD_BANNER.title}</span>
          </h3>
          <p className="text-[11px] text-slate-300 line-clamp-1 leading-snug">
            {AD_BANNER.subtitle}
          </p>
          <div className="pt-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 group-hover:underline">
              <span>{AD_BANNER.buttonText}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] text-slate-400 font-medium">@plus_investfuture</span>
          </div>
        </div>
      </div>
    </div>
  );
};

