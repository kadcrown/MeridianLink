'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Link2,
  FolderTree,
  DollarSign,
  BarChart3,
  Puzzle,
  Settings,
  Activity,
  LogOut,
  Tag,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Links', href: '/links', icon: Link2 },
  { label: 'Groups', href: '/groups', icon: FolderTree },
  { label: 'Affiliate Programs', href: '/programs', icon: DollarSign },
  { label: 'Amazon Store Tags', href: '/affiliates', icon: Tag },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Integrations', href: '/integrations', icon: Puzzle },
  { label: 'Link Health', href: '/health', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-black text-sm shadow-inner">
            M
          </div>
          <div>
            <span className="font-bold text-sm text-slate-100 tracking-tight block">MeridianLink</span>
            <span className="text-[10px] font-medium text-teal-400 block -mt-0.5">Multi-Retailer Platform</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account & Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <div className="text-[11px] font-medium text-slate-300">Single Owner</div>
          </div>
          <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20 font-semibold">
            Active
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
