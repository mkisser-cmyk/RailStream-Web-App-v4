'use client';

import { useState, useEffect, useCallback } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Wifi, 
  Clock, Camera, MapPin, Shield, Signal, Cpu, Activity,
  Monitor, Zap, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatBitrate(kbps) {
  if (!kbps) return 'N/A';
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} Kbps`;
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function StatusPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedSite, setExpandedSite] = useState(null);
  const [thumbKey, setThumbKey] = useState(Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/sites');
      const data = await res.json();
      if (data.ok && Array.isArray(data.sites)) {
        // Sort: online first, then alphabetically
        data.sites.sort((a, b) => {
          if (a.health.status === 'online' && b.health.status !== 'online') return -1;
          if (a.health.status !== 'online' && b.health.status === 'online') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setSites(data.sites);
      }
      setLastRefresh(new Date());
      setThumbKey(Date.now());
    } catch (e) {
      console.error('Failed to fetch status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatus]);

  const totalSites = sites.length;
  const onlineCount = sites.filter(s => s.health.status === 'online').length;
  const offlineCount = totalSites - onlineCount;
  const uptimePercent = totalSites > 0 ? ((onlineCount / totalSites) * 100).toFixed(1) : '0';
  const avgBitrate = sites.length > 0 
    ? (sites.reduce((sum, s) => sum + (s.health.video_bitrate || 0), 0) / sites.filter(s => s.health.video_bitrate > 0).length)
    : 0;
  const totalDroppedFrames = sites.reduce((sum, s) => sum + (s.health.dropped_frames || 0), 0);

  const filteredSites = sites.filter(s => {
    if (filter === 'online') return s.health.status === 'online';
    if (filter === 'offline') return s.health.status !== 'online';
    return true;
  });

  const overallStatus = offlineCount === 0 ? 'operational' : offlineCount <= 2 ? 'degraded' : 'outage';

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader currentPage="network-status" />

      <section className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Overall Status Banner */}
          <div className={`rounded-2xl p-6 mb-6 border backdrop-blur-sm ${
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
                  <p className="text-white/40 text-sm mt-0.5">
                    RailStream Encoder Network &bull; Powered by RailStream Studio
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
                  onClick={() => { setLoading(true); fetchStatus(); }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard icon={Camera} label="Total Encoders" value={totalSites} color="text-white" />
            <StatCard icon={Wifi} label="Online" value={onlineCount} color="text-emerald-400" />
            <StatCard icon={XCircle} label="Offline" value={offlineCount} color="text-red-400" />
            <StatCard icon={Signal} label="Network Uptime" value={`${uptimePercent}%`} color="text-[#ff7a00]" />
            <StatCard icon={Activity} label="Avg Bitrate" value={formatBitrate(avgBitrate)} color="text-blue-400" />
            <StatCard icon={AlertTriangle} label="Dropped Frames" value={totalDroppedFrames.toLocaleString()} color="text-yellow-400" />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[
                { id: 'all', label: `All (${totalSites})` },
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
            <label className="flex items-center gap-2 text-white/40 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-white/20 accent-[#ff7a00]"
              />
              Auto-refresh (15s)
            </label>
          </div>

          {/* Camera Cards Grid */}
          {loading && sites.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-[#ff7a00] animate-spin" />
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              No encoders match this filter
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSites.map((site) => (
                <SiteCard 
                  key={site.id} 
                  site={site} 
                  thumbKey={thumbKey}
                  expanded={expandedSite === site.id}
                  onToggle={() => setExpandedSite(expandedSite === site.id ? null : site.id)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between text-white/20 text-xs border-t border-white/5 pt-4">
            <p>Encoder status is monitored in real-time via RailStream Studio. Auto-refresh every 15 seconds.</p>
            <p>&copy; 2011&ndash;2026 RailStream. All rights reserved.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition">
      <Icon className={`w-5 h-5 ${color} opacity-50 mx-auto mb-1.5`} />
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-white/40 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function SiteCard({ site, thumbKey, expanded, onToggle }) {
  const h = site.health;
  const isOnline = h.status === 'online';
  const isStreaming = h.stream_status === 'running';

  return (
    <div className={`rounded-xl border transition-all ${
      isOnline 
        ? 'bg-zinc-900/40 border-white/5 hover:border-white/10' 
        : 'bg-red-950/20 border-red-500/10 hover:border-red-500/20'
    }`}>
      {/* Preview + Header */}
      <div className="relative">
        {/* Live Preview Thumbnail */}
        <div className="aspect-video w-full bg-zinc-900 rounded-t-xl overflow-hidden relative">
          {h.has_preview && isOnline ? (
            <img
              src={`/api/studio/thumbnail?id=${site.id}&_t=${thumbKey}`}
              alt={site.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
              <Camera className="w-10 h-10 text-white/10 mb-2" />
              <span className="text-white/20 text-xs">{isOnline ? 'No Preview' : 'Offline'}</span>
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              isOnline && isStreaming
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : isOnline
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                  : 'bg-red-500/20 text-red-300 border border-red-400/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isOnline && isStreaming ? 'bg-emerald-400 animate-pulse' : isOnline ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              {isOnline && isStreaming ? 'LIVE' : isOnline ? 'IDLE' : 'OFFLINE'}
            </span>
          </div>
          {/* Resolution Badge */}
          {isOnline && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded bg-black/60 text-white/70 text-xs font-mono backdrop-blur-sm">
                {site.output.resolution} &bull; {h.fps}fps
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{site.name}</h3>
            <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {site.location}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {isOnline && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MiniStat label="Uptime" value={formatUptime(h.uptime_seconds)} />
            <MiniStat label="Bitrate" value={formatBitrate(h.video_bitrate)} />
            <MiniStat label="CPU" value={`${h.cpu_usage.toFixed(1)}%`} alert={h.cpu_usage > 80} />
          </div>
        )}

        {!isOnline && (
          <div className="mb-3 py-2 px-3 bg-red-500/5 rounded-lg border border-red-500/10">
            <p className="text-red-400/80 text-xs">
              Last seen: {timeAgo(h.last_heartbeat)}
            </p>
            {h.error_message && (
              <p className="text-red-400/60 text-xs mt-1">{h.error_message}</p>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <button 
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-white/30 hover:text-white/60 text-xs transition"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'Details'}
        </button>

        {expanded && (
          <div className="mt-2 pt-3 border-t border-white/5 space-y-2">
            <DetailRow label="Stream Status" value={h.stream_status} />
            <DetailRow label="Heartbeat" value={timeAgo(h.last_heartbeat)} />
            <DetailRow label="Video Bitrate" value={formatBitrate(h.video_bitrate)} />
            <DetailRow label="Source Bitrate" value={formatBitrate(h.source_bitrate)} />
            <DetailRow label="Audio Bitrate" value={formatBitrate(h.audio_bitrate)} />
            <DetailRow label="FPS" value={`${h.fps}`} />
            <DetailRow label="Resolution" value={site.output.resolution} />
            <DetailRow label="Encoder" value={`${site.encoder.codec} (${site.encoder.hardware})`} />
            <DetailRow label="CPU Usage" value={`${h.cpu_usage.toFixed(1)}%`} alert={h.cpu_usage > 80} />
            {h.gpu_usage > 0 && <DetailRow label="GPU Usage" value={`${h.gpu_usage.toFixed(1)}%`} />}
            {h.gpu_temp > 0 && <DetailRow label="GPU Temp" value={`${h.gpu_temp}°C`} />}
            <DetailRow label="Dropped Frames" value={`${h.dropped_frames}`} alert={h.dropped_frames > 100} />
            <DetailRow label="Uptime" value={formatUptime(h.uptime_seconds)} />
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, alert }) {
  return (
    <div className="text-center py-1.5 px-2 bg-white/[0.02] rounded-lg">
      <p className={`text-xs font-semibold ${alert ? 'text-yellow-400' : 'text-white/80'}`}>{value}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
    </div>
  );
}

function DetailRow({ label, value, alert }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/40">{label}</span>
      <span className={alert ? 'text-yellow-400 font-medium' : 'text-white/70'}>{value}</span>
    </div>
  );
}
