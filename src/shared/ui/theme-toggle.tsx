import React from 'react';
import { Sun, Moon } from 'lucide-react';
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

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-xl dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700/60 bg-slate-100 hover:bg-slate-200 border-slate-200/80 text-slate-700 dark:text-slate-200 transition-all active:scale-95 flex items-center justify-center border shadow-xs"
      title={`Переключить тему (сейчас: ${theme === 'dark' ? 'тёмная' : 'светлая'})`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-purple-500" />
      )}
    </button>
  );
};
