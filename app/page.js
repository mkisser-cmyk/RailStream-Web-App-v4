'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'sonner';
import {
  Train,
  Play,
  Lock,
  Search,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Radio,
  MapPin,
  Crown,
  Zap,
  Shield,
  Eye,
  Loader2,
} from 'lucide-react';
import { clientApi } from '@/lib/api';
import { auth } from '@/lib/auth';

// Tier configuration from API labels
const TIER_CONFIG = {
  fireman: { label: 'Fireman', color: 'bg-orange-600', icon: Zap, price: 'FREE' },
  conductor: { label: 'Conductor', color: 'bg-blue-600', icon: Shield, price: '$8.95/mo' },
  engineer: { label: 'Engineer', color: 'bg-purple-600', icon: Crown, price: '$12.95/mo' },
};

// Navigation Component
function Navigation({ user, onLogin, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Train className="w-8 h-8 text-[#ff7a00]" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Rail</span>
              <span className="text-[#ff7a00]">Stream</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-white/80 hover:text-white transition">Home</a>
            <a href="#cameras" className="text-white/80 hover:text-white transition">Cameras</a>
            <a href="#" className="text-white/80 hover:text-white transition">About</a>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Badge className={`${TIER_CONFIG[user.membership_tier]?.color || 'bg-gray-600'} text-white`}>
                  {TIER_CONFIG[user.membership_tier]?.label || user.membership_tier}
                </Badge>
                <span className="text-white/80">{user.username}</span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={onLogin} className="bg-[#ff7a00] hover:bg-[#ff9a40] text-white">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 bg-black/90 rounded-lg">
            <div className="flex flex-col gap-4">
              <a href="#" className="text-white/80 hover:text-white">Home</a>
              <a href="#cameras" className="text-white/80 hover:text-white">Cameras</a>
              <a href="#" className="text-white/80 hover:text-white">About</a>
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${TIER_CONFIG[user.membership_tier]?.color} text-white`}>
                      {TIER_CONFIG[user.membership_tier]?.label}
                    </Badge>
                    <span className="text-white/80">{user.username}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={onLogin} className="bg-[#ff7a00] hover:bg-[#ff9a40] text-white w-full">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Camera Card Component
function CameraCard({ camera, userTier, onClick }) {
  const canAccess = auth.canAccess(userTier, camera.min_tier);
  const isLocked = !canAccess;
  const tierConfig = TIER_CONFIG[camera.min_tier] || TIER_CONFIG.fireman;

  return (
    <div
      onClick={() => onClick(camera)}
      className="camera-card relative flex-shrink-0 w-[280px] md:w-[320px] rounded-lg overflow-hidden cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-card">
        <img
          src={camera.thumbnail_path || '/placeholder-camera.jpg'}
          alt={`${camera.name} - ${camera.location}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=225&fit=crop';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 gradient-overlay" />
        
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Requires {tierConfig.label}</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {camera.status === 'online' ? (
            <Badge className="bg-red-600 text-white flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full live-pulse" />
              LIVE
            </Badge>
          ) : (
            <Badge className="bg-gray-600 text-white">OFFLINE</Badge>
          )}
        </div>
        
        {/* Tier Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${tierConfig.color} text-white text-xs`}>
            {camera.min_tier_label || tierConfig.label}
          </Badge>
        </div>
        
        {/* Play Button (on hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {!isLocked && (
            <div className="w-16 h-16 rounded-full bg-[#ff7a00]/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-semibold text-white text-lg truncate">{camera.name}</h3>
          <p className="text-white/70 text-sm truncate flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {camera.location}
          </p>
        </div>
      </div>
    </div>
  );
}

// Camera Row Component (Netflix-style)
function CameraRow({ title, cameras, userTier, onCameraClick }) {
  const scrollRef = useCallback((node) => {
    if (node) node.scrollLeft = 0;
  }, []);

  const scroll = (direction) => {
    const container = document.getElementById(`row-${title.replace(/\s/g, '-')}`);
    if (container) {
      const scrollAmount = direction === 'left' ? -640 : 640;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!cameras?.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 px-4 md:px-8">{title}</h2>
      <div className="relative group">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
        
        {/* Scrollable Row */}
        <div
          id={`row-${title.replace(/\s/g, '-')}`}
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-4 hide-scrollbar scroll-smooth"
        >
          {cameras.map((camera) => (
            <CameraCard
              key={camera._id}
              camera={camera}
              userTier={userTier}
              onClick={onCameraClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hero Section Component
function HeroSection({ featuredCamera, onWatch, userTier }) {
  if (!featuredCamera) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-b from-gray-900 to-background flex items-center justify-center">
        <div className="text-center">
          <Train className="w-16 h-16 text-[#ff7a00] mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-white">Rail</span>
            <span className="text-[#ff7a00]">Stream</span>
          </h1>
          <p className="text-white/70 text-xl">Live Train Cameras from Across North America</p>
        </div>
      </div>
    );
  }

  const canAccess = auth.canAccess(userTier, featuredCamera.min_tier);

  return (
    <div className="relative h-[70vh] md:h-[80vh]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={featuredCamera.thumbnail_path}
          alt={featuredCamera.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1920&h=1080&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl pt-20">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-red-600 text-white flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full live-pulse" />
              LIVE NOW
            </Badge>
            <Badge className={`${TIER_CONFIG[featuredCamera.min_tier]?.color} text-white`}>
              {featuredCamera.min_tier_label}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            {featuredCamera.name}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {featuredCamera.location}
          </p>
          <p className="text-white/60 text-lg mb-6 line-clamp-3">
            {featuredCamera.description?.split('\n')[0]}
          </p>
          
          <div className="flex gap-4">
            <Button
              size="lg"
              className="bg-[#ff7a00] hover:bg-[#ff9a40] text-white text-lg px-8"
              onClick={() => onWatch(featuredCamera)}
            >
              {canAccess ? (
                <><Play className="w-5 h-5 mr-2" fill="white" /> Watch Now</>
              ) : (
                <><Lock className="w-5 h-5 mr-2" /> Unlock to Watch</>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Eye className="w-5 h-5 mr-2" /> More Info
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login Dialog Component
function LoginDialog({ open, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await clientApi.login(username, password);
      
      if (data.access_token) {
        auth.setToken(data.access_token);
        auth.setUser(data.user);
        toast.success(`Welcome back, ${data.user.username}!`);
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Train className="w-6 h-6 text-[#ff7a00]" />
            Sign In to RailStream
          </DialogTitle>
          <DialogDescription>
            Access premium cameras and features with your account.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="bg-background border-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-background border-border"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-[#ff7a00] hover:bg-[#ff9a40] text-white"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="#" className="text-[#ff7a00] hover:underline">Join RailStream</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Upgrade Dialog Component
function UpgradeDialog({ open, onClose, requiredTier, camera }) {
  const tierConfig = TIER_CONFIG[requiredTier] || TIER_CONFIG.conductor;
  const TierIcon = tierConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#ff7a00]" />
            Upgrade Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-secondary rounded-lg">
            <h3 className="font-semibold text-lg mb-1">{camera?.name}</h3>
            <p className="text-muted-foreground text-sm">{camera?.location}</p>
          </div>
          
          <p className="text-muted-foreground">
            This camera requires a <span className="text-white font-semibold">{tierConfig.label}</span> membership or higher to watch.
          </p>
          
          <div className={`p-4 rounded-lg ${tierConfig.color} text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TierIcon className="w-8 h-8" />
                <div>
                  <h4 className="font-bold text-lg">{tierConfig.label}</h4>
                  <p className="text-white/80 text-sm">{tierConfig.price}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            className="w-full bg-[#ff7a00] hover:bg-[#ff9a40] text-white"
            onClick={() => window.open('https://railstream.net/join', '_blank')}
          >
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Watch Dialog Component (Player)
function WatchDialog({ open, onClose, camera, playbackData, loading, error }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border-border max-w-5xl w-[95vw] p-0">
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* Video Container */}
          <div className="aspect-video bg-black flex items-center justify-center">
            {loading ? (
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#ff7a00] animate-spin mx-auto mb-4" />
                <p className="text-white/80">Loading stream...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white text-xl font-semibold mb-2">Unable to Load Stream</h3>
                <p className="text-white/60">{error}</p>
              </div>
            ) : playbackData?.hls_url ? (
              <video
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                src={playbackData.hls_url}
              >
                <source src={playbackData.hls_url} type="application/x-mpegURL" />
                Your browser does not support HLS playback.
              </video>
            ) : (
              <div className="text-center">
                <Train className="w-12 h-12 text-[#ff7a00] mx-auto mb-4" />
                <p className="text-white/80">Preparing stream...</p>
              </div>
            )}
          </div>
          
          {/* Camera Info */}
          <div className="p-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{camera?.name}</h3>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {camera?.location}
                </p>
              </div>
              {camera?.status === 'online' && (
                <Badge className="bg-red-600 text-white flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Camera Directory Component
function CameraDirectory({ cameras, userTier, onCameraClick, searchQuery, setSearchQuery, filterState, setFilterState }) {
  // Get unique states from cameras
  const states = [...new Set(cameras.map(c => {
    const parts = c.name?.split(', ');
    return parts?.length > 1 ? parts[parts.length - 1] : null;
  }).filter(Boolean))].sort();

  // Filter cameras
  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = !searchQuery || 
      camera.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = !filterState || filterState === 'all' ||
      camera.name?.includes(filterState);
    
    return matchesSearch && matchesState;
  });

  return (
    <div id="cameras" className="py-8 px-4 md:px-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Camera Directory</h2>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search cameras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="w-full md:w-48 bg-card border-border">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All States</SelectItem>
            {states.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Results count */}
      <p className="text-muted-foreground mb-4">
        Showing {filteredCameras.length} of {cameras.length} cameras
      </p>
      
      {/* Camera Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCameras.map(camera => (
          <CameraCard
            key={camera._id}
            camera={camera}
            userTier={userTier}
            onClick={onCameraClick}
          />
        ))}
      </div>
      
      {filteredCameras.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No cameras found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav skeleton */}
      <div className="h-16 bg-black/50" />
      
      {/* Hero skeleton */}
      <div className="h-[70vh] bg-gradient-to-b from-gray-900 to-background flex items-center">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-16 w-96 mb-4" />
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
      
      {/* Rows skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} className="mb-8">
          <Skeleton className="h-8 w-48 mx-8 mb-4" />
          <div className="flex gap-4 px-8 overflow-hidden">
            {[1, 2, 3, 4, 5].map(j => (
              <Skeleton key={j} className="flex-shrink-0 w-[320px] h-[180px] rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main App Component
export default function App() {
  const [cameras, setCameras] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [loginOpen, setLoginOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  
  // Selected camera state
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  
  // Directory filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');

  // Load cameras and check auth on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Load cameras
        const catalogData = await clientApi.getCatalog();
        if (Array.isArray(catalogData)) {
          setCameras(catalogData);
        }
        
        // Check for existing session
        const savedUser = auth.getUser();
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (err) {
        console.error('Init error:', err);
        toast.error('Failed to load cameras');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  // Handle camera click
  const handleCameraClick = async (camera) => {
    setSelectedCamera(camera);
    
    const userTier = user?.membership_tier || 'guest';
    const canAccess = auth.canAccess(userTier, camera.min_tier);
    
    if (!canAccess) {
      // Show upgrade dialog
      setUpgradeOpen(true);
      return;
    }
    
    // Authorize playback
    setWatchOpen(true);
    setPlaybackLoading(true);
    setPlaybackError(null);
    setPlaybackData(null);
    
    try {
      const data = await clientApi.authorizePlayback(camera._id);
      
      if (data.ok && data.hls_url) {
        setPlaybackData(data);
      } else if (data.detail) {
        setPlaybackError(data.detail);
      } else {
        setPlaybackError('Unable to authorize playback');
      }
    } catch (err) {
      console.error('Playback error:', err);
      setPlaybackError('Connection error. Please try again.');
    } finally {
      setPlaybackLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    auth.clear();
    setUser(null);
    clientApi.logout();
    toast.success('Signed out successfully');
  };

  // Organize cameras by tier/category
  const featuredCamera = cameras.find(c => c.status === 'online') || cameras[0];
  const freeCameras = cameras.filter(c => c.min_tier === 'fireman');
  const conductorCameras = cameras.filter(c => c.min_tier === 'conductor');
  const engineerCameras = cameras.filter(c => c.min_tier === 'engineer');
  const onlineCameras = cameras.filter(c => c.status === 'online');

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      {/* Navigation */}
      <Navigation
        user={user}
        onLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />
      
      {/* Hero Section */}
      <HeroSection
        featuredCamera={featuredCamera}
        onWatch={handleCameraClick}
        userTier={user?.membership_tier}
      />
      
      {/* Camera Rows */}
      <div className="py-8 -mt-20 relative z-10">
        <CameraRow
          title="Live Now"
          cameras={onlineCameras}
          userTier={user?.membership_tier}
          onCameraClick={handleCameraClick}
        />
        
        <CameraRow
          title="Free Cameras"
          cameras={freeCameras}
          userTier={user?.membership_tier}
          onCameraClick={handleCameraClick}
        />
        
        {conductorCameras.length > 0 && (
          <CameraRow
            title="Conductor Exclusive"
            cameras={conductorCameras}
            userTier={user?.membership_tier}
            onCameraClick={handleCameraClick}
          />
        )}
        
        {engineerCameras.length > 0 && (
          <CameraRow
            title="Engineer Exclusive"
            cameras={engineerCameras}
            userTier={user?.membership_tier}
            onCameraClick={handleCameraClick}
          />
        )}
      </div>
      
      {/* Camera Directory */}
      <CameraDirectory
        cameras={cameras}
        userTier={user?.membership_tier}
        onCameraClick={handleCameraClick}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterState={filterState}
        setFilterState={setFilterState}
      />
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Train className="w-6 h-6 text-[#ff7a00]" />
              <span className="text-xl font-bold">
                <span className="text-white">Rail</span>
                <span className="text-[#ff7a00]">Stream</span>
              </span>
            </div>
            <div className="flex gap-6 text-muted-foreground text-sm">
              <a href="#" className="hover:text-white transition">About</a>
              <a href="#" className="hover:text-white transition">Hosts</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} RailStream. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Dialogs */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={setUser}
      />
      
      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        requiredTier={selectedCamera?.min_tier}
        camera={selectedCamera}
      />
      
      <WatchDialog
        open={watchOpen}
        onClose={() => {
          setWatchOpen(false);
          setPlaybackData(null);
          setPlaybackError(null);
        }}
        camera={selectedCamera}
        playbackData={playbackData}
        loading={playbackLoading}
        error={playbackError}
      />
    </div>
  );
}
