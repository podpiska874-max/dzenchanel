import asyncio
import gzip
import json
import logging
import os
import re
import time
import xml.etree.ElementTree as ET
from typing import Dict, List, Set, Optional
import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_SITEMAP_URL = "https://dzen.ru/sitemap.xml"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
}

class DzenGuruSitemapParser:
    """
    Высокопроизводительный асинхронный парсер dzen.ru на основе Sitemap (карты сайта):
    1. Скачивает sitemap.xml и все дочерние sub-sitemaps (.xml / .xml.gz).
    2. Извлекает прямые ссылки на страницы каналов (https://dzen.ru/channels/...).
    3. Асинхронно параллельно обходит каждую страницу канала и извлекает:
       - Название, Нишу, Подписчиков, Просмотры (30д), ER %, Время чтения
       - Контакты (Telegram, Email, VK), Описание, Статьи
    4. Сохраняет регулярные чекпоинты в dzen_deep_channels.json для мгновенного импорта в SQLite.
    """

    def __init__(
        self, 
        max_concurrent: int = 15, 
        delay_sec: float = 0.05,
        checkpoint_file: str = "sitemap_checkpoint.json",
        output_file: str = "dzen_deep_channels.json"
    ):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.delay_sec = delay_sec
        self.checkpoint_file = checkpoint_file
        self.output_file = output_file

    async def fetch_sitemap_urls(self, client: httpx.AsyncClient) -> List[str]:
        """Скачивает главную карту сайта и извлекает все URL каналов."""
        logging.info(f"🌐 Получение главной карты сайта: {BASE_SITEMAP_URL}...")
        channel_urls: Set[str] = set()
        sitemap_queue: List[str] = [BASE_SITEMAP_URL]
        processed_sitemaps: Set[str] = set()

        while sitemap_queue:
            current_sitemap = sitemap_queue.pop(0)
            if current_sitemap in processed_sitemaps:
                continue
            processed_sitemaps.add(current_sitemap)

            logging.info(f"📄 Загрузка карты сайта: {current_sitemap}...")
            try:
                resp = await client.get(current_sitemap, headers=HEADERS, timeout=20.0)
                if resp.status_code != 200:
                    logging.warning(f"⚠️ Не удалось загрузить {current_sitemap} (статус {resp.status_code})")
                    continue

                content = resp.content
                if current_sitemap.endswith(".gz") or content[:2] == b'\x1f\x8b':
                    try:
                        content = gzip.decompress(content)
                    except Exception:
                        pass

                text_content = content.decode("utf-8", errors="ignore")

                # Извлечение всех <loc> ссылок
                urls = re.findall(r"<loc>(.*?)</loc>", text_content, re.IGNORECASE)

                for u in urls:
                    u = u.strip()
                    if u.endswith(".xml") or u.endswith(".gz") or "sitemap" in u.lower():
                        if u not in processed_sitemaps and u not in sitemap_queue:
                            sitemap_queue.append(u)
                    elif "/channels/" in u and u != "https://dzen.ru/channels":
                        channel_urls.add(u)

                logging.info(f"✅ Извлечено ссылок из {current_sitemap}: {len(urls)} (Каналов найдено: {len(channel_urls)})")

            except Exception as e:
                logging.error(f"❌ Ошибка при чтении карты {current_sitemap}: {e}")

        logging.info(f"🎉 Всего уникальных ссылок на каналы из карты сайта: {len(channel_urls)}")
        return list(channel_urls)

    def parse_channel_html(self, url: str, html: str) -> Optional[Dict]:
        """Извлечение метрик и контактов со страницы канала."""
        try:
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text(separator=" ")

            # Название канала
            title_elem = soup.find("h1") or soup.find("title")
            name = title_elem.text.replace("— dzen.ru", "").strip() if title_elem else url.split("/")[-1]

            # Ниша
            niche_elem = soup.find(class_=re.compile(r"niche|category|tag", re.I))
            niche = niche_elem.text.strip() if niche_elem else "Общее"

            # Метрики
            subs_match = re.search(r"([\d\.,]+)\s*([КМkM]?)\s*подписчик", text, re.I)
            subscribers_str = f"{subs_match.group(1)}{subs_match.group(2)}" if subs_match else "0"

            views_match = re.search(r"([\d\.,]+)\s*([КМkM]?)\s*просмотр", text, re.I)
            views_str = f"{views_match.group(1)}{views_match.group(2)}" if views_match else "0"

            er_match = re.search(r"ER\s*([\d\.,]+)%", text, re.I)
            er_val = float(er_match.group(1).replace(",", ".")) if er_match else 0.0

            reading_match = re.search(r"Чтение\s*([\d\.,]+)\s*м", text, re.I)
            reading_time = reading_match.group(1) if reading_match else "0"

            # Контакты
            dzen_link = soup.find("a", href=re.compile(r"dzen\.ru/"))
            dzen_url = dzen_link.get("href", "") if dzen_link else ""

            tg_match = re.search(r"(https?://t\.me/[\w_]+|@[\w_]+)", text, re.I)
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
            vk_match = re.search(r"https?://vk\.com/[\w\.-]+", text, re.I)

            contacts = {
                "telegram": tg_match.group(0) if tg_match else None,
                "email": email_match.group(0) if email_match else None,
                "vk": vk_match.group(0) if vk_match else None
            }

            # Описание
            desc_elem = soup.find(class_=re.compile(r"description|about|info", re.I))
            description = desc_elem.text.strip()[:500] if desc_elem else ""

            # Статьи
            articles = []
            art_elems = soup.find_all(class_=re.compile(r"article|post|item", re.I))
            for a in art_elems[:5]:
                a_title = a.text.strip()
                if len(a_title) > 5:
                    articles.append({"title": a_title[:100], "views": 0, "vi": 0.0})

            return {
                "name": name,
                "guru_url": url,
                "dzen_url": dzen_url,
                "niche": niche,
                "subscribers": subscribers_str,
                "views_30d": views_str,
                "er_percent": er_val,
                "reading_time_min": reading_time,
                "contacts": contacts,
                "description": description,
                "top_articles": articles,
                "parsed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception:
            return None

    async def fetch_channel_page(self, client: httpx.AsyncClient, url: str) -> Optional[Dict]:
        """Асинхронная загрузка и парсинг одного канала."""
        async with self.semaphore:
            try:
                await asyncio.sleep(self.delay_sec)
                resp = await client.get(url, headers=HEADERS, timeout=12.0)
                if resp.status_code == 200:
                    return self.parse_channel_html(url, resp.text)
            except Exception:
                pass
            return None

    def load_checkpoint(self) -> tuple[List[str], List[Dict]]:
        if os.path.exists(self.checkpoint_file):
            try:
                with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("all_urls", []), data.get("parsed_channels", [])
            except Exception:
                pass
        return [], []

    def save_checkpoint(self, all_urls: List[str], parsed_channels: List[Dict]):
        try:
            checkpoint_data = {
                "total_urls": len(all_urls),
                "parsed_count": len(parsed_channels),
                "all_urls": all_urls,
                "parsed_channels": parsed_channels
            }
            with open(self.checkpoint_file, "w", encoding="utf-8") as f:
                json.dump(checkpoint_data, f, ensure_ascii=False, indent=2)
            
            with open(self.output_file, "w", encoding="utf-8") as f:
                json.dump(parsed_channels, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logging.error(f"Ошибка сохранения чекпоинта: {e}")

    async def run(self):
        logging.info("🚀 Запуск парсинга через Sitemap dzen.ru...")
        start_time = time.time()

        cached_urls, parsed_channels = self.load_checkpoint()
        parsed_urls_set = {ch["guru_url"] for ch in parsed_channels if "guru_url" in ch}

        limits = httpx.Limits(max_keepalive_connections=25, max_connections=40)
        async with httpx.AsyncClient(follow_redirects=True, limits=limits) as client:
            if not cached_urls:
                all_urls = await self.fetch_sitemap_urls(client)
            else:
                all_urls = cached_urls
                logging.info(f"📂 Восстановлен список из {len(all_urls)} URL каналов из чекпоинта.")

            urls_to_parse = [u for u in all_urls if u not in parsed_urls_set]
            total_targets = len(all_urls)
            already_done = len(parsed_channels)

            logging.info(f"📊 Осталось распарсить каналов: {len(urls_to_parse)} из {total_targets}...")

            batch_size = 50
            for i in range(0, len(urls_to_parse), batch_size):
                batch_urls = urls_to_parse[i:i + batch_size]
                tasks = [self.fetch_channel_page(client, u) for u in batch_urls]
                results = await asyncio.gather(*tasks)

                for res in results:
                    if res:
                        parsed_channels.append(res)

                done_now = len(parsed_channels)
                elapsed = time.time() - start_time
                done_in_session = done_now - already_done
                speed = done_in_session / max(elapsed, 0.1)
                remaining = total_targets - done_now
                eta_min = (remaining / max(speed, 0.01)) / 60

                logging.info(
                    f"📈 Прогресс: {done_now}/{total_targets} ({round((done_now/max(total_targets,1))*100, 1)}%) "
                    f"| Скорость: {speed:.1f} кан/сек | Осталось ~{eta_min:.1f} мин"
                )

                self.save_checkpoint(all_urls, parsed_channels)

        logging.info(f"🎉 Парсинг полностью завершён! Успешно собрано {len(parsed_channels)} каналов.")

if __name__ == "__main__":
    parser = DzenGuruSitemapParser(max_concurrent=15, delay_sec=0.05)
    asyncio.run(parser.run())
