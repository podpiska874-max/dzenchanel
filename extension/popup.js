document.getElementById('btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:8000/docs' });
});