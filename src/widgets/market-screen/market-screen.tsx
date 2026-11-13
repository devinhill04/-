import React, { useState } from 'react';
import { useCalculator } from '../../shared/lib/calculator-context';
import { CALCULATORS_ENABLED } from '../../shared/config/features';
import { MoexHeatmap } from '../moex-heatmap/moex-heatmap';
import { QuotesList } from '../quotes-list/quotes-list';
import { QuotePopup, PopupData } from '../quote-popup/quote-popup';
import { NewsBlock } from '../news-block/news-block';
import { StocksTabs } from '../stocks-lists/stocks-lists';
import { useQuotes } from '../../entities/quotes/model/use-quotes';
import { useMoexHeatmap } from '../../entities/moex/model/use-moex-heatmap';
import { useMoexMovers } from '../../entities/moex/model/use-moex-movers';
import { MoexStock } from '../../entities/moex/model/types';
import { Quote } from '../../entities/quotes/model/types';
import { AnalyticsService } from '../../shared/analytics/analytics';

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: '25px' }}
    className="text-[#161616] dark:text-white mb-2"
  >
    {children}
  </h2>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-6 text-center">{children}</p>
);

export const MarketScreen: React.FC = () => {
  const { main, extra } = useQuotes();
  // Данные акций грузим один раз на всю вкладку: карта и список под ней используют один и тот же ответ биржи
  const heat = useMoexHeatmap();
  const { openCalculator } = useCalculator();
  const movers = useMoexMovers();
  const [popup, setPopup] = useState<PopupData>(null);
  // Один и тот же результат («открыли карточку инструмента») с разных мест: source показывает, откуда нажали
  const openQuote = (quote: Quote) => {
    AnalyticsService.track('market_quote_click', { kind: 'quote', id: quote.id, source: 'quotes_list' });
    setPopup({ kind: 'quote', quote });
  };
  const openStock = (stock: MoexStock, source: 'heatmap' | 'stocks_list') => {
    AnalyticsService.track('market_quote_click', { kind: 'stock', id: stock.secid, source });
    setPopup({ kind: 'stock', stock });
  };

  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col gap-5 px-3 pt-3 pb-6">
      <section>
        <Title>Котировки</Title>
        <QuotesList main={main} extra={extra} onSelect={openQuote} />
      </section>

      <section>
        <Title>Тепловая карта</Title>
        <MoexHeatmap {...heat} onSelectStock={(s) => openStock(s, 'heatmap')} />
      </section>

      <section>
        {heat.isLoading ? (
          <Note>Загружаю котировки акций...</Note>
        ) : heat.error || heat.stocks.length === 0 ? (
          <Note>Не удалось загрузить котировки акций</Note>
        ) : (
          <StocksTabs stocks={heat.stocks} movers={movers} onSelect={(s) => openStock(s, 'stocks_list')} />
        )}
      </section>

      {CALCULATORS_ENABLED && (
        <section>
          <Title>Инструменты</Title>
          <button onClick={() => openCalculator(null, 'market')} className="w-full text-left rounded-[12px] bg-[#F9F9F9] dark:bg-neutral-900 px-4 py-3 active:opacity-70" data-tool="bond-calculator">
            <p className="text-[15px] font-semibold text-[#161616] dark:text-white">Калькулятор облигаций</p>
            <p className="text-[12px] leading-[16px] text-[#7D7C82] dark:text-neutral-400 mt-0.5">Стоимость покупки с НКД, все будущие купоны и итог до погашения</p>
          </button>
        </section>
      )}

      <section>
        <Title>Последние новости</Title>
        <NewsBlock />
      </section>

      <QuotePopup data={popup} onClose={() => setPopup(null)} />
    </div>
  );
};
