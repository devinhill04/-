import React from 'react';
import { Sun } from 'lucide-react';
import { useTheme } from '../theme/theme-context';
import { track } from '../lib/analytics';
import { triggerHaptic } from '../../lib/telegram';
import MoonIcon from '../../assets/icons/moon.svg?react';

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
      // Btn/Mode_Switch: padding 8px, gap 10px, radius 8px, bg #F9F9F9
      className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[var(--Content-Light_Gray)] dark:bg-slate-800/80 dark:hover:bg-slate-700/80 transition-all active:scale-95"
      title={`Переключить тему (сейчас: ${theme === 'dark' ? 'тёмная' : 'светлая'})`}
    >
      {theme === 'dark' ? (
        <Sun className="w-6 h-6 text-amber-400" />
      ) : (
        <MoonIcon className="w-6 h-6 text-[var(--Content-Dark)]" />
      )}
    </button>
  );
};
