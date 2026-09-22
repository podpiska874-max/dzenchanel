import asyncio
import json
import logging
import re
import time
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_URL = "https://dzen.ru/channels"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
}

class DzenGuruDeepParser:
    """
    Глубокий парсер dzen.ru:
    - Собирает базовую сводку из общего каталога
    - Заходит на детальную страницу каждого канала (/channels/имя_канала)
    - Извлекает контакты (Telegram, E-mail, VK), описание, историю и топ-публикации
    - Поддерживает асинхронный параллельный парсинг с ограничением скорости
    - Поддерживает автосохранение и докачку с места остановки (Checkpointing)
    """

    def __init__(
        self, 
        deep_scan: bool = True, 
        max_concurrent: int = 5, 
        delay_sec: float = 0.3,
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
                guru_detail_url = f"https://dzen.ru{guru_detail_url}"

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
                "dzen_url": "",  # Заполняется из детальной страницы или базовой ссылки
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
            logging.error(f"Ошибка парсинга базовой карточки: {e}")
            return None

    async def fetch_channel_details(self, client: httpx.AsyncClient, channel_data: Dict) -> Dict:
        """Сканирование персональной страницы канала на dzen.ru для сбора контактов и деталей."""
        if not self.deep_scan or not channel_data.get("guru_url"):
            return channel_data

        url = channel_data["guru_url"]
        async with self.semaphore:
            try:
                await asyncio.sleep(self.delay_sec)
                resp = await client.get(url, headers=HEADERS, timeout=12.0)
                if resp.status_code != 200:
                    return channel_data

                soup = BeautifulSoup(resp.text, "html.parser")
                text = soup.get_text()

                # 1. Прямая ссылка на Дзен
                dzen_link = soup.find("a", href=re.compile(r"dzen\.ru/"))
                if dzen_link:
                    channel_data["dzen_url"] = dzen_link.get("href", "")

                # 2. Поиск контактов (Telegram, Email, VK)
                tg_match = re.search(r"(https?://t\.me/[\w_]+|@[\w_]+)", text, re.I)
                email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
                vk_match = re.search(r"https?://vk\.com/[\w\.-]+", text, re.I)

                if tg_match:
                    channel_data["contacts"]["telegram"] = tg_match.group(0)
                if email_match:
                    channel_data["contacts"]["email"] = email_match.group(0)
                if vk_match:
                    channel_data["contacts"]["vk"] = vk_match.group(0)

                # 3. Описание канала
                desc_elem = soup.find(class_=re.compile(r"description|about|info", re.I))
                if desc_elem:
                    channel_data["description"] = desc_elem.text.strip()[:500]

                # 4. Топ-публикации канала
                articles = []
                for a in soup.find_all("a", href=re.compile(r"dzen\.ru/a/|/article/")):
                    title = a.text.strip()
                    href = a.get("href", "")
                    if title and href and len(title) > 5:
                        articles.append({"title": title, "url": href})
                channel_data["top_articles"] = articles[:5]

            except Exception as err:
                logging.debug(f"Не удалось получить детали для {url}: {err}")

        return channel_data

    async def fetch_catalog_page(self, client: httpx.AsyncClient, page: int) -> str:
        url = f"{BASE_URL}?page={page}" if page > 1 else BASE_URL
        for attempt in range(1, 4):
            try:
                resp = await client.get(url, headers=HEADERS, timeout=15.0)
                if resp.status_code == 200:
                    return resp.text
            except Exception as err:
                logging.warning(f"Ошибка загрузки страницы {page} (попытка {attempt}): {err}")
            await asyncio.sleep(1.5 * attempt)
        return ""

    def load_checkpoint(self) -> tuple[int, list]:
        try:
            with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("last_page", 0), data.get("channels", [])
        except FileNotFoundError:
            return 0, []

    def save_checkpoint(self, last_page: int, channels: list):
        with open(self.checkpoint_file, "w", encoding="utf-8") as f:
            json.dump({"last_page": last_page, "channels_count": len(channels), "channels": channels}, f, ensure_ascii=False, indent=2)
        with open(self.output_file, "w", encoding="utf-8") as f:
            json.dump(channels, f, ensure_ascii=False, indent=2)

    async def run(self, max_pages: int = 6300):
        start_page, all_channels = self.load_checkpoint()
        seen_names = {c["name"] for c in all_channels}

        if start_page > 0:
            logging.info(f"🔄 Восстановление прогресса с {start_page + 1} страницы. Уже собрано: {len(all_channels)} каналов.")

        start_time = time.time()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            for page in range(start_page + 1, max_pages + 1):
                html = await self.fetch_catalog_page(client, page)
                if not html:
                    logging.warning(f"Пропуск страницы {page} из-за ошибки сети.")
                    continue

                soup = BeautifulSoup(html, "html.parser")
                cards = [elem for elem in soup.find_all("div") if "подписчик" in elem.text.lower()]

                page_channels = []
                for card in cards:
                    parsed = self.parse_card_summary(card)
                    if parsed and parsed["name"] not in seen_names:
                        seen_names.add(parsed["name"])
                        page_channels.append(parsed)

                # Если включен deep_scan — заходим на детальную страницу каждого канала
                if self.deep_scan and page_channels:
                    tasks = [self.fetch_channel_details(client, ch) for ch in page_channels]
                    page_channels = await asyncio.gather(*tasks)

                all_channels.extend(page_channels)

                # Вычисление прогресса
                elapsed = time.time() - start_time
                pages_done = page - start_page
                avg_time_per_page = elapsed / max(pages_done, 1)
                remaining_pages = max_pages - page
                eta_minutes = (remaining_pages * avg_time_per_page) / 60

                pct = round((page / max_pages) * 100, 2)
                logging.info(f"📄 Стр. {page}/{max_pages} ({pct}%) | Всего каналов: {len(all_channels)} | Осталось ~{eta_minutes:.1f} мин")

                # Чекпоинт каждые 5 страниц
                if page % 5 == 0:
                    self.save_checkpoint(page, all_channels)
                    logging.info(f"💾 [Чекпоинт] Сохранено в {self.output_file} (Стр. {page})")

        self.save_checkpoint(max_pages, all_channels)
        logging.info(f"🎉 Сбор завершен! Всего выкачано каналов: {len(all_channels)}")

if __name__ == "__main__":
    # Запуск глубокого сканирования всех 6300 страниц
    parser = DzenGuruDeepParser(deep_scan=True, max_concurrent=5)
    asyncio.run(parser.run(max_pages=6300))
