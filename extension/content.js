const observer = new MutationObserver(() => scanFeedCards());
observer.observe(document.body, { childList: true, subtree: true });

// Avoid triggering multiple scans quickly
let scanTimeout;
function scanFeedCards() {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => {
    // Select potential article cards
    const cards = document.querySelectorAll('article, .card, .feed__row, [data-testid="card"]');

    cards.forEach(card => {
      // Don't process already processed cards
      if (card.hasAttribute('data-viral-processed')) return;

      // Look for the author link inside the card
      const links = Array.from(card.querySelectorAll('a[href]'));

      let channelId = null;
      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) continue;

        // Skip system paths
        if (href.includes('/a/') || href.includes('/video/') || href.includes('/news/') || href.includes('/settings/')) continue;

        // Match Dzen channel URL pattern
        // Either starting with /@username, /id/123, or full dzen.ru URLs
        let match = href.match(/dzen\.ru\/(?:@|id\/)?([a-zA-Z0-9_\-]+)/);
        if (match) {
          channelId = match[1];
        } else if (href.startsWith('/@') || href.startsWith('/id/')) {
          match = href.match(/^\/(?:@|id\/)?([a-zA-Z0-9_\-]+)/);
          if (match) {
            channelId = match[1];
          }
        }

        if (channelId) break;
      }

      if (!channelId) return;

      // Mark card as processed to prevent infinite loops
      card.setAttribute('data-viral-processed', 'true');

      // Insert loading state
      const panel = createBasePanel();
      card.style.position = 'relative'; // Ensure absolute positioning of panel works
      card.appendChild(panel);

      // Fetch stats from background
      chrome.runtime.sendMessage(
        { type: 'FETCH_CHANNEL_STATS', channelId: channelId },
        (response) => {
          if (chrome.runtime.lastError || !response || response.status === 'error') {
            panel.innerHTML = `<span style="color: #ff3b30">Ошибка связи с сервером</span>`;
            return;
          }

          if (response.status === 'success') {
            renderSuccessPanel(panel, response.data);
          } else if (response.status === 'not_found') {
            renderNotFoundPanel(panel, channelId);
          }
        }
      );
    });
  }, 300);
}

function createBasePanel() {
  const panel = document.createElement('div');
  panel.className = 'dzen-viral-panel';
  panel.innerHTML = `<div class="dzen-viral-loading">🔮 Дзен Вирал • Загрузка показателей...</div>`;
  return panel;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function renderSuccessPanel(panel, data) {
  const vi = data.avg_viral_index || 0;
  const reach = data.views_30d || 0;
  const er = data.er_percent || 0;

  let badgeClass = 'viral-normal';
  let emoji = '📊';
  if (vi > 3.0) {
    badgeClass = 'viral-fire';
    emoji = '🔥';
  } else if (vi > 1.5) {
    badgeClass = 'viral-rocket';
    emoji = '🚀';
  } else if (vi > 1.0) {
    badgeClass = 'viral-good';
    emoji = '✨';
  }

  panel.innerHTML = `
    <div class="dzen-viral-content">
      <div class="dzen-viral-logo">🔮 Dzen Viral</div>
      <div class="dzen-viral-stats">
        <span>Охват 30д: ${formatNumber(reach)}</span>
        <span>ER: ${er}%</span>
        <span class="dzen-viral-badge-vi ${badgeClass}">${emoji} VI: ${vi}</span>
      </div>
      <a class="dzen-viral-btn" href="http://localhost:3000/channel/${data.dzen_id || data.id}" target="_blank">Аналитика 📊</a>
    </div>
  `;
}

function renderNotFoundPanel(panel, channelId) {
  panel.innerHTML = `
    <div class="dzen-viral-content">
      <div class="dzen-viral-logo">🔮 Dzen Viral</div>
      <div class="dzen-viral-status">Канал еще не оценен</div>
      <button class="dzen-viral-btn-black">🔍 Оценить виральность</button>
    </div>
  `;

  const btn = panel.querySelector('.dzen-viral-btn-black');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (btn.disabled) return;

    btn.disabled = true;
    btn.textContent = '⚡ Оценка...';
    btn.classList.add('loading');

    chrome.runtime.sendMessage(
      { type: 'IMPORT_CHANNEL', channelId: channelId },
      (response) => {
        if (chrome.runtime.lastError || !response || response.status === 'error') {
          btn.disabled = false;
          btn.textContent = 'Ошибка';
          btn.classList.remove('loading');
          return;
        }

        if (response.status === 'success') {
          // Smoothly replace with success panel
          renderSuccessPanel(panel, response.data);
        }
      }
    );
  });
}
