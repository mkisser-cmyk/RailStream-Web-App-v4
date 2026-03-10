'use client';

import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Wifi, 
  Clock, Camera, MapPin, Shield, Signal
} from 'lucide-react';

const TIER_LABELS = {
  fireman: { label: 'Fireman', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  conductor: { label: 'Conductor', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  engineer: { label: 'Engineer', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

export default function StatusPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('all'); // all, online, offline

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/cameras/catalog');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort: online first, then alphabetically
        data.sort((a, b) => {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setCameras(data);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Failed to fetch status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const totalCameras = cameras.length;
  const onlineCount = cameras.filter(c => c.status === 'online').length;
  const offlineCount = totalCameras - onlineCount;
  const uptimePercent = totalCameras > 0 ? ((onlineCount / totalCameras) * 100).toFixed(1) : '0';

  const filteredCameras = cameras.filter(c => {
    if (filter === 'online') return c.status === 'online';
    if (filter === 'offline') return c.status !== 'online';
    return true;
  });

  // Overall status
  const overallStatus = offlineCount === 0 ? 'operational' : offlineCount <= 3 ? 'degraded' : 'outage';

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader currentPage="status" />

      {/* Hero */}
      <section className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Overall Status Banner */}
          <div className={`rounded-2xl p-6 mb-8 border ${
            overallStatus === 'operational' 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : overallStatus === 'degraded'
                ? 'bg-yellow-500/5 border-yellow-500/20'
                : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  overallStatus === 'operational' ? 'bg-emerald-500/10' : overallStatus === 'degraded' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                }`}>
                  {overallStatus === 'operational' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : overallStatus === 'degraded' ? (
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${
                    overallStatus === 'operational' ? 'text-emerald-400' : overallStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {overallStatus === 'operational' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial Service Disruption' : 'Service Outage'}
                  </h1>
                  <p className="text-white/50 text-sm mt-0.5">
                    RailStream Camera Network Status
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {lastRefresh && (
                  <span className="text-white/30 text-xs">
                    Updated {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={fetchStatus}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
                  aria-label="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <Camera className="w-5 h-5 text-white/30 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{totalCameras}</p>
              <p className="text-white/40 text-xs">Total Cameras</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <Wifi className="w-5 h-5 text-emerald-400/50 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-400">{onlineCount}</p>
              <p className="text-white/40 text-xs">Online</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <XCircle className="w-5 h-5 text-red-400/50 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-400">{offlineCount}</p>
              <p className="text-white/40 text-xs">Offline</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <Signal className="w-5 h-5 text-[#ff7a00]/50 mx-auto mb-1" />
              <p className="text-2xl font-bold text-[#ff7a00]">{uptimePercent}%</p>
              <p className="text-white/40 text-xs">Network Uptime</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[
                { id: 'all', label: `All (${totalCameras})` },
                { id: 'online', label: `Online (${onlineCount})` },
                { id: 'offline', label: `Offline (${offlineCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f.id
                      ? 'bg-[#ff7a00] text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-white/40 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-white/20"
              />
              Auto-refresh (30s)
            </label>
          </div>

          {/* Camera Status Table */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 text-white/40 text-xs font-medium uppercase tracking-wider border-b border-white/5">
              <div className="col-span-1">Status</div>
              <div className="col-span-4">Camera</div>
              <div className="col-span-3">Location</div>
              <div className="col-span-2">Tier</div>
              <div className="col-span-2">Thumbnail</div>
            </div>

            {/* Camera Rows */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-[#ff7a00] animate-spin" />
              </div>
            ) : filteredCameras.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                No cameras match this filter
              </div>
            ) : (
              filteredCameras.map((camera, i) => {
                const isOnline = camera.status === 'online';
                const tier = TIER_LABELS[camera.min_tier] || TIER_LABELS.fireman;

                return (
                  <div
                    key={camera._id || i}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-white/5 last:border-0 transition hover:bg-white/[0.02] ${
                      !isOnline ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          isOnline ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30' : 'bg-red-400 shadow-lg shadow-red-400/30'
                        }`} />
                      </div>
                    </div>

                    {/* Camera Name */}
                    <div className="col-span-4">
                      <p className="text-white font-medium text-sm">{camera.name}</p>
                      {camera.short_code && (
                        <p className="text-white/30 text-xs font-mono">{camera.short_code}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="col-span-3">
                      <p className="text-white/60 text-sm truncate">{camera.location}</p>
                    </div>

                    {/* Tier */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tier.color}`}>
                        <Shield className="w-3 h-3" />
                        {tier.label}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="col-span-2">
                      {camera.thumbnail_path && isOnline ? (
                        <img
                          src={camera.thumbnail_path}
                          alt={camera.name}
                          className="w-16 h-10 rounded object-cover bg-zinc-800"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="w-16 h-10 rounded bg-zinc-800 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white/20" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-6 flex items-center justify-between text-white/20 text-xs">
            <p>Camera status is checked in real-time. Auto-refresh every 30 seconds.</p>
            <p>© 2011-2026 RailStream. All rights reserved.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
