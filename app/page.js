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
  Globe,
  Download,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { clientApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import YardChat from '@/components/YardChat';

// ============================================
// CONSTANTS & HELPERS
// ============================================
const TIERS = {
  fireman: { label: 'Fireman', icon: Zap, color: 'from-orange-600 to-orange-500', price: 'FREE', level: 1 },
  conductor: { label: 'Conductor', icon: Shield, color: 'from-blue-600 to-blue-500', price: '$8.95/mo', level: 2 },
  engineer: { label: 'Engineer', icon: Crown, color: 'from-purple-600 to-purple-500', price: '$12.95/mo', level: 3 },
};

const canAccess = (userTier, cameraTier) => {
  if (cameraTier === 'fireman') return true;
  return (TIERS[userTier]?.level || 0) >= (TIERS[cameraTier]?.level || 0);
};

const VIEW_MODES = [
  { id: 'single', label: '1', icon: Square, slots: 1 },
  { id: 'dual', label: '2', icon: Columns2, slots: 2 },
  { id: 'quad', label: '4', icon: Grid2X2, slots: 4 },
  { id: 'nine', label: '9', icon: Grid3X3, slots: 9 },
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
import RailStreamPlayer, { BackgroundVideoPlayer } from '@/components/RailStreamPlayer';

// ============================================
// NAVIGATION
// ============================================
function Navigation({ user, onLogin, onLogout, currentPage, setCurrentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', href: null },
    { id: '15years', label: '🎉 15 Years', href: '/15years' },
    { id: 'watch', label: 'Watch', href: null },
    { id: 'cameras', label: 'Cameras', href: '/cameras' },
    { id: 'host', label: 'Host', href: '/host' },
    { id: 'about', label: 'About', href: null },
  ];

  const handleNavClick = (item) => {
    if (item.href) {
      window.location.href = item.href;
    } else {
      setCurrentPage(item.id);
    }
  };

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
                item.id === '15years' 
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600'
                  : currentPage === item.id 
                    ? 'bg-[#ff7a00] text-white' 
                    : 'text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`hidden sm:flex px-3 py-1.5 rounded-full bg-gradient-to-r ${TIERS[user.membership_tier]?.color} text-white text-xs font-bold items-center gap-1.5`}>
                {user.membership_tier === 'engineer' && <Crown className="w-3 h-3" />}
                {user.membership_tier === 'conductor' && <Shield className="w-3 h-3" />}
                {user.membership_tier === 'fireman' && <Zap className="w-3 h-3" />}
                {TIERS[user.membership_tier]?.label}
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
        <div className="md:hidden bg-black/95 border-b border-white/10 p-4" role="menu">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { handleNavClick(item); setMenuOpen(false); }}
              role="menuitem"
              className={`block w-full text-left px-4 py-3 rounded-lg text-white font-medium ${
                item.id === '15years'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                  : currentPage === item.id ? 'bg-[#ff7a00]' : 'hover:bg-white/10'
              }`}
            >
              {item.label}
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
  const [heroPlayback, setHeroPlayback] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Pick a random online camera for the hero background
  useEffect(() => {
    const onlineCameras = cameras.filter(c => c.status === 'online' && c.min_tier === 'fireman');
    if (onlineCameras.length > 0) {
      const randomCam = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];
      setHeroCamera(randomCam);
      setVideoLoaded(false);
      
      // Get playback URL for background video
      clientApi.authorizePlayback(randomCam._id).then(data => {
        if (data.ok && data.hls_url) {
          setHeroPlayback(data);
        }
      }).catch((err) => {
        console.log('Hero video failed to load:', err);
      });
    }
  }, [cameras]);

  // Get coming soon cameras
  const comingSoonCameras = cameras.filter(c => c.status === 'coming_soon');

  return (
    <main className="min-h-screen bg-black">
      {/* HERO SECTION - Full screen with live video/thumbnail background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Welcome to RailStream">
        {/* Background - Use thumbnail for now, video will work on production domain */}
        {heroCamera && (
          <div className="absolute inset-0">
            <img 
              src={heroCamera.thumbnail_path} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              onError={(e) => e.target.style.display = 'none'}
            />
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
          
          {/* Live indicator - only show when video is actually playing */}
          {heroCamera && heroPlayback?.hls_url && (
            <div className="inline-flex items-center gap-2 text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-sm">
                Live: <span className="font-semibold">{heroCamera.name}</span>
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
            <p className="text-white/50 text-sm">
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
function CameraPicker({ cameras, selectedCameras, onSelect, userTier, viewMode, favorites, setFavorites, presets, setPresets, onLoadPreset, onSavePreset }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showPresets, setShowPresets] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  const toggleFavorite = (cameraId, e) => {
    e.stopPropagation();
    if (favorites.includes(cameraId)) {
      setFavorites(favorites.filter(id => id !== cameraId));
      toast.success('Removed from favorites');
    } else {
      setFavorites([...favorites, cameraId]);
      toast.success('Added to favorites');
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

  const groupedCameras = {};
  if (filter !== 'favorites' && favoritesCameras.length > 0) {
    const favFiltered = favoritesCameras.filter(c => 
      (!search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()))
    );
    if (favFiltered.length > 0) groupedCameras['★ Favorites'] = favFiltered;
  }
  
  filtered.filter(c => filter === 'favorites' || !favorites.includes(c._id)).forEach(cam => {
    const region = filter === 'favorites' ? '★ Favorites' : getRegion(cam);
    if (!groupedCameras[region]) groupedCameras[region] = [];
    groupedCameras[region].push(cam);
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
                <div className="text-center py-8 text-white/50">
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
                      <span className="text-xs text-white/50">{preset.viewMode} view • {preset.cameras.filter(Boolean).length} cameras</span>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cameras..."
                  className="pl-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
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
                <TabsTrigger value="favorites" className="flex-1 text-xs text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                  <Star className="w-3 h-3 mr-1" aria-hidden="true" />
                  {favorites.length}
                </TabsTrigger>
                <TabsTrigger value="fireman" className="flex-1 text-xs text-white data-[state=active]:bg-orange-600 data-[state=active]:text-white">Free</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {Object.entries(groupedCameras).map(([region, cams]) => (
                <div key={region} className="mb-4">
                  <h4 className={`text-xs font-semibold uppercase tracking-wider px-2 mb-2 ${region === '★ Favorites' ? 'text-yellow-500' : 'text-white/50'}`}>
                    {region}
                  </h4>
                  <ul className="space-y-1" role="list">
                    {cams.map(camera => {
                      const isSelected = selectedCameras.some(c => c?._id === camera._id);
                      const hasAccess = canAccess(userTier, camera.min_tier);
                      const isFavorite = favorites.includes(camera._id);
                      
                      return (
                        <li key={camera._id}>
                          <div className={`relative flex items-center gap-3 p-2 rounded-lg transition-all ${
                            isSelected ? 'bg-[#ff7a00]/20 ring-1 ring-[#ff7a00]' : hasAccess ? 'hover:bg-white/5' : 'opacity-50'
                          }`}>
                            <button
                              onClick={() => hasAccess && onSelect(camera)}
                              disabled={!hasAccess}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                              aria-label={`${hasAccess ? 'Select' : 'Locked'} ${camera.name}`}
                            >
                              <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                                <img src={camera.thumbnail_path} alt="" className="w-full h-full object-cover" />
                                {camera.status === 'online' && (
                                  <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-label="Live" />
                                )}
                                {!hasAccess && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Lock className="w-3 h-3 text-white" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{camera.name}</p>
                                <p className="text-xs text-white/50 truncate">{camera.location}</p>
                              </div>
                            </button>
                            
                            <button
                              onClick={(e) => toggleFavorite(camera._id, e)}
                              className={`p-1.5 rounded transition ${isFavorite ? 'text-yellow-500' : 'text-white/30 hover:text-yellow-500'}`}
                              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            
                            {isSelected && (
                              <span className="w-6 h-6 rounded-full bg-[#ff7a00] flex items-center justify-center text-white text-xs font-bold">
                                {selectedCameras.findIndex(c => c?._id === camera._id) + 1}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              
              {Object.keys(groupedCameras).length === 0 && (
                <div className="text-center py-8 text-white/50">
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
// WATCH PAGE
// ============================================
function WatchPage({ cameras, user, viewMode, setViewMode, selectedCameras, setSelectedCameras, playbackStates, loadCamera, favorites, setFavorites, presets, setPresets }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const handleSelectCamera = (camera) => {
    const slot = selectedCameras.findIndex(c => !c);
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
    setViewMode(preset.viewMode);
    setSelectedCameras([null, null, null, null, null, null, null, null, null]);
    preset.cameras.forEach((camera, i) => {
      if (camera) setTimeout(() => loadCamera(camera, i), i * 200);
    });
  };

  const gridClass = {
    single: 'grid-cols-1 grid-rows-1',
    dual: 'grid-cols-2 grid-rows-1',
    quad: 'grid-cols-2 grid-rows-2',
    nine: 'grid-cols-3 grid-rows-3',
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
            viewMode={viewMode}
            favorites={favorites}
            setFavorites={(f) => { setFavorites(f); storage.setFavorites(f); }}
            presets={presets}
            setPresets={(p) => { setPresets(p); storage.setPresets(p); }}
            onLoadPreset={handleLoadPreset}
            onSavePreset={handleSavePreset}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className={`p-2 rounded-lg transition ${pickerOpen ? 'bg-white/10 text-white' : 'text-white hover:bg-white/5'}`}
              aria-label={pickerOpen ? 'Hide camera list' : 'Show camera list'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${!pickerOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="h-6 w-px bg-white/10 mx-2" aria-hidden="true" />
            
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1" role="group" aria-label="View mode">
              {VIEW_MODES.map(mode => {
                const needsUpgrade = (mode.id !== 'single') && (!user || user.membership_tier === 'fireman');
                return (
                  <button
                    key={mode.id}
                    onClick={() => !needsUpgrade && setViewMode(mode.id)}
                    disabled={needsUpgrade}
                    className={`relative p-2 rounded transition-all ${
                      viewMode === mode.id ? 'bg-[#ff7a00] text-white' : needsUpgrade ? 'text-white/20' : 'text-white hover:bg-white/10'
                    }`}
                    aria-label={`${mode.label} camera view${needsUpgrade ? ' (upgrade required)' : ''}`}
                    aria-pressed={viewMode === mode.id}
                  >
                    <mode.icon className="w-4 h-4" />
                    {needsUpgrade && <Lock className="w-2 h-2 absolute top-1 right-1 text-white/40" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition ${isMuted ? 'text-red-400' : 'text-white hover:bg-white/10'}`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-lg transition flex items-center gap-2 ${chatOpen ? 'bg-[#ff7a00] text-white' : 'text-white hover:bg-white/10'}`}
              aria-label={chatOpen ? 'Close chat' : 'Open chat'}
              aria-expanded={chatOpen}
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
                  role="region"
                  aria-label={camera ? `Camera ${i + 1}: ${camera.name}` : `Empty slot ${i + 1}`}
                >
                  {camera ? (
                    <>
                      {state.loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <Loader2 className="w-10 h-10 text-[#ff7a00] animate-spin" />
                        </div>
                      ) : state.error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                          <div className="text-center p-4">
                            <X className="w-10 h-10 text-red-400 mx-auto mb-2" aria-hidden="true" />
                            <p className="text-white">{state.error}</p>
                          </div>
                        </div>
                      ) : state.data?.hls_url ? (
                        <RailStreamPlayer
                          cameraId={camera.cam_id}
                          hlsUrl={state.data.hls_url}
                          viewMode={selectedCameras.filter(Boolean).length === 1 ? 'single' : selectedCameras.filter(Boolean).length === 2 ? 'dual' : selectedCameras.filter(Boolean).length <= 4 ? 'quad' : 'nine'}
                          className="w-full h-full object-contain bg-black"
                          muted={isMuted || i > 0}
                          autoPlay={true}
                          controls={i === 0}
                        />
                      ) : null}
                      
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium truncate">{camera.name}</p>
                            <p className="text-white/70 text-xs truncate">{camera.location}</p>
                          </div>
                          {camera.status === 'online' && (
                            <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          const newCameras = [...selectedCameras];
                          newCameras[i] = null;
                          setSelectedCameras(newCameras);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${camera.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="absolute inset-0 flex items-center justify-center hover:bg-white/5 transition"
                      aria-label="Add camera to this slot"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                          <Play className="w-6 h-6 text-white/30" />
                        </div>
                        <p className="text-white/30 text-sm">Click to add camera</p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chat Panel */}
          {chatOpen && (
            <div className="w-80 bg-zinc-900/95 border-l border-white/10 flex flex-col" role="complementary" aria-label="Live chat">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#ff7a00]" aria-hidden="true" />
                  <span className="font-semibold text-white">Live Chat</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">47 online</Badge>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Close chat">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1 p-4">
                <p className="text-white/50 text-sm text-center">Chat coming soon!</p>
                <p className="text-white/30 text-xs text-center mt-2">
                  Join our <a href="https://discord.gg/railstream" className="text-[#ff7a00] hover:underline">Discord</a> in the meantime!
                </p>
              </div>
            </div>
          )}
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location, state, or railroad..."
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
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
                  <p className="text-sm text-white/50">{group.subtitle}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.cameras.map(camera => {
                  const isComingSoon = camera.status === 'coming_soon';
                  const hasAccess = !isComingSoon && canAccess(user?.membership_tier, camera.min_tier);
                  
                  return (
                    <button
                      key={camera._id}
                      onClick={() => hasAccess && onSelectCamera(camera)}
                      disabled={!hasAccess || isComingSoon}
                      className={`group relative rounded-xl overflow-hidden bg-zinc-900 text-left transition-all ${hasAccess ? 'hover:scale-[1.02]' : ''} ${!hasAccess && !isComingSoon ? 'opacity-70' : ''}`}
                      aria-label={`${camera.name} - ${isComingSoon ? 'Coming soon' : hasAccess ? 'Click to watch' : 'Upgrade required'}`}
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
                        <p className="text-sm text-white/50">{camera.location}</p>
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
                <p className="text-sm text-white/50 mb-2">{host.location}</p>
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
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <img src="https://railstream.net/images/Homepage/WebsiteLogo.png" alt="" className="h-8" />
            Sign In
          </DialogTitle>
          <DialogDescription className="text-white/70">Access your RailStream account</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-white/30" required aria-label="Username" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-white/30" required aria-label="Password" />
          <Button type="submit" className="w-full h-12 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
        
        <p className="text-center text-white/50 text-sm mt-4">
          New to RailStream? <a href="https://railstream.net/member/signup" target="_blank" className="text-[#ff7a00] hover:underline font-medium">Join Today</a>
        </p>
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
  
  const [viewMode, setViewMode] = useState('single');
  const [selectedCameras, setSelectedCameras] = useState([null, null, null, null, null, null, null, null, null]);
  const [playbackStates, setPlaybackStates] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const catalog = await clientApi.getCatalog();
        if (Array.isArray(catalog)) setCameras(catalog);
        const savedUser = auth.getUser();
        if (savedUser) setUser(savedUser);
        setFavorites(storage.getFavorites());
        setPresets(storage.getPresets());
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
    const newCameras = [...selectedCameras];
    newCameras[slotIndex] = camera;
    setSelectedCameras(newCameras);
    setPlaybackStates(prev => ({ ...prev, [slotIndex]: { loading: true, data: null, error: null } }));
    try {
      const data = await clientApi.authorizePlayback(camera._id);
      if (data.ok && data.hls_url) {
        setPlaybackStates(prev => ({ ...prev, [slotIndex]: { loading: false, data, error: null } }));
      } else {
        setPlaybackStates(prev => ({ ...prev, [slotIndex]: { loading: false, data: null, error: data.detail || 'Unable to load' } }));
      }
    } catch {
      setPlaybackStates(prev => ({ ...prev, [slotIndex]: { loading: false, data: null, error: 'Connection error' } }));
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
          <img src="https://railstream.net/images/Homepage/WebsiteLogo.png" alt="RailStream" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-white/50">Loading...</p>
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
            loadCamera={loadCamera}
            favorites={favorites}
            setFavorites={setFavorites}
            presets={presets}
            setPresets={setPresets}
          />
        )}

        {currentPage === 'cameras' && <CamerasPage cameras={cameras} user={user} onSelectCamera={handleSelectCameraFromPage} />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'hosts' && <HostsPage />}
        {currentPage === 'faq' && <FAQPage />}
      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={setUser} />
    </div>
  );
}
