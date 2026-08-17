import React from 'react';
import { Download, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { LeadMagnet } from '../../entities/lead-magnet/model/types';
import { STATIC_BANNERS } from '../../shared/config/static-banners';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { track } from '../../shared/lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

interface PromoBannerProps {
  leadMagnet: LeadMagnet | null;
  onOpenResources: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ leadMagnet, onOpenResources }) => {
  return (
    <div className="space-y-3">
      {/* 1. Ecosystem Resources Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/70 rounded-2xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              {STATIC_BANNERS.resources.badge}
            </span>
            <h3 className="text-sm font-bold text-slate-100">{STATIC_BANNERS.resources.title}</h3>
            <p className="text-xs text-slate-300 leading-snug">{STATIC_BANNERS.resources.description}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            track('resources_sheet_open');
            onOpenResources();
          }}
          className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-600/50 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <span>{STATIC_BANNERS.resources.buttonText}</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
        </button>
      </div>

      {/* 2. Lead Magnet Banner */}
      {leadMagnet && (
        <div className="bg-gradient-to-tr from-purple-950 via-slate-900 to-violet-950 border border-purple-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Бесплатный материал
              </span>
              <h3 className="text-sm font-bold text-slate-100">{leadMagnet.title}</h3>
              <p className="text-xs text-slate-300 leading-snug">{leadMagnet.description}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Download className="w-5 h-5" />
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('medium');
              track('lead_magnet_open', {
                title: leadMagnet.title,
                url: leadMagnet.url
              });
              openPostLink(leadMagnet.url, leadMagnet.title);
            }}
            className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-98 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{leadMagnet.buttonText}</span>
          </button>
        </div>
      )}
    </div>
  );
};
