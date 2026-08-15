document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    document.getElementById('targetUrl').value = tab.url || '';
    document.getElementById('displayName').value = tab.title || '';
  }

  document.getElementById('createBtn').addEventListener('click', async () => {
    const url = document.getElementById('targetUrl').value;
    const name = document.getElementById('displayName').value;

    const storage = await chrome.storage.sync.get(['serverUrl', 'apiToken']);
    const serverUrl = storage.serverUrl || 'http://localhost:3000';
    const apiToken = storage.apiToken;

    if (!apiToken) {
      alert('Please configure your API token in extension options.');
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/v1/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ originalUrl: url, displayName: name }),
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = `${serverUrl}/r/${data.link.slug}`;
        const output = document.getElementById('output');
        const linkEl = document.getElementById('shortLink');
        linkEl.href = shortUrl;
        linkEl.innerText = shortUrl;
        output.style.display = 'block';
      } else {
        alert('Failed to create SmartLink');
      }
    } catch (e) {
      alert('Network error connecting to MeridianLink server');
    }
  });
});
