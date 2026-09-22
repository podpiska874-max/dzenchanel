import React, { useState } from 'react';
import { 
  Puzzle, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Flame, 
  Code, 
  Zap, 
  Download, 
  Layers 
} from 'lucide-react';
import { Channel } from '../types';

interface ExtensionTabProps {
  onIngestSuccess: (newOrUpdatedChannel: Channel) => void;
}

export const ExtensionTab: React.FC<ExtensionTabProps> = ({ onIngestSuccess }) => {
  // Simulator input state
  const [channelId, setChannelId] = useState('science_daily_pulse');
  const [channelName, setChannelName] = useState('Пульс Науки: Открытия');
  const [subscribers, setSubscribers] = useState(45000);
  const [views, setViews] = useState(380000);
  const [articleTitle, setArticleTitle] = useState('Ученые создали материал, способный восстанавливаться за секунды');
  const [viralIndex, setViralIndex] = useState(8.4);
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);

  const handleSimulateIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    try {
      const payload = {
        channel_id: channelId,
        channel_name: channelName,
        article_url: `https://dzen.ru/a/${channelId}_sample_article`,
        article_title: articleTitle,
        subscribers_count: subscribers,
        views_count: views,
        likes_count: Math.round(views * 0.03),
        comments_count: Math.round(views * 0.004),
        er_percent: 3.4,
        viral_index: viralIndex,
        parser_source: "chrome_extension_manifest_v3"
      };

      const res = await fetch('/api/v1/ingest/extension-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.channel) {
        setResponseMsg(`Успешно получено! Канал "${data.channel.name}" обновлен в базе аналитики.`);
        onIngestSuccess(data.channel);
      } else {
        setResponseMsg(`Ошибка: ${data.error || 'Не удалось отправить телеметрию'}`);
      }
    } catch (err: any) {
      setResponseMsg(`Ошибка отправки: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Браузерное расширение Dzen Analytics</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Расширение внедряет плашки виральности (VI) прямо в интерфейс dzen.ru и отправляет собранную статистику на бэкенд платформы по API.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Manifest V3 Ready</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Extension Specs & Architecture */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Файлы расширения в проекте</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="font-mono text-indigo-400 font-bold">/extension/manifest.json</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Декларация Manifest V3 с разрешениями для <code className="text-slate-300">dzen.ru/*</code> и background service worker.
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="font-mono text-cyan-400 font-bold">/extension/content.js</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Парсит DOM-дерево статьи (число дочитываний, лайки, дату, имя автора) и внедряет бейджи:
                <span className="inline-flex gap-1 ml-2">
                  <span className="badge-viral-fire px-1.5 py-0.2 rounded text-[9px] font-bold">🔥 Fire</span>
                  <span className="badge-viral-rocket px-1.5 py-0.2 rounded text-[9px] font-bold">🚀 Rocket</span>
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="font-mono text-emerald-400 font-bold">POST /api/v1/ingest/extension-data</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Эндпоинт Express сервера, принимающий телеметрию расширения для обогащения единой базы аналитики.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white">Как установить в Google Chrome:</div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-400">
              <li>Откройте <code className="text-indigo-300">chrome://extensions/</code></li>
              <li>Включите "Режим разработчика" (Developer mode)</li>
              <li>Нажмите "Загрузить распакованное расширение" и выберите папку <code className="text-indigo-300">/extension</code></li>
            </ol>
          </div>
        </div>

        {/* Right: Live Telemetry Ingest Simulator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Интерактивный симулятор телеметрии</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Отправьте тестовые данные парсера в эндпоинт сервера прямо сейчас, чтобы проверить интеграцию.
            </p>

            <form onSubmit={handleSimulateIngest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Dzen ID канала:</label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Название канала:</label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Заголовок статьи:</label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Подписчики:</label>
                  <input
                    type="number"
                    value={subscribers}
                    onChange={(e) => setSubscribers(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Просмотры:</label>
                  <input
                    type="number"
                    value={views}
                    onChange={(e) => setViews(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Виральность (VI):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={viralIndex}
                    onChange={(e) => setViralIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Отправка...' : 'Отправить в API бэкенда'}</span>
              </button>
            </form>
          </div>

          {responseMsg && (
            <div className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold ${
              responseMsg.includes('Успешно')
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {responseMsg}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
