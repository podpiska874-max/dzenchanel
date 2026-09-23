chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_CHANNEL_STATS') {
    handleFetchChannelStats(message.channelId)
      .then(stats => sendResponse({ status: 'success', data: stats }))
      .catch(error => {
        if (error.message === '404') {
          sendResponse({ status: 'not_found' });
        } else {
          sendResponse({ status: 'error', error: error.message });
        }
      });
    return true;
  }
  if (message.type === 'IMPORT_CHANNEL') {
    handleImportChannel(message.channelId)
      .then(stats => sendResponse({ status: 'success', data: stats }))
      .catch(error => sendResponse({ status: 'error', error: error.message }));
    return true;
  }
});

async function handleFetchChannelStats(channelId) {
  const cacheKey = `channel_${channelId}`;
  const cached = await chrome.storage.local.get([cacheKey]);

  if (cached[cacheKey] && cached[cacheKey].timestamp && (Date.now() - cached[cacheKey].timestamp < 5 * 60 * 1000)) {
    return cached[cacheKey].data;
  }

  const response = await fetch(`http://localhost:3000/api/v1/channels/${channelId}`);
  if (response.status === 404) {
    throw new Error('404');
  }
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  await chrome.storage.local.set({
    [cacheKey]: {
      timestamp: Date.now(),
      data: data
    }
  });

  return data;
}

async function handleImportChannel(channelId) {
  const response = await fetch(`http://localhost:3000/api/v1/channels/import-by-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dzen_id: channelId })
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const result = await response.json();
  const data = result.channel;

  const cacheKey = `channel_${channelId}`;
  await chrome.storage.local.set({
    [cacheKey]: {
      timestamp: Date.now(),
      data: data
    }
  });

  return data;
}
