import React, { ComponentType, Suspense, lazy } from 'react';

// Подгружаемый раздел (вкладки «Рынок», «Календари»): их код скачивается только при открытии,
// поэтому первый экран легче. Два защитных механизма, без которых подгрузка опасна:
// 1) одна автоматическая повторная попытка — на случай сетевой заминки;
// 2) понятное сообщение и кнопка «Обновить» вместо белого экрана. После выкладки новой версии
//    у уже открытого приложения старые файлы разделов пропадают с сервера, и помогает только перезагрузка.

export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() => factory().catch(() => new Promise<{ default: T }>((resolve, reject) => setTimeout(() => factory().then(resolve, reject), 800))));
}

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[lazy-section] раздел не загрузился:', error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-[#161616] dark:text-white text-[15px] font-semibold">Не удалось загрузить раздел</p>
        <p className="text-[#7D7C82] dark:text-neutral-400 text-[13px] mt-1">Возможно, вышла новая версия приложения или пропала связь.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 h-10 px-5 rounded-[10px] text-[14px] font-medium bg-[#161616] text-white dark:bg-white dark:text-[#161616] active:opacity-80"
        >
          Обновить
        </button>
      </div>
    );
  }
}

const Loader = () => <p className="text-[#7D7C82] dark:text-neutral-400 text-sm py-16 text-center">Загружаю…</p>;

export const LazySection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Boundary>
    <Suspense fallback={<Loader />}>{children}</Suspense>
  </Boundary>
);
