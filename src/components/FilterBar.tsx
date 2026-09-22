import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  Flame, 
  Send, 
  Mail,
  ArrowUpDown
} from 'lucide-react';
import { FilterState } from '../types';
import { NICHES_LIST } from '../data/seedChannels';

interface FilterBarProps {
  filter: FilterState;
  onChange: (newFilter: FilterState) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  totalFilteredCount: number;
}

const PRESETS = [
  "Все каналы",
  "🎯 Быстрый сдел (TG + ER>1%)",
  "💰 Бюджетный охват (VI > 1.5)",
  "💼 B2B & БизнесКонтакты (Email)",
  "⚡ Взрывной прирост (Рост > 100/день)",
  "🚀 Виральные аномалии (VI > 10)"
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePresetClick = (preset: string) => {
    onChange({
      ...filter,
      preset,
      // If choosing a preset, automatically tweak relevant parameters
      hasTg: preset.includes("TG") ? true : filter.hasTg,
      hasEmail: preset.includes("Email") ? true : filter.hasEmail,
      minVi: preset.includes("VI > 10") ? 10 : preset.includes("VI > 1.5") ? 1.5 : filter.minVi,
      minEr: preset.includes("ER>1%") ? 1.0 : filter.minEr,
    });
  };

  const handleReset = () => {
    onChange({
      search: '',
      niche: 'Все ниши',
      preset: 'Все каналы',
      minSubscribers: 0,
      maxSubscribers: 10000000,
      minViews: 0,
      minEr: 0,
      minVi: 0,
      hasTg: false,
      hasEmail: false,
      sortBy: 'subscribers',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 lg:p-5 mb-6 shadow-xl">
      {/* Presets Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-slate-800/60 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          Пресеты:
        </span>
        {PRESETS.map((p) => {
          const isActive = filter.preset === p;
          return (
            <button
              key={p}
              onClick={() => handlePresetClick(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/70 hover:text-white'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Main Search & Quick Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            placeholder="Поиск по названию, @id или теме..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Niche Dropdown */}
        <div className="md:col-span-3">
          <select
            value={filter.niche}
            onChange={(e) => onChange({ ...filter, niche: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {NICHES_LIST.map((n) => (
              <option key={n} value={n} className="bg-slate-900 text-slate-200">
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="md:col-span-3 flex items-center gap-2">
          <div className="relative flex-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={`${filter.sortBy}-${filter.sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                onChange({
                  ...filter,
                  sortBy: field as FilterState['sortBy'],
                  sortOrder: order as FilterState['sortOrder'],
                });
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="subscribers-desc">Подписчики (по убыванию)</option>
              <option value="subscribers-asc">Подписчики (по возрастанию)</option>
              <option value="viral_index-desc">Виральность VI (Top Viral)</option>
              <option value="views-desc">Охваты за 30 дней</option>
              <option value="er-desc">ER вовлеченность (%)</option>
              <option value="growth-desc">Скорость прироста (в день)</option>
            </select>
          </div>
        </div>

        {/* Action Toggles: Filter Drawer, View Mode */}
        <div className="md:col-span-2 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showAdvanced
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Точные фильтры по метрикам"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Фильтры</span>
          </button>

          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Плитка"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Таблица"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter Expansion */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {/* Min Subscribers */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Мин. подписчиков:</span>
              <span className="text-indigo-400 font-semibold">
                {filter.minSubscribers > 0 ? filter.minSubscribers.toLocaleString('ru-RU') : 'Любое'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000000"
              step="50000"
              value={filter.minSubscribers}
              onChange={(e) => onChange({ ...filter, minSubscribers: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Min 30d Views */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Мин. охват (30 дней):</span>
              <span className="text-indigo-400 font-semibold">
                {filter.minViews > 0 ? `${(filter.minViews / 1000000).toFixed(1)}М` : 'Любой'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20000000"
              step="1000000"
              value={filter.minViews}
              onChange={(e) => onChange({ ...filter, minViews: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Min Viral Index */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                <span>Мин. виральность (VI):</span>
              </span>
              <span className="text-indigo-400 font-semibold">
                {filter.minVi > 0 ? filter.minVi.toFixed(1) : 'Любая'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={filter.minVi}
              onChange={(e) => onChange({ ...filter, minVi: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Contact Checkboxes & Reset */}
          <div className="flex flex-col justify-between gap-2">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.hasTg}
                  onChange={(e) => onChange({ ...filter, hasTg: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <Send className="w-3 h-3 text-sky-400" />
                <span>Telegram</span>
              </label>

              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.hasEmail}
                  onChange={(e) => onChange({ ...filter, hasEmail: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>Email</span>
              </label>
            </div>

            <button
              onClick={handleReset}
              className="self-start text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить все параметры</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter summary counter bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div>
          Найдено каналов: <span className="font-bold text-slate-200">{totalFilteredCount}</span>
          {filter.niche !== 'Все ниши' && (
            <span className="ml-2 text-indigo-400 font-semibold">• {filter.niche}</span>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          Обновление показателей: 1 раз в сутки (Dzen Telemetry / Live Index)
        </div>
      </div>
    </div>
  );
};
