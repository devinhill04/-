import React from 'react';
import { ThemeProvider } from '../shared/theme/theme-context';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
