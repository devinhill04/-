import React from 'react';
import { TelegramUser } from '../types';
import { Crown, ShieldCheck, UserCheck, Smartphone } from 'lucide-react';
import { isTelegramEnvironment } from '../lib/telegram';

interface UserCardProps {
  user: TelegramUser;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const isTg = isTelegramEnvironment();

  return (
    <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/60 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
      {/* Subtle top decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center gap-3.5 relative z-10">
        <div className="relative">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-sky-500/30 shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white border-2 border-sky-500/30 shadow-md">
              {user.first_name.charAt(0)}
            </div>
          )}
          {user.is_premium && (
            <div
              className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-full p-1 shadow-md border border-slate-900"
              title="Telegram Premium"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white truncate">
              {user.first_name} {user.last_name || ''}
            </h2>
            {user.is_premium && (
              <span className="bg-amber-500/10 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
                PRO
              </span>
            )}
          </div>

          {user.username && (
            <p className="text-xs text-sky-400 font-medium">@{user.username}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ID: {user.id}
            </span>
            {user.language_code && (
              <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50 uppercase">
                {user.language_code}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          Контекст сессии:
        </span>
        <span
          className={`font-medium px-2 py-0.5 rounded-full text-[11px] ${
            isTg
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {isTg ? 'Telegram Native WebApp' : 'Browser Sandbox / Preview'}
        </span>
      </div>
    </div>
  );
};
