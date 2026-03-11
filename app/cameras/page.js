'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { 
  Camera, MapPin, Search, Filter, Train, Lock, Crown, 
  Shield, Star, Radio, ChevronDown, X, Loader2, AlertCircle,
  Clock, Zap, Grid, List, CameraOff, Sparkles, Globe, Facebook
} from 'lucide-react';

// Tier configuration
const TIERS = {
  fireman: {
    label: 'Fireman',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    icon: Shield,
    description: 'Entry-level membership'
  },
  conductor: {
    label: 'Conductor',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    icon: Star,
    description: 'Includes all Fireman cameras'
  },
  engineer: {
    label: 'Engineer',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    icon: Crown,
    description: 'Full access to all cameras'
  }
};

// Group cameras by tier
function groupByTier(cameras) {
  const groups = {
    engineer: [],
    conductor: [],
    fireman: [],
    free: []
  };

  cameras.forEach(cam => {
    const tier = cam.min_tier || 'free';
    if (groups[tier]) {
      groups[tier].push(cam);
    } else {
      groups.free.push(cam);
    }
  });

  return groups;
}

// Camera Card Component
function CameraCard({ camera, onSelect }) {
  const tier = camera.min_tier || 'free';
  const tierConfig = TIERS[tier] || TIERS.fireman;
  const isOnline = camera.status === 'online';
  const isComingSoon = camera.status === 'coming_soon';
  const isOffline = camera.status === 'offline';
  const isClickable = isOnline || isComingSoon || isOffline;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
        isClickable 
          ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 hover:from-gray-800 hover:to-gray-900 cursor-pointer' 
          : 'bg-gray-900/50 opacity-75'
      } border border-gray-700/50 hover:border-orange-500/50`}
      onClick={() => isClickable && onSelect(camera)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {camera.thumbnail_path ? (
          <img
            src={camera.thumbnail_path}
            alt={camera.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 items-center justify-center ${camera.thumbnail_path ? 'hidden' : 'flex'}`}
        >
          <Train className="w-12 h-12 text-gray-600" />
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-300">LIVE</span>
            </div>
          ) : isComingSoon ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-300">COMING SOON</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/20 border border-gray-500/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs font-medium text-gray-300">OFFLINE</span>
            </div>
          )}
        </div>

        {/* Tier badge */}
        <div className="absolute top-3 right-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tierConfig.bgColor} ${tierConfig.borderColor} border backdrop-blur-sm`}>
            <tierConfig.icon className={`w-3 h-3 ${tierConfig.textColor}`} />
            <span className={`text-xs font-medium ${tierConfig.textColor}`}>{tierConfig.label}</span>
          </div>
        </div>

        {/* Play overlay on hover */}
        {isOnline && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-orange-500/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
          {camera.name}
        </h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{camera.location || 'View location'}</span>
        </div>
        {camera.description && (
          <p className="mt-2 text-gray-500 text-sm line-clamp-2">{camera.description}</p>
        )}
      </div>
    </div>
  );
}

// Tier Section Component
function TierSection({ tier, cameras, onSelect, isExpanded, onToggle }) {
  const tierConfig = TIERS[tier];
  if (!tierConfig) return null;

  const onlineCameras = cameras.filter(c => c.status === 'online');
  const comingSoonCameras = cameras.filter(c => c.status === 'coming_soon');
  const offlineCameras = cameras.filter(c => c.status !== 'online' && c.status !== 'coming_soon');

  return (
    <section className="mb-12">
      {/* Tier Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/50 transition-all mb-6"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierConfig.color} flex items-center justify-center`}>
            <tierConfig.icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-white">{tierConfig.label} Cameras</h2>
            <p className="text-gray-400 text-sm">{tierConfig.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-400">{onlineCameras.length}</span>
            <span className="text-gray-500 text-sm ml-1">live</span>
            {comingSoonCameras.length > 0 && (
              <>
                <span className="text-gray-600 mx-2">·</span>
                <span className="text-yellow-400">{comingSoonCameras.length}</span>
                <span className="text-gray-500 text-sm ml-1">coming</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Camera Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Online cameras first */}
          {onlineCameras.map(camera => (
            <CameraCard key={camera._id} camera={camera} onSelect={onSelect} />
          ))}
          
          {/* Coming soon cameras */}
          {comingSoonCameras.map(camera => (
            <CameraCard key={camera._id} camera={camera} onSelect={onSelect} />
          ))}

          {/* Offline cameras */}
          {offlineCameras.map(camera => (
            <CameraCard key={camera._id} camera={camera} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusModal, setStatusModal] = useState(null);
  const [expandedTiers, setExpandedTiers] = useState({
    engineer: true,
    conductor: true,
    fireman: true
  });

  // Fetch cameras
  useEffect(() => {
    async function fetchCameras() {
      try {
        const res = await fetch('/api/cameras/catalog');
        if (!res.ok) throw new Error('Failed to fetch cameras');
        const data = await res.json();
        setCameras(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCameras();
  }, []);

  // Filter and group cameras
  const filteredCameras = useMemo(() => {
    if (!searchQuery) return cameras;
    const query = searchQuery.toLowerCase();
    return cameras.filter(cam => 
      cam.name?.toLowerCase().includes(query) ||
      cam.location?.toLowerCase().includes(query) ||
      cam.description?.toLowerCase().includes(query)
    );
  }, [cameras, searchQuery]);

  const groupedCameras = useMemo(() => groupByTier(filteredCameras), [filteredCameras]);

  // Stats
  const stats = useMemo(() => {
    const online = cameras.filter(c => c.status === 'online').length;
    const comingSoon = cameras.filter(c => c.status === 'coming_soon').length;
    return { total: cameras.length, online, comingSoon };
  }, [cameras]);

  // Handle camera selection
  const handleSelectCamera = (camera) => {
    // Show status modal for offline/coming_soon cameras
    if (camera.status === 'offline' || camera.status === 'coming_soon') {
      setStatusModal(camera);
      return;
    }
    // Navigate to watch page with camera
    window.location.href = `/?camera=${camera.short_code || camera._id}`;
  };

  // Toggle tier expansion
  const toggleTier = (tier) => {
    setExpandedTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <span className="text-gray-400">Loading cameras...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold text-white">Failed to Load Cameras</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <SiteHeader currentPage="cameras" />

      {/* Hero */}
      <section className="pt-24 pb-12 px-6 bg-gradient-to-b from-gray-900/50 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Camera <span className="text-orange-400">Directory</span>
              </h1>
              <p className="text-gray-400 text-lg">
                {stats.online} cameras live across the network
                {stats.comingSoon > 0 && ` · ${stats.comingSoon} coming soon`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search cameras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Tier legend */}
          <div className="flex flex-wrap gap-4 mb-8">
            {Object.entries(TIERS).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${config.color}`} />
                <span className="text-sm text-gray-400">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Camera Sections by Tier */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Engineer Cameras */}
          {groupedCameras.engineer.length > 0 && (
            <TierSection
              tier="engineer"
              cameras={groupedCameras.engineer}
              onSelect={handleSelectCamera}
              isExpanded={expandedTiers.engineer}
              onToggle={() => toggleTier('engineer')}
            />
          )}

          {/* Conductor Cameras (if any exist separately) */}
          {groupedCameras.conductor.length > 0 && (
            <TierSection
              tier="conductor"
              cameras={groupedCameras.conductor}
              onSelect={handleSelectCamera}
              isExpanded={expandedTiers.conductor}
              onToggle={() => toggleTier('conductor')}
            />
          )}

          {/* Fireman Cameras */}
          {groupedCameras.fireman.length > 0 && (
            <TierSection
              tier="fireman"
              cameras={groupedCameras.fireman}
              onSelect={handleSelectCamera}
              isExpanded={expandedTiers.fireman}
              onToggle={() => toggleTier('fireman')}
            />
          )}

          {/* No results */}
          {filteredCameras.length === 0 && (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No cameras found</h3>
              <p className="text-gray-400">Try adjusting your search query</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-orange-400 font-bold text-xl">RailStream</Link>
          <p className="text-gray-500 text-sm">© 2011-2026 RailStream, LLC. Celebrating 15 years.</p>
        </div>
      </footer>

      {/* Full-screen Camera Status Modal (Offline / Coming Soon) */}
      {statusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setStatusModal(null)}>
          <div 
            className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {statusModal.status === 'offline' ? (
              <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl">
                <button onClick={() => setStatusModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10" aria-label="Close">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="px-8 pt-10 pb-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
                    <CameraOff className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Camera Offline</h2>
                  <p className="text-lg font-semibold text-white/90 mb-1">{statusModal.name}</p>
                  <p className="text-orange-400 font-medium mb-6">
                    <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                    {statusModal.location}
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    This camera is currently offline due to service interruption, maintenance, or site conditions. Please check back soon.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">Offline</span>
                  </div>
                </div>
                <div className="px-8 pb-8">
                  <button onClick={() => setStatusModal(null)} className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold rounded-xl transition-colors">
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl">
                <button onClick={() => setStatusModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10" aria-label="Close">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="px-8 pt-10 pb-8 text-center">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6 shadow-lg shadow-orange-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                    <span className="text-white text-sm font-bold uppercase tracking-wider">Coming Soon</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{statusModal.name}</h2>
                  <p className="text-orange-400 font-medium mb-4">
                    <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                    {statusModal.location}
                  </p>
                  {statusModal.description && (
                    <p className="text-white/70 text-sm mb-4 max-w-sm mx-auto italic">
                      "{statusModal.description}"
                    </p>
                  )}
                  <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    This camera is a future release. We're working hard to bring you this view soon!
                  </p>
                  <button className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 mb-4" onClick={() => window.open('https://www.facebook.com/RailstreamLLC', '_blank')}>
                    Get Notified When Live
                  </button>
                  <p className="text-white/40 text-xs mb-3">Follow us for updates</p>
                  <div className="flex items-center justify-center gap-4">
                    <a href="https://www.facebook.com/RailstreamLLC" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-lg text-[#1877F2] text-sm font-medium transition-colors">
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </a>
                    <a href="https://railstream.net" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm font-medium transition-colors">
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-4">
                  <button onClick={() => setStatusModal(null)} className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold rounded-xl transition-colors">
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
