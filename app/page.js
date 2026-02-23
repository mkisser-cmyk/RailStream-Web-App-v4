'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  Info,
  Radio,
} from 'lucide-react';
import { clientApi } from '@/lib/api';
import { auth } from '@/lib/auth';

// Simple tier check
const canAccessCamera = (userTier, cameraTier) => {
  if (cameraTier === 'fireman') return true;
  const levels = { fireman: 1, conductor: 2, engineer: 3 };
  return (levels[userTier] || 0) >= (levels[cameraTier] || 0);
};

// Navigation
function Nav({ user, onLogin, onLogout, currentPage, setCurrentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'watch', label: 'Watch' },
    { id: 'cameras', label: 'Cameras' },
    { id: 'about', label: 'About' },
    { id: 'hosts', label: 'Hosts' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={() => setCurrentPage('watch')}
          className="flex items-center gap-2"
        >
          <Train className="w-6 h-6 text-[#ff7a00]" />
          <span className="text-xl font-semibold">
            <span className="text-white">Rail</span>
            <span className="text-[#ff7a00]">Stream</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`text-sm font-medium transition ${
                currentPage === item.id ? 'text-[#ff7a00]' : 'text-white/70 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/20">
              <span className="text-sm text-white/70">{user.username}</span>
              <Badge className="bg-[#ff7a00] text-white text-xs capitalize">
                {user.membership_tier}
              </Badge>
              <button onClick={onLogout} className="text-white/50 hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button 
              onClick={onLogin}
              size="sm"
              className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white"
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/10 px-4 py-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setMobileOpen(false); }}
              className={`block w-full text-left py-3 text-sm font-medium ${
                currentPage === item.id ? 'text-[#ff7a00]' : 'text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-white/10 mt-4">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{user.username} ({user.membership_tier})</span>
                <button onClick={onLogout} className="text-[#ff7a00] text-sm">Sign Out</button>
              </div>
            ) : (
              <Button onClick={() => { onLogin(); setMobileOpen(false); }} className="w-full bg-[#ff7a00]">
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Watch Page - Full screen video focus
function WatchPage({ cameras, user, onSelectCamera, selectedCamera, playbackData, playbackLoading, playbackError }) {
  const featured = selectedCamera || cameras.find(c => c.status === 'online') || cameras[0];
  const canWatch = featured && canAccessCamera(user?.membership_tier, featured.min_tier);

  return (
    <div className="min-h-screen pt-16 bg-black">
      {/* Main Video Area */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 64px - 120px)' }}>
        {playbackLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#ff7a00] animate-spin mx-auto mb-4" />
              <p className="text-white/60">Connecting to stream...</p>
            </div>
          </div>
        ) : playbackError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center max-w-md px-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Stream Unavailable</h3>
              <p className="text-white/50">{playbackError}</p>
            </div>
          </div>
        ) : playbackData?.hls_url ? (
          <video
            key={playbackData.hls_url}
            className="w-full h-full object-contain bg-black"
            controls
            autoPlay
            playsInline
          >
            <source src={playbackData.hls_url} type="application/x-mpegURL" />
          </video>
        ) : featured ? (
          <div className="absolute inset-0">
            <img
              src={featured.thumbnail_path}
              alt={featured.name}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {canWatch ? (
                <button
                  onClick={() => onSelectCamera(featured)}
                  className="group flex flex-col items-center"
                >
                  <div className="w-24 h-24 rounded-full bg-[#ff7a00] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-12 h-12 text-white ml-2" fill="white" />
                  </div>
                  <span className="mt-4 text-white text-lg font-medium">Watch Live</span>
                </button>
              ) : (
                <div className="text-center">
                  <Lock className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">Requires {featured.min_tier_label} membership</p>
                  <Button className="bg-[#ff7a00] hover:bg-[#ff8c20]">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
          </div>
        )}
      </div>

      {/* Camera Info Bar */}
      {featured && (
        <div className="bg-zinc-900 border-t border-white/10 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-white">{featured.name}</h1>
                {featured.status === 'online' && (
                  <Badge className="bg-red-600 text-white text-xs">
                    <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse" />
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="text-white/50 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {featured.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {featured.radio_code && (
                <Badge variant="outline" className="border-white/20 text-white/60">
                  <Radio className="w-3 h-3 mr-1" />
                  Radio
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Camera Selector */}
      <div className="bg-black px-4 py-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {cameras.filter(c => c.status === 'online').slice(0, 12).map(camera => (
              <button
                key={camera._id}
                onClick={() => onSelectCamera(camera)}
                className={`flex-shrink-0 relative rounded overflow-hidden transition ${
                  featured?._id === camera._id ? 'ring-2 ring-[#ff7a00]' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={camera.thumbnail_path}
                  alt={camera.name}
                  className="w-32 h-20 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-1 left-2 right-2 text-xs text-white truncate">
                  {camera.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cameras Page - Clean grid
function CamerasPage({ cameras, user, onSelectCamera }) {
  const [search, setSearch] = useState('');
  
  const filtered = cameras.filter(c => 
    !search || 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white">All Cameras</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <p className="text-white/40 text-sm mb-6">{filtered.length} cameras</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(camera => {
            const canWatch = canAccessCamera(user?.membership_tier, camera.min_tier);
            return (
              <button
                key={camera._id}
                onClick={() => onSelectCamera(camera)}
                className="group relative rounded-lg overflow-hidden bg-zinc-900 text-left"
              >
                <div className="aspect-video relative">
                  <img
                    src={camera.thumbnail_path}
                    alt={camera.name}
                    className="w-full h-full object-cover"
                  />
                  {!canWatch && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white/60" />
                    </div>
                  )}
                  {camera.status === 'online' && (
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">
                      LIVE
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-white truncate">{camera.name}</h3>
                  <p className="text-sm text-white/50 truncate">{camera.location}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// About Page
function AboutPage() {
  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold text-white mb-8">About Us</h1>
        
        <div className="prose prose-invert prose-zinc max-w-none">
          <div className="bg-zinc-900 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Our Story</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Railstream began with a shared passion for trains, technology, and connection. What started as a small hobby project has evolved into one of the leading live-streaming platforms for railfans around the world.
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              Today, we're proud to provide high-quality live feeds from rail lines and stations across the country — giving our community a front-row seat to the action, no matter where they are.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Two People On a Mission</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We aim to create the most immersive and reliable rail-viewing experience online. Whether you're a lifelong railfan or just discovering the joy of trains, Railstream brings you closer to the tracks than ever before.
            </p>
            <p className="text-white/70 leading-relaxed">
              Our team is dedicated to quality, innovation, and community — always striving to make Railstream better for everyone who loves the rails.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">With the Help of Friends</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We're blessed to work with an incredible network of partners, organizations, and generous families who help make our camera locations possible. Many of our most beloved views exist thanks to railfans who've opened their backyards, businesses, and properties so we can bring you the next best thing to railfanning trackside.
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              A Special Thanks to: Mark, Kevin, Lloyd, Ron, Tom, Thomas, Justin, and Warren — your support and guidance have made a meaningful difference.
            </p>
            <p className="text-[#ff7a00] font-medium">— Mike & Andrea</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-[#ff7a00]">46</div>
              <div className="text-sm text-white/50">Live Cameras</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-[#ff7a00]">19</div>
              <div className="text-sm text-white/50">Railroads</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-[#ff7a00]">2M+</div>
              <div className="text-sm text-white/50">Hours Watched/Mo</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="text-3xl font-bold text-[#ff7a00]">175</div>
              <div className="text-sm text-white/50">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hosts Page
function HostsPage() {
  const hosts = [
    { name: "Bim's Package", location: "Atlanta, Georgia", url: "https://bimsliquor.com/" },
    { name: "Boyce Railway Depot Foundation", location: "Boyce, Virginia", url: "https://boycedepot.com/" },
    { name: "Riley's Railhouse", location: "Chesterton, Indiana", url: "https://www.rileysrailhouse.com/" },
    { name: "Mount Carmel High School", location: "Chicago, Illinois", url: "https://www.mchs.org/" },
    { name: "The Station Inn", location: "Cresson, Pennsylvania", url: "https://stationinnpa.com/" },
    { name: "Sandy Creek Mining Company", location: "West Newton, Pennsylvania", url: "https://sandycreekmining.com/" },
    { name: "Fullerton Train Museum", location: "Fullerton, California", url: "https://fullertontrainmuseum.org/" },
    { name: "Ludlow Heritage Museum", location: "Ludlow, Kentucky", url: "https://www.ludlowheritagemuseum.com/" },
    { name: "Oregon Depot Museum", location: "Oregon, Illinois", url: "http://oregondepot.com/" },
    { name: "City of Selma", location: "Selma, North Carolina", url: null },
    { name: "The Black Dog Coffee Company", location: "Shenandoah Junction, WV", url: "https://blackdogcoffee.net/" },
    { name: "Roomettes", location: "Belleville, Ontario", url: "https://roometteslighting.com/" },
    { name: "Mad River & NKP Railroad Museum", location: "Bellevue, Ohio", url: "https://madrivermuseum.org/" },
    { name: "Village of Coal City", location: "Coal City, Illinois", url: null },
    { name: "Durand Union Station", location: "Durand, Michigan", url: "https://www.durandstation.org/" },
    { name: "Village of Franklin Park", location: "Franklin Park, Illinois", url: "https://www.villageoffranklinpark.com/" },
    { name: "Whole Cubes", location: "La Grange, Illinois", url: "https://wholecubes.com/" },
    { name: "Copy Cat Printing", location: "Grand Island, Nebraska", url: null },
    { name: "Marion Union Station Assoc.", location: "Marion, Ohio", url: null },
    { name: "Advanced Auto Images", location: "Northwood, Ohio", url: "http://www.advancedautoimages.com/" },
    { name: "Rosenberg Railroad Museum", location: "Rosenberg, Texas", url: "https://www.rosenbergrrmuseum.org/" },
    { name: "City of Saginaw", location: "Saginaw, Texas", url: null },
    { name: "CentrA Mod", location: "Temple, Texas", url: "http://centramodrr.com/" },
    { name: "Waldwick Historical Society", location: "Waldwick, New Jersey", url: "https://www.allaboardwaldwick.org/" },
  ];

  return (
    <div className="min-h-screen pt-16 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold text-white mb-4">Our Hosts</h1>
        <p className="text-white/60 mb-8 max-w-2xl">
          At Railstream, our cameras wouldn't be possible without the support of our incredible hosts. 
          Each location offers a unique rail experience, and we're proud to work alongside organizations 
          that share our passion for trains, history, and community.
        </p>

        <div className="bg-zinc-900 rounded-lg p-6 mb-8">
          <p className="text-white/70 text-sm leading-relaxed">
            A huge thank you also goes out to our community partners and the railfan families 
            (The Behrs, The Tweeds, The Kuiphoffs, The Schillingers, Mr Snyder, Mr Hinsdale, 
            Mr Horner, Mr Southwell, Mr Poll, and Mr Wallace) who have graciously opened their backyards.
          </p>
          <p className="text-[#ff7a00] text-sm mt-3">— Mike & Andrea</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosts.map((host, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-[#ff7a00]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#ff7a00]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-white truncate">{host.name}</h3>
                <p className="text-sm text-white/50">{host.location}</p>
                {host.url && (
                  <a 
                    href={host.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-[#ff7a00] hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-zinc-900 rounded-lg p-6 text-center">
          <h3 className="text-white font-medium mb-2">Want to be a RailStream host?</h3>
          <p className="text-white/50 text-sm mb-4">Have an idea for a new railcam location?</p>
          <a 
            href="mailto:contactus@railstream.net"
            className="inline-flex items-center gap-2 text-[#ff7a00] hover:underline"
          >
            contactus@railstream.net
          </a>
        </div>
      </div>
    </div>
  );
}

// Login Dialog
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
        toast.success(`Welcome, ${data.user.username}!`);
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
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Train className="w-5 h-5 text-[#ff7a00]" />
            Sign In
          </DialogTitle>
          <DialogDescription>
            Access your RailStream account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
            required
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
            required
          />
          
          <Button type="submit" className="w-full bg-[#ff7a00] hover:bg-[#ff8c20]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
        
        <p className="text-center text-sm text-white/40 mt-2">
          Need an account?{' '}
          <a href="https://railstream.net/member/signup" target="_blank" className="text-[#ff7a00] hover:underline">
            Join RailStream
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Main App
export default function App() {
  const [cameras, setCameras] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('watch');
  const [loginOpen, setLoginOpen] = useState(false);
  
  // Playback state
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);

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

  const handleSelectCamera = async (camera) => {
    const canWatch = canAccessCamera(user?.membership_tier, camera.min_tier);
    
    if (!canWatch) {
      toast.error(`This camera requires ${camera.min_tier_label || camera.min_tier} membership`);
      return;
    }

    setSelectedCamera(camera);
    setPlaybackLoading(true);
    setPlaybackError(null);
    setPlaybackData(null);
    setCurrentPage('watch');

    try {
      const data = await clientApi.authorizePlayback(camera._id);
      if (data.ok && data.hls_url) {
        setPlaybackData(data);
      } else {
        setPlaybackError(data.detail || 'Unable to load stream');
      }
    } catch {
      setPlaybackError('Connection error');
    } finally {
      setPlaybackLoading(false);
    }
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
        <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" richColors />
      
      <Nav 
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
          onSelectCamera={handleSelectCamera}
          selectedCamera={selectedCamera}
          playbackData={playbackData}
          playbackLoading={playbackLoading}
          playbackError={playbackError}
        />
      )}

      {currentPage === 'cameras' && (
        <CamerasPage 
          cameras={cameras}
          user={user}
          onSelectCamera={handleSelectCamera}
        />
      )}

      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'hosts' && <HostsPage />}

      <LoginDialog 
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={setUser}
      />
    </div>
  );
}
