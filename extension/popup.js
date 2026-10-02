document.addEventListener('DOMContentLoaded', () => {
  // --- Tab Logic ---
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-target')).classList.add('active');
    });
  });

  // --- Load Settings ---
  chrome.storage.local.get(['protection_noindex', 'protection_erid', 'ab_title1', 'ab_title2'], (res) => {
    document.getElementById('chk-noindex').checked = res.protection_noindex !== false;
    document.getElementById('chk-erid').checked = res.protection_erid !== false;
    if (res.ab_title1) document.getElementById('ab-title1').value = res.ab_title1;
    if (res.ab_title2) document.getElementById('ab-title2').value = res.ab_title2;
  });

  // --- Save Protection Settings ---
  const saveProtection = () => {
    chrome.storage.local.set({
      protection_noindex: document.getElementById('chk-noindex').checked,
      protection_erid: document.getElementById('chk-erid').checked
    });
  };
  document.getElementById('chk-noindex').addEventListener('change', saveProtection);
  document.getElementById('chk-erid').addEventListener('change', saveProtection);

  // --- Save A/B Titles ---
  document.getElementById('btn-save-ab').addEventListener('click', () => {
    const title1 = document.getElementById('ab-title1').value;
    const title2 = document.getElementById('ab-title2').value;
    chrome.storage.local.set({ ab_title1: title1, ab_title2: title2 }, () => {
       const btn = document.getElementById('btn-save-ab');
       const originalText = btn.textContent;
       btn.textContent = 'Сохранено!';

       // Setup alarm if not exists
       chrome.alarms.create("abTest", { periodInMinutes: 60 });

       setTimeout(() => btn.textContent = originalText, 1500);
    });
  });

  // --- Start Bulk Replace ---
  document.getElementById('btn-start-bulk').addEventListener('click', () => {
    const urlsText = document.getElementById('bulk-urls').value;
    const oldText = document.getElementById('bulk-old').value;
    const newText = document.getElementById('bulk-new').value;

    if (!urlsText || !oldText) {
      alert("Заполните ссылки и старый текст");
      return;
    }

    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);

    chrome.runtime.sendMessage({
      action: "startBulkReplace",
      data: { urls, oldText, newText }
    });

    const btn = document.getElementById('btn-start-bulk');
    btn.textContent = 'Запущено...';
    setTimeout(() => btn.textContent = 'Старт замены', 2000);
  });

  // --- Dashboard Button ---
  document.getElementById('dashboard-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  // --- Fetch and Render Stats (Mock logic for progress bar) ---
  // In a real scenario, you'd fetch from background.js which fetches from your local server
  const fetchMockStats = async () => {
    // Just a placeholder since the server might not be running or might not have aggregated watch hours route
    // Simulate some watch hours
    const watchHours = 12.5;
    const maxHours = 30;

    const pct = Math.min((watchHours / maxHours) * 100, 100);

    document.getElementById('watch-hours-text').textContent = `${watchHours} / ${maxHours}ч`;
    document.getElementById('watch-hours-bar').style.width = `${pct}%`;
  };

  fetchMockStats();
});
