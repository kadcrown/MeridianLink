'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  Globe2,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface MarketplaceTag {
  id: string;
  name: string;
  domain: string;
  currency: string;
  flag: string;
  tagSuffix: string;
  tag: string;
  isValid: boolean;
  validationError?: string;
}

export default function AffiliatesPage() {
  const [marketplaces, setMarketplaces] = useState<MarketplaceTag[]>([]);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadAffiliates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/affiliates');
      if (res.ok) {
        const data = await res.json();
        const list: MarketplaceTag[] = data.marketplaces || [];
        setMarketplaces(list);

        const initialTags: Record<string, string> = {};
        for (const item of list) {
          initialTags[item.id] = item.tag;
        }
        setTagInputs(initialTags);
      }
    } catch (err) {
      console.error('Failed to load affiliate tags', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliates();
  }, []);

  const handleTagChange = (marketplaceId: string, value: string) => {
    setTagInputs((prev) => ({ ...prev, [marketplaceId]: value }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/affiliates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: tagInputs }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        loadAffiliates();
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save tracking tags');
      }
    } catch {
      alert('Error saving affiliate tags');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Navbar title="Affiliate Tracking IDs" subtitle="Configure your regional Amazon Associates tracking tags across 21 stores" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Info Header Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Global Amazon Affiliate Accounts</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                When visitors click your smart links, MeridianLink automatically injects the appropriate regional tracking ID
                for their country. Leave empty for marketplaces you do not participate in.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-teal-950/40 transition-all shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savedSuccess ? 'All Changes Saved' : 'Save All Tags'}</span>
          </button>
        </div>

        {/* Marketplaces Matrix Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                  <th className="py-3.5 px-4 font-semibold">Store / Country</th>
                  <th className="py-3.5 px-4 font-semibold">Amazon Domain</th>
                  <th className="py-3.5 px-4 font-semibold">Currency</th>
                  <th className="py-3.5 px-4 font-semibold">Standard Suffix</th>
                  <th className="py-3.5 px-4 font-semibold w-72">Your Associate Tracking ID</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                      Loading marketplace configuration...
                    </td>
                  </tr>
                ) : (
                  marketplaces.map((mp) => {
                    const currentVal = tagInputs[mp.id] || '';
                    const isConfigured = !!currentVal.trim();

                    return (
                      <tr key={mp.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl" role="img" aria-label={mp.name}>
                              {mp.flag}
                            </span>
                            <span className="text-slate-100">{mp.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {mp.domain}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {mp.currency}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {mp.tagSuffix}
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleTagChange(mp.id, e.target.value)}
                            placeholder={`e.g. mytag${mp.tagSuffix}`}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-800/40 px-2.5 py-0.5 rounded-full">
                              Unset
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
