'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Globe2,
  Activity,
  CheckCircle2,
  X,
  ExternalLink,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  title?: string;
  subtitle?: string;
  onOpenCreate?: () => void;
}

export default function Navbar({ title = 'Overview', subtitle, onOpenCreate }: NavbarProps) {
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);
  const [simCountry, setSimCountry] = useState('CA');
  const [simSlug, setSimSlug] = useState('sony-xm5');
  const [simResult, setSimResult] = useState<{ targetUrl: string; marketplace: string; tag: string } | null>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const c = simCountry.toUpperCase();
    let domain = 'www.amazon.com';
    let tag = 'meridian-20';

    if (c === 'CA') {
      domain = 'www.amazon.ca';
      tag = 'kgold0c-20';
    } else if (c === 'GB' || c === 'UK') {
      domain = 'www.amazon.co.uk';
      tag = 'meridiantech-uk-21';
    } else if (c === 'DE') {
      domain = 'www.amazon.de';
      tag = 'meridian-de-21';
    } else if (c === 'FR') {
      domain = 'www.amazon.fr';
      tag = 'meridian-fr-21';
    } else if (c === 'JP') {
      domain = 'www.amazon.co.jp';
      tag = 'meridian-jp-22';
    } else if (c === 'AU') {
      domain = 'www.amazon.com.au';
      tag = 'meridian-au-22';
    }

    setSimResult({
      targetUrl: `https://${domain}/dp/B09XS7JWHH?tag=${tag}&utm_source=youtube`,
      marketplace: c,
      tag,
    });
  };

  return (
    <>
      <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Interactive Geo-Engine Status Button */}
          <button
            type="button"
            onClick={() => setIsGeoModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
            title="Click to view Geo-Engine diagnostics & routing simulator"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Geo-Engine Active</span>
          </button>

          {/* Global Marketplaces badge */}
          <Link
            href="/affiliates"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <span>21 Store Tags</span>
          </Link>

          {/* Create SmartLink button */}
          {onOpenCreate ? (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <Plus className="w-4 h-4" />
              <span>Create Link</span>
            </button>
          ) : (
            <Link
              href="/links?create=true"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <Plus className="w-4 h-4" />
              <span>Create Link</span>
            </Link>
          )}
        </div>
      </header>

      {/* GEO-ENGINE DIAGNOSTICS & SIMULATOR MODAL */}
      {isGeoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">
                  Geo-Engine Diagnostics &amp; Live Simulator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGeoModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Resolution Latency</span>
                <span className="text-sm font-bold text-teal-400 mt-0.5 block">&lt; 1.2 ms (Zero Edge Lag)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Header Fallbacks</span>
                <span className="text-xs font-mono text-slate-300 mt-0.5 block">CF &gt; Vercel &gt; MaxMind</span>
              </div>
            </div>

            {/* Live Routing Simulator */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-teal-400" />
                <span>Live Route Simulator</span>
              </span>
              <p className="text-slate-400 text-[11px]">
                Simulate how a visitor from any country is localized and which regional affiliate tag is applied.
              </p>

              <form onSubmit={handleSimulate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Simulate Country Code</label>
                    <select
                      value={simCountry}
                      onChange={(e) => setSimCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="US">US — United States</option>
                      <option value="CA">CA — Canada</option>
                      <option value="GB">GB — United Kingdom</option>
                      <option value="DE">DE — Germany</option>
                      <option value="FR">FR — France</option>
                      <option value="JP">JP — Japan</option>
                      <option value="AU">AU — Australia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Smart Link</label>
                    <select
                      value={simSlug}
                      onChange={(e) => setSimSlug(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                    >
                      <option value="sony-xm5">/r/sony-xm5</option>
                      <option value="desk-pro">/r/desk-pro</option>
                      <option value="fellow-kettle">/r/fellow-kettle</option>
                      <option value="macbook-air">/r/macbook-air</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Simulate Routing Decision</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {simResult && (
                <div className="p-3 bg-slate-950 border border-teal-500/40 rounded-xl space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Marketplace:</span>
                    <span className="text-teal-400 font-bold">{simResult.marketplace}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Applied Partner Tag:</span>
                    <span className="text-teal-400 font-bold">{simResult.tag}</span>
                  </div>
                  <div className="pt-1 text-slate-300 break-all">
                    <span className="text-slate-500 block">Final Destination:</span>
                    <a href={simResult.targetUrl} target="_blank" rel="noreferrer" className="text-teal-300 hover:underline flex items-center gap-1">
                      <span>{simResult.targetUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px]">
              <Link
                href="/affiliates"
                onClick={() => setIsGeoModalOpen(false)}
                className="text-teal-400 hover:underline"
              >
                Configure 21 Amazon Tags &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setIsGeoModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
