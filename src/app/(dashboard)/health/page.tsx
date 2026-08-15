'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  Edit2,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HealthCheckLog {
  id: string;
  smartLinkId: string;
  smartLink: {
    id: string;
    slug: string;
    displayName: string;
  };
  statusCode?: number | null;
  latencyMs?: number | null;
  finalUrl?: string | null;
  isSuccess: boolean;
  failureReason?: string | null;
  checkType: string;
  timestamp: string;
}

interface FailedDestination {
  id: string;
  smartLinkId: string;
  countryCode: string;
  marketplace: string;
  url: string;
  lastHealthStatus?: number | null;
  lastCheckedAt?: string | null;
  smartLink: {
    id: string;
    slug: string;
    displayName: string;
  };
}

export default function HealthPage() {
  const [logs, setLogs] = useState<HealthCheckLog[]>([]);
  const [failedDestinations, setFailedDestinations] = useState<FailedDestination[]>([]);
  const [degradedCount, setDegradedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // Quick Fix Modal
  const [fixingDestination, setFixingDestination] = useState<FailedDestination | null>(null);
  const [fixUrl, setFixUrl] = useState('');
  const [isFixing, setIsFixing] = useState(false);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/health/check');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.recentChecks || []);
        setFailedDestinations(data.failedDestinations || []);
        setDegradedCount(data.degradedCount || 0);
      }
    } catch (err) {
      console.error('Failed to load health data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleRunCheckNow = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/health/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await loadHealthData();
      }
    } catch (err) {
      console.error('Failed to run batch check', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenFix = (dest: FailedDestination) => {
    setFixingDestination(dest);
    setFixUrl(dest.url);
  };

  const handleSaveFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixingDestination || !fixUrl.trim()) return;
    setIsFixing(true);

    try {
      // Update destination in link
      const res = await fetch(`/api/links/${fixingDestination.smartLinkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations: [
            {
              id: fixingDestination.id,
              countryCode: fixingDestination.countryCode,
              marketplace: fixingDestination.marketplace,
              url: fixUrl.trim(),
              isManual: true,
              isVerified: true,
              isActive: true,
            },
          ],
        }),
      });

      if (res.ok) {
        setFixingDestination(null);
        await loadHealthData();
      } else {
        alert('Failed to update destination');
      }
    } catch {
      alert('Error updating destination');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div>
      <Navbar title="Link Health Monitor" subtitle="Continuous availability and redirect chain monitoring" />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Health Status Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                degradedCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-500/10 text-teal-400'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>System Health Status:</span>
                <span className={degradedCount > 0 ? 'text-amber-400 font-semibold' : 'text-teal-400 font-semibold'}>
                  {degradedCount > 0 ? `${degradedCount} Degraded Destination(s)` : 'All Destinations Healthy'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Checks for broken product listings (HTTP 404), redirect loops, DNS failures, and slow destination responses.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunCheckNow}
            disabled={isChecking || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-teal-950/40 transition-all shrink-0"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{isChecking ? 'Checking Links...' : 'Check All Links Now'}</span>
          </button>
        </div>

        {/* Failed / Degraded Destinations List */}
        {failedDestinations.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Attention Required: Broken or Degraded Destinations</span>
            </div>

            <div className="space-y-3">
              {failedDestinations.map((dest) => (
                <div
                  key={dest.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-100">{dest.smartLink.displayName}</div>
                    <div className="text-[11px] text-teal-400 font-mono">/r/{dest.smartLink.slug}</div>
                    <div className="text-slate-400 mt-1 font-mono truncate max-w-md">
                      {dest.marketplace} Store: {dest.url}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-md bg-red-950/60 border border-red-800 text-red-400 font-bold">
                      HTTP {dest.lastHealthStatus || 'Error'}
                    </span>
                    <button
                      onClick={() => handleOpenFix(dest)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Replace URL</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Check Log History */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Recent Health Inspection Logs
            </h3>
            <span className="text-[11px] text-slate-500">Showing last 30 checks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/20">
                  <th className="py-3 px-4 font-semibold">SmartLink</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Details / Failure Reason</th>
                  <th className="py-3 px-4 font-semibold text-right">Checked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                      Loading health history...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No health checks recorded. Click "Check All Links Now" to test.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 truncate max-w-xs">
                          {log.smartLink.displayName}
                        </div>
                        <div className="text-[11px] text-teal-400 font-mono">/r/{log.smartLink.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        {log.isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {log.statusCode ? `HTTP ${log.statusCode}` : 'OK'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            {log.statusCode ? `HTTP ${log.statusCode}` : 'Failed'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {log.latencyMs ? `${log.latencyMs}ms` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.failureReason || 'Destination reachable and responding'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* QUICK FIX DESTINATION MODAL */}
      {fixingDestination && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100">
              Replace Broken Destination ({fixingDestination.smartLink.slug})
            </h3>
            <p className="text-slate-400">
              Replace this broken URL with a verified Amazon product URL. The public short link (`/r/{fixingDestination.smartLink.slug}`) will not change.
            </p>

            <form onSubmit={handleSaveFix} className="space-y-4">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  New Amazon URL for {fixingDestination.marketplace}
                </label>
                <input
                  type="url"
                  required
                  value={fixUrl}
                  onChange={(e) => setFixUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFixingDestination(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFixing || !fixUrl.trim()}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Replacement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
