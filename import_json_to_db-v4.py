import json
import os
import sqlite3

def import_data(json_file="dzen_deep_channels.json", db_file="dzen_analytics.db"):
    """
    Импорт данных из парсера dzen.ru в SQLite базу данных с поддержкой avatar_url.
    """
    if not os.path.exists(json_file):
        if os.path.exists("dzen_all_channels.json"):
            json_file = "dzen_all_channels.json"
        elif os.path.exists("dzen_channels.json"):
            json_file = "dzen_channels.json"
        else:
            print(f"❌ Файл {json_file} не найден!")
            return

    print(f"📂 Загрузка данных из {json_file}...")
    with open(json_file, "r", encoding="utf-8") as f:
        channels = json.load(f)

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    cursor.execute("CREATE TABLE IF NOT EXISTS niches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL)")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        dzen_id TEXT UNIQUE NOT NULL, 
        name TEXT NOT NULL, 
        url TEXT NOT NULL, 
        niche_id INTEGER,
        telegram_contact TEXT,
        email_contact TEXT,
        vk_contact TEXT,
        description TEXT,
        top_articles TEXT,
        avatar_url TEXT
    )
    """)

    # Ensure avatar_url column exists in older DBs
    cursor.execute("PRAGMA table_info(channels)")
    cols = [col[1] for col in cursor.fetchall()]
    if "avatar_url" not in cols:
        cursor.execute("ALTER TABLE channels ADD COLUMN avatar_url TEXT")
    if "top_articles" not in cols:
        cursor.execute("ALTER TABLE channels ADD COLUMN top_articles TEXT")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS channel_daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        channel_id INTEGER NOT NULL, 
        subscribers_count INTEGER DEFAULT 0, 
        views_30d INTEGER DEFAULT 0, 
        er_percent REAL DEFAULT 0.0, 
        growth_velocity_daily INTEGER DEFAULT 0,
        avg_viral_index REAL DEFAULT 0.0,
        recorded_at DATE DEFAULT CURRENT_DATE
    )
    """)

    def parse_num(val_str):
        if not val_str:
            return 0
        val_str = str(val_str).upper().replace(" ", "").replace(",", ".")
        mult = 1000 if "К" in val_str or "K" in val_str else (1000000 if "М" in val_str or "M" in val_str else 1)
        val_clean = val_str.replace("К", "").replace("K", "").replace("М", "").replace("M", "")
        try:
            return int(float(val_clean) * mult)
        except:
            return 0

    added = 0

    for item in channels:
        name = item.get("name")
        url = item.get("dzen_url") or item.get("guru_url") or ""
        niche_name = item.get("niche", "Общее")
        
        subs = parse_num(item.get("subscribers"))
        views = parse_num(item.get("views_30d"))
        er = float(item.get("er_percent", 0.0))
        dzen_id = url.split("/")[-1] if url else name

        contacts = item.get("contacts", {})
        tg = contacts.get("telegram")
        email = contacts.get("email")
        vk = contacts.get("vk")
        desc = item.get("description", "")
        avatar_url = item.get("avatar_url") or item.get("logo_url") or ""
        top_arts = json.dumps(item.get("top_articles", [])) if item.get("top_articles") else None

        cursor.execute("INSERT OR IGNORE INTO niches (name) VALUES (?)", (niche_name,))
        cursor.execute("SELECT id FROM niches WHERE name = ?", (niche_name,))
        row_niche = cursor.fetchone()
        niche_id = row_niche[0] if row_niche else None

        try:
            cursor.execute("""
                INSERT INTO channels (dzen_id, name, url, niche_id, telegram_contact, email_contact, vk_contact, description, top_articles, avatar_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(dzen_id) DO UPDATE SET
                    name=excluded.name,
                    url=excluded.url,
                    telegram_contact=COALESCE(excluded.telegram_contact, telegram_contact),
                    email_contact=COALESCE(excluded.email_contact, email_contact),
                    vk_contact=COALESCE(excluded.vk_contact, vk_contact),
                    description=COALESCE(excluded.description, description),
                    top_articles=COALESCE(excluded.top_articles, top_articles),
                    avatar_url=COALESCE(excluded.avatar_url, avatar_url)
            """, (dzen_id, name, url, niche_id, tg, email, vk, desc, top_arts, avatar_url))

            cursor.execute("SELECT id FROM channels WHERE dzen_id = ?", (dzen_id,))
            ch_id = cursor.fetchone()[0]

            vi = round(views / max(subs, 1), 2)
            cursor.execute("""
                INSERT INTO channel_daily_stats (channel_id, subscribers_count, views_30d, er_percent, avg_viral_index)
                VALUES (?, ?, ?, ?, ?)
            """, (ch_id, subs, views, er, vi))

            added += 1
        except Exception:
            pass

    conn.commit()
    conn.close()
    print(f"✅ Успешно импортировано {added} каналов с аватарами в базу {db_file}!")

if __name__ == "__main__":
    import_data()
