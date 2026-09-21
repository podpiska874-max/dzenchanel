import os

files = {
    "extension/manifest.json": """{
  "manifest_version": 3,
  "name": "Dzen Viral Analytics",
  "version": "1.0.0",
  "description": "Анализ виральности статей и динамики роста каналов Яндекс Дзен",
  "permissions": ["storage"],
  "host_permissions": ["https://dzen.ru/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://dzen.ru/*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Dzen Viral Analytics"
  }
}""",

    "extension/background.js": """chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_ARTICLE_METRICS') {
    handleFetchArticle(message.url)
      .then(metrics => sendResponse({ status: 'success', data: metrics }))
      .catch(error => sendResponse({ status: 'error', error: error.message }));
    return true;
  }
});

async function handleFetchArticle(articleUrl) {
  const cacheKey = `article_${articleUrl}`;
  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]) return cached[cacheKey];

  const response = await fetch(articleUrl);
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  const htmlText = await response.text();

  const match = htmlText.match(/window\\.__INITIAL_STATE__\\s*=\\s*({.*?});<\\/script>/s);
  if (!match) throw new Error('INITIAL_STATE не найден');

  const initialState = JSON.parse(match[1]);
  const publication = initialState?.article || initialState?.publication || {};
  const channel = initialState?.channel || {};

  const viewsCount = publication.viewsCount || publication.readingsCount || 0;
  const likesCount = publication.likesCount || 0;
  const commentsCount = publication.commentsCount || 0;
  const subscribersCount = channel.subscribersCount || 1;

  const viralIndex = parseFloat((viewsCount / subscribersCount).toFixed(2));

  const resultData = { viewsCount, likesCount, commentsCount, subscribersCount, viralIndex };
  await chrome.storage.local.set({ [cacheKey]: resultData });

  try {
    await fetch('http://localhost:8000/api/v1/ingest/extension-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_name: channel.title || 'Неизвестно',
        dzen_url: articleUrl,
        views_count: viewsCount,
        subscribers_count: subscribersCount,
        viral_index: viralIndex
      })
    });
  } catch (e) {}

  return resultData;
}""",

    "extension/content.js": """const observer = new MutationObserver(() => scanFeedCards());
observer.observe(document.body, { childList: true, subtree: true });

function scanFeedCards() {
  const articleLinks = document.querySelectorAll('a[href*="/a/"]:not([data-viral-checked])');

  articleLinks.forEach(link => {
    link.setAttribute('data-viral-checked', 'true');
    const articleUrl = link.href;

    chrome.runtime.sendMessage(
      { type: 'FETCH_ARTICLE_METRICS', url: articleUrl },
      (response) => {
        if (chrome.runtime.lastError || !response || response.status !== 'success') return;
        const { viralIndex, viewsCount } = response.data;
        injectViralBadge(link, viralIndex, viewsCount);
      }
    );
  });
}

function injectViralBadge(targetLink, vi, views) {
  const badge = document.createElement('div');
  let emoji = '📊';
  let badgeClass = 'viral-normal';
  if (vi > 3.0) { emoji = '🔥'; badgeClass = 'viral-fire'; }
  else if (vi > 1.0) { emoji = '🚀'; badgeClass = 'viral-rocket'; }

  badge.className = `dzen-viral-badge ${badgeClass}`;
  badge.textContent = `${emoji} VI: ${vi} (${views} просм.)`;

  const parentCard = targetLink.closest('article') || targetLink.parentElement;
  if (getComputedStyle(parentCard).position === 'static') {
    parentCard.style.position = 'relative';
  }
  parentCard.appendChild(badge);
}""",

    "extension/styles.css": """.dzen-viral-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 99;
  cursor: pointer;
}
.dzen-viral-badge.viral-fire { background: linear-gradient(135deg, #ff3b30, #ff9500); }
.dzen-viral-badge.viral-rocket { background: linear-gradient(135deg, #34c759, #30b0c7); }
.dzen-viral-badge.viral-normal { background: rgba(142, 142, 147, 0.9); }""",

    "extension/popup.html": """<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Dzen Analytics</title>
  <style>
    body { width: 280px; padding: 14px; font-family: sans-serif; background: #1c1c1e; color: #fff; margin: 0; }
    h3 { margin-top: 0; color: #ff9500; }
    button { width: 100%; padding: 10px; background: #007aff; border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <h3>🔥 Dzen Viral Analytics</h3>
  <p>Расширение активно и анализирует ленту Дзена в реальном времени.</p>
  <button id="btn">Открыть Swagger API</button>
  <script src="popup.js"></script>
</body>
</html>""",

    "extension/popup.js": """document.getElementById('btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:8000/docs' });
});"""
}

os.makedirs("extension", exist_ok=True)
for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
print("✅ Папка 'extension' и все 6 файлов успешно созданы!")
