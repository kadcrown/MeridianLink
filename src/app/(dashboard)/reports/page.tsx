'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  Download,
  Calendar,
  Filter,
  BarChart3,
  Globe,
  Smartphone,
  Laptop,
  PieChart as PieIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface ReportsData {
  summary?: {
    totalClicks: number;
    humanClicks: number;
    botClicks: number;
    uniqueVisitors: number;
  };
  timeSeries?: Array<{ date: string; totalClicks: number; humanClicks: number; botClicks: number }>;
  topLinks?: Array<{ id: string; slug: string; name: string; clicks: number; humans: number }>;
  topCountries?: Array<{ code: string; clicks: number }>;
  topMarketplaces?: Array<{ marketplace: string; clicks: number }>;
  deviceBreakdown?: Array<{ device: string; clicks: number }>;
  osBreakdown?: Array<{ os: string; clicks: number }>;
  browserBreakdown?: Array<{ browser: string; clicks: number }>;
}

const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#64748b'];

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData>({});
  const [days, setDays] = useState('30');
  const [selectedLink, setSelectedLink] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [linksList, setLinksList] = useState<Array<{ id: string; displayName: string }>>([]);
  const [groupsList, setGroupsList] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('days', days);
      if (selectedLink) params.set('linkId', selectedLink);
      if (selectedGroup) params.set('groupId', selectedGroup);
      if (selectedCountry) params.set('country', selectedCountry);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [linksRes, groupsRes] = await Promise.all([
        fetch('/api/links?limit=100'),
        fetch('/api/groups'),
      ]);
      if (linksRes.ok) {
        const lData = await linksRes.json();
        setLinksList(lData.links || []);
      }
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        setGroupsList(gData.groups || []);
      }
    } catch (err) {
      console.error('Failed to load filters', err);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadReports();
  }, [days, selectedLink, selectedGroup, selectedCountry]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    params.set('days', days);
    params.set('format', 'csv');
    if (selectedLink) params.set('linkId', selectedLink);
    if (selectedGroup) params.set('groupId', selectedGroup);
    if (selectedCountry) params.set('country', selectedCountry);

    window.open(`/api/reports?${params.toString()}`, '_blank');
  };

  return (
    <div>
      <Navbar title="Analytics & Reports" subtitle="Detailed performance breakdown and attribution metrics" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Days selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setDays('7')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${days === '7' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDays('30')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${days === '30' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDays('90')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${days === '90' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                90 Days
              </button>
            </div>

            {/* Filter by Link */}
            <select
              value={selectedLink}
              onChange={(e) => setSelectedLink(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All SmartLinks</option>
              {linksList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.displayName}
                </option>
              ))}
            </select>

            {/* Filter by Group */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Groups</option>
              {groupsList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Filter by Country */}
            <input
              type="text"
              maxLength={2}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value.toUpperCase())}
              placeholder="Country (e.g. US, GB)"
              className="w-36 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
            />
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Clicks</span>
            <div className="text-xl font-bold text-slate-100 mt-1">
              {(data.summary?.totalClicks || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold uppercase text-teal-400">Human Visitors</span>
            <div className="text-xl font-bold text-teal-400 mt-1">
              {(data.summary?.humanClicks || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Unique Estimated</span>
            <div className="text-xl font-bold text-slate-100 mt-1">
              {(data.summary?.uniqueVisitors || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Bot Activity</span>
            <div className="text-xl font-bold text-slate-400 mt-1">
              {(data.summary?.botClicks || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Time-Series Area Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Click Volume Over Time</h3>
          <p className="text-xs text-slate-400 mb-6">Daily aggregated human vs crawler redirect traffic</p>

          <div className="h-64 sm:h-80 w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-teal-400" />
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#repGrad)"
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

        {/* Breakdown Grid: Devices & Operating Systems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Category Pie Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-100 mb-1">Device Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Traffic proportion by client hardware class</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.deviceBreakdown || []}
                    dataKey="clicks"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {(data.deviceBreakdown || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operating System Bar Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-100 mb-1">Operating System Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Visitor operating systems (iOS, Android, macOS, Windows)</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.osBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="os" stroke="#475569" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="clicks" name="Clicks" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
