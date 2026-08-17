import React, { useState } from 'react';
import {
  Vibrate,
  Sliders,
  Bell,
  SlidersHorizontal,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  XCircle,
  Smartphone
} from 'lucide-react';
import {
  triggerHaptic,
  getTelegramWebApp,
  isTelegramEnvironment
} from '../lib/telegram';

export const TelegramSdkTools: React.FC = () => {
  const [mainBtnVisible, setMainBtnVisible] = useState(false);
  const [mainBtnLoading, setMainBtnLoading] = useState(false);
  const [mainBtnText, setMainBtnText] = useState('Продолжить в Telegram');
  const [backBtnVisible, setBackBtnVisible] = useState(false);
  const [closingConfirm, setClosingConfirm] = useState(false);
  const [cloudKey, setCloudKey] = useState('demo_score');
  const [cloudValue, setCloudValue] = useState('100');
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);

  const tg = getTelegramWebApp();
  const isTg = isTelegramEnvironment();

  const handleHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    triggerHaptic(type);
  };

  const toggleMainButton = () => {
    triggerHaptic('medium');
    if (!mainBtnVisible) {
      if (tg?.MainButton) {
        tg.MainButton.setText(mainBtnText);
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
          triggerHaptic('success');
          alert('Нажата главная кнопка Telegram (MainButton)!');
        });
      }
      setMainBtnVisible(true);
    } else {
      if (tg?.MainButton) {
        tg.MainButton.hide();
      }
      setMainBtnVisible(false);
    }
  };

  const toggleMainBtnLoading = () => {
    triggerHaptic('light');
    const nextState = !mainBtnLoading;
    setMainBtnLoading(nextState);
    if (tg?.MainButton) {
      if (nextState) tg.MainButton.showProgress();
      else tg.MainButton.hideProgress();
    }
  };

  const toggleBackButton = () => {
    triggerHaptic('medium');
    const nextState = !backBtnVisible;
    setBackBtnVisible(nextState);
    if (tg?.BackButton) {
      if (nextState) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          triggerHaptic('light');
          alert('Нажата кнопка Назад (BackButton)');
        });
      } else {
        tg.BackButton.hide();
      }
    }
  };

  const toggleClosingConfirmation = () => {
    triggerHaptic('medium');
    const nextState = !closingConfirm;
    setClosingConfirm(nextState);
    if (tg) {
      if (nextState) tg.enableClosingConfirmation();
      else tg.disableClosingConfirmation();
    }
  };

  const handleExpand = () => {
    triggerHaptic('medium');
    if (tg) {
      tg.expand();
    } else {
      alert('Экран развернут в полный размер');
    }
  };

  const handleShowPopup = () => {
    triggerHaptic('light');
    if (tg?.showPopup) {
      tg.showPopup(
        {
          title: 'Telegram Popup',
          message: 'Это родное всплывающее окно Telegram WebApp!',
          buttons: [
            { id: 'ok', type: 'default', text: 'Понятно' },
            { id: 'cancel', type: 'destructive', text: 'Отмена' }
          ]
        },
        (buttonId: string) => {
          if (buttonId === 'ok') triggerHaptic('success');
          else triggerHaptic('error');
        }
      );
    } else {
      alert('Родное окно Telegram WebApp Popup (симулировано)!');
    }
  };

  const handleSaveCloudStorage = () => {
    triggerHaptic('light');
    if (tg?.CloudStorage) {
      tg.CloudStorage.setItem(cloudKey, cloudValue, (err: any, success: boolean) => {
        if (err || !success) {
          setCloudStatus('Ошибка сохранения в CloudStorage');
          triggerHaptic('error');
        } else {
          setCloudStatus(`Успешно сохранено (${cloudKey}=${cloudValue})`);
          triggerHaptic('success');
        }
      });
    } else {
      localStorage.setItem(`tg_cloud_${cloudKey}`, cloudValue);
      setCloudStatus(`Сохранено локально (${cloudKey}=${cloudValue})`);
      triggerHaptic('success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Haptics & Vibration */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Vibrate className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Тактильный отклик (Haptic Feedback)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Виброотклик при взаимодействии с кнопками, переключателями и покупками в Telegram.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleHaptic('light')}
            className="py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200 border border-slate-600/40 active:scale-95 transition-transform"
          >
            Light
          </button>
          <button
            onClick={() => handleHaptic('medium')}
            className="py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200 border border-slate-600/40 active:scale-95 transition-transform"
          >
            Medium
          </button>
          <button
            onClick={() => handleHaptic('heavy')}
            className="py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200 border border-slate-600/40 active:scale-95 transition-transform"
          >
            Heavy
          </button>
          <button
            onClick={() => handleHaptic('success')}
            className="col-span-1.5 py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Success
          </button>
          <button
            onClick={() => handleHaptic('error')}
            className="col-span-1.5 py-2 px-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <XCircle className="w-3.5 h-3.5" /> Error
          </button>
        </div>
      </div>

      {/* MainButton & Navigation controls */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Управление нативными элементами Telegram</h3>
        </div>

        <div className="space-y-3 text-xs">
          {/* Main Button Control */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-200">MainButton (Главная кнопка внизу)</div>
              <div className="text-[11px] text-slate-400">Закрепленная снизу экрана Telegram</div>
            </div>
            <button
              onClick={toggleMainButton}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                mainBtnVisible
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-sky-600 text-white hover:bg-sky-500'
              }`}
            >
              {mainBtnVisible ? 'Скрыть MainButton' : 'Показать MainButton'}
            </button>
          </div>

          {mainBtnVisible && (
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={mainBtnText}
                  onChange={(e) => {
                    setMainBtnText(e.target.value);
                    if (tg?.MainButton) tg.MainButton.setText(e.target.value);
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                  placeholder="Текст кнопки"
                />
                <button
                  onClick={toggleMainBtnLoading}
                  className="px-2.5 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs hover:bg-slate-600"
                >
                  {mainBtnLoading ? 'Снять загрузку' : 'Индикатор спиннера'}
                </button>
              </div>
            </div>
          )}

          {/* Simulated MainButton rendered in preview when not in Telegram */}
          {mainBtnVisible && !isTg && (
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 border-t border-sky-500/30 z-50 animate-fade-in shadow-2xl">
              <button
                onClick={() => {
                  triggerHaptic('success');
                  alert(`Нажата MainButton со смыслом: "${mainBtnText}"`);
                }}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-98 transition-all"
              >
                {mainBtnLoading && <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                <span>{mainBtnText}</span>
              </button>
            </div>
          )}

          {/* BackButton & Expand */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleBackButton}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                backBtnVisible
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600/40 hover:bg-slate-700'
              }`}
            >
              {backBtnVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{backBtnVisible ? 'Скрыть BackButton' : 'BackButton в шапке'}</span>
            </button>

            <button
              onClick={handleExpand}
              className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/40 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Expand (На весь экран)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShowPopup}
              className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/40 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Показать Popup</span>
            </button>

            <button
              onClick={toggleClosingConfirmation}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                closingConfirm
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600/40 hover:bg-slate-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{closingConfirm ? 'Подтвержд. закрытия [ВКЛ]' : 'Защита от закрытия'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CloudStorage */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Telegram CloudStorage</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Облачное сохранение прогресса пользователя прямо в серверах Telegram.
        </p>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={cloudKey}
            onChange={(e) => setCloudKey(e.target.value)}
            placeholder="Ключ"
            className="w-1/3 bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
          <input
            type="text"
            value={cloudValue}
            onChange={(e) => setCloudValue(e.target.value)}
            placeholder="Значение"
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleSaveCloudStorage}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium shadow-md transition-all active:scale-95"
          >
            Сохранить
          </button>
        </div>

        {cloudStatus && (
          <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {cloudStatus}
          </div>
        )}
      </div>
    </div>
  );
};
