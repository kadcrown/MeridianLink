'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  Settings,
  Globe,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  HelpCircle,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  Cpu,
  Key,
  Edit3,
  X,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [retentionDays, setRetentionDays] = useState(90);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Creators API Diagnostics & Credential Management state
  const [creatorsStatus, setCreatorsStatus] = useState<any | null>(null);
  const [isTestingCreators, setIsTestingCreators] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCredentialId, setInputCredentialId] = useState('');
  const [inputCredentialSecret, setInputCredentialSecret] = useState('');
  const [inputVersion, setInputVersion] = useState('3.1');
  const [inputDefaultMarketplace, setInputDefaultMarketplace] = useState('US');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const loadSettings = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.baseUrl) setBaseUrl(data.baseUrl);
        if (data.retentionDays) setRetentionDays(data.retentionDays);
      })
      .catch(console.error);

    fetch('/api/settings/creators-api')
      .then((res) => res.json())
      .then((data) => {
        setCreatorsStatus(data);
        if (data.credentialId) setInputCredentialId(data.credentialId);
        if (data.credentialVersion) setInputVersion(data.credentialVersion);
        if (data.defaultMarketplace) setInputDefaultMarketplace(data.defaultMarketplace);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, retentionDays }),
      });

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestCreatorsApi = async () => {
    setIsTestingCreators(true);
    try {
      const res = await fetch('/api/settings/creators-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data.testResult);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingCreators(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCredentials(true);
    try {
      const res = await fetch('/api/settings/creators-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE',
          credentialId: inputCredentialId,
          credentialSecret: inputCredentialSecret,
          credentialVersion: inputVersion,
          defaultMarketplace: inputDefaultMarketplace,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setInputCredentialSecret('');
        loadSettings();
        // Automatically run connection test after saving
        handleTestCreatorsApi();
      } else {
        alert('Failed to save Amazon Creators API credentials.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving credentials.');
    } finally {
      setIsSavingCredentials(false);
    }
  };

  return (
    <div>
      <Navbar title="Platform Settings" subtitle="Routing configuration, Amazon Creators API diagnostics & privacy controls" />

      <main className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
        {/* AMAZON CREATORS API DIAGNOSTICS & CREDENTIALS CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400" />
                <span>Amazon Creators API Connection &amp; Diagnostics</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official OAuth 2.0 Client Credentials adapter replacing deprecated PA-API 5.0.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{creatorsStatus?.isConfigured ? 'Edit Credentials' : 'Configure Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestCreatorsApi}
                disabled={isTestingCreators}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isTestingCreators ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {creatorsStatus && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Credential Status</span>
                <span className={`text-sm font-bold mt-1 inline-flex items-center gap-1.5 ${creatorsStatus.isConfigured ? 'text-teal-400' : 'text-amber-400'}`}>
                  {creatorsStatus.isConfigured ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {creatorsStatus.isConfigured ? 'Active & Stored' : 'Credentials Missing'}
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Masked Credential ID</span>
                <span className="text-sm font-mono text-slate-200 mt-1 block">
                  {creatorsStatus.maskedId || 'Unset'}
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Credential Version</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  v{creatorsStatus.credentialVersion} (OAuth 2.0)
                </span>
              </div>
            </div>
          )}

          {/* Test result message */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs ${testResult.authSuccess ? 'bg-teal-950/40 border-teal-500/40 text-teal-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
              <div className="font-bold flex items-center gap-2">
                {testResult.authSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>Status: {testResult.state}</span>
              </div>
              <p className="mt-1 text-slate-300">{testResult.message}</p>
            </div>
          )}

          {/* Legacy PA-API Migration Checklist */}
          {creatorsStatus?.legacyAudit && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-200 block">Official Creators API Migration Status</span>
              <div className="space-y-2">
                {creatorsStatus.legacyAudit.migrationChecklist.map((item: any) => (
                  <div key={item.item} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-200">{item.item}: </span>
                      <span className="text-slate-400">{item.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GENERAL PLATFORM FORM */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-400" />
              <span>Base Short-Link Domain</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure the primary base URL used to generate short redirect links. When deploying behind a custom domain or reverse proxy, update this value to match your public hostname.
            </p>
            <div className="max-w-md">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Public Base URL
              </label>
              <input
                type="url"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://links.mybrand.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              <span>Privacy &amp; Data Retention Policy</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              MeridianLink stores raw click events only temporarily for diagnostic deduplication. Aggregated rollups (country, marketplace, device category) are retained indefinitely with zero visitor PII.
            </p>
            <div className="max-w-xs">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Raw Log Retention (Days)
              </label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days (Recommended)</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {isSaved && (
              <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings Saved Successfully
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </main>

      {/* EDIT CREATORS API CREDENTIALS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Configure Amazon Creators API Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Enter your OAuth 2.0 client credentials from Amazon Associates Central. Credentials are encrypted at rest with AES-256-GCM.
            </p>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Credential ID (Client ID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="amzn1.oa2-cs.v1.xxxx"
                  value={inputCredentialId}
                  onChange={(e) => setInputCredentialId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Credential Secret (Client Secret) {creatorsStatus?.hasSecret ? '(Leave blank to keep existing)' : <span className="text-red-400">*</span>}
                </label>
                <input
                  type="password"
                  required={!creatorsStatus?.hasSecret}
                  placeholder={creatorsStatus?.hasSecret ? '••••••••••••••••' : 'amzn1.oa2-cs.v1.yyyy'}
                  value={inputCredentialSecret}
                  onChange={(e) => setInputCredentialSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Credential Version
                  </label>
                  <select
                    value={inputVersion}
                    onChange={(e) => setInputVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="3.1">v3.1 (North America: US, CA, MX, BR)</option>
                    <option value="3.2">v3.2 (Europe &amp; Middle East: UK, DE, FR, TR, etc.)</option>
                    <option value="3.3">v3.3 (Far East: JP, AU, SG, IN)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Default Marketplace
                  </label>
                  <input
                    type="text"
                    value={inputDefaultMarketplace}
                    onChange={(e) => setInputDefaultMarketplace(e.target.value.toUpperCase())}
                    placeholder="US"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCredentials}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isSavingCredentials ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save &amp; Test Live</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
