'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import {
  Train, Calendar, MapPin, Clock, Plus, Search, ChevronLeft, ChevronRight,
  Play, Edit2, Trash2, X, Filter, Camera, ArrowUpRight, Eye, Image,
  TrendingUp, Award, BarChart3, ChevronDown, Upload, Flame, Trophy,
  Zap, Activity, Radio, Crosshair, Navigation
} from 'lucide-react';

const RAILROADS = ['CSX', 'NS', 'UP', 'BNSF', 'CN', 'CP', 'KCS', 'Amtrak', 'Other'];
const TRAIN_TYPES = ['Intermodal', 'Manifest', 'Coal', 'Grain', 'Auto', 'Passenger', 'Local', 'Work Train', 'Light Power', 'Other'];
const DIRECTIONS = ['Eastbound', 'Westbound', 'Northbound', 'Southbound'];

// Railroad brand colors with text contrast + glow
const RR_COLORS = {
  CSX: { bg: '#0033A0', text: '#fff', glow: 'rgba(0,51,160,0.4)' },
  NS: { bg: '#1a1a1a', text: '#fff', border: '#555', glow: 'rgba(100,100,100,0.3)' },
  UP: { bg: '#FFD100', text: '#000', glow: 'rgba(255,209,0,0.4)' },
  BNSF: { bg: '#FF6600', text: '#fff', glow: 'rgba(255,102,0,0.4)' },
  CN: { bg: '#E21836', text: '#fff', glow: 'rgba(226,24,54,0.4)' },
  CP: { bg: '#E21836', text: '#fff', glow: 'rgba(226,24,54,0.4)' },
  KCS: { bg: '#006747', text: '#fff', glow: 'rgba(0,103,71,0.4)' },
  Amtrak: { bg: '#1B3A6B', text: '#fff', glow: 'rgba(27,58,107,0.4)' },
  Other: { bg: '#444', text: '#fff', glow: 'rgba(68,68,68,0.3)' },
};

// Animated number counter hook
function useAnimatedCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const startTime = performance.now();
    prevTarget.current = target;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

// Scroll-triggered fade-in hook
function useScrollFadeIn() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: '20px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

// Animated stat card component
function StatCard({ icon: Icon, label, value, valueColor = 'text-white', subtitle, delay = 0 }) {
  const [ref, isVisible] = useScrollFadeIn();
  const displayVal = typeof value === 'number' ? useAnimatedCounter(isVisible ? value : 0) : value;

  return (
    <div
      ref={ref}
      className="relative group"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
      }}
    >
      {/* Glow border effect */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 md:p-6 overflow-hidden group-hover:border-white/[0.12] transition-all duration-500">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff7a00]/[0.03] rounded-full blur-3xl group-hover:bg-[#ff7a00]/[0.06] transition-all duration-700" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-[#ff7a00]/10 transition-colors duration-500">
              <Icon className="w-4 h-4 text-white/40 group-hover:text-[#ff7a00] transition-colors duration-500" />
            </div>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.15em] font-semibold">{label}</p>
          </div>
          <p className={`text-3xl md:text-4xl font-extrabold ${valueColor} tabular-nums tracking-tight`}>
            {typeof displayVal === 'number' ? displayVal.toLocaleString() : displayVal}
          </p>
          {subtitle && <p className="text-white/40 text-xs mt-1.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SightingsPage() {
  const [sightings, setSightings] = useState([]);
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState(null);

  // Filters - filterLocation stores unique town name (e.g. "Fostoria, Ohio") instead of camera_id
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterRailroad, setFilterRailroad] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // New sighting form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    camera_id: '', sighting_time: '', railroad: '', train_id: '',
    direction: '', locomotives: '', train_type: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // ── Daily Train Log state ──
  const [logLocation, setLogLocation] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logSightings, setLogSightings] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logActive, setLogActive] = useState(false);

  // Fetch daily log when location + date are set
  const fetchDailyLog = useCallback(async () => {
    if (!logLocation || !logDate) return;
    setLogLoading(true);
    setLogActive(true);
    try {
      const params = new URLSearchParams({
        camera_name: logLocation,
        date: logDate,
        limit: '200',
        page: '1',
      });
      const res = await fetch(`/api/sightings?${params}`);
      const data = await res.json();
      if (data.ok) {
        // Sort by sighting_time ascending
        const sorted = (data.sightings || []).sort((a, b) =>
          new Date(a.sighting_time) - new Date(b.sighting_time)
        );
        setLogSightings(sorted);
      }
    } catch (e) {
      console.error('Failed to fetch daily log:', e);
    }
    setLogLoading(false);
  }, [logLocation, logDate]);

  useEffect(() => {
    if (logLocation && logDate) fetchDailyLog();
  }, [fetchDailyLog]);

  // Helper: check if a sighting's DVR replay is still available (within 7 days)
  const isDvrAvailable = (sightingTime) => {
    const sightTs = new Date(sightingTime).getTime();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return (now - sightTs) < sevenDays;
  };

  // Compute daily log stats
  const logStats = useMemo(() => {
    if (!logSightings.length) return null;
    const byRailroad = {};
    const byHour = {};
    logSightings.forEach(s => {
      const rr = s.railroad || 'Unknown';
      byRailroad[rr] = (byRailroad[rr] || 0) + 1;
      const hour = new Date(s.sighting_time).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });
    const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    return {
      total: logSightings.length,
      byRailroad: Object.entries(byRailroad).sort((a, b) => b[1] - a[1]),
      peakHour: peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null,
    };
  }, [logSightings]);

  // Editing
  const [editingId, setEditingId] = useState(null);

  // Expanded image - stores full sighting for showing notes
  const [expandedSighting, setExpandedSighting] = useState(null);

  // Hero parallax
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem('railstream_token');
    if (token) {
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.username || data.name) setUser(data);
        })
        .catch(() => {});
    }
  }, []);

  // Fetch cameras for dropdown
  useEffect(() => {
    fetch('/api/cameras/catalog')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.cameras || [];
        setCameras(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      })
      .catch(() => {});
  }, []);

  // Fetch sightings
  const fetchSightings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (filterLocation) params.set('camera_name', filterLocation);
    if (filterDate) params.set('date', filterDate);
    if (filterRailroad) params.set('railroad', filterRailroad);

    try {
      const res = await fetch(`/api/sightings?${params}`);
      const data = await res.json();
      if (data.ok) {
        setSightings(data.sightings || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch sightings:', e);
    }
    setLoading(false);
  }, [page, filterLocation, filterDate, filterRailroad]);

  useEffect(() => { fetchSightings(); }, [fetchSightings]);

  // Fetch stats
  useEffect(() => {
    fetch('/api/sightings/stats')
      .then(r => r.json())
      .then(data => { if (data.ok) setStats(data); })
      .catch(() => {});
  }, []);

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Submit sighting
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('railstream_token');
    const camera = cameras.find(c => c._id === formData.camera_id);

    const body = {
      ...formData,
      camera_name: camera?.name || '',
      location: camera?.location || camera?.name || '',
    };

    if (body.sighting_time && !body.sighting_time.includes('Z') && !body.sighting_time.includes('+')) {
      const localDate = new Date(body.sighting_time);
      if (!isNaN(localDate.getTime())) {
        body.sighting_time = localDate.toISOString();
      }
    }

    try {
      const url = editingId ? `/api/sightings/${editingId}` : '/api/sightings';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        if (imagePreview && data.sighting?._id) {
          try {
            await fetch('/api/sightings/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ image_data: imagePreview, sighting_id: data.sighting._id }),
            });
          } catch (uploadErr) {
            console.error('Image upload failed:', uploadErr);
          }
        }
        setShowForm(false);
        setEditingId(null);
        setFormData({ camera_id: '', sighting_time: '', railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
        setImageFile(null);
        setImagePreview(null);
        fetchSightings();
      } else {
        alert(data.error || 'Failed to save sighting');
      }
    } catch (err) {
      alert('Network error');
    }
    setSubmitting(false);
  };

  // Delete sighting
  const handleDelete = async (id) => {
    if (!confirm('Delete this sighting?')) return;
    const token = localStorage.getItem('railstream_token');
    try {
      const res = await fetch(`/api/sightings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) fetchSightings();
      else alert(data.error || 'Failed to delete');
    } catch (err) {
      alert('Network error');
    }
  };

  // Edit sighting
  const startEdit = (s) => {
    let localTimeStr = '';
    if (s.sighting_time) {
      const utcDate = new Date(s.sighting_time);
      if (!isNaN(utcDate.getTime())) {
        const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
        localTimeStr = localDate.toISOString().slice(0, 16);
      } else {
        localTimeStr = s.sighting_time.slice(0, 16);
      }
    }
    setFormData({
      camera_id: s.camera_id, sighting_time: localTimeStr,
      railroad: s.railroad, train_id: s.train_id, direction: s.direction,
      locomotives: s.locomotives, train_type: s.train_type, notes: s.notes,
    });
    setEditingId(s._id);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  // Jump to replay URL
  const getReplayUrl = (s) => {
    const sightingTs = new Date(s.sighting_time).getTime() / 1000;
    const now = Date.now() / 1000;
    const secsAgo = Math.floor(now - sightingTs);
    if (secsAgo > 604800 || secsAgo < 0) return null;
    return `/?watch=${s.camera_id}&seek=${secsAgo}`;
  };

  const isPaidMember = user && ['conductor', 'engineer', 'fireman', 'development', 'admin'].includes(user.tier || user.membership_tier);
  const activeFilters = [filterLocation, filterDate, filterRailroad].filter(Boolean).length;

  // Compute unique locations from cameras (deduplicated by name)
  const uniqueLocations = [...new Set(cameras.map(c => c.name))].sort();

  // Scroll-triggered refs for sections
  const [heroRef, heroVisible] = useScrollFadeIn();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <SiteHeader currentPage="sightings" user={user} />

      {/* ====== IMMERSIVE HERO SECTION ====== */}
      <div className="relative pt-16 overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1501704163333-86d3832cd4ea?w=1920&q=80"
            alt=""
            className="w-full h-[600px] object-cover opacity-30"
            style={{ objectPosition: 'center 40%' }}
          />
        </div>
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-[#050505]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />

        {/* Animated accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]">
          <div className="h-full bg-gradient-to-r from-transparent via-[#ff7a00]/40 to-transparent" />
        </div>

        {/* Hero content */}
        <div
          ref={heroRef}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/20 mb-6">
                <Activity className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span className="text-[#ff7a00] text-xs font-semibold tracking-wide uppercase">Community Powered</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
                <span className="text-white">Train</span>{' '}
                <span className="bg-gradient-to-r from-[#ff7a00] to-[#ff9a40] bg-clip-text text-transparent">Sightings</span>
              </h1>

              <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-lg">
                The railfan community's live train log. Spot it, log it, replay it.
              </p>

              {/* Live activity indicator */}
              {stats && (
                <div className="flex items-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <span className="text-white/40 text-sm">{stats.today || 0} spotted today</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <span className="text-white/40 text-sm">{stats.total?.toLocaleString() || '0'} all-time sightings</span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            {isPaidMember && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                  const now = new Date();
                  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  setFormData({ camera_id: '', sighting_time: localNow, railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="group relative flex items-center gap-3 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] hover:from-[#ff8c20] hover:to-[#ff6620] text-white px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-[#ff7a00]/20 hover:shadow-[#ff7a00]/40 self-start md:self-auto"
              >
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff5500] opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
                <Plus className="w-5 h-5" />
                <span>Log Sighting</span>
                <Crosshair className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* ====== STATS DASHBOARD ====== */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10 -mt-4">
            <StatCard
              icon={BarChart3}
              label="Total Sightings"
              value={stats.total || 0}
              delay={0}
            />
            <StatCard
              icon={Flame}
              label="Today"
              value={stats.today || 0}
              valueColor="text-[#ff7a00]"
              delay={100}
            />
            <StatCard
              icon={Train}
              label="Top Railroad"
              value={stats.top_railroads?.[0]?.name || '—'}
              subtitle={stats.top_railroads?.[0] ? `${stats.top_railroads[0].count} sightings` : null}
              delay={200}
            />
            <StatCard
              icon={MapPin}
              label="Top Location"
              value={stats.top_locations?.[0]?.name || '—'}
              subtitle={stats.top_locations?.[0] ? `${stats.top_locations[0].count} sightings` : null}
              delay={300}
            />
          </div>
        )}

        {/* ====== LEADERBOARD ====== */}
        {stats?.leaderboard && stats.leaderboard.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]">
              {/* Ambient glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/[0.06] rounded-full blur-3xl" />

              {/* Header */}
              <div className="relative px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                    <Trophy className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">Top Spotters</h2>
                    <p className="text-white/25 text-[11px]">10 points per logged sighting</p>
                  </div>
                </div>
                <div className="text-[11px] text-white/20 font-medium uppercase tracking-wider">Leaderboard</div>
              </div>

              {/* Leaderboard entries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                {stats.leaderboard.slice(0, 5).map((entry, idx) => {
                  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                  const medalGlows = ['rgba(255,215,0,0.15)', 'rgba(192,192,192,0.1)', 'rgba(205,127,50,0.1)'];
                  const isMe = user && (entry.username === user.username || entry.username === user.name);
                  const maxSightings = stats.leaderboard[0]?.sightings || 1;
                  const barWidth = (entry.sightings / maxSightings) * 100;

                  return (
                    <div
                      key={entry.username}
                      className={`relative px-5 py-4 border-b sm:border-b-0 sm:border-r border-white/[0.04] last:border-r-0 last:border-b-0 transition-all duration-300 hover:bg-white/[0.02] ${
                        isMe ? 'bg-[#ff7a00]/[0.04]' : ''
                      } ${idx === 0 ? 'bg-amber-500/[0.03]' : ''}`}
                    >
                      {/* Progress bar background */}
                      <div
                        className="absolute bottom-0 left-0 h-[3px] transition-all duration-1000"
                        style={{
                          width: `${barWidth}%`,
                          background: idx < 3
                            ? `linear-gradient(to right, ${medalColors[idx]}66, ${medalColors[idx]}22)`
                            : 'linear-gradient(to right, rgba(255,122,0,0.4), rgba(255,122,0,0.1))'
                        }}
                      />

                      <div className="flex items-center gap-3">
                        {/* Rank badge */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                          style={idx < 3 ? {
                            background: `linear-gradient(135deg, ${medalColors[idx]}30, ${medalColors[idx]}10)`,
                            border: `1px solid ${medalColors[idx]}40`,
                            color: medalColors[idx],
                            boxShadow: `0 4px 12px ${medalGlows[idx]}`
                          } : {
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            color: 'rgba(255,255,255,0.4)'
                          }}
                        >
                          {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#ff7a00]' : idx === 0 ? 'text-amber-300' : 'text-white'}`}>
                            {entry.username}
                            {isMe && <span className="text-[10px] text-[#ff7a00]/50 ml-1.5">(you)</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-white/40 text-[11px]">{entry.sightings} sighting{entry.sightings !== 1 ? 's' : ''}</span>
                            <span className="text-amber-500/60 text-[11px] font-bold tabular-nums">{entry.points} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ====== DAILY TRAIN LOG ====== */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]">
            {/* Ambient glow */}
            <div className="absolute -top-20 left-1/4 w-96 h-40 bg-[#ff7a00]/[0.04] rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff7a00]/20 to-[#ff5500]/10 flex items-center justify-center border border-[#ff7a00]/20">
                  <BarChart3 className="w-4.5 h-4.5 text-[#ff7a00]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">Daily Train Log</h2>
                  <p className="text-white/25 text-[11px]">Select a site and date to view the day's activity</p>
                </div>
              </div>
              {logActive && (
                <button
                  onClick={() => { setLogActive(false); setLogSightings([]); setLogLocation(''); setLogDate(''); }}
                  className="text-white/30 hover:text-white/60 text-xs font-medium transition flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Site + Date selectors */}
            <div className="relative px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/30 text-[11px] uppercase tracking-wider font-semibold mb-2">Camera / Site</label>
                  <select
                    value={logLocation}
                    onChange={(e) => setLogLocation(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  >
                    <option value="">Select a site...</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/30 text-[11px] uppercase tracking-wider font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchDailyLog}
                    disabled={!logLocation || !logDate || logLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] hover:from-[#ff8c20] hover:to-[#ff6620] disabled:from-gray-700 disabled:to-gray-600 text-white py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    {logLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        View Log
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Log Results */}
            {logActive && (
              <div className="border-t border-white/[0.06]">
                {logSightings.length === 0 && !logLoading ? (
                  <div className="px-6 py-12 text-center">
                    <Train className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-white/40 text-sm font-medium">No trains logged at this site on this date</p>
                    <p className="text-white/20 text-xs mt-1">Try a different date or location</p>
                  </div>
                ) : logSightings.length > 0 && (
                  <>
                    {/* Daily summary bar */}
                    <div className="px-6 py-4 bg-white/[0.02] flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4 text-[#ff7a00]" />
                        <span className="text-white font-bold text-lg">{logStats?.total || 0}</span>
                        <span className="text-white/40 text-sm">trains logged</span>
                      </div>
                      {logStats?.byRailroad?.map(([rr, count]) => {
                        const rrStyle = RR_COLORS[rr] || RR_COLORS.Other;
                        return (
                          <span key={rr} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-sm"
                              style={{ background: rrStyle.bg }}
                            />
                            <span className="text-white/50 text-xs font-medium">{rr}</span>
                            <span className="text-white/30 text-xs">({count})</span>
                          </span>
                        );
                      })}
                      {logStats?.peakHour && (
                        <span className="text-white/30 text-xs ml-auto">
                          Peak: {logStats.peakHour.hour > 12 ? `${logStats.peakHour.hour - 12} PM` : logStats.peakHour.hour === 0 ? '12 AM' : `${logStats.peakHour.hour} AM`} ({logStats.peakHour.count} trains)
                        </span>
                      )}
                    </div>

                    {/* Train log table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left px-6 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Time</th>
                            <th className="text-left px-4 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Railroad</th>
                            <th className="text-left px-4 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Train</th>
                            <th className="text-left px-4 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Type</th>
                            <th className="text-left px-4 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Direction</th>
                            <th className="text-left px-4 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Power</th>
                            <th className="text-left px-4 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">Spotter</th>
                            <th className="text-right px-6 py-3 text-white/30 text-[11px] uppercase tracking-wider font-semibold">DVR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logSightings.map((s, idx) => {
                            const sightDate = new Date(s.sighting_time);
                            const rrStyle = RR_COLORS[s.railroad] || RR_COLORS.Other;
                            const dvrOk = isDvrAvailable(s.sighting_time);
                            const replayUrl = getReplayUrl(s);

                            return (
                              <tr
                                key={s._id || idx}
                                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                style={{ animation: `fadeInUp 0.3s ease ${Math.min(idx * 30, 300)}ms both` }}
                              >
                                <td className="px-6 py-3.5">
                                  <span className="text-white/70 font-mono text-xs">
                                    {sightDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className="inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
                                    style={{
                                      background: rrStyle.bg,
                                      color: rrStyle.text,
                                      border: rrStyle.border ? `1px solid ${rrStyle.border}` : 'none',
                                    }}
                                  >
                                    {s.railroad}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-white/80 font-semibold text-xs">{s.train_id || '—'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-white/40 text-xs">{s.train_type || '—'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  {s.direction ? (
                                    <span className="flex items-center gap-1 text-white/40 text-xs">
                                      <Navigation className="w-3 h-3" />
                                      {s.direction}
                                    </span>
                                  ) : <span className="text-white/20 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-white/40 font-mono text-[11px]">{s.locomotives || '—'}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-white/30 text-xs">{s.user || '—'}</span>
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  {dvrOk && replayUrl ? (
                                    <Link
                                      href={replayUrl}
                                      className="inline-flex items-center gap-1.5 bg-[#ff7a00]/10 hover:bg-[#ff7a00]/20 text-[#ff7a00] text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                    >
                                      <Play className="w-3 h-3" fill="currentColor" />
                                      Review
                                    </Link>
                                  ) : (
                                    <span className="text-white/15 text-[11px] italic">Expired</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====== RAILROAD QUICK-FILTER CHIPS ====== */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* All chip */}
            <button
              onClick={() => { setFilterRailroad(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${
                !filterRailroad
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.06]'
              }`}
            >
              All Railroads
            </button>
            {RAILROADS.filter(r => r !== 'Other').map(r => {
              const rr = RR_COLORS[r];
              const isActive = filterRailroad === r;
              return (
                <button
                  key={r}
                  onClick={() => { setFilterRailroad(isActive ? '' : r); setPage(1); }}
                  className="px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 border"
                  style={isActive ? {
                    background: rr.bg,
                    color: rr.text,
                    borderColor: rr.bg,
                    boxShadow: `0 4px 16px ${rr.glow}`
                  } : {
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.4)',
                    borderColor: 'rgba(255,255,255,0.06)'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.target.style.borderColor = rr.bg + '60';
                      e.target.style.color = rr.text === '#000' ? 'rgba(255,255,255,0.7)' : rr.bg;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.target.style.color = 'rgba(255,255,255,0.4)';
                    }
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {/* Advanced filters toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                filtersOpen || (filterLocation || filterDate)
                  ? 'bg-[#ff7a00]/10 text-[#ff7a00] border border-[#ff7a00]/20'
                  : 'bg-white/[0.03] text-white/40 hover:text-white/60 border border-white/[0.06] hover:border-white/[0.1]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Advanced Filters
              {(filterLocation || filterDate) && (
                <span className="w-5 h-5 rounded-full bg-[#ff7a00] text-white text-[10px] flex items-center justify-center font-bold">
                  {[filterLocation, filterDate].filter(Boolean).length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterRailroad(''); setPage(1); }}
                className="flex items-center gap-1.5 text-[#ff7a00]/60 hover:text-[#ff7a00] text-xs font-medium transition-colors"
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>

          {/* Advanced filters panel */}
          {filtersOpen && (
            <div className="mt-3 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/30 text-[11px] uppercase tracking-wider font-semibold mb-2">Location</label>
                  <select
                    value={filterLocation}
                    onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/30 text-[11px] uppercase tracking-wider font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  />
                </div>
                <div className="flex items-end">
                  {(filterLocation || filterDate) && (
                    <button
                      onClick={() => { setFilterLocation(''); setFilterDate(''); setPage(1); }}
                      className="w-full text-[#ff7a00] hover:text-[#ff8c20] text-sm font-medium transition flex items-center gap-2 justify-center py-3 rounded-xl hover:bg-[#ff7a00]/5"
                    >
                      <X className="w-3.5 h-3.5" /> Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====== SIGHTINGS FEED ====== */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-[#ff7a00]/10 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-[#ff7a00] rounded-full animate-spin" />
                <Train className="absolute inset-0 m-auto w-6 h-6 text-[#ff7a00]/40" />
              </div>
              <p className="text-white/30 mt-6 text-sm font-medium">Loading sightings...</p>
            </div>
          ) : sightings.length === 0 ? (
            <div className="text-center py-32 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#ff7a00]/[0.02] via-transparent to-transparent rounded-3xl" />
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                  <Train className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-white/50 text-xl font-semibold">No sightings found</p>
                <p className="text-white/30 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                  {activeFilters > 0 ? 'Try adjusting your filters to find what you\'re looking for.' : 'Be the first to log a train sighting and start the conversation!'}
                </p>
                {isPaidMember && activeFilters === 0 && (
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(null);
                      const now = new Date();
                      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                      setFormData({ camera_id: '', sighting_time: localNow, railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
                    }}
                    className="mt-8 inline-flex items-center gap-2.5 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] hover:from-[#ff8c20] hover:to-[#ff6620] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#ff7a00]/20"
                  >
                    <Plus className="w-4 h-4" /> Log First Sighting
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full bg-[#ff7a00]" />
                  <p className="text-white/40 text-sm font-medium">
                    <span className="text-white/70 font-semibold">{total}</span> sighting{total !== 1 ? 's' : ''} {activeFilters > 0 ? 'matched' : 'logged'}
                  </p>
                </div>
              </div>

              {/* Timeline-style feed */}
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-[#ff7a00]/20 via-white/[0.04] to-transparent hidden md:block" />

                <div className="space-y-4">
                  {sightings.map((s, idx) => {
                    const replayUrl = getReplayUrl(s);
                    const isOwn = user && (s.user === user.username || s.user === user.name);
                    const sightDate = new Date(s.sighting_time);
                    const rrStyle = RR_COLORS[s.railroad] || RR_COLORS.Other;
                    const hasImage = s.image_url || s.imageUrl;

                    return (
                      <div
                        key={s._id}
                        className="group relative"
                        style={{
                          animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(idx * 80, 400)}ms both`,
                        }}
                      >
                        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                        {/* Timeline dot */}
                        <div
                          className="absolute left-[19px] top-6 w-[9px] h-[9px] rounded-full border-2 border-[#151515] z-10 hidden md:block transition-all duration-300 group-hover:scale-125"
                          style={{ background: rrStyle.bg }}
                        />

                        {/* Card */}
                        <div className="md:ml-12 relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a] transition-all duration-500 group-hover:border-white/[0.1] group-hover:shadow-lg group-hover:shadow-black/30">
                          {/* Railroad accent bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-500 group-hover:w-[4px]"
                            style={{ background: `linear-gradient(to bottom, ${rrStyle.bg}, ${rrStyle.bg}44)` }}
                          />

                          <div className="flex">
                            {/* Snapshot Image */}
                            {hasImage && (
                              <div
                                className="w-44 md:w-56 flex-shrink-0 relative cursor-pointer overflow-hidden"
                                onClick={() => setExpandedSighting(s)}
                              >
                                <img
                                  src={hasImage}
                                  alt={`${s.railroad} ${s.train_id || 'train'}`}
                                  className="w-full h-full object-cover min-h-[130px] transition-transform duration-700 group-hover:scale-110"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0a]/80" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                                </div>
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 p-5 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Railroad badge + identifiers */}
                                  <div className="flex items-center gap-2.5 flex-wrap mb-3">
                                    <span
                                      className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 group-hover:scale-105"
                                      style={{
                                        background: rrStyle.bg,
                                        color: rrStyle.text,
                                        border: rrStyle.border ? `1px solid ${rrStyle.border}` : 'none',
                                        boxShadow: `0 2px 8px ${rrStyle.glow}`
                                      }}
                                    >
                                      {s.railroad}
                                    </span>
                                    {s.train_id && (
                                      <span className="text-white font-bold text-sm tracking-wide">{s.train_id}</span>
                                    )}
                                    {s.train_type && (
                                      <span className="text-white/25 text-xs font-medium">• {s.train_type}</span>
                                    )}
                                    {s.direction && (
                                      <span className="flex items-center gap-1 text-white/50 text-[11px] bg-white/[0.04] px-2.5 py-1 rounded-lg font-semibold">
                                        <Navigation className="w-3 h-3" />
                                        {s.direction}
                                      </span>
                                    )}
                                  </div>

                                  {/* Location + Time */}
                                  <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="w-3 h-3 text-white/20" />
                                      <span>{s.camera_name || s.location || 'Unknown'}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-white/20" />
                                      <span>{sightDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                      <span className="text-white/20">at</span>
                                      <span>{sightDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                                    </span>
                                  </div>

                                  {/* Locomotives */}
                                  {s.locomotives && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-white/20 text-[11px] font-semibold uppercase tracking-wider">Power</span>
                                      <span className="text-white/50 font-mono text-[11px] bg-white/[0.03] px-2 py-0.5 rounded">{s.locomotives}</span>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {s.notes && (
                                    <p className="text-white/35 text-xs mt-2 italic leading-relaxed line-clamp-2 max-w-lg">{s.notes}</p>
                                  )}

                                  {/* Posted by */}
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                                    <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-white/30">
                                      {(s.user || '?')[0].toUpperCase()}
                                    </div>
                                    <p className="text-white/30 text-[11px]">
                                      <span className="text-white/50 font-medium">{s.user}</span>
                                      {stats?.leaderboard && (() => {
                                        const rank = stats.leaderboard.find(l => l.username === s.user);
                                        if (rank && rank.rank <= 3) {
                                          const medals = ['🥇', '🥈', '🥉'];
                                          return <span className="ml-1.5" title={`#${rank.rank} spotter • ${rank.points} pts`}>{medals[rank.rank - 1]}</span>;
                                        }
                                        return null;
                                      })()}
                                    </p>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  {replayUrl && (
                                    <Link
                                      href={replayUrl}
                                      className="group/btn relative flex items-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-300 hover:scale-[1.03] shadow-md shadow-[#ff7a00]/20 hover:shadow-[#ff7a00]/40"
                                      title="Watch DVR replay"
                                    >
                                      <Play className="w-3.5 h-3.5" fill="white" />
                                      <span>Replay</span>
                                    </Link>
                                  )}
                                  {isOwn && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                      <button
                                        onClick={() => startEdit(s)}
                                        className="flex items-center gap-1 text-white/30 hover:text-[#ff7a00] text-[11px] transition-colors px-2.5 py-2 rounded-lg hover:bg-white/[0.03]"
                                      >
                                        <Edit2 className="w-3 h-3" /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleDelete(s._id)}
                                        className="flex items-center gap-1 text-white/30 hover:text-red-400 text-[11px] transition-colors px-2.5 py-2 rounded-lg hover:bg-white/[0.03]"
                                      >
                                        <Trash2 className="w-3 h-3" /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ====== PAGINATION ====== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-white/[0.04]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 text-white/40 hover:text-white disabled:text-white/10 transition-all text-sm px-5 py-3 rounded-xl hover:bg-white/[0.03] disabled:hover:bg-transparent font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-1.5 px-3">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      page === pageNum
                        ? 'bg-[#ff7a00] text-white shadow-lg shadow-[#ff7a00]/20'
                        : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 text-white/40 hover:text-white disabled:text-white/10 transition-all text-sm px-5 py-3 rounded-xl hover:bg-white/[0.03] disabled:hover:bg-transparent font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====== BOTTOM CTA ====== */}
        {!isPaidMember && (
          <div className="mt-16 relative overflow-hidden rounded-2xl border border-white/[0.06]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff7a00]/[0.08] via-transparent to-[#ff5500]/[0.05]" />
            <div className="relative px-8 py-10 text-center">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Join the Community</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Subscribe to log sightings, earn points on the leaderboard, and replay any train with our 7-day DVR.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#ff7a00]/20 hover:shadow-[#ff7a00]/40"
              >
                <Zap className="w-4 h-4" /> View Plans
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ====== SIGHTING FORM MODAL ====== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>

            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-[#0f0f0f] z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center">
                  <Train className="w-4 h-4 text-[#ff7a00]" />
                </div>
                {editingId ? 'Edit Sighting' : 'Log Train Sighting'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white transition p-2 rounded-xl hover:bg-white/[0.06]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Snapshot (optional)</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                    <img src={imagePreview} alt="Snapshot preview" className="w-full aspect-video object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/70 backdrop-blur-sm text-white/50 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-white/[0.06] hover:border-[#ff7a00]/20 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 group hover:bg-[#ff7a00]/[0.02]"
                  >
                    <Upload className="w-5 h-5 text-white/20 group-hover:text-[#ff7a00]/40 transition-colors" />
                    <span className="text-white/30 text-xs group-hover:text-white/50 transition-colors">Click to upload a snapshot</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>

              {/* Camera */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Camera Location *</label>
                <select
                  value={formData.camera_id}
                  onChange={e => setFormData(f => ({ ...f, camera_id: e.target.value }))}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                >
                  <option value="">Select a camera...</option>
                  {cameras.map(c => (
                    <option key={c._id} value={c._id}>{c.name}{c.location ? ` — ${c.location}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Date/Time */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.sighting_time}
                  onChange={e => setFormData(f => ({ ...f, sighting_time: e.target.value }))}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                />
              </div>

              {/* Railroad + Train Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Railroad *</label>
                  <select
                    value={formData.railroad}
                    onChange={e => setFormData(f => ({ ...f, railroad: e.target.value }))}
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  >
                    <option value="">Select...</option>
                    {RAILROADS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Train Type</label>
                  <select
                    value={formData.train_type}
                    onChange={e => setFormData(f => ({ ...f, train_type: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  >
                    <option value="">Select...</option>
                    {TRAIN_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Train ID + Direction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Train ID / Symbol</label>
                  <input
                    type="text"
                    value={formData.train_id}
                    onChange={e => setFormData(f => ({ ...f, train_id: e.target.value }))}
                    placeholder="e.g., Q335, N956"
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Direction</label>
                  <select
                    value={formData.direction}
                    onChange={e => setFormData(f => ({ ...f, direction: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all"
                  >
                    <option value="">Select...</option>
                    {DIRECTIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Locomotives */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Locomotive(s)</label>
                <input
                  type="text"
                  value={formData.locomotives}
                  onChange={e => setFormData(f => ({ ...f, locomotives: e.target.value }))}
                  placeholder="e.g., CSX 3194, CSX 812"
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Horn, meets, rare power, DPU, etc."
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#ff7a00] to-[#ff5500] hover:from-[#ff8c20] hover:to-[#ff6620] disabled:from-[#ff7a00]/30 disabled:to-[#ff5500]/30 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ff7a00]/10 hover:shadow-[#ff7a00]/30"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingId ? 'Update Sighting' : 'Log Sighting'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====== EXPANDED IMAGE LIGHTBOX WITH NOTES ====== */}
      {expandedSighting && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpandedSighting(null)}
          style={{ animation: 'modalIn 0.2s ease-out' }}
        >
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={expandedSighting.image_url || expandedSighting.imageUrl}
              alt={`${expandedSighting.railroad} ${expandedSighting.train_id || 'train'}`}
              className="w-full rounded-t-xl shadow-2xl shadow-black/50"
            />
            {/* Sighting details below image */}
            <div className="bg-[#0a0a0a] border border-white/[0.08] border-t-0 rounded-b-xl px-6 py-5">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span
                  className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                  style={{
                    background: (RR_COLORS[expandedSighting.railroad] || RR_COLORS.Other).bg,
                    color: (RR_COLORS[expandedSighting.railroad] || RR_COLORS.Other).text,
                    boxShadow: `0 2px 8px ${(RR_COLORS[expandedSighting.railroad] || RR_COLORS.Other).glow}`
                  }}
                >
                  {expandedSighting.railroad}
                </span>
                {expandedSighting.train_id && (
                  <span className="text-white font-bold text-base">{expandedSighting.train_id}</span>
                )}
                {expandedSighting.train_type && (
                  <span className="text-white/30 text-sm">• {expandedSighting.train_type}</span>
                )}
                {expandedSighting.direction && (
                  <span className="flex items-center gap-1 text-white/50 text-xs bg-white/[0.04] px-2.5 py-1 rounded-lg font-semibold">
                    <Navigation className="w-3 h-3" />
                    {expandedSighting.direction}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40 mb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-white/20" />
                  {expandedSighting.camera_name || expandedSighting.location || 'Unknown'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/20" />
                  {new Date(expandedSighting.sighting_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {new Date(expandedSighting.sighting_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
              {expandedSighting.locomotives && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/20 text-[11px] font-semibold uppercase tracking-wider">Power</span>
                  <span className="text-white/50 font-mono text-xs bg-white/[0.03] px-2 py-0.5 rounded">{expandedSighting.locomotives}</span>
                </div>
              )}
              {expandedSighting.notes && (
                <p className="text-white/50 text-sm mt-3 leading-relaxed italic border-l-2 border-[#ff7a00]/30 pl-3">{expandedSighting.notes}</p>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-white/30">
                  {(expandedSighting.user || '?')[0].toUpperCase()}
                </div>
                <p className="text-white/30 text-[11px]">
                  Spotted by <span className="text-white/50 font-medium">{expandedSighting.user}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpandedSighting(null)}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/50 backdrop-blur-sm text-white/50 hover:text-white transition-colors border border-white/[0.1]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
