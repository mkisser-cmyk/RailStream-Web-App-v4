'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Camera, MapPin, Search, Filter, Train, Lock, Crown, 
  Shield, Star, Radio, ChevronDown, X, Loader2, AlertCircle,
  Clock, Zap, Grid, List
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

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
        isOnline 
          ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 hover:from-gray-800 hover:to-gray-900 cursor-pointer' 
          : 'bg-gray-900/50 opacity-75'
      } border border-gray-700/50 hover:border-orange-500/50`}
      onClick={() => isOnline && onSelect(camera)}
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
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Train className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">RailStream</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
              <Link href="/cameras" className="text-orange-400 font-medium">Cameras</Link>
              <Link href="/15years" className="text-gray-400 hover:text-white transition-colors">15 Years</Link>
              <Link href="/host" className="text-gray-400 hover:text-white transition-colors">Host</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-6 bg-gradient-to-b from-gray-900/50 to-black">
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
          <p className="text-gray-500 text-sm">© 2010-2025 RailStream. Celebrating 15 years.</p>
        </div>
      </footer>
    </main>
  );
}
