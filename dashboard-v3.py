import sqlite3
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ------------------------------------------------------------------------------
# 1. PAGE CONFIGURATION & CUSTOM CSS
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="Dzen Analytics Platform",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Modern, clean CSS styling
st.markdown("""
<style>
    /* Dark theme adjustments */
    .stApp {
        background-color: #0d1117;
        color: #c9d1d9;
    }
    
    /* Custom KPI Cards */
    .kpi-card {
        background: linear-gradient(135deg, #161b22 0%, #21262d 100%);
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        border-color: #58a6ff;
    }
    .kpi-title {
        font-size: 0.85rem;
        color: #8b949e;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        margin-bottom: 6px;
    }
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #f0f6fc;
    }
    .kpi-sub {
        font-size: 0.8rem;
        color: #3fb950;
        margin-top: 4px;
    }
    
    /* Explainer banner */
    .info-banner {
        background: rgba(56, 139, 253, 0.1);
        border-left: 4px solid #388bfd;
        padding: 14px 18px;
        border-radius: 6px;
        margin-bottom: 20px;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    /* Badges */
    .badge-viral {
        background: rgba(248, 81, 73, 0.2);
        color: #f85149;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.8rem;
    }
    .badge-high {
        background: rgba(210, 153, 34, 0.2);
        color: #d29922;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.8rem;
    }
    
    /* Tab headers */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 45px;
        white-space: pre-wrap;
        background-color: #161b22;
        border-radius: 8px;
        color: #8b949e;
        border: 1px solid #30363d;
        padding: 0px 20px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1f6feb !important;
        color: #ffffff !important;
        border-color: #58a6ff !important;
    }
</style>
""", unsafe_allow_html=True)

DB_PATH = "dzen_analytics.db"

# ------------------------------------------------------------------------------
# 2. DATABASE & DATA LOADING WITH MIGRATION PROTECTION
# ------------------------------------------------------------------------------
def ensure_schema_migrations(conn):
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(channels)")
    existing_channel_cols = [row[1] for row in cursor.fetchall()]
    
    new_channel_cols = {
        "telegram_contact": "TEXT",
        "email_contact": "TEXT",
        "vk_contact": "TEXT",
        "description": "TEXT"
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

    conn.commit()

@st.cache_data(ttl=60)
def load_data():
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
    
    conn = sqlite3.connect(DB_PATH)
    ensure_schema_migrations(conn)
    
    query = """
    SELECT 
        c.dzen_id,
        c.name AS channel_name,
        c.url AS channel_url,
        COALESCE(n.name, 'Общее') AS niche,
        c.telegram_contact,
        c.email_contact,
        c.vk_contact,
        c.description,
        s.subscribers_count,
        s.views_30d,
        s.er_percent,
        s.avg_viral_index,
        s.growth_velocity_daily
    FROM channels c
    LEFT JOIN niches n ON c.niche_id = n.id
    LEFT JOIN channel_daily_stats s ON c.id = s.channel_id
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

df = load_data()

if df.empty:
    st.title("⚡ Аналитика Дзена")
    st.warning("⚠️ База данных `dzen_analytics.db` пуста или не создана. Запустите сначала `import_json_to_db-v2.py`!")
    st.stop()

# Ensure missing columns exist in DataFrame
for col in ["telegram_contact", "email_contact", "vk_contact", "description"]:
    if col not in df.columns:
        df[col] = None

# Calculate helper columns
df["avg_viral_index"] = df["avg_viral_index"].fillna(0.0)
df["subscribers_count"] = df["subscribers_count"].fillna(0).astype(int)
df["views_30d"] = df["views_30d"].fillna(0).astype(int)
df["er_percent"] = df["er_percent"].fillna(0.0)

def assign_viral_tier(vi):
    if vi >= 3.0:
        return "🔥 Супер-виральный (VI > 3.0)"
    elif vi >= 1.0:
        return "🚀 Высокий охват (1.0 - 3.0)"
    elif vi >= 0.2:
        return "⚡ Органический (0.2 - 1.0)"
    else:
        return "😴 Низкий (VI < 0.2)"

df["viral_tier"] = df["avg_viral_index"].apply(assign_viral_tier)
df["has_contacts"] = df["telegram_contact"].notna() | df["email_contact"].notna()

# ------------------------------------------------------------------------------
# 3. SIDEBAR FILTERS
# ------------------------------------------------------------------------------
st.sidebar.image("https://yastatic.net/s3/home/zen/favicon.png", width=36)
st.sidebar.title("Панель управления")

st.sidebar.markdown("---")
st.sidebar.subheader("🎯 Фильтры")

niches = ["Все ниши"] + sorted(df["niche"].dropna().unique().tolist())
selected_niche = st.sidebar.selectbox("Категория (Ниша)", niches)

tier_options = ["Все уровни", "🔥 Супер-виральный (VI > 3.0)", "🚀 Высокий охват (1.0 - 3.0)", "⚡ Органический (0.2 - 1.0)"]
selected_tier = st.sidebar.selectbox("Уровень виральности", tier_options)

only_contacts = st.sidebar.checkbox("📱 Только каналы с контактами (TG/Email)", value=False)

min_subs = int(df["subscribers_count"].min())
max_subs = int(df["subscribers_count"].max())
selected_subs = st.sidebar.slider(
    "Мин. подписчиков", 
    min_value=0, 
    max_value=max(max_subs, 1000), 
    value=0,
    step=500
)

# Apply filters
filtered_df = df.copy()
if selected_niche != "Все ниши":
    filtered_df = filtered_df[filtered_df["niche"] == selected_niche]
if selected_tier != "Все уровни":
    filtered_df = filtered_df[filtered_df["viral_tier"] == selected_tier]
if only_contacts:
    filtered_df = filtered_df[filtered_df["has_contacts"]]
filtered_df = filtered_df[filtered_df["subscribers_count"] >= selected_subs]

# ------------------------------------------------------------------------------
# 4. HEADER & KPI CARDS
# ------------------------------------------------------------------------------
st.title("⚡ Dzen Analytics & Viral Hub")

st.markdown("""
<div class="info-banner">
    💡 <b>Как читать дашборд:</b> <b>Viral Index (VI)</b> показывает, во сколько раз просмотры за месяц превышают число подписчиков.<br>
    • <b>VI > 3.0 (🔥)</b> — Статьи регулярно «взрывают» алгоритмы и получают вирусный охват в рекомендациях.<br>
    • <b>VI > 1.0 (🚀)</b> — Контент активно выходит за пределы постоянной аудитории.<br>
    • <b>VI < 0.2 (😴)</b> — Статьи читает только малая часть подписчиков.
</div>
""", unsafe_allow_html=True)

# Custom KPI Grid
kpi1, kpi2, kpi3, kpi4 = st.columns(4)

with kpi1:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Каналов в выборке</div>
        <div class="kpi-value">{len(filtered_df):,}</div>
        <div class="kpi-sub">из {len(df):,} извлеченных</div>
    </div>
    """, unsafe_allow_html=True)

with kpi2:
    avg_vi = filtered_df["avg_viral_index"].mean() if not filtered_df.empty else 0
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Средний Viral Index</div>
        <div class="kpi-value" style="color: #f85149;">🔥 {avg_vi:.2f}</div>
        <div class="kpi-sub">Кратность охвата к подписчикам</div>
    </div>
    """, unsafe_allow_html=True)

with kpi3:
    total_views = filtered_df["views_30d"].sum() if not filtered_df.empty else 0
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Просмотры (30 дней)</div>
        <div class="kpi-value">{total_views:,.0f}</div>
        <div class="kpi-sub">суммарный охват аудитории</div>
    </div>
    """.replace(",", " "), unsafe_allow_html=True)

with kpi4:
    contacts_count = filtered_df["has_contacts"].sum() if not filtered_df.empty else 0
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Каналов с контактами</div>
        <div class="kpi-value" style="color: #3fb950;">📱 {contacts_count}</div>
        <div class="kpi-sub">Telegram / Email открыты</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 5. TABBED INTERFACE FOR CLEAR VISUAL STRUCTURE
# ------------------------------------------------------------------------------
tab1, tab2, tab3, tab4 = st.tabs([
    "🏆 Топ Виральности (Leaderboard)", 
    "📊 Сравнительный Анализ & Ниши", 
    "📞 База Каналов & Контакты", 
    "📘 Справка по Метрикам"
])

# ---------------------------------------------------------
# TAB 1: VIRAL LEADERBOARD
# ---------------------------------------------------------
with tab1:
    st.subheader("🔥 Топ-15 Лидеров Виральности Дзена")
    st.caption("Авторы, чей контент алгоритм Дзена чаще всего продвигает в рекомендации")
    
    top_15 = filtered_df.sort_values(by="avg_viral_index", ascending=False).head(15)
    
    if top_15.empty:
        st.info("Нет данных, соответствующих выбранным фильтрам.")
    else:
        fig_bar = px.bar(
            top_15,
            x="avg_viral_index",
            y="channel_name",
            orientation="h",
            color="avg_viral_index",
            color_continuous_scale=["#388bfd", "#d29922", "#f85149"],
            labels={"avg_viral_index": "Viral Index (VI)", "channel_name": "Канал"},
            text_auto=".2f",
            hover_data=["subscribers_count", "views_30d", "niche"]
        )
        fig_bar.update_layout(
            yaxis={"categoryorder": "total ascending"},
            template="plotly_dark",
            height=480,
            margin=dict(l=10, r=10, t=20, b=20),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        st.plotly_chart(fig_bar, use_container_width=True)

# ---------------------------------------------------------
# TAB 2: ANALYTICS & NICHES
# ---------------------------------------------------------
with tab2:
    c_left, c_right = st.columns(2)
    
    with c_left:
        st.subheader("📂 Распределение по Нишам")
        niche_counts = filtered_df["niche"].value_counts().reset_index()
        niche_counts.columns = ["Ниша", "Каналов"]
        
        fig_pie = px.pie(
            niche_counts,
            names="Ниша",
            values="Каналов",
            hole=0.45,
            color_discrete_sequence=px.colors.qualitative.Dark24
        )
        fig_pie.update_layout(
            template="plotly_dark",
            height=400,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        st.plotly_chart(fig_pie, use_container_width=True)
        
    with c_right:
        st.subheader("⚡ Уровень Виральности")
        tier_counts = filtered_df["viral_tier"].value_counts().reset_index()
        tier_counts.columns = ["Уровень", "Каналов"]
        
        fig_tier = px.bar(
            tier_counts,
            x="Уровень",
            y="Каналов",
            color="Уровень",
            color_discrete_map={
                "🔥 Супер-виральный (VI > 3.0)": "#f85149",
                "🚀 Высокий охват (1.0 - 3.0)": "#d29922",
                "⚡ Органический (0.2 - 1.0)": "#388bfd",
                "😴 Низкий (VI < 0.2)": "#8b949e"
            }
        )
        fig_tier.update_layout(
            template="plotly_dark",
            height=400,
            showlegend=False,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        st.plotly_chart(fig_tier, use_container_width=True)

    st.markdown("---")
    st.subheader("📈 Карта Аудитории: Подписчики vs Охват")
    st.caption("Размер точки = Viral Index. Чем выше точка по оси Y при малых подписчиках (ось X), тем эффективнее алгоритм рекомендует канал.")
    
    fig_scatter = px.scatter(
        filtered_df,
        x="subscribers_count",
        y="views_30d",
        size="avg_viral_index",
        color="niche",
        hover_name="channel_name",
        log_x=True,
        log_y=True,
        labels={
            "subscribers_count": "Подписчики (лог. шкала)",
            "views_30d": "Просмотры за 30 дней (лог. шкала)",
            "avg_viral_index": "Viral Index"
        }
    )
    fig_scatter.update_layout(
        template="plotly_dark", 
        height=450,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)"
    )
    st.plotly_chart(fig_scatter, use_container_width=True)

# ---------------------------------------------------------
# TAB 3: CONTACTS DIRECTORY
# ---------------------------------------------------------
with tab3:
    st.subheader("📋 Реестр каналов и прямые контакты")
    
    col_search, col_export = st.columns([4, 1])
    with col_search:
        search_query = st.text_input("🔍 Быстрый поиск по названию, нише или описанию:", "")
    with col_export:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        csv_data = filtered_df.to_csv(index=False).encode('utf-8-sig')
        st.download_button(
            label="📥 Скачать CSV",
            data=csv_data,
            file_name="dzen_channels_analytics.csv",
            mime="text/csv"
        )

    display_df = filtered_df.copy()
    if search_query:
        display_df = display_df[
            display_df["channel_name"].str.contains(search_query, case=False, na=False) |
            display_df["niche"].str.contains(search_query, case=False, na=False) |
            display_df["description"].str.contains(search_query, case=False, na=False)
        ]

    cols_to_show = [
        "channel_name", "niche", "viral_tier", "subscribers_count", 
        "views_30d", "avg_viral_index", "er_percent", "telegram_contact", "email_contact", "channel_url"
    ]
    
    display_table = display_df[cols_to_show].rename(columns={
        "channel_name": "Канал",
        "niche": "Ниша",
        "viral_tier": "Статус Виральности",
        "subscribers_count": "Подписчики",
        "views_30d": "Просмотры (30д)",
        "avg_viral_index": "VI",
        "er_percent": "ER %",
        "telegram_contact": "Telegram",
        "email_contact": "Email",
        "channel_url": "Ссылка"
    })

    st.dataframe(
        display_table,
        column_config={
            "Ссылка": st.column_config.LinkColumn("Дзен"),
            "VI": st.column_config.NumberColumn("Viral Index", format="%.2f"),
            "ER %": st.column_config.NumberColumn("ER %", format="%.1f%%"),
            "Подписчики": st.column_config.NumberColumn(format="%d"),
            "Просмотры (30д)": st.column_config.NumberColumn(format="%d"),
        },
        use_container_width=True,
        hide_index=True,
        height=500
    )

# ---------------------------------------------------------
# TAB 4: METHODOLOGY
# ---------------------------------------------------------
with tab4:
    st.subheader("📘 Методология расчета виральности (Viral Index)")
    
    st.markdown("""
    ### 1. Формула Viral Index (VI)
    Коэффициент виральности рассчитывается как отношение месячного охвата (просмотров за 30 дней) к текущему количеству подписчиков:
    $$VI = \\frac{\\text{Views}_{30d}}{\\max(\\text{Subscribers}, 1)}$$

    ### 2. Градация виральности
    * **🔥 VI ≥ 3.0 (Супер-виральный)**: Канал регулярно генерирует статьи-хиты, которые попадают в ленту рекомендаций Яндекс Дзена и завлекают аудиторию извне.
    * **🚀 1.0 ≤ VI < 3.0 (Высокая виральность)**: Хорошее соотношение показов. Алгоритмы активно рекомендуют контент новым пользователям.
    * **⚡ 0.2 ≤ VI < 1.0 (Органический охват)**: Канал читают преимущественно постоянные подписчики, показы в общей ленте умеренные.
    * **😴 VI < 0.2 (Низкая активность)**: Охват существенно меньше базы подписчиков.

    ### 3. Вовлеченность (Engagement Ratio, ER)
    Определяется как процентное отношение взаимодействий (лайки + комментарии) к общему числу прочтений/просмотров контента.
    """)
