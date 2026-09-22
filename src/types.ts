export interface Channel {
  id: number;
  dzen_id: string;
  name: string;
  url: string;
  niche: string;
  avatar_url?: string;
  description?: string;
  telegram_contact?: string | null;
  email_contact?: string | null;
  vk_contact?: string | null;
  subscribers_count: number;
  views_30d: number;
  er_percent: number;
  avg_viral_index: number;
  growth_velocity_daily: number;
  subscribers_growth_30d: number;
  readability_percent: number;
  is_verified?: boolean;
  top_articles?: Article[];
  demographics?: Demographics;
  rates?: AuthorRates;
}

export interface Article {
  title: string;
  views: number;
  likes: number;
  comments: number;
  viral_index: number;
  url?: string;
  published_date?: string;
}

export interface Demographics {
  gender_m: number; // percentage, e.g. 45
  gender_f: number; // percentage, e.g. 55
  ages: { [bracket: string]: number }; // e.g. '18-24': 10, '25-34': 35, etc.
  top_cities: { name: string; percent: number }[];
  devices: { mobile: number; desktop: number };
}

export interface AuthorRates {
  post_price: number;
  native_price: number;
  video_price: number;
  tax_status: 'Самозанятый (НПД)' | 'ИП (УСН 6%)' | 'ООО / С НДС' | 'Физлицо';
  is_custom_set?: boolean; // true if author personally verified and configured prices
}

export interface ChannelHistoryPoint {
  date: string;
  subscribers_count: number;
  views_30d: number;
  er_percent: number;
  avg_viral_index: number;
}

export interface Deal {
  id: string;
  channel_id: number;
  channel_name: string;
  dzen_id: string;
  status: 'Контакт' | 'Переговоры' | 'Согласовано' | 'Оплачено' | 'Вышло' | 'Завершено';
  price: number;
  format: 'Пост' | 'Нативная статья' | 'Видеоролик';
  note: string;
  utm: string;
  erid: string;
  deadline?: string;
  created_at: string;
}

export interface FilterState {
  search: string;
  niche: string;
  preset: string;
  minSubscribers: number;
  maxSubscribers: number;
  minViews: number;
  minEr: number;
  minVi: number;
  hasTg: boolean;
  hasEmail: boolean;
  sortBy: 'subscribers' | 'views' | 'er' | 'viral_index' | 'growth';
  sortOrder: 'asc' | 'desc';
}

export interface DzenChallenge {
  token: string;
  channelId?: number;
  dzenId: string;
  channelUrl: string;
  expiresAt: number;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
  };
}

export interface DzenVerificationResult {
  is_verified: boolean;
  channel_url: string;
  token: string;
  extracted_description?: string;
  error_message?: string;
  method?: 'live_scrape' | 'cache' | 'simulated';
  latency_ms?: number;
  checked_at?: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: '💼 Маркетолог' | '✍️ Автор канала' | '🛠️ Администратор' | '🌐 Каталог';
  telegram?: string;
  emailVerified: boolean;
  registeredAt: string;
  
  // Marketer specific profile
  company?: string;
  website?: string;
  budgetTier?: string;
  paymentMethod?: string;

  // Author specific profile
  channelId?: number;
  dzenId?: string;
  dzenUrl?: string;
  channelName?: string;
  taxStatus?: 'Самозанятый (НПД)' | 'ИП (УСН 6%)' | 'ООО / С НДС' | 'Физлицо';
  rates?: AuthorRates;
  verificationMethod?: 'bio_code' | 'yandex_oauth' | 'support_request';
  verificationCode?: string;
  isChannelClaimed?: boolean;
}

export interface UserSession {
  email: string;
  name?: string;
  companyOrBlog?: string;
  phoneOrTg?: string;
  role: '🌐 Каталог' | '💼 Маркетолог' | '✍️ Автор канала' | '🛠️ Администратор';
  isAuthenticated: boolean;
  emailVerified?: boolean;
  authorChannelId?: number; // Linked channel id for author
  verificationMethod?: 'bio_code' | 'yandex_oauth' | 'support_request';
  verificationCode?: string;
  isChannelClaimed?: boolean;
  registeredUser?: RegisteredUser;
}
