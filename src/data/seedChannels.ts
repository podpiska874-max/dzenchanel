import { Channel } from '../types';

export const NICHES_LIST = [
  "Все ниши",
  "Новости и общество",
  "Кулинария и еда",
  "Политика",
  "Финансы, бизнес и недвижимость",
  "Наука и образование",
  "Кино, сериалы и шоу-бизнес",
  "IT и гаджеты",
  "Психология",
  "Авто",
  "Путешествия",
  "Красота и стиль",
  "Дом, ремонт и DIY",
  "Фитнес и спорт",
  "Рукоделие и хобби",
  "Эксперимент / Виральность"
];

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 1,
    dzen_id: "kpru",
    name: "KP.RU: Комсомольская правда",
    url: "https://dzen.ru/kpru",
    niche: "Новости и общество",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/271828/pub_59316b1ed7d0a653a549d117_6a05017a7a176c57a896e3eb/xxh",
    description: "Официальный Дзен-канал крупнейшего мультимедийного издания Комсомольская правда: оперативные новости, сенсации и расследования.",
    telegram_contact: "@kpru",
    email_contact: "reklama@kp.ru",
    vk_contact: "https://vk.com/kpru",
    subscribers_count: 2300000,
    views_30d: 49700000,
    er_percent: 2.1,
    avg_viral_index: 21.6,
    growth_velocity_daily: 525,
    subscribers_growth_30d: 15765,
    readability_percent: 143.0,
    is_verified: true,
    rates: {
      post_price: 150000,
      native_price: 240000,
      video_price: 320000,
      tax_status: "ООО / С НДС"
    },
    demographics: {
      gender_m: 48,
      gender_f: 52,
      ages: { "18-24": 8, "25-34": 24, "35-44": 36, "45-54": 22, "55+": 10 },
      top_cities: [{ name: "Москва", percent: 34 }, { name: "Санкт-Петербург", percent: 18 }, { name: "Екатеринбург", percent: 7 }],
      devices: { mobile: 78, desktop: 22 }
    },
    top_articles: [
      { title: "Тайны перевала Дятлова: новые факты от следователей спустя полвека", views: 1820000, likes: 24100, comments: 3900, viral_index: 28.4 },
      { title: "Что изменится в пенсиях и выплатах с 1 числа следующего месяца", views: 1450000, likes: 18900, comments: 5100, viral_index: 22.1 },
      { title: "Неожиданные находки археологов на дне Волги шокировали историков", views: 980000, likes: 11200, comments: 1400, viral_index: 15.3 }
    ]
  },
  {
    id: 2,
    dzen_id: "aifru",
    name: "Аргументы и факты – aif.ru",
    url: "https://dzen.ru/aifru",
    niche: "Новости и общество",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/1597769/pub_5a0c48cf168a91bf9190bbef_5cc2dd3224176a00ae4fe496/xxh",
    description: "Аргументы и Факты: главные новости России и мира, авторитетная аналитика, полезные советы для жизни.",
    telegram_contact: "@aifonline",
    email_contact: "ad@aif.ru",
    vk_contact: "https://vk.com/aif_ru",
    subscribers_count: 1700000,
    views_30d: 38600000,
    er_percent: 2.4,
    avg_viral_index: 22.7,
    growth_velocity_daily: 697,
    subscribers_growth_30d: 20912,
    readability_percent: 193.0,
    is_verified: true,
    rates: {
      post_price: 120000,
      native_price: 195000,
      video_price: 280000,
      tax_status: "ООО / С НДС"
    },
    demographics: {
      gender_m: 46,
      gender_f: 54,
      ages: { "18-24": 6, "25-34": 22, "35-44": 38, "45-54": 24, "55+": 10 },
      top_cities: [{ name: "Москва", percent: 32 }, { name: "Санкт-Петербург", percent: 16 }, { name: "Новосибирск", percent: 6 }],
      devices: { mobile: 74, desktop: 26 }
    },
    top_articles: [
      { title: "Главные ошибки дачников при подготовке почвы к холодам", views: 890000, likes: 14500, comments: 2100, viral_index: 18.2 },
      { title: "Как защитить сбережения от инфляции в 2026 году: разбор экономиста", views: 1120000, likes: 16800, comments: 3400, viral_index: 24.5 }
    ]
  },
  {
    id: 3,
    dzen_id: "mkru",
    name: "Московский Комсомолец – МК",
    url: "https://dzen.ru/mkru",
    niche: "Новости и общество",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/212539/pub_5afaef0257906a460993e0f9_5b4c689d8055eb00a9662eff/xxh",
    description: "МК: острые репортажи, эксклюзивные интервью, криминальная хроника и политические инсайды.",
    telegram_contact: "@mk_ru",
    email_contact: "adv@mk.ru",
    vk_contact: "https://vk.com/mkru",
    subscribers_count: 1600000,
    views_30d: 37650000,
    er_percent: 1.9,
    avg_viral_index: 23.5,
    growth_velocity_daily: 852,
    subscribers_growth_30d: 25586,
    readability_percent: 32.0,
    is_verified: true,
    rates: {
      post_price: 110000,
      native_price: 180000,
      video_price: 260000,
      tax_status: "ООО / С НДС"
    },
    demographics: {
      gender_m: 53,
      gender_f: 47,
      ages: { "18-24": 9, "25-34": 28, "35-44": 35, "45-54": 18, "55+": 10 },
      top_cities: [{ name: "Москва", percent: 45 }, { name: "Санкт-Петербург", percent: 14 }, { name: "Казань", percent: 5 }],
      devices: { mobile: 82, desktop: 18 }
    },
    top_articles: [
      { title: "Срочный брифинг: новые заявления международных аналитиков", views: 2400000, likes: 31000, comments: 8900, viral_index: 45.1 },
      { title: "За кулисами судебного процесса века: что скрывали свидетели", views: 1650000, likes: 21300, comments: 4500, viral_index: 31.2 }
    ]
  },
  {
    id: 4,
    dzen_id: "georgiy_kavkaz",
    name: "ГЕОРГИЙ КАВКАЗ",
    url: "https://dzen.ru/georgiy_kavkaz",
    niche: "Кулинария и еда",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/271828/pub_5ec5427d1e1186547b9231e0_693d31926547a402550913bd/xxh",
    description: "Авторский канал Георгия Кавказ: блюда на мангале, казан, традиционные кавказские рецепты и мужская кулинария на природе.",
    telegram_contact: "@georgiy_kavkaz",
    email_contact: "contact@kavkaz.ru",
    vk_contact: null,
    subscribers_count: 761800,
    views_30d: 6263000,
    er_percent: 4.8,
    avg_viral_index: 8.2,
    growth_velocity_daily: 42,
    subscribers_growth_30d: 1257,
    readability_percent: 179.0,
    is_verified: true,
    rates: {
      post_price: 65000,
      native_price: 110000,
      video_price: 180000,
      tax_status: "ИП (УСН 6%)"
    },
    demographics: {
      gender_m: 68,
      gender_f: 32,
      ages: { "18-24": 12, "25-34": 38, "35-44": 32, "45-54": 14, "55+": 4 },
      top_cities: [{ name: "Москва", percent: 28 }, { name: "Краснодар", percent: 14 }, { name: "Ростов-на-Дону", percent: 11 }],
      devices: { mobile: 86, desktop: 14 }
    },
    top_articles: [
      { title: "Барашек на вертеле с дикими травами: секрет мягчайшего мяса", views: 820000, likes: 45000, comments: 2300, viral_index: 12.8 },
      { title: "Настоящий узбекский плов в 50-литровом казане — рецепт от шефа", views: 940000, likes: 52000, comments: 3100, viral_index: 14.6 }
    ]
  },
  {
    id: 5,
    dzen_id: "seichasprigotovim",
    name: "Сейчас Приготовим!",
    url: "https://dzen.ru/seichasprigotovim",
    niche: "Кулинария и еда",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/271828/pub_5ec5427d1e1186547b9231e0_693d31926547a402550913bd/xxh",
    description: "Простые и быстрые пошаговые рецепты на каждый день из доступных продуктов. Видео-рецепты, салаты, выпечка и горячее.",
    telegram_contact: "@seichas_gotovim",
    email_contact: "prigotovim@dzen.ru",
    vk_contact: "https://vk.com/prigotovim_dzen",
    subscribers_count: 512000,
    views_30d: 5900000,
    er_percent: 3.6,
    avg_viral_index: 11.5,
    growth_velocity_daily: 180,
    subscribers_growth_30d: 5400,
    readability_percent: 135.0,
    is_verified: true,
    rates: {
      post_price: 45000,
      native_price: 75000,
      video_price: 120000,
      tax_status: "Самозанятый (НПД)"
    },
    demographics: {
      gender_m: 22,
      gender_f: 78,
      ages: { "18-24": 10, "25-34": 30, "35-44": 36, "45-54": 18, "55+": 6 },
      top_cities: [{ name: "Москва", percent: 26 }, { name: "Санкт-Петербург", percent: 14 }, { name: "Нижний Новгород", percent: 7 }],
      devices: { mobile: 89, desktop: 11 }
    },
    top_articles: [
      { title: "За 10 минут из 3 яиц и лаваша: завтрак, который просят каждый день", views: 1250000, likes: 62000, comments: 1900, viral_index: 24.8 }
    ]
  },
  {
    id: 6,
    dzen_id: "sivakova",
    name: "Юридические тонкости (Ирина Сивакова)",
    url: "https://dzen.ru/sivakova",
    niche: "Финансы, бизнес и недвижимость",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/1520972/pub_5ddd723addb0193a8f324102_6152378f37e60d2012a8dc32/xxh",
    description: "Кандидат юридических наук Ирина Сивакова простым языком о пенсиях, налогах, ЖКХ, недвижимости и правах граждан.",
    telegram_contact: "@sivakova_law",
    email_contact: "advokat_sivakova@mail.ru",
    vk_contact: null,
    subscribers_count: 885000,
    views_30d: 7400000,
    er_percent: 3.9,
    avg_viral_index: 8.4,
    growth_velocity_daily: 210,
    subscribers_growth_30d: 6300,
    readability_percent: 160.0,
    is_verified: true,
    rates: {
      post_price: 55000,
      native_price: 95000,
      video_price: 140000,
      tax_status: "ИП (УСН 6%)"
    },
    demographics: {
      gender_m: 42,
      gender_f: 58,
      ages: { "18-24": 4, "25-34": 18, "35-44": 34, "45-54": 30, "55+": 14 },
      top_cities: [{ name: "Москва", percent: 29 }, { name: "Санкт-Петербург", percent: 15 }, { name: "Самара", percent: 8 }],
      devices: { mobile: 76, desktop: 24 }
    },
    top_articles: [
      { title: "Новый закон о наследстве: почему родственники могут остаться ни с чем", views: 980000, likes: 38000, comments: 4200, viral_index: 12.2 },
      { title: "Счетчики воды и света: за что управляющая компания больше не имеет права штрафовать", views: 1140000, likes: 45000, comments: 3900, viral_index: 14.1 }
    ]
  },
  {
    id: 7,
    dzen_id: "popular_science",
    name: "Популярная наука & Космос",
    url: "https://dzen.ru/popular_science",
    niche: "Наука и образование",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/246004/pub_5e8e0e1326f0d01d71a664d9_60d0381f290f195640c6a6bd/xxh",
    description: "Увлекательно о Вселенной, физике квантов, технологиях будущего, биологии и загадках цивилизации.",
    telegram_contact: "@pop_science_ru",
    email_contact: "popscience@dzen.ru",
    vk_contact: "https://vk.com/popscience",
    subscribers_count: 420000,
    views_30d: 6800000,
    er_percent: 5.1,
    avg_viral_index: 16.2,
    growth_velocity_daily: 340,
    subscribers_growth_30d: 10200,
    readability_percent: 180.0,
    is_verified: true,
    rates: {
      post_price: 35000,
      native_price: 60000,
      video_price: 90000,
      tax_status: "Самозанятый (НПД)"
    },
    demographics: {
      gender_m: 65,
      gender_f: 35,
      ages: { "18-24": 22, "25-34": 44, "35-44": 22, "45-54": 9, "55+": 3 },
      top_cities: [{ name: "Москва", percent: 35 }, { name: "Санкт-Петербург", percent: 20 }, { name: "Новосибирск", percent: 9 }],
      devices: { mobile: 70, desktop: 30 }
    },
    top_articles: [
      { title: "Телескоп Джеймс Уэбб зафиксировал сигнал на краю наблюдаемой Вселенной", views: 1850000, likes: 98000, comments: 6400, viral_index: 44.0 },
      { title: "Что произойдет с телом человека в черной дыре: точный расчет физиков", views: 1220000, likes: 64000, comments: 3800, viral_index: 29.0 }
    ]
  },
  {
    id: 8,
    dzen_id: "zona_komforta",
    name: "Зона Комфорта (Психология)",
    url: "https://dzen.ru/zona_komforta",
    niche: "Психология",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/271828/pub_62ab713ee692af72c0444891_659e6bbdb0a1650267060b3c/xxh",
    description: "Практическая психология, избавление от тревоги, построение личных границ и преодоление выгорания.",
    telegram_contact: "@zonakomforta",
    email_contact: "zona@dzen.ru",
    vk_contact: null,
    subscribers_count: 484700,
    views_30d: 2700000,
    er_percent: 2.8,
    avg_viral_index: 5.57,
    growth_velocity_daily: 95,
    subscribers_growth_30d: 2850,
    readability_percent: 92.0,
    is_verified: false,
    rates: {
      post_price: 32000,
      native_price: 55000,
      video_price: 80000,
      tax_status: "Самозанятый (НПД)"
    },
    demographics: {
      gender_m: 25,
      gender_f: 75,
      ages: { "18-24": 18, "25-34": 42, "35-44": 28, "45-54": 9, "55+": 3 },
      top_cities: [{ name: "Москва", percent: 38 }, { name: "Санкт-Петербург", percent: 22 }, { name: "Екатеринбург", percent: 6 }],
      devices: { mobile: 88, desktop: 12 }
    },
    top_articles: [
      { title: "5 фраз манипуляторов, которые нельзя оставлять без ответа", views: 760000, likes: 31000, comments: 2400, viral_index: 15.6 }
    ]
  },
  {
    id: 9,
    dzen_id: "viral_anomaly_33k",
    name: "Виральный Аномальный Феномен",
    url: "https://dzen.ru/viral_anomaly_33k",
    niche: "Эксперимент / Виральность",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/201842/pub_5a99634a55876b8ea6dbc4b4_5b798a5f26248100ac4e26c5/xxh",
    description: "Экспериментальный тестовый канал: изучение аномальных рекомендаций алгоритма Дзена и взрывного роста.",
    telegram_contact: "@viral_anomaly",
    email_contact: "viral@dzen.ru",
    vk_contact: null,
    subscribers_count: 3300,
    views_30d: 5461000,
    er_percent: 0.9,
    avg_viral_index: 165.4,
    growth_velocity_daily: 95,
    subscribers_growth_30d: 2850,
    readability_percent: 910.0,
    is_verified: false,
    rates: {
      post_price: 15000,
      native_price: 30000,
      video_price: 45000,
      tax_status: "Физлицо"
    },
    demographics: {
      gender_m: 50,
      gender_f: 50,
      ages: { "18-24": 30, "25-34": 40, "35-44": 20, "45-54": 7, "55+": 3 },
      top_cities: [{ name: "Москва", percent: 25 }, { name: "Краснодар", percent: 12 }, { name: "Уфа", percent: 8 }],
      devices: { mobile: 94, desktop: 6 }
    },
    top_articles: [
      { title: "Алгоритмический взрыв: 5 млн показов за 48 часов без единого рубля рекламы", views: 3200000, likes: 29000, comments: 3900, viral_index: 969.0 }
    ]
  },
  {
    id: 10,
    dzen_id: "auto_master",
    name: "АвтоЭксперт & Тест-Драйв",
    url: "https://dzen.ru/auto_master",
    niche: "Авто",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/212539/pub_6230e3494964be3762e03556_62319a61fb33b10fa5429518/xxh",
    description: "Честные обзоры китайских новинок, подержанных авто до 1 млн рублей, тесты надежности и юридические советы ГИБДД.",
    telegram_contact: "@automaster_dzen",
    email_contact: "auto@dzen.ru",
    vk_contact: "https://vk.com/automaster",
    subscribers_count: 345000,
    views_30d: 4200000,
    er_percent: 4.2,
    avg_viral_index: 12.1,
    growth_velocity_daily: 220,
    subscribers_growth_30d: 6600,
    readability_percent: 124.0,
    is_verified: true,
    rates: {
      post_price: 38000,
      native_price: 65000,
      video_price: 110000,
      tax_status: "ИП (УСН 6%)"
    },
    demographics: {
      gender_m: 86,
      gender_f: 14,
      ages: { "18-24": 12, "25-34": 42, "35-44": 32, "45-54": 11, "55+": 3 },
      top_cities: [{ name: "Москва", percent: 30 }, { name: "Санкт-Петербург", percent: 15 }, { name: "Казань", percent: 8 }],
      devices: { mobile: 82, desktop: 18 }
    },
    top_articles: [
      { title: "Разобрали популярный китайский кроссовер после 100 000 км: что стало с мотором", views: 980000, likes: 41000, comments: 5300, viral_index: 28.4 }
    ]
  },
  {
    id: 11,
    dzen_id: "tech_insider",
    name: "Tech Insider | Гаджеты и ИИ",
    url: "https://dzen.ru/tech_insider",
    niche: "IT и гаджеты",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/271828/pub_5bfac514414f1b00a938c5da_6988cac0224f0e36c2fc8df4/xxh",
    description: "Глубокие обзоры нейросетей, смартфонов, ноутбуков и железа. Как технологии меняют бизнес и повседневную жизнь.",
    telegram_contact: "@techinsider_ru",
    email_contact: "pr@techinsider.ru",
    vk_contact: null,
    subscribers_count: 289000,
    views_30d: 3950000,
    er_percent: 4.6,
    avg_viral_index: 13.6,
    growth_velocity_daily: 190,
    subscribers_growth_30d: 5700,
    readability_percent: 155.0,
    is_verified: true,
    rates: {
      post_price: 35000,
      native_price: 60000,
      video_price: 95000,
      tax_status: "ИП (УСН 6%)"
    },
    demographics: {
      gender_m: 76,
      gender_f: 24,
      ages: { "18-24": 28, "25-34": 46, "35-44": 18, "45-54": 6, "55+": 2 },
      top_cities: [{ name: "Москва", percent: 42 }, { name: "Санкт-Петербург", percent: 20 }, { name: "Новосибирск", percent: 6 }],
      devices: { mobile: 65, desktop: 35 }
    },
    top_articles: [
      { title: "Новая модель Gemini 2.5 шокировала разработчиков скоростью решения задач", views: 820000, likes: 41000, comments: 3200, viral_index: 28.3 }
    ]
  },
  {
    id: 12,
    dzen_id: "travel_guide",
    name: "Поехали! Гид по России и миру",
    url: "https://dzen.ru/travel_guide",
    niche: "Путешествия",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/1520972/pub_5e8590de64a4b71b3b05d47e_5e85977f7efe4909b78417f0/xxh",
    description: "Необычные маршруты по Алтаю, Байкалу, Дагестану, Камчатке и бюджетные путешествия по всему миру.",
    telegram_contact: "@poehali_travel",
    email_contact: "travel@dzen.ru",
    vk_contact: "https://vk.com/poehali_guide",
    subscribers_count: 215000,
    views_30d: 3100000,
    er_percent: 4.9,
    avg_viral_index: 14.4,
    growth_velocity_daily: 140,
    subscribers_growth_30d: 4200,
    readability_percent: 168.0,
    is_verified: true,
    rates: {
      post_price: 28000,
      native_price: 48000,
      video_price: 75000,
      tax_status: "Самозанятый (НПД)"
    },
    demographics: {
      gender_m: 44,
      gender_f: 56,
      ages: { "18-24": 15, "25-34": 42, "35-44": 28, "45-54": 11, "55+": 4 },
      top_cities: [{ name: "Москва", percent: 36 }, { name: "Санкт-Петербург", percent: 22 }, { name: "Казань", percent: 7 }],
      devices: { mobile: 84, desktop: 16 }
    },
    top_articles: [
      { title: "Забытая деревня в горах Дагестана: почему сюда едут миллионеры со всей страны", views: 920000, likes: 49000, comments: 2700, viral_index: 42.7 }
    ]
  },
  {
    id: 13,
    dzen_id: "thevoicemag",
    name: "VOICE (бывший Cosmopolitan)",
    url: "https://dzen.ru/thevoicemag",
    niche: "Красота и стиль",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/271828/pub_59316b1ed7d0a653a549d117_6a05017a7a176c57a896e3eb/xxh",
    description: "Главный женский глянец: тренды моды, бьюти-новинки, психология отношений, истории звезд и карьера.",
    telegram_contact: "@thevoicemag_ru",
    email_contact: "sales@thevoicemag.ru",
    vk_contact: "https://vk.com/thevoicemag",
    subscribers_count: 980000,
    views_30d: 14200000,
    er_percent: 3.1,
    avg_viral_index: 14.4,
    growth_velocity_daily: 310,
    subscribers_growth_30d: 9300,
    readability_percent: 110.0,
    is_verified: true,
    rates: {
      post_price: 90000,
      native_price: 150000,
      video_price: 210000,
      tax_status: "ООО / С НДС"
    },
    demographics: {
      gender_m: 8,
      gender_f: 92,
      ages: { "18-24": 20, "25-34": 46, "35-44": 24, "45-54": 8, "55+": 2 },
      top_cities: [{ name: "Москва", percent: 40 }, { name: "Санкт-Петербург", percent: 20 }, { name: "Краснодар", percent: 8 }],
      devices: { mobile: 91, desktop: 9 }
    },
    top_articles: [
      { title: "5 антитрендов осени 2026: что выбросить из гардероба немедленно", views: 1100000, likes: 34000, comments: 2800, viral_index: 11.2 }
    ]
  },
  {
    id: 14,
    dzen_id: "fishing_dysha_polkilo",
    name: "РЫБАЛКА С МИХАЛЫЧЕМ",
    url: "https://dzen.ru/fishing_dysha_polkilo",
    niche: "Рукоделие и хобби",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/201842/pub_5a99634a55876b8ea6dbc4b4_5b798a5f26248100ac4e26c5/xxh",
    description: "Хитрости ловли щуки, судака и карпа. Снасти своими руками, прикормка и секретные места рек и озер.",
    telegram_contact: "@mihalych_fish",
    email_contact: "fish@dzen.ru",
    vk_contact: null,
    subscribers_count: 142000,
    views_30d: 2100000,
    er_percent: 5.8,
    avg_viral_index: 14.7,
    growth_velocity_daily: 80,
    subscribers_growth_30d: 2400,
    readability_percent: 190.0,
    is_verified: false,
    rates: {
      post_price: 18000,
      native_price: 32000,
      video_price: 50000,
      tax_status: "Самозанятый (НПД)"
    },
    demographics: {
      gender_m: 91,
      gender_f: 9,
      ages: { "18-24": 8, "25-34": 30, "35-44": 38, "45-54": 18, "55+": 6 },
      top_cities: [{ name: "Москва", percent: 20 }, { name: "Самара", percent: 14 }, { name: "Волгоград", percent: 12 }],
      devices: { mobile: 85, desktop: 15 }
    },
    top_articles: [
      { title: "Копеечная добавка в тесто, от которой карась с ума сходит весной", views: 650000, likes: 41000, comments: 3100, viral_index: 45.7 }
    ]
  },
  {
    id: 15,
    dzen_id: "cinema_review",
    name: "КиноТеатр Pro | Фильмы и Сериалы",
    url: "https://dzen.ru/cinema_review",
    niche: "Кино, сериалы и шоу-бизнес",
    avatar_url: "https://avatars.dzeninfra.ru/get-zen-logos/223306/pub_60e5a18f7e583e67f150730f_60ed9d4a9908d00b888f2429/xxh",
    description: "Разборы скрытых смыслов фильмов, пасхалки, обзоры громких премьер и рекомендации сериалов на выходные.",
    telegram_contact: "@kinoteatr_pro",
    email_contact: "cinema@dzen.ru",
    vk_contact: "https://vk.com/kinoteatr_pro",
    subscribers_count: 360000,
    views_30d: 4800000,
    er_percent: 4.4,
    avg_viral_index: 13.3,
    growth_velocity_daily: 210,
    subscribers_growth_30d: 6300,
    readability_percent: 140.0,
    is_verified: true,
    rates: {
      post_price: 36000,
      native_price: 62000,
      video_price: 98000,
      tax_status: "ИП (УСН 6%)"
    },
    demographics: {
      gender_m: 54,
      gender_f: 46,
      ages: { "18-24": 26, "25-34": 44, "35-44": 20, "45-54": 7, "55+": 3 },
      top_cities: [{ name: "Москва", percent: 38 }, { name: "Санкт-Петербург", percent: 21 }, { name: "Екатеринбург", percent: 7 }],
      devices: { mobile: 79, desktop: 21 }
    },
    top_articles: [
      { title: "Финал фильма, который 90% зрителей поняли совершенно неправильно", views: 1350000, likes: 62000, comments: 4800, viral_index: 37.5 }
    ]
  }
];

export const INITIAL_DEALS = [
  {
    id: "deal-1",
    channel_id: 1,
    channel_name: "KP.RU: Комсомольская правда",
    dzen_id: "kpru",
    status: "Переговоры" as const,
    price: 240000,
    format: "Нативная статья" as const,
    note: "Согласование тезисов про финтех-сервис. Выход в первой половине месяца.",
    utm: "utm_source=dzen&utm_medium=native&utm_campaign=kp_autumn",
    erid: "2VtzquXyz123",
    deadline: "2026-10-05",
    created_at: "2026-09-20"
  },
  {
    id: "deal-2",
    channel_id: 4,
    channel_name: "ГЕОРГИЙ КАВКАЗ",
    dzen_id: "georgiy_kavkaz",
    status: "Согласовано" as const,
    price: 180000,
    format: "Видеоролик" as const,
    note: "Интеграция гриль-оборудования в сюжет о приготовлении шашлыка.",
    utm: "utm_source=dzen&utm_medium=video&utm_campaign=kavkaz_grill",
    erid: "2VtzquAbc789",
    deadline: "2026-09-28",
    created_at: "2026-09-18"
  },
  {
    id: "deal-3",
    channel_id: 6,
    channel_name: "Юридические тонкости (Ирина Сивакова)",
    dzen_id: "sivakova",
    status: "Оплачено" as const,
    price: 95000,
    format: "Нативная статья" as const,
    note: "Материал о безопасных сделках с недвижимостью для сервиса проверки юрлиц.",
    utm: "utm_source=dzen&utm_medium=article&utm_campaign=sivakova_legal",
    erid: "2VtzquDef456",
    deadline: "2026-09-25",
    created_at: "2026-09-15"
  }
];
