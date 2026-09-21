const observer = new MutationObserver(() => scanFeedCards());
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
}