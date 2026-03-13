'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import {
  Camera, Search, Heart, MapPin, Clock, Plus, X, Filter, Train, Upload,
  Radio, ChevronDown, ChevronLeft, ChevronRight, Eye, Image, Star,
  TrendingUp, Award, BarChart3, Zap, ArrowUpRight, Flame, Trophy,
  Navigation, Tag, AlertTriangle, Sparkles, ExternalLink, Grid3X3,
  LayoutGrid, Check, ChevronsUpDown, Pencil, Save, MessageSquare, Trash2, Send,
} from 'lucide-react';
import { RAILROADS, RAILROAD_CATEGORIES, getRailroad, getRailroadColor, getRailroadsByCategory, searchRailroads } from '@/lib/railroads';
import { LOCO_MODELS, BUILDERS, getModelsByBuilder } from '@/lib/locomotive-models';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

// Protected image component - prevents right-click, drag, save
function ProtectedImage({ src, alt, className, style, onError }) {
  return (
    <div className="relative select-none" style={{ WebkitUserSelect: 'none' }}>
      <img
        src={src}
        alt={alt || ''}
        className={className}
        style={{ ...style, WebkitUserDrag: 'none', userSelect: 'none', pointerEvents: 'none' }}
        onError={onError}
        draggable={false}
      />
      {/* Transparent overlay to block right-click/save on the image */}
      <div
        className="absolute inset-0 z-[3]"
        onContextMenu={(e) => e.preventDefault()}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
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

// Quick-access railroad marks for filter chips
const QUICK_FILTER_MARKS = ['BNSF', 'CN', 'CPKC', 'CSX', 'KCS', 'NS', 'UP', 'AMTK'];

// Railroad Combobox — searchable, grouped dropdown
function RailroadCombobox({ value, onChange, placeholder = "Select railroad...", triggerClassName, mode = "form" }) {
  const [open, setOpen] = useState(false);
  const grouped = getRailroadsByCategory();
  const selected = value ? getRailroad(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={triggerClassName || `w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 transition-all hover:border-white/[0.15] focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 ${value ? 'text-white' : 'text-white/30'}`}
        >
          {selected ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-[3px] flex-shrink-0 ring-1 ring-white/10" style={{ background: selected.color }} />
              <span className="font-bold text-white truncate">{selected.mark}</span>
              <span className="text-white/40 truncate hidden sm:inline">{selected.name}</span>
              {selected.mergedInto && <span className="text-white/20 text-[10px] truncate hidden md:inline">→ {selected.mergedInto}</span>}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white/20" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 bg-[#111] border-white/[0.08] shadow-2xl shadow-black/50"
        align="start"
        sideOffset={6}
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search by name, mark, or merged-into..."
            className="h-11 text-white placeholder:text-white/25"
          />
          <CommandList className="max-h-[340px] overflow-y-auto scrollbar-thin">
            <CommandEmpty className="py-8 text-center text-sm text-white/30">No railroad found.</CommandEmpty>
            {value && mode === 'filter' && (
              <CommandItem
                onSelect={() => { onChange(''); setOpen(false); }}
                className="mx-1 my-1 rounded-lg px-3 py-2.5 text-white/50 hover:text-white cursor-pointer data-[selected=true]:bg-white/[0.06]"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                <span className="text-sm">Clear selection</span>
              </CommandItem>
            )}
            {RAILROAD_CATEGORIES.map(cat => {
              const items = grouped[cat.id];
              if (!items?.length) return null;
              return (
                <CommandGroup
                  key={cat.id}
                  heading={cat.label}
                  className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.15em] [&_[cmdk-group-heading]]:text-white/25 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {items.map(rr => {
                    const isSelected = value === rr.mark;
                    return (
                      <CommandItem
                        key={`${cat.id}-${rr.mark}`}
                        value={`${rr.mark} ${rr.name} ${rr.mergedInto || ''}`}
                        onSelect={() => {
                          onChange(isSelected && mode === 'filter' ? '' : rr.mark);
                          setOpen(false);
                        }}
                        className="mx-1 rounded-lg px-3 py-2 cursor-pointer data-[selected=true]:bg-white/[0.06] flex items-center gap-2.5"
                      >
                        <span className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0 ring-1 ring-inset ring-white/10" style={{ background: rr.color }} />
                        <span className="font-bold text-white text-xs w-12 flex-shrink-0">{rr.mark}</span>
                        <span className="text-white/60 text-xs truncate flex-1">{rr.name}</span>
                        {rr.mergedInto && (
                          <span className="text-white/20 text-[10px] flex-shrink-0 hidden sm:inline">→ {rr.mergedInto}</span>
                        )}
                        {isSelected && <Check className="h-4 w-4 text-[#ff7a00] flex-shrink-0 ml-auto" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Locomotive Model Combobox — searchable, grouped by builder
function ModelCombobox({ value, onChange, placeholder = "Search models..." }) {
  const [open, setOpen] = useState(false);
  const grouped = getModelsByBuilder();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" role="combobox" aria-expanded={open}
          className={`w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 transition-all hover:border-white/[0.15] focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 ${value ? 'text-white' : 'text-white/30'}`}>
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white/20" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 bg-[#111] border-white/[0.08] shadow-2xl shadow-black/50" align="start" sideOffset={6}>
        <Command className="bg-transparent">
          <CommandInput placeholder="Search by model name..." className="h-11 text-white placeholder:text-white/25" />
          <CommandList className="max-h-[280px] overflow-y-auto scrollbar-thin">
            <CommandEmpty className="py-6 text-center text-sm text-white/30">No model found.</CommandEmpty>
            {value && (
              <CommandItem onSelect={() => { onChange(''); setOpen(false); }}
                className="mx-1 my-1 rounded-lg px-3 py-2 text-white/50 hover:text-white cursor-pointer data-[selected=true]:bg-white/[0.06]">
                <X className="mr-2 h-3.5 w-3.5" /><span className="text-sm">Clear</span>
              </CommandItem>
            )}
            {Object.entries(grouped).map(([builderId, { label, models }]) => (
              <CommandGroup key={builderId} heading={label}
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.15em] [&_[cmdk-group-heading]]:text-white/25 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {models.map(m => (
                  <CommandItem key={`${builderId}-${m.model}`} value={`${m.model} ${m.builder}`}
                    onSelect={() => { onChange(m.model); setOpen(false); }}
                    className="mx-1 rounded-lg px-3 py-1.5 cursor-pointer data-[selected=true]:bg-white/[0.06] flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.type === 'steam' ? 'bg-amber-500' : m.type === 'electric' ? 'bg-blue-400' : 'bg-emerald-500'}`} />
                    <span className="text-white text-xs font-semibold">{m.model}</span>
                    <span className="text-white/20 text-[10px] uppercase">{m.era}</span>
                    {value === m.model && <Check className="h-3.5 w-3.5 text-[#ff7a00] ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
    tags: [], title: '', description: '', loco_model: '', builder: '',
    photo_date: '', collection_id: '', collection_name: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heritageDetected, setHeritageDetected] = useState(null);
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Collections
  const [collections, setCollections] = useState([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [activeCollectionView, setActiveCollectionView] = useState(null); // collection being browsed

  // Lightbox
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const addComment = async () => {
    if (!selectedPhoto || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const token = localStorage.getItem('railstream_token');
      const res = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'add_comment', photo_id: selectedPhoto.id, text: commentText }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        const updatedComments = [...(selectedPhoto.comments || []), data.comment];
        const updatedPhoto = { ...selectedPhoto, comments: updatedComments };
        setSelectedPhoto(updatedPhoto);
        setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
        setCommentText('');
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch (e) {
      alert('Error posting comment');
    }
    setPostingComment(false);
  };

  const deleteComment = async (commentId) => {
    if (!selectedPhoto || !confirm('Delete this comment?')) return;
    try {
      const token = localStorage.getItem('railstream_token');
      const res = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'delete_comment', photo_id: selectedPhoto.id, comment_id: commentId }),
      });
      const data = await res.json();
      if (data.ok) {
        const updatedComments = (selectedPhoto.comments || []).filter(c => c.id !== commentId);
        const updatedPhoto = { ...selectedPhoto, comments: updatedComments };
        setSelectedPhoto(updatedPhoto);
        setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
      }
    } catch (e) {
      alert('Error deleting comment');
    }
  };

  const startEdit = (photo) => {
    setEditData({
      railroad: photo.railroad || '',
      locomotive_numbers: photo.locomotive_numbers || '',
      location: photo.location || '',
      tags: photo.tags || [],
      title: photo.title || '',
      description: photo.description || '',
      loco_model: photo.loco_model || '',
      builder: photo.builder || '',
      photo_date: photo.photo_date || '',
      collection_id: photo.collection_id || '',
      collection_name: photo.collection_name || '',
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!selectedPhoto) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('railstream_token');
      const res = await fetch('/api/roundhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'update', photo_id: selectedPhoto.id, ...editData }),
      });
      const data = await res.json();
      if (data.ok && data.photo) {
        setSelectedPhoto(data.photo);
        setPhotos(prev => prev.map(p => p.id === data.photo.id ? data.photo : p));
        setEditMode(false);
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (e) {
      alert('Error saving changes');
    }
    setSaving(false);
  };

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
    if (activeCollectionView) params.set('collection_id', activeCollectionView.id);

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
  }, [page, searchQuery, filterRailroad, filterTag, filterHeritage, sortBy, activeCollectionView]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Stats
  useEffect(() => {
    fetch('/api/roundhouse?action=stats')
      .then(r => r.json())
      .then(data => { if (data.ok) setStats(data); })
      .catch(() => {});
  }, []);

  // Fetch collections
  useEffect(() => {
    fetch('/api/roundhouse?action=collections')
      .then(r => r.json())
      .then(data => { if (data.ok) setCollections(data.collections || []); })
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
    if (file.size > 15 * 1024 * 1024) { alert('Image must be under 15MB'); return; }
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
        setFormData({
          railroad: '', locomotive_numbers: '', location: '', source: 'trackside',
          tags: [], title: '', description: '', loco_model: '', builder: '',
          photo_date: '', collection_id: '', collection_name: '',
        });
        setImageFile(null);
        setImagePreview(null);
        setHeritageDetected(null);
        // Refresh collections
        fetch('/api/roundhouse?action=collections')
          .then(r => r.json())
          .then(data => { if (data.ok) setCollections(data.collections || []); })
          .catch(() => {});
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
    <div className="min-h-screen bg-[#050505] text-white" onContextMenu={(e) => {
      // Only block right-click on images
      if (e.target.tagName === 'IMG' || e.target.closest('[data-protected]')) {
        e.preventDefault();
      }
    }}>
      <SiteHeader currentPage="roundhouse" user={user} />

      {/* ====== HERO ====== */}
      <div className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <img
            src="/images/roundhouse-hero.png"
            alt="" className="w-full h-[550px] object-cover opacity-25"
            style={{ objectPosition: 'center 40%' }}
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
                onClick={() => { setShowUpload(true); setHeritageDetected(null); setFormData({ railroad: '', locomotive_numbers: '', location: '', source: 'trackside', tags: [], title: '', description: '', loco_model: '', builder: '', photo_date: '', collection_id: '', collection_name: '' }); setImageFile(null); setImagePreview(null); setShowNewCollection(false); }}
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

        {/* ====== COLLECTIONS ====== */}
        {collections.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <LayoutGrid className="w-5 h-5 text-[#ff7a00]" />
                Collections
                <span className="text-white/20 text-sm font-normal">({collections.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {collections.slice(0, 10).map(coll => (
                <button key={coll.id}
                  onClick={() => {
                    setActiveCollectionView(activeCollectionView?.id === coll.id ? null : coll);
                    if (activeCollectionView?.id !== coll.id) {
                      // Filter photos to this collection
                      setFilterRailroad(''); setFilterTag(''); setFilterHeritage(false);
                      setSearchInput(''); setSearchQuery('');
                    }
                    setPage(1);
                  }}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 text-left ${
                    activeCollectionView?.id === coll.id
                      ? 'border-[#ff7a00]/40 bg-[#ff7a00]/[0.08] shadow-lg shadow-[#ff7a00]/10'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                  }`}
                >
                  {coll.cover_image_url ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={coll.cover_image_url} alt={coll.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center">
                      <Grid3X3 className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-bold truncate">{coll.name}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{coll.photo_count} photo{coll.photo_count !== 1 ? 's' : ''} · by {coll.username}</p>
                  </div>
                </button>
              ))}
            </div>
            {activeCollectionView && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ff7a00]/[0.06] border border-[#ff7a00]/20">
                <Grid3X3 className="w-4 h-4 text-[#ff7a00]" />
                <span className="text-white text-xs font-semibold">Viewing collection: {activeCollectionView.name}</span>
                <button onClick={() => { setActiveCollectionView(null); setPage(1); }}
                  className="ml-auto text-[#ff7a00]/60 hover:text-[#ff7a00] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ====== FILTERS ====== */}
        <div className="mb-8 space-y-4">
          {/* Railroad chips — Class I quick filters + Browse All combobox */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setFilterRailroad(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${!filterRailroad ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]'}`}>
              All
            </button>
            {QUICK_FILTER_MARKS.map(mark => {
              const rr = getRailroadColor(mark);
              const rrData = getRailroad(mark);
              const active = filterRailroad === mark;
              return (
                <button key={mark} onClick={() => { setFilterRailroad(active ? '' : mark); setPage(1); }}
                  className="px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 border"
                  style={active ? { background: rr.bg, color: rr.text, borderColor: rr.bg, boxShadow: `0 4px 16px ${rr.glow}` }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
                  title={rrData.name}>
                  {mark}
                </button>
              );
            })}

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Browse ALL railroads — Combobox */}
            <RailroadCombobox
              value={!QUICK_FILTER_MARKS.includes(filterRailroad) ? filterRailroad : ''}
              onChange={(val) => { setFilterRailroad(val); setPage(1); }}
              placeholder="Browse all railroads..."
              mode="filter"
              triggerClassName={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border ${
                filterRailroad && !QUICK_FILTER_MARKS.includes(filterRailroad)
                  ? 'bg-[#ff7a00]/15 text-[#ff7a00] border-[#ff7a00]/30 shadow-lg shadow-[#ff7a00]/10'
                  : 'bg-white/[0.04] text-white/40 border-white/[0.06] hover:bg-white/[0.08] hover:text-white/60'
              }`}
            />

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Heritage filter */}
            <button onClick={() => { setFilterHeritage(!filterHeritage); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 border flex items-center gap-1.5 ${
                filterHeritage ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-white/[0.04] text-white/50 border-white/[0.06] hover:bg-white/[0.08]'}`}>
              <span>👑</span> Heritage
            </button>
          </div>

          {/* Tag chips + Sort */}
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
                const rrStyle = getRailroadColor(photo.railroad);
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
                    <div className="relative overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
                      {photo.image_url ? (
                        <ProtectedImage src={photo.image_url} alt={photo.title || `${photo.railroad} ${photo.locomotive_numbers}`}
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
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
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
                    <span className="text-white/30 text-xs group-hover:text-white/50">Click to upload (max 15MB)</span>
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
                <RailroadCombobox
                  value={formData.railroad}
                  onChange={(val) => setFormData(f => ({ ...f, railroad: val }))}
                  placeholder="Search or browse railroads..."
                  mode="form"
                />
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

              {/* Locomotive Model + Builder */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Locomotive Model</label>
                  <ModelCombobox
                    value={formData.loco_model}
                    onChange={(val) => {
                      setFormData(f => ({ ...f, loco_model: val }));
                      // Auto-set builder from model selection
                      const matchedModel = LOCO_MODELS.find(m => m.model === val);
                      if (matchedModel && !formData.builder) {
                        setFormData(f => ({ ...f, builder: matchedModel.builder, loco_model: val }));
                      }
                    }}
                    placeholder="Search models..."
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Builder</label>
                  <select value={formData.builder}
                    onChange={e => setFormData(f => ({ ...f, builder: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all">
                    <option value="" className="bg-[#111] text-white/40">Select builder...</option>
                    {BUILDERS.map(b => <option key={b.id} value={b.id} className="bg-[#111] text-white">{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Photo Date */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Photo Date</label>
                <input type="date" value={formData.photo_date}
                  onChange={e => setFormData(f => ({ ...f, photo_date: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all [color-scheme:dark]" />
              </div>

              {/* Collection */}
              <div>
                <label className="block text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Collection</label>
                {!showNewCollection ? (
                  <div className="space-y-2">
                    <select value={formData.collection_id}
                      onChange={e => {
                        const coll = collections.find(c => c.id === e.target.value);
                        setFormData(f => ({ ...f, collection_id: e.target.value, collection_name: coll?.name || '' }));
                      }}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all">
                      <option value="" className="bg-[#111] text-white/40">No collection</option>
                      {collections.map(c => <option key={c.id} value={c.id} className="bg-[#111] text-white">{c.name} ({c.photo_count} photos)</option>)}
                    </select>
                    <button type="button" onClick={() => setShowNewCollection(true)}
                      className="flex items-center gap-1.5 text-[#ff7a00]/60 hover:text-[#ff7a00] text-xs font-medium transition-colors">
                      <Plus className="w-3 h-3" /> Create new collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 rounded-xl border border-[#ff7a00]/20 bg-[#ff7a00]/[0.03]">
                    <input type="text" value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      placeholder="Collection name..."
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 focus:border-[#ff7a00]/50 focus:outline-none transition-all placeholder:text-white/15" />
                    <input type="text" value={newCollectionDesc}
                      onChange={e => setNewCollectionDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 focus:border-[#ff7a00]/50 focus:outline-none transition-all placeholder:text-white/15" />
                    <div className="flex gap-2">
                      <button type="button" onClick={async () => {
                        if (!newCollectionName.trim()) return;
                        const token = localStorage.getItem('railstream_token');
                        try {
                          const res = await fetch('/api/roundhouse', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ action: 'create_collection', name: newCollectionName, description: newCollectionDesc }),
                          });
                          const data = await res.json();
                          if (data.ok) {
                            setCollections(prev => [data.collection, ...prev]);
                            setFormData(f => ({ ...f, collection_id: data.collection.id, collection_name: data.collection.name }));
                            setNewCollectionName('');
                            setNewCollectionDesc('');
                            setShowNewCollection(false);
                          }
                        } catch (e) { console.error(e); }
                      }}
                        className="px-4 py-1.5 bg-[#ff7a00] text-white rounded-lg text-xs font-bold hover:bg-[#ff8c20] transition-colors">
                        Create
                      </button>
                      <button type="button" onClick={() => setShowNewCollection(false)}
                        className="px-4 py-1.5 bg-white/[0.06] text-white/50 rounded-lg text-xs font-semibold hover:text-white transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
          onClick={() => { setSelectedPhoto(null); setEditMode(false); setCommentText(''); }} style={{ animation: 'modalIn 0.2s ease-out' }}>
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
            <div className={`relative ${selectedPhoto.is_heritage ? '' : 'rounded-t-xl'} overflow-hidden`} onContextMenu={(e) => e.preventDefault()}>
              {selectedPhoto.image_url ? (
                <div className="relative">
                  <ProtectedImage src={selectedPhoto.image_url} alt={selectedPhoto.title || 'Rail photo'}
                    className="w-full max-h-[60vh] object-contain bg-black" />
                </div>
              ) : (
                <div className="w-full h-64 bg-white/[0.03] flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white/10" />
                </div>
              )}
            </div>

            {/* Details panel */}
            <div className="bg-[#0a0a0a] border border-white/[0.08] border-t-0 rounded-b-xl px-6 py-5">
              {editMode ? (
                /* ── EDIT MODE ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pencil className="w-4 h-4 text-[#ff7a00]" />
                    <h3 className="text-white font-semibold">Edit Post</h3>
                  </div>

                  {/* Railroad */}
                  <div>
                    <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Railroad *</label>
                    <RailroadCombobox value={editData.railroad} onChange={(v) => setEditData(d => ({ ...d, railroad: v }))} placeholder="Search or browse railroads..." />
                  </div>

                  {/* Locomotive Numbers */}
                  <div>
                    <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Locomotive Number(s)</label>
                    <input type="text" value={editData.locomotive_numbers} onChange={e => setEditData(d => ({ ...d, locomotive_numbers: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/40"
                      placeholder="e.g., NS 1073, NS 9254" />
                  </div>

                  {/* Title + Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Title</label>
                      <input type="text" value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/40"
                        placeholder="e.g., NS Heritage on Q335" />
                    </div>
                    <div>
                      <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Location</label>
                      <input type="text" value={editData.location} onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/40"
                        placeholder="e.g., Fostoria, Ohio" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/40 resize-none"
                      rows={3} placeholder="Add details, context, or notes about this sighting..." />
                  </div>

                  {/* Model + Builder */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Locomotive Model</label>
                      <ModelCombobox value={editData.loco_model} onChange={(val) => {
                        setEditData(d => ({ ...d, loco_model: val }));
                        const matchedModel = LOCO_MODELS.find(m => m.model === val);
                        if (matchedModel && !editData.builder) {
                          setEditData(d => ({ ...d, builder: matchedModel.builder, loco_model: val }));
                        }
                      }} placeholder="Search models..." />
                    </div>
                    <div>
                      <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Builder</label>
                      <select value={editData.builder} onChange={e => setEditData(d => ({ ...d, builder: e.target.value }))}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none">
                        <option value="" className="bg-[#111] text-white/40">Select builder...</option>
                        {BUILDERS.map(b => <option key={b.id} value={b.id} className="bg-[#111] text-white">{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Photo Date */}
                  <div>
                    <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Photo Date</label>
                    <input type="date" value={editData.photo_date} onChange={e => setEditData(d => ({ ...d, photo_date: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 focus:border-[#ff7a00]/50 focus:outline-none" />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {PHOTO_TAGS.map(tag => (
                        <button key={tag.id} type="button"
                          onClick={() => setEditData(d => ({ ...d, tags: d.tags.includes(tag.id) ? d.tags.filter(t => t !== tag.id) : [...d.tags, tag.id] }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${editData.tags.includes(tag.id) ? 'border-[#ff7a00]/40 bg-[#ff7a00]/10 text-white' : 'border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'}`}>
                          {tag.icon} {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={saveEdit} disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#ff7a00] hover:bg-[#e06800] text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={cancelEdit}
                      className="px-6 py-3 rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── VIEW MODE ── */
                <>
              {/* Title + Railroad */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                      style={{ background: getRailroadColor(selectedPhoto.railroad).bg, color: getRailroadColor(selectedPhoto.railroad).text, boxShadow: `0 2px 8px ${getRailroadColor(selectedPhoto.railroad).glow}` }}>
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
              <div className="flex items-center gap-4 flex-wrap text-xs text-white/70 mb-3">
                {selectedPhoto.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-white/50" />{selectedPhoto.location}</span>
                )}
                {selectedPhoto.photo_date && (
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-white/50" />
                    Photo: {new Date(selectedPhoto.photo_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/50" />
                  Uploaded {new Date(selectedPhoto.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* Locomotive details row */}
              {(selectedPhoto.loco_model || selectedPhoto.builder || selectedPhoto.collection_name) && (
                <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
                  {selectedPhoto.loco_model && (
                    <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg font-semibold">
                      {selectedPhoto.loco_model}
                    </span>
                  )}
                  {selectedPhoto.builder && (
                    <span className="bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-lg font-semibold">
                      Built by {selectedPhoto.builder}
                    </span>
                  )}
                  {selectedPhoto.collection_name && (
                    <span className="bg-[#ff7a00]/15 text-[#ff7a00] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <Grid3X3 className="w-3 h-3" /> {selectedPhoto.collection_name}
                    </span>
                  )}
                </div>
              )}

              {/* Tags */}
              {selectedPhoto.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedPhoto.tags.map(t => {
                    const tagInfo = PHOTO_TAGS.find(pt => pt.id === t);
                    return tagInfo ? (
                      <span key={t} className="text-[11px] text-white/70 bg-white/[0.08] px-2.5 py-1 rounded-lg">
                        {tagInfo.icon} {tagInfo.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Description */}
              {selectedPhoto.description && (
                <p className="text-white/80 text-sm leading-relaxed mt-3 border-l-2 border-[#ff7a00]/40 pl-3 italic">{selectedPhoto.description}</p>
              )}

              {/* Heritage info */}
              {selectedPhoto.heritage_units?.length > 0 && (
                <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-400 text-xs font-semibold mb-1">Heritage Details</p>
                  {selectedPhoto.heritage_units.map((u, i) => (
                    <p key={i} className="text-amber-400/80 text-xs">{u.unit} — {u.name} ({u.scheme})</p>
                  ))}
                </div>
              )}

              {/* Author + actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white/60">
                    {(selectedPhoto.username || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-white/80 text-sm font-medium">{selectedPhoto.username}</span>
                </div>
                {(user && (selectedPhoto.username === (user.username || user.name) || user.is_admin || user.tier === 'admin' || user.membership_tier === 'admin')) && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(selectedPhoto)}
                      className="flex items-center gap-1.5 text-[#ff7a00]/80 hover:text-[#ff7a00] text-xs font-medium transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(selectedPhoto.id)}
                      className="text-red-400/70 hover:text-red-400 text-xs font-medium transition-colors">
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* ── Comments Section ── */}
              <div className="mt-4 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-white/60" />
                  <span className="text-white/80 text-sm font-semibold">
                    Comments {(selectedPhoto.comments?.length || 0) > 0 && `(${selectedPhoto.comments.length})`}
                  </span>
                </div>

                {/* Comment list */}
                {selectedPhoto.comments?.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-1">
                    {selectedPhoto.comments.map(c => {
                      const isCommentOwner = user && c.username === (user.username || user.name);
                      const isPhotoOwner = user && selectedPhoto.username === (user.username || user.name);
                      const isAdmin = user && (user.is_admin || user.tier === 'admin' || user.membership_tier === 'admin');
                      const canDelete = isCommentOwner || isPhotoOwner || isAdmin;
                      const timeAgo = (() => {
                        const diff = Date.now() - new Date(c.created_at).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'just now';
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        const days = Math.floor(hrs / 24);
                        return `${days}d ago`;
                      })();

                      return (
                        <div key={c.id} className="group flex gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-white/[0.1] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white/60 mt-0.5">
                            {(c.username || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white/90 text-xs font-semibold">{c.username}</span>
                              <span className="text-white/40 text-[10px]">{timeAgo}</span>
                              {canDelete && (
                                <button onClick={() => deleteComment(c.id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all ml-auto">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-white/75 text-sm leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-white/40 text-xs mb-4 italic">No comments yet. Be the first!</p>
                )}

                {/* Add comment input */}
                {user ? (
                  <form onSubmit={(e) => { e.preventDefault(); addComment(); }} className="flex gap-2">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      maxLength={1000}
                      className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 transition-all placeholder:text-white/40" />
                    <button type="submit" disabled={!commentText.trim() || postingComment}
                      className="px-4 py-2.5 bg-[#ff7a00] hover:bg-[#e06800] text-black rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <p className="text-white/50 text-xs italic">Log in to leave a comment.</p>
                )}
              </div>
                </>
              )}
            </div>

            {/* Close button */}
            <button onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); setEditMode(false); setCommentText(''); }}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-xl bg-black/80 backdrop-blur-sm text-white/70 hover:text-white transition-colors border border-white/[0.15] hover:bg-black/90 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
