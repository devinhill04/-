// Запоминает, где именно пользователь был в приложении (вкладка, тег, открытая
// категория, экосистема), чтобы при повторном открытии мини-аппа (после того как
// Telegram его закрыл при переходе по ссылке на пост) человек не начинал заново,
// а сразу попадал туда же. Хранится только на этом устройстве, никуда не отправляется.

const STORAGE_KEY = 'if_miniapp_last_state_v1';

export interface LastAppState {
  activeTab: 'catalog' | 'solutions';
  selectedTag: string;
  activePainSlug: string | null;
  isEcosystemOpen: boolean;
}

const DEFAULT_STATE: LastAppState = {
  activeTab: 'catalog',
  selectedTag: '#Инвестидея',
  activePainSlug: null,
  isEcosystemOpen: false,
};

export function loadLastAppState(): LastAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveLastAppState(state: LastAppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем, не критично
  }
}
