'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  Code,
  Key,
  Globe,
  Youtube,
  Puzzle,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'snippet' | 'wordpress' | 'extension' | 'youtube' | 'tokens' | 'openapi'>('snippet');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Snippet Options
  const [snippetGroupId, setSnippetGroupId] = useState('');
  const [preserveAttribution, setPreserveAttribution] = useState(true);
  const [observeDynamic, setObserveDynamic] = useState(true);

  // API Tokens state
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenScopes, setTokenScopes] = useState<string[]>(['links:read', 'links:write']);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  // YouTube state
  const [isScanningYt, setIsScanningYt] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const loadTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const res = await fetch('/api/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tokens') {
      loadTokens();
    }
  }, [activeTab]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName, scopes: tokenScopes }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedToken(data.token.token);
        setTokenName('');
        await loadTokens();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm('Revoke this personal access token? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadTokens();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScanYouTube = async () => {
    setIsScanningYt(true);
    try {
      const res = await fetch('/api/integrations/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SCAN' }),
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data.scanResult);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningYt(false);
    }
  };

  const snippetEmbedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/integrations/snippet?groupId=${encodeURIComponent(snippetGroupId)}&preserveAttribution=${preserveAttribution}&observeDynamic=${observeDynamic}" async></script>`;

  return (
    <div>
      <Navbar title="Integrations Hub" subtitle="Website snippets, WordPress plugin, browser extensions, YouTube optimizer & Owner API" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2">
          {[
            { id: 'snippet', label: 'Website Rewriter', icon: Globe },
            { id: 'wordpress', label: 'WordPress Plugin', icon: Puzzle },
            { id: 'extension', label: 'Browser Extension', icon: Download },
            { id: 'youtube', label: 'YouTube Descriptions', icon: Youtube },
            { id: 'tokens', label: 'Personal API Tokens', icon: Key },
            { id: 'openapi', label: 'OpenAPI Spec', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: WEBSITE SNIPPET */}
        {activeTab === 'snippet' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                <span>Client-Side Link Rewriter</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Paste this script into the <code>&lt;head&gt;</code> or footer of your website or blog. It automatically detects raw Amazon, Best Buy, and Walmart product links on your pages and converts them to localized SmartLinks with zero layout shifts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Attribution Group ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={snippetGroupId}
                    onChange={(e) => setSnippetGroupId(e.target.value)}
                    placeholder="e.g. tech-gear"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="preserveAttr"
                    checked={preserveAttribution}
                    onChange={(e) => setPreserveAttribution(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-teal-500"
                  />
                  <label htmlFor="preserveAttr" className="text-xs text-slate-300">
                    Preserve existing store tags
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="observeDyn"
                    checked={observeDynamic}
                    onChange={(e) => setObserveDynamic(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-teal-500"
                  />
                  <label htmlFor="observeDyn" className="text-xs text-slate-300">
                    Auto-scan dynamic DOM content
                  </label>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative mt-4">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-teal-300 overflow-x-auto">
                  {snippetEmbedCode}
                </pre>
                <button
                  onClick={() => handleCopy(snippetEmbedCode, 'snippet')}
                  className="absolute right-3 top-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy Snippet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WORDPRESS PLUGIN */}
        {activeTab === 'wordpress' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-teal-400" />
              <span>Official WordPress Plugin Package</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Install the MeridianLink WordPress plugin to automatically rewrite retailer URLs across all posts, pages, and custom post types while maintaining full editorial control.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-200">Plugin File Location in Workspace:</span>
              <code className="text-xs text-teal-400 font-mono block">packages/wordpress-plugin/meridianlink.php</code>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-200">Quick Installation Steps:</h3>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5">
                <li>Zip the <code>packages/wordpress-plugin</code> folder.</li>
                <li>In your WordPress Admin, go to <strong>Plugins &gt; Add New &gt; Upload Plugin</strong>.</li>
                <li>Navigate to <strong>Settings &gt; MeridianLink</strong> and paste your server URL and API Token.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 3: BROWSER EXTENSION */}
        {activeTab === 'extension' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-400" />
              <span>Chrome &amp; Edge Browser Extension (Manifest V3)</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Generate localized SmartLinks in one click from any Amazon, Best Buy, or Walmart product tab or via right-click context menu.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-200">Extension Package Directory:</span>
              <code className="text-xs text-teal-400 font-mono block">packages/browser-extension/</code>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-200">Installation (Developer Mode):</h3>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5">
                <li>Open <code>chrome://extensions</code> or <code>edge://extensions</code>.</li>
                <li>Enable <strong>Developer mode</strong> in the top right.</li>
                <li>Click <strong>Load unpacked</strong> and select the <code>packages/browser-extension</code> directory.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: YOUTUBE OPTIMIZER */}
        {activeTab === 'youtube' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span>YouTube Channel Video Optimizer</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Scan your video descriptions for unmonetized or non-localized retailer URLs and preview safe replacement diffs.
                </p>
              </div>

              <button
                onClick={handleScanYouTube}
                disabled={isScanningYt}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                {isScanningYt ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Scan Channel Videos</span>
              </button>
            </div>

            {scanResult && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400">Total Videos Scanned</span>
                    <span className="text-xl font-bold text-slate-100 block mt-1">{scanResult.totalVideosScanned}</span>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400">Videos with Retailer Links</span>
                    <span className="text-xl font-bold text-teal-400 block mt-1">{scanResult.videosWithLinks}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-200">Proposed Description Replacements:</span>
                  {scanResult.items.map((item: any) => (
                    <div key={item.videoId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{item.videoTitle}</span>
                        <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                          {item.linksFound.length} links replaced
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                        <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-red-300 whitespace-pre-wrap">
                          {item.originalDescription}
                        </div>
                        <div className="p-3 bg-teal-950/20 border border-teal-900/40 rounded-lg text-teal-300 whitespace-pre-wrap">
                          {item.proposedDescription}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PERSONAL API TOKENS */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Key className="w-5 h-5 text-teal-400" />
                    <span>Personal Access API Tokens</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage scoped tokens to automate smart link generation via the Owner REST API, WordPress plugin, and CLI scripts.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingToken(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create API Token</span>
                </button>
              </div>

              {newlyCreatedToken && (
                <div className="p-4 bg-teal-950/40 border border-teal-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>New Token Created — Copy Now (Will Not Be Shown Again)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-teal-400 overflow-x-auto">
                      {newlyCreatedToken}
                    </code>
                    <button
                      onClick={() => handleCopy(newlyCreatedToken, 'raw-token')}
                      className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
                    >
                      {copiedKey === 'raw-token' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tokens Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Token Name</th>
                      <th className="py-2.5 px-3">Prefix</th>
                      <th className="py-2.5 px-3">Scopes</th>
                      <th className="py-2.5 px-3">Last Used</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tokens.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No personal API tokens created yet.
                        </td>
                      </tr>
                    ) : (
                      tokens.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-medium text-slate-100">{t.name}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{t.tokenPrefix}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {t.scopes.split(',').map((s: string) => (
                                <span key={s} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleRevokeToken(t.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: OPENAPI REFERENCE */}
        {activeTab === 'openapi' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-teal-400" />
                <span>OpenAPI 3.0 Reference</span>
              </h2>
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Raw JSON Spec</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 max-h-96 overflow-y-auto">
{`POST /api/v1/links
Authorization: Bearer mlk_live_xxxxxxxx

{
  "originalUrl": "https://www.amazon.com/dp/B09XS7JWHH",
  "displayName": "Sony WH-1000XM5",
  "slug": "sony-headphones",
  "groupId": "tech-gear"
}`}
            </pre>
          </div>
        )}
      </main>

      {/* CREATE TOKEN MODAL */}
      {isCreatingToken && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100">Create Personal Access Token</h3>
            <form onSubmit={handleCreateToken} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Token Name / Purpose</label>
                <input
                  type="text"
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. WordPress Blog or Chrome Extension"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Scopes</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {['links:read', 'links:write', 'groups:read', 'reports:read', 'health:read', 'youtube:scan', 'youtube:write'].map((scope) => (
                    <label key={scope} className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={tokenScopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTokenScopes([...tokenScopes, scope]);
                          } else {
                            setTokenScopes(tokenScopes.filter((s) => s !== scope));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500"
                      />
                      <span>{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingToken(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold"
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
