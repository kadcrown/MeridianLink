'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, ShieldCheck, Sun, Moon, Sparkles, CheckCircle2 } from 'lucide-react';

export interface ChoiceDestination {
  id: string;
  countryCode: string;
  marketplace: string;
  url: string;
  label?: string | null;
  priceString?: string | null;
  flag?: string;
}

export interface ChoicePageProps {
  slug: string;
  title: string;
  imageUrl?: string | null;
  notes?: string | null;
  destinations: ChoiceDestination[];
  affiliateDisclosure?: string;
}

const MARKETPLACE_FLAGS: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', UK: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
  IT: '🇮🇹', ES: '🇪🇸', NL: '🇳🇱', SE: '🇸🇪', PL: '🇵🇱', BE: '🇧🇪',
  JP: '🇯🇵', IN: '🇮🇳', AU: '🇦🇺', BR: '🇧🇷', MX: '🇲🇽', SG: '🇸🇬',
  SA: '🇸🇦', AE: '🇦🇪', TR: '🇹🇷', EG: 'EG',
};

export default function ChoiceViewer({
  slug,
  title,
  imageUrl,
  notes,
  destinations,
  affiliateDisclosure,
}: ChoicePageProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const handleDestinationClick = (dest: ChoiceDestination) => {
    setSelectedId(dest.id);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header bar */}
      <header className="w-full max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            M
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Meridian Choice
          </span>
        </div>

        <button
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'
          }`}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      {/* Main product card */}
      <main className="w-full max-w-xl mx-auto px-4 py-8 pb-16">
        <div
          className={`rounded-2xl border transition-all shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-100'
          } p-6 sm:p-8`}
        >
          {/* Product Image */}
          {imageUrl ? (
            <div className="relative w-full h-56 sm:h-64 mb-6 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center p-4 border border-slate-200/40 dark:border-slate-800/40">
              <img
                src={imageUrl}
                alt={title}
                className="max-h-full max-w-full object-contain filter drop-shadow-md"
              />
            </div>
          ) : (
            <div className="w-full h-32 mb-6 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Sparkles className="w-8 h-8 opacity-40" />
            </div>
          )}

          {/* Product Title */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 leading-snug">
            {title}
          </h1>

          {/* Product Notes */}
          {notes && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {notes}
            </p>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 my-6" />

          {/* Marketplace / Retailer Options */}
          <div className="space-y-3 mb-8">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
              Select Your Preferred Store
            </label>

            {destinations.length === 0 ? (
              <div className="p-4 rounded-xl text-center text-sm text-slate-500 bg-slate-100 dark:bg-slate-800">
                No store options currently available for this product.
              </div>
            ) : (
              destinations.map((dest) => {
                const flag = MARKETPLACE_FLAGS[dest.countryCode.toUpperCase()] || '🌐';
                const label = dest.label || `Amazon ${dest.countryCode.toUpperCase()}`;

                return (
                  <a
                    key={dest.id}
                    href={dest.url}
                    onClick={() => handleDestinationClick(dest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-700 hover:bg-teal-950/40 hover:border-teal-500/60 text-slate-100'
                        : 'bg-slate-50 border-slate-200 hover:bg-teal-50/60 hover:border-teal-400 text-slate-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" role="img" aria-label={dest.countryCode}>
                        {flag}
                      </span>
                      <div>
                        <span className="font-semibold text-sm sm:text-base block group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {label}
                        </span>
                        {dest.priceString && (
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {dest.priceString}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-teal-600/10 text-teal-600 dark:text-teal-400 font-semibold group-hover:bg-teal-600 group-hover:text-white transition-all">
                        Buy Now
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    </div>
                  </a>
                );
              })
            )}
          </div>

          {/* Secure & Verified Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Direct link to official retailer stores with regional localization</span>
          </div>
        </div>

        {/* Affiliate Disclosure (FTC & Amazon compliance) */}
        {affiliateDisclosure && (
          <footer className="mt-8 text-center px-4">
            <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed max-w-md mx-auto">
              {affiliateDisclosure}
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}
