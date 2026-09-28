import React, { useState } from 'react';
import { MoexHeatmap } from '../moex-heatmap/moex-heatmap';
import { QuotesList } from '../quotes-list/quotes-list';
import { QuotePopup, PopupData } from '../quote-popup/quote-popup';
import { NewsBlock } from '../news-block/news-block';
import { TopTurnoverList, MoversList } from '../stocks-lists/stocks-lists';
import { useQuotes } from '../../entities/quotes/model/use-quotes';
import { useMoexHeatmap } from '../../entities/moex/model/use-moex-heatmap';
import { MoexStock } from '../../entities/moex/model/types';

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
  // Данные акций грузим один раз на всю вкладку: карта и оба списка используют один и тот же ответ биржи
  const heat = useMoexHeatmap();
  const [popup, setPopup] = useState<PopupData>(null);
  const openStock = (stock: MoexStock) => setPopup({ kind: 'stock', stock });

  // Списки акций: ждём данные / сообщаем об ошибке, иначе показываем содержимое
  const stocksBlock = (render: () => React.ReactNode) => {
    if (heat.isLoading) return <Note>Загружаю котировки акций...</Note>;
    if (heat.error || heat.stocks.length === 0) return <Note>Не удалось загрузить котировки акций</Note>;
    return render();
  };

  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col gap-5 px-3 pt-3 pb-6">
      <section>
        <Title>Котировки</Title>
        <QuotesList main={main} extra={extra} onSelect={(quote) => setPopup({ kind: 'quote', quote })} />
      </section>

      <section>
        <Title>Топ акций по обороту</Title>
        {stocksBlock(() => <TopTurnoverList stocks={heat.stocks} onSelect={openStock} />)}
      </section>

      <section>
        <Title>Карта рынка</Title>
        <MoexHeatmap {...heat} onSelectStock={openStock} />
      </section>

      <section>
        <Title>Лидеры роста и падения</Title>
        {stocksBlock(() => <MoversList stocks={heat.stocks} onSelect={openStock} />)}
      </section>

      <section>
        <Title>Последние новости</Title>
        <NewsBlock />
      </section>

      <QuotePopup data={popup} onClose={() => setPopup(null)} />
    </div>
  );
};
