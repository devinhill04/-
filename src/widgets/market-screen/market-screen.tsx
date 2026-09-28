import React, { useState } from 'react';
import { MoexHeatmap } from '../moex-heatmap/moex-heatmap';
import { QuotesList } from '../quotes-list/quotes-list';
import { QuotePopup, PopupData } from '../quote-popup/quote-popup';
import { NewsBlock } from '../news-block/news-block';
import { useQuotes } from '../../entities/quotes/model/use-quotes';

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: '25px' }}
    className="text-[#161616] dark:text-white mb-2"
  >
    {children}
  </h2>
);

export const MarketScreen: React.FC = () => {
  const { main, extra } = useQuotes();
  const [popup, setPopup] = useState<PopupData>(null);

  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col gap-5 px-3 pt-3 pb-6">
      <section>
        <Title>Карта рынка</Title>
        <MoexHeatmap onSelectStock={(stock) => setPopup({ kind: 'stock', stock })} />
      </section>

      <section>
        <Title>Котировки</Title>
        <QuotesList main={main} extra={extra} onSelect={(quote) => setPopup({ kind: 'quote', quote })} />
      </section>

      <section>
        <Title>Последние новости</Title>
        <NewsBlock />
      </section>

      <QuotePopup data={popup} onClose={() => setPopup(null)} />
    </div>
  );
};
