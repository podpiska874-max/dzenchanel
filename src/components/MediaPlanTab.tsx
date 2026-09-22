import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  Download, 
  Briefcase, 
  TrendingUp, 
  Eye, 
  Users, 
  Check, 
  ExternalLink,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { Channel } from '../types';

interface MediaPlanTabProps {
  favoriteChannels: Channel[];
  onRemoveFavorite: (channelId: number) => void;
  onClearFavorites: () => void;
  onStartDeal: (channel: Channel, format?: 'Пост' | 'Нативная статья' | 'Видеоролик', price?: number) => void;
  onSelectChannel: (channel: Channel) => void;
}

export const MediaPlanTab: React.FC<MediaPlanTabProps> = ({
  favoriteChannels,
  onRemoveFavorite,
  onClearFavorites,
  onStartDeal,
  onSelectChannel,
}) => {
  // Store customized format & price per channel
  const [dealConfig, setDealConfig] = useState<{ [id: number]: { format: 'Пост' | 'Нативная статья' | 'Видеоролик'; price: number } }>({});

  const formatNum = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
    return num.toLocaleString('ru-RU');
  };

  // Helper to get selected price
  const getChannelPrice = (c: Channel) => {
    if (dealConfig[c.id]?.price !== undefined) {
      return dealConfig[c.id].price;
    }
    const fmt = dealConfig[c.id]?.format || 'Нативная статья';
    if (fmt === 'Пост') return c.rates?.post_price || 35000;
    if (fmt === 'Видеоролик') return c.rates?.video_price || 90000;
    return c.rates?.native_price || 60000;
  };

  const getChannelFormat = (c: Channel): 'Пост' | 'Нативная статья' | 'Видеоролик' => {
    return dealConfig[c.id]?.format || 'Нативная статья';
  };

  const handleFormatChange = (c: Channel, format: 'Пост' | 'Нативная статья' | 'Видеоролик') => {
    let autoPrice = c.rates?.native_price || 60000;
    if (format === 'Пост') autoPrice = c.rates?.post_price || 35000;
    if (format === 'Видеоролик') autoPrice = c.rates?.video_price || 90000;

    setDealConfig(prev => ({
      ...prev,
      [c.id]: {
        format,
        price: autoPrice
      }
    }));
  };

  // Aggregated campaign calculations
  const totalSubscribers = favoriteChannels.reduce((sum, c) => sum + c.subscribers_count, 0);
  const totalViews = favoriteChannels.reduce((sum, c) => sum + c.views_30d, 0);
  const totalEstReach = favoriteChannels.reduce((sum, c) => sum + Math.round((c.views_30d / 30) * Math.max(0.8, c.avg_viral_index * 0.4)), 0);
  const totalBudget = favoriteChannels.reduce((sum, c) => sum + getChannelPrice(c), 0);
  const blendedCpm = totalEstReach > 0 ? Math.round((totalBudget / totalEstReach) * 1000) : 0;

  // Export to CSV
  const handleExportCSV = () => {
    if (favoriteChannels.length === 0) return;
    const headers = ["Канал", "Dzen ID", "Ниша", "Подписчики", "Формат", "Бюджет (руб)", "Ожидаемый охват", "Контакты TG", "Email"];
    const rows = favoriteChannels.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.dzen_id,
      `"${c.niche}"`,
      c.subscribers_count,
      getChannelFormat(c),
      getChannelPrice(c),
      Math.round((c.views_30d / 30) * Math.max(0.8, c.avg_viral_index * 0.4)),
      c.telegram_contact || "",
      c.email_contact || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dzen_mediaplan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Aggregate Metrics */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h2 className="text-xl font-bold text-white">Интерактивный Медиаплан</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Сводная смета рекламной кампании, расчет совокупного охвата и пакетный запуск в CRM.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={favoriteChannels.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Выгрузить в CSV</span>
            </button>

            {favoriteChannels.length > 0 && (
              <button
                onClick={onClearFavorites}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить</span>
              </button>
            )}
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Каналов в плане</div>
            <div className="text-2xl font-extrabold text-white mt-1">{favoriteChannels.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Суммарные подписчики</div>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">{formatNum(totalSubscribers)}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Прогноз охвата</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">~{formatNum(totalEstReach)}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Итого бюджет</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalBudget.toLocaleString('ru-RU')} ₽</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Blended CPM</div>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">{blendedCpm.toLocaleString('ru-RU')} ₽</div>
          </div>
        </div>
      </div>

      {/* Channels List */}
      {favoriteChannels.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Медиаплан пуст</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Нажимайте на звездочку ⭐ на карточках каналов в каталоге, чтобы добавлять их в медиаплан и рассчитывать бюджет кампании.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {favoriteChannels.map(channel => {
            const currentFmt = getChannelFormat(channel);
            const currentPrice = getChannelPrice(channel);
            const estReach = Math.round((channel.views_30d / 30) * Math.max(0.8, channel.avg_viral_index * 0.4));

            return (
              <div 
                key={channel.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                {/* Channel summary */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {channel.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div 
                      onClick={() => onSelectChannel(channel)}
                      className="font-bold text-white hover:text-indigo-300 transition-colors truncate cursor-pointer text-sm"
                    >
                      {channel.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>@{channel.dzen_id}</span>
                      <span>•</span>
                      <span>{formatNum(channel.subscribers_count)} подп.</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">VI: {channel.avg_viral_index.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Integration Format selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 shrink-0">Формат:</span>
                  <select
                    value={currentFmt}
                    onChange={(e) => handleFormatChange(channel, e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Пост">Пост</option>
                    <option value="Нативная статья">Нативная статья</option>
                    <option value="Видеоролик">Видеоролик</option>
                  </select>
                </div>

                {/* Price input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 shrink-0">Цена:</span>
                  <input
                    type="number"
                    step="1000"
                    value={currentPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDealConfig(prev => ({
                        ...prev,
                        [channel.id]: {
                          format: currentFmt,
                          price: val
                        }
                      }));
                    }}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-400">₽</span>
                </div>

                {/* Est Reach */}
                <div className="text-xs">
                  <div className="text-slate-400">Прогноз охвата:</div>
                  <div className="font-bold text-cyan-400">~{estReach.toLocaleString('ru-RU')}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartDeal(channel, currentFmt, currentPrice)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>В сделку</span>
                  </button>

                  <button
                    onClick={() => onRemoveFavorite(channel.id)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                    title="Удалить из медиаплана"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
