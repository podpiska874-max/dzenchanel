import React from 'react';
import { 
  Flame, 
  Rocket, 
  TrendingUp, 
  Database, 
  ExternalLink, 
  Eye, 
  Users, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Channel } from '../types';

interface TrendsTabProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onSelectNiche: (niche: string) => void;
}

export const TrendsTab: React.FC<TrendsTabProps> = ({
  channels,
  onSelectChannel,
  onSelectNiche,
}) => {
  const formatNum = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
    return num.toLocaleString('ru-RU');
  };

  // 1. Calculate Niche distribution
  const nicheMap: { [niche: string]: { count: number; views: number; subs: number; avgVi: number } } = {};
  channels.forEach(c => {
    if (!nicheMap[c.niche]) {
      nicheMap[c.niche] = { count: 0, views: 0, subs: 0, avgVi: 0 };
    }
    nicheMap[c.niche].count += 1;
    nicheMap[c.niche].views += c.views_30d;
    nicheMap[c.niche].subs += c.subscribers_count;
    nicheMap[c.niche].avgVi += c.avg_viral_index;
  });

  const nicheStats = Object.entries(nicheMap).map(([niche, data]) => ({
    name: niche,
    count: data.count,
    viewsMillion: +(data.views / 1000000).toFixed(1),
    avgVi: +(data.avgVi / data.count).toFixed(1)
  })).sort((a, b) => b.viewsMillion - a.viewsMillion);

  // 2. Top Viral Anomalies (highest VI)
  const viralAnomalies = [...channels]
    .sort((a, b) => b.avg_viral_index - a.avg_viral_index)
    .slice(0, 5);

  // 3. Fastest Growing Newcomers
  const fastestGrowing = [...channels]
    .sort((a, b) => b.growth_velocity_daily - a.growth_velocity_daily)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Intro banner */}
      <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Тренды Алгоритмов Дзена & Аналитика Ниш</h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Текущий срез алгоритмических рекомендаций: объемы просмотров по тематикам, виральные феномены с аномальным охватом и каналы с рекордной скоростью органического роста.
        </p>
      </div>

      {/* Niche Reach Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Распределение 30-дневного охвата по тематикам (Млн просмотров)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Кликните на столбец или нишу, чтобы отфильтровать каталог.</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nicheStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                formatter={(val: any) => [`${val} млн просмотров`, 'Суммарный охват']}
              />
              <Bar 
                dataKey="viewsMillion" 
                fill="#6366f1" 
                radius={[6, 6, 0, 0]} 
                onClick={(data) => onSelectNiche(data.name)}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: Viral Anomalies vs Fastest Growing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Top Viral Anomalies */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="w-4 h-4 fill-red-400" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Топ-5 Виральных Аномалий (VI)</h3>
              <p className="text-[11px] text-slate-400">Каналы, чьи просмотры в разы превышают число подписчиков.</p>
            </div>
          </div>

          <div className="space-y-3">
            {viralAnomalies.map((channel, idx) => (
              <div 
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/40 hover:bg-slate-950 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-extrabold text-sm text-slate-600 group-hover:text-red-400 w-4">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-red-300 truncate">
                      {channel.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{formatNum(channel.subscribers_count)} подп.</span>
                      <span>•</span>
                      <span>{formatNum(channel.views_30d)} охват</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="badge-viral-fire px-2.5 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-red-400" />
                    <span>VI: {channel.avg_viral_index.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Fastest Growing */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Лидеры Органического Роста</h3>
              <p className="text-[11px] text-slate-400">Каналы с максимальным ежедневным чистым приростом аудитории.</p>
            </div>
          </div>

          <div className="space-y-3">
            {fastestGrowing.map((channel, idx) => (
              <div 
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-950 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-extrabold text-sm text-slate-600 group-hover:text-emerald-400 w-4">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                      {channel.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{channel.niche}</span>
                      <span>•</span>
                      <span>База: {formatNum(channel.subscribers_count)}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs font-extrabold text-emerald-400">
                    +{channel.growth_velocity_daily}/день
                  </div>
                  <div className="text-[10px] text-slate-500">
                    +{channel.subscribers_growth_30d.toLocaleString('ru-RU')} в месяц
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
