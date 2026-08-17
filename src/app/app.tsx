import React, { useEffect } from 'react';
import { HomePage } from '../pages/home/home-page';
import { initTelegramTheme } from '../shared/theme/init-telegram';

export const App: React.FC = () => {
  useEffect(() => {
    initTelegramTheme();
  }, []);

  return <HomePage />;
};
