import React from 'react';
import { useMoexCurrency } from '../../entities/moex-currency/model/use-moex-currency';

export const MoexCurrencyWidget: React.FC = () => {
  const { rates, isLoading, error } = useMoexCurrency();

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm">Загружаю курсы валют...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-8 px-4">
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm text-center">
          Не удалось загрузить курсы валют.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-3 gap-2">
      {rates.map((r) => {
        const isUp = (r.changePercent ?? 0) > 0;
        const isDown = (r.changePercent ?? 0) < 0;
        return (
          <div
            key={r.code}
            style={{ borderRadius: '12px' }}
            className="flex flex-col gap-1 p-3 bg-[#F9F9F9] dark:bg-neutral-800/80"
          >
            <span className="text-[#7D7C82] dark:text-neutral-400 text-[11px] font-medium">
              {r.code}/RUB
            </span>
            <span className="text-[#161616] dark:text-white text-[16px] font-semibold">
              {r.rate !== null ? r.rate.toFixed(2) : '—'}
            </span>
            {r.changePercent !== null && (
              <span
                className={`text-[11px] font-medium ${
                  isUp ? 'text-[#00C853]' : isDown ? 'text-[#FF1744]' : 'text-[#7D7C82] dark:text-neutral-400'
                }`}
              >
                {isUp ? '+' : ''}
                {r.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
