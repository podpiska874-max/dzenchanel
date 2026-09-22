import React, { useState } from 'react';
import { 
  PenTool, 
  CheckCircle2, 
  ShieldCheck, 
  Save, 
  PieChart, 
  DollarSign, 
  Sparkles, 
  FileText, 
  Share2, 
  AlertCircle,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Search,
  PlusCircle,
  HelpCircle,
  Mail,
  Send
} from 'lucide-react';
import { Channel, UserSession } from '../types';

interface AuthorCabinetProps {
  channels: Channel[];
  session: UserSession;
  onUpdateChannelRates: (channelId: number, rates: Channel['rates'], demographics: Channel['demographics']) => void;
  onVerifyChannel: (channelId: number, login: string, method?: string) => void;
  onLinkChannelToSession: (channelId: number) => void;
}

export const AuthorCabinet: React.FC<AuthorCabinetProps> = ({
  channels,
  session,
  onUpdateChannelRates,
  onVerifyChannel,
  onLinkChannelToSession,
}) => {
  // If session already has linked channel, prefer that
  const defaultChannelId = session.authorChannelId || channels[0]?.id || 1;
  const [selectedChannelId, setSelectedChannelId] = useState<number>(defaultChannelId);
  const selectedChannel = channels.find(c => c.id === selectedChannelId) || channels[0];

  // Channel link search
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);

  // Verification method state
  const [verificationTab, setVerificationTab] = useState<'bio_code' | 'yandex_oauth' | 'support_request'>('bio_code');
  const [verificationCode, setVerificationCode] = useState<string>(session.verificationCode || 'DZEN-749201');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCheckingBio, setIsCheckingBio] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Local form state
  const [postPrice, setPostPrice] = useState<number>(selectedChannel?.rates?.post_price || 35000);
  const [nativePrice, setNativePrice] = useState<number>(selectedChannel?.rates?.native_price || 60000);
  const [videoPrice, setVideoPrice] = useState<number>(selectedChannel?.rates?.video_price || 90000);
  const [taxStatus, setTaxStatus] = useState<any>(selectedChannel?.rates?.tax_status || 'ИП (УСН 6%)');
  
  // Demographics
  const [genderM, setGenderM] = useState<number>(selectedChannel?.demographics?.gender_m || 48);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // When switching channel
  const handleSelectChannel = (id: number) => {
    setSelectedChannelId(id);
    onLinkChannelToSession(id);
    const ch = channels.find(c => c.id === id);
    if (ch) {
      setPostPrice(ch.rates?.post_price || 35000);
      setNativePrice(ch.rates?.native_price || 60000);
      setVideoPrice(ch.rates?.video_price || 90000);
      setTaxStatus(ch.rates?.tax_status || 'ИП (УСН 6%)');
      setGenderM(ch.demographics?.gender_m || 48);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;

    const newRates = {
      post_price: postPrice,
      native_price: nativePrice,
      video_price: videoPrice,
      tax_status: taxStatus,
      is_custom_set: true
    };

    const newDemographics = {
      gender_m: genderM,
      gender_f: 100 - genderM,
      ages: selectedChannel.demographics?.ages || { '18-24': 12, '25-34': 38, '35-44': 32, '45-54': 14, '55+': 4 },
      top_cities: selectedChannel.demographics?.top_cities || [{ name: 'Москва', percent: 34 }, { name: 'Санкт-Петербург', percent: 18 }],
      devices: selectedChannel.demographics?.devices || { mobile: 82, desktop: 18 }
    };

    onUpdateChannelRates(selectedChannel.id, newRates, newDemographics);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // 1. Bio verification check simulation
  const handleVerifyViaBio = () => {
    if (!selectedChannel) return;
    setIsCheckingBio(true);
    setVerificationFeedback(null);

    setTimeout(() => {
      setIsCheckingBio(false);
      onVerifyChannel(selectedChannel.id, `${selectedChannel.dzen_id}@yandex.ru`, 'bio_code');
      setVerificationFeedback('Код успешно найден в описании канала dzen.ru! Канал верифицирован.');
    }, 1200);
  };

  // 2. Yandex ID OAuth simulation
  const handleVerifyViaOAuth = () => {
    if (!selectedChannel) return;
    onVerifyChannel(selectedChannel.id, `${selectedChannel.dzen_id}@yandex.ru`, 'yandex_oauth');
    setVerificationFeedback('Права владения подтверждены через сессию Yandex ID.');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Channels matched in search
  const filteredSearchChannels = channels.filter(c => 
    channelSearchQuery.trim() &&
    (c.name.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
     c.dzen_id.toLowerCase().includes(channelSearchQuery.toLowerCase()))
  ).slice(0, 6);

  if (!selectedChannel) return null;

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-6 sm:p-7 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Кабинет Автора Дзена</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Привяжите свой блог, подтвердите права владения каналом для рекламодателей, управляйте ставками на посты и актуализируйте медиакит.
            </p>
          </div>

          {/* Channel selector / Link Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">Привязанный канал:</span>
            <select
              value={selectedChannelId}
              onChange={(e) => handleSelectChannel(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
            >
              {channels.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (@{c.dzen_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Author Profile / Verified Email Bar */}
        {session && session.isAuthenticated && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold">
                <PenTool className="w-4 h-4" />
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
                  Авторский профиль: <strong className="text-slate-300">{session.email}</strong>
                  {session.phoneOrTg && <span className="ml-2 text-indigo-400">• Telegram: {session.phoneOrTg}</span>}
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span className="text-indigo-400 font-semibold">Налоговый статус: </span>
              <span className="text-white font-medium">{taxStatus}</span>
            </div>
          </div>
        )}

        {/* Verification & Channel Linking Card */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${selectedChannel.is_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Статус привязки и верификации: </span>
                  {selectedChannel.is_verified ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-extrabold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Подтвержден (Владелец)</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">Ожидает подтверждения прав</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Канал: <strong className="text-white">{selectedChannel.name}</strong> (<a href={selectedChannel.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">dzen.ru/{selectedChannel.dzen_id}</a>).
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSearchingChannel(!isSearchingChannel)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 self-start sm:self-auto flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearchingChannel ? 'Скрыть поиск' : 'Привязать другой канал'}</span>
            </button>
          </div>

          {/* Channel search dropdown if author wants to find their channel */}
          {isSearchingChannel && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
              <span className="text-xs font-bold text-white block">
                Найдите ваш канал в каталоге платформы:
              </span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={channelSearchQuery}
                  onChange={(e) => setChannelSearchQuery(e.target.value)}
                  placeholder="Введите название канала или username (@channel)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              {filteredSearchChannels.length > 0 && (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  {filteredSearchChannels.map(ch => (
                    <div key={ch.id} className="p-3 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                      <div>
                        <div className="text-xs font-bold text-white">{ch.name}</div>
                        <div className="text-[11px] text-slate-400">@{ch.dzen_id} • {ch.subscribers_count.toLocaleString('ru-RU')} подписчиков</div>
                      </div>
                      <button
                        onClick={() => {
                          handleSelectChannel(ch.id);
                          setIsSearchingChannel(false);
                          setChannelSearchQuery('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                      >
                        Привязать к аккаунту
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verification Methods Accordion / Tabs */}
          {!selectedChannel.is_verified && (
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Как подтвердить владение каналом (3 надежных способа):
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVerificationTab('bio_code')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    verificationTab === 'bio_code'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>1. Код в описании канала (Рекомендуем)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationTab('yandex_oauth')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    verificationTab === 'yandex_oauth'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-black text-red-400">Я</span>
                  <span>2. Yandex ID OAuth</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationTab('support_request')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    verificationTab === 'support_request'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>3. Ручная модерация</span>
                </button>
              </div>

              {/* METHOD 1: BIO CODE */}
              {verificationTab === 'bio_code' && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Для 100% подтверждения вставьте уникальный проверочный код в поле <strong>«Описание канала»</strong> в вашей Дзен-Студии. Робот проверит наличие кода и снимет ограничения:
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl bg-slate-950 border border-indigo-500/50 font-mono text-indigo-300 text-xs font-bold tracking-wider">
                      {verificationCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Скопировано' : 'Скопировать'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isCheckingBio}
                      onClick={handleVerifyViaBio}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                    >
                      {isCheckingBio ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Проверяем описание на dzen.ru...</span>
                        </>
                      ) : (
                        <span>Проверить наличие кода</span>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      * После верификации код из описания можно удалить.
                    </span>
                  </div>
                </div>
              )}

              {/* METHOD 2: YANDEX ID */}
              {verificationTab === 'yandex_oauth' && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Авторизуйтесь через аккаунт Яндекса, к которому привязана ваша Дзен-Студия. Сервис мгновенно сверит права доступа владельца.
                  </p>
                  <button
                    type="button"
                    onClick={handleVerifyViaOAuth}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-600/30 flex items-center gap-2"
                  >
                    <span className="font-black text-sm">Я</span>
                    <span>Войти и подтвердить через Yandex ID</span>
                  </button>
                </div>
              )}

              {/* METHOD 3: SUPPORT */}
              {verificationTab === 'support_request' && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Напишите нам в Telegram с аккаунта, указанного в шапке вашего канала, или отправьте письмо с привязанной почты для ручного подтверждения модератором.
                  </p>
                  <div className="flex gap-2">
                    <a
                      href="https://t.me/dzen_analytics_support"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Поддержка в Telegram (@dzen_analytics_support)</span>
                    </a>
                  </div>
                </div>
              )}

              {verificationFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{verificationFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Settings Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ratecard & Commercial terms */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Прайс-лист на интеграции (в рублях)</h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Стоимость короткого поста (₽):
            </label>
            <input
              type="number"
              step="1000"
              value={postPrice}
              onChange={(e) => setPostPrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Стоимость нативной статьи (₽):
            </label>
            <input
              type="number"
              step="1000"
              value={nativePrice}
              onChange={(e) => setNativePrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Стоимость видеоролика / интеграции (₽):
            </label>
            <input
              type="number"
              step="1000"
              value={videoPrice}
              onChange={(e) => setVideoPrice(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Налоговый и юридический статус:
            </label>
            <select
              value={taxStatus}
              onChange={(e) => setTaxStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Самозанятый (НПД)">Самозанятый (НПД, чек через Мой Налог)</option>
              <option value="ИП (УСН 6%)">ИП (УСН 6%, договор и акты)</option>
              <option value="ООО / С НДС">ООО (Работа с НДС / без НДС)</option>
              <option value="Физлицо">Физлицо (Прямой перевод)</option>
            </select>
          </div>
        </div>

        {/* Demographic Data from Dzen Studio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Статистика Дзен-Студии (Аудитория)</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                  <span>Мужчины: {genderM}%</span>
                  <span>Женщины: {100 - genderM}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={genderM}
                  onChange={(e) => setGenderM(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Советы алгоритма по виральности (VI):</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Текущий индекс виральности вашего канала: <span className="font-bold text-white">{selectedChannel.avg_viral_index.toFixed(1)}</span>. 
                  Для попадания в расширенные рекомендации ленты публикуйте лонгриды объемом более 3500 знаков с временем дочитывания от 2.5 минут.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Данные сохранены!</span>
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
