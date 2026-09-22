import React from 'react';
import { 
  Flame, 
  Rocket, 
  Zap, 
  TrendingUp, 
  Eye, 
  Users, 
  Send, 
  Mail, 
  ExternalLink, 
  Star, 
  GitCompare, 
  BadgeCheck, 
  Briefcase 
} from 'lucide-react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  isComparing: boolean;
  onToggleFavorite: (channel: Channel) => void;
  onToggleCompare: (channel: Channel) => void;
  onSelectChannel: (channel: Channel) => void;
  onStartDeal: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  isComparing,
  onToggleFavorite,
  onToggleCompare,
  onSelectChannel,
  onStartDeal,
}) => {
  // Format numbers nicely
  const formatNum = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
    return num.toLocaleString('ru-RU');
  };

  // Virality Badge rendering matching extension and dashboard
  const renderViralBadge = (vi: number) => {
    if (vi >= 10.0) {
      return (
        <span 
          className="badge-viral-fire px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 cursor-help"
          title="Сверхвиральный аномальный охват: просмотры многократно превышают базу подписчиков"
        >
          <Flame className="w-3 h-3 fill-red-400" />
          <span>VI: {vi.toFixed(1)} (Аномалия)</span>
        </span>
      );
    }
    if (vi >= 2.0) {
      return (
        <span 
          className="badge-viral-fire px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-help"
          title="Высокая виральность: стабильное попадание в рекомендации Дзена"
        >
          <Flame className="w-3 h-3 fill-orange-400" />
          <span>VI: {vi.toFixed(1)}</span>
        </span>
      );
    }
    if (vi >= 1.0) {
      return (
        <span 
          className="badge-viral-rocket px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-help"
          title="Хорошая виральность: охваты сопоставимы с базой подписчиков"
        >
          <Rocket className="w-3 h-3 text-emerald-400" />
          <span>VI: {vi.toFixed(1)}</span>
        </span>
      );
    }
    return (
      <span 
        className="badge-viral-normal px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-help"
        title="Обычный органический охват"
      >
        <Zap className="w-3 h-3 text-slate-400" />
        <span>VI: {vi.toFixed(2)}</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between group shadow-lg hover:shadow-indigo-500/10">
      
      {/* Card Header: Avatar, Name, Niche & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {/* Avatar with fallback */}
            <div className="relative shrink-0">
              {channel.avatar_url && !channel.avatar_url.includes('mc.yandex.ru') ? (
                <img
                  src={channel.avatar_url}
                  alt={channel.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700/60"
                  onError={(e) => {
                    // Fallback to placeholder if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-extrabold text-base border border-indigo-500/30">
                  {channel.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              {channel.is_verified && (
                <div 
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-slate-900"
                  title="Верифицированный автор Яндекс Дзен"
                >
                  <BadgeCheck className="w-3.5 h-3.5 fill-blue-500 text-white" />
                </div>
              )}
            </div>

            {/* Name & Handle */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 
                  onClick={() => onSelectChannel(channel)}
                  className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate cursor-pointer"
                  title={channel.name}
                >
                  {channel.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  @{channel.dzen_id}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/50 truncate">
                  {channel.niche}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Icons: Favorite & Compare */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(channel)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isFavorite 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400'
              }`}
              title={isFavorite ? 'Удалить из медиаплана' : 'Добавить в медиаплан'}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => onToggleCompare(channel)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isComparing 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-400'
              }`}
              title={isComparing ? 'Убрать из сравнения' : 'Сравнить канал'}
            >
              <GitCompare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Virality & Status Header */}
        <div className="flex items-center justify-between gap-2 mb-3.5 py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-400">Индекс Виральности:</span>
          {renderViralBadge(channel.avg_viral_index)}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 mb-3 border-y border-slate-800/60">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>Подписчики</span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {formatNum(channel.subscribers_count)}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium mt-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>+{channel.growth_velocity_daily}/д</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Охват 30д</span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {formatNum(channel.views_30d)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              просмотры
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>ER отклик</span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {channel.er_percent.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              лайки + комм.
            </div>
          </div>
        </div>

        {/* Short description if available */}
        {channel.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {channel.description}
          </p>
        )}
      </div>

      {/* Card Footer: Contacts & Action CTA */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          {/* Contact tags */}
          <div className="flex items-center gap-2">
            {channel.telegram_contact && (
              <a
                href={channel.telegram_contact.startsWith('@') ? `https://t.me/${channel.telegram_contact.replace('@', '')}` : channel.telegram_contact}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                title={`Telegram: ${channel.telegram_contact}`}
              >
                <Send className="w-2.5 h-2.5" />
                <span>{channel.telegram_contact}</span>
              </a>
            )}

            {channel.email_contact && (
              <a
                href={`mailto:${channel.email_contact}`}
                className="px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                title={`Email: ${channel.email_contact}`}
              >
                <Mail className="w-2.5 h-2.5" />
                <span>Email</span>
              </a>
            )}

            {!channel.telegram_contact && !channel.email_contact && (
              <span className="text-[11px] text-slate-500 italic">Контакты через Дзен</span>
            )}
          </div>

          {/* Dzen Direct Link */}
          <a
            href={channel.url}
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            title="Открыть на dzen.ru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Buttons: Detail & Deal */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelectChannel(channel)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-semibold text-center transition-colors"
          >
            Аналитика канала
          </button>
          <button
            onClick={() => onStartDeal(channel)}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Briefcase className="w-3 h-3" />
            <span>Сделка / CRM</span>
          </button>
        </div>
      </div>

    </div>
  );
};
