import React, { useState } from 'react';
import {
  ShoppingBag,
  Coins,
  Calendar,
  Bot,
  Star,
  Check,
  Plus,
  Zap,
  Sparkles,
  Send,
  User,
  Clock,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { triggerHaptic, getTelegramWebApp } from '../lib/telegram';

interface DemoAppShowcaseProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DemoAppShowcase: React.FC<DemoAppShowcaseProps> = ({
  activeTab,
  setActiveTab
}) => {
  const [starsBalance, setStarsBalance] = useState(250);
  const [cartCount, setCartCount] = useState(0);

  // Clicker State
  const [coins, setCoins] = useState(1240);
  const [energy, setEnergy] = useState(100);
  const [tapMulti, setTapMulti] = useState(1);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'bot'; text: string }>
  >([
    {
      sender: 'bot',
      text: 'Привет! Я готов проанализировать твою демку и превратить её в мощный Telegram Mini App! Выбери нужную функцию ниже или задай вопрос.'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Booking State
  const [bookedTime, setBookedTime] = useState<string | null>(null);

  const tg = getTelegramWebApp();

  const handleTapGame = () => {
    if (energy > 0) {
      triggerHaptic('light');
      setCoins((prev) => prev + tapMulti);
      setEnergy((prev) => Math.max(0, prev - 1));
    } else {
      triggerHaptic('warning');
    }
  };

  const handleBuyProduct = (name: string, priceStars: number) => {
    triggerHaptic('medium');
    if (tg?.openInvoice) {
      alert(`Открывается Telegram Invoice для оплаты ${priceStars} Telegram Stars!`);
    } else {
      if (starsBalance >= priceStars) {
        setStarsBalance((prev) => prev - priceStars);
        setCartCount((prev) => prev + 1);
        triggerHaptic('success');
        alert(`Товар "${name}" оплачен! Потрачено ${priceStars} ⭐️ Telegram Stars.`);
      } else {
        triggerHaptic('error');
        alert('Недостаточно Telegram Stars в вашем балансе!');
      }
    }
  };

  const handleSendAiMsg = () => {
    if (!inputMsg.trim()) return;
    triggerHaptic('light');
    const userText = inputMsg;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    setTimeout(() => {
      triggerHaptic('medium');
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Отличная идея для Telegram Mini App! Функция "${userText}" может быть реализована через Telegram WebApp SDK c HapticFeedback, CloudStorage и Telegram Stars.`
        }
      ]);
    }, 600);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
      {/* Category Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/80 rounded-xl mb-4 border border-slate-800">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('shop');
          }}
          className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'shop'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Магазин</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('game');
          }}
          className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'game'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Кликер</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('booking');
          }}
          className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'booking'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Запись</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('ai_bot');
          }}
          className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'ai_bot'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Бот</span>
        </button>
      </div>

      {/* 1. SHOP & TELEGRAM STARS */}
      {activeTab === 'shop' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Telegram Stars: {starsBalance} ⭐️</span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg">
              <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
              <span>Корзина: {cartCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                id: 1,
                title: 'PRO Подписка',
                price: 50,
                desc: 'Безлимитные функции на 1 месяц',
                badge: 'Хит'
              },
              {
                id: 2,
                title: 'Бустер Скорости x2',
                price: 25,
                desc: 'Удвоение опыта и бонусов',
                badge: 'Бонус'
              },
              {
                id: 3,
                title: 'Эксклюзивный Скин',
                price: 100,
                desc: 'Уникальное оформление профиля',
                badge: 'NFT'
              },
              {
                id: 4,
                title: 'Премиум Доступ',
                price: 150,
                desc: 'Доступ ко всем разделам',
                badge: 'VIP'
              }
            ].map((prod) => (
              <div
                key={prod.id}
                className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {prod.badge}
                    </span>
                    <span className="text-xs font-extrabold text-amber-400 flex items-center gap-0.5">
                      {prod.price} <Star className="w-3 h-3 fill-amber-400" />
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-100">{prod.title}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{prod.desc}</p>
                </div>

                <button
                  onClick={() => handleBuyProduct(prod.title, prod.price)}
                  className="mt-3 w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                >
                  <span>Купить</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. WEB3 CLICKER GAME */}
      {activeTab === 'game' && (
        <div className="text-center space-y-4 py-2">
          <div className="flex justify-around items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Монеты</div>
              <div className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Coins className="w-5 h-5 text-amber-400" />
                {coins.toLocaleString()}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Энергия</div>
              <div className="text-sm font-bold text-sky-400 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 fill-sky-400" />
                {energy} / 100
              </div>
            </div>
          </div>

          <div className="relative py-2 flex justify-center">
            <button
              onClick={handleTapGame}
              className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-4 border-amber-300/40 shadow-2xl shadow-amber-500/30 flex items-center justify-center text-slate-950 active:scale-90 transition-transform cursor-pointer select-none"
            >
              <Coins className="w-16 h-16 stroke-[1.5]" />
            </button>
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => {
                triggerHaptic('medium');
                if (coins >= 50) {
                  setCoins((c) => c - 50);
                  setTapMulti((m) => m + 1);
                  triggerHaptic('success');
                } else {
                  triggerHaptic('error');
                  alert('Недостаточно монет для прокачки клика!');
                }
              }}
              className="flex-1 py-2 bg-slate-900 border border-slate-700/80 rounded-xl font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Прокачка +1 (50 🪙)</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setEnergy(100);
                triggerHaptic('success');
              }}
              className="py-2 px-3 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl font-medium hover:bg-sky-500/30 flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Восполнить</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. BOOKING SERVICE */}
      {activeTab === 'booking' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">Мастер: Дмитрий Ковалев</div>
              <div className="text-[11px] text-slate-400">Консультация по разработке Telegram Mini App</div>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-300">Выберите свободное время:</div>
          <div className="grid grid-cols-3 gap-2">
            {['12:00', '14:30', '16:00', '17:30', '19:00', '20:15'].map((time) => (
              <button
                key={time}
                onClick={() => {
                  triggerHaptic('medium');
                  setBookedTime(time);
                }}
                className={`py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
                  bookedTime === time
                    ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-md'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{time}</span>
              </button>
            ))}
          </div>

          {bookedTime && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 text-emerald-400" />
                Выбрано время: {bookedTime}
              </div>
              <button
                onClick={() => {
                  triggerHaptic('success');
                  alert(`Запись на ${bookedTime} подтверждена! Сообщение отправлено боту.`);
                }}
                className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Записаться в Telegram
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. AI BOT ASSISTANT */}
      {activeTab === 'ai_bot' && (
        <div className="space-y-3">
          <div className="h-44 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiMsg()}
              placeholder="Спросить ассистента про Mini App..."
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSendAiMsg}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium flex items-center justify-center active:scale-95 transition-transform"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
