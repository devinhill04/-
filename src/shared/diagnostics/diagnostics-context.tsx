import React, { createContext, useCallback, useContext, useState } from 'react';
import { LazySection, lazyWithRetry } from '../ui/lazy-section';

// Панель диагностики подгружается только когда её открыли: в обычном запуске она ничего не весит
const Panel = lazyWithRetry(() => import('../../widgets/diagnostics/diagnostics-panel').then((m) => ({ default: m.DiagnosticsPanel })));

const DiagnosticsContext = createContext<{ open: () => void }>({ open: () => {} });
export const useDiagnostics = () => useContext(DiagnosticsContext);

export const DiagnosticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  return (
    <DiagnosticsContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <LazySection>
          <Panel onClose={() => setIsOpen(false)} />
        </LazySection>
      )}
    </DiagnosticsContext.Provider>
  );
};
