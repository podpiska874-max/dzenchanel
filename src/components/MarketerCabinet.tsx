import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Edit3, 
  DollarSign, 
  AlertTriangle, 
  ShieldCheck, 
  Tag, 
  Calendar, 
  Send 
} from 'lucide-react';
import { Deal, Channel, UserSession } from '../types';

interface MarketerCabinetProps {
  deals: Deal[];
  channels: Channel[];
  session?: UserSession;
  onUpdateDeal: (deal: Deal) => void;
  onAddDeal: (deal: Partial<Deal>) => void;
  onSelectChannel: (channel: Channel) => void;
  onOpenRegisterModal?: () => void;
}

const STAGES: Deal['status'][] = [
  'Контакт',
  'Переговоры',
  'Согласовано',
  'Оплачено',
  'Вышло',
  'Завершено'
];

export const MarketerCabinet: React.FC<MarketerCabinetProps> = ({
  deals,
  channels,
  session,
  onUpdateDeal,
  onAddDeal,
  onSelectChannel,
  onOpenRegisterModal,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Все');
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDealChannelId, setNewDealChannelId] = useState<number>(channels[0]?.id || 1);
  const [newDealPrice, setNewDealPrice] = useState<number>(50000);
  const [newDealFormat, setNewDealFormat] = useState<'Пост' | 'Нативная статья' | 'Видеоролик'>('Нативная статья');
  const [newDealNote, setNewDealNote] = useState<string>('');

  const totalBudgetSpent = deals.reduce((acc, d) => acc + d.price, 0);
  const activeDeals = deals.filter(d => d.status !== 'Завершено');

  const filteredDeals = selectedStatusFilter === 'Все'
    ? deals
    : deals.filter(d => d.status === selectedStatusFilter);

  const handleCreateDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = channels.find(c => c.id === newDealChannelId);
    if (!ch) return;

    onAddDeal({
      channel_id: ch.id,
      channel_name: ch.name,
      dzen_id: ch.dzen_id,
      status: 'Контакт',
      price: newDealPrice,
      format: newDealFormat,
      note: newDealNote,
      utm: `utm_source=dzen&utm_medium=${newDealFormat === 'Пост' ? 'post' : 'native'}&utm_campaign=${ch.dzen_id}_campaign`,
      erid: `2Vtzqu${Math.random().toString(36).substring(2, 7)}`,
      deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
    });

    setShowNewModal(false);
    setNewDealNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Кабинет Маркетолога & CRM Интеграций</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Управление сделками с блогерами, контроль маркировки рекламы (ЕРИД), статусы оплаты и публикации.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Новая сделка</span>
          </button>
        </div>

        {/* Marketer Profile / Account Bar */}
        {session && session.isAuthenticated && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{session.name || session.email}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Email подтвержден</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Организация: <strong className="text-slate-300">{session.companyOrBlog || session.registeredUser?.company || 'Рекламное агентство'}</strong>
                  {session.registeredUser?.budgetTier && (
                    <span className="ml-2 text-indigo-400">• Бюджет: {session.registeredUser.budgetTier}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span>Логин: </span>
              <span className="text-white font-mono">{session.email}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Сделок в работе</div>
            <div className="text-2xl font-extrabold text-white mt-1">{activeDeals.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Общий бюджет</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalBudgetSpent.toLocaleString('ru-RU')} ₽</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Маркировка ЕРИД</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">100%</div>
            <div className="text-[10px] text-slate-400">ОРД соблюдено</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Завершено успешно</div>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">
              {deals.filter(d => d.status === 'Завершено').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedStatusFilter('Все')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedStatusFilter === 'Все'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Все ({deals.length})
        </button>
        {STAGES.map(s => {
          const count = deals.filter(d => d.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setSelectedStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Deals Pipeline / List */}
      <div className="space-y-3">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Сделок не найдено</h3>
            <p className="text-xs text-slate-400">
              Создайте сделку через кнопку выше или нажав "Сделка / CRM" на карточке канала в каталоге.
            </p>
          </div>
        ) : (
          filteredDeals.map(deal => {
            const channel = channels.find(c => c.id === deal.channel_id || c.dzen_id === deal.dzen_id);

            return (
              <div 
                key={deal.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Channel & Details */}
                <div className="min-w-0 max-w-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm hover:text-indigo-300 transition-colors">
                      {deal.channel_name}
                    </span>
                    <span className="text-xs text-slate-500">@{deal.dzen_id}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-medium">
                      {deal.format}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-emerald-400">
                      {deal.price.toLocaleString('ru-RU')} ₽
                    </span>
                    {deal.deadline && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>до {deal.deadline}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {deal.note && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">
                      "{deal.note}"
                    </p>
                  )}
                </div>

                {/* ERID & UTM */}
                <div className="text-xs space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-400">ЕРИД:</span>
                    <span className="font-mono text-cyan-300 font-bold">{deal.erid}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                    {deal.utm}
                  </div>
                </div>

                {/* Status Switcher & Edit */}
                <div className="flex items-center gap-3">
                  <select
                    value={deal.status}
                    onChange={(e) => onUpdateDeal({ ...deal, status: e.target.value as any })}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setEditingDeal(deal)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Редактировать сделку"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {channel && (
                    <button
                      onClick={() => onSelectChannel(channel)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Открыть аналитику канала"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create new deal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Создать сделку с каналом</h3>
            
            <form onSubmit={handleCreateDealSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Выберите канал:</label>
                <select
                  value={newDealChannelId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setNewDealChannelId(id);
                    const ch = channels.find(c => c.id === id);
                    if (ch) setNewDealPrice(ch.rates?.native_price || 60000);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.dzen_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Формат интеграции:</label>
                <select
                  value={newDealFormat}
                  onChange={(e) => setNewDealFormat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="Пост">Короткий пост</option>
                  <option value="Нативная статья">Нативная статья</option>
                  <option value="Видеоролик">Видеоролик</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Стоимость (₽):</label>
                <input
                  type="number"
                  step="1000"
                  value={newDealPrice}
                  onChange={(e) => setNewDealPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Заметки и ТЗ:</label>
                <textarea
                  value={newDealNote}
                  onChange={(e) => setNewDealNote(e.target.value)}
                  placeholder="Согласовать тему до 25 числа..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Добавить сделку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit deal */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Редактирование сделки: {editingDeal.channel_name}</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Статус сделки:</label>
                <select
                  value={editingDeal.status}
                  onChange={(e) => setEditingDeal({ ...editingDeal, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Стоимость (₽):</label>
                <input
                  type="number"
                  value={editingDeal.price}
                  onChange={(e) => setEditingDeal({ ...editingDeal, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">ЕРИД (маркировка рекламы):</label>
                <input
                  type="text"
                  value={editingDeal.erid}
                  onChange={(e) => setEditingDeal({ ...editingDeal, erid: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold mb-1 block">Заметки:</label>
                <textarea
                  value={editingDeal.note}
                  onChange={(e) => setEditingDeal({ ...editingDeal, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDeal(editingDeal);
                    setEditingDeal(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
