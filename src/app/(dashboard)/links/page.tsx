'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  Search,
  Plus,
  Filter,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Globe,
  Split,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Info,
} from 'lucide-react';

interface SmartLinkItem {
  id: string;
  slug: string;
  displayName: string;
  originalUrl: string;
  linkType: 'SMART' | 'CHOICE' | 'AB_TEST';
  asin?: string | null;
  productTitle?: string | null;
  productImageUrl?: string | null;
  notes?: string | null;
  defaultMarketplace: string;
  isActive: boolean;
  isArchived: boolean;
  groupId?: string | null;
  group?: { id: string; name: string; color: string } | null;
  destinations: Array<{
    id: string;
    countryCode: string;
    marketplace: string;
    url: string;
    label?: string | null;
    isManual: boolean;
    isVerified: boolean;
    lastHealthStatus?: number | null;
  }>;
  abVariants: Array<{
    id: string;
    name: string;
    destinationUrl: string;
    weight: number;
    isActive: boolean;
  }>;
  _count?: {
    clickEvents: number;
    healthChecks: number;
  };
  createdAt: string;
}

interface GroupOption {
  id: string;
  name: string;
  color: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<SmartLinkItem[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedType, setSelectedType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SmartLinkItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Create Form State
  const [rawUrlInput, setRawUrlInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);

  const [formSlug, setFormSlug] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formOriginalUrl, setFormOriginalUrl] = useState('');
  const [formLinkType, setFormLinkType] = useState<'SMART' | 'CHOICE' | 'AB_TEST'>('SMART');
  const [formAsin, setFormAsin] = useState('');
  const [formProductTitle, setFormProductTitle] = useState('');
  const [formProductImageUrl, setFormProductImageUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDefaultMarketplace, setFormDefaultMarketplace] = useState('US');
  const [formGroupId, setFormGroupId] = useState('');
  const [formUtmSource, setFormUtmSource] = useState('');
  const [formUtmMedium, setFormUtmMedium] = useState('');
  const [formUtmCampaign, setFormUtmCampaign] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destination Overrides
  const [formDestinations, setFormDestinations] = useState<
    Array<{ countryCode: string; marketplace: string; url: string; label: string; priceString: string }>
  >([]);

  // A/B Variants
  const [formAbVariants, setFormAbVariants] = useState<
    Array<{ name: string; destinationUrl: string; marketplace: string; weight: number }>
  >([
    { name: 'Variant A', destinationUrl: '', marketplace: 'US', weight: 50 },
    { name: 'Variant B', destinationUrl: '', marketplace: 'US', weight: 50 },
  ]);

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedGroup) params.set('groupId', selectedGroup);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedType) params.set('type', selectedType);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/links?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load links', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedGroup, selectedStatus, selectedType, page]);

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCopy = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // URL Ingest parser handler
  const handleIngestUrl = async () => {
    if (!rawUrlInput.trim()) return;
    setIsIngesting(true);
    setIngestError(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIngestError(data.error || 'Failed to ingest URL');
        setIsIngesting(false);
        return;
      }

      const info = data.data;
      setFormOriginalUrl(info.normalizedUrl || rawUrlInput);
      setFormSlug(info.suggestedSlug || '');
      setFormDisplayName(info.suggestedTitle || `Amazon Item (${info.asin || 'SmartLink'})`);
      setFormAsin(info.asin || '');
      setFormProductTitle(info.suggestedTitle || '');
      setFormDefaultMarketplace(info.marketplaceId || 'US');
      if (info.preservedUtm) {
        if (info.preservedUtm.source) setFormUtmSource(info.preservedUtm.source);
        if (info.preservedUtm.medium) setFormUtmMedium(info.preservedUtm.medium);
        if (info.preservedUtm.campaign) setFormUtmCampaign(info.preservedUtm.campaign);
      }
    } catch {
      setIngestError('Network error parsing Amazon URL');
    } finally {
      setIsIngesting(false);
    }
  };

  const resetForm = () => {
    setRawUrlInput('');
    setIngestError(null);
    setFormSlug('');
    setFormDisplayName('');
    setFormOriginalUrl('');
    setFormLinkType('SMART');
    setFormAsin('');
    setFormProductTitle('');
    setFormProductImageUrl('');
    setFormNotes('');
    setFormDefaultMarketplace('US');
    setFormGroupId('');
    setFormUtmSource('');
    setFormUtmMedium('');
    setFormUtmCampaign('');
    setFormDestinations([]);
    setFormAbVariants([
      { name: 'Variant A', destinationUrl: '', marketplace: 'US', weight: 50 },
      { name: 'Variant B', destinationUrl: '', marketplace: 'US', weight: 50 },
    ]);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        slug: formSlug || undefined,
        displayName: formDisplayName,
        originalUrl: formOriginalUrl,
        linkType: formLinkType,
        asin: formAsin || null,
        productTitle: formProductTitle || null,
        productImageUrl: formProductImageUrl || null,
        notes: formNotes || null,
        defaultMarketplace: formDefaultMarketplace,
        groupId: formGroupId || null,
        utmSource: formUtmSource || null,
        utmMedium: formUtmMedium || null,
        utmCampaign: formUtmCampaign || null,
        destinations: formDestinations.length > 0 ? formDestinations : undefined,
        abVariants: formLinkType === 'AB_TEST' ? formAbVariants : undefined,
      };

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        resetForm();
        loadLinks();
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to create link');
      }
    } catch {
      alert('Error creating link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOpen = (link: SmartLinkItem) => {
    setEditingLink(link);
    setFormSlug(link.slug);
    setFormDisplayName(link.displayName);
    setFormOriginalUrl(link.originalUrl);
    setFormLinkType(link.linkType);
    setFormAsin(link.asin || '');
    setFormProductTitle(link.productTitle || '');
    setFormProductImageUrl(link.productImageUrl || '');
    setFormNotes(link.notes || '');
    setFormDefaultMarketplace(link.defaultMarketplace);
    setFormGroupId(link.groupId || '');
    setFormDestinations(
      link.destinations.map((d) => ({
        countryCode: d.countryCode,
        marketplace: d.marketplace,
        url: d.url,
        label: d.label || '',
        priceString: '',
      }))
    );
    if (link.abVariants.length > 0) {
      setFormAbVariants(
        link.abVariants.map((v) => ({
          name: v.name,
          destinationUrl: v.destinationUrl,
          marketplace: 'US',
          weight: v.weight,
        }))
      );
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setIsSubmitting(true);

    try {
      const payload = {
        slug: formSlug,
        displayName: formDisplayName,
        originalUrl: formOriginalUrl,
        linkType: formLinkType,
        asin: formAsin || null,
        productTitle: formProductTitle || null,
        productImageUrl: formProductImageUrl || null,
        notes: formNotes || null,
        defaultMarketplace: formDefaultMarketplace,
        groupId: formGroupId || null,
        destinations: formDestinations,
        abVariants: formLinkType === 'AB_TEST' ? formAbVariants : undefined,
      };

      const res = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingLink(null);
        resetForm();
        loadLinks();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update link');
      }
    } catch {
      alert('Error updating link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async (link: SmartLinkItem) => {
    try {
      await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !link.isArchived }),
      });
      loadLinks();
    } catch {
      alert('Failed to update archive status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this SmartLink?')) return;
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadLinks();
      }
    } catch {
      alert('Failed to delete link');
    }
  };

  const addDestinationRow = () => {
    setFormDestinations((prev) => [
      ...prev,
      { countryCode: 'CA', marketplace: 'CA', url: '', label: '', priceString: '' },
    ]);
  };

  const removeDestinationRow = (index: number) => {
    setFormDestinations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Navbar
        title="Links"
        subtitle={`${totalCount} smart links configured`}
        onOpenCreate={() => {
          resetForm();
          setIsCreateModalOpen(true);
        }}
      />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, ASIN, slug..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Link Types</option>
              <option value="SMART">Smart Geo-Link</option>
              <option value="CHOICE">Choice Page</option>
              <option value="AB_TEST">A/B Split-Test</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="active">Active Links</option>
              <option value="archived">Archived</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Links Table Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                  <th className="py-3.5 px-4 font-semibold">Product & Slug</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Group</th>
                  <th className="py-3.5 px-4 font-semibold">ASIN</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Destinations</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Clicks</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                      Loading smart links...
                    </td>
                  </tr>
                ) : links.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30 text-teal-400" />
                      No links matching your filter.
                    </td>
                  </tr>
                ) : (
                  links.map((link) => {
                    const isChoice = link.linkType === 'CHOICE';
                    const isAb = link.linkType === 'AB_TEST';

                    return (
                      <tr key={link.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {link.productImageUrl ? (
                              <img
                                src={link.productImageUrl}
                                alt={link.displayName}
                                className="w-8 h-8 rounded-lg object-contain bg-white/5 p-0.5 border border-slate-800 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 font-bold text-xs">
                                {link.displayName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-100 truncate max-w-xs sm:max-w-sm">
                                {link.displayName}
                              </div>
                              <div className="text-[11px] text-teal-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>/r/{link.slug}</span>
                                {link.isArchived && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 ml-1">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isChoice ? (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <Layers className="w-3 h-3" />
                              Choice
                            </span>
                          ) : isAb ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <Split className="w-3 h-3" />
                              A/B Test
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-semibold flex items-center gap-1 w-max">
                              <Globe className="w-3 h-3" />
                              Smart Geo
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {link.group ? (
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${link.group.color}15`,
                                color: link.group.color,
                                border: `1px solid ${link.group.color}30`,
                              }}
                            >
                              {link.group.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                          {link.asin || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs font-semibold text-slate-300">
                            {isAb ? `${link.abVariants.length} variants` : `${link.destinations.length} overrides`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                          {(link._count?.clickEvents || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopy(link.slug)}
                              title="Copy Short Link"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedSlug === link.slug ? (
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={`/r/${link.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Test Server Redirect"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleEditOpen(link)}
                              title="Edit Link"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchiveToggle(link)}
                              title={link.isArchived ? 'Restore Link' : 'Archive Link'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {link.isArchived ? (
                                <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(link.id)}
                              title="Delete Permanently"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page {page} of {totalPages} ({totalCount} links)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE SMARTLINK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Create Amazon SmartLink</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Step 1: Ingest URL Input */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <label className="block font-bold uppercase tracking-wider text-slate-300">
                  1. Paste Amazon Product URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={rawUrlInput}
                    onChange={(e) => setRawUrlInput(e.target.value)}
                    placeholder="https://www.amazon.com/dp/B09XS7JWHH or https://amzn.to/..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    disabled={isIngesting || !rawUrlInput.trim()}
                    onClick={handleIngestUrl}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    {isIngesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Parse & Ingest</span>
                  </button>
                </div>
                {ingestError && (
                  <p className="text-red-400 flex items-center gap-1 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{ingestError}</span>
                  </p>
                )}
              </div>

              {/* Step 2: Parsed Details & Customization */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Link Slug (Unique URL path) *
                    </label>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
                      <span className="text-slate-500 font-mono mr-1">/r/</span>
                      <input
                        type="text"
                        required
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        placeholder="sony-xm5"
                        className="w-full bg-transparent text-teal-400 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Link Routing Type
                    </label>
                    <select
                      value={formLinkType}
                      onChange={(e) => setFormLinkType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="SMART">Smart Geo-Router (Direct Amazon localization)</option>
                      <option value="CHOICE">Choice Page (Public multi-retailer landing)</option>
                      <option value="AB_TEST">A/B Split-Test (Weighted distribution)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="Sony WH-1000XM5 Wireless Headphones"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Extracted ASIN
                    </label>
                    <input
                      type="text"
                      value={formAsin}
                      onChange={(e) => setFormAsin(e.target.value)}
                      placeholder="B09XS7JWHH"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Assign Link Group
                    </label>
                    <select
                      value={formGroupId}
                      onChange={(e) => setFormGroupId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">No Group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formProductImageUrl}
                    onChange={(e) => setFormProductImageUrl(e.target.value)}
                    placeholder="https://m.media-amazon.com/images/I/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Internal Notes / Video Description
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Featured in latest desk setup setup guide"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Regional Destination Overrides */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-slate-300 block">
                        Manual Regional Overrides (Optional)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Override auto ASIN-transfer for specific country stores
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addDestinationRow}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Override</span>
                    </button>
                  </div>

                  {formDestinations.map((dest, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        maxLength={2}
                        value={dest.countryCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setFormDestinations((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, countryCode: val, marketplace: val } : d))
                          );
                        }}
                        placeholder="CA"
                        className="w-12 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center font-bold text-slate-100 uppercase"
                      />
                      <input
                        type="url"
                        required
                        value={dest.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormDestinations((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, url: val } : d))
                          );
                        }}
                        placeholder="https://amazon.ca/dp/..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeDestinationRow(idx)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formDisplayName || !formOriginalUrl}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-teal-950/40"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save SmartLink</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SMARTLINK MODAL */}
      {isEditModalOpen && editingLink && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Edit SmartLink ({editingLink.slug})</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Link Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-teal-400 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Group
                  </label>
                  <select
                    value={formGroupId}
                    onChange={(e) => setFormGroupId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="">No Group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Primary Destination URL
                </label>
                <input
                  type="url"
                  required
                  value={formOriginalUrl}
                  onChange={(e) => setFormOriginalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    ASIN
                  </label>
                  <input
                    type="text"
                    value={formAsin}
                    onChange={(e) => setFormAsin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formProductImageUrl}
                    onChange={(e) => setFormProductImageUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
