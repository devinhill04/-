import React from 'react';
import { ThemeProvider } from '../shared/theme/theme-context';
import { PostReaderProvider } from '../shared/lib/post-reader-context';
import { DiagnosticsProvider } from '../shared/diagnostics/diagnostics-context';
import { CalculatorProvider } from '../shared/lib/calculator-context';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <DiagnosticsProvider>
        <PostReaderProvider>
          <CalculatorProvider>{children}</CalculatorProvider>
        </PostReaderProvider>
      </DiagnosticsProvider>
    </ThemeProvider>
  );
};
