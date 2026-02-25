'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Train, Calendar, Users, Heart, Star, Trophy, Camera, 
  ChevronDown, Play, Volume2, VolumeX, Award, Sparkles,
  MapPin, Clock, Radio, Zap
} from 'lucide-react';

// Timeline milestones
const MILESTONES = [
  { year: 2010, title: "The Beginning", description: "RailStream launches with a single camera in Fostoria, Ohio. Mike Kissell's vision of bringing the railfan community together online begins." },
  { year: 2011, title: "Growing Community", description: "First 1,000 members join. The community grows as word spreads among railfans worldwide." },
  { year: 2012, title: "Multi-Camera Expansion", description: "Network expands to 5 locations. Chicago and Chesterton cameras go live." },
  { year: 2013, title: "DVR Features Launch", description: "Review Ops debuts, allowing members to go back in time and never miss a train." },
  { year: 2014, title: "Mobile Access", description: "RailStream goes mobile, bringing live trains to phones and tablets everywhere." },
  { year: 2015, title: "Community Milestones", description: "10,000 active members. First RailStream meetup events organized." },
  { year: 2016, title: "HD Upgrade", description: "All cameras upgraded to 1080p HD. Crystal clear train watching arrives." },
  { year: 2017, title: "Scanner Integration", description: "Railroad radio scanners integrated into streams. Hear the action as it happens." },
  { year: 2018, title: "Andrea Joins", description: "Andrea brings her creative vision, transforming the site's look and feel." },
  { year: 2019, title: "25 Cameras Strong", description: "Network reaches 25 locations across the United States." },
  { year: 2020, title: "Pandemic Connection", description: "During lockdowns, RailStream becomes a vital connection to the outside world for thousands." },
  { year: 2021, title: "PTZ Cameras", description: "First pan-tilt-zoom cameras deployed, letting operators track trains in real-time." },
  { year: 2022, title: "Audio Options", description: "Multiple audio track selection launches - railroad radio, ambient, or silent viewing." },
  { year: 2023, title: "40+ Locations", description: "Network expands to over 40 camera locations nationwide." },
  { year: 2024, title: "Next Generation", description: "Planning begins for the next-generation RailStream platform." },
  { year: 2025, title: "15 Years Strong", description: "Celebrating 15 years of connecting railfans worldwide. The journey continues!" },
];

// Key contributors
const CONTRIBUTORS = [
  {
    name: "Mike Kissell",
    role: "Founder & Visionary",
    description: "The man who started it all. Mike's passion for trains and technology created RailStream from nothing but a dream and a webcam.",
    highlight: "15 years of dedication"
  },
  {
    name: "Andrea",
    role: "Creative Director & Co-Founder",
    description: "Andrea transformed RailStream's visual identity, bringing warmth and professionalism to every pixel. Her eye for design makes the site feel like home. The other half of RailStream!",
    highlight: "Heart & Soul of RailStream"
  },
  {
    name: "Camera Hosts",
    role: "The Backbone",
    description: "Dozens of generous hosts across America who share their views with our community. Without them, there would be no RailStream.",
    highlight: "40+ locations nationwide"
  },
  {
    name: "Our Members",
    role: "The Community",
    description: "Thousands of railfans from around the world who make this community special. Your enthusiasm keeps us running.",
    highlight: "Global family of railfans"
  }
];

// Stats
const STATS = [
  { number: "15", label: "Years Online", icon: Calendar },
  { number: "45+", label: "Live Cameras", icon: Camera },
  { number: "10K+", label: "Community Members", icon: Users },
  { number: "24/7", label: "Live Coverage", icon: Clock },
  { number: "7", label: "Days DVR Archive", icon: Radio },
  { number: "∞", label: "Trains Captured", icon: Train },
];

export default function CelebrationPage() {
  const [activeYear, setActiveYear] = useState(2025);
  const [isVisible, setIsVisible] = useState({});
  const timelineRef = useRef(null);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-black to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
          
          {/* Animated train tracks pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, #ff7a00 50px, #ff7a00 52px)`,
              backgroundSize: '104px 100%'
            }} />
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-orange-500/50 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Anniversary Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 mb-8 animate-pulse">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-semibold tracking-wide">March 2011 - March 2026</span>
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-400 bg-clip-text text-transparent">
              15 YEARS
            </span>
            <br />
            <span className="text-white">OF RAILSTREAM</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            From a single camera in Fostoria, Ohio to a nationwide network of{' '}
            <span className="text-orange-400 font-semibold">45+ live streams</span>.
            <br />
            Thank you for being part of our journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              <Play className="w-5 h-5" />
              Watch Live Now
            </Link>
            <a
              href="#timeline"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <Clock className="w-5 h-5" />
              Our Journey
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ChevronDown className="w-8 h-8 text-orange-400 mx-auto" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {STATS.map((stat, i) => (
              <div
                key={i}
                id={`stat-${i}`}
                data-animate
                className={`text-center p-6 rounded-2xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 transform transition-all duration-700 ${
                  isVisible[`stat-${i}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <stat.icon className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="timeline" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our <span className="text-orange-400">Journey</span>
            </h2>
            <p className="text-gray-400 text-lg">15 years of connecting railfans worldwide</p>
          </div>

          <div className="relative" ref={timelineRef}>
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-400 to-orange-500" />

            {MILESTONES.map((milestone, i) => (
              <div
                key={milestone.year}
                id={`milestone-${i}`}
                data-animate
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-12 ${
                  i % 2 === 0 ? 'md:flex-row-reverse' : ''
                } transform transition-all duration-700 ${
                  isVisible[`milestone-${i}`] ? 'opacity-100 translate-x-0' : `opacity-0 ${i % 2 === 0 ? 'translate-x-10' : '-translate-x-10'}`
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Year badge */}
                <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-black border-4 border-orange-500 flex items-center justify-center z-10">
                  <span className="text-sm font-bold text-orange-400">{milestone.year}</span>
                </div>

                {/* Content */}
                <div className={`ml-24 md:ml-0 md:w-[calc(50%-4rem)] ${i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:pl-8'}`}>
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-colors">
                    <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                    <p className="text-gray-400">{milestone.description}</p>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-[calc(50%-4rem)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black via-orange-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The <span className="text-orange-400">People</span> Behind RailStream
            </h2>
            <p className="text-gray-400 text-lg">None of this would be possible without...</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {CONTRIBUTORS.map((person, i) => (
              <div
                key={i}
                id={`contributor-${i}`}
                data-animate
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-8 transform transition-all duration-700 hover:border-orange-500/50 group ${
                  isVisible[`contributor-${i}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      {person.name === "Mike Kissell" && <Trophy className="w-8 h-8 text-white" />}
                      {person.name === "Andrea" && <Heart className="w-8 h-8 text-white" />}
                      {person.name === "Camera Hosts" && <Camera className="w-8 h-8 text-white" />}
                      {person.name === "Our Members" && <Users className="w-8 h-8 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{person.name}</h3>
                      <p className="text-orange-400 font-medium">{person.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">{person.description}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30">
                    <Star className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-300 font-medium">{person.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Thanks to Andrea */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            id="andrea-tribute"
            data-animate
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-500/20 border border-orange-500/30 p-12 text-center transform transition-all duration-1000 ${
              isVisible['andrea-tribute'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-white" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Thank You, <span className="text-orange-400">Andrea</span>! 💕
              </h3>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6">
                For 15 years, Andrea has poured her heart into making RailStream beautiful. 
                Every color, every layout, every detail is touched by her creative spirit. 
                She's the other half of RailStream - and we couldn't do this without her!
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap">
                <span className="px-4 py-2 rounded-full bg-white/10 text-sm">Designer</span>
                <span className="px-4 py-2 rounded-full bg-white/10 text-sm">Visionary</span>
                <span className="px-4 py-2 rounded-full bg-white/10 text-sm">Co-Founder</span>
                <span className="px-4 py-2 rounded-full bg-white/10 text-sm">The Other Half</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-t from-orange-950/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Here's to the Next <span className="text-orange-400">15 Years</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join us as we continue to connect railfans around the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              <Train className="w-5 h-5" />
              Start Watching
            </Link>
            <Link
              href="/host"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <Camera className="w-5 h-5" />
              Host a Camera
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2010-2025 RailStream. 15 years of connecting railfans worldwide.</p>
        </div>
      </footer>
    </main>
  );
}
