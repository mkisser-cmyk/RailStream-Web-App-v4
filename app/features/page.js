'use client';

import Link from 'next/link';
import { 
  Play, Rewind, FastForward, Clock, Grid3X3, Mic, Camera, 
  Bookmark, MessageSquare, Maximize, Monitor, PenLine, 
  History, Layout, ChevronRight, Sparkles, Volume2,
  Search, Download, Eye, Tv, Smartphone, Shield, Zap
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

const FEATURES = [
  {
    id: 'dvr',
    icon: History,
    title: 'DVR & Time Travel',
    subtitle: 'Never miss a moment',
    description: 'Rewind up to 2 hours on any camera. Scrub through the timeline with thumbnail previews to find the exact moment you want. Jump back 10 seconds or forward 10 seconds with precision controls.',
    highlights: ['2-hour rewind on all cameras', 'Thumbnail preview on timeline hover', 'Skip forward/back 10 seconds', '7-day full archive for Review Ops'],
    color: '#ff7a00',
  },
  {
    id: 'multiview',
    icon: Grid3X3,
    title: 'Multi-View',
    subtitle: 'Watch up to 16 cameras at once',
    description: 'Monitor multiple locations simultaneously with our flexible multi-view layouts. Choose from single, dual, quad, 9-camera, or 16-camera grid views. Each tile shows live camera info and independent controls.',
    highlights: ['1, 2, 4, 9, or 16 simultaneous cameras', 'Click any tile to expand full-screen', 'Independent audio per camera', 'Resolution auto-adapts per view mode'],
    color: '#3b82f6',
  },
  {
    id: 'audio',
    icon: Volume2,
    title: 'Multi-Track Audio',
    subtitle: 'Hear the trains move',
    description: 'Many of our locations feature multi-microphone arrays with professional DSP processing. Switch between audio tracks to hear different perspectives — trackside mics, ambient sound, or scanner feeds.',
    highlights: ['Multiple audio tracks per camera', 'Professional DSP processing', 'Positional audio — hear trains approach and fade', 'One-click track switching'],
    color: '#10b981',
  },
  {
    id: 'snapshot',
    icon: Camera,
    title: 'Snapshot Capture',
    subtitle: 'Capture the perfect shot',
    description: 'Take a high-quality screenshot from any live camera with one click. Photos are automatically watermarked with the RailStream logo and camera name, ready to share with fellow railfans.',
    highlights: ['One-click photo capture', 'Auto-watermarked with camera info', 'Full resolution download', 'Works in live or DVR mode'],
    color: '#8b5cf6',
  },
  {
    id: 'sightings',
    icon: PenLine,
    title: 'Train Logging',
    subtitle: 'Document what you see',
    description: 'Spot something interesting? Log it with our built-in sighting tool. It automatically captures a snapshot and precise timestamp (compensated for stream latency). Add railroad, train details, and notes to build the community train log.',
    highlights: ['Auto-snapshot with sighting', 'Latency-compensated timestamps', 'Railroad & train type tagging', 'Community sighting feed'],
    color: '#f59e0b',
  },
  {
    id: 'review',
    icon: Search,
    title: 'Review Ops',
    subtitle: 'Go back in time',
    description: 'Enter Review Ops mode to access extended playback history. Pick a specific date and time to review past footage. Perfect for catching trains you missed or reviewing interesting moments from the archives.',
    highlights: ['Extended time-travel capability', 'Date/time picker for precise access', 'Full playback controls in review', 'Seamless return to live'],
    color: '#ef4444',
  },
  {
    id: 'layouts',
    icon: Layout,
    title: 'My Layouts',
    subtitle: 'Your perfect setup, saved',
    description: 'Create and save custom multi-camera layouts. Arrange your favorite cameras exactly how you like them and switch between saved presets with one click. Your layouts sync across sessions.',
    highlights: ['Save custom camera arrangements', 'Quick-switch between layouts', 'Name your presets', 'Persistent across sessions'],
    color: '#06b6d4',
  },
  {
    id: 'favorites',
    icon: Bookmark,
    title: 'Favorites',
    subtitle: 'Quick access to your cameras',
    description: 'Bookmark your go-to cameras for instant access. Your favorites appear at the top of the camera picker, so you never have to scroll through the full list to find the views you watch most.',
    highlights: ['One-click bookmarking', 'Favorites pinned to top of list', 'Synced to your account', 'Quick filter view'],
    color: '#ec4899',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Live Chat',
    subtitle: 'Connect with railfans',
    description: 'Chat in real-time with other viewers watching the same cameras. Share sightings, discuss trains, and connect with the railfan community — all without leaving the player.',
    highlights: ['Real-time messaging', 'Camera-specific chat rooms', 'Community of railfans', 'Integrated in the player'],
    color: '#14b8a6',
  },
  {
    id: 'platforms',
    icon: Tv,
    title: 'Watch Everywhere',
    subtitle: 'Any device, any screen',
    description: 'RailStream is available on web, iOS, Android, Apple TV, Roku, and Amazon Fire TV. Your account, favorites, and layouts follow you across all platforms.',
    highlights: ['Web, iOS, Android', 'Apple TV, Roku, Fire TV', 'Responsive design for any screen', 'Account syncs everywhere'],
    color: '#6366f1',
  },
];

export default function FeaturesPage() {
  return (
    <main id="main-content" className="min-h-screen bg-black text-white" role="main">
      <SiteHeader currentPage="features" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff7a00]/5 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff7a00]/10 border border-[#ff7a00]/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-[#ff7a00]" />
            <span className="text-[#ff7a00] text-sm font-semibold">Packed with Features</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            More Than Just a
            <span className="text-[#ff7a00]"> Live Stream.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto mb-10">
            Our custom-built player gives you total control over your viewing experience.
            DVR, multi-view, multi-track audio, train logging, and more — all in your browser.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="px-8 py-3.5 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff7a00]/25"
            >
              Start Watching →
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '45+', label: 'Live Cameras' },
            { value: '2hr', label: 'DVR Rewind' },
            { value: '16x', label: 'Multi-View' },
            { value: '4K', label: 'Up to HDR' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-black text-[#ff7a00]">{stat.value}</p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Everything You Need to
              <span className="text-[#ff7a00]"> Watch Trains.</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Every feature is built from scratch, optimized for live streaming, and designed for railfans.
            </p>
          </div>

          <div className="space-y-8">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              return (
                <div 
                  key={feature.id}
                  className="group relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/10 transition-all duration-300 overflow-hidden"
                >
                  <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 p-8 md:p-10`}>
                    {/* Icon & Visual Side */}
                    <div className="md:w-1/3 flex flex-col items-center justify-center">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
                      >
                        <Icon className="w-10 h-10" style={{ color: feature.color }} />
                      </div>
                      <span 
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: feature.color }}
                      >
                        {feature.subtitle}
                      </span>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-2/3">
                      <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-white/50 leading-relaxed mb-6">{feature.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feature.highlights.map((highlight, hi) => (
                          <div key={hi} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: feature.color }} />
                            <span className="text-white/70 text-sm">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtle accent line */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-px opacity-20"
                    style={{ background: `linear-gradient(to right, transparent, ${feature.color}, transparent)` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Player Quick Reference */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Player
              <span className="text-[#ff7a00]"> Controls</span>
            </h2>
            <p className="text-white/40">Quick reference for all player controls</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {/* Left column - Playback */}
              <div className="p-6 md:p-8">
                <h3 className="text-[#ff7a00] font-bold text-sm uppercase tracking-wider mb-5">Playback Controls</h3>
                <div className="space-y-4">
                  {[
                    { icon: '⏸', label: 'Play / Pause', desc: 'Toggle stream playback' },
                    { icon: '⏪', label: 'Rewind 10s', desc: 'Jump back 10 seconds' },
                    { icon: '⏩', label: 'Forward 10s', desc: 'Jump forward 10 seconds' },
                    { icon: '🔴', label: 'Return to Live', desc: 'Jump back to the live edge' },
                    { icon: '🔊', label: 'Volume', desc: 'Adjust audio level' },
                    { icon: '🎵', label: 'Audio Track', desc: 'Switch microphone feeds' },
                    { icon: '⛶', label: 'Fullscreen', desc: 'Expand to full screen' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{item.icon}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{item.label}</p>
                        <p className="text-white/40 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column - Features */}
              <div className="p-6 md:p-8">
                <h3 className="text-[#ff7a00] font-bold text-sm uppercase tracking-wider mb-5">Tools & Features</h3>
                <div className="space-y-4">
                  {[
                    { icon: '📸', label: 'Snapshot', desc: 'Capture a photo from the stream' },
                    { icon: '✏️', label: 'Log Sighting', desc: 'Record a train with auto-snapshot' },
                    { icon: '🔍', label: 'Review Ops', desc: 'Access extended time-travel' },
                    { icon: '📐', label: 'Timeline Scrub', desc: 'Hover timeline for thumbnail preview' },
                    { icon: '⭐', label: 'Favorites', desc: 'Bookmark cameras to the top' },
                    { icon: '💾', label: 'My Layouts', desc: 'Save multi-view arrangements' },
                    { icon: '💬', label: 'Chat', desc: 'Talk with other viewers' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{item.icon}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{item.label}</p>
                        <p className="text-white/40 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to
            <span className="text-[#ff7a00]"> Watch?</span>
          </h2>
          <p className="text-white/40 mb-8">Start watching live train cameras for free. No account required.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff7a00]/25 text-lg"
          >
            <Play className="w-5 h-5" />
            Start Watching Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-[#ff7a00] font-bold text-xl">RailStream</Link>
          <p className="text-white/30 text-sm">© 2011-2026 RailStream, LLC. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
