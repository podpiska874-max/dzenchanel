const observer = new MutationObserver(() => {
  scanFeedCards();
  checkShadowban();
});
observer.observe(document.body, { childList: true, subtree: true });

// Run checks on page load
extractSEOTags();
checkShadowban();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'swapABTestTitle') {
    chrome.storage.local.get(['ab_title1', 'ab_title2'], (res) => {
      const input = document.querySelector('textarea[placeholder*="Заголовок"]') || document.querySelector('.editor-title-input');
      if (input) {
        // Swap title logic
        const currentTitle = input.value || input.textContent;
        const newTitle = (currentTitle === res.ab_title1) ? res.ab_title2 : res.ab_title1;

        if (newTitle) {
          input.value = newTitle;
          input.textContent = newTitle;
          input.dispatchEvent(new Event('input', { bubbles: true }));

          setTimeout(() => {
             const saveBtn = document.querySelector('button[aria-label="Сохранить"]') || document.querySelector('.editor-save-button');
             if (saveBtn) saveBtn.click();
          }, 500);
        }
      }
    });
  }

  if (message.action === 'doBulkReplace') {
    const { oldText, newText } = message.data;
    const editor = document.querySelector('[contenteditable="true"]') || document.querySelector('.editor-content');

    if (editor) {
       // Using a TreeWalker to safely replace text only inside Text nodes, avoiding HTML corruption
       const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
       let node;
       let changed = false;
       while ((node = walker.nextNode())) {
         if (node.nodeValue.includes(oldText)) {
           node.nodeValue = node.nodeValue.split(oldText).join(newText);
           changed = true;
         }
       }

       if (changed) {
         editor.dispatchEvent(new Event('input', { bubbles: true }));
         setTimeout(() => {
            const saveBtn = document.querySelector('button[aria-label="Сохранить"]') || document.querySelector('.editor-save-button');
            if (saveBtn) saveBtn.click();
         }, 1000);
       }
    }
  }
});


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

      // PRODZEN Analytics: Calculate ER and append
      calculateAndAppendER(card);

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

// ERID Control State Sync
let isEridProtectionEnabled = true; // default true
chrome.storage.local.get(['protection_erid'], (res) => {
  if (res.protection_erid !== undefined) {
    isEridProtectionEnabled = res.protection_erid;
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.protection_erid) {
    isEridProtectionEnabled = changes.protection_erid.newValue;
  }
});

// ERID Control Click Interceptor
document.addEventListener('click', (e) => {
  // Try to identify the publish button by class or text content
  const target = e.target;
  const isPublishBtn = target.closest('button') &&
                       (target.closest('button').textContent.toLowerCase().includes('опубликовать') ||
                        target.closest('button').classList.contains('editor-publish-button')); // Example classes

  if (isPublishBtn && isEridProtectionEnabled) {
    // Find the editor content
    const editor = document.querySelector('[contenteditable="true"]') || document.querySelector('.editor-content');
    if (editor) {
      const editorText = editor.textContent;
      const eridRegex = /erid:\s*[a-zA-Z0-9]{4,}/i;
      if (!eridRegex.test(editorText)) {
        e.preventDefault();
        e.stopPropagation();
        alert('Ошибка: Отсутствует токен ERID!');
      }
    }
  }
}, true); // Use capture phase to intercept before actual publish handlers


// PRODZEN Analytics (Calculate ER)
function calculateAndAppendER(card) {
  // Logic to extract views and likes from the card.
  // Selectors might need adjustment based on Dzen's actual layout.
  // Using pseudo-selectors for demonstration purposes.
  const viewsElement = card.querySelector('.views-count') || card.querySelector('[aria-label*="просмотр"]');
  const likesElement = card.querySelector('.likes-count') || card.querySelector('[aria-label*="лайк"]');

  if (viewsElement && likesElement) {
    const parseNumber = (text) => {
      if (!text) return 0;
      let numStr = text.replace(/[^0-9,.]/g, '').replace(',', '.');
      let multiplier = 1;
      if (text.includes('K') || text.includes('тыс')) multiplier = 1000;
      if (text.includes('M') || text.includes('млн')) multiplier = 1000000;
      return parseFloat(numStr) * multiplier;
    };

    const views = parseNumber(viewsElement.textContent || viewsElement.getAttribute('aria-label'));
    const likes = parseNumber(likesElement.textContent || likesElement.getAttribute('aria-label'));

    if (views > 0) {
      const er = ((likes / views) * 100).toFixed(1);

      const erSpan = document.createElement('span');
      erSpan.textContent = `ER: ${er}%`;
      erSpan.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; z-index: 10;';

      // Try to append over preview cover
      const cover = card.querySelector('img') || card;
      if (cover.parentElement) {
         cover.parentElement.style.position = 'relative';
         cover.parentElement.appendChild(erSpan);
      } else {
         card.appendChild(erSpan);
      }
    }
  }
}

// Shadowban Detector (noindex)
let shadowbanIsRunning = false;
function checkShadowban() {
  if (shadowbanIsRunning) return; // Basic throttle
  shadowbanIsRunning = true;

  setTimeout(() => {
    shadowbanIsRunning = false;
    chrome.storage.local.get(['protection_noindex'], (res) => {
      if (res.protection_noindex === false) return; // Enabled by default if not set

      // Look for all meta tags with name="robots", since content can be "noindex, nofollow", etc.
      const robotMetas = document.querySelectorAll('meta[name="robots"]');

      robotMetas.forEach(meta => {
        if (meta.getAttribute('data-shadowban-marked')) return;

        const content = (meta.getAttribute('content') || '').toLowerCase();
        if (content.includes('noindex')) {
          meta.setAttribute('data-shadowban-marked', 'true');

          let container = meta.closest('article, .card, .feed__row, [data-testid="card"]');

          if (container && !container.querySelector('.dzen-shadowban-warning')) {
            container.style.border = "3px solid red";
            const warning = document.createElement('div');
            warning.className = 'dzen-shadowban-warning';
            warning.textContent = 'ТЕНЕВОЙ БАН (noindex)';
            warning.style.cssText = 'background: red; color: white; padding: 10px; font-weight: bold; text-align: center; position: sticky; top: 0; z-index: 9999; width: 100%;';
            container.prepend(warning);
          } else if (!document.getElementById('dzen-global-shadowban-warning')) {
             // If it's a global meta tag in head, show a fixed banner instead of wrapping the body
             const banner = document.createElement('div');
             banner.id = 'dzen-global-shadowban-warning';
             banner.textContent = 'ТЕНЕВОЙ БАН (Страница содержит noindex)';
             banner.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: red; color: white; padding: 15px; font-weight: bold; text-align: center; z-index: 10000; font-size: 16px;';
             document.body.prepend(banner);
          }
        }
      });
    });
  }, 1000);
}

// SEO Tool (Tag Extractor)
function extractSEOTags() {
  // Only run on public article pages, assuming they don't have /profile/editor/ in URL
  if (window.location.href.includes('/profile/editor/')) return;

  setTimeout(() => {
    let tags = [];

    // Try to get from meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && metaKeywords.content) {
      tags = metaKeywords.content.split(',').map(t => t.trim()).filter(t => t);
    }

    // Fallback: try parsing application/json scripts for tags
    if (tags.length === 0) {
      const scripts = document.querySelectorAll('script[type="application/json"]');
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          // Recursively search for 'tags' array in JSON
          const findTags = (obj) => {
             if (!obj || typeof obj !== 'object') return [];
             if (Array.isArray(obj.tags)) return obj.tags;
             for (let key in obj) {
               const res = findTags(obj[key]);
               if (res.length > 0) return res;
             }
             return [];
          };
          const foundTags = findTags(data);
          if (foundTags.length > 0) {
            // Assume the tags might be strings or objects with a name property
            tags = foundTags.map(t => typeof t === 'string' ? t : (t.name || t.text)).filter(Boolean);
          }
        } catch (e) {
          // ignore parsing errors
        }
      });
    }

    if (tags.length > 0) {
      showSEOPanel(tags);
    }
  }, 2000); // Wait a bit for page to render
}

function showSEOPanel(tags) {
  if (document.getElementById('dzen-seo-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'dzen-seo-panel';
  panel.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 300px; background: #1c1c1e; color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 10000; font-family: sans-serif; border: 1px solid #333;';

  const title = document.createElement('h4');
  title.textContent = 'SEO Теги';
  title.style.margin = '0 0 10px 0';
  title.style.color = '#a855f7';
  panel.appendChild(title);

  const tagsContainer = document.createElement('div');
  tagsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; max-height: 100px; overflow-y: auto;';

  tags.forEach(tag => {
    const t = document.createElement('span');
    t.textContent = tag;
    t.style.cssText = 'background: #374151; padding: 3px 8px; border-radius: 12px; font-size: 12px;';
    tagsContainer.appendChild(t);
  });
  panel.appendChild(tagsContainer);

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Скопировать всё';
  copyBtn.style.cssText = 'width: 100%; padding: 8px; background: #9333ea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(tags.join(', ')).then(() => {
      copyBtn.textContent = 'Скопировано!';
      setTimeout(() => copyBtn.textContent = 'Скопировать всё', 2000);
    });
  };
  panel.appendChild(copyBtn);

  document.body.appendChild(panel);
}
