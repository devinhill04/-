import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTelegramWebApp, triggerHaptic } from '../../lib/telegram';
import { track } from '../lib/analytics';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isCustomTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isCustomTheme, setIsCustomTheme] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      setIsCustomTheme(true);
      return;
    }

    const tg = getTelegramWebApp();
    if (tg?.colorScheme) {
      setTheme(tg.colorScheme as Theme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    triggerHaptic('light');
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setIsCustomTheme(true);
    localStorage.setItem('app-theme', next);
    track('theme_toggle', { theme: next });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
