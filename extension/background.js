chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

  const match = htmlText.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});<\/script>/s);
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
}