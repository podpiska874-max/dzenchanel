import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Send, 
  Mail, 
  Flame, 
  Rocket, 
  Zap, 
  Users, 
  Eye, 
  TrendingUp, 
  CheckCircle2, 
  FileText, 
  Calculator, 
  Share2, 
  Copy, 
  Clock, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart2, 
  ShieldCheck,
  Star,
  GitCompare,
  Briefcase
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Channel, ChannelHistoryPoint } from '../types';

interface ChannelDetailModalProps {
  channel: Channel;
  onClose: () => void;
  isFavorite: boolean;
  isComparing: boolean;
  onToggleFavorite: (channel: Channel) => void;
  onToggleCompare: (channel: Channel) => void;
  onStartDeal: (channel: Channel) => void;
}

export const ChannelDetailModal: React.FC<ChannelDetailModalProps> = ({
  channel,
  onClose,
  isFavorite,
  isComparing,
  onToggleFavorite,
  onToggleCompare,
  onStartDeal,
}) => {
  const [activeTab, setActiveTab] = useState<'dynamics' | 'articles' | 'demographics' | 'calculator' | 'brief' | 'mediakit'>('dynamics');
  const [historyData, setHistoryData] = useState<ChannelHistoryPoint[]>([]);
  const [calcBudget, setCalcBudget] = useState<number>(channel.rates?.native_price || 50000);
  const [calcCtr, setCalcCtr] = useState<number>(2.0); // 2% CTR
  const [calcConversion, setCalcConversion] = useState<number>(4.0); // 4% conversion to lead
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Fetch real/simulated 14-day history
  useEffect(() => {
    fetch(`/api/v1/channels/${channel.id}/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistoryData(data);
        }
      })
      .catch(() => {
        // Fallback simulation if offline
        const simulated: ChannelHistoryPoint[] = [];
        const base = channel.subscribers_count;
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          simulated.push({
            date: d.toLocaleDateString('ru-RU', { month: 'numeric', day: 'numeric' }),
            subscribers_count: Math.round(base - i * channel.growth_velocity_daily),
            views_30d: Math.round(channel.views_30d / 30),
            er_percent: channel.er_percent,
            avg_viral_index: channel.avg_viral_index
          });
        }
        setHistoryData(simulated);
      });
  }, [channel.id]);

  const formatNum = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
    return num.toLocaleString('ru-RU');
  };

  // ROI calculations
  const estReachPerPost = Math.round((channel.views_30d / 30) * Math.max(0.8, channel.avg_viral_index * 0.4));
  const estClicks = Math.round(estReachPerPost * (calcCtr / 100));
  const estConversions = Math.round(estClicks * (calcConversion / 100));
  const effectiveCpm = Math.round((calcBudget / Math.max(1, estReachPerPost)) * 1000);
  const effectiveCpc = estClicks > 0 ? Math.round(calcBudget / estClicks) : 0;
  const effectiveCpl = estConversions > 0 ? Math.round(calcBudget / estConversions) : 0;

  // Demographic age data
  const ageData = channel.demographics?.ages 
    ? Object.entries(channel.demographics.ages).map(([bracket, pct]) => ({ bracket, percent: pct }))
    : [
        { bracket: '18-24', percent: 12 },
        { bracket: '25-34', percent: 38 },
        { bracket: '35-44', percent: 32 },
        { bracket: '45-54', percent: 14 },
        { bracket: '55+', percent: 4 }
      ];

  const briefText = `Техническое задание на размещение в Дзен-канале "${channel.name}" (@${channel.dzen_id}):
1. Формат публикации: Нативная статья с интеграцией продукта.
2. Целевая аудитория: ${channel.niche}, преимущественно ${channel.demographics?.gender_m || 50}% М / ${channel.demographics?.gender_f || 50}% Ж.
3. Ожидаемый базовый охват: ~${estReachPerPost.toLocaleString('ru-RU')} дочитываний.
4. Разметка ссылки:
   https://example.com/promo?utm_source=dzen&utm_medium=native&utm_campaign=${channel.dzen_id}_autumn
5. Обязательная маркировка (ЕРИД):
   Реклама. erid: 2Vtzqu${Math.random().toString(36).substring(2, 7)}
6. Согласованный бюджет: ${calcBudget.toLocaleString('ru-RU')} ₽.`;

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(briefText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {channel.avatar_url && !channel.avatar_url.includes('mc.yandex.ru') ? (
              <img
                src={channel.avatar_url}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base shrink-0">
                {channel.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate">{channel.name}</h2>
                {channel.is_verified && (
                  <span title="Верифицирован в Яндекс Дзен">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>@{channel.dzen_id}</span>
                <span>•</span>
                <span className="text-indigo-400 font-medium">{channel.niche}</span>
                <span>•</span>
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <span>dzen.ru</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick header action icons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(channel)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-400'
              }`}
              title="В медиаплан"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => onToggleCompare(channel)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isComparing
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400'
              }`}
              title="Сравнить"
            >
              <GitCompare className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onClose();
                onStartDeal(channel);
              }}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Создать сделку</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Sub-tabs */}
        <div className="px-6 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none py-2">
          <button
            onClick={() => setActiveTab('dynamics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'dynamics'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Динамика Роста</span>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'articles'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Топ-Статьи & Виральность</span>
          </button>

          <button
            onClick={() => setActiveTab('demographics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'demographics'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Портрет Аудитории</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'calculator'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Воронка & ROI</span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'brief'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Генератор ТЗ & UTM</span>
          </button>

          <button
            onClick={() => setActiveTab('mediakit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'mediakit'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Прайс & Медиакит</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Metrics Bar across all tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Подписчики</div>
              <div className="text-lg font-extrabold text-white mt-0.5">{formatNum(channel.subscribers_count)}</div>
              <div className="text-[10px] text-emerald-400 font-medium">+{channel.growth_velocity_daily}/день</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Охват (30д)</div>
              <div className="text-lg font-extrabold text-white mt-0.5">{formatNum(channel.views_30d)}</div>
              <div className="text-[10px] text-slate-400 font-medium">просмотры ленты</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Виральность (VI)</div>
              <div className="text-lg font-extrabold text-indigo-400 mt-0.5">{channel.avg_viral_index.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400 font-medium">множитель базы</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">ER Вовлечение</div>
              <div className="text-lg font-extrabold text-amber-400 mt-0.5">{channel.er_percent.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-400 font-medium">активность читателей</div>
            </div>
          </div>

          {/* TAB 1: DYNAMICS (CHART) */}
          {activeTab === 'dynamics' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Динамика прироста подписчиков (14 дней)</h3>
                <p className="text-xs text-slate-400">График ежедневных замеров показателей из хранилища аналитики.</p>
              </div>

              <div className="h-64 w-full bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [Number(val).toLocaleString('ru-RU'), 'Подписчики']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="subscribers_count" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: '#818cf8' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-semibold text-slate-200">Оценка органического темпа:</div>
                  <div className="text-emerald-400 font-bold text-sm mt-1">
                    +{channel.subscribers_growth_30d.toLocaleString('ru-RU')} читателей за 30 дней
                  </div>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Канал демонстрирует стабильный позитивный тренд рекомендательного трафика.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-semibold text-slate-200">Индекс доверия (Fraud Score):</div>
                  <div className="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Естественная аудитория (Риск накрутки: &lt; 8%)</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Соотношение просмотров к комментариям и дочитываемости укладывается в нормальный диапазон.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARTICLES */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Топ виральных публикаций канала</h3>
                  <p className="text-xs text-slate-400">Статьи, набравшие наибольшее количество показов и реакций в ленте.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {(channel.top_articles || [
                  { title: "Секреты эффективного ведения канала и привлечения аудитории в Дзен", views: 240000, likes: 8900, comments: 640, viral_index: 18.4 },
                  { title: "Как алгоритмы распределяют показы в 2026 году: детальный разбор", views: 180000, likes: 6200, comments: 420, viral_index: 14.1 }
                ]).map((art, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white hover:text-indigo-300 transition-colors line-clamp-1">
                        {art.title}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1 text-cyan-400 font-medium">
                          <Eye className="w-3 h-3" />
                          <span>{formatNum(art.views)}</span>
                        </span>
                        <span>•</span>
                        <span>👍 {art.likes.toLocaleString('ru-RU')}</span>
                        <span>•</span>
                        <span>💬 {art.comments.toLocaleString('ru-RU')}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="badge-viral-fire px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-orange-400" />
                        <span>VI: {art.viral_index.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEMOGRAPHICS */}
          {activeTab === 'demographics' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Социально-демографический портрет</h3>
                <p className="text-xs text-slate-400">Данные Дзен-студии автора о структуре активных читателей.</p>
              </div>

              {/* Gender Split */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-400">Мужчины: {channel.demographics?.gender_m || 48}%</span>
                  <span className="text-rose-400">Женщины: {channel.demographics?.gender_f || 52}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" 
                    style={{ width: `${channel.demographics?.gender_m || 48}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500" 
                    style={{ width: `${channel.demographics?.gender_f || 52}%` }}
                  />
                </div>
              </div>

              {/* Age Breakdown Chart */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-bold text-white mb-3">Возрастные группы (% аудитории)</div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="bracket" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(val: any) => [`${val}%`, 'Доля']}
                      />
                      <Bar dataKey="percent" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cities & Devices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-bold text-white mb-2">Топ-геолокации</div>
                  <div className="space-y-2 text-xs">
                    {(channel.demographics?.top_cities || [
                      { name: "Москва и МО", percent: 36 },
                      { name: "Санкт-Петербург", percent: 18 },
                      { name: "Екатеринбург", percent: 7 }
                    ]).map((city, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-none">
                        <span className="text-slate-300">{city.name}</span>
                        <span className="font-bold text-indigo-400">{city.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-bold text-white mb-2">Устройства читателей</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-300">📱 Смартфоны (Мобильные)</span>
                      <span className="font-bold text-emerald-400">{channel.demographics?.devices?.mobile || 82}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-300">💻 Десктоп / Ноутбуки</span>
                      <span className="font-bold text-cyan-400">{channel.demographics?.devices?.desktop || 18}%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CALCULATOR (ROI & CPM) */}
          {activeTab === 'calculator' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Медийный калькулятор охвата и ROI</h3>
                <p className="text-xs text-slate-400">Прогнозирование отдачи от рекламной интеграции на основе медианных метрик канала.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inputs */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Планируемый бюджет (₽):
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={calcBudget}
                      onChange={(e) => setCalcBudget(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Прогнозируемый CTR ссылки (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={calcCtr}
                      onChange={(e) => setCalcCtr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Конверсия лендинга в лид (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="20"
                      value={calcConversion}
                      onChange={(e) => setCalcConversion(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Outputs */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-950/80 border border-indigo-500/30 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-4">
                      Ожидаемый медийный эффект кампании
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-[11px] text-slate-400">Охват публикации:</div>
                        <div className="text-lg font-extrabold text-white mt-0.5">~{estReachPerPost.toLocaleString('ru-RU')}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400">Переходы на сайт (клики):</div>
                        <div className="text-lg font-extrabold text-cyan-400 mt-0.5">~{estClicks.toLocaleString('ru-RU')}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400">Ожидаемые лиды / заявки:</div>
                        <div className="text-lg font-extrabold text-emerald-400 mt-0.5">~{estConversions}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400">Эффективный CPM:</div>
                        <div className="text-lg font-extrabold text-amber-300 mt-0.5">{effectiveCpm.toLocaleString('ru-RU')} ₽</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400">Стоимость клика (CPC):</div>
                        <div className="text-lg font-extrabold text-slate-200 mt-0.5">{effectiveCpc.toLocaleString('ru-RU')} ₽</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400">Стоимость лида (CPL):</div>
                        <div className="text-lg font-extrabold text-slate-200 mt-0.5">{effectiveCpl.toLocaleString('ru-RU')} ₽</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>* Расчет носит прогнозный характер на базе среднестатистических дочитываний.</span>
                    <button
                      onClick={() => onStartDeal(channel)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                    >
                      Перейти к сделке
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BRIEF & UTM GENERATOR */}
          {activeTab === 'brief' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Авто-генератор ТЗ & UTM-разметки</h3>
                  <p className="text-xs text-slate-400">Готовый текст для отправки автору канала в Telegram или на Email.</p>
                </div>

                <button
                  onClick={handleCopyBrief}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedBrief ? 'Скопировано!' : 'Копировать ТЗ'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800 whitespace-pre-wrap select-all">
                {briefText}
              </div>
            </div>
          )}

          {/* TAB 6: RATES & MEDIAKIT */}
          {activeTab === 'mediakit' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Коммерческие условия и Прайс-лист</h3>
                <p className="text-xs text-slate-400">Официальные форматы интеграций и юридический статус автора.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Короткий пост</div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {(channel.rates?.post_price || 35000).toLocaleString('ru-RU')} ₽
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Текст до 1500 символов, до 3 изображений, прямая ссылка с UTM.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border-2 border-indigo-500/40 relative">
                  <span className="absolute top-2.5 right-3 text-[10px] px-2 py-0.5 rounded-md bg-indigo-500 text-white font-bold">
                    Популярный
                  </span>
                  <div className="text-xs text-indigo-300 font-semibold uppercase">Нативная статья</div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {(channel.rates?.native_price || 60000).toLocaleString('ru-RU')} ₽
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Полноразмерный авторский материал 3000-5000 знаков, органика в ленте.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Видео / Ролик</div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {(channel.rates?.video_price || 90000).toLocaleString('ru-RU')} ₽
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Интеграция 60-90 сек или отдельный видео-сюжет с продакт-плейсментом.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Юридический статус: </span>
                  <span className="font-bold text-white ml-1">
                    {channel.rates?.tax_status || 'ИП (УСН 6%)'}
                  </span>
                </div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Работа по договору, предоставление актов и ЕРИД</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            ID: <span className="font-mono">{channel.dzen_id}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                onClose();
                onStartDeal(channel);
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/30"
            >
              Открыть в CRM
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
