import React, { useEffect, useState } from 'react';
import { BondCalculator } from '../bond-calculator/bond-calculator';
import { DividendCalculator } from '../dividend-calculator/dividend-calculator';
import { useCalculator } from '../../shared/lib/calculator-context';
import { AnalyticsService } from '../../shared/analytics/analytics';
import { triggerHaptic } from '../../lib/telegram';

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: '25px' }} className="text-[#161616] dark:text-white">{children}</h2>
);
// Переключатель подвкладок — как в «Календарях»
const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`flex-1 h-9 rounded-[8px] text-[13px] font-medium transition-colors ${active ? 'bg-[#161616] text-white dark:bg-white dark:text-[#161616]' : 'bg-[#F5F5F5] dark:bg-neutral-800 text-[#161616] dark:text-neutral-300'}`}>
    {children}
  </button>
);

type Tab = 'bond' | 'dividends' | 'portfolio';

export const ToolsScreen: React.FC = () => {
  const { request } = useCalculator();
  const [tab, setTab] = useState<Tab>('bond');
  useEffect(() => { if (request) setTab('bond'); }, [request?.n]);
  const select = (t: Tab) => {
    if (t === tab) return;
    triggerHaptic('light');
    AnalyticsService.track('calc_open', { source: `subtab_${t}` });
    setTab(t);
  };
  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col gap-4 px-3 pt-3 pb-6" data-screen="tools">
      <Title>Калькуляторы</Title>
      <div className="flex gap-1">
        <Pill active={tab === 'bond'} onClick={() => select('bond')}>Облигации</Pill>
        <Pill active={tab === 'dividends'} onClick={() => select('dividends')}>Дивиденды</Pill>
        <Pill active={tab === 'portfolio'} onClick={() => select('portfolio')}>Портфель</Pill>
      </div>
      {tab === 'bond' ? (
        <BondCalculator key={request?.n ?? 0} initialCode={request?.code ?? null} source={request?.source ?? 'nav'} />
      ) : tab === 'dividends' ? (
        <DividendCalculator source="subtab" />
      ) : (
        <div className="rounded-[12px] bg-[#F9F9F9] dark:bg-neutral-900 p-4 text-[#161616] dark:text-white" data-calculator="portfolio">
          <p className="text-[17px] font-semibold">Калькулятор дивидендов и купонов портфеля</p>
          <p className="text-[13px] leading-[18px] text-[#7D7C82] dark:text-neutral-400 mt-1">Укажите акции, облигации и количество бумаг. Получите календарь опубликованных выплат на ближайшие 12 месяцев: дивиденды, купоны и отдельно возврат номинала.</p>
          <p className="text-[13px] leading-[18px] mt-3">Скоро здесь. Для расчёта нужны данные о дивидендах, включая рекомендации и прогнозы, — подключим их вместе с API InvestFuture.</p>
        </div>
      )}
    </div>
  );
};
