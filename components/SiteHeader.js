'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Crown, Shield, Zap, LogOut } from 'lucide-react';

const TIERS = {
  fireman: { label: 'Fireman', color: 'from-blue-500 to-blue-600', icon: Zap },
  conductor: { label: 'Conductor', color: 'from-purple-500 to-purple-600', icon: Shield },
  engineer: { label: 'Engineer', color: 'from-orange-500 to-orange-600', icon: Crown },
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: '15years', label: '🎉 15 Years', href: '/15years', special: true },
  { id: 'watch', label: 'Watch', href: '/?page=watch' },
  { id: 'cameras', label: 'Cameras', href: '/cameras' },
  { id: 'sightings', label: 'Train Log', href: '/sightings' },
  { id: 'status', label: 'Status', href: '/network-status' },
  { id: 'host', label: 'Host', href: '/host' },
  { id: 'about', label: 'About', href: '/?page=about' },
];

export default function SiteHeader({ currentPage = '', user = null, onLogin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // For standalone pages, determine active from href
  const activePage = currentPage || (typeof window !== 'undefined' ? window.location.pathname.replace('/', '') || 'home' : 'home');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
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
              (item.id === '15years' && activePage === '15years') ||
              (item.id === 'host' && activePage === 'host') ||
              (item.id === 'status' && activePage === 'network-status') ||
              (item.id === 'sightings' && activePage === 'sightings');

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  item.special
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600'
                    : isActive
                      ? 'bg-[#ff7a00] text-white'
                      : 'text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`hidden sm:flex px-3 py-1.5 rounded-full bg-gradient-to-r ${TIERS[user.membership_tier]?.color || 'from-gray-500 to-gray-600'} text-white text-xs font-bold items-center gap-1.5`}>
                {user.membership_tier === 'engineer' && <Crown className="w-3 h-3" />}
                {user.membership_tier === 'conductor' && <Shield className="w-3 h-3" />}
                {user.membership_tier === 'fireman' && <Zap className="w-3 h-3" />}
                {TIERS[user.membership_tier]?.label || user.membership_tier}
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
        <div className="md:hidden bg-black/95 border-b border-white/10 p-4">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg text-white font-medium mb-1 ${
                item.special
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                  : activePage === item.id ? 'bg-[#ff7a00]' : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
