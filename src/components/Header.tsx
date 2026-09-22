import React from 'react';
import { 
  Zap, 
  BarChart3, 
  Briefcase, 
  PenTool, 
  ShieldCheck, 
  Star, 
  GitCompare, 
  CheckCircle2, 
  Puzzle,
  Database
} from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  favoritesCount: number;
  compareCount: number;
  dealsCount: number;
  session: UserSession;
  onLoginClick: () => void;
  onRegisterClick?: () => void;
  onOpenImportModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
  compareCount,
  dealsCount,
  session,
  onLoginClick,
  onRegisterClick,
  onOpenImportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2.5 gap-x-4">
        
        {/* Row 1 Left: Logo & Status */}
        <div className="flex items-center justify-between order-1">
          <div 
            onClick={() => onTabChange('catalog')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  Dzen Analytics
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  v30 Pro
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
                <span>База каналов & Виральность</span>
              </div>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2 ml-4">
            <button
              onClick={() => onTabChange('favorites')}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                currentTab === 'favorites' 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{favoritesCount}</span>
            </button>
            <button
              onClick={() => onTabChange('compare')}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                currentTab === 'compare' 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>{compareCount}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Primary Role Navigation Tabs (Full Width) */}
        <nav 
          id="header-nav-tabs"
          className="order-3 w-full flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none border-t border-slate-800/60 pt-2.5"
        >
          <button
            onClick={() => onTabChange('catalog')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Каталог каналов</span>
          </button>

          <button
            onClick={() => onTabChange('trends')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'trends'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Тренды & Ниши</span>
          </button>

          <button
            onClick={() => onTabChange('marketer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'marketer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Маркетолог</span>
            {dealsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-400/20 text-indigo-300 font-bold">
                {dealsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('author')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'author'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Кабинет Автора</span>
          </button>

          <button
            onClick={() => onTabChange('extension')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'extension'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Puzzle className="w-4 h-4 text-emerald-400" />
            <span>Расширение</span>
          </button>

          {/* Admin tab is prominent or marked */}
          <button
            onClick={() => onTabChange('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : session.role === '🛠️ Администратор'
                ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-900/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Админ-панель</span>
          </button>
        </nav>

        {/* Row 1 Right: Desktop Quick Shortcuts & Auth */}
        <div 
          id="header-quick-actions"
          className="hidden md:flex items-center gap-2 order-2 ml-auto"
        >
          <button
            onClick={() => onTabChange('favorites')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentTab === 'favorites'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
            title="Медиаплан и сохраненные каналы"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Медиаплан</span>
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {favoritesCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('compare')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentTab === 'compare'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
            title="Сравнение каналов бок о бок"
          >
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <span>Сравнение</span>
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300">
              {compareCount}
            </span>
          </button>

          {/* Registration / Account Action */}
          {!session.isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRegisterClick || onLoginClick}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap"
              >
                Регистрация
              </button>
              <button
                onClick={onLoginClick}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all whitespace-nowrap"
              >
                Войти
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-emerald-500/20"
              title={`Авторизован: ${session.email} (${session.role})`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left max-w-[140px] truncate leading-tight">
                <div className="truncate font-bold text-white text-[11px]">{session.name || session.email}</div>
                <div className="text-[10px] text-emerald-400 truncate">{session.role}</div>
              </div>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
