'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Tags,
  Link2,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface GroupItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  isArchived: boolean;
  tagOverrides: Array<{
    id: string;
    marketplace: string;
    tag: string;
  }>;
  _count?: {
    links: number;
  };
}

const PRESET_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#0d9488');
  const [formOverrides, setFormOverrides] = useState<Array<{ marketplace: string; tag: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setFormName('');
    setFormDescription('');
    setFormColor('#0d9488');
    setFormOverrides([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: GroupItem) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormDescription(group.description || '');
    setFormColor(group.color);
    setFormOverrides(group.tagOverrides.map((t) => ({ marketplace: t.marketplace, tag: t.tag })));
    setIsModalOpen(true);
  };

  const handleAddOverride = () => {
    setFormOverrides((prev) => [...prev, { marketplace: 'GB', tag: '' }]);
  };

  const handleRemoveOverride = (idx: number) => {
    setFormOverrides((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        id: editingGroup?.id,
        name: formName,
        description: formDescription || null,
        color: formColor,
        tagOverrides: formOverrides.filter((o) => o.tag.trim()),
      };

      const res = await fetch('/api/groups', {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadGroups();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save group');
      }
    } catch {
      alert('Error saving group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? (Smart links in this group will be unassigned)')) return;
    try {
      const res = await fetch(`/api/groups?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadGroups();
      }
    } catch {
      alert('Failed to delete group');
    }
  };

  return (
    <div>
      <Navbar title="Link Groups" subtitle="Organize smart links and configure group-level affiliate tag overrides" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Configured Workspace Groups</h2>
            <p className="text-xs text-slate-400">
              Apply dedicated tracking tags to specific categories of products
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30 text-teal-400" />
              No groups created yet. Click "New Group" to get started.
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700/80 transition-colors"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="font-bold text-sm text-slate-100">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(group)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}

                  {/* Tag Overrides List */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Regional Tag Overrides
                    </span>
                    {group.tagOverrides.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Using account default tracking tags</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {group.tagOverrides.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-400"
                          >
                            {t.marketplace}: {t.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Count */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{group._count?.links || 0} links in group</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">slug: {group.slug}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* CREATE / EDIT GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-sm font-bold text-slate-100">
                {editingGroup ? 'Edit Link Group' : 'Create Link Group'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Audio Gear, Coffee, Desk Setup"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description of this product collection..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Badge Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${formColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Tag Overrides */}
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-400">
                    Group Affiliate Tag Overrides
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOverride}
                    className="text-teal-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Override
                  </button>
                </div>

                {formOverrides.map((ov, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      maxLength={2}
                      value={ov.marketplace}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormOverrides((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, marketplace: val } : o))
                        );
                      }}
                      placeholder="GB"
                      className="w-12 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-bold uppercase text-slate-100"
                    />
                    <input
                      type="text"
                      required
                      value={ov.tag}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormOverrides((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, tag: val } : o))
                        );
                      }}
                      placeholder="grouptag-21"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOverride(idx)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formName.trim()}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
