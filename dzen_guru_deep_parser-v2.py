import asyncio
import json
import logging
import os
import re
import time
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_URL = "https://dzen.guru/channels"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
}

class DzenGuruDeepParser:
    """
    Высокопроизводительный асинхронный глубокий парсер dzen.guru:
    - Собирает весь каталог каналов (300 000+ каналов)
    - Глубокое сканирование персональных страниц для извлечения контактов (Telegram, Email, VK)
    - Увеличенный параллелизм (12-15 потоков) для сбора полной базы за минимальное время
    - Автоматический сброс ошибочных чекпоинтов и автосохранение
    """

    def __init__(
        self, 
        deep_scan: bool = True, 
        max_concurrent: int = 12, 
        delay_sec: float = 0.15,
        checkpoint_file: str = "dzen_parser_checkpoint.json",
        output_file: str = "dzen_deep_channels.json"
    ):
        self.deep_scan = deep_scan
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.delay_sec = delay_sec
        self.checkpoint_file = checkpoint_file
        self.output_file = output_file

    def parse_card_summary(self, card_soup) -> Optional[Dict]:
        """Извлечение базовых метрик из карточки канала в каталоге."""
        try:
            title_elem = card_soup.find("a", href=re.compile(r"/channels/|dzen\.ru"))
            if not title_elem:
                return None

            name = title_elem.text.strip()
            guru_detail_url = title_elem.get("href", "")
            if guru_detail_url.startswith("/"):
                guru_detail_url = f"https://dzen.guru{guru_detail_url}"

            niche_elem = card_soup.find(class_=re.compile(r"niche|category|tag", re.I))
            niche = niche_elem.text.strip() if niche_elem else "Общее"

            text_block = card_soup.get_text(separator=" ")

            subs_match = re.search(r"([\d\.,]+)\s*([КМkM]?)\s*подписчик", text_block, re.I)
            subscribers_str = f"{subs_match.group(1)}{subs_match.group(2)}" if subs_match else "0"

            views_match = re.search(r"([\d\.,]+)\s*([КМkM]?)\s*просмотр", text_block, re.I)
            views_str = f"{views_match.group(1)}{views_match.group(2)}" if views_match else "0"

            er_match = re.search(r"ER\s*([\d\.,]+)%", text_block, re.I)
            er_val = float(er_match.group(1).replace(",", ".")) if er_match else 0.0

            reading_match = re.search(r"Чтение\s*([\d\.,]+)\s*м", text_block, re.I)
            reading_time = reading_match.group(1) if reading_match else "0"

            return {
                "name": name,
                "guru_url": guru_detail_url,
                "dzen_url": "",
                "niche": niche,
                "subscribers": subscribers_str,
                "views_30d": views_str,
                "er_percent": er_val,
                "reading_time_min": reading_time,
                "contacts": {"telegram": None, "email": None, "vk": None, "other": []},
                "description": "",
                "top_articles": [],
                "parsed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception as e:
            return None

    async def fetch_channel_details(self, client: httpx.AsyncClient, channel_data: Dict) -> Dict:
        """Сканирование карточки канала для извлечения контактов."""
        if not self.deep_scan or not channel_data.get("guru_url"):
            return channel_data

        url = channel_data["guru_url"]
        async with self.semaphore:
            try:
                await asyncio.sleep(self.delay_sec)
                resp = await client.get(url, headers=HEADERS, timeout=10.0)
                if resp.status_code != 200:
                    return channel_data

                soup = BeautifulSoup(resp.text, "html.parser")
                text = soup.get_text()

                dzen_link = soup.find("a", href=re.compile(r"dzen\.ru/"))
                if dzen_link:
                    channel_data["dzen_url"] = dzen_link.get("href", "")

                tg_match = re.search(r"(https?://t\.me/[\w_]+|@[\w_]+)", text, re.I)
                email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
                vk_match = re.search(r"https?://vk\.com/[\w\.-]+", text, re.I)

                if tg_match:
                    channel_data["contacts"]["telegram"] = tg_match.group(0)
                if email_match:
                    channel_data["contacts"]["email"] = email_match.group(0)
                if vk_match:
                    channel_data["contacts"]["vk"] = vk_match.group(0)

                desc_elem = soup.find(class_=re.compile(r"description|about|info", re.I))
                if desc_elem:
                    channel_data["description"] = desc_elem.text.strip()[:500]

            except Exception:
                pass

        return channel_data

    async def fetch_catalog_page(self, client: httpx.AsyncClient, page: int) -> str:
        url = f"{BASE_URL}?page={page}" if page > 1 else BASE_URL
        for attempt in range(1, 4):
            try:
                resp = await client.get(url, headers=HEADERS, timeout=12.0)
                if resp.status_code == 200:
                    return resp.text
            except Exception as err:
                pass
            await asyncio.sleep(0.5 * attempt)
        return ""

    def load_checkpoint(self) -> tuple[int, list]:
        try:
            if os.path.exists(self.checkpoint_file):
                with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    page = data.get("last_page", 0)
                    # Защита от сбойных значений типа 6301 при пустой базе
                    if page >= 6300:
                        logging.warning("⚠️ Обнаружен сброшенный чекпоинт (6300+). Сброс с 1-й страницы.")
                        return 0, []
                    return page, data.get("channels", [])
        except Exception:
            pass
        return 0, []

    def save_checkpoint(self, last_page: int, channels: list):
        try:
            with open(self.checkpoint_file, "w", encoding="utf-8") as f:
                json.dump({"last_page": last_page, "channels_count": len(channels), "channels": channels}, f, ensure_ascii=False, indent=2)
            with open(self.output_file, "w", encoding="utf-8") as f:
                json.dump(channels, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logging.error(f"Ошибка сохранения чекпоинта: {e}")

    async def run(self, max_pages: int = 6300, reset: bool = False):
        if reset and os.path.exists(self.checkpoint_file):
            os.remove(self.checkpoint_file)
            logging.info("🧹 Старый чекпоинт сброшен!")

        start_page, all_channels = self.load_checkpoint()
        seen_names = {c["name"] for c in all_channels}

        logging.info(f"🚀 Запуск усовершенствованного глубокого парсера со страницы {start_page + 1}/{max_pages}...")
        start_time = time.time()

        limits = httpx.Limits(max_keepalive_connections=20, max_connections=30)
        async with httpx.AsyncClient(follow_redirects=True, limits=limits) as client:
            for page in range(start_page + 1, max_pages + 1):
                html = await self.fetch_catalog_page(client, page)
                if not html:
                    logging.warning(f"⚠️ Пропуск страницы {page} (страница недоступна)")
                    continue

                soup = BeautifulSoup(html, "html.parser")
                cards = [elem for elem in soup.find_all("div") if "подписчик" in elem.text.lower()]

                if not cards and page > 10:
                    logging.info(f"🏁 Достигнут конец каталога на странице {page}.")
                    break

                page_channels = []
                for card in cards:
                    parsed = self.parse_card_summary(card)
                    if parsed and parsed["name"] not in seen_names:
                        seen_names.add(parsed["name"])
                        page_channels.append(parsed)

                if self.deep_scan and page_channels:
                    tasks = [self.fetch_channel_details(client, ch) for ch in page_channels]
                    page_channels = await asyncio.gather(*tasks)

                all_channels.extend(page_channels)

                # Статистика и ETA
                elapsed = time.time() - start_time
                pages_done = page - start_page
                avg_time_per_page = elapsed / max(pages_done, 1)
                remaining_pages = max_pages - page
                eta_minutes = (remaining_pages * avg_time_per_page) / 60

                pct = round((page / max_pages) * 100, 2)
                logging.info(f"📄 Стр. {page}/{max_pages} ({pct}%) | Собрано каналов: {len(all_channels)} | Осталось ~{eta_minutes:.1f} мин")

                # Чекпоинт каждые 5 страниц
                if page % 5 == 0:
                    self.save_checkpoint(page, all_channels)

        self.save_checkpoint(max_pages, all_channels)
        logging.info(f"🎉 Полный сбор завершен! Всего выкачано каналов: {len(all_channels)}")

if __name__ == "__main__":
    # Ускоренный режим с 12 параллельными потоками
    parser = DzenGuruDeepParser(deep_scan=True, max_concurrent=12, delay_sec=0.1)
    asyncio.run(parser.run(max_pages=6300))
