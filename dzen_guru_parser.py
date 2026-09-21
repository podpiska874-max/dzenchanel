import asyncio
import json
import logging
import os
import re
import sys
import time
from typing import Dict, Optional
import httpx
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)

BASE_URL = "https://dzen.guru/channels"
TOTAL_PAGES_ESTIMATE = 6300
OUTPUT_FILE = "dzen_all_channels.json"
CHECKPOINT_FILE = "dzen_parser_checkpoint.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
}

class FullDzenGuruParser:
    def __init__(
        self,
        delay_sec: float = 0.5,
        max_retries: int = 4,
        checkpoint_interval: int = 10
    ):
        self.delay_sec = delay_sec
        self.max_retries = max_retries
        self.checkpoint_interval = checkpoint_interval
        self.channels_map: Dict[str, Dict] = {}
        self.start_page = 1
        self.is_running = True

    def load_checkpoint(self):
        """Загрузка ранее сохраненного прогресса для докачки"""
        if os.path.exists(CHECKPOINT_FILE):
            try:
                with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.start_page = data.get("last_page", 1) + 1
                    saved_channels = data.get("channels", [])
                    for ch in saved_channels:
                        key = ch.get("dzen_url") or ch.get("name")
                        if key:
                            self.channels_map[key] = ch
                logging.info(
                    f"🔄 Восстановлен прогресс: продолжение со страницы {self.start_page}. "
                    f"Уже в базе: {len(self.channels_map)} каналов."
                )
            except Exception as e:
                logging.warning(f"Ошибка загрузки чекпоинта: {e}. Начинаем с 1 страницы.")

    def save_checkpoint(self, current_page: int):
        """Сохранение контрольной точки на диск"""
        channels_list = list(self.channels_map.values())
        checkpoint_data = {
            "last_page": current_page,
            "total_channels": len(channels_list),
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "channels": channels_list
        }
        try:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(channels_list, f, ensure_ascii=False, indent=2)
            
            with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
                json.dump(checkpoint_data, f, ensure_ascii=False, indent=2)
                
            logging.info(
                f"💾 [Чекпоинт] Стр. {current_page}/{TOTAL_PAGES_ESTIMATE} | "
                f"Сохранено каналов: {len(channels_list)}"
            )
        except Exception as e:
            logging.error(f"Ошибка при сохранении чекпоинта: {e}")

    def parse_card(self, card_soup) -> Optional[Dict]:
        try:
            title_elem = card_soup.find("a", href=re.compile(r"/channel/|dzen\.ru"))
            name = title_elem.text.strip() if title_elem else "Неизвестно"
            dzen_url = title_elem.get("href", "") if title_elem else ""

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
            reading_time = reading_match.group(1) if reading_match else "нет данных"

            return {
                "name": name,
                "dzen_url": dzen_url,
                "niche": niche,
                "subscribers": subscribers_str,
                "views_30d": views_str,
                "er_percent": er_val,
                "reading_time_min": reading_time,
                "parsed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        except Exception:
            return None

    async def fetch_page(self, client: httpx.AsyncClient, page: int) -> str:
        url = f"{BASE_URL}?page={page}" if page > 1 else BASE_URL
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = await client.get(url, headers=HEADERS, timeout=15.0)
                if resp.status_code == 200:
                    return resp.text
                elif resp.status_code == 404:
                    logging.info(f"Достигнут конец каталога (404) на странице {page}")
                    self.is_running = False
                    return ""
            except Exception as err:
                if attempt == self.max_retries:
                    logging.warning(f"⚠️ Ошибка загрузки страницы {page}: {err}")
            await asyncio.sleep(1.5 * attempt)
        return ""

    async def run(self, max_pages: int = TOTAL_PAGES_ESTIMATE):
        self.load_checkpoint()
        
        start_time = time.time()
        logging.info(f"🚀 Запуск полного парсинга dzen.guru (страницы {self.start_page} — {max_pages})...")

        async with httpx.AsyncClient(follow_redirects=True) as client:
            for page in range(self.start_page, max_pages + 1):
                if not self.is_running:
                    break

                html = await self.fetch_page(client, page)
                if not html:
                    continue

                soup = BeautifulSoup(html, "html.parser")
                cards = [elem for elem in soup.find_all("div") if "подписчик" in elem.text.lower()]
                
                for card in cards:
                    data = self.parse_card(card)
                    if data and data["name"] != "Неизвестно":
                        key = data["dzen_url"] or data["name"]
                        self.channels_map[key] = data

                # Расчет времени
                elapsed = time.time() - start_time
                pages_done = page - self.start_page + 1
                avg_time_per_page = elapsed / pages_done if pages_done > 0 else 0
                remaining_pages = max_pages - page
                est_rem_minutes = (remaining_pages * avg_time_per_page) / 60

                if page % 5 == 0 or page == max_pages:
                    logging.info(
                        f"📄 Стр. {page}/{max_pages} ({(page/max_pages)*100:.1f}%) | "
                        f"Всего уникальных каналов: {len(self.channels_map)} | "
                        f"Осталось ~{est_rem_minutes:.1f} мин"
                    )

                # Автосохранение
                if page % self.checkpoint_interval == 0:
                    self.save_checkpoint(page)

                await asyncio.sleep(self.delay_sec)

        self.save_checkpoint(page if 'page' in locals() else max_pages)
        logging.info(f"🎉 Парсинг завершен! Итого каналов в базе: {len(self.channels_map)}")

if __name__ == "__main__":
    parser = FullDzenGuruParser(delay_sec=0.5, checkpoint_interval=10)
    try:
        asyncio.run(parser.run(max_pages=6300))
    except KeyboardInterrupt:
        logging.info("\n🛑 Процесс остановлен пользователем. Сохраняем прогресс...")
        sys.exit(0)
