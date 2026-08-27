import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/theme-context';
import { track } from '../lib/analytics';
import { triggerHaptic } from '../../lib/telegram';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    triggerHaptic('light');
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    track('theme_toggle', { currentTheme: theme, nextTheme });
    toggleTheme();
  };

  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      onClick={handleToggle}
      aria-label="Переключить тему"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
      }}
      className="bg-[#F9F9F9] dark:bg-white/10 text-[#161616] dark:text-white flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-95 transition-all select-none border border-black/5 dark:border-white/10"
      title={`Переключить тему (сейчас: ${isDark ? 'тёмная' : 'светлая'})`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-white stroke-[1.5]" />
      ) : (
        <Moon className="w-5 h-5 text-[#161616] stroke-[1.5]" />
      )}
    </button>
  );
};

