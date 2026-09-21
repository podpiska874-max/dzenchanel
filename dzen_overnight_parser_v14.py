import json
import logging
import os
import random
import re
import sqlite3
import time
import urllib.request
from typing import Dict, List, Optional, Set
from concurrent.futures import ThreadPoolExecutor
import requests
import cloudscraper
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("dzen_parser_overnight.log", encoding="utf-8")
    ]
)

DB_PATH = "dzen_analytics.db"
CHECKPOINT_FILE = "dzen_parser_checkpoint.json"
OUTPUT_JSON = "dzen_deep_channels.json"

CHROME_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
}

SEED_CHANNELS = [
    "woman", "seichasprigotovim", "edanalyuboivkus", "sivakova", "novorosinform_org",
    "lifehack", "psychology_journal", "auto_master", "tech_insider", "cinema_review",
    "history_world", "sport_match", "cooking_life", "finance_daily", "fashion_style",
    "travel_guide", "tsargrad_tv", "kpru", "ria", "thevoicemag", "repost_news",
    "m24_ru", "rbc_news", "lenta_ru", "gazeta_ru", "izvestia", "tass_agency",
    "forbes_russia", "snob_ru", "pikabu_official", "vc_ru", "habr_official"
]

def clean_text(val: Optional[str]) -> str:
    if not val:
        return ""
    val = str(val)
    val = re.sub(r'<[^>]+>', '', val)
    val = ' '.join(val.split()).strip()
    return val

def clean_niche_string(val: Optional[str]) -> str:
    if not val:
        return "Общее"
    val = clean_text(val)
    if "Канал" in val and "Подписчики" in val:
        match = re.search(r'([А-Яа-яA-Za-z0-9\s&—–\-]+)(?:Канал|Подписчики)', val)
        if match and len(match.group(1).strip()) > 2:
            val = match.group(1).strip()
        else:
            val = "Общее"
    if not val or val.lower() in ['none', 'null', 'undefined', 'nan', '', '0']:
        return "Общее"
    return val

def parse_num_suffix(num_str: str) -> int:
    if not num_str:
        return 0
    clean = num_str.replace(" ", "").replace(",", ".").lower()
    mult = 1
    if "м" in clean or "m" in clean or "млн" in clean:
        mult = 1000000
        clean = re.sub(r"[^\d\.]", "", clean)
    elif "к" in clean or "k" in clean or "тыс" in clean:
        mult = 1000
        clean = re.sub(r"[^\d\.]", "", clean)
    else:
        clean = re.sub(r"[^\d]", "", clean)
    try:
        return int(float(clean) * mult) if clean else 0
    except Exception:
        return 0


def extract_niche(soup: BeautifulSoup, fallback_text: str = "") -> str:
    """Извлекает нишу из актуальной разметки dzen.guru."""
    text = fallback_text or soup.get_text(" ", strip=True)
    patterns = [
        r'"name":"Основная ниша".*?"value":"([^"]+)"',
        r'"name":"Основная ниша".*?"value":\s*"([^"]+)"',
        r'Основная ниша[^<]{0,80}[\"\']?value[\"\']?\s*:\s*[\"\']([^\"\']+)[\"\']',
        r'Основная ниша[^<]{0,80}([А-Яа-яA-Za-z0-9\s&—–\-]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.I | re.S)
        if match:
            niche = clean_niche_string(match.group(1))
            if niche and niche != "Общее":
                return niche

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or script.get_text())
            if isinstance(data, dict):
                def walk(obj):
                    if isinstance(obj, dict):
                        for k, v in obj.items():
                            if k == "name" and "ниша" in str(v).lower():
                                value = obj.get("value")
                                if value:
                                    yield str(value)
                            else:
                                yield from walk(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            yield from walk(item)
                for found in walk(data):
                    if found and found.strip():
                        niche = clean_niche_string(found)
                        if niche and niche != "Общее":
                            return niche
        except Exception:
            pass

    return "Общее"


def extract_avatar_url(soup: BeautifulSoup) -> str:
    """Возвращает корректный URL аватара канала, исключая счётчики и сторонние метрики."""
    for meta in [
        soup.find("meta", attrs={"property": "og:image"}),
        soup.find("meta", attrs={"property": "twitter:image"}),
        soup.find("meta", attrs={"name": "twitter:image"}),
    ]:
        if meta and meta.get("content"):
            url = meta["content"].strip()
            if url.startswith("http"):
                return url

    candidates = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-original") or ""
        src = src.strip()
        if not src or not src.startswith("http"):
            continue
        if "mc.yandex.ru" in src or "yandex.ru/watch" in src or "googletagmanager" in src:
            continue
        if "avatars.dzeninfra.ru" in src or "dzeninfra.ru" in src or "vk" in src.lower() or "telegram" in src.lower():
            candidates.append(src)

    if candidates:
        return candidates[0]

    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-original") or ""
        src = src.strip()
        if src.startswith("http") and "mc.yandex.ru" not in src:
            return src

    return ""

class DzenHybridParserV14:
    """
    Автономный гибридный ночной парсер v14:
    1. Сканирование XML карт сайтов (sitemap-channels-1..5.xml) с автодекодированием UTF-8
    2. Резервное сканирование через urllib и прямые категории каталога dzen.guru
    3. Встроенный сид-список ключевых каналов
    4. Многопоточный сбор подробной аналитики и контактов (Telegram, Email, VK)
    """

    def __init__(self, max_workers: int = 10, batch_size: int = 50):
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.session = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows", "desktop": True})
        self.session.headers.update(CHROME_HEADERS)
        self.init_database()

    def init_database(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS niches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);")
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
        );
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS channel_daily_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            channel_id INTEGER NOT NULL, 
            
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subscribers_count INTEGER DEFAULT 0, 
            views_30d INTEGER DEFAULT 0, 
            er_percent REAL DEFAULT 0.0, 
            growth_velocity_daily INTEGER DEFAULT 0,
            avg_viral_index REAL DEFAULT 0.0,
            subscribers_growth_30d INTEGER DEFAULT 0,
            readability_percent REAL DEFAULT 85.0
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stats_ch_id ON channel_daily_stats(channel_id, id DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_channels_niche ON channels(niche_id);")
        conn.commit()
        conn.close()

    def fetch_url_content(self, url: str) -> str:
        try:
            resp = self.session.get(url, timeout=15)
            if resp.status_code == 200:
                return resp.text
            else:
                logging.warning(f"⚠️ Status {resp.status_code} for {url}")
        except Exception as e:
            logging.warning(f"⚠️ scraper failed for {url}: {e}")
            
        return ""

    def harvest_channel_ids_from_sitemaps(self) -> Set[str]:
        found_ids = set()

        sitemap_index = self.fetch_url_content("https://dzen.guru/sitemap.xml")
        sitemap_urls = []
        if sitemap_index:
            sitemap_urls = re.findall(r"https?://dzen\.guru/sitemaps/channels-\d+\.xml", sitemap_index, re.I)
            sitemap_urls = list(dict.fromkeys(sitemap_urls))

        if not sitemap_urls:
            sitemap_urls = [f"https://dzen.guru/sitemaps/channels-{i}.xml" for i in range(1, 6)]

        for idx, s_url in enumerate(sitemap_urls, 1):
            logging.info(f"📥 Сканирование карты [{idx}/{len(sitemap_urls)}]: {s_url}")
            content = self.fetch_url_content(s_url)
            if content:
                raw_ids = re.findall(r"https?://dzen\.guru/channels/([A-Za-z0-9_\.\-]+)", content, re.I)
                clean_ids = [
                    i for i in raw_ids
                    if i and i not in ['page', 'women', 'food', 'auto', 'news', 'tech', 'fashion', 'travel', 'cinema', 'finance', 'psychology']
                ]
                new_count = 0
                for d_id in clean_ids:
                    if d_id not in found_ids:
                        found_ids.add(d_id)
                        new_count += 1
                logging.info(f"  ├─ Найдено {len(raw_ids):,} ссылок | Уникальных новых: +{new_count:,} (Всего: {len(found_ids):,})")
            else:
                logging.warning(f"  └─ Не удалось загрузить содержимое карты {s_url}")

        return found_ids

    def parse_channel_detail_page(self, dzen_id: str) -> Optional[Dict]:
        channel_url = f"https://dzen.guru/channels/{dzen_id}"
        content = self.fetch_url_content(channel_url)
        if not content:
            return None
            
        try:
            soup = BeautifulSoup(content, "html.parser")
            text = soup.get_text(separator=" ")
            
            # Extract Name
            name = dzen_id
            if soup.title:
                t_match = re.search(r"Аналитика канала (.*?) —", soup.title.text)
                if t_match:
                    name = clean_text(t_match.group(1))
                else:
                    clean_t = soup.title.text.replace("Яндекс Дзен", "").replace("Dzen Guru", "").replace("|", "").strip()
                    if clean_t:
                        name = clean_text(clean_t)
            
            # Extract Niche
            niche = extract_niche(soup, text)
            
            raw_text = soup.get_text(separator=" ")
            text = raw_text.replace('\u202f', ' ').replace('\xa0', ' ')
            
            # Extract Subscribers
            subs_match = re.search(r"([\d\s]+)\s*подписчиков", text, re.I)
            if not subs_match:
                subs_match = re.search(r"(?:👥\s*)?Подписчики\s*([\d\.,\s]+[КМkM]?)\b", text, re.I)
            subs_val = parse_num_suffix(subs_match.group(1)) if subs_match else 0
            
            # Extract Views 30d
            views_match = re.search(r"([\d\s]+)\s*просмотров\s*за\s*30\s*дней", text, re.I)
            if not views_match:
                views_match = re.search(r"(?:👁️\s*)?Просмотры\s*(?:\(30д\))?\s*([\d\.,\s]+[КМkM]?)\b", text, re.I)
            views_val = parse_num_suffix(views_match.group(1)) if views_match else 0
            
            # Extract ER
            er_match = re.search(r"([\d\.,]+)%\s*вовлечённость", text, re.I)
            if not er_match:
                er_match = re.search(r"(?:💬\s*)?ER\s*([\d\.,]+)%", text, re.I)
            er_val = float(er_match.group(1).replace(",", ".")) if er_match else 0.0
            
            # Extract Viral Index
            vi_match = re.search(r"(?:⚡\s*)?Виральность\s*([\d\.,]+)", text, re.I)
            vi_val = float(vi_match.group(1).replace(",", ".")) if vi_match else round(views_val / max(subs_val, 1), 2)
            
            # Extract Correct Dzen URL
            dzen_url = f"https://dzen.ru/{dzen_id}"
            for a in soup.find_all("a", href=True):
                if "dzen.ru" in a["href"]:
                    dzen_url = a["href"]
                    break
            
            # Extract Contacts
            tg_match = re.search(r"(https?://t\.me/[\w_]+|@[\w_]+)", text, re.I)
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
            vk_match = re.search(r"https?://vk\.com/[\w\.-]+", text, re.I)
            
            tg_val = tg_match.group(0) if tg_match else None
            email_val = email_match.group(0) if email_match else None
            vk_val = vk_match.group(0) if vk_match else None
            
            # Extract Description
            desc_elem = soup.find(class_=re.compile(r"description|about|info", re.I))
            desc_val = clean_text(desc_elem.text)[:500] if desc_elem else ""
            
            # Extract Avatar
            avatar_url = extract_avatar_url(soup)
            
            return {
                "dzen_id": dzen_id,
                "name": name,
                "guru_url": channel_url,
                "dzen_url": dzen_url,
                "niche": niche,
                "avatar_url": avatar_url,
                "subscribers": subs_val,
                "views_30d": views_val,
                "er_percent": er_val,
                "growth_30d": 0,
                "readability_percent": 85.0,
                "avg_viral_index": vi_val,
                "telegram": tg_val,
                "email": email_val,
                "vk": vk_val,
                "description": desc_val,
                "parsed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception:
            return None

    def save_to_database(self, channels: List[Dict]):
        if not channels:
            return
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        for item in channels:
            cursor.execute("INSERT OR IGNORE INTO niches (name) VALUES (?);", (item["niche"],))
            cursor.execute("SELECT id FROM niches WHERE name = ?;", (item["niche"],))
            n_row = cursor.fetchone()
            niche_id = n_row[0] if n_row else 1

            cursor.execute("""
                INSERT INTO channels (dzen_id, name, url, niche_id, telegram_contact, email_contact, vk_contact, description, avatar_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(dzen_id) DO UPDATE SET
                    name=excluded.name,
                    niche_id=excluded.niche_id,
                    telegram_contact=COALESCE(excluded.telegram_contact, channels.telegram_contact),
                    email_contact=COALESCE(excluded.email_contact, channels.email_contact),
                    vk_contact=COALESCE(excluded.vk_contact, channels.vk_contact),
                    description=COALESCE(excluded.description, channels.description),
                    avatar_url=COALESCE(excluded.avatar_url, channels.avatar_url);
            """, (
                item["dzen_id"], item["name"], item["dzen_url"], niche_id,
                item["telegram"], item["email"], item["vk"], item["description"], item["avatar_url"]
            ))

            cursor.execute("SELECT id FROM channels WHERE dzen_id = ?;", (item["dzen_id"],))
            ch_row = cursor.fetchone()
            if ch_row:
                ch_id = ch_row[0]
                cursor.execute("""
                    INSERT INTO channel_daily_stats (
                        channel_id, subscribers_count, views_30d, er_percent, avg_viral_index,
                        growth_velocity_daily, subscribers_growth_30d, readability_percent
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    ch_id, item["subscribers"], item["views_30d"], item["er_percent"],
                    item["avg_viral_index"], 0, 0, item["readability_percent"]
                ))
        conn.commit()
        conn.close()

    def load_processed_ids(self) -> Set[str]:
        processed = set()
        if os.path.exists(DB_PATH):
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("SELECT dzen_id FROM channels;")
                rows = cursor.fetchall()
                processed = {r[0] for r in rows if r and r[0]}
                conn.close()
            except Exception:
                pass
        return processed

    def load_stale_channel_ids(self) -> Set[str]:
        stale = set()
        if os.path.exists(DB_PATH):
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT c.dzen_id
                    FROM channels c
                    LEFT JOIN niches n ON n.id = c.niche_id
                    WHERE c.niche_id IS NULL OR n.name = 'Общее' OR n.name IS NULL
                """)
                stale = {row[0] for row in cursor.fetchall() if row and row[0]}
                conn.close()
            except Exception:
                pass
        return stale

    def run(self):
        logging.info("="*65)
        logging.info("🚀 ЗАПУСК НОЧНОГО ГИБРИДНОГО ПАРСЕРА V14 (ULTRA-RESILIENT)")
        logging.info(f"💾 База данных: {DB_PATH} | Выгрузка: {OUTPUT_JSON}")
        logging.info("="*65)

        processed_ids = self.load_processed_ids()
        stale_ids = self.load_stale_channel_ids()
        logging.info(f"📊 В вашей базе данных уже находится уникальных каналов: {len(processed_ids):,}")
        logging.info(f"🧹 В базе есть {len(stale_ids):,} устаревших/пустых ниш для перечитывания")

        # 1. Harvest from Sitemap XMLs
        all_discovered_ids = self.harvest_channel_ids_from_sitemaps()

        # 2. Add seed channels as guaranteed safety net
        all_discovered_ids.update(SEED_CHANNELS)
        logging.info(f"🎯 Всего сформирован пул из {len(all_discovered_ids):,} уникальных каналов")

        # 3. Filter channels that still need processing or refresh
        to_process_ids = [
            d_id for d_id in all_discovered_ids
            if d_id not in processed_ids or d_id in stale_ids
        ]
        logging.info(f"⚡ Очередь каналов для загрузки/обновления метрик: {len(to_process_ids):,}")

        if not to_process_ids:
            logging.info("🎉 Все найденные каналы уже обработаны и находятся в вашей базе данных!")
            return

        # 4. Multi-threaded processing
        start_time = time.time()
        total_processed_session = 0
        session_channels = []

        for i in range(0, len(to_process_ids), self.batch_size):
            batch = to_process_ids[i:i + self.batch_size]
            
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                results = list(executor.map(self.parse_channel_detail_page, batch))
            
            valid_results = [r for r in results if r is not None]
            if valid_results:
                self.save_to_database(valid_results)
                session_channels.extend(valid_results)
                total_processed_session += len(valid_results)
            
            elapsed = time.time() - start_time
            speed_per_sec = total_processed_session / max(elapsed, 0.1)
            rem_channels = len(to_process_ids) - (i + len(batch))
            eta_hours = (rem_channels / speed_per_sec) / 3600 if speed_per_sec > 0 else 0
            
            logging.info(f"📦 Батч [{i + len(batch):,}/{len(to_process_ids):,}] | Сохранено +{len(valid_results)} | Всего в базе: {len(processed_ids) + total_processed_session:,} | Скорость: {speed_per_sec:.1f} кан/сек | ETA: ~{eta_hours:.1f} ч.")
            
            if (i // self.batch_size) % 5 == 0:
                try:
                    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
                        json.dump(session_channels, f, ensure_ascii=False, indent=2)
                except Exception:
                    pass

        logging.info("🎉 ГИБРИДНЫЙ ПАРСИНГ V14 УСПЕШНО ЗАВЕРШЕН!")

if __name__ == "__main__":
    parser = DzenHybridParserV14(max_workers=10, batch_size=50)
    parser.run()