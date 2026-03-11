'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Train, Calendar, MapPin, Clock, Plus, Search, ChevronLeft, ChevronRight, Play, Edit2, Trash2, X, Filter } from 'lucide-react';

const RAILROADS = ['CSX', 'NS', 'UP', 'BNSF', 'CN', 'CP', 'KCS', 'Amtrak', 'Other'];
const TRAIN_TYPES = ['Intermodal', 'Manifest', 'Coal', 'Grain', 'Auto', 'Passenger', 'Local', 'Work Train', 'Light Power', 'Other'];
const DIRECTIONS = ['Eastbound', 'Westbound', 'Northbound', 'Southbound'];

// Railroad brand colors
const RR_COLORS = {
  CSX: '#0033A0', NS: '#000000', UP: '#FFD100', BNSF: '#FF6600',
  CN: '#E21836', CP: '#E21836', KCS: '#006747', Amtrak: '#1B3A6B', Other: '#666',
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

  // New sighting form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    camera_id: '', sighting_time: '', railroad: '', train_id: '',
    direction: '', locomotives: '', train_type: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Editing
  const [editingId, setEditingId] = useState(null);

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
    const params = new URLSearchParams({ page: page.toString(), limit: '25' });
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
        setShowForm(false);
        setEditingId(null);
        setFormData({ camera_id: '', sighting_time: '', railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
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
    setShowForm(true);
  };

  // Jump to replay URL
  const getReplayUrl = (s) => {
    const sightingTs = new Date(s.sighting_time).getTime() / 1000;
    const now = Date.now() / 1000;
    const secsAgo = Math.floor(now - sightingTs);
    // DVR window is typically 2 hours (7200s)
    if (secsAgo > 7200) return null;
    return `/?watch=${s.camera_id}&seek=${secsAgo}`;
  };

  const isPaidMember = user && ['conductor', 'engineer', 'fireman', 'development', 'admin'].includes(user.tier || user.membership_tier);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="https://railstream.net/images/Homepage/WebsiteLogo.png" alt="RailStream" className="h-8" />
            </Link>
            <span className="text-white/30 text-lg">/</span>
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-[#ff7a00]" />
              <h1 className="text-xl font-bold">Train Sightings Log</h1>
            </div>
          </div>
          {isPaidMember && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setFormData({ camera_id: '', sighting_time: new Date().toISOString().slice(0, 16), railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' }); }}
              className="flex items-center gap-2 bg-[#ff7a00] hover:bg-[#ff8c20] text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
            >
              <Plus className="w-4 h-4" /> Log Sighting
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wide">Total Sightings</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total?.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wide">Today</p>
              <p className="text-3xl font-bold text-[#ff7a00] mt-1">{stats.today?.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wide">Top Railroad</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.top_railroads?.[0]?.name || '—'}</p>
              {stats.top_railroads?.[0] && <p className="text-white/40 text-xs">{stats.top_railroads[0].count} sightings</p>}
            </div>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wide">Top Location</p>
              <p className="text-lg font-bold text-white mt-1 truncate">{stats.top_locations?.[0]?.name || '—'}</p>
              {stats.top_locations?.[0] && <p className="text-white/40 text-xs">{stats.top_locations[0].count} sightings</p>}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-white/50" />
            <span className="text-white/70 text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={filterCamera}
              onChange={(e) => { setFilterCamera(e.target.value); setPage(1); }}
              className="bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#ff7a00] focus:outline-none"
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
              className="bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#ff7a00] focus:outline-none"
            />
            <select
              value={filterRailroad}
              onChange={(e) => { setFilterRailroad(e.target.value); setPage(1); }}
              className="bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#ff7a00] focus:outline-none"
            >
              <option value="">All Railroads</option>
              {RAILROADS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={() => { setFilterCamera(''); setFilterDate(''); setFilterRailroad(''); setPage(1); }}
              className="text-white/50 hover:text-white text-sm font-medium transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Sightings List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff7a00]/30 border-t-[#ff7a00] rounded-full animate-spin mx-auto" />
              <p className="text-white/50 mt-3">Loading sightings...</p>
            </div>
          ) : sightings.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1a1a] border border-white/10 rounded-xl">
              <Train className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-lg">No sightings yet</p>
              <p className="text-white/30 text-sm mt-1">Be the first to log a train sighting!</p>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-sm mb-2">{total} sighting{total !== 1 ? 's' : ''} found</p>
              {sightings.map(s => {
                const replayUrl = getReplayUrl(s);
                const isOwn = user && (s.user === user.username || s.user === user.name);
                const sightDate = new Date(s.sighting_time);
                return (
                  <div key={s._id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 hover:border-white/20 transition group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Top row: Railroad badge + Train ID */}
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="px-2.5 py-1 rounded-md text-white text-xs font-bold uppercase tracking-wide"
                            style={{ background: RR_COLORS[s.railroad] || '#666' }}
                          >
                            {s.railroad}
                          </span>
                          {s.train_id && (
                            <span className="text-white font-semibold">{s.train_id}</span>
                          )}
                          {s.train_type && (
                            <span className="text-white/40 text-sm">({s.train_type})</span>
                          )}
                          {s.direction && (
                            <span className="text-white/50 text-xs bg-white/10 px-2 py-0.5 rounded">{s.direction}</span>
                          )}
                        </div>

                        {/* Location + Time */}
                        <div className="flex items-center gap-4 text-sm text-white/60 mb-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {s.camera_name || s.location || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {sightDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '}
                            {sightDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>

                        {/* Locomotives */}
                        {s.locomotives && (
                          <p className="text-white/70 text-sm"><span className="text-white/40">Locos:</span> {s.locomotives}</p>
                        )}

                        {/* Notes */}
                        {s.notes && (
                          <p className="text-white/50 text-sm mt-1 italic">{s.notes}</p>
                        )}

                        {/* Posted by */}
                        <p className="text-white/30 text-xs mt-2">Logged by {s.user}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {replayUrl && (
                          <Link
                            href={replayUrl}
                            className="flex items-center gap-1.5 bg-[#ff7a00] hover:bg-[#ff8c20] text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                            title="Watch replay at this time"
                          >
                            <Play className="w-3.5 h-3.5" /> Replay
                          </Link>
                        )}
                        {isOwn && (
                          <>
                            <button onClick={() => startEdit(s)} className="flex items-center gap-1 text-white/30 hover:text-white text-xs transition opacity-0 group-hover:opacity-100">
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => handleDelete(s._id)} className="flex items-center gap-1 text-white/30 hover:text-red-400 text-xs transition opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-white/60 hover:text-white disabled:text-white/20 transition text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-white/50 text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-white/60 hover:text-white disabled:text-white/20 transition text-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* New/Edit Sighting Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Train className="w-5 h-5 text-[#ff7a00]" />
                {editingId ? 'Edit Sighting' : 'Log Train Sighting'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Camera */}
              <div>
                <label className="block text-white/70 text-sm mb-1">Camera Location *</label>
                <select
                  value={formData.camera_id}
                  onChange={e => setFormData(f => ({ ...f, camera_id: e.target.value }))}
                  required
                  className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none"
                >
                  <option value="">Select a camera...</option>
                  {cameras.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date/Time */}
              <div>
                <label className="block text-white/70 text-sm mb-1">Date & Time of Sighting *</label>
                <input
                  type="datetime-local"
                  value={formData.sighting_time}
                  onChange={e => setFormData(f => ({ ...f, sighting_time: e.target.value }))}
                  required
                  className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none"
                />
              </div>

              {/* Railroad + Train Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Railroad *</label>
                  <select
                    value={formData.railroad}
                    onChange={e => setFormData(f => ({ ...f, railroad: e.target.value }))}
                    required
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {RAILROADS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Train Type</label>
                  <select
                    value={formData.train_type}
                    onChange={e => setFormData(f => ({ ...f, train_type: e.target.value }))}
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none"
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
                  <label className="block text-white/70 text-sm mb-1">Train ID / Symbol</label>
                  <input
                    type="text"
                    value={formData.train_id}
                    onChange={e => setFormData(f => ({ ...f, train_id: e.target.value }))}
                    placeholder="e.g., Q335, N956"
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Direction</label>
                  <select
                    value={formData.direction}
                    onChange={e => setFormData(f => ({ ...f, direction: e.target.value }))}
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none"
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
                <label className="block text-white/70 text-sm mb-1">Locomotive(s)</label>
                <input
                  type="text"
                  value={formData.locomotives}
                  onChange={e => setFormData(f => ({ ...f, locomotives: e.target.value }))}
                  placeholder="e.g., CSX 3194, CSX 812"
                  className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none placeholder:text-white/30"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white/70 text-sm mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Horn, meets, rare power, DPU, etc."
                  rows={3}
                  className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none placeholder:text-white/30 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ff7a00] hover:bg-[#ff8c20] disabled:bg-[#ff7a00]/50 text-white font-bold py-3 rounded-lg transition text-sm"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Sighting' : 'Log Sighting'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
