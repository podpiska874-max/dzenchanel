import React from 'react';
import { 
  GitCompare, 
  Trash2, 
  Trophy, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Rocket, 
  Zap, 
  TrendingUp, 
  Eye, 
  Users,
  Briefcase
} from 'lucide-react';
import { Channel } from '../types';

interface CompareTabProps {
  compareChannels: Channel[];
  onRemoveFromCompare: (channelId: number) => void;
  onClearCompare: () => void;
  onSelectChannel: (channel: Channel) => void;
  onStartDeal: (channel: Channel) => void;
}

export const CompareTab: React.FC<CompareTabProps> = ({
  compareChannels,
  onRemoveFromCompare,
  onClearCompare,
  onSelectChannel,
  onStartDeal,
}) => {
  const formatNum = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
    return num.toLocaleString('ru-RU');
  };

  if (compareChannels.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
        <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Нет каналов для сравнения</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Нажимайте иконку весов / сравнения ⚔️ на карточках любых каналов, чтобы сопоставить их метрики, виральность и темпы роста.
        </p>
      </div>
    );
  }

  // Find max values for visual scaling
  const maxSubs = Math.max(...compareChannels.map(c => c.subscribers_count), 1);
  const maxViews = Math.max(...compareChannels.map(c => c.views_30d), 1);
  const maxEr = Math.max(...compareChannels.map(c => c.er_percent), 0.1);
  const maxVi = Math.max(...compareChannels.map(c => c.avg_viral_index), 0.1);
  const maxGrowth = Math.max(...compareChannels.map(c => c.growth_velocity_daily), 1);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Сравнение каналов ({compareChannels.length})</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Прямое сопоставление аудитории, вовлеченности, коэффициента рекомендаций и коммерческой привлекательности.
          </p>
        </div>

        <button
          onClick={onClearCompare}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/30"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Очистить сравнение</span>
        </button>
      </div>

      {/* Comparison Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(compareChannels.length, 4)} gap-4`}>
        {compareChannels.map(channel => {
          const isSubsWinner = channel.subscribers_count === maxSubs && compareChannels.length > 1;
          const isViewsWinner = channel.views_30d === maxViews && compareChannels.length > 1;
          const isErWinner = channel.er_percent === maxEr && compareChannels.length > 1;
          const isViWinner = channel.avg_viral_index === maxVi && compareChannels.length > 1;
          const isGrowthWinner = channel.growth_velocity_daily === maxGrowth && compareChannels.length > 1;

          return (
            <div 
              key={channel.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl relative"
            >
              {/* Channel Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base shrink-0">
                      {channel.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 
                        onClick={() => onSelectChannel(channel)}
                        className="font-bold text-white hover:text-indigo-300 text-sm cursor-pointer line-clamp-1"
                        title={channel.name}
                      >
                        {channel.name}
                      </h3>
                      <div className="text-xs text-slate-400">@{channel.dzen_id}</div>
                      <div className="text-[10px] text-indigo-400 font-semibold">{channel.niche}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveFromCompare(channel.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                    title="Убрать"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metrics Stack with Comparison Bars */}
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  
                  {/* Subscribers */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-400" />
                        <span>Подписчики:</span>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isSubsWinner ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                        {isSubsWinner && <Trophy className="w-3 h-3 fill-amber-400 text-amber-400" />}
                        <span>{formatNum(channel.subscribers_count)}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isSubsWinner ? 'bg-amber-400' : 'bg-indigo-600'}`}
                        style={{ width: `${(channel.subscribers_count / maxSubs) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 30d Views */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Охват за 30 дней:</span>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isViewsWinner ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                        {isViewsWinner && <Trophy className="w-3 h-3 fill-amber-400 text-amber-400" />}
                        <span>{formatNum(channel.views_30d)}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isViewsWinner ? 'bg-amber-400' : 'bg-cyan-500'}`}
                        style={{ width: `${(channel.views_30d / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Viral Index */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-400" />
                        <span>Индекс Виральности (VI):</span>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isViWinner ? 'text-red-400 font-extrabold' : 'text-white'}`}>
                        {isViWinner && <Trophy className="w-3 h-3 fill-amber-400 text-amber-400" />}
                        <span>{channel.avg_viral_index.toFixed(1)}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isViWinner ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${(channel.avg_viral_index / maxVi) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* ER % */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Вовлеченность ER:</span>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isErWinner ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                        {isErWinner && <Trophy className="w-3 h-3 fill-amber-400 text-amber-400" />}
                        <span>{channel.er_percent.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isErWinner ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${(channel.er_percent / maxEr) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Growth velocity */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Темп роста (в день):</span>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isGrowthWinner ? 'text-emerald-300 font-extrabold' : 'text-white'}`}>
                        {isGrowthWinner && <Trophy className="w-3 h-3 fill-amber-400 text-amber-400" />}
                        <span>+{channel.growth_velocity_daily}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isGrowthWinner ? 'bg-emerald-400' : 'bg-slate-700'}`}
                        style={{ width: `${(channel.growth_velocity_daily / maxGrowth) * 100}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Commercial price estimate */}
                <div className="mt-5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="text-slate-400">Стоимость статьи:</div>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {(channel.rates?.native_price || 60000).toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    CPM: ~{Math.round(((channel.rates?.native_price || 60000) / Math.max(100, (channel.views_30d / 30))) * 1000)} ₽
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => onSelectChannel(channel)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Анализ
                </button>
                <button
                  onClick={() => onStartDeal(channel)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30"
                >
                  <Briefcase className="w-3 h-3" />
                  <span>Сделка</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
