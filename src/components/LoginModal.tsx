import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { UserSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onLogin: (email: string, role: UserSession['role']) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  session,
  onLogin,
  onLogout,
}) => {
  const [email, setEmail] = useState('dzen.creator@yandex.ru');
  const [role, setRole] = useState<UserSession['role']>('✍️ Автор канала');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Yandex ID Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-red-600/30">
            Я
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Yandex ID Авторизация</h3>
            <p className="text-xs text-slate-400">Вход для авторов, рекламодателей и агентств</p>
          </div>
        </div>

        {session.isAuthenticated ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Вы успешно авторизованы</span>
              </div>
              <div className="text-slate-300">
                Email: <span className="font-semibold text-white">{session.email}</span>
              </div>
              <div className="text-slate-300 mt-0.5">
                Роль: <span className="font-semibold text-indigo-300">{session.role}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Яндекс Почта / Логин:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@yandex.ru"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Роль в системе:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
              >
                <option value="✍️ Автор канала">✍️ Автор канала (Дзен-Студия)</option>
                <option value="💼 Маркетолог">💼 Маркетолог (Рекламодатель)</option>
                <option value="🌐 Каталог">🌐 Обычный пользователь (Каталог)</option>
                <option value="🛠️ Администратор">🛠️ Администратор платформы</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              * Безопасная связка с протоколом Яндекс OAuth &amp; Дзен API.
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/30"
            >
              <span>Войти через Яндекс</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
