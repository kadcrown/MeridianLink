chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'meridianlink-create-smartlink',
    title: 'Generate MeridianLink SmartLink',
    contexts: ['page', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'meridianlink-create-smartlink') {
    const targetUrl = info.linkUrl || info.pageUrl || tab?.url;
    if (!targetUrl) return;

    const storage = await chrome.storage.sync.get(['serverUrl', 'apiToken']);
    const serverUrl = storage.serverUrl || 'http://localhost:3000';
    const apiToken = storage.apiToken;

    if (!apiToken) {
      chrome.tabs.create({ url: `${serverUrl}/integrations` });
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/v1/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          originalUrl: targetUrl,
          displayName: tab?.title || 'Quick SmartLink',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = `${serverUrl}/r/${data.link.slug}`;
        console.log('Created smart link:', shortUrl);
      }
    } catch (err) {
      console.error('Failed to create smart link from extension', err);
    }
  }
});
