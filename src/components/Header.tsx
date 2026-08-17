import React from 'react';
import { Send, Sparkles, UploadCloud, Smartphone } from 'lucide-react';
import { isTelegramEnvironment } from '../lib/telegram';

interface HeaderProps {
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpload }) => {
  const isTg = isTelegramEnvironment();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-100 text-base leading-tight">Telegram Mini App</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" />
              {isTg ? 'Запущено в Telegram' : 'Симулятор WebApp'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-medium text-white transition-all shadow-md shadow-blue-600/25"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Загрузить демо</span>
        </button>
      </div>
    </header>
  );
};
