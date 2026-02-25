'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import {
  Train,
  Play,
  Lock,
  Search,
  LogOut,
  Menu,
  X,
  MapPin,
  Loader2,
  ExternalLink,
  Users,
  Radio,
  Grid2X2,
  Grid3X3,
  Square,
  Columns2,
  MessageCircle,
  Send,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Zap,
  Shield,
  Crown,
  Clock,
  Monitor,
  Smartphone,
  Tv,
  HelpCircle,
  Mail,
  CreditCard,
  Info,
  Eye,
} from 'lucide-react';
import { clientApi } from '@/lib/api';
import { auth } from '@/lib/auth';

// Tier config
const TIERS = {
  fireman: { label: 'Fireman', icon: Zap, color: 'from-orange-600 to-orange-500', price: 'FREE', level: 1 },
  conductor: { label: 'Conductor', icon: Shield, color: 'from-blue-600 to-blue-500', price: '$8.95/mo', level: 2 },
  engineer: { label: 'Engineer', icon: Crown, color: 'from-purple-600 to-purple-500', price: '$12.95/mo', level: 3 },
};

const canAccess = (userTier, cameraTier) => {
  if (cameraTier === 'fireman') return true;
  return (TIERS[userTier]?.level || 0) >= (TIERS[cameraTier]?.level || 0);
};

// View modes
const VIEW_MODES = [
  { id: 'single', label: '1', icon: Square, slots: 1 },
  { id: 'dual', label: '2', icon: Columns2, slots: 2 },
  { id: 'quad', label: '4', icon: Grid2X2, slots: 4 },
  { id: 'nine', label: '9', icon: Grid3X3, slots: 9 },
];

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
const storage = {
  getFavorites: () => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('railstream_favorites') || '[]');
    } catch { return []; }
  },
  setFavorites: (favorites) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('railstream_favorites', JSON.stringify(favorites));
  },
  getPresets: () => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('railstream_presets') || '[]');
    } catch { return []; }
  },
  setPresets: (presets) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('railstream_presets', JSON.stringify(presets));
  },
  getLastView: () => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('railstream_lastview'));
    } catch { return null; }
  },
  setLastView: (view) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('railstream_lastview', JSON.stringify(view));
  },
};

// ============================================
// NAVIGATION
// ============================================
function Navigation({ user, onLogin, onLogout, currentPage, setCurrentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/95 backdrop-blur border-b border-white/5">
      <div className="h-full px-4 flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <button onClick={() => setCurrentPage('watch')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#ff7a00] to-orange-600 flex items-center justify-center">
            <Train className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            <span className="text-white">Rail</span>
            <span className="text-[#ff7a00]">Stream</span>
          </span>
        </button>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {[
            { id: 'watch', label: 'Watch', icon: Monitor },
            { id: 'cameras', label: 'Cameras', icon: Eye },
            { id: 'about', label: 'About', icon: Info },
            { id: 'hosts', label: 'Hosts', icon: Users },
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                currentPage === item.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${TIERS[user.membership_tier]?.color || 'from-gray-600 to-gray-500'} text-white text-xs font-semibold flex items-center gap-1.5`}>
                {user.membership_tier === 'engineer' && <Crown className="w-3 h-3" />}
                {user.membership_tier === 'conductor' && <Shield className="w-3 h-3" />}
                {user.membership_tier === 'fireman' && <Zap className="w-3 h-3" />}
                {TIERS[user.membership_tier]?.label || user.membership_tier}
              </div>
              <span className="text-sm text-white/70 hidden sm:block">{user.username}</span>
              <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button onClick={onLogin} size="sm" className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white">
              Sign In
            </Button>
          )}
          
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-black/95 backdrop-blur border-b border-white/10 p-4 space-y-2">
          {['watch', 'cameras', 'about', 'hosts', 'faq'].map(page => (
            <button
              key={page}
              onClick={() => { setCurrentPage(page); setMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-lg capitalize ${
                currentPage === page ? 'bg-[#ff7a00] text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ============================================
// HLS VIDEO PLAYER COMPONENT
// ============================================
function HLSVideoPlayer({ src, autoPlay = true, muted = false, controls = true, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Dynamic import of hls.js
    import('hls.js').then((HlsModule) => {
      const Hls = HlsModule.default;
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch(() => {
              // Autoplay blocked, user needs to interact
            });
          }
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
            if (onError) onError(data.details || 'Stream error');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      } else {
        if (onError) onError('HLS not supported');
      }
    }).catch((err) => {
      console.error('Failed to load HLS.js:', err);
      if (onError) onError('Failed to load player');
    });

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, onError]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-contain bg-black"
      controls={controls}
      muted={muted}
      playsInline
    />
  );
}

// ============================================
// VIDEO PLAYER COMPONENT
// ============================================
function VideoPlayer({ camera, playbackData, isLoading, error, onClose, isMuted, setIsMuted, isMain = false }) {
  const canWatch = camera && playbackData?.hls_url;

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ff7a00] animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90">
        <div className="text-center p-4">
          <X className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!canWatch && camera) {
    return (
      <div className="absolute inset-0 bg-black">
        <img src={camera.thumbnail_path} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-10 h-10 text-white/40 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Upgrade to watch</p>
          </div>
        </div>
      </div>
    );
  }

  if (canWatch) {
    return (
      <HLSVideoPlayer
        src={playbackData.hls_url}
        autoPlay={true}
        muted={isMuted}
        controls={isMain}
        onError={(err) => console.error('Player error:', err)}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
      <p className="text-white/30 text-sm">Select a camera</p>
    </div>
  );
}

// ============================================
// CHAT COMPONENT
// ============================================
function ChatPanel({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Mike_RS', text: 'NS train approaching Fostoria!', time: '2m ago', tier: 'engineer' },
    { id: 2, user: 'TrainFan42', text: 'Great catch on that consist 🚂', time: '1m ago', tier: 'conductor' },
    { id: 3, user: 'Railwatcher', text: 'Anyone see the UP stack train earlier?', time: '30s ago', tier: 'fireman' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      user: 'You',
      text: newMessage,
      time: 'now',
      tier: 'engineer'
    }]);
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-zinc-900/95 backdrop-blur border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#ff7a00]" />
          <span className="font-semibold text-white">Live Chat</span>
          <Badge className="bg-green-500/20 text-green-400 text-xs">47 online</Badge>
        </div>
        <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="group">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${
                  msg.tier === 'engineer' ? 'text-purple-400' :
                  msg.tier === 'conductor' ? 'text-blue-400' : 'text-orange-400'
                }`}>{msg.user}</span>
                <span className="text-xs text-white/30">{msg.time}</span>
              </div>
              <p className="text-sm text-white/80 pl-0">{msg.text}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
          />
          <Button onClick={handleSend} size="icon" className="bg-[#ff7a00] hover:bg-[#ff8c20]">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          💬 Join our <a href="https://discord.gg/railstream" className="text-[#ff7a00] hover:underline">Discord</a> for more!
        </p>
      </div>
    </div>
  );
}

// ============================================
// CAMERA PICKER
// ============================================
function CameraPicker({ cameras, selectedCameras, onSelect, userTier, viewMode }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const filtered = cameras.filter(c => {
    const matchesSearch = !search || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.min_tier === filter;
    return matchesSearch && matchesFilter;
  });

  const regions = {
    'California': ['California'],
    'Midwest': ['Indiana', 'Illinois', 'Ohio', 'Kentucky', 'Michigan', 'Nebraska', 'Minnesota'],
    'East Coast': ['Pennsylvania', 'Virginia', 'West Virginia', 'New Jersey', 'North Carolina', 'Georgia', 'Florida'],
    'Texas': ['Texas'],
    'Canada': ['Ontario'],
  };

  const getRegion = (camera) => {
    for (const [region, states] of Object.entries(regions)) {
      if (states.some(s => camera.name?.includes(s))) return region;
    }
    return 'Other';
  };

  const groupedCameras = filtered.reduce((acc, cam) => {
    const region = getRegion(cam);
    if (!acc[region]) acc[region] = [];
    acc[region].push(cam);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      {/* Search & Filter */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cameras..."
            className="pl-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
          />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full bg-white/5 p-1">
            <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-[#ff7a00]">All</TabsTrigger>
            <TabsTrigger value="fireman" className="flex-1 text-xs data-[state=active]:bg-orange-600">Free</TabsTrigger>
            <TabsTrigger value="conductor" className="flex-1 text-xs data-[state=active]:bg-blue-600">Cond</TabsTrigger>
            <TabsTrigger value="engineer" className="flex-1 text-xs data-[state=active]:bg-purple-600">Eng</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Camera List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedCameras).map(([region, cams]) => (
            <div key={region} className="mb-4">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 mb-2">{region}</h4>
              <div className="space-y-1">
                {cams.map(camera => {
                  const isSelected = selectedCameras.some(c => c?._id === camera._id);
                  const hasAccess = canAccess(userTier, camera.min_tier);
                  
                  return (
                    <button
                      key={camera._id}
                      onClick={() => hasAccess && onSelect(camera)}
                      disabled={!hasAccess}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-[#ff7a00]/20 border border-[#ff7a00]/50' 
                          : hasAccess
                            ? 'hover:bg-white/5 border border-transparent'
                            : 'opacity-50 cursor-not-allowed border border-transparent'
                      }`}
                    >
                      <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                        <img src={camera.thumbnail_path} alt="" className="w-full h-full object-cover" />
                        {camera.status === 'online' && (
                          <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        {!hasAccess && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-white/60" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-white truncate">{camera.name}</p>
                        <p className="text-xs text-white/40 truncate">{camera.location}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#ff7a00] flex items-center justify-center text-white text-xs font-bold">
                          {selectedCameras.findIndex(c => c?._id === camera._id) + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// MULTI-VIEW WATCH PAGE
// ============================================
function WatchPage({ cameras, user, viewMode, setViewMode, selectedCameras, setSelectedCameras, playbackStates, loadCamera }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const handleSelectCamera = (camera, slotIndex = null) => {
    const slot = slotIndex ?? selectedCameras.findIndex(c => !c);
    const actualSlot = slot === -1 ? 0 : slot;
    
    loadCamera(camera, actualSlot);
  };

  const gridClass = {
    single: 'grid-cols-1 grid-rows-1',
    dual: 'grid-cols-2 grid-rows-1',
    quad: 'grid-cols-2 grid-rows-2',
    nine: 'grid-cols-3 grid-rows-3',
  }[viewMode];

  const slots = VIEW_MODES.find(m => m.id === viewMode)?.slots || 1;

  return (
    <div className="h-screen pt-14 flex bg-black">
      {/* Left: Camera Picker */}
      {pickerOpen && (
        <div className="w-72 border-r border-white/5 flex-shrink-0">
          <CameraPicker
            cameras={cameras}
            selectedCameras={selectedCameras}
            onSelect={handleSelectCamera}
            userTier={user?.membership_tier}
            viewMode={viewMode}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* View Controls */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className={`p-2 rounded-lg transition ${pickerOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${!pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="h-6 w-px bg-white/10 mx-2" />
            
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {VIEW_MODES.map(mode => {
                const needsUpgrade = (mode.id === 'dual' || mode.id === 'quad' || mode.id === 'nine') && 
                  (!user || user.membership_tier === 'fireman');
                
                return (
                  <button
                    key={mode.id}
                    onClick={() => !needsUpgrade && setViewMode(mode.id)}
                    disabled={needsUpgrade}
                    className={`relative p-2 rounded transition-all ${
                      viewMode === mode.id 
                        ? 'bg-[#ff7a00] text-white' 
                        : needsUpgrade
                          ? 'text-white/20 cursor-not-allowed'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                    title={needsUpgrade ? 'Upgrade to Conductor or Engineer' : `${mode.label} view`}
                  >
                    <mode.icon className="w-4 h-4" />
                    {needsUpgrade && <Lock className="w-2 h-2 absolute top-1 right-1 text-white/40" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition ${isMuted ? 'text-red-400' : 'text-white/50 hover:text-white'}`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-lg transition flex items-center gap-2 ${chatOpen ? 'bg-[#ff7a00] text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 flex min-h-0">
          <div className={`flex-1 grid ${gridClass} gap-1 p-1 bg-black`}>
            {Array.from({ length: slots }).map((_, i) => {
              const camera = selectedCameras[i];
              const state = playbackStates[i] || {};
              
              return (
                <div 
                  key={i} 
                  className="relative bg-zinc-900 rounded overflow-hidden group"
                  onClick={() => !camera && setPickerOpen(true)}
                >
                  {camera ? (
                    <>
                      <VideoPlayer
                        camera={camera}
                        playbackData={state.data}
                        isLoading={state.loading}
                        error={state.error}
                        isMuted={isMuted || i > 0}
                        setIsMuted={setIsMuted}
                        isMain={i === 0}
                      />
                      {/* Camera label overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium truncate">{camera.name}</p>
                            <p className="text-white/60 text-xs truncate">{camera.location}</p>
                          </div>
                          {camera.status === 'online' && (
                            <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                          )}
                        </div>
                      </div>
                      {/* Close button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newCameras = [...selectedCameras];
                          newCameras[i] = null;
                          setSelectedCameras(newCameras);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-white/5 transition">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                          <Play className="w-6 h-6 text-white/30" />
                        </div>
                        <p className="text-white/30 text-sm">Click to add camera</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chat Panel */}
          <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(false)} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// CAMERAS PAGE
// ============================================
function CamerasPage({ cameras, user, onSelectCamera }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  
  const tierOrder = { fireman: 1, conductor: 2, engineer: 3 };
  
  const filtered = cameras
    .filter(c => {
      const matchesSearch = !search || 
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      const matchesTab = tab === 'all' || c.min_tier === tab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => tierOrder[a.min_tier] - tierOrder[b.min_tier]);

  const tierGroups = {
    fireman: { title: 'Fireman Cameras (FREE)', desc: '14 complimentary railcams — no login necessary!', cameras: [] },
    conductor: { title: 'Conductor Cameras ($8.95/mo)', desc: 'All Fireman cameras plus Berea, Fostoria NKP, West Newton + ad-free viewing.', cameras: [] },
    engineer: { title: 'Engineer Cameras ($12.95/mo)', desc: 'Access to ALL railcams + mobile/TV apps + all features.', cameras: [] },
  };

  filtered.forEach(c => {
    if (tierGroups[c.min_tier]) tierGroups[c.min_tier].cameras.push(c);
  });

  return (
    <div className="min-h-screen pt-14 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Our Cameras</h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            46 live railcams across the USA and Canada. The best video and audio quality on the web — 
            second only to being trackside!
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location, state, or railroad..."
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white/5 h-12">
              <TabsTrigger value="all" className="px-4 data-[state=active]:bg-[#ff7a00]">All</TabsTrigger>
              <TabsTrigger value="fireman" className="px-4 data-[state=active]:bg-orange-600">Free</TabsTrigger>
              <TabsTrigger value="conductor" className="px-4 data-[state=active]:bg-blue-600">Conductor</TabsTrigger>
              <TabsTrigger value="engineer" className="px-4 data-[state=active]:bg-purple-600">Engineer</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Camera Groups */}
        {Object.entries(tierGroups).map(([tier, group]) => {
          if (group.cameras.length === 0) return null;
          const TierIcon = TIERS[tier]?.icon || Zap;
          
          return (
            <div key={tier} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${TIERS[tier]?.color}`}>
                  <TierIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{group.title}</h2>
                  <p className="text-sm text-white/50">{group.desc}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.cameras.map(camera => {
                  const hasAccess = canAccess(user?.membership_tier, camera.min_tier);
                  
                  return (
                    <button
                      key={camera._id}
                      onClick={() => hasAccess && onSelectCamera(camera)}
                      className={`group relative rounded-xl overflow-hidden bg-zinc-900 text-left transition-all hover:scale-[1.02] hover:shadow-xl ${
                        !hasAccess ? 'opacity-70' : ''
                      }`}
                    >
                      <div className="aspect-video relative">
                        <img src={camera.thumbnail_path} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        {camera.status === 'online' && (
                          <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                            <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                            LIVE
                          </Badge>
                        )}
                        
                        {!hasAccess && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white/50" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasAccess && (
                            <div className="w-14 h-14 rounded-full bg-[#ff7a00] flex items-center justify-center">
                              <Play className="w-7 h-7 text-white ml-1" fill="white" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1">{camera.name}</h3>
                        <p className="text-sm text-white/50 mb-2">{camera.location}</p>
                        <p className="text-xs text-white/40 line-clamp-2">{camera.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ABOUT PAGE
// ============================================
function AboutPage() {
  return (
    <div className="min-h-screen pt-14 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero with Logo */}
        <div className="text-center mb-16">
          <img 
            src="https://railstream.net/images/Homepage/Transparent_Stroke.png" 
            alt="RailStream Logo" 
            className="h-24 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-white mb-4">About RailStream</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Superior image with sound quality that is only second to being trackside.
          </p>
        </div>
        
        <div className="space-y-12">
          {/* Our Story with Photo */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://railstream.net/images/us2.png" 
                alt="Mike and Andrea" 
                className="rounded-2xl w-full shadow-2xl"
              />
            </div>
            <div className="bg-zinc-900 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                Over a decade ago we had the idea for a railcam at the historic Fostoria Iron Triangle. 
                It was the first live railcam with sound and it took off like hotcakes! We've grown a lot 
                since the original cam, but we stay true to our roots.
              </p>
              <p className="text-white/70 leading-relaxed mb-4">
                It is through this commitment to excellence that Railstream has amassed a worldwide following. 
                We strive to make Railstream a place for all railfans to come and feel welcomed.
              </p>
              <p className="text-[#ff7a00] font-semibold text-lg">— Mike & Andrea</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Monitor, value: '46', label: 'Live Cameras' },
              { icon: Train, value: '19', label: 'Railroads' },
              { icon: Clock, value: '2M+', label: 'Hours/Month' },
              { icon: Users, value: '175', label: 'Countries' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-6 text-center">
                <stat.icon className="w-8 h-8 text-[#ff7a00] mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Two People on a Mission with Photo */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-zinc-900 rounded-2xl p-8 order-2 md:order-1">
              <h2 className="text-3xl font-bold text-white mb-4">Two People On a Mission</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                We aim to create the most immersive and reliable rail-viewing experience online. 
                Whether you're a lifelong railfan or just discovering the joy of trains, Railstream 
                brings you closer to the tracks than ever before.
              </p>
              <p className="text-white/70 leading-relaxed">
                Our team is dedicated to quality, innovation, and community — always striving to make 
                Railstream better for everyone who loves the rails.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <img 
                src="https://railstream.net/images/us3.png" 
                alt="RailStream team in Selma" 
                className="rounded-2xl w-full shadow-2xl"
              />
            </div>
          </div>

          {/* The RailStream Difference */}
          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">The RailStream Difference</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Eye, title: 'Superior Video', desc: 'Our video quality and clarity is second to none.' },
                { icon: Volume2, title: 'Exquisite Audio', desc: 'Simulate the trackside experience with crystal-clear sound.' },
                { icon: Zap, title: 'Night Vision', desc: 'Additional lighting for 24/7 nighttime viewing.' },
                { icon: Radio, title: 'Scanner Feeds', desc: 'Railroad radio at most locations.' },
              ].map((feature, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 rounded-xl bg-[#ff7a00]/20 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-[#ff7a00]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* With Help of Friends */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://railstream.net/images/uslong.png" 
                alt="RailStream team on site" 
                className="rounded-2xl w-full shadow-2xl"
              />
            </div>
            <div className="bg-zinc-900 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">With the Help of Friends</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                We're blessed to work with an incredible network of partners, organizations, and 
                generous families who help make our camera locations possible.
              </p>
              <p className="text-white/70 leading-relaxed mb-4">
                Many of our most beloved views exist thanks to railfans who've opened their backyards, 
                businesses, and properties so we can bring you the next best thing to railfanning trackside.
              </p>
              <p className="text-white/50 text-sm mb-4">
                A Special Thanks to: Mark, Kevin, Lloyd, Ron, Tom, Thomas, Justin, and Warren — your 
                support and guidance have made a meaningful difference.
              </p>
              <p className="text-[#ff7a00] font-semibold">— Mike & Andrea</p>
            </div>
          </div>

          {/* Watch Everywhere */}
          <div className="bg-gradient-to-r from-[#ff7a00] to-orange-600 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Watch Everywhere</h2>
            <p className="text-white/90 mb-6">Available 24/7/365 on all your favorite platforms.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Roku', url: 'https://channelstore.roku.com/details/74e07738778cf9dfb74340ef94503257' },
                { name: 'Amazon Fire TV', url: 'https://www.amazon.com/Railstream/dp/B08466FH5Q' },
                { name: 'Apple TV / iOS', url: 'https://apps.apple.com/us/app/railstream/id1520484749' },
                { name: 'Android', url: 'https://play.google.com/store/apps/details?id=com.maz.combo2225rs' },
              ].map((platform, i) => (
                <a 
                  key={i} 
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition"
                >
                  <Tv className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">{platform.name}</span>
                  <ExternalLink className="w-4 h-4 text-white/70" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HOSTS PAGE
// ============================================
function HostsPage() {
  const hosts = [
    { name: "Bim's Package", location: "Atlanta, Georgia", url: "https://bimsliquor.com/" },
    { name: "Boyce Railway Depot Foundation", location: "Boyce, Virginia", url: "https://boycedepot.com/" },
    { name: "Riley's Railhouse", location: "Chesterton, Indiana", url: "https://www.rileysrailhouse.com/" },
    { name: "Mount Carmel High School", location: "Chicago, Illinois", url: "https://www.mchs.org/" },
    { name: "The Station Inn", location: "Cresson, Pennsylvania", url: "https://stationinnpa.com/" },
    { name: "Sandy Creek Mining Company", location: "West Newton, PA", url: "https://sandycreekmining.com/" },
    { name: "Fullerton Train Museum", location: "Fullerton, California", url: "https://fullertontrainmuseum.org/" },
    { name: "Ludlow Heritage Museum", location: "Ludlow, Kentucky", url: "https://www.ludlowheritagemuseum.com/" },
    { name: "Oregon Depot Museum", location: "Oregon, Illinois", url: "http://oregondepot.com/" },
    { name: "City of Selma", location: "Selma, North Carolina" },
    { name: "The Black Dog Coffee Company", location: "Shenandoah Jct, WV", url: "https://blackdogcoffee.net/" },
    { name: "Roomettes", location: "Belleville, Ontario", url: "https://roometteslighting.com/" },
    { name: "Mad River & NKP Railroad Museum", location: "Bellevue, Ohio", url: "https://madrivermuseum.org/" },
    { name: "Village of Coal City", location: "Coal City, Illinois" },
    { name: "Durand Union Station", location: "Durand, Michigan", url: "https://www.durandstation.org/" },
    { name: "Village of Franklin Park", location: "Franklin Park, IL", url: "https://www.villageoffranklinpark.com/" },
    { name: "Whole Cubes", location: "La Grange, Illinois", url: "https://wholecubes.com/" },
    { name: "Copy Cat Printing", location: "Grand Island, Nebraska" },
    { name: "Marion Union Station Assoc.", location: "Marion, Ohio" },
    { name: "Advanced Auto Images", location: "Northwood, Ohio", url: "http://www.advancedautoimages.com/" },
    { name: "Rosenberg Railroad Museum", location: "Rosenberg, Texas", url: "https://www.rosenbergrrmuseum.org/" },
    { name: "City of Saginaw", location: "Saginaw, Texas" },
    { name: "CentrA Mod", location: "Temple, Texas", url: "http://centramodrr.com/" },
    { name: "Waldwick Historical Society", location: "Waldwick, NJ", url: "https://www.allaboardwaldwick.org/" },
  ];

  return (
    <div className="min-h-screen pt-14 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white text-center mb-4">Our Hosts</h1>
        <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
          Our cameras wouldn't be possible without the support of our incredible hosts. 
          Each location offers a unique rail experience.
        </p>

        <div className="bg-zinc-900 rounded-2xl p-6 mb-8">
          <p className="text-white/70 leading-relaxed">
            A huge thank you also goes out to our community partners and the railfan families 
            (The Behrs, The Tweeds, The Kuiphoffs, The Schillingers, Mr Snyder, Mr Hinsdale, 
            Mr Horner, Mr Southwell, Mr Poll, and Mr Wallace) who have graciously opened their backyards. 
            Your generosity has helped us grow and make Railstream what it is today.
          </p>
          <p className="text-[#ff7a00] font-semibold mt-4">— Mike & Andrea</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosts.map((host, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#ff7a00]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#ff7a00]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{host.name}</h3>
                <p className="text-sm text-white/50 mb-2">{host.location}</p>
                {host.url && (
                  <a href={host.url} target="_blank" rel="noopener noreferrer" 
                     className="text-sm text-[#ff7a00] hover:underline inline-flex items-center gap-1">
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#ff7a00] to-orange-600 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Want to be a RailStream host?</h3>
          <p className="text-white/80 mb-4">Have an idea for a new railcam location?</p>
          <a href="mailto:railcam@railstream.net" className="inline-flex items-center gap-2 bg-white text-[#ff7a00] px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition">
            <Mail className="w-5 h-5" />
            railcam@railstream.net
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FAQ PAGE
// ============================================
function FAQPage() {
  const faqs = [
    {
      q: "How do I upgrade my membership?",
      a: "Click on 'Account Info' in the top menu, select 'SignUp Form', choose your membership type, and follow the payment prompts. Engineer level includes access to TV and mobile apps."
    },
    {
      q: "Why do free cameras have ads and timeouts?",
      a: "Ads and timeouts allow us to offer 14 cameras to the public for free. Without them, RailStream would be unable to provide free cameras and maintain the site. Upgrade to Conductor or Engineer for ad-free viewing."
    },
    {
      q: "Why can't I log into more than one device?",
      a: "Due to security settings, users cannot log into more than one machine simultaneously. We offer dual view and quad view (Conductor and Engineer members) so you can enjoy multiple cameras at once."
    },
    {
      q: "What do I do if cameras are buffering?",
      a: "Check your internet connection speed at speedtest.net. We recommend at least 6 Mbps and a dual-core processor or newer. For multi-view, a faster connection helps."
    },
    {
      q: "I see the cameras but no sound?",
      a: "Check that your computer volume isn't muted and that the mute button on the camera player isn't enabled. If issues persist, contact us."
    },
    {
      q: "Can I post RailStream content on YouTube or social media?",
      a: "All content is property of RailStream, LLC and protected by copyright. Any rebroadcast or retransmission without expressed written consent is prohibited."
    },
    {
      q: "Can you wipe rain or snow off the cameras?",
      a: "Unfortunately, no. Our cameras brave the elements outdoors. Mother Nature will hopefully clear things up so we don't miss too many trains!"
    },
  ];

  return (
    <div className="min-h-screen pt-14 bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white text-center mb-4">FAQ</h1>
        <p className="text-white/60 text-center mb-12">Common questions from the RailStream community.</p>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#ff7a00] flex-shrink-0 mt-0.5" />
                {faq.q}
              </h3>
              <p className="text-white/60 pl-8">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-zinc-900 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
          <p className="text-white/60 mb-4">Our team is here to help!</p>
          <a href="mailto:contactus@railstream.net" className="inline-flex items-center gap-2 bg-[#ff7a00] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#ff8c20] transition">
            <Mail className="w-5 h-5" />
            contactus@railstream.net
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOGIN DIALOG
// ============================================
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
        setError(data.detail || 'Invalid credentials');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded bg-[#ff7a00] flex items-center justify-center">
              <Train className="w-5 h-5 text-white" />
            </div>
            Sign In to RailStream
          </DialogTitle>
          <DialogDescription>
            Access premium cameras and features
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-12 bg-zinc-800 border-zinc-700 text-white"
            required
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-zinc-800 border-zinc-700 text-white"
            required
          />
          
          <Button type="submit" className="w-full h-12 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-white/40 text-sm">
            New to RailStream?{' '}
            <a href="https://railstream.net/member/signup" target="_blank" className="text-[#ff7a00] hover:underline font-medium">
              Join Today
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [cameras, setCameras] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('watch');
  const [loginOpen, setLoginOpen] = useState(false);
  
  // Multi-view state
  const [viewMode, setViewMode] = useState('single');
  const [selectedCameras, setSelectedCameras] = useState([null, null, null, null, null, null, null, null, null]);
  const [playbackStates, setPlaybackStates] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const catalog = await clientApi.getCatalog();
        if (Array.isArray(catalog)) setCameras(catalog);
        
        const savedUser = auth.getUser();
        if (savedUser) setUser(savedUser);
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadCamera = async (camera, slotIndex) => {
    if (!canAccess(user?.membership_tier, camera.min_tier)) {
      toast.error(`Upgrade to ${TIERS[camera.min_tier]?.label} to watch this camera`);
      return;
    }

    // Update selected cameras
    const newCameras = [...selectedCameras];
    newCameras[slotIndex] = camera;
    setSelectedCameras(newCameras);

    // Set loading state
    setPlaybackStates(prev => ({
      ...prev,
      [slotIndex]: { loading: true, data: null, error: null }
    }));

    try {
      const data = await clientApi.authorizePlayback(camera._id);
      if (data.ok && data.hls_url) {
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: { loading: false, data, error: null }
        }));
      } else {
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: { loading: false, data: null, error: data.detail || 'Unable to load' }
        }));
      }
    } catch {
      setPlaybackStates(prev => ({
        ...prev,
        [slotIndex]: { loading: false, data: null, error: 'Connection error' }
      }));
    }
  };

  const handleSelectCameraFromPage = (camera) => {
    setCurrentPage('watch');
    setTimeout(() => loadCamera(camera, 0), 100);
  };

  const handleLogout = () => {
    auth.clear();
    setUser(null);
    clientApi.logout();
    toast.success('Signed out');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#ff7a00] to-orange-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Train className="w-10 h-10 text-white" />
          </div>
          <p className="text-white/50">Loading RailStream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" richColors />
      
      <Navigation
        user={user}
        onLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {currentPage === 'watch' && (
        <WatchPage
          cameras={cameras}
          user={user}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedCameras={selectedCameras}
          setSelectedCameras={setSelectedCameras}
          playbackStates={playbackStates}
          loadCamera={loadCamera}
        />
      )}

      {currentPage === 'cameras' && (
        <CamerasPage
          cameras={cameras}
          user={user}
          onSelectCamera={handleSelectCameraFromPage}
        />
      )}

      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'hosts' && <HostsPage />}
      {currentPage === 'faq' && <FAQPage />}

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={setUser}
      />
    </div>
  );
}
