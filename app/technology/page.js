'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

// Stats data
const STATS = [
  { value: '40+', label: 'Camera Sites', sublabel: 'US & Canada' },
  { value: '15-20 TB', label: 'Daily Traffic', sublabel: 'Self-hosted' },
  { value: '~375', label: 'Video Feeds', sublabel: 'Adaptive bitrate' },
  { value: '2-3 Gbps', label: 'Peak Egress', sublabel: 'To viewers worldwide' },
];

// Infrastructure features
const INFRA_FEATURES = [
  {
    icon: 'server',
    title: 'On-Premises Data Center',
    description: 'Every byte of video is processed and delivered from our own hardware. No cloud middlemen. No third-party CDNs. Just raw, uncompromising performance.',
  },
  {
    icon: 'gpu',
    title: '7 NVIDIA Tesla GPUs',
    description: 'Hardware-accelerated H.265 transcoding generates ~375 adaptive bitrate streams from ~40 primary cameras — from 270p to 4K — in real time.',
  },
  {
    icon: 'network',
    title: 'Enterprise UniFi Network',
    description: 'UXG Enterprise gateway, MC-LAG redundant switching, 60 GHz building bridges, and 10 Gb fiber. Built for 24/7 broadcast-grade uptime.',
  },
  {
    icon: 'shield',
    title: 'Redundancy at Every Layer',
    description: 'Dual power supplies, MC-LAG active/active uplinks, 5 GHz failover links, and a self-hosted control plane. The streams never stop.',
  },
];

function FeatureIcon({ type }) {
  switch (type) {
    case 'server':
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
        </svg>
      );
    case 'gpu':
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
        </svg>
      );
    case 'network':
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TechnologyPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader currentPage="technology" />

      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://cdn.casestudies.svc.ui.com/Rail_Stream_Thumb_c7813f707a.jpg"
            alt="RailStream infrastructure"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
            <span className="text-[#ff7a00] text-sm font-semibold tracking-wide uppercase">Self-Hosted Since 2011</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] tracking-tight">
            Built by Railfans,
            <br />
            <span className="text-[#ff7a00]">for Railfans.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            We don't rent servers. We don't rely on YouTube. Mike & Andrea built a broadcast-grade streaming network from the ground up — and we move
            <span className="text-white font-semibold"> 15–20 terabytes of video every single day</span> from our own data center.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/?page=watch"
              className="px-8 py-4 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Start Watching
            </Link>
            <a
              href="https://casestudies.ui.com/case-study/railstream"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold text-lg rounded-xl transition-all hover:bg-white/5 flex items-center gap-2"
            >
              Read the UniFi Case Study
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative z-10 -mt-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className={`p-6 md:p-8 text-center ${i < STATS.length - 1 ? 'border-r border-white/5' : ''} ${i < 2 ? 'border-b md:border-b-0 border-white/5' : ''}`}
              >
                <div className="text-3xl md:text-4xl font-black text-[#ff7a00] mb-1">{stat.value}</div>
                <div className="text-white/90 font-semibold text-sm">{stat.label}</div>
                <div className="text-white/40 text-xs mt-0.5">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── "No YouTube. No CDN." Section ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                No YouTube.<br />
                No CDN.<br />
                <span className="text-[#ff7a00]">Just Us.</span>
              </h2>
              <p className="text-lg text-white/60 mb-6 leading-relaxed">
                While others embed webcams and call it a day, we engineered a complete broadcast infrastructure. Every camera feed is ingested via SRT, transcoded through our GPU farm, and delivered directly to you — from hardware we own, in a data center we operate.
              </p>
              <blockquote className="border-l-4 border-[#ff7a00] pl-5 py-2">
                <p className="text-white/80 text-lg italic">
                  "I love that we don't need YouTube or a CDN. We move 15–20 terabytes of video traffic every single day — out of the house."
                </p>
                <cite className="text-[#ff7a00] text-sm font-semibold mt-2 block not-italic">— Michael Kisser, Co-Founder</cite>
              </blockquote>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
              <img
                src="https://cdn.casestudies.svc.ui.com/Rail_Stream_01_410f6fbf7b.jpg"
                alt="RailStream self-hosted data center with server racks and networking equipment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white/90 text-xs font-medium rounded-lg">
                  RailStream Data Center — Self-Hosted Infrastructure
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Infrastructure Grid ── */}
      <section className="py-24 md:py-32 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Broadcast-Grade Infrastructure</h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              We move more data than many small broadcasters. Here's what powers every frame.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {INFRA_FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-[#ff7a00]/20 transition-all duration-300 hover:bg-[#0d0d0d]"
              >
                <div className="w-14 h-14 rounded-xl bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center text-[#ff7a00] mb-5 group-hover:bg-[#ff7a00]/15 transition-colors">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audio Excellence ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group order-2 md:order-1">
              <img
                src="https://cdn.casestudies.svc.ui.com/Rail_Stream_04_7337979ad9.jpg"
                alt="60 GHz wireless link hardware at a RailStream camera site"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white/90 text-xs font-medium rounded-lg">
                  60 GHz Wireless Link — Camera Site Hardware
                </span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                Sound So Real,
                <br />
                <span className="text-[#ff7a00]">Neighbors Ask Where the Tracks Are.</span>
              </h2>
              <p className="text-lg text-white/60 mb-6 leading-relaxed">
                Our differentiator isn't just video — it's fidelity. Many locations feature multi-microphone arrays with professional DSP processing that renders true positional audio. You don't just watch the trains. You <em>hear</em> them approach, rumble past, and fade away.
              </p>
              <ul className="space-y-3">
                {[
                  'Multi-mic arrays with DSP processing',
                  'True positional audio — hear the train move',
                  'Broadcast-grade 4K video at every site',
                  '7-day DVR — rewind and replay any moment',
                  'Multi-view: watch up to 16 cameras at once',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70">
                    <svg className="w-5 h-5 text-[#ff7a00] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Network Photos Strip ── */}
      <section className="py-16 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { src: 'https://cdn.casestudies.svc.ui.com/Rail_Stream_02_f4fa76eb33.jpg', caption: 'Camera Site Engineering' },
              { src: 'https://cdn.casestudies.svc.ui.com/Rail_Stream_03_b82f174efc.jpg', caption: 'Enterprise Networking Equipment' },
              { src: 'https://cdn.casestudies.svc.ui.com/Rail_Stream_05_a959309fca.jpg', caption: 'Scalable Camera Management' },
            ].map((img, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-[16/10] group">
                <img
                  src={img.src}
                  alt={img.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-white/90 text-sm font-medium">{img.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI & Innovation ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Not Just Cameras.
              <span className="text-[#ff7a00]"> Intelligence.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              With the network foundation in place, we're layering AI analytics on our GPU farm.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Train Classification',
                description: 'Real-time AI identifies train types — Amtrak, freight, Brightline — and sends instant alerts to viewers.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                ),
              },
              {
                title: 'Acoustic Detection',
                description: 'Sound-based event detection has already helped rail police respond to theft attempts near monitored yards.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                ),
              },
              {
                title: 'Instant Replay Alerts',
                description: 'PWA notifications jump viewers to the exact moment of action — never miss a consist you want to see.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-[#ff7a00]/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center text-[#ff7a00] mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scale Comparison ── */}
      <section className="py-24 md:py-32 bg-[#050505]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Everyone Else Is a
            <span className="text-[#ff7a00]"> Distant Second.</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-12">
            We're not a hobby project with a webcam taped to a window.
            This is a professional broadcast network that happens to point at train tracks.
          </p>

          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 md:p-5 text-white/40 text-sm font-semibold">Feature</th>
                  <th className="p-4 md:p-5 text-center">
                    <span className="text-[#ff7a00] font-bold">RailStream</span>
                  </th>
                  <th className="p-4 md:p-5 text-center text-white/30 font-medium">Others</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Video Quality', 'Up to 4K HDR', '720p webcam'],
                  ['Audio', 'Multi-mic positional DSP', 'Built-in mic (if any)'],
                  ['DVR / Rewind', '7-day full archive', 'Live only'],
                  ['Infrastructure', 'Self-hosted data center', 'YouTube embed'],
                  ['Daily Traffic', '15-20 TB', 'N/A'],
                  ['Multi-view', 'Up to 16 simultaneous', 'Single camera'],
                  ['Transcoding', '7x NVIDIA Tesla GPUs', 'None'],
                  ['Uptime SLA', '24/7 MC-LAG redundancy', 'Best effort'],
                ].map(([feature, rs, others], i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 md:p-5 text-white/70 text-sm font-medium">{feature}</td>
                    <td className="p-4 md:p-5 text-center">
                      <span className="text-white font-semibold text-sm">{rs}</span>
                    </td>
                    <td className="p-4 md:p-5 text-center text-white/30 text-sm">{others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── The Founders ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://railstream.net/images/us2.png"
                alt="Mike and Andrea Kisser, Co-Founders of RailStream"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                Meet the
                <span className="text-[#ff7a00]"> Co-Founders</span>
              </h2>
              <p className="text-lg text-white/60 mb-6 leading-relaxed">
                RailStream was built by <span className="text-white font-semibold">Mike Kisser & Andrea Mercatante</span> — a husband-and-wife team who turned a passion for railfanning into a broadcast-grade streaming network. Since 2011, they've grown RailStream from a single camera at the Fostoria Iron Triangle into a 40+ site network serving viewers in 175 countries.
              </p>
              <p className="text-lg text-white/60 mb-8 leading-relaxed">
                Mike architects the technology — the GPU farm, the network, the streaming pipeline. Andrea is the heart and creative force behind the brand, the community, and the experience that keeps viewers coming back.
              </p>
              <blockquote className="border-l-4 border-[#ff7a00] pl-5 py-2">
                <p className="text-white/80 text-lg italic">
                  "We move more data than many small broadcasters, and UniFi just does the job. It's the resilient, single-pane-of-glass backbone we needed to keep growing."
                </p>
                <cite className="text-[#ff7a00] text-sm font-semibold mt-2 block not-italic">— Mike Kisser, Co-Founder</cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roku Install Count ── */}
      <section className="py-20 bg-[#050505] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-6xl md:text-8xl font-black text-[#ff7a00] mb-4">250,000+</div>
          <div className="text-xl md:text-2xl text-white/60 font-medium">Roku App Installs</div>
          <p className="text-white/40 mt-3 max-w-lg mx-auto">
            Available on Roku, web, iOS, and Android. Memberships start at $12.95/month.
          </p>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to See the
            <span className="text-[#ff7a00]"> Difference?</span>
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
            Join thousands of railfans who chose the premium experience.
            Start watching in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/?page=watch"
              className="px-8 py-4 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Start Watching
            </Link>
            <Link
              href="/cameras"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold text-lg rounded-xl transition-all hover:bg-white/5"
            >
              Browse All Cameras
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://railstream.net/images/Homepage/WebsiteLogo.png"
              alt="RailStream"
              className="h-8 opacity-60"
            />
            <span className="text-white/30 text-sm">© 2011–{new Date().getFullYear()} RailStream. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://casestudies.ui.com/case-study/railstream" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-[#ff7a00] text-sm transition-colors">
              UniFi Case Study
            </a>
            <Link href="/?page=about" className="text-white/30 hover:text-[#ff7a00] text-sm transition-colors">
              Our Story
            </Link>
            <Link href="/host" className="text-white/30 hover:text-[#ff7a00] text-sm transition-colors">
              Host a Camera
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
