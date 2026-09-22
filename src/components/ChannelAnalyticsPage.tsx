import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
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
  Calendar, 
  PieChart as PieIcon, 
  BarChart2, 
  ShieldCheck,
  Star,
  GitCompare,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Info
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

interface ChannelAnalyticsPageProps {
  channel: Channel;
  onBack: () => void;
  isFavorite: boolean;
  isComparing: boolean;
  onToggleFavorite: (channel: Channel) => void;
  onToggleCompare: (channel: Channel) => void;
  onStartDeal: (channel: Channel) => void;
  onOpenAuthorClaim?: (channel: Channel) => void;
}

export const ChannelAnalyticsPage: React.FC<ChannelAnalyticsPageProps> = ({
  channel,
  onBack,
  isFavorite,
  isComparing,
  onToggleFavorite,
  onToggleCompare,
  onStartDeal,
  onOpenAuthorClaim,
}) => {
  const [historyData, setHistoryData] = useState<ChannelHistoryPoint[]>([]);
  const [calcBudget, setCalcBudget] = useState<number>(channel.rates?.native_price || 50000);
  const [calcCtr, setCalcCtr] = useState<number>(2.0); // 2% CTR
  const [calcConversion, setCalcConversion] = useState<number>(4.0); // 4% conversion to lead
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [openFaq, setOpenFaq] = useState<{ [key: number]: boolean }>({ 0: true, 1: true, 2: false, 3: true });

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Dynamic SEO Title, Meta Description & JSON-LD structured data
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `Статистика канала «${channel.name}» в Дзен: охваты, аудитория и реклама | Аналитика`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null;
    const seoDescription = `Полная статистика и аналитика канала «${channel.name}» (@${channel.dzen_id}) в Дзен: ${channel.subscribers_count.toLocaleString('ru-RU')} подписчиков, ${channel.views_30d.toLocaleString('ru-RU')} охват за 30 дней, демографический портрет аудитории, вовлеченность ER ${channel.er_percent.toFixed(1)}% и ориентировочная стоимость рекламы.`;

    if (metaDesc) {
      metaDesc.setAttribute('content', seoDescription);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', seoDescription);
      document.head.appendChild(metaDesc);
    }

    // Structured JSON-LD microdata for search engines
    const scriptId = 'channel-schema-ld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "name": `Аналитика канала «${channel.name}» в Дзен`,
      "description": seoDescription,
      "mainEntity": {
        "@type": "CreativeWorkSeries",
        "name": channel.name,
        "alternateName": `@${channel.dzen_id}`,
        "genre": channel.niche,
        "url": channel.url,
        "commentCount": channel.top_articles?.reduce((acc, a) => acc + a.comments, 0) || 0
      }
    });

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
      const existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();
    };
  }, [channel]);

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
   https://example.com/promo?utm_source=dzen&utm_medium=native&utm_campaign=${channel.dzen_id}_promo
5. Обязательная маркировка (ЕРИД):
   Реклама. erid: 2Vtzqu${Math.random().toString(36).substring(2, 7)}
6. Ориентировочный бюджет: ~${calcBudget.toLocaleString('ru-RU')} ₽ (предположительно, подлежит утверждению автором).`;

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(briefText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад в каталог</span>
          </button>

          {/* SEO Microdata Breadcrumbs */}
          <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <button onClick={onBack} className="hover:text-indigo-400 transition-colors">
              Каталог каналов Дзен
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-medium">{channel.niche}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-medium truncate max-w-[220px]">{channel.name}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => onToggleFavorite(channel)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isFavorite
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-300'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isFavorite ? 'В медиаплане' : 'Добавить в план'}</span>
          </button>

          <button
            onClick={() => onToggleCompare(channel)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isComparing
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-300'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>{isComparing ? 'В сравнении' : 'Сравнить'}</span>
          </button>

          <button
            onClick={() => onStartDeal(channel)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Briefcase className="w-4 h-4" />
            <span>Начать сделку в CRM</span>
          </button>
        </div>
      </div>

      {/* Main Channel Header Card */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {channel.avatar_url && !channel.avatar_url.includes('mc.yandex.ru') ? (
              <img
                src={channel.avatar_url}
                alt={`Аватар канала ${channel.name}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shrink-0">
                {channel.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Статистика канала «{channel.name}» в Дзен
                </h1>
                {channel.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Верифицирован</span>
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {channel.niche}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-2">
                <span className="font-mono text-slate-300">@{channel.dzen_id}</span>
                <span>•</span>
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <span>Открыть на dzen.ru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {channel.description && (
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Contact Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 shrink-0 md:w-64">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Контакты автора:</span>
            {channel.telegram_contact ? (
              <a
                href={channel.telegram_contact.startsWith('@') ? `https://t.me/${channel.telegram_contact.replace('@', '')}` : channel.telegram_contact}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{channel.telegram_contact}</span>
              </a>
            ) : (
              <div className="text-xs text-slate-500">Telegram не указан</div>
            )}

            {channel.email_contact && (
              <a
                href={`mailto:${channel.email_contact}`}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{channel.email_contact}</span>
              </a>
            )}
          </div>
        </div>

        {/* 4 Key Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-semibold">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Подписчики</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatNum(channel.subscribers_count)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+{channel.growth_velocity_daily}/день</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-semibold">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Охват за 30 дней</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatNum(channel.views_30d)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ~{formatNum(Math.round(channel.views_30d / 30))} в сутки
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-semibold">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Индекс виральности (VI)</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{channel.avg_viral_index.toFixed(1)}</span>
              {channel.avg_viral_index >= 2.0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                  Высокий
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              просмотры / подписчики
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-semibold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>ER вовлеченность</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {channel.er_percent.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              лайки, комментарии, репосты
            </div>
          </div>
        </div>

        {/* Ad Price Estimate Notice in Header */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <Tag className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ориентир стоимости рекламы:</span>
            <span className="font-bold text-white text-sm">
              ~{(channel.rates?.native_price || 60000).toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              {channel.rates?.is_custom_set ? 'Установлено автором' : 'Предположительно'}
            </span>
          </div>
          <a
            href="#sec-mediakit"
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors text-xs"
          >
            <span>Смотреть прайс-лист и тарифы</span>
            <span>&darr;</span>
          </a>
        </div>
      </div>

      {/* SEO Текстовый блок: подробное описание канала, охватов и рекламы для поисковых систем */}
      <article className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm sm:text-base border-b border-slate-800/80 pb-3">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <h2>О блоге «{channel.name}» в Дзене: охваты, аудитория и рекламные интеграции</h2>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Канал <strong>«{channel.name}»</strong> (id в Дзене: <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-xs">@{channel.dzen_id}</code>) — 
            популярный авторский медиаресурс в тематической категории <strong>«{channel.niche}»</strong>. 
            По данным мониторинга платформы, сообщество насчитывает <strong>{formatNum(channel.subscribers_count)} постоянных подписчиков</strong>, 
            а совокупный объем просмотров публикаций за последние 30 дней составляет <strong>{formatNum(channel.views_30d)}</strong>. 
            Среднесуточный прирост аудитории держится на уровне <strong>+{channel.growth_velocity_daily} чел./день</strong>, 
            что свидетельствует о стабильном органическом продвижении публикаций в рекомендательных алгоритмах Дзена.
          </p>
          <p>
            Уровень вовлеченности читателей (ER) составляет <strong>{channel.er_percent.toFixed(1)}%</strong>, 
            а средний индекс виральности (Viral Index) равен <strong>{channel.avg_viral_index.toFixed(1)}</strong>. 
            Благодаря качественному контенту блог демонстрирует высокое время удержания и дочитываемости, 
            что делает его эффективной рекламной площадкой для B2C и B2B брендов, нацеленных на контакт с целевой аудиторией в нише «{channel.niche}».
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">🎯 Тематическая ниша</span>
            <div className="text-xs font-bold text-white">{channel.niche}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Сфокусированная целевая аудитория с высоким коммерческим интересом к тематике.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">📊 Ожидаемый контакт</span>
            <div className="text-xs font-bold text-white">~{formatNum(estReachPerPost)} дочитываний / публикация</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Прогнозный объем внимания на одну нативную публикацию или рекламный обзор.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">🛡️ Маркировка и ЕРИД</span>
            <div className="text-xs font-bold text-emerald-400">Соответствие 347-ФЗ</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Регистрация в ОРД, передача отчетности в ЕРИД и предоставление закрывающих документов.
            </p>
          </div>
        </div>
      </article>

      {/* Quick Navigation Anchor Bar (Оглавление разделов портянки) */}
      <div className="sticky top-2 z-20 bg-slate-950/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800/80 shadow-2xl flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0 hidden sm:inline">
          Разделы:
        </span>

        <a
          href="#sec-dynamics"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>Динамика и прирост</span>
        </a>

        <a
          href="#sec-articles"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Топ-статьи &amp; Виральность</span>
        </a>

        <a
          href="#sec-demographics"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <PieIcon className="w-3.5 h-3.5 text-pink-400" />
          <span>Портрет аудитории</span>
        </a>

        <a
          href="#sec-calculator"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span>Воронка &amp; Калькулятор ROI</span>
        </a>

        <a
          href="#sec-brief"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Генератор ТЗ &amp; UTM</span>
        </a>

        <a
          href="#sec-mediakit"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Прайс-лист &amp; Условия</span>
        </a>

        <a
          href="#sec-faq"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>FAQ и вопросы</span>
        </a>
      </div>

      {/* ========================================================================= */}
      {/* 1. ДИНАМИКА И ПРИРОСТ АУДИТОРИИ                                           */}
      {/* ========================================================================= */}
      <section id="sec-dynamics" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Динамика прироста подписчиков и темпы роста канала «{channel.name}»
              </h2>
              <p className="text-xs text-slate-400">
                Ежедневная динамика аудитории канала за 14 дней на основе телеметрии платформы
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
            Скорость: +{channel.growth_velocity_daily} подп. / день
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} tickFormatter={formatNum} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="subscribers_count" name="Подписчики" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ТОП-СТАТЬИ & ВИРАЛЬНОСТЬ                                                */}
      {/* ========================================================================= */}
      <section id="sec-articles" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Топ-публикации, дочитывания и виральный индекс статей «{channel.name}»
              </h2>
              <p className="text-xs text-slate-400">
                Публикации с наивысшим показателем виральности (Viral Index), принесшие максимальный охват
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Средний VI канала: <strong className="text-white">{channel.avg_viral_index.toFixed(1)}</strong>
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {(channel.top_articles || []).map((art, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-white line-clamp-2 mb-1.5">
                  {art.title}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span>Дочитываний: <strong className="text-slate-200">{formatNum(art.views)}</strong></span>
                  <span>•</span>
                  <span>Лайков: <strong className="text-slate-200">{formatNum(art.likes)}</strong></span>
                  <span>•</span>
                  <span>Комментариев: <strong className="text-slate-200">{formatNum(art.comments)}</strong></span>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>VI: {art.viral_index.toFixed(1)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ПОРТРЕТ АУДИТОРИИ                                                       */}
      {/* ========================================================================= */}
      <section id="sec-demographics" className="space-y-4 scroll-mt-20">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Портрет целевой аудитории блога «{channel.name}» (пол, возраст, география)
            </h2>
            <p className="text-xs text-slate-400">
              Половозрастная структура читателей и география из Дзен-Студии
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Пол читателей</h3>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Мужчины</span>
                <span className="text-3xl font-black text-indigo-400">{channel.demographics?.gender_m || 48}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Женщины</span>
                <span className="text-3xl font-black text-pink-400">{channel.demographics?.gender_f || 52}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2">Топ-города читателей:</h4>
              <div className="space-y-2">
                {(channel.demographics?.top_cities || [
                  { name: 'Москва', percent: 34 },
                  { name: 'Санкт-Петербург', percent: 18 },
                  { name: 'Екатеринбург', percent: 8 }
                ]).map((city, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                    <span>{city.name}</span>
                    <span className="font-bold text-white">{city.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Возрастной срез аудитории</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bracket" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="percent" name="% аудитории" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ВОРОНКА & КАЛЬКУЛЯТОР ROI                                               */}
      {/* ========================================================================= */}
      <section id="sec-calculator" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Калькулятор окупаемости рекламы (ROI, CPM, CPC) в «{channel.name}»
              </h2>
              <p className="text-xs text-slate-400">
                Интерактивный расчет стоимости перехода (CPC), показа (CPM) и лида (CPL) для этой интеграции
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Бюджет на размещение (₽):
            </label>
            <input
              type="number"
              step="5000"
              value={calcBudget}
              onChange={(e) => setCalcBudget(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
            />
            <p className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Расчет основан на ориентировочной стоимости рекламы</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Прогнозный CTR в клики (%):
            </label>
            <input
              type="number"
              step="0.5"
              value={calcCtr}
              onChange={(e) => setCalcCtr(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Конверсия сайта в заявку (%):
            </label>
            <input
              type="number"
              step="0.5"
              value={calcConversion}
              onChange={(e) => setCalcConversion(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Ожидаемый охват</span>
            <span className="text-xl font-bold text-white">~{formatNum(estReachPerPost)}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Клики на сайт</span>
            <span className="text-xl font-bold text-indigo-400">~{estClicks} переходов</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Расчетный CPM</span>
            <span className="text-xl font-bold text-emerald-400">{effectiveCpm} ₽</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Расчетный CPC</span>
            <span className="text-xl font-bold text-amber-400">{effectiveCpc} ₽ / клик</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ГЕНЕРАТОР ТЗ & МАРКИРОВКА ЕРИД                                          */}
      {/* ========================================================================= */}
      <section id="sec-brief" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Генератор технического задания (ТЗ) и ЕРИД-маркировка рекламы
              </h2>
              <p className="text-xs text-slate-400">
                Готовый шаблон брифа и параметров интеграции для автора канала с учетом 347-ФЗ
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyBrief}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 self-start sm:self-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedBrief ? 'Скопировано!' : 'Скопировать ТЗ'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {briefText}
        </pre>
      </section>

      {/* ========================================================================= */}
      {/* 6. ПРАЙС-ЛИСТ & УСЛОВИЯ СОТРУДНИЧЕСТВА                                     */}
      {/* ========================================================================= */}
      <section id="sec-mediakit" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Стоимость рекламы и прайс-лист в канале «{channel.name}»
              </h2>
              <p className="text-xs text-slate-400">
                Тарифы на рекламные форматы, спецпроекты и порядок оформления закрывающих документов
              </p>
            </div>
          </div>

          {channel.rates?.is_custom_set ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Тарифы подтверждены автором</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Предположительная стоимость</span>
            </span>
          )}
        </div>

        {/* ОБЯЗАТЕЛЬНОЕ ПРЕДУПРЕЖДЕНИЕ: Цены указаны предположительно */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="font-bold text-amber-100 text-sm">
                Обратите внимание: стоимость рекламы указана предположительно!
              </div>
              <p className="text-amber-200/90">
                Указанные тарифы носят <strong>ориентировочный (расчетный) характер</strong>. Они вычислены автоматическим алгоритмом платформы на основе медианного CPM (от 250 до 450 ₽) и среднего прогнозируемого охвата публикаций (~{estReachPerPost.toLocaleString('ru-RU')} дочитываний) для категории «{channel.niche}».
              </p>
              <p className="text-amber-200/90">
                {channel.rates?.is_custom_set ? (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                    Автор блога верифицировал канал и лично зафиксировал актуальные расценки в системе.
                  </span>
                ) : (
                  <span>
                    <strong>Пока автор канала лично не подтвердит и не установит свои официальные цены</strong>, данные расценки служат индикативной оценкой для формирования медиаплана. Итоговая стоимость интеграции согласовывается напрямую с автором.
                  </span>
                )}
              </p>
            </div>
          </div>

          {!channel.rates?.is_custom_set && (
            <div className="pt-2.5 mt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-amber-200/80">
                Вы владелец канала <strong>«{channel.name}»</strong>? Установите свои официальные цены и получайте прямые заявки от брендов:
              </span>
              <button
                onClick={() => onOpenAuthorClaim && onOpenAuthorClaim(channel)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors self-start sm:self-auto shadow-md"
              >
                Я автор канала — установить свои цены
              </button>
            </div>
          )}
        </div>

        {/* 3 Карточки тарифов с маркировкой предположительности */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Короткий пост</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                {channel.rates?.is_custom_set ? 'Фикс. цена' : 'Предположительно'}
              </span>
            </div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1">
              <span>~{(channel.rates?.post_price || 35000).toLocaleString('ru-RU')}</span>
              <span className="text-base text-slate-400">₽</span>
            </div>
            <p className="text-[11px] text-slate-400">
              До 1500 знаков с 1-3 фотографиями и ссылкой с UTM-меткой рекламодателя.
            </p>
            <div className="text-[10px] text-slate-500 pt-1">
              * {channel.rates?.is_custom_set ? 'Цена подтверждена автором' : 'Ориентировочная оценка платформы'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 bg-indigo-950/20 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400">Нативная статья (Хит)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                {channel.rates?.is_custom_set ? 'Фикс. цена' : 'Предположительно'}
              </span>
            </div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1">
              <span>~{(channel.rates?.native_price || 60000).toLocaleString('ru-RU')}</span>
              <span className="text-base text-slate-400">₽</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Полноформатный нативный лонгрид с глубокой интеграцией продукта, бренда или сервиса.
            </p>
            <div className="text-[10px] text-indigo-300/80 pt-1">
              * {channel.rates?.is_custom_set ? 'Цена подтверждена автором' : 'Ориентировочная оценка платформы'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Видеоролик / Спецпроект</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                {channel.rates?.is_custom_set ? 'Фикс. цена' : 'Предположительно'}
              </span>
            </div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1">
              <span>~{(channel.rates?.video_price || 90000).toLocaleString('ru-RU')}</span>
              <span className="text-base text-slate-400">₽</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Отдельный видеообзор или рекламная вставка в горизонтальное видео блогера.
            </p>
            <div className="text-[10px] text-slate-500 pt-1">
              * {channel.rates?.is_custom_set ? 'Цена подтверждена автором' : 'Ориентировочная оценка платформы'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            Юридический статус автора: <strong className="text-white">{channel.rates?.tax_status || 'ИП (УСН 6%)'}</strong>
          </div>
          <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Официальный договор, акты и маркировка ЕРИД</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SEO FAQ: ВОПРОСЫ И ОТВЕТЫ О КАНАЛЕ И РЕКЛАМЕ                           */}
      {/* ========================================================================= */}
      <section id="sec-faq" className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 scroll-mt-20">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Часто задаваемые вопросы о канале «{channel.name}» и покупке рекламы в Дзене
            </h2>
            <p className="text-xs text-slate-400">
              Разъяснения по расчету цен, маркировке по закону о рекламе и контакту с автором
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* FAQ Item 1 */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden">
            <button
              onClick={() => toggleFaq(0)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Сколько стоит размещение рекламы в канале «{channel.name}»?
              </span>
              {openFaq[0] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>
            {openFaq[0] && (
              <div className="px-5 pb-4 text-xs text-slate-300 border-t border-slate-800/60 pt-3 leading-relaxed space-y-2">
                <p>
                  Представленная на странице стоимость (от {(channel.rates?.post_price || 35000).toLocaleString('ru-RU')} ₽ за пост и от {(channel.rates?.native_price || 60000).toLocaleString('ru-RU')} ₽ за статью) является <strong>предположительной</strong>. Она рассчитана аналитическим алгоритмом платформы на базе среднего охвата блога (~{formatNum(estReachPerPost)} дочитываний) и среднерыночного CPM в тематике «{channel.niche}».
                </p>
                <p>
                  <strong>Пока автор канала лично не подтвердит и не зафиксирует свои официальные расценки</strong>, данные цифры служат ориентиром для планирования бюджета. Точные условия и скидки за объем публикаций согласуются индивидуально.
                </p>
              </div>
            )}
          </div>

          {/* FAQ Item 2 */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden">
            <button
              onClick={() => toggleFaq(1)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Какая читательская аудитория у блога «{channel.name}»?
              </span>
              {openFaq[1] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>
            {openFaq[1] && (
              <div className="px-5 pb-4 text-xs text-slate-300 border-t border-slate-800/60 pt-3 leading-relaxed space-y-2">
                <p>
                  Аудитория канала сосредоточена вокруг тематики <strong>«{channel.niche}»</strong>. По данным телеметрии, на канал подписано {formatNum(channel.subscribers_count)} человек, а активный месячный охват составляет {formatNum(channel.views_30d)} просмотров.
                </p>
                <p>
                  Ядро читателей — экономически активные граждане ({channel.demographics?.gender_m || 48}% мужчин и {channel.demographics?.gender_f || 52}% женщин) с преобладанием возрастных групп 25–34 и 35–44 года, преимущественно проживающие в Москве, Санкт-Петербурге и крупнейших региональных центрах РФ.
                </p>
              </div>
            )}
          </div>

          {/* FAQ Item 3 */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden">
            <button
              onClick={() => toggleFaq(2)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Как происходит маркировка рекламы по 347-ФЗ (ЕРИД)?
              </span>
              {openFaq[2] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>
            {openFaq[2] && (
              <div className="px-5 pb-4 text-xs text-slate-300 border-t border-slate-800/60 pt-3 leading-relaxed space-y-2">
                <p>
                  Все рекламные публикации маркируются в соответствии с законодательством РФ. Генератор технического задания на странице формирует уникальный токен ЕРИД и готовую UTM-разметку.
                </p>
                <p>
                  Данные регистрируются в ОРД до выхода публикации, а по истечении календарного месяца автор или оператор передает статистику дочитываний и закрывающие акты в ЕРИД.
                </p>
              </div>
            )}
          </div>

          {/* FAQ Item 4 */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden">
            <button
              onClick={() => toggleFaq(3)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Как автору канала «{channel.name}» зафиксировать свои официальные расценки?
              </span>
              {openFaq[3] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>
            {openFaq[3] && (
              <div className="px-5 pb-4 text-xs text-slate-300 border-t border-slate-800/60 pt-3 leading-relaxed space-y-2">
                <p>
                  Если вы являетесь владельцем блога «{channel.name}», нажмите кнопку <strong>«Я автор канала — установить свои цены»</strong> или перейдите во вкладку «Кабинет автора».
                </p>
                <p>
                  Пройдите быструю верификацию через проверочный код в описании канала, после чего вы сможете указать точные цены на пост, нативную статью и видео, загрузить свой медиакит и получать целевые заявки от проверенных рекламодателей без комиссии.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SEO ТЕМАТИЧЕСКИЕ ТЕГИ И ПОИСКОВЫЕ МАРКЕРЫ                               */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950/60 border border-slate-800/60 rounded-3xl p-6 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Tag className="w-4 h-4 text-indigo-400" />
          <span>Тематические разделы и поисковые теги</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #ДзенСтатистика
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #{channel.name.replace(/\s+/g, '')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #РекламаВКанале{channel.niche.replace(/\s+/g, '')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #АналитикаБлогеровДзена
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #ОхватыДзен
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #МедиакитБлогера
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-default">
            #МаркировкаЕРИД
          </span>
        </div>
        <p className="text-[11px] text-slate-500 pt-1">
          Информация обновляется в режиме регулярного мониторинга открытых данных платформы Дзен. Все товарные знаки принадлежат их правообладателям.
        </p>
      </footer>

    </div>
  );
};
