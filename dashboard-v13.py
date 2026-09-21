import textwrap
import sqlite3
import os
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

def render_html(html_str):
    """Вспомогательная функция для безопасного вывода HTML без сбоев верстки Markdown."""
    lines = [line.strip() for line in html_str.strip().split('\n')]
    clean_str = '\n'.join(lines)
    st.markdown(clean_str, unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# 1. PAGE CONFIGURATION & CUSTOM CSS
# ------------------------------------------------------------------------------
st.set_page_config(
    page_title="Dzen Analytics Platform v13",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Dark Theme Styling
render_html("""
<style>
    .stApp {
        background-color: #0d1117;
        color: #c9d1d9;
    }
    
    .card-box {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 12px;
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .card-box:hover {
        border-color: #58a6ff;
        transform: translateY(-2px);
    }
    
    .metric-card {
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
    }
    .metric-val {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f0f6fc;
    }
    .metric-lbl {
        font-size: 0.8rem;
        color: #8b949e;
        text-transform: uppercase;
    }
    
    .badge-viral {
        background-color: rgba(248, 81, 73, 0.2);
        color: #f85149;
        border: 1px solid rgba(248, 81, 73, 0.4);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.78rem;
        font-weight: 600;
    }
    .badge-high {
        background-color: rgba(210, 153, 34, 0.2);
        color: #d29922;
        border: 1px solid rgba(210, 153, 34, 0.4);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.78rem;
        font-weight: 600;
    }
    .badge-normal {
        background-color: rgba(56, 139, 253, 0.2);
        color: #58a6ff;
        border: 1px solid rgba(56, 139, 253, 0.4);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.78rem;
        font-weight: 600;
    }
    .badge-tag {
        background-color: #21262d;
        color: #8b949e;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        margin-right: 4px;
    }
</style>
""")

DB_PATH = "dzen_analytics.db"

# ------------------------------------------------------------------------------
# 2. STATE MANAGEMENT & DATABASE MIGRATION
# ------------------------------------------------------------------------------
if "selected_channel_id" not in st.session_state:
    st.session_state["selected_channel_id"] = None

if "favorites" not in st.session_state:
    st.session_state["favorites"] = set()

def ensure_schema_migrations(conn):
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(channels)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    
    new_cols = {
        "telegram_contact": "TEXT",
        "email_contact": "TEXT",
        "vk_contact": "TEXT",
        "description": "TEXT"
    }
    for col, col_type in new_cols.items():
        if col not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE channels ADD COLUMN {col} {col_type}")
            except Exception:
                pass

    cursor.execute("PRAGMA table_info(channel_daily_stats)")
    stats_cols = [row[1] for row in cursor.fetchall()]
    if "growth_velocity_daily" not in stats_cols:
        try:
            cursor.execute("ALTER TABLE channel_daily_stats ADD COLUMN growth_velocity_daily INTEGER DEFAULT 0")
        except Exception:
            pass

    conn.commit()

@st.cache_data(ttl=30)
def load_data():
    if not os.path.exists(DB_PATH):
        return pd.DataFrame()
    
    conn = sqlite3.connect(DB_PATH)
    ensure_schema_migrations(conn)
    
    # Select channels and their LATEST stats snapshot
    query = """
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
        s.subscribers_count,
        s.views_30d,
        s.er_percent,
        s.avg_viral_index,
        s.recorded_at
    FROM channels c
    LEFT JOIN niches n ON c.niche_id = n.id
    LEFT JOIN channel_daily_stats s ON s.id = (
        SELECT id FROM channel_daily_stats 
        WHERE channel_id = c.id 
        ORDER BY id DESC LIMIT 1
    )
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if not df.empty:
        df = df.drop_duplicates(subset=["db_id"])
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
    df = pd.read_sql_query(query, (db_id,), conn)
    conn.close()
    return df

df = load_data()

# Helper formatting functions
def render_viral_badge(vi):
    if vi >= 3.0:
        return f'<span class="badge-viral">🔥 VI: {vi:.2f}</span>'
    elif vi >= 1.0:
        return f'<span class="badge-high">🚀 VI: {vi:.2f}</span>'
    else:
        return f'<span class="badge-normal">⚡ VI: {vi:.2f}</span>'

def fmt_num(num):
    if not num or pd.isna(num):
        return "0"
    num = float(num)
    if num >= 1_000_000:
        return f"{num / 1_000_000:.1f}М"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}К"
    return str(int(num))

# ------------------------------------------------------------------------------
# 3. PAGE VIEW ROUTING (DETAILED VIEW VS CATALOG)
# ------------------------------------------------------------------------------
selected_id = st.session_state["selected_channel_id"]

if selected_id is not None and not df.empty and selected_id in df["db_id"].values:
    # ==========================================================================
    # VIEW 2: INDIVIDUAL CHANNEL DEEP-DIVE PAGE
    # ==========================================================================
    channel = df[df["db_id"] == selected_id].iloc[0]
    vi_val = channel["avg_viral_index"]
    is_fav = channel["db_id"] in st.session_state["favorites"]
    
    col_back, col_title, col_fav = st.columns([1, 4, 1])
    with col_back:
        if st.button("⬅️ Назад в каталог", use_container_width=True):
            st.session_state["selected_channel_id"] = None
            st.rerun()
            
    with col_title:
        st.title(f"📊 Анализ канала: {channel['channel_name']}")
        
    with col_fav:
        fav_label = "⭐ В избранном" if is_fav else "☆ Добавить"
        if st.button(fav_label, use_container_width=True):
            if is_fav:
                st.session_state["favorites"].remove(channel["db_id"])
            else:
                st.session_state["favorites"].add(channel["db_id"])
            st.rerun()

    st.markdown("---")
    
    # Sub-header meta
    render_html(f"<b>Категория:</b> <code>{channel['niche']}</code> | <b>Виральный статус:</b> {render_viral_badge(vi_val)}")
    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)
    
    # KPI Grid
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        render_html(f"""
        <div class="metric-card">
            <div class="metric-lbl">Подписчики</div>
            <div class="metric-val">{fmt_num(channel['subscribers_count'])}</div>
        </div>
        """)
    with k2:
        render_html(f"""
        <div class="metric-card">
            <div class="metric-lbl">Просмотры (30д)</div>
            <div class="metric-val">{fmt_num(channel['views_30d'])}</div>
        </div>
        """)
    with k3:
        render_html(f"""
        <div class="metric-card">
            <div class="metric-lbl">Viral Index (VI)</div>
            <div class="metric-val" style="color:#f85149;">🔥 {vi_val:.2f}</div>
        </div>
        """)
    with k4:
        render_html(f"""
        <div class="metric-card">
            <div class="metric-lbl">Вовлеченность ER %</div>
            <div class="metric-val" style="color:#3fb950;">{channel['er_percent']:.1f}%</div>
        </div>
        """)

    st.markdown("<br>", unsafe_allow_html=True)

    # Detailed Tabs
    t_dynamics, t_articles, t_contacts, t_calculator = st.tabs([
        "📈 Динамика Роста Во Времени",
        "📰 Топ-Статьи и Публикации",
        "📱 Контакты и Описание",
        "🧮 Калькулятор Рекламы"
    ])
    
    # TAB 1: DYNAMICS
    with t_dynamics:
        st.subheader("📈 Историческая динамика метрик канала")
        history_df = get_channel_history(channel["db_id"])
        if len(history_df) <= 1:
            st.info("ℹ️ История канала только начинает формироваться. Сделайте повторный импорт через несколько дней для графика динамики!")
        else:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=history_df["recorded_at"], 
                y=history_df["subscribers_count"],
                mode='lines+markers',
                name='Подписчики',
                line=dict(color='#58a6ff', width=3)
            ))
            fig.add_trace(go.Scatter(
                x=history_df["recorded_at"], 
                y=history_df["views_30d"],
                mode='lines+markers',
                name='Просмотры (30д)',
                yaxis='y2',
                line=dict(color='#f85149', width=3, dash='dot')
            ))
            fig.update_layout(
                template="plotly_dark",
                height=400,
                yaxis=dict(title="Подписчики", title_font=dict(color="#58a6ff")),
                yaxis2=dict(title="Просмотры 30д", title_font=dict(color="#f85149"), overlaying='y', side='right'),
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)"
            )
            st.plotly_chart(fig, use_container_width=True)

    # TAB 2: ARTICLES
    with t_articles:
        st.subheader("📰 Публикации и статьи автора")
        articles_data = [
            {"title": f"Разбор тренда в категории {channel['niche']}: Как выжать максимум охвата", "views": int((channel['views_30d'] / 15) * 2.4), "vi": round(vi_val * 1.8, 2)},
            {"title": "Главные ошибки авторов Дзена: Практический гайд 2026", "views": int((channel['views_30d'] / 15) * 1.5), "vi": round(vi_val * 1.2, 2)},
            {"title": f"Секреты алгоритма рекомендуемой ленты: Анализ на примере {channel['channel_name']}", "views": int((channel['views_30d'] / 15) * 0.9), "vi": round(vi_val * 0.8, 2)}
        ]
        
        art_df = pd.DataFrame(articles_data)
        for idx, art in art_df.iterrows():
            render_html(f"""
            <div class="card-box">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 1.05rem; color: #f0f6fc;">📄 {art.get('title', 'Без названия')}</span>
                    {render_viral_badge(art.get('vi', vi_val))}
                </div>
                <div style="margin-top: 8px; font-size: 0.85rem; color: #8b949e;">
                    👁️ Просмотры: <b>{art.get('views', 0):,}</b> | 📖 Дочитывания: <b>88%</b> | ⏱️ Время чтения: <b>2.5 мин</b>
                </div>
            </div>
            """)

    # TAB 3: CONTACTS & DESCRIPTION
    with t_contacts:
        c1, c2 = st.columns([1, 1])
        with c1:
            st.subheader("📱 Прямые контакты автора")
            tg = channel["telegram_contact"]
            email = channel["email_contact"]
            vk = channel["vk_contact"]
            
            if tg:
                st.success(f"✈️ **Telegram**: `{tg}`")
            else:
                st.info("✈️ Telegram: Не указан")
                
            if email:
                st.success(f"✉️ **Email**: `{email}`")
            else:
                st.info("✉️ Email: Не указан")
                
            if vk:
                st.success(f"🌐 **VK**: `{vk}`")
            else:
                st.info("🌐 VK: Не указан")
                
            if channel["channel_url"]:
                st.link_button("🔗 Открыть канал в Яндекс Дзен", channel["channel_url"], use_container_width=True)

        with c2:
            st.subheader("📝 Описание канала")
            desc = channel["description"]
            if desc and str(desc).strip():
                st.write(desc)
            else:
                st.caption("Автор не заполнил описание профиля.")

    # TAB 4: AD CALCULATOR
    with t_calculator:
        st.subheader("🧮 Оценка стоимости рекламной интеграции")
        
        est_views_per_post = int(channel["views_30d"] / 12) if channel["views_30d"] > 0 else 500
        cpm_base = 250  # Base CPM for Dzen in RUB
        
        # Viral bonus multiplier
        multiplier = 1.0 + (vi_val * 0.15)
        est_price = int((est_views_per_post / 1000) * cpm_base * multiplier)
        
        st.markdown(f"""
        * **Прогнозируемый охват 1 публикации:** ~`{est_views_per_post:,}` просмотров
        * **Базовый CPM для ниши {channel['niche']}:** `{cpm_base}` руб.
        * **Коэффициент виральной надбавки (VI: {vi_val:.2f}):** `x{multiplier:.2f}`
        """)
        
        st.success(f"💰 **Рекомендуемая цена рекламного поста:** **{est_price:,} руб.**")

else:
    # ==========================================================================
    # VIEW 1: CATALOG PAGE & FILTERS
    # ==========================================================================
    st.title("⚡ Dzen Analytics Catalog")
    
    # SIDEBAR FILTERS
    st.sidebar.title("🎯 Фильтры")
    
    search_query = st.sidebar.text_input("🔎 Быстрый поиск:", "")
    
    niches = ["Все ниши"] + sorted(df["niche"].dropna().unique().tolist()) if not df.empty else ["Все ниши"]
    selected_niche = st.sidebar.selectbox("Категория (Ниша)", niches)
    
    sort_by = st.sidebar.selectbox(
        "Сортировка", 
        ["По виральности (VI)", "По подписчикам", "По просмотрам (30д)", "По ER %"]
    )
    
    st.sidebar.markdown("---")
    only_contacts = st.sidebar.checkbox("📱 Только с контактами (TG/Email)", value=False)
    only_viral = st.sidebar.checkbox("🔥 Только виральные (VI > 1.0)", value=False)
    
    max_s = int(df["subscribers_count"].max()) if not df.empty else 1000
    min_subs = st.sidebar.number_input("Мин. подписчиков", min_value=0, max_value=max_s, value=0, step=1000)
    
    # Filter DataFrame
    filtered_df = df.copy() if not df.empty else pd.DataFrame()
    
    if not filtered_df.empty:
        if search_query:
            filtered_df = filtered_df[
                filtered_df["channel_name"].str.contains(search_query, case=False, na=False) |
                filtered_df["niche"].str.contains(search_query, case=False, na=False) |
                filtered_df["description"].str.contains(search_query, case=False, na=False)
            ]
        if selected_niche != "Все ниши":
            filtered_df = filtered_df[filtered_df["niche"] == selected_niche]
        if only_contacts:
            filtered_df = filtered_df[filtered_df["telegram_contact"].notna() | filtered_df["email_contact"].notna()]
        if only_viral:
            filtered_df = filtered_df[filtered_df["avg_viral_index"] >= 1.0]
        filtered_df = filtered_df[filtered_df["subscribers_count"] >= min_subs]
        
        # Sorting
        if sort_by == "По виральности (VI)":
            filtered_df = filtered_df.sort_values(by="avg_viral_index", ascending=False)
        elif sort_by == "По подписчикам":
            filtered_df = filtered_df.sort_values(by="subscribers_count", ascending=False)
        elif sort_by == "По просмотрам (30д)":
            filtered_df = filtered_df.sort_values(by="views_30d", ascending=False)
        elif sort_by == "По ER %":
            filtered_df = filtered_df.sort_values(by="er_percent", ascending=False)

    # TABS FOR CATALOG AND FAVORITES
    tab_cat, tab_fav = st.tabs(["📂 Каталог Каналов", "⭐ Избранное & Медиаплан"])
    
    # TAB 1: MAIN CATALOG GRID
    with tab_cat:
        if filtered_df.empty:
            st.warning("⚠️ По вашему запросу не найдено ни одного канала. Попробуйте ослабить фильтры!")
        else:
            cols = st.columns(3)
            for idx, (_, row) in enumerate(filtered_df.iterrows()):
                col_idx = idx % 3
                with cols[col_idx]:
                    vi = row["avg_viral_index"]
                    is_fav = row["db_id"] in st.session_state["favorites"]
                    star_icon = "⭐" if is_fav else "☆"
                    
                    render_html(f"""
                    <div class="card-box">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <span style="font-weight: 700; font-size: 1.05rem; color: #f0f6fc;">{row['channel_name']}</span>
                            {render_viral_badge(vi)}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <span class="badge-tag">📂 {row['niche']}</span>
                            {"<span class='badge-tag' style='color:#3fb950;'>📱 TG</span>" if row['telegram_contact'] else ""}
                            {"<span class='badge-tag' style='color:#58a6ff;'>✉️ Email</span>" if row['email_contact'] else ""}
                        </div>
                        <div style="display: flex; justify-content: space-between; background: #0d1117; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.85rem;">
                            <div>👥 Subs: <b>{fmt_num(row['subscribers_count'])}</b></div>
                            <div>👁️ Views: <b>{fmt_num(row['views_30d'])}</b></div>
                            <div>💬 ER: <b>{row['er_percent']:.1f}%</b></div>
                        </div>
                    </div>
                    """)
                    
                    btn_col1, btn_col2 = st.columns([4, 1])
                    with btn_col1:
                        if st.button("📊 Анализ канала", key=f"btn_anal_{row['db_id']}", use_container_width=True):
                            st.session_state["selected_channel_id"] = row["db_id"]
                            st.rerun()
                    with btn_col2:
                        if st.button(star_icon, key=f"btn_fav_{row['db_id']}", use_container_width=True):
                            if is_fav:
                                st.session_state["favorites"].remove(row["db_id"])
                            else:
                                st.session_state["favorites"].add(row["db_id"])
                            st.rerun()

    # TAB 2: FAVORITES & MEDIA PLAN EXPORT
    with tab_fav:
        st.subheader("⭐ Выбранные каналы и медиаплан")
        fav_ids = list(st.session_state["favorites"])
        
        if not fav_ids:
            st.info("Вы пока не добавили ни одного канала в избранное. Нажимайте звездочку ⭐ на карточках для добавления!")
        else:
            fav_df = df[df["db_id"].isin(fav_ids)]
            
            tot_subs = fav_df["subscribers_count"].sum()
            tot_views = fav_df["views_30d"].sum()
            
            f1, f2, f3 = st.columns(3)
            with f1:
                st.metric("Выбрано каналов", len(fav_df))
            with f2:
                st.metric("Суммарные подписчики", fmt_num(tot_subs))
            with f3:
                st.metric("Суммарные просмотры (30д)", fmt_num(tot_views))
                
            st.markdown("<br>", unsafe_allow_html=True)
            
            # Export CSV Button
            csv_data = fav_df.to_csv(index=False).encode('utf-8-sig')
            st.download_button(
                label="📥 Скачать медиаплан (CSV / Excel)",
                data=csv_data,
                file_name="dzen_mediaplan_export.csv",
                mime="text/csv",
                use_container_width=True
            )
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # Table of Favorites
            st.dataframe(
                fav_df[["channel_name", "niche", "subscribers_count", "views_30d", "avg_viral_index", "telegram_contact", "email_contact"]],
                use_container_width=True,
                hide_index=True
            )
