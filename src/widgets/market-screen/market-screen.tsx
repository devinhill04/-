import React, { useState } from 'react';
import { MoexHeatmap } from '../moex-heatmap/moex-heatmap';
import { QuotesList } from '../quotes-list/quotes-list';
import { QuotePopup, PopupData } from '../quote-popup/quote-popup';
import { NewsBlock } from '../news-block/news-block';
import { StocksTabs } from '../stocks-lists/stocks-lists';
import { useQuotes } from '../../entities/quotes/model/use-quotes';
import { useMoexHeatmap } from '../../entities/moex/model/use-moex-heatmap';
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
          <StocksTabs stocks={heat.stocks} onSelect={(s) => openStock(s, 'stocks_list')} />
        )}
      </section>

      <section>
        <Title>Последние новости</Title>
        <NewsBlock />
      </section>

      <QuotePopup data={popup} onClose={() => setPopup(null)} />
    </div>
  );
};
