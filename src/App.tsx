import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ChannelCard } from './components/ChannelCard';
import { ChannelTable } from './components/ChannelTable';
import { ChannelAnalyticsPage } from './components/ChannelAnalyticsPage';
import { MediaPlanTab } from './components/MediaPlanTab';
import { CompareTab } from './components/CompareTab';
import { TrendsTab } from './components/TrendsTab';
import { MarketerCabinet } from './components/MarketerCabinet';
import { AuthorCabinet } from './components/AuthorCabinet';
import { ExtensionTab } from './components/ExtensionTab';
import { AdminCabinet } from './components/AdminCabinet';
import { AuthModal } from './components/AuthModal';
import { ImportDatabaseModal } from './components/ImportDatabaseModal';
import { INITIAL_CHANNELS, INITIAL_DEALS } from './data/seedChannels';
import { Channel, Deal, FilterState, UserSession } from './types';
import { BarChart3, Star, GitCompare, Briefcase, Puzzle, Database, Upload } from 'lucide-react';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [currentTab, setCurrentTab] = useState<string>('catalog');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites & Compare
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('dzen_favorites');
      return saved ? JSON.parse(saved) : [1, 4, 6];
    } catch {
      return [1, 4, 6];
    }
  });

  const [compareList, setCompareList] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('dzen_compare');
      return saved ? JSON.parse(saved) : [1, 2];
    } catch {
      return [1, 2];
    }
  });

  // Dedicated Channel Page (opens as a full page rather than popup)
  const [viewingChannel, setViewingChannel] = useState<Channel | null>(null);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'register' | 'login'; role?: UserSession['role'] }>({
    isOpen: false,
    mode: 'register',
    role: '💼 Маркетолог'
  });

  // User session
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('dzen_user_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      email: 'alex.marketer@media.ru',
      name: 'Алексей Маркетолог',
      companyOrBlog: 'Digital Agency Pro',
      role: '💼 Маркетолог',
      isAuthenticated: true,
      authorChannelId: 1,
      verificationCode: 'DZEN-749201'
    };
  });

  // Save session to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dzen_user_session', JSON.stringify(session));
    } catch {}
  }, [session]);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
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

  // Fetch initial channels & deals from API
  useEffect(() => {
    fetch('/api/v1/channels')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
        }
      })
      .catch(() => {});

    fetch('/api/v1/crm/deals')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDeals(data);
        }
      })
      .catch(() => {});
  }, []);

  // Save favorites & compare to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dzen_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('dzen_compare', JSON.stringify(compareList));
    } catch {}
  }, [compareList]);

  // Handlers for favorites & compare
  const handleToggleFavorite = (channel: Channel) => {
    setFavorites(prev => 
      prev.includes(channel.id) ? prev.filter(id => id !== channel.id) : [...prev, channel.id]
    );
  };

  const handleToggleCompare = (channel: Channel) => {
    setCompareList(prev => {
      if (prev.includes(channel.id)) {
        return prev.filter(id => id !== channel.id);
      }
      if (prev.length >= 4) {
        alert("Для сравнения можно выбрать максимум 4 канала одновременно.");
        return prev;
      }
      return [...prev, channel.id];
    });
  };

  // Filter channels in client
  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesHandle = c.dzen_id.toLowerCase().includes(query);
        const matchesDesc = (c.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesHandle && !matchesDesc) return false;
      }

      if (filter.niche !== 'Все ниши' && c.niche !== filter.niche) {
        return false;
      }

      if (c.subscribers_count < filter.minSubscribers || c.subscribers_count > filter.maxSubscribers) return false;
      if (c.views_30d < filter.minViews) return false;
      if (c.er_percent < filter.minEr) return false;
      if (c.avg_viral_index < filter.minVi) return false;
      if (filter.hasTg && !c.telegram_contact) return false;
      if (filter.hasEmail && !c.email_contact) return false;

      // Presets
      if (filter.preset === "🎯 Быстрый сдел (TG + ER>1%)") {
        if (!c.telegram_contact || c.er_percent < 1.0) return false;
      } else if (filter.preset === "💰 Бюджетный охват (VI > 1.5)") {
        if (c.avg_viral_index < 1.5) return false;
      } else if (filter.preset === "💼 B2B & БизнесКонтакты (Email)") {
        if (!c.email_contact) return false;
      } else if (filter.preset === "⚡ Взрывной прирост (Рост > 100/день)") {
        if (c.growth_velocity_daily < 100) return false;
      } else if (filter.preset === "🚀 Виральные аномалии (VI > 10)") {
        if (c.avg_viral_index < 10.0) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (filter.sortBy === 'subscribers') { valA = a.subscribers_count; valB = b.subscribers_count; }
      else if (filter.sortBy === 'views') { valA = a.views_30d; valB = b.views_30d; }
      else if (filter.sortBy === 'er') { valA = a.er_percent; valB = b.er_percent; }
      else if (filter.sortBy === 'viral_index') { valA = a.avg_viral_index; valB = b.avg_viral_index; }
      else if (filter.sortBy === 'growth') { valA = a.growth_velocity_daily; valB = b.growth_velocity_daily; }

      return filter.sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [channels, filter]);

  // Deal starting logic
  const handleStartDeal = (channel: Channel, format?: 'Пост' | 'Нативная статья' | 'Видеоролик', price?: number) => {
    const existing = deals.find(d => d.channel_id === channel.id);
    if (!existing) {
      const newDeal: Deal = {
        id: `deal-${Date.now()}`,
        channel_id: channel.id,
        channel_name: channel.name,
        dzen_id: channel.dzen_id,
        status: 'Переговоры',
        price: price || channel.rates?.native_price || 60000,
        format: format || 'Нативная статья',
        note: `Сделка создана из каталога для канала ${channel.name}`,
        utm: `utm_source=dzen&utm_medium=native&utm_campaign=${channel.dzen_id}_deal`,
        erid: `2Vtzqu${Math.random().toString(36).substring(2, 7)}`,
        deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        created_at: new Date().toISOString().split('T')[0]
      };
      setDeals(prev => [newDeal, ...prev]);

      // sync with backend
      fetch('/api/v1/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal)
      }).catch(() => {});
    }

    setCurrentTab('marketer');
  };

  const handleUpdateDeal = (updatedDeal: Deal) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
    fetch('/api/v1/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDeal)
    }).catch(() => {});
  };

  const handleAddDeal = (dealData: Partial<Deal>) => {
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      channel_id: dealData.channel_id || 1,
      channel_name: dealData.channel_name || 'Канал',
      dzen_id: dealData.dzen_id || '',
      status: dealData.status || 'Контакт',
      price: dealData.price || 50000,
      format: dealData.format || 'Нативная статья',
      note: dealData.note || '',
      utm: dealData.utm || '',
      erid: dealData.erid || `2Vtzqu${Math.random().toString(36).substring(2, 7)}`,
      deadline: dealData.deadline || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0]
    };
    setDeals(prev => [newDeal, ...prev]);

    fetch('/api/v1/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal)
    }).catch(() => {});
  };

  const handleSelectChannel = (channel: Channel) => {
    setViewingChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateChannelRates = (channelId: number, rates: Channel['rates'], demographics: Channel['demographics']) => {
    setChannels(prev => prev.map(c => {
      if (c.id === channelId) {
        return { ...c, rates, demographics };
      }
      return c;
    }));

    fetch('/api/v1/author/rates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, rates, demographics })
    }).catch(() => {});
  };

  const handleVerifyChannel = (channelId: number, login: string, method?: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id === channelId) {
        return { ...c, is_verified: true };
      }
      return c;
    }));

    setSession(prev => ({
      ...prev,
      authorChannelId: channelId,
      isChannelClaimed: true,
      verificationMethod: (method as any) || 'yandex_oauth'
    }));

    setToastMessage(`Канал успешно подтвержден и привязан к вашему кабинету автора!`);
    setTimeout(() => setToastMessage(null), 4000);

    fetch('/api/v1/author/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channelId, yandex_login: login, method })
    }).catch(() => {});
  };

  const handleLinkChannelToSession = (channelId: number) => {
    setSession(prev => ({
      ...prev,
      authorChannelId: channelId
    }));
  };

  const handleAddChannel = (channel: Channel) => {
    setChannels(prev => [channel, ...prev]);
  };

  const handleImportSuccess = (newChannels: Channel[], count: number, mode: 'replace' | 'append') => {
    setChannels(newChannels);
    setToastMessage(`База данных успешно обновлена! ${mode === 'replace' ? 'Загружено' : 'Добавлено'}: ${count} каналов. Всего в каталоге: ${newChannels.length}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleIngestSuccess = (newOrUpdated: Channel) => {
    setChannels(prev => {
      const idx = prev.findIndex(c => c.dzen_id === newOrUpdated.dzen_id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newOrUpdated;
        return copy;
      }
      return [newOrUpdated, ...prev];
    });
  };

  const favoriteChannels = useMemo(() => {
    return channels.filter(c => favorites.includes(c.id));
  }, [channels, favorites]);

  const compareChannels = useMemo(() => {
    return channels.filter(c => compareList.includes(c.id));
  }, [channels, compareList]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setViewingChannel(null); // Return to list if viewing a channel
          setCurrentTab(tab);
        }}
        favoritesCount={favorites.length}
        compareCount={compareList.length}
        dealsCount={deals.filter(d => d.status !== 'Завершено').length}
        session={session}
        onLoginClick={() => setAuthModalState({ isOpen: true, mode: 'login' })}
        onRegisterClick={() => setAuthModalState({ isOpen: true, mode: 'register', role: '💼 Маркетолог' })}
        onOpenImportModal={() => setShowImportModal(true)}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300 max-w-md">
          <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 border border-indigo-400/30 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-white shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* REQUIREMENT 4: DEDICATED CHANNEL ANALYTICS FULL PAGE (NOT A POPUP) */}
        {viewingChannel ? (
          <ChannelAnalyticsPage
            channel={viewingChannel}
            onBack={() => setViewingChannel(null)}
            isFavorite={favorites.includes(viewingChannel.id)}
            isComparing={compareList.includes(viewingChannel.id)}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onStartDeal={handleStartDeal}
            onOpenAuthorClaim={() => {
              setViewingChannel(null);
              setCurrentTab('author');
            }}
          />
        ) : (
          <>
            {/* TAB: CATALOG */}
            {currentTab === 'catalog' && (
              <div>
                <FilterBar
                  filter={filter}
                  onChange={setFilter}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalFilteredCount={filteredChannels.length}
                />

                {filteredChannels.length === 0 ? (
                  <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-4">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-base font-bold text-white mb-1">
                      {channels.length === 0 ? 'Каталог каналов пуст' : 'Ничего не найдено'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {channels.length === 0 
                        ? 'Загрузите свой файл базы (.json, .csv) или восстановите демонстрационные каналы.'
                        : 'Попробуйте смягчить параметры фильтрации или выберите другой пресет.'}
                    </p>
                    {channels.length === 0 && (
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Загрузить базу данных</span>
                      </button>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredChannels.map(channel => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        isFavorite={favorites.includes(channel.id)}
                        isComparing={compareList.includes(channel.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onToggleCompare={handleToggleCompare}
                        onSelectChannel={handleSelectChannel}
                        onStartDeal={handleStartDeal}
                      />
                    ))}
                  </div>
                ) : (
                  <ChannelTable
                    channels={filteredChannels}
                    favorites={favorites}
                    compareList={compareList}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleCompare={handleToggleCompare}
                    onSelectChannel={handleSelectChannel}
                    onStartDeal={handleStartDeal}
                  />
                )}
              </div>
            )}

            {/* TAB: TRENDS & NICHES */}
            {currentTab === 'trends' && (
              <TrendsTab
                channels={channels}
                onSelectChannel={handleSelectChannel}
                onSelectNiche={(niche) => {
                  setFilter(prev => ({ ...prev, niche }));
                  setCurrentTab('catalog');
                }}
              />
            )}

            {/* TAB: MARKETER CABINET & CRM */}
            {currentTab === 'marketer' && (
              <MarketerCabinet
                deals={deals}
                channels={channels}
                session={session}
                onUpdateDeal={handleUpdateDeal}
                onAddDeal={handleAddDeal}
                onSelectChannel={handleSelectChannel}
                onOpenRegisterModal={() => setAuthModalState({ isOpen: true, mode: 'register', role: '💼 Маркетолог' })}
              />
            )}

            {/* TAB: AUTHOR CABINET */}
            {currentTab === 'author' && (
              <AuthorCabinet
                channels={channels}
                session={session}
                onUpdateChannelRates={handleUpdateChannelRates}
                onVerifyChannel={handleVerifyChannel}
                onLinkChannelToSession={handleLinkChannelToSession}
              />
            )}

            {/* TAB: CHROME EXTENSION & TELEMETRY */}
            {currentTab === 'extension' && (
              <ExtensionTab onIngestSuccess={handleIngestSuccess} />
            )}

            {/* TAB: ADMIN & MONITORING */}
            {currentTab === 'admin' && (
              <AdminCabinet
                channels={channels}
                session={session}
                onAddChannel={handleAddChannel}
                onOpenImportModal={() => setShowImportModal(true)}
                onLoginAsAdmin={() => {
                  setSession(prev => ({
                    ...prev,
                    email: 'admin@dzen-analytics.ru',
                    name: 'Администратор Системы',
                    role: '🛠️ Администратор',
                    isAuthenticated: true
                  }));
                  setToastMessage('Вы успешно вошли с правами Администратора');
                  setTimeout(() => setToastMessage(null), 3500);
                }}
              />
            )}

            {/* TAB: FAVORITES & MEDIA PLAN */}
            {currentTab === 'favorites' && (
              <MediaPlanTab
                favoriteChannels={favoriteChannels}
                onRemoveFavorite={(id) => setFavorites(prev => prev.filter(f => f !== id))}
                onClearFavorites={() => setFavorites([])}
                onStartDeal={handleStartDeal}
                onSelectChannel={handleSelectChannel}
              />
            )}

            {/* TAB: COMPARE CHANNELS */}
            {currentTab === 'compare' && (
              <CompareTab
                compareChannels={compareChannels}
                onRemoveFromCompare={(id) => setCompareList(prev => prev.filter(c => c !== id))}
                onClearCompare={() => setCompareList([])}
                onSelectChannel={handleSelectChannel}
                onStartDeal={handleStartDeal}
              />
            )}
          </>
        )}

      </main>

      {/* Auth Modal (Registration & Login for Advertiser vs Author) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
        channels={channels}
        session={session}
        initialMode={authModalState.mode}
        defaultRole={authModalState.role}
        onRegister={(newSession) => {
          setSession(newSession);
          if (newSession.role === '✍️ Автор канала') {
            setCurrentTab('author');
          } else if (newSession.role === '💼 Маркетолог') {
            setCurrentTab('marketer');
          }
          setToastMessage(`Регистрация успешна! Добро пожаловать, ${newSession.name || newSession.email}`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onLogin={(email, role) => {
          const updated: UserSession = {
            ...session,
            email,
            role,
            isAuthenticated: true
          };
          setSession(updated);
          if (role === '✍️ Автор канала') {
            setCurrentTab('author');
          } else if (role === '💼 Маркетолог') {
            setCurrentTab('marketer');
          } else if (role === '🛠️ Администратор') {
            setCurrentTab('admin');
          }
          setToastMessage(`Вы успешно вошли как ${role}`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
        onLogout={() => {
          setSession({
            email: '',
            name: '',
            role: '🌐 Каталог',
            isAuthenticated: false
          });
          setToastMessage('Вы вышли из учетной записи.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* Database Import / Upload Modal */}
      <ImportDatabaseModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-400">Dzen Analytics</span> — Платформа анализа виральности и медиапланирования в Дзене
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>15+ ниш</span>
            <span>•</span>
            <span>ОРД / ЕРИД разметка</span>
            <span>•</span>
            <span>Manifest V3 Extension</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
