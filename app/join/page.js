'use client';
import { Crown, Shield, Zap, Bell, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const tiers = [
  {
    name: 'Fireman',
    icon: Zap,
    price: 'FREE',
    period: '',
    color: 'from-orange-600 to-orange-500',
    border: 'border-orange-500/30',
    features: [
      'Access to select free cameras',
      'Standard definition streaming',
      'Basic DVR (2-hour rewind)',
      'Ad-supported experience',
    ],
  },
  {
    name: 'Conductor',
    icon: Shield,
    price: '$8.95',
    period: '/mo',
    color: 'from-blue-600 to-blue-500',
    border: 'border-blue-500/30',
    popular: true,
    features: [
      'Everything in Fireman, plus:',
      'Conductor-tier camera access',
      'HD streaming quality',
      'Extended DVR (2-hour rewind)',
      'Ad-free experience',
      'Train sighting log',
    ],
  },
  {
    name: 'Engineer',
    icon: Crown,
    price: '$12.95',
    period: '/mo',
    color: 'from-purple-600 to-purple-500',
    border: 'border-purple-500/30',
    features: [
      'Everything in Conductor, plus:',
      'Full access to ALL cameras',
      'Multi-view layouts (up to 16)',
      'Premium HD/4K streaming',
      'Priority support',
      'Save custom camera layouts',
      'Review Ops (archived footage)',
    ],
  },
];

export default function JoinPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to RailStream
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 text-center pt-8 pb-12">
        <div className="inline-flex items-center gap-2 bg-[#ff7a00]/10 border border-[#ff7a00]/30 rounded-full px-4 py-1.5 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7a00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff7a00]"></span>
          </span>
          <span className="text-[#ff7a00] text-sm font-medium">Coming Soon</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
          Join RailStream Premium
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
          We&apos;re building the ultimate railfan streaming platform. Premium memberships are launching soon with exclusive camera access, multi-view layouts, and ad-free streaming.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl bg-zinc-900/80 border ${tier.border} p-6 ${tier.popular ? 'ring-2 ring-blue-500/50 scale-[1.02]' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-white/40">{tier.period}</span>}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle2 className="w-4 h-4 text-[#ff7a00] mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled
                  className="w-full py-2.5 rounded-lg font-semibold text-sm bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notify Section */}
      <div className="max-w-xl mx-auto px-4 pb-20 text-center">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
          <Bell className="w-10 h-10 text-[#ff7a00] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Get Notified When We Launch</h2>
          <p className="text-white/50 text-sm mb-6">
            Be the first to know when premium memberships become available.
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">You&apos;re on the list! We&apos;ll be in touch.</span>
            </div>
          ) : (
            <form onSubmit={handleNotify} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-semibold rounded-lg text-sm transition whitespace-nowrap"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-8 text-white/30 text-xs">
        <p>&copy; 2011-2026 RailStream, LLC. All rights reserved.</p>
      </div>
    </div>
  );
}
