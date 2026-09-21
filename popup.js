document.addEventListener('DOMContentLoaded', async () => {
  const scannedElem = document.getElementById('scannedCount');
  const viralElem = document.getElementById('viralCount');
  const dashboardBtn = document.getElementById('openDashboardBtn');

  // Получаем статистику из chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const data = await chrome.storage.local.get(['scanned_count', 'viral_count']);
    if (scannedElem) scannedElem.textContent = data.scanned_count || 0;
    if (viralElem) viralElem.textContent = data.viral_count || 0;
  }

  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: 'http://localhost:8000/docs' });
      } else {
        window.open('http://localhost:8000/docs', '_blank');
      }
    });
  }
});
