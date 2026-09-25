import React from 'react';
import { MoexHeatmap } from '../moex-heatmap/moex-heatmap';
import { MoexCurrencyWidget } from '../moex-currency/moex-currency';

export const MarketScreen: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-4 px-3 pt-3 pb-6">
      <div>
        <h2
          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: '25px' }}
          className="text-[#161616] dark:text-white mb-1"
        >
          Курсы валют
        </h2>
        <MoexCurrencyWidget />
      </div>

      <div>
        <h2
          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: '25px' }}
          className="text-[#161616] dark:text-white mb-2"
        >
          Карта рынка
        </h2>
        <MoexHeatmap />
      </div>
    </div>
  );
};
