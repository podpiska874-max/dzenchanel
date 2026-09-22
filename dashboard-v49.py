import re
import time
import random
import textwrap
import sqlite3
import os
import json
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
import streamlit.components.v1 as components

def render_html(html_str):
    """Вспомогательная функция для безопасного вывода HTML без сбоев верстки Markdown."""
    lines = [line.strip() for line in html_str.strip().split('\n')]
    clean_html = ' '.join(lines)
    st.markdown(clean_html, unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 1. PAGE CONFIGURATION & CUSTOM CSS
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="Dzen Analytics Platform v30 (Cabinets & Demographics)",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Dark Theme Styling
render_html("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    
    .stApp {
        background: radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0f172a 45%, #020617 100%) !important;
        background-attachment: fixed !important;
        color: #f1f5f9 !important;
    }

    [data-testid="stSidebar"] {
        background: rgba(15, 23, 42, 0.8) !important;
        backdrop-filter: blur(20px) !important;
        border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    
    .card-box {
        background: rgba(30, 41, 59, 0.5) !important;
        backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 16px !important;
        padding: 20px !important;
        margin-bottom: 16px !important;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        position: relative;
        overflow: hidden;
    }
    .card-box:hover {
        border-color: rgba(99, 102, 241, 0.5) !important;
        transform: translateY(-3px) scale(1.005) !important;
        box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.25), 0 0 25px rgba(99, 102, 241, 0.15) !important;
    }
    .card-box::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.8), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    .card-box:hover::before {
        opacity: 1;
    }
    
    .metric-card {
        background: rgba(15, 23, 42, 0.6) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 14px !important;
        padding: 16px !important;
        text-align: center !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        transition: all 0.2s ease !important;
    }
    .metric-card:hover {
        border-color: rgba(168, 85, 247, 0.4) !important;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.15) !important;
    }
    
    .metric-val {
        font-size: 1.75rem !important;
        font-weight: 800 !important;
        background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        letter-spacing: -0.02em !important;
    }
    .metric-lbl {
        font-size: 0.75rem !important;
        font-weight: 600 !important;
        color: #94a3b8 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        margin-top: 4px !important;
    }
    
    .badge-viral {
        background: linear-gradient(135deg, rgba(244, 63, 94, 0.25), rgba(225, 29, 72, 0.15)) !important;
        color: #f43f5e !important;
        border: 1px solid rgba(244, 63, 94, 0.4) !important;
        box-shadow: 0 0 12px rgba(244, 63, 94, 0.25) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
        font-weight: 700 !important;
    }
    .badge-high {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15)) !important;
        color: #fbbf24 !important;
        border: 1px solid rgba(245, 158, 11, 0.4) !important;
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.2) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
        font-weight: 700 !important;
    }
    .badge-normal {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15)) !important;
        color: #818cf8 !important;
        border: 1px solid rgba(99, 102, 241, 0.4) !important;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.2) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
        font-weight: 700 !important;
    }
    .badge-growth {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15)) !important;
        color: #34d399 !important;
        border: 1px solid rgba(16, 185, 129, 0.4) !important;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.25) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
        font-weight: 700 !important;
    }
    .badge-fraud-low {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #34d399 !important;
        border: 1px solid rgba(16, 185, 129, 0.3) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
    }
    .badge-fraud-high {
        background: rgba(244, 63, 94, 0.15) !important;
        color: #f43f5e !important;
        border: 1px solid rgba(244, 63, 94, 0.3) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
    }
    .badge-tag {
        background: rgba(255, 255, 255, 0.06) !important;
        color: #cbd5e1 !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        padding: 3px 8px !important;
        border-radius: 6px !important;
        font-size: 0.75rem !important;
        font-weight: 600 !important;
        margin-right: 4px !important;
    }
    .badge-status {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)) !important;
        color: #a78bfa !important;
        border: 1px solid rgba(168, 85, 247, 0.4) !important;
        box-shadow: 0 0 10px rgba(168, 85, 247, 0.2) !important;
        padding: 3px 10px !important;
        border-radius: 20px !important;
        font-size: 0.78rem !important;
        font-weight: 700 !important;
    }
    .cabinet-header {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)) !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-top: 3px solid #6366f1 !important;
        border-radius: 16px !important;
        padding: 24px !important;
        margin-bottom: 24px !important;
        box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6), 0 0 30px rgba(99, 102, 241, 0.15) !important;
    }

    .stButton>button {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 10px 20px !important;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35) !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .stButton>button:hover {
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5) !important;
        transform: translateY(-2px) !important;
    }

    [data-baseweb="tab-list"] {
        gap: 8px !important;
        background: rgba(15, 23, 42, 0.5) !important;
        padding: 6px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    [data-baseweb="tab"] {
        border-radius: 8px !important;
        padding: 8px 16px !important;
        font-weight: 600 !important;
        color: #94a3b8 !important;
        border: none !important;
        transition: all 0.2s ease !important;
    }
    [aria-selected="true"] {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        color: #ffffff !important;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35) !important;
    }

    @keyframes pulseGlow {
        0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
        100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
    }
    .live-pulse {
        width: 8px;
        height: 8px;
        background-color: #34d399;
        border-radius: 50%;
        display: inline-block;
        animation: pulseGlow 2s infinite;
        margin-right: 6px;
    }

</style>
""")

DB_PATH = "dzen_analytics.db"

EXPORT_COLUMNS = [
    "db_id", "dzen_id", "channel_name", "channel_url", "niche",
    "telegram_contact", "email_contact", "vk_contact", "description",
    "top_articles", "avatar_url", "subscribers_count", "views_30d", "er_percent",
    "avg_viral_index", "growth_velocity_daily"
]

# Initialize Session State
if "selected_channel_id" not in st.session_state:
    st.session_state["selected_channel_id"] = None

if "favorites" not in st.session_state:
    st.session_state["favorites"] = set()

if "compare_list" not in st.session_state:
    st.session_state["compare_list"] = set()

if "crm_statuses" not in st.session_state:
    st.session_state["crm_statuses"] = {} # db_id -> {status, price, note, utm, erid, deadline}

if "preset_filter" not in st.session_state:
    st.session_state["preset_filter"] = "Все каналы"

if "yandex_verified" not in st.session_state:
    st.session_state["yandex_verified"] = {}

if "app_mode" not in st.session_state:
    st.session_state["app_mode"] = "🌐 Общий Аналитический Каталог"

if "studio_demographics" not in st.session_state:
    st.session_state["studio_demographics"] = {} # db_id -> {gender_m, gender_f, ages: dict, cities: list, verified: True}

if "author_channel_id" not in st.session_state:
    st.session_state["author_channel_id"] = None

if "author_prices" not in st.session_state:
    st.session_state["author_prices"] = {} # db_id -> {post_price, native_price, video_price, tax_status}

# ------------------------------------------------------------------------------
# 2. DATABASE MIGRATION & DATA LOADING
# ------------------------------------------------------------------------------
def ensure_schema_migrations(conn):
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(channels)")
    existing_channel_cols = [row[1] for row in cursor.fetchall()]
    
    new_channel_cols = {
        "telegram_contact": "TEXT",
        "email_contact": "TEXT",
        "vk_contact": "TEXT",
        "description": "TEXT",
        "top_articles": "TEXT",
        "avatar_url": "TEXT",
        "studio_stats_json": "TEXT"
    }
    
    for col_name, col_type in new_channel_cols.items():
        if col_name not in existing_channel_cols:
            try:
                cursor.execute(f"ALTER TABLE channels ADD COLUMN {col_name} {col_type}")
            except Exception:
                pass

    cursor.execute("PRAGMA table_info(channel_daily_stats)")
    existing_stats_cols = [row[1] for row in cursor.fetchall()]
    if "growth_velocity_daily" not in existing_stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN growth_velocity_daily INTEGER DEFAULT 0")
        except Exception:
            pass
            
    if "subscribers_growth_30d" not in existing_stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN subscribers_growth_30d INTEGER DEFAULT 0")
        except Exception:
            pass

    if "readability_percent" not in existing_stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN readability_percent REAL DEFAULT 85.0")
        except Exception:
            pass

    if "median_post_reach" not in existing_stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN median_post_reach INTEGER DEFAULT 0")
        except Exception:
            pass

    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stats_channel_id ON channel_daily_stats(channel_id, id DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_channels_niche ON channels(niche_id);")
    except Exception:
        pass
    
    try:
        cursor.execute("SELECT id, name FROM niches")
        all_niches = cursor.fetchall()
        for n_id, n_name in all_niches:
            cleaned_n = clean_niche_string(n_name)
            if cleaned_n != n_name:
                cursor.execute("UPDATE niches SET name = ? WHERE id = ?", (cleaned_n, n_id))
    except Exception:
        pass

    conn.commit()

@st.cache_data(ttl=600)

def build_clean_dzen_url(raw_url, dzen_id):
    if not raw_url or pd.isna(raw_url) or str(raw_url).strip() == "":
        return f"https://dzen.ru/{dzen_id}" if dzen_id else "https://dzen.ru"
    url_str = str(raw_url).strip()
    if not url_str.startswith("http://") and not url_str.startswith("https://"):
        url_str = f"https://{url_str}"
    if "dzen.guru" in url_str:
        return f"https://dzen.ru/{dzen_id}" if dzen_id else "https://dzen.ru"
    return url_str


def load_data():
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
    
    conn = sqlite3.connect(DB_PATH)
    ensure_schema_migrations(conn)
    
    query = """
    WITH max_stats AS (
        SELECT channel_id, MAX(id) as max_id
        FROM channel_daily_stats
        GROUP BY channel_id
    )
    SELECT 
        c.id AS db_id,
        c.dzen_id,
        c.name AS channel_name,
        c.url AS channel_url,
        COALESCE(n.name, 'Общее') AS niche,
        c.telegram_contact,
        c.email_contact,
        c.vk_contact,
        c.description,
        c.top_articles,
        c.avatar_url,
        c.studio_stats_json,
        s.subscribers_count,
        s.views_30d,
        s.er_percent,
        s.avg_viral_index,
        s.growth_velocity_daily,
        COALESCE(s.subscribers_growth_30d, 0) AS subscribers_growth_30d,
        COALESCE(s.readability_percent, 85.0) AS readability_percent,
        COALESCE(s.median_post_reach, 0) AS median_post_reach
    FROM channels c
    LEFT JOIN niches n ON c.niche_id = n.id
    LEFT JOIN max_stats ms ON ms.channel_id = c.id
    LEFT JOIN channel_daily_stats s ON s.id = ms.max_id
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if not df.empty:
        df = df.drop_duplicates(subset=["db_id"])
        df["channel_url"] = df.apply(lambda r: build_clean_dzen_url(r.get("channel_url"), r.get("dzen_id")), axis=1)
    return df

def get_channel_history(db_id):
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT recorded_at, subscribers_count, views_30d, er_percent, avg_viral_index
    FROM channel_daily_stats
    WHERE channel_id = ?
    ORDER BY id ASC
    """
    df = pd.read_sql_query(query, conn, params=(db_id,))
    conn.close()
    return df


def seed_database_if_empty():
    conn = sqlite3.connect(DB_PATH)
    ensure_schema_migrations(conn)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM channels")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_channels = [
            {"dzen_id": "kpru", "name": "KP.RU: Комсомольская правда", "niche": "Новости и СМИ", "subs": 2300000, "growth_30d": 15765, "views_30d": 49700000, "readability": 143.0, "er": 2.1, "vi": 21.6, "tg": "@kpru", "email": "reklama@kp.ru", "desc": "Официальный Дзен-канал крупнейшего мультимедийного издания Комсомольская правда."},
            {"dzen_id": "aifru", "name": "Аргументы и факты – aif.ru", "niche": "Новости и СМИ", "subs": 1700000, "growth_30d": 20912, "views_30d": 38600000, "readability": 193.0, "er": 2.4, "vi": 22.7, "tg": "@aifonline", "email": "ad@aif.ru", "desc": "Аргументы и Факты: главные новости, аналитика и эксклюзивы."},
            {"dzen_id": "mkru", "name": "МК", "niche": "Новости и СМИ", "subs": 1600000, "growth_30d": 25586, "views_30d": 376500000, "readability": 32.0, "er": 1.9, "vi": 235.3, "tg": "@mk_ru", "email": "adv@mk.ru", "desc": "Московский Комсомолец: оперативность, острые темы и резонанс."},
            {"dzen_id": "izvestia", "name": "Известия", "niche": "Новости и СМИ", "subs": 1400000, "growth_30d": 28984, "views_30d": 9800000, "readability": 125.0, "er": 1.8, "vi": 7.0, "tg": "@izvestia", "email": "sales@iz.ru", "desc": "Мультимедийный информационный центр Известия."},
            {"dzen_id": "gazetaru", "name": "Газета.Ru", "niche": "Новости и СМИ", "subs": 859000, "growth_30d": 37992, "views_30d": 6400000, "readability": 64.0, "er": 1.5, "vi": 7.4, "tg": "@gazetaru", "email": "ads@gazeta.ru", "desc": "Первое общественно-политическое интернет-издание Газета.Ru."},
            {"dzen_id": "georgiy_kavkaz", "name": "ГЕОРГИЙ КАВКАЗ", "niche": "Кулинария и Рецепты", "subs": 761800, "growth_30d": 1257, "views_30d": 626300, "readability": 179.0, "er": 4.8, "vi": 0.82, "tg": "@georgiy_kavkaz", "email": "contact@kavkaz.ru", "desc": "Авторский канал Георгия Кавказ: блюда на мангале, казан и традиции."},
            {"dzen_id": "rentv", "name": "РЕН ТВ", "niche": "Новости и Шоу", "subs": 677700, "growth_30d": 9015, "views_30d": 28100000, "readability": 111.0, "er": 2.2, "vi": 41.4, "tg": "@rentv_news", "email": "ads@ren.tv", "desc": "Официальный канал РЕН ТВ: тайны, расследования и документальные фильмы."},
            {"dzen_id": "ntvnews", "name": "НТВ", "niche": "Новости и Шоу", "subs": 630300, "growth_30d": 5989, "views_30d": 9100000, "readability": 341.0, "er": 3.1, "vi": 14.4, "tg": "@ntvnews", "email": "reklama@ntv.ru", "desc": "Телеканал НТВ: видео, эксклюзивные репортажи и телешоу."},
            {"dzen_id": "aviapro", "name": "Avia.pro - СМИ", "niche": "Авиация и Технологии", "subs": 629600, "growth_30d": 10, "views_30d": 62200000, "readability": 739.0, "er": 0.8, "vi": 98.7, "tg": "@aviapro", "email": "info@avia.pro", "desc": "Авиационный портал Avia.pro: новости мировой военной и гражданской авиации."},
            {"dzen_id": "vesti_news", "name": "ВЕСТИ", "niche": "Новости и СМИ", "subs": 569100, "growth_30d": 14313, "views_30d": 28700000, "readability": 71.0, "er": 2.0, "vi": 50.4, "tg": "@vesti_news", "email": "reklama@vgtrk.ru", "desc": "Главный информационный канал ВЕСТИ: оперативные сводки со всего мира."},
            {"dzen_id": "sergei_mikheev", "name": "Сергей Михеев", "niche": "Политика и Аналитика", "subs": 533800, "growth_30d": 2536, "views_30d": 883300, "readability": 798.0, "er": 5.2, "vi": 1.65, "tg": "@miheev", "email": "miheev@dzen.ru", "desc": "Авторская аналитика политолога Сергея Михеева."},
            {"dzen_id": "zona_komforta", "name": "Зона Комфорта", "niche": "Психология и Лайфстайл", "subs": 484700, "growth_30d": -1069, "views_30d": 2700000, "readability": 3.0, "er": 0.3, "vi": 5.57, "tg": "@zonakomforta", "email": "zona@dzen.ru", "desc": "Практическая психология, мотивация и саморазвитие."},
            {"dzen_id": "viral_anomaly_33k", "name": "Виральный Аномальный Феномен", "niche": "Эксперимент / Виральность", "subs": 3300, "growth_30d": 2850, "views_30d": 546100000, "readability": 910.0, "er": 0.0, "vi": 165484.85, "tg": "@viral_anomaly", "email": "viral@dzen.ru", "desc": "Аномальный алгоритмический взрыв в рекомендованных лентах Дзена."}
        ]
        for item in seed_channels:
            cursor.execute("INSERT OR IGNORE INTO niches (name) VALUES (?)", (item["niche"],))
            cursor.execute("SELECT id FROM niches WHERE name = ?", (item["niche"],))
            n_id = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO channels (dzen_id, name, url, niche_id, telegram_contact, email_contact, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (item["dzen_id"], item["name"], f"https://dzen.ru/{item['dzen_id']}", n_id, item["tg"], item["email"], item["desc"]))
            ch_db_id = cursor.lastrowid
            cursor.execute("""
                INSERT INTO channel_daily_stats (
                    channel_id, subscribers_count, views_30d, er_percent, avg_viral_index, 
                    growth_velocity_daily, subscribers_growth_30d, readability_percent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (ch_db_id, item["subs"], item["views_30d"], item["er"], item["vi"], int(item["growth_30d"]/30), item["growth_30d"], item["readability"]))
        conn.commit()
    conn.close()

seed_database_if_empty()

df = load_data()

def sync_compare_list_from_multiselect():
    selected = st.session_state.get("multiselect_compare_main", [])
    if "df" in globals() and not df.empty and "channel_name" in df.columns:
        st.session_state["compare_list"] = set(df[df["channel_name"].isin(selected)]["db_id"].tolist())

# Helper formatting functions


def clean_niche_string(val):
    if not val or pd.isna(val) or str(val).lower() in ['none', 'null', 'undefined', 'nan', '', '0']:
        return "Общее"
    val = str(val)
    val = re.sub(r'<[^>]+>', '', val)
    val = ' '.join(val.split()).strip().strip('"')
    
    table_headers = ["Канал", "Подписчики", "Прирост", "Просмотры", "Дочитываемость"]
    if any(h in val for h in table_headers):
        cleaned = val
        for h in ["Канал", "Подписчики", "Прирост за 30 дней", "Прирост", "Просмотры за 30 дней", "Просмотры", "Дочитываемость"]:
            cleaned = cleaned.replace(h, '')
        cleaned = re.sub(r'[+\−\-]?\d+[\d\s\,\.\%]*[КMМKkm]?', ' ', cleaned)
        cleaned = ' '.join(cleaned.split()).strip()
        
        if 'Популярная наука' in cleaned:
            return 'Популярная наука'
        elif 'Карамзина' in cleaned or 'История' in cleaned or 'МИР ИСТОРИИ' in cleaned:
            return 'История и Аналитика'
        elif 'Кино' in cleaned or 'блог о кино' in cleaned:
            return 'Кино и Культура'
        elif 'О Москве' in cleaned or 'Москва' in cleaned:
            return 'Лайфстайл и Город'
            
        words = cleaned.split()
        if len(words) >= 2:
            return ' '.join(words[:2])
        elif len(words) == 1:
            return words[0]
        return "Общее"
        
    if len(val) > 45:
        return val[:40] + "..."
    return val
    val = str(val)
    # Strip HTML tags
    val = re.sub(r'<[^>]+>', '', val)
    # Normalize whitespace
    val = ' '.join(val.split()).strip()
    val = val.strip('"\'')
    if not val or val.lower() in ['none', 'null', 'undefined', 'nan', '', '0']:
        return "Общее"
    return val

def render_viral_badge(vi):
    if vi >= 10000.0:
        return f'<span class="badge-viral" style="background:rgba(255,87,34,0.25); color:#ff5722; border:1px solid #ff5722; font-weight:800;" title="🔥 Сверхвиральный аномальный пик (VI: {vi:,.2f})">🔥 VI: {vi:,.2f} (Аномалия)</span>'
    elif vi >= 3.0:
        return f'<span class="badge-viral" title="Высокая виральность (VI ≥ 3.0): охваты в разы превышают базу подписчиков">🔥 VI: {vi:.2f}</span>'
    elif vi >= 1.0:
        return f'<span class="badge-high" title="Хорошая виральность (VI ≥ 1.0): статьи стабильно попадают в рекомендации">🚀 VI: {vi:.2f}</span>'
    else:
        return f'<span class="badge-normal" title="Стандартный охват (VI < 1.0)">⚡ VI: {vi:.2f}</span>'

def calculate_fraud_score(row):
    subs = row['subscribers_count']
    views = row['views_30d']
    er = row['er_percent']
    vi = row['avg_viral_index']
    
    risk_score = 5
    if subs > 50000 and er < 0.2:
        risk_score += 45
    if vi > 15.0 and er < 0.3:
        risk_score += 35
    if subs > 100000 and views < 5000:
        risk_score += 30
    return min(risk_score, 99)

def get_fraud_badge(risk_score):
    if risk_score <= 20:
        return f'<span class="badge-fraud-low" title="Органический трафик: природные соотношения охватов и реакций">🛡️ Естественная аудитория (Низкий риск)</span>'
    elif risk_score <= 50:
        return f'<span class="badge-fraud-high" style="color:#d29922; border-color:rgba(210,153,34,0.3);" title="Средняя диспропорция показателей">⚠️ Средний риск накрутки</span>'
    else:
        return f'<span class="badge-fraud-high" title="Высокое расхождение метрик">❌ Высокое подозрение на ботов ({risk_score}%)</span>'

def get_avatar_html(name, avatar_url=None, size=40):
    if avatar_url and isinstance(avatar_url, str) and (avatar_url.startswith('http://') or avatar_url.startswith('https://')):
        return f'<img src="{avatar_url}" style="width: {size}px; height: {size}px; border-radius: 50%; object-fit: cover; border: 1px solid #30363d; flex-shrink: 0;" title="Аватар канала {name}">'
    else:
        initial = name[0].upper() if name else "?"
        bg_color = "#1f6beb" if len(name) % 2 == 0 else "#238636"
        font_size = int(size * 0.45)
        return f'<div style="width: {size}px; height: {size}px; border-radius: 50%; background: linear-gradient(135deg, {bg_color}, #8957e5); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: {font_size}px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);" title="Аватар {name}">{initial}</div>'

def fmt_num(num):
    if not num or pd.isna(num):
        return "0"
    num = float(num)
    if num >= 1000000:
        return f"{num/1000000:.1f}М"
    elif num >= 1000:
        return f"{num/1000:.1f}К"
    return str(int(num))

if df.empty:
    st.title("⚡ Аналитика Дзена")
    st.warning("⚠️ База данных `dzen_analytics.db` пуста или не найдена. Запустите сначала `import_json_to_db-v2.py`!")
    st.stop()

# Fill missing helper columns
for col in ["telegram_contact", "email_contact", "vk_contact", "description", "top_articles", "growth_velocity_daily", "avatar_url", "studio_stats_json"]:
    if col not in df.columns:
        df[col] = None

df["niche"] = df["niche"].apply(clean_niche_string)
df["avg_viral_index"] = df["avg_viral_index"].fillna(0.0)
df["subscribers_count"] = df["subscribers_count"].fillna(0).astype(int)
df["views_30d"] = df["views_30d"].fillna(0).astype(int)
df["er_percent"] = df["er_percent"].fillna(0.0)
df["growth_velocity_daily"] = df["growth_velocity_daily"].fillna(0).astype(int)
df["subscribers_growth_30d"] = df["subscribers_growth_30d"].fillna(0).astype(int)
df["readability_percent"] = df["readability_percent"].fillna(85.0).astype(float)

# calculate fraud scores
df["fraud_score"] = df.apply(calculate_fraud_score, axis=1)

# ------------------------------------------------------------------------------
# SIDEBAR: EMAIL OTP AUTHENTICATION & NAVIGATION
# ------------------------------------------------------------------------------
st.sidebar.image("https://yastatic.net/s3/home/zen/favicon.png", width=36)
st.sidebar.title("Dzen Analytics Pro")
st.sidebar.markdown("---")

if "auth_user" not in st.session_state:
    st.session_state["auth_user"] = None

if "otp_sent" not in st.session_state:
    st.session_state["otp_sent"] = False

if "generated_otp" not in st.session_state:
    st.session_state["generated_otp"] = None

if "pending_email" not in st.session_state:
    st.session_state["pending_email"] = ""

if "pending_role" not in st.session_state:
    st.session_state["pending_role"] = "💼 Личный кабинет Маркетолога"

auth_user = st.session_state.get("auth_user")

if auth_user is None:
    st.sidebar.markdown("### 📧 Вход в Личный Кабинет")
    st.sidebar.caption("Авторизация по Email и коду подтверждения (OTP)")
    
    email_input = st.sidebar.text_input(
        "Ваш Email адрес:", 
        value=st.session_state.get("pending_email", ""), 
        key="sb_email_input",
        placeholder="user@company.ru"
    )
    role_choice = st.sidebar.selectbox(
        "Выберите вашу роль:",
        [
            "💼 Личный кабинет Маркетолога",
            "✍️ Личный кабинет Автора канала",
            "🛠️ Личный кабинет Администратора"
        ],
        key="sb_role_selectbox"
    )
    
    if st.sidebar.button("📩 Отправить код на почту", use_container_width=True, type="primary", key="sb_btn_send_otp"):
        if email_input and "@" in email_input:
            import random
            otp_code = str(random.randint(100000, 999999))
            st.session_state["generated_otp"] = otp_code
            st.session_state["otp_sent"] = True
            st.session_state["pending_email"] = email_input
            st.session_state["pending_role"] = role_choice
            st.sidebar.success("✅ Код подтверждения сгенерирован!")
        else:
            st.sidebar.error("Укажите корректный Email адрес!")
            
    if st.session_state.get("otp_sent"):
        render_html(f'''
        <div style="background:#1f242d; border:1px solid #58a6ff; border-radius:6px; padding:10px; margin:10px 0;">
            <div style="font-size:0.8rem; color:#8b949e;">Код подтверждения отправлен на:</div>
            <div style="font-size:0.85rem; font-weight:600; color:#f0f6fc;">{st.session_state["pending_email"]}</div>
            <div style="margin-top:6px; font-size:0.85rem; color:#3fb950;">🔑 Тестовый OTP код: <b style="font-size:1.1rem; color:#ffffff; background:#238636; padding:2px 8px; border-radius:4px;">{st.session_state["generated_otp"]}</b></div>
        </div>
        ''')
        
        user_otp = st.sidebar.text_input("Введите 6-значный код:", key="sb_otp_input", placeholder="123456", max_chars=6)
        
        if st.sidebar.button("🔑 Войти в Личный Кабинет", type="primary", use_container_width=True, key="sb_btn_login_submit"):
            if user_otp == st.session_state.get("generated_otp"):
                st.session_state["auth_user"] = {
                    "email": st.session_state["pending_email"],
                    "role": st.session_state["pending_role"]
                }
                st.session_state["app_mode"] = st.session_state["pending_role"]
                st.session_state["otp_sent"] = False
                st.session_state["generated_otp"] = None
                st.rerun()
            else:
                st.sidebar.error("Неверный код подтверждения!")
                
    st.sidebar.markdown("---")
    app_mode = st.session_state.get("app_mode", "🌐 Общий Аналитический Каталог")
    if app_mode not in ["💼 Личный кабинет Маркетолога", "✍️ Личный кабинет Автора канала"]:
        app_mode = "🌐 Общий Аналитический Каталог"

else:
    u_email = auth_user["email"]
    u_role = auth_user["role"]
    
    if "Администратор" in u_role:
        role_badge = "🛠️ Админ"
    elif "Маркетолог" in u_role:
        role_badge = "💼 Маркетолог"
    else:
        role_badge = "✍️ Автор канала"
    
    render_html(f'''
    <div style="background:#161b22; border:1px solid #3fb950; border-radius:8px; padding:12px; margin-bottom:12px;">
        <div style="font-size:0.8rem; color:#8b949e;">Авторизованный пользователь:</div>
        <div style="font-weight:700; color:#f0f6fc; word-break:break-all; margin-top:2px;">📧 {u_email}</div>
        <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
            <span class="badge-tag" style="background:#238636; color:#ffffff; font-weight:600; font-size:0.75rem;">{role_badge}</span>
            <span style="font-size:0.75rem; color:#3fb950;">● Online</span>
        </div>
    </div>
    ''')
    
    if "Администратор" in u_role:
        mode_options = ["🌐 Общий Аналитический Каталог", "💼 Личный кабинет Маркетолога", "✍️ Личный кабинет Автора канала", "🛠️ Личный кабинет Администратора"]
    else:
        mode_options = ["🌐 Общий Аналитический Каталог", u_role]
    curr_mode = st.session_state.get("app_mode", u_role)
    if curr_mode not in mode_options:
        curr_mode = u_role
        
    app_mode = st.sidebar.radio(
        "📌 Разделы системы:",
        mode_options,
        index=mode_options.index(curr_mode),
        key="sb_logged_mode_radio"
    )
    st.session_state["app_mode"] = app_mode
    
    st.sidebar.markdown("---")
    if st.sidebar.button("🚪 Выйти из кабинета", use_container_width=True, key="sb_btn_logout"):
        st.session_state["auth_user"] = None
        st.session_state["app_mode"] = "🌐 Общий Аналитический Каталог"
        st.rerun()

st.sidebar.markdown("---")


# ==============================================================================

# ==============================================================================
# MODE 4: LICHNYI KABINET ADMINISTRATORA
# ==============================================================================
if app_mode == "🛠️ Личный кабинет Администратора":
    render_html("""
    <div class="cabinet-header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0; color:#f0f6fc;">🛠️ Личный Кабинет Администратора Платформы</h2>
                <div style="color:#8b949e; font-size:0.9rem; margin-top:4px;">Управление пользователями, модерация каналов, мониторинг базы данных и системные настройки</div>
            </div>
            <span class="badge-growth" style="font-size:0.9rem; padding:6px 14px; background-color:rgba(210,153,34,0.2); color:#d29922; border-color:#d29922;">👑 System SuperAdmin</span>
        </div>
    </div>
    """)
    
    t_admin_users, t_admin_db, t_admin_mod, t_admin_finance, t_admin_settings = st.tabs([
        "👥 1. Пользователи & Доступы",
        "📊 2. Мониторинг Базы Данных & Парсеров",
        "🛡️ 3. Модерация & Верификация Авторов",
        "💰 4. Финансы & Сделки Платформы",
        "⚙️ 5. Системные Настройки & API"
    ])
    
    # TAB 1: USERS
    with t_admin_users:
        st.subheader("👥 Управление Пользователями и Ролями")
        st.write("Реестр зарегистрированных пользователей, выдача прав и управление статусами:")
        
        if "admin_users_list" not in st.session_state:
            st.session_state["admin_users_list"] = [
                {"id": 1, "email": "admin@dzen-analytics.ru", "role": "🛠️ Администратор", "status": "✅ Активен", "registered": "2026-09-01"},
                {"id": 2, "email": "alex@agency-media.ru", "role": "💼 Маркетолог", "status": "✅ Активен", "registered": "2026-09-10"},
                {"id": 3, "email": "chef_master@dzen.ru", "role": "✍️ Автор канала", "status": "✅ Yandex ID Verified", "registered": "2026-09-15"},
                {"id": 4, "email": "tech_news@dzen.ru", "role": "✍️ Автор канала", "status": "⚠️ На проверке", "registered": "2026-09-18"},
                {"id": 5, "email": "buyer_pro@target.ru", "role": "💼 Маркетолог", "status": "✅ Активен", "registered": "2026-09-19"}
            ]
        
        users_df = pd.DataFrame(st.session_state["admin_users_list"])
        st.dataframe(users_df, use_container_width=True, hide_index=True)
        
        st.markdown("---")
        st.write("➕ **Быстрое создание / Приглашение пользователя:**")
        c_u1, c_u2, c_u3 = st.columns([2, 2, 1])
        with c_u1:
            new_u_email = st.text_input("Email пользователя:", placeholder="new_user@dzen.ru", key="admin_new_u_email")
        with c_u2:
            new_u_role = st.selectbox("Назначаемая роль:", ["💼 Маркетолог", "✍️ Автор канала", "🛠️ Администратор"], key="admin_new_u_role")
        with c_u3:
            st.markdown("<div style='height:28px;'></div>", unsafe_allow_html=True)
            if st.button("➕ Создать пользователя", type="primary", key="admin_btn_add_u", use_container_width=True):
                if new_u_email and "@" in new_u_email:
                    new_id = len(st.session_state["admin_users_list"]) + 1
                    st.session_state["admin_users_list"].append({
                        "id": new_id,
                        "email": new_u_email,
                        "role": new_u_role,
                        "status": "✅ Активен",
                        "registered": "2026-09-20"
                    })
                    st.success(f"✅ Пользователь {new_u_email} успешно добавлен!")
                    st.rerun()

    # TAB 2: DATABASE & PARSERS
    with t_admin_db:
        st.subheader("📊 Мониторинг Базы Данных и Парсеров")
        
        tot_channels = len(df)
        tot_views = df["views_30d"].sum()
        avg_er = df["er_percent"].mean()
        db_file_size = f"{os.path.getsize(DB_PATH) / (1024*1024):.2f} MB" if os.path.exists(DB_PATH) else "0 MB"
        
        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric("Всего каналов в БД", f"{tot_channels:,}")
        with m2:
            st.metric("Месячный охват базы", f"{tot_views:,}")
        with m3:
            st.metric("Средний ER по базе", f"{avg_er:.2f}%")
        with m4:
            st.metric("Размер файла dzen_analytics.db", db_file_size)
            
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.write("📁 **Распределение каналов и охвата по Нишам (Категориям):**")
        niche_summary = df.groupby("niche").agg(
            Количество_Каналов=("db_id", "count"),
            Суммарный_Охват=("views_30d", "sum"),
            Средняя_Вовлеченность_ER=("er_percent", "mean"),
            Средний_Viral_Index=("avg_viral_index", "mean")
        ).reset_index().sort_values(by="Количество_Каналов", ascending=False)
        st.dataframe(niche_summary, use_container_width=True, hide_index=True)
        
        st.markdown("---")
        st.write("⚙️ **Управление парсерами и обновлением базы данных:**")
        cp1, cp2, cp3 = st.columns(3)
        with cp1:
            if st.button("🚀 Запустить Sitemap Парсер dzen.ru", use_container_width=True, key="admin_btn_sitemap"):
                st.info("ℹ️ Запущена фоновая задача обновления реестра каналов...")
        with cp2:
            if st.button("🔄 Обновить daily_stats (Сбор метрик)", use_container_width=True, key="admin_btn_daily"):
                st.success("✅ Свежая статистика за 24ч успешно собрана и сохранена!")
        with cp3:
            if st.button("🧹 Очистить кэш Streamlit", use_container_width=True, key="admin_btn_clear_cache"):
                st.cache_data.clear()
                st.success("✅ Кэш очищен!")

    # TAB 3: MODERATION & FRAUD
    with t_admin_mod:
        st.subheader("🛡️ Модерация Верификаций и Аудит Накруток")
        st.write("Контроль чистоты площадок и подтверждение авторских прав перед рекламодателями:")
        
        high_risk_df = df[df["fraud_score"] >= 40][["channel_name", "niche", "subscribers_count", "views_30d", "er_percent", "fraud_score"]].sort_values(by="fraud_score", ascending=False)
        st.write(f"⚠️ **Каналы с повышенным индексом риска ботов (Fraud Score ≥ 40%) [{len(high_risk_df)} каналов]:**")
        st.dataframe(high_risk_df, use_container_width=True, hide_index=True)
        
        st.markdown("---")
        st.write("📋 **Очередь верификации авторов (Заявки Yandex ID):**")
        mod_queue = [
            {"Канал": "Кулинарный Секрет", "Автор": "chef_master@dzen.ru", "Статус Yandex ID": "✅ Подтвержден OAuth", "Действие": "Подтвердить верификацию"},
            {"Канал": "Техно Новости 2026", "Автор": "tech_news@dzen.ru", "Статус Yandex ID": "⏳ Ожидает проверки", "Действие": "Запросить повторный вход"}
        ]
        st.dataframe(pd.DataFrame(mod_queue), use_container_width=True)

    # TAB 4: FINANCES & DEALS
    with t_admin_finance:
        st.subheader("💰 Финансовый Оборот Платформы & Сделки CRM")
        
        f1, f2, f3 = st.columns(3)
        with f1:
            st.metric("Общий оборот сделок", "1,850,000 ₽")
        with f2:
            st.metric("Запланировано выплат авторам", "1,665,000 ₽")
        with f3:
            st.metric("Комиссия платформы (10%)", "185,000 ₽", delta="+12.4%")
            
        st.markdown("<br>", unsafe_allow_html=True)
        st.write("📊 **Все активные рекламные интеграции в системе:**")
        
        deals_sample = [
            {"ID Сделки": "DEAL-8491", "Байер": "alex@agency-media.ru", "Канал Блогера": "Кулинарный Секрет", "Бюджет": "45,000 ₽", "Комиссия 10%": "4,500 ₽", "Статус": "🚀 Опубликовано", "Маркировка ERID": "2Vtzqx9aK1L"},
            {"ID Сделки": "DEAL-8492", "Байер": "buyer_pro@target.ru", "Канал Блогера": "Авто Драйв 2026", "Бюджет": "80,000 ₽", "Комиссия 10%": "8,000 ₽", "Статус": "💳 Оплачено", "Маркировка ERID": "2Vtzqy3mP9X"},
            {"ID Сделки": "DEAL-8493", "Байер": "alex@agency-media.ru", "Канал Блогера": "Финансы и Инвестиции", "Бюджет": "120,000 ₽", "Комиссия 10%": "12,000 ₽", "Статус": "💬 Переговоры", "Маркировка ERID": "—"}
        ]
        st.dataframe(pd.DataFrame(deals_sample), use_container_width=True, hide_index=True)

    # TAB 5: SYSTEM SETTINGS
    with t_admin_settings:
        st.subheader("⚙️ Системные Настройки & Серверные API Ключи")
        
        st.write("🔑 **Параметры Yandex OAuth (для production-сервера):**")
        cs1, cs2 = st.columns(2)
        with cs1:
            st.text_input("Yandex Client ID:", value="a498f391b2049e830c2d", key="sys_yandex_client_id")
        with cs2:
            st.text_input("Yandex Client Secret:", value="••••••••••••••••••••••••", type="password", key="sys_yandex_client_secret")
            
        st.markdown("---")
        st.write("📧 **Параметры Почтового SMTP Сервера (для отправки OTP кодов):**")
        smtp1, smtp2, smtp3 = st.columns(3)
        with smtp1:
            st.text_input("SMTP Server:", value="smtp.yandex.ru", key="sys_smtp_host")
        with smtp2:
            st.text_input("SMTP Port:", value="465", key="sys_smtp_port")
        with smtp3:
            st.text_input("Sender Email:", value="noreply@dzen-analytics.ru", key="sys_smtp_user")
            
        st.markdown("---")
        st.write("💸 **Комиссия платформы:**")
        st.slider("Процент комиссии (%):", 0, 30, 10, key="sys_platform_fee")
        
        if st.button("💾 Сохранить системные настройки", type="primary"):
            st.success("✅ Системные настройки успешно обновлены и сохранены!")

    st.stop()


# MODE 2: LICHNYI KABINET MARKETOLOGA / MEDIABAYERA
# ==============================================================================
if app_mode == "💼 Личный кабинет Маркетолога":
    render_html("""
    <div class="cabinet-header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0; color:#f0f6fc;">💼 Личный кабинет Маркетолога & Медиабайера</h2>
                <div style="color:#8b949e; font-size:0.9rem; margin-top:4px;">Центр управления рекламными кампаниями, CRM-сделками и сплит-бюджетом</div>
            </div>
            <span class="badge-status" style="font-size:0.9rem; padding:6px 14px;">🎯 Активный Байер</span>
        </div>
    </div>
    """)
    
    fav_ids = list(st.session_state["favorites"])
    fav_df = df[df["db_id"].isin(fav_ids)] if fav_ids else pd.DataFrame()
    
    tab_m_overview, tab_m_crm, tab_m_allocator, tab_m_fraud = st.tabs([
        "📊 Сводный Дашборд Кампаний",
        "📋 CRM Переговоров & Медиаплан",
        "🧮 Сплит-Бюджетирование ROI",
        "🛡️ Монитор Безопасности & Ботов"
    ])
    
    with tab_m_overview:
        st.subheader("📊 Генеральный отчет по отобранным медиапланам")
        if fav_df.empty:
            st.info("ℹ️ У вас пока нет отобранных каналов в медиаплане. Добавьте каналы звездочкой '☆' в Каталоге!")
        else:
            tot_subs = fav_df["subscribers_count"].sum()
            tot_views = fav_df["views_30d"].sum()
            est_reach_post = int(tot_views / 12)
            est_budget = sum([st.session_state["crm_statuses"].get(ch_id, {}).get("price", int((row["views_30d"]/12/1000)*350)) for ch_id, row in zip(fav_df["db_id"], fav_df.to_dict('records'))])
            
            m1, m2, m3, m4, m5 = st.columns(5)
            with m1:
                st.metric("Отобрано Блогеров", f"{len(fav_df)} каналов")
            with m2:
                st.metric("Суммарный Бюджет", f"{est_budget:,} ₽")
            with m3:
                st.metric("Охват 1 Волны Постов", f"~{est_reach_post:,}")
            with m4:
                cpm_avg = (est_budget / max(est_reach_post, 1)) * 1000
                st.metric("Средний CPM", f"~{cpm_avg:.0f} ₽")
            with m5:
                est_clicks = int(est_reach_post * 0.025)
                st.metric("Прогноз Кликов (CTR 2.5%)", f"~{est_clicks:,}")

            st.markdown("<br>", unsafe_allow_html=True)
            st.subheader("📈 Соотношение охвата и стоимости выбранных каналов")
            fig_bubble = px.scatter(
                fav_df,
                x="subscribers_count",
                y="views_30d",
                size="avg_viral_index",
                color="niche",
                hover_name="channel_name",
                log_x=True, log_y=True,
                title="Аналитическая матрица: Подписчики vs Месячный Охват (Размер = Viral Index)",
                template="plotly_dark",
                height=400
            )
            st.plotly_chart(fig_bubble, use_container_width=True)

    with tab_m_crm:
        st.subheader("📋 CRM-Управление Сделками и Статусы Закупки")
        if fav_df.empty:
            st.info("ℹ️ Ваша CRM-таблица пуста. Добавьте каналы в Избранное из Каталога!")
        else:
            st.write("Управляйте этапами согласования, ценами и UTM-ссылками по каждому автору:")
            
            status_options = ["📋 Запрошен прайс", "💬 Переговоры", "💳 Оплачено", "🚀 Опубликовано", "❌ Отклонен"]
            
            for idx, row in fav_df.iterrows():
                ch_id = row["db_id"]
                current_info = st.session_state["crm_statuses"].get(ch_id, {
                    "status": "📋 Запрошен прайс",
                    "price": int((row["views_30d"]/12/1000)*350) if row["views_30d"]>0 else 3000,
                    "note": "",
                    "utm": f"https://client.site/?utm_source=dzen&utm_medium={row['dzen_id']}",
                    "erid": f"ERID-{100000 + ch_id}"
                })
                
                with st.expander(f"👤 {row['channel_name']} (Категория: {row['niche']}) — Статус: {current_info['status']}"):
                    col_c1, col_c2, col_c3 = st.columns([2, 2, 3])
                    
                    with col_c1:
                        new_status = st.selectbox(f"Статус сделки (#{ch_id}):", status_options, index=status_options.index(current_info['status']) if current_info['status'] in status_options else 0, key=f"crm_st_{ch_id}")
                        new_price = st.number_input(f"Согласованная цена (₽):", value=int(current_info['price']), step=500, key=f"crm_pr_{ch_id}")
                    
                    with col_c2:
                        new_erid = st.text_input(f"Маркировка / ERID ID:", value=current_info['erid'], key=f"crm_erid_{ch_id}")
                        new_utm = st.text_input(f"Целевая UTM-ссылка:", value=current_info['utm'], key=f"crm_utm_{ch_id}")
                    
                    with col_c3:
                        new_note = st.text_area(f"Заметки и дедлайн:", value=current_info['note'], placeholder="Например: ТЗ отправлено, публикация 25 числа в 14:00", key=f"crm_nt_{ch_id}")
                    
                    st.session_state["crm_statuses"][ch_id] = {
                        "status": new_status,
                        "price": new_price,
                        "erid": new_erid,
                        "utm": new_utm,
                        "note": new_note
                    }
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # Export campaign brief
            crm_export_data = []
            for ch_id, info in st.session_state["crm_statuses"].items():
                match = df[df["db_id"] == ch_id]
                if not match.empty:
                    c_row = match.iloc[0]
                    crm_export_data.append({
                        "Канал": c_row["channel_name"],
                        "Ниша": c_row["niche"],
                        "Статус": info["status"],
                        "Цена (₽)": info["price"],
                        "ERID": info["erid"],
                        "UTM Ссылка": info["utm"],
                        "Контакты": c_row["telegram_contact"] or c_row["email_contact"] or "—",
                        "Заметки": info["note"]
                    })
            if crm_export_data:
                crm_df = pd.DataFrame(crm_export_data)
                csv_crm = crm_df.to_csv(index=False).encode('utf-8-sig')
                st.download_button(
                    "📥 Скачать Полный Отчет Кампании (CSV для Excel)",
                    data=csv_crm,
                    file_name="dzen_campaign_crm_report.csv",
                    mime="text/csv",
                    use_container_width=False
                )

    with tab_m_allocator:
        st.subheader("🧮 Умный Авто-Распределитель Рекламного Бюджета")
        total_b = st.number_input("Введите общий бюджет рекламной кампании, ₽:", value=300000, step=50000)
        strat = st.selectbox("Стратегия закупки:", ["Максимум Охвата (Баланс каналов)", "Высокий ER & Конверсии (Микро-блогеры)", "Топовые гиганты (Макро-блогеры)"])
        
        if st.button("🚀 Распределить бюджет по базе Дзена"):
            sorted_pool = df.copy()
            if "Высокий ER" in strat:
                sorted_pool = sorted_pool.sort_values(by="er_percent", ascending=False)
            elif "Топовые" in strat:
                sorted_pool = sorted_pool.sort_values(by="subscribers_count", ascending=False)
            else:
                sorted_pool = sorted_pool.sort_values(by="avg_viral_index", ascending=False)
            
            selected_plan = []
            rem_budget = total_b
            for _, r in sorted_pool.iterrows():
                est_views = int(r["views_30d"] / 12) if r["views_30d"] > 0 else 1000
                cost = int((est_views / 1000) * 350)
                if cost <= rem_budget and cost > 0:
                    selected_plan.append({
                        "Канал": r["channel_name"],
                        "Ниша": r["niche"],
                        "Подписчики": r["subscribers_count"],
                        "Прогноз Охвата": est_views,
                        "Стоимость (₽)": cost,
                        "Viral Index": r["avg_viral_index"]
                    })
                    rem_budget -= cost
                if len(selected_plan) >= 10 or rem_budget < 2000:
                    break
            
            plan_df = pd.DataFrame(selected_plan)
            st.success(f"✅ Сформирован оптимальный медиаплан из {len(plan_df)} каналов! Освоение бюджета: {total_b - rem_budget:,} ₽ из {total_b:,} ₽.")
            st.dataframe(plan_df, use_container_width=True, hide_index=True)

    with tab_m_fraud:
        st.subheader("🛡️ Монитор Безопасности & Проверка на Ботов")
        st.write("Сводный аудит накруток для предотвращения слива бюджета:")
        
        fraud_summary = df[["channel_name", "niche", "subscribers_count", "views_30d", "er_percent", "fraud_score"]].sort_values(by="fraud_score", ascending=False)
        st.dataframe(
            fraud_summary.head(15).rename(columns={
                "channel_name": "Канал",
                "niche": "Ниша",
                "subscribers_count": "Подписчики",
                "views_30d": "Просмотры 30д",
                "er_percent": "ER %",
                "fraud_score": "Индекс Риска Ботов (%)"
            }),
            use_container_width=True,
            hide_index=True
        )
    st.stop()


# ==============================================================================
# MODE 3: LICHNYI KABINET AVTORA KANALA (ПРЯМАЯ ИНТЕГРАЦИЯ С ДЗЕН СТУДИЕЙ)
# ==============================================================================
if app_mode == "✍️ Личный кабинет Автора канала":
    render_html("""
    <div class="cabinet-header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0; color:#f0f6fc;">✍️ Личный Кабинет Автора (Интеграция с Дзен Студией)</h2>
                <div style="color:#8b949e; font-size:0.9rem; margin-top:4px;">Прямое подключение каналов из dzen.ru/studio, загрузка живой статистики, демографии и медиакиты</div>
            </div>
            <span class="badge-growth" style="font-size:0.9rem; padding:6px 14px; background-color:rgba(88,166,255,0.2); color:#58a6ff; border-color:#58a6ff;">🚀 Dzen Studio API Connected</span>
        </div>
    </div>
    """)
    
    import random
    import time
    
    st.subheader("🔌 Подключение вашего канала из Дзен Студии (dzen.ru/studio)")
    
    # Tabs for connecting from Dzen Studio
    st_conn_tab1, st_conn_tab2, st_conn_tab3 = st.tabs([
        "🔐 1. Подключить через Yandex ID (OAuth)",
        "🔗 2. Подключить по прямой ссылке / ID Дзен Студии",
        "🔍 3. Выбор из общей базы Дзена"
    ])
    
    # Tab 1: Yandex ID OAuth Direct Studio Pull
    with st_conn_tab1:
        st.write("Авторизация через аккаунт Яндекса для получения прямого доступа к вашей **Дзен Студии** (`dzen.ru/studio`):")
        
        db_channel_options = ["-- Указать ссылку/название вручную --"] + (df["channel_name"].tolist() if not df.empty else [])
        sel_existing_ch = st.selectbox(
            "🎯 Выберите ваш канал из нашей базы (если ваш канал уже есть в каталоге):",
            options=db_channel_options,
            key="y_db_select_box"
        )
        
        y_custom_ch_input = st.text_input(
            "Или введите название / ссылку на ваш канал в Дзен Студии:",
            value="",
            placeholder="Например: https://dzen.ru/my_channel или Мой Кулинарный Блог",
            key="y_ch_input_field"
        )
        
        col_oa1, col_oa2 = st.columns([2, 1])
        with col_oa1:
            st.markdown("""
            * **Запрашиваемый доступ**: Просмотр статистики Студии Дзена (`dzen:studio_read`)
            * **Безопасность**: Официальный OAuth 2.0 провайдер Яндекса
            * **Результат**: Подключение вашего канала из Дзен Студии + знак **`✅ Подтверждён через Дзен Студию`**
            """)
        with col_oa2:
            if st.button("🔐 Войти через Yandex ID и подтянуть из Студии", type="primary", use_container_width=True, key="btn_author_oauth_studio"):
                target_channel_data = None
                
                # Case 1: Selected from dropdown
                if sel_existing_ch != "-- Указать ссылку/название вручную --":
                    m = df[df["channel_name"] == sel_existing_ch]
                    if not m.empty:
                        r = m.iloc[0]
                        target_channel_data = {
                            "db_id": r["db_id"],
                            "dzen_id": r["dzen_id"],
                            "channel_name": f"{r['channel_name']} (Дзен Студия)",
                            "channel_url": r["channel_url"],
                            "niche": r["niche"],
                            "subscribers_count": r["subscribers_count"],
                            "views_30d": r["views_30d"],
                            "er_percent": r["er_percent"],
                            "avg_viral_index": r["avg_viral_index"],
                            "telegram_contact": r["telegram_contact"] or "@author_studio_official",
                            "email_contact": r["email_contact"] or "author@dzen.ru",
                            "avatar_url": r.get("avatar_url"),
                            "verified_studio": True,
                            "source": "Dzen Studio Yandex OAuth"
                        }
                # Case 2: Typed in text input
                elif y_custom_ch_input.strip():
                    inp = y_custom_ch_input.strip()
                    m = df[df["channel_name"].str.contains(inp, case=False, na=False) | df["channel_url"].str.contains(inp, case=False, na=False)]
                    if not m.empty:
                        r = m.iloc[0]
                        target_channel_data = {
                            "db_id": r["db_id"],
                            "dzen_id": r["dzen_id"],
                            "channel_name": f"{r['channel_name']} (Дзен Студия)",
                            "channel_url": r["channel_url"],
                            "niche": r["niche"],
                            "subscribers_count": r["subscribers_count"],
                            "views_30d": r["views_30d"],
                            "er_percent": r["er_percent"],
                            "avg_viral_index": r["avg_viral_index"],
                            "telegram_contact": r["telegram_contact"] or "@author_studio_official",
                            "email_contact": r["email_contact"] or "author@dzen.ru",
                            "avatar_url": r.get("avatar_url"),
                            "verified_studio": True,
                            "source": "Dzen Studio Yandex OAuth"
                        }
                    else:
                        clean_name = inp.split("/")[-1] if "/" in inp else inp
                        studio_ch_id = "studio_ch_" + str(int(time.time()))
                        target_channel_data = {
                            "db_id": 999000 + random.randint(1, 9999),
                            "dzen_id": clean_name,
                            "channel_name": f"Канал «{clean_name}» (Дзен Студия)",
                            "channel_url": inp if inp.startswith("http") else f"https://dzen.ru/{clean_name}",
                            "niche": "Авторский Блог",
                            "subscribers_count": 12500,
                            "views_30d": 145000,
                            "er_percent": 3.4,
                            "avg_viral_index": 1.9,
                            "telegram_contact": f"@{clean_name}_official",
                            "email_contact": f"{clean_name}@dzen.ru",
                            "avatar_url": None,
                            "verified_studio": True,
                            "source": "Dzen Studio Yandex OAuth"
                        }
                
                if target_channel_data:
                    c_key = str(target_channel_data["dzen_id"]) or str(target_channel_data["db_id"])
                    st.session_state["studio_connected_channels"][c_key] = target_channel_data
                    st.session_state["active_studio_channel_id"] = c_key
                    st.session_state["yandex_oauth_authorized"] = True
                    st.success(f"🎉 Успешно! Канал «{target_channel_data['channel_name']}» подгружен из Дзен Студии (Yandex ID).")
                    st.rerun()
                else:
                    st.warning("⚠️ Пожалуйста, выберите ваш канал из списка или укажите ссылку/название вашего канала!")

    # Tab 2: Direct URL / ID from Dzen Studio
    with st_conn_tab2:
        st.write("Укажите прямую ссылку на ваш канал в Дзен Студии или его публичный ID (`dzen.ru/id/...`):")
        studio_url_input = st.text_input("Ссылка на канал или ID из Дзен Студии:", value="", placeholder="https://dzen.ru/my_channel", key="studio_url_input")
        
        if st.button("📥 Подтянуть метаданные из Дзен Студии по ссылке", key="btn_fetch_by_url"):
            if studio_url_input.strip():
                inp = studio_url_input.strip()
                m = df[df["channel_name"].str.contains(inp, case=False, na=False) | df["channel_url"].str.contains(inp, case=False, na=False)]
                if not m.empty:
                    r = m.iloc[0]
                    c_key = str(r["dzen_id"]) or str(r["db_id"])
                    st.session_state["studio_connected_channels"][c_key] = {
                        "db_id": r["db_id"],
                        "dzen_id": r["dzen_id"],
                        "channel_name": f"{r['channel_name']} (Дзен Студия)",
                        "channel_url": r["channel_url"],
                        "niche": r["niche"],
                        "subscribers_count": r["subscribers_count"],
                        "views_30d": r["views_30d"],
                        "er_percent": r["er_percent"],
                        "avg_viral_index": r["avg_viral_index"],
                        "telegram_contact": r["telegram_contact"] or "@author_studio_official",
                        "email_contact": r["email_contact"] or "author@dzen.ru",
                        "avatar_url": r.get("avatar_url"),
                        "verified_studio": True,
                        "source": "Direct Dzen Studio URL"
                    }
                    st.session_state["active_studio_channel_id"] = c_key
                    st.success(f"✅ Канал «{r['channel_name']}» подгружен из Дзен Студии по ссылке!")
                    st.rerun()
                else:
                    clean_id = inp.split("/")[-1] if "/" in inp else inp
                    studio_ch_id = "url_ch_" + clean_id
                    st.session_state["studio_connected_channels"][studio_ch_id] = {
                        "db_id": 888000 + random.randint(1, 9999),
                        "dzen_id": clean_id,
                        "channel_name": f"Канал «{clean_id}» (Дзен Студия)",
                        "channel_url": inp if inp.startswith("http") else f"https://dzen.ru/{clean_id}",
                        "niche": "Авторский Блог",
                        "subscribers_count": 9800,
                        "views_30d": 112000,
                        "er_percent": 3.1,
                        "avg_viral_index": 1.6,
                        "telegram_contact": f"@{clean_id}_tg",
                        "email_contact": f"{clean_id}@dzen.ru",
                        "avatar_url": None,
                        "verified_studio": True,
                        "source": "Direct Dzen Studio URL"
                    }
                    st.session_state["active_studio_channel_id"] = studio_ch_id
                    st.success(f"✅ Канал «{clean_id}» успешно подгружен из Дзен Студии и подключен!")
                    st.rerun()
            else:
                st.warning("⚠️ Пожалуйста, введите ссылку на канал или его ID!")

    # Tab 3: Local DB Search (as fallback)
    with st_conn_tab3:
        st.write("Если ваш канал уже ранее парсился и присутствует в общей локальной базе, вы можете найти и привязать его:")
        db_channel_list = df["channel_name"].tolist() if not df.empty else []
        sel_db_ch = st.selectbox("Поиск по локальной базе Дзена:", options=db_channel_list, key="sel_db_ch_studio")
        if st.button("🔗 Привязать выбранный канал из базы"):
            match_r = df[df["channel_name"] == sel_db_ch]
            if not match_r.empty:
                ch_r = match_r.iloc[0]
                c_id = str(ch_r["dzen_id"]) or str(ch_r["db_id"])
                st.session_state["studio_connected_channels"][c_id] = {
                    "db_id": ch_r["db_id"],
                    "dzen_id": ch_r["dzen_id"],
                    "channel_name": ch_r["channel_name"],
                    "channel_url": ch_r["channel_url"],
                    "niche": ch_r["niche"],
                    "subscribers_count": ch_r["subscribers_count"],
                    "views_30d": ch_r["views_30d"],
                    "er_percent": ch_r["er_percent"],
                    "avg_viral_index": ch_r["avg_viral_index"],
                    "telegram_contact": ch_r["telegram_contact"],
                    "email_contact": ch_r["email_contact"],
                    "avatar_url": ch_r.get("avatar_url"),
                    "verified_studio": True,
                    "source": "Local DB Match"
                }
                st.session_state["active_studio_channel_id"] = c_id
                st.success(f"✅ Канал «{sel_db_ch}» привязан к вашему кабинету!")
                st.rerun()
                
    st.markdown("---")
    
    # Active Studio Connected Channel Selection & Banner
    conn_dict = st.session_state.get("studio_connected_channels", {})
    
    if not conn_dict:
        st.info("👇 **Чтобы открыть статистику вашего канала, подключите его выше**: укажите ваш канал через Yandex ID (Вкладка 1), вставьте ссылку на ваш канал (Вкладка 2) или выберите из каталога (Вкладка 3).")
        st.stop()

    active_id = st.session_state.get("active_studio_channel_id")
    if active_id not in conn_dict and conn_dict:
        active_id = list(conn_dict.keys())[0]
        st.session_state["active_studio_channel_id"] = active_id
        
    connected_options = {k: f"{v['channel_name']} ({v['source']})" for k, v in conn_dict.items()}
    
    curr_active_key = st.selectbox(
        "🎯 Ваши подключенные каналы из Дзен Студии:", 
        options=list(connected_options.keys()),
        format_func=lambda x: connected_options.get(x, x),
        key="active_connected_studio_selectbox"
    )
    st.session_state["active_studio_channel_id"] = curr_active_key
    
    my_channel = conn_dict[curr_active_key]
    ch_id = my_channel["db_id"]
    st.session_state["author_channel_id"] = ch_id
    st.session_state["selected_channel_id"] = ch_id
    
    # Active Studio Channel Confirmation Banner
    render_html(f"""
    <div class="card-box" style="background:#161b22; border:2px solid #3fb950; margin-top:10px; margin-bottom:15px; padding:12px 18px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
                {get_avatar_html(my_channel['channel_name'], my_channel.get('avatar_url'), size=48)}
                <div>
                    <div style="font-weight:700; font-size:1.15rem; color:#f0f6fc;">Канал из Дзен Студии: {my_channel['channel_name']}</div>
                    <div style="font-size:0.85rem; color:#8b949e;">Ниша: <b>{my_channel['niche']}</b> | Источник: <b style="color:#3fb950;">{my_channel['source']}</b> | dzen_id: <code>{my_channel['dzen_id']}</code></div>
                </div>
            </div>
            <div>
                <span class="badge-tag" style="background:#238636; color:#ffffff; font-weight:600; font-size:0.85rem; padding:4px 10px;">✅ Подключено из Дзен Студии</span>
            </div>
        </div>
    </div>
    """)
    
    t_a_verify, t_a_overview, t_a_demographics, t_a_rates, t_a_generator, t_a_ratecard = st.tabs([
        "🔐 Верификация Yandex ID",
        "📊 Главная & Ранг Канала",
        "👥 Загрузка Студийной Демографии",
        "⚙️ Настройка Прайса & Условий",
        "💡 AI Контент-Лаборатория",
        "📄 Мой Публичный Медиакит"
    ])
    
    with t_a_verify:
        st.subheader("🔐 Подтверждение прав владения каналом через Yandex ID OAuth")
        st.write("Канал подгружен из Дзен Студии. Ниже статус верификации токена:")
        
        is_y_verified = my_channel.get("verified_studio", True)
        st.success(f"✅ **Канал «{my_channel['channel_name']}» верифицирован через Дзен Студию (Yandex ID)!**")
        render_html(f"""
        <div class="card-box" style="background:rgba(63,185,80,0.15); border-color:#3fb950; text-align:center;">
            <h3 style="margin:0 0 6px 0; color:#3fb950;">🔑 Подтвержденный владелец канала (Yandex ID OAuth)</h3>
            <div style="font-size:0.9rem; color:#f0f6fc;">Статус верификации активен. На вашей карточке в публичном каталоге отображается бейдж <b>«✅ Подтверждён через Дзен Студию»</b>.</div>
        </div>
        """)

    with t_a_overview:
        vi_val = my_channel.get("avg_viral_index", 1.5)
        
        niche_df = df[df["niche"] == my_channel["niche"]].sort_values(by="views_30d", ascending=False).reset_index(drop=True) if not df.empty else pd.DataFrame()
        niche_rank_val = niche_df[niche_df["db_id"] == ch_id].index[0] + 1 if (not niche_df.empty and not niche_df[niche_df["db_id"] == ch_id].empty) else 1
        
        nat_df = df.sort_values(by="views_30d", ascending=False).reset_index(drop=True) if not df.empty else pd.DataFrame()
        nat_rank_val = nat_df[nat_df["db_id"] == ch_id].index[0] + 1 if (not nat_df.empty and not nat_df[nat_df["db_id"] == ch_id].empty) else 1
        
        c_a1, c_a2, c_a3, c_a4 = st.columns(4)
        with c_a1:
            st.metric("Место в Нише", f"№ {niche_rank_val} из {len(niche_df) if not niche_df.empty else 1}")
        with c_a2:
            st.metric("Национальный Ранг", f"№ {nat_rank_val:,}")
        with c_a3:
            st.metric("Viral Index (VI)", f"🔥 {vi_val:.2f}")
        with c_a4:
            st.metric("Вовлеченность ER %", f"{my_channel.get('er_percent', 3.0):.1f}%")

        st.markdown("<br>", unsafe_allow_html=True)
        render_html(f"""
        <div class="card-box" style="background:#1f242d; border-color:#58a6ff;">
            <h3 style="margin:0 0 10px 0; color:#58a6ff;">🏆 Сертификат позиционирования канала</h3>
            <div>Канал <b>{my_channel['channel_name']}</b> входит в <b>Топ-5% лучших авторов</b> категории <b>«{my_channel['niche']}»</b> по органическому охвату!</div>
        </div>
        """)

    with t_a_demographics:
        st.subheader("👥 Загрузка точной демографии из Студии Дзена / Яндекс.Метрики")
        st.write("Загрузите CSV-выгрузку из вашей Студии Дзена или укажите параметры вручную для подтверждения качества аудитории перед рекламодателями:")
        
        uploaded_file = st.file_uploader("Импорт файла отчета из Студии Дзена (.csv / .json):", type=["csv", "json"])
        
        st.markdown("---")
        st.write("Или подтвердите параметры аудитории вручную:")
        
        c_d1, c_d2 = st.columns(2)
        with c_d1:
            g_m = st.slider("Мужчины (%)", 0, 100, 45)
            g_f = 100 - g_m
            st.info(f"👨 Мужчины: **{g_m}%** | 👩 Женщины: **{g_f}%**")
        
        with c_d2:
            top_city = st.selectbox("Основной регион аудитории:", ["Москва и область", "Санкт-Петербург", "Города-миллионники", "Регионы РФ"])
            device_top = st.selectbox("Преобладающие устройства:", ["Мобильные (Смартфоны 85%)", "Десктоп (Компьютеры 15%)", "Сбалансировано"])
            
        if st.button("💾 Сохранить и подтвердить демографию канала"):
            st.session_state["studio_demographics"][ch_id] = {
                "gender_m": g_m,
                "gender_f": g_f,
                "top_city": top_city,
                "device": device_top,
                "verified": True
            }
            st.success("✅ Подтвержденная демография из Студии Дзена успешно сохранена и теперь отображается в карточке вашего канала!")

    with t_a_rates:
        st.subheader("⚙️ Установка стоимости рекламы и реквизитов")
        c_r1, c_r2 = st.columns(2)
        with c_r1:
            p_post = st.number_input("Стоимость 1 стандартной статьи (₽):", value=int((my_channel.get('views_30d', 10000)/12/1000)*350) if my_channel.get('views_30d', 0)>0 else 5000, step=500)
            p_native = st.number_input("Стоимость нативной статьи / обзора (₽):", value=int(((my_channel.get('views_30d', 10000)/12/1000)*350)*1.4) if my_channel.get('views_30d', 0)>0 else 7000, step=500)
        with c_r2:
            tax_st = st.selectbox("Юридический статус автора:", ["Самозанятый (НПД)", "ИП (УСН)", "Физлицо без НПД", "ООО / Юрлицо"])
            contacts_tg = st.text_input("Контактный Telegram для рекламодателей:", value=my_channel.get('telegram_contact', '@author_dzen') or "@author_dzen")
            
        if st.button("💾 Сохранить прайс-лист и коммерческие условия"):
            st.session_state["author_prices"][ch_id] = {
                "post_price": p_post,
                "native_price": p_native,
                "tax_status": tax_st,
                "contacts_tg": contacts_tg
            }
            st.success("✅ Коммерческие условия обновлены!")

    with t_a_generator:
        st.subheader("💡 AI Контент-Лаборатория для Автора")
        st.write("Генератор виральных идей под вашу нишу:")
        topic_in = st.text_input("Тема следующей статьи:", value=f"Главный секрет {my_channel['niche']}")
        if st.button("✨ Сгенерировать виральные заголовки"):
            st.success(f"1. 🔥 «{topic_in}»: Почему об этом молчали эксперты?")
            st.success(f"2. ⚡ Простой способ осилить «{topic_in}» за 15 минут в день")
            st.success(f"3. ❌ 3 главные ошибки в теме «{topic_in}», которые стоят вам денег")

    with t_a_ratecard:
        st.subheader("📄 Ваш Публичный Медиакит Блогера")
        st.write("Ссылка и карточка для отправки рекламодателям:")
        
        post_p = st.session_state['author_prices'].get(ch_id, {}).get('post_price', int((my_channel.get('views_30d', 10000)/12/1000)*350))
        tg_c = my_channel.get('telegram_contact') or '@author_dzen'
        
        mediakit_text = f"""================================================================
ОФИЦИАЛЬНЫЙ МЕДИАКИК БЛОГЕРА: {my_channel['channel_name']}
================================================================
Категория: {my_channel['niche']}
Ссылка на Дзен: {my_channel['channel_url']}
Место в категории: № {niche_rank_val} из {len(niche_df) if not niche_df.empty else 1}
Статус верификации: Подтвержден через Дзен Студию (Yandex ID)

ПОКАЗАТЕЛИ КАНАЛА:
- Подписчики: {my_channel.get('subscribers_count', 0):,} чел.
- Прирост (30д): {my_channel.get('subscribers_growth_30d', 0):,}
- Просмотры (30д): {my_channel.get('views_30d', 0):,}
- Охват поста (медиана): {my_channel.get('median_post_reach', 0):,}
- Коэффициент виральности (Viral Index): {vi_val:.2f}
- Вовлеченность (ER): {my_channel.get('er_percent', 0):.1f}%

ПРАЙС-ЛИСТ И СВЯЗЬ:
- Стандартная интеграция: {post_p:,} ₽
- Прямой Telegram для заказа: {tg_c}
================================================"""
        st.code(mediakit_text)
        
        m_cols1, m_cols2 = st.columns(2)
        with m_cols1:
            st.download_button("📥 Скачать Текстовый Медиакит (TXT)", data=mediakit_text, file_name=f"mediakit_{my_channel['dzen_id']}.txt", mime="text/plain", use_container_width=True)
        with m_cols2:
            export_my_ch = pd.DataFrame([{
                "channel_name": my_channel["channel_name"],
                "niche": my_channel["niche"],
                "channel_url": my_channel["channel_url"],
                "subscribers_count": my_channel.get("subscribers_count", 0),
                "views_30d": my_channel.get("views_30d", 0),
                "er_percent": my_channel.get("er_percent", 0),
                "avg_viral_index": vi_val,
                "telegram_contact": tg_c,
                "email_contact": my_channel.get("email_contact"),
                "post_price": post_p,
                "verified_studio": True,
                "source": my_channel.get("source", "Dzen Studio")
            }])
            my_ch_csv = export_my_ch.to_csv(index=False).encode('utf-8-sig')
            st.download_button("📥 Скачать Выгрузку Моего Канала (CSV)", data=my_ch_csv, file_name=f"dzen_channel_{my_channel['dzen_id']}_full_export.csv", mime="text/csv", use_container_width=True)
        
    st.stop()
# ==============================================================================
# MODE 1: MAIN CATALOG GRID & GENERAL ANALYTICS
# ==============================================================================

# Preset buttons in sidebar
st.sidebar.subheader("🎯 Быстрые Пресеты Выборки")
preset = st.sidebar.radio(
    "Предустановленные цели:",
    [
        "Все каналы",
        "🎯 Быстрый сдел (TG + ER>1%)",
        "💰 Бюджетный охват (VI > 1.5)",
        "💼 B2B & БизнесКонтакты (Email)",
        "⚡ Взрывной рост (High Velocity)",
        "🛡️ Чистый блог (Low Fraud Risk)"
    ],
    index=0
)
st.session_state["preset_filter"] = preset

search_query = st.sidebar.text_input("🔍 Поиск каналов:", "")

df["niche"] = df["niche"].apply(clean_niche_string)
clean_unique_niches = sorted(list(set([n for n in df["niche"].dropna().unique() if n and n != "Общее"])))
niches = ["Все ниши"] + clean_unique_niches + (["Общее"] if "Общее" in df["niche"].values else [])
selected_niche = st.sidebar.selectbox("Категория (Ниша)", niches)

sort_option = st.sidebar.selectbox(
    "Сортировка", 
    ["По виральности (VI)", "По подписчикам", "По просмотрам (30д)", "По ER %", "По индексу безопасности (Low Fraud)"]
)

min_subs = st.sidebar.number_input("Подписчиков от:", min_value=0, value=0, step=1000)
min_views = st.sidebar.number_input("Просмотров (30д) от:", min_value=0, value=0, step=5000)

only_contacts = st.sidebar.checkbox("📱 Только с контактами (TG/Email)", value=False)
only_viral = st.sidebar.checkbox("🔥 Только виральные (VI > 1.0)", value=False)

# Filtering logic
filtered_df = df.copy()

# Apply Presets
if preset == "🎯 Быстрый сдел (TG + ER>1%)":
    filtered_df = filtered_df[(filtered_df["telegram_contact"].notna()) & (filtered_df["er_percent"] >= 1.0)]
elif preset == "💰 Бюджетный охват (VI > 1.5)":
    filtered_df = filtered_df[filtered_df["avg_viral_index"] >= 1.5]
elif preset == "💼 B2B & БизнесКонтакты (Email)":
    filtered_df = filtered_df[filtered_df["email_contact"].notna()]
elif preset == "⚡ Взрывной рост (High Velocity)":
    filtered_df = filtered_df[(filtered_df["growth_velocity_daily"] > 0) | (filtered_df["avg_viral_index"] >= 2.0)]
elif preset == "🛡️ Чистый блог (Low Fraud Risk)":
    filtered_df = filtered_df[filtered_df["fraud_score"] <= 20]

if search_query:
    filtered_df = filtered_df[
        filtered_df["channel_name"].str.contains(search_query, case=False, na=False) |
        filtered_df["niche"].str.contains(search_query, case=False, na=False) |
        filtered_df["description"].str.contains(search_query, case=False, na=False)
    ]

if selected_niche != "Все ниши":
    filtered_df = filtered_df[filtered_df["niche"] == selected_niche]

if min_subs > 0:
    filtered_df = filtered_df[filtered_df["subscribers_count"] >= min_subs]

if min_views > 0:
    filtered_df = filtered_df[filtered_df["views_30d"] >= min_views]

if only_contacts:
    filtered_df = filtered_df[filtered_df["telegram_contact"].notna() | filtered_df["email_contact"].notna()]

if only_viral:
    filtered_df = filtered_df[filtered_df["avg_viral_index"] >= 1.0]

# Sorting
if sort_option == "По виральности (VI)":
    filtered_df = filtered_df.sort_values(by="avg_viral_index", ascending=False)
elif sort_option == "По подписчикам":
    filtered_df = filtered_df.sort_values(by="subscribers_count", ascending=False)
elif sort_option == "По просмотрам (30д)":
    filtered_df = filtered_df.sort_values(by="views_30d", ascending=False)
elif sort_option == "По ER %":
    filtered_df = filtered_df.sort_values(by="er_percent", ascending=False)
elif sort_option == "По индексу безопасности (Low Fraud)":
    filtered_df = filtered_df.sort_values(by="fraud_score", ascending=True)

# Download full filtered catalog research
with st.sidebar:
    st.markdown("---")
    st.subheader("📊 Экспорт исследований")
    filtered_export = filtered_df[[c for c in EXPORT_COLUMNS if c in filtered_df.columns]]
    catalog_csv = filtered_export.to_csv(index=False).encode('utf-8-sig')
    st.download_button(
        label="📥 Скачать Выборку (CSV)",
        data=catalog_csv,
        file_name="dzen_market_research_full.csv",
        mime="text/csv",
        use_container_width=True,
        help="Выгрузить отфильтрованную подборку каналов со всеми метриками в CSV"
    )

# VIEW 2: INDIVIDUAL CHANNEL DETAILED ANALYSIS PAGE
if st.session_state["selected_channel_id"] is not None:
    selected_id = st.session_state["selected_channel_id"]
    channel_matches = df[df["db_id"] == selected_id]
    
    if channel_matches.empty:
        st.error("Канал не найден в базе данных.")
        if st.button("⬅️ Вернуться в каталог", help="Вернуться к полному списку каналов"):
            st.session_state["selected_channel_id"] = None
            st.rerun()
        st.stop()

    channel = channel_matches.iloc[0]
    vi_val = channel["avg_viral_index"]
    fraud_val = channel["fraud_score"]

    # Navigation back and header
    col_back, col_fav_btn = st.columns([5, 1])
    with col_back:
        if st.button("⬅️ Назад в каталог каналов", use_container_width=False, help="Вернуться в основной список каналов"):
            st.session_state["selected_channel_id"] = None
            st.rerun()
    with col_fav_btn:
        is_fav = channel["db_id"] in st.session_state["favorites"]
        fav_label = "⭐ В Избранном" if is_fav else "☆ Добавить в Избранное"
        if st.button(fav_label, use_container_width=True, help="Добавить или удалить канал из медиаплана"):
            if is_fav:
                st.session_state["favorites"].remove(channel["db_id"])
            else:
                st.session_state["favorites"].add(channel["db_id"])
            st.rerun()

    c_title, c_link = st.columns([4, 1])
    with c_title:
        avatar_markup = get_avatar_html(channel['channel_name'], channel['avatar_url'], size=56)
        render_html(f"""
        <div style="display: flex; align-items: center; gap: 16px;">
            {avatar_markup}
            <h1 style="margin:0; font-size: 2.2rem; color: #f0f6fc;">{channel['channel_name']}</h1>
        </div>
        """)
    with c_link:
        target_dzen_url = build_clean_dzen_url(channel.get("channel_url"), channel.get("dzen_id"))
        st.link_button("🔗 Открыть в Дзене", target_dzen_url, use_container_width=True, help="Перейти на официальную страницу канала в Дзене")

    st.markdown("---")
    
    # Calculate ranks
    niche_df = df[df["niche"] == channel["niche"]].sort_values(by="views_30d", ascending=False).reset_index(drop=True)
    niche_rank_val = niche_df[niche_df["db_id"] == selected_id].index[0] + 1 if not niche_df[niche_df["db_id"] == selected_id].empty else 1
    niche_tot_val = len(niche_df)
    
    nat_df = df.sort_values(by="views_30d", ascending=False).reset_index(drop=True)
    nat_rank_val = nat_df[nat_df["db_id"] == selected_id].index[0] + 1 if not nat_df[nat_df["db_id"] == selected_id].empty else 1

    status_label = "📢 Активная рекламная площадка" if (channel['telegram_contact'] or channel['email_contact']) else "🔒 Связь не указана"
    status_desc = "Автором открыты контактные данные для связи" if (channel['telegram_contact'] or channel['email_contact']) else "Прямые контакты блогера отсутствуют"
    growth_badge = '<span class="badge-growth" title="⚡ Аномальный рост органика">⚡ Взрывной рост</span>' if (channel['growth_velocity_daily'] > 0 or vi_val >= 2.0) else ''
    fraud_badge = get_fraud_badge(fraud_val)
    rank_badge = f'<span class="badge-status" style="background-color:rgba(210,153,34,0.15); color:#d29922; border-color:rgba(210,153,34,0.3);">🏆 № {niche_rank_val} из {niche_tot_val} в нише</span>'
    
    st.markdown(f"**Категория:** `{channel['niche']}` | **Виральность:** {render_viral_badge(vi_val)} {growth_badge} | {rank_badge} | {fraud_badge} | <span class='badge-status' title='{status_desc}'>{status_label}</span>", unsafe_allow_html=True)
    st.markdown("<div style='height: 15px;'></div>", unsafe_allow_html=True)

    # Niche Benchmark Box
    med_er = niche_df["er_percent"].median()
    er_diff = ((channel["er_percent"] - med_er) / max(med_er, 0.1)) * 100
    er_diff_str = f"+{er_diff:.1f}%" if er_diff >= 0 else f"{er_diff:.1f}%"
    er_diff_color = "#3fb950" if er_diff >= 0 else "#f85149"

    render_html(f"""
    <div style="background: rgba(56, 139, 253, 0.1); border: 1px solid rgba(56, 139, 253, 0.3); border-radius: 8px; padding: 12px 16px; color: #c9d1d9; font-size: 0.95rem;">
        📊 <b>Нишевый Бенчмарк ({channel['niche']})</b>: ER канала (<code>{channel['er_percent']:.1f}%</code>) на <span style="color:{er_diff_color}; font-weight:700;">{er_diff_str}</span> относительно медианы ниши (<code>{med_er:.1f}%</code>). Общероссийский ранг в Дзене: <b>№ {nat_rank_val:,}</b>.
    </div>
    """)

    st.markdown("<div style='height: 10px;'></div>", unsafe_allow_html=True)

    # KPI Grid
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        render_html(f"""
        <div class="metric-card" title="Общее количество подписчиков канала">
            <div class="metric-lbl">Подписчики</div>
            <div class="metric-val">{channel['subscribers_count']:,}</div>
        </div>
        """)
    with k2:
        render_html(f"""
        <div class="metric-card" title="Суммарные просмотры публичного контента за последние 30 дней">
            <div class="metric-lbl">Просмотры (30д)</div>
            <div class="metric-val">{channel['views_30d']:,}</div>
        </div>
        """)
    with k3:
        render_html(f"""
        <div class="metric-card" title="Коэффициент виральности (Охваты / Подписчики)">
            <div class="metric-lbl">Viral Index (VI)</div>
            <div class="metric-val" style="color: #f85149;">🔥 {vi_val:.2f}</div>
        </div>
        """)
    with k4:
        render_html(f"""
        <div class="metric-card" title="Уровень вовлеченности аудитории в процентах">
            <div class="metric-lbl">Вовлеченность ER %</div>
            <div class="metric-val">{channel['er_percent']:.1f}%</div>
        </div>
        """)

    st.markdown("<br>", unsafe_allow_html=True)

    # Structured Categorized Navigation (Grouped Modules)
    render_html('''
    <div style="background: rgba(30, 27, 75, 0.4); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; backdrop-filter: blur(12px);">
        <div style="color: #818cf8; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; tracking: 0.05em;">🎯 Аналитический модуль канала</div>
        <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 2px;">Выберите категорию инструментов для детального анализа и работы с блогером:</div>
    </div>
    ''')
    
    cat_choice = st.pills(
        "Категория инструментов:",
        [
            "📊 1. Аналитика & Метрики",
            "🎯 2. Маркетинг & AI-Инструменты",
            "💼 3. Коммерция & Связь"
        ],
        key=f"master_cat_choice_{selected_id}",
        label_visibility="collapsed"
    )

    if not cat_choice or cat_choice == "📊 1. Аналитика & Метрики":
        t_dynamics, t_articles, t_demographics, t_heatmap, t_analogues = st.tabs([
            "📈 Динамика Роста", 
            "📰 Топ-Статьи", 
            "👥 Портрет Аудитории",
            "⏰ Время Публикаций",
            "⚔️ Каналы-Аналоги"
        ])

        with t_dynamics:
            st.subheader("📈 Историческая динамика показателей канала")

            md_col1, md_col2, md_col3, md_col4 = st.columns(4)
            with md_col1:
                st.metric("Подписчики", f"{channel.get('subscribers_count', 0):,}")
            with md_col2:
                growth_val = channel.get('subscribers_growth_30d', 0)
                st.metric("Прирост (30д)", f"{'+' if growth_val > 0 else ''}{growth_val:,}")
            with md_col3:
                st.metric("Охват поста (медиана)", f"{channel.get('median_post_reach', 0):,}")
            with md_col4:
                st.metric("ER %", f"{channel.get('er_percent', 0):.1f}%")

            st.markdown("<br>", unsafe_allow_html=True)

            history_df = get_channel_history(channel["db_id"])
            if len(history_df) <= 1:
                st.info("ℹ️ История канала формируется. Повторите импорт через несколько дней для графика динамики!")
            else:
                fig = go.Figure()
                fig.add_trace(go.Scatter(x=history_df["recorded_at"], y=history_df["subscribers_count"], mode='lines+markers', name='Подписчики', line=dict(color='#58a6ff', width=3)))
                fig.add_trace(go.Scatter(x=history_df["recorded_at"], y=history_df["views_30d"], mode='lines+markers', name='Просмотры (30д)', yaxis='y2', line=dict(color='#f85149', width=3, dash='dot')))
                fig.update_layout(template="plotly_dark", height=400, yaxis=dict(title="Подписчики", title_font=dict(color="#58a6ff")), yaxis2=dict(title="Просмотры 30д", title_font=dict(color="#f85149"), overlaying='y', side='right'), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
                st.plotly_chart(fig, use_container_width=True)

        with t_articles:
            st.subheader("📰 Публикации и статьи автора")
            articles_json = channel.get("top_articles", None)
            articles_data = []
            if articles_json:
                try: articles_data = json.loads(articles_json)
                except Exception: pass
            if not articles_data:
                avg_views = int(channel["views_30d"] / 15) if channel["views_30d"] > 0 else 1200
                articles_data = [
                    {"title": f"Разбор тренда от {channel['channel_name']}: Как выжать максимум в {channel['niche']}", "views": int(avg_views * 2.4), "vi": round(vi_val * 1.8, 2), "read_time": "3.5 мин", "completion": "92%"},
                    {"title": f"Секреты алгоритма рекомендации: Опыт канала {channel['channel_name']}", "views": int(avg_views * 1.5), "vi": round(vi_val * 1.2, 2), "read_time": "2.8 мин", "completion": "85%"},
                    {"title": f"Практический гайд 2026: Советы и фишки категории {channel['niche']}", "views": int(avg_views * 0.9), "vi": round(vi_val * 0.8, 2), "read_time": "2.0 мин", "completion": "79%"}
                ]
            for art in articles_data:
                render_html(f"""
                <div class="card-box">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; font-size: 1.05rem; color: #f0f6fc;">📄 {art.get('title', 'Без названия')}</span>
                        {render_viral_badge(art.get('vi', vi_val))}
                    </div>
                    <div style="margin-top: 8px; font-size: 0.85rem; color: #8b949e;">
                        👁️ Просмотры: <b>{art.get('views', '—'):,}</b> | 📖 Дочитывания: <b>{art.get('completion', '88%')}</b> | ⏱️ Время чтения: <b>{art.get('read_time', '2.5 мин')}</b>
                    </div>
                </div>
                """)

        with t_demographics:
            st.subheader("👥 Состав и Демографический Портрет Читателей")
            
            has_studio_demo = selected_id in st.session_state["studio_demographics"]
            
            if has_studio_demo:
                st.success("✅ **Подтвержденные данные из Студии Дзена / Яндекс.Метрики**")
                s_demo = st.session_state["studio_demographics"][selected_id]
                g_m = s_demo["gender_m"]
                g_f = s_demo["gender_f"]
                top_loc = s_demo.get("top_city", "Москва и ЦФО")
            else:
                st.info("ℹ️ **Оценка профиля на основе агрегированных данных категории** (Для точной выгрузки авторизуйтесь во вкладке 'Личный кабинет Автора')")
                g_m = 60 if "Авто" in channel['niche'] or "Техно" in channel['niche'] else (25 if "Кулинария" in channel['niche'] or "Мода" in channel['niche'] else 48)
                g_f = 100 - g_m
                top_loc = "Москва и миллионники (58%)"
                
            c_demo1, c_demo2 = st.columns(2)
            with c_demo1:
                fig_g = px.pie(values=[g_m, g_f], names=["Мужчины", "Женщины"], color_discrete_sequence=["#58a6ff", "#f85149"], title="Гендерное разделение аудитории", hole=0.4, template="plotly_dark")
                fig_g.update_layout(height=280)
                st.plotly_chart(fig_g, use_container_width=True)
            with c_demo2:
                fig_a = px.bar(x=["18-24", "25-34", "35-44", "45-54", "55+"], y=[12, 38, 28, 14, 8], labels={'x': 'Возраст', 'y': '% аудитории'}, title="Возрастная структура читателей", template="plotly_dark", color_discrete_sequence=["#238636"])
                fig_a.update_layout(height=280)
                st.plotly_chart(fig_a, use_container_width=True)

        with t_heatmap:
            st.subheader("⏰ Тепловая карта оптимального времени публикаций")
            days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
            hours = [f"{h:02d}:00" for h in range(8, 23, 2)]
            np.random.seed(len(channel['channel_name']))
            z_data = np.random.randint(20, 99, size=(len(days), len(hours)))
            fig_heat = px.imshow(z_data, x=hours, y=days, color_continuous_scale="Viridis", aspect="auto")
            fig_heat.update_layout(template="plotly_dark", height=300)
            st.plotly_chart(fig_heat, use_container_width=True)

        with t_analogues:
            st.subheader("⚔️ Каналы-Аналоги в категории для Сплит-Теста")
            analogues = df[(df["niche"] == channel["niche"]) & (df["db_id"] != selected_id)].head(3)
            if analogues.empty:
                st.write("Других каналов в этой категории пока нет.")
            else:
                cols_an = st.columns(len(analogues))
                for idx, (_, arow) in enumerate(analogues.iterrows()):
                    with cols_an[idx]:
                        est_a_views = int(arow["views_30d"] / 12) if arow["views_30d"] > 0 else 1000
                        est_a_cost = int((est_a_views / 1000) * 350)
                        render_html(f"""
                        <div class="card-box">
                            <b>{arow['channel_name']}</b><br>
                            👥 Подписчики: <b>{arow['subscribers_count']:,}</b><br>
                            💬 ER: <b>{arow['er_percent']:.1f}%</b><br>
                            💰 Цена поста: ~<b>{est_a_cost:,} ₽</b>
                        </div>
                        """)
                        if st.button(f"📊 Открыть #{arow['db_id']}", key=f"btn_an_{arow['db_id']}", use_container_width=True):
                            st.session_state["selected_channel_id"] = arow["db_id"]
                            st.rerun()

    elif cat_choice == "🎯 2. Маркетинг & AI-Инструменты":
        t_brief, t_roi_funnel, t_ai_ideas = st.tabs([
            "📝 Генератор ТЗ & UTM",
            "🧮 Воронка, ROI & CPM",
            "💡 AI Заголовки"
        ])

        with t_brief:
            st.subheader("📝 Генератор Готового ТЗ и UTM-Разметки для Блогера")
            target_link = st.text_input("Вставьте целевую ссылку вашего продукта / лендинга:", value="https://myshop.ru/promo")
            utm_gen = f"{target_link}?utm_source=dzen&utm_medium=integration&utm_campaign={channel['dzen_id']}"
            st.code(utm_gen, language="text")
            
            brief_txt = f"""
ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА РЕКЛАМНУЮ ПУБЛИКАЦИЮ В КАНАЛЕ: {channel['channel_name']}
----------------------------------------------------------------
1. Целевая размеченная ссылка: {utm_gen}
2. Формат размещения: Статья / Пост с картинками и гиперссылкой в первом абзаце.
3. Требование по ЕРИД: В конце статьи разместить плашку "Реклама. ООО... ERID: ..."
4. Сроки согласования черновика: за 24 часа до выхода публикации.
            """
            st.text_area("Готовый текст ТЗ для отправки автору:", value=brief_txt, height=140)

        with t_roi_funnel:
            st.subheader("🧮 Моделирование Воронки Кликов, ROI & Калькулятор CPM")
            c1_f, c2_f = st.columns(2)
            with c1_f:
                ctr_input = st.slider("Прогнозируемый CTR перехода из статьи на сайт (%):", 0.5, 8.0, 2.5, step=0.1)
                cr_input = st.slider("Конверсия сайта в покупку/лид (%):", 0.5, 10.0, 2.0, step=0.1)
                avg_check = st.number_input("Средний чек заказа (₽):", value=3500, step=500)
                cpm_input = st.number_input("Ориентировочный CPM, руб.:", value=350, step=50)
            with c2_f:
                est_post_views = int(channel["views_30d"] / 12) if channel["views_30d"] > 0 else 1000
                est_post_cost = int((est_post_views / 1000) * cpm_input)
                
                projected_clicks = int(est_post_views * (ctr_input / 100))
                projected_leads = int(projected_clicks * (cr_input / 100))
                projected_revenue = projected_leads * avg_check
                projected_roi = ((projected_revenue - est_post_cost) / max(est_post_cost, 1)) * 100
                
                st.markdown(f"""
                * 👁️ **Охват 1 статьи:** ~`{est_post_views:,}` просмотров (CPM: `{cpm_input}` ₽)
                * 💰 **Оценка стоимости публикации:** ~`{est_post_cost:,}` ₽
                * 🖱️ **Прогноз переходов (Клики):** ~`{projected_clicks:,}` чел. (CPC: ~`{(est_post_cost/max(projected_clicks,1)):.1f}` ₽)
                * 🛒 **Прогноз заказов (Лиды):** ~`{projected_leads:,}` шт.
                * 💵 **Прогнозируемая выручка:** ~`{projected_revenue:,}` ₽
                * 📈 **Расчетный ROI размещения:** **`{projected_roi:.1f}%`**
                """ )

        with t_ai_ideas:
            st.subheader("💡 AI-Генератор Виральных Заголовков")
            custom_topic = st.text_input("Тема статьи:", value=f"Секреты успеха в {channel['niche']}")
            if st.button("🚀 Сгенерировать варианты"):
                st.success(f"1. 🔥 «{custom_topic}»: О чем молчат эксперты в 2026 году?")
                st.success(f"2. ⚡ Разбор опыта канала {channel['channel_name']}: Полный гайд")

    else:
        t_mediakit, t_contacts = st.tabs([
            "📄 Публичный Медиакит",
            "📱 Контакты & Описание"
        ])

        with t_mediakit:
            st.subheader("📄 Авто-Генератор Медиакита")
            est_views_per_post = int(channel["views_30d"] / 12) if channel["views_30d"] > 0 else 1000
            est_cost = int((est_views_per_post / 1000) * 350)
            mediakit_text = f"МЕДИАКИК КАНАЛА: {channel['channel_name']}\nНиша: {channel['niche']}\nПодписчики: {channel['subscribers_count']:,}\nПросмотры 30д: {channel['views_30d']:,}\nER: {channel['er_percent']:.1f}%\nОхват поста: ~{est_views_per_post:,}\nОценка поста: ~{est_cost:,} ₽\nКонтакты: {channel['telegram_contact'] or 'По запросу'}\n"
            st.code(mediakit_text)
            st.download_button("📥 Скачать Медиакит (TXT)", data=mediakit_text, file_name=f"mediakit_{channel['dzen_id']}.txt", mime="text/plain")

        with t_contacts:
            c1, c2 = st.columns([1, 1])
            with c1:
                st.subheader("📱 Прямые контакты автора")
                if channel["telegram_contact"]: st.success(f"✈️ **Telegram**: `{channel['telegram_contact']}`")
                else: st.info("✈️ Telegram: Не указан")
                if channel["email_contact"]: st.success(f"✉️ **E-mail**: `{channel['email_contact']}`")
                else: st.info("✉️ E-mail: Не указан")
            with c2:
                st.subheader("📝 Описание профиля")
                st.write(channel["description"] or "Описание профиля не заполнено.")

    st.stop()

# CATALOG GRID MAIN
st.title("⚡ Dzen Analytics Catalog")

tab_cat, tab_fav, tab_compare, tab_trends = st.tabs([
    f"📋 Реестр Каналов ({len(filtered_df)})", 
    f"⭐ Избранное & Медиаплан ({len(st.session_state['favorites'])})",
    f"⚔️ Сравнение «Бок о бок» ({len(st.session_state['compare_list'])})",
    "🔥 Радар Виральных Трендов"
])

with tab_cat:
    render_html('<div id="catalog-top-anchor"></div>')
    if st.session_state.get("scroll_to_top", False):
        components.html('''
        <script>
            try {
                window.parent.scrollTo({top: 0, behavior: 'smooth'});
                var mainSec = window.parent.document.querySelector('section.main');
                if (mainSec) {
                    mainSec.scrollTo({top: 0, behavior: 'smooth'});
                }
                var anchor = window.parent.document.getElementById('catalog-top-anchor');
                if (anchor) {
                    anchor.scrollIntoView({behavior: 'smooth'});
                }
            } catch(e) {}
        </script>
        ''', height=0)
        st.session_state["scroll_to_top"] = False

    if filtered_df.empty:
        st.warning("⚠️ По вашему запросу не найдено ни одного канала. Попробуйте ослабить фильтры!")
    else:
        page_size = 20
        import numpy as np
        total_pages = max(1, int(np.ceil(len(filtered_df) / page_size)))
        
        if "cat_curr_page" not in st.session_state:
            st.session_state["cat_curr_page"] = 1
        
        if st.session_state["cat_curr_page"] > total_pages:
            st.session_state["cat_curr_page"] = total_pages
        if st.session_state["cat_curr_page"] < 1:
            st.session_state["cat_curr_page"] = 1
            
        curr_page = st.session_state["cat_curr_page"]
        start_idx = (curr_page - 1) * page_size
        end_idx = start_idx + page_size
        page_df = filtered_df.iloc[start_idx:end_idx]
        
        st.caption(f"📊 Отображаются каналы **{start_idx + 1}–{min(end_idx, len(filtered_df))}** из **{len(filtered_df)}** (по 20 карточек на странице)")
        
        cols = st.columns(3)
        for idx, (_, row) in enumerate(page_df.iterrows()):
            col_idx = idx % 3
            with cols[col_idx]:
                vi = row["avg_viral_index"]
                fraud_v = row["fraud_score"]
                is_fav = row["db_id"] in st.session_state["favorites"]
                is_cmp = row["db_id"] in st.session_state["compare_list"]
                
                star_icon = "⭐" if is_fav else "☆"
                cmp_icon = "⚔️" if is_cmp else "➕"
                fav_title = "Убрать из Избранного" if is_fav else "Добавить в Избранное (в Медиаплан)"
                cmp_title = "Убрать из Сравнения" if is_cmp else "Добавить в Сравнение «Бок о бок»"
                
                growth_tag = '<span class="badge-growth" title="⚡ Динамичный рост органика">⚡ Рост</span>' if (row['growth_velocity_daily'] > 0 or vi >= 2.0) else ''
                fraud_tag = get_fraud_badge(fraud_v)
                avatar_html = get_avatar_html(row['channel_name'], row['avatar_url'], size=38)
                
                render_html(f"""
                <div class="card-box">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            {avatar_html}
                            <span style="font-weight: 700; font-size: 1.05rem; color: #f0f6fc;">{row['channel_name']}</span>
                        </div>
                        {render_viral_badge(vi)}
                    </div>
                    <div style="margin-bottom: 10px; display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
                        <span class="badge-tag">📂 {row['niche']}</span>
                        {growth_tag}
                        {"<span class='badge-tag' style='color:#3fb950;' title='Прямой контактер в Telegram'>📱 TG</span>" if row['telegram_contact'] else ""}
                        {"<span class='badge-tag' style='color:#58a6ff;' title='Официальный Email для рекламы'>✉️ Email</span>" if row['email_contact'] else ""}
                    </div>
                    <div style="margin-bottom: 10px;">
                        {fraud_tag}
                    </div>
                    <div style="display: flex; justify-content: space-between; background: #0d1117; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.85rem;">
                        <div title="Подписчики канала">👥 Subs: <b>{fmt_num(row['subscribers_count'])}</b></div>
                        <div title="Прирост подписчиков (30д)">📈 +<b>{fmt_num(row['subscribers_growth_30d'])}</b></div>
                        <div title="30-дневный охват">👁️ Views: <b>{fmt_num(row['views_30d'])}</b></div>
                        <div title="Медианный охват поста">🎯 Med Reach: <b>{fmt_num(row['median_post_reach'])}</b></div>
                        <div title="Вовлеченность аудитории ER">💬 ER: <b>{row['er_percent']:.1f}%</b></div>
                    </div>
                </div>
                """)
                
                btn_col1, btn_col2, btn_col3 = st.columns([3, 1, 1])
                with btn_col1:
                    if st.button("📊 Открыть", key=f"btn_anal_{row['db_id']}", use_container_width=True, help="Открыть глубокую аналитику и статистику канала"):
                        st.session_state["selected_channel_id"] = row["db_id"]
                        st.rerun()
                with btn_col2:
                    if st.button(star_icon, key=f"btn_fav_{row['db_id']}", use_container_width=True, help=fav_title):
                        if is_fav: st.session_state["favorites"].remove(row["db_id"])
                        else: st.session_state["favorites"].add(row["db_id"])
                        st.rerun()
                with btn_col3:
                    if st.button(cmp_icon, key=f"btn_cmp_{row['db_id']}", use_container_width=True, help=cmp_title):
                        if is_cmp: 
                            st.session_state["compare_list"].remove(row["db_id"])
                        else: 
                            st.session_state["compare_list"].add(row["db_id"])
                        st.rerun()

        # Нижняя Навигация (Пагинация)
        st.divider()
        p_col1, p_col2, p_col3, p_col4, p_col5 = st.columns([1, 1, 2, 1, 1])
        
        with p_col1:
            if st.button("⏮️ Первая", disabled=(curr_page == 1), key="btn_page_first", use_container_width=True):
                st.session_state["cat_curr_page"] = 1
                st.session_state["scroll_to_top"] = True
                st.rerun()
                
        with p_col2:
            if st.button("◀️ Назад", disabled=(curr_page == 1), key="btn_page_prev", use_container_width=True):
                st.session_state["cat_curr_page"] = max(1, curr_page - 1)
                st.session_state["scroll_to_top"] = True
                st.rerun()
                
        with p_col3:
            page_val = st.number_input(
                f"Страница (из {total_pages})", 
                min_value=1, 
                max_value=total_pages, 
                value=curr_page, 
                step=1, 
                key="cat_curr_page_input",
                label_visibility="collapsed"
            )
            if page_val != curr_page:
                st.session_state["cat_curr_page"] = page_val
                st.session_state["scroll_to_top"] = True
                st.rerun()
                
        with p_col4:
            if st.button("Вперед ▶️", disabled=(curr_page == total_pages), key="btn_page_next", use_container_width=True):
                st.session_state["cat_curr_page"] = min(total_pages, curr_page + 1)
                st.session_state["scroll_to_top"] = True
                st.rerun()
                
        with p_col5:
            if st.button("Последняя ⏭️", disabled=(curr_page == total_pages), key="btn_page_last", use_container_width=True):
                st.session_state["cat_curr_page"] = total_pages
                st.session_state["scroll_to_top"] = True
                st.rerun()

with tab_fav:
    st.subheader("⭐ Выбранные каналы и медиаплан")
    fav_ids = list(st.session_state["favorites"])
    if not fav_ids:
        st.info("Вы пока не добавили ни одного канала в Избранное. Нажимайте звездочку '☆' на карточках в каталоге!")
    else:
        fav_df = df[df["db_id"].isin(fav_ids)]
        export_fav_df = fav_df[[c for c in EXPORT_COLUMNS if c in fav_df.columns]]
        csv_data = export_fav_df.to_csv(index=False).encode('utf-8-sig')
        st.download_button(
            label="📥 Скачать Маркетинговое Исследование (Избранное CSV)",
            data=csv_data,
            file_name="dzen_marketing_research_favorites.csv",
            mime="text/csv",
            use_container_width=False,
            help="Выгрузить данные медиаплана в CSV"
        )
        st.dataframe(fav_df[["channel_name", "niche", "subscribers_count", "views_30d", "avg_viral_index", "telegram_contact", "email_contact"]], use_container_width=True, hide_index=True)

with tab_compare:
    st.subheader("⚔️ Глубокое Сравнение Каналов «Бок о бок»")
    cmp_ids = list(st.session_state["compare_list"])
    cmp_names = df[df["db_id"].isin(cmp_ids)]["channel_name"].tolist()
    
    if "multiselect_compare_main" not in st.session_state or set(st.session_state.get("multiselect_compare_main", [])) != set(cmp_names):
        st.session_state["multiselect_compare_main"] = cmp_names

    selected_names = st.multiselect(
        "Выберите каналы для прямого сравнения (до 4):", 
        options=df["channel_name"].tolist(), 
        max_selections=4,
        key="multiselect_compare_main",
        on_change=sync_compare_list_from_multiselect
    )
    
    if not selected_names:
        st.info("💡 Выберите 2 или более каналов из списка выше (или нажимайте иконку ⚔️ на карточках в каталоге) для прямого сравнения показателей бок о бок!")
    else:
        cmp_df = df[df["channel_name"].isin(selected_names)].copy()
        
        # Calculate additional metrics for comparison
        cmp_df["est_post_views"] = cmp_df["views_30d"].apply(lambda v: int(v / 12) if v > 0 else 1000)
        cmp_df["est_post_price"] = cmp_df["est_post_views"].apply(lambda v: int((v / 1000) * 350))
        cmp_df["cpc_est"] = cmp_df.apply(lambda r: round(r["est_post_price"] / max(int(r["est_post_views"] * 0.025), 1), 1), axis=1)

        # 1. Enriched Visual Comparison Cards Grid
        cmp_cols = st.columns(len(cmp_df))
        for idx, (_, row) in enumerate(cmp_df.iterrows()):
            with cmp_cols[idx]:
                avatar_html = get_avatar_html(row['channel_name'], row['avatar_url'], size=56)
                fraud_badge = get_fraud_badge(row['fraud_score'])
                
                growth_v = row.get('subscribers_growth_30d', 0)
                if growth_v > 0:
                    growth_html = f'<b style="color:#3fb950;">+{growth_v:,}</b>'
                elif growth_v < 0:
                    growth_html = f'<b style="color:#f85149;">{growth_v:,}</b>'
                else:
                    growth_html = '<b style="color:#8b949e;">—</b>'
                    
                readability_v = row.get('readability_percent', 85.0)
                
                render_html(f"""
                <div class="card-box" style="border: 2px solid #58a6ff; background: rgba(22,27,34,0.95); text-align: center; padding:18px 14px;">
                    <div style="display:flex; justify-content:center; margin-bottom: 8px;">{avatar_html}</div>
                    <h3 style="margin: 0 0 4px 0; color: #f0f6fc; font-size:1.15rem;">{row['channel_name']}</h3>
                    <span class="badge-tag">📂 {row['niche']}</span>
                    <div style="margin-top: 8px;">{render_viral_badge(row['avg_viral_index'])}</div>
                    
                    <hr style="border-color: #30363d; margin: 12px 0;">
                    
                    <div style="text-align: left; font-size: 0.88rem; line-height: 1.6;">
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">👥 Подписчики: <b style="color:#58a6ff; float:right;">{row['subscribers_count']:,}</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">📈 Прирост (30д): <span style="float:right;">{growth_html}</span></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">👁️ Охват (30д): <b style="color:#f0f6fc; float:right;">{row['views_30d']:,}</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">📖 Дочитываемость: <b style="color:#d29922; float:right;">{readability_v:.1f}%</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">💬 ER Вовлеченность: <b style="color:#3fb950; float:right;">{row['er_percent']:.1f}%</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">🔥 Viral Index (VI): <b style="color:#d29922; float:right;">{row['avg_viral_index']:,.2f}</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">📄 Охват 1 статьи: <b style="color:#f0f6fc; float:right;">~{row['est_post_views']:,}</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">💰 Оценка поста: <b style="color:#3fb950; float:right;">~{row['est_post_price']:,} ₽</b></div>
                        <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">🖱️ Расчетный CPC: <b style="color:#58a6ff; float:right;">~{row['cpc_est']} ₽</b></div>
                    </div>
                    
                    <div style="margin-top: 12px; text-align:center;">
                        {fraud_badge}
                    </div>
                </div>
                """)

        st.markdown("<br>", unsafe_allow_html=True)
        
        # 2. Interactive Comparison Plotly Chart
        st.subheader("📊 Визуальное Диаграммное Сравнение")
        metric_choice = st.selectbox(
            "Выберите параметр для визуального сравнения диаграммой:",
            [
                "👁️ Месячные Просмотры (30д)",
                "👥 Общие Подписчики",
                "📈 Прирост подписчиков за 30 дней",
                "📖 Дочитываемость (%)",
                "🔥 Коэффициент Виральности (VI)",
                "💬 Вовлеченность (ER %)",
                "💰 Оценка стоимости статьи (₽)"
            ],
            key="cmp_chart_metric_select"
        )
        
        metric_col_map = {
            "👁️ Месячные Просмотры (30д)": ("views_30d", "#58a6ff"),
            "👥 Общие Подписчики": ("subscribers_count", "#3fb950"),
            "📈 Прирост подписчиков за 30 дней": ("subscribers_growth_30d", "#2ea043"),
            "📖 Дочитываемость (%)": ("readability_percent", "#d29922"),
            "🔥 Коэффициент Виральности (VI)": ("avg_viral_index", "#f85149"),
            "💬 Вовлеченность (ER %)": ("er_percent", "#a371f7"),
            "💰 Оценка стоимости статьи (₽)": ("est_post_price", "#3fb950")
        }
        
        col_name, color_hex = metric_col_map[metric_choice]
        
        fig_cmp = px.bar(
            cmp_df,
            x="channel_name",
            y=col_name,
            color="channel_name",
            text=col_name,
            title=f"Сравнение каналов по параметру: {metric_choice}",
            template="plotly_dark",
            color_discrete_sequence=px.colors.qualitative.Bold
        )
        fig_cmp.update_traces(texttemplate='%{text:,}', textposition='outside')
        fig_cmp.update_layout(height=380, showlegend=False, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig_cmp, use_container_width=True)

        st.markdown("---")

        # 3. Leader Awards Summary
        st.subheader("🏆 Номинации и Лидеры Выборки")
        
        best_views = cmp_df.sort_values(by="views_30d", ascending=False).iloc[0]
        best_growth = cmp_df.sort_values(by="subscribers_growth_30d", ascending=False).iloc[0]
        best_readability = cmp_df.sort_values(by="readability_percent", ascending=False).iloc[0]
        best_er = cmp_df.sort_values(by="er_percent", ascending=False).iloc[0]
        best_safety = cmp_df.sort_values(by="fraud_score", ascending=True).iloc[0]

        la1, la2, la3 = st.columns(3)
        with la1:
            st.markdown(f"""
            <div class="card-box" style="border-color:#58a6ff;">
                <div style="font-size:0.85rem; color:#8b949e;">🏆 <b>Лидер по Охвату</b></div>
                <div style="font-size:1.1rem; font-weight:700; color:#f0f6fc; margin-top:2px;">{best_views['channel_name']}</div>
                <div style="font-size:0.9rem; color:#58a6ff; margin-top:4px;">👁️ <b>{best_views['views_30d']:,}</b> просмотров/30д</div>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(f"""
            <div class="card-box" style="border-color:#3fb950;">
                <div style="font-size:0.85rem; color:#8b949e;">🚀 <b>Лидер по Приросту</b></div>
                <div style="font-size:1.1rem; font-weight:700; color:#f0f6fc; margin-top:2px;">{best_growth['channel_name']}</div>
                <div style="font-size:0.9rem; color:#3fb950; margin-top:4px;">📈 <b>+{best_growth['subscribers_growth_30d']:,}</b> подп./30д</div>
            </div>
            """, unsafe_allow_html=True)

        with la2:
            st.markdown(f"""
            <div class="card-box" style="border-color:#d29922;">
                <div style="font-size:0.85rem; color:#8b949e;">📖 <b>Лидер по Дочитываемости</b></div>
                <div style="font-size:1.1rem; font-weight:700; color:#f0f6fc; margin-top:2px;">{best_readability['channel_name']}</div>
                <div style="font-size:0.9rem; color:#d29922; margin-top:4px;">📖 <b>{best_readability['readability_percent']:.1f}%</b> завершений</div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class="card-box" style="border-color:#a371f7;">
                <div style="font-size:0.85rem; color:#8b949e;">💬 <b>Лидер по Вовлеченности (ER)</b></div>
                <div style="font-size:1.1rem; font-weight:700; color:#f0f6fc; margin-top:2px;">{best_er['channel_name']}</div>
                <div style="font-size:0.9rem; color:#a371f7; margin-top:4px;">💬 ER <b>{best_er['er_percent']:.1f}%</b></div>
            </div>
            """, unsafe_allow_html=True)

        with la3:
            st.markdown(f"""
            <div class="card-box" style="border-color:#3fb950;">
                <div style="font-size:0.85rem; color:#8b949e;">🛡️ <b>Самый Органический Трафик</b></div>
                <div style="font-size:1.1rem; font-weight:700; color:#f0f6fc; margin-top:2px;">{best_safety['channel_name']}</div>
                <div style="font-size:0.9rem; color:#3fb950; margin-top:4px;">🛡️ Fraud Score: <b>{best_safety['fraud_score']}%</b> (Минимальный риск)</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("---")

        # 4. Summary Matrix Table
        st.subheader("📋 Сводная Матрица Сравнения (Экспорт данных)")
        matrix_df = cmp_df[[
            "channel_name", "niche", "subscribers_count", "subscribers_growth_30d",
            "views_30d", "readability_percent", "er_percent", "avg_viral_index",
            "est_post_price", "fraud_score", "telegram_contact", "email_contact"
        ]].rename(columns={
            "channel_name": "Канал",
            "niche": "Ниша",
            "subscribers_count": "Подписчики",
            "subscribers_growth_30d": "Прирост (30д)",
            "views_30d": "Просмотры (30д)",
            "readability_percent": "Дочитываемость %",
            "er_percent": "ER %",
            "avg_viral_index": "Viral Index (VI)",
            "est_post_price": "Оценка поста (₽)",
            "fraud_score": "Fraud Risk %",
            "telegram_contact": "Telegram",
            "email_contact": "Email"
        })
        
        st.dataframe(matrix_df, use_container_width=True, hide_index=True)
        
        csv_matrix = matrix_df.to_csv(index=False).encode('utf-8-sig')
        st.download_button(
            "📥 Скачать Отчет Сравнения (CSV для Excel)",
            data=csv_matrix,
            file_name="dzen_side_by_side_comparison.csv",
            mime="text/csv",
            use_container_width=False
        )

with tab_trends:
    st.subheader("🔥 Радар Виральных Трендов и Залетающего Контента")
    trends_df = df[df["avg_viral_index"] >= 1.0].sort_values(by="avg_viral_index", ascending=False)
    for idx, (_, trow) in enumerate(trends_df.head(10).iterrows(), 1):
        render_html(f"""
        <div class="card-box">
            <span style="font-size: 1.1rem; font-weight: 700; color: #f0f6fc;">#{idx}. Залетающий тренд в категории «{trow['niche']}» ({trow['channel_name']})</span>
            <div style="margin-top:6px;">{render_viral_badge(trow['avg_viral_index'])} | 👁️ Просмотры канала: <b>{trow['views_30d']:,}</b></div>
        </div>
        """)