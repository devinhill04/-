import React from 'react';
import { ThemeProvider } from '../shared/theme/theme-context';
import { PostReaderProvider } from '../shared/lib/post-reader-context';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <PostReaderProvider>{children}</PostReaderProvider>
    </ThemeProvider>
  );
};
