import React from 'react';
import { 
  Users, 
  Eye, 
  Zap, 
  Send, 
  Mail, 
  ExternalLink, 
  Star, 
  GitCompare, 
  BadgeCheck, 
  Flame, 
  Rocket, 
  Briefcase 
} from 'lucide-react';
import { Channel } from '../types';

interface ChannelTableProps {
  channels: Channel[];
  favorites: number[];
  compareList: number[];
  onToggleFavorite: (channel: Channel) => void;
  onToggleCompare: (channel: Channel) => void;
  onSelectChannel: (channel: Channel) => void;
  onStartDeal: (channel: Channel) => void;
}

export const ChannelTable: React.FC<ChannelTableProps> = ({
  channels,
  favorites,
  compareList,
  onToggleFavorite,
  onToggleCompare,
  onSelectChannel,
  onStartDeal,
}) => {
  const formatNum = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
    return num.toLocaleString('ru-RU');
  };

  const renderViralBadge = (vi: number) => {
    if (vi >= 10.0) {
      return (
        <span className="badge-viral-fire px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
          <Flame className="w-2.5 h-2.5 fill-red-400" />
          <span>{vi.toFixed(1)}</span>
        </span>
      );
    }
    if (vi >= 2.0) {
      return (
        <span className="badge-viral-fire px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
          <Flame className="w-2.5 h-2.5 fill-orange-400" />
          <span>{vi.toFixed(1)}</span>
        </span>
      );
    }
    if (vi >= 1.0) {
      return (
        <span className="badge-viral-rocket px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
          <Rocket className="w-2.5 h-2.5 text-emerald-400" />
          <span>{vi.toFixed(1)}</span>
        </span>
      );
    }
    return (
      <span className="badge-viral-normal px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
        <Zap className="w-2.5 h-2.5 text-slate-400" />
        <span>{vi.toFixed(2)}</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Канал</th>
              <th className="py-3.5 px-3">Ниша</th>
              <th className="py-3.5 px-3">Подписчики</th>
              <th className="py-3.5 px-3">Охват (30д)</th>
              <th className="py-3.5 px-3">ER</th>
              <th className="py-3.5 px-3">Виральность (VI)</th>
              <th className="py-3.5 px-3">Контакты</th>
              <th className="py-3.5 px-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {channels.map((channel) => {
              const isFav = favorites.includes(channel.id);
              const isComp = compareList.includes(channel.id);

              return (
                <tr 
                  key={channel.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Channel name & avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {channel.avatar_url && !channel.avatar_url.includes('mc.yandex.ru') ? (
                          <img
                            src={channel.avatar_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover border border-slate-700/60"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                            {channel.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        {channel.is_verified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <BadgeCheck className="w-2.5 h-2.5 fill-blue-500 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 max-w-[200px]">
                        <div 
                          onClick={() => onSelectChannel(channel)}
                          className="font-bold text-white hover:text-indigo-300 transition-colors truncate cursor-pointer"
                        >
                          {channel.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          @{channel.dzen_id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Niche */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/50 text-[11px] font-medium whitespace-nowrap">
                      {channel.niche}
                    </span>
                  </td>

                  {/* Subscribers */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">
                      {formatNum(channel.subscribers_count)}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      +{channel.growth_velocity_daily}/день
                    </div>
                  </td>

                  {/* Views 30d */}
                  <td className="py-3 px-3 font-semibold text-white">
                    {formatNum(channel.views_30d)}
                  </td>

                  {/* ER % */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-amber-300">
                      {channel.er_percent.toFixed(1)}%
                    </span>
                  </td>

                  {/* Viral Index */}
                  <td className="py-3 px-3">
                    {renderViralBadge(channel.avg_viral_index)}
                  </td>

                  {/* Contacts */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {channel.telegram_contact && (
                        <a
                          href={channel.telegram_contact.startsWith('@') ? `https://t.me/${channel.telegram_contact.replace('@', '')}` : channel.telegram_contact}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                          title={`Telegram: ${channel.telegram_contact}`}
                        >
                          <Send className="w-3 h-3" />
                        </a>
                      )}
                      {channel.email_contact && (
                        <a
                          href={`mailto:${channel.email_contact}`}
                          className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          title={`Email: ${channel.email_contact}`}
                        >
                          <Mail className="w-3 h-3" />
                        </a>
                      )}
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Открыть на dzen.ru"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onToggleFavorite(channel)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isFav 
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400'
                        }`}
                        title="В медиаплан"
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => onToggleCompare(channel)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isComp 
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-400'
                        }`}
                        title="Сравнить"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectChannel(channel)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        Анализ
                      </button>

                      <button
                        onClick={() => onStartDeal(channel)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>Сделка</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
