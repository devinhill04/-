import React from 'react';
import { AppProviders } from './app/providers';
import { App as MainApp } from './app/app';
// import { useSmoothScroll } from './shared/lib/use-smooth-scroll'; // ВРЕМЕННО ОТКЛЮЧЕНО — проверяем, не он ли блокирует нативный жест Telegram "смахнуть вниз"

export default function App() {
  // useSmoothScroll();
  return (
    <AppProviders>
      <MainApp />
    </AppProviders>
  );
}
