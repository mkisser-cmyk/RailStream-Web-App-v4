'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import {
  Camera, Search, Heart, MapPin, Clock, Plus, X, Filter, Train, Upload,
  Radio, ChevronDown, ChevronLeft, ChevronRight, Eye, Image, Star,
  TrendingUp, Award, BarChart3, Zap, ArrowUpRight, Flame, Trophy,
  Navigation, Tag, AlertTriangle, Sparkles, ExternalLink, Grid3X3,
  LayoutGrid,
} from 'lucide-react';

const RAILROADS = ['CSX', 'NS', 'UP', 'BNSF', 'CN', 'CP', 'KCS', 'Amtrak', 'Other'];
const PHOTO_TAGS = [
  { id: 'heritage', label: 'Heritage', icon: '👑', color: '#FFD700' },
  { id: 'rare_power', label: 'Rare Power', icon: '⚡', color: '#ff7a00' },
  { id: 'foreign_power', label: 'Foreign Power', icon: '🔀', color: '#a855f7' },
  { id: 'meet', label: 'Meet', icon: '🤝', color: '#3b82f6' },
  { id: 'night_shot', label: 'Night Shot', icon: '🌙', color: '#6366f1' },
  { id: 'weather', label: 'Weather', icon: '🌧️', color: '#64748b' },
  { id: 'steam', label: 'Steam', icon: '💨', color: '#ef4444' },
  { id: 'passenger', label: 'Passenger', icon: '🚃', color: '#14b8a6' },
  { id: 'locals', label: 'Local/Yard', icon: '🏗️', color: '#f59e0b' },
  { id: 'scenery', label: 'Scenery', icon: '🏔️', color: '#22c55e' },
];

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

// Scroll fade-in hook
function useScrollFadeIn() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.05, rootMargin: '40px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
}

// Animated counter
function useAnimCounter(target, dur = 1000) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const t0 = performance.now();
    prev.current = target;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur]);
  return count;
}

function StatCard({ icon: Icon, label, value, valueColor = 'text-white', subtitle, delay = 0 }) {
  const [ref, vis] = useScrollFadeIn();
  const displayVal = typeof value === 'number' ? useAnimCounter(vis ? value : 0) : value;
  return (
    <div ref={ref} className="relative group"
      style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)', transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      <div className="relative bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 overflow-hidden group-hover:border-white/[0.12] transition-all duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff7a00]/[0.03] rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-[#ff7a00]/10 transition-colors duration-500">
              <Icon className="w-4 h-4 text-white/40 group-hover:text-[#ff7a00] transition-colors duration-500" />
            </div>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.15em] font-semibold">{label}</p>
          </div>
          <p className={`text-3xl font-extrabold ${valueColor} tabular-nums tracking-tight`}>
            {typeof displayVal === 'number' ? displayVal.toLocaleString() : displayVal}
          </p>
          {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function RoundhousePage() {
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterRailroad, setFilterRailroad] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterHeritage, setFilterHeritage] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({
    railroad: '', locomotive_numbers: '', location: '', source: 'trackside',
    tags: [], title: '', description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heritageDetected, setHeritageDetected] = useState(null);
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Lightbox
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Scroll ref
  const [heroRef, heroVisible] = useScrollFadeIn();

  // Parallax
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Auth
  useEffect(() => {
    const token = localStorage.getItem('railstream_token');
    if (token) {
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (data.username || data.name) setUser(data); })
        .catch(() => {});
    }
  }, []);

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '30', sort: sortBy });
    if (searchQuery) params.set('search', searchQuery);
    if (filterRailroad) params.set('railroad', filterRailroad);
    if (filterTag) params.set('tag', filterTag);
    if (filterHeritage) params.set('heritage', 'true');

    try {
      const res = await fetch(`/api/roundhouse?${params}`);
      const data = await res.json();
      if (data.ok) {
        setPhotos(data.photos || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Fetch roundhouse error:', e);
    }
    setLoading(false);
  }, [page, searchQuery, filterRailroad, filterTag, filterHeritage, sortBy]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Stats
  useEffect(() => {
    fetch('/api/roundhouse?action=stats')
      .then(r => r.json())
      .then(data => { if (data.ok) setStats(data); })
      .catch(() => {});
  }, []);

  // Debounced search
  const handleSearchInput = (val) => {
    setSearchInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val);
      setPage(1);
    }, 400);
  };

  // Heritage detection on loco number change
  const handleLocoChange = async (val) => {
    setFormData(f => ({ ...f, locomotive_numbers: val }));
    if (val.length > 3) {
      try {
        const res = await fetch(`/api/roundhouse?action=detect_heritage&locomotives=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.ok && data.isHeritage) {
          setHeritageDetected(data.units);
          // Auto-add heritage tag
          setFormData(f => ({
            ...f,
            tags: f.tags.includes('heritage') ? f.tags : [...f.tags, 'heritage'],
          }));
        } else {
          setHeritageDetected(null);
        }
      } catch (e) {
        // Ignore detection errors
      }
    } else {
      setHeritageDetected(null);
    }
  };

  // Image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Submit photo
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imagePreview) { alert('Please select an image'); return; }
    if (!formData.railroad) { alert('Railroad is required'); return; }
    setSubmitting(true);
    const token = localStorage.getItem('railstream_token');

    try {
      // Step 1: Create photo entry
      const createRes = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'create', ...formData }),
      });
      const createData = await createRes.json();

      if (!createData.ok) {
        alert(createData.error || 'Failed to create');
        setSubmitting(false);
        return;
      }

      // Step 2: Upload image
      const uploadRes = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'upload_image', photo_id: createData.photo.id, image_data: imagePreview }),
      });
      const uploadData = await uploadRes.json();

      if (uploadData.ok) {
        setShowUpload(false);
        setFormData({ railroad: '', locomotive_numbers: '', location: '', source: 'trackside', tags: [], title: '', description: '' });
        setImageFile(null);
        setImagePreview(null);
        setHeritageDetected(null);
        fetchPhotos();
      } else {
        alert('Photo created but image upload failed');
      }
    } catch (err) {
      alert('Network error');
    }
    setSubmitting(false);
  };

  // Like photo
  const handleLike = async (photoId) => {
    const token = localStorage.getItem('railstream_token');
    if (!token) return;

    try {
      const res = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'like', photo_id: photoId }),
      });
      const data = await res.json();
      if (data.ok) {
        setPhotos(prev => prev.map(p =>
          p.id === photoId ? { ...p, likes: data.likes, liked_by: data.liked ? [...(p.liked_by || []), user?.username] : (p.liked_by || []).filter(u => u !== user?.username) } : p
        ));
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(prev => prev ? { ...prev, likes: data.likes, liked_by: data.liked ? [...(prev.liked_by || []), user?.username] : (prev.liked_by || []).filter(u => u !== user?.username) } : null);
        }
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  // Delete photo
  const handleDelete = async (photoId) => {
    if (!confirm('Delete this photo?')) return;
    const token = localStorage.getItem('railstream_token');
    try {
      const res = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', photo_id: photoId }),
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedPhoto(null);
        fetchPhotos();
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const isPaidMember = user && ['conductor', 'engineer', 'fireman', 'development', 'admin'].includes(user.tier || user.membership_tier);
  const activeFilters = [filterRailroad, filterTag, filterHeritage ? 'yes' : ''].filter(Boolean).length + (searchQuery ? 1 : 0);

  const toggleTag = (tagId) => {
    setFormData(f => ({
      ...f,
      tags: f.tags.includes(tagId) ? f.tags.filter(t => t !== tagId) : [...f.tags, tagId],
    }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <SiteHeader currentPage="roundhouse" user={user} />

      {/* ====== HERO ====== */}
      <div className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <img
            src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1920&q=80"
            alt="" className="w-full h-[550px] object-cover opacity-25"
            style={{ objectPosition: 'center 60%' }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-[#050505]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]">
          <div className="h-full bg-gradient-to-r from-transparent via-[#ff7a00]/40 to-transparent" />
        </div>

        <div ref={heroRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20"
          style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/20 mb-6">
                <Camera className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span className="text-[#ff7a00] text-xs font-semibold tracking-wide uppercase">Photo Archives</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
                <span className="text-white">The</span>{' '}
                <span className="bg-gradient-to-r from-[#ff7a00] to-[#ff9a40] bg-clip-text text-transparent">Roundhouse</span>
              </h1>
              <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-lg">
                The community's rail photo vault. Camera captures, trackside shots, and heritage unit archives — all searchable, all in one place.
              </p>

              {/* Search bar in hero */}
              <div className="relative mt-8 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Search by locomotive, railroad, location..."
                  className="w-full bg-white/[0.05] border border-white/[0.08] text-white text-sm rounded-xl pl-12 pr-4 py-4 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/25"
                />
                {searchInput && (
                  <button onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {isPaidMember && (
              <button
                onClick={() => { setShowUpload(true); setHeritageDetected(null); setFormData({ railroad: '', locomotive_numbers: '', location: '', source: 'trackside', tags: [], title: '', description: '' }); setImageFile(null); setImagePreview(null); }}
                className="group relative flex items-center gap-3 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] hover:from-[#ff8c20] hover:to-[#ff6620] text-white px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-[#ff7a00]/20 hover:shadow-[#ff7a00]/40 self-start md:self-auto"
              >
                <Upload className="w-5 h-5" />
                <span>Add to Archive</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* ====== STATS ====== */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10 -mt-4">
            <StatCard icon={Camera} label="Total Photos" value={stats.total || 0} delay={0} />
            <StatCard icon={Star} label="Heritage Captures" value={stats.heritage_count || 0} valueColor="text-amber-400" delay={100} />
            <StatCard icon={Flame} label="Added Today" value={stats.today || 0} valueColor="text-[#ff7a00]" delay={200} />
            <StatCard icon={Trophy} label="Top Contributor" value={stats.top_contributors?.[0]?.username || '—'}
              subtitle={stats.top_contributors?.[0] ? `${stats.top_contributors[0].count} photos` : null} delay={300} />
          </div>
        )}

        {/* ====== FILTERS ====== */}
        <div className="mb-8 space-y-4">
          {/* Railroad chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setFilterRailroad(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${!filterRailroad ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]'}`}>
              All
            </button>
            {RAILROADS.filter(r => r !== 'Other').map(r => {
              const rr = RR_COLORS[r];
              const active = filterRailroad === r;
              return (
                <button key={r} onClick={() => { setFilterRailroad(active ? '' : r); setPage(1); }}
                  className="px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 border"
                  style={active ? { background: rr.bg, color: rr.text, borderColor: rr.bg, boxShadow: `0 4px 16px ${rr.glow}` }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  {r}
                </button>
              );
            })}

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Heritage filter */}
            <button onClick={() => { setFilterHeritage(!filterHeritage); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 border flex items-center gap-1.5 ${
                filterHeritage ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-white/[0.04] text-white/50 border-white/[0.06] hover:bg-white/[0.08]'}`}>
              <span>👑</span> Heritage
            </button>
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap items-center gap-2">
            {PHOTO_TAGS.filter(t => t.id !== 'heritage').map(tag => {
              const active = filterTag === tag.id;
              return (
                <button key={tag.id} onClick={() => { setFilterTag(active ? '' : tag.id); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 border flex items-center gap-1.5 ${
                    active ? 'border-white/20 text-white bg-white/[0.08]' : 'border-white/[0.04] text-white/30 hover:text-white/50 hover:border-white/[0.08] bg-transparent'}`}>
                  <span>{tag.icon}</span> {tag.label}
                </button>
              );
            })}

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Sort */}
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-white/[0.04] border border-white/[0.06] text-white/50 text-[11px] font-semibold rounded-lg px-3 py-1.5 focus:outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_liked">Most Liked</option>
            </select>

            {activeFilters > 0 && (
              <button onClick={() => { setSearchInput(''); setSearchQuery(''); setFilterRailroad(''); setFilterTag(''); setFilterHeritage(false); setPage(1); }}
                className="flex items-center gap-1.5 text-[#ff7a00]/60 hover:text-[#ff7a00] text-xs font-medium transition-colors ml-2">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ====== PHOTO GRID (Masonry) ====== */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-[#ff7a00]/10 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-[#ff7a00] rounded-full animate-spin" />
              <Camera className="absolute inset-0 m-auto w-6 h-6 text-[#ff7a00]/40" />
            </div>
            <p className="text-white/30 mt-6 text-sm font-medium">Loading The Roundhouse...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#ff7a00]/[0.02] via-transparent to-transparent rounded-3xl" />
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                <Camera className="w-10 h-10 text-white/10" />
              </div>
              <p className="text-white/50 text-xl font-semibold">
                {searchQuery ? 'No photos found' : 'The Roundhouse is empty'}
              </p>
              <p className="text-white/30 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                {searchQuery ? `No results for "${searchQuery}". Try a different search.` : 'Be the first to archive a rail photo! Camera captures and trackside shots welcome.'}
              </p>
              {isPaidMember && !searchQuery && (
                <button onClick={() => setShowUpload(true)}
                  className="mt-8 inline-flex items-center gap-2.5 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#ff7a00]/20">
                  <Upload className="w-4 h-4" /> Add First Photo
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 rounded-full bg-[#ff7a00]" />
              <p className="text-white/40 text-sm font-medium">
                <span className="text-white/70 font-semibold">{total}</span> photo{total !== 1 ? 's' : ''} {searchQuery ? `matching "${searchQuery}"` : 'archived'}
              </p>
            </div>

            {/* Masonry grid using CSS columns */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {photos.map((photo, idx) => {
                const rrStyle = RR_COLORS[photo.railroad] || RR_COLORS.Other;
                const isLiked = photo.liked_by?.includes(user?.username);
                const isOwn = user && photo.username === (user.username || user.name);

                return (
                  <div
                    key={photo.id}
                    className={`group relative break-inside-avoid rounded-xl overflow-hidden border transition-all duration-500 cursor-pointer hover:shadow-xl hover:shadow-black/30 ${
                      photo.is_heritage
                        ? 'border-amber-500/30 hover:border-amber-400/50 shadow-lg shadow-amber-500/10'
                        : 'border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                    onClick={() => setSelectedPhoto(photo)}
                    style={{
                      animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(idx * 60, 300)}ms both`,
                    }}
                  >
                    <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                    {/* Heritage badge */}
                    {photo.is_heritage && (
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-sm text-black text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/30">
                        <span>👑</span> Heritage
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative overflow-hidden">
                      {photo.image_url ? (
                        <img src={photo.image_url} alt={photo.title || `${photo.railroad} ${photo.locomotive_numbers}`}
                          className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          style={{ minHeight: '180px', maxHeight: '400px' }}
                          onError={(e) => { e.target.src = ''; e.target.className = 'w-full h-48 bg-white/[0.03]'; }} />
                      ) : (
                        <div className="w-full h-48 bg-white/[0.03] flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white/10" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="flex items-center gap-3 w-full">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLike(photo.id); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-400' : ''}`} />
                            {photo.likes || 0}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition-all">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3.5 bg-[#0a0a0a]">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider"
                          style={{ background: rrStyle.bg, color: rrStyle.text, boxShadow: `0 2px 6px ${rrStyle.glow}` }}>
                          {photo.railroad}
                        </span>
                        {photo.locomotive_numbers && (
                          <span className="text-white font-bold text-xs truncate">{photo.locomotive_numbers}</span>
                        )}
                      </div>
                      {photo.title && (
                        <p className="text-white/70 text-sm font-medium truncate mb-1">{photo.title}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-white/30">
                        {photo.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" /> {photo.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {/* Tags */}
                      {photo.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {photo.tags.map(t => {
                            const tagInfo = PHOTO_TAGS.find(pt => pt.id === t);
                            return tagInfo ? (
                              <span key={t} className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                {tagInfo.icon} {tagInfo.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      {/* Author + likes */}
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center text-[8px] font-bold text-white/30">
                            {(photo.username || '?')[0].toUpperCase()}
                          </div>
                          <span className="text-white/40 text-[11px]">{photo.username}</span>
                          {photo.source === 'camera_capture' && (
                            <span className="text-[9px] text-[#ff7a00]/50 bg-[#ff7a00]/5 px-1.5 py-0.5 rounded font-semibold">CAM</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-white/20 text-[11px]">
                          <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                          {photo.likes || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ====== PAGINATION ====== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-white/[0.04]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-2 text-white/40 hover:text-white disabled:text-white/10 transition-all text-sm px-5 py-3 rounded-xl hover:bg-white/[0.03] font-medium">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-1.5 px-3">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let n;
                if (totalPages <= 5) n = i + 1;
                else if (page <= 3) n = i + 1;
                else if (page >= totalPages - 2) n = totalPages - 4 + i;
                else n = page - 2 + i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-300 ${page === n ? 'bg-[#ff7a00] text-white shadow-lg shadow-[#ff7a00]/20' : 'text-white/40 hover:text-white hover:bg-white/[0.04]'}`}>
                    {n}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-2 text-white/40 hover:text-white disabled:text-white/10 transition-all text-sm px-5 py-3 rounded-xl hover:bg-white/[0.03] font-medium">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====== BOTTOM CTA ====== */}
        {!isPaidMember && (
          <div className="mt-16 relative overflow-hidden rounded-2xl border border-white/[0.06]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff7a00]/[0.08] via-transparent to-[#ff5500]/[0.05]" />
            <div className="relative px-8 py-10 text-center">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Join The Roundhouse</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Subscribe to archive your rail photos, save camera captures, and contribute to the community collection.
              </p>
              <Link href="/pricing" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff5500] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#ff7a00]/20">
                <Zap className="w-4 h-4" /> View Plans
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ====== UPLOAD MODAL ====== */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()} style={{ animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>

            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-[#0f0f0f] z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-[#ff7a00]" />
                </div>
                Add to The Roundhouse
              </h2>
              <button onClick={() => setShowUpload(false)} className="text-white/30 hover:text-white transition p-2 rounded-xl hover:bg-white/[0.06]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Photo *</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                    <img src={imagePreview} alt="Preview" className="w-full aspect-video object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/70 backdrop-blur-sm text-white/50 hover:text-white transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-white/[0.06] hover:border-[#ff7a00]/20 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 group hover:bg-[#ff7a00]/[0.02]">
                    <Upload className="w-6 h-6 text-white/20 group-hover:text-[#ff7a00]/40 transition-colors" />
                    <span className="text-white/30 text-xs group-hover:text-white/50">Click to upload (max 10MB)</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>

              {/* Source toggle */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Source</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'trackside', label: 'Trackside Photo', icon: '🚶' },
                    { id: 'camera_capture', label: 'Camera Capture', icon: '📸' },
                  ].map(s => (
                    <button key={s.id} type="button"
                      onClick={() => setFormData(f => ({ ...f, source: s.id }))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                        formData.source === s.id ? 'bg-[#ff7a00]/10 border-[#ff7a00]/30 text-[#ff7a00]' : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60'}`}>
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Railroad */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Railroad *</label>
                <select value={formData.railroad} onChange={e => setFormData(f => ({ ...f, railroad: e.target.value }))} required
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all">
                  <option value="">Select...</option>
                  {RAILROADS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Locomotive Numbers + Heritage detection */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Locomotive Number(s)</label>
                <input type="text" value={formData.locomotive_numbers}
                  onChange={e => handleLocoChange(e.target.value)}
                  placeholder="e.g., NS 1073, NS 9254"
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15" />
                {/* Heritage auto-detection banner */}
                {heritageDetected && heritageDetected.length > 0 && (
                  <div className="mt-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    <div>
                      <p className="text-amber-400 text-xs font-bold">Heritage Unit Detected!</p>
                      <p className="text-amber-400/60 text-[11px]">
                        {heritageDetected.map(u => `${u.unit} — ${u.name}`).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title + Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Title</label>
                  <input type="text" value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., NS Heritage on Q335"
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15" />
                </div>
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Location</label>
                  <input type="text" value={formData.location}
                    onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., Fostoria, Ohio"
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {PHOTO_TAGS.map(tag => {
                    const active = formData.tags.includes(tag.id);
                    return (
                      <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all border flex items-center gap-1.5 ${
                          active ? 'border-white/20 text-white bg-white/[0.08]' : 'border-white/[0.04] text-white/30 hover:text-white/50 bg-transparent'}`}>
                        <span>{tag.icon}</span> {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Description</label>
                <textarea value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell the story behind this photo..."
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/15 resize-none" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-[#ff7a00] to-[#ff5500] hover:from-[#ff8c20] hover:to-[#ff6620] disabled:from-[#ff7a00]/30 disabled:to-[#ff5500]/30 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ff7a00]/10 hover:shadow-[#ff7a00]/30">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Add to The Roundhouse</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====== PHOTO LIGHTBOX ====== */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)} style={{ animation: 'modalIn 0.2s ease-out' }}>
          <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Heritage banner */}
            {selectedPhoto.is_heritage && (
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/20 rounded-t-xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="text-amber-400 text-sm font-bold">Heritage Unit</p>
                  <p className="text-amber-400/60 text-xs">{selectedPhoto.heritage_info || 'Special heritage paint scheme locomotive'}</p>
                </div>
              </div>
            )}

            {/* Image */}
            <div className={`relative ${selectedPhoto.is_heritage ? '' : 'rounded-t-xl'} overflow-hidden`}>
              {selectedPhoto.image_url ? (
                <img src={selectedPhoto.image_url} alt={selectedPhoto.title || 'Rail photo'}
                  className="w-full max-h-[60vh] object-contain bg-black" />
              ) : (
                <div className="w-full h-64 bg-white/[0.03] flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white/10" />
                </div>
              )}
            </div>

            {/* Details panel */}
            <div className="bg-[#0a0a0a] border border-white/[0.08] border-t-0 rounded-b-xl px-6 py-5">
              {/* Title + Railroad */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                      style={{ background: (RR_COLORS[selectedPhoto.railroad] || RR_COLORS.Other).bg, color: (RR_COLORS[selectedPhoto.railroad] || RR_COLORS.Other).text, boxShadow: `0 2px 8px ${(RR_COLORS[selectedPhoto.railroad] || RR_COLORS.Other).glow}` }}>
                      {selectedPhoto.railroad}
                    </span>
                    {selectedPhoto.locomotive_numbers && (
                      <span className="text-white font-bold text-base">{selectedPhoto.locomotive_numbers}</span>
                    )}
                    {selectedPhoto.source === 'camera_capture' && (
                      <span className="text-[10px] text-[#ff7a00] bg-[#ff7a00]/10 px-2 py-1 rounded font-bold uppercase">Camera Capture</span>
                    )}
                    {selectedPhoto.source === 'trackside' && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-bold uppercase">Trackside</span>
                    )}
                  </div>
                  {selectedPhoto.title && (
                    <h3 className="text-white text-lg font-semibold">{selectedPhoto.title}</h3>
                  )}
                </div>

                {/* Like button */}
                <button onClick={() => handleLike(selectedPhoto.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    selectedPhoto.liked_by?.includes(user?.username)
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08]'}`}>
                  <Heart className={`w-4 h-4 ${selectedPhoto.liked_by?.includes(user?.username) ? 'fill-red-400' : ''}`} />
                  {selectedPhoto.likes || 0}
                </button>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                {selectedPhoto.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-white/20" />{selectedPhoto.location}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/20" />
                  {new Date(selectedPhoto.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {new Date(selectedPhoto.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>

              {/* Tags */}
              {selectedPhoto.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedPhoto.tags.map(t => {
                    const tagInfo = PHOTO_TAGS.find(pt => pt.id === t);
                    return tagInfo ? (
                      <span key={t} className="text-[11px] text-white/40 bg-white/[0.04] px-2 py-1 rounded-lg">
                        {tagInfo.icon} {tagInfo.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Description */}
              {selectedPhoto.description && (
                <p className="text-white/50 text-sm leading-relaxed mt-3 border-l-2 border-[#ff7a00]/30 pl-3 italic">{selectedPhoto.description}</p>
              )}

              {/* Heritage info */}
              {selectedPhoto.heritage_units?.length > 0 && (
                <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-amber-400/80 text-xs font-semibold mb-1">Heritage Details</p>
                  {selectedPhoto.heritage_units.map((u, i) => (
                    <p key={i} className="text-amber-400/50 text-xs">{u.unit} — {u.name} ({u.scheme})</p>
                  ))}
                </div>
              )}

              {/* Author + actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-white/30">
                    {(selectedPhoto.username || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-white/50 text-sm font-medium">{selectedPhoto.username}</span>
                </div>
                {(user && (selectedPhoto.username === (user.username || user.name) || user.is_admin)) && (
                  <button onClick={() => handleDelete(selectedPhoto.id)}
                    className="text-red-400/50 hover:text-red-400 text-xs transition-colors">
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Close button */}
            <button onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/50 backdrop-blur-sm text-white/50 hover:text-white transition-colors border border-white/[0.1]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
