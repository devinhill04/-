import React from 'react';
import { Check } from 'lucide-react';
import { MiniApp } from '../../shared/config/mini-apps';

interface Props {
  apps: MiniApp[];
  currentId: string;
  onSelect: (app: MiniApp) => void;
  onClose: () => void;
}

// Небольшая карточка под логотипом: иконка + две строки текста, список листается вниз
export const AppSwitcherMenu: React.FC<Props> = ({ apps, currentId, onSelect, onClose }) => (
  <>
    {/* Невидимая подложка: тап мимо меню закрывает его */}
    <div className="fixed inset-0 z-0" onClick={onClose} aria-hidden />

    <div
      role="menu"
      className="absolute left-3 top-full mt-2 z-10 w-[300px] max-w-[calc(100vw-24px)] max-h-[280px] overflow-y-auto overscroll-contain rounded-[16px] bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 shadow-xl p-1.5"
    >
      {apps.map((app) => {
        const isCurrent = app.id === currentId;
        return (
          <button
            key={app.id}
            role="menuitem"
            onClick={() => onSelect(app)}
            className={`w-full flex items-center gap-3 p-2 rounded-[12px] text-left active:opacity-70 transition-colors ${
              isCurrent ? 'bg-[#F5F5F5] dark:bg-neutral-800' : ''
            }`}
          >
            <img src={app.iconSrc} alt="" className="w-10 h-10 rounded-[10px] shrink-0 object-cover bg-[#F5F5F5]" />
            <div className="flex-1 min-w-0">
              <p className="text-[#161616] dark:text-white text-[14px] font-semibold leading-tight truncate">{app.title}</p>
              <p className="text-[#7D7C82] dark:text-neutral-400 text-[12px] leading-tight mt-0.5 truncate">{app.subtitle}</p>
            </div>
            {isCurrent && <Check className="w-4 h-4 shrink-0 text-[var(--accent)]" />}
          </button>
        );
      })}
    </div>
  </>
);
