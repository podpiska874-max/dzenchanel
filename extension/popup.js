document.getElementById('dashboard-btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});
