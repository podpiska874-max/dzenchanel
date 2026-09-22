import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Server, 
  Plus, 
  Download, 
  Play, 
  CheckCircle2, 
  Terminal, 
  HardDrive,
  Upload,
  Users,
  Briefcase,
  PenTool,
  Mail,
  Send
} from 'lucide-react';
import { Channel, UserSession, RegisteredUser } from '../types';

interface AdminCabinetProps {
  channels: Channel[];
  session: UserSession;
  onAddChannel: (channel: Channel) => void;
  onOpenImportModal?: () => void;
  onLoginAsAdmin: () => void;
}

export const AdminCabinet: React.FC<AdminCabinetProps> = ({
  channels,
  session,
  onAddChannel,
  onOpenImportModal,
  onLoginAsAdmin,
}) => {
  const [dzenId, setDzenId] = useState('');
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('Новости и общество');
  const [subscribers, setSubscribers] = useState(10000);
  const [views, setViews] = useState(150000);
  const [er, setEr] = useState(3.5);
  const [vi, setVi] = useState(1.8);
  const [tg, setTg] = useState('');
  const [email, setEmail] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Registered users state
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch('/api/v1/auth/users')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.users)) {
          setUsersList(data.users);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Parser simulation state
  const [parsing, setParsing] = useState(false);
  const [parseLogs, setParseLogs] = useState<string[]>([
    "Система готова к парсингу. Источник: Dzen RSS / sitemap.xml"
  ]);

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dzenId) return;

    const newChannel: Channel = {
      id: channels.length + 1,
      dzen_id: dzenId,
      name,
      url: `https://dzen.ru/${dzenId}`,
      niche,
      subscribers_count: subscribers,
      views_30d: views,
      er_percent: er,
      avg_viral_index: vi,
      growth_velocity_daily: Math.round(subscribers * 0.001),
      subscribers_growth_30d: Math.round(subscribers * 0.03),
      readability_percent: 120.0,
      telegram_contact: tg ? (tg.startsWith('@') ? tg : `@${tg}`) : null,
      email_contact: email || null,
      is_verified: true,
      rates: {
        post_price: Math.round(subscribers * 0.08),
        native_price: Math.round(subscribers * 0.15),
        video_price: Math.round(subscribers * 0.25),
        tax_status: 'ИП (УСН 6%)'
      },
      top_articles: [
        {
          title: `Главный материал канала "${name}"`,
          views: Math.round(views * 0.4),
          likes: Math.round(views * 0.01),
          comments: Math.round(views * 0.001),
          viral_index: vi
        }
      ]
    };

    onAddChannel(newChannel);
    setAddedSuccess(true);
    setName('');
    setDzenId('');
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  const handleRunParser = () => {
    setParsing(true);
    setParseLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Запуск dzen_overnight_parser_v14.py...`]);

    setTimeout(() => {
      setParseLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Парсинг sitemap.xml: обнаружено 420 новых URL`]);
    }, 1000);

    setTimeout(() => {
      setParseLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Извлечение метрик дочитываний и реакций...`]);
    }, 2200);

    setTimeout(() => {
      setParseLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Синхронизация с SQLite dzen_analytics.db завершена. Добавлено 15 каналов.`]);
      setParsing(false);
    }, 3500);
  };

  const handleExportJSON = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(channels, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `dzen_channels_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
  };

  const isAdmin = session.role === '🛠️ Администратор';

  if (!isAdmin) {
    return (
      <div className="py-16 px-4 max-w-lg mx-auto text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Панель обслуживания и администрирования</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Загрузка дампов базы данных, управление парсерами и обслуживание сайта доступны исключительно в кабинете администратора системы.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div>Текущий профиль: <strong className="text-white">{session.email}</strong></div>
          <div>Текущая роль: <span className="text-indigo-400 font-semibold">{session.role}</span></div>
        </div>

        <button
          onClick={onLoginAsAdmin}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Войти как Администратор</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Панель Администратора & Мониторинг</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Управление парсерами данных, загрузка дампов базы, добавление каналов вручную и статус системных служб.
          </p>
        </div>

        {onOpenImportModal && (
          <button
            onClick={onOpenImportModal}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2.5 transition-all shadow-lg shadow-indigo-600/30 shrink-0 self-start md:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Загрузить базу данных (.json/.csv)</span>
          </button>
        )}
      </div>

      {/* System Health & Fast Ingestion Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Сервер API</span>
          </div>
          <div className="text-emerald-400 font-extrabold text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
            <span>Node.js / Express Online</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Порт 3000 • 0.0.0.0</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Хранилище</span>
          </div>
          <div className="text-white font-extrabold text-sm">{channels.length} каналов</div>
          <div className="text-[10px] text-slate-500 mt-1">dzen_analytics.db</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Кэш и Память</span>
          </div>
          <div className="text-indigo-300 font-extrabold text-sm">34.2 МБ</div>
          <div className="text-[10px] text-slate-500 mt-1">Vite + SQLite cache</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-semibold">Резервная копия</div>
          <button
            onClick={handleExportJSON}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать JSON</span>
          </button>
        </div>
      </div>

      {/* Two columns: Manual Add vs Parser Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Manual Add Channel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Добавить канал вручную</h3>
          </div>

          <form onSubmit={handleCreateChannel} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Название канала:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Пример: Технологии Будущего"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Dzen ID (хэндл):</label>
                <input
                  type="text"
                  value={dzenId}
                  onChange={(e) => setDzenId(e.target.value)}
                  placeholder="tech_future"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Ниша:</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Новости и общество">Новости и общество</option>
                  <option value="Кулинария и еда">Кулинария и еда</option>
                  <option value="IT и гаджеты">IT и гаджеты</option>
                  <option value="Финансы, бизнес и недвижимость">Финансы и бизнес</option>
                  <option value="Наука и образование">Наука и образование</option>
                  <option value="Авто">Авто</option>
                  <option value="Путешествия">Путешествия</option>
                  <option value="Психология">Психология</option>
                  <option value="Красота и стиль">Красота и стиль</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Подписчики:</label>
                <input
                  type="number"
                  value={subscribers}
                  onChange={(e) => setSubscribers(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Охват (30д):</label>
                <input
                  type="number"
                  value={views}
                  onChange={(e) => setViews(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">ER (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={er}
                  onChange={(e) => setEr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Виральность (VI):</label>
                <input
                  type="number"
                  step="0.1"
                  value={vi}
                  onChange={(e) => setVi(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Telegram:</label>
                <input
                  type="text"
                  value={tg}
                  onChange={(e) => setTg(e.target.value)}
                  placeholder="@contact_tg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@channel.ru"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {addedSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Канал добавлен!</span>
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/30"
              >
                Сохранить канал
              </button>
            </div>
          </form>
        </div>

        {/* Right: Background Parser Controller & Terminal */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Парсер данных (dzen_overnight_parser)</h3>
              </div>

              <button
                onClick={handleRunParser}
                disabled={parsing}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/30"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{parsing ? 'Парсинг...' : 'Запустить парсер'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Периодический сборщик статистики по каналам и статьям из Dzen RSS и карты сайта.
            </p>

            {/* Terminal Window */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] text-emerald-400 h-64 overflow-y-auto space-y-1.5 shadow-inner">
              {parseLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-slate-500 mr-2">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {parsing && (
                <div className="text-slate-400 animate-pulse">
                  <span className="text-slate-500 mr-2">&gt;</span>
                  <span>[Обработка пакетов данных...]</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Контейнер: linux x86_64 • node v22</span>
            <span>Статус: Норма</span>
          </div>
        </div>

      </div>

      {/* 3. Registered Users (Authors & Marketers with Email Confirmation Status) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Зарегистрированные пользователи (Авторы и Маркетологи)</h3>
              <p className="text-[11px] text-slate-400">
                Мониторинг учетных записей, подтверждения email и привязанных каналов/агентств.
              </p>
            </div>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto"
          >
            {loadingUsers ? 'Обновление...' : 'Обновить список'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
                <th className="pb-2.5 pl-2">Пользователь / ФИО</th>
                <th className="pb-2.5">Роль</th>
                <th className="pb-2.5">Email & Статус</th>
                <th className="pb-2.5">Telegram</th>
                <th className="pb-2.5">Профиль (Канал / Компания)</th>
                <th className="pb-2.5 pr-2">Дата рег.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                    Пользователей пока нет
                  </td>
                </tr>
              ) : (
                usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-2 font-bold text-white">
                      {usr.name}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        usr.role === '💼 Маркетолог' 
                          ? 'bg-indigo-500/20 text-indigo-300' 
                          : usr.role === '✍️ Автор канала'
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {usr.role === '💼 Маркетолог' && <Briefcase className="w-3 h-3" />}
                        {usr.role === '✍️ Автор канала' && <PenTool className="w-3 h-3" />}
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300">{usr.email}</span>
                        {usr.emailVerified ? (
                          <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400" title="Email подтвержден">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold">Не подтвержден</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">
                      {usr.telegram ? (
                        <span className="text-indigo-400 font-mono">{usr.telegram}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-300">
                      {usr.role === '💼 Маркетолог' && (
                        <span>{usr.company || 'Агентство'} {usr.budgetTier && `(${usr.budgetTier})`}</span>
                      )}
                      {usr.role === '✍️ Автор канала' && (
                        <span>{usr.channelName || `@${usr.dzenId}` || 'Канал'} {usr.taxStatus && `• ${usr.taxStatus}`}</span>
                      )}
                      {usr.role === '🛠️ Администратор' && (
                        <span className="text-slate-500">Superuser</span>
                      )}
                    </td>
                    <td className="py-3 pr-2 text-slate-500 text-[11px]">
                      {new Date(usr.registeredAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
