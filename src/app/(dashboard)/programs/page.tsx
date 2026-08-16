'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  ExternalLink,
  Shield,
  Layers,
  Settings2,
  X,
  Key,
} from 'lucide-react';

interface FieldDef {
  id: string;
  key: string;
  label: string;
  placeholder?: string;
  fieldType: string;
  isRequired: boolean;
  isSecret: boolean;
  helpText?: string;
}

interface ProgramItem {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  marketplace?: string | null;
  capabilityLevel: string;
  connectionType: string;
  statusNote?: string | null;
  isDiscontinued?: boolean;
  retailer: {
    name: string;
    slug: string;
    websiteUrl: string;
  };
  network: {
    name: string;
    slug: string;
  };
  fieldDefinitions: FieldDef[];
  connections: Array<{
    id: string;
    connectionStatus: string;
    configValuesJson: string;
    secrets: Array<{ id: string; key: string; maskedSuffix: string }>;
  }>;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [networks, setNetworks] = useState<Array<{ slug: string; name: string }>>([]);
  const [retailers, setRetailers] = useState<Array<{ slug: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedCapability, setSelectedCapability] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Connection Modal
  const [activeModalProgram, setActiveModalProgram] = useState<ProgramItem | null>(null);
  const [formPublicValues, setFormPublicValues] = useState<Record<string, string>>({});
  const [formSecretValues, setFormSecretValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadPrograms = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedNetwork) params.set('network', selectedNetwork);
      if (selectedRetailer) params.set('retailer', selectedRetailer);
      if (selectedCapability) params.set('capability', selectedCapability);

      const res = await fetch(`/api/programs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
        setNetworks(data.networks || []);
        setRetailers(data.retailers || []);
      }
    } catch (err) {
      console.error('Failed to load affiliate programs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, [search, selectedNetwork, selectedRetailer, selectedCapability]);

  const handleOpenConnectModal = (p: ProgramItem) => {
    setActiveModalProgram(p);
    setFormPublicValues({});
    setFormSecretValues({});
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalProgram) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: activeModalProgram.id,
          publicValues: formPublicValues,
          secretValues: formSecretValues,
        }),
      });

      if (res.ok) {
        setActiveModalProgram(null);
        await loadPrograms();
      } else {
        alert('Failed to save connection');
      }
    } catch {
      alert('Error saving program connection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Navbar title="Affiliate Programs" subtitle="Multi-retailer affiliate networks and program catalog" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs, retailers..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Network Filter */}
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Networks</option>
              {networks.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {n.name}
                </option>
              ))}
            </select>

            {/* Capability Filter */}
            <select
              value={selectedCapability}
              onChange={(e) => setSelectedCapability(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Capabilities</option>
              <option value="PRODUCT_CATALOG_API">Product Catalog API</option>
              <option value="TRACKING_URL_TEMPLATE">Tracking URL Template</option>
              <option value="IDENTIFIER_ONLY">Identifier Only</option>
              <option value="MANUAL_ONLY">Manual Only</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-medium shrink-0">
            Showing {programs.length} affiliate programs
          </div>
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
              Loading affiliate program catalog...
            </div>
          ) : programs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-3">
              <p>No affiliate programs match your filter criteria.</p>
              {(search || selectedNetwork || selectedCapability) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedNetwork('');
                    setSelectedCapability('');
                  }}
                  className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-semibold transition"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            programs.map((p) => {
              const isConnected = p.connections && p.connections.length > 0;

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                          {p.network.name}
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">{p.name}</h3>
                        <span className="text-xs text-slate-400 block">{p.retailer.name}</span>
                      </div>

                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Configured
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full shrink-0">
                          Unconfigured
                        </span>
                      )}
                    </div>

                    {p.statusNote && (
                      <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
                        {p.statusNote}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono">{p.capabilityLevel}</span>
                      <span>•</span>
                      <span>{p.countryCode}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <a
                      href={p.retailer.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Store</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleOpenConnectModal(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{isConnected ? 'Edit Connection' : 'Connect'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* METADATA-DRIVEN CONNECTION MODAL */}
      {activeModalProgram && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Connect {activeModalProgram.name}
                </h3>
                <span className="text-xs text-slate-400">{activeModalProgram.network.name}</span>
              </div>
              <button
                onClick={() => setActiveModalProgram(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4">
              {activeModalProgram.fieldDefinitions.map((field) => {
                const isSecret = field.isSecret || field.fieldType === 'SECRET';

                return (
                  <div key={field.id}>
                    <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {field.label} {field.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    {isSecret ? (
                      <input
                        type="password"
                        required={field.isRequired}
                        placeholder="••••••••••••"
                        value={formSecretValues[field.key] || ''}
                        onChange={(e) =>
                          setFormSecretValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <input
                        type="text"
                        required={field.isRequired}
                        placeholder={field.placeholder || ''}
                        value={formPublicValues[field.key] || ''}
                        onChange={(e) =>
                          setFormPublicValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    )}
                    {field.helpText && <span className="text-[11px] text-slate-500 block mt-1">{field.helpText}</span>}
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalProgram(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Connection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
