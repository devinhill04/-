import React from 'react';
import { FIGMA_PAIN_CARDS, FigmaPainCard } from '../../shared/config/figma-data';
import { triggerHaptic } from '../../lib/telegram';

interface FigmaSolutionsGridProps {
  onSelectPain: (pain: FigmaPainCard) => void;
}

export const FigmaSolutionsGrid: React.FC<FigmaSolutionsGridProps> = ({ onSelectPain }) => {
  const painLearning = FIGMA_PAIN_CARDS.find(p => p.slug === 'learning')!;
  const painPersonalFinance = FIGMA_PAIN_CARDS.find(p => p.slug === 'personal_finance')!;
  const painBankLifehacks = FIGMA_PAIN_CARDS.find(p => p.slug === 'bank_lifehacks')!;
  const painTransfers = FIGMA_PAIN_CARDS.find(p => p.slug === 'transfers')!;
  const painDeductions = FIGMA_PAIN_CARDS.find(p => p.slug === 'deductions')!;
  const painTaxes = FIGMA_PAIN_CARDS.find(p => p.slug === 'taxes')!;
  const painPension = FIGMA_PAIN_CARDS.find(p => p.slug === 'pension')!;
  const painMortgage = FIGMA_PAIN_CARDS.find(p => p.slug === 'mortgage')!;

  return (
    <div className="w-full px-3 py-3 flex flex-col gap-6 select-none">
      {/* Title + Subtitle section (w:390, h:104, pad: 12) */}
      <div className="flex flex-col gap-2">
        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: '24px',
            lineHeight: '30px',
          }}
          className="text-[#161616] dark:text-white"
        >
          {'Навигатор по вашим\nзадачам'}
        </h2>
        <p
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '18px',
          }}
          className="text-[#161616]/80 dark:text-neutral-300"
        >
          {'Выберите проблему — получите\nготовую подборку постов'}
        </p>
      </div>

      {/* Pain_Cards Grid (832px exact height layout) */}
      <div className="flex flex-col gap-3">
        
        {/* Row 1: 2 Small Cards (Обучение + Личные финансы) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Обучение */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectPain(painLearning);
            }}
            style={{
              height: '160px',
              borderRadius: '12px',
              background: painLearning.bgColor,
            }}
            className="relative overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
          >
            <div className="z-10">
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
                className="text-[#161616]"
              >
                {painLearning.title}
              </h3>
            </div>

            <div className="z-10">
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '15px',
                }}
                className="text-[#161616] max-w-[130px]"
              >
                {painLearning.body}
              </p>
            </div>

            {/* Illustration Background Image */}
            <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
              <img
                src={painLearning.image}
                alt={painLearning.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Card 2: Личные финансы */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectPain(painPersonalFinance);
            }}
            style={{
              height: '160px',
              borderRadius: '12px',
              background: painPersonalFinance.bgColor,
            }}
            className="relative overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
          >
            <div className="z-10">
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
                className="text-[#161616]"
              >
                {'Личные\nфинансы'}
              </h3>
            </div>

            <div className="z-10">
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '15px',
                }}
                className="text-[#161616] max-w-[130px]"
              >
                {painPersonalFinance.body}
              </p>
            </div>

            <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
              <img
                src={painPersonalFinance.image}
                alt={painPersonalFinance.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Row 2: 1 Horizontal Card (Банковские лайфхаки) */}
        <div
          onClick={() => {
            triggerHaptic('light');
            onSelectPain(painBankLifehacks);
          }}
          style={{
            height: '160px',
            borderRadius: '12px',
            background: painBankLifehacks.bgColor,
          }}
          className="relative overflow-hidden p-4 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
        >
          <div className="z-10">
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '20px',
              }}
              className="text-[#161616]"
            >
              {painBankLifehacks.title}
            </h3>
          </div>

          <div className="z-10 max-w-[220px]">
            <p
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '18px',
              }}
              className="text-[#161616]"
            >
              {painBankLifehacks.body}
            </p>
          </div>

          <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
            <img
              src={painBankLifehacks.image}
              alt={painBankLifehacks.title}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Row 3: 2 Columns Layout (Col 1 has 2 small cards, Col 2 has 1 vertical card 328px) */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          
          {/* Left Column: Переводы + Вычеты (2x 160px cards) */}
          <div className="flex flex-col gap-3">
            {/* Card 4: Переводы */}
            <div
              onClick={() => {
                triggerHaptic('light');
                onSelectPain(painTransfers);
              }}
              style={{
                height: '160px',
                borderRadius: '12px',
                background: painTransfers.bgColor,
              }}
              className="relative overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
            >
              <div className="z-10">
                <h3
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '20px',
                  }}
                  className="text-[#161616]"
                >
                  {painTransfers.title}
                </h3>
              </div>

              <div className="z-10">
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '15px',
                  }}
                  className="text-[#161616] max-w-[130px]"
                >
                  {painTransfers.body}
                </p>
              </div>

              <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
                <img
                  src={painTransfers.image}
                  alt={painTransfers.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 5: Вычеты */}
            <div
              onClick={() => {
                triggerHaptic('light');
                onSelectPain(painDeductions);
              }}
              style={{
                height: '160px',
                borderRadius: '12px',
                background: painDeductions.bgColor,
              }}
              className="relative overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
            >
              <div className="z-10">
                <h3
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '20px',
                  }}
                  className="text-[#161616]"
                >
                  {painDeductions.title}
                </h3>
              </div>

              <div className="z-10">
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '15px',
                  }}
                  className="text-[#161616] max-w-[130px]"
                >
                  {painDeductions.body}
                </p>
              </div>

              <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
                <img
                  src={painDeductions.image}
                  alt={painDeductions.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Налоги (1 Vertical Card 328px) */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectPain(painTaxes);
            }}
            style={{
              height: '332px',
              borderRadius: '12px',
              background: painTaxes.bgColor,
            }}
            className="relative overflow-hidden p-4 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
          >
            <div className="z-10">
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
                className="text-[#161616]"
              >
                {painTaxes.title}
              </h3>
            </div>

            <div className="z-10">
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '15px',
                }}
                className="text-[#161616] max-w-[130px]"
              >
                {painTaxes.body}
              </p>
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
              <img
                src={painTaxes.image}
                alt={painTaxes.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

        </div>

        {/* Row 4: 2 Small Cards (Пенсия + Ипотека) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 7: Пенсия и пассивный доход */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectPain(painPension);
            }}
            style={{
              height: '160px',
              borderRadius: '12px',
              background: painPension.bgColor,
            }}
            className="relative overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
          >
            <div className="z-10">
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
                className="text-[#161616]"
              >
                {'Пенсия\nи пассивный\nдоход'}
              </h3>
            </div>

            <div className="z-10">
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '15px',
                }}
                className="text-[#161616] max-w-[130px]"
              >
                {painPension.body}
              </p>
            </div>

            <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
              <img
                src={painPension.image}
                alt={painPension.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Card 8: Ипотека, кредиты, и долги */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onSelectPain(painMortgage);
            }}
            style={{
              height: '160px',
              borderRadius: '12px',
              background: painMortgage.bgColor,
            }}
            className="relative overflow-hidden p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
          >
            <div className="z-10">
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '20px',
                }}
                className="text-[#161616]"
              >
                {'Ипотека,\nкредиты, и долги'}
              </h3>
            </div>

            <div className="z-10">
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '15px',
                }}
                className="text-[#161616] max-w-[130px]"
              >
                {painMortgage.body}
              </p>
            </div>

            <div className="absolute right-0 top-0 w-[160px] h-[160px] pointer-events-none flex items-center justify-center">
              <img
                src={painMortgage.image}
                alt={painMortgage.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
