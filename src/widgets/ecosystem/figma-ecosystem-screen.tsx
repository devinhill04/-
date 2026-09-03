import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { FIGMA_ECOSYSTEM } from '../../shared/config/figma-data';
import { openPostLink } from '../../shared/lib/open-telegram-link';
import { triggerHaptic } from '../../lib/telegram';

interface FigmaEcosystemScreenProps {
  onBack: () => void;
}

export const FigmaEcosystemScreen: React.FC<FigmaEcosystemScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-[390px] mx-auto px-3 py-2 flex flex-col gap-4 select-none">
      {/* Navigation / Section + Back */}
      <div className="relative flex items-center justify-center pt-6 pb-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="absolute left-0 p-1 text-[#161616] dark:text-white hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center"
        >
          <img src="/figma_assets/Arrow_Left_LG.png" alt="" className="w-6 h-6" />
        </button>

        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: '24px',
            lineHeight: '30px',
          }}
          className="text-[#161616] dark:text-white truncate"
        >
          Экосистема IF
        </h2>
      </div>

      {/* List of Resource Cards (Res: w:366, h:116/68, pad: 12, gap: 16, r: 12, fill: #F9F9F9) */}
      <div className="flex flex-col gap-3 pb-8">
        {FIGMA_ECOSYSTEM.map((channel) => {
          // Карточка сайта — особый случай: без мелких кнопок, кликается целиком
          if (channel.id === 'if_site') {
            const siteLink = channel.links[0];
            return (
              <button
                key={channel.id}
                onClick={() => {
                  triggerHaptic('light');
                  openPostLink(siteLink.url, channel.title);
                }}
                style={{
                  borderRadius: '12px',
                  padding: '12px',
                }}
                className="w-full flex items-center gap-3 bg-[#F9F9F9] dark:bg-neutral-800/80 cursor-pointer active:scale-[0.99] transition-transform text-left"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-neutral-200">
                  <img
                    src={channel.avatar}
                    alt={channel.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h4
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '20px',
                    }}
                    className="text-[#161616] dark:text-white truncate"
                  >
                    {channel.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      fontSize: '12px',
                      lineHeight: '15px',
                    }}
                    className="text-[#7D7C82] dark:text-neutral-400 truncate mt-1"
                  >
                    {channel.subtitle}
                  </p>
                </div>

                
              </button>
            );
          }

          return (
            <div
              key={channel.id}
              style={{
                borderRadius: '12px',
                padding: '12px',
              }}
              className="w-full flex flex-col gap-3 bg-[#F9F9F9] dark:bg-neutral-800/80"
            >
              {/* Top row: Avatar + Title + Subtitle */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-neutral-200">
                  <img
                    src={channel.avatar}
                    alt={channel.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-center min-w-0">
                  <h4
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '20px',
                    }}
                    className="text-[#161616] dark:text-white truncate"
                  >
                    {channel.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      fontSize: '12px',
                      lineHeight: '15px',
                    }}
                    className="text-[#7D7C82] dark:text-neutral-400 truncate mt-1"
                  >
                    {channel.subtitle}
                  </p>
                </div>
              </div>

              {/* Platform Buttons row */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                {channel.links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => {
                      triggerHaptic('light');
                      openPostLink(link.url, `${channel.title} (${link.label})`);
                    }}
                    style={{
                      borderRadius: '4px',
                      padding: '8px 12px',
                      height: '32px',
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      fontSize: '12px',
                      lineHeight: '15px',
                    }}
                    className="text-[#161616] bg-white dark:bg-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <span>{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
