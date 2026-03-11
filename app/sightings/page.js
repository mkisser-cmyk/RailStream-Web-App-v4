'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import {
  Train, Calendar, MapPin, Clock, Plus, Search, ChevronLeft, ChevronRight,
  Play, Edit2, Trash2, X, Filter, Camera, ArrowUpRight, Eye, Image,
  TrendingUp, Award, BarChart3, ChevronDown, Upload
} from 'lucide-react';

const RAILROADS = ['CSX', 'NS', 'UP', 'BNSF', 'CN', 'CP', 'KCS', 'Amtrak', 'Other'];
const TRAIN_TYPES = ['Intermodal', 'Manifest', 'Coal', 'Grain', 'Auto', 'Passenger', 'Local', 'Work Train', 'Light Power', 'Other'];
const DIRECTIONS = ['Eastbound', 'Westbound', 'Northbound', 'Southbound'];

// Railroad brand colors with text contrast
const RR_COLORS = {
  CSX: { bg: '#0033A0', text: '#fff' },
  NS: { bg: '#1a1a1a', text: '#fff', border: '#444' },
  UP: { bg: '#FFD100', text: '#000' },
  BNSF: { bg: '#FF6600', text: '#fff' },
  CN: { bg: '#E21836', text: '#fff' },
  CP: { bg: '#E21836', text: '#fff' },
  KCS: { bg: '#006747', text: '#fff' },
  Amtrak: { bg: '#1B3A6B', text: '#fff' },
  Other: { bg: '#444', text: '#fff' },
};

export default function SightingsPage() {
  const [sightings, setSightings] = useState([]);
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState(null);

  // Filters
  const [filterCamera, setFilterCamera] = useState('');
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

  // Editing
  const [editingId, setEditingId] = useState(null);

  // Expanded image
  const [expandedImage, setExpandedImage] = useState(null);

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
    if (filterCamera) params.set('camera_id', filterCamera);
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
  }, [page, filterCamera, filterDate, filterRailroad]);

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
        // Upload image if we have one and this is a new sighting
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
    setFormData({
      camera_id: s.camera_id, sighting_time: s.sighting_time?.slice(0, 16) || '',
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
    // DVR supports 7 days (604800 seconds)
    if (secsAgo > 604800 || secsAgo < 0) return null;
    return `/?watch=${s.camera_id}&seek=${secsAgo}`;
  };

  const isPaidMember = user && ['conductor', 'engineer', 'fireman', 'development', 'admin'].includes(user.tier || user.membership_tier);
  const activeFilters = [filterCamera, filterDate, filterRailroad].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader currentPage="sightings" user={user} />

      {/* Hero Section */}
      <div className="pt-16">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff7a00]/10 via-black to-black" />
          <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff7a00]/20 flex items-center justify-center">
                    <Train className="w-5 h-5 text-[#ff7a00]" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Train Sightings</h1>
                </div>
                <p className="text-white/70 text-base md:text-lg max-w-xl">
                  Community-driven train log. Spot something? Log it for the community.
                </p>
              </div>
              {isPaidMember && (
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setFormData({ camera_id: '', sighting_time: new Date().toISOString().slice(0, 16), railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="flex items-center gap-2 bg-[#ff7a00] hover:bg-[#ff8c20] text-white px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20 self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" /> Log Sighting
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
            <div className="bg-zinc-900/80 border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/10 transition">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-white/60" />
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Total Sightings</p>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white tabular-nums">{stats.total?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-zinc-900/80 border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/10 transition">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#ff7a00]/50" />
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Today</p>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-[#ff7a00] tabular-nums">{stats.today?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-zinc-900/80 border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/10 transition">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-white/60" />
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Top Railroad</p>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{stats.top_railroads?.[0]?.name || '—'}</p>
              {stats.top_railroads?.[0] && <p className="text-white/60 text-xs mt-1">{stats.top_railroads[0].count} sightings</p>}
            </div>
            <div className="bg-zinc-900/80 border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/10 transition">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-white/60" />
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Top Location</p>
              </div>
              <p className="text-lg md:text-xl font-bold text-white truncate">{stats.top_locations?.[0]?.name || '—'}</p>
              {stats.top_locations?.[0] && <p className="text-white/60 text-xs mt-1">{stats.top_locations[0].count} sightings</p>}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {stats?.leaderboard && stats.leaderboard.length > 0 && (
          <div className="bg-zinc-900/80 border border-white/[0.06] rounded-xl mb-8 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2.5">
              <Award className="w-4 h-4 text-[#ff7a00]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Spotters</h2>
              <span className="text-white/60 text-xs ml-auto">10 pts per sighting</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-white/[0.04]">
              {stats.leaderboard.slice(0, 5).map((entry, idx) => {
                const medals = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze
                const isMe = user && (entry.username === user.username || entry.username === user.name);
                return (
                  <div
                    key={entry.username}
                    className={`px-4 py-3.5 flex items-center gap-3 ${isMe ? 'bg-[#ff7a00]/5' : ''} ${idx === 0 ? 'bg-gradient-to-r from-[#ff7a00]/[0.08] to-transparent' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      idx < 3
                        ? 'text-black'
                        : 'bg-white/[0.06] text-white/70'
                    }`}
                      style={idx < 3 ? { background: medals[idx] } : {}}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#ff7a00]' : 'text-white'}`}>
                        {entry.username}
                        {isMe && <span className="text-[10px] text-[#ff7a00]/60 ml-1.5">(you)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/60 text-[11px]">{entry.sightings} sighting{entry.sightings !== 1 ? 's' : ''}</span>
                        <span className="text-[#ff7a00]/60 text-[11px] font-bold">{entry.points} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="mb-6">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filtersOpen || activeFilters > 0
                ? 'bg-[#ff7a00]/10 text-[#ff7a00] border border-[#ff7a00]/20'
                : 'bg-zinc-900/80 text-white/60 hover:text-white border border-white/[0.06] hover:border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ff7a00] text-white text-xs flex items-center justify-center font-bold">{activeFilters}</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {filtersOpen && (
            <div className="mt-3 bg-zinc-900/80 border border-white/[0.06] rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={filterCamera}
                  onChange={(e) => { setFilterCamera(e.target.value); setPage(1); }}
                  className="bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                >
                  <option value="">All Locations</option>
                  {cameras.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                  className="bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                />
                <select
                  value={filterRailroad}
                  onChange={(e) => { setFilterRailroad(e.target.value); setPage(1); }}
                  className="bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                >
                  <option value="">All Railroads</option>
                  {RAILROADS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setFilterCamera(''); setFilterDate(''); setFilterRailroad(''); setPage(1); }}
                    className="text-[#ff7a00] hover:text-[#ff8c20] text-sm font-medium transition flex items-center gap-1.5 justify-center"
                  >
                    <X className="w-3.5 h-3.5" /> Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sightings List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#ff7a00]/20 border-t-[#ff7a00] rounded-full animate-spin" />
            <p className="text-white/70 mt-4 text-sm">Loading sightings...</p>
          </div>
        ) : sightings.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Train className="w-8 h-8 text-white/15" />
            </div>
            <p className="text-white/70 text-lg font-medium">No sightings found</p>
            <p className="text-white/60 text-sm mt-1.5 max-w-md mx-auto">
              {activeFilters > 0 ? 'Try adjusting your filters.' : 'Be the first to log a train sighting!'}
            </p>
            {isPaidMember && activeFilters === 0 && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                  setFormData({ camera_id: '', sighting_time: new Date().toISOString().slice(0, 16), railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
                }}
                className="mt-6 inline-flex items-center gap-2 bg-[#ff7a00] hover:bg-[#ff8c20] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition"
              >
                <Plus className="w-4 h-4" /> Log First Sighting
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60 text-sm">
                {total} sighting{total !== 1 ? 's' : ''} {activeFilters > 0 ? 'matched' : 'total'}
              </p>
            </div>

            <div className="space-y-3">
              {sightings.map(s => {
                const replayUrl = getReplayUrl(s);
                const isOwn = user && (s.user === user.username || s.user === user.name);
                const sightDate = new Date(s.sighting_time);
                const rrStyle = RR_COLORS[s.railroad] || RR_COLORS.Other;
                const hasImage = s.image_url || s.imageUrl;

                return (
                  <div key={s._id} className="group bg-zinc-900/60 border border-white/[0.06] rounded-xl hover:border-white/10 transition-all">
                    <div className="flex">
                      {/* Snapshot Image */}
                      {hasImage && (
                        <div
                          className="w-40 md:w-52 flex-shrink-0 relative cursor-pointer overflow-hidden rounded-l-xl"
                          onClick={() => setExpandedImage(hasImage)}
                        >
                          <img
                            src={hasImage}
                            alt={`${s.railroad} ${s.train_id || 'train'}`}
                            className="w-full h-full object-cover min-h-[120px] hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                          <div className="absolute bottom-2 left-2 p-1 rounded bg-black/60 backdrop-blur-sm">
                            <Eye className="w-3 h-3 text-white/70" />
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Top row: Railroad badge + Train ID + Direction */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span
                                className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                                style={{
                                  background: rrStyle.bg,
                                  color: rrStyle.text,
                                  border: rrStyle.border ? `1px solid ${rrStyle.border}` : 'none',
                                }}
                              >
                                {s.railroad}
                              </span>
                              {s.train_id && (
                                <span className="text-white font-semibold text-sm">{s.train_id}</span>
                              )}
                              {s.train_type && (
                                <span className="text-white/35 text-xs">• {s.train_type}</span>
                              )}
                              {s.direction && (
                                <span className="text-white/70 text-xs bg-white/[0.06] px-2 py-0.5 rounded-md font-medium">{s.direction}</span>
                              )}
                            </div>

                            {/* Location + Time */}
                            <div className="flex items-center gap-4 text-xs text-white/70 mb-2">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                <span className="text-white/60">{s.camera_name || s.location || 'Unknown'}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span>{sightDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span className="text-white/60">at</span>
                                <span>{sightDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                              </span>
                            </div>

                            {/* Locomotives */}
                            {s.locomotives && (
                              <p className="text-white/70 text-xs mb-1">
                                <span className="text-white/60 font-medium">Locos:</span>{' '}
                                <span className="text-white/70 font-mono text-[11px]">{s.locomotives}</span>
                              </p>
                            )}

                            {/* Notes */}
                            {s.notes && (
                              <p className="text-white/70 text-xs mt-1.5 italic leading-relaxed line-clamp-2">{s.notes}</p>
                            )}

                            {/* Posted by */}
                            <p className="text-white/60 text-[11px] mt-2.5">
                              by <span className="text-white/70 font-medium">{s.user}</span>
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

                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            {replayUrl && (
                              <Link
                                href={replayUrl}
                                className="flex items-center gap-1.5 bg-[#ff7a00]/90 hover:bg-[#ff7a00] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:scale-[1.02]"
                                title="Watch replay at this time"
                              >
                                <Play className="w-3 h-3" fill="white" /> Replay
                              </Link>
                            )}
                            {isOwn && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEdit(s)}
                                  className="flex items-center gap-1 text-white/60 hover:text-[#ff7a00] text-[11px] transition px-2 py-1.5 rounded hover:bg-white/5"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(s._id)}
                                  className="flex items-center gap-1 text-white/60 hover:text-red-400 text-[11px] transition px-2 py-1.5 rounded hover:bg-white/5"
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
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 text-white/70 hover:text-white disabled:text-white/15 transition text-sm px-4 py-2.5 rounded-xl hover:bg-white/5 disabled:hover:bg-transparent font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-1 px-3">
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
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === pageNum ? 'bg-[#ff7a00] text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
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
              className="flex items-center gap-1.5 text-white/70 hover:text-white disabled:text-white/15 transition text-sm px-4 py-2.5 rounded-xl hover:bg-white/5 disabled:hover:bg-transparent font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* New/Edit Sighting Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Train className="w-5 h-5 text-[#ff7a00]" />
                {editingId ? 'Edit Sighting' : 'Log Train Sighting'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label htmlFor="sighting-img" className="block text-white/70 text-sm mb-1.5 font-medium">Snapshot (optional)</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={imagePreview} alt="Snapshot preview" className="w-full aspect-video object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white/70 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-white/10 hover:border-[#ff7a00]/30 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors group"
                  >
                    <Upload className="w-5 h-5 text-white/60 group-hover:text-[#ff7a00]/50 transition" />
                    <span className="text-white/60 text-xs group-hover:text-white/70 transition">Click to upload a snapshot</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>

              {/* Camera */}
              <div>
                <label htmlFor="sighting-cam" className="block text-white/70 text-sm mb-1.5 font-medium">Camera Location *</label>
                <select
                  value={formData.camera_id}
                  onChange={e => setFormData(f => ({ ...f, camera_id: e.target.value }))}
                  required
                  className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                >
                  <option value="">Select a camera...</option>
                  {cameras.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date/Time */}
              <div>
                <label htmlFor="sighting-dt" className="block text-white/70 text-sm mb-1.5 font-medium">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.sighting_time}
                  onChange={e => setFormData(f => ({ ...f, sighting_time: e.target.value }))}
                  required
                  className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                />
              </div>

              {/* Railroad + Train Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="form-railroad" className="block text-white/70 text-sm mb-1.5 font-medium">Railroad *</label>
                  <select
                    value={formData.railroad}
                    onChange={e => setFormData(f => ({ ...f, railroad: e.target.value }))}
                    required
                    className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                  >
                    <option value="">Select...</option>
                    {RAILROADS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="form-traintype" className="block text-white/70 text-sm mb-1.5 font-medium">Train Type</label>
                  <select
                    value={formData.train_type}
                    onChange={e => setFormData(f => ({ ...f, train_type: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
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
                  <label htmlFor="form-trainid" className="block text-white/70 text-sm mb-1.5 font-medium">Train ID / Symbol</label>
                  <input
                    type="text"
                    value={formData.train_id}
                    onChange={e => setFormData(f => ({ ...f, train_id: e.target.value }))}
                    placeholder="e.g., Q335, N956"
                    className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/60"
                  />
                </div>
                <div>
                  <label htmlFor="form-direction" className="block text-white/70 text-sm mb-1.5 font-medium">Direction</label>
                  <select
                    value={formData.direction}
                    onChange={e => setFormData(f => ({ ...f, direction: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
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
                <label htmlFor="form-locos" className="block text-white/70 text-sm mb-1.5 font-medium">Locomotive(s)</label>
                <input
                  type="text"
                  value={formData.locomotives}
                  onChange={e => setFormData(f => ({ ...f, locomotives: e.target.value }))}
                  placeholder="e.g., CSX 3194, CSX 812"
                  className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/60"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="form-notes" className="block text-white/70 text-sm mb-1.5 font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Horn, meets, rare power, DPU, etc."
                  rows={2}
                  className="w-full bg-black/60 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/60 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ff7a00] hover:bg-[#ff8c20] disabled:bg-[#ff7a00]/40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Sighting' : 'Log Sighting'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Image Lightbox */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setExpandedImage(null)}>
          <div className="relative max-w-4xl w-full">
            <img
              src={expandedImage}
              alt="Sighting snapshot"
              className="w-full rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 text-white/70 hover:text-white transition backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
