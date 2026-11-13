import React, { createContext, useCallback, useContext, useState } from 'react';

// Открыть вкладку «Калькуляторы» (сразу с бумагой, если передан код): из календаря, по прямой ссылке и т. п.
// App переключается на вкладку, экран калькуляторов подхватывает код.
export interface CalcRequest { code: string | null; source: string; n: number }
const Ctx = createContext<{ request: CalcRequest | null; openCalculator: (code?: string | null, source?: string) => void }>({ request: null, openCalculator: () => {} });
export const useCalculator = () => useContext(Ctx);

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<CalcRequest | null>(null);
  const openCalculator = useCallback((code?: string | null, source = 'unknown') => setRequest((r) => ({ code: code ?? null, source, n: (r?.n ?? 0) + 1 })), []);
  return <Ctx.Provider value={{ request, openCalculator }}>{children}</Ctx.Provider>;
};
