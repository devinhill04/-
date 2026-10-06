import React, { createContext, useContext } from 'react';
import { MiniApp, MINI_APPS } from '../config/mini-apps';

interface MiniAppsContextValue {
  apps: MiniApp[];
  currentApp: MiniApp;
  selectApp: (id: string) => void;
}

const MiniAppsContext = createContext<MiniAppsContextValue>({
  apps: MINI_APPS,
  currentApp: MINI_APPS[0],
  selectApp: () => {},
});

export const MiniAppsProvider = MiniAppsContext.Provider;
export const useMiniApps = () => useContext(MiniAppsContext);
