'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Crown, Shield, Zap, LogOut, ChevronDown } from 'lucide-react';

const TIERS = {
  fireman: { label: 'Fireman', color: 'from-orange-600 to-orange-500', icon: Zap },
  conductor: { label: 'Conductor', color: 'from-blue-600 to-blue-500', icon: Shield },
  engineer: { label: 'Engineer', color: 'from-purple-600 to-purple-500', icon: Crown },
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'watch', label: 'Watch', href: '/?page=watch' },
  { id: 'cameras', label: 'Cameras', href: '/cameras' },
  { id: 'sightings', label: 'Train Log', href: '/sightings' },
  { id: 'roundhouse', label: 'The Roundhouse', href: '/roundhouse' },
];

const ABOUT_DROPDOWN = [
  { id: 'features', label: 'Features', href: '/features', description: 'Everything our player can do', badge: 'NEW' },
  { id: 'pricing', label: 'Pricing', href: '/pricing', description: 'Plans & subscription options' },
  { id: 'about', label: 'Our Story', href: '/?page=about', description: 'The RailStream journey' },
  { id: 'technology', label: 'Our Technology', href: '/technology', description: 'Self-hosted infrastructure' },
  { id: 'host', label: 'Host a Camera', href: '/host', description: 'Partner with us' },
  { id: '15years', label: '15 Year Anniversary', href: '/15years', description: 'Celebrating since 2011', emoji: '🎉' },
  { id: 'status', label: 'Network Status', href: '/network-status', description: 'Live system health' },
  { id: 'contact', label: 'Contact Us', href: '/contact', description: 'Get in touch' },
];

export default function SiteHeader({ currentPage = '', user: userProp = null, onLogin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [autoUser, setAutoUser] = useState(null);
  const aboutRef = useRef(null);
  const aboutTimeoutRef = useRef(null);

  // Auto-detect logged-in user if no user prop is passed
  useEffect(() => {
    if (userProp) return;
    try {
      // Try localStorage first (instant)
      const savedUser = localStorage.getItem('railstream_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.username) setAutoUser(parsed);
      }
      // Then verify/refresh from API
      const token = localStorage.getItem('railstream_token');
      if (token) {
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && (data.username || data.name)) setAutoUser(data);
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, [userProp]);

  const user = userProp || autoUser;

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

  const activePage = currentPage || (typeof window !== 'undefined' ? window.location.pathname.replace('/', '') || 'home' : 'home');

  const handleAboutEnter = () => {
    if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
    setAboutOpen(true);
  };

  const handleAboutLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => setAboutOpen(false), 200);
  };

  // Check if any about dropdown item is active
  const isAboutActive = ABOUT_DROPDOWN.some(item => 
    activePage === item.id || 
    (item.id === 'status' && activePage === 'network-status') ||
    (item.id === '15years' && activePage === '15years') ||
    (item.id === 'host' && activePage === 'host') ||
    (item.id === 'technology' && activePage === 'technology')
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="https://railstream.net/images/Homepage/WebsiteLogo.png"
            alt="RailStream Logo"
            className="h-10"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id || 
              (item.id === 'cameras' && activePage === 'cameras') ||
              (item.id === 'sightings' && activePage === 'sightings');

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#ff7a00] text-white'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

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

            {/* Dropdown Panel */}
            {aboutOpen && (
              <div 
                className="absolute top-full right-0 mt-2 w-72 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-y-auto max-h-[calc(100vh-80px)]"
                onMouseEnter={handleAboutEnter}
                onMouseLeave={handleAboutLeave}
              >
                <div className="p-1.5">
                  {ABOUT_DROPDOWN.map((item) => {
                    const isActive = activePage === item.id ||
                      (item.id === 'status' && activePage === 'network-status') ||
                      (item.id === '15years' && activePage === '15years') ||
                      (item.id === 'host' && activePage === 'host') ||
                      (item.id === 'technology' && activePage === 'technology');

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setAboutOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
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
                        <svg className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
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
              <span className={`hidden sm:flex px-3 py-1.5 rounded-full bg-gradient-to-r ${TIERS[user.membership_tier]?.color || 'from-gray-500 to-gray-600'} text-white text-xs font-bold items-center gap-1.5`}>
                {user.is_admin && <Crown className="w-3 h-3" />}
                {!user.is_admin && user.membership_tier === 'engineer' && <Crown className="w-3 h-3" />}
                {!user.is_admin && user.membership_tier === 'conductor' && <Shield className="w-3 h-3" />}
                {!user.is_admin && user.membership_tier === 'fireman' && <Zap className="w-3 h-3" />}
                {user.is_admin ? 'Admin' : (TIERS[user.membership_tier]?.label || user.membership_tier)}
              </span>
              <span className="text-white text-sm hidden sm:block">{user.username}</span>
              {onLogout && (
                <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/10 text-white transition" aria-label="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onLogin ? (
              <button onClick={onLogin} className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                Sign In
              </button>
            ) : (
              <Link href="/?page=login" className="bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                Sign In
              </Link>
            )
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/10 p-4 max-h-[80vh] overflow-y-auto">
          {/* Primary nav items */}
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg text-white font-medium mb-1 ${
                activePage === item.id ? 'bg-[#ff7a00]' : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* About section divider */}
          <div className="border-t border-white/10 my-3 mx-4" />
          <p className="px-4 py-1 text-xs font-bold text-white/40 uppercase tracking-wider">About RailStream</p>

          {ABOUT_DROPDOWN.map(item => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg text-white font-medium mb-1 ${
                activePage === item.id || (item.id === 'status' && activePage === 'network-status')
                  ? 'bg-[#ff7a00]' 
                  : 'hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.emoji && <span>{item.emoji}</span>}
                {item.label}
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-[#ff7a00] text-white text-[10px] font-bold rounded-full">{item.badge}</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
