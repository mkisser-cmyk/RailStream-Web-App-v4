'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Star,
  Heart,
  Bookmark,
  Save,
  Trash2,
  Zap,
  Shield,
  Crown,
  Clock,
  Monitor,
  Smartphone,
  Tv,
  HelpCircle,
  Mail,
  Info,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Globe,
  Download,
  Camera,
  ArrowRight,
  Settings,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
  Video,
  Plus,
  CameraOff,
  Sparkles,
  Facebook,
  LayoutPanelLeft,
} from 'lucide-react';
import { clientApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import YardChat from '@/components/YardChat';
import GptAdSlot from '@/components/GptAdSlot';

// ============================================
// CONSTANTS & HELPERS
// ============================================

// Persistent device ID — unique per browser, stored in localStorage
function getDeviceId() {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('railstream_device_id');
  if (!id) {
    id = 'web-' + crypto.randomUUID();
    localStorage.setItem('railstream_device_id', id);
  }
  return id;
}

// Get browser/device info for API device registration
function getDeviceInfo() {
  if (typeof window === 'undefined') return { platform: 'web', device_name: 'Web Browser' };
  const ua = navigator.userAgent;
  let browser = 'Web Browser';
  let os = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  return {
    platform: 'web',
    device_name: `${browser} on ${os}`,
    device_model: browser,
    os_version: os,
    app_version: 'Web 1.0',
  };
}

const TIERS = {
  fireman: { label: 'Fireman', icon: Zap, color: 'from-orange-600 to-orange-500', price: 'FREE', level: 1 },
  conductor: { label: 'Conductor', icon: Shield, color: 'from-blue-600 to-blue-500', price: '$8.95/mo', level: 2 },
  engineer: { label: 'Engineer', icon: Crown, color: 'from-purple-600 to-purple-500', price: '$12.95/mo', level: 3 },
};

const canAccess = (userTier, cameraTier, isAdmin = false) => {
  if (isAdmin) return true; // Admins can access everything
  if (cameraTier === 'fireman') return true;
  return (TIERS[userTier]?.level || 0) >= (TIERS[cameraTier]?.level || 0);
};

// Custom 4x4 grid icon for 16-way view
function Grid4X4({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="4" height="4" rx="0.5" />
      <rect x="8" y="2" width="4" height="4" rx="0.5" />
      <rect x="14" y="2" width="4" height="4" rx="0.5" />
      <rect x="20" y="2" width="2" height="4" rx="0.5" />
      <rect x="2" y="8" width="4" height="4" rx="0.5" />
      <rect x="8" y="8" width="4" height="4" rx="0.5" />
      <rect x="14" y="8" width="4" height="4" rx="0.5" />
      <rect x="20" y="8" width="2" height="4" rx="0.5" />
      <rect x="2" y="14" width="4" height="4" rx="0.5" />
      <rect x="8" y="14" width="4" height="4" rx="0.5" />
      <rect x="14" y="14" width="4" height="4" rx="0.5" />
      <rect x="20" y="14" width="2" height="4" rx="0.5" />
      <rect x="2" y="20" width="4" height="2" rx="0.5" />
      <rect x="8" y="20" width="4" height="2" rx="0.5" />
      <rect x="14" y="20" width="4" height="2" rx="0.5" />
      <rect x="20" y="20" width="2" height="2" rx="0.5" />
    </svg>
  );
}

const VIEW_MODES = [
  { id: 'single', label: '1', icon: Square, slots: 1 },
  { id: 'dual', label: '2', icon: Columns2, slots: 2 },
  { id: 'quad', label: '4', icon: Grid2X2, slots: 4 },
  { id: 'main5', label: '1+5', icon: LayoutPanelLeft, slots: 6 },
  { id: 'nine', label: '9', icon: Grid3X3, slots: 9 },
  { id: 'sixteen', label: '16', icon: Grid4X4, slots: 16 },
];

// Local Storage
const storage = {
  getFavorites: () => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('railstream_favorites') || '[]'); } catch { return []; }
  },
  setFavorites: (f) => { if (typeof window !== 'undefined') localStorage.setItem('railstream_favorites', JSON.stringify(f)); },
  getPresets: () => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('railstream_presets') || '[]'); } catch { return []; }
  },
  setPresets: (p) => { if (typeof window !== 'undefined') localStorage.setItem('railstream_presets', JSON.stringify(p)); },
};

// ============================================
// VIDEO PLAYER COMPONENTS
// ============================================
import HlsPlayer, { BackgroundHlsPlayer } from '@/components/HlsPlayer';

// ============================================
// NAVIGATION
// ============================================
function Navigation({ user, onLogin, onLogout, currentPage, setCurrentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);
  const aboutTimeoutRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home', href: null },
    { id: 'watch', label: 'Watch', href: null },
    { id: 'cameras', label: 'Cameras', href: '/cameras' },
    { id: 'sightings', label: 'Train Log', href: '/sightings' },
  ];

  const aboutItems = [
    { id: 'features', label: 'Features', href: '/features', description: 'Everything our player can do', badge: 'NEW' },
    { id: 'pricing', label: 'Pricing', href: '/pricing', description: 'Plans & subscription options' },
    { id: 'about', label: 'Our Story', href: null, description: 'The RailStream journey' },
    { id: 'technology', label: 'Our Technology', href: '/technology', description: 'Self-hosted infrastructure' },
    { id: 'host', label: 'Host a Camera', href: '/host', description: 'Partner with us' },
    { id: '15years', label: '15 Year Anniversary', href: '/15years', description: 'Celebrating since 2011', emoji: '\ud83c\udf89' },
    { id: 'status', label: 'Network Status', href: '/network-status', description: 'Live system health' },
    { id: 'contact', label: 'Contact Us', href: '/contact', description: 'Get in touch' },
  ];

  const handleNavClick = (item) => {
    if (item.href) {
      window.location.href = item.href;
    } else {
      setCurrentPage(item.id);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAboutEnter = () => {
    if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
    setAboutOpen(true);
  };

  const handleAboutLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => setAboutOpen(false), 200);
  };

  const isAboutActive = aboutItems.some(item => currentPage === item.id);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => setCurrentPage('home')} 
          className="flex items-center gap-3"
          aria-label="RailStream Home"
        >
          <img 
            src="https://railstream.net/images/Homepage/WebsiteLogo.png" 
            alt="RailStream Logo" 
            className="h-10"
          />
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1" role="menubar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              role="menuitem"
              aria-current={currentPage === item.id ? 'page' : undefined}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id 
                  ? 'bg-[#ff7a00] text-white' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* About Dropdown */}
          <div
            ref={aboutRef}
            className="relative"
            onMouseEnter={handleAboutEnter}
            onMouseLeave={handleAboutLeave}
          >
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isAboutActive
                  ? 'bg-[#ff7a00] text-white'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="About menu"
              aria-expanded={aboutOpen}
            >
              About
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>

            {aboutOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-72 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-y-auto max-h-[calc(100vh-80px)]"
                onMouseEnter={handleAboutEnter}
                onMouseLeave={handleAboutLeave}
              >
                <div className="p-1.5">
                  {aboutItems.map((item) => {
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { handleNavClick(item); setAboutOpen(false); }}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                          isActive
                            ? 'bg-[#ff7a00]/15 text-[#ff7a00]'
                            : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.emoji && <span className="text-base">{item.emoji}</span>}
                            <span className="font-medium text-sm">{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 bg-[#ff7a00] text-white text-[10px] font-bold rounded-full leading-none">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${isActive ? 'text-[#ff7a00]/70' : 'text-white/40 group-hover:text-white/50'}`}>
                            {item.description}
                          </p>
                        </div>
                        <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isActive ? 'opacity-100' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`hidden sm:flex px-3 py-1.5 rounded-full bg-gradient-to-r ${TIERS[user.membership_tier]?.color} text-white text-xs font-bold items-center gap-1.5`}>
                {user.is_admin && <Crown className="w-3 h-3" />}
                {!user.is_admin && user.membership_tier === 'engineer' && <Crown className="w-3 h-3" />}
                {!user.is_admin && user.membership_tier === 'conductor' && <Shield className="w-3 h-3" />}
                {!user.is_admin && user.membership_tier === 'fireman' && <Zap className="w-3 h-3" />}
                {user.is_admin ? 'Admin' : TIERS[user.membership_tier]?.label}
              </span>
              <span className="text-white text-sm hidden sm:block">{user.username}</span>
              <button 
                onClick={onLogout} 
                className="p-2 rounded-lg hover:bg-white/10 text-white transition"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button onClick={onLogin} className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold">
              Sign In
            </Button>
          )}
          
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="md:hidden p-2 text-white"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/10 p-4 max-h-[80vh] overflow-y-auto" role="menu">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { handleNavClick(item); setMenuOpen(false); }}
              role="menuitem"
              className={`block w-full text-left px-4 py-3 rounded-lg text-white font-medium mb-1 ${
                currentPage === item.id ? 'bg-[#ff7a00]' : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* About section divider */}
          <div className="border-t border-white/10 my-3 mx-4" />
          <p className="px-4 py-1 text-xs font-bold text-white/40 uppercase tracking-wider">About RailStream</p>

          {aboutItems.map(item => (
            <button
              key={item.id}
              onClick={() => { handleNavClick(item); setMenuOpen(false); }}
              role="menuitem"
              className={`block w-full text-left px-4 py-3 rounded-lg text-white font-medium mb-1 ${
                currentPage === item.id ? 'bg-[#ff7a00]' : 'hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.emoji && <span>{item.emoji}</span>}
                {item.label}
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-[#ff7a00] text-white text-[10px] font-bold rounded-full">{item.badge}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ============================================
// HOME PAGE - THE WOW FACTOR
// ============================================
function HomePage({ cameras, onStartWatching, onLogin, user }) {
  const [heroCamera, setHeroCamera] = useState(null);
  const [heroStreamUrl, setHeroStreamUrl] = useState(null);

  // Pick a random online camera for the live hero background
  useEffect(() => {
    const onlineCameras = cameras.filter(c => c.status === 'online' && c.min_tier === 'fireman');
    if (onlineCameras.length === 0) return;

    const pickAndLoad = async () => {
      const cam = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];
      setHeroCamera(cam);
      try {
        const res = await fetch('/api/playback/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: cam._id, device_id: getDeviceId(), ...getDeviceInfo() }),
        });
        const data = await res.json();
        if (data.ok && data.hls_url) {
          setHeroStreamUrl(data.hls_url);
        }
      } catch (e) {
        console.log('Hero video load failed:', e);
      }
    };

    pickAndLoad();

    // Cycle to a new camera every 45 seconds
    const interval = setInterval(() => {
      const cam = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];
      setHeroCamera(cam);
      setHeroStreamUrl(null);
      fetch('/api/playback/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_id: cam._id, device_id: getDeviceId(), ...getDeviceInfo() }),
      }).then(r => r.json()).then(data => {
        if (data.ok && data.hls_url) setHeroStreamUrl(data.hls_url);
      }).catch(() => {});
    }, 45000);

    return () => clearInterval(interval);
  }, [cameras]);

  // Get coming soon cameras
  const comingSoonCameras = cameras.filter(c => c.status === 'coming_soon');

  return (
    <main className="min-h-screen bg-black">
      {/* HERO SECTION - Full screen with live video background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Welcome to RailStream">
        {/* Background - Live video stream */}
        {heroCamera && (
          <div className="absolute inset-0">
            {heroStreamUrl ? (
              <BackgroundHlsPlayer src={heroStreamUrl} className="opacity-50" />
            ) : (
              <img 
                src={heroCamera.thumbnail_path} 
                alt="" 
                className="w-full h-full object-cover opacity-40"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
          </div>
        )}
        
        {/* Fallback gradient */}
        {!heroCamera && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
        )}
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Logo */}
          <img 
            src="https://railstream.net/images/Trackside_Logo_Extra_Large.png" 
            alt="RailStream - Next to being trackside" 
            className="h-32 md:h-48 lg:h-56 mx-auto mb-8 drop-shadow-2xl"
          />
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-white font-light mb-4 tracking-wide">
            Superior image with sound quality
          </p>
          <p className="text-2xl md:text-3xl lg:text-4xl text-[#ff7a00] font-bold mb-12">
            Next to being trackside.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              onClick={onStartWatching}
              className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white text-lg px-10 py-6 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
              aria-label="Start watching live train cameras"
            >
              <Play className="w-6 h-6 mr-2" fill="white" />
              Start Watching
            </Button>
            {!user && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={onLogin}
                className="border-2 border-white text-white hover:bg-white hover:text-black text-lg px-10 py-6 rounded-xl font-bold transition-all"
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            )}
          </div>
          
          {/* Live camera indicator */}
          {heroCamera && (
            <div className="inline-flex items-center gap-2 text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <span className={`w-3 h-3 rounded-full ${heroStreamUrl ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} aria-hidden="true" />
              <span className="text-sm">
                {heroStreamUrl ? 'Live' : 'Now Showing'}: <span className="font-semibold">{heroCamera.name}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 15 YEAR ANNIVERSARY TRIBUTE */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-zinc-950" aria-labelledby="anniversary-heading">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#ff7a00]/20 text-[#ff7a00] px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <span className="text-2xl">🎉</span>
            Celebrating 15 Years
          </div>
          
          <h2 id="anniversary-heading" className="text-4xl md:text-5xl font-bold text-white mb-6">
            15 Years of RailStream
          </h2>
          <p className="text-xl text-white/80 mb-8">
            March 2011 — March 2026
          </p>
          
          <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-8 md:p-12 mb-8 text-left">
            <p className="text-white/90 text-lg leading-relaxed mb-6">
              What started as a single camera at the Fostoria Iron Triangle has grown into something 
              we never could have imagined — <span className="text-[#ff7a00] font-semibold">46 cameras</span>, 
              millions of hours watched, and a community of railfans spanning <span className="text-[#ff7a00] font-semibold">175 countries</span>.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mb-6">
              None of this would be possible without the incredible support of our family, friends, 
              and the amazing RailStream community.
            </p>
            
            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="text-white font-bold text-xl mb-4">Special Thanks</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-black/30 rounded-xl p-6">
                  <p className="text-[#ff7a00] font-bold text-lg mb-2">Andrea</p>
                  <p className="text-white/70">
                    My wife and partner in everything. Your endless support, creativity, and dedication 
                    has made RailStream what it is today. This journey wouldn't exist without you. ❤️
                  </p>
                </div>
                <div className="bg-black/30 rounded-xl p-6">
                  <p className="text-[#ff7a00] font-bold text-lg mb-2">Mr. Mark Hinsdale</p>
                  <p className="text-white/70">
                    10,000+ miles traveled and countless hours helping grow this network. Your dedication 
                    to the railfan community is unmatched. Thank you for believing in us from the start.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-white/90 text-lg leading-relaxed mt-6">
              To our hosts, our subscribers, and everyone who tunes in — <span className="text-white font-semibold">thank you</span> for 
              being part of this incredible journey. Here's to the next 15 years!
            </p>
            
            <p className="text-[#ff7a00] font-bold text-xl mt-6">— Mike</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-zinc-900 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-[#ff7a00]">15</div>
              <div className="text-white/60 text-sm">Years</div>
            </div>
            <div className="bg-zinc-900 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-[#ff7a00]">46</div>
              <div className="text-white/60 text-sm">Cameras</div>
            </div>
            <div className="bg-zinc-900 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-[#ff7a00]">24+</div>
              <div className="text-white/60 text-sm">Hosts</div>
            </div>
            <div className="bg-zinc-900 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-[#ff7a00]">175</div>
              <div className="text-white/60 text-sm">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 px-4 bg-zinc-950" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">RailStream Statistics</h2>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: Camera, value: '46', label: 'Live Cameras', sublabel: 'in 32 cities' },
              { icon: Train, value: '19', label: 'Railroads', sublabel: 'covered' },
              { icon: Clock, value: '2M+', label: 'Hours Watched', sublabel: 'every month' },
              { icon: Download, value: '400K+', label: 'App Downloads', sublabel: 'worldwide' },
              { icon: Globe, value: '175', label: 'Countries', sublabel: 'viewing' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-zinc-900 rounded-2xl">
                <stat.icon className="w-10 h-10 text-[#ff7a00] mx-auto mb-3" aria-hidden="true" />
                <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white font-medium">{stat.label}</div>
                <div className="text-white/60 text-sm">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY RAILSTREAM */}
      <section className="py-20 px-4 bg-black" aria-labelledby="why-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="why-heading" className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            The RailStream Difference
          </h2>
          <p className="text-white/70 text-center text-xl mb-16 max-w-2xl mx-auto">
            Quality over quantity. Our numbers speak for themselves.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Eye, title: 'Superior Video', desc: 'Crystal clear 1080p video quality that rivals being there in person.' },
              { icon: Volume2, title: 'Exquisite Audio', desc: 'Experience the rumble and roar of trains with our premium audio.' },
              { icon: Zap, title: 'Night Vision', desc: 'Additional lighting at locations for 24/7 nighttime viewing.' },
              { icon: Radio, title: 'Scanner Feeds', desc: 'Live railroad radio feeds at most camera locations.' },
            ].map((feature, i) => (
              <div key={i} className="text-center p-8 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition">
                <div className="w-20 h-20 rounded-2xl bg-[#ff7a00]/20 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-10 h-10 text-[#ff7a00]" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section className="py-20 px-4 bg-zinc-950" aria-labelledby="platforms-heading">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="platforms-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
            Watch Us 24/7/365
          </h2>
          <p className="text-white/70 text-xl mb-12">
            Available on all your favorite platforms
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Roku', url: 'https://channelstore.roku.com/details/74e07738778cf9dfb74340ef94503257' },
              { name: 'Amazon Fire TV', url: 'https://www.amazon.com/Railstream/dp/B08466FH5Q' },
              { name: 'Apple TV', url: 'https://apps.apple.com/us/app/railstream/id1520484749' },
              { name: 'iOS', url: 'https://apps.apple.com/us/app/railstream/id1520484749' },
              { name: 'Android', url: 'https://play.google.com/store/apps/details?id=com.maz.combo2225rs' },
            ].map((platform, i) => (
              <a 
                key={i}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-[#ff7a00] rounded-xl text-white font-medium transition-all"
              >
                <Tv className="w-5 h-5" aria-hidden="true" />
                {platform.name}
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP TIERS */}
      <section className="py-20 px-4 bg-black" aria-labelledby="pricing-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="pricing-heading" className="text-4xl font-bold text-white text-center mb-4">
            A Membership for Every Railfan
          </h2>
          <p className="text-white/70 text-center text-xl mb-16">
            Love trains? Us too!
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tier: 'fireman',
                name: 'Fireman',
                price: 'FREE',
                features: ['14 free cameras', 'Unlimited viewing with ads', 'Single camera view', 'Great for getting started'],
                cta: 'Watch Now',
                primary: false,
              },
              {
                tier: 'conductor',
                name: 'Conductor',
                price: '$8.95',
                period: '/month',
                features: ['All 14 Fireman cameras', 'PLUS 4 Conductor exclusives', 'AD FREE viewing', 'Dual & Quad multi-view', 'DVR rewind', 'Radio feeds'],
                cta: 'Join Today',
                primary: true,
              },
              {
                tier: 'engineer',
                name: 'Engineer',
                price: '$12.95',
                period: '/month',
                features: ['Access to ALL 46+ cameras', 'AD FREE viewing', 'All multi-view modes', 'Extended DVR rewind', 'Radio feeds', 'Mobile & TV apps'],
                cta: 'Join Today',
                primary: false,
              },
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`relative p-8 rounded-2xl ${
                  plan.primary 
                    ? 'bg-gradient-to-b from-[#ff7a00] to-orange-700 scale-105' 
                    : 'bg-zinc-900'
                }`}
              >
                {plan.primary && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-white/70">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8" role="list">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-white">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full py-6 text-lg font-bold ${
                    plan.primary 
                      ? 'bg-white text-[#ff7a00] hover:bg-white/90' 
                      : 'bg-[#ff7a00] text-white hover:bg-[#ff8c20]'
                  }`}
                  onClick={() => plan.tier === 'fireman' ? onStartWatching() : window.open('https://railstream.net/member/signup', '_blank')}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMING SOON SECTION */}
      {comingSoonCameras.length > 0 && (
        <section className="py-20 px-4 bg-black" aria-labelledby="coming-soon-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="coming-soon-heading" className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Coming Soon
            </h2>
            <p className="text-white/70 text-center text-xl mb-12">
              New camera locations on the horizon
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonCameras.map((camera, i) => (
                <div key={i} className="relative bg-zinc-900 rounded-2xl overflow-hidden group">
                  <div className="aspect-video relative">
                    {camera.thumbnail_path ? (
                      <img src={camera.thumbnail_path} alt="" className="w-full h-full object-cover opacity-50" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Badge className="bg-[#ff7a00] text-white text-sm px-4 py-2">
                        <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg mb-1">{camera.name}</h3>
                    <p className="text-white/60 text-sm">{camera.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 15 YEAR CELEBRATION BANNER */}
      <section className="py-12 px-4 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl">🎉</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Celebrating 15 Years!
            </h2>
            <span className="text-4xl">🎉</span>
          </div>
          <p className="text-white/90 text-lg mb-4">
            March 2011 - March 2026 · Thank you for being part of our journey
          </p>
          <a
            href="/15years"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-full hover:bg-white/90 transition-all transform hover:scale-105"
          >
            See Our Story
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ANDREA TRIBUTE - THE HEART OF RAILSTREAM */}
      <section className="py-16 px-4 bg-gradient-to-b from-black via-zinc-900/50 to-black">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-white" fill="currentColor" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Thank You, <span className="text-orange-400">Andrea</span>! 💕
          </h3>
          <p className="text-white/70 text-lg leading-relaxed mb-6">
            RailStream's heart, soul, and creative force. Andrea's passion for design and her dedication to our community 
            touches everything she works on. Her warmth, creativity, and attention to detail make RailStream 
            feel like home for thousands of railfans. We couldn't do this without her!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm">Designer</span>
            <span className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm">Creative Director</span>
            <span className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm">The Other Half</span>
            <span className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm">RailStream Legend</span>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#ff7a00] to-orange-600" aria-labelledby="final-cta">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="final-cta" className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Railfan?
          </h2>
          <p className="text-white/90 text-xl mb-8">
            Join thousands of railfans watching live trains right now.
          </p>
          <Button 
            size="lg"
            onClick={onStartWatching}
            className="bg-white text-[#ff7a00] hover:bg-white/90 text-xl px-12 py-8 rounded-xl font-bold shadow-2xl transition-all hover:scale-105"
          >
            <Play className="w-7 h-7 mr-3" fill="currentColor" />
            Start Watching Now
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-black border-t border-white/10" role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img 
              src="https://railstream.net/images/Homepage/WebsiteLogo.png" 
              alt="RailStream" 
              className="h-8"
            />
            <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer navigation">
              {['About', 'Cameras', 'Hosts', 'FAQ', 'Terms', 'Privacy'].map(link => (
                <a key={link} href="#" className="text-white hover:text-[#ff7a00] transition">
                  {link}
                </a>
              ))}
            </nav>
            <p className="text-white/70 text-sm">
              © {new Date().getFullYear()} RailStream, LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ============================================
// CAMERA PICKER WITH FAVORITES & PRESETS
// ============================================
function CameraPicker({ cameras, selectedCameras, onSelect, userTier, userIsAdmin, viewMode, favorites, setFavorites, presets, setPresets, onLoadPreset, onSavePreset, thumbnailMap, thumbTimestamp, targetSlot, setTargetSlot }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showPresets, setShowPresets] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  const toggleFavorite = (cameraId, e) => {
    e.stopPropagation();
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('railstream_token') : null;
    
    if (favorites.includes(cameraId)) {
      const newFavs = favorites.filter(id => id !== cameraId);
      setFavorites(newFavs);
      toast.success('Removed from favorites');
      // Call DELETE API
      if (token) {
        fetch(`/api/favorites/${cameraId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {});
      }
    } else {
      const newFavs = [...favorites, cameraId];
      setFavorites(newFavs);
      toast.success('Added to favorites');
      // Call POST API
      if (token) {
        fetch(`/api/favorites/${cameraId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {});
      }
    }
  };
  
  const filtered = cameras.filter(c => {
    const matchesSearch = !search || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = true;
    if (filter === 'favorites') matchesFilter = favorites.includes(c._id);
    else if (filter !== 'all') matchesFilter = c.min_tier === filter;
    return matchesSearch && matchesFilter;
  });

  const favoritesCameras = cameras.filter(c => favorites.includes(c._id));

  // State abbreviations for compact display
  const STATE_ABBREV = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Ontario': 'ON', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
    'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI',
    'Wyoming': 'WY',
  };

  // Extract state from camera name (e.g. "Atlanta, Georgia" → "Georgia")
  const getState = (camera) => {
    const name = camera.name || '';
    const parts = name.split(',');
    if (parts.length >= 2) {
      const state = parts[parts.length - 1].trim();
      // Handle names like "Shen Junction, West Virginia (3)" — strip parenthetical
      return state.replace(/\s*\(.*\)$/, '');
    }
    return 'Other';
  };

  // Group cameras by state, sorted alphabetically
  const groupedCameras = {};
  if (filter !== 'favorites' && favoritesCameras.length > 0) {
    const favFiltered = favoritesCameras.filter(c => 
      (!search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()))
    );
    if (favFiltered.length > 0) groupedCameras['★ Favorites'] = favFiltered;
  }
  
  filtered.filter(c => filter === 'favorites' || !favorites.includes(c._id)).forEach(cam => {
    const state = filter === 'favorites' ? '★ Favorites' : getState(cam);
    if (!groupedCameras[state]) groupedCameras[state] = [];
    groupedCameras[state].push(cam);
  });

  // Sort cameras within each state by city name
  Object.values(groupedCameras).forEach(cams => {
    cams.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });

  // Sort state keys alphabetically (favorites always first)
  const sortedGroups = Object.entries(groupedCameras).sort(([a], [b]) => {
    if (a === '★ Favorites') return -1;
    if (b === '★ Favorites') return 1;
    return a.localeCompare(b);
  });

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
    toast.success(`Preset "${newPresetName}" saved!`);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900/50" role="region" aria-label="Camera selection">
      {showPresets ? (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#ff7a00]" aria-hidden="true" />
              My Presets
            </h3>
            <button onClick={() => setShowPresets(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Close presets">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="p-3 border-b border-white/5">
            <label className="text-xs text-white/70 mb-2 block">Save current view as preset:</label>
            <div className="flex gap-2">
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 bg-white/5 border-white/10 text-white text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                aria-label="Preset name"
              />
              <Button onClick={handleSavePreset} size="icon" className="bg-[#ff7a00] hover:bg-[#ff8c20]" aria-label="Save preset">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {presets.length === 0 ? (
                <div className="text-center py-8 text-white/70">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">No presets saved yet</p>
                  <p className="text-xs mt-1">Set up your view and save it!</p>
                </div>
              ) : (
                presets.map((preset, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 group">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{preset.name}</h4>
                      <button 
                        onClick={() => {
                          const newPresets = presets.filter((_, idx) => idx !== i);
                          setPresets(newPresets);
                          toast.success('Preset deleted');
                        }}
                        className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition"
                        aria-label={`Delete preset ${preset.name}`}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {preset.cameras.slice(0, 4).map((cam, j) => (
                        <div key={j} className="w-10 h-6 rounded overflow-hidden bg-zinc-800">
                          {cam?.thumbnail_path && <img src={cam.thumbnail_path} alt="" className="w-full h-full object-cover" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/70">{preset.viewMode} view • {preset.cameras.filter(Boolean).length} cameras</span>
                      <Button 
                        size="sm" 
                        onClick={() => { onLoadPreset(preset); setShowPresets(false); toast.success(`Loaded "${preset.name}"`); }}
                        className="h-7 bg-[#ff7a00] hover:bg-[#ff8c20] text-xs"
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cameras..."
                  className="pl-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/60"
                  aria-label="Search cameras"
                />
              </div>
              <button
                onClick={() => setShowPresets(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition"
                aria-label="Open presets"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="w-full bg-white/5 p-1">
                <TabsTrigger value="all" className="flex-1 text-xs text-white data-[state=active]:bg-[#ff7a00] data-[state=active]:text-white">All</TabsTrigger>
                {userTier && (
                  <TabsTrigger value="favorites" className="flex-1 text-xs text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                    <Star className="w-3 h-3 mr-1" aria-hidden="true" />
                    {favorites.length}
                  </TabsTrigger>
                )}
                {!userTier && (
                  <TabsTrigger value="fireman" className="flex-1 text-xs text-white data-[state=active]:bg-orange-600 data-[state=active]:text-white">Free</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Target slot indicator */}
          {targetSlot !== null && viewMode !== 'single' && (
            <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-[#ff7a00]/10 border border-[#ff7a00]/30 flex items-center justify-between">
              <span className="text-[#ff7a00] text-xs font-medium">
                Adding to Slot {targetSlot + 1}
              </span>
              <button
                onClick={() => setTargetSlot(null)}
                className="text-[#ff7a00]/60 hover:text-[#ff7a00] text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2">
              {sortedGroups.map(([state, cams]) => (
                <div key={state} className="mb-3">
                  <div className={`flex items-center gap-2 px-2 mb-1.5 ${state === '★ Favorites' ? '' : ''}`}>
                    {state === '★ Favorites' ? (
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-yellow-500">{state}</h4>
                    ) : (
                      <>
                        <span className="text-[10px] font-black tracking-wider text-[#ff7a00]/70 bg-[#ff7a00]/10 px-1.5 py-0.5 rounded">
                          {STATE_ABBREV[state] || state.slice(0, 2).toUpperCase()}
                        </span>
                        <h4 className="text-xs font-semibold text-white/70">{state}</h4>
                        <span className="text-[10px] text-white/60 ml-auto">{cams.length}</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-0.5" role="list">
                    {cams.map(camera => {
                      const isSelected = selectedCameras.some(c => c?._id === camera._id);
                      const hasAccess = canAccess(userTier, camera.min_tier, userIsAdmin);
                      const isStatusCamera = camera.status === 'offline' || camera.status === 'coming_soon';
                      // Locked cameras should be clickable for logged-out users (to show sign-in prompt)
                      // and for logged-in users who don't have access (to show upgrade prompt in player)
                      const isClickable = hasAccess || isStatusCamera || true; // Always clickable
                      const isFavorite = favorites.includes(camera._id);
                      
                      return (
                        <li key={camera._id}>
                          <div className={`relative flex items-center gap-3 p-2 rounded-lg transition-all ${
                            isSelected ? 'bg-[#ff7a00]/20 ring-1 ring-[#ff7a00]' : isClickable ? 'hover:bg-white/5' : 'opacity-50'
                          }`}>
                            <button
                              onClick={() => onSelect(camera)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                              aria-label={`${isStatusCamera ? camera.status === 'offline' ? 'Offline' : 'Coming soon' : hasAccess ? 'Select' : !userTier ? 'Sign in required' : 'Upgrade required'} ${camera.name}`}
                            >
                              <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                                {thumbnailMap?.[camera._id] ? (
                                  <img src={`/api/studio/thumbnail?id=${thumbnailMap[camera._id]}&_t=${thumbTimestamp}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <img src={camera.thumbnail_path} alt="" className="w-full h-full object-cover" />
                                )}
                                {camera.status === 'online' && (
                                  <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-label="Live" />
                                )}
                                {camera.status === 'offline' && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Offline</span>
                                  </div>
                                )}
                                {camera.status === 'coming_soon' && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-[#ff7a00] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Coming Soon</span>
                                  </div>
                                )}
                                {!hasAccess && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Lock className="w-3 h-3 text-white" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{camera.name}</p>
                                <p className="text-xs text-white/70 truncate">{camera.location}</p>
                              </div>
                            </button>
                            
                            {userTier && (
                              <button
                                onClick={(e) => toggleFavorite(camera._id, e)}
                                className={`p-1.5 rounded transition ${isFavorite ? 'text-yellow-500' : 'text-white/60 hover:text-yellow-500'}`}
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                              </button>
                            )}
                            
                            {isSelected && (
                              <span className="w-6 h-6 rounded-full bg-[#ff7a00] flex items-center justify-center text-white" title="Click to remove">
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              
              {sortedGroups.length === 0 && (
                <div className="text-center py-8 text-white/70">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">No cameras found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

// ============================================

// LAYOUTS MENU — Quick access to save/load multi-view presets
function LayoutsMenu({ presets, onSave, onLoad, onDelete, onUpdate, viewMode, selectedCameras, slots }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const activeCams = selectedCameras.slice(0, slots).filter(Boolean).length;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
    setSaving(false);
    toast.success(`Layout "${name}" saved!`);
  };

  const VIEW_LABELS = { single: '1', dual: '2', quad: '4', main5: '1+5', nine: '9', sixteen: '16' };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
          open ? 'bg-[#ff7a00] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Bookmark className="w-4 h-4" />
        <span className="hidden sm:inline">My Layouts</span>
        {presets.length > 0 && (
          <span className="bg-white/20 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {presets.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">My Layouts</h3>
            {!saving && activeCams > 0 && (
              <button
                onClick={() => setSaving(true)}
                className="text-xs bg-[#ff7a00] hover:bg-[#ff8c20] text-white px-3 py-1 rounded-full font-medium transition flex-shrink-0"
              >
                + Save Current
              </button>
            )}
          </div>

          {/* Save Form */}
          {saving && (
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <p className="text-white/80 text-xs mb-2">
                Saving {activeCams} camera{activeCams !== 1 ? 's' : ''} in {VIEW_LABELS[viewMode] || '1'}-view layout
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Layout name (e.g. All Ohio)"
                  className="flex-1 min-w-0 bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/70"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button onClick={handleSave} className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white px-4 py-2 rounded-lg text-sm font-bold transition flex-shrink-0">
                  Save
                </button>
              </div>
              <button onClick={() => { setSaving(false); setName(''); }} className="text-white/70 text-xs mt-2 hover:text-white">
                Cancel
              </button>
            </div>
          )}

          {/* Presets List */}
          <div className="max-h-64 overflow-y-auto">
            {presets.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bookmark className="w-8 h-8 text-white/70 mx-auto mb-2" />
                <p className="text-white/70 text-sm">No layouts saved yet</p>
                <p className="text-white/60 text-xs mt-1">Set up your cameras and click &quot;Save Current&quot;</p>
              </div>
            ) : (
              presets.map((preset, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition group cursor-pointer border-b border-white/5 last:border-0"
                  onClick={() => { onLoad(preset); setOpen(false); toast.success(`Loaded "${preset.name}"`); }}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#ff7a00] text-xs font-bold">{VIEW_LABELS[preset.viewMode] || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{preset.name}</p>
                    <p className="text-white/60 text-xs">
                      {preset.cameras?.filter(Boolean).length || 0} cameras &bull; {VIEW_LABELS[preset.viewMode] || '1'}-view
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {activeCams > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(i); toast.success(`"${preset.name}" updated`); }}
                        className="p-1.5 text-white/60 hover:text-[#ff7a00] transition"
                        aria-label={`Update ${preset.name} with current cameras`}
                        title="Update with current cameras"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(i); toast.success('Layout deleted'); }}
                      className="p-1.5 text-white/60 hover:text-red-400 transition"
                      aria-label={`Delete ${preset.name}`}
                      title="Delete layout"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================
// AD MANAGER MODAL (Admin Only)
// ============================================
function AdManagerModal({ onClose }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState({ type: 'companion', title: '', imageUrl: '', videoUrl: '', clickUrl: '', skipAfter: 5, interval: 15, priority: 10 });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('companion');

  const fetchAds = async () => {
    try {
      const token = localStorage.getItem('railstream_token');
      const res = await fetch('/api/ads', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setAds(data.ads || []);
    } catch (e) { console.error('Failed to fetch ads:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, []);

  const saveAd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('railstream_token');
    try {
      const url = editingAd ? `/api/ads/${editingAd._id}` : '/api/ads';
      const method = editingAd ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(editingAd ? 'Ad updated' : 'Ad created');
        setEditingAd(null);
        setForm({ type: activeTab, title: '', imageUrl: '', videoUrl: '', clickUrl: '', skipAfter: 5, interval: 15, priority: 10 });
        fetchAds();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (e) { toast.error('Network error'); }
    setSaving(false);
  };

  const toggleAd = async (ad) => {
    const token = localStorage.getItem('railstream_token');
    try {
      await fetch(`/api/ads/${ad._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: !ad.enabled }),
      });
      fetchAds();
    } catch (e) { toast.error('Failed to toggle ad'); }
  };

  const deleteAd = async (ad) => {
    if (!confirm(`Delete "${ad.title || ad.type}" ad?`)) return;
    const token = localStorage.getItem('railstream_token');
    try {
      await fetch(`/api/ads/${ad._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      toast.success('Ad deleted');
      fetchAds();
    } catch (e) { toast.error('Failed to delete ad'); }
  };

  const startEdit = (ad) => {
    setEditingAd(ad);
    setForm({
      type: ad.type,
      title: ad.title || '',
      imageUrl: ad.imageUrl || '',
      videoUrl: ad.videoUrl || '',
      clickUrl: ad.clickUrl || '',
      skipAfter: ad.skipAfter || 5,
      interval: ad.interval || 15,
      priority: ad.priority || 10,
    });
    setActiveTab(ad.type);
  };

  const cancelEdit = () => {
    setEditingAd(null);
    setForm({ type: activeTab, title: '', imageUrl: '', videoUrl: '', clickUrl: '', skipAfter: 5, interval: 15, priority: 10 });
  };

  const filteredAds = ads.filter(a => a.type === activeTab);

  const AD_TYPES = [
    { id: 'companion', label: 'Sidebar', icon: ImageIcon, desc: 'Display ad beside player' },
    { id: 'preroll', label: 'Pre-Roll', icon: Video, desc: 'Video/image before stream' },
    { id: 'midroll', label: 'Mid-Roll', icon: Clock, desc: 'Overlay during viewing' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#ff7a00]" />
            Ad Manager
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex border-b border-white/10">
          {AD_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); if (!editingAd) setForm(f => ({ ...f, type: t.id })); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === t.id ? 'text-[#ff7a00] border-b-2 border-[#ff7a00] bg-[#ff7a00]/5' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Ad Form */}
          <form onSubmit={saveAd} className="p-4 border-b border-white/10 bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-[#ff7a00]" />
              <h3 className="text-white font-semibold text-sm">{editingAd ? 'Edit Ad' : 'Add New Ad'}</h3>
              {editingAd && (
                <button type="button" onClick={cancelEdit} className="ml-auto text-white/50 hover:text-white text-xs underline">Cancel Edit</button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="ad-title" className="text-white/60 text-xs font-medium mb-1 block">Title / Label</label>
                <input
                  id="ad-title"
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Club Med Banner"
                  className="w-full bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ad-click" className="text-white/60 text-xs font-medium mb-1 block">Click-Through URL</label>
                <input
                  id="ad-click"
                  type="url"
                  value={form.clickUrl}
                  onChange={e => setForm(f => ({ ...f, clickUrl: e.target.value }))}
                  placeholder="https://advertiser.com"
                  className="w-full bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                />
              </div>
            </div>

            {(activeTab === 'companion' || activeTab === 'midroll') && (
              <div className="mb-3">
                <label htmlFor="ad-image" className="text-white/60 text-xs font-medium mb-1 block">Image URL</label>
                <input
                  id="ad-image"
                  type="url"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://cdn.example.com/ad-banner.jpg"
                  className="w-full bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                />
              </div>
            )}

            {activeTab === 'preroll' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="ad-video" className="text-white/60 text-xs font-medium mb-1 block">Video / VAST URL</label>
                  <input
                    id="ad-video"
                    type="url"
                    value={form.videoUrl}
                    onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                    placeholder="https://ads.example.com/vast.xml"
                    className="w-full bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ad-skip" className="text-white/60 text-xs font-medium mb-1 block">Skip After (seconds)</label>
                  <input
                    id="ad-skip"
                    type="number"
                    min="0"
                    max="30"
                    value={form.skipAfter}
                    onChange={e => setForm(f => ({ ...f, skipAfter: parseInt(e.target.value) || 5 }))}
                    className="w-full bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'midroll' && (
              <div className="mb-3">
                <label htmlFor="ad-interval" className="text-white/60 text-xs font-medium mb-1 block">Show Every (minutes)</label>
                <input
                  id="ad-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={form.interval}
                  onChange={e => setForm(f => ({ ...f, interval: parseInt(e.target.value) || 15 }))}
                  className="w-full max-w-[120px] bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="ad-priority" className="text-white/60 text-xs font-medium mb-1 block">Priority (lower = higher)</label>
                <input
                  id="ad-priority"
                  type="number"
                  min="1"
                  max="100"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 10 }))}
                  className="w-full max-w-[100px] bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#ff7a00] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold rounded-lg text-sm transition disabled:opacity-50 mt-5"
              >
                {saving ? 'Saving...' : editingAd ? 'Update Ad' : 'Add Ad'}
              </button>
            </div>
          </form>

          {/* Existing Ads List */}
          <div className="p-4">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">
              {AD_TYPES.find(t => t.id === activeTab)?.label} Ads ({filteredAds.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-white/40"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : filteredAds.length === 0 ? (
              <p className="text-center py-8 text-white/30 text-sm">No {activeTab} ads configured yet</p>
            ) : (
              <div className="space-y-2">
                {filteredAds.map(ad => (
                  <div key={ad._id} className={`flex items-center gap-3 p-3 rounded-xl border transition ${ad.enabled ? 'bg-zinc-800/50 border-white/10' : 'bg-zinc-800/20 border-white/5 opacity-60'}`}>
                    {/* Preview */}
                    {ad.imageUrl && (
                      <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                        <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {!ad.imageUrl && (
                      <div className="w-16 h-12 rounded-lg flex-shrink-0 bg-zinc-700 flex items-center justify-center">
                        {ad.type === 'preroll' ? <Video className="w-5 h-5 text-white/30" /> : <ImageIcon className="w-5 h-5 text-white/30" />}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{ad.title || `${ad.type} ad`}</p>
                      <p className="text-white/40 text-xs truncate">{ad.clickUrl || 'No click URL'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleAd(ad)}
                        className={`p-1.5 rounded-lg transition ${ad.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white/30 hover:bg-white/5'}`}
                        title={ad.enabled ? 'Disable' : 'Enable'}
                      >
                        {ad.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => startEdit(ad)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
                        title="Edit"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAd(ad)}
                        className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPANION AD SIDEBAR (Free Users)
// ============================================
function CompanionAdPanel({ ads }) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const companionAds = (ads || []).filter(a => a.type === 'companion' && a.enabled);

  // Rotate ads every 30 seconds
  useEffect(() => {
    if (companionAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % companionAds.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [companionAds.length]);

  if (companionAds.length === 0) return null;

  const ad = companionAds[currentAdIndex % companionAds.length];
  if (!ad) return null;

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-white/10 bg-zinc-900/50 flex flex-col">
      {/* Upsell banner */}
      <div className="p-3 border-b border-white/10 bg-gradient-to-r from-[#ff7a00]/10 to-orange-600/10">
        <p className="text-white/80 text-xs font-medium text-center">
          <span className="text-[#ff7a00] font-bold">Go Ad-Free</span> — Members enjoy zero ads
        </p>
        <a
          href="/join"
          className="mt-2 block w-full text-center px-3 py-1.5 bg-[#ff7a00] hover:bg-[#ff8c20] text-white text-xs font-bold rounded-lg transition"
        >
          Join RailStream →
        </a>
      </div>

      {/* Sponsored label */}
      <div className="px-3 py-1.5 border-b border-white/5">
        <span className="text-white/30 text-[10px] font-medium uppercase tracking-wider">Sponsored</span>
      </div>

      {/* Ad Content */}
      <div className="flex-1 p-3">
        {ad.clickUrl ? (
          <a href={ad.clickUrl} target="_blank" rel="noopener noreferrer sponsored" className="block group">
            {ad.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-2 border border-white/5 group-hover:border-[#ff7a00]/30 transition">
                <img src={ad.imageUrl} alt={ad.title || 'Advertisement'} className="w-full object-cover" />
              </div>
            )}
            {ad.title && (
              <p className="text-white/70 text-sm group-hover:text-white transition flex items-center gap-1">
                {ad.title}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </p>
            )}
          </a>
        ) : (
          <>
            {ad.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-2 border border-white/5">
                <img src={ad.imageUrl} alt={ad.title || 'Advertisement'} className="w-full object-cover" />
              </div>
            )}
            {ad.title && <p className="text-white/70 text-sm">{ad.title}</p>}
          </>
        )}
      </div>

      {/* Rotation indicator */}
      {companionAds.length > 1 && (
        <div className="px-3 py-2 border-t border-white/5 flex justify-center gap-1">
          {companionAds.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition ${i === currentAdIndex % companionAds.length ? 'bg-[#ff7a00]' : 'bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// WATCH PAGE
// ============================================
function WatchPage({ cameras, user, viewMode, setViewMode, selectedCameras, setSelectedCameras, playbackStates, setPlaybackStates, loadCamera, removeCamera, stopAllSessions, favorites, setFavorites, presets, setPresets, thumbnailMap, thumbTimestamp, replaySeekOffset = 0, clearReplaySeek, playerStatsRef, onStatusCamera, onLogin }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [mutedSlots, setMutedSlots] = useState({}); // { slotIndex: true/false } — per-slot mute state
  const [focusedSlot, setFocusedSlot] = useState(null); // For click-to-fullscreen
  const [targetSlot, setTargetSlot] = useState(null); // For pick-where-to-place
  const [reviewOpsCounter, setReviewOpsCounter] = useState(0); // Trigger Review Ops in player

  // Train sighting log
  const [sightingForm, setSightingForm] = useState(null); // { imageData, sightingTime, cameraId, cameraName, cameraLocation }
  const [sightingSubmitting, setSightingSubmitting] = useState(false);
  const [sightingData, setSightingData] = useState({ railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });

  // Ads system
  const [ads, setAds] = useState([]);
  const [showAdManager, setShowAdManager] = useState(false);

  // Fetch ads on mount
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const token = localStorage.getItem('railstream_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('/api/ads', { headers });
        const data = await res.json();
        setAds(data.ads || []);
      } catch (e) {}
    };
    fetchAds();
  }, []);

  const showCompanionAds = !user && ads.some(a => a.type === 'companion' && a.enabled);
  
  // Pre-roll ad state (for non-signed-in users)
  const [prerollActive, setPrerollActive] = useState(false);
  const [prerollAd, setPrerollAd] = useState(null);
  const [prerollCountdown, setPrerollCountdown] = useState(0);
  const [prerollSessionId, setPrerollSessionId] = useState(null); // track which camera load triggered it

  // Mid-roll ad state
  const [midrollActive, setMidrollActive] = useState(false);
  const [midrollAd, setMidrollAd] = useState(null);
  const [midrollCountdown, setMidrollCountdown] = useState(0);
  const midrollTimerRef = useRef(null);

  // Show pre-roll when a camera loads (for free users)
  useEffect(() => {
    if (user) return; // Paid users skip ads
    const enabledPrerolls = ads.filter(a => a.type === 'preroll' && a.enabled);
    if (enabledPrerolls.length === 0) return;
    
    // Check if a camera just started PLAYING (has a stream, not just selected)
    // Don't trigger pre-roll for upgrade/sign-in prompts or errors
    const playingSlots = selectedCameras.filter((c, i) => {
      if (!c) return false;
      const state = playbackStates[i];
      // Only count as "playing" if it has actual stream data (not upgrade/error/loading)
      return state?.data?.hls_url;
    });
    const sessionKey = playingSlots.map(c => c?._id).join(',');
    
    if (sessionKey && sessionKey !== prerollSessionId && playingSlots.length > 0) {
      const ad = enabledPrerolls[Math.floor(Math.random() * enabledPrerolls.length)];
      setPrerollAd(ad);
      setPrerollCountdown(ad.skipAfter || 5);
      setPrerollActive(true);
      setPrerollSessionId(sessionKey);
    }
  }, [user, ads, selectedCameras, prerollSessionId, playbackStates]);

  // Pre-roll countdown timer
  useEffect(() => {
    if (!prerollActive || prerollCountdown <= 0) return;
    const timer = setTimeout(() => setPrerollCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [prerollActive, prerollCountdown]);

  const skipPreroll = () => {
    setPrerollActive(false);
    setPrerollAd(null);
  };

  // Mid-roll timer: triggers every `interval` minutes for free users watching a stream
  useEffect(() => {
    // Clear any existing timer when dependencies change
    if (midrollTimerRef.current) {
      clearInterval(midrollTimerRef.current);
      midrollTimerRef.current = null;
    }

    if (user) return; // Paid users skip ads
    if (midrollActive) return; // Don't start new timer while mid-roll is showing

    const enabledMidrolls = ads.filter(a => a.type === 'midroll' && a.enabled);
    if (enabledMidrolls.length === 0) return;

    // Check if user is actually watching something
    const hasActiveStream = selectedCameras.some((c, i) => c && playbackStates[i]?.data?.hls_url);
    if (!hasActiveStream) return;

    // Use the interval from the first midroll ad config (in minutes), default 15 min
    const intervalMinutes = enabledMidrolls[0]?.interval || 15;
    const intervalMs = intervalMinutes * 60 * 1000;
    // First midroll after 2 minutes, then every intervalMs after
    const initialDelayMs = 2 * 60 * 1000; // First midroll after 2 minutes

    const triggerMidroll = () => {
      // Pick a random enabled midroll ad
      const ad = enabledMidrolls[Math.floor(Math.random() * enabledMidrolls.length)];
      setMidrollAd(ad);
      setMidrollCountdown(ad.skipAfter || 5);
      setMidrollActive(true);
    };

    // Fire first midroll after initial delay
    const initialTimer = setTimeout(() => {
      triggerMidroll();
      // Then set up recurring interval
      midrollTimerRef.current = setInterval(triggerMidroll, intervalMs);
    }, initialDelayMs);

    return () => {
      clearTimeout(initialTimer);
      if (midrollTimerRef.current) {
        clearInterval(midrollTimerRef.current);
        midrollTimerRef.current = null;
      }
    };
  }, [user, ads, selectedCameras, playbackStates, midrollActive]);

  // Mid-roll countdown timer
  useEffect(() => {
    if (!midrollActive || midrollCountdown <= 0) return;
    const timer = setTimeout(() => setMidrollCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [midrollActive, midrollCountdown]);

  const skipMidroll = () => {
    setMidrollActive(false);
    setMidrollAd(null);
  };

  const RAILROADS = ['CSX', 'NS', 'UP', 'BNSF', 'CN', 'CP', 'KCS', 'Amtrak', 'Other'];
  const TRAIN_TYPES = ['Intermodal', 'Manifest', 'Coal', 'Grain', 'Auto', 'Passenger', 'Local', 'Work Train', 'Light Power', 'Other'];
  const DIRECTIONS = ['Eastbound', 'Westbound', 'Northbound', 'Southbound'];

  const handleLogSighting = (camera, slotData) => {
    setSightingForm({
      imageData: slotData.imageData,
      sightingTime: slotData.sightingTime,
      cameraId: camera?._id || '',
      cameraName: slotData.cameraName || camera?.name || '',
      cameraLocation: slotData.cameraLocation || camera?.location || '',
    });
    setSightingData({ railroad: '', train_id: '', direction: '', locomotives: '', train_type: '', notes: '' });
  };

  const submitSighting = async (e) => {
    e.preventDefault();
    if (!sightingForm) return;
    setSightingSubmitting(true);
    const token = localStorage.getItem('railstream_token');
    try {
      // Create sighting first
      const res = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          camera_id: sightingForm.cameraId,
          camera_name: sightingForm.cameraName,
          location: sightingForm.cameraLocation,
          sighting_time: sightingForm.sightingTime,
          ...sightingData,
        }),
      });
      const data = await res.json();
      if (data.ok && data.sighting && sightingForm.imageData) {
        // Upload the snapshot image
        await fetch('/api/sightings/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ image_data: sightingForm.imageData, sighting_id: data.sighting._id }),
        });
      }
      if (data.ok) {
        toast.success('Train sighting logged!');
        setSightingForm(null);
      } else {
        toast.error(data.error || 'Failed to log sighting');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setSightingSubmitting(false);
  };

  const isHighTier = user && (user.membership_tier === 'conductor' || user.membership_tier === 'engineer');
  const canReviewOps = isHighTier && viewMode === 'single' && selectedCameras[0];

  // Per-slot mute: check if a slot is muted
  const isSlotMuted = (slotIndex) => {
    // Mute during mid-roll ad (camera plays muted, ad plays with sound)
    if (midrollActive) return true;
    // Global mute overrides everything
    if (isMuted) return true;
    // Per-slot mute state (default: slot 0 unmuted, others muted)
    if (mutedSlots[slotIndex] !== undefined) return mutedSlots[slotIndex];
    return slotIndex > 0; // Default: only slot 0 has sound
  };

  const toggleSlotMute = (slotIndex) => {
    setMutedSlots(prev => ({
      ...prev,
      [slotIndex]: !isSlotMuted(slotIndex),
    }));
  };

  // Click a tile in multi-view to expand it to fullscreen single view
  const handleTileFocus = (slotIndex) => {
    if (viewMode !== 'single' && selectedCameras[slotIndex]) {
      setFocusedSlot(slotIndex);
    }
  };

  // Return from focused single view back to the grid (resets to live)
  const handleUnfocus = () => {
    // If we were in review mode on the focused slot, reload it as live
    if (focusedSlot !== null) {
      const camera = selectedCameras[focusedSlot];
      if (camera) {
        // Reload to get fresh live URL
        loadCamera(camera, focusedSlot);
      }
    }
    setFocusedSlot(null);
  };

  // Keyboard: Escape unfocuses
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && focusedSlot !== null) {
        setFocusedSlot(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focusedSlot]);

  const handleSelectCamera = (camera) => {
    // For offline/coming_soon cameras, show full-screen modal instead of placing in slot
    if (camera.status === 'offline' || camera.status === 'coming_soon') {
      onStatusCamera(camera);
      return;
    }

    // ── TOGGLE BEHAVIOR: If camera is already playing, remove it ──
    const existingSlot = selectedCameras.findIndex(c => c?._id === camera._id);
    if (existingSlot !== -1) {
      removeCamera(existingSlot);
      return;
    }

    // In single view, always replace slot 0
    if (viewMode === 'single') {
      loadCamera(camera, 0);
      return;
    }
    // If user clicked a specific slot to target, place camera there
    if (targetSlot !== null && targetSlot < slots) {
      loadCamera(camera, targetSlot);
      setTargetSlot(null); // Clear the target after placing
      return;
    }
    // In multi-view, find next empty slot or replace slot 0
    const slot = selectedCameras.slice(0, slots).findIndex(c => !c);
    loadCamera(camera, slot === -1 ? 0 : slot);
  };

  const handleSavePreset = (name) => {
    const newPreset = {
      name,
      viewMode,
      cameras: selectedCameras.slice(0, VIEW_MODES.find(m => m.id === viewMode)?.slots || 1),
      createdAt: new Date().toISOString(),
    };
    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    storage.setPresets(newPresets);
  };

  const handleLoadPreset = (preset) => {
    // Stop all active sessions first
    stopAllSessions();
    setFocusedSlot(null);
    setTargetSlot(null);
    
    // Switch view mode
    setViewMode(preset.viewMode);
    
    // Reset to clean slate
    setSelectedCameras([null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]);
    setPlaybackStates({});
    playerStatsRef.current = {};
    
    // Load camera streams — loadCamera uses functional updates so each call
    // safely builds on the previous one (no stale closure overwrite)
    preset.cameras.forEach((camera, i) => {
      if (camera) setTimeout(() => loadCamera(camera, i), 50 + i * 100);
    });
  };

  // Clear all cameras when switching layout mode
  const handleViewModeChange = (newMode) => {
    if (newMode === viewMode) return;
    stopAllSessions();
    setFocusedSlot(null);
    setTargetSlot(null);
    setSelectedCameras([null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]);
    setPlaybackStates({});
    playerStatsRef.current = {};
    setViewMode(newMode);
  };

  const gridClass = {
    single: 'grid-cols-1 grid-rows-1',
    dual: 'grid-cols-2 grid-rows-1',
    quad: 'grid-cols-2 grid-rows-2',
    main5: '', // Custom layout — handled with explicit CSS grid
    nine: 'grid-cols-3 grid-rows-3',
    sixteen: 'grid-cols-4 grid-rows-4',
  }[viewMode];

  const slots = VIEW_MODES.find(m => m.id === viewMode)?.slots || 1;

  return (
    <div className="h-screen pt-16 flex bg-black">
      {pickerOpen && (
        <div className="w-72 border-r border-white/10 flex-shrink-0">
          <CameraPicker
            cameras={cameras}
            selectedCameras={selectedCameras}
            onSelect={handleSelectCamera}
            userTier={user?.membership_tier}
            userIsAdmin={user?.is_admin}
            viewMode={viewMode}
            favorites={favorites}
            setFavorites={(f) => { setFavorites(f); storage.setFavorites(f); syncPrefsToServer(f, undefined); }}
            presets={presets}
            setPresets={(p) => { setPresets(p); storage.setPresets(p); syncPrefsToServer(undefined, p); }}
            onLoadPreset={handleLoadPreset}
            onSavePreset={handleSavePreset}
            thumbnailMap={thumbnailMap}
            thumbTimestamp={thumbTimestamp}
            targetSlot={targetSlot}
            setTargetSlot={setTargetSlot}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${pickerOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              aria-label={pickerOpen ? 'Hide camera list' : 'Show camera list'}
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{pickerOpen ? 'Hide Cameras' : 'Show Cameras'}</span>
              <ChevronLeft className={`w-3 h-3 transition-transform ${!pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="h-6 w-px bg-white/10 mx-1" aria-hidden="true" />
            
            {/* View mode selector with labels */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1" role="group" aria-label="View mode">
              {VIEW_MODES.map(mode => {
                const needsUpgrade = (mode.id !== 'single') && (!user || user.membership_tier === 'fireman');
                return (
                  <button
                    key={mode.id}
                    onClick={() => !needsUpgrade && handleViewModeChange(mode.id)}
                    disabled={needsUpgrade}
                    className={`relative flex items-center gap-1 px-2 py-1.5 rounded transition-all text-xs font-medium ${
                      viewMode === mode.id ? 'bg-[#ff7a00] text-white' : needsUpgrade ? 'text-white/60' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={`${mode.label} camera view${needsUpgrade ? ' (upgrade required)' : ''}`}
                    aria-pressed={viewMode === mode.id}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{mode.label}</span>
                    {needsUpgrade && <Lock className="w-2.5 h-2.5 text-white/70" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            
            {/* Save & Load Layouts — members only */}
            {user ? (
              <LayoutsMenu 
                presets={presets} 
                onSave={handleSavePreset} 
                onLoad={handleLoadPreset}
                onDelete={(i) => {
                  const newPresets = presets.filter((_, idx) => idx !== i);
                  setPresets(newPresets);
                }}
                onUpdate={(i) => {
                  const newPresets = [...presets];
                  newPresets[i] = {
                    ...newPresets[i],
                    viewMode,
                    cameras: selectedCameras.slice(0, slots),
                    updatedAt: new Date().toISOString(),
                  };
                  setPresets(newPresets);
                }}
                viewMode={viewMode}
                selectedCameras={selectedCameras}
                slots={slots}
              />
            ) : (
              <button
                onClick={() => toast('Sign in to save layouts', { icon: '🔒' })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/40 cursor-not-allowed"
                aria-label="My Layouts (sign in required)"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">My Layouts</span>
                <Lock className="w-3 h-3" />
              </button>
            )}

            {/* Review Ops - Conductor & Engineer only, single view only */}
            {viewMode === 'single' && (
              <div className="h-6 w-px bg-white/10 mx-1" aria-hidden="true" />
            )}
            {viewMode === 'single' && (
              <button
                onClick={() => canReviewOps && setReviewOpsCounter(c => c + 1)}
                disabled={!canReviewOps}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  canReviewOps
                    ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300 border border-amber-500/20'
                    : 'bg-white/5 text-white/60 cursor-not-allowed border border-white/5'
                }`}
                title={!user ? 'Sign in required' : !isHighTier ? 'Conductor or Engineer membership required' : !selectedCameras[0] ? 'Select a camera first' : 'Open DVR Review Ops'}
                aria-label="Review Ops - DVR Rewind"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Review Ops</span>
                {!isHighTier && user && <Lock className="w-3 h-3 ml-0.5" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                // When unmuting globally, clear per-slot overrides so slot 0 gets sound
                if (!newMuted) setMutedSlots({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${isMuted ? 'text-red-400 bg-red-500/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              aria-label={isMuted ? 'Unmute all' : 'Mute all'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Sound'}</span>
            </button>
            
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${chatOpen ? 'bg-[#ff7a00] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              aria-label={chatOpen ? 'Close chat' : 'Open chat'}
              aria-expanded={chatOpen}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            {/* Admin: Ad Manager */}
            {user?.is_admin && (
              <button
                onClick={() => setShowAdManager(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition"
                aria-label="Ad Manager"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Ads</span>
              </button>
            )}
          </div>
        </div>

        {/* Pre-Roll Ad Overlay (free users only) */}
        <div className={`flex-1 flex min-h-0 relative ${midrollActive ? 'flex-row' : ''}`}>
        {prerollActive && prerollAd && (
          <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Ad content */}
              {prerollAd.imageUrl && (
                <a
                  href={prerollAd.clickUrl || '#'}
                  target={prerollAd.clickUrl ? '_blank' : undefined}
                  rel="noopener noreferrer sponsored"
                  className="block max-w-2xl max-h-[60vh]"
                >
                  <img src={prerollAd.imageUrl} alt={prerollAd.title || 'Advertisement'} className="max-w-full max-h-[60vh] object-contain rounded-xl" />
                </a>
              )}
              {prerollAd.videoUrl && (
                <video
                  src={prerollAd.videoUrl}
                  autoPlay
                  muted={false}
                  className="max-w-3xl max-h-[60vh] rounded-xl"
                  onEnded={skipPreroll}
                />
              )}
              {prerollAd.title && !prerollAd.imageUrl && !prerollAd.videoUrl && (
                <div className="text-center p-8">
                  <p className="text-white text-xl font-bold">{prerollAd.title}</p>
                  {prerollAd.clickUrl && (
                    <a href={prerollAd.clickUrl} target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] underline mt-2 inline-block">Learn More</a>
                  )}
                </div>
              )}

              {/* Bottom bar: skip button + label */}
              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">Advertisement</span>
                {prerollCountdown > 0 ? (
                  <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium">
                    Skip in {prerollCountdown}s
                  </div>
                ) : (
                  <button
                    onClick={skipPreroll}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white text-sm font-semibold transition"
                  >
                    Skip Ad →
                  </button>
                )}
              </div>

              {/* Go ad-free link */}
              <div className="absolute bottom-6 left-6">
                <a href="/join" className="text-[#ff7a00] text-xs font-medium hover:underline">
                  Go Ad-Free with RailStream Premium →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
          <div className={`transition-all duration-700 ease-in-out ${midrollActive ? 'w-[35%] flex-none' : 'flex-1'} min-w-0 flex`}>
          {/* Focused single-camera fullscreen view */}
          {focusedSlot !== null && selectedCameras[focusedSlot] ? (
            <div className="flex-1 relative bg-black">
              {(() => {
                const camera = selectedCameras[focusedSlot];
                const state = playbackStates[focusedSlot] || {};
                return (
                  <>
                    {state.data?.hls_url ? (
                      <HlsPlayer
                        src={state.data.hls_url}
                        className="w-full h-full"
                        muted={isSlotMuted(focusedSlot)}
                        autoPlay={true}
                        controls={true}
                        viewMode="single"
                        dvrDays={state.data.dvr_days || 7}
                        cameraName={camera.name || ''}
                        cameraLocation={camera.location || ''}
                        poster={camera.thumbnail_path || null}
                        openReviewOps={reviewOpsCounter}
                        hideReviewButton={true}
                        onLogSighting={user ? (data) => handleLogSighting(selectedCameras[focusedSlot], data) : undefined}
                        initialSeekOffset={focusedSlot === 0 ? replaySeekOffset : 0}
                        onStatsUpdate={(stats) => { playerStatsRef.current[focusedSlot] = stats; }}
                        adPlaying={prerollActive}
                      />
                    ) : state.loading ? (
                      <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#ff7a00] animate-spin" /></div>
                    ) : null}
                    <button
                      onClick={handleUnfocus}
                      className="absolute top-4 left-4 z-40 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white text-sm font-medium transition-all backdrop-blur-sm"
                    >
                      <Grid2X2 className="w-4 h-4" />
                      Back to Grid
                    </button>
                    <div className="absolute top-4 right-4 z-40 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm backdrop-blur-sm border border-white/10">
                      {camera.name}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
          <div 
            className={`flex-1 grid ${gridClass} gap-1 p-1 bg-black`}
            style={viewMode === 'main5' ? {
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
            } : undefined}
          >
            {Array.from({ length: slots }).map((_, i) => {
              const camera = selectedCameras[i];
              const state = playbackStates[i] || {};
              const isCompact = viewMode === 'nine' || viewMode === 'sixteen';
              
              // Slot label for main5 layout
              const slotLabel = viewMode === 'main5' 
                ? (i === 0 ? 'Main Feed' : `Aux ${i}`)
                : `Slot ${i + 1}`;
              
              return (
                <div 
                  key={i} 
                  className={`relative bg-zinc-900 rounded overflow-hidden group ${camera && viewMode !== 'single' ? 'cursor-pointer' : ''}`}
                  style={viewMode === 'main5' && i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : undefined}
                  role="region"
                  aria-label={camera ? `Camera ${i + 1}: ${camera.name}` : `Empty slot ${i + 1}`}
                  onDoubleClick={() => handleTileFocus(i)}
                >
                  {camera ? (
                    <>
                      {state.loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <Loader2 className={`${isCompact ? 'w-6 h-6' : 'w-10 h-10'} text-[#ff7a00] animate-spin`} />
                        </div>
                      ) : state.upgrade ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/95">
                          <div className="text-center p-4 max-w-xs">
                            <Lock className={`${isCompact ? 'w-6 h-6' : 'w-12 h-12'} text-[#ff7a00] mx-auto mb-2`} aria-hidden="true" />
                            {!isCompact && (
                              <>
                                <p className="text-white text-lg font-bold mb-1">{camera.name}</p>
                                {state.upgrade.needsSignIn ? (
                                  <>
                                    <p className="text-white/60 text-sm mb-3">
                                      Sign in to access <span className="text-[#ff7a00] font-semibold capitalize">{state.upgrade.required_tier}</span> cameras
                                    </p>
                                    <button
                                      onClick={() => onLogin && onLogin()}
                                      className="inline-block px-5 py-2 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-semibold rounded-lg text-sm transition mr-2"
                                    >
                                      Sign In
                                    </button>
                                    <a
                                      href="/join"
                                      className="inline-block px-5 py-2 border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00]/10 font-semibold rounded-lg text-sm transition"
                                    >
                                      Join Now
                                    </a>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-white/60 text-sm mb-3">
                                      This camera requires <span className="text-[#ff7a00] font-semibold capitalize">{state.upgrade.required_tier}</span> access
                                    </p>
                                    <a
                                      href={state.upgrade.upgrade_url || '/join'}
                                      className="inline-block px-5 py-2 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-semibold rounded-lg text-sm transition"
                                    >
                                      Upgrade Now
                                    </a>
                                  </>
                                )}
                              </>
                            )}
                            {isCompact && (
                              <p className="text-white/60 text-[10px]">{state.upgrade.needsSignIn ? 'Sign in to watch' : 'Upgrade to watch'}</p>
                            )}
                          </div>
                        </div>
                      ) : state.streamLimit ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/95">
                          <div className="text-center p-4 max-w-xs">
                            <Monitor className={`${isCompact ? 'w-6 h-6' : 'w-12 h-12'} text-red-400 mx-auto mb-2`} aria-hidden="true" />
                            {!isCompact && (
                              <>
                                <p className="text-white text-lg font-bold mb-1">Stream Limit Reached</p>
                                <p className="text-white/60 text-sm mb-3">
                                  {state.streamLimit.message || `You've reached your limit of ${state.streamLimit.stream_limit} concurrent streams.`}
                                </p>
                                <p className="text-white/70 text-xs mb-3">
                                  Active streams: {state.streamLimit.active_streams} / {state.streamLimit.stream_limit}
                                </p>
                                <button
                                  onClick={(e) => { e.stopPropagation(); loadCamera(camera, i); }}
                                  className="inline-block px-5 py-2 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-semibold rounded-lg text-sm transition"
                                >
                                  Retry
                                </button>
                              </>
                            )}
                            {isCompact && (
                              <p className="text-red-400 text-[10px]">Limit reached</p>
                            )}
                          </div>
                        </div>
                      ) : state.error && camera.status === 'offline' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="text-center p-4 max-w-sm">
                            {!isCompact ? (
                              <>
                                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                  <Camera className="w-8 h-8 text-red-400" />
                                </div>
                                <p className="text-white text-xl font-bold mb-2">Camera Offline</p>
                                <p className="text-white/80 font-medium mb-1">{camera.name}</p>
                                <p className="text-white/50 text-sm mb-4">{camera.location}</p>
                                <p className="text-white/40 text-sm mb-4">
                                  {camera.description || 'This camera is temporarily unavailable. Please check back later.'}
                                </p>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-semibold">
                                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                                  OFFLINE
                                </span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-6 h-6 text-red-400 mx-auto mb-1" />
                                <p className="text-red-400 text-[10px] font-bold">OFFLINE</p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : state.error && camera.status === 'coming_soon' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="text-center p-4 max-w-sm">
                            {!isCompact ? (
                              <>
                                <div className="w-16 h-16 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center mx-auto mb-4">
                                  <Camera className="w-8 h-8 text-[#ff7a00]" />
                                </div>
                                <p className="text-white text-xl font-bold mb-2">Coming Soon</p>
                                <p className="text-white/80 font-medium mb-1">{camera.name}</p>
                                <p className="text-white/50 text-sm mb-4">{camera.location}</p>
                                <p className="text-white/40 text-sm mb-4">
                                  {camera.description || 'This camera location is being set up and will be available soon.'}
                                </p>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff7a00]/10 border border-[#ff7a00]/20 rounded-full text-[#ff7a00] text-xs font-semibold">
                                  <span className="w-2 h-2 bg-[#ff7a00] rounded-full animate-pulse" />
                                  COMING SOON
                                </span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-6 h-6 text-[#ff7a00] mx-auto mb-1" />
                                <p className="text-[#ff7a00] text-[10px] font-bold">COMING SOON</p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : state.error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                          <div className="text-center p-2">
                            <X className={`${isCompact ? 'w-5 h-5' : 'w-10 h-10'} text-red-400 mx-auto mb-1`} aria-hidden="true" />
                            <p className={`text-white ${isCompact ? 'text-[10px]' : 'text-sm'}`}>{state.error}</p>
                          </div>
                        </div>
                      ) : state.data?.hls_url ? (
                        <HlsPlayer
                          src={state.data.hls_url}
                          className="w-full h-full"
                          muted={isSlotMuted(i)}
                          autoPlay={true}
                          controls={!isCompact}
                          viewMode={viewMode}
                          dvrDays={state.data.dvr_days || 7}
                          cameraName={camera.name || ''}
                          cameraLocation={camera.location || ''}
                          poster={camera.thumbnail_path || null}
                          openReviewOps={viewMode === 'single' && i === 0 ? reviewOpsCounter : 0}
                          hideReviewButton={true}
                          onLogSighting={user && !isCompact ? (data) => handleLogSighting(selectedCameras[i], data) : undefined}
                          initialSeekOffset={i === 0 ? replaySeekOffset : 0}
                          onStatsUpdate={(stats) => { playerStatsRef.current[i] = stats; }}
                          adPlaying={prerollActive}
                        />
                      ) : null}
                      
                      {/* Per-tile mute button */}
                      {camera && state?.data?.hls_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSlotMute(i); }}
                          className={`absolute ${isCompact ? 'top-0.5 left-0.5 p-0.5' : 'top-2 left-2 p-1.5'} rounded-md transition-all z-10 ${
                            isSlotMuted(i)
                              ? 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80'
                              : 'bg-[#ff7a00]/80 text-white hover:bg-[#ff7a00]'
                          }`}
                          title={isSlotMuted(i) ? `Unmute ${camera.name}` : `Mute ${camera.name}`}
                          aria-label={isSlotMuted(i) ? `Unmute ${camera.name}` : `Mute ${camera.name}`}
                        >
                          {isSlotMuted(i) 
                            ? <VolumeX className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} /> 
                            : <Volume2 className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          }
                        </button>
                      )}
                      
                      {/* Camera label + expand button (multi-view only) */}
                      {viewMode !== 'single' && camera && (
                        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[5] ${isCompact ? 'p-1.5 pt-6' : 'p-2.5 pt-10'}`}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className={`text-white font-medium truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>{camera.name}</p>
                              {!isCompact && <p className="text-white/70 text-xs truncate">{camera.location}</p>}
                            </div>
                            <div className="relative group/expand flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTileFocus(i); }}
                                className={`rounded-lg bg-[#ff7a00] hover:bg-[#ff8c20] text-white transition-all hover:scale-110 shadow-lg shadow-black/40 ${isCompact ? 'p-1.5 ml-1.5' : 'p-2.5 ml-2'}`}
                                aria-label="Expand this camera to full view"
                              >
                                <Monitor className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
                              </button>
                              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 pointer-events-none opacity-0 group-hover/expand:opacity-100 transition-opacity whitespace-nowrap z-50">
                                <div className="bg-zinc-800 border border-white/10 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-xl">
                                  Expand to Full View
                                  <div className="absolute top-1/2 -translate-y-1/2 right-full w-2.5 h-2.5 bg-zinc-800 border-l border-b border-white/10 transform rotate-45 -mr-1" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (targetSlot === i) {
                          setTargetSlot(null); // Deselect if clicking same slot
                        } else {
                          setTargetSlot(i);
                          setPickerOpen(true);
                        }
                      }}
                      className={`absolute inset-0 flex items-center justify-center transition ${
                        targetSlot === i 
                          ? 'bg-[#ff7a00]/10 ring-2 ring-[#ff7a00] ring-inset' 
                          : 'hover:bg-white/5'
                      }`}
                      aria-label={`${targetSlot === i ? 'Selected: ' : ''}Slot ${i + 1} - Click to add camera here`}
                    >
                      <div className="text-center">
                        <img 
                          src="https://railstream.net/images/Homepage/WebsiteLogo.png" 
                          alt="RailStream" 
                          className={`${isCompact ? 'h-6' : 'h-10'} mx-auto mb-2 opacity-30`}
                        />
                        {!isCompact && (
                          <>
                            {targetSlot === i ? (
                              <>
                                <p className="text-[#ff7a00] text-lg font-bold mb-1">{slotLabel} Selected</p>
                                <p className="text-white/80 text-base">Now pick a camera from the sidebar</p>
                              </>
                            ) : (
                              <>
                                <p className="text-white text-lg font-bold mb-1">{slotLabel}</p>
                                <p className="text-white/80 text-base">Click to select camera</p>
                              </>
                            )}
                          </>
                        )}
                        {isCompact && (
                          <p className={`text-xs font-bold ${targetSlot === i ? 'text-[#ff7a00]' : 'text-white/80'}`}>
                            {targetSlot === i ? `${slotLabel} ✓` : `+ ${slotLabel}`}
                          </p>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          )}
          </div>
          {/* End video grid wrapper */}

          {/* Mid-Roll Split-Screen Ad Panel (free users only) */}
          {midrollActive && midrollAd && (
            <div className="flex-1 min-w-0 transition-all duration-700 ease-in-out bg-black border-l border-white/10 flex flex-col relative overflow-hidden">
              {/* Ad Header Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#ff7a00] rounded-full animate-pulse" />
                  <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Advertisement</span>
                </div>
                <a href="/join" className="text-[#ff7a00] text-xs font-medium hover:underline">
                  Go Ad-Free →
                </a>
              </div>

              {/* Ad Content */}
              <div className="flex-1 flex items-center justify-center p-6">
                {midrollAd.videoUrl ? (
                  <video
                    src={midrollAd.videoUrl}
                    autoPlay
                    muted={false}
                    controls={false}
                    className="max-w-full max-h-full rounded-xl shadow-2xl"
                    onEnded={skipMidroll}
                  />
                ) : midrollAd.imageUrl ? (
                  <a
                    href={midrollAd.clickUrl || '#'}
                    target={midrollAd.clickUrl ? '_blank' : undefined}
                    rel="noopener noreferrer sponsored"
                    className="block max-w-full max-h-full"
                  >
                    <img
                      src={midrollAd.imageUrl}
                      alt={midrollAd.title || 'Advertisement'}
                      className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-2xl"
                    />
                  </a>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-white text-xl font-bold">{midrollAd.title}</p>
                    {midrollAd.clickUrl && (
                      <a href={midrollAd.clickUrl} target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] underline mt-4 inline-block text-sm">
                        Learn More
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Ad Title (if present) */}
              {midrollAd.title && (midrollAd.imageUrl || midrollAd.videoUrl) && (
                <div className="px-6 pb-2 text-center">
                  <p className="text-white/70 text-sm font-medium">{midrollAd.title}</p>
                  {midrollAd.clickUrl && (
                    <a href={midrollAd.clickUrl} target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] text-xs hover:underline mt-1 inline-block">
                      Learn More →
                    </a>
                  )}
                </div>
              )}

              {/* Bottom Bar: Skip button */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-t border-white/10">
                <span className="text-white/30 text-xs">Stream is still live →</span>
                {midrollCountdown > 0 ? (
                  <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium">
                    Skip in {midrollCountdown}s
                  </div>
                ) : (
                  <button
                    onClick={skipMidroll}
                    className="px-5 py-2 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white text-sm font-bold rounded-lg transition shadow-lg shadow-[#ff7a00]/20"
                  >
                    Skip Ad →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {chatOpen && !midrollActive && (
            <div className="w-80 flex-shrink-0 border-l border-white/10">
              <YardChat 
                user={user}
                onToggleMinimize={() => setChatOpen(false)}
              />
            </div>
          )}

          {/* Companion Ad Sidebar (free/non-signed-in users only, hidden during midroll) */}
          {showCompanionAds && !chatOpen && !midrollActive && (
            <CompanionAdPanel ads={ads} />
          )}
          
          {/* Google Ad Manager sidebar ad (non-premium users) */}
          {!user && !chatOpen && (
            <div className="mt-2">
              <GptAdSlot
                adUnitPath="/6355419/Travel/Europe/France/Paris"
                sizes={[[300, 250]]}
                divId="div-gpt-ad-sidebar-test"
                className="rounded-lg overflow-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Ad Manager Modal (admin only) */}
      {showAdManager && <AdManagerModal onClose={() => setShowAdManager(false)} />}

      {/* Train Sighting Modal */}
      {sightingForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSightingForm(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Train className="w-5 h-5 text-[#ff7a00]" />
                Log Train Sighting
              </h2>
              <button onClick={() => setSightingForm(null)} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitSighting} className="p-4 space-y-4">
              {/* Snapshot Preview */}
              {sightingForm.imageData && (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={sightingForm.imageData} alt="Sighting snapshot" className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                    <p className="text-white text-xs font-medium">{sightingForm.cameraName}</p>
                    <p className="text-white/60 text-[11px]">
                      {new Date(sightingForm.sightingTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
              )}

              {/* Pre-filled info */}
              <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#ff7a00] flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{sightingForm.cameraName}</p>
                  <p className="text-white/70 text-xs">{sightingForm.cameraLocation}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(sightingForm.sightingTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>

              {/* Railroad + Train Type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sighting-railroad" className="block text-white/70 text-sm mb-1 font-medium">Railroad *</label>
                  <select
                    id="sighting-railroad"
                    value={sightingData.railroad}
                    onChange={e => setSightingData(f => ({ ...f, railroad: e.target.value }))}
                    required
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                  >
                    <option value="">Select...</option>
                    {RAILROADS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sighting-traintype" className="block text-white/70 text-sm mb-1 font-medium">Train Type</label>
                  <select
                    id="sighting-traintype"
                    value={sightingData.train_type}
                    onChange={e => setSightingData(f => ({ ...f, train_type: e.target.value }))}
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
                  >
                    <option value="">Select...</option>
                    {TRAIN_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Train ID + Direction row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sighting-trainid" className="block text-white/70 text-sm mb-1 font-medium">Train ID / Symbol</label>
                  <input
                    id="sighting-trainid"
                    type="text"
                    value={sightingData.train_id}
                    onChange={e => setSightingData(f => ({ ...f, train_id: e.target.value }))}
                    placeholder="e.g., Q335, N956"
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/60"
                  />
                </div>
                <div>
                  <label htmlFor="sighting-direction" className="block text-white/70 text-sm mb-1 font-medium">Direction</label>
                  <select
                    id="sighting-direction"
                    value={sightingData.direction}
                    onChange={e => setSightingData(f => ({ ...f, direction: e.target.value }))}
                    className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60"
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
                <label htmlFor="sighting-locos" className="block text-white/70 text-sm mb-1 font-medium">Locomotive(s)</label>
                <input
                  id="sighting-locos"
                  type="text"
                  value={sightingData.locomotives}
                  onChange={e => setSightingData(f => ({ ...f, locomotives: e.target.value }))}
                  placeholder="e.g., CSX 3194, CSX 812"
                  className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/60"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="sighting-notes" className="block text-white/70 text-sm mb-1 font-medium">Notes</label>
                <textarea
                  id="sighting-notes"
                  value={sightingData.notes}
                  onChange={e => setSightingData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Horn, meets, rare power, DPU, etc."
                  rows={2}
                  className="w-full bg-black/50 border border-white/20 text-white text-sm rounded-lg px-3 py-2.5 focus:border-[#ff7a00] focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 placeholder:text-white/60 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sightingSubmitting || !sightingData.railroad}
                className="w-full bg-[#ff7a00] hover:bg-[#ff8c20] disabled:bg-[#ff7a00]/40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                {sightingSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <Train className="w-4 h-4" />
                    Log Sighting
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
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
        c.location?.toLowerCase().includes(search.toLowerCase());
      const matchesTab = tab === 'all' || c.min_tier === tab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => tierOrder[a.min_tier] - tierOrder[b.min_tier]);

  const tierGroups = {
    fireman: { title: 'Fireman Cameras', subtitle: 'FREE - 14 complimentary railcams', cameras: [] },
    conductor: { title: 'Conductor Cameras', subtitle: '$8.95/mo - Includes all Fireman + exclusive locations', cameras: [] },
    engineer: { title: 'Engineer Cameras', subtitle: '$12.95/mo - Access to ALL cameras', cameras: [] },
    coming_soon: { title: 'Coming Soon', subtitle: 'New locations on the horizon', cameras: [] },
  };

  filtered.forEach(c => { 
    if (c.status === 'coming_soon') {
      tierGroups.coming_soon.cameras.push(c);
    } else if (tierGroups[c.min_tier]) {
      tierGroups[c.min_tier].cameras.push(c);
    }
  });

  return (
    <main className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Our Cameras</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            46 live railcams across the USA and Canada. Superior video and audio quality — next to being trackside!
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location, state, or railroad..."
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/60"
              aria-label="Search cameras"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white/5 h-12">
              <TabsTrigger value="all" className="px-4 text-white data-[state=active]:bg-[#ff7a00]">All</TabsTrigger>
              <TabsTrigger value="fireman" className="px-4 text-white data-[state=active]:bg-orange-600">Free</TabsTrigger>
              <TabsTrigger value="conductor" className="px-4 text-white data-[state=active]:bg-blue-600">Conductor</TabsTrigger>
              <TabsTrigger value="engineer" className="px-4 text-white data-[state=active]:bg-purple-600">Engineer</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {Object.entries(tierGroups).map(([tier, group]) => {
          if (group.cameras.length === 0) return null;
          const TierIcon = tier === 'coming_soon' ? Clock : (TIERS[tier]?.icon || Zap);
          const tierColor = tier === 'coming_soon' ? 'from-yellow-600 to-yellow-500' : TIERS[tier]?.color;
          
          return (
            <section key={tier} className="mb-12" aria-labelledby={`${tier}-heading`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${tierColor}`}>
                  <TierIcon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 id={`${tier}-heading`} className="text-xl font-semibold text-white">{group.title}</h2>
                  <p className="text-sm text-white/70">{group.subtitle}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.cameras.map(camera => {
                  const isComingSoon = camera.status === 'coming_soon';
                  const isOffline = camera.status === 'offline';
                  const isStatusCamera = isComingSoon || isOffline;
                  const hasAccess = !isComingSoon && canAccess(user?.membership_tier, camera.min_tier, user?.is_admin);
                  
                  return (
                    <button
                      key={camera._id}
                      onClick={() => onSelectCamera(camera)}
                      className={`group relative rounded-xl overflow-hidden bg-zinc-900 text-left transition-all hover:scale-[1.02] cursor-pointer ${!hasAccess && !isStatusCamera ? 'opacity-80' : ''}`}
                      aria-label={`${camera.name} - ${isComingSoon ? 'Coming soon' : isOffline ? 'Offline' : hasAccess ? 'Click to watch' : !user ? 'Sign in to watch' : 'Upgrade required'}`}
                    >
                      <div className="aspect-video relative">
                        <img src={camera.thumbnail_path || 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=225&fit=crop'} alt="" className={`w-full h-full object-cover ${isComingSoon ? 'opacity-50' : ''}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        {camera.status === 'online' && (
                          <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                            <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" aria-hidden="true" />
                            LIVE
                          </Badge>
                        )}
                        
                        {isComingSoon && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Badge className="bg-[#ff7a00] text-white">
                              <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                              Coming Soon
                            </Badge>
                          </div>
                        )}
                        
                        {!hasAccess && !isComingSoon && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white" aria-hidden="true" />
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
                        <p className="text-sm text-white/70">{camera.location}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

// ============================================
// ABOUT PAGE
// ============================================
function AboutPage() {
  return (
    <main className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <img src="https://railstream.net/images/Homepage/WebsiteLogo.png" alt="RailStream" className="h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">About RailStream</h1>
          <p className="text-xl text-white/70">Superior image with sound quality that is only second to being trackside.</p>
        </header>
        
        <div className="space-y-12">
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div><img src="https://railstream.net/images/us2.png" alt="Mike and Andrea, founders of RailStream" className="rounded-2xl w-full shadow-2xl" /></div>
            <div className="bg-zinc-900 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                Over a decade ago we had the idea for a railcam at the historic Fostoria Iron Triangle. 
                It was the first live railcam with sound and it took off like hotcakes!
              </p>
              <p className="text-white/80 leading-relaxed mb-4">
                We've grown a lot since the original cam, but we stay true to our roots. 
                Superior image with sound quality that is only second to being trackside.
              </p>
              <p className="text-[#ff7a00] font-semibold text-lg">— Mike & Andrea</p>
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '46', label: 'Live Cameras' },
              { value: '19', label: 'Railroads' },
              { value: '2M+', label: 'Hours/Month' },
              { value: '175', label: 'Countries' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#ff7a00] mb-1">{stat.value}</div>
                <div className="text-white">{stat.label}</div>
              </div>
            ))}
          </section>

          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-zinc-900 rounded-2xl p-8 order-2 md:order-1">
              <h2 className="text-3xl font-bold text-white mb-4">With the Help of Friends</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                We're blessed to work with an incredible network of partners, organizations, and generous families 
                who help make our camera locations possible.
              </p>
              <p className="text-white/60 text-sm mb-4">
                A Special Thanks to: Mark, Kevin, Lloyd, Ron, Tom, Thomas, Justin, and Warren.
              </p>
              <p className="text-[#ff7a00] font-semibold">— Mike & Andrea</p>
            </div>
            <div className="order-1 md:order-2"><img src="https://railstream.net/images/us3.png" alt="RailStream team on location" className="rounded-2xl w-full shadow-2xl" /></div>
          </section>

          <section className="bg-gradient-to-r from-[#ff7a00] to-orange-600 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Watch Everywhere</h2>
            <p className="text-white/90 mb-6">Available 24/7/365 on all your favorite platforms.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Roku', url: 'https://channelstore.roku.com/details/74e07738778cf9dfb74340ef94503257' },
                { name: 'Fire TV', url: 'https://www.amazon.com/Railstream/dp/B08466FH5Q' },
                { name: 'Apple TV', url: 'https://apps.apple.com/us/app/railstream/id1520484749' },
                { name: 'Android', url: 'https://play.google.com/store/apps/details?id=com.maz.combo2225rs' },
              ].map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium transition">
                  <Tv className="w-5 h-5" aria-hidden="true" />{p.name}<ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================
// HOSTS PAGE
// ============================================
function HostsPage() {
  const hosts = [
    { name: "Bim's Package", location: "Atlanta, GA", url: "https://bimsliquor.com/" },
    { name: "Boyce Railway Depot", location: "Boyce, VA", url: "https://boycedepot.com/" },
    { name: "Riley's Railhouse", location: "Chesterton, IN", url: "https://www.rileysrailhouse.com/" },
    { name: "Mount Carmel High School", location: "Chicago, IL", url: "https://www.mchs.org/" },
    { name: "The Station Inn", location: "Cresson, PA", url: "https://stationinnpa.com/" },
    { name: "Sandy Creek Mining Co.", location: "West Newton, PA", url: "https://sandycreekmining.com/" },
    { name: "Fullerton Train Museum", location: "Fullerton, CA", url: "https://fullertontrainmuseum.org/" },
    { name: "Ludlow Heritage Museum", location: "Ludlow, KY", url: "https://www.ludlowheritagemuseum.com/" },
    { name: "Oregon Depot Museum", location: "Oregon, IL", url: "http://oregondepot.com/" },
    { name: "City of Selma", location: "Selma, NC" },
    { name: "Black Dog Coffee", location: "Shenandoah Jct, WV", url: "https://blackdogcoffee.net/" },
    { name: "Roomettes", location: "Belleville, ON", url: "https://roometteslighting.com/" },
    { name: "Mad River & NKP Museum", location: "Bellevue, OH", url: "https://madrivermuseum.org/" },
    { name: "Village of Coal City", location: "Coal City, IL" },
    { name: "Durand Union Station", location: "Durand, MI", url: "https://www.durandstation.org/" },
    { name: "Village of Franklin Park", location: "Franklin Park, IL", url: "https://www.villageoffranklinpark.com/" },
    { name: "Whole Cubes", location: "La Grange, IL", url: "https://wholecubes.com/" },
    { name: "Rosenberg Railroad Museum", location: "Rosenberg, TX", url: "https://www.rosenbergrrmuseum.org/" },
    { name: "Waldwick Historical Society", location: "Waldwick, NJ", url: "https://www.allaboardwaldwick.org/" },
  ];

  return (
    <main className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Our Hosts</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Our cameras wouldn't be possible without the support of our incredible hosts.
          </p>
        </header>

        <div className="bg-zinc-900 rounded-2xl p-6 mb-8">
          <p className="text-white/80 leading-relaxed">
            A huge thank you to our community partners and the railfan families who have graciously opened their backyards.
          </p>
          <p className="text-[#ff7a00] font-semibold mt-4">— Mike & Andrea</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosts.map((host, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#ff7a00]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#ff7a00]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{host.name}</h3>
                <p className="text-sm text-white/70 mb-2">{host.location}</p>
                {host.url && (
                  <a href={host.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#ff7a00] hover:underline inline-flex items-center gap-1">
                    Visit <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#ff7a00] to-orange-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Want to be a RailStream host?</h2>
          <p className="text-white/90 mb-4">Have an idea for a new railcam location?</p>
          <a href="mailto:railcam@railstream.net" className="inline-flex items-center gap-2 bg-white text-[#ff7a00] px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition">
            <Mail className="w-5 h-5" aria-hidden="true" />railcam@railstream.net
          </a>
        </div>
      </div>
    </main>
  );
}

// ============================================
// FAQ PAGE
// ============================================
function FAQPage() {
  const faqs = [
    { q: "How do I upgrade my membership?", a: "Click on 'Account Info' in the top menu, select 'SignUp Form', choose your membership type, and follow the payment prompts." },
    { q: "Why do free cameras have ads?", a: "Ads allow us to offer 14 cameras to the public for free. Upgrade to Conductor or Engineer for ad-free viewing." },
    { q: "Why can't I log into more than one device?", a: "Due to security settings, users cannot log into more than one machine simultaneously. We offer dual and quad view so you can enjoy multiple cameras at once." },
    { q: "What if cameras are buffering?", a: "Check your internet speed at speedtest.net. We recommend at least 6 Mbps and a dual-core processor." },
    { q: "I see cameras but no sound?", a: "Check that your computer volume isn't muted and that the mute button on the player isn't enabled." },
    { q: "Can I post RailStream content online?", a: "All content is property of RailStream, LLC and protected by copyright. Rebroadcast without consent is prohibited." },
  ];

  return (
    <main className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">FAQ</h1>
          <p className="text-white/70">Common questions from the RailStream community.</p>
        </header>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#ff7a00] flex-shrink-0 mt-0.5" aria-hidden="true" />
                {faq.q}
              </h3>
              <p className="text-white/70 pl-8">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-zinc-900 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Still have questions?</h2>
          <p className="text-white/70 mb-4">Our team is here to help!</p>
          <a href="mailto:contactus@railstream.net" className="inline-flex items-center gap-2 bg-[#ff7a00] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#ff8c20] transition">
            <Mail className="w-5 h-5" aria-hidden="true" />contactus@railstream.net
          </a>
        </div>
      </div>
    </main>
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
  const [rememberMe, setRememberMe] = useState(() => auth.getRememberMe());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Set the remember preference BEFORE storing the token
    auth.setRememberMe(rememberMe);
    try {
      const data = await clientApi.login(username, password);
      if (data.access_token) {
        auth.setToken(data.access_token);
        // Save refresh token if the API provides one (used for silent token renewal)
        if (data.refresh_token) auth.setRefreshToken(data.refresh_token);
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
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md p-0 overflow-hidden">
        {/* Logo header */}
        <div className="pt-10 pb-6 px-8 text-center bg-gradient-to-b from-[#ff7a00]/5 to-transparent">
          <img 
            src="https://railstream.net/images/Homepage/WebsiteLogo.png" 
            alt="RailStream" 
            className="h-14 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,122,0,0.3)]" 
          />
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-white text-center">Welcome Back</DialogTitle>
            <DialogDescription className="text-white/50 text-center">Sign in to your RailStream account</DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{error}</div>}
          <div>
            <label htmlFor="login-username" className="text-white/60 text-xs font-medium mb-1.5 block">Username</label>
            <Input id="login-username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 bg-zinc-800/80 border-zinc-700 text-white placeholder:text-white/40 focus:border-[#ff7a00] focus:ring-[#ff7a00]" required />
          </div>
          <div>
            <label htmlFor="login-password" className="text-white/60 text-xs font-medium mb-1.5 block">Password</label>
            <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-zinc-800/80 border-zinc-700 text-white placeholder:text-white/40 focus:border-[#ff7a00] focus:ring-[#ff7a00]" required />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-[#ff7a00] focus:ring-[#ff7a00] focus:ring-offset-0 cursor-pointer accent-[#ff7a00]"
            />
            <span className="text-white/70 text-sm">Keep me logged in</span>
          </label>
          <Button type="submit" className="w-full h-12 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-bold text-base rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
        
        <div className="border-t border-white/5 px-8 py-4 bg-zinc-900/50">
          <p className="text-center text-white/50 text-sm">
            New to RailStream? <a href="https://railstream.net/member/signup" target="_blank" className="text-[#ff7a00] hover:underline font-semibold">Join Today</a>
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
  const [currentPage, setCurrentPage] = useState('home');
  const [loginOpen, setLoginOpen] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // camera object for offline/coming_soon modal
  
  const [viewMode, setViewMode] = useState('single');
  const [selectedCameras, setSelectedCameras] = useState([null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]);
  const [playbackStates, setPlaybackStates] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [presets, setPresets] = useState([]);
  
  // Replay seek offset from URL params (seconds back from live)
  const [replaySeekOffset, setReplaySeekOffset] = useState(0);
  
  // Live thumbnail mapping from studio (studioSiteId -> catalogCameraId)
  const [thumbnailMap, setThumbnailMap] = useState({}); // catalogCameraId -> studioSiteId
  const [thumbTimestamp, setThumbTimestamp] = useState(Date.now());

  // Active session tracking for heartbeat and cleanup
  const activeSessionsRef = useRef({}); // { slotIndex: { session_id, camera_id } }
  const playerStatsRef = useRef({}); // { slotIndex: { state, position, bufferCount, ... } }

  // Heartbeat — keep active sessions alive every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const sessions = activeSessionsRef.current;
      const entries = Object.entries(sessions).filter(([, v]) => v);
      if (entries.length === 0) return;
      const token = auth.getToken();
      const deviceInfo = getDeviceInfo();
      const connType = typeof navigator !== 'undefined' && navigator.connection
        ? navigator.connection.effectiveType || 'unknown'
        : 'unknown';

      entries.forEach(([slotIdx, sessionData]) => {
        const sessionId = typeof sessionData === 'string' ? sessionData : sessionData?.session_id;
        if (!sessionId) return;

        // Get player stats for this slot if available
        const stats = playerStatsRef.current[slotIdx] || {};

        fetch('/api/playback/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            session_id: sessionId,
            device_id: getDeviceId(),
            state: stats.state || 'playing',
            position_seconds: stats.position || 0,
            app_version: 'Web 1.0',
            device_model: deviceInfo.device_model || 'Browser',
            os_version: deviceInfo.os_version || 'Unknown',
            client_type: 'web',
            player_version: 'hls.js',
            connection_type: connType,
            buffer_count: stats.bufferCount || 0,
            buffer_time_seconds: stats.bufferTime || 0,
            error_count: stats.errorCount || 0,
          }),
        })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          // Only log device-removal events — NEVER force-logout from a background heartbeat.
          // The user should only be logged out by explicit action.
          if (data && (data.code === 'device_removed' || data.code === 'device_not_registered')) {
            console.warn('[Heartbeat] Server returned:', data.code, '— ignoring (user stays logged in)');
          }
        })
        .catch(() => {});
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup sessions on tab close / navigate away
  useEffect(() => {
    const cleanup = () => {
      const sessions = activeSessionsRef.current;
      const token = auth.getToken();
      Object.values(sessions).filter(Boolean).forEach(sessionData => {
        const sessionId = typeof sessionData === 'string' ? sessionData : sessionData?.session_id;
        if (!sessionId) return;
        // Use sendBeacon for reliable delivery on tab close
        const url = `/api/playback/stop?session_id=${sessionId}`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
        } else {
          fetch(url, {
            method: 'POST',
            keepalive: true,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }).catch(() => {});
        }
      });
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  // ── Auth session heartbeat / keep-alive ──
  // Smart validation: checks token when tab becomes visible.
  // If expired, silently refreshes using the refresh token (just like mobile apps).
  useEffect(() => {
    let refreshing = false;

    const validateSession = async () => {
      const token = auth.getToken();
      if (!token) return;
      if (refreshing) return;

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.username) {
            const updatedUser = {
              username: data.username,
              membership_tier: data.membership_tier || data.tier,
              is_admin: data.is_admin || false,
              ...data,
            };
            auth.setUser(updatedUser);
            setUser(updatedUser);
          }
        } else if (res.status === 401) {
          // Token expired — try to silently refresh (just like mobile apps do)
          console.log('[Auth] Access token expired — attempting silent refresh...');
          refreshing = true;
          const refreshed = await auth.refresh();
          refreshing = false;
          if (refreshed) {
            // Success! User stays logged in seamlessly
            console.log('[Auth] Token refreshed — user stays logged in');
            // Re-validate with the new token to get fresh user data
            const newToken = auth.getToken();
            const meRes = await fetch('/api/auth/me', {
              headers: { 'Authorization': `Bearer ${newToken}` },
            });
            if (meRes.ok) {
              const data = await meRes.json();
              if (data && data.username) {
                auth.setUser(data);
                setUser({ ...data, is_admin: data.is_admin || false });
              }
            }
          } else {
            // Refresh token also expired or not available
            // Just log it — don't interrupt the user
            console.log('[Auth] Refresh failed — user may need to sign in on next camera load');
          }
        }
      } catch (e) {
        console.log('[Auth] Network error, skipping validation');
      }
    };

    // Validate on mount
    validateSession();

    // Validate when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Also refresh proactively every 10 minutes to stay ahead of token expiry
    const interval = setInterval(validateSession, 10 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  // Sync preferences to server (debounced)
  const syncPrefsToServer = useCallback(async (newFavs, newPresets) => {
    const token = auth.getToken();
    if (!token) return;
    try {
      // Sync presets via user/preferences (keep existing behavior)
      if (newPresets !== undefined) {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ presets: newPresets }),
        });
      }
    } catch (e) {
      console.log('Preference sync failed:', e);
    }
  }, []);

  // Load preferences from server on login
  const loadServerPrefs = useCallback(async () => {
    const token = auth.getToken();
    if (!token) return;
    try {
      // Load favorites from the favorites API
      const favRes = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const favData = await favRes.json();
      if (favData.ok && favData.favorites?.length > 0) {
        setFavorites(favData.favorites);
        storage.setFavorites(favData.favorites);
      }

      // Load presets from user/preferences
      const prefRes = await fetch('/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const prefData = await prefRes.json();
      if (prefData.ok && prefData.presets?.length > 0) {
        setPresets(prefData.presets);
        storage.setPresets(prefData.presets);
      }
    } catch (e) {
      console.log('Failed to load server preferences:', e);
    }
  }, []);

  // Update favorites — use the proper Favorites API
  const updateFavorites = useCallback((newFavs) => {
    setFavorites(newFavs);
    storage.setFavorites(newFavs);
    
    const token = auth.getToken();
    if (!token) return;

    // Use PUT /api/favorites for bulk sync
    fetch('/api/favorites', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ camera_ids: newFavs }),
    }).catch(e => console.log('Favorites sync failed:', e));
  }, []);

  // Update presets — save to localStorage + server
  const updatePresets = useCallback((newPresets) => {
    setPresets(newPresets);
    storage.setPresets(newPresets);
    syncPrefsToServer(undefined, newPresets);
  }, [syncPrefsToServer]);

  useEffect(() => {
    const init = async () => {
      try {
        const catalog = await clientApi.getCatalog();
        if (Array.isArray(catalog)) setCameras(catalog);
        const savedUser = auth.getUser();
        if (savedUser) {
          setUser(savedUser);
          // Load from localStorage first (instant), then sync from server
          setFavorites(storage.getFavorites());
          setPresets(storage.getPresets());
          // Fetch server prefs (overwrites localStorage if server has data)
          const token = auth.getToken();
          if (token) {
            try {
              const res = await fetch('/api/user/preferences', {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.ok) {
                if (data.favorites?.length > 0) {
                  setFavorites(data.favorites);
                  storage.setFavorites(data.favorites);
                }
                if (data.presets?.length > 0) {
                  setPresets(data.presets);
                  storage.setPresets(data.presets);
                }
              }
            } catch (e) { console.log('Server prefs load skipped'); }
          }
        } else {
          setFavorites(storage.getFavorites());
          setPresets(storage.getPresets());
        }
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Handle ?page=X URL param (from SiteHeader navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam && ['watch', 'about', 'login'].includes(pageParam)) {
      setCurrentPage(pageParam);
      // Clean URL params without reload
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Handle ?watch=CAMERA_ID&seek=SECONDS URL params (from Replay links)
  useEffect(() => {
    if (cameras.length === 0 || loading) return;
    const params = new URLSearchParams(window.location.search);
    const watchId = params.get('watch');
    const seekSecs = parseInt(params.get('seek') || '0', 10);
    
    if (watchId) {
      const camera = cameras.find(c => c._id === watchId);
      if (camera) {
        console.log(`[Replay] Loading camera ${camera.name}, seek offset: ${seekSecs}s`);
        setCurrentPage('watch');
        
        if (seekSecs > 300) {
          // For sightings more than 5 minutes ago, store the DVR offset
          // The player will build a timeshift URL from this
          setReplaySeekOffset(seekSecs);
        } else if (seekSecs > 0) {
          setReplaySeekOffset(seekSecs);
        }
        
        setTimeout(() => loadCamera(camera, 0), 300);
      }
      // Clean URL params without reload
      window.history.replaceState({}, '', '/');
    }
  }, [cameras, loading]);

  // Fetch studio thumbnail mapping and poll every 5 seconds
  useEffect(() => {
    let active = true;
    const fetchMapping = async () => {
      try {
        const res = await fetch('/api/studio/thumbnails-map');
        const data = await res.json();
        if (data.ok && data.mapping && active) {
          setThumbnailMap(data.mapping);
          setThumbTimestamp(Date.now());
        }
      } catch (e) {
        // Silent fail - thumbnails are a nice-to-have
      }
    };
    fetchMapping();
    const interval = setInterval(() => {
      if (active) {
        setThumbTimestamp(Date.now()); // Just update timestamp to force img reload
      }
    }, 5000);
    // Re-fetch mapping every 60 seconds (in case new cameras come online)
    const mapInterval = setInterval(fetchMapping, 60000);
    return () => { active = false; clearInterval(interval); clearInterval(mapInterval); };
  }, []);

  const loadCamera = async (camera, slotIndex) => {
    // Use functional update to avoid stale closure race conditions
    // (critical when loading multiple cameras from a preset)
    setSelectedCameras(prev => {
      const newCameras = [...prev];
      newCameras[slotIndex] = camera;
      return newCameras;
    });
    setPlaybackStates(prev => ({ ...prev, [slotIndex]: { loading: true, data: null, error: null } }));
    
    // If user is not logged in and camera requires a tier above free, show sign-in prompt
    const token = auth.getToken();
    if (!token && camera.min_tier && camera.min_tier.toLowerCase() !== 'fireman') {
      setPlaybackStates(prev => ({
        ...prev,
        [slotIndex]: {
          loading: false,
          data: null,
          error: null,
          upgrade: {
            required_tier: camera.min_tier,
            user_tier: 'none',
            upgrade_url: '/join',
            needsSignIn: true,
          },
        },
      }));
      return;
    }
    
    // Stop any existing session in this slot
    const oldSession = activeSessionsRef.current[slotIndex];
    if (oldSession) {
      const oldSid = typeof oldSession === 'string' ? oldSession : oldSession?.session_id;
      if (oldSid) {
        const token = auth.getToken();
        fetch(`/api/playback/stop?session_id=${oldSid}`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }).catch(() => {});
      }
      delete activeSessionsRef.current[slotIndex];
      delete playerStatsRef.current[slotIndex];
    }
    
    try {
      const token = auth.getToken();
      const res = await fetch('/api/playback/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          camera_id: camera._id,
          device_id: getDeviceId(),
          ...getDeviceInfo(),
        }),
      });
      const data = await res.json();
      
      // Handle HTTP 401 — token is expired or invalid
      // Try to silently refresh the token and retry (just like mobile apps)
      if (res.status === 401) {
        console.log('[loadCamera] Got 401 — attempting silent token refresh...');
        const refreshed = await auth.refresh();
        if (refreshed) {
          // Retry the authorize call with the new token
          console.log('[loadCamera] Token refreshed — retrying authorize');
          const newToken = auth.getToken();
          const retryRes = await fetch('/api/playback/authorize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
            body: JSON.stringify({
              camera_id: camera._id,
              device_id: getDeviceId(),
              ...getDeviceInfo(),
            }),
          });
          const retryData = await retryRes.json();
          if (retryData.ok && retryData.hls_url) {
            // Success! Load the camera with the new token
            activeSessionsRef.current[slotIndex] = retryData.session_id || retryData.hls_url;
            setPlaybackStates(prev => ({
              ...prev,
              [slotIndex]: {
                loading: false,
                data: { ...retryData, dvr_days: retryData.dvr_days || camera.dvr_days || 7 },
                error: null,
              },
            }));
            return;
          }
        }
        // Refresh failed or retry failed — show inline sign-in prompt
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: {
            loading: false,
            data: null,
            error: null,
            upgrade: {
              required_tier: camera.min_tier || 'conductor',
              user_tier: 'none',
              upgrade_url: '/join',
              needsSignIn: true,
            },
          },
        }));
        return;
      }
      
      if (data.ok && data.hls_url) {
        // Store session_id for heartbeat and cleanup
        if (data.session_id) {
          activeSessionsRef.current[slotIndex] = data.session_id;
        }
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: {
            loading: false,
            data: { ...data },
            error: null,
          },
        }));
      } else if (data.reason === 'upgrade_required') {
        // If user is locally known as admin or has sufficient tier, the token might be expired
        // Re-validate auth before showing upgrade prompt
        const localUser = auth.getUser();
        const locallyHasAccess = localUser && (localUser.is_admin || canAccess(localUser.membership_tier, camera.min_tier, localUser.is_admin));
        
        if (locallyHasAccess) {
          // Token might be expired — show inline sign-in prompt, do NOT pop up dialog
          console.log('[loadCamera] Locally authorized user got upgrade_required — token may be expired');
          setPlaybackStates(prev => ({
            ...prev,
            [slotIndex]: {
              loading: false,
              data: null,
              error: null,
              upgrade: {
                required_tier: camera.min_tier || data.required_tier || 'conductor',
                user_tier: 'none',
                upgrade_url: data.upgrade_url || '/join',
                needsSignIn: true,
              },
            },
          }));
        } else {
          setPlaybackStates(prev => ({
            ...prev,
            [slotIndex]: {
              loading: false,
              data: null,
              error: null,
              upgrade: {
                required_tier: data.required_tier || 'conductor',
                user_tier: data.user_tier || 'fireman',
                upgrade_url: data.upgrade_url || '/join',
              },
            },
          }));
        }
      } else if (data.reason === 'concurrent_stream_limit') {
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: {
            loading: false,
            data: null,
            error: null,
            streamLimit: {
              stream_limit: data.stream_limit,
              active_streams: data.active_streams,
              user_tier: data.user_tier,
              message: data.message || `Stream limit (${data.stream_limit}) reached.`,
            },
          },
        }));
      } else if (data.code === 'device_removed' || data.code === 'device_not_registered') {
        // Device issue — just prompt re-login, don't force logout
        console.warn('[loadCamera] Device issue:', data.code);
        // Show inline error — do NOT pop up login dialog
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: { loading: false, data: null, error: 'Session issue — please click Sign In to reconnect' },
        }));
      } else {
        setPlaybackStates(prev => ({
          ...prev,
          [slotIndex]: { loading: false, data: null, error: data.detail || data.error || data.message || 'Unable to authorize stream' },
        }));
      }
    } catch (err) {
      console.error('loadCamera error:', err);
      setPlaybackStates(prev => ({ ...prev, [slotIndex]: { loading: false, data: null, error: 'Connection error' } }));
    }
  };

  // Remove a camera from a slot and stop its session
  const removeCamera = (slotIndex) => {
    // Stop the session for this slot
    const sessionData = activeSessionsRef.current[slotIndex];
    if (sessionData) {
      const sid = typeof sessionData === 'string' ? sessionData : sessionData?.session_id;
      if (sid) {
        const token = auth.getToken();
        fetch(`/api/playback/stop?session_id=${sid}`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }).catch(() => {});
      }
      delete activeSessionsRef.current[slotIndex];
      delete playerStatsRef.current[slotIndex];
    }
    // Clear the camera and playback state
    setSelectedCameras(prev => {
      const newCameras = [...prev];
      newCameras[slotIndex] = null;
      return newCameras;
    });
    setPlaybackStates(prev => {
      const next = { ...prev };
      delete next[slotIndex];
      return next;
    });
  };

  // Stop all active sessions (used for logout / cleanup)
  const stopAllSessions = () => {
    const sessions = activeSessionsRef.current;
    const token = auth.getToken();
    Object.entries(sessions).forEach(([slot, sessionId]) => {
      if (sessionId) {
        fetch(`/api/playback/stop?session_id=${sessionId}`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }).catch(() => {});
      }
    });
    activeSessionsRef.current = {};
  };

  const handleSelectCameraFromPage = (camera) => {
    if (camera.status === 'offline' || camera.status === 'coming_soon') {
      setStatusModal(camera);
      return;
    }
    setCurrentPage('watch');
    setTimeout(() => loadCamera(camera, 0), 100);
  };

  const handleLogout = () => {
    stopAllSessions();
    // Unregister this web device from the user's account
    const token = auth.getToken();
    const deviceId = getDeviceId();
    if (token && deviceId) {
      fetch(`/api/devices/${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {}); // Best-effort, don't block logout
    }
    auth.clear();
    setUser(null);
    // Clear all user-specific state and localStorage on logout
    setFavorites([]);
    setPresets([]);
    storage.setFavorites([]);
    storage.setPresets([]);
    // Reset view to single mode and clear selected cameras
    setViewMode('single');
    setSelectedCameras([null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]);
    setReplaySeekOffset(0);
    clientApi.logout();
    toast.success('Signed out');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img src="https://railstream.net/images/Homepage/WebsiteLogo.png" alt="RailStream" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" richColors />
      
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#ff7a00] text-white px-4 py-2 rounded z-50">
        Skip to main content
      </a>
      
      <Navigation user={user} onLogin={() => setLoginOpen(true)} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div id="main-content">
        {currentPage === 'home' && (
          <HomePage 
            cameras={cameras} 
            onStartWatching={() => setCurrentPage('watch')} 
            onLogin={() => setLoginOpen(true)}
            user={user}
          />
        )}
        
        {currentPage === 'watch' && (
          <WatchPage
            cameras={cameras}
            user={user}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedCameras={selectedCameras}
            setSelectedCameras={setSelectedCameras}
            playbackStates={playbackStates}
            setPlaybackStates={setPlaybackStates}
            loadCamera={loadCamera}
            removeCamera={removeCamera}
            stopAllSessions={stopAllSessions}
            favorites={favorites}
            setFavorites={updateFavorites}
            presets={presets}
            setPresets={updatePresets}
            thumbnailMap={thumbnailMap}
            thumbTimestamp={thumbTimestamp}
            replaySeekOffset={replaySeekOffset}
            clearReplaySeek={() => setReplaySeekOffset(0)}
            playerStatsRef={playerStatsRef}
            onStatusCamera={setStatusModal}
            onLogin={() => setLoginOpen(true)}
          />
        )}

        {currentPage === 'cameras' && <CamerasPage cameras={cameras} user={user} onSelectCamera={handleSelectCameraFromPage} />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'hosts' && <HostsPage />}
        {currentPage === 'faq' && <FAQPage />}
      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={(u) => {
        setUser(u);
        loadServerPrefs();
        // After login, re-try loading any selected cameras that were locked (showing upgrade prompt)
        selectedCameras.forEach((cam, idx) => {
          if (cam) {
            const state = playbackStates[idx];
            if (state?.upgrade) {
              // Camera was locked — now try loading it with the new auth
              setTimeout(() => loadCamera(cam, idx), 300);
            }
          }
        });
      }} />

      {/* Full-screen Camera Status Modal (Offline / Coming Soon) */}
      {statusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setStatusModal(null)}>
          <div 
            className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {statusModal.status === 'offline' ? (
              /* ──────── OFFLINE MODAL ──────── */
              <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl">
                {/* Close button */}
                <button 
                  onClick={() => setStatusModal(null)} 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <div className="px-8 pt-10 pb-8 text-center">
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
                    <CameraOff className="w-10 h-10 text-red-400" />
                  </div>

                  {/* Heading */}
                  <h2 className="text-2xl font-bold text-white mb-2">Camera Offline</h2>

                  {/* Camera Name */}
                  <p className="text-lg font-semibold text-white/90 mb-1">{statusModal.name}</p>
                  
                  {/* Location in orange */}
                  <p className="text-[#ff7a00] font-medium mb-6">
                    <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                    {statusModal.location}
                  </p>

                  {/* Description */}
                  <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    This camera is currently offline due to service interruption, maintenance, or site conditions. Please check back soon.
                  </p>

                  {/* Status badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">Offline</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8">
                  <button
                    onClick={() => setStatusModal(null)}
                    className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              /* ──────── COMING SOON MODAL ──────── */
              <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl">
                {/* Close button */}
                <button 
                  onClick={() => setStatusModal(null)} 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <div className="px-8 pt-10 pb-8 text-center">
                  {/* Coming Soon Badge with sparkle */}
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff7a00] to-amber-500 rounded-full mb-6 shadow-lg shadow-[#ff7a00]/20">
                    <Sparkles className="w-5 h-5 text-white" />
                    <span className="text-white text-sm font-bold uppercase tracking-wider">Coming Soon</span>
                  </div>

                  {/* Camera Name (large) */}
                  <h2 className="text-2xl font-bold text-white mb-2">{statusModal.name}</h2>

                  {/* Location */}
                  <p className="text-[#ff7a00] font-medium mb-4">
                    <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                    {statusModal.location}
                  </p>

                  {/* Description from API */}
                  {statusModal.description && (
                    <p className="text-white/70 text-sm mb-4 max-w-sm mx-auto italic">
                      "{statusModal.description}"
                    </p>
                  )}

                  {/* Message */}
                  <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    This camera is a future release. We're working hard to bring you this view soon!
                  </p>

                  {/* Get Notified button */}
                  <button
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-[#ff7a00] to-amber-500 hover:from-[#ff8c1a] hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff7a00]/25 mb-4"
                    onClick={() => {
                      window.open('https://www.facebook.com/RailstreamLLC', '_blank');
                    }}
                  >
                    Get Notified When Live
                  </button>

                  {/* Follow links */}
                  <p className="text-white/40 text-xs mb-3">Follow us for updates</p>
                  <div className="flex items-center justify-center gap-4">
                    <a 
                      href="https://www.facebook.com/RailstreamLLC" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-lg text-[#1877F2] text-sm font-medium transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </a>
                    <a 
                      href="https://railstream.net" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm font-medium transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 pt-4">
                  <button
                    onClick={() => setStatusModal(null)}
                    className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
