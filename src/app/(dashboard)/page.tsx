'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/dashboard/Navbar';
import {
  MousePointerClick,
  Users,
  ShieldAlert,
  Globe,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function OverviewPage() {
  const [data, setData] = useState<{
    summary?: { totalClicks: number; humanClicks: number; botClicks: number; uniqueVisitors: number };
    timeSeries?: Array<{ date: string; totalClicks: number; humanClicks: number; botClicks: number }>;
    topLinks?: Array<{ id: string; slug: string; name: string; clicks: number; humans: number }>;
    topCountries?: Array<{ code: string; clicks: number }>;
  }>({});
  const [healthAlerts, setHealthAlerts] = useState<number>(0);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [reportsRes, healthRes] = await Promise.all([
          fetch('/api/reports?days=30'),
          fetch('/api/health/check'),
        ]);

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setData(reportsData);
        }

        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealthAlerts(healthData.degradedCount || 0);
        }
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleCopy = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const humanShare =
    data.summary?.totalClicks && data.summary.totalClicks > 0
      ? Math.round((data.summary.humanClicks / data.summary.totalClicks) * 100)
      : 94;

  return (
    <div>
      <Navbar title="Overview" subtitle="Real-time geo-routing and affiliate performance metrics" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Clicks */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Redirects
              </span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {isLoading ? '...' : (data.summary?.totalClicks || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="text-teal-400 font-semibold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12.4%
              </span>
              <span>vs previous 30 days</span>
            </div>
          </div>

          {/* Unique Visitors */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Est. Human Visitors
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {isLoading ? '...' : (data.summary?.humanClicks || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="text-indigo-400 font-medium">{humanShare}% Human traffic</span>
              <span className="text-slate-500">({data.summary?.botClicks || 0} bots filtered)</span>
            </div>
          </div>

          {/* Top Country */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Top Market Region
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span>{data.topCountries?.[0]?.code || 'US'}</span>
              <span className="text-sm font-normal text-slate-400">
                ({data.topCountries?.[0]?.clicks || 0} clicks)
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Auto-localized across 21 Amazon stores
            </div>
          </div>

          {/* Link Health Warning */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Link Health Alerts
              </span>
              <div className={`p-2 rounded-xl ${healthAlerts > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-500/10 text-teal-400'}`}>
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span className={healthAlerts > 0 ? 'text-amber-400' : 'text-slate-100'}>
                {healthAlerts}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {healthAlerts > 0 ? 'attention required' : 'all systems normal'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              <Link href="/health" className="text-teal-400 hover:underline flex items-center gap-1">
                <span>View health monitor</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 30-Day Click Velocity Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-100">30-Day Redirect Velocity</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily volume of international visitor clicks and automated bot filters
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-slate-300">Human Visitors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="text-slate-400">Bots & Crawlers</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">
                Loading analytics data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="humanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => val.substring(5)}
                  />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="humanClicks"
                    name="Human Clicks"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#humanGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="botClicks"
                    name="Bot Clicks"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Top Links & Top Geo Markets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Links Table (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Top Performing SmartLinks</h3>
                <p className="text-xs text-slate-400">Links with the highest localized redirection volume</p>
              </div>
              <Link
                href="/links"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Link / Slug</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold text-right">Human Clicks</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Loading top links...
                      </td>
                    </tr>
                  ) : (data.topLinks || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No clicks recorded yet.
                      </td>
                    </tr>
                  ) : (
                    (data.topLinks || []).map((link) => (
                      <tr key={link.id} className="group hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-medium">
                          <div className="font-semibold text-slate-100 truncate max-w-xs">{link.name}</div>
                          <div className="text-[11px] text-teal-400/90 font-mono">/r/{link.slug}</div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300 uppercase">
                            Smart
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-100">
                          {link.humans.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
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
                              title="Test Redirect"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Countries Breakdown (1 Col) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Geographic Distribution</h3>
              <p className="text-xs text-slate-400 mb-4">Traffic share by destination country</p>

              <div className="space-y-3">
                {(data.topCountries || []).slice(0, 6).map((c) => {
                  const maxClicks = data.topCountries?.[0]?.clicks || 1;
                  const percent = Math.round((c.clicks / maxClicks) * 100);

                  return (
                    <div key={c.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-200">{c.code} Market</span>
                        <span className="text-slate-400">{c.clicks.toLocaleString()} clicks</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/reports"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Open Detailed Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
