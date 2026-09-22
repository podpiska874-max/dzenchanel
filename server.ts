import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { INITIAL_CHANNELS, INITIAL_DEALS, NICHES_LIST } from "./src/data/seedChannels";
import { Channel, Deal, RegisteredUser } from "./src/types";
import { dzenOwnershipVerifier } from "./server/dzenVerifier";

// In-memory data store for channels and deals
const channelsStore: Channel[] = [...INITIAL_CHANNELS];
let dealsStore: Deal[] = [...INITIAL_DEALS];

interface PendingRegistration {
  id: string;
  email: string;
  code: string;
  token: string;
  role: '💼 Маркетолог' | '✍️ Автор канала' | '🛠️ Администратор';
  name: string;
  password?: string;
  telegram?: string;
  company?: string;
  website?: string;
  budgetTier?: string;
  paymentMethod?: string;
  channelId?: number;
  dzenId?: string;
  channelName?: string;
  taxStatus?: any;
  rates?: any;
  createdAt: number;
  expiresAt: number;
  simulatedEmail: {
    from: string;
    to: string;
    subject: string;
    previewText: string;
    code: string;
    directVerifyUrl: string;
    html: string;
    sentAt: string;
  };
}

const registeredUsersStore: RegisteredUser[] = [
  {
    id: 'user-marketer-1',
    email: 'alex.marketer@media.ru',
    name: 'Алексей Маркетолог',
    role: '💼 Маркетолог',
    telegram: '@alex_digital_lead',
    emailVerified: true,
    registeredAt: '2026-09-01T10:00:00Z',
    company: 'Digital Agency Pro',
    website: 'https://digital-agency-pro.ru',
    budgetTier: '500 000 - 1 500 000 ₽',
    paymentMethod: 'Безналичный расчет (ООО с НДС)'
  },
  {
    id: 'user-author-1',
    email: 'dzen.creator@yandex.ru',
    name: 'Михаил Иванов (Автор)',
    role: '✍️ Автор канала',
    telegram: '@mikhail_dzen',
    emailVerified: true,
    registeredAt: '2026-09-10T12:30:00Z',
    channelId: 1,
    dzenId: 'tech_future',
    channelName: 'Технологии Будущего',
    taxStatus: 'ИП (УСН 6%)',
    rates: {
      post_price: 35000,
      native_price: 60000,
      video_price: 90000,
      tax_status: 'ИП (УСН 6%)',
      is_custom_set: true
    },
    verificationMethod: 'yandex_oauth',
    isChannelClaimed: true
  },
  {
    id: 'user-admin-1',
    email: 'admin@dzen-analytics.ru',
    name: 'Администратор Системы',
    role: '🛠️ Администратор',
    telegram: '@dzen_admin',
    emailVerified: true,
    registeredAt: '2026-08-15T09:00:00Z'
  }
];

const pendingRegistrationsMap = new Map<string, PendingRegistration>();

function createSimulatedEmail(
  email: string,
  name: string,
  role: string,
  code: string,
  token: string
) {
  const roleName = role === '💼 Маркетолог' ? 'Маркетолог / Рекламодатель' : 'Автор Дзен-канала';
  const roleColor = role === '💼 Маркетолог' ? '#6366f1' : '#ec4899';
  const directVerifyUrl = `/?verify_token=${token}&email=${encodeURIComponent(email)}`;

  return {
    from: 'Dzen Analytics Security <security@dzen-analytics.ru>',
    to: email,
    subject: `🔐 Код подтверждения: ${code} — Регистрация в Dzen Analytics`,
    previewText: `Здравствуйте, ${name}! Ваш код для подтверждения регистрации: ${code}`,
    code,
    directVerifyUrl,
    sentAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 28px; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; line-height: 38px; text-align: center;">⚡</div>
          <div>
            <h2 style="margin: 0; font-size: 18px; color: #ffffff; font-weight: 800;">Dzen Analytics Platform</h2>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">Подтверждение адреса электронной почты</p>
          </div>
        </div>

        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-top: 16px;">
          Здравствуйте, <strong>${name}</strong>!
        </p>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          Вы регистрируетесь в платформе как <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: rgba(99, 102, 241, 0.15); color: ${roleColor}; font-weight: 600; font-size: 12px;">${roleName}</span>.
          Для активации аккаунта и доступа к личному кабинету введите 6-значный код безопасности:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #020617; border: 2px dashed #6366f1; border-radius: 12px; padding: 14px 32px; font-size: 32px; letter-spacing: 8px; font-weight: 900; color: #818cf8; font-family: monospace;">
            ${code}
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Код действителен в течение 15 минут</p>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 18px; margin-top: 20px;">
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
            Или подтвердите регистрацию в один клик по защищенной ссылке:
          </p>
          <a href="${directVerifyUrl}" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
            ✓ Активировать мой аккаунт
          </a>
        </div>

        <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; line-height: 1.5;">
          Если вы не запрашивали регистрацию на платформе Dzen Analytics, просто проигнорируйте это письмо.<br/>
          Служба безопасности: <a href="mailto:security@dzen-analytics.ru" style="color: #6366f1; text-decoration: none;">security@dzen-analytics.ru</a>
        </div>
      </div>
    `
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ---------------------------------------------------------------------------
  // REST API Endpoints (matching dzen_analytics_backend.py & dashboard features)
  // ---------------------------------------------------------------------------

  // 1. Niches list
  app.get("/api/v1/niches", (_req, res) => {
    const counts: { [niche: string]: number } = {};
    channelsStore.forEach(c => {
      counts[c.niche] = (counts[c.niche] || 0) + 1;
    });

    const niches = NICHES_LIST.map((name, idx) => ({
      id: idx + 1,
      name,
      channel_count: name === "Все ниши" ? channelsStore.length : (counts[name] || 0)
    }));

    res.json(niches);
  });

  // 2. Rankings: Top Viral
  app.get("/api/v1/rankings/viral", (req, res) => {
    const niche = req.query.niche as string | undefined;
    const minSubscribers = parseInt((req.query.min_subscribers as string) || "0", 10);
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));

    let filtered = channelsStore.filter(c => c.subscribers_count >= minSubscribers);
    if (niche && niche !== "Все ниши") {
      filtered = filtered.filter(c => c.niche.toLowerCase() === niche.toLowerCase());
    }

    filtered.sort((a, b) => b.avg_viral_index - a.avg_viral_index);

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    res.json({
      total,
      page,
      limit,
      items
    });
  });

  // 3. Rankings: Fastest Growing Newcomers
  app.get("/api/v1/rankings/fastest-growing", (req, res) => {
    const minSubscribers = parseInt((req.query.min_subscribers as string) || "0", 10);
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));

    const filtered = channelsStore.filter(c => c.subscribers_count >= minSubscribers);
    filtered.sort((a, b) => b.growth_velocity_daily - a.growth_velocity_daily);

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    res.json({
      total,
      page,
      limit,
      items
    });
  });

  // 4. Catalog search & filtering with presets
  app.get("/api/v1/channels", (req, res) => {
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const niche = (req.query.niche as string) || "Все ниши";
    const preset = (req.query.preset as string) || "Все каналы";
    const minSubs = parseInt((req.query.min_subscribers as string) || "0", 10);
    const maxSubs = parseInt((req.query.max_subscribers as string) || "100000000", 10);
    const minViews = parseInt((req.query.min_views as string) || "0", 10);
    const minEr = parseFloat((req.query.min_er as string) || "0");
    const minVi = parseFloat((req.query.min_vi as string) || "0");
    const hasTg = req.query.has_tg === "true";
    const hasEmail = req.query.has_email === "true";
    const sortBy = (req.query.sort_by as string) || "subscribers";
    const sortOrder = (req.query.sort_order as string) || "desc";

    let result = channelsStore.filter(c => {
      if (search) {
        const matchesName = c.name.toLowerCase().includes(search);
        const matchesDzenId = c.dzen_id.toLowerCase().includes(search);
        const matchesDesc = (c.description || "").toLowerCase().includes(search);
        if (!matchesName && !matchesDzenId && !matchesDesc) return false;
      }

      if (niche !== "Все ниши" && c.niche !== niche) {
        return false;
      }

      if (c.subscribers_count < minSubs || c.subscribers_count > maxSubs) return false;
      if (c.views_30d < minViews) return false;
      if (c.er_percent < minEr) return false;
      if (c.avg_viral_index < minVi) return false;
      if (hasTg && !c.telegram_contact) return false;
      if (hasEmail && !c.email_contact) return false;

      // Presets logic from dashboard-v49
      if (preset === "🎯 Быстрый сдел (TG + ER>1%)") {
        if (!c.telegram_contact || c.er_percent < 1.0) return false;
      } else if (preset === "💰 Бюджетный охват (VI > 1.5)") {
        if (c.avg_viral_index < 1.5) return false;
      } else if (preset === "💼 B2B & БизнесКонтакты (Email)") {
        if (!c.email_contact) return false;
      } else if (preset === "⚡ Взрывной прирост (Рост > 100/день)") {
        if (c.growth_velocity_daily < 100) return false;
      } else if (preset === "🚀 Виральные аномалии (VI > 10)") {
        if (c.avg_viral_index < 10.0) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === "subscribers") { valA = a.subscribers_count; valB = b.subscribers_count; }
      else if (sortBy === "views") { valA = a.views_30d; valB = b.views_30d; }
      else if (sortBy === "er") { valA = a.er_percent; valB = b.er_percent; }
      else if (sortBy === "viral_index") { valA = a.avg_viral_index; valB = b.avg_viral_index; }
      else if (sortBy === "growth") { valA = a.growth_velocity_daily; valB = b.growth_velocity_daily; }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    res.json({
      total: result.length,
      channels: result
    });
  });

  // 5. Channel by ID or Dzen ID
  app.get("/api/v1/channels/:id", (req, res) => {
    const id = req.params.id;
    const channel = channelsStore.find(c => c.id.toString() === id || c.dzen_id === id);
    if (!channel) {
      return res.status(404).json({ error: "Канал не найден" });
    }
    res.json(channel);
  });

  // 6. Channel history points (last 14 days)
  app.get("/api/v1/channels/:id/history", (req, res) => {
    const id = req.params.id;
    const channel = channelsStore.find(c => c.id.toString() === id || c.dzen_id === id);
    if (!channel) {
      return res.status(404).json({ error: "Канал не найден" });
    }

    const history = [];
    const baseSubs = channel.subscribers_count;
    const dailyGrowth = channel.growth_velocity_daily;
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const noise = (Math.sin(i * 1.5) * 0.05);
      const subs = Math.max(10, Math.round(baseSubs - (i * dailyGrowth) + (dailyGrowth * noise)));
      const views = Math.max(100, Math.round((channel.views_30d / 30) * (1 + noise)));
      const er = +(channel.er_percent * (1 + noise * 0.5)).toFixed(2);
      const vi = +(channel.avg_viral_index * (1 + noise * 0.3)).toFixed(2);

      history.push({
        date: d.toISOString().split("T")[0],
        subscribers_count: subs,
        views_30d: views,
        er_percent: er,
        avg_viral_index: vi
      });
    }

    res.json(history);
  });

  // 7. Chrome Extension Data Ingestion (Crowdsourced telemetry matching backend.py)
  app.post("/api/v1/ingest/extension-data", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.channel_id) {
      return res.status(400).json({ error: "Требуется channel_id" });
    }

    let channel = channelsStore.find(c => c.dzen_id === payload.channel_id);
    if (!channel) {
      channel = {
        id: channelsStore.length + 1,
        dzen_id: payload.channel_id,
        name: payload.channel_name || payload.channel_id,
        url: `https://dzen.ru/${payload.channel_id}`,
        niche: "Эксперимент / Виральность",
        subscribers_count: payload.subscribers_count || 100,
        views_30d: (payload.views_count || 0) * 10,
        er_percent: payload.er_percent || 3.2,
        avg_viral_index: payload.viral_index || 1.5,
        growth_velocity_daily: 25,
        subscribers_growth_30d: 750,
        readability_percent: 85.0,
        is_verified: false,
        top_articles: [
          {
            title: payload.article_title || "Статья из расширения Дзен",
            views: payload.views_count || 5000,
            likes: payload.likes_count || 120,
            comments: payload.comments_count || 30,
            viral_index: payload.viral_index || 1.5
          }
        ]
      };
      channelsStore.push(channel);
    } else {
      if (payload.subscribers_count) {
        channel.subscribers_count = payload.subscribers_count;
      }
      if (payload.viral_index) {
        channel.avg_viral_index = +((channel.avg_viral_index + payload.viral_index) / 2).toFixed(2);
      }
      if (payload.article_title) {
        channel.top_articles = channel.top_articles || [];
        channel.top_articles.unshift({
          title: payload.article_title,
          views: payload.views_count || 1000,
          likes: payload.likes_count || 50,
          comments: payload.comments_count || 10,
          viral_index: payload.viral_index || channel.avg_viral_index
        });
      }
    }

    res.status(201).json({
      status: "success",
      channel_id: payload.channel_id,
      updated: true,
      channel
    });
  });

  // 8. CRM Deals API
  app.get("/api/v1/crm/deals", (_req, res) => {
    res.json(dealsStore);
  });

  app.post("/api/v1/crm/deals", (req, res) => {
    const body = req.body;
    if (!body || !body.channel_id) {
      return res.status(400).json({ error: "Missing channel_id" });
    }

    const existingIdx = dealsStore.findIndex(d => d.id === body.id || d.channel_id === body.channel_id);
    if (existingIdx >= 0) {
      dealsStore[existingIdx] = { ...dealsStore[existingIdx], ...body };
      return res.json({ status: "updated", deal: dealsStore[existingIdx] });
    }

    const ch = channelsStore.find(c => c.id === body.channel_id);
    const newDeal: Deal = {
      id: body.id || `deal-${Date.now()}`,
      channel_id: body.channel_id,
      channel_name: ch?.name || body.channel_name || "Канал",
      dzen_id: ch?.dzen_id || body.dzen_id || "",
      status: body.status || "Переговоры",
      price: body.price || 50000,
      format: body.format || "Нативная статья",
      note: body.note || "",
      utm: body.utm || `utm_source=dzen&utm_medium=native&utm_campaign=deal_${Date.now()}`,
      erid: body.erid || `2Vtzqu${Math.random().toString(36).substring(2, 7)}`,
      deadline: body.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      created_at: new Date().toISOString().split("T")[0]
    };

    dealsStore.unshift(newDeal);
    res.status(201).json({ status: "created", deal: newDeal });
  });

  // 9. Author verification & rates
  app.post("/api/v1/author/verify", async (req, res) => {
    try {
      const { channel_id, yandex_login, code, method } = req.body;
      const channel = channelsStore.find(c => c.id === channel_id || c.dzen_id === channel_id);
      if (!channel) {
        return res.status(404).json({ error: "Канал не найден" });
      }

      if (method === 'bio_code') {
        if (!code) {
          return res.status(400).json({ error: "Код подтверждения не передан" });
        }
        const verifyResult = await dzenOwnershipVerifier.verifyOwnership(channel.url, code);

        if (!verifyResult.is_verified) {
          return res.status(400).json({
            error: verifyResult.error_message || "Контрольный токен не обнаружен в описании канала."
          });
        }
      }

      channel.is_verified = true;
      res.json({
        status: "verified",
        channel,
        yandex_login: yandex_login || "dzen.creator@yandex.ru"
      });
    } catch (err: any) {
      console.error("Author verify error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/v1/author/rates", (req, res) => {
    const { channel_id, rates, demographics } = req.body;
    const channel = channelsStore.find(c => c.id === channel_id || c.dzen_id === channel_id);
    if (!channel) {
      return res.status(404).json({ error: "Канал не найден" });
    }
    if (rates) {
      channel.rates = rates;
    }
    if (demographics) {
      channel.demographics = demographics;
    }
    res.json({ status: "updated", channel });
  });

  // 10. Platform Overview Stats
  app.get("/api/v1/stats/overview", (_req, res) => {
    const totalChannels = channelsStore.length;
    const totalSubs = channelsStore.reduce((acc, c) => acc + c.subscribers_count, 0);
    const totalViews = channelsStore.reduce((acc, c) => acc + c.views_30d, 0);
    const avgVi = +(channelsStore.reduce((acc, c) => acc + c.avg_viral_index, 0) / totalChannels).toFixed(2);
    const avgEr = +(channelsStore.reduce((acc, c) => acc + c.er_percent, 0) / totalChannels).toFixed(2);

    res.json({
      totalChannels,
      totalSubscribers: totalSubs,
      totalViews30d: totalViews,
      avgViralIndex: avgVi,
      avgErPercent: avgEr,
      activeDealsCount: dealsStore.length
    });
  });

  // 11. Bulk Database Import API
  app.post("/api/v1/admin/import-database", (req, res) => {
    try {
      const { channels: incomingChannels, mode = "replace" } = req.body;
      const rawList = Array.isArray(incomingChannels)
        ? incomingChannels
        : (incomingChannels?.channels || incomingChannels?.data || incomingChannels?.items || []);

      if (!Array.isArray(rawList) || rawList.length === 0) {
        return res.status(400).json({ error: "Массив каналов пуст или передан в неверном формате" });
      }

      const normalized: Channel[] = rawList.map((item: any, idx: number) => {
        const rawSubs = Number(item.subscribers_count ?? item.subscribers ?? item.subs ?? item.followers ?? 0);
        const rawViews = Number(item.views_30d ?? item.views ?? item.views_count ?? item.reach ?? 0);
        const rawVi = Number(item.avg_viral_index ?? item.viral_index ?? item.vi ?? (rawSubs > 0 && rawViews > 0 ? +(rawViews / (rawSubs * 3)).toFixed(2) : 1.2));
        const rawEr = Number(item.er_percent ?? item.er ?? 2.5);
        const dzenId = String(item.dzen_id || item.channel_id || item.id || item.handle || `channel_${idx + 1}`).replace(/^https?:\/\/dzen\.ru\//, '').replace(/^\/@?/, '');

        return {
          id: idx + 1,
          dzen_id: dzenId,
          name: item.name || item.title || item.channel_name || dzenId,
          url: item.url || item.dzen_url || `https://dzen.ru/${dzenId}`,
          niche: item.niche || item.category || item.topic || "Общее",
          avatar_url: item.avatar_url || item.avatar || undefined,
          description: item.description || item.bio || "",
          subscribers_count: isNaN(rawSubs) ? 0 : rawSubs,
          views_30d: isNaN(rawViews) ? 0 : rawViews,
          er_percent: isNaN(rawEr) ? 0 : +rawEr.toFixed(2),
          avg_viral_index: isNaN(rawVi) ? 1.0 : +rawVi.toFixed(2),
          growth_velocity_daily: Number(item.growth_velocity_daily ?? item.velocity ?? Math.round((rawSubs || 100) * 0.001)),
          subscribers_growth_30d: Number(item.subscribers_growth_30d ?? item.growth_30d ?? Math.round((rawSubs || 100) * 0.03)),
          readability_percent: Number(item.readability_percent ?? 85.0),
          telegram_contact: item.telegram_contact || item.telegram || item.tg ? String(item.telegram_contact || item.telegram || item.tg) : null,
          email_contact: item.email_contact || item.email || null,
          vk_contact: item.vk_contact || item.vk || null,
          is_verified: Boolean(item.is_verified ?? (item.rates != null || rawSubs > 50000)),
          rates: item.rates || {
            post_price: Math.max(5000, Math.round(rawSubs * 0.08)),
            native_price: Math.max(10000, Math.round(rawSubs * 0.15)),
            video_price: Math.max(15000, Math.round(rawSubs * 0.25)),
            tax_status: "ИП (УСН 6%)"
          },
          demographics: item.demographics || {
            gender_m: 48,
            gender_f: 52,
            ages: { "18-24": 12, "25-34": 38, "35-44": 32, "45-54": 14, "55+": 4 },
            top_cities: [
              { name: "Москва", percent: 34 },
              { name: "Санкт-Петербург", percent: 18 },
              { name: "Екатеринбург", percent: 8 }
            ],
            devices: { mobile: 82, desktop: 18 }
          },
          top_articles: Array.isArray(item.top_articles) && item.top_articles.length > 0
            ? item.top_articles
            : [
                {
                  title: `Главная статья канала ${item.name || dzenId}`,
                  views: Math.round((rawViews || 5000) * 0.4),
                  likes: Math.round((rawViews || 5000) * 0.02),
                  comments: Math.round((rawViews || 5000) * 0.002),
                  viral_index: rawVi
                }
              ]
        };
      });

      if (mode === "append") {
        const existingIds = new Set(channelsStore.map(c => c.dzen_id));
        let addedCount = 0;
        normalized.forEach(ch => {
          if (!existingIds.has(ch.dzen_id)) {
            ch.id = channelsStore.length + 1;
            channelsStore.push(ch);
            addedCount++;
          }
        });
        return res.json({
          status: "success",
          mode: "append",
          imported_count: addedCount,
          total_count: channelsStore.length,
          channels: channelsStore
        });
      } else {
        // Replace
        channelsStore.length = 0;
        channelsStore.push(...normalized);
        return res.json({
          status: "success",
          mode: "replace",
          imported_count: normalized.length,
          total_count: channelsStore.length,
          channels: channelsStore
        });
      }
    } catch (err: any) {
      console.error("Error importing database:", err);
      res.status(500).json({ error: "Ошибка при обработке базы: " + err.message });
    }
  });

  // 12. Reset to seed demo database
  app.post("/api/v1/admin/reset-seed", (_req, res) => {
    channelsStore.length = 0;
    channelsStore.push(...INITIAL_CHANNELS);
    res.json({
      status: "success",
      total_count: channelsStore.length,
      channels: channelsStore
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Authentication & Email Verification API
  // ---------------------------------------------------------------------------

  // A. Start Registration (Author or Marketer) -> Generate Confirmation Code & Send Simulated Email
  app.post("/api/v1/auth/register", (req, res) => {
    try {
      const {
        email,
        password,
        name,
        role = '💼 Маркетолог',
        telegram,
        company,
        website,
        budgetTier,
        paymentMethod,
        channelId,
        dzenId,
        channelName,
        taxStatus,
        rates
      } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "Укажите корректный адрес электронной почты" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user is already registered and verified
      const existingUser = registeredUsersStore.find(u => u.email.toLowerCase() === normalizedEmail);
      if (existingUser && existingUser.emailVerified) {
        return res.status(409).json({ 
          error: "Пользователь с таким email уже зарегистрирован и подтвержден. Пожалуйста, выполните вход.",
          canLogin: true 
        });
      }

      // Generate 6-digit confirmation code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

      const displayName = name?.trim() || (role === '💼 Маркетолог' ? 'Маркетолог' : 'Автор Дзена');

      const simulatedEmail = createSimulatedEmail(
        normalizedEmail,
        displayName,
        role,
        code,
        token
      );

      const pending: PendingRegistration = {
        id: regId,
        email: normalizedEmail,
        code,
        token,
        role,
        name: displayName,
        password,
        telegram,
        company,
        website,
        budgetTier,
        paymentMethod,
        channelId: channelId ? Number(channelId) : undefined,
        dzenId,
        channelName,
        taxStatus,
        rates,
        createdAt: Date.now(),
        expiresAt,
        simulatedEmail
      };

      pendingRegistrationsMap.set(normalizedEmail, pending);

      console.log(`[AUTH] Registration started for ${normalizedEmail} (${role}). Verification code: ${code}`);

      res.status(200).json({
        status: "verification_sent",
        message: `Код подтверждения отправлен на почту ${normalizedEmail}`,
        email: normalizedEmail,
        verificationId: regId,
        role,
        expiresInSeconds: 900,
        simulatedEmail
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Ошибка при регистрации: " + err.message });
    }
  });

  // B. Verify Confirmation Code or Token -> Finalize Account Activation
  app.post("/api/v1/auth/verify-email", (req, res) => {
    try {
      const { email, code, token } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Не указан email" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const pending = pendingRegistrationsMap.get(normalizedEmail);

      if (!pending) {
        // Maybe already verified?
        const existing = registeredUsersStore.find(u => u.email.toLowerCase() === normalizedEmail);
        if (existing && existing.emailVerified) {
          return res.json({
            status: "success",
            message: "Аккаунт уже подтвержден!",
            user: existing
          });
        }
        return res.status(400).json({ error: "Запрос на регистрацию не найден или истек. Запросите код повторно." });
      }

      if (Date.now() > pending.expiresAt) {
        pendingRegistrationsMap.delete(normalizedEmail);
        return res.status(400).json({ error: "Срок действия кода истек (15 минут). Запросите новый код." });
      }

      const isCodeMatch = code && pending.code === code.trim();
      const isTokenMatch = token && pending.token === token.trim();

      if (!isCodeMatch && !isTokenMatch) {
        return res.status(400).json({ error: "Неверный код подтверждения. Проверьте почту и введите 6 цифр." });
      }

      // Successful verification! Create or update registered user
      let channelIdToLink = pending.channelId;
      let dzenIdToLink = pending.dzenId;

      // If author registered with channel data, ensure channel in channelsStore is marked verified or created
      if (pending.role === '✍️ Автор канала') {
        if (channelIdToLink) {
          const existingChannel = channelsStore.find(c => c.id === channelIdToLink);
          if (existingChannel) {
            existingChannel.is_verified = true;
            if (pending.rates) existingChannel.rates = pending.rates;
            if (pending.taxStatus) {
              existingChannel.rates = existingChannel.rates || {
                post_price: 35000,
                native_price: 60000,
                video_price: 90000,
                tax_status: pending.taxStatus
              };
              existingChannel.rates.tax_status = pending.taxStatus;
            }
          }
        } else if (dzenIdToLink || pending.channelName) {
          // create channel in store
          const newChId = channelsStore.length + 1;
          const cleanDzenId = (dzenIdToLink || pending.channelName || `creator_${newChId}`).replace(/^https?:\/\/dzen\.ru\//, '').replace(/^\/@?/, '');
          const newChannel: Channel = {
            id: newChId,
            dzen_id: cleanDzenId,
            name: pending.channelName || cleanDzenId,
            url: `https://dzen.ru/${cleanDzenId}`,
            niche: "Блоги авторов",
            subscribers_count: 15000,
            views_30d: 120000,
            er_percent: 4.2,
            avg_viral_index: 2.1,
            growth_velocity_daily: 45,
            subscribers_growth_30d: 1350,
            readability_percent: 88.0,
            is_verified: true,
            email_contact: normalizedEmail,
            telegram_contact: pending.telegram || null,
            rates: pending.rates || {
              post_price: 30000,
              native_price: 55000,
              video_price: 85000,
              tax_status: pending.taxStatus || "Самозанятый (НПД)"
            }
          };
          channelsStore.unshift(newChannel);
          channelIdToLink = newChId;
          dzenIdToLink = cleanDzenId;
        }
      }

      const registeredUser: RegisteredUser = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        name: pending.name,
        role: pending.role,
        telegram: pending.telegram,
        emailVerified: true,
        registeredAt: new Date().toISOString(),
        company: pending.company,
        website: pending.website,
        budgetTier: pending.budgetTier,
        paymentMethod: pending.paymentMethod,
        channelId: channelIdToLink,
        dzenId: dzenIdToLink,
        channelName: pending.channelName,
        taxStatus: pending.taxStatus,
        rates: pending.rates,
        verificationMethod: 'bio_code',
        isChannelClaimed: true
      };

      // Remove from existing store if previously present
      const existIdx = registeredUsersStore.findIndex(u => u.email.toLowerCase() === normalizedEmail);
      if (existIdx >= 0) {
        registeredUsersStore[existIdx] = registeredUser;
      } else {
        registeredUsersStore.unshift(registeredUser);
      }

      // Cleanup pending
      pendingRegistrationsMap.delete(normalizedEmail);

      console.log(`[AUTH] Email verified successfully for ${normalizedEmail}! User activated as ${pending.role}.`);

      res.status(200).json({
        status: "success",
        message: "Email успешно подтвержден! Аккаунт активирован.",
        user: registeredUser
      });
    } catch (err: any) {
      console.error("Email verification error:", err);
      res.status(500).json({ error: "Ошибка подтверждения email: " + err.message });
    }
  });

  // C. Resend Confirmation Email Code
  app.post("/api/v1/auth/resend-code", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Не указан email" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const pending = pendingRegistrationsMap.get(normalizedEmail);

      if (!pending) {
        return res.status(404).json({ error: "Активная регистрация для этого email не найдена. Пожалуйста, заполните форму заново." });
      }

      // Generate new 6-digit code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const newExpiresAt = Date.now() + 15 * 60 * 1000;

      pending.code = newCode;
      pending.token = newToken;
      pending.expiresAt = newExpiresAt;
      pending.simulatedEmail = createSimulatedEmail(
        normalizedEmail,
        pending.name,
        pending.role,
        newCode,
        newToken
      );

      console.log(`[AUTH] Resent code for ${normalizedEmail}: ${newCode}`);

      res.json({
        status: "resend_success",
        message: `Новый проверочный код отправлен на ${normalizedEmail}`,
        email: normalizedEmail,
        expiresInSeconds: 900,
        simulatedEmail: pending.simulatedEmail
      });
    } catch (err: any) {
      console.error("Resend code error:", err);
      res.status(500).json({ error: "Ошибка повторной отправки кода: " + err.message });
    }
  });

  // D. User Login
  app.post("/api/v1/auth/login", (req, res) => {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Укажите email" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = registeredUsersStore.find(u => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      if (role && user.role !== role) {
        user.role = role;
      }
      return res.json({
        status: "success",
        user
      });
    }

    // Default auto-provision session for demo or seamless experience
    const newUser: RegisteredUser = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: role || '💼 Маркетолог',
      emailVerified: true,
      registeredAt: new Date().toISOString()
    };
    registeredUsersStore.unshift(newUser);

    res.json({
      status: "success",
      user: newUser
    });
  });

  // E. Get all registered users (for Admin monitoring)
  app.get("/api/v1/auth/users", (_req, res) => {
    res.json({
      total: registeredUsersStore.length,
      users: registeredUsersStore
    });
  });

  // ---------------------------------------------------------------------------
  // Vite Middleware & Static Serving
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡ Dzen Analytics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
