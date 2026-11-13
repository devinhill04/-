import React, { createContext, useCallback, useContext, useState } from 'react';
import { LazySection, lazyWithRetry } from '../ui/lazy-section';

// Калькулятор облигаций открывается поверх приложения откуда угодно: «Рынок», календарь, прямая ссылка
const Calc = lazyWithRetry(() => import('../../widgets/bond-calculator/bond-calculator').then((m) => ({ default: m.BondCalculator })));
const Ctx = createContext<{ openCalculator: (code?: string | null, source?: string) => void }>({ openCalculator: () => {} });
export const useCalculator = () => useContext(Ctx);

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ code: string | null; source: string } | null>(null);
  const openCalculator = useCallback((code?: string | null, source = 'unknown') => setState({ code: code ?? null, source }), []);
  return (
    <Ctx.Provider value={{ openCalculator }}>
      {children}
      {state && (
        <LazySection>
          <Calc initialCode={state.code} source={state.source} onClose={() => setState(null)} />
        </LazySection>
      )}
    </Ctx.Provider>
  );
};
