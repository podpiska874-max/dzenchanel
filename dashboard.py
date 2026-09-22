import sqlite3
import os
import pandas as pd
import plotly.express as px
import streamlit as st

# Конфигурация страницы
st.set_page_config(
    page_title="Dzen Analytics Dashboard",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Темная стилизация
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .stMetric {
        background: #1f2937;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #374151;
    }
</style>
""", unsafe_allow_html=True)

st.title("🔥 Dzen Analytics Dashboard")
st.caption("Аналитический дашборд виральности, охватов и контактов каналов Яндекс Дзена")

DB_PATH = "dzen_analytics.db"

def ensure_schema_migrations(conn):
    """Автоматическая миграция схемы базы данных для совместимости со старыми файлами базы."""
    cursor = conn.cursor()
    
    # 1. Проверяем и добавляем колонки контактов в таблицу channels
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

    # 2. Проверяем и добавляем колонку growth_velocity_daily в таблицу channel_daily_stats
    cursor.execute("PRAGMA table_info(channel_daily_stats)")
    existing_stats_cols = [row[1] for row in cursor.fetchall()]
    if "growth_velocity_daily" not in existing_stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN growth_velocity_daily INTEGER DEFAULT 0")
        except Exception:
            pass

    if "median_post_reach" not in existing_stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN median_post_reach INTEGER DEFAULT 0")
        except Exception:
            pass

    conn.commit()

@st.cache_data(ttl=60)
def load_data():
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
    
    conn = sqlite3.connect(DB_PATH)
    
    # Запускаем автоматическую миграцию колонок
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
        s.growth_velocity_daily,
        s.subscribers_growth_30d,
        s.median_post_reach
    FROM channels c
    LEFT JOIN niches n ON c.niche_id = n.id
    LEFT JOIN channel_daily_stats s ON c.id = s.channel_id
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

df = load_data()

if df.empty:
    st.warning("⚠️ База данных `dzen_analytics.db` пуста или файл не найден. Запустите сначала `import_json_to_db-v2.py`!")
    st.stop()

# Заполняем пропущенные колонки при необходимости
for col in ["telegram_contact", "email_contact", "vk_contact", "description"]:
    if col not in df.columns:
        df[col] = None

df["niche"] = df["niche"].fillna("Общее").astype(str).replace({"None": "Общее", "": "Общее"})

# Боковая панель фильтров
st.sidebar.header("🎯 Фильтры")

real_niches = sorted({str(v).strip() for v in df["niche"].dropna().unique().tolist() if str(v).strip() and str(v).strip() != "Общее"})
niches = ["Все ниши"] + real_niches
selected_niche = st.sidebar.selectbox("Категория (Ниша)", niches)

min_subs = int(df["subscribers_count"].min()) if not df["subscribers_count"].isna().all() else 0
max_subs = int(df["subscribers_count"].max()) if not df["subscribers_count"].isna().all() else 1000
selected_subs = st.sidebar.slider(
    "Минимум подписчиков", 
    min_value=0, 
    max_value=max(max_subs, 1000), 
    value=0,
    step=100
)

# Фильтрация данных
filtered_df = df.copy()
if selected_niche != "Все ниши":
    filtered_df = filtered_df[filtered_df["niche"] == selected_niche]
filtered_df = filtered_df[filtered_df["subscribers_count"] >= selected_subs]

# Метрики
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("📊 Всего каналов", f"{len(filtered_df):,}")

with col2:
    avg_vi = filtered_df["avg_viral_index"].mean() if not filtered_df.empty else 0
    st.metric("🔥 Ср. Viral Index (VI)", f"{avg_vi:.2f}")

with col3:
    total_views = filtered_df["views_30d"].sum() if not filtered_df.empty else 0
    st.metric("👁️ Просмотров (30д)", f"{total_views:,.0f}".replace(",", " "))

with col4:
    total_subs = filtered_df["subscribers_count"].sum() if not filtered_df.empty else 0
    st.metric("👥 Суммарные подписчики", f"{total_subs:,.0f}".replace(",", " "))

st.markdown("---")

# Графики: Ряд 1
c1, c2 = st.columns([3, 2])

with c1:
    st.subheader("🏆 Топ-10 каналов по виральности (Viral Index)")
    top_viral = filtered_df.sort_values(by="avg_viral_index", ascending=False).head(10)
    
    fig_viral = px.bar(
        top_viral,
        x="avg_viral_index",
        y="channel_name",
        orientation="h",
        color="avg_viral_index",
        color_continuous_scale="Reds",
        labels={"avg_viral_index": "Viral Index (VI)", "channel_name": "Канал"},
        text_auto=".2f"
    )
    fig_viral.update_layout(
        yaxis={"categoryorder": "total ascending"},
        template="plotly_dark",
        height=380,
        margin=dict(l=20, r=20, t=30, b=20)
    )
    st.plotly_chart(fig_viral, use_container_width=True)

with c2:
    st.subheader("📂 Доли категории (Ниши)")
    niche_counts = filtered_df["niche"].value_counts().reset_index()
    niche_counts.columns = ["Ниша", "Количество"]
    
    fig_niche = px.pie(
        niche_counts,
        names="Ниша",
        values="Количество",
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    fig_niche.update_layout(
        template="plotly_dark",
        height=380,
        margin=dict(l=20, r=20, t=30, b=20)
    )
    st.plotly_chart(fig_niche, use_container_width=True)

# График: Ряд 2
st.subheader("📈 Соотношение Подписчиков и Просмотров")
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
fig_scatter.update_layout(template="plotly_dark", height=420)
st.plotly_chart(fig_scatter, use_container_width=True)

# Таблица каналов
st.subheader("📋 Детальный реестр каналов и контакты")

search_term = st.text_input("🔍 Поиск по названию или нише:", "")
display_df = filtered_df.copy()
if search_term:
    display_df = display_df[
        display_df["channel_name"].str.contains(search_term, case=False, na=False) |
        display_df["niche"].str.contains(search_term, case=False, na=False)
    ]

cols_to_show = [
    "channel_name", "niche", "subscribers_count", "views_30d", 
    "avg_viral_index", "er_percent", "growth_velocity_daily", "subscribers_growth_30d",
    "median_post_reach", "telegram_contact", "email_contact", "channel_url"
]
display_table = display_df[cols_to_show].rename(columns={
    "channel_name": "Канал",
    "niche": "Ниша",
    "subscribers_count": "Подписчики",
    "views_30d": "Просмотры (30д)",
    "avg_viral_index": "VI",
    "er_percent": "ER %",
    "growth_velocity_daily": "Прирост (день)",
    "subscribers_growth_30d": "Прирост (30д)",
    "median_post_reach": "Охват (медиана)",
    "telegram_contact": "Telegram",
    "email_contact": "Email",
    "channel_url": "Ссылка"
})

st.dataframe(
    display_table,
    column_config={
        "Ссылка": st.column_config.LinkColumn("Ссылка в Дзен"),
        "VI": st.column_config.NumberColumn("Viral Index", format="%.2f"),
        "ER %": st.column_config.NumberColumn("ER %", format="%.1f%%"),
        "Подписчики": st.column_config.NumberColumn(format="%d"),
        "Просмотры (30д)": st.column_config.NumberColumn(format="%d"),
        "Прирост (день)": st.column_config.NumberColumn(format="%d"),
        "Прирост (30д)": st.column_config.NumberColumn(format="%d"),
        "Охват (медиана)": st.column_config.NumberColumn(format="%d"),
    },
    use_container_width=True,
    hide_index=True
)
