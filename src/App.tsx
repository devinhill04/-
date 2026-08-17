import React from 'react';
import { AppProviders } from './app/providers';
import { App as MainApp } from './app/app';

export default function App() {
  return (
    <AppProviders>
      <MainApp />
    </AppProviders>
  );
}
